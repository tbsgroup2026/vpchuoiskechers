"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { getValidKaizenImageUrl } from "@/lib/kaizenImageHelper";
import { formatMax2Decimals, formatVND } from "@/lib/formatNumber";
import { getKaizenDisplayTitle, getKaizenBeforeDescription, getKaizenAfterSolution, getAutoBaremGroupForCategory } from "@/lib/kaizenTitleHelper";
import {
  IconX,
  IconTrophy,
  IconStar,
  IconThumbUp,
  IconPhoto,
  IconAward,
  IconEditCircle,
  IconEdit,
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
import { resolveEmployeeName } from "@/lib/userProfiles";
import FeasibilityApprovalModal from "./FeasibilityApprovalModal";
import { uploadCloudinaryFile } from "@/lib/cloudinary";

interface KaizenDetailModalProps {
  proposal: KaizenProposal;
  isOpen: boolean;
  initialTab?: "info" | "expert_review" | "star_review";
  onClose: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  onEvaluate?: () => void;
  onRate?: () => void;
  onSaveSuccess?: (updatedPayload: any) => void;
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

const REGIONS = [
  "Văn phòng Chuỗi",
  "Nhà Máy Miền Đông",
  "Kiên Giang 1",
  "Kiên Giang 2",
  "Kiên Giang 3",
  "Hoàn Thiện Đế",
];
const CUSTOMERS = ["Skechers", "Decathlon", "Wrangler", "Reebok", "LEFASO", "Khác"];

export function isVpChuoiProposal(p: any): boolean {
  if (!p) return false;

  const siteCode = String(p.site_code || "").toLowerCase();
  const sourceReg = String(p.source_region || "").toLowerCase();
  const factory = String(p.factory || "").toLowerCase();
  const region = String(p.region || "").toLowerCase();
  const plantCode = String(p.plant_code || "").toUpperCase();

  if (
    siteCode === "thkiengiangshoes" ||
    sourceReg.includes("kiên giang") ||
    factory.includes("kiên giang") ||
    region.includes("kiên giang") ||
    plantCode.includes("KG")
  ) {
    return false;
  }

  return (
    siteCode === "vpchuoiskechers" ||
    sourceReg.includes("văn phòng chuỗi") ||
    sourceReg.includes("vp chuỗi") ||
    sourceReg.includes("vpchuoi") ||
    factory.includes("văn phòng chuỗi") ||
    factory.includes("vp chuỗi") ||
    factory.includes("vpchuoi") ||
    region.includes("văn phòng chuỗi") ||
    region.includes("vp chuỗi") ||
    region.includes("vpchuoi") ||
    plantCode === "VPCHUOI" ||
    plantCode === "VP2_SKECHERS"
  );
}

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
  if (cat === "OTHER" || cat.includes("8.") || cat.includes("Khác") || cat.includes("Khac")) {
    return "OTHER";
  }
  return "PRODUCTIVITY";
}

// Phân loại nào tự động khoá về đúng 1 Nhóm chấm điểm (ẩn 2 nhóm còn lại) trong tab "Đánh giá
// chuyên môn" — 3 phân loại KHÔNG rõ khớp đúng nhóm nào ("6.Tự động hoá", "7.MMTB CCDC", "8.Khác")
// thì KHÔNG khoá, vẫn hiện đủ cả 3 nhóm để giám khảo tự chọn như trước đây.
export function getLockedScoreGroup(normCategory: string): "GROUP1" | "GROUP2" | "GROUP3" | null {
  switch (normCategory) {
    case "PRODUCTIVITY":
      return "GROUP1";
    case "MATERIAL_SAVING":
    case "COST_SAVING":
      return "GROUP2";
    case "SAFETY":
    case "5S":
      return "GROUP3";
    default:
      return null;
  }
}

export default function KaizenDetailModal({
  proposal,
  isOpen,
  initialTab,
  onClose,
  onEdit,
  onDelete,
  onEvaluate,
  onRate,
  onSaveSuccess,
}: KaizenDetailModalProps) {
  const { user, isExecutiveOrAdmin } = usePermission();
  const levelRank = (user as any)?.levelRank || (user as any)?.roleLevel || 4;
  const [activeTab, setActiveTab] = useState<"info" | "expert_review" | "star_review">(initialTab || "info");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
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
    saved_seconds: 0,
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

    const rawTB = Number(proposal.time_before_seconds ?? (proposal as any).timeBeforeSeconds ?? 0);
    const rawTA = Number(proposal.time_after_seconds ?? (proposal as any).timeAfterSeconds ?? 0);
    const rawSaved = Number(proposal.saved_seconds ?? (proposal as any).so_giay_tiet_kiem ?? (proposal as any).savedSeconds ?? 0);

    let initTB = rawTB;
    let initTA = rawTA;
    if (initTB === 0 && initTA === 0 && rawSaved > 0) {
      initTB = rawSaved;
      initTA = 0;
    }

    const pairQty = Number(proposal.pair_quantity ?? (proposal as any).so_luong_giay ?? (proposal as any).quantity ?? 0);
    const sSecs = (initTB > 0 || initTA > 0) ? Math.max(0, initTB - initTA) : rawSaved;
    const effVal = Number(proposal.efficiency_value_vnd ?? (proposal as any).efficiencyValueVND ?? Math.round(sSecs * 12.5));
    const costB = Number((proposal as any).cost_before ?? (proposal as any).cost_before_vnd ?? (proposal as any).costBeforeVnd ?? (proposal as any).chi_phi_truoc ?? 0);
    const costA = Number((proposal as any).cost_after ?? (proposal as any).cost_after_vnd ?? (proposal as any).costAfterVnd ?? (proposal as any).chi_phi_sau ?? 0);

    const existingTot = Number(proposal.total_savings_vnd ?? (proposal as any).tong_tien_tiet_kiem ?? (proposal as any).totalSavingsVnd ?? 0);
    const calcTot = (isCostCat || initialPricingDir === "TRI_GIA")
      ? Math.max(0, costB - costA)
      : (pairQty > 0 ? effVal * pairQty : effVal);
    const initTot = existingTot > 0 ? existingTot : calcTot;

    setEditForm({
      title: getKaizenDisplayTitle(proposal),
      product_code: (proposal as any).product_code || proposal.code || "",
      pair_quantity: pairQty,
      region: proposal.region || proposal.factory || "Nhà Máy Miền Đông",
      department: proposal.department || "",
      line: proposal.line || "",
      customer: proposal.customer || "Skechers",
      category: normCategory,
      pricing_direction: initialPricingDir,
      before_description: getKaizenBeforeDescription(proposal),
      after_solution: getKaizenAfterSolution(proposal),
      time_before_seconds: initTB,
      time_after_seconds: initTA,
      saved_seconds: sSecs,
      efficiency_value_vnd: effVal,
      cost_before: costB,
      cost_after: costA,
      total_savings_vnd: initTot,
      before_image_url: proposal.before_image_url || "",
      after_image_url: proposal.after_image_url || "",
    });
    setEditError(null);
  };

  const isFormInitializedRef = React.useRef<boolean>(false);
  const prevProposalIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!proposal) {
      isFormInitializedRef.current = false;
      return;
    }
    const isProposalIdChanged = proposal.id && proposal.id !== prevProposalIdRef.current;

    if (!isFormInitializedRef.current || isProposalIdChanged) {
      isFormInitializedRef.current = true;
      prevProposalIdRef.current = proposal.id || null;
      initEditForm();
    }
  }, [proposal?.id]);

  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(proposal?.before_image_url ? { type: "image", url: getValidKaizenImageUrl(proposal.before_image_url, proposal.attachments_json) } : null);

  useEffect(() => {
    const curBefore = getValidKaizenImageUrl(isEditing ? editForm.before_image_url : proposal?.before_image_url, proposal?.attachments_json);
    const curAfter = getValidKaizenImageUrl(isEditing ? editForm.after_image_url : proposal?.after_image_url);
    if (curBefore) {
      setSelectedMedia({ type: "image", url: curBefore });
    } else if (curAfter) {
      setSelectedMedia({ type: "image", url: curAfter });
    } else {
      setSelectedMedia(null);
    }
  }, [proposal, isEditing, editForm.before_image_url, editForm.after_image_url]);

  const isOwner = useMemo(() => {
    if (!user || !proposal) return false;
    const uEmp = (user.empCode || "").trim().toUpperCase();
    const pEmp = (proposal.proposer_emp_code || "").trim().toUpperCase();
    const uName = (user.name || "").trim().toLowerCase();
    const pName = (proposal.proposer_name || "").trim().toLowerCase();
    return Boolean((uEmp && pEmp && uEmp === pEmp) || (uName && pName && uName === pName));
  }, [user, proposal]);

  const canEditOrDelete = useMemo(() => {
    if (!user) return false;
    if (isOwner || isExecutiveOrAdmin) return true;
    const uEmp = (user.empCode || "").trim().toUpperCase();
    const uName = (user.name || "").trim().toLowerCase();
    return (
      ["201711002", "210602002", "202608001", "202608010", "222102020", "2026080001"].includes(uEmp) ||
      uName.includes("anh huy") || uName.includes("lê khải") || uName.includes("le khai") ||
      uName.includes("thanh tình") || uName.includes("thanh tinh") ||
      uName.includes("trần thị ngoan") || uName.includes("ngoan")
    );
  }, [user, isOwner, isExecutiveOrAdmin]);

  const isJudgeOrExecutive = useMemo(() => {
    if (!user) return false;
    const uEmp = (user.empCode || "").trim().toUpperCase();
    const uName = (user.name || "").trim().toLowerCase();
    const rc = ((user as any)?.roleCode || (user as any)?.role || "").toUpperCase();
    const uRoles = Array.isArray((user as any)?.roles) ? (user as any).roles : [];
    
    const isExplicitApprover =
      ["202608001", "202608010", "222102020", "202112003", "202608002", "210602002", "201711002", "2026080001", "LEKHAI", "DUTHITHANHTINH"].includes(uEmp) ||
      uName.includes("anh huy") || uName.includes("lê khải") || uName.includes("le khai") ||
      uName.includes("thanh tình") || uName.includes("thanh tinh") || uName.includes("dư thị thanh tình") ||
      uName.includes("trần thị ngoan") || uName.includes("ngoan") ||
      uRoles.includes("ci_lead") || uRoles.includes("ci") || uRoles.includes("ie") || uRoles.includes("judge") || uRoles.includes("internal_judge");

    if (isExecutiveOrAdmin || isExplicitApprover || levelRank >= 2 || (user as any)?.isGuest) return true;
    return ["TONG_GIAM_DOC", "PHO_TONG_GIAM_DOC", "GIAM_DOC", "PHO_GIAM_DOC", "TRUONG_PHONG", "CI_LEAD", "IE", "QC", "ADMIN", "JUDGE", "INTERNAL_JUDGE"].includes(rc);
  }, [user, isExecutiveOrAdmin, levelRank]);

  const [evalData, setEvalData] = useState<any>(null);

  const fetchEvalData = React.useCallback(async () => {
    if (!proposal?.id) return;
    try {
      let token = "";
      if (typeof window !== "undefined") {
        token = localStorage.getItem("tbs_token") || localStorage.getItem("tbs_jwt_token") || sessionStorage.getItem("tbs_token") || "";
        if (!token && typeof document !== "undefined") {
          const match = document.cookie.match(/(?:^|; )tbs_token=([^;]*)/);
          if (match && match[1]) token = decodeURIComponent(match[1]);
        }
      }
      const safeToken = token.startsWith("Bearer ") ? token.trim() : (token ? `Bearer ${token.trim()}` : "");
      const res = await fetch(`/api/ci-kaizen/expert-evaluations?proposalId=${proposal.id}`, {
        headers: safeToken ? { Authorization: safeToken } : {},
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEvalData(json.data);
      }
    } catch (e) {}
  }, [proposal?.id]);

  useEffect(() => {
    fetchEvalData();
  }, [fetchEvalData]);

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

      const uploadRes = await uploadCloudinaryFile(file, {
        category: field === "after_image_url" ? "kaizen_after" : "kaizen_before",
        fileType: "image",
      });

      if (uploadRes.secure_url) {
        setEditForm((prev) => ({ ...prev, [field]: uploadRes.secure_url }));
        const cleanUrl = getValidKaizenImageUrl(uploadRes.secure_url);
        if (cleanUrl) {
          setSelectedMedia({ type: "image", url: cleanUrl });
        }
      } else {
        setEditError("❌ Lỗi không nhận được URL từ Cloudinary");
      }
    } catch (err: any) {
      setEditError(`❌ Lỗi upload ảnh: ${err.message || "Không thể kết nối Cloudinary"}`);
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

    const timeBefore = Number(editForm.time_before_seconds ?? proposal.time_before_seconds ?? 0);
    const timeAfter = Number(editForm.time_after_seconds ?? proposal.time_after_seconds ?? 0);
    const savedSecs = (timeBefore > 0 || timeAfter > 0)
      ? Math.max(0, timeBefore - timeAfter)
      : Number(editForm.saved_seconds ?? proposal.saved_seconds ?? 0);
    const effValue = Number(editForm.efficiency_value_vnd) || Math.round(savedSecs * 12.5);
    const pairQty = Number(editForm.pair_quantity) || Number(proposal.pair_quantity) || 0;
    const costBefore = Number(editForm.cost_before || 0);
    const costAfter = Number(editForm.cost_after || 0);

    let totalSavings = Number(editForm.total_savings_vnd || 0);
    if (!totalSavings) {
      if (isCostMode || (costBefore > 0 && costAfter >= 0)) {
        totalSavings = Math.max(0, costBefore - costAfter);
      } else {
        totalSavings = pairQty > 0 ? effValue * pairQty : (Number(proposal.total_savings_vnd) || effValue);
      }
    }

    const totalSavingsWords = totalSavings > 0 ? convertNumberToWords(totalSavings) : "";

    try {
      setSaving(true);
      setEditError(null);

      const payload = {
        id: proposal.id,
        code: proposal.code || proposal.id,
        proposal_id: proposal.id,
        proposal_code: proposal.code || proposal.id,
        title: editForm.title.trim(),
        product_code: editForm.product_code.trim(),
        pair_quantity: pairQty,
        quantity: pairQty,
        so_luong_giay: pairQty,
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
        so_giay_tiet_kiem: savedSecs,
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

      let token = "";
      if (typeof window !== "undefined") {
        token = localStorage.getItem("tbs_jwt_token") || localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_jwt_token") || sessionStorage.getItem("tbs_token") || "";
        if (!token && typeof document !== "undefined") {
          const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("tbs_token="));
          if (tokenCookie) token = tokenCookie.split("=")[1];
        }
      }

      console.log("📤 [Frontend Save] Request PUT /api/ci-kaizen:\n" + JSON.stringify(payload, null, 2));

      const res = await fetch("/api/ci-kaizen", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store",
          "X-User-Emp-Code": user?.empCode || "202608001",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log("📥 [Frontend Save] Response from /api/ci-kaizen (status: " + res.status + "):\n" + JSON.stringify(json, null, 2));

      if (res.ok && json.success) {
        const updatedData = { ...payload, ...(json.data || {}) };
        Object.assign(proposal, updatedData);
        (proposal as any).time_before_seconds = updatedData.time_before_seconds || timeBefore;
        (proposal as any).time_after_seconds = updatedData.time_after_seconds || timeAfter;
        (proposal as any).timeBeforeSeconds = updatedData.time_before_seconds || timeBefore;
        (proposal as any).timeAfterSeconds = updatedData.time_after_seconds || timeAfter;
        (proposal as any).saved_seconds = updatedData.saved_seconds || savedSecs;
        (proposal as any).savedSeconds = updatedData.saved_seconds || savedSecs;
        (proposal as any).so_giay_tiet_kiem = updatedData.saved_seconds || savedSecs;
        (proposal as any).efficiency_value_vnd = updatedData.efficiency_value_vnd || effValue;
        (proposal as any).efficiencyValueVND = updatedData.efficiency_value_vnd || effValue;
        (proposal as any).cost_before = updatedData.cost_before || costBefore;
        (proposal as any).cost_after = updatedData.cost_after || costAfter;
        (proposal as any).chi_phi_truoc = updatedData.cost_before || costBefore;
        (proposal as any).chi_phi_sau = updatedData.cost_after || costAfter;
        (proposal as any).total_savings_vnd = updatedData.total_savings_vnd || totalSavings;
        (proposal as any).totalSavingsVnd = updatedData.total_savings_vnd || totalSavings;
        (proposal as any).tong_tien_tiet_kiem = updatedData.total_savings_vnd || totalSavings;
        (proposal as any).pair_quantity = updatedData.pair_quantity || pairQty;
        (proposal as any).so_luong_giay = updatedData.pair_quantity || pairQty;
        (proposal as any).quantity = updatedData.pair_quantity || pairQty;

        const finalAfterImg = updatedData.after_image_url || editForm.after_image_url;
        if (finalAfterImg) {
          proposal.after_image_url = finalAfterImg;
          (proposal as any).afterImageUrl = finalAfterImg;
        }
        const finalBeforeImg = updatedData.before_image_url || editForm.before_image_url;
        if (finalBeforeImg) {
          proposal.before_image_url = finalBeforeImg;
          (proposal as any).beforeImageUrl = finalBeforeImg;
        }
        if (updatedData.attachments_json) {
          proposal.attachments_json = updatedData.attachments_json;
        }

        setIsEditing(false);
        initEditForm();
        if (onSaveSuccess) onSaveSuccess(updatedData);
        if (onEvaluate) onEvaluate();
        if (onRate) onRate();
      } else {
        setEditError(`❌ ${json.message || json.error || "Không thể cập nhật đề xuất trên cơ sở dữ liệu D1!"}`);
      }
    } catch (err: any) {
      console.error("❌ [Frontend Save] Exception caught during PUT /api/ci-kaizen:", err);
      setEditError(`❌ Lỗi kết nối máy chủ: ${err.message || "Vui lòng thử lại sau."}`);
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

  const isApprovedStatus = Boolean(
    proposal?.approval_status === "PHE_DUYET" ||
    proposal?.approval_status === "DA_DUYET" ||
    proposal?.sub_status === "CHO_DANH_GIA" ||
    proposal?.sub_status === "DA_DANH_GIA" ||
    proposal?.sub_status === "DA_DUYET" ||
    proposal?.trang_thai === "DA_DANH_GIA" ||
    proposal?.trang_thai === "DA_DUYET" ||
    proposal?.trang_thai === "PHE_DUYET" ||
    proposal?.review_status === "DA_DUYET" ||
    proposal?.review_status === "PHE_DUYET" ||
    proposal?.status === "APPROVED" ||
    proposal?.status === "UNDER_REVIEW"
  );

  const isRejectedStatus = Boolean(
    proposal?.approval_status === "TU_CHOI" ||
    proposal?.sub_status === "TU_CHOI_TRIEN_KHAI" ||
    proposal?.sub_status === "TU_CHOI" ||
    proposal?.trang_thai === "TU_CHOI_TRIEN_KHAI" ||
    proposal?.trang_thai === "TU_CHOI" ||
    proposal?.status === "REJECTED"
  );

  const isApprovedStep3 = isApprovedStatus || (
    proposal?.sub_status !== "CHO_REVIEW" &&
    proposal?.sub_status !== "CHO_DUYET" &&
    proposal?.trang_thai !== "CHO_DUYET" &&
    proposal?.approval_status !== "PENDING" &&
    proposal?.status !== "SUBMITTED"
  );

  const [canSeeExpertTab, setCanSeeExpertTab] = useState(false);
  const [expertEvalMeta, setExpertEvalMeta] = useState<any>(null);
  const canSeeAwardTab = isApprovedStep3 && isAssignedJudge;

  useEffect(() => {
    if (!proposal?.id) {
      setCanSeeExpertTab(false);
      setExpertEvalMeta(null);
      return;
    }
    let isMounted = true;
    let token = typeof window !== "undefined"
      ? (localStorage.getItem("tbs_token") || localStorage.getItem("tbs_jwt_token") || sessionStorage.getItem("tbs_token") || "")
      : "";
    if (!token && typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )tbs_token=([^;]*)/);
      if (match && match[1]) token = decodeURIComponent(match[1]);
    }

    const headers: Record<string, string> = {};
    if (token) {
      const cleanToken = token.startsWith("Bearer ") ? token.replace("Bearer ", "").trim() : token.trim();
      headers["Authorization"] = `Bearer ${cleanToken.replace(/[^\x00-\xFF]/g, (c) => encodeURIComponent(c))}`;
    }
    if (user?.empCode) {
      headers["X-User-Emp-Code"] = String(user.empCode).replace(/[^\x00-\xFF]/g, (c) => encodeURIComponent(c));
    }

    fetch(`/api/ci-kaizen/expert-evaluations?proposalId=${proposal.id}`, { headers })
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          setExpertEvalMeta(json);
          if ((json.success && json.canSeeExpertTab) || isJudgeOrExecutive) {
            setCanSeeExpertTab(true);
          } else {
            setCanSeeExpertTab(false);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          if (isJudgeOrExecutive) {
            setCanSeeExpertTab(true);
          } else {
            setCanSeeExpertTab(false);
          }
          setExpertEvalMeta(null);
        }
      });
  }, [proposal?.id, user, isJudgeOrExecutive]);

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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[98vw] sm:max-w-[95vw] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] h-[92vh] max-h-[92vh] flex flex-row overflow-hidden text-left animate-in zoom-in-95 duration-200">
        
        {/* 1. SIDEBAR TRÁI (300-320px CỐ ĐỊNH, SCROLL RIÊNG VỚI NÚT GHIM ĐÁY) */}
        <div className="w-[280px] sm:w-[300px] md:w-[320px] shrink-0 flex flex-col h-full bg-slate-50 border-r border-slate-200 overflow-hidden">
          
          {/* PHẦN SCROLL THÔNG TIN */}
          <div className="p-3 flex-1 overflow-y-auto space-y-2.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
            {editError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in">
                {editError}
              </div>
            )}

            {/* KHOẢNG ẢNH BẢO ĐẢM ASPECT 16/9, MAX HEIGHT 130PX & PLACEHOLDER XÁM NHẠT */}
            <div className="space-y-1.5">
              <div className="relative w-full aspect-video max-h-[135px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-2xs flex items-center justify-center">
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
                  <div className="text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-1">
                    <IconPhoto size={24} className="opacity-50 text-slate-400" />
                    <span>Không có ảnh</span>
                  </div>
                )}
              </div>

              <div className="flex gap-1.5">
                {getValidKaizenImageUrl(isEditing ? editForm.before_image_url : proposal.before_image_url, proposal.attachments_json) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const url = getValidKaizenImageUrl(isEditing ? editForm.before_image_url : proposal.before_image_url, proposal.attachments_json);
                      if (url) setSelectedMedia({ type: "image", url });
                    }}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-slate-100 ${
                      selectedMedia?.url === getValidKaizenImageUrl(isEditing ? editForm.before_image_url : proposal.before_image_url, proposal.attachments_json) && selectedMedia?.type === "image"
                        ? "border-[#006838] ring-2 ring-[#006838]/30"
                        : "border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                    }`}
                    title="Ảnh Trước"
                  >
                    <img src={getValidKaizenImageUrl(isEditing ? editForm.before_image_url : proposal.before_image_url, proposal.attachments_json)} alt="" className="w-full h-full object-cover" />
                  </button>
                ) : null}

                {getValidKaizenImageUrl(isEditing ? editForm.after_image_url : (proposal.after_image_url || (proposal as any).afterImageUrl), proposal.attachments_json, "AFTER", isEditing ? editForm.before_image_url : proposal.before_image_url) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const url = getValidKaizenImageUrl(isEditing ? editForm.after_image_url : (proposal.after_image_url || (proposal as any).afterImageUrl), proposal.attachments_json, "AFTER", isEditing ? editForm.before_image_url : proposal.before_image_url);
                      if (url) setSelectedMedia({ type: "image", url });
                    }}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-slate-100 ${
                      selectedMedia?.url === getValidKaizenImageUrl(isEditing ? editForm.after_image_url : (proposal.after_image_url || (proposal as any).afterImageUrl), proposal.attachments_json, "AFTER", isEditing ? editForm.before_image_url : proposal.before_image_url) && selectedMedia?.type === "image"
                        ? "border-[#006838] ring-2 ring-[#006838]/30"
                        : "border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                    }`}
                    title="Ảnh Sau"
                  >
                    <img src={getValidKaizenImageUrl(isEditing ? editForm.after_image_url : (proposal.after_image_url || (proposal as any).afterImageUrl), proposal.attachments_json, "AFTER", isEditing ? editForm.before_image_url : proposal.before_image_url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {(isEditing ? editForm.region : proposal.region) || "Nhà Máy Miền Đông"} &bull; {catObj.label.toUpperCase()}
            </div>

            {/* ĐIỂM TB & CHUYÊN MÔN (2 CỘT) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-center space-y-0.5">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">ĐIỂM TB</span>
                <span className="text-xs font-bold text-amber-600 block">
                  {formatMax2Decimals(proposal.avg_rating || 0)} ⭐
                </span>
                <span className="text-[9.5px] text-slate-400 block">
                  {proposal.rating_count || 0} lượt đánh giá
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-center space-y-0.5">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">CHUYÊN MÔN</span>
                <span className="text-xs font-bold text-emerald-600 block">
                  {(() => {
                    const val = Number(proposal.judge_final_score || proposal.score_points || evalData?.judgeFinalScore || evalData?.myScore?.total_score || 0);
                    if (val > 0) return `${Math.round(val * 10) / 10}/100`;
                    if (Array.isArray(evalData?.scores) && evalData.scores.length > 0) {
                      const sum = evalData.scores.reduce((acc: number, s: any) => acc + Number(s.total_score || 0), 0);
                      return `${Math.round((sum / evalData.scores.length) * 10) / 10}/100`;
                    }
                    return "---";
                  })()}
                </span>
                <span className="text-[9.5px] text-slate-400 block">
                  {(() => {
                    const val = Number(proposal.judge_final_score || proposal.score_points || evalData?.judgeFinalScore || evalData?.myScore?.total_score || 0);
                    const cnt = evalData?.totalJudgesScored || (Array.isArray(evalData?.scores) ? evalData.scores.length : (val > 0 ? 1 : 0));
                    if (val > 0 || (Array.isArray(evalData?.scores) && evalData.scores.length > 0)) {
                      return cnt > 0 ? `Đã tổng hợp (${cnt} GK)` : "Đã tổng hợp";
                    }
                    return "Chờ tổng hợp";
                  })()}
                </span>
              </div>
            </div>

            {/* NGƯỜI ĐĂNG KÝ (FULL WIDTH 1 HÀNG) */}
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                NGƯỜI ĐĂNG KÝ
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">👤</span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {proposal.proposer_name || proposal.proposer_emp_code || "---"}
                </span>
              </div>
            </div>

            {/* KHU VỰC (FULL WIDTH 1 HÀNG) */}
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">KHU VỰC / NHÀ MÁY</span>
              {isEditing ? (
                <select
                  value={editForm.region}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, region: e.target.value }))}
                  className="w-full text-xs font-semibold text-slate-900 bg-amber-50 border border-amber-300 rounded-lg p-1"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-slate-900 block truncate" title={proposal.region || proposal.factory || "---"}>
                  🏢 {proposal.region || proposal.factory || "---"}
                </span>
              )}
            </div>

            {/* CÁC Ô CÒN LẠI (LƯỚI 2 CỘT) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">PHÂN LOẠI</span>
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
                    className="w-full text-xs font-semibold text-slate-900 bg-amber-50 border border-amber-300 rounded-lg p-1"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-slate-900 block truncate" title={catObj.label}>
                    {catObj.label}
                  </span>
                )}
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">KHÁCH HÀNG</span>
                {isEditing ? (
                  <select
                    value={editForm.customer}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, customer: e.target.value }))}
                    className="w-full text-xs font-semibold text-slate-900 bg-amber-50 border border-amber-300 rounded-lg p-1"
                  >
                    {CUSTOMERS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {cust || "---"}
                  </span>
                )}
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">NGÀY ĐĂNG</span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {proposal.created_at ? new Date(proposal.created_at).toLocaleDateString("vi-VN") : "---"}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">VTCV</span>
                <span className="text-xs font-bold text-slate-900 block truncate" title={vtcv}>
                  {vtcv}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">NHÓM SP/DV</span>
                <span className="text-xs font-bold text-slate-900 block truncate" title={prodGroup || proposal.factory || "---"}>
                  {prodGroup || proposal.factory || "---"}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">MSNV</span>
                <span className="text-xs font-mono font-bold text-slate-900 block truncate">
                  {proposal.proposer_emp_code || "---"}
                </span>
              </div>
            </div>
          </div>

          {/* CỤM NÚT SỬA / XÓA / ĐÓNG GHIM Ở ĐÁY PANEL TRÁI */}
          <div className="p-3 shrink-0 border-t border-slate-200 bg-slate-50 space-y-1.5">
            {thiDuaMsg && (
              <div className="p-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold text-center animate-in fade-in">
                {thiDuaMsg}
              </div>
            )}

            {!isEditing && (proposal.status === "ARCHIVED" || proposal.sub_status === "LUU_TRU" || proposal.registration_type === "LUU_TRU") && isJudgeOrExecutive && (
              <button
                type="button"
                disabled={markingThiDua}
                onClick={handleToggleThiDua}
                className={`w-full h-9 px-3 rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  Number(proposal.is_thi_dua) === 1
                    ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                }`}
              >
                <IconTrophy size={15} />
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
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveInlineEdit}
                  className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <IconLoader2 size={15} className="animate-spin" /> : <IconDeviceFloppy size={15} />}
                  <span>{saving ? "Lưu..." : "Lưu"}</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    initEditForm();
                    setIsEditing(false);
                  }}
                  className="h-9 px-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <IconX size={15} />
                  <span>Hủy</span>
                </button>
              </div>
            ) : canEditOrDelete ? (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="h-9 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <IconEditCircle size={15} />
                  <span>Sửa</span>
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="h-9 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <IconTrash size={15} />
                  <span>Xóa</span>
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="w-full h-9 px-3 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>✕ Đóng</span>
            </button>
          </div>
        </div>

        {/* 2. PANEL PHẢI (MAIN CONTENT FLEX-1 FILL) */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-white overflow-hidden">
          
          <div className="flex-shrink-0 p-3.5 sm:p-4 space-y-2.5 border-b border-slate-200 bg-white">
            {/* HÀNG BADGES TRÊN */}
            <div className="flex items-center gap-1.5 flex-wrap min-h-[26px]">
              <span className="h-6 px-2.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap">
                <span>📈</span>
                <span>{catObj.label}</span>
              </span>

              <span className="h-6 px-2.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap">
                <span>🏆</span>
                <span>{proposal.registration_type === "THI_DUA" ? "Thi đua" : "Lưu trữ"}</span>
              </span>

              <span
                className={`h-6 px-2.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap ${
                  isRejectedStatus
                    ? "bg-rose-50 text-rose-800 border-rose-300"
                    : isApprovedStatus
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-blue-50 text-blue-800 border-blue-300"
                }`}
              >
                <span>
                  {isRejectedStatus ? "❌" : isApprovedStatus ? "✅" : "⏳"}
                </span>
                <span>
                  {isRejectedStatus ? "Từ chối" : isApprovedStatus ? "Đã duyệt" : "Chờ phê duyệt"}
                </span>
              </span>

              {isEditing && (
                <span className="h-6 px-2.5 rounded-full bg-amber-400 text-amber-950 font-bold text-xs border border-amber-500 inline-flex items-center gap-1 animate-pulse whitespace-nowrap">
                  ✏️ Chế độ Sửa trực tiếp
                </span>
              )}
            </div>

            {/* TIÊU ĐỀ SÁNG KIẾN & DÒNG MSNV SUBTITLE */}
            {isEditing ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-amber-800 block">Tiêu đề sáng kiến:</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tiêu đề đề xuất sáng kiến..."
                  className="w-full text-lg font-bold p-2 rounded-xl border border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/60 text-slate-900"
                />
              </div>
            ) : (
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 leading-snug tracking-tight">
                {getKaizenDisplayTitle(proposal)}
              </h2>
            )}

            <p className="text-xs text-slate-500 font-medium">
              MSNV: <span className="font-mono text-slate-700 font-bold">{proposal.proposer_emp_code}</span> &bull; KV: <span className="text-slate-700 font-bold">{(isEditing ? editForm.region : proposal.region) || "Nhà Máy Miền Đông"}</span> &bull; Tháng {pMonth}/{pYear}
            </p>

            {/* BANNER PHÊ DUYỆT TÍNH KHẢ THI (BƯỚC 3 - QĐ-TBKG) BANNER TOP */}
            {!isEditing && isJudgeOrExecutive && !isApprovedStatus && !isRejectedStatus && (
              <div className="mt-2 p-2.5 sm:p-3 rounded-xl bg-sky-50 border border-sky-200 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex-1 min-w-[200px] space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-950">
                    <span className="text-sky-600 shrink-0">💭</span>
                    <span className="font-bold text-sky-950">Xem xét tính khả thi sáng kiến (Bước 3 – QĐ-TBKG)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    Đề xuất đang ở trạng thái <strong className="text-sky-800 font-bold">Chờ phê duyệt</strong>. Bạn có muốn phê duyệt tính khả thi để cho phép thử nghiệm và đánh giá?
                  </p>
                </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap w-full xl:w-auto pt-0.5 xl:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setFeasibilityInitialDecision("APPROVE");
                        setIsFeasibilityModalOpen(true);
                      }}
                      className="h-8 px-2.5 rounded-lg bg-[#009b55] hover:bg-[#008247] text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <IconCheck size={15} />
                      <span>Phê Duyệt Triển Khai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFeasibilityInitialDecision("REJECT");
                        setIsFeasibilityModalOpen(true);
                      }}
                      className="h-8 px-2.5 rounded-lg bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <IconX size={15} />
                      <span>Từ Chối Triển Khai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFeasibilityInitialDecision("APPROVE");
                        setIsFeasibilityModalOpen(true);
                      }}
                      className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <IconAward size={15} />
                      <span>Khuyến Khích</span>
                    </button>
                  </div>
                </div>
              )}
          </div>

          <div className="flex-shrink-0 px-3.5 sm:px-4 h-[36px] border-b border-slate-200 bg-slate-50/50 flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`h-7 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "info"
                  ? "bg-[#0b1739] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <span>ℹ️ Thông tin {isEditing ? "(Đang sửa)" : ""}</span>
            </button>

            {canSeeExpertTab && (
              <button
                type="button"
                onClick={() => setActiveTab("expert_review")}
                className={`h-7 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "expert_review"
                    ? "bg-[#0b1739] text-[#ffd700] shadow-2xs"
                    : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
                }`}
              >
                <span>♛ Đánh giá chuyên môn {expertEvalMeta?.data?.totalJudgesScored ? `(${expertEvalMeta.data.totalJudgesScored})` : ""}</span>
              </button>
            )}

            {canSeeAwardTab && (
              <button
                type="button"
                onClick={() => setActiveTab("star_review")}
                className={`h-7 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "star_review"
                    ? "bg-[#0b1739] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <span>★ Đánh giá thưởng</span>
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
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
        proposal={
          proposal
            ? {
                ...proposal,
                after_image_url: (isEditing && editForm.after_image_url) ? editForm.after_image_url : (proposal.after_image_url || (proposal as any).afterImageUrl || ""),
                before_image_url: (isEditing && editForm.before_image_url) ? editForm.before_image_url : (proposal.before_image_url || (proposal as any).beforeImageUrl || ""),
              }
            : null
        }
        initialDecision={feasibilityInitialDecision}
        onClose={() => setIsFeasibilityModalOpen(false)}
        onSuccess={(updated) => {
          proposal.approval_status = updated.approval_status;
          proposal.sub_status = updated.sub_status;
          proposal.status = updated.status;
          if (updated.time_before_seconds !== undefined) proposal.time_before_seconds = updated.time_before_seconds;
          if (updated.time_after_seconds !== undefined) proposal.time_after_seconds = updated.time_after_seconds;
          if (updated.saved_seconds !== undefined) proposal.saved_seconds = updated.saved_seconds;
          if (updated.after_image_url) {
            proposal.after_image_url = updated.after_image_url;
            (proposal as any).afterImageUrl = updated.after_image_url;
            setEditForm((prev) => ({ ...prev, after_image_url: updated.after_image_url }));
            const cleanUrl = getValidKaizenImageUrl(updated.after_image_url);
            if (cleanUrl) setSelectedMedia({ type: "image", url: cleanUrl });
          }
          if (updated.attachments_json) {
            proposal.attachments_json = updated.attachments_json;
          }
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
                {getKaizenBeforeDescription(proposal)}
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
                {getKaizenAfterSolution(proposal)}
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

        const tBeforeRaw = isEditing ? Number(editForm.time_before_seconds) : Number(proposal.time_before_seconds || (proposal as any).timeBeforeSeconds || 0);
        const tAfterRaw = isEditing ? Number(editForm.time_after_seconds) : Number(proposal.time_after_seconds || (proposal as any).timeAfterSeconds || 0);
        const rawSavedSecs = Number(proposal.saved_seconds || (proposal as any).so_giay_tiet_kiem || (proposal as any).savedSeconds || 0);
        
        let timeBefore = isNaN(tBeforeRaw) ? 0 : tBeforeRaw;
        let timeAfter = isNaN(tAfterRaw) ? 0 : tAfterRaw;
        let savedSecs = (timeBefore > 0 || timeAfter > 0) ? Math.max(0, timeBefore - timeAfter) : rawSavedSecs;

        if (!isEditing && timeBefore === 0 && timeAfter === 0 && savedSecs > 0) {
          timeBefore = savedSecs;
          timeAfter = 0;
        }

        const effRaw = isEditing
          ? (Number(editForm.efficiency_value_vnd) || Math.round(savedSecs * 12.5))
          : (Number(proposal.efficiency_value_vnd || (proposal as any).efficiencyValueVND) || (savedSecs > 0 ? Math.round(savedSecs * 12.5) : 0));
        const efficiencyVnd = isNaN(effRaw) ? 0 : effRaw;

        const pQtyRaw = isEditing ? Number(editForm.pair_quantity) : Number(proposal.pair_quantity || (proposal as any).so_luong_giay || (proposal as any).quantity || 0);
        const pairQty = isNaN(pQtyRaw) ? 0 : pQtyRaw;

        const mult = pairQty > 0 ? pairQty : 1;
        const cBeforeRaw = isEditing ? Number(editForm.cost_before || 0) : (Number((proposal as any).cost_before || (proposal as any).chi_phi_truoc) || (timeBefore > 0 ? Math.round(timeBefore * 12.5 * mult) : 0));
        const costBefore = isNaN(cBeforeRaw) ? 0 : cBeforeRaw;

        const cAfterRaw = isEditing ? Number(editForm.cost_after || 0) : (Number((proposal as any).cost_after || (proposal as any).chi_phi_sau) || (timeAfter > 0 ? Math.round(timeAfter * 12.5 * mult) : 0));
        const costAfter = isNaN(cAfterRaw) ? 0 : cAfterRaw;

        let totalSavingsVnd = 0;
        if (isCostMode) {
          const totRaw = isEditing
            ? (Number(editForm.total_savings_vnd) || Math.max(0, costBefore - costAfter))
            : (Number(proposal.total_savings_vnd || (proposal as any).totalSavingsVnd || (proposal as any).tong_tien_tiet_kiem) || Math.max(0, costBefore - costAfter));
          totalSavingsVnd = isNaN(totRaw) ? 0 : totRaw;
        } else {
          const totRaw = Number(proposal.total_savings_vnd || (proposal as any).totalSavingsVnd || (proposal as any).tong_tien_tiet_kiem || 0);
          const calcTot = (costBefore > 0 || costAfter > 0) ? Math.max(0, costBefore - costAfter) : (pairQty > 0 ? efficiencyVnd * pairQty : efficiencyVnd);
          totalSavingsVnd = totRaw > 0 ? totRaw : calcTot;
        }
        if (isNaN(totalSavingsVnd)) totalSavingsVnd = 0;

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
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-emerald-900 flex items-center gap-1.5">
                      <span>⏱️</span>
                      <span>Nhập thời gian thử nghiệm &amp; đánh giá hiệu quả (3. Tăng Năng suất)</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      12.5đ / giây
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        TRƯỚC (giây) <span className="text-rose-600 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={editForm.time_before_seconds}
                        onChange={(e) => {
                          const tb = Math.max(0, parseFloat(e.target.value) || 0);
                          const ta = Number(editForm.time_after_seconds) || 0;
                          const sSecs = Math.max(0, tb - ta);
                          const pq = Number(editForm.pair_quantity) || 0;
                          const mult = pq > 0 ? pq : 1;
                          const cb = Math.round(tb * 12.5 * mult);
                          const ca = Math.round(ta * 12.5 * mult);
                          const eff = Math.round(sSecs * 12.5);
                          const calcTot = Math.max(0, cb - ca);
                          setEditForm((prev: any) => ({
                            ...prev,
                            time_before_seconds: tb,
                            cost_before: cb,
                            cost_after: ca,
                            efficiency_value_vnd: eff,
                            total_savings_vnd: pq > 0 ? calcTot : (prev.total_savings_vnd > 0 ? prev.total_savings_vnd : calcTot),
                          }));
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        SAU (giây) <span className="text-rose-600 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={editForm.time_after_seconds}
                        onChange={(e) => {
                          const tb = Number(editForm.time_before_seconds) || 0;
                          const ta = Math.max(0, parseFloat(e.target.value) || 0);
                          const sSecs = Math.max(0, tb - ta);
                          const pq = Number(editForm.pair_quantity) || 0;
                          const mult = pq > 0 ? pq : 1;
                          const cb = Math.round(tb * 12.5 * mult);
                          const ca = Math.round(ta * 12.5 * mult);
                          const eff = Math.round(sSecs * 12.5);
                          const calcTot = Math.max(0, cb - ca);
                          setEditForm((prev: any) => ({
                            ...prev,
                            time_after_seconds: ta,
                            cost_before: cb,
                            cost_after: ca,
                            efficiency_value_vnd: eff,
                            total_savings_vnd: pq > 0 ? calcTot : (prev.total_savings_vnd > 0 ? prev.total_savings_vnd : calcTot),
                          }));
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block truncate" title="SỐ LƯỢNG GIÀY (ĐÔI) *">
                        SỐ LƯỢNG GIÀY (ĐÔI) <span className="text-rose-600 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={editForm.pair_quantity}
                        onChange={(e) => {
                          const pq = Math.max(0, parseInt(e.target.value) || 0);
                          const tb = Number(editForm.time_before_seconds) || 0;
                          const ta = Number(editForm.time_after_seconds) || 0;
                          const sSecs = Math.max(0, tb - ta);
                          const mult = pq > 0 ? pq : 1;
                          const cb = Math.round(tb * 12.5 * mult);
                          const ca = Math.round(ta * 12.5 * mult);
                          const eff = Math.round(sSecs * 12.5);
                          const calcTot = Math.max(0, cb - ca);
                          setEditForm((prev: any) => ({
                            ...prev,
                            pair_quantity: pq,
                            cost_before: cb,
                            cost_after: ca,
                            efficiency_value_vnd: eff,
                            total_savings_vnd: pq > 0 ? calcTot : (prev.total_savings_vnd > 0 ? prev.total_savings_vnd : calcTot),
                          }));
                        }}
                        placeholder="Nhập số đôi giày..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-emerald-200/60">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        💵 CHI PHÍ TRƯỚC (VNĐ)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="1000"
                        value={editForm.cost_before || (timeBefore > 0 ? Math.round(timeBefore * 12.5 * (pairQty > 0 ? pairQty : 1)) : "")}
                        onChange={(e) => {
                          const cb = Math.max(0, parseFloat(e.target.value) || 0);
                          const ca = Number(editForm.cost_after) || 0;
                          setEditForm((prev: any) => ({
                            ...prev,
                            cost_before: cb,
                            total_savings_vnd: Math.max(0, cb - ca),
                          }));
                        }}
                        placeholder="Tự động tính: TRƯỚC (s) × 12.5đ × Số đôi..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        💵 CHI PHÍ SAU (VNĐ)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="1000"
                        value={editForm.cost_after || (timeAfter > 0 ? Math.round(timeAfter * 12.5 * (pairQty > 0 ? pairQty : 1)) : "")}
                        onChange={(e) => {
                          const cb = Number(editForm.cost_before) || 0;
                          const ca = Math.max(0, parseFloat(e.target.value) || 0);
                          setEditForm((prev: any) => ({
                            ...prev,
                            cost_after: ca,
                            total_savings_vnd: Math.max(0, cb - ca),
                          }));
                        }}
                        placeholder="Tự động tính: SAU (s) × 12.5đ × Số đôi..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      💰 TỔNG SỐ TIỀN TIẾT KIỆM ĐƯỢC (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="1000"
                      value={editForm.total_savings_vnd !== undefined && editForm.total_savings_vnd !== null ? editForm.total_savings_vnd : totalSavingsVnd}
                      onChange={(e) => {
                        const tot = Math.max(0, parseFloat(e.target.value) || 0);
                        setEditForm((prev: any) => ({ ...prev, total_savings_vnd: tot }));
                      }}
                      placeholder="Nhập hoặc tính tự động từ thời gian & đôi..."
                      className="w-full p-2.5 rounded-xl border border-emerald-400 text-sm font-black text-emerald-950 bg-white outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 space-y-0.5 shadow-2xs">
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 block">TRƯỚC</span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 block">{formatMax2Decimals(timeBefore)}</span>
                      <span className="text-[9px] font-bold text-slate-500 block">giây</span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200 space-y-0.5 shadow-2xs">
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 block">SAU</span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 block">{formatMax2Decimals(timeAfter)}</span>
                      <span className="text-[9px] font-bold text-slate-500 block">giây</span>
                    </div>

                    <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 space-y-0.5 shadow-2xs">
                      <span className="text-[9px] font-extrabold uppercase text-purple-700 block">TIẾT KIỆM</span>
                      <span className="text-xs sm:text-sm font-black text-purple-900 block">{formatMax2Decimals(savedSecs)}s</span>
                      <span className="text-[8.5px] font-bold text-purple-600 block truncate">
                        {timeBefore > 0 ? `${formatMax2Decimals((savedSecs / timeBefore) * 100)}%` : "0%"}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#006838] text-white space-y-0.5 shadow-xs">
                      <span className="text-[9px] font-extrabold uppercase text-emerald-200 block">HIỆU QUẢ</span>
                      <span className="text-xs font-black text-white block truncate" title={`${formatVND(efficiencyVnd)} VNĐ`}>
                        {formatVND(efficiencyVnd)}
                      </span>
                      <span className="text-[8.5px] font-bold text-emerald-200 block">VNĐ / đôi</span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#00522c] text-white space-y-0.5 shadow-sm border border-emerald-500/30 col-span-2 sm:col-span-1">
                      <span className="text-[9px] font-extrabold uppercase text-amber-300 block">TỔNG TIẾT KIỆM</span>
                      <span className="text-xs font-black text-white block truncate" title={`${formatVND(totalSavingsVnd)} VNĐ`}>
                        {formatVND(totalSavingsVnd)}
                      </span>
                      <span className="text-[8.5px] font-bold text-emerald-200 block">VNĐ</span>
                    </div>
                  </div>
                </div>
              )
            ) : isCostMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">CHI PHÍ TRƯỚC</span>
                  <span className="text-lg font-black text-slate-900 block truncate">
                    {costBefore > 0 ? `${formatVND(costBefore)} VNĐ` : "---"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">CHI PHÍ SAU</span>
                  <span className="text-lg font-black text-slate-900 block truncate">
                    {costAfter > 0 ? `${formatVND(costAfter)} VNĐ` : "---"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#00522c] text-white space-y-1 shadow-md border border-emerald-400/30">
                  <span className="text-[10px] font-extrabold uppercase text-amber-300 block">TỔNG TIẾT KIỆM</span>
                  <span className="text-lg font-black text-white block truncate">
                    {totalSavingsVnd > 0 ? `${formatVND(totalSavingsVnd)} VNĐ` : "0 VNĐ"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-200 block truncate">Tiết kiệm trực tiếp</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">TRƯỚC</span>
                  <span className="text-xl font-black text-slate-900 block">{formatMax2Decimals(timeBefore)}</span>
                  <span className="text-[10px] font-bold text-slate-500 block">giây</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">SAU</span>
                  <span className="text-xl font-black text-slate-900 block">{formatMax2Decimals(timeAfter)}</span>
                  <span className="text-[10px] font-bold text-slate-500 block">giây</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-purple-700 block">TIẾT KIỆM</span>
                  <span className="text-xl font-black text-purple-900 block">{formatMax2Decimals(savedSecs)}</span>
                  <span className="text-[10px] font-bold text-purple-600 block">
                    giây {timeBefore && savedSecs ? `(${formatMax2Decimals((savedSecs / timeBefore) * 100)}%)` : ""}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#006838] text-white space-y-1 shadow-md">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-200 block">HIỆU QUẢ</span>
                  <span className="text-base sm:text-lg font-black text-white block truncate">
                    {formatVND(efficiencyVnd)} VNĐ
                  </span>
                  <span className="text-[10px] font-bold text-emerald-200 block">quy đổi / đôi</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-blue-700 block">SỐ LƯỢNG GIÀY</span>
                  <span className="text-base sm:text-lg font-black text-blue-950 block truncate">
                    {pairQty > 0 ? formatVND(pairQty) : "0"}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 block">đôi / đơn hàng</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#00522c] text-white space-y-1 shadow-md border border-emerald-400/30">
                  <span className="text-[10px] font-extrabold uppercase text-amber-300 block">TỔNG TIẾT KIỆM</span>
                  <span className="text-base sm:text-lg font-black text-white block truncate">
                    {totalSavingsVnd > 0 ? `${formatVND(totalSavingsVnd)} VNĐ` : "0 VNĐ"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-200 block truncate">
                    {pairQty > 0 ? `cho ${formatVND(pairQty)} đôi` : "tính quy đổi"}
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

            {getValidKaizenImageUrl(isEditing ? editForm.before_image_url : proposal.before_image_url, proposal.attachments_json, "BEFORE") ? (
              <div className="relative group">
                <img
                  src={getValidKaizenImageUrl(isEditing ? editForm.before_image_url : proposal.before_image_url, proposal.attachments_json, "BEFORE")}
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

            {getValidKaizenImageUrl(isEditing ? editForm.after_image_url : (proposal.after_image_url || (proposal as any).afterImageUrl), proposal.attachments_json, "AFTER", isEditing ? editForm.before_image_url : proposal.before_image_url) ? (
              <div className="relative group">
                <img
                  src={getValidKaizenImageUrl(isEditing ? editForm.after_image_url : (proposal.after_image_url || (proposal as any).afterImageUrl), proposal.attachments_json, "AFTER", isEditing ? editForm.before_image_url : proposal.before_image_url)}
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

function TabExpertReviewContent({
  proposal,
  isOwner,
  initialEvalData,
  onEvaluate,
  onRate,
}: {
  proposal: KaizenProposal;
  isOwner: boolean;
  initialEvalData: any;
  onEvaluate?: () => void;
  onRate?: () => void;
}) {
  const { user } = usePermission();
  const [loading, setLoading] = useState(true);
  const [evalMeta, setEvalMeta] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Measure sticky footer height dynamically to chừa khoảng trống không bị che nội dung
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState<number>(120);

  useEffect(() => {
    if (!footerRef.current) return;
    const updateHeight = () => {
      if (footerRef.current) {
        const rect = footerRef.current.getBoundingClientRect();
        if (rect.height > 0) {
          setFooterHeight(rect.height);
        }
      }
    };

    updateHeight();

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        updateHeight();
      });
      resizeObserver.observe(footerRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [loading, evalMeta]);

  // Guest declaration state
  const [declFullName, setDeclFullName] = useState("");
  const [declOrg, setDeclOrg] = useState("");
  const [declContact, setDeclContact] = useState("");
  const [declNoConflict, setDeclNoConflict] = useState(false);
  const [submittingDecl, setSubmittingDecl] = useState(false);

  // Conflict Modal & Commitment State
  const [noConflictDeclared, setNoConflictDeclared] = useState<boolean>(true);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
  const [conflictReason, setConflictReason] = useState<string>("");
  const [submittingConflict, setSubmittingConflict] = useState<boolean>(false);

  // Prerequisite step checks & Data verification
  const [p1Pass, setP1Pass] = useState<boolean>(true);
  const [p2Pass, setP2Pass] = useState<boolean>(true);
  const [p3Pass, setP3Pass] = useState<boolean>(true);
  const [p4Pass, setP4Pass] = useState<boolean>(true);
  const [prereqNote, setPrereqNote] = useState<string>("");
  const [isVerifiedData, setIsVerifiedData] = useState<boolean>(true);

  // Real Scorer Identity State for Shared Guest Accounts / BGK
  const [realScorerEmpCode, setRealScorerEmpCode] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("tbs_real_scorer_emp_code") || "";
    return "";
  });
  const [realScorerName, setRealScorerName] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("tbs_real_scorer_name") || "";
    return "";
  });
  const [realScorerOrg, setRealScorerOrg] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("tbs_real_scorer_org") || "";
    return "";
  });
  const [realScorerPhone, setRealScorerPhone] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("tbs_real_scorer_phone") || "";
    return "";
  });
  const [realScorerEmail, setRealScorerEmail] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("tbs_real_scorer_email") || "";
    return "";
  });

  // Identify Internal User vs Guest User (Virtual accounts must declare real info in Step 1)
  const isGuestAccount = useMemo(() => {
    if (!user) return true;
    const rc = String((user as any)?.roleCode || (user as any)?.role || "").toUpperCase();
    const uRoles = Array.isArray((user as any)?.roles) ? (user as any).roles : [];
    const empCodeStr = String(user?.empCode || "").toLowerCase();
    const nameStr = String(user?.name || "").toLowerCase();
    const emailStr = String(user?.email || "").toLowerCase();

    const isExplicitGuest = Boolean(
      (user as any)?.isGuest ||
      (user as any)?.is_guest_shared ||
      rc === "JUDGE_GUEST" ||
      uRoles.includes("judge_guest")
    );

    const isVirtualPattern =
      empCodeStr.startsWith("guest_") ||
      empCodeStr.includes("khách mời") ||
      empCodeStr.includes("khach moi") ||
      empCodeStr.includes("bgk") ||
      nameStr.includes("khách mời") ||
      nameStr.includes("khach moi") ||
      nameStr.includes("bgk") ||
      emailStr.includes("khách mời") ||
      emailStr.includes("khach moi");

      return isExplicitGuest || isVirtualPattern;
  }, [user]);

  const isInternalUser = useMemo(() => {
    return Boolean(user && user.empCode && !isGuestAccount);
  }, [user, isGuestAccount]);

  // Step 1 Confirmation state (per proposal session)
  const [isStep1Confirmed, setIsStep1Confirmed] = useState<boolean>(() => {
    if (isInternalUser) return true;
    if (typeof window !== "undefined" && proposal?.id) {
      const isConfirmed = localStorage.getItem(`tbs_real_scorer_confirmed_${proposal.id}`) === "true";
      const name = (localStorage.getItem("tbs_real_scorer_name") || "").trim();
      const org = (localStorage.getItem("tbs_real_scorer_org") || "").trim();
      const lower = name.toLowerCase();
      const isVirtualName = !name || lower.includes("khách mời") || lower.includes("khach moi") || lower.includes("bgk");
      return Boolean(isConfirmed && name && org && !isVirtualName);
    }
    return false;
  });

  // Auto-fill Internal User Identity & Skip Step 1 for Internal logged-in accounts
  useEffect(() => {
    if (isInternalUser && user) {
      const emp = String(user.empCode || "").trim();
      const name = String(user.name || resolveEmployeeName(user.empCode) || "").trim();
      const org = String(user.title || user.department || "Văn Phòng Chuỗi SKECHERS").trim();
      const phone = String(user.phone || "").trim();
      const email = String(user.email || "").trim();

      if (emp) setRealScorerEmpCode(emp);
      if (name) setRealScorerName(name);
      if (org) setRealScorerOrg(org);
      if (phone) setRealScorerPhone(phone);
      if (email) setRealScorerEmail(email);
      setNoConflictDeclared(true);
      setIsStep1Confirmed(true);
    }
  }, [isInternalUser, user, proposal?.id]);

  // 5 Criteria state & Category auto-mapping
  const catRawStr = proposal?.category || (proposal as any)?.category_label || (proposal as any)?.product_group || "";
  const autoMappedGroup = getAutoBaremGroupForCategory(catRawStr);
  const normCategory = normalizeCategoryId(proposal?.category || (proposal as any)?.category_label);
  const lockedScoreGroup = getLockedScoreGroup(normCategory);
  
  const [c1Group, setC1Group] = useState<"GROUP1" | "GROUP2" | "GROUP3">(lockedScoreGroup ?? autoMappedGroup);
  const [quantPct, setQuantPct] = useState<number | "">(15);

  const [c1Score, setC1Score] = useState<number>(30);
  const [c2Score, setC2Score] = useState<number>(15);
  const [c3Score, setC3Score] = useState<number>(15);
  const [c4Score, setC4Score] = useState<number>(11);
  const [c5Score, setC5Score] = useState<number>(7);

  const [c1Basis, setC1Basis] = useState("");
  const [c2Basis, setC2Basis] = useState("");
  const [c3Basis, setC3Basis] = useState("");
  const [c4Basis, setC4Basis] = useState("");
  const [c5Basis, setC5Basis] = useState("");

  const [submittingScore, setSubmittingScore] = useState(false);
  const [showBaremDetails, setShowBaremDetails] = useState(false);

  useEffect(() => {
    const freshAutoGroup = getAutoBaremGroupForCategory(
      proposal?.category || (proposal as any)?.category_label || (proposal as any)?.product_group || ""
    );
    if (!evalMeta?.data?.myScore?.c1_group) {
      setC1Group(freshAutoGroup);
    }
  }, [proposal?.id, proposal?.category, proposal?.category_label]);

  const getClientAuthToken = () => {
    if (typeof window === "undefined") return "";
    let token = localStorage.getItem("tbs_token") || localStorage.getItem("tbs_jwt_token") || sessionStorage.getItem("tbs_token") || "";
    if (!token && typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )tbs_token=([^;]*)/);
      if (match && match[1]) token = match[1];
    }
    if (!token && user?.empCode) {
      token = `tbs_token_${user.empCode}_${Date.now()}`;
    }
    const cleanToken = token.startsWith("Bearer ") ? token.replace("Bearer ", "").trim() : token.trim();
    const safeToken = cleanToken.replace(/[^\x00-\xFF]/g, (c) => encodeURIComponent(c));
    return safeToken ? `Bearer ${safeToken}` : "";
  };

  useEffect(() => {
    loadEvalData();
  }, [proposal?.id]);

  const loadEvalData = async () => {
    if (!proposal?.id) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      let token = getClientAuthToken();

      const res = await fetch(`/api/ci-kaizen/expert-evaluations?proposalId=${proposal.id}`, {
        headers: {
          ...(token ? { Authorization: token } : {}),
          ...(user?.empCode ? { "X-User-Emp-Code": String(user.empCode).replace(/[^\x00-\xFF]/g, (c) => encodeURIComponent(c)) } : {}),
        },
      });
      const json = await res.json();
      if (json.success) {
        setEvalMeta(json);
        if (json.data?.prereqCheck) {
          setP1Pass(Boolean(json.data.prereqCheck.p1_pass));
          setP2Pass(Boolean(json.data.prereqCheck.p2_pass));
          setP3Pass(Boolean(json.data.prereqCheck.p3_pass));
          setP4Pass(Boolean(json.data.prereqCheck.p4_pass));
          setPrereqNote(json.data.prereqCheck.note || "");
        }

        if (json.data?.myScore) {
          const s = json.data.myScore;
          setC1Group(s.c1_group || autoMappedGroup);
          setC1Score(s.c1_score ?? 30);
          setC2Score(s.c2_score ?? 15);
          setC3Score(s.c3_score ?? 15);
          setC4Score(s.c4_score ?? 11);
          setC5Score(s.c5_score ?? 0);
          setC1Basis(s.c1_basis || "");
          setC2Basis(s.c2_basis || "");
          setC3Basis(s.c3_basis || "");
          setC4Basis(s.c4_basis || "");
          setC5Basis(s.c5_basis || "");
          setIsVerifiedData(Boolean(s.is_verified_data));

          const savedName = (s.real_scorer_name || s.nguoi_cham_thuc_ho_ten || "").trim();
          const lowerSaved = savedName.toLowerCase();
          const isVirtualSavedName = !savedName || lowerSaved.includes("khách mời") || lowerSaved.includes("khach moi") || lowerSaved.includes("bgk");

          if (s.real_scorer_emp_code) setRealScorerEmpCode(s.real_scorer_emp_code);
          if (!isVirtualSavedName) setRealScorerName(savedName);
          if (s.real_scorer_org) setRealScorerOrg(s.real_scorer_org);
          if (s.real_scorer_phone) setRealScorerPhone(s.real_scorer_phone);
          if (s.real_scorer_email) setRealScorerEmail(s.real_scorer_email);

          setIsStep1Confirmed(true);
          setShowBaremDetails(false);
        } else {
          // Defaults for new score - Auto-set Barem group according to card Category
          const freshAuto = getAutoBaremGroupForCategory(
            proposal?.category || (proposal as any)?.category_label || (proposal as any)?.product_group || ""
          );
          setC1Group(freshAuto);
          setC1Score(30);
          setC2Score(15);
          setC3Score(15);
          setC4Score(11);
          setC5Score(0);
          setC1Basis("Hiệu quả cải tiến rõ ràng tại hiện trường sản xuất.");
          setC2Basis("Chi phí đầu tư thấp, thời gian hoàn vốn nhanh.");
          setC3Basis("Có thể nhân rộng cho các chuyền sản xuất tương tự.");
          setC4Basis("Có tính sáng tạo và chủ động cải tiến.");
          setC5Basis("Chia sẻ và lan tỏa tích cực cho tổ đồng nghiệp.");

          if (isInternalUser && user) {
            const emp = String(user.empCode || "").trim();
            const name = String(user.name || resolveEmployeeName(user.empCode) || "").trim();
            const org = String(user.title || user.department || "Văn Phòng Chuỗi SKECHERS").trim();
            const phone = String(user.phone || "").trim();
            const email = String(user.email || "").trim();

            if (emp) setRealScorerEmpCode(emp);
            if (name) setRealScorerName(name);
            if (org) setRealScorerOrg(org);
            if (phone) setRealScorerPhone(phone);
            if (email) setRealScorerEmail(email);
            setNoConflictDeclared(true);
            setIsStep1Confirmed(true);
          } else {
            // Guest User: THIS judge has not scored this proposal yet -> Reset barem form & step 1 declaration
            setRealScorerEmpCode("");
            setRealScorerName("");
            setRealScorerOrg("");
            setRealScorerPhone("");
            setRealScorerEmail("");
            setNoConflictDeclared(false);
            setIsStep1Confirmed(false);
          }
        }
      } else {
        setErrorMsg(json.error || "Không thể tải dữ liệu đánh giá chuyên môn.");
      }
    } catch (e) {
      setErrorMsg("Lỗi kết nối máy chủ đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Confirm = async () => {
    const trimmedName = realScorerName.trim();
    const lowerName = trimmedName.toLowerCase();

    if (!trimmedName) {
      setErrorMsg("⚠️ Vui lòng nhập đầy đủ Họ và tên Giám Khảo thực!");
      return;
    }
    if (lowerName.includes("khách mời") || lowerName.includes("khach moi") || lowerName.includes("bgk")) {
      setErrorMsg("⚠️ Vui lòng nhập Họ và tên thực của bạn (không dùng tên tài khoản ảo/khách mời mặc định)!");
      return;
    }
    if (!realScorerOrg.trim()) {
      setErrorMsg("⚠️ Vui lòng nhập Chức vụ / Đơn vị!");
      return;
    }
    if (!noConflictDeclared) {
      setErrorMsg("⚠️ Vui lòng tick chọn cam kết không có xung đột lợi ích!");
      return;
    }

    setErrorMsg(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("tbs_real_scorer_emp_code", realScorerEmpCode.trim());
      localStorage.setItem("tbs_real_scorer_name", trimmedName);
      localStorage.setItem("tbs_real_scorer_org", realScorerOrg.trim());
      localStorage.setItem("tbs_real_scorer_phone", realScorerPhone.trim());
      localStorage.setItem("tbs_real_scorer_email", realScorerEmail.trim());
      localStorage.setItem(`tbs_real_scorer_confirmed_${proposal.id}`, "true");
    }

    if (evalMeta?.declarationRequired) {
      setDeclFullName(trimmedName);
      setDeclOrg(realScorerOrg.trim());
      setDeclContact(realScorerPhone.trim() || realScorerEmail.trim());
      setDeclNoConflict(noConflictDeclared);
      await handleDeclarationSubmit();
    }

    setIsStep1Confirmed(true);
  };

  const handleAutoSuggestC1 = (pctVal: number) => {
    setQuantPct(pctVal);
    if (c1Group === "GROUP1") {
      if (pctVal >= 25) setC1Score(35);
      else if (pctVal >= 18) setC1Score(33);
      else if (pctVal >= 15) setC1Score(30);
      else if (pctVal >= 12) setC1Score(29);
      else if (pctVal >= 9) setC1Score(24);
      else if (pctVal >= 8) setC1Score(20);
      else if (pctVal >= 5) setC1Score(19);
      else setC1Score(14);
    } else if (c1Group === "GROUP2") {
      if (pctVal >= 45) setC1Score(35);
      else if (pctVal >= 35) setC1Score(33);
      else if (pctVal >= 30) setC1Score(30);
      else if (pctVal >= 25) setC1Score(29);
      else if (pctVal >= 19) setC1Score(24);
      else if (pctVal >= 15) setC1Score(20);
      else setC1Score(14);
    }
  };

  const handleDeclarationSubmit = async () => {
    if (!declFullName.trim()) {
      setErrorMsg("⚠️ Vui lòng nhập Họ và tên!");
      return;
    }
    if (!declNoConflict) {
      setErrorMsg("⚠️ Vui lòng tick chọn cam kết không có xung đột lợi ích!");
      return;
    }

    try {
      setSubmittingDecl(true);
      setErrorMsg(null);
      let token = getClientAuthToken();

      const res = await fetch("/api/ci-kaizen/expert-evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          action: "SUBMIT_DECLARATION",
          proposalId: proposal.id,
          fullName: (realScorerName || declFullName).trim(),
          organization: (realScorerOrg || declOrg).trim(),
          contactInfo: (realScorerPhone || realScorerEmail || declContact).trim(),
          msnv: realScorerEmpCode.trim(),
          phone: realScorerPhone.trim(),
          email: realScorerEmail.trim(),
          noConflictDeclared: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg("✅ Khai báo thông tin BGK khách mời thành công!");
        loadEvalData();
      } else {
        setErrorMsg(`❌ ${json.error || "Không thể lưu khai báo"}`);
      }
    } catch (e) {
      setErrorMsg("❌ Lỗi kết nối khi gửi khai báo.");
    } finally {
      setSubmittingDecl(false);
    }
  };

  const handleScoreSubmit = async () => {
    const effectiveEmpCode = (realScorerEmpCode || (isInternalUser ? user?.empCode : "") || "").trim();
    const effectiveName = (realScorerName || (isInternalUser ? (user?.name || resolveEmployeeName(user?.empCode)) : "") || "").trim();
    const effectiveOrg = (realScorerOrg || (isInternalUser ? (user?.title || user?.department || "Văn Phòng Chuỗi SKECHERS") : "") || "").trim();
    const effectivePhone = (realScorerPhone || (isInternalUser ? user?.phone : "") || "").trim();
    const effectiveEmail = (realScorerEmail || (isInternalUser ? user?.email : "") || "").trim();

    const lowerName = effectiveName.toLowerCase();
    const isVirtualName = !effectiveName || lowerName.includes("khách mời") || lowerName.includes("khach moi") || lowerName.includes("bgk");

    if (isGuestAccount || isVirtualName) {
      if (isVirtualName) {
        setErrorMsg("⚠️ Tài khoản ảo / BGK Khách mời: Bắt buộc phải khai báo Họ và tên người chấm thực (không dùng tên mặc định) ở Bước 1!");
        setIsStep1Confirmed(false);
        return;
      }
      if (!effectiveOrg) {
        setErrorMsg("⚠️ Tài khoản ảo / BGK Khách mời: Bắt buộc phải khai báo Chức vụ / Đơn vị ở Bước 1!");
        setIsStep1Confirmed(false);
        return;
      }
      if (!noConflictDeclared) {
        setErrorMsg("⚠️ Bắt buộc tick cam kết không có xung đột lợi ích ở Bước 1!");
        setIsStep1Confirmed(false);
        return;
      }
    }

    try {
      setSubmittingScore(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      let token = getClientAuthToken();

      if (typeof window !== "undefined") {
        if (effectiveName) localStorage.setItem("tbs_real_scorer_name", effectiveName);
        if (effectiveOrg) localStorage.setItem("tbs_real_scorer_org", effectiveOrg);
        if (effectivePhone) localStorage.setItem("tbs_real_scorer_phone", effectivePhone);
        if (effectiveEmail) localStorage.setItem("tbs_real_scorer_email", effectiveEmail);
      }

      const res = await fetch("/api/ci-kaizen/expert-evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          action: "SUBMIT_SCORE",
          proposalId: proposal.id,
          p1Pass,
          p2Pass,
          p3Pass,
          p4Pass,
          prereqNote,
          c1Group,
          c1Score,
          c2Score,
          c3Score,
          c4Score,
          c5Score,
          c1Basis,
          c2Basis,
          c3Basis,
          c4Basis,
          c5Basis,
          isVerifiedData,
          noConflictDeclared: true,
          realScorerEmpCode: effectiveEmpCode,
          realScorerName: effectiveName,
          realScorerOrg: effectiveOrg,
          realScorerPhone: effectivePhone,
          realScorerEmail: effectiveEmail,
        }),
      });

      const json = await res.json();
      if (json.success) {
        if (json.isDisqualified) {
          setSuccessMsg("❌ Hồ sơ không đạt điều kiện tiên quyết (Bước 0) và đã bị chuyển sang trạng thái Không đạt điều kiện.");
        } else {
          const finalScore = json.avgFinalTotalScore ?? json.judgeTotalScore ?? liveTotalScore;
          setSuccessMsg(`✅ Đã nộp điểm chuyên môn thành công! Tổng điểm của bạn: ${json.judgeTotalScore ?? liveTotalScore}đ${json.avgFinalTotalScore ? ` (Điểm TB tổng hợp: ${json.avgFinalTotalScore}đ)` : ''}.`);
          proposal.judge_final_score = finalScore;
          proposal.score_points = finalScore;
          if (json.updatedProposalStatus) {
            proposal.sub_status = json.updatedProposalStatus;
            proposal.trang_thai = json.updatedProposalStatus;
          }
        }
        if (typeof onEvaluate === "function") {
          onEvaluate();
        }
        if (typeof onRate === "function") {
          onRate();
        }
        setShowBaremDetails(false);
        loadEvalData();
      } else {
        setErrorMsg(`❌ ${json.error || "Không thể nộp bảng chấm điểm"}`);
      }
    } catch (e: any) {
      setErrorMsg(`❌ Lỗi kết nối khi nộp điểm: ${e.message || "Không thể kết nối máy chủ"}`);
    } finally {
      setSubmittingScore(false);
    }
  };

  const handleReportConflict = async () => {
    if (!conflictReason.trim()) {
      setErrorMsg("⚠️ Vui lòng chọn/nhập lý do xung đột lợi ích!");
      return;
    }
    try {
      setSubmittingConflict(true);
      let token = getClientAuthToken();
      const res = await fetch("/api/ci-kaizen/expert-evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          action: "REPORT_CONFLICT",
          proposalId: proposal.id,
          conflictReason: conflictReason.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowConflictModal(false);
        setSuccessMsg("✅ Đã ghi nhận báo cáo xung đột lợi ích và rút khỏi danh sách chấm.");
        loadEvalData();
      } else {
        setErrorMsg(`❌ ${json.error || "Lỗi báo cáo xung đột"}`);
      }
    } catch (e) {
      setErrorMsg("❌ Lỗi kết nối máy chủ");
    } finally {
      setSubmittingConflict(false);
    }
  };

  const currentCapFactor = isVerifiedData ? 1.0 : 0.6;
  const effectiveC1 = Math.min(c1Score, 35 * currentCapFactor);
  const effectiveC2 = Math.min(c2Score, 20 * currentCapFactor);
  const effectiveC3 = Math.min(c3Score, 20 * currentCapFactor);
  const effectiveC4 = Math.min(c4Score, 15 * currentCapFactor);
  const effectiveC5 = Math.min(c5Score, 10 * currentCapFactor);
  const liveTotalScore = Math.round((effectiveC1 + effectiveC2 + effectiveC3 + effectiveC4 + effectiveC5) * 10) / 10;

  const myScore = evalMeta?.data?.myScore;
  const isLocked = Boolean(myScore?.is_locked || (myScore && myScore.total_score !== undefined));
  const isReadOnly = Boolean(evalMeta?.readOnly);
  const hasSubmittedScore = Boolean(myScore || isLocked);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-extrabold text-xs">Đang tải bảng Đánh Giá Chuyên Môn BGK...</p>
      </div>
    );
  }

  const isStep1Valid = Boolean(
    realScorerName.trim() &&
    realScorerOrg.trim() &&
    noConflictDeclared
  );

  // BƯỚC 1: FORM KHAI BÁO THÔNG TIN NẾU CHƯA XÁC NHẬN
  if (!isStep1Confirmed) {
    return (
      <div className="p-5 md:p-6 flex flex-col gap-6 text-xs animate-in fade-in relative min-h-full">
        {/* MESSAGES */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2">
            <IconAlertTriangle size={18} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
            <IconCheck size={18} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* READONLY WARNING BANNER */}
        {isReadOnly && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconLock size={18} className="text-amber-700 shrink-0" />
              <span>⚠️ {evalMeta?.readOnlyReason || "Sáng kiến ngoài phạm vi phân công - Chế độ chỉ đọc"}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-950 text-[10px] uppercase font-black">
              CHỈ ĐỌC
            </span>
          </div>
        )}

        {/* HEADER SCORES OVERVIEW */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                ⚖️ ĐÁNH GIÁ CHUYÊN MÔN
              </span>
              {isLocked && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  🔒 ĐÃ KHÓA ĐIỂM
                </span>
              )}
            </div>
            <h3 className="text-base font-black mt-1.5">
              Bảng Chấm Điểm 5 Tiêu Chí Chuyên Môn
            </h3>
            <p className="text-[11px] text-slate-300">
              Chủ trì bởi Ban Giám Khảo &amp; Hội Đồng Chuyên Môn TBS Group
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 font-extrabold block">ĐIỂM TB TỔNG HỢP BGK</span>
              <span className="text-xl font-black text-amber-300 block">
                {(() => {
                  const scoreVal = evalMeta?.data?.judgeFinalScore || proposal?.judge_final_score || proposal?.score_points || evalMeta?.data?.myScore?.total_score;
                  return scoreVal && Number(scoreVal) > 0 ? `${Math.round(Number(scoreVal) * 10) / 10}/100` : "Chờ chốt điểm";
                })()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowConflictModal(true)}
              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <IconAlertTriangle size={15} />
              <span>Báo cáo xung đột</span>
            </button>
          </div>
        </div>

        {/* 👤 BƯỚC 1: FORM KHAI BÁO THÔNG TIN BAN GIÁM KHẢO / NGUỜI CHẤM THỰC */}
        <div className="p-5 sm:p-6 rounded-3xl bg-indigo-50/90 border-2 border-indigo-200 space-y-4 shadow-md">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-900 text-indigo-100 font-mono font-black text-xs uppercase">
              📋 BƯỚC 1 / 2
            </span>
            <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wide">
              Khai báo thông tin Ban Giám Khảo &amp; Người Chấm Thực (*)
            </h4>
          </div>
          <p className="text-xs text-indigo-900 leading-relaxed">
            Vui lòng hoàn thành khai báo thông tin người chấm thực trước khi mở bảng chấm điểm. Thông tin này bắt buộc để hệ thống ghi nhận chính xác giám khảo chấm, xuất biên bản tổng hợp và lưu vết D1 / Google Drive.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-black text-indigo-900 uppercase block mb-1">
                1. Mã số nhân viên (MSNV)
              </label>
              <input
                type="text"
                placeholder="Nhập MSNV (vd: 212184843)..."
                value={realScorerEmpCode}
                onChange={(e) => {
                  setRealScorerEmpCode(e.target.value);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("tbs_real_scorer_emp_code", e.target.value);
                  }
                }}
                className="w-full p-3 rounded-xl border border-indigo-300 font-bold text-xs bg-white text-indigo-950 shadow-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-black text-indigo-900 uppercase block mb-1">
                2. Họ và tên Giám Khảo <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập đầy đủ họ và tên..."
                value={realScorerName}
                onChange={(e) => {
                  setRealScorerName(e.target.value);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("tbs_real_scorer_name", e.target.value);
                  }
                }}
                className="w-full p-3 rounded-xl border border-indigo-300 font-bold text-xs bg-white text-indigo-950 shadow-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-black text-indigo-900 uppercase block mb-1">
                3. Chức vụ / Đơn vị <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: BGK Tập đoàn / Phòng CI..."
                value={realScorerOrg}
                onChange={(e) => {
                  setRealScorerOrg(e.target.value);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("tbs_real_scorer_org", e.target.value);
                  }
                }}
                className="w-full p-3 rounded-xl border border-indigo-300 font-bold text-xs bg-white text-indigo-950 shadow-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-black text-indigo-900 uppercase block mb-1">
                4. SĐT liên hệ
              </label>
              <input
                type="text"
                placeholder="Nhập SĐT..."
                value={realScorerPhone}
                onChange={(e) => {
                  setRealScorerPhone(e.target.value);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("tbs_real_scorer_phone", e.target.value);
                  }
                }}
                className="w-full p-3 rounded-xl border border-indigo-300 font-bold text-xs bg-white text-indigo-950 shadow-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-black text-indigo-900 uppercase block mb-1">
                5. Email liên hệ
              </label>
              <input
                type="text"
                placeholder="Nhập Email..."
                value={realScorerEmail}
                onChange={(e) => {
                  setRealScorerEmail(e.target.value);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("tbs_real_scorer_email", e.target.value);
                  }
                }}
                className="w-full p-3 rounded-xl border border-indigo-300 font-bold text-xs bg-white text-indigo-950 shadow-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <label className="p-3.5 rounded-xl bg-indigo-100/80 border border-indigo-300 flex items-start gap-2.5 cursor-pointer text-xs font-bold text-indigo-950 mt-2">
            <input
              type="checkbox"
              checked={noConflictDeclared}
              onChange={(e) => setNoConflictDeclared(e.target.checked)}
              className="w-4 h-4 accent-indigo-700 rounded cursor-pointer shrink-0 mt-0.5"
            />
            <span>
              Tôi cam kết không có xung đột lợi ích cá nhân (không phải đồng tác giả / không quản lý trực tiếp) đối với sáng kiến này. (*)
            </span>
          </label>

          <div className="pt-2 space-y-1.5">
            <button
              type="button"
              onClick={handleStep1Confirm}
              disabled={!isStep1Valid}
              className={`w-full py-3.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isStep1Valid
                  ? "bg-[#006838] hover:bg-[#00522c] text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-80"
              }`}
            >
              <span>Xác nhận &amp; Bắt đầu chấm điểm ➔</span>
            </button>
            {!isStep1Valid && (
              <p className="text-[11px] text-rose-600 font-extrabold text-center">
                (*) Vui lòng điền đủ Họ tên, Chức vụ/Đơn vị và tick chọn Cam kết không xung đột lợi ích để mở bảng chấm điểm.
              </p>
            )}
          </div>
        </div>

        {/* CONFLICT MODAL */}
        {showConflictModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <h3 className="text-base font-black text-rose-900 flex items-center gap-2">
                <IconAlertTriangle size={20} className="text-rose-600" />
                <span>Báo cáo Xung Đột Lợi Ích</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nếu bạn là người phụ trách/đồng tác giả hoặc có xung đột lợi ích với hồ sơ này, hãy chọn lý do để rút khỏi danh sách chấm.
              </p>

              <select
                value={conflictReason}
                onChange={(e) => setConflictReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
              >
                <option value="">-- Chọn lý do xung đột --</option>
                <option value="Đồng tác giả/Tham gia thực hiện sáng kiến">Đồng tác giả / Tham gia thực hiện sáng kiến</option>
                <option value="Quản lý trực tiếp tác giả sáng kiến">Quản lý trực tiếp tác giả sáng kiến</option>
                <option value="Có quan hệ thân nhân với tác giả">Có quan hệ thân nhân với tác giả</option>
                <option value="Khác">Lý do khác...</option>
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConflictModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={submittingConflict}
                  onClick={handleReportConflict}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
                >
                  {submittingConflict ? "Đang gửi..." : "Gửi Báo Cáo"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // BƯỚC 2: BẢNG CHẤM ĐIỂM (SAU KHỊ ĐÃ XÁC NHẬN BƯỚC 1)
  return (
    <div
      style={{ paddingBottom: `${footerHeight + 32}px` }}
      className="p-5 md:p-6 flex flex-col gap-6 text-xs animate-in fade-in relative min-h-full"
    >
      {/* MESSAGES */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2">
          <IconAlertTriangle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
          <IconCheck size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* READONLY WARNING BANNER */}
      {isReadOnly && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconLock size={18} className="text-amber-700 shrink-0" />
            <span>⚠️ {evalMeta?.readOnlyReason || "Sáng kiến ngoài phạm vi phân công - Chế độ chỉ đọc"}</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-950 text-[10px] uppercase font-black">
            CHỈ ĐỌC
          </span>
        </div>
      )}

      {/* HEADER SCORES OVERVIEW */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
              ⚖️ ĐÁNH GIÁ CHUYÊN MÔN
            </span>
            {isLocked && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                🔒 ĐÃ KHÓA ĐIỂM
              </span>
            )}
          </div>
          <h3 className="text-base font-black mt-1.5">
            Bảng Chấm Điểm 5 Tiêu Chí Chuyên Môn
          </h3>
          <p className="text-[11px] text-slate-300">
            Chủ trì bởi Ban Giám Khảo &amp; Hội Đồng Chuyên Môn TBS Group
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 font-extrabold block">ĐIỂM TB TỔNG HỢP BGK</span>
            <span className="text-xl font-black text-amber-300 block">
              {(() => {
                const scoreVal = evalMeta?.data?.judgeFinalScore || proposal?.judge_final_score || proposal?.score_points || evalMeta?.data?.myScore?.total_score;
                return scoreVal && Number(scoreVal) > 0 ? `${Math.round(Number(scoreVal) * 10) / 10}/100` : "Chờ chốt điểm";
              })()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowConflictModal(true)}
            className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <IconAlertTriangle size={15} />
            <span>Báo cáo xung đột</span>
          </button>
        </div>
      </div>

      {/* 📋 DÒNG TÓM TẮT THÔNG TIN GIÁM KHẢO Ở BƯỚC 2 */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/90 border-2 border-indigo-200 flex items-center justify-between flex-wrap gap-2 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-900 text-indigo-100 font-mono font-black text-[10px] uppercase">
            📋 GIÁM KHẢO
          </span>
          <span className="font-black text-indigo-950">
            {realScorerName} {realScorerEmpCode ? `(MSNV: ${realScorerEmpCode})` : ""} {realScorerOrg ? `— ${realScorerOrg}` : ""}
          </span>
          {(realScorerPhone || realScorerEmail) && (
            <span className="text-[11px] text-indigo-700 font-semibold hidden sm:inline">
              ({[realScorerPhone, realScorerEmail].filter(Boolean).join(" • ")})
            </span>
          )}
        </div>

        {!isLocked && !isReadOnly && (
          <button
            type="button"
            onClick={() => {
              setIsStep1Confirmed(false);
            }}
            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer flex items-center gap-1"
          >
            <span>✏️ Sửa thông tin</span>
          </button>
        )}
      </div>

      {/* NOTIFICATION MESSAGES IN STEP 2 */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2 animate-in fade-in shadow-xs">
          <IconAlertTriangle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2 animate-in fade-in shadow-xs">
          <IconCheck size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 0: PREREQUISITE CHECKLIST (BƯỚC 0 - ĐIỀU KIỆN TIÊN QUYẾT) */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
          <span>📌</span>
          <span>BƯỚC 0: ĐIỀU KIỆN TIÊN QUYẾT (PASS/FAIL)</span>
        </h4>
        <p className="text-[11px] text-amber-900">
          Hồ sơ phải đạt cả 4 điều kiện dưới đây. Nếu không đạt bất kỳ điều kiện nào, hồ sơ bị loại và không được đưa vào bảng xếp hạng.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold items-stretch">
          <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${p1Pass ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
            <input type="checkbox" disabled={isReadOnly || isLocked} checked={p1Pass} onChange={(e) => setP1Pass(e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
            <span>1. Đã triển khai thực tế tại hiện trường</span>
          </label>

          <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${p2Pass ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
            <input type="checkbox" disabled={isReadOnly || isLocked} checked={p2Pass} onChange={(e) => setP2Pass(e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
            <span>2. Có minh chứng trước-sau đầy đủ</span>
          </label>

          <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${p3Pass ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
            <input type="checkbox" disabled={isReadOnly || isLocked} checked={p3Pass} onChange={(e) => setP3Pass(e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
            <span>3. Không vi phạm An toàn lao động</span>
          </label>

          <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${p4Pass ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
            <input type="checkbox" disabled={isReadOnly || isLocked} checked={p4Pass} onChange={(e) => setP4Pass(e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
            <span>4. Không trùng lặp đề tài đạt giải trước</span>
          </label>
        </div>
      </div>

      {/* DATA VERIFICATION CHECKBOX (60% CAP IF UNVERIFIED) */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all shadow-xs ${isVerifiedData ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-amber-50/90 border-amber-300 text-amber-950'}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider ${isVerifiedData ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'}`}>
              {isVerifiedData ? "✅ Đã xác minh dữ liệu thực tế" : "⚠️ Dữ liệu khai báo tự do (Khống chế Max 60%)"}
            </span>
          </div>
          <span className="text-[11px] block font-medium opacity-90">
            {isVerifiedData
              ? "Số liệu đã được IE/Ban Kỹ Thuật xác minh độc lập tại hiện trường sản xuất (Chấm 100% thang điểm)."
              : "Số liệu tự khai báo (chưa xác minh độc lập) sẽ tự động bị giới hạn tối đa 60% thang điểm của từng tiêu chí."}
          </span>
        </div>
        <label className={`flex items-center gap-2 cursor-pointer shrink-0 border px-3.5 py-2 rounded-xl transition-all font-bold ${isVerifiedData ? 'bg-white border-emerald-400 text-emerald-950 shadow-xs' : 'bg-white border-amber-400 text-amber-950 shadow-xs hover:border-amber-500'}`}>
          <input
            type="checkbox"
            disabled={isReadOnly || isLocked}
            checked={isVerifiedData}
            onChange={(e) => setIsVerifiedData(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
          />
          <span>Đã xác nhận độc lập</span>
        </label>
      </div>
      {/* 5 CRITERIA FORM */}
      <div className="flex flex-col gap-5">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>⭐</span>
          <span>BỘ 5 TIÊU CHÍ CHẤM ĐIỂM CHUYÊN MÔN</span>
        </h4>

        {/* CRITERION 1: HIỆU QUẢ THỰC TẾ (35 PTS MAX) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-slate-900">
              TIÊU CHÍ 1: HIỆU QUẢ THỰC TẾ ĐẠT ĐƯỢC (Tối đa 35đ)
            </span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {effectiveC1} / 35đ
            </span>
          </div>

          {/* Phân Loại của thẻ khớp rõ đúng 1 Nhóm -> chỉ hiện đúng nhóm đó, ẩn 2 nhóm còn lại
              (khoá cứng, không cho đổi). Chỉ "8.Khác" (lockedScoreGroup=null) mới hiện đủ cả 3 nhóm
              để giám khảo tự chọn như trước đây. */}
          <div className={`grid grid-cols-1 ${lockedScoreGroup ? "" : "sm:grid-cols-3"} gap-2 text-xs`}>
            {(!lockedScoreGroup || lockedScoreGroup === "GROUP1") && (
              <button
                type="button"
                disabled={isReadOnly || isLocked}
                onClick={() => setC1Group("GROUP1")}
                className={`p-2 rounded-xl font-bold border cursor-pointer ${c1Group === "GROUP1" ? "bg-[#006838] text-white border-[#006838]" : "bg-white text-slate-700 border-slate-300"}`}
              >
                Nhóm 1: Năng suất / Thời gian
              </button>
            )}
            {(!lockedScoreGroup || lockedScoreGroup === "GROUP2") && (
              <button
                type="button"
                disabled={isReadOnly || isLocked}
                onClick={() => setC1Group("GROUP2")}
                className={`p-2 rounded-xl font-bold border cursor-pointer ${c1Group === "GROUP2" ? "bg-[#006838] text-white border-[#006838]" : "bg-white text-slate-700 border-slate-300"}`}
              >
                Nhóm 2: Tiết kiệm Chi phí / Vật tư
              </button>
            )}
            {(!lockedScoreGroup || lockedScoreGroup === "GROUP3") && (
              <button
                type="button"
                disabled={isReadOnly || isLocked}
                onClick={() => setC1Group("GROUP3")}
                className={`p-2 rounded-xl font-bold border cursor-pointer ${c1Group === "GROUP3" ? "bg-[#006838] text-white border-[#006838]" : "bg-white text-slate-700 border-slate-300"}`}
              >
                Nhóm 3: An toàn lao động / 5S
              </button>
            )}
          </div>

          {/* BAREM DẠNG RADIO NODES THEO NHÓM */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">Chọn mốc điểm phù hợp nhất (Bắt buộc chọn mốc, không nhập điểm tự do):</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs items-stretch">
              {(c1Group === "GROUP1"
                ? [
                    { score: 35, desc: "35đ — Tối đa/SOP (Giảm thời gian ≥25%)" },
                    { score: 33, desc: "33đ — Vượt ngưỡng cao (18–24%)" },
                    { score: 30, desc: "30đ — Đạt ngưỡng cao (15–17%)" },
                    { score: 29, desc: "29đ — Tiệm cận cao (12–14%)" },
                    { score: 24, desc: "24đ — Đạt mức giữa (9–11%)" },
                    { score: 20, desc: "20đ — Đạt ngưỡng thấp (8%)" },
                    { score: 19, desc: "19đ — Đã xác nhận độc lập (5–7%)" },
                    { score: 14, desc: "14đ — Số liệu sơ bộ (<5%)" },
                    { score: 10, desc: "10đ — Định tính sơ lược" },
                    { score: 9, desc: "9đ — Chưa đủ tin cậy" },
                    { score: 4, desc: "4đ — Thiếu minh chứng" },
                    { score: 0, desc: "0đ — Không rõ hiệu quả" },
                  ]
                : c1Group === "GROUP2"
                ? [
                    { score: 35, desc: "35đ — Tiết kiệm chi phí ≥45%" },
                    { score: 33, desc: "33đ — Tiết kiệm chi phí 35–44%" },
                    { score: 30, desc: "30đ — Tiết kiệm chi phí 30–34%" },
                    { score: 29, desc: "29đ — Tiết kiệm chi phí 25–29%" },
                    { score: 24, desc: "24đ — Tiết kiệm chi phí 19–24%" },
                    { score: 20, desc: "20đ — Tiết kiệm chi phí 15–18%" },
                    { score: 19, desc: "19đ — Đã xác nhận độc lập" },
                    { score: 14, desc: "14đ — Số liệu sơ bộ (<15%)" },
                    { score: 10, desc: "10đ — Định tính sơ lược" },
                    { score: 9, desc: "9đ — Chưa đủ tin cậy" },
                    { score: 4, desc: "4đ — Thiếu minh chứng" },
                    { score: 0, desc: "0đ — Không rõ hiệu quả" },
                  ]
                : [
                    { score: 35, desc: "35đ — Triệt tiêu hoàn toàn mối nguy nghiêm trọng" },
                    { score: 33, desc: "33đ — Đạt chuẩn an toàn mở rộng" },
                    { score: 30, desc: "30đ — Loại bỏ nguy cơ mất an toàn cao" },
                    { score: 29, desc: "29đ — Giảm rủi ro mối nguy cao" },
                    { score: 24, desc: "24đ — Giảm rủi ro mối nguy trung bình" },
                    { score: 20, desc: "20đ — Giảm rủi ro mối nguy thấp" },
                    { score: 19, desc: "19đ — Có số liệu xác nhận rủi ro" },
                    { score: 14, desc: "14đ — Đã đánh giá rủi ro sơ bộ" },
                    { score: 10, desc: "10đ — Định tính cải thiện an toàn/5S" },
                    { score: 9, desc: "9đ — Đề cập nguy cơ nhưng thiếu minh chứng" },
                    { score: 4, desc: "4đ — Đề cập sơ lược" },
                    { score: 0, desc: "0đ — Không rõ cải thiện" },
                  ]
              ).map((opt) => (
                <label
                  key={opt.score}
                  className={`p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                    isReadOnly || isLocked ? "opacity-60 cursor-not-allowed" : ""
                  } ${
                    c1Score === opt.score
                      ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {opt.score}đ
                    </span>
                    <input
                      type="radio"
                      name="c1_score_radio"
                      disabled={isReadOnly || isLocked}
                      checked={c1Score === opt.score}
                      onChange={() => setC1Score(opt.score)}
                      className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                    />
                  </div>
                  <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

      {/* SUMMARY CARD WHEN SCORE HAS BEEN SUBMITTED & BAREM IS COLLAPSED */}
      {(() => {
        const hasSubmittedScore = Boolean(evalMeta?.data?.myScore || isLocked || (successMsg && successMsg.includes("thành công")));
        if (hasSubmittedScore && !showBaremDetails) {
          return (
            <div className="p-5 rounded-2xl bg-emerald-50/90 border-2 border-emerald-400 space-y-4 shadow-md animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#006838] text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <IconCheck size={14} />
                      <span>ĐÃ NỘP BẢNG ĐIỂM CHUYÊN MÔN</span>
                    </span>
                    <span className="text-xs text-emerald-800 font-bold">
                      (Đã khoá điểm & tự động ẩn barem chi tiết)
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mt-2 flex items-center gap-2">
                    <span>Tổng Điểm Chuyên Môn Của Bạn:</span>
                    <span className="text-[#006838] text-3xl font-black">{evalMeta?.data?.myScore?.total_score ?? liveTotalScore} / 100đ</span>
                  </h4>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setShowBaremDetails(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 border border-amber-500/30"
                  >
                    <IconEdit size={15} />
                    <span>✏️ Chỉnh Sửa Lại Bảng Điểm</span>
                  </button>
                )}
              </div>

              {/* READ-ONLY SUMMARY TABLE OF 5 CRITERIA */}
              <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-emerald-100/70 text-emerald-950 font-bold uppercase text-[10.5px] border-b border-emerald-200">
                    <tr>
                      <th className="p-2.5 text-center w-12 border-r border-emerald-200">STT</th>
                      <th className="p-2.5 w-48 border-r border-emerald-200">TIÊU CHÍ CHẤM ĐIỂM</th>
                      <th className="p-2.5 text-center w-32 border-r border-emerald-200">MỐC ĐIỂM ĐÃ CHỌN</th>
                      <th className="p-2.5">CĂN CỨ &amp; GHI CHÚ CHẤM ĐIỂM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 text-xs text-slate-800">
                    <tr>
                      <td className="p-2.5 text-center font-bold text-slate-500 border-r border-emerald-100">1</td>
                      <td className="p-2.5 font-bold border-r border-emerald-100">1. Hiệu quả thực tế đạt được</td>
                      <td className="p-2.5 text-center font-black text-[#006838] border-r border-emerald-100 bg-emerald-50/50">
                        {c1Score} / 35đ
                      </td>
                      <td className="p-2.5 text-slate-600 italic">{c1Basis || "Khớp theo barem Nhóm phân loại"}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-center font-bold text-slate-500 border-r border-emerald-100">2</td>
                      <td className="p-2.5 font-bold border-r border-emerald-100">2. Tính khả thi &amp; hiệu quả đầu tư</td>
                      <td className="p-2.5 text-center font-black text-[#006838] border-r border-emerald-100 bg-emerald-50/50">
                        {c2Score} / 20đ
                      </td>
                      <td className="p-2.5 text-slate-600 italic">{c2Basis || "Đánh giá khả thi đầu tư"}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-center font-bold text-slate-500 border-r border-emerald-100">3</td>
                      <td className="p-2.5 font-bold border-r border-emerald-100">3. Khả năng nhân rộng</td>
                      <td className="p-2.5 text-center font-black text-[#006838] border-r border-emerald-100 bg-emerald-50/50">
                        {c3Score} / 20đ
                      </td>
                      <td className="p-2.5 text-slate-600 italic">{c3Basis || "Đánh giá phạm vi nhân rộng"}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-center font-bold text-slate-500 border-r border-emerald-100">4</td>
                      <td className="p-2.5 font-bold border-r border-emerald-100">4. Tính sáng tạo &amp; chủ động</td>
                      <td className="p-2.5 text-center font-black text-[#006838] border-r border-emerald-100 bg-emerald-50/50">
                        {c4Score} / 15đ
                      </td>
                      <td className="p-2.5 text-slate-600 italic">{c4Basis || "Đánh giá mức độ sáng tạo"}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-center font-bold text-slate-500 border-r border-emerald-100">5</td>
                      <td className="p-2.5 font-bold border-r border-emerald-100">5. Lan tỏa &amp; tinh thần đội nhóm</td>
                      <td className="p-2.5 text-center font-black text-[#006838] border-r border-emerald-100 bg-emerald-50/50">
                        {c5Score} / 10đ
                      </td>
                      <td className="p-2.5 text-slate-600 italic">{c5Basis || "Đánh giá hiệu ứng lan tỏa"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* 5 CRITERIA FORM - TABLE LAYOUT EXACTLY MATCHING SPEC IMAGE 2 */}
      {(!Boolean(evalMeta?.data?.myScore || isLocked || (successMsg && successMsg.includes("thành công"))) || showBaremDetails) && (
        <div className="space-y-3">
          {showBaremDetails && (
            <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-950 shadow-xs">
              <span className="flex items-center gap-1.5">
                <span>✏️ Bạn đang ở chế độ Chỉnh Sửa Barem Chấm Điểm</span>
              </span>
              <button
                type="button"
                onClick={() => setShowBaremDetails(false)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-black text-xs cursor-pointer transition-all border border-amber-400/40"
              >
                ▲ Thu gọn / Xem Tóm Tắt Điểm
              </button>
            </div>
          )}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="p-3 text-center w-12 border-r border-slate-200">STT</th>
              <th className="p-3 w-40 border-r border-slate-200">TIÊU CHÍ</th>
              <th className="p-3 w-44 border-r border-slate-200">MÔ TẢ NGẮN</th>
              <th className="p-3 text-center w-24 border-r border-slate-200">ĐIỂM TỐI ĐA</th>
              <th className="p-3">BGK CHỌN ĐIỂM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {/* ROW 1: TIÊU CHÍ 1 */}
            <tr className="border-l-4 border-l-blue-600 hover:bg-slate-50/50 transition-colors">
              <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">1</td>
              <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                Hiệu quả thực tế đạt được
              </td>
              <td className="p-3 text-slate-600 border-r border-slate-200">
                Mức độ hiệu quả mang lại (tùy danh mục)
              </td>
              <td className="p-3 text-center font-black text-slate-900 text-sm border-r border-slate-200">
                35
              </td>
              <td className="p-3 space-y-3">
                {/* DẢI THÔNG TIN BAREM ĐỘNG THEO PHÂN LOẠI */}
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#006838] text-white font-mono font-black text-[10px] uppercase">
                      BAREM ĐỘNG
                    </span>
                    <span className="font-bold text-emerald-950">
                      Đang áp dụng: <strong className="text-[#006838]">{c1Group === "GROUP1" ? "Nhóm 1 – Tăng Năng Suất / Thời Gian" : c1Group === "GROUP2" ? "Nhóm 2 – Tiết Kiệm Chi Phí / Vật Tư" : "Nhóm 3 – An Toàn Lao Động / 5S"}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800">
                    (Hệ thống tự động ánh xạ từ Phân Loại: <strong className="text-slate-900">{proposal.category || (proposal as any).category_label || "Tăng Năng Suất"}</strong>)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    disabled={isReadOnly || isLocked}
                    onClick={() => setC1Group("GROUP1")}
                    className={`p-2 rounded-xl font-bold border cursor-pointer ${c1Group === "GROUP1" ? "bg-[#006838] text-white border-[#006838]" : "bg-white text-slate-700 border-slate-300"}`}
                  >
                    Nhóm 1: Năng suất / Thời gian
                  </button>
                  <button
                    type="button"
                    disabled={isReadOnly || isLocked}
                    onClick={() => setC1Group("GROUP2")}
                    className={`p-2 rounded-xl font-bold border cursor-pointer ${c1Group === "GROUP2" ? "bg-[#006838] text-white border-[#006838]" : "bg-white text-slate-700 border-slate-300"}`}
                  >
                    Nhóm 2: Tiết kiệm Chi phí / Vật tư
                  </button>
                  <button
                    type="button"
                    disabled={isReadOnly || isLocked}
                    onClick={() => setC1Group("GROUP3")}
                    className={`p-2 rounded-xl font-bold border cursor-pointer ${c1Group === "GROUP3" ? "bg-[#006838] text-white border-[#006838]" : "bg-white text-slate-700 border-slate-300"}`}
                  >
                    Nhóm 3: An toàn lao động / 5S
                  </button>
                </div>

                {/* BAREM DẠNG RADIO NODES THEO NHÓM */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">Chọn mốc điểm phù hợp nhất (Bắt buộc chọn mốc, không nhập điểm tự do):</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs items-stretch">
                    {(c1Group === "GROUP1"
                      ? [
                          { score: 35, desc: "35đ — Đạt ≥25% (Tối đa/SOP)" },
                          { score: 33, desc: "33đ — Đạt 18–24%" },
                          { score: 30, desc: "30đ — Đạt ≥15%" },
                          { score: 29, desc: "29đ — Đạt sát 14%" },
                          { score: 24, desc: "24đ — Đạt 9–11%" },
                          { score: 20, desc: "20đ — Đạt 8%" },
                          { score: 19, desc: "19đ — Số liệu <8%, đã xác nhận độc lập" },
                          { score: 14, desc: "14đ — Số liệu sơ bộ <8% (chưa xác nhận độc lập)" },
                          { score: 10, desc: "10đ — Chỉ mô tả định tính, không số đo" },
                          { score: 9, desc: "9đ — Đề cập rõ hơn, chưa đủ tin cậy" },
                          { score: 4, desc: "4đ — Đề cập sơ lược, thiếu minh chứng" },
                          { score: 0, desc: "0đ — Hiệu quả không rõ ràng" },
                        ]
                      : c1Group === "GROUP2"
                      ? [
                          { score: 35, desc: "35đ — Giảm ≥45% lãng phí, kiểm chứng ổn định" },
                          { score: 33, desc: "33đ — Giảm 35–44%, xác nhận rõ" },
                          { score: 30, desc: "30đ — Giảm ≥30% lãng phí, có đối chứng" },
                          { score: 29, desc: "29đ — Giảm sát 29% lãng phí" },
                          { score: 24, desc: "24đ — Giảm 19–22% lãng phí" },
                          { score: 20, desc: "20đ — Giảm 15% lãng phí, có số liệu" },
                          { score: 19, desc: "19đ — Số liệu <15%, đã xác nhận độc lập" },
                          { score: 14, desc: "14đ — Số liệu sơ bộ <15% (chưa xác nhận độc lập)" },
                          { score: 10, desc: "10đ — Chỉ mô tả định tính" },
                          { score: 9, desc: "9đ — Đề cập rõ hơn, chưa đủ tin cậy" },
                          { score: 4, desc: "4đ — Đề cập sơ lược, thiếu minh chứng" },
                          { score: 0, desc: "0đ — Không có căn cứ" },
                        ]
                      : [
                          { score: 35, desc: "35đ — Triệt tiêu mối nguy nghiêm trọng + SOP mới" },
                          { score: 33, desc: "33đ — Áp dụng thử vị trí tương tự khác" },
                          { score: 30, desc: "30đ — Loại bỏ hoàn toàn nguy cơ Cao/Nghiêm trọng" },
                          { score: 29, desc: "29đ — Giảm rủi ro + Ổn định ≥1 tháng" },
                          { score: 24, desc: "24đ — Giảm rủi ro + Có giải pháp kỹ thuật rõ" },
                          { score: 20, desc: "20đ — Giảm rủi ro Cao→Trung bình (Risk Assessment)" },
                          { score: 19, desc: "19đ — Giải pháp kỹ thuật rõ, chưa đo mức giảm" },
                          { score: 14, desc: "14đ — Đánh giá lại nhưng mức giảm chưa rõ" },
                          { score: 10, desc: "10đ — Cải thiện nhỏ, chưa đánh giá lại rủi ro" },
                          { score: 9, desc: "9đ — Đề cập nhưng chưa đủ căn cứ" },
                          { score: 4, desc: "4đ — Chỉ ở mức nhắc nhở / biển báo" },
                          { score: 0, desc: "0đ — Không chứng minh được mức giảm rủi ro" },
                        ]
                    ).map((opt) => (
                      <label
                        key={opt.score}
                        className={`p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                          isReadOnly || isLocked ? "opacity-60 cursor-not-allowed" : ""
                        } ${
                          c1Score === opt.score
                            ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {opt.score}đ
                          </span>
                          <input
                            type="radio"
                            name="c1_score_radio"
                            disabled={isReadOnly || isLocked}
                            checked={c1Score === opt.score}
                            onChange={() => setC1Score(opt.score)}
                            className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                          />
                        </div>
                        <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </td>
            </tr>

            {/* ROW 2: TIÊU CHÍ 2 */}
            <tr className="border-l-4 border-l-emerald-600 hover:bg-slate-50/50 transition-colors">
              <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">2</td>
              <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                Tính khả thi &amp; hiệu quả đầu tư
              </td>
              <td className="p-3 text-slate-600 border-r border-slate-200">
                Chi phí đầu tư so với lợi ích.
              </td>
              <td className="p-3 text-center font-black text-slate-900 text-sm border-r border-slate-200">
                20
              </td>
              <td className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-bold items-stretch">
                  {[
                    { score: 20, desc: "20đ — Rất khả thi / không tốn chi phí" },
                    { score: 15, desc: "15đ — Khả thi cao / thu hồi <6 tháng" },
                    { score: 10, desc: "10đ — Khả thi TB / thu hồi 6–12 tháng" },
                    { score: 5, desc: "5đ — Ít khả thi / thu hồi 1–2 năm" },
                    { score: 0, desc: "0đ — Không khả thi / thu hồi >2 năm" },
                  ].map((opt) => (
                    <label
                      key={opt.score}
                      className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                        isReadOnly || isLocked ? "opacity-60 cursor-not-allowed" : ""
                      } ${
                        c2Score === opt.score
                          ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{opt.score}đ</span>
                        <input type="radio" name="c2_score_radio" disabled={isReadOnly || isLocked} checked={c2Score === opt.score} onChange={() => setC2Score(opt.score)} className="w-3.5 h-3.5 accent-emerald-600" />
                      </div>
                      <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </td>
            </tr>

            {/* ROW 3: TIÊU CHÍ 3 */}
            <tr className="border-l-4 border-l-purple-600 hover:bg-slate-50/50 transition-colors">
              <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">3</td>
              <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                Khả năng nhân rộng
              </td>
              <td className="p-3 text-slate-600 border-r border-slate-200">
                Mức độ áp dụng cho nhiều vị trí / đơn vị.
              </td>
              <td className="p-3 text-center font-black text-slate-900 text-sm border-r border-slate-200">
                20
              </td>
              <td className="p-3 space-y-1.5">
                <p className="text-[11px] text-slate-500 italic">
                  💡 Tooltip BGK: "Nếu đơn vị mình có vấn đề tương tự, có áp dụng ngay được cải tiến này không?"
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-bold items-stretch">
                  {[
                    { score: 20, desc: "20đ — Nhân rộng toàn Tập đoàn TBS" },
                    { score: 15, desc: "15đ — Nhân rộng toàn nhà máy/xưởng" },
                    { score: 10, desc: "10đ — Nhân rộng toàn dây chuyền" },
                    { score: 5, desc: "5đ — Nhân rộng 1 chuyền/công đoạn nhỏ" },
                    { score: 0, desc: "0đ — Chỉ áp dụng đơn lẻ 1 vị trí" },
                  ].map((opt) => (
                    <label
                      key={opt.score}
                      className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                        isReadOnly || isLocked ? "opacity-60 cursor-not-allowed" : ""
                      } ${
                        c3Score === opt.score
                          ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{opt.score}đ</span>
                        <input type="radio" name="c3_score_radio" disabled={isReadOnly || isLocked} checked={c3Score === opt.score} onChange={() => setC3Score(opt.score)} className="w-3.5 h-3.5 accent-emerald-600" />
                      </div>
                      <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </td>
            </tr>

            {/* ROW 4: TIÊU CHÍ 4 */}
            <tr className="border-l-4 border-l-amber-500 hover:bg-slate-50/50 transition-colors">
              <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">4</td>
              <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                Tính sáng tạo &amp; chủ động
              </td>
              <td className="p-3 text-slate-600 border-r border-slate-200">
                Mức độ sáng tạo và chủ động đề xuất.
              </td>
              <td className="p-3 text-center font-black text-slate-900 text-sm border-r border-slate-200">
                15
              </td>
              <td className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-bold items-stretch">
                  {[
                    { score: 15, desc: "15đ — Sáng kiến xuất sắc, đột phá" },
                    { score: 11, desc: "11đ — Giải pháp độc đáo/tự chế" },
                    { score: 7, desc: "7đ — Ý tưởng sáng tạo độc lập" },
                    { score: 3, desc: "3đ — Cải tiến nhỏ trên quy trình cũ" },
                    { score: 0, desc: "0đ — Sao chép nguyên mẫu bên ngoài" },
                  ].map((opt) => (
                    <label
                      key={opt.score}
                      className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                        isReadOnly || isLocked ? "opacity-60 cursor-not-allowed" : ""
                      } ${
                        c4Score === opt.score
                          ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{opt.score}đ</span>
                        <input type="radio" name="c4_score_radio" disabled={isReadOnly || isLocked} checked={c4Score === opt.score} onChange={() => setC4Score(opt.score)} className="w-3.5 h-3.5 accent-emerald-600" />
                      </div>
                      <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </td>
            </tr>

            {/* ROW 5: TIÊU CHÍ 5 */}
            <tr className="border-l-4 border-l-cyan-600 hover:bg-slate-50/50 transition-colors">
              <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">5</td>
              <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                Lan tỏa &amp; tinh thần đội nhóm
              </td>
              <td className="p-3 text-slate-600 border-r border-slate-200">
                Mức độ lan tỏa, hỗ trợ phối hợp.
              </td>
              <td className="p-3 text-center font-black text-slate-900 text-sm border-r border-slate-200">
                10
              </td>
              <td className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-bold items-stretch">
                  {[
                    { score: 10, desc: "10đ — Truyền cảm hứng phong trào Gemba" },
                    { score: 8, desc: "8đ — Phối hợp liên phòng ban xuất sắc" },
                    { score: 5, desc: "5đ — Phối hợp nhóm trong bộ phận" },
                    { score: 2, desc: "2đ — Phối hợp nhỏ 2 người" },
                    { score: 0, desc: "0đ — Cá nhân làm độc lập" },
                  ].map((opt) => (
                    <label
                      key={opt.score}
                      className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                        isReadOnly || isLocked ? "opacity-60 cursor-not-allowed" : ""
                      } ${
                        c5Score === opt.score
                          ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{opt.score}đ</span>
                        <input type="radio" name="c5_score_radio" disabled={isReadOnly || isLocked} checked={c5Score === opt.score} onChange={() => setC5Score(opt.score)} className="w-3.5 h-3.5 accent-emerald-600" />
                      </div>
                      <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

        {/* BOTTOM FOOTER BAR MATCHING SPEC IMAGE 2 */}
        <div
          ref={footerRef}
          className="p-4 bg-[#0b1739] text-white flex flex-col sm:flex-row items-center justify-between gap-3 font-black uppercase text-xs rounded-b-2xl border-t border-slate-700 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <span className="tracking-wider text-slate-200">TỔNG ĐIỂM TỐI ĐA: 100</span>
            {Boolean(evalMeta?.data?.myScore || isLocked) && (
              <button
                type="button"
                onClick={() => setShowBaremDetails(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px] transition-all cursor-pointer normal-case flex items-center gap-1"
              >
                <span>▲ Ẩn Barem Chấm Điểm</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {errorMsg && (
              <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 max-w-md animate-in fade-in">
                <IconAlertTriangle size={15} className="shrink-0 text-rose-400" />
                <span className="truncate">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 max-w-md animate-in fade-in">
                <IconCheck size={15} className="shrink-0 text-emerald-400" />
                <span className="truncate">{successMsg}</span>
              </div>
            )}

            <span className="tracking-wider text-slate-200">
              TỔNG ĐIỂM BGK: <strong className="text-emerald-400 text-base font-black ml-1">{liveTotalScore}/100</strong>
            </span>

            {!isReadOnly && !isLocked && (
              <button
                type="button"
                disabled={submittingScore}
                onClick={handleScoreSubmit}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <IconSend size={15} />
                <span>{submittingScore ? "Đang nộp..." : "Gửi Bảng Điểm"}</span>
              </button>
            )}

            {isLocked && (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <IconCheck size={15} />
                <span>Đã gửi điểm &amp; khóa bảng điểm</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>

      {/* CONFLICT MODAL */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-rose-900 flex items-center gap-2">
              <IconAlertTriangle size={20} className="text-rose-600" />
              <span>Báo Cáo Xung Đột Lợi Ích</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nếu bạn là người phụ trách/đồng tác giả hoặc có xung đột lợi ích với hồ sơ này, hãy chọn lý do để xin rút khỏi danh sách chấm điểm.
            </p>

            <select
              value={conflictReason}
              onChange={(e) => setConflictReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
            >
              <option value="">-- Chọn lý do xin rút --</option>
              <option value="Hồ sơ thuộc đơn vị/chuyền do tôi trực tiếp quản lý">Hồ sơ thuộc đơn vị/chuyền do tôi quản lý</option>
              <option value="Tôi là thành viên tham gia thực hiện cải tiến này">Tôi là thành viên thực hiện cải tiến này</option>
              <option value="Có quan hệ thân nhân/đồng nghiệp trực tiếp với người nộp">Có quan hệ trực tiếp với người nộp</option>
              <option value="Lý do khách quan khác">Lý do khách quan khác</option>
            </select>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submittingConflict}
                onClick={handleReportConflict}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md cursor-pointer"
              >
                {submittingConflict ? "Đang xử lý..." : "Xác nhận xin rút"}
              </button>
            </div>
          </div>
        </div>
      )}
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
