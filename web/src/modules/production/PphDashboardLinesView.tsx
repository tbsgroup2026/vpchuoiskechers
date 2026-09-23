'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconArrowLeft,
  IconLayoutGrid,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconCheck,
  IconAlertTriangle,
  IconArrowUp,
  IconArrowDown,
  IconX,
} from '@tabler/icons-react';

type TreeTeam = { id: string; name: string };
type TreeLine = { id: string; name: string; teams: TreeTeam[] };
type TreeArea = { id: string; name: string; lines: TreeLine[]; teams: TreeTeam[] };
type TreeFactory = { id: string; name: string; areas: TreeArea[] };

type AreaGroup = { areaId: string; areaName: string; factoryName: string; leaves: { id: string; name: string }[] };
type EditLine = { key: string; areaId: string; name: string; leafIds: string[] };

let __seq = 0;
const newKey = () => `ln${Date.now().toString(36)}_${(__seq++).toString(36)}`;

// Điểm quét (leaf) = mục KHÔNG còn con trong cây: Tổ (thẳng dưới Xưởng hoặc dưới Chuyền),
// Chuyền không có Tổ, hoặc Xưởng không chia gì. Mirror pphCollectFactoryLeaves() phía _worker.js.
function areasWithLeaves(f: TreeFactory): AreaGroup[] {
  const out: AreaGroup[] = [];
  for (const a of f.areas || []) {
    const isLeafArea = (a.lines || []).length === 0 && (a.teams || []).length === 0;
    let leaves: { id: string; name: string }[] = [];
    if (isLeafArea) {
      leaves = [{ id: a.id, name: a.name }];
    } else {
      for (const t of a.teams || []) leaves.push({ id: t.id, name: t.name });
      for (const l of a.lines || []) {
        if ((l.teams || []).length === 0) leaves.push({ id: l.id, name: l.name });
        else for (const t of l.teams) leaves.push({ id: t.id, name: `${l.name} · ${t.name}` });
      }
    }
    if (leaves.length) out.push({ areaId: a.id, areaName: a.name, factoryName: f.name, leaves });
  }
  return out;
}

// Cấu hình LINE để hiện dashboard "Hiệu suất Nhà máy". Mỗi Xưởng có nhiều điểm quét (VD Xưởng May
// 25 tổ) — admin GÁN TAY các tổ vào từng Line (VD 5 line, mỗi line 5 tổ). Line CHỈ để hiển thị,
// KHÔNG đụng cây/mã QR. Điểm quét chưa gán line nào sẽ tự đứng riêng 1 ô trên dashboard.
export default function PphDashboardLinesView({ onBack }: { onBack: () => void }) {
  const [groups, setGroups] = useState<AreaGroup[]>([]);
  const [lines, setLines] = useState<EditLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [treeRes, lineRes] = await Promise.all([
        fetch('/api/pph/tree').then((r) => r.json()),
        fetch('/api/pph/dashboard-lines').then((r) => r.json()),
      ]);
      if (!treeRes.success) {
        setError(treeRes.error || 'Không tải được cây tổ chức');
        return;
      }
      const g = (treeRes.data || []).flatMap((f: TreeFactory) => areasWithLeaves(f));
      setGroups(g);
      const validAreaIds = new Set(g.map((x: AreaGroup) => x.areaId));
      const validLeafIds = new Set(g.flatMap((x: AreaGroup) => x.leaves.map((l) => l.id)));
      if (lineRes.success) {
        setLines(
          (lineRes.lines || [])
            .filter((l: { areaId: string }) => validAreaIds.has(l.areaId))
            .map((l: { areaId: string; name: string; leafIds: string[] }) => ({
              key: newKey(),
              areaId: l.areaId,
              name: l.name,
              leafIds: (l.leafIds || []).filter((id) => validLeafIds.has(id)),
            })),
        );
      } else {
        setLines([]);
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
  const leafNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of groups) for (const l of g.leaves) m.set(l.id, l.name);
    return m;
  }, [groups]);

  function addLine(areaId: string, count: number) {
    touch();
    setLines((prev) => [...prev, { key: newKey(), areaId, name: `Line ${count + 1}`, leafIds: [] }]);
  }
  function updName(key: string, name: string) {
    touch();
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, name } : l)));
  }
  function delLine(key: string) {
    touch();
    setLines((prev) => prev.filter((l) => l.key !== key));
  }
  function moveLine(key: string, dir: -1 | 1) {
    touch();
    setLines((prev) => {
      const l = prev.find((x) => x.key === key);
      if (!l) return prev;
      const sameArea = prev.filter((x) => x.areaId === l.areaId);
      const i = sameArea.findIndex((x) => x.key === key);
      const j = i + dir;
      if (j < 0 || j >= sameArea.length) return prev;
      const reordered = [...sameArea];
      [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
      // splice back in original order for other areas
      const others = prev.filter((x) => x.areaId !== l.areaId);
      const out: EditLine[] = [];
      let ri = 0;
      for (const x of prev) out.push(x.areaId === l.areaId ? reordered[ri++] : x);
      void others;
      return out;
    });
  }
  function assignLeaf(leafId: string, lineKey: string) {
    touch();
    setLines((prev) =>
      prev.map((l) => {
        if (l.key === lineKey) return { ...l, leafIds: [...l.leafIds, leafId] };
        return { ...l, leafIds: l.leafIds.filter((id) => id !== leafId) };
      }),
    );
  }
  function removeLeaf(leafId: string, lineKey: string) {
    touch();
    setLines((prev) => prev.map((l) => (l.key === lineKey ? { ...l, leafIds: l.leafIds.filter((id) => id !== leafId) } : l)));
  }

  async function handleSave() {
    const cleaned = lines.map((l) => ({ areaId: l.areaId, name: l.name.trim(), leafIds: l.leafIds }));
    for (const l of cleaned) {
      if (!l.name) {
        setSaveError('Có Line chưa đặt tên');
        return;
      }
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/pph/dashboard-lines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: cleaned }),
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
            <IconLayoutGrid size={20} className="text-[#006838]" /> Cấu Hình Line — Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Gán các Tổ/Chuyền của mỗi Xưởng vào từng Line để hiện gọn trên màn hình lớn. Điểm quét chưa gán sẽ tự đứng riêng 1 ô.
          </p>
        </div>
      </div>

      {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">⚠️ {error}</div>}

      {loading ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center text-base text-slate-400">Đang tải...</div>
      ) : !error && groups.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center text-sm text-slate-400">
          Chưa có Xưởng nào có điểm quét — thêm ở &quot;Cây Nhà máy / Mã QR&quot; trước.
        </div>
      ) : (
        !error && (
          <div className="space-y-4">
            {groups.map((g) => {
              const areaLines = lines.filter((l) => l.areaId === g.areaId);
              const assigned = new Set(areaLines.flatMap((l) => l.leafIds));
              const unassigned = g.leaves.filter((l) => !assigned.has(l.id));
              return (
                <div key={g.areaId} className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-black text-slate-900">{g.areaName}</p>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {g.factoryName} · {g.leaves.length} điểm quét · {areaLines.length} line · {unassigned.length} chưa gán
                    </p>
                  </div>
                  <div className="p-3 space-y-2">
                    {areaLines.map((ln, li) => (
                      <div key={ln.key} className="rounded-xl border border-slate-200 p-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            value={ln.name}
                            onChange={(e) => updName(ln.key, e.target.value)}
                            className="flex-1 min-w-0 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-900 focus:outline-none focus:border-[#006838]"
                            placeholder="Tên line"
                          />
                          <button type="button" onClick={() => moveLine(ln.key, -1)} disabled={li === 0} className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30">
                            <IconArrowUp size={14} />
                          </button>
                          <button type="button" onClick={() => moveLine(ln.key, 1)} disabled={li === areaLines.length - 1} className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30">
                            <IconArrowDown size={14} />
                          </button>
                          <button type="button" onClick={() => delLine(ln.key)} className="w-7 h-7 rounded-lg text-rose-400 hover:bg-rose-50 flex items-center justify-center">
                            <IconTrash size={14} />
                          </button>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {ln.leafIds.length === 0 ? (
                            <span className="text-[11px] italic text-slate-400">Chưa có tổ nào — chọn từ &quot;Chưa gán&quot; bên dưới.</span>
                          ) : (
                            ln.leafIds.map((id) => (
                              <span key={id} className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700">
                                {leafNameById.get(id) || id}
                                <button type="button" onClick={() => removeLeaf(id, ln.key)} className="text-emerald-400 hover:text-emerald-700">
                                  <IconX size={11} />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addLine(g.areaId, areaLines.length)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-dashed border-slate-300 text-xs font-extrabold text-slate-500 hover:border-[#006838] hover:text-[#006838]"
                    >
                      <IconPlus size={13} /> Thêm Line
                    </button>

                    {unassigned.length > 0 && areaLines.length > 0 && (
                      <div className="mt-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                        <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-gray-400">Chưa gán ({unassigned.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {unassigned.map((lf) => (
                            <span key={lf.id} className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600">
                              {lf.name}
                              <select
                                value=""
                                onChange={(e) => e.target.value && assignLeaf(lf.id, e.target.value)}
                                className="bg-transparent text-[11px] font-bold text-[#006838] outline-none cursor-pointer"
                              >
                                <option value="">→ Line</option>
                                {areaLines.map((ln) => (
                                  <option key={ln.key} value={ln.key}>
                                    {ln.name || 'Line'}
                                  </option>
                                ))}
                              </select>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
