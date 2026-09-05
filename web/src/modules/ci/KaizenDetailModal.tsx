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
  IconCloudUpload,
  IconLoader2,
} from "@tabler/icons-react";
import { convertNumberToWords } from "@/lib/numberToWords";
import { KaizenProposal } from "./CIModule";
import { usePermission } from "@/hooks/usePermission";
import FeasibilityApprovalModal from "./FeasibilityApprovalModal";

interface KaizenDetailModalProps {
  proposal: KaizenProposal;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  onEvaluate?: () => void;
  onRate?: () => void;
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

const REGIONS = ["VP Chuỗi", "KG1", "KG2", "KG3", "Hoàn thiện đế", "NMMĐ"];
const CUSTOMERS = ["Skechers", "Decathlon", "Wrangler", "Reebok", "LEFASO", "Khác"];

export function normalizeCategoryId(catRaw?: string): string {
  if (!catRaw) return "PRODUCTIVITY";
  const cat = catRaw.trim();
  if (cat === "MATERIAL_SAVING" || cat === "SAVE_MATERIAL" || cat.includes("1.") || cat.includes("Vật tư") || cat.includes("Vat tu")) {
    return "MATERIAL_SAVING";
  }
  if (cat === "COST_SAVING" || cat === "SAVE_COST" || cat.includes("2.") || cat.includes("Chi phí") || cat.includes("Chi phi")) {
    return "COST_SAVING";
  }
  if (cat === "PRODUCTIVITY" || cat === "INCREASE_PRODUCTIVITY" || cat.includes("3.") || cat.includes("Năng suất") || cat.includes("Nang suat")) {
    return "PRODUCTIVITY";
  }
  if (cat === "SAFETY" || cat.includes("4.") || cat.includes("An toàn") || cat.includes("An toan")) {
    return "SAFETY";
  }
  if (cat === "5S" || cat.includes("5.")) {
    return "5S";
  }
  if (cat === "AUTOMATION" || cat.includes("6.") || cat.includes("Tự động") || cat.includes("Tu dong")) {
    return "AUTOMATION";
  }
  if (cat === "EQUIPMENT" || cat === "MMTB_CCDC" || cat.includes("7.") || cat.includes("MMTB") || cat.includes("CCDC")) {
    return "EQUIPMENT";
  }
  return "PRODUCTIVITY";
}

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
  
  // INLINE EDITING STATES
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<"before" | "after" | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    title: "",
    product_code: "",
    pair_quantity: 0,
    region: "",
    department: "",
    line: "",
    customer: "",
    category: "",
    pricing_direction: "THOI_GIAN",
    before_description: "",
    after_solution: "",
    time_before_seconds: 0,
    time_after_seconds: 0,
    efficiency_value_vnd: 0,
    cost_before: 0,
    cost_after: 0,
    total_savings_vnd: 0,
    before_image_url: "",
    after_image_url: "",
  });

  const initEditForm = () => {
    if (!proposal) return;
    const normCategory = normalizeCategoryId(proposal.category || proposal.category_label || (proposal as any).product_group);
    const isCostCat = normCategory === "MATERIAL_SAVING" || normCategory === "COST_SAVING";
    const initialPricingDir = (proposal as any).pricing_direction || (isCostCat ? "TRI_GIA" : "THOI_GIAN");

    setEditForm({
      title: proposal.title || "",
      product_code: (proposal as any).product_code || proposal.code || "",
      pair_quantity: Number(proposal.pair_quantity || (proposal as any).so_luong_giay || (proposal as any).quantity || 0),
      region: proposal.region || proposal.factory || "KG1",
      department: proposal.department || "",
      line: proposal.line || "",
      customer: proposal.customer || "Skechers",
      category: normCategory,
      pricing_direction: initialPricingDir,
      before_description: proposal.before_description || "",
      after_solution: proposal.after_solution || "",
      time_before_seconds: Number(proposal.time_before_seconds || (proposal as any).timeBeforeSeconds || 0),
      time_after_seconds: Number(proposal.time_after_seconds || (proposal as any).timeAfterSeconds || 0),
      efficiency_value_vnd: Number(proposal.efficiency_value_vnd || (proposal as any).efficiencyValueVND || 0),
      cost_before: Number((proposal as any).cost_before || (proposal as any).chi_phi_truoc || 0),
      cost_after: Number((proposal as any).cost_after || (proposal as any).chi_phi_sau || 0),
      total_savings_vnd: Number(proposal.total_savings_vnd || (proposal as any).tong_tien_tiet_kiem || 0),
      before_image_url: proposal.before_image_url || "",
      after_image_url: proposal.after_image_url || "",
    });
    setEditError(null);
  };

  useEffect(() => {
    initEditForm();
  }, [proposal]);

  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(proposal?.before_image_url ? { type: "image", url: proposal.before_image_url } : null);

  useEffect(() => {
    const curBefore = isEditing ? editForm.before_image_url : proposal?.before_image_url;
    const curAfter = isEditing ? editForm.after_image_url : proposal?.after_image_url;
    if (curBefore) {
      setSelectedMedia({ type: "image", url: curBefore });
    } else if (curAfter) {
      setSelectedMedia({ type: "image", url: curAfter });
    } else {
      setSelectedMedia(null);
    }
  }, [proposal, isEditing, editForm.before_image_url, editForm.after_image_url]);

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

  const handleImageUpload = async (file: File, field: "before_image_url" | "after_image_url") => {
    try {
      setUploadingImage(field === "before_image_url" ? "before" : "after");
      setEditError(null);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "vpchuoisk");
      formData.append("folder", "vpchuoiskechers");

      const res = await fetch("https://api.cloudinary.com/v1_1/dwl2xtbqa/image/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.secure_url) {
          setEditForm((prev) => ({ ...prev, [field]: data.secure_url }));
        } else {
          setEditError("❌ Lỗi không nhận được URL từ Cloudinary");
        }
      } else {
        setEditError("❌ Upload Cloudinary thất bại");
      }
    } catch (err: any) {
      setEditError(`❌ Lỗi upload ảnh: ${err.message}`);
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSaveInlineEdit = async () => {
    if (!editForm.title.trim()) {
      setEditError("⚠️ Tiêu đề sáng kiến không được để trống!");
      return;
    }
    if (!editForm.before_description.trim()) {
      setEditError("⚠️ Nội dung vấn đề lãng phí trước cải tiến không được để trống!");
      return;
    }
    if (!editForm.after_solution.trim()) {
      setEditError("⚠️ Nội dung giải pháp hành động sau cải tiến không được để trống!");
      return;
    }

    const normCategory = normalizeCategoryId(editForm.category);
    const isCostMode = editForm.pricing_direction === "TRI_GIA" || normCategory === "MATERIAL_SAVING" || normCategory === "COST_SAVING";

    const timeBefore = isCostMode ? 0 : Number(editForm.time_before_seconds || 0);
    const timeAfter = isCostMode ? 0 : Number(editForm.time_after_seconds || 0);
    const savedSecs = Math.max(0, timeBefore - timeAfter);
    const effValue = Number(editForm.efficiency_value_vnd) || Math.round(savedSecs * 12.5);
    const pairQty = Number(editForm.pair_quantity) || 0;
    const costBefore = Number(editForm.cost_before || 0);
    const costAfter = Number(editForm.cost_after || 0);

    let totalSavings = 0;
    if (isCostMode) {
      totalSavings = Number(editForm.total_savings_vnd) || Math.max(0, costBefore - costAfter);
    } else {
      totalSavings = pairQty > 0 ? effValue * pairQty : effValue;
    }

    const totalSavingsWords = totalSavings > 0 ? convertNumberToWords(totalSavings) : "";

    try {
      setSaving(true);
      setEditError(null);

      const payload = {
        id: proposal.id,
        code: proposal.code,
        title: editForm.title.trim(),
        product_code: editForm.product_code.trim(),
        pair_quantity: pairQty,
        quantity: pairQty,
        region: editForm.region,
        factory: editForm.region,
        department: editForm.department.trim(),
        line: editForm.line.trim(),
        customer: editForm.customer,
        category: editForm.category,
        pricing_direction: editForm.pricing_direction,
        before_description: editForm.before_description.trim(),
        after_solution: editForm.after_solution.trim(),
        time_before_seconds: timeBefore,
        time_after_seconds: timeAfter,
        saved_seconds: savedSecs,
        efficiency_value_vnd: effValue,
        cost_before: costBefore,
        cost_after: costAfter,
        cost_before_vnd: costBefore,
        cost_after_vnd: costAfter,
        total_savings_vnd: totalSavings,
        total_savings_words: totalSavingsWords,
        tong_tien_tiet_kiem: totalSavings,
        tong_tien_bang_chu: totalSavingsWords,
        before_image_url: editForm.before_image_url,
        after_image_url: editForm.after_image_url,
      };

      const res = await fetch("/api/ci-kaizen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        Object.assign(proposal, payload);
        setIsEditing(false);
        if (onEvaluate) onEvaluate();
        if (onRate) onRate();
      } else {
        setEditError(`❌ ${json.message || json.error || "Không thể cập nhật đề xuất!"}`);
      }
    } catch (err: any) {
      setEditError("❌ Lỗi kết nối mạng hoặc máy chủ!");
    } finally {
      setSaving(false);
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

  if (!isOpen || !proposal) return null;

  const currentCategory = isEditing ? editForm.category : proposal.category;
  const catObj = CATEGORIES.find((c) => c.id === currentCategory) || CATEGORIES[0];
  const pMonth = (proposal as any).proposer_month || (proposal.created_at ? new Date(proposal.created_at).getMonth() + 1 : new Date().getMonth() + 1);
  const pYear = (proposal as any).proposer_year || (proposal.created_at ? new Date(proposal.created_at).getFullYear() : new Date().getFullYear());
  const vtcv = (proposal as any).proposer_position || (proposal as any).proposerPosition
    || (proposal.department && proposal.department !== "Công ty" && proposal.department !== "Company" ? proposal.department : null)
    || "---";
  const cust = isEditing ? editForm.customer : (proposal.customer || "");
  const prodGroup = (proposal as any).product_group || (proposal as any).productGroup || "";

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[95vw] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] max-h-[92vh] md:max-h-[90vh] flex flex-col md:flex-row overflow-y-auto md:overflow-hidden text-left animate-in zoom-in-95 duration-200">
        
        {/* 1. SIDEBAR TRÁI */}
        <div className="w-full md:w-80 lg:w-96 md:max-h-[90vh] md:overflow-y-auto bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-5 flex flex-col gap-4 shrink-0 order-2 md:order-1">
          
          {editError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in">
              {editError}
            </div>
          )}

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
              {(isEditing ? editForm.before_image_url : proposal.before_image_url) ? (
                <button
                  type="button"
                  onClick={() => {
                    const url = isEditing ? editForm.before_image_url : proposal.before_image_url;
                    if (url) setSelectedMedia({ type: "image", url });
                  }}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 ${
                    selectedMedia?.url === (isEditing ? editForm.before_image_url : proposal.before_image_url) && selectedMedia?.type === "image"
                      ? "border-[#006838] ring-2 ring-[#006838]/40"
                      : "border-slate-300 hover:border-slate-400 opacity-80 hover:opacity-100"
                  }`}
                  title="Ảnh Trước"
                >
                  <img src={isEditing ? editForm.before_image_url : proposal.before_image_url} alt="Before" className="w-full h-full object-cover" />
                </button>
              ) : null}

              {(isEditing ? editForm.after_image_url : proposal.after_image_url) ? (
                <button
                  type="button"
                  onClick={() => {
                    const url = isEditing ? editForm.after_image_url : proposal.after_image_url;
                    if (url) setSelectedMedia({ type: "image", url });
                  }}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 ${
                    selectedMedia?.url === (isEditing ? editForm.after_image_url : proposal.after_image_url) && selectedMedia?.type === "image"
                      ? "border-[#006838] ring-2 ring-[#006838]/40"
                      : "border-slate-300 hover:border-slate-400 opacity-80 hover:opacity-100"
                  }`}
                  title="Ảnh Sau"
                >
                  <img src={isEditing ? editForm.after_image_url : proposal.after_image_url} alt="After" className="w-full h-full object-cover" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            {(isEditing ? editForm.region : proposal.region) || "KG1"} &bull; {catObj.label.toUpperCase()}
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

          {/* EDITABLE / VIEWABLE METADATA FIELDS */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              NGƯỜI ĐĂNG KÝ
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">👤</span>
              <span className="text-xs font-extrabold text-slate-900">
                {proposal.proposer_name || proposal.proposer_emp_code || "---"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">KHU VỰC</span>
              {isEditing ? (
                <select
                  value={editForm.region}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, region: e.target.value }))}
                  className="w-full text-xs font-extrabold text-slate-900 bg-amber-50 border border-amber-300 rounded-lg p-1"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-extrabold text-slate-900 block truncate" title={proposal.region || proposal.factory || "---"}>
                  {proposal.region || proposal.factory || "---"}
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">PHÂN LOẠI</span>
              {isEditing ? (
                <select
                  value={editForm.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const normCat = normalizeCategoryId(newCat);
                    setEditForm((prev: any) => {
                      let newPricingDir = prev.pricing_direction;
                      if (normCat === "MATERIAL_SAVING" || normCat === "COST_SAVING") {
                        newPricingDir = "TRI_GIA";
                      } else if (normCat === "PRODUCTIVITY" || normCat === "AUTOMATION" || normCat === "EQUIPMENT") {
                        newPricingDir = "THOI_GIAN";
                      }
                      return {
                        ...prev,
                        category: normCat,
                        pricing_direction: newPricingDir,
                      };
                    });
                  }}
                  className="w-full text-xs font-extrabold text-slate-900 bg-amber-50 border border-amber-300 rounded-lg p-1"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-extrabold text-slate-900 block truncate" title={catObj.label}>
                  {catObj.label}
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">KHÁCH HÀNG</span>
              {isEditing ? (
                <select
                  value={editForm.customer}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, customer: e.target.value }))}
                  className="w-full text-xs font-extrabold text-slate-900 bg-amber-50 border border-amber-300 rounded-lg p-1"
                >
                  {CUSTOMERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-extrabold text-slate-900 block">
                  {cust || "---"}
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">NGÀY ĐĂNG</span>
              <span className="text-xs font-extrabold text-slate-900 block">
                {proposal.created_at ? new Date(proposal.created_at).toLocaleDateString("vi-VN") : "---"}
              </span>
            </div>
          </div>

          {/* VTCV + Nhóm SP/DV + Nhân sự đề xuất */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">VTCV</span>
              <span className="text-xs font-extrabold text-slate-900 block truncate" title={vtcv}>
                {vtcv}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">NHÓM SP/DV</span>
              <span className="text-xs font-extrabold text-slate-900 block truncate" title={prodGroup || proposal.factory || "---"}>
                {prodGroup || proposal.factory || "---"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              NHÂN SỰ ĐỀ XUẤT
            </span>
            <span className="text-xs font-mono font-extrabold text-slate-700">
              {proposal.proposer_emp_code || "---"}
            </span>
          </div>

          {/* ACTION BUTTONS (INLINE EDIT MODE CONTROLS) */}

          <div className="space-y-2 pt-2 mt-auto border-t border-slate-200">
            {thiDuaMsg && (
              <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold text-center animate-in fade-in">
                {thiDuaMsg}
              </div>
            )}

            {!isEditing && (proposal.status === "ARCHIVED" || proposal.sub_status === "LUU_TRU" || proposal.registration_type === "LUU_TRU") && isJudgeOrExecutive && (
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

            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveInlineEdit}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
                  <span>{saving ? "Lưu..." : "Lưu"}</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    initEditForm();
                    setIsEditing(false);
                  }}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <IconX size={15} />
                  <span>Hủy</span>
                </button>
              </div>
            ) : isOwner || isExecutiveOrAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
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

        {/* 2. HEADER PHẢI & TAB CONTENTS */}
        <div className="w-full md:flex-1 flex flex-col min-h-0 overflow-visible md:overflow-hidden bg-white md:max-h-[90vh] order-1 md:order-2">
          
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

              {isEditing && (
                <span className="px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs border border-amber-500 animate-pulse">
                  ✏️ Chế độ Sửa trực tiếp (Inline Edit)
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-1 mb-2">
                <label className="text-[10.5px] font-black uppercase text-amber-800 block">Tiêu đề sáng kiến:</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tiêu đề đề xuất sáng kiến..."
                  className="w-full text-lg font-black p-2.5 rounded-xl border border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/60 text-slate-900"
                />
              </div>
            ) : (
              <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug mb-1">
                {proposal.title}
              </h2>
            )}

            <p className="text-xs font-bold text-slate-400">
              MSNV: <span className="font-mono text-slate-700">{proposal.proposer_emp_code}</span> &bull; KV: <span className="text-slate-700">{(isEditing ? editForm.region : proposal.region) || "Kiên Giang 1"}</span> &bull; Tháng {pMonth}/{pYear}
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
              <span>ℹ️ Thông tin {isEditing ? "(Đang sửa)" : ""}</span>
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
              </button>
            )}
          </div>

          <div className="w-full overflow-visible md:flex-1 md:min-w-0 md:overflow-y-auto">
            {activeTab === "info" && (
              <TabInfoContent
                proposal={proposal}
                isEditing={isEditing}
                editForm={editForm}
                setEditForm={setEditForm}
                uploadingImage={uploadingImage}
                handleImageUpload={handleImageUpload}
              />
            )}
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

interface TabInfoContentProps {
  proposal: KaizenProposal;
  isEditing: boolean;
  editForm: any;
  setEditForm: React.Dispatch<React.SetStateAction<any>>;
  uploadingImage: "before" | "after" | null;
  handleImageUpload: (file: File, field: "before_image_url" | "after_image_url") => void;
}

function TabInfoContent({
  proposal,
  isEditing,
  editForm,
  setEditForm,
  uploadingImage,
  handleImageUpload,
}: TabInfoContentProps) {
  const prodCode = isEditing ? editForm.product_code : ((proposal as any).product_code || "");
  const qty = isEditing ? editForm.pair_quantity : Number((proposal as any).quantity || proposal.pair_quantity || (proposal as any).so_luong_giay || 0);
  const pricingDir = isEditing ? editForm.pricing_direction : ((proposal as any).pricing_direction || "THOI_GIAN");

  return (
    <div className="p-5 md:p-6 space-y-6 text-xs">
      {/* TỔNG QUAN CẢI TIẾN */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span>📋</span>
          <span>TỔNG QUAN CẢI TIẾN</span>
        </h4>

        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-amber-50/40 border border-amber-200 rounded-2xl">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-600 block">MÃ HÀNG SẢN PHẨM</label>
              <input
                type="text"
                value={editForm.product_code}
                onChange={(e) => setEditForm((prev: any) => ({ ...prev, product_code: e.target.value }))}
                placeholder="Ví dụ: SK-2026-X1"
                className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-600 block">SỐ LƯỢNG ĐƠN HÀNG (ĐÔI)</label>
              <input
                type="number"
                min={0}
                value={editForm.pair_quantity}
                onChange={(e) => setEditForm((prev: any) => ({ ...prev, pair_quantity: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-600 block">HƯỚNG ĐÁNH GIÁ</label>
              <select
                value={editForm.pricing_direction}
                onChange={(e) => setEditForm((prev: any) => ({ ...prev, pricing_direction: e.target.value }))}
                className="w-full p-2 rounded-xl border border-amber-300 font-bold bg-amber-100 text-xs"
              >
                <option value="THOI_GIAN">⏱️ Thời gian (Giây)</option>
                <option value="TRI_GIA">💰 Trị giá quy đổi (VNĐ)</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">MÃ HÀNG</span>
              <span className="text-sm font-black text-slate-900 block truncate">{prodCode || "---"}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">SỐ LƯỢNG ĐH</span>
              <span className="text-sm font-black text-slate-900 block truncate">
                {qty && Number(qty) > 0 ? Number(qty).toLocaleString("vi-VN") : "---"}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 border-r-4 border-r-amber-500 bg-amber-50/20">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">HƯỚNG ĐÁNH GIÁ</span>
              <span className="text-sm font-black text-slate-900 block truncate">
                {pricingDir === "TRI_GIA" || pricingDir === "Trị giá" ? "Trị giá" : "Thời gian"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* NỘI DUNG CHI TIẾT VẤN ĐỀ & GIẢI PHÁP */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span>☰</span>
          <span>NỘI DUNG CHI TIẾT</span>
        </h4>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2">
            <h5 className="text-xs font-black uppercase text-rose-800 tracking-wide flex items-center gap-1.5">
              <IconAlertCircle size={15} className="text-rose-600" />
              <span>VẤN ĐỀ PHÁT HIỆN (TRƯỚC CẢI TIẾN)</span>
            </h5>
            {isEditing ? (
              <textarea
                rows={3}
                value={editForm.before_description}
                onChange={(e) => setEditForm((prev: any) => ({ ...prev, before_description: e.target.value }))}
                placeholder="Mô tả thực trạng lãng phí hoặc vấn đề cần cải tiến..."
                className="w-full p-3 rounded-xl border border-rose-300 font-bold text-rose-950 bg-white text-xs outline-none focus:ring-2 focus:ring-rose-400"
              />
            ) : (
              <p className="font-bold text-rose-950 leading-relaxed whitespace-pre-wrap text-xs">
                {proposal.before_description || "Chưa có mô tả hiện trạng lãng phí trước cải tiến."}
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
            <h5 className="text-xs font-black uppercase text-emerald-800 tracking-wide flex items-center gap-1.5">
              <IconThumbUp size={15} className="text-emerald-600" />
              <span>GIẢI PHÁP HÀNH ĐỘNG (SAU CẢI TIẾN)</span>
            </h5>
            {isEditing ? (
              <textarea
                rows={3}
                value={editForm.after_solution}
                onChange={(e) => setEditForm((prev: any) => ({ ...prev, after_solution: e.target.value }))}
                placeholder="Mô tả chi tiết giải pháp đã thực hiện..."
                className="w-full p-3 rounded-xl border border-emerald-300 font-bold text-emerald-950 bg-white text-xs outline-none focus:ring-2 focus:ring-emerald-400"
              />
            ) : (
              <p className="font-bold text-emerald-950 leading-relaxed whitespace-pre-wrap text-xs">
                {proposal.after_solution || "Chưa có mô tả giải pháp sáng kiến cải tiến."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* HIỆU QUẢ CẢI TIẾN */}
      {(() => {
        const normCat = isEditing
          ? editForm.category
          : normalizeCategoryId(proposal.category || proposal.category_label || (proposal as any).product_group);
        const isCostMode = isEditing
          ? (editForm.pricing_direction === "TRI_GIA" || normCat === "MATERIAL_SAVING" || normCat === "COST_SAVING")
          : (pricingDir === "TRI_GIA" || pricingDir === "Trị giá" || normCat === "MATERIAL_SAVING" || normCat === "COST_SAVING");

        const timeBefore = isEditing ? Number(editForm.time_before_seconds) : Number(proposal.time_before_seconds || (proposal as any).timeBeforeSeconds || 0);
        const timeAfter = isEditing ? Number(editForm.time_after_seconds) : Number(proposal.time_after_seconds || (proposal as any).timeAfterSeconds || 0);
        const savedSecs = Math.max(0, timeBefore - timeAfter);
        const efficiencyVnd = isEditing
          ? (Number(editForm.efficiency_value_vnd) || Math.round(savedSecs * 12.5))
          : Number(proposal.efficiency_value_vnd || (proposal as any).efficiencyValueVND || Math.round(savedSecs * 12.5));
        const pairQty = isEditing ? Number(editForm.pair_quantity) : Number(proposal.pair_quantity || (proposal as any).so_luong_giay || (proposal as any).quantity || 0);

        const costBefore = isEditing ? Number(editForm.cost_before || 0) : Number((proposal as any).cost_before || (proposal as any).chi_phi_truoc || 0);
        const costAfter = isEditing ? Number(editForm.cost_after || 0) : Number((proposal as any).cost_after || (proposal as any).chi_phi_sau || 0);

        let totalSavingsVnd = 0;
        if (isCostMode) {
          totalSavingsVnd = isEditing
            ? (Number(editForm.total_savings_vnd) || Math.max(0, costBefore - costAfter))
            : Number(proposal.total_savings_vnd || (proposal as any).tong_tien_tiet_kiem || Math.max(0, costBefore - costAfter));
        } else {
          totalSavingsVnd = pairQty > 0 ? efficiencyVnd * pairQty : efficiencyVnd;
        }

        const totalSavingsWordsText = totalSavingsVnd > 0 ? convertNumberToWords(totalSavingsVnd) : "";

        return (
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>📈</span>
              <span>HIỆU QUẢ CẢI TIẾN {isCostMode ? "(TIẾT KIỆM TRỰC TIẾP CHÍ PHÍ / VẬT TƯ)" : "(THỜI GIAN / NĂNG SUẤT)"}</span>
            </h4>

            {isEditing ? (
              isCostMode ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                      <span>💰</span>
                      <span>Nhập chi phí &amp; đánh giá tiết kiệm ({normCat === "MATERIAL_SAVING" ? "1. Tiết kiệm Vật tư" : "2. Tiết kiệm Chi phí"})</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      Tiết kiệm trực tiếp
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600 block">CHI PHÍ TRƯỚC (VNĐ)</label>
                      <input
                        type="number"
                        min={0}
                        step="1000"
                        value={editForm.cost_before || ""}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setEditForm((prev: any) => {
                            const cb = val;
                            const ca = prev.cost_after || 0;
                            const tot = Math.max(0, cb - ca);
                            return { ...prev, cost_before: cb, total_savings_vnd: tot };
                          });
                        }}
                        placeholder="VD: 10,000,000"
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600 block">CHI PHÍ SAU (VNĐ)</label>
                      <input
                        type="number"
                        min={0}
                        step="1000"
                        value={editForm.cost_after || ""}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setEditForm((prev: any) => {
                            const cb = prev.cost_before || 0;
                            const ca = val;
                            const tot = Math.max(0, cb - ca);
                            return { ...prev, cost_after: ca, total_savings_vnd: tot };
                          });
                        }}
                        placeholder="VD: 5,000,000"
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-amber-900 block">TỔNG TIẾT KIỆM (VNĐ)</label>
                      <input
                        type="number"
                        min={0}
                        step="1000"
                        value={editForm.total_savings_vnd || ""}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, total_savings_vnd: Math.max(0, parseFloat(e.target.value) || 0) }))}
                        placeholder="Nhập tổng số tiền tiết kiệm..."
                        className="w-full p-2.5 rounded-xl border border-amber-400 font-black text-amber-950 bg-white text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600 block">THỜI GIAN TRƯỚC (GIÂY)</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.time_before_seconds}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, time_before_seconds: Math.max(0, parseFloat(e.target.value) || 0) }))}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600 block">THỜI GIAN SAU (GIÂY)</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.time_after_seconds}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, time_after_seconds: Math.max(0, parseFloat(e.target.value) || 0) }))}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600 block">TIẾT KIỆM (GIÂY TỰ ĐỘNG)</label>
                      <div className="w-full p-2.5 rounded-xl bg-purple-100 border border-purple-300 font-black text-purple-950 text-xs">
                        {savedSecs} giây
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600 block">HIỆU QUẢ VNĐ / ĐÔI</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.efficiency_value_vnd}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, efficiency_value_vnd: Math.max(0, parseFloat(e.target.value) || 0) }))}
                        placeholder={`${Math.round(savedSecs * 12.5)} VNĐ`}
                        className="w-full p-2.5 rounded-xl border border-emerald-300 font-bold bg-emerald-50 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600 block">SỐ LƯỢNG GIÀY (ĐÔI)</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.pair_quantity}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, pair_quantity: Math.max(0, parseInt(e.target.value) || 0) }))}
                        placeholder="Số đôi..."
                        className="w-full p-2.5 rounded-xl border border-blue-300 font-bold bg-blue-50 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )
            ) : isCostMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">CHI PHÍ TRƯỚC</span>
                  <span className="text-lg font-black text-slate-900 block truncate">
                    {costBefore > 0 ? `${costBefore.toLocaleString("vi-VN")} VNĐ` : "---"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">CHI PHÍ SAU</span>
                  <span className="text-lg font-black text-slate-900 block truncate">
                    {costAfter > 0 ? `${costAfter.toLocaleString("vi-VN")} VNĐ` : "---"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#00522c] text-white space-y-1 shadow-md border border-emerald-400/30">
                  <span className="text-[10px] font-extrabold uppercase text-amber-300 block">TỔNG TIẾT KIỆM</span>
                  <span className="text-lg font-black text-white block truncate">
                    {totalSavingsVnd > 0 ? `${totalSavingsVnd.toLocaleString("vi-VN")} VNĐ` : "0 VNĐ"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-200 block truncate">Tiết kiệm trực tiếp</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">TRƯỚC</span>
                  <span className="text-xl font-black text-slate-900 block">{timeBefore}</span>
                  <span className="text-[10px] font-bold text-slate-500 block">giây</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">SAU</span>
                  <span className="text-xl font-black text-slate-900 block">{timeAfter}</span>
                  <span className="text-[10px] font-bold text-slate-500 block">giây</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-purple-700 block">TIẾT KIỆM</span>
                  <span className="text-xl font-black text-purple-900 block">{savedSecs}</span>
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

      {/* SO SÁNH HÌNH ẢNH (VỚI CHỨC NĂNG THAY ĐỔI ẢNH KHI EDIT MODE) */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span>🖼</span>
          <span>SO SÁNH HÌNH ẢNH</span>
        </h4>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Ảnh Trước */}
          <div className="p-3 sm:p-3.5 rounded-2xl border-2 border-rose-200 bg-rose-50/20 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-900">Trước</span>
              {isEditing && (
                <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-all">
                  <IconCloudUpload size={13} />
                  <span>{uploadingImage === "before" ? "Đang tải..." : "Thay ảnh"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage !== null}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageUpload(e.target.files[0], "before_image_url");
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {(isEditing ? editForm.before_image_url : proposal.before_image_url) ? (
              <div className="relative group">
                <img
                  src={isEditing ? editForm.before_image_url : proposal.before_image_url}
                  alt="Before"
                  className="w-full h-44 sm:h-52 object-contain rounded-xl border border-rose-200 bg-white"
                />
              </div>
            ) : (
              <div className="w-full h-36 sm:h-44 rounded-xl border border-dashed border-rose-200 bg-white flex flex-col items-center justify-center text-slate-400 font-bold text-xs gap-1">
                <span>Chưa có ảnh trước</span>
                {isEditing && (
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-black border border-rose-300">
                    + Tải ảnh lên
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0], "before_image_url");
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Ảnh Sau */}
          <div className="p-3 sm:p-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/20 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900">Sau</span>
              {isEditing && (
                <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-all">
                  <IconCloudUpload size={13} />
                  <span>{uploadingImage === "after" ? "Đang tải..." : "Thay ảnh"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage !== null}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageUpload(e.target.files[0], "after_image_url");
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {(isEditing ? editForm.after_image_url : proposal.after_image_url) ? (
              <div className="relative group">
                <img
                  src={isEditing ? editForm.after_image_url : proposal.after_image_url}
                  alt="After"
                  className="w-full h-44 sm:h-52 object-contain rounded-xl border border-emerald-200 bg-white"
                />
              </div>
            ) : (
              <div className="w-full h-36 sm:h-44 rounded-xl border border-dashed border-emerald-200 bg-white flex flex-col items-center justify-center text-slate-400 font-bold text-xs gap-1">
                <span>Chưa có ảnh sau</span>
                {isEditing && (
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-black border border-emerald-300">
                    + Tải ảnh lên
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0], "after_image_url");
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabExpertReviewContent({ proposal, isOwner, initialEvalData }: { proposal: KaizenProposal; isOwner: boolean; initialEvalData: any }) {
  return (
    <div className="p-5 md:p-6 text-xs text-slate-500">
      <p>Chức năng đánh giá chuyên môn khả dụng cho hội đồng.</p>
    </div>
  );
}

function TabAwardReviewContent({
  proposal,
  isJudgeOrExecutive,
  onEvaluate,
  onRate,
}: {
  proposal: KaizenProposal;
  isJudgeOrExecutive: boolean;
  onEvaluate?: () => void;
  onRate?: () => void;
}) {
  return (
    <div className="p-5 md:p-6 text-xs text-slate-500">
      <p>Chức năng đánh giá giải thưởng thi đua khả dụng cho giám khảo.</p>
    </div>
  );
}
