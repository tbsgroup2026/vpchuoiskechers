"use client";

// Trung tâm phân phối: Kế hoạch & kết quả đồng bộ vật tư 8 tuần liên tục.
// Mốc may (trước ngày may 2 tuần) và gò (trước ngày gò 1 tuần), mỗi mốc 2 luồng CĐ / CƯ.
// Ngày may / gò lấy từ KHSX (màn Kế hoạch). Báo cáo tự gửi 11:00 hằng ngày.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IconArrowLeft, IconBuildingWarehouse, IconX } from "@tabler/icons-react";
import { fmtDMY } from "./engine";
import { scmApi, type ScmMe } from "./client";
import type { Notify } from "./ScmModule";

type Status = "DONE" | "DONE_LATE" | "SHORT" | "OVERDUE" | "DUE_SOON" | "PLAN_LATE" | "NO_PLAN" | "OPEN";
type Cell = { stage: "MAY" | "GO"; stream: string; due: string; planDate: string | null; resultDate: string | null; result: string | null; shortage: string | null; status: Status; updatedBy: string | null };
type Row = { orderId: string; code: string; plant: string | null; line: string | null; style: string | null; qty: number; shipDate: string; sewStart: string | null; lastStart: string | null; cells: Cell[] };
type Week = { weekStart: string; total: number; done: number; late: number; problem: number; open: number };
type Board = {
  success: boolean;
  needSite?: boolean;
  today: string;
  rows: Row[];
  weeks: Week[];
  totals: { overdue: number; short: number; dueSoon: number; noPlan: number; planLate: number };
  streams: { key: string; name: string; desc: string }[];
  stages: { key: "MAY" | "GO"; name: string; leadDays: number }[];
  statusLabel: Record<Status, string>;
  canEdit: boolean;
};

const TONE: Record<Status, string> = {
  DONE: "bg-emerald-50 border-emerald-300 text-emerald-900",
  DONE_LATE: "bg-amber-50 border-amber-300 text-amber-900",
  SHORT: "bg-rose-50 border-rose-300 text-rose-900",
  OVERDUE: "bg-rose-100 border-rose-400 text-rose-900",
  DUE_SOON: "bg-amber-50 border-amber-300 text-amber-900",
  PLAN_LATE: "bg-orange-50 border-orange-300 text-orange-900",
  NO_PLAN: "bg-slate-50 border-slate-300 text-slate-700",
  OPEN: "bg-white border-slate-200 text-slate-800",
};
const PROBLEM: Status[] = ["OVERDUE", "SHORT", "PLAN_LATE", "DUE_SOON"];
const btn = "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50";

export default function ScmSync({ site, onBack, notify }: { me: ScmMe; site: string; onBack: () => void; notify: Notify }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [onlyProblem, setOnlyProblem] = useState(false);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ row: Row; cell: Cell } | null>(null);

  const load = useCallback(async () => {
    if (!site) return;
    setLoading(true);
    try {
      setBoard(await scmApi<Board>(`sync?site=${encodeURIComponent(site)}`));
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [site, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const kw = q.trim().toUpperCase();
    return (board?.rows || []).filter(
      (r) => (!onlyProblem || r.cells.some((c) => PROBLEM.includes(c.status))) && (!kw || `${r.code} ${r.style || ""} ${r.line || ""}`.toUpperCase().includes(kw))
    );
  }, [board, onlyProblem, q]);

  const streamName = (k: string) => board?.streams.find((s) => s.key === k)?.name || k;
  const stageName = (k: string) => board?.stages.find((s) => s.key === k)?.name || k;
  const cellOf = (r: Row, stage: string, stream: string) => r.cells.find((c) => c.stage === stage && c.stream === stream);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#006838]">
            <IconArrowLeft size={16} /> Tổng quan
          </button>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Trung tâm phân phối</h1>
          <p className="text-xs text-slate-600">Kế hoạch & kết quả đồng bộ vật tư 8 tuần liên tục · cấp đủ trước may 2 tuần, trước gò 1 tuần · báo cáo tự gửi 11:00 hằng ngày</p>
        </div>
        <a href="/warehouse" className={`${btn} border border-slate-200 bg-white text-slate-700`}>
          <IconBuildingWarehouse size={16} /> Kiểm hàng, vị trí & tồn kho
        </a>
      </div>

      {board && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { k: "Quá hạn chưa cấp", v: board.totals.overdue, t: "text-rose-700" },
              { k: "Cấp thiếu", v: board.totals.short, t: "text-rose-700" },
              { k: "Sắp tới hạn (≤ 3 ngày)", v: board.totals.dueSoon, t: "text-amber-700" },
              { k: "Kế hoạch cấp sau hạn", v: board.totals.planLate, t: "text-orange-700" },
              { k: "Chưa có kế hoạch", v: board.totals.noPlan, t: "text-slate-700" },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="text-[11px] font-bold text-slate-600">{x.k}</div>
                <div className={`text-2xl font-black ${x.v ? x.t : "text-slate-400"}`}>{x.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 overflow-x-auto">
            <div className="grid min-w-[720px] grid-cols-8 gap-2">
              {board.weeks.map((w, i) => (
                <div key={w.weekStart} className={`rounded-xl border p-2.5 text-xs ${i === 0 ? "border-[#006838] bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
                  <div className="font-bold text-slate-900">{i === 0 ? "Tuần này" : `Tuần +${i}`}</div>
                  <div className="text-[11px] text-slate-500">{fmtDMY(w.weekStart)}</div>
                  <div className="mt-1.5 text-slate-700">{w.total} mốc</div>
                  <div className="text-emerald-700">Đúng hạn {w.done}</div>
                  {w.late > 0 && <div className="text-amber-700">Trễ {w.late}</div>}
                  {w.problem > 0 && <div className="font-bold text-rose-700">Vấn đề {w.problem}</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã đơn, mã giày, chuyền..." className="w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={onlyProblem} onChange={(e) => setOnlyProblem(e.target.checked)} /> Chỉ đơn có vấn đề
        </label>
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1000px] text-xs">
          <thead className="bg-slate-50 text-left font-bold text-slate-600">
            <tr>
              <th className="p-2.5" rowSpan={2}>Đơn hàng</th>
              <th className="p-2.5" rowSpan={2}>Ngày may / gò</th>
              {(board?.stages || []).map((st) => (
                <th key={st.key} className="border-l border-slate-200 p-2 text-center" colSpan={board?.streams.length || 2}>
                  Đồng bộ {st.name} (trước {st.leadDays} ngày)
                </th>
              ))}
            </tr>
            <tr>
              {(board?.stages || []).flatMap((st) =>
                (board?.streams || []).map((sm) => (
                  <th key={`${st.key}${sm.key}`} className="border-l border-slate-200 p-2 text-center" title={sm.desc}>{sm.name}</th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={6} className="p-4 text-center text-slate-500">Đang tải...</td></tr>}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  {board?.rows.length ? "Không có đơn phù hợp" : "Chưa có đơn nào có ngày may / gò trong 8 tuần tới. Kế hoạch cần nhập KHSX ở màn Kế hoạch."}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.orderId} className="align-top">
                  <td className="p-2.5">
                    <div className="font-mono font-bold text-slate-900">{r.code}</div>
                    <div className="text-[11px] text-slate-500">{[r.plant, r.line].filter(Boolean).join(" / ") || "—"}{r.style ? ` · ${r.style}` : ""}</div>
                    <div className="text-[11px] text-slate-500">Xuất {fmtDMY(r.shipDate)}</div>
                  </td>
                  <td className="p-2.5 font-mono text-[11px] text-slate-700">
                    <div>May {r.sewStart ? fmtDMY(r.sewStart) : "—"}</div>
                    <div>Gò {r.lastStart ? fmtDMY(r.lastStart) : "—"}</div>
                  </td>
                  {(board?.stages || []).flatMap((st) =>
                    (board?.streams || []).map((sm) => {
                      const c = cellOf(r, st.key, sm.key);
                      if (!c) return <td key={`${st.key}${sm.key}`} className="border-l border-slate-100 p-2 text-center text-slate-400">—</td>;
                      return (
                        <td key={`${st.key}${sm.key}`} className="border-l border-slate-100 p-1.5">
                          <button
                            type="button"
                            onClick={() => setEditing({ row: r, cell: c })}
                            disabled={!board?.canEdit}
                            className={`w-full rounded-lg border p-2 text-left disabled:cursor-default ${TONE[c.status]}`}
                            title={board?.statusLabel[c.status]}
                          >
                            <div className="font-bold">Hạn {fmtDMY(c.due)}</div>
                            <div className="text-[11px]">KH: {c.planDate ? fmtDMY(c.planDate) : "—"}</div>
                            <div className="text-[11px]">
                              KQ: {c.result === "DU" ? `Đủ ${c.resultDate ? fmtDMY(c.resultDate) : ""}` : c.result === "THIEU" ? `Thiếu (${c.shortage || ""})` : "—"}
                            </div>
                            <div className="mt-0.5 text-[10px] font-bold">{board?.statusLabel[c.status]}</div>
                          </button>
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editing && board && (
        <SyncEditModal
          row={editing.row}
          cell={editing.cell}
          title={`${editing.row.code} · Đồng bộ ${stageName(editing.cell.stage)} · ${streamName(editing.cell.stream)}`}
          today={board.today}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            notify("ok", "Đã lưu kế hoạch / kết quả đồng bộ");
            await load();
          }}
          notify={notify}
        />
      )}
    </div>
  );
}

function SyncEditModal({ row, cell, title, today, onClose, onSaved, notify }: { row: Row; cell: Cell; title: string; today: string; onClose: () => void; onSaved: () => void; notify: Notify }) {
  const [planDate, setPlanDate] = useState(cell.planDate || "");
  const [resultDate, setResultDate] = useState(cell.resultDate || "");
  const [result, setResult] = useState(cell.result || "");
  const [shortage, setShortage] = useState(cell.shortage || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await scmApi(`sync/${encodeURIComponent(row.orderId)}`, { method: "PUT", body: { stage: cell.stage, stream: cell.stream, planDate, resultDate, result, shortage } });
      onSaved();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600">Hạn cấp đồng bộ: <b>{fmtDMY(cell.due)}</b></p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><IconX size={18} /></button>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">KH: ngày dự kiến cấp</span>
            <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">KQ: ngày cấp thực tế</span>
            <input type="date" value={resultDate} max={today} onChange={(e) => setResultDate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
          </label>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-700">KQ: tình trạng</span>
            <div className="flex gap-2">
              {[
                { v: "", l: "Chưa cấp" },
                { v: "DU", l: "Đủ đồng bộ" },
                { v: "THIEU", l: "Cấp thiếu" },
              ].map((o) => (
                <button key={o.v} type="button" onClick={() => setResult(o.v)} aria-pressed={result === o.v} className={`${btn} flex-1 border ${result === o.v ? "border-[#006838] bg-[#006838] text-white" : "border-slate-200 text-slate-700"}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          {result === "THIEU" && (
            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-700">Thiếu vật tư gì</span>
              <textarea value={shortage} onChange={(e) => setShortage(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="VD: Thiếu đế size 8-9, chờ NCC giao 25/11" />
            </label>
          )}
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className={`${btn} flex-1 border border-slate-200 text-slate-700`}>Hủy</button>
          <button type="button" onClick={save} disabled={saving} className={`${btn} flex-1 bg-[#006838] text-white`}>{saving ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </div>
    </div>
  );
}
