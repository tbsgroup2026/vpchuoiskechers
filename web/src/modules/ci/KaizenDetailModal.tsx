"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IconX,
  IconTrophy,
  IconStar,
  IconThumbUp,
  IconPhoto,
  IconAward,
  IconEditCircle,
  IconTrash,
  IconAlertCircle,
  IconCheck,
  IconLock,
  IconDeviceFloppy,
  IconReload,
  IconUserCheck,
  IconChevronRight,
  IconBuilding,
  IconCalendar,
  IconInfoCircle,
  IconMessages,
  IconSend,
  IconShieldCheck,
  IconAlertTriangle,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react";
import { convertNumberToWords } from "@/lib/numberToWords";
import { KaizenProposal } from "./CIModule";
import { usePermission } from "@/hooks/usePermission";
import FeasibilityApprovalModal from "./FeasibilityApprovalModal";

interface KaizenDetailModalProps {
  proposal: KaizenProposal;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEvaluate: () => void;
  onRate: () => void;
}

const CATEGORIES = [
  { id: "MATERIAL_SAVING", label: "1.Tiết kiệm Vật tư", color: "bg-blue-600 text-white" },
  { id: "COST_SAVING", label: "2.Tiết kiệm Chi phí", color: "bg-emerald-600 text-white" },
  { id: "PRODUCTIVITY", label: "3.Tăng Năng suất", color: "bg-blue-500 text-white" },
  { id: "SAFETY", label: "4.An toàn lao động", color: "bg-[#006838] text-white" },
  { id: "5S", label: "5.5S", color: "bg-sky-500 text-white" },
  { id: "AUTOMATION", label: "6.Tự động hoá", color: "bg-indigo-600 text-white" },
  { id: "EQUIPMENT", label: "7.MMTB CCDC", color: "bg-purple-600 text-white" },
  { id: "OTHER", label: "8.Khác", color: "bg-slate-600 text-white" },
];

export default function KaizenDetailModal({
  proposal,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onEvaluate,
  onRate,
}: KaizenDetailModalProps) {
  const { user, isExecutiveOrAdmin, levelRank } = usePermission();
  const [activeTab, setActiveTab] = useState<"info" | "expert_review" | "star_review">("info");
  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(proposal?.before_image_url ? { type: "image", url: proposal.before_image_url } : null);

  useEffect(() => {
    if (proposal?.before_image_url) {
      setSelectedMedia({ type: "image", url: proposal.before_image_url });
    } else if (proposal?.after_image_url) {
      setSelectedMedia({ type: "image", url: proposal.after_image_url });
    } else {
      setSelectedMedia(null);
    }
  }, [proposal]);

  const isOwner = useMemo(() => {
    if (!user || !user.empCode || !proposal?.proposer_emp_code) return false;
    return user.empCode.trim().toUpperCase() === proposal.proposer_emp_code.trim().toUpperCase();
  }, [user, proposal]);

  const isJudgeOrExecutive = useMemo(() => {
    if (!user) return false;
    if (isExecutiveOrAdmin || levelRank >= 3) return true;
    const rc = ((user as any)?.roleCode || (user as any)?.role || "").toUpperCase();
    return ["TONG_GIAM_DOC", "PHO_TONG_GIAM_DOC", "GIAM_DOC", "PHO_GIAM_DOC", "TRUONG_PHONG", "CI_LEAD", "QC", "ADMIN"].includes(rc);
  }, [user, isExecutiveOrAdmin, levelRank]);

  const [evalData, setEvalData] = useState<any>(null);

  useEffect(() => {
    if (!proposal?.id) return;
    let isMounted = true;
    fetch(`/api/ci-kaizen/expert-evaluations?proposalId=${proposal.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) {
          setEvalData(json.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [proposal?.id]);

  const [markingThiDua, setMarkingThiDua] = useState(false);
  const [thiDuaMsg, setThiDuaMsg] = useState<string | null>(null);

  const [isFeasibilityModalOpen, setIsFeasibilityModalOpen] = useState(false);
  const [feasibilityInitialDecision, setFeasibilityInitialDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [step3Msg, setStep3Msg] = useState<string | null>(null);

  const handleToggleThiDua = async () => {
    if (!proposal) return;
    const isCurrentlyThiDua = Number(proposal.is_thi_dua) === 1;
    const action = isCurrentlyThiDua ? "REMOVE" : "ADD";

    try {
      setMarkingThiDua(true);
      setThiDuaMsg(null);
      const res = await fetch("/api/ci-kaizen/mark-thi-dua", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          action,
        }),
      });

      const json = await res.json();
      if (json.success) {
        proposal.is_thi_dua = isCurrentlyThiDua ? 0 : 1;
        setThiDuaMsg(json.message);
        setTimeout(() => setThiDuaMsg(null), 3000);
        if (onRate) onRate();
      } else {
        setThiDuaMsg(`❌ ${json.message || "Không thể thực hiện"}`);
      }
    } catch (e: any) {
      setThiDuaMsg("❌ Lỗi kết nối!");
    } finally {
      setMarkingThiDua(false);
    }
  };

  const isAssignedJudge = useMemo(() => {
    if (evalData?.assignedJudges && Array.isArray(evalData.assignedJudges) && evalData.assignedJudges.length > 0) {
      if (evalData.isExecutiveManager) return true;
      if (!user?.empCode) return false;
      const userEmp = user.empCode.trim().toUpperCase();
      return evalData.assignedJudges.some((j: any) => (j.judge_emp_code || "").trim().toUpperCase() === userEmp);
    }
    return isJudgeOrExecutive;
  }, [evalData, user, isJudgeOrExecutive]);

  const isApprovedStep3 = proposal?.sub_status !== "CHO_REVIEW" && proposal?.approval_status !== "PENDING" && proposal?.status !== "SUBMITTED";

  const canSeeExpertTab = false;
  const canSeeAwardTab = isApprovedStep3 && isAssignedJudge;

  useEffect(() => {
    if (activeTab === "expert_review" && !canSeeExpertTab) {
      setActiveTab("info");
    } else if (activeTab === "star_review" && !canSeeAwardTab) {
      setActiveTab("info");
    }
  }, [activeTab, canSeeExpertTab, canSeeAwardTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = (params.get("tab") || params.get("activeTab") || params.get("tab_name") || "").toLowerCase();

      if (["expert_review", "cham-diem", "danh-gia-chuyen-mon"].includes(tabParam)) {
        if (canSeeExpertTab) {
          setActiveTab("expert_review");
        } else {
          setActiveTab("info");
        }
      } else if (["star_review", "thuong", "danh-gia-thuong"].includes(tabParam)) {
        if (canSeeAwardTab) {
          setActiveTab("star_review");
        } else {
          setActiveTab("info");
        }
      }
    } catch (e) {}
  }, [canSeeExpertTab, canSeeAwardTab]);

  if (!isOpen || !proposal) return null;

  const catObj = CATEGORIES.find((c) => c.id === proposal.category) || CATEGORIES[0];
  const pMonth = (proposal as any).proposer_month || (proposal.created_at ? new Date(proposal.created_at).getMonth() + 1 : new Date().getMonth() + 1);
  const pYear = (proposal as any).proposer_year || (proposal.created_at ? new Date(proposal.created_at).getFullYear() : new Date().getFullYear());
  const vtcv = (proposal as any).proposer_position || proposal.department || "Công Nhân Sản Xuất";
  const cust = proposal.customer || "Skechers";
  const prodGroup = (proposal as any).product_group || proposal.factory || "Quai";

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[95vw] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] max-h-[90vh] flex flex-col md:flex-row overflow-hidden text-left animate-in zoom-in-95 duration-200">
        
        {/* 1. SIDEBAR TRÁI */}
        <div className="w-full md:w-72 md:max-h-[90vh] md:overflow-y-auto bg-slate-50 border-r border-slate-200 p-4 md:p-5 flex flex-col gap-4 shrink-0">
          
          <div className="space-y-2">
            <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 shadow-xs flex items-center justify-center">
              {selectedMedia?.type === "image" && selectedMedia.url ? (
                <img
                  src={selectedMedia.url}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              ) : selectedMedia?.type === "video" && selectedMedia.url ? (
                <video
                  src={selectedMedia.url}
                  controls
                  className="w-full h-full object-cover bg-black"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs font-bold flex flex-col items-center gap-1">
                  <IconPhoto size={28} className="opacity-40" />
                  <span>Không có ảnh</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {proposal.before_image_url && (
                <button
                  type="button"
                  onClick={() => proposal.before_image_url && setSelectedMedia({ type: "image", url: proposal.before_image_url })}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 ${
                    selectedMedia?.url === proposal.before_image_url && selectedMedia?.type === "image"
                      ? "border-[#006838] ring-2 ring-[#006838]/40"
                      : "border-slate-300 hover:border-slate-400 opacity-80 hover:opacity-100"
                  }`}
                  title="Ảnh Trước"
                >
                  <img src={proposal.before_image_url} alt="Before" className="w-full h-full object-cover" />
                </button>
              )}
              {proposal.after_image_url && (
                <button
                  type="button"
                  onClick={() => proposal.after_image_url && setSelectedMedia({ type: "image", url: proposal.after_image_url })}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 ${
                    selectedMedia?.url === proposal.after_image_url && selectedMedia?.type === "image"
                      ? "border-[#006838] ring-2 ring-[#006838]/40"
                      : "border-slate-300 hover:border-slate-400 opacity-80 hover:opacity-100"
                  }`}
                  title="Ảnh Sau"
                >
                  <img src={proposal.after_image_url} alt="After" className="w-full h-full object-cover" />
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            {proposal.region || "MỸ PHONG"} &bull; {catObj.label.toUpperCase()}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">ĐIỂM TB</span>
              <span className="text-xl font-black text-amber-600 block">
                {(proposal.avg_rating || 0).toFixed(1)} ⭐
              </span>
              <span className="text-[10px] font-bold text-slate-500 block">
                {proposal.rating_count || 0} lượt đánh giá
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CHUYÊN MÔN</span>
              <span className="text-xl font-black text-emerald-600 block">
                {proposal.score_points || proposal.average_score ? `${proposal.score_points || proposal.average_score}/100` : "---"}
              </span>
              <span className="text-[10px] font-bold text-slate-500 block">
                {proposal.sub_status === "DA_DANH_GIA" ? "Đã tổng hợp" : "Chờ tổng hợp"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              NGƯỜI ĐĂNG KÝ
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">👤</span>
              <span className="text-xs font-extrabold text-slate-900">
                {proposal.proposer_name}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">VTCV</span>
              <span className="text-xs font-extrabold text-slate-900 block truncate" title={vtcv || "---"}>
                {vtcv || "---"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">NHÓM SP/DV</span>
              <span className="text-xs font-extrabold text-slate-900 block truncate" title={prodGroup || "---"}>
                {prodGroup || "---"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">PHÂN LOẠI</span>
              <span className="text-xs font-extrabold text-slate-900 block truncate" title={catObj.label}>
                {catObj.label}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">NGÀY ĐĂNG</span>
              <span className="text-xs font-extrabold text-slate-900 block">
                {proposal.created_at ? new Date(proposal.created_at).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN")}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">NHÂN SỰ ĐỀ XUẤT</span>
              <span className="text-xs font-extrabold text-slate-900 block leading-tight break-words">
                {proposal.proposer_emp_code || "---"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">KHÁCH HÀNG</span>
              <span className="text-xs font-extrabold text-slate-900 block">
                {cust || "---"}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 mt-auto border-t border-slate-200">
            {thiDuaMsg && (
              <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold text-center animate-in fade-in">
                {thiDuaMsg}
              </div>
            )}

            {(proposal.status === "ARCHIVED" || proposal.sub_status === "LUU_TRU" || proposal.registration_type === "LUU_TRU") && isJudgeOrExecutive && (
              <button
                type="button"
                disabled={markingThiDua}
                onClick={handleToggleThiDua}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  Number(proposal.is_thi_dua) === 1
                    ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                }`}
              >
                <IconTrophy size={16} />
                <span>
                  {markingThiDua
                    ? "Đang xử lý..."
                    : Number(proposal.is_thi_dua) === 1
                    ? "ℹ️ Bỏ khỏi Thi đua"
                    : "🏆 Chuyển sang Thi đua"}
                </span>
              </button>
            )}

            {isOwner || isExecutiveOrAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <IconEditCircle size={15} />
                  <span>Sửa</span>
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="py-2.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-black text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <IconTrash size={15} />
                  <span>Xóa</span>
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>✕ Đóng</span>
            </button>
          </div>
        </div>

        {/* 2. HEADER PHẢI */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white max-h-[90vh]">
          
          <div className="flex-shrink-0 p-5 md:p-6 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-black flex items-center gap-1">
                <span>📈</span>
                <span>{catObj.label}</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-1">
                <span>🏆</span>
                <span>{proposal.registration_type === "THI_DUA" ? "Thi đua" : "Lưu trữ"}</span>
              </span>

              <span
                className={`px-3 py-1 rounded-full border text-xs font-black flex items-center gap-1.5 ${
                  proposal.sub_status === "CHO_REVIEW" || proposal.approval_status === "PENDING" || proposal.status === "SUBMITTED"
                    ? "bg-blue-50 text-blue-800 border-blue-300"
                    : proposal.sub_status === "CHO_DANH_GIA" || proposal.approval_status === "PHE_DUYET"
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-emerald-50 text-emerald-800 border-emerald-300"
                }`}
              >
                <span>
                  {proposal.sub_status === "CHO_REVIEW" || proposal.approval_status === "PENDING" || proposal.status === "SUBMITTED"
                    ? "👤"
                    : proposal.sub_status === "CHO_DANH_GIA" || proposal.approval_status === "PHE_DUYET"
                    ? "⏳"
                    : "✅"}
                </span>
                <span>
                  {proposal.sub_status === "CHO_REVIEW" || proposal.approval_status === "PENDING" || proposal.status === "SUBMITTED"
                    ? "Chờ phê duyệt"
                    : proposal.sub_status === "CHO_DANH_GIA" || proposal.approval_status === "PHE_DUYET"
                    ? "Chờ duyệt"
                    : "Đã duyệt"}
                </span>
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug mb-1">
              {proposal.title}
            </h2>

            <p className="text-xs font-bold text-slate-400">
              MSNV: <span className="font-mono text-slate-700">{proposal.proposer_emp_code}</span> &bull; KV: <span className="text-slate-700">{proposal.region || "Kiên Giang 1"}</span> &bull; Tháng {pMonth}/{pYear}
            </p>

            {(proposal.sub_status === "CHO_REVIEW" || proposal.approval_status === "PENDING" || proposal.status === "SUBMITTED") && isJudgeOrExecutive && (
              <div className="mt-4 p-4 rounded-2xl bg-blue-50/90 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                    <IconShieldCheck size={16} className="text-blue-600 shrink-0" />
                    <span>Xem xét tính khả thi sáng kiến (Bước 3 - QĐ-TBKG)</span>
                  </span>
                  <p className="text-[11px] text-blue-700 font-medium">
                    Đề xuất đang ở trạng thái <strong>Chờ phê duyệt</strong>. Bạn có muốn phê duyệt tính khả thi để cho phép thử nghiệm và đánh giá?
                  </p>
                  {step3Msg && <div className="text-xs font-extrabold text-emerald-700 mt-1">{step3Msg}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFeasibilityInitialDecision("APPROVE");
                      setIsFeasibilityModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <IconCheck size={14} />
                    <span>Phê Duyệt Triển Khai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeasibilityInitialDecision("REJECT");
                      setIsFeasibilityModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <IconX size={14} />
                    <span>Từ Chối Triển Khai</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 px-5 md:px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "info"
                  ? "bg-[#0b1739] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <span>ℹ️ Thông tin</span>
            </button>

            {canSeeExpertTab && (
              <button
                type="button"
                onClick={() => setActiveTab("expert_review")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "expert_review"
                    ? "bg-[#0b1739] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <span>♛ Đánh giá chuyên môn</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === "expert_review" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {proposal.score_points || (proposal as any).evaluations_count ? `${proposal.score_points || 2}` : "2"}
                </span>
              </button>
            )}

            {canSeeAwardTab && (
              <button
                type="button"
                onClick={() => setActiveTab("star_review")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "star_review"
                    ? "bg-[#0b1739] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <span>★ Đánh giá thưởng</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === "star_review" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {proposal.rating_count || 0}
                </span>
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-y-auto">
            {activeTab === "info" && <TabInfoContent proposal={proposal} />}
            {activeTab === "expert_review" && canSeeExpertTab && (
              <TabExpertReviewContent proposal={proposal} isOwner={isOwner} initialEvalData={evalData} />
            )}
            {activeTab === "star_review" && canSeeAwardTab && (
              <TabAwardReviewContent
                proposal={proposal}
                isJudgeOrExecutive={isJudgeOrExecutive}
                onEvaluate={onEvaluate}
                onRate={onRate}
              />
            )}
          </div>
        </div>
      </div>

      <FeasibilityApprovalModal
        isOpen={isFeasibilityModalOpen}
        proposal={proposal}
        initialDecision={feasibilityInitialDecision}
        onClose={() => setIsFeasibilityModalOpen(false)}
        onSuccess={(updated) => {
          proposal.approval_status = updated.approval_status;
          proposal.sub_status = updated.sub_status;
          proposal.status = updated.status;
          if (updated.time_before_seconds !== undefined) proposal.time_before_seconds = updated.time_before_seconds;
          if (updated.time_after_seconds !== undefined) proposal.time_after_seconds = updated.time_after_seconds;
          if (updated.saved_seconds !== undefined) proposal.saved_seconds = updated.saved_seconds;
          setStep3Msg(
            updated.approval_status === "PHE_DUYET"
              ? "✅ Đã phê duyệt tính khả thi (Bước 3) thành công!"
              : "❌ Đã từ chối triển khai sáng kiến."
          );
          setTimeout(() => setStep3Msg(null), 4000);
          if (onRate) onRate();
          if (onEvaluate) onEvaluate();
        }}
      />
    </div>
  );
}

function TabInfoContent({ proposal }: { proposal: KaizenProposal }) {
  const prodCode = (proposal as any).product_code || proposal.code;
  const qty = (proposal as any).quantity || proposal.vote_count;
  const pricingDir = (proposal as any).pricing_direction || "THOI_GIAN";

  const overviewCards = [];
  if (prodCode && prodCode.trim() && prodCode !== "---") {
    overviewCards.push({ label: "MÃ HÀNG", val: prodCode, key: "code" });
  }
  if (qty && Number(qty) > 0) {
    overviewCards.push({ label: "SỐ LƯỢNG ĐH", val: Number(qty).toLocaleString("vi-VN"), key: "qty" });
  }
  overviewCards.push({
    label: "HƯỚNG ĐÁNH GIÁ",
    val: pricingDir === "TRI_GIA" || pricingDir === "Trị giá" ? "Trị giá" : "Thời gian",
    key: "dir",
    highlight: true,
  });

  let videos: { type: string; url: string; title?: string }[] = [];
  if (proposal.attachments_json) {
    try {
      const atts = typeof proposal.attachments_json === "string" ? JSON.parse(proposal.attachments_json) : proposal.attachments_json;
      if (Array.isArray(atts)) {
        videos = atts.filter((a: any) => a && (a.type?.startsWith("video_") || a.url?.includes("video") || a.url?.startsWith("data:video/")));
      }
    } catch (e) {}
  }

  return (
    <div className="p-5 md:p-6 space-y-6 text-xs">
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span>📋</span>
          <span>TỔNG QUAN CẢI TIẾN</span>
        </h4>
        <div className={`grid gap-3 ${overviewCards.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
          {overviewCards.map((card) => (
            <div
              key={card.key}
              className={`p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 ${
                card.highlight ? "border-r-4 border-r-amber-500 bg-amber-50/20" : ""
              }`}
            >
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                {card.label}
              </span>
              <span className="text-sm font-black text-slate-900 block truncate">
                {card.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span>☰</span>
          <span>NỘI DUNG CHI TIẾT</span>
        </h4>
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2">
            <h5 className="text-xs font-black uppercase text-rose-800 tracking-wide flex items-center gap-1.5">
              <IconAlertCircle size={15} className="text-rose-600" />
              <span>VẤN ĐỀ PHÁT HIỆN (TRƯỚC)</span>
            </h5>
            <p className="font-bold text-rose-950 leading-relaxed whitespace-pre-wrap text-xs">
              {proposal.before_description || "Chưa có mô tả hiện trạng lãng phí trước cải tiến."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
            <h5 className="text-xs font-black uppercase text-emerald-800 tracking-wide flex items-center gap-1.5">
              <IconThumbUp size={15} className="text-emerald-600" />
              <span>GIẢI PHÁP HÀNH ĐỘNG (SAU)</span>
            </h5>
            <p className="font-bold text-emerald-950 leading-relaxed whitespace-pre-wrap text-xs">
              {proposal.after_solution || "Chưa có mô tả giải pháp sáng kiến cải tiến."}
            </p>
          </div>
        </div>
      </div>

      {(() => {
        const timeBefore = Number(proposal.time_before_seconds || (proposal as any).timeBeforeSeconds || 0);
        const timeAfter = Number(proposal.time_after_seconds || (proposal as any).timeAfterSeconds || 0);
        const savedSecs = Number(proposal.saved_seconds || (proposal as any).savedSeconds || Math.max(0, timeBefore - timeAfter));
        const efficiencyVnd = Number(
          proposal.efficiency_value_vnd || (proposal as any).efficiencyValueVND || Math.round(savedSecs * 12.5)
        );
        const pairQty = Number(
          proposal.pair_quantity || (proposal as any).pairQuantity || (proposal as any).so_luong_giay || (proposal as any).quantity || 0
        );
        const totalSavingsVnd = Number(
          proposal.total_savings_vnd ||
          (proposal as any).totalSavingsVND ||
          (proposal as any).tong_tien_tiet_kiem ||
          (pairQty > 0 ? efficiencyVnd * pairQty : 0)
        );
        const totalSavingsWordsText =
          proposal.total_savings_words ||
          (proposal as any).totalSavingsWords ||
          (proposal as any).tong_tien_bang_chu ||
          (totalSavingsVnd > 0 ? convertNumberToWords(totalSavingsVnd) : "");

        return (
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>📈</span>
              <span>HIỆU QUẢ CẢI TIẾN</span>
            </h4>

            {pricingDir === "TRI_GIA" || pricingDir === "Trị giá" ? (
              <div className="p-4 rounded-2xl bg-[#006838] text-white shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-200 block">
                    HIỆU QUẢ QUY ĐỔI VNĐ/ĐÔI
                  </span>
                  <span className="text-xl font-black text-white block">
                    {efficiencyVnd.toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <span className="px-3 py-1 bg-emerald-800 text-emerald-100 rounded-lg text-xs font-extrabold">
                  Trị giá
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">TRƯỚC</span>
                  <span className="text-xl font-black text-slate-900 block">
                    {timeBefore ? `${timeBefore}` : "0"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 block">giây</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">SAU</span>
                  <span className="text-xl font-black text-slate-900 block">
                    {timeAfter ? `${timeAfter}` : "0"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 block">giây</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-purple-700 block">TIẾT KIỆM</span>
                  <span className="text-xl font-black text-purple-900 block">
                    {savedSecs}
                  </span>
                  <span className="text-[10px] font-bold text-purple-600 block">
                    giây {timeBefore && savedSecs ? `(${Math.round((savedSecs / timeBefore) * 100)}%)` : ""}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#006838] text-white space-y-1 shadow-md">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-200 block">HIỆU QUẢ</span>
                  <span className="text-base sm:text-lg font-black text-white block truncate">
                    {efficiencyVnd.toLocaleString("vi-VN")} VNĐ
                  </span>
                  <span className="text-[10px] font-bold text-emerald-200 block">quy đổi / đôi</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-blue-700 block">SỐ LƯỢNG GIÀY</span>
                  <span className="text-base sm:text-lg font-black text-blue-950 block truncate">
                    {pairQty > 0 ? pairQty.toLocaleString("vi-VN") : "0"}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 block">đôi / đơn hàng</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#00522c] text-white space-y-1 shadow-md border border-emerald-400/30">
                  <span className="text-[10px] font-extrabold uppercase text-amber-300 block">TỔNG TIẾT KIỆM</span>
                  <span className="text-base sm:text-lg font-black text-white block truncate">
                    {totalSavingsVnd > 0 ? `${totalSavingsVnd.toLocaleString("vi-VN")} VNĐ` : "0 VNĐ"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-200 block truncate">
                    {pairQty > 0 ? `cho ${pairQty.toLocaleString("vi-VN")} đôi` : "tính quy đổi"}
                  </span>
                </div>
              </div>
            )}

            {totalSavingsWordsText && (
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-left">
                <span className="text-xs text-slate-700">
                  <strong className="text-slate-900 font-black">Bằng chữ: </strong>
                  <span className="italic font-bold text-emerald-950">
                    "{totalSavingsWordsText}"
                  </span>
                </span>
              </div>
            )}
          </div>
        );
      })()}

      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span>🖼</span>
          <span>So Sánh Hình Ảnh</span>
        </h4>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-3.5 rounded-2xl border-2 border-rose-200 bg-rose-50/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-900">Trước</span>
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-2xs">
                {proposal.before_image_url ? "1" : "0"}
              </span>
            </div>
            {proposal.before_image_url ? (
              <a href={proposal.before_image_url} target="_blank" rel="noreferrer" className="block relative">
                <img
                  src={proposal.before_image_url}
                  alt="Before"
                  className="w-full h-44 sm:h-52 object-contain rounded-xl border border-rose-200 bg-white"
                />
              </a>
            ) : (
              <div className="w-full h-36 sm:h-44 rounded-xl border border-dashed border-rose-200 bg-white flex items-center justify-center text-slate-400 font-bold text-xs">
                Chưa có ảnh trước
              </div>
            )}
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900">Sau</span>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow-2xs">
                {proposal.after_image_url ? "1" : "0"}
              </span>
            </div>
            {proposal.after_image_url ? (
              <a href={proposal.after_image_url} target="_blank" rel="noreferrer" className="block relative">
                <img
                  src={proposal.after_image_url}
                  alt="After"
                  className="w-full h-44 sm:h-52 object-contain rounded-xl border border-emerald-200 bg-white"
                />
              </a>
            ) : (
              <div className="w-full h-36 sm:h-44 rounded-xl border border-dashed border-emerald-200 bg-white flex items-center justify-center text-slate-400 font-bold text-xs">
                Chưa có ảnh sau
              </div>
            )}
          </div>
        </div>
      </div>

      {videos.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-2">
            <span>🎬</span>
            <span>VIDEO CLIPS MINH HỌA</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((vid, idx) => (
              <div key={idx} className="p-3 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-1.5">
                <span className="text-xs font-bold text-purple-900 block">{vid.title || `Video #${idx + 1}`}</span>
                <video controls src={vid.url} className="w-full h-44 object-cover rounded-xl bg-black" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabExpertReviewContent({
  proposal,
  isOwner,
  initialEvalData,
}: {
  proposal: KaizenProposal;
  isOwner: boolean;
  initialEvalData?: any;
}) {
  return null;
}

function TabAwardReviewContent({
  proposal,
  isJudgeOrExecutive,
  onEvaluate,
  onRate,
}: {
  proposal: KaizenProposal;
  isJudgeOrExecutive: boolean;
  onEvaluate: () => void;
  onRate?: () => void;
}) {
  const { user } = usePermission();
  const [impactRating, setImpactRating] = useState<number>(0);
  const [creativityRating, setCreativityRating] = useState<number>(0);
  const [sustainabilityRating, setSustainabilityRating] = useState<number>(0);
  const [hoverImpact, setHoverImpact] = useState<number>(0);
  const [hoverCreativity, setHoverCreativity] = useState<number>(0);
  const [hoverSustainability, setHoverSustainability] = useState<number>(0);
  const [commentText, setCommentText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const userName = (user as any)?.fullName || (user as any)?.name || (user as any)?.username || "Người dùng";
  const userAccount = user?.empCode || (user as any)?.username || "CAITIEN";

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (impactRating === 0 || creativityRating === 0 || sustainabilityRating === 0) {
      setSubmitMsg({ type: "error", text: "Vui lòng chọn số sao cho cả 3 tiêu chí (Tác động, Sáng tạo, Bền vững)!" });
      return;
    }

    setSubmitting(true);
    setSubmitMsg(null);

    const avgStars = Math.round(((impactRating + creativityRating + sustainabilityRating) / 3) * 10) / 10;

    try {
      const res = await fetch("/api/ci-kaizen/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          score: avgStars,
          comments: commentText,
          impactScore: impactRating,
          creativityScore: creativityRating,
          sustainabilityScore: sustainabilityRating,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitMsg({ type: "success", text: json.message || "⭐ Đã gửi nhận xét & đánh giá thành công!" });
        if (onRate) onRate();
      } else {
        setSubmitMsg({ type: "error", text: json.message || "Không thể lưu đánh giá!" });
      }
    } catch (err: any) {
      setSubmitMsg({ type: "error", text: "Lỗi kết nối máy chủ!" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 md:p-6 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 md:p-6 shadow-2xs space-y-5 text-left">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <span className="text-base">💬</span>
          <h3 className="text-sm md:text-base font-black text-slate-900">
            Nhận Xét (1-5 sao)
          </h3>
        </div>

        {submitMsg && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            submitMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            <span>{submitMsg.type === "success" ? "✅" : "⚠️"}</span>
            <span>{submitMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmitRating} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 block">
              Người nhận xét
            </label>
            <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-700 shadow-2xs">
              {userName}
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              Tài khoản: <span className="text-slate-600">@{userAccount}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <span>🎯</span>
                <span>Tác động <span className="text-red-500">*</span></span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setImpactRating(star)}
                    onMouseEnter={() => setHoverImpact(star)}
                    onMouseLeave={() => setHoverImpact(0)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
                  >
                    <IconStar
                      size={22}
                      className={
                        star <= (hoverImpact || impactRating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <span>💡</span>
                <span>Sáng tạo <span className="text-red-500">*</span></span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCreativityRating(star)}
                    onMouseEnter={() => setHoverCreativity(star)}
                    onMouseLeave={() => setHoverCreativity(0)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
                  >
                    <IconStar
                      size={22}
                      className={
                        star <= (hoverCreativity || creativityRating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <span>🌱</span>
                <span>Bền vững <span className="text-red-500">*</span></span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSustainabilityRating(star)}
                    onMouseEnter={() => setHoverSustainability(star)}
                    onMouseLeave={() => setHoverSustainability(0)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
                  >
                    <IconStar
                      size={22}
                      className={
                        star <= (hoverSustainability || sustainabilityRating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 block">
              Nhận xét (tùy chọn)
            </label>
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Chia sẻ ý kiến..."
              className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#006838] hover:bg-[#00522c] active:bg-[#004022] text-white font-black text-xs md:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <IconSend size={16} />
            <span>{submitting ? "Đang gửi nhận xét..." : "Gửi Nhận Xét"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
