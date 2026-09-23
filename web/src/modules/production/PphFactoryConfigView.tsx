'use client';

import { useEffect, useState } from 'react';
import { IconArrowLeft, IconBuildingFactory2, IconDeviceFloppy, IconCheck, IconAlertTriangle } from '@tabler/icons-react';

type Factory = { id: string; name: string };
type Cfg = { factoryId: string; targetPphPct: string; title: string; gddh: string; qlcl: string; th: string };

// Cấu hình HIỂN THỊ cho dashboard "Hiệu suất Nhà máy" — mỗi nhà máy:
//   • Target PPH % — ngưỡng đạt (mặc định 95). Ô/Line >= ngưỡng = xanh, >= 75% = vàng, còn lại đỏ.
//   • Tiêu đề hiển thị — dòng chữ lớn trên đầu màn hình (VD "KẾT QUẢ SẢN XUẤT CLSP_NMKG 1").
//   • GĐĐH / QLCL / TH — tên người phụ trách, hiện ngay dưới tiêu đề.
export default function PphFactoryConfigView({ onBack }: { onBack: () => void }) {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [rows, setRows] = useState<Cfg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [treeRes, cfgRes] = await Promise.all([
        fetch('/api/pph/tree').then((r) => r.json()),
        fetch('/api/pph/factory-config').then((r) => r.json()),
      ]);
      if (!treeRes.success) {
        setError(treeRes.error || 'Không tải được danh sách nhà máy');
        return;
      }
      const facs: Factory[] = (treeRes.data || []).map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }));
      setFactories(facs);
      const byId = new Map<string, Cfg>();
      if (cfgRes.success) {
        for (const c of cfgRes.configs || []) {
          byId.set(c.factoryId, {
            factoryId: c.factoryId,
            targetPphPct: c.targetPphPct == null ? '' : String(c.targetPphPct),
            title: c.title || '',
            gddh: c.gddh || '',
            qlcl: c.qlcl || '',
            th: c.th || '',
          });
        }
      }
      setRows(
        facs.map(
          (f) => byId.get(f.id) || { factoryId: f.id, targetPphPct: '', title: '', gddh: '', qlcl: '', th: '' },
        ),
      );
    } catch {
      setError('Không kết nối được tới hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  function upd(factoryId: string, field: keyof Cfg, value: string) {
    setSaved(false);
    setSaveError(null);
    setRows((prev) => prev.map((r) => (r.factoryId === factoryId ? { ...r, [field]: value } : r)));
  }

  async function handleSave() {
    for (const r of rows) {
      if (r.targetPphPct !== '') {
        const n = Number(r.targetPphPct);
        if (!Number.isFinite(n) || n <= 0 || n > 100) {
          setSaveError(`Target PPH % của "${factories.find((f) => f.id === r.factoryId)?.name}" phải trong khoảng 1–100`);
          return;
        }
      }
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/pph/factory-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs: rows.map((r) => ({
            factoryId: r.factoryId,
            targetPphPct: r.targetPphPct === '' ? null : Number(r.targetPphPct),
            title: r.title.trim(),
            gddh: r.gddh.trim(),
            qlcl: r.qlcl.trim(),
            th: r.th.trim(),
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
            <IconBuildingFactory2 size={20} className="text-[#006838]" /> Hiển Thị Nhà Máy — Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Ngưỡng đạt (Target PPH %), tiêu đề màn hình lớn và tên người phụ trách hiện trên dashboard Hiệu suất.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">⚠️ {error}</div>
      )}

      {loading ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center text-base text-slate-400">Đang tải...</div>
      ) : (
        !error && (
          <div className="space-y-3">
            {rows.map((r) => {
              const name = factories.find((f) => f.id === r.factoryId)?.name || r.factoryId;
              return (
                <div key={r.factoryId} className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4">
                  <p className="mb-3 text-sm font-black text-slate-900">{name}</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-gray-400">Target PPH % (mặc định 95)</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={r.targetPphPct}
                        onChange={(e) => upd(r.factoryId, 'targetPphPct', e.target.value)}
                        placeholder="95"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-[#006838]"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-gray-400">Tiêu đề hiển thị</span>
                      <input
                        value={r.title}
                        onChange={(e) => upd(r.factoryId, 'title', e.target.value)}
                        placeholder={`Kết quả sản xuất — ${name}`}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#006838]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-gray-400">GĐĐH</span>
                      <input value={r.gddh} onChange={(e) => upd(r.factoryId, 'gddh', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#006838]" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-gray-400">QLCL</span>
                      <input value={r.qlcl} onChange={(e) => upd(r.factoryId, 'qlcl', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#006838]" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-gray-400">TH (Trưởng ca)</span>
                      <input value={r.th} onChange={(e) => upd(r.factoryId, 'th', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#006838]" />
                    </label>
                  </div>
                </div>
              );
            })}
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
