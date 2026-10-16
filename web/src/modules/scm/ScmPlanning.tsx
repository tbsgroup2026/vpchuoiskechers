"use client";

// Màn hình "Kế hoạch & Chuỗi Cung Ứng" (spec mục 4.2)
// Phân bổ cuốn chiếu 4 tuần, ban hành Kế hoạch 312, bàn giao No Silent và chuyển giao Tầng 2.

import React, { useCallback, useEffect, useState } from "react";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconHistory,
  IconLock,
  IconPlus,
  IconRefresh,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import { SITES, type ScmSettings } from "./config";
import { fmtDMY } from "./engine";
import {
  scmApi,
  type CanIssueResult,
  type OrderItem,
  type PlanCell,
  type PlanChange,
  type PlanOrderRow,
  type PlanRow,
  type PlanViewResponse,
  type ScmMe,
  type WeekLoad,
} from "./client";
import type { Notify } from "./ScmModule";

const btn = "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4";
const btnPrimary = `${btn} bg-[#006838] text-white hover:bg-[#00522c] focus-visible:ring-[#006838]/30`;
const btnWarn = `${btn} bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500/30`;
const btnGhost = `${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300`;
const field = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#006838] focus:ring-4 focus:ring-[#006838]/15";

interface Props {
  me: ScmMe;
  site: string;
  onBack: () => void;
  notify: Notify;
  onSiteChange?: (site: string) => void;
}

export default function ScmPlanning({ me, site, onBack, notify, onSiteChange }: Props) {
  const [data, setData] = useState<PlanViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [filter, setFilter] = useState<"" | "unallocated" | "nosilent">("");
  const [page, setPage] = useState(1);
  const [viewTab, setViewTab] = useState<"t1" | "t2" | "changes">("t1");

  // Modals state
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [reopenModal, setReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [assignTarget, setAssignTarget] = useState<{ orderId: string; orderCode: string; week: string; current: PlanCell | null } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ orderId: string; orderCode: string; fromWeek: string } | null>(null);
  const [moveTargetWeek, setMoveTargetWeek] = useState("");
  const [moveReason, setMoveReason] = useState("");
  const [shipDateTarget, setShipDateTarget] = useState<{ orderId: string; orderCode: string; currentShipDate: string } | null>(null);
  const [newShipDate, setNewShipDate] = useState("");
  const [shipDateReason, setShipDateReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(async () => {
    if (site === "ALL") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ site, q, filter, page: String(page), pageSize: "10" }).toString();
      const res = await scmApi<PlanViewResponse>(`plans/current?${qs}`);
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [site, q, filter, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [qInput]);

  const siteInfo = SITES.find((s) => s.key === site);

  // ─── Chọn Site cụ thể nếu đang ở "ALL" ──────────────────────────────────────
  if (site === "ALL") {
    return (
      <div className="space-y-5 pb-10">
        <div className="space-y-1">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#006838]">
            <IconArrowLeft size={16} /> Tổng quan
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Kế hoạch & Chuỗi Cung Ứng</h1>
          <p className="text-xs text-slate-500 font-medium">Kế hoạch phân bổ được quản lý theo từng cơ sở sản xuất riêng biệt.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto font-black text-xl">
            <IconAlertCircle size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base font-bold text-slate-900">Vui lòng chọn một Site cụ thể</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kế hoạch phân bổ 4 tuần và Kế hoạch 312 được tính toán độc lập theo từng site. Hãy chọn một site bên dưới để tiếp tục:
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {SITES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onSiteChange?.(s.key)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:border-[#006838] hover:bg-emerald-50 hover:text-[#006838] transition"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Tạo mới kế hoạch nếu site chưa có ──────────────────────────────────────
  const handleCreatePlan = async () => {
    setActionBusy(true);
    try {
      await scmApi("plans", { method: "POST", body: { site } });
      notify("ok", `Đã lập kế hoạch cho site ${siteInfo?.name || site}`);
      load();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  const handlePlanAction = async (action: "submit" | "approve" | "issue" | "tier2" | "roll") => {
    if (!data?.plan) return;
    setActionBusy(true);
    try {
      await scmApi(`plans/${encodeURIComponent(data.plan.id)}/${action}`, { method: "POST" });
      const msgs: Record<string, string> = {
        submit: "Đã gửi kế hoạch để phê duyệt",
        approve: "Đã phê duyệt kế hoạch phân bổ (hoàn thành bước 3)",
        issue: "Đã ban hành Kế hoạch 312 (hoàn thành bước 4)",
        tier2: "Đã chuyển kế hoạch Tầng 2 xuống các xưởng",
        roll: "Đã thêm tuần mới cho kế hoạch cuốn chiếu 4 tuần",
      };
      notify("ok", msgs[action] || "Thao tác thành công");
      load();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.plan || reopenReason.trim().length < 5) return;
    setActionBusy(true);
    try {
      await scmApi(`plans/${encodeURIComponent(data.plan.id)}/reopen`, { method: "POST", body: { reason: reopenReason.trim() } });
      notify("ok", "Đã mở lại trạng thái Nháp");
      setReopenModal(false);
      setReopenReason("");
      load();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleSetLine = async (plant: string, line: string) => {
    if (!data?.plan || !assignTarget) return;
    setActionBusy(true);
    try {
      await scmApi(`plans/${encodeURIComponent(data.plan.id)}/lines`, {
        method: "PUT",
        body: { orderId: assignTarget.orderId, week: assignTarget.week, plant, line },
      });
      notify("ok", plant ? "Đã cập nhật phân bổ chuyền" : "Đã hủy phân bổ tuần này");
      setAssignTarget(null);
      load();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleMoveWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.plan || !moveTarget || !moveTargetWeek || moveReason.trim().length < 5) return;
    setActionBusy(true);
    try {
      await scmApi(`plans/${encodeURIComponent(data.plan.id)}/move`, {
        method: "POST",
        body: { orderId: moveTarget.orderId, fromWeek: moveTarget.fromWeek, toWeek: moveTargetWeek, reason: moveReason.trim() },
      });
      notify("ok", "Đã dời tuần phân bổ thành công");
      setMoveTarget(null);
      setMoveTargetWeek("");
      setMoveReason("");
      load();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleSendNoSilent = async (orderId: string, orderCode: string) => {
    setActionBusy(true);
    try {
      await scmApi(`orders/${encodeURIComponent(orderId)}/steps/5/complete`, {
        method: "POST",
        body: { note: "Bàn giao No Silent cho Mua hàng" },
      });
      notify("ok", `Đã gửi No Silent cho đơn ${orderCode} (bắt đầu đếm 3 ngày đặt hàng)`);
      load();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleChangeShipDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipDateTarget || !newShipDate || shipDateReason.trim().length < 3) return;
    setActionBusy(true);
    try {
      await scmApi(`orders/${encodeURIComponent(shipDateTarget.orderId)}/ship-date`, {
        method: "PUT",
        body: { ship_date: newShipDate, reason: shipDateReason.trim() },
      });
      notify("ok", `Đã cập nhật ngày xuất mới cho đơn ${shipDateTarget.orderCode}`);
      setShipDateTarget(null);
      setNewShipDate("");
      setShipDateReason("");
      load();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  const plan = data?.plan;
  const weeks = data?.weeks || [];
  const rows = data?.rows || [];
  const loads = data?.loads || [];
  const changes = data?.changes || [];
  const canIssue = data?.canIssue || { ok: false, reason: "Chưa tải dữ liệu" };
  const canEdit = Boolean(data?.canEdit);
  const canApprove = Boolean(data?.canApprove);
  const isDraft = plan?.status === "DRAFT";
  const pages = data?.total ? Math.max(1, Math.ceil(data.total / (data.pageSize || 10))) : 1;

  return (
    <div className="space-y-5 pb-10">
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#006838]">
            <IconArrowLeft size={16} /> Tổng quan
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Kế hoạch & Chuỗi Cung Ứng</h1>
          <p className="text-xs text-slate-500 font-medium">
            Phân bổ cuốn chiếu 4 tuần, ban hành Kế hoạch 312 và bàn giao No Silent. Cơ sở: <b>{siteInfo?.name || site}</b>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnGhost} onClick={load} disabled={loading}><IconRefresh size={16} /> Làm mới</button>
          {canEdit && (
            <button type="button" className={btnPrimary} onClick={() => setShowNewOrder(true)}>
              <IconPlus size={16} /> Nhận đơn từ Kinh doanh
            </button>
          )}
        </div>
      </div>

      {/* ─── Trường hợp chưa có kế hoạch ────────────────────────────────────────── */}
      {!loading && !plan ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#006838] flex items-center justify-center mx-auto">
            <IconCalendar size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base font-bold text-slate-900">Site này chưa có kế hoạch phân bổ</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có thể bắt đầu lập kế hoạch cuốn chiếu 4 tuần cho cơ sở <b>{siteInfo?.name || site}</b> (tuần bắt đầu đề xuất: {fmtDMY(data?.suggestWeek || "")}).
            </p>
          </div>
          {canEdit ? (
            <button type="button" className={btnPrimary} onClick={handleCreatePlan} disabled={actionBusy}>
              <IconPlus size={16} /> Lập kế hoạch tuần hiện tại
            </button>
          ) : (
            <p className="text-xs text-slate-400">Bạn chỉ có quyền xem, vui lòng liên hệ phòng Kế hoạch để lập kế hoạch.</p>
          )}
        </div>
      ) : null}

      {/* ─── Thanh trạng thái kế hoạch & Hành động ─────────────────────────────── */}
      {plan ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái kế hoạch</span>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black border ${
                  plan.status === "DRAFT" ? "bg-slate-100 text-slate-800 border-slate-300" :
                  plan.status === "PENDING" ? "bg-amber-50 text-amber-900 border-amber-300" :
                  plan.status === "APPROVED" ? "bg-sky-50 text-sky-900 border-sky-300" :
                  "bg-emerald-50 text-emerald-900 border-emerald-300"
                }`}>
                  {plan.statusLabel || plan.status}
                </span>
                <span className="text-xs text-slate-500">
                  Tuần bắt đầu: <b>{fmtDMY(plan.week_start)}</b>
                </span>
              </div>
            </div>

            {/* Các nút theo trạng thái kế hoạch */}
            <div className="flex flex-wrap items-center gap-2">
              {isDraft && canEdit && (
                <button type="button" className={btnPrimary} onClick={() => handlePlanAction("submit")} disabled={actionBusy}>
                  <IconSend size={15} /> Gửi duyệt
                </button>
              )}

              {plan.status === "PENDING" && canApprove && (
                <button type="button" className={btnPrimary} onClick={() => handlePlanAction("approve")} disabled={actionBusy}>
                  <IconCheck size={15} /> Phê duyệt kế hoạch
                </button>
              )}

              {/* Nút Ban hành Kế hoạch 312: bắt buộc có id="ke-hoach-312" */}
              {plan.status !== "ISSUED" && (
              <div className="relative group">
                <button
                  type="button"
                  id="ke-hoach-312"
                  className={`${btnPrimary} ${!canIssue.ok ? "opacity-50 cursor-not-allowed bg-slate-400 hover:bg-slate-400" : ""}`}
                  disabled={!canIssue.ok || actionBusy || !canEdit}
                  onClick={() => handlePlanAction("issue")}
                  title={!canIssue.ok ? canIssue.reason || "Chưa thể ban hành" : "Ban hành kế hoạch 312"}
                >
                  <IconSend size={15} /> Ban hành Kế hoạch 312
                </button>
                {!canIssue.ok && (
                  <div className="absolute top-full mt-1.5 right-0 z-20 hidden group-hover:block w-72 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 shadow-lg leading-relaxed">
                    <p className="font-bold mb-1 flex items-center gap-1"><IconAlertTriangle size={14} /> Chưa thể ban hành:</p>
                    <p>{canIssue.reason || "Chưa đủ điều kiện ban hành"}</p>
                  </div>
                )}
              </div>
              )}

              {plan.status === "ISSUED" && !plan.tier2_sent_at && canEdit && (
                <button type="button" className={btnGhost} onClick={() => handlePlanAction("tier2")} disabled={actionBusy}>
                  <IconArrowRight size={15} /> Chuyển Tầng 2
                </button>
              )}

              {canEdit && (
                <button type="button" className={btnGhost} onClick={() => handlePlanAction("roll")} disabled={actionBusy} title="Thêm tuần mới và đẩy tuần cũ sang sản xuất">
                  <IconCalendar size={15} /> Thêm tuần mới
                </button>
              )}

              {(plan.status === "PENDING" || plan.status === "APPROVED") && canEdit && (
                <button type="button" className={btnGhost} onClick={() => setReopenModal(true)} disabled={actionBusy}>
                  <IconEdit size={15} /> Mở lại nháp
                </button>
              )}
            </div>
          </div>

          {/* Dải tiến trình 4 nấc */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs font-bold">
            {[
              { key: "DRAFT", label: "1. Nháp" },
              { key: "PENDING", label: "2. Chờ duyệt" },
              { key: "APPROVED", label: "3. Đã duyệt" },
              { key: "ISSUED", label: "4. Đã ban hành" },
            ].map((st, i) => {
              const active = plan.status === st.key;
              const passed = ["DRAFT", "PENDING", "APPROVED", "ISSUED"].indexOf(plan.status) >= i;
              return (
                <div key={st.key} className={`rounded-xl py-2 px-1 border transition ${
                  active ? "bg-[#006838] text-white border-[#006838] shadow-2xs" :
                  passed ? "bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold" :
                  "bg-slate-50 text-slate-400 border-slate-200"
                }`}>
                  {st.label}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ─── Tabs chuyển đổi giao diện: Tầng 1 / Tầng 2 / Nhật ký ────────────────── */}
      {plan ? (
        <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewTab("t1")}
            className={`pb-2.5 transition border-b-2 ${viewTab === "t1" ? "border-[#006838] text-[#006838]" : "border-transparent text-slate-500 hover:text-slate-900"}`}
          >
            Tầng 1 (Kế hoạch 4 tuần)
          </button>
          <button
            type="button"
            onClick={() => setViewTab("t2")}
            className={`pb-2.5 transition border-b-2 ${viewTab === "t2" ? "border-[#006838] text-[#006838]" : "border-transparent text-slate-500 hover:text-slate-900"}`}
          >
            Tầng 2 (Chuyển giao Nhà máy)
          </button>
          <button
            type="button"
            onClick={() => setViewTab("changes")}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${viewTab === "changes" ? "border-[#006838] text-[#006838]" : "border-transparent text-slate-500 hover:text-slate-900"}`}
          >
            <IconHistory size={15} /> Nhật ký thay đổi ({changes.length})
          </button>
        </div>
      ) : null}

      {/* ─── Nội dung Tab 1: Kế hoạch 4 tuần ───────────────────────────────────── */}
      {plan && viewTab === "t1" && (
        <div className="space-y-4">
          {/* Thanh tìm kiếm & bộ lọc */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              <input
                className={`${field} w-64`}
                placeholder="Tìm mã đơn, nhà máy..."
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
              />
              <select className={field} value={filter} onChange={(e) => { setFilter(e.target.value as any); setPage(1); }}>
                <option value="">Tất cả đơn</option>
                <option value="unallocated">Chưa phân bổ tuần</option>
                <option value="nosilent">Chờ gửi No Silent</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Tổng số: <b>{data?.total || 0}</b> đơn hàng
            </div>
          </div>

          {/* Bảng Kế hoạch 4 tuần (Desktop) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full min-w-[1080px] text-xs">
              <thead className="bg-slate-50 text-left font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 w-12 text-center">Ưu tiên</th>
                  <th className="px-3 py-3">Mã đơn hàng</th>
                  <th className="px-3 py-3 text-right">Số lượng</th>
                  <th className="px-3 py-3">Ngày xuất</th>
                  {weeks.map((w, idx) => (
                    <th key={w} className="px-3 py-3 text-center border-l border-slate-200 min-w-[130px]">
                      Tuần {idx + 1}
                      <span className="block font-normal text-[11px] text-slate-500">{fmtDMY(w)}</span>
                    </th>
                  ))}
                  <th className="px-3 py-3 border-l border-slate-200 text-center">No Silent</th>
                  <th className="px-3 py-3 border-l border-slate-200 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5 + weeks.length} className="p-8 text-center text-slate-400">
                      Không có đơn hàng nào khớp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2.5 text-center font-bold text-slate-400 tabular-nums">
                        #{r.priority}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono font-bold text-slate-900 block">{r.code}</span>
                        {r.plant && <span className="text-[11px] text-slate-500">{r.plant} · {r.line}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums">
                        {r.qty.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="font-medium text-slate-700">{fmtDMY(r.shipDate)}</span>
                      </td>

                      {/* 4 ô tuần */}
                      {r.cells.map((cell, idx) => {
                        const weekStart = weeks[idx];
                        return (
                          <td key={idx} className="px-2 py-2 text-center border-l border-slate-100">
                            {cell ? (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 font-bold text-[11px] flex items-center gap-1">
                                  {cell.tier2Sent && <IconCheck size={12} className="text-emerald-600" />}
                                  {cell.plant} - {cell.line}
                                </span>
                                {isDraft && canEdit && (
                                  <div className="flex gap-1 text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => setAssignTarget({ orderId: r.id, orderCode: r.code, week: weekStart, current: cell })}
                                      className="text-slate-500 hover:text-[#006838] underline"
                                    >
                                      Sửa
                                    </button>
                                    <span className="text-slate-300">·</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMoveTarget({ orderId: r.id, orderCode: r.code, fromWeek: weekStart });
                                        setMoveTargetWeek(weeks.find((w) => w !== weekStart) || "");
                                      }}
                                      className="text-slate-500 hover:text-amber-700 underline"
                                    >
                                      Dời
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : isDraft && canEdit ? (
                              <button
                                type="button"
                                onClick={() => setAssignTarget({ orderId: r.id, orderCode: r.code, week: weekStart, current: null })}
                                className="rounded-lg border border-dashed border-slate-300 px-2 py-1 text-[11px] text-slate-500 hover:border-[#006838] hover:text-[#006838] hover:bg-emerald-50/50"
                              >
                                + Phân bổ
                              </button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* No Silent */}
                      <td className="px-3 py-2.5 text-center border-l border-slate-100 whitespace-nowrap">
                        {!r.noSilent.required ? (
                          <span className="text-slate-400 text-[11px]">Không yêu cầu</span>
                        ) : r.noSilent.doneAt ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <IconCheck size={14} /> {fmtDMY(r.noSilent.doneAt)}
                          </span>
                        ) : r.noSilent.canSend && canEdit ? (
                          <button
                            type="button"
                            onClick={() => handleSendNoSilent(r.id, r.code)}
                            disabled={actionBusy}
                            className="rounded-full bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs"
                          >
                            Gửi No Silent
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Chờ duyệt KH</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-3 py-2.5 text-right border-l border-slate-100 whitespace-nowrap">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setShipDateTarget({ orderId: r.id, orderCode: r.code, currentShipDate: r.shipDate });
                              setNewShipDate(r.shipDate);
                            }}
                            className="text-slate-600 hover:text-[#006838] font-bold text-[11px] p-1 rounded"
                            title="Đổi ngày xuất"
                          >
                            Đổi ngày xuất
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Dòng tải / năng lực từng tuần */}
              {loads.length > 0 && (
                <tfoot className="bg-slate-50 font-bold text-slate-700 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={4} className="px-3 py-2.5 text-right uppercase tracking-wider text-[11px]">
                      Tổng tải / Năng lực tuần:
                    </td>
                    {loads.map((ld, i) => (
                      <td key={i} className={`px-2 py-2.5 text-center border-l border-slate-200 ${ld.over ? "bg-red-50 text-red-700 font-black" : "text-slate-800"}`}>
                        <div className="tabular-nums">
                          {ld.load.toLocaleString("vi-VN")} / {ld.capacity.toLocaleString("vi-VN")}
                        </div>
                        {ld.over && (
                          <span className="inline-block mt-0.5 rounded bg-red-600 text-white text-[9px] px-1.5 py-0.2">
                            Quá tải
                          </span>
                        )}
                      </td>
                    ))}
                    <td colSpan={2} className="border-l border-slate-200" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Danh sách dạng thẻ (điện thoại) */}
          <div className="md:hidden space-y-2.5">
            {loads.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {loads.map((ld, i) => (
                  <div key={ld.week} className={`rounded-xl border px-2.5 py-1.5 text-[11px] ${ld.over ? "border-red-300 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-700"}`}>
                    <span className="font-bold">Tuần {i + 1}</span> · {ld.load.toLocaleString("vi-VN")} / {ld.capacity.toLocaleString("vi-VN")}
                    {ld.over && <span className="ml-1 font-black">Quá tải</span>}
                  </div>
                ))}
              </div>
            )}
            {rows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-400">Không có đơn hàng nào khớp với điều kiện lọc</p>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-slate-900 whitespace-nowrap">
                        <span className="text-slate-400">#{r.priority}</span> {r.code}
                      </p>
                      <p className="text-[11px] text-slate-500">{r.qty.toLocaleString("vi-VN")} đôi · xuất {fmtDMY(r.shipDate)}</p>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setShipDateTarget({ orderId: r.id, orderCode: r.code, currentShipDate: r.shipDate });
                          setNewShipDate(r.shipDate);
                        }}
                        className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700"
                      >
                        Đổi ngày xuất
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {r.cells.map((cell, idx) => {
                      const weekStart = weeks[idx];
                      return (
                        <div key={idx} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px]">
                          <span className="text-slate-500 whitespace-nowrap">Tuần {idx + 1} · {fmtDMY(weekStart)}</span>
                          {cell ? (
                            <span className="flex items-center gap-2">
                              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">{cell.plant} - {cell.line}</span>
                              {isDraft && canEdit && (
                                <>
                                  <button type="button" className="underline text-slate-500" onClick={() => setAssignTarget({ orderId: r.id, orderCode: r.code, week: weekStart, current: cell })}>Sửa</button>
                                  <button
                                    type="button"
                                    className="underline text-slate-500"
                                    onClick={() => {
                                      setMoveTarget({ orderId: r.id, orderCode: r.code, fromWeek: weekStart });
                                      setMoveTargetWeek(weeks.find((w) => w !== weekStart) || "");
                                    }}
                                  >
                                    Dời
                                  </button>
                                </>
                              )}
                            </span>
                          ) : isDraft && canEdit ? (
                            <button
                              type="button"
                              onClick={() => setAssignTarget({ orderId: r.id, orderCode: r.code, week: weekStart, current: null })}
                              className="rounded-lg border border-dashed border-slate-300 px-2 py-0.5 text-slate-500"
                            >
                              + Phân bổ
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">No Silent</span>
                    {!r.noSilent.required ? (
                      <span className="text-slate-400">Không yêu cầu</span>
                    ) : r.noSilent.doneAt ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><IconCheck size={13} /> {fmtDMY(r.noSilent.doneAt)}</span>
                    ) : r.noSilent.canSend && canEdit ? (
                      <button type="button" onClick={() => handleSendNoSilent(r.id, r.code)} disabled={actionBusy} className="rounded-full bg-amber-500 px-2.5 py-1 font-bold text-white">
                        Gửi No Silent
                      </button>
                    ) : (
                      <span className="text-slate-500">Chờ duyệt KH</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Phân trang */}
          {pages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-slate-500">Trang {page}/{pages}</span>
              <div className="flex gap-1">
                <button type="button" className={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><IconChevronLeft size={16} /></button>
                <button type="button" className={btnGhost} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><IconChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Nội dung Tab 2: Tầng 2 (Chuyển giao Nhà máy) ───────────────────────── */}
      {plan && viewTab === "t2" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-black text-slate-900">Kế hoạch Tầng 2: Chi tiết theo Nhà máy & Chuyền</h2>
            <span className="text-xs text-slate-500">Chế độ xem phân bổ sản xuất</span>
          </div>
          <div className="space-y-4">
            {loads.map((ld, wIdx) => (
              <div key={ld.week} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs text-[#006838]">
                    Tuần {wIdx + 1}: Bắt đầu {fmtDMY(ld.week)}
                  </span>
                  <span className={`text-xs font-bold ${ld.over ? "text-red-700" : "text-slate-600"}`}>
                    Tải: {ld.load.toLocaleString("vi-VN")} / {ld.capacity.toLocaleString("vi-VN")} sp
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ld.lines.length === 0 && <p className="text-xs text-slate-400">Chưa phân bổ chuyền nào trong tuần này</p>}
                  {groupByPlant(ld.lines).map((pl) => (
                    <div key={pl.plant} className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 space-y-1">
                      <span className="font-bold text-xs text-slate-800">{pl.plant}</span>
                      <div className="space-y-0.5 text-[11px] text-slate-600">
                        {pl.lines.map((ln) => (
                          <div key={ln.line} className="flex justify-between items-center">
                            <span>{ln.line}:</span>
                            <span className={`font-mono font-bold ${ln.over ? "text-red-600" : ""}`}>
                              {ln.load.toLocaleString("vi-VN")} / {ln.capacity.toLocaleString("vi-VN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Nội dung Tab 3: Nhật ký thay đổi ───────────────────────────────────── */}
      {plan && viewTab === "changes" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h2 className="text-sm font-black text-slate-900">Nhật ký thay đổi kế hoạch</h2>
          {changes.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Chưa có thay đổi nào được ghi nhận</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {changes.map((ch) => (
                <div key={ch.id} className="py-2.5 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 mr-2">{CHANGE_LABEL[ch.action] ?? ch.action}</span>
                    {ch.reason && <span className="text-slate-600 italic">Lý do: &quot;{ch.reason}&quot;</span>}
                    {ch.order_id && <span className="block text-[11px] text-slate-500 font-mono">Đơn: {ch.order_code || ch.order_id}</span>}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Bởi <b>{ch.created_by}</b> · {fmtDMY(ch.created_at.slice(0, 10))} {ch.created_at.slice(11, 16)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Modal: Nhận đơn từ Kinh doanh (POST orders) ────────────────────────── */}
      {showNewOrder && (
        <NewOrderModal
          defaultSite={site}
          onClose={() => setShowNewOrder(false)}
          onSuccess={() => {
            setShowNewOrder(false);
            notify("ok", "Đã nhận đơn hàng mới thành công");
            load();
          }}
          notify={notify}
        />
      )}

      {/* ─── Modal: Phân bổ chuyền (Assign line) ─────────────────────────────────── */}
      {assignTarget && (
        <AssignLineModal
          target={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSave={handleSetLine}
          busy={actionBusy}
        />
      )}

      {/* ─── Modal: Dời tuần (Move week, bắt buộc lý do) ─────────────────────────── */}
      {moveTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
          <form onSubmit={handleMoveWeek} className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Dời tuần phân bổ: {moveTarget.orderCode}</h3>
              <button type="button" aria-label="Đóng" onClick={() => setMoveTarget(null)}><IconX size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Tuần hiện tại:</span>
                <span className="font-bold">{fmtDMY(moveTarget.fromWeek)}</span>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Dời sang tuần: *</label>
                <select className={`${field} w-full`} value={moveTargetWeek} onChange={(e) => setMoveTargetWeek(e.target.value)}>
                  {weeks.filter((w) => w !== moveTarget.fromWeek).map((w) => (
                    <option key={w} value={w}>{fmtDMY(w)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Lý do dời tuần (tối thiểu 5 ký tự): *</label>
                <textarea
                  className={`${field} w-full h-20 resize-none`}
                  placeholder="Nhập lý do dời tuần..."
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" className={btnGhost} onClick={() => setMoveTarget(null)}>Hủy</button>
              <button type="submit" className={btnPrimary} disabled={actionBusy || moveReason.trim().length < 5}>
                Xác nhận dời tuần
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Modal: Mở lại nháp (bắt buộc lý do) ─────────────────────────────────── */}
      {reopenModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
          <form onSubmit={handleReopen} className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Mở lại trạng thái Nháp</h3>
              <button type="button" aria-label="Đóng" onClick={() => setReopenModal(false)}><IconX size={18} /></button>
            </div>
            <div className="text-xs space-y-2">
              <p className="text-slate-600">Khi mở lại Nháp, kế hoạch có thể chỉnh sửa lại phân bổ chuyền của các tuần.</p>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Lý do mở lại (tối thiểu 5 ký tự): *</label>
                <textarea
                  className={`${field} w-full h-20 resize-none`}
                  placeholder="Nhập lý do mở lại nháp..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" className={btnGhost} onClick={() => setReopenModal(false)}>Hủy</button>
              <button type="submit" className={btnWarn} disabled={actionBusy || reopenReason.trim().length < 5}>
                Mở lại nháp
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Modal: Đổi ngày xuất ──────────────────────────────────────────────── */}
      {shipDateTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
          <form onSubmit={handleChangeShipDate} className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Đổi ngày xuất: {shipDateTarget.orderCode}</h3>
              <button type="button" aria-label="Đóng" onClick={() => setShipDateTarget(null)}><IconX size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Ngày xuất hiện tại:</span>
                <span className="font-bold">{fmtDMY(shipDateTarget.currentShipDate)}</span>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Ngày xuất mới: *</label>
                <input
                  type="date"
                  className={`${field} w-full`}
                  value={newShipDate}
                  onChange={(e) => setNewShipDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Lý do đổi ngày xuất: *</label>
                <textarea
                  className={`${field} w-full h-20 resize-none`}
                  placeholder="Ghi rõ lý do thay đổi ngày xuất..."
                  value={shipDateReason}
                  onChange={(e) => setShipDateReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" className={btnGhost} onClick={() => setShipDateTarget(null)}>Hủy</button>
              <button type="submit" className={btnPrimary} disabled={actionBusy || shipDateReason.trim().length < 3}>
                Cập nhật ngày xuất
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Modal phân bổ chuyền ───────────────────────────────────────────────────

function AssignLineModal({
  target,
  onClose,
  onSave,
  busy,
}: {
  target: { orderId: string; orderCode: string; week: string; current: PlanCell | null };
  onClose: () => void;
  onSave: (plant: string, line: string) => void;
  busy: boolean;
}) {
  const [plant, setPlant] = useState(target.current?.plant || "");
  const [line, setLine] = useState(target.current?.line || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(plant.trim(), line.trim());
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-sm font-bold text-slate-900">Phân bổ chuyền: {target.orderCode}</h3>
          <button type="button" aria-label="Đóng" onClick={onClose}><IconX size={18} /></button>
        </div>
        <p className="text-xs text-slate-500">Tuần bắt đầu: <b>{fmtDMY(target.week)}</b></p>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Nhà máy / Xưởng: *</label>
            <input
              className={`${field} w-full`}
              placeholder="VD: Nhà máy Kiên Giang 1"
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Chuyền sản xuất: *</label>
            <input
              className={`${field} w-full`}
              placeholder="VD: Chuyền 01"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          {target.current ? (
            <button
              type="button"
              className="text-xs text-red-600 font-bold hover:underline"
              onClick={() => onSave("", "")}
              disabled={busy}
            >
              Hủy phân bổ
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" className={btnGhost} onClick={onClose}>Đóng</button>
            <button type="submit" className={btnPrimary} disabled={busy || !plant.trim() || !line.trim()}>
              Lưu
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Modal nhận đơn từ Kinh doanh (POST /api/scm/orders) ─────────────────────

function NewOrderModal({
  defaultSite,
  onClose,
  onSuccess,
  notify,
}: {
  defaultSite: string;
  onClose: () => void;
  onSuccess: () => void;
  notify: Notify;
}) {
  const [code, setCode] = useState("");
  const [plant, setPlant] = useState("");
  const [line, setLine] = useState("");
  const [style, setStyle] = useState("");
  const [qty, setQty] = useState("5000");
  const [shipDate, setShipDate] = useState("");
  const [supplierLeadTime, setSupplierLeadTime] = useState("35");
  const [transportDays, setTransportDays] = useState("10");
  const [origin, setOrigin] = useState<"NOI_DIA" | "NHAP_KHAU">("NHAP_KHAU");
  const [noSilent, setNoSilent] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !shipDate) {
      notify("err", "Vui lòng điền mã đơn và ngày xuất hàng");
      return;
    }
    setBusy(true);
    try {
      await scmApi("orders", {
        method: "POST",
        body: {
          code: code.trim(),
          site: defaultSite,
          plant: plant.trim() || null,
          line: line.trim() || null,
          style: style.trim() || null,
          qty: parseInt(qty, 10) || 0,
          ship_date: shipDate,
          supplier_lead_time: parseInt(supplierLeadTime, 10) || 35,
          transport_days: parseInt(transportDays, 10) || 10,
          origin,
          no_silent: noSilent,
        },
      });
      onSuccess();
    } catch (err) {
      notify("err", (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-sm sm:text-base font-black text-slate-900">+ Nhận đơn hàng từ Kinh doanh</h3>
          <button type="button" aria-label="Đóng" onClick={onClose}><IconX size={18} /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Mã đơn hàng: *</label>
            <input className={`${field} w-full font-mono`} placeholder="VD: ORD-2026-001" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Mã hàng (Style):</label>
            <input className={`${field} w-full`} placeholder="VD: D-Lites 4.0" value={style} onChange={(e) => setStyle(e.target.value)} />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Số lượng (đôi): *</label>
            <input type="number" min="1" className={`${field} w-full`} value={qty} onChange={(e) => setQty(e.target.value)} required />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Ngày xuất hàng: *</label>
            <input type="date" className={`${field} w-full`} value={shipDate} onChange={(e) => setShipDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Nhà máy dự kiến:</label>
            <input className={`${field} w-full`} placeholder="VD: Nhà máy Kiên Giang 1" value={plant} onChange={(e) => setPlant(e.target.value)} />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Chuyền dự kiến:</label>
            <input className={`${field} w-full`} placeholder="VD: Chuyền 01" value={line} onChange={(e) => setLine(e.target.value)} />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Lead time NCC (ngày):</label>
            <input type="number" min="0" className={`${field} w-full`} value={supplierLeadTime} onChange={(e) => setSupplierLeadTime(e.target.value)} />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Thời gian vận chuyển (ngày):</label>
            <input type="number" min="0" className={`${field} w-full`} value={transportDays} onChange={(e) => setTransportDays(e.target.value)} />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Nguồn vật tư:</label>
            <select className={`${field} w-full`} value={origin} onChange={(e) => setOrigin(e.target.value as any)}>
              <option value="NHAP_KHAU">Nhập khẩu (kiểm tra 7 ngày)</option>
              <option value="NOI_DIA">Nội địa (kiểm tra 3 ngày)</option>
            </select>
          </div>
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input type="checkbox" checked={noSilent} onChange={(e) => setNoSilent(e.target.checked)} className="rounded text-[#006838] focus:ring-[#006838]" />
              Yêu cầu No Silent
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button type="button" className={btnGhost} onClick={onClose}>Hủy</button>
          <button type="submit" className={btnPrimary} disabled={busy}>
            Xác nhận tạo đơn
          </button>
        </div>
      </form>
    </div>
  );
}

/** Nhóm chi tiết chuyền theo nhà máy cho kế hoạch Tầng 2 */
function groupByPlant(lines: WeekLoad["lines"]): { plant: string; lines: WeekLoad["lines"] }[] {
  const map = new Map<string, WeekLoad["lines"]>();
  for (const l of lines) map.set(l.plant, [...(map.get(l.plant) ?? []), l]);
  return Array.from(map, ([plant, ls]) => ({ plant, lines: ls }));
}

/** Tên hiển thị của thao tác trong nhật ký kế hoạch */
const CHANGE_LABEL: Record<string, string> = {
  SET_LINE: "Phân bổ chuyền",
  CLEAR_LINE: "Bỏ phân bổ",
  MOVE_WEEK: "Dời tuần",
  SET_CAPACITY: "Đổi năng lực",
  SUBMIT: "Gửi duyệt",
  APPROVE: "Phê duyệt",
  REOPEN: "Mở lại nháp",
  ISSUE: "Ban hành Kế hoạch 312",
  TIER2: "Chuyển Tầng 2",
  ROLL_FORWARD: "Thêm tuần mới",
};
