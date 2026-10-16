"use client";

// Màn hình Tiến độ chung (mục 5): mọi bộ phận cùng xem. Chỉ hiện trạng thái và lý do chờ,
// không hiện số liệu chi tiết (NCC, số lượng, kết quả kiểm tra).

import React, { useMemo, useState } from "react";
import { IconAlertOctagon, IconBell, IconChartBar, IconFilter, IconRoute, IconSearch, IconX } from "@tabler/icons-react";
import { DEPTS, PHASES, STEPS, STEP_NOS } from "../config";
import { fmtDM, fmtDMY } from "../dates";
import { projectWeek, type OrderView } from "../engine";
import { useDemo } from "../store";
import type { DeptKey, DemoState, StepStatus } from "../types";
import { Card, CardHeader, DeptChip, Empty, ProgressBar, STATUS_META, Stat, StatusPill, cx } from "../ui";

type Filter = "all" | "late" | "blocked" | "doing" | "complete";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "late", label: "Có trễ hạn" },
  { key: "blocked", label: "Bị chặn" },
  { key: "doing", label: "Đang làm" },
  { key: "complete", label: "Hoàn tất" },
];

function matches(v: OrderView, f: Filter): boolean {
  const sts = STEP_NOS.map((k) => v.steps[k].status);
  if (f === "all") return true;
  if (f === "complete") return v.complete;
  if (f === "late") return sts.includes("late") || STEP_NOS.some((k) => v.steps[k].rootCause);
  if (f === "blocked") return sts.includes("blocked");
  return sts.includes("doing");
}

/** Tiến độ pha gắn với thao tác trong demo: ký biểu mẫu đẩy Pha 1, quét Barcode đẩy Pha 2 */
export function phaseProgress(state: DemoState): Record<string, number> {
  const signed = state.forms.filter((f) => f.status === "DA_KY").length;
  const total = state.barcode.reduce((s, z) => s + z.total, 0);
  const scanned = state.barcode.reduce((s, z) => s + z.scanned, 0);
  const barcodePct = total ? (scanned / total) * 100 : 0;
  return {
    P1: Math.min(100, 45 + signed * 15),
    P2: Math.min(100, Math.round(10 + Math.max(0, barcodePct - 10) * 0.6)),
    P3: 0,
    P4: 0,
  };
}

export default function ProgressScreen() {
  const { state, views, bottlenecks, escalations, focusOrderId, setFocusOrderId } = useDemo();
  const [filter, setFilter] = useState<Filter>("all");
  const [deptFilter, setDeptFilter] = useState<DeptKey | "all">("all");
  const [orderSet, setOrderSet] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const late = views.filter((v) => matches(v, "late")).length;
    const blocked = views.filter((v) => matches(v, "blocked")).length;
    const complete = views.filter((v) => v.complete).length;
    const l3 = escalations.filter((e) => e.level === 3).length;
    return { late, blocked, complete, l3 };
  }, [views, escalations]);

  const rows = useMemo(() => {
    return views
      .filter((v) => matches(v, filter))
      .filter((v) => deptFilter === "all" || (v.current && (v.current.waitingOn?.dept ?? v.current.dept) === deptFilter))
      .filter((v) => !orderSet || orderSet.includes(v.order.code))
      .filter((v) => !query.trim() || v.order.code.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => (a.order.exportDate < b.order.exportDate ? -1 : 1));
  }, [views, filter, deptFilter, orderSet, query]);

  const focus = views.find((v) => v.order.id === focusOrderId) ?? null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Đơn đang theo dõi" value={views.length} hint={`Hôm nay ${fmtDMY(state.today)}`} />
        <Stat label="Đơn có bước trễ hạn" value={stats.late} tone={stats.late ? "bad" : "good"} />
        <Stat label="Đơn có bước bị chặn" value={stats.blocked} tone={stats.blocked ? "warn" : "good"} />
        <Stat label="Đơn đã cấp đủ vật tư" value={stats.complete} tone="good" />
        <Stat label="Cảnh báo cấp 3" value={stats.l3} hint="Báo Ban điều hành" tone={stats.l3 ? "bad" : "good"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            icon={<IconAlertOctagon size={20} />}
            title="Điểm nghẽn hiện tại"
            subtitle="Hệ thống tự xác định từ phụ thuộc giữa các bước; bấm để lọc các đơn liên quan"
            right={orderSet ? <ClearBtn onClick={() => setOrderSet(null)} /> : null}
          />
          {bottlenecks.length === 0 ? (
            <Empty text="Không có điểm nghẽn. Mọi bước đang trong hạn." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {bottlenecks.slice(0, 6).map((b) => (
                <li key={b.key}>
                  <button
                    type="button"
                    onClick={() => setOrderSet(b.orders)}
                    className="flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <DeptChip dept={b.dept} />
                      <span className="text-xs font-bold text-slate-900">
                        Bước {b.step} · {b.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-600">
                      <span>{b.orders.length} đơn</span>
                      {b.maxDaysLate > 0 ? <span className="text-rose-700">trễ lâu nhất {b.maxDaysLate} ngày</span> : null}
                      {b.blockedDownstream > 0 ? <span className="text-amber-800">đang chặn {b.blockedDownstream} bước phía sau</span> : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader icon={<IconBell size={20} />} title="Cảnh báo & leo thang" subtitle="Cấp 1: sắp đến hạn · Cấp 2: quá hạn · Cấp 3: quá hạn kéo dài" />
          {escalations.length === 0 ? (
            <Empty text="Chưa có cảnh báo." />
          ) : (
            <ul className="max-h-[300px] divide-y divide-slate-100 overflow-y-auto">
              {escalations.slice(0, 30).map((e) => (
                <li key={e.key} className="flex items-start gap-2.5 px-4 py-2.5">
                  <LevelBadge level={e.level} />
                  <div className="min-w-0 text-xs">
                    <div className="font-bold text-slate-900">
                      {e.orderCode} <span className="font-semibold text-slate-500">· {DEPTS[e.dept].name}</span>
                    </div>
                    <div className="text-slate-600">{e.text}</div>
                    <div className="text-[11px] text-slate-500">Gửi: {e.recipient}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader icon={<IconRoute size={20} />} title="Luồng đơn hàng 10 bước" subtitle="Mỗi ô là một bước; bấm vào đơn để xem lý do chờ của từng bước" />
        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Lọc theo trạng thái">
            <IconFilter size={16} className="mr-1 text-slate-400" aria-hidden />
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cx(
                  "min-h-[34px] rounded-full border px-3 text-xs font-bold transition-colors",
                  filter === f.key ? "border-[#006838] bg-[#006838] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value as DeptKey | "all")}
              className="min-h-[36px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
              aria-label="Lọc theo bộ phận đang giữ việc"
            >
              <option value="all">Mọi bộ phận giữ việc</option>
              {(["KD", "CN", "KH", "MH", "KHO", "QC"] as DeptKey[]).map((d) => (
                <option key={d} value={d}>
                  {DEPTS[d].name}
                </option>
              ))}
            </select>
            <label className="relative">
              <span className="sr-only">Tìm mã đơn</span>
              <IconSearch size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã đơn"
                className="min-h-[36px] w-36 rounded-xl border border-slate-200 bg-white pl-7 pr-2 text-xs font-semibold text-slate-700"
              />
            </label>
            {orderSet ? <ClearBtn onClick={() => setOrderSet(null)} /> : null}
          </div>
        </div>

        <FlowTable rows={rows} onOpen={(id) => setFocusOrderId(id)} />
        <Legend />
      </Card>

      <GanttCard />

      {focus ? <OrderDrawer view={focus} onClose={() => setFocusOrderId(null)} /> : null}
    </div>
  );
}

function ClearBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
    >
      <IconX size={12} aria-hidden /> Bỏ lọc điểm nghẽn
    </button>
  );
}

export function LevelBadge({ level }: { level: 1 | 2 | 3 }) {
  const cls = level === 3 ? "bg-rose-600 text-white" : level === 2 ? "bg-amber-400 text-amber-950" : "bg-sky-100 text-sky-800";
  return <span className={cx("mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black", cls)}>CẤP {level}</span>;
}

function FlowTable({ rows, onOpen }: { rows: OrderView[]; onOpen: (id: string) => void }) {
  if (rows.length === 0) return <Empty text="Không có đơn phù hợp bộ lọc." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Đơn hàng
            </th>
            {STEP_NOS.map((k) => (
              <th key={k} className="border-b border-slate-200 bg-slate-50 px-1 py-2 text-center" title={STEPS[k].title}>
                <div className="text-[11px] font-black text-slate-700">{k}</div>
                <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
                  <span className={cx("h-1.5 w-1.5 rounded-full", DEPTS[STEPS[k].dept].dot)} aria-hidden />
                  {STEPS[k].short}
                </div>
              </th>
            ))}
            <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Đang vướng ở
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => {
            const cur = v.current;
            return (
              <tr
                key={v.order.id}
                className="group cursor-pointer"
                onClick={() => onOpen(v.order.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onOpen(v.order.id);
                }}
              >
                <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-3 py-2 group-hover:bg-slate-50">
                  <div className="flex items-center gap-1.5 font-black text-slate-900">
                    {v.order.code}
                    {v.order.hero ? <span className="rounded bg-[#006838] px-1 py-px text-[9px] font-black text-white">TOUR</span> : null}
                  </div>
                  <div className="text-[11px] text-slate-500">Xuất {fmtDM(v.order.exportDate)}</div>
                </td>
                {STEP_NOS.map((k) => {
                  const s = v.steps[k];
                  const m = STATUS_META[s.status];
                  const tip = `Bước ${k} – ${STEPS[k].title}. ${m.label}${s.deadline ? `, hạn ${fmtDM(s.deadline)}` : ""}. ${s.reason}`;
                  return (
                    <td key={k} className="border-b border-slate-100 px-1 py-2 text-center group-hover:bg-slate-50">
                      <span
                        title={tip}
                        aria-label={tip}
                        className={cx("mx-auto flex h-7 w-full max-w-[64px] items-center justify-center gap-0.5 rounded-lg text-[10px] font-black", m.cell)}
                      >
                        <m.Icon size={12} aria-hidden />
                        {s.status === "late" || (s.status === "blocked" && s.daysLate > 0) ? `${s.daysLate}n` : null}
                      </span>
                    </td>
                  );
                })}
                <td className="border-b border-slate-100 px-3 py-2 group-hover:bg-slate-50">
                  {cur ? (
                    <div className="space-y-1">
                      <DeptChip dept={cur.waitingOn?.dept ?? cur.dept} />
                      <div className="max-w-[220px] truncate text-[11px] text-slate-600" title={cur.reason}>
                        {cur.reason}
                      </div>
                    </div>
                  ) : (
                    <StatusPill status="done" suffix="đã cấp vật tư" />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Legend() {
  const items: StepStatus[] = ["done", "doing", "late", "blocked", "pending", "na"];
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
      {items.map((s) => (
        <StatusPill key={s} status={s} />
      ))}
      <span className="text-[11px] text-slate-500">Số trong ô = số ngày trễ</span>
    </div>
  );
}

function OrderDrawer({ view, onClose }: { view: OrderView; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết ${view.order.code}`}
      onClick={onClose}
    >
      <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#006838]">Tiến độ chung</div>
            <h3 className="text-lg font-black text-slate-900">{view.order.code}</h3>
            <p className="text-xs text-slate-500">Ngày xuất hàng {fmtDMY(view.order.exportDate)} · chỉ hiển thị trạng thái và lý do chờ</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng">
            <IconX size={18} />
          </button>
        </div>
        <ol className="divide-y divide-slate-100">
          {STEP_NOS.map((k) => {
            const s = view.steps[k];
            return (
              <li key={k} className="flex gap-3 px-5 py-3">
                <div className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black", STATUS_META[s.status].cell)}>{k}</div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-xs font-bold text-slate-900">{STEPS[k].title}</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusPill status={s.status} />
                    <DeptChip dept={STEPS[k].dept} />
                    {s.deadline ? <span className="text-[11px] font-semibold text-slate-500">Hạn {fmtDM(s.deadline)}</span> : null}
                    {s.doneAt ? <span className="text-[11px] font-semibold text-slate-500">Xong {fmtDM(s.doneAt)}</span> : null}
                  </div>
                  {s.reason ? <div className="text-[11px] text-slate-600">{s.reason}</div> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function GanttCard() {
  const { state } = useDemo();
  const week = projectWeek(state.today);
  const progress = phaseProgress(state);
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
  return (
    <Card>
      <CardHeader
        icon={<IconChartBar size={20} />}
        title="Tiến độ 4 pha dự án (Gantt)"
        subtitle={`T1 = tuần 42/2026 · hôm nay đang ở T${Math.max(1, week)} · mốc nghiệm thu M1 cuối T4, M2 cuối T9, M3 cuối T13, M4 cuối T18`}
      />
      <div className="overflow-x-auto px-4 py-3">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[220px_repeat(18,minmax(0,1fr))] gap-y-2">
            <div />
            {weeks.map((w) => (
              <div key={w} className={cx("text-center text-[10px] font-bold", w === week ? "text-[#006838]" : "text-slate-400")}>
                T{w}
              </div>
            ))}
            {PHASES.map((p) => (
              <React.Fragment key={p.key}>
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-800">{p.name}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <ProgressBar value={progress[p.key]} />
                    <span className="w-9 text-right text-[11px] font-black tabular-nums text-slate-700">{progress[p.key]}%</span>
                  </div>
                </div>
                {weeks.map((w) => {
                  const inPhase = w >= p.startWeek && w <= p.endWeek;
                  const isEnd = w === p.endWeek;
                  return (
                    <div key={w} className={cx("relative flex h-8 items-center border-l border-slate-100", w === week && "bg-emerald-50")}>
                      {inPhase ? (
                        <div className={cx("h-4 w-full opacity-80", p.color, w === p.startWeek && "rounded-l-full", isEnd && "rounded-r-full")} />
                      ) : null}
                      {isEnd ? (
                        <span className="absolute -right-1 -top-1 rounded bg-slate-900 px-1 text-[9px] font-black text-white" title={p.gate}>
                          {p.milestone}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
