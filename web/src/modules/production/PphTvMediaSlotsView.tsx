'use client';

import { useEffect, useState } from 'react';
import {
  IconArrowLeft,
  IconDeviceTv,
  IconPlus,
  IconTrash,
  IconUpload,
  IconDeviceFloppy,
  IconCheck,
  IconAlertTriangle,
  IconPhoto,
  IconVideo,
} from '@tabler/icons-react';
import { uploadCloudinaryFile } from '@/lib/cloudinary';

type LineOption = { id: string; label: string };
type MediaSlot = {
  key: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  startTime: string;
  endTime: string;
  targetLineIds: 'ALL' | string[];
  enabled: boolean;
};

let __seq = 0;
const newKey = () => `slot${Date.now().toString(36)}_${(__seq++).toString(36)}`;

// "Line {Xưởng} {số}" — CỐ Ý viết riêng 1 bản gọn ở đây thay vì import từ ProductionPerformanceModule
// (dù đã có pphLineShortLabel ở đó) để tránh import vòng: file đó tự import PphSettingsView, mà
// PphSettingsView lại render component này — import ngược lại dễ vỡ lúc bundle.
function lineShortLabel(areaName: string, lineName: string): string {
  const num = lineName.match(/(\d+)\s*$/)?.[1];
  return `Line ${areaName}${num ? ` ${num}` : ` ${lineName}`}`;
}

// Chiếu ảnh/video xen kẽ theo khung giờ ở TV cấp Line — mỗi khung giờ: 1 ảnh/video (tải lên
// Cloudinary có sẵn của dự án, KHÔNG cần dịch vụ lưu trữ mới), giờ bắt đầu/kết thúc (lặp lại MỌI
// NGÀY), áp dụng cho "Tất cả Line" hoặc chọn riêng từng Line. Tới đúng khung giờ, PphViewClient.tsx
// tự chuyển màn TV sang chiếu media này thay dashboard, hết giờ tự quay lại — xem effect ở đó.
export default function PphTvMediaSlotsView({ onBack }: { onBack: () => void }) {
  const [lineOptions, setLineOptions] = useState<LineOption[]>([]);
  const [slots, setSlots] = useState<MediaSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [treeRes, lineRes, slotRes] = await Promise.all([
        fetch('/api/pph/tree').then((r) => r.json()),
        fetch('/api/pph/dashboard-lines').then((r) => r.json()),
        fetch('/api/pph/tv-media-slots').then((r) => r.json()),
      ]);
      if (!treeRes.success || !lineRes.success) {
        setError('Không tải được danh sách Line');
        return;
      }
      type TreeFactory = { areas?: { id: string; name: string }[] };
      const areaNameById = new Map<string, string>();
      for (const f of (treeRes.data || []) as TreeFactory[]) {
        for (const a of f.areas || []) areaNameById.set(a.id, a.name);
      }
      const opts: LineOption[] = (lineRes.lines || []).map((l: { id: string; areaId: string; name: string }) => ({
        id: l.id,
        label: lineShortLabel(areaNameById.get(l.areaId) || '', l.name),
      }));
      setLineOptions(opts);
      if (slotRes.success) {
        setSlots(
          (slotRes.slots || []).map(
            (s: { mediaUrl: string; mediaType: 'image' | 'video'; startTime: string; endTime: string; targetLineIds: 'ALL' | string[]; enabled: boolean }) => ({
              key: newKey(),
              mediaUrl: s.mediaUrl,
              mediaType: s.mediaType,
              startTime: s.startTime,
              endTime: s.endTime,
              targetLineIds: s.targetLineIds,
              enabled: s.enabled,
            }),
          ),
        );
      }
    } catch {
      setError('Không kết nối được tới hệ thống');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() là fetch bất đồng bộ, setState chạy sau await
    load();
  }, []);

  function touch() {
    setSaved(false);
    setSaveError(null);
  }
  function addSlot() {
    touch();
    setSlots((prev) => [
      ...prev,
      { key: newKey(), mediaUrl: '', mediaType: 'image', startTime: '12:00', endTime: '12:15', targetLineIds: 'ALL', enabled: true },
    ]);
  }
  function updateSlot(key: string, patch: Partial<MediaSlot>) {
    touch();
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }
  function removeSlot(key: string) {
    touch();
    setSlots((prev) => prev.filter((s) => s.key !== key));
  }
  function toggleLineTarget(key: string, lineId: string) {
    touch();
    setSlots((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        const current = s.targetLineIds === 'ALL' ? [] : s.targetLineIds;
        const next = current.includes(lineId) ? current.filter((id) => id !== lineId) : [...current, lineId];
        return { ...s, targetLineIds: next };
      }),
    );
  }

  async function handleUpload(key: string, file: File) {
    setUploadingKey(key);
    setSaveError(null);
    try {
      const isVideo = file.type.startsWith('video/');
      const { secure_url } = await uploadCloudinaryFile(file, { category: 'pph_tv_media', fileType: isVideo ? 'video' : 'image' });
      updateSlot(key, { mediaUrl: secure_url, mediaType: isVideo ? 'video' : 'image' });
    } catch {
      setSaveError('Không tải được file lên — thử lại.');
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleSave() {
    for (const s of slots) {
      if (!s.mediaUrl) {
        setSaveError('Có khung giờ chưa chọn ảnh/video');
        return;
      }
      if (!s.startTime || !s.endTime) {
        setSaveError('Có khung giờ chưa nhập đủ giờ bắt đầu/kết thúc');
        return;
      }
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/pph/tv-media-slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: slots.map((s) => ({
            mediaUrl: s.mediaUrl,
            mediaType: s.mediaType,
            startTime: s.startTime,
            endTime: s.endTime,
            targetLineIds: s.targetLineIds,
            enabled: s.enabled,
          })),
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setSaveError(result.error || 'Không lưu được');
        return;
      }
      setSaved(true);
    } catch {
      setSaveError('Không kết nối được tới hệ thống');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 my-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center flex-shrink-0"
          title="Quay lại Cài Đặt"
        >
          <IconArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <IconDeviceTv size={20} className="text-[#006838]" /> Chiếu Ảnh/Video Theo Khung Giờ (TV)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tới đúng khung giờ, màn TV cấp Line tự chuyển sang chiếu ảnh/video này thay dashboard — hết giờ tự quay lại. Lặp lại
            mỗi ngày.
          </p>
        </div>
      </div>

      {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">⚠️ {error}</div>}

      {loading ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center text-base text-slate-400">Đang tải...</div>
      ) : (
        !error && (
          <div className="space-y-3">
            {slots.map((s) => (
              <div key={s.key} className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Xem trước + chọn/đổi file */}
                  <label className="relative flex h-20 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-[#006838]">
                    {uploadingKey === s.key ? (
                      <span className="text-[11px] font-bold text-slate-400">Đang tải...</span>
                    ) : s.mediaUrl ? (
                      s.mediaType === 'video' ? (
                        <video src={s.mediaUrl} className="h-full w-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.mediaUrl} alt="" className="h-full w-full object-cover" />
                      )
                    ) : (
                      <span className="flex flex-col items-center gap-1 text-slate-400">
                        <IconUpload size={18} />
                        <span className="text-[10px] font-bold">Chọn ảnh/video</span>
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      disabled={uploadingKey !== null}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(s.key, f);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  <div className="flex flex-1 min-w-[220px] flex-wrap items-center gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                        s.mediaType === 'video' ? 'bg-purple-50 text-purple-700' : 'bg-sky-50 text-sky-700'
                      }`}
                    >
                      {s.mediaType === 'video' ? <IconVideo size={13} /> : <IconPhoto size={13} />}
                      {s.mediaType === 'video' ? 'Video' : 'Ảnh'}
                    </span>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      Từ
                      <input
                        type="time"
                        value={s.startTime}
                        onChange={(e) => updateSlot(s.key, { startTime: e.target.value })}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006838]"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      Đến
                      <input
                        type="time"
                        value={s.endTime}
                        onChange={(e) => updateSlot(s.key, { endTime: e.target.value })}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006838]"
                      />
                    </label>
                    <label className="ml-auto flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <input type="checkbox" checked={s.enabled} onChange={(e) => updateSlot(s.key, { enabled: e.target.checked })} className="h-4 w-4 accent-[#006838]" />
                      Đang bật
                    </label>
                    <button
                      type="button"
                      onClick={() => removeSlot(s.key)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Xoá khung giờ này"
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mr-1">Áp dụng:</span>
                  <button
                    type="button"
                    onClick={() => updateSlot(s.key, { targetLineIds: 'ALL' })}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      s.targetLineIds === 'ALL' ? 'bg-[#006838] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả Line
                  </button>
                  {lineOptions.map((lo) => {
                    const active = s.targetLineIds !== 'ALL' && s.targetLineIds.includes(lo.id);
                    return (
                      <button
                        key={lo.id}
                        type="button"
                        onClick={() => toggleLineTarget(s.key, lo.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                          active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {lo.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addSlot}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border-2 border-dashed border-slate-300 text-xs font-extrabold text-slate-500 hover:border-[#006838] hover:text-[#006838]"
            >
              <IconPlus size={13} /> Thêm khung giờ
            </button>
          </div>
        )
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
          <IconAlertTriangle size={16} /> {saveError}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#006838] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
        >
          <IconDeviceFloppy size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
            <IconCheck size={16} /> Đã lưu
          </span>
        )}
      </div>
    </div>
  );
}
