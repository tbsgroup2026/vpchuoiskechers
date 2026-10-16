"use client";

// Màn hình "Mua hàng" (spec mục 4.3)
// Quản lý điều kiện đặt hàng, phát hành PO, kế hoạch nhập 4 tuần, upload form và xử lý sự cố NCC.

import React, { useCallback, useEffect, useState } from "react";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowLeft,
  IconCalculator,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconDownload,
  IconExclamationMark,
  IconFileText,
  IconFlag,
  IconPlus,
  IconRefresh,
  IconSend,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { DEFAULT_SETTINGS, SITES } from "./config";
import { addDays, diffDays, fmtDMY, infoDeadline, infoDeadlineFormula } from "./engine";
import {
  scmApi,
  type ConditionItem,
  type ConditionsResponse,
  type FormsResponse,
  type InboundResponse,
  type InboundRow,
  type IncidentItem,
  type IncidentsResponse,
  type ScmMe,
  type UploadedFormItem,
} from "./client";
import { INCIDENT_PLANS, type IncidentPlan, type IncidentStage } from "./purchasing";
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
}

export default function ScmPurchasing({ me, site, onBack, notify }: Props) {
  // Tabs: "conditions" | "inbound" | "incidents"
  const [activeTab, setActiveTab] = useState<"conditions" | "inbound" | "incidents">("conditions");

  // 1. Điều kiện đặt hàng state
  const [condData, setCondData] = useState<ConditionsResponse | null>(null);
  const [condLoading, setCondLoading] = useState(true);
  const [condFilter, setCondFilter] = useState<"" | "ready" | "missing" | "issued">("");
  const [condQInput, setCondQInput] = useState("");
  const [condQ, setCondQ] = useState("");
  const [condPage, setCondPage] = useState(1);

  // 2. Kế hoạch nhập hàng state
  const [inbData, setInbData] = useState<InboundResponse | null>(null);
  const [inbLoading, setInbLoading] = useState(false);

  // 3. Sự cố NCC state
  const [incData, setIncData] = useState<IncidentsResponse | null>(null);
  const [incLoading, setIncLoading] = useState(false);
  const [incStatus, setIncStatus] = useState<"all" | "open" | "closed">("open");

  // 4. Forms state
  const [showFormsModal, setShowFormsModal] = useState(false);
  const [formsList, setFormsList] = useState<UploadedFormItem[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);

  // 5. Calculator state
  const [showCalc, setShowCalc] = useState(false);
  const [calcShipDate, setCalcShipDate] = useState("");
  const [calcLeadTime, setCalcLeadTime] = useState(35);
  const [calcTransport, setCalcTransport] = useState(10);
  const [showApplyDeadline, setShowApplyDeadline] = useState(false);
  const [applyOrderTarget, setApplyOrderTarget] = useState<ConditionItem | null>(null);

  // 6. Action modals
  const [etaModalTarget, setEtaModalTarget] = useState<InboundRow | null>(null);
  const [newEta, setNewEta] = useState("");
  const [etaReason, setEtaReason] = useState("");
  const [newIncModal, setNewIncModal] = useState(false);
  const [incOrderTarget, setIncOrderTarget] = useState("");
  const [incMaterial, setIncMaterial] = useState("");
  const [incIssue, setIncIssue] = useState("");

  const [busy, setBusy] = useState(false);

  const canEdit = me.access.purchasing === "edit";

  // ─── Tải dữ liệu Điều kiện đặt hàng ─────────────────────────────────────────
  const loadConditions = useCallback(async () => {
    setCondLoading(true);
    try {
      const qs = new URLSearchParams({
        site,
        q: condQ,
        status: condFilter,
        page: String(condPage),
        pageSize: "10",
      }).toString();
      const res = await scmApi<ConditionsResponse>(`purchasing/conditions?${qs}`);
      setCondData(res);
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setCondLoading(false);
    }
  }, [site, condQ, condFilter, condPage, notify]);

  // ─── Tải dữ liệu Kế hoạch nhập hàng ─────────────────────────────────────────
  const loadInbound = useCallback(async () => {
    setInbLoading(true);
    try {
      const res = await scmApi<InboundResponse>(`purchasing/inbound?site=${site}`);
      setInbData(res);
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setInbLoading(false);
    }
  }, [site, notify]);

  // ─── Tải dữ liệu Sự cố NCC ──────────────────────────────────────────────────
  const loadIncidents = useCallback(async () => {
    setIncLoading(true);
    try {
      const qs = new URLSearchParams({
        site,
        status: incStatus === "all" ? "" : incStatus,
      }).toString();
      const res = await scmApi<IncidentsResponse>(`purchasing/incidents?${qs}`);
      setIncData(res);
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setIncLoading(false);
    }
  }, [site, incStatus, notify]);

  // ─── Tải danh sách Forms từ R2 ──────────────────────────────────────────────
  const loadForms = useCallback(async () => {
    setFormsLoading(true);
    try {
      const res = await scmApi<FormsResponse>("forms");
      setFormsList(res.items || []);
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setFormsLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadConditions(); }, [loadConditions]);
  useEffect(() => { if (activeTab === "inbound") loadInbound(); }, [activeTab, loadInbound]);
  useEffect(() => { if (activeTab === "incidents") loadIncidents(); }, [activeTab, loadIncidents]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setCondQ(condQInput.trim());
      setCondPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [condQInput]);

  // ─── Xử lý Điều kiện đặt hàng ───────────────────────────────────────────────
  const handleActivate = async (orderId: string, orderCode: string) => {
    setBusy(true);
    try {
      await scmApi(`purchasing/orders/${encodeURIComponent(orderId)}/activate`, { method: "POST" });
      notify("ok", `Đã kích hoạt đặt hàng cho đơn ${orderCode}`);
      loadConditions();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleIssuePo = async (orderId: string, orderCode: string) => {
    setBusy(true);
    try {
      const res = await scmApi<{ success: boolean; poNo: string; eta: string | null }>(`purchasing/orders/${encodeURIComponent(orderId)}/issue-po`, { method: "POST" });
      notify("ok", `Đã phát hành số ${res.poNo} cho đơn ${orderCode} (hoàn thành bước 6)`);
      loadConditions();
      if (activeTab === "inbound") loadInbound();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleReportBottleneck = async (orderId: string, orderCode: string) => {
    setBusy(true);
    try {
      const res = await scmApi<{ success: boolean; note: string; notified: number }>(`purchasing/orders/${encodeURIComponent(orderId)}/report-bottleneck`, { method: "POST" });
      notify("ok", `Đã ghi nhận điểm nghẽn và gửi thông báo tới ${res.notified} nhân sự liên quan`);
      loadConditions();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // ─── Xử lý Kế hoạch nhập hàng ───────────────────────────────────────────────
  const handleSendInboundToWh = async () => {
    setBusy(true);
    try {
      const res = await scmApi<{ success: boolean; completedSteps: number; notified: number }>(`purchasing/inbound/send`, {
        method: "POST",
        body: { site },
      });
      notify("ok", `Đã gửi kế hoạch nhập 4 tuần cho Kho (xác nhận bước 7 cho ${res.completedSteps} đơn)`);
      loadInbound();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleChangeEta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!etaModalTarget || !newEta || etaReason.trim().length < 3) return;
    setBusy(true);
    try {
      const res = await scmApi<{ success: boolean; impact: { readyBy: string; slackDays: number; late: boolean } }>(
        `purchasing/orders/${encodeURIComponent(etaModalTarget.orderId)}/eta`,
        { method: "PUT", body: { eta: newEta, reason: etaReason.trim() } }
      );
      if (res.impact.late) {
        notify("err", `Đã cập nhật ETA mới. CẢNH BÁO: Hàng trễ ${-res.impact.slackDays} ngày so với hạn cấp vật tư! Đã thông báo Kế hoạch.`);
      } else {
        notify("ok", `Đã cập nhật ETA mới (dư ${res.impact.slackDays} ngày so với hạn cấp vật tư)`);
      }
      setEtaModalTarget(null);
      setNewEta("");
      setEtaReason("");
      loadInbound();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // ─── Xử lý Sự cố NCC ────────────────────────────────────────────────────────
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incOrderTarget || !incMaterial.trim() || incIssue.trim().length < 5) return;
    setBusy(true);
    try {
      await scmApi("purchasing/incidents", {
        method: "POST",
        body: { orderId: incOrderTarget, material: incMaterial.trim(), issue: incIssue.trim() },
      });
      notify("ok", "Đã ghi nhận sự cố vật tư không đạt");
      setNewIncModal(false);
      setIncOrderTarget("");
      setIncMaterial("");
      setIncIssue("");
      loadIncidents();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateIncidentPlan = async (incId: string, plan: IncidentPlan) => {
    setBusy(true);
    try {
      await scmApi(`purchasing/incidents/${encodeURIComponent(incId)}`, {
        method: "PUT",
        body: { plan },
      });
      notify("ok", `Đã ghi nhận phương án: ${INCIDENT_PLANS[plan]}`);
      loadIncidents();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleNextIncidentStage = async (incId: string) => {
    setBusy(true);
    try {
      await scmApi(`purchasing/incidents/${encodeURIComponent(incId)}/next`, { method: "POST" });
      notify("ok", "Đã chuyển giai đoạn xử lý sự cố");
      loadIncidents();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleEscalateIncident = async (incId: string) => {
    setBusy(true);
    try {
      const res = await scmApi<{ success: boolean; level: number; notified: number }>(`purchasing/incidents/${encodeURIComponent(incId)}/escalate`, { method: "POST" });
      notify("ok", `Đã leo thang cấp ${res.level} (đã gửi thông báo tới ${res.notified} lãnh đạo)`);
      loadIncidents();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // ─── Xử lý Upload Form ──────────────────────────────────────────────────────
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setBusy(true);
    try {
      const res = await fetch("/api/scm/forms", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || json.error || "Lỗi tải file");
      notify("ok", `Đã tải lên file "${file.name}" thành công`);
      loadForms();
    } catch (err) {
      notify("err", (err as Error).message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  // ─── Xử lý Áp hạn chót cho đơn ───────────────────────────────────────────────
  const handleApplyDeadline = async (orderId: string) => {
    setBusy(true);
    try {
      await scmApi(`purchasing/orders/${encodeURIComponent(orderId)}/lead-time`, {
        method: "PUT",
        body: { supplier_lead_time: calcLeadTime, transport_days: calcTransport },
      });
      notify("ok", "Đã áp hạn chót mới cho đơn hàng thành công");
      setShowApplyDeadline(false);
      setApplyOrderTarget(null);
      loadConditions();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const calcFormulaText = infoDeadlineFormula(calcLeadTime, calcTransport, DEFAULT_SETTINGS);
  const calculatedDeadline = calcShipDate ? infoDeadline(calcShipDate, calcLeadTime, calcTransport, DEFAULT_SETTINGS) : null;

  const counts = condData?.counts || { ready: 0, missing: 0, issued: 0 };
  const condItems = condData?.items || [];
  const condPages = condData?.total ? Math.max(1, Math.ceil(condData.total / condData.pageSize)) : 1;

  return (
    <div className="space-y-5 pb-10">
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#006838]">
            <IconArrowLeft size={16} /> Tổng quan
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Mua Hàng</h1>
          <p className="text-xs text-slate-500 font-medium">
            Điều kiện đặt hàng, phát hành PO, kế hoạch nhập hàng 4 tuần và xử lý sự cố NCC.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnGhost}
            onClick={() => setShowCalc(!showCalc)}
          >
            <IconCalculator size={16} /> Công cụ tính hạn chót
          </button>
          {/* Nút Tải form lên bắt buộc có id="tai-form" */}
          <button
            type="button"
            id="tai-form"
            className={btnPrimary}
            onClick={() => {
              setShowFormsModal(true);
              loadForms();
            }}
          >
            <IconUpload size={16} /> Tải form lên
          </button>
        </div>
      </div>

      {/* ─── Công cụ tính hạn chót (Collapsible) ─────────────────────────────────── */}
      {showCalc && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-black text-[#006838]">
              <IconCalculator size={18} />
              <span>Công cụ tính hạn chót giao thông tin (KD/CN)</span>
            </div>
            <button type="button" aria-label="Đóng" onClick={() => setShowCalc(false)} className="text-slate-400 hover:text-slate-600">
              <IconX size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ngày xuất hàng dự kiến:</label>
              <input
                type="date"
                className={`${field} w-full`}
                value={calcShipDate}
                onChange={(e) => setCalcShipDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Lead time NCC (ngày):</label>
              <input
                type="number"
                min="0"
                className={`${field} w-full`}
                value={calcLeadTime}
                onChange={(e) => setCalcLeadTime(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Thời gian vận chuyển (ngày):</label>
              <input
                type="number"
                min="0"
                className={`${field} w-full`}
                value={calcTransport}
                onChange={(e) => setCalcTransport(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-emerald-100/80">
            <div className="space-y-0.5 text-xs text-slate-700">
              <span className="font-mono text-emerald-900 font-bold block">{calcFormulaText}</span>
              {calculatedDeadline ? (
                <span className="text-xs">
                  Kết quả hạn chót: <b className="text-emerald-900 font-black">{fmtDMY(calculatedDeadline)}</b> (trước ngày xuất {calcLeadTime + calcTransport + 33} ngày)
                </span>
              ) : (
                <span className="text-slate-400 italic">Chọn ngày xuất để hiển thị kết quả ngày hạn chót</span>
              )}
            </div>
            {canEdit && (
              <button
                type="button"
                className={btnPrimary}
                onClick={() => setShowApplyDeadline(true)}
              >
                Áp hạn chót cho đơn
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Tabs chuyển đổi 3 khối chính ───────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("conditions")}
          className={`pb-2.5 transition border-b-2 ${activeTab === "conditions" ? "border-[#006838] text-[#006838]" : "border-transparent text-slate-500 hover:text-slate-900"}`}
        >
          Điều kiện đặt hàng ({condData?.total || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("inbound")}
          className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${activeTab === "inbound" ? "border-[#006838] text-[#006838]" : "border-transparent text-slate-500 hover:text-slate-900"}`}
        >
          Kế hoạch nhập 4 tuần
          {inbData?.unsent ? (
            <span className="rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.2 font-black">
              {inbData.unsent}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("incidents")}
          className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${activeTab === "incidents" ? "border-[#006838] text-[#006838]" : "border-transparent text-slate-500 hover:text-slate-900"}`}
        >
          Sự cố NCC ({incData?.items?.filter((i) => i.stage !== "CLOSED").length || 0})
        </button>
      </div>

      {/* ─── TAB 1: BẢNG KIỂM TRA ĐIỀU KIỆN ĐẶT HÀNG ──────────────────────────── */}
      {activeTab === "conditions" && (
        <div className="space-y-4">
          {/* Thanh lọc & tìm kiếm */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${field} w-60`}
                placeholder="Tìm mã đơn, PO, nhà máy..."
                value={condQInput}
                onChange={(e) => setCondQInput(e.target.value)}
              />
              <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-bold">
                {[
                  { key: "", label: `Tất cả (${(counts.ready || 0) + (counts.missing || 0) + (counts.issued || 0)})` },
                  { key: "ready", label: `Đủ điều kiện (${counts.ready})` },
                  { key: "missing", label: `Thiếu điều kiện (${counts.missing})` },
                  { key: "issued", label: `Đã có PO (${counts.issued})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => { setCondFilter(f.key as any); setCondPage(1); }}
                    className={`rounded-lg px-2.5 py-1.5 transition ${condFilter === f.key ? "bg-[#006838] text-white" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className={btnGhost} onClick={loadConditions} disabled={condLoading}>
              <IconRefresh size={15} /> Làm mới
            </button>
          </div>

          {/* Bảng điều kiện đặt hàng (Desktop) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full min-w-[1020px] text-xs">
              <thead className="bg-slate-50 text-left font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3">Mã đơn / PO</th>
                  <th className="px-3 py-3">Nhà máy</th>
                  <th className="px-3 py-3 text-right">Số lượng</th>
                  <th className="px-3 py-3">Ngày xuất</th>
                  <th className="px-3 py-3 text-center">BOM</th>
                  <th className="px-3 py-3 text-center">Wink</th>
                  <th className="px-3 py-3 text-center">Giày mẫu</th>
                  <th className="px-3 py-3 text-center">No Silent</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {condItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Không có đơn hàng nào khớp với điều kiện lọc
                    </td>
                  </tr>
                ) : (
                  condItems.map((o) => {
                    const isIssued = o.status === "issued";
                    const isActivated = o.status === "activated";
                    const isReady = o.status === "ready";
                    const isMissing = o.status === "missing";

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5">
                          <span className="font-mono font-bold text-slate-900 block">{o.code}</span>
                          {o.poNo ? (
                            <span className="font-mono font-bold text-[#006838] text-[11px] block">{o.poNo}</span>
                          ) : null}
                          {o.bottleneck && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 border border-amber-200 mt-0.5">
                              {o.bottleneck}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">{o.plant || "-"}</td>
                        <td className="px-3 py-2.5 text-right font-bold tabular-nums">{o.qty.toLocaleString("vi-VN")}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{fmtDMY(o.shipDate)}</td>

                        {/* BOM, Wink, Giày mẫu (Kinh doanh bàn giao) */}
                        {o.items.map((it) => (
                          <td key={it.key} className="px-3 py-2.5 text-center">
                            {it.ok ? (
                              <span className="inline-flex text-emerald-600" title={`${it.label}: ${it.at ? fmtDMY(it.at.slice(0, 10)) : "đã có"}`} aria-label={`${it.label} đã có`}><IconCheck size={16} /></span>
                            ) : (
                              <span className="inline-flex text-red-500" title={`Chưa có ${it.label}`} aria-label={`Chưa có ${it.label}`}><IconX size={16} /></span>
                            )}
                          </td>
                        ))}

                        {/* No Silent */}
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {!o.noSilent.required ? (
                            <span className="text-slate-400 text-[11px]">Không yêu cầu</span>
                          ) : o.noSilent.at ? (
                            <span
                              className={`inline-flex items-center gap-1 font-bold text-[11px] ${o.noSilent.overdue ? "text-red-700" : "text-emerald-700"}`}
                              title={`Bàn giao No Silent ${fmtDMY(o.noSilent.at)}`}
                            >
                              {o.noSilent.overdue ? <IconAlertTriangle size={14} /> : <IconCheck size={14} />}
                              {isIssued ? fmtDMY(o.noSilent.at) : `Ngày ${o.noSilent.day}/${o.noSilent.of}`}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold text-[11px]">Chưa có</span>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {isIssued ? (
                            <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold">
                              Đã phát hành PO
                            </span>
                          ) : isActivated ? (
                            <span className="rounded-full bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 text-[11px] font-bold">
                              Đã kích hoạt
                            </span>
                          ) : isReady ? (
                            <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold">
                              Đủ điều kiện
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-50 text-red-800 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold">
                              Thiếu: {o.missing.map((m) => m.label).join(", ")}
                            </span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          {canEdit && (
                            <div className="inline-flex items-center gap-1.5">
                              {isReady && (
                                <button
                                  type="button"
                                  className={btnPrimary}
                                  onClick={() => handleActivate(o.id, o.code)}
                                  disabled={busy}
                                >
                                  Kích hoạt đặt hàng
                                </button>
                              )}
                              {isActivated && (
                                <button
                                  type="button"
                                  className={btnPrimary}
                                  onClick={() => handleIssuePo(o.id, o.code)}
                                  disabled={busy}
                                >
                                  Phát hành PO
                                </button>
                              )}
                              {isMissing && (
                                <button
                                  type="button"
                                  className={btnWarn}
                                  onClick={() => handleReportBottleneck(o.id, o.code)}
                                  disabled={busy}
                                  title="Gửi thông báo điểm nghẽn cho Kinh doanh / Kế hoạch"
                                >
                                  <IconFlag size={14} /> Báo điểm nghẽn
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Danh sách dạng thẻ (điện thoại) */}
          <div className="md:hidden space-y-2.5">
            {condItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-400">Không có đơn hàng nào khớp với điều kiện lọc</p>
            ) : (
              condItems.map((o) => (
                <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-slate-900 whitespace-nowrap">{o.code}</p>
                      {o.poNo && <p className="font-mono text-[11px] font-bold text-[#006838]">{o.poNo}</p>}
                      <p className="text-[11px] text-slate-500">{o.plant || "-"} · {o.qty.toLocaleString("vi-VN")} đôi · xuất {fmtDMY(o.shipDate)}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                        o.status === "missing" ? "border-red-200 bg-red-50 text-red-800" : o.status === "activated" ? "border-sky-200 bg-sky-50 text-sky-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {o.status === "issued" ? "Đã phát hành PO" : o.status === "activated" ? "Đã kích hoạt" : o.status === "ready" ? "Đủ điều kiện" : "Thiếu điều kiện"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {o.items.map((it) => (
                      <span key={it.key} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${it.ok ? "border-emerald-200 text-emerald-700" : "border-red-300 border-dashed text-red-700"}`}>
                        {it.ok ? <IconCheck size={12} /> : <IconX size={12} />} {it.label}
                      </span>
                    ))}
                    {o.noSilent.required && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${!o.noSilent.at ? "border-dashed border-amber-300 text-amber-800" : o.noSilent.overdue ? "border-red-300 text-red-700" : "border-emerald-200 text-emerald-700"}`}>
                        No Silent {o.noSilent.at ? (o.status === "issued" ? fmtDMY(o.noSilent.at) : `ngày ${o.noSilent.day}/${o.noSilent.of}`) : "chưa có"}
                      </span>
                    )}
                  </div>
                  {o.missing.length > 0 && (
                    <p className="text-[11px] text-red-700">Thiếu: {o.missing.map((m) => `${m.label} (${m.dept})`).join(", ")}</p>
                  )}
                  {o.bottleneck && <p className="text-[11px] font-semibold text-amber-800">{o.bottleneck}</p>}
                  {canEdit && o.status !== "issued" && (
                    <div className="flex flex-wrap gap-1.5">
                      {o.status === "ready" && (
                        <button type="button" className={btnPrimary} onClick={() => handleActivate(o.id, o.code)} disabled={busy}>Kích hoạt đặt hàng</button>
                      )}
                      {o.status === "activated" && (
                        <button type="button" className={btnPrimary} onClick={() => handleIssuePo(o.id, o.code)} disabled={busy}>Phát hành PO</button>
                      )}
                      {o.status === "missing" && (
                        <button type="button" className={btnWarn} onClick={() => handleReportBottleneck(o.id, o.code)} disabled={busy}>
                          <IconFlag size={14} /> Báo điểm nghẽn
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Phân trang */}
          {condPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-slate-500">Trang {condPage}/{condPages}</span>
              <div className="flex gap-1">
                <button type="button" className={btnGhost} disabled={condPage <= 1} onClick={() => setCondPage((p) => p - 1)}><IconChevronLeft size={16} /></button>
                <button type="button" className={btnGhost} disabled={condPage >= condPages} onClick={() => setCondPage((p) => p + 1)}><IconChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: KẾ HOẠCH DỰ KIẾN NHẬP HÀNG 4 TUẦN ─────────────────────────── */}
      {activeTab === "inbound" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h2 className="text-sm font-black text-slate-900">Kế hoạch nhập hàng tự tổng hợp từ PO (4 tuần tới)</h2>
              <p className="text-xs text-slate-500">Được lập tự động từ ngày phát hành PO, lead time NCC và thời gian vận chuyển.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className={btnGhost} onClick={loadInbound} disabled={inbLoading}><IconRefresh size={15} /> Làm mới</button>
              {canEdit && (
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={handleSendInboundToWh}
                  disabled={busy || !inbData?.rows.length}
                >
                  <IconSend size={15} /> Gửi kế hoạch cho Kho (thứ Ba)
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full min-w-[960px] text-xs">
              <thead className="bg-slate-50 text-left font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3">Mã đơn hàng</th>
                  <th className="px-3 py-3 font-mono">Số PO</th>
                  <th className="px-3 py-3">Ngày về dự kiến (ETA)</th>
                  <th className="px-3 py-3">Tuần dự kiến</th>
                  <th className="px-3 py-3">Hạn cấp vật tư</th>
                  <th className="px-3 py-3">Ảnh hưởng tiến độ</th>
                  <th className="px-3 py-3">Đã gửi Kho</th>
                  <th className="px-3 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!inbData || inbData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Chưa có đơn hàng nào có PO dự kiến về trong 4 tuần tới
                    </td>
                  </tr>
                ) : (
                  inbData.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2.5 font-bold font-mono text-slate-900">{r.code}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#006838]">{r.poNo || "-"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="font-bold">{fmtDMY(r.eta)}</span>
                        {r.etaChangedFrom && (
                          <span className="block text-[10px] text-slate-400 line-through">
                            Cũ: {fmtDMY(r.etaChangedFrom)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{r.week ? `Tuần ${fmtDMY(r.week)}` : "-"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">{fmtDMY(r.supplyDeadline)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {r.impact ? (
                          r.impact.late ? (
                            <span className="rounded-md bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 font-bold">
                              Trễ {-r.impact.slackDays} ngày
                            </span>
                          ) : (
                            <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 font-bold">
                              Dư {r.impact.slackDays} ngày
                            </span>
                          )
                        ) : "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.sentAt ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <IconCheck size={14} /> {fmtDMY(r.sentAt)}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold">Chưa gửi</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {canEdit && (
                          <button
                            type="button"
                            className={btnGhost}
                            onClick={() => {
                              setEtaModalTarget(r);
                              setNewEta(r.eta || "");
                            }}
                          >
                            NCC báo đổi ngày
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: XỬ LÝ SỰ CỐ VẬT TƯ KHÔNG ĐẠT (NCC) ───────────────────────── */}
      {activeTab === "incidents" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <select className={field} value={incStatus} onChange={(e) => setIncStatus(e.target.value as any)}>
                <option value="open">Đang xử lý (chưa đóng)</option>
                <option value="closed">Đã đóng</option>
                <option value="all">Tất cả sự cố</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" className={btnGhost} onClick={loadIncidents} disabled={incLoading}><IconRefresh size={15} /> Làm mới</button>
              {canEdit && (
                <button type="button" className={btnPrimary} onClick={() => setNewIncModal(true)}>
                  <IconPlus size={16} /> + Ghi nhận sự cố
                </button>
              )}
            </div>
          </div>

          {/* Danh sách thẻ sự cố */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!incData || incData.items.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
                Không có sự cố nào trong danh sách
              </div>
            ) : (
              incData.items.map((inc) => {
                const isClosed = inc.stage === "CLOSED";
                const isOverdue = inc.overdue;
                const canEscalate = inc.canEscalate;

                return (
                  <div key={inc.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">{inc.orderCode}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                            isClosed ? "bg-slate-100 text-slate-600 border-slate-200" :
                            inc.stage === "AWAIT_CONFIRM" ? "bg-amber-50 text-amber-900 border-amber-300" :
                            "bg-sky-50 text-sky-900 border-sky-300"
                          }`}>
                            {inc.stage === "CONTACT" ? "1. Liên hệ NCC" :
                             inc.stage === "PLAN" ? "2. Ghi phương án" :
                             inc.stage === "AWAIT_CONFIRM" ? "3. Chờ Kho/QC xác nhận" : "4. Đã đóng"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Vật tư: <b>{inc.material}</b></p>
                      </div>
                      <div className="text-right">
                        <span className={`font-black text-xs tabular-nums block ${isOverdue ? "text-red-600 font-extrabold" : "text-slate-700"}`}>
                          Ngày {inc.day}/{inc.of}
                        </span>
                        {inc.escalation > 0 && (
                          <span className="rounded bg-red-600 text-white text-[9px] px-1.5 py-0.2 font-bold inline-block mt-0.5">
                            Leo thang Cấp {inc.escalation}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                      <p><b>Vấn đề:</b> {inc.issue}</p>
                      {inc.plan && <p><b>Phương án:</b> <span className="font-bold text-[#006838]">{INCIDENT_PLANS[inc.plan as IncidentPlan] || inc.plan}</span></p>}
                      {inc.note && <p><b>Ghi chú:</b> {inc.note}</p>}
                      {inc.confirmed_at && (
                        <p className="text-emerald-700 font-bold flex items-center gap-1 pt-1 border-t border-slate-200">
                          <IconCheck size={14} /> Đã được Kho/QC xác nhận ngày {fmtDMY(inc.confirmed_at)}
                        </p>
                      )}
                    </div>

                    {/* Vùng thao tác cho phòng Mua hàng */}
                    {canEdit && !isClosed && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        {/* Nếu ở bước ghi phương án -> cho chọn dropdown */}
                        {inc.stage === "PLAN" && (
                          <select
                            className={`${field} py-1 text-xs`}
                            value={inc.plan || ""}
                            onChange={(e) => handleUpdateIncidentPlan(inc.id, e.target.value as IncidentPlan)}
                          >
                            <option value="">-- Chọn phương án --</option>
                            {Object.entries(INCIDENT_PLANS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          {canEscalate && (
                            <button
                              type="button"
                              className={btnWarn}
                              onClick={() => handleEscalateIncident(inc.id)}
                              disabled={busy}
                            >
                              <IconFlag size={14} /> Leo thang
                            </button>
                          )}
                          <button
                            type="button"
                            className={btnPrimary}
                            onClick={() => handleNextIncidentStage(inc.id)}
                            disabled={busy}
                          >
                            {inc.stage === "AWAIT_CONFIRM" ? "Đóng sự cố" : "Bước tiếp theo →"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL TẢI FORM LÊN (R2 STORAGE) ──────────────────────────────────── */}
      {showFormsModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-slate-900">Quản lý Form Mua Hàng</h3>
                <p className="text-xs text-slate-500">Lưu trữ trên R2 (.xlsx, .xls, .csv, .pdf, .docx ≤ 10MB)</p>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setShowFormsModal(false)}><IconX size={18} /></button>
            </div>

            {/* Vùng upload file */}
            {canEdit && (
              <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-5 text-center space-y-2">
                <IconUpload size={24} className="mx-auto text-[#006838]" />
                <p className="text-xs font-bold text-slate-700">Chọn file từ máy tính để tải lên hệ thống</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.docx"
                  onChange={handleUploadFile}
                  disabled={busy}
                  className="block mx-auto text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#006838] file:text-white hover:file:bg-[#00522c] cursor-pointer"
                />
              </div>
            )}

            {/* Danh sách form đã tải */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Danh sách form đã lưu ({formsList.length}):</h4>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
                {formsList.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">Chưa có form nào được tải lên</p>
                ) : (
                  formsList.map((f) => (
                    <div key={f.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-800 truncate block">{f.file_name}</span>
                        <span className="text-[10px] text-slate-400">
                          {(f.size / 1024).toFixed(1)} KB · Bởi {f.uploaded_by} · {f.uploaded_at}
                        </span>
                      </div>
                      <a
                        href={`/api/scm/forms/${encodeURIComponent(f.id)}/download`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 flex-shrink-0"
                        download
                      >
                        <IconDownload size={13} /> Tải về
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button type="button" className={btnGhost} onClick={() => setShowFormsModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ÁP HẠN CHÓT CHO ĐƠN ────────────────────────────────────────── */}
      {showApplyDeadline && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Áp hạn chót cho đơn hàng</h3>
              <button type="button" aria-label="Đóng" onClick={() => setShowApplyDeadline(false)}><IconX size={18} /></button>
            </div>
            <p className="text-xs text-slate-600">
              Hệ thống sẽ cập nhật lead time NCC = <b>{calcLeadTime} ngày</b> và vận chuyển = <b>{calcTransport} ngày</b> cho đơn được chọn:
            </p>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border rounded-xl text-xs">
              {condItems.map((o) => (
                <div key={o.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-mono font-bold block">{o.code}</span>
                    <span className="text-slate-400 text-[10px]">Xuất {fmtDMY(o.shipDate)} · Hiện tại {o.supplierLeadTime} + {o.transportDays} ngày</span>
                  </div>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => handleApplyDeadline(o.id)}
                    disabled={busy}
                  >
                    Áp dụng
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t">
              <button type="button" className={btnGhost} onClick={() => setShowApplyDeadline(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL NCC ĐỔI NGÀY VỀ (ETA) ────────────────────────────────────────── */}
      {etaModalTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
          <form onSubmit={handleChangeEta} className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">NCC báo đổi ngày về (ETA): {etaModalTarget.code}</h3>
              <button type="button" aria-label="Đóng" onClick={() => setEtaModalTarget(null)}><IconX size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Hạn cấp vật tư cho đơn:</span>
                <span className="font-bold text-slate-900">{fmtDMY(etaModalTarget.supplyDeadline)}</span>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Ngày hàng về mới (ETA): *</label>
                <input
                  type="date"
                  className={`${field} w-full`}
                  value={newEta}
                  onChange={(e) => setNewEta(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Lý do NCC đổi ngày: *</label>
                <textarea
                  className={`${field} w-full h-20 resize-none`}
                  placeholder="Ghi rõ lý do NCC thông báo dời ngày..."
                  value={etaReason}
                  onChange={(e) => setEtaReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" className={btnGhost} onClick={() => setEtaModalTarget(null)}>Hủy</button>
              <button type="submit" className={btnPrimary} disabled={busy || !newEta || etaReason.trim().length < 3}>
                Cập nhật ETA
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL GHI NHẬN SỰ CỐ NCC MỚI ──────────────────────────────────────── */}
      {newIncModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40">
          <form onSubmit={handleCreateIncident} className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">+ Ghi nhận sự cố vật tư không đạt</h3>
              <button type="button" aria-label="Đóng" onClick={() => setNewIncModal(false)}><IconX size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Đơn hàng liên quan: *</label>
                <select
                  className={`${field} w-full`}
                  value={incOrderTarget}
                  onChange={(e) => setIncOrderTarget(e.target.value)}
                  required
                >
                  <option value="">-- Chọn đơn hàng --</option>
                  {condItems.map((o) => (
                    <option key={o.id} value={o.id}>{o.code} {o.poNo ? `(${o.poNo})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Tên vật tư: *</label>
                <input
                  className={`${field} w-full`}
                  placeholder="VD: Da PU Upper, Đế ngoài Eva..."
                  value={incMaterial}
                  onChange={(e) => setIncMaterial(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mô tả sự cố (tối thiểu 5 ký tự): *</label>
                <textarea
                  className={`${field} w-full h-24 resize-none`}
                  placeholder="Mô tả chi tiết lỗi vật tư không đạt tiêu chuẩn..."
                  value={incIssue}
                  onChange={(e) => setIncIssue(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" className={btnGhost} onClick={() => setNewIncModal(false)}>Hủy</button>
              <button type="submit" className={btnPrimary} disabled={busy || !incOrderTarget || !incMaterial.trim() || incIssue.trim().length < 5}>
                Ghi nhận sự cố
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
