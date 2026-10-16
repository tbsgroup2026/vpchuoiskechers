"use client";

// Màn "Tiến độ chung": mọi bộ phận xem, không ai sửa. Chỉ hiện trạng thái và lý do chờ của 10 bước.
// Lọc, sắp xếp, phân trang do server làm (/api/scm/orders).

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBell,
  IconChevronLeft,
  IconChevronRight,
  IconFileTypePdf,
  IconFlag,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { OWNER_DEPT_NAME, PHASES, PROJECT_START, PROJECT_WEEKS, STEPS, type OwnerDept } from "./config";
import { addDays, diffDays, fmtDMY, type OrderState, type StepStatus } from "./engine";
import { scmApi, type OrderDetail, type OrderItem, type OrderPage, type Overview, type ScmMe } from "./client";
import type { Notify } from "./ScmModule";

// ─── Trạng thái: khác cả độ sáng, viền và hoa văn để đọc được khi không phân biệt màu ─────

const HATCH = { backgroundImage: "repeating-linear-gradient(45deg, transparent 0 3px, rgba(0,0,0,0.14) 3px 5px)" };

export const STEP_STATUS: Record<StepStatus, { label: string; cell: string; pill: string; style?: React.CSSProperties }> = {
  done: { label: "Hoàn thành", cell: "bg-[#006838] text-white border-[#006838]", pill: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  late: { label: "Trễ hạn", cell: "bg-red-600 text-white border-red-700 ring-2 ring-red-200", pill: "bg-red-50 text-red-700 border-red-200" },
  blocked: { label: "Bị chặn", cell: "bg-amber-300 text-amber-950 border-amber-600", pill: "bg-amber-50 text-amber-800 border-amber-200", style: HATCH },
  doing: { label: "Đang làm", cell: "bg-white text-sky-800 border-2 border-sky-600", pill: "bg-sky-50 text-sky-800 border-sky-200" },
  pending: { label: "Chưa tới", cell: "bg-slate-50 text-slate-500 border-dashed border-slate-300", pill: "bg-slate-50 text-slate-600 border-slate-200" },
  na: { label: "Không áp dụng", cell: "bg-slate-200 text-slate-500 border-slate-300 line-through", pill: "bg-slate-100 text-slate-600 border-slate-200" },
};

const ORDER_STATE: Record<OrderState, { label: string; pill: string }> = {
  blocked: { label: "Bị chặn", pill: "bg-amber-50 text-amber-800 border-amber-300" },
  late: { label: "Trễ hạn", pill: "bg-red-50 text-red-700 border-red-200" },
  on_track: { label: "Đúng tiến độ", pill: "bg-sky-50 text-sky-800 border-sky-200" },
  complete: { label: "Hoàn thành", pill: "bg-emerald-50 text-emerald-800 border-emerald-200" },
};

const btn = "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4";
const btnPrimary = `${btn} bg-[#006838] text-white hover:bg-[#00522c] focus-visible:ring-[#006838]/30`;
const btnWarn = `${btn} bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500/30`;
const btnGhost = `${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300`;
const field = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#006838] focus:ring-4 focus:ring-[#006838]/15";

function StepStrip({ steps, size = "md" }: { steps: OrderItem["steps"]; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-[11px]";
  return (
    <ol className="flex gap-1" aria-label="Trạng thái 10 bước">
      {steps.map((s) => {
        const m = STEP_STATUS[s.status];
        const tip = `Bước ${s.no} ${STEPS[s.no].short} (${OWNER_DEPT_NAME[STEPS[s.no].owner]}): ${m.label}. ${s.reason}. Hạn ${fmtDMY(s.due)}`;
        return (
          <li key={s.no} title={tip} aria-label={tip} className={`${dim} shrink-0 rounded-md border flex items-center justify-center font-black ${m.cell}`} style={m.style}>
            {s.no}
          </li>
        );
      })}
    </ol>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600" aria-label="Chú thích trạng thái">
      {(Object.keys(STEP_STATUS) as StepStatus[]).map((k) => (
        <li key={k} className="flex items-center gap-1.5">
          <span className={`w-4 h-4 rounded border ${STEP_STATUS[k].cell}`} style={STEP_STATUS[k].style} aria-hidden="true" />
          {STEP_STATUS[k].label}
        </li>
      ))}
    </ul>
  );
}

interface Filters {
  q: string;
  plant: string;
  status: string;
  sort: string;
  owner: string;
  page: number;
}
const EMPTY: Filters = { q: "", plant: "", status: "", sort: "ship", owner: "", page: 1 };

const qs = (site: string, f: Filters, pageSize = 10) =>
  new URLSearchParams({ site, q: f.q, plant: f.plant, status: f.status, sort: f.sort, owner: f.owner, page: String(f.page), pageSize: String(pageSize) }).toString();

export default function ScmProgress({ me, site, onBack, notify }: { me: ScmMe; site: string; onBack: () => void; notify: Notify }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [qInput, setQInput] = useState("");
  const [data, setData] = useState<OrderPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await scmApi<Overview>(`overview?site=${site}`));
    } catch (e) {
      notify("err", (e as Error).message);
    }
  }, [site, notify]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await scmApi<OrderPage>(`orders?${qs(site, filters)}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [site, filters]);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    const t = window.setTimeout(() => setFilters((f) => (f.q === qInput.trim() ? f : { ...f, q: qInput.trim(), page: 1 })), 300);
    return () => window.clearTimeout(t);
  }, [qInput]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  const refresh = () => {
    loadOverview();
    loadOrders();
    notify("ok", "Đã làm mới dữ liệu");
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const exportPdf = async () => {
    try {
      const all: OrderItem[] = [];
      for (let p = 1; p <= 40; p++) {
        const r = await scmApi<OrderPage>(`orders?${qs(site, { ...filters, page: p }, 50)}`);
        all.push(...r.items);
        if (all.length >= r.total) break;
      }
      printReport(all, filters, site, me.today, overview);
    } catch (e) {
      notify("err", (e as Error).message);
    }
  };

  const c = overview?.cards;
  const CARDS = [
    { label: "Đơn đang theo dõi", value: c?.tracking, tone: "text-slate-900" },
    { label: "Đúng tiến độ", value: c?.onTrack, tone: "text-sky-800" },
    { label: "Có bước trễ", value: c?.withLate, tone: "text-red-700", filter: "late" },
    { label: "Có bước bị chặn", value: c?.withBlocked, tone: "text-amber-800", filter: "blocked" },
    { label: "Xuất hàng trong 45 ngày", value: c?.shipIn45, tone: "text-slate-900" },
  ];

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#006838]">
            <IconArrowLeft size={16} /> Tổng quan
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Tiến độ chung</h1>
          <p className="text-xs text-slate-500 font-medium">Mọi bộ phận cùng xem; màn hình chỉ hiện trạng thái và lý do chờ. Hôm nay {fmtDMY(me.today)}.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={btnGhost} onClick={refresh}><IconRefresh size={16} /> Làm mới</button>
          <button type="button" className={btnPrimary} onClick={exportPdf}><IconFileTypePdf size={16} /> Xuất báo cáo</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {CARDS.map((k) => {
          const active = k.filter && filters.status === k.filter;
          const content = (
            <>
              <p className="text-xs font-bold text-slate-500">{k.label}</p>
              {k.value === undefined ? <div className="mt-2 h-8 w-12 rounded bg-slate-100 animate-pulse" /> : <p className={`mt-1 text-3xl font-black tabular-nums ${k.tone}`}>{k.value}</p>}
            </>
          );
          return k.filter ? (
            <button
              key={k.label}
              type="button"
              aria-pressed={Boolean(active)}
              onClick={() => set({ status: active ? "" : k.filter! })}
              className={`rounded-2xl border bg-white p-4 text-left shadow-2xs hover:border-[#006838]/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#006838]/20 ${active ? "border-[#006838] ring-2 ring-[#006838]/20" : "border-slate-200"}`}
            >
              {content}
            </button>
          ) : (
            <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">{content}</div>
          );
        })}
      </div>

      <section className="space-y-3" aria-labelledby="bottlenecks-title">
        <div className="flex items-baseline justify-between">
          <h2 id="bottlenecks-title" className="text-sm font-black">Điểm nghẽn theo bộ phận</h2>
          <p className="text-xs text-slate-500">Số bước trễ + số bước sau đang chờ bộ phận này</p>
        </div>
        {!overview ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {overview.bottlenecks.map((b) => {
              const active = filters.owner === b.owner;
              return (
                <button
                  key={b.owner}
                  type="button"
                  aria-pressed={Boolean(active)}
                  onClick={() => set({ owner: active ? "" : b.owner })}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left hover:border-[#006838]/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#006838]/20 ${active ? "border-[#006838] bg-emerald-50/60" : "border-slate-200 bg-white"}`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold">{b.name}</span>
                    <span className="block text-xs text-slate-600">{b.late} bước trễ, {b.blocking} bước sau đang chờ</span>
                  </span>
                  <span className="shrink-0 text-2xl font-black tabular-nums text-red-700">{b.total}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="orders-title">
        <h2 id="orders-title" className="sr-only">Bảng đơn hàng</h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Tìm theo mã đơn hoặc nhà máy</span>
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${field} w-full pl-9`} value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Tìm mã đơn, nhà máy, mã hàng" />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Nhà máy
            <select className={`${field} mt-1 block`} value={filters.plant} onChange={(e) => set({ plant: e.target.value })}>
              <option value="">Tất cả</option>
              {(overview?.plants ?? []).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-600">
            Tình trạng
            <select className={`${field} mt-1 block`} value={filters.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="">Tất cả</option>
              <option value="blocked">Bị chặn</option>
              <option value="late">Trễ hạn</option>
              <option value="on_track">Đúng tiến độ</option>
              <option value="complete">Hoàn thành</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-600">
            Sắp xếp
            <select className={`${field} mt-1 block`} value={filters.sort} onChange={(e) => set({ sort: e.target.value })}>
              <option value="ship">Ngày xuất gần nhất</option>
              <option value="progress">Tiến độ thấp nhất</option>
              <option value="risk">Rủi ro cao nhất</option>
            </select>
          </label>
        </div>
        {filters.owner ? (
          <p className="text-xs font-semibold text-slate-600">Đang lọc đơn vướng ở: <b>{OWNER_DEPT_NAME[filters.owner as OwnerDept]}</b></p>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 flex flex-wrap items-center justify-between gap-3" role="alert">
            <span className="flex items-center gap-2"><IconAlertTriangle size={18} /> {error}</span>
            <button type="button" className={btnGhost} onClick={loadOrders}>Thử lại</button>
          </div>
        ) : loading && !data ? (
          <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
        ) : data && data.items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-1">
            <p className="text-sm font-bold text-slate-800">{data.total === 0 && !filters.q && !filters.status && !filters.plant && !filters.owner ? "Chưa có đơn hàng nào" : "Không có đơn khớp bộ lọc"}</p>
            <p className="text-xs text-slate-500">
              {data.total === 0 && !filters.q && !filters.status && !filters.plant && !filters.owner ? "Đơn được thêm từ màn Kế hoạch & CCƯ khi nhận đơn từ Kinh doanh." : "Thử bỏ bớt điều kiện lọc."}
            </p>
          </div>
        ) : data ? (
          <>
            <div className={`hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[1040px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
                  <tr>
                    <th scope="col" className="whitespace-nowrap px-3 py-2.5">Mã đơn</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-2.5">Nhà máy · chuyền</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-2.5">Ngày xuất</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-right">Số lượng</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-2.5">10 bước</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-right">Tiến độ</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-2.5">Tình trạng</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-2.5">Đang vướng ở</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((o) => (
                    <tr key={o.id} className="border-t border-slate-100 hover:bg-emerald-50/40">
                      <td className="px-3 py-2.5">
                        <button type="button" onClick={() => setOpenId(o.id)} className="whitespace-nowrap font-mono text-xs font-black text-[#006838] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006838]/30 rounded">
                          {o.code}
                        </button>
                        {o.style ? <span className="block text-[11px] text-slate-500">{o.style}</span> : null}
                      </td>
                      <td className="px-3 py-2.5 text-xs">{o.plant}<span className="block text-slate-500">{o.line}</span></td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        {fmtDMY(o.shipDate)}
                        <span className={`block ${o.daysToShip < 0 ? "text-slate-500" : o.daysToShip <= 45 ? "font-bold text-red-700" : "text-slate-500"}`}>
                          {o.daysToShip < 0 ? `đã qua ${-o.daysToShip} ngày` : `còn ${o.daysToShip} ngày`}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{o.qty.toLocaleString("vi-VN")}</td>
                      <td className="px-3 py-2.5"><StepStrip steps={o.steps} /></td>
                      <td className="px-3 py-2.5 text-right font-black tabular-nums">{o.progress}%</td>
                      <td className="px-3 py-2.5"><span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${ORDER_STATE[o.state].pill}`}>{ORDER_STATE[o.state].label}</span></td>
                      <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[280px]">
                        {o.state === "complete" ? "" : (
                          <div className="space-y-1">
                            {o.flag ? (
                              <div className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                                <IconAlertTriangle size={13} className="shrink-0 text-amber-600" />
                                <span className="truncate max-w-[230px]" title={o.flag}>{o.flag}</span>
                              </div>
                            ) : null}
                            {o.stuck?.text ? <span className="block text-slate-700">{o.stuck.text}</span> : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className={`md:hidden space-y-2 ${loading ? "opacity-60" : ""}`}>
              {data.items.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => setOpenId(o.id)} className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#006838]/20">
                    <span className="flex items-start justify-between gap-2">
                      <span>
                        <span className="block font-mono text-sm font-black text-[#006838]">{o.code}</span>
                        <span className="block text-xs text-slate-500">{o.plant}, {o.line}</span>
                      </span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${ORDER_STATE[o.state].pill}`}>{ORDER_STATE[o.state].label}</span>
                    </span>
                    <StepStrip steps={o.steps} size="sm" />
                    <span className="flex justify-between text-xs text-slate-600">
                      <span>Xuất {fmtDMY(o.shipDate)} ({o.daysToShip < 0 ? `đã qua ${-o.daysToShip} ngày` : `còn ${o.daysToShip} ngày`})</span>
                      <b className="tabular-nums">{o.progress}%</b>
                    </span>
                    {o.state !== "complete" && (
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        {o.flag ? (
                          <div className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                            <IconAlertTriangle size={13} className="shrink-0 text-amber-600" />
                            <span>{o.flag}</span>
                          </div>
                        ) : null}
                        {o.stuck?.text ? <span className="block text-xs text-slate-700">{o.stuck.text}</span> : null}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Legend />
              <nav className="flex items-center gap-2" aria-label="Phân trang">
                <button type="button" className={btnGhost} disabled={filters.page <= 1} onClick={() => set({ page: filters.page - 1 })} aria-label="Trang trước"><IconChevronLeft size={16} /></button>
                <span className="text-xs font-bold text-slate-600 tabular-nums">Trang {filters.page}/{pages}, {data.total} đơn</span>
                <button type="button" className={btnGhost} disabled={filters.page >= pages} onClick={() => set({ page: filters.page + 1 })} aria-label="Trang sau"><IconChevronRight size={16} /></button>
              </nav>
            </div>
          </>
        ) : null}
      </section>

      <Gantt today={me.today} />

      {openId ? <OrderDrawer id={openId} onClose={() => setOpenId(null)} notify={notify} onChanged={() => { loadOrders(); loadOverview(); }} /> : null}
    </div>
  );
}

// ─── Chi tiết đơn ────────────────────────────────────────────────────────────

function OrderDrawer({ id, onClose, notify, onChanged }: { id: string; onClose: () => void; notify: Notify; onChanged: () => void }) {
  const [d, setD] = useState<OrderDetail | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string>("");
  const closeRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    setErr("");
    try {
      setD(await scmApi<OrderDetail>(`orders/${encodeURIComponent(id)}`));
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    load();
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [load, onClose]);

  const act = async (kind: "remind" | "escalate", step: number) => {
    setBusy(`${kind}-${step}`);
    try {
      const r = await scmApi<{ message: string; level: number }>(`orders/${encodeURIComponent(id)}/${kind}`, { method: "POST", body: { step } });
      notify("ok", `${kind === "remind" ? "Đã nhắc cấp 1" : `Đã leo thang cấp ${r.level}`}. ${r.message}`);
      load();
      onChanged();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="order-drawer-title">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Đóng chi tiết đơn" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 id="order-drawer-title" className="font-mono text-base font-black text-[#006838]">{d?.order.code ?? "Đang tải"}</h2>
            {d ? <p className="text-xs text-slate-500">{d.order.plant}, {d.order.line}. Xuất {fmtDMY(d.order.shipDate)}</p> : null}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng" className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300">
            <IconX size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {err ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{err} <button type="button" className="underline font-bold" onClick={load}>Thử lại</button></div>
          ) : !d ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : (
            <>
              {d.order.flag ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <IconAlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>Điểm nghẽn từ Mua hàng</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">{d.order.flag}</p>
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-600">Hạn chót giao thông tin (KD/CN)</p>
                <p className="text-lg font-black">{fmtDMY(d.detail.infoDeadline)}</p>
                <p className="text-xs text-slate-600">Ngày xuất trừ {d.detail.formula} (lead time NCC + vận chuyển + sản xuất + xử lý BOM)</p>
              </div>
              <ol className="space-y-2">
                {d.detail.steps.map((s) => {
                  const m = STEP_STATUS[s.status];
                  return (
                    <li key={s.no} className="rounded-xl border border-slate-200 p-3 space-y-2">
                      <div className="flex items-start gap-3">
                        <span className={`w-7 h-7 shrink-0 rounded-md border flex items-center justify-center text-[11px] font-black ${m.cell}`} style={m.style} aria-hidden="true">{s.no}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold leading-snug">{s.title}</p>
                          <p className="text-xs text-slate-500">{s.ownerName}. SLA {s.sla}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${m.pill}`}>{m.label}</span>
                      </div>
                      <p className="text-xs text-slate-700">
                        {s.status === "done" ? `Xong ${fmtDMY(s.doneAt)}. ` : `Hạn ${fmtDMY(s.due)}. `}
                        {s.reason}
                        {s.waitingOnName && s.status !== "done" ? `. Đang chờ ${s.waitingOnName}.` : ""}
                      </p>
                      {s.status === "doing" || s.status === "late" ? (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className={btnGhost} disabled={Boolean(busy)} onClick={() => act("remind", s.no)}>
                            <IconBell size={14} /> Nhắc cấp 1
                          </button>
                          {s.escalation >= 2 ? (
                            <button type="button" className={btnWarn} disabled={Boolean(busy)} onClick={() => act("escalate", s.no)}>
                              <IconFlag size={14} /> Leo thang cấp {s.escalation}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Gantt 4 pha ─────────────────────────────────────────────────────────────

function Gantt({ today }: { today: string }) {
  const current = Math.floor(diffDays(today, PROJECT_START) / 7) + 1;
  const weeks = useMemo(() => Array.from({ length: PROJECT_WEEKS }, (_, i) => i + 1), []);
  const cols = { gridTemplateColumns: `minmax(170px, 220px) repeat(${PROJECT_WEEKS}, minmax(30px, 1fr))` };
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3" aria-labelledby="gantt-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="gantt-title" className="text-sm font-black">Lộ trình 4 pha, 18 tuần</h2>
        <p className="text-xs text-slate-500">T1 = tuần 42/2026 (từ {fmtDMY(PROJECT_START)}). {current >= 1 && current <= PROJECT_WEEKS ? `Hiện tại: T${current}.` : ""}</p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px] space-y-1.5">
          <div className="grid items-end gap-px text-[10px] font-bold text-slate-500" style={cols}>
            <span />
            {weeks.map((w) => (
              <span key={w} className={`text-center ${w === current ? "text-[#006838]" : ""}`} title={`Tuần bắt đầu ${fmtDMY(addDays(PROJECT_START, (w - 1) * 7))}`}>T{w}</span>
            ))}
          </div>
          {PHASES.map((p, idx) => (
            <div key={p.key} className="grid items-center gap-px" style={cols}>
              <span className="pr-2 text-xs font-bold text-slate-700 truncate" title={p.name}>{p.name}</span>
              {weeks.map((w) => {
                const inside = w >= p.startWeek && w <= p.endWeek;
                const isMilestone = w === p.endWeek;
                return (
                  <span
                    key={w}
                    className={`relative h-7 ${inside ? (idx % 2 === 0 ? "bg-[#006838]" : "bg-amber-500") : "bg-slate-50"} ${w === p.startWeek ? "rounded-l-md" : ""} ${w === p.endWeek ? "rounded-r-md" : ""} ${w === current ? "outline outline-2 outline-offset-[-2px] outline-slate-900/60" : ""}`}
                  >
                    {isMilestone ? (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white" title={`${p.milestone}: ${p.gate}`}>
                        {p.milestone}
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
        {PHASES.map((p) => (
          <li key={p.key}><b>{p.milestone}</b> cuối T{p.endWeek}: {p.gate}</li>
        ))}
      </ul>
    </section>
  );
}

// ─── Báo cáo in / PDF theo bộ lọc hiện tại ───────────────────────────────────

function printReport(items: OrderItem[], f: Filters, site: string, today: string, ov: Overview | null) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Trình duyệt chặn cửa sổ in. Hãy cho phép pop-up rồi thử lại.");
    return;
  }
  const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
  const cond = [
    site !== "ALL" ? `Site ${site}` : "Tất cả site",
    f.plant && `Nhà máy ${f.plant}`,
    f.status && `Tình trạng ${ORDER_STATE[f.status as OrderState]?.label}`,
    f.owner && `Vướng ở ${OWNER_DEPT_NAME[f.owner as OwnerDept]}`,
    f.q && `Tìm "${f.q}"`,
  ].filter(Boolean).join(", ");
  const strip = (o: OrderItem) => o.steps.map((s) => `<span class="c ${s.status}">${s.no}</span>`).join("");
  w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Báo cáo tiến độ chung ${esc(fmtDMY(today))}</title><style>
    body{font-family:Arial,sans-serif;margin:12mm;color:#0f172a;font-size:10pt} h1{font-size:15pt;margin:0 0 2mm} p{margin:0 0 3mm;color:#475569}
    table{width:100%;border-collapse:collapse} th,td{border-bottom:1px solid #e2e8f0;padding:2mm 1.5mm;text-align:left;vertical-align:top} th{background:#f1f5f9;font-size:9pt}
    .c{display:inline-block;width:5mm;height:5mm;line-height:5mm;text-align:center;font-size:7pt;font-weight:700;margin-right:.6mm;border:1px solid #94a3b8;border-radius:1mm}
    .done{background:#006838;color:#fff;border-color:#006838}.late{background:#dc2626;color:#fff}.blocked{background:#fcd34d;background-image:repeating-linear-gradient(45deg,transparent 0 2px,rgba(0,0,0,.2) 2px 3px)}
    .doing{border:1.5px solid #0284c7;color:#075985}.pending{border-style:dashed;color:#94a3b8}.na{text-decoration:line-through;background:#e2e8f0}
    .k{display:flex;gap:6mm;margin-bottom:4mm}.k b{font-size:13pt;display:block}
    @media print{@page{size:A4 landscape;margin:10mm}}</style></head><body>
    <h1>Báo cáo tiến độ chung</h1><p>Ngày ${esc(fmtDMY(today))}. Bộ lọc: ${esc(cond)}. ${items.length} đơn.</p>
    ${ov ? `<div class="k"><span>Đang theo dõi<b>${ov.cards.tracking}</b></span><span>Đúng tiến độ<b>${ov.cards.onTrack}</b></span><span>Có bước trễ<b>${ov.cards.withLate}</b></span><span>Có bước bị chặn<b>${ov.cards.withBlocked}</b></span><span>Xuất trong 45 ngày<b>${ov.cards.shipIn45}</b></span></div>` : ""}
    <table><thead><tr><th>Mã đơn</th><th>Nhà máy, chuyền</th><th>Ngày xuất</th><th>Số lượng</th><th>10 bước</th><th>Tiến độ</th><th>Tình trạng</th><th>Đang vướng ở</th></tr></thead><tbody>
    ${items.map((o) => `<tr><td><b>${esc(o.code)}</b></td><td>${esc(o.plant)}, ${esc(o.line)}</td><td>${esc(fmtDMY(o.shipDate))}</td><td>${o.qty.toLocaleString("vi-VN")}</td><td>${strip(o)}</td><td>${o.progress}%</td><td>${esc(ORDER_STATE[o.state].label)}</td><td>${o.state === "complete" ? "" : (o.flag ? `[${esc(o.flag)}] ` : "") + esc(o.stuck?.text ?? "")}</td></tr>`).join("")}
    </tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}
