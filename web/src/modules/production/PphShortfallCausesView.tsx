'use client';

import { useEffect, useState } from 'react';
import {
  IconArrowLeft,
  IconAlertTriangle,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconCheck,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react';

type EditSub = { key: string; name: string };
type EditGroup = { key: string; name: string; subs: EditSub[] };

let __keySeq = 0;
const newKey = () => `k${Date.now().toString(36)}_${(__keySeq++).toString(36)}`;

// "Nhóm nguyên nhân hụt chỉ tiêu" — danh mục 2 cấp (nhóm chính 5M1E › chi tiết) mà nhân viên chọn ở
// trang quét /pph-scan khi sản lượng giờ THẤP HƠN Mục tiêu/giờ. Ô "Khác (nhập tự do)" LUÔN tự có ở
// cuối mọi danh sách (cả cấp 1 lẫn cấp 2) — không cần thêm, không xoá được. Lưu qua PUT ghi đè toàn
// bộ (giống "Ràng buộc thời gian"); pph_entries lưu KÈM TÊN nhóm nên đổi tên/xoá về sau không làm
// hỏng dữ liệu đã nhập.
export default function PphShortfallCausesView({ onBack }: { onBack: () => void }) {
  const [groups, setGroups] = useState<EditGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pph/shortfall-causes').then((r) => r.json());
      if (res.success && Array.isArray(res.groups)) {
        setGroups(
          res.groups.map((g: { name: string; subs: { name: string }[] }) => ({
            key: newKey(),
            name: g.name,
            subs: (g.subs || []).map((s) => ({ key: newKey(), name: s.name })),
          })),
        );
      } else {
        setError(res.error || 'Không tải được danh mục nguyên nhân');
      }
    } catch {
      setError('Không kết nối được tới hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  function touch() {
    setSaved(false);
    setSaveError(null);
  }

  function updateGroupName(key: string, name: string) {
    touch();
    setGroups((prev) => prev.map((g) => (g.key === key ? { ...g, name } : g)));
  }
  function addGroup() {
    touch();
    setGroups((prev) => [...prev, { key: newKey(), name: '', subs: [] }]);
  }
  function deleteGroup(key: string) {
    const g = groups.find((x) => x.key === key);
    if (g && (g.name.trim() || g.subs.length > 0) && !confirm(`Xoá nhóm "${g.name || 'chưa đặt tên'}" và toàn bộ mục con?`)) return;
    touch();
    setGroups((prev) => prev.filter((x) => x.key !== key));
  }
  function moveGroup(key: string, dir: -1 | 1) {
    touch();
    setGroups((prev) => {
      const i = prev.findIndex((x) => x.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function addSub(groupKey: string) {
    touch();
    setGroups((prev) => prev.map((g) => (g.key === groupKey ? { ...g, subs: [...g.subs, { key: newKey(), name: '' }] } : g)));
  }
  function updateSubName(groupKey: string, subKey: string, name: string) {
    touch();
    setGroups((prev) =>
      prev.map((g) => (g.key === groupKey ? { ...g, subs: g.subs.map((s) => (s.key === subKey ? { ...s, name } : s)) } : g)),
    );
  }
  function deleteSub(groupKey: string, subKey: string) {
    touch();
    setGroups((prev) => prev.map((g) => (g.key === groupKey ? { ...g, subs: g.subs.filter((s) => s.key !== subKey) } : g)));
  }
  function moveSub(groupKey: string, subKey: string, dir: -1 | 1) {
    touch();
    setGroups((prev) =>
      prev.map((g) => {
        if (g.key !== groupKey) return g;
        const i = g.subs.findIndex((s) => s.key === subKey);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= g.subs.length) return g;
        const subs = [...g.subs];
        [subs[i], subs[j]] = [subs[j], subs[i]];
        return { ...g, subs };
      }),
    );
  }

  async function handleSave() {
    // Chặn sớm phía FE — server cũng kiểm tra lại y hệt.
    const cleaned = groups.map((g) => ({ name: g.name.trim(), subs: g.subs.map((s) => ({ name: s.name.trim() })) }));
    if (cleaned.length === 0) { setSaveError('Cần ít nhất 1 nhóm nguyên nhân'); return; }
    const seen = new Set<string>();
    for (const g of cleaned) {
      if (!g.name) { setSaveError('Có nhóm chính chưa đặt tên'); return; }
      if (g.name.toLowerCase() === 'khác') { setSaveError('Không cần thêm nhóm "Khác" — hệ thống luôn tự có sẵn'); return; }
      if (seen.has(g.name.toLowerCase())) { setSaveError(`Nhóm chính "${g.name}" bị trùng`); return; }
      seen.add(g.name.toLowerCase());
      const seenSub = new Set<string>();
      for (const s of g.subs) {
        if (!s.name) { setSaveError(`Nhóm "${g.name}" có mục con chưa đặt tên`); return; }
        if (s.name.toLowerCase() === 'khác') { setSaveError(`Nhóm "${g.name}": không cần thêm mục "Khác" — luôn tự có sẵn`); return; }
        if (seenSub.has(s.name.toLowerCase())) { setSaveError(`Nhóm "${g.name}" có mục con "${s.name}" bị trùng`); return; }
        seenSub.add(s.name.toLowerCase());
      }
    }

    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/pph/shortfall-causes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: cleaned }),
      });
      const result = await res.json();
      if (!result.success) {
        setSaveError(result.error || 'Không lưu được');
        return;
      }
      if (Array.isArray(result.groups)) {
        setGroups(
          result.groups.map((g: { name: string; subs: { name: string }[] }) => ({
            key: newKey(),
            name: g.name,
            subs: (g.subs || []).map((s) => ({ key: newKey(), name: s.name })),
          })),
        );
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
            <IconAlertTriangle size={20} className="text-[#006838]" /> Nhóm Nguyên Nhân Hụt Chỉ Tiêu
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Danh sách nhân viên chọn ở trang quét khi sản lượng giờ thấp hơn Mục tiêu/giờ — 2 cấp:{' '}
            <span className="font-bold text-slate-600">nhóm chính (khung 5M1E) › chi tiết</span>. Ô{' '}
            <span className="font-bold text-slate-600">&quot;Khác (nhập tự do)&quot;</span> luôn tự có sẵn ở cuối mọi danh
            sách — không cần thêm.
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
          <div className="space-y-4">
            {groups.map((g, gi) => (
              <div key={g.key} className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-400 w-6 text-center flex-shrink-0">{gi + 1}</span>
                  <input
                    value={g.name}
                    onChange={(e) => updateGroupName(g.key, e.target.value)}
                    placeholder="Tên nhóm chính (VD: Máy móc)"
                    className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-900 focus:outline-none focus:border-[#006838]"
                  />
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button type="button" onClick={() => moveGroup(g.key, -1)} disabled={gi === 0} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center disabled:opacity-30" title="Lên trên">
                      <IconArrowUp size={15} />
                    </button>
                    <button type="button" onClick={() => moveGroup(g.key, 1)} disabled={gi === groups.length - 1} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center disabled:opacity-30" title="Xuống dưới">
                      <IconArrowDown size={15} />
                    </button>
                    <button type="button" onClick={() => deleteGroup(g.key)} className="w-8 h-8 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center" title="Xoá nhóm">
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  {g.subs.map((s, si) => (
                    <div key={s.key} className="flex items-center gap-2 pl-2">
                      <span className="text-slate-300 font-black text-xs flex-shrink-0">›</span>
                      <input
                        value={s.name}
                        onChange={(e) => updateSubName(g.key, s.key, e.target.value)}
                        placeholder="Tên chi tiết (VD: Máy chạy chậm)"
                        className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#006838]"
                      />
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button type="button" onClick={() => moveSub(g.key, s.key, -1)} disabled={si === 0} className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center disabled:opacity-30" title="Lên trên">
                          <IconArrowUp size={14} />
                        </button>
                        <button type="button" onClick={() => moveSub(g.key, s.key, 1)} disabled={si === g.subs.length - 1} className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center disabled:opacity-30" title="Xuống dưới">
                          <IconArrowDown size={14} />
                        </button>
                        <button type="button" onClick={() => deleteSub(g.key, s.key)} className="w-7 h-7 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center" title="Xoá chi tiết">
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pl-6 pt-0.5">
                    <span className="text-[11px] text-slate-400 italic">› Khác (nhập tự do) — luôn tự có sẵn</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addSub(g.key)}
                    className="ml-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-dashed border-slate-300 text-xs font-extrabold text-slate-500 hover:border-[#006838] hover:text-[#006838] transition"
                  >
                    <IconPlus size={13} /> Thêm chi tiết
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addGroup}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white border-2 border-dashed border-slate-300 text-sm font-extrabold text-slate-500 hover:border-[#006838] hover:text-[#006838] transition"
            >
              <IconPlus size={16} /> Thêm nhóm chính
            </button>

            <div className="flex items-center gap-2 px-1 pt-1">
              <span className="text-xs text-slate-400 italic">
                Nhóm chính &quot;Khác&quot; cũng luôn tự có sẵn ở cuối danh sách trên trang quét.
              </span>
            </div>
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
