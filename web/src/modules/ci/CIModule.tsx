"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStatusCounts } from "@/context/StatusCountsContext";

// Dynamic Imports for Modals & Sub-views to shrink initial JS bundle & accelerate 3G/4G loading
const KaizenDashboard = dynamic(() => import("./KaizenDashboard"), { ssr: false });
const KaizenEarlyWarning = dynamic(() => import("./KaizenEarlyWarning"), { ssr: false });
const KaizenFiveStepSubmitForm = dynamic(() => import("./KaizenFiveStepSubmitForm"), { ssr: false });
const KaizenPublicSubmitForm = dynamic(() => import("./KaizenPublicSubmitForm"), { ssr: false });
const KaizenDetailModal = dynamic(() => import("./KaizenDetailModal"), { ssr: false });
const EvaluationModal = dynamic(() => import("./EvaluationModal"), { ssr: false });
const FeasibilityApprovalModal = dynamic(() => import("./FeasibilityApprovalModal"), { ssr: false });
const PreliminaryReviewModal = dynamic(() => import("./PreliminaryReviewModal"), { ssr: false });
const KaizenDuplicateCompareModal = dynamic(() => import("./KaizenDuplicateCompareModal"), { ssr: false });
const KaizenLeaderboard = dynamic(() => import("./KaizenLeaderboard"), { ssr: false });

import UserAvatar from "@/components/UserAvatar";
import { getCurrentUser } from "@/lib/userProfiles";
import { getValidKaizenImageUrl, getAllKaizenImageUrls } from "@/lib/kaizenImageHelper";
import { getKaizenDisplayTitle } from "@/lib/kaizenTitleHelper";
import { apiFetch, registerPoller, unregisterPoller } from "@/lib/apiClient";
import {
  STANDARD_DASHBOARD_REGIONS,
  normalizeRegion,
  getProposalValueVnd,
  getProposalValueTr,
  isTHKGRegion,
} from "@/lib/kaizenRegionHelper";

const PROPOSALS_CACHE_KEY = "vpchuoiskechers_kaizen_proposals_cache_v2";

// Resilient Fetch with AbortController Timeout & Exponential Backoff Retry for Weak 3G/4G Networks
async function fetchWithRetryAndTimeout(url: string, options: RequestInit = {}, retries = 2, timeoutMs = 8000): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (res.ok || attempt === retries) return res;
    } catch (err: any) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("Network request failed after retries");
}
import {
  IconLayoutGrid,
  IconList,
  IconRefresh,
  IconReload,
  IconPlus,
  IconDownload,
  IconSearch,
  IconFilter,
  IconRotate,
  IconStar,
  IconEye,
  IconTrophy,
  IconSparkles,
  IconCheck,
  IconX,
  IconSend,
  IconBuildingFactory,
  IconMapPin,
  IconUser,
  IconClock,
  IconBuilding,
  IconPhoto,
  IconThumbUp,
  IconShieldCheck,
  IconAward,
  IconChevronDown,
  IconChevronRight,
  IconChevronLeft,
  IconArrowLeft,
  IconCloudUpload,
  IconUpload,
  IconTrash,
  IconTag,
  IconBox,
  IconCircleCheck,
  IconHelpCircle,
  IconChartBar,
  IconDotsVertical,
  IconQrcode,
  IconCopy,
  IconUserCheck,
  IconVideo,
  IconExternalLink,
} from "@tabler/icons-react";
import { formatTitleWithDepartment } from "@/lib/userProfiles";
import { usePermission } from "@/hooks/usePermission";

export interface KaizenProposal {
  id: string;
  code: string;
  title: string;
  category: string;
  category_label: string;
  registration_type: string; // THI_DUA, LUU_TRU
  sub_status: string; // CHO_DANH_GIA, DA_DANH_GIA
  region: string;
  department: string;
  factory?: string;
  customer?: string;
  proposer_name: string;
  proposer_emp_code: string;
  dept_code: string;
  before_description?: string;
  after_solution?: string;
  saved_seconds: number;
  time_before_seconds?: number;
  time_after_seconds?: number;
  cost_before?: number;
  cost_after?: number;
  efficiency_value_vnd?: number;
  pair_quantity?: number;
  so_luong_giay?: number;
  total_savings_vnd?: number;
  tong_tien_tiet_kiem?: number;
  total_savings_words?: string;
  tong_tien_bang_chu?: string;
  before_image_url?: string;
  after_image_url?: string;
  attachments_json?: string;
  status: string; // SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, IMPLEMENTED
  award_title?: string; // Giải Nhất, Giải Nhì, Giải Ba, Giải Khuyến Khích
  score_points: number;
  review_comment?: string;
  avg_rating: number;
  average_score?: number;
  rating_count: number;
  vote_count: number;
  view_count: number;
  rejection_reason?: string;
  required_reviewer_ids_json?: string;
  evaluated_at?: string;
  is_thi_dua?: number;
  propose_thi_dua?: number;
  scores_json?: string;
  approval_status?: string;
  review_status?: string;
  is_archived?: boolean | number;
  trang_thai?: string;
  line?: string;
  nguoi_kiem_chung?: string;
  anh_kiem_chung_json?: string;
  nhan_xet_kiem_chung?: string;
  so_giay_tiet_kiem?: number;
  diem_hieu_qua?: number;
  diem_tong_hop?: number;
  hang_xep?: number;
  merged_into_id?: string;
  version: number;
  created_at: string;
  updated_at?: string;
}

export function KaizenCardImage({ src, alt, attachmentsJson }: { src?: string; alt?: string; attachmentsJson?: string }) {
  const initialUrl = getValidKaizenImageUrl(src, attachmentsJson);
  const [imgSrc, setImgSrc] = useState(initialUrl);
  const [hasError, setHasError] = useState(!initialUrl);

  useEffect(() => {
    const valid = getValidKaizenImageUrl(src, attachmentsJson);
    setImgSrc(valid);
    setHasError(!valid);
  }, [src, attachmentsJson]);

  if (!imgSrc || hasError) {
    return (
      <div className="flex flex-col items-center gap-0.5 text-slate-400 select-none">
        <IconPhoto size={26} />
        <span className="text-[10px] font-bold">Chưa có ảnh</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt=""
      onError={() => {
        const all = getAllKaizenImageUrls(src, attachmentsJson);
        const next = all.find((u) => u !== imgSrc);
        if (next) {
          setImgSrc(next);
        } else {
          setHasError(true);
        }
      }}
      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
    />
  );
}

export function normalizeProposal(p: KaizenProposal): KaizenProposal {
  if (!p) return p;
  const cleanBeforeImg = getValidKaizenImageUrl(p.before_image_url, p.attachments_json);
  const cleanAfterImg = getValidKaizenImageUrl(p.after_image_url);

  let isArchived = Boolean(
    Number(p.is_archived) === 1 ||
    p.is_archived === true ||
    p.sub_status === "LUU_TRU" ||
    p.registration_type === "LUU_TRU" ||
    p.status === "ARCHIVED" ||
    p.approval_status === "TU_CHOI" ||
    p.sub_status === "TU_CHOI_TRIEN_KHAI" ||
    p.status === "REJECTED"
  );

  let reviewStatus = p.review_status;
  if (!reviewStatus) {
    const appStatus = String(p.approval_status || "").toUpperCase();
    const subStatus = String(p.sub_status || "").toUpperCase();
    const mainStatus = String(p.status || "").toUpperCase();

    if (appStatus === "TU_CHOI" || subStatus === "TU_CHOI_TRIEN_KHAI" || mainStatus === "REJECTED") {
      reviewStatus = "TU_CHOI_DUYET";
    } else if (subStatus === "DA_DANH_GIA" || appStatus === "DA_DANH_GIA" || (Number(p.avg_rating || p.average_score || 0) > 0 && !["CHO_REVIEW", "CHO_DANH_GIA"].includes(subStatus))) {
      reviewStatus = "DA_DANH_GIA";
    } else if (subStatus === "CHO_DANH_GIA" || appStatus === "PHE_DUYET" || mainStatus === "APPROVED" || Number(p.is_thi_dua) === 1) {
      reviewStatus = "CHO_DANH_GIA";
    } else {
      reviewStatus = "CHO_PHE_DUYET";
    }
  }

  return {
    ...p,
    before_image_url: cleanBeforeImg || p.before_image_url || "",
    after_image_url: cleanAfterImg || p.after_image_url || "",
    review_status: reviewStatus as any,
    is_archived: isArchived
  };
}

export const CATEGORIES = [
  { id: "MATERIAL_SAVING", label: "1.Tiết kiệm Vật tư", color: "bg-blue-600 text-white" },
  { id: "COST_SAVING", label: "2.Tiết kiệm Chi phí", color: "bg-emerald-600 text-white" },
  { id: "PRODUCTIVITY", label: "3.Tăng Năng suất", color: "bg-blue-500 text-white" },
  { id: "SAFETY", label: "4.An toàn lao động", color: "bg-[#006838] text-white" },
  { id: "5S", label: "5.5S", color: "bg-sky-500 text-white" },
  { id: "AUTOMATION", label: "6.Tự động hoá", color: "bg-indigo-600 text-white" },
  { id: "EQUIPMENT", label: "7.MMTB CCDC", color: "bg-purple-600 text-white" },
];

import { REAL_DEPARTMENTS } from "./KaizenPublicSubmitForm";

const REGIONS = REAL_DEPARTMENTS;

interface HalfStarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: number;
}

export function HalfStarRating({ value, onChange, readOnly = false, size = 22 }: HalfStarRatingProps) {
  const [hoverVal, setHoverVal] = useState<number | null>(null);
  const displayVal = hoverVal !== null ? hoverVal : value;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1.5 select-none">
      <div className="flex items-center gap-1">
        {stars.map((starIdx) => {
          const leftVal = starIdx - 0.5;
          const rightVal = starIdx;
          const isLeftFilled = displayVal >= leftVal;
          const isRightFilled = displayVal >= rightVal;

          return (
            <div key={starIdx} className="relative inline-block cursor-pointer" style={{ width: size, height: size }}>
              {!readOnly && (
                <>
                  <div
                    className="absolute left-0 top-0 w-1/2 h-full z-10"
                    onMouseEnter={() => setHoverVal(leftVal)}
                    onMouseLeave={() => setHoverVal(null)}
                    onClick={() => onChange && onChange(leftVal)}
                    title={`Chấm ${leftVal} sao`}
                  />
                  <div
                    className="absolute right-0 top-0 w-1/2 h-full z-10"
                    onMouseEnter={() => setHoverVal(rightVal)}
                    onMouseLeave={() => setHoverVal(null)}
                    onClick={() => onChange && onChange(rightVal)}
                    title={`Chấm ${rightVal} sao`}
                  />
                </>
              )}

              <div className="relative flex items-center justify-center w-full h-full pointer-events-none">
                <IconStar size={size} className="text-slate-300 fill-slate-200" />
                {isRightFilled ? (
                  <IconStar size={size} className="absolute inset-0 text-amber-400 fill-amber-400" />
                ) : isLeftFilled ? (
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <IconStar size={size} className="text-amber-400 fill-amber-400" />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 min-w-[40px] text-center">
        {displayVal > 0 ? `${displayVal.toFixed(1)} ⭐` : "Chưa chấm"}
      </span>
    </div>
  );
}

const REGION_SUB_ITEMS = [
  "Văn phòng Chuỗi",
  "Phòng Ban THKG",
  "Nhà Máy Miền Đông",
  "Kiên Giang 1",
  "Kiên Giang 2",
  "Kiên Giang 3",
  "Hoàn Thiện Đế",
];

export function matchRegionFilter(propRegionOrObj: any, filterRegion: string): boolean {
  if (!filterRegion || filterRegion === "ALL") return true;
  if (!propRegionOrObj) return false;

  const norm = normalizeRegion(propRegionOrObj);
  const filterClean = filterRegion.replace(/\+/g, " ").trim();
  const filterUpper = filterClean.toUpperCase();

  if (filterUpper === "THKG" || filterUpper.includes("TỔ HỢP KIÊN GIANG")) {
    return isTHKGRegion(norm);
  }

  if (filterUpper.includes("MIỀN ĐÔNG") || filterUpper.includes("NMMĐ")) {
    return norm === "Nhà Máy Miền Đông";
  }

  if (filterUpper.includes("VĂN PHÒNG CHUỖI") || filterUpper.includes("VP CHUỖI")) {
    return norm === "Văn phòng Chuỗi";
  }

  if (filterUpper.includes("PHÒNG BAN THKG") || filterUpper.includes("PHONG BAN THKG")) {
    return norm === "Phòng Ban THKG";
  }

  if (filterUpper.includes("HOÀN THIỆN ĐẾ") || filterUpper.includes("HOAN THIEN DE") || filterUpper.includes("HTĐ")) {
    return norm === "Hoàn Thiện Đế";
  }

  if (filterUpper.includes("KIÊN GIANG 1") || filterUpper.includes("KG 1") || filterUpper.includes("KG1")) {
    return norm === "Kiên Giang 1";
  }
  if (filterUpper.includes("KIÊN GIANG 2") || filterUpper.includes("KG 2") || filterUpper.includes("KG2")) {
    return norm === "Kiên Giang 2";
  }
  if (filterUpper.includes("KIÊN GIANG 3") || filterUpper.includes("KG 3") || filterUpper.includes("KG3")) {
    return norm === "Kiên Giang 3";
  }

  return norm.toUpperCase() === filterUpper || norm === filterRegion;
}

export function matchWorkshopFilter(p: KaizenProposal, selectedWorkshop: string): boolean {
  if (!p) return false;
  if (!selectedWorkshop || selectedWorkshop === "ALL" || selectedWorkshop === "all") return true;

  const target = selectedWorkshop.trim().toLowerCase();

  const wsStr = [
    (p as any).workshop_name,
    (p as any).phan_xuong,
    (p as any).cong_doan,
    (p as any).stage,
    p.department,
    p.line,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (target.includes("đầu vào") || target.includes("dau vao") || target.includes("dauvao") || target.includes("dau-vao") || target === "input") {
    return (
      wsStr.includes("đầu vào") ||
      wsStr.includes("dau vao") ||
      wsStr.includes("input") ||
      wsStr.includes("chặt") ||
      wsStr.includes("chuẩn bị") ||
      wsStr.includes("cắt") ||
      wsStr.includes("đầu")
    );
  }
  if (target.includes("may") || target === "sewing" || target === "stitching") {
    return (
      wsStr.includes("may") ||
      wsStr.includes("stitching") ||
      wsStr.includes("sewing") ||
      wsStr.includes("mũi")
    );
  }
  if (target.includes("gò") || target.includes("go") || target === "assembly") {
    return (
      wsStr.includes("gò") ||
      wsStr.includes("go") ||
      wsStr.includes("dán đế") ||
      wsStr.includes("gót") ||
      wsStr.includes("hoàn thiện") ||
      wsStr.includes("assembly")
    );
  }
  if (target.includes("khác") || target.includes("khac") || target === "other") {
    const isDauVao =
      wsStr.includes("đầu vào") ||
      wsStr.includes("dau vao") ||
      wsStr.includes("input") ||
      wsStr.includes("chặt") ||
      wsStr.includes("chuẩn bị") ||
      wsStr.includes("cắt") ||
      wsStr.includes("đầu");
    const isMay =
      wsStr.includes("may") ||
      wsStr.includes("stitching") ||
      wsStr.includes("sewing") ||
      wsStr.includes("mũi");
    const isGo =
      wsStr.includes("gò") ||
      wsStr.includes("go") ||
      wsStr.includes("dán đế") ||
      wsStr.includes("gót") ||
      wsStr.includes("hoàn thiện") ||
      wsStr.includes("assembly");
    return !isDauVao && !isMay && !isGo;
  }

  return wsStr.includes(target);
}

export function isApprovedProposal(p: KaizenProposal): boolean {
  if (!p) return false;
  const appStatus = String(p.approval_status || "").toUpperCase();
  const subStatus = String(p.sub_status || p.review_status || "").toUpperCase();
  const status = String(p.status || "").toUpperCase();

  if (appStatus === "TU_CHOI" || subStatus === "TU_CHOI_TRIEN_KHAI" || status === "REJECTED") {
    return false;
  }

  if (
    subStatus === "CHO_REVIEW" ||
    subStatus === "SO_BO" ||
    subStatus === "SO_DUYET" ||
    subStatus === "CHO_DUYET" ||
    appStatus === "PENDING" ||
    status === "SUBMITTED" ||
    status === "CHO_DUYET" ||
    status === "DRAFT"
  ) {
    return false;
  }

  return (
    appStatus === "PHE_DUYET" ||
    subStatus === "CHO_DANH_GIA" ||
    subStatus === "DA_DANH_GIA" ||
    subStatus === "DA_DUYET" ||
    status === "APPROVED" ||
    status === "COMPLETED" ||
    Number(p.avg_rating || p.average_score || 0) > 0
  );
}

export function isPendingApprovalProposal(p: KaizenProposal): boolean {
  if (!p) return false;
  if (isApprovedProposal(p)) return false;

  const appStatus = String(p.approval_status || "").toUpperCase();
  const subStatus = String(p.sub_status || p.review_status || "").toUpperCase();
  const status = String(p.status || "").toUpperCase();

  if (appStatus === "TU_CHOI" || subStatus === "TU_CHOI_TRIEN_KHAI" || status === "REJECTED") {
    return false;
  }

  return true;
}

export function matchRegTypeFilter(p: KaizenProposal, regType: string): boolean {
  if (!p) return false;
  if (!regType || regType === "ALL") return true;

  const isArchived = Boolean(p.is_archived) || p.sub_status === "LUU_TRU" || p.registration_type === "LUU_TRU" || p.status === "ARCHIVED";

  if (regType === "LUU_TRU") {
    return isArchived;
  }

  if (isArchived) return false;

  if (regType === "THI_DUA") {
    return true;
  }

  if (regType === "CHO_PHE_DUYET" || regType === "CHO_DUYET") {
    return isPendingApprovalProposal(p);
  }

  if (regType === "DA_DANH_GIA" || regType === "DA_DUYET") {
    return isApprovedProposal(p);
  }

  if (regType === "CAN_CHINH_SUA") {
    return String(p.sub_status || p.trang_thai || "").toUpperCase() === "CAN_CHINH_SUA";
  }

  return true;
}

export function renderCardTopRightBadge(prop: KaizenProposal, rankInfo?: any) {
  const isRejected =
    Boolean(prop.is_archived) ||
    prop.approval_status === "TU_CHOI" ||
    prop.sub_status === "TU_CHOI_TRIEN_KHAI" ||
    prop.sub_status === "TU_CHOI_DUYET" ||
    prop.status === "REJECTED";

  if (isRejected) {
    return (
      <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black shadow-2xs flex items-center gap-0.5">
        ❌ Từ chối
      </span>
    );
  }

  const isApproved = isApprovedProposal(prop);
  const isPending = isPendingApprovalProposal(prop);

  if (isPending) {
    return (
      <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-black shadow-2xs flex items-center gap-0.5">
        ⏳ Chờ phê duyệt
      </span>
    );
  }

  if (isApproved) {
    if (rankInfo) {
      return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black shadow-md flex items-center gap-1 ${rankInfo.badgeStyle}`}>
          <span>{rankInfo.badgeLabel}</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black shadow-2xs flex items-center gap-0.5">
        ✅ Đã duyệt
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[9px] font-black shadow-2xs flex items-center gap-0.5">
      ⏳ Chờ duyệt
    </span>
  );
}

export const UNIT_SLUG_MAP: Record<string, { label: string; regionKey: string; slug: string }> = {
  "van-phong-chuoi": { label: "Văn phòng Chuỗi", regionKey: "Văn phòng Chuỗi", slug: "van-phong-chuoi" },
  "phong-ban-thkg": { label: "Phòng Ban THKG", regionKey: "Phòng Ban THKG", slug: "phong-ban-thkg" },
  "nha-may-mien-dong": { label: "Nhà Máy Miền Đông", regionKey: "Nhà Máy Miền Đông", slug: "nha-may-mien-dong" },
  "kien-giang-1": { label: "Kiên Giang 1", regionKey: "Kiên Giang 1", slug: "kien-giang-1" },
  "kien-giang-2": { label: "Kiên Giang 2", regionKey: "Kiên Giang 2", slug: "kien-giang-2" },
  "kien-giang-3": { label: "Kiên Giang 3", regionKey: "Kiên Giang 3", slug: "kien-giang-3" },
  "hoan-thien-de": { label: "Hoàn Thiện Đế", regionKey: "Hoàn Thiện Đế", slug: "hoan-thien-de" },
};

interface CIModuleProps {
  initialUnitSlug?: string;
}

export default function CIModule({ initialUnitSlug }: CIModuleProps = {}) {
  const activeUnitInfo = initialUnitSlug ? UNIT_SLUG_MAP[initialUnitSlug] : null;
  const { isExecutiveOrAdmin } = usePermission();
  const [proposals, setProposals] = useState<KaizenProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cached proposals after hydration
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(PROPOSALS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProposals(parsed);
            setLoading(false);
          }
        }
      } catch (e) {}
    }
  }, []);
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [activeTab, setActiveTab] = useState<"LIBRARY" | "DASHBOARD" | "EARLY_WARNING">(initialUnitSlug ? "DASHBOARD" : "LIBRARY");
  const [isFiveStepModalOpen, setIsFiveStepModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [selectedWorkshop, setSelectedWorkshop] = useState("ALL");
  const [selectedRegType, setSelectedRegType] = useState("ALL");
  const [selectedSubStatus, setSelectedSubStatus] = useState("CHO_DANH_GIA");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Evaluation Modal State
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluatingProposal, setEvaluatingProposal] = useState<KaizenProposal | null>(null);

  // Sidebar States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRegTypeExpanded, setIsRegTypeExpanded] = useState(true);
  const [isRegionExpanded, setIsRegionExpanded] = useState(true);
  const [isThkgExpanded, setIsThkgExpanded] = useState(true);
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(true);

  // Synchronized Logged-in User Profile
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    title: string;
    avatar: string;
    empCode: string;
    roleCode?: string;
  }>({
    name: "Phạm Nguyễn Anh Huy",
    title: "IT - Team Chuyển Đổi Số",
    avatar: "https://res.cloudinary.com/dwl2xtbqa/image/upload/v1787117525/nzcft200bebofw7b4uzg.jpg",
    empCode: "202608001",
    roleCode: "TRUONG_PHONG",
  });

  useEffect(() => {
    function loadUser() {
      if (typeof window === "undefined") return;
      try {
        const cur = getCurrentUser();
        if (cur && cur.name) {
          setCurrentUser({
            name: cur.name,
            title: cur.title || cur.department || "Cán bộ công nhân viên",
            avatar: cur.avatar || "",
            empCode: cur.empCode || "CBCNV",
            roleCode: cur.roleCode,
          });
        }
      } catch (e) {
        console.error("Failed to load user from getCurrentUser():", e);
      }
    }
    loadUser();
    if (typeof window !== "undefined") {
      window.addEventListener("tbs_profile_updated", loadUser);
      return () => window.removeEventListener("tbs_profile_updated", loadUser);
    }
  }, []);

  const searchParams = useSearchParams();

  // Sync region and stage/workshop filter from URL search params on mount & navigation
  useEffect(() => {
    if (activeUnitInfo) {
      setSelectedRegion((prev) => (prev !== activeUnitInfo.regionKey ? activeUnitInfo.regionKey : prev));
      return;
    }

    let rVal = "";
    let sVal = "";

    if (searchParams) {
      rVal = searchParams.get("region") || searchParams.get("factory") || "";
      sVal = searchParams.get("stage") || searchParams.get("congdoan") || searchParams.get("workshop") || "";
    } else if (typeof window !== "undefined" && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      rVal = urlParams.get("region") || urlParams.get("factory") || "";
      sVal = urlParams.get("stage") || urlParams.get("congdoan") || urlParams.get("workshop") || "";
    }

    if (rVal) {
      const decodedR = decodeURIComponent(rVal.replace(/\+/g, " ")).trim();
      if (decodedR) {
        setSelectedRegion((prev) => (prev !== decodedR ? decodedR : prev));
      }
    }

    if (sVal) {
      const decodedS = decodeURIComponent(sVal.replace(/\+/g, " ")).trim().toLowerCase();
      let targetW = "ALL";
      if (decodedS.includes("đầu vào") || decodedS.includes("dauvao") || decodedS.includes("dau-vao") || decodedS.includes("dau vao")) {
        targetW = "Đầu vào";
      } else if (decodedS.includes("may") || decodedS.includes("sewing") || decodedS.includes("stitching")) {
        targetW = "May";
      } else if (decodedS.includes("gò") || decodedS.includes("go") || decodedS.includes("assembly")) {
        targetW = "Gò";
      } else if (decodedS === "all" || decodedS === "tat-ca" || decodedS === "tất cả") {
        targetW = "ALL";
      } else {
        targetW = sVal;
      }
      setSelectedWorkshop((prev) => (prev !== targetW ? targetW : prev));
    }
  }, [searchParams, activeUnitInfo]);

  // Keep browser URL search params synchronized with selectedRegion & selectedWorkshop
  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    let changed = false;

    if (!activeUnitInfo) {
      if (selectedRegion && selectedRegion !== "ALL") {
        if (url.searchParams.get("region") !== selectedRegion) {
          url.searchParams.set("region", selectedRegion);
          changed = true;
        }
      } else {
        if (url.searchParams.has("region")) {
          url.searchParams.delete("region");
          changed = true;
        }
      }
    }

    if (selectedWorkshop && selectedWorkshop !== "ALL") {
      let stageParam = "dauvao";
      const wLower = selectedWorkshop.toLowerCase();
      if (wLower.includes("may")) stageParam = "may";
      else if (wLower.includes("gò") || wLower === "go") stageParam = "go";
      else if (wLower.includes("đầu vào") || wLower.includes("dauvao") || wLower.includes("dau-vao")) stageParam = "dauvao";
      else stageParam = selectedWorkshop;

      if (url.searchParams.get("stage") !== stageParam) {
        url.searchParams.set("stage", stageParam);
        changed = true;
      }
    } else {
      if (url.searchParams.has("stage") || url.searchParams.has("congdoan") || url.searchParams.has("workshop")) {
        url.searchParams.delete("stage");
        url.searchParams.delete("congdoan");
        url.searchParams.delete("workshop");
        changed = true;
      }
    }

    if (changed && url.href !== window.location.href) {
      window.history.replaceState(null, "", url.toString());
    }
  }, [selectedRegion, selectedWorkshop, isHydrated, activeUnitInfo]);

  const registerUrl = useMemo(() => {
    const baseUrl = "https://vpchuoiskechers.tbsgroup2026.workers.dev/work/kaizen/register";
    const params = new URLSearchParams();
    if (selectedRegion && selectedRegion !== "ALL") {
      params.set("region", selectedRegion);
    }
    if (selectedWorkshop && selectedWorkshop !== "ALL") {
      let stageParam = selectedWorkshop;
      const wLower = selectedWorkshop.toLowerCase();
      if (wLower.includes("đầu vào") || wLower.includes("dauvao") || wLower.includes("dau-vao")) stageParam = "dauvao";
      else if (wLower.includes("may")) stageParam = "may";
      else if (wLower.includes("gò") || wLower === "go") stageParam = "go";
      params.set("stage", stageParam);
    }
    const q = params.toString();
    return q ? `${baseUrl}?${q}` : baseUrl;
  }, [selectedRegion, selectedWorkshop]);

  // Preliminary Review Modal State
  const [isPreliminaryModalOpen, setIsPreliminaryModalOpen] = useState(false);
  const [preliminaryProposal, setPreliminaryProposal] = useState<KaizenProposal | null>(null);

  // Duplicate Compare Modal State
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateNewSubmission, setDuplicateNewSubmission] = useState<any>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<KaizenProposal | null>(null);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalModalProposal, setApprovalModalProposal] = useState<KaizenProposal | null>(null);
  const [activeProposal, setActiveProposal] = useState<KaizenProposal | null>(null);

  const closeAllModals = () => {
    setIsCreateModalOpen(false);
    setIsFiveStepModalOpen(false);
    setIsDetailModalOpen(false);
    setIsEvaluationModalOpen(false);
    setIsApprovalModalOpen(false);
    setIsPreliminaryModalOpen(false);
    setIsDuplicateModalOpen(false);
    setIsQrModalOpen(false);
    setIsEditModalOpen(false);
    setIsEvalModalOpen(false);
    setIsRatingModalOpen(false);
  };

  // Automatically close all popup modals when switching tabs or changing filters
  useEffect(() => {
    closeAllModals();
  }, [activeTab, selectedRegType, selectedRegion, selectedCategory, selectedWorkshop]);

  const { counts: statusCounts, loading: isCountsLoading, refetchStatusCounts } = useStatusCounts();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProposals = async (silent = false) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      if (!silent && proposals.length === 0) setLoading(true);
      const res = await fetch(`/api/ci-kaizen?t=${Date.now()}`, {
        cache: "no-store",
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache, no-store, max-age=0" }
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        if (!silent && proposals.length === 0) setLoading(false);
        return;
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProposals(json.data);
        setActiveProposal((prevActive) => {
          if (!prevActive) return null;
          // Protect user editing state: if any modal is open, retain existing activeProposal reference
          if (isDetailModalOpen || isApprovalModalOpen || isEvaluationModalOpen || isEditModalOpen || isPreliminaryModalOpen || isFiveStepModalOpen || isCreateModalOpen) {
            return prevActive;
          }
          const fresh = json.data.find((item: any) => item.id === prevActive.id || (prevActive.code && item.code === prevActive.code));
          if (!fresh) return prevActive;

          const tb = Number(fresh.time_before_seconds || fresh.timeBeforeSeconds || prevActive.time_before_seconds || (prevActive as any).timeBeforeSeconds || 0);
          const ta = Number(fresh.time_after_seconds || fresh.timeAfterSeconds || prevActive.time_after_seconds || (prevActive as any).timeAfterSeconds || 0);
          const sSecs = (tb > 0 || ta > 0) ? Math.max(0, tb - ta) : Number(fresh.saved_seconds || fresh.savedSeconds || prevActive.saved_seconds || 0);
          const q = Number(fresh.pair_quantity || fresh.quantity || prevActive.pair_quantity || (prevActive as any).quantity || 0);
          const mult = q > 0 ? q : 1;
          const eff = Number(fresh.efficiency_value_vnd || fresh.efficiencyValueVND || prevActive.efficiency_value_vnd || (sSecs > 0 ? Math.round(sSecs * 12.5) : 0));
          const cb = Number(fresh.cost_before || fresh.costBefore || prevActive.cost_before || (tb > 0 ? Math.round(tb * 12.5 * mult) : 0));
          const ca = Number(fresh.cost_after || fresh.costAfter || prevActive.cost_after || (ta > 0 ? Math.round(ta * 12.5 * mult) : 0));
          const tot = Number(fresh.total_savings_vnd || fresh.totalSavingsVnd || prevActive.total_savings_vnd || (cb > 0 ? Math.max(0, cb - ca) : (q > 0 ? eff * q : eff)));

          if (
            prevActive.updated_at === fresh.updated_at &&
            prevActive.sub_status === fresh.sub_status &&
            prevActive.approval_status === fresh.approval_status &&
            (prevActive as any).time_before_seconds === tb &&
            (prevActive as any).time_after_seconds === ta &&
            (prevActive as any).total_savings_vnd === tot &&
            (prevActive as any).pair_quantity === q &&
            (prevActive as any).cost_before === cb &&
            (prevActive as any).cost_after === ca
          ) {
            return prevActive;
          }

          return {
            ...prevActive,
            ...fresh,
            time_before_seconds: tb,
            timeBeforeSeconds: tb,
            time_after_seconds: ta,
            timeAfterSeconds: ta,
            saved_seconds: sSecs,
            savedSeconds: sSecs,
            so_giay_tiet_kiem: sSecs,
            efficiency_value_vnd: eff,
            efficiencyValueVND: eff,
            total_savings_vnd: tot,
            totalSavingsVnd: tot,
            tong_tien_tiet_kiem: tot,
            cost_before: cb,
            costBefore: cb,
            cost_after: ca,
            costAfter: ca,
            pair_quantity: q,
            quantity: q,
          };
        });
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(PROPOSALS_CACHE_KEY, JSON.stringify(json.data));
          } catch (e) {}
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") return;
      if (!silent && proposals.length === 0) {
        showToast("⚠️ Kết nối mạng yếu: Đang hiển thị bản ghi đã lưu gần nhất");
      }
    } finally {
      setLoading(false);
    }
  };

  const isSameKaizenProposal = (a: any, b: any): boolean => {
    if (!a || !b) return false;
    const aId = String(a.id ?? a.proposal_id ?? a.code ?? "").trim();
    const aCode = String(a.code ?? a.proposal_code ?? a.id ?? "").trim();
    const bId = String(b.id ?? b.proposal_id ?? b.code ?? "").trim();
    const bCode = String(b.code ?? b.proposal_code ?? b.id ?? "").trim();

    if (!aId && !aCode && !bId && !bCode) return false;
    return Boolean(
      (aId && bId && aId === bId) ||
      (aCode && bCode && aCode === bCode) ||
      (aId && bCode && aId === bCode) ||
      (aCode && bId && aCode === bId)
    );
  };

  const handleProposalUpdated = (updatedProp: any) => {
    if (!updatedProp) return;
    setActiveProposal((prevActive) => {
      if (prevActive && isSameKaizenProposal(prevActive, updatedProp)) {
        const tb = Number(updatedProp.time_before_seconds ?? updatedProp.timeBeforeSeconds ?? prevActive.time_before_seconds ?? (prevActive as any).timeBeforeSeconds ?? 0);
        const ta = Number(updatedProp.time_after_seconds ?? updatedProp.timeAfterSeconds ?? prevActive.time_after_seconds ?? (prevActive as any).timeAfterSeconds ?? 0);
        const sSecs = (tb > 0 || ta > 0) ? Math.max(0, tb - ta) : Number(updatedProp.saved_seconds ?? updatedProp.savedSeconds ?? prevActive.saved_seconds ?? 0);
        const q = Number(updatedProp.pair_quantity ?? updatedProp.quantity ?? prevActive.pair_quantity ?? (prevActive as any).quantity ?? 0);
        const mult = q > 0 ? q : 1;
        const eff = Number(updatedProp.efficiency_value_vnd ?? updatedProp.efficiencyValueVND ?? prevActive.efficiency_value_vnd ?? (sSecs > 0 ? Math.round(sSecs * 12.5) : 0));
        const cb = Number(updatedProp.cost_before ?? updatedProp.costBefore ?? prevActive.cost_before ?? (tb > 0 ? Math.round(tb * 12.5 * mult) : 0));
        const ca = Number(updatedProp.cost_after ?? updatedProp.costAfter ?? prevActive.cost_after ?? (ta > 0 ? Math.round(ta * 12.5 * mult) : 0));
        const tot = Number(updatedProp.total_savings_vnd ?? updatedProp.totalSavingsVnd ?? prevActive.total_savings_vnd ?? (cb > 0 ? Math.max(0, cb - ca) : (q > 0 ? eff * q : eff)));

        return {
          ...prevActive,
          ...updatedProp,
          time_before_seconds: tb,
          timeBeforeSeconds: tb,
          time_after_seconds: ta,
          timeAfterSeconds: ta,
          saved_seconds: sSecs,
          savedSeconds: sSecs,
          so_giay_tiet_kiem: sSecs,
          efficiency_value_vnd: eff,
          efficiencyValueVND: eff,
          total_savings_vnd: tot,
          totalSavingsVnd: tot,
          tong_tien_tiet_kiem: tot,
          cost_before: cb,
          costBefore: cb,
          cost_after: ca,
          costAfter: ca,
          pair_quantity: q,
          quantity: q,
        };
      }
      return prevActive;
    });

    setProposals((prev) => {
      const next = prev.map((p) => {
        if (isSameKaizenProposal(p, updatedProp)) {
          const tb = Number(updatedProp.time_before_seconds ?? updatedProp.timeBeforeSeconds ?? p.time_before_seconds ?? (p as any).timeBeforeSeconds ?? 0);
          const ta = Number(updatedProp.time_after_seconds ?? updatedProp.timeAfterSeconds ?? p.time_after_seconds ?? (p as any).timeAfterSeconds ?? 0);
          const sSecs = (tb > 0 || ta > 0) ? Math.max(0, tb - ta) : Number(updatedProp.saved_seconds ?? updatedProp.savedSeconds ?? p.saved_seconds ?? 0);
          const tot = Number(updatedProp.total_savings_vnd ?? updatedProp.totalSavingsVnd ?? p.total_savings_vnd ?? (p as any).totalSavingsVnd ?? 0);

          return {
            ...p,
            ...updatedProp,
            time_before_seconds: tb,
            timeBeforeSeconds: tb,
            time_after_seconds: ta,
            timeAfterSeconds: ta,
            saved_seconds: sSecs,
            savedSeconds: sSecs,
            total_savings_vnd: tot,
            totalSavingsVnd: tot,
          };
        }
        return p;
      });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(PROPOSALS_CACHE_KEY, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    setTimeout(() => {
      fetchProposals(true);
      refetchStatusCounts();
    }, 300);
  };

  useEffect(() => {
    // Auto-sync proposals from individual factory links on mount
    fetch("/api/ci-kaizen/sync", { method: "POST" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          fetchProposals(true);
          refetchStatusCounts();
        }
      })
      .catch(() => {});

    fetchProposals(proposals.length > 0);

    // Automatic short-interval background polling for real-time UI/leaderboard updates
    const pollInterval = registerPoller(
      setInterval(() => {
        fetchProposals(true);
      }, 8000)
    );

    return () => unregisterPoller(pollInterval);
  }, []);

  const [isSyncingKG, setIsSyncingKG] = useState(false);

  const handleSyncFromKienGiang = async () => {
    try {
      setIsSyncingKG(true);
      showToast("⏳ Đang đồng bộ dữ liệu sáng kiến từ Kiên Giang Shoes...");
      const res = await fetch("/api/ci-kaizen/sync", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast(`🎉 ${json.message || "Đồng bộ sáng kiến Kiên Giang thành công!"}`);
        fetchProposals(true);
        refetchStatusCounts();
      } else {
        showToast(`❌ ${json.error || json.message || "Lỗi đồng bộ Kiên Giang"}`);
      }
    } catch (e: any) {
      showToast("❌ Lỗi kết nối máy chủ đồng bộ!");
    } finally {
      setIsSyncingKG(false);
    }
  };

  const handleRecordView = async (prop: KaizenProposal) => {
    setActiveProposal(prop);
    setIsDetailModalOpen(true);
    try {
      await fetch("/api/ci-kaizen/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prop.id }),
      });
      setProposals((prev) =>
        prev.map((p) => (p.id === prop.id ? { ...p, view_count: p.view_count + 1 } : p))
      );
    } catch (e) {}
  };

  const handleVote = async (e: React.MouseEvent, propId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/ci-kaizen/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: propId }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("👍 Đã bình chọn đề xuất cải tiến thành công!");
        setProposals((prev) =>
          prev.map((p) => (p.id === propId ? { ...p, vote_count: p.vote_count + 1 } : p))
        );
      } else {
        showToast(`⚠️ ${json.message || "Không thể bình chọn!"}`);
      }
    } catch (err) {
      showToast("❌ Lỗi kết nối máy chủ");
    }
  };

  const handleDeleteProposal = async (proposalId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa đề xuất cải tiến này khỏi hệ thống D1 Database?")) return;
    try {
      let token = "";
      if (typeof window !== "undefined") {
        token = localStorage.getItem("tbs_jwt_token") || localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_jwt_token") || sessionStorage.getItem("tbs_token") || "";
        if (!token && typeof document !== "undefined") {
          const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("tbs_token="));
          if (tokenCookie) token = tokenCookie.split("=")[1];
        }
      }

      const res = await fetch(`/api/ci-kaizen?id=${proposalId}`, {
        method: "DELETE",
        headers: {
          "X-User-Emp-Code": currentUser?.empCode || "202608001",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success) {
        showToast("🗑️ Đã xóa đề xuất cải tiến thành công!");
        setIsDetailModalOpen(false);
        setProposals((prev) => prev.filter((p) => p.id !== proposalId));
        fetchProposals();
        refetchStatusCounts();
      } else {
        showToast(`❌ ${json.message || "Lỗi khi xóa đề xuất"}`);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối!");
    }
  };

  const normalizedProposals = useMemo(() => {
    return proposals.map(normalizeProposal);
  }, [proposals]);

  const getProposalSavingsVal = (p: any): number => {
    if (!p) return 0;
    const directTotalVnd = Number(p.total_savings_vnd || (p as any).tong_tien_tiet_kiem || 0);
    if (directTotalVnd > 0) return directTotalVnd / 1000000;
    const savedSecs = Number(p.saved_seconds || 0);
    const qty = Number(p.pair_quantity || (p as any).so_luong_giay || 0);
    if (savedSecs > 0 && qty > 0) return (savedSecs * 12.5 * qty) / 1000000;
    return Number(p.efficiency_value_vnd || 0) / 1000000;
  };

  const proposalRanksMap = useMemo(() => {
    const map: Record<string, { rank: number; rankIndex: number; rankTitle: string; badgeLabel: string; badgeStyle: string; icon: string }> = {};

    const thiDuaList = normalizedProposals.filter((p) => {
      if (!p || p.is_archived) return false;
      if (selectedRegion !== "ALL" && !matchRegionFilter(p, selectedRegion)) return false;

      const appStatus = String(p.approval_status || "").toUpperCase();
      const subStatus = String(p.sub_status || p.review_status || "").toUpperCase();
      const status = String(p.status || "").toUpperCase();

      if (appStatus === "TU_CHOI" || subStatus === "TU_CHOI_TRIEN_KHAI" || subStatus === "TU_CHOI_DUYET" || status === "REJECTED" || subStatus === "CAN_CHINH_SUA") {
        return false;
      }

      if (
        subStatus === "CHO_REVIEW" ||
        subStatus === "SO_BO" ||
        subStatus === "SO_DUYET" ||
        subStatus === "CHO_DUYET" ||
        appStatus === "PENDING" ||
        status === "SUBMITTED" ||
        status === "CHO_DUYET" ||
        status === "DRAFT"
      ) {
        return false;
      }

      if (!isApprovedProposal(p)) return false;

      return true;
    });

    const sorted = [...thiDuaList].sort((a, b) => {
      const valA = getProposalSavingsVal(a);
      const valB = getProposalSavingsVal(b);
      if (valB !== valA) return valB - valA;

      const scoreA = Number(a.score_points || (a as any).scorePoints || 0);
      const scoreB = Number(b.score_points || (b as any).scorePoints || 0);
      if (scoreB !== scoreA) return scoreB - scoreA;

      const voteA = Number(a.vote_count || 0);
      const voteB = Number(b.vote_count || 0);
      if (voteB !== voteA) return voteB - voteA;

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    sorted.forEach((item, index) => {
      let rank = 1;
      let rankTitle = "Hạng Nhất";
      let badgeLabel = "🥇 Hạng 1";
      let badgeStyle = "bg-amber-400 text-amber-950 font-black border border-amber-300 shadow-md";
      let icon = "🥇";

      if (index === 0) {
        rank = 1;
        rankTitle = "Hạng Nhất";
        badgeLabel = "🥇 Hạng 1";
        badgeStyle = "bg-amber-400 text-amber-950 font-black border border-amber-300 shadow-md";
        icon = "🥇";
      } else if (index >= 1 && index <= 2) {
        rank = 2;
        rankTitle = "Hạng Nhì";
        badgeLabel = "🥈 Hạng 2";
        badgeStyle = "bg-slate-200 text-slate-900 font-black border border-slate-300 shadow-xs";
        icon = "🥈";
      } else if (index >= 3 && index <= 7) {
        rank = 3;
        rankTitle = "Hạng Ba";
        badgeLabel = "🥉 Hạng 3";
        badgeStyle = "bg-amber-800 text-amber-100 font-black border border-amber-600 shadow-xs";
        icon = "🥉";
      } else if (index >= 8 && index <= 17) {
        rank = 4;
        rankTitle = "Hạng 4";
        badgeLabel = "🎖️ Hạng 4";
        badgeStyle = "bg-blue-100 text-blue-900 font-extrabold border border-blue-300 shadow-2xs";
        icon = "🎖️";
      } else if (index >= 18 && index <= 37) {
        rank = 5;
        rankTitle = "Hạng 5";
        badgeLabel = "🎗️ Hạng 5";
        badgeStyle = "bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300 shadow-2xs";
        icon = "🎗️";
      } else {
        rank = index + 1;
        rankTitle = `Hạng ${index + 1}`;
        badgeLabel = `#${index + 1}`;
        badgeStyle = "bg-slate-100 text-slate-700 font-bold border border-slate-200";
        icon = "#";
      }

      map[item.id] = { rank, rankIndex: index, rankTitle, badgeLabel, badgeStyle, icon };
    });

    return map;
  }, [normalizedProposals, selectedRegion]);

  const filteredProposals = useMemo(() => {
    const filtered = normalizedProposals.filter((p) => {
      if (selectedRegion !== "ALL" && !matchRegionFilter(p, selectedRegion)) {
        return false;
      }
      if (selectedWorkshop !== "ALL" && !matchWorkshopFilter(p, selectedWorkshop)) {
        return false;
      }
      if (selectedCategory !== "ALL" && p.category !== selectedCategory) {
        return false;
      }
      if (!matchRegTypeFilter(p, selectedRegType)) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          (p.title || p.before_description || "").toLowerCase().includes(q) ||
          (p.code || "").toLowerCase().includes(q) ||
          (p.proposer_name || "").toLowerCase().includes(q) ||
          (p.department || "").toLowerCase().includes(q);
        if (!matchSearch) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (selectedRegType === "CHO_PHE_DUYET" || selectedRegType === "CHO_DUYET") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }

      const rankIdxA = proposalRanksMap[a.id]?.rankIndex;
      const rankIdxB = proposalRanksMap[b.id]?.rankIndex;

      if (rankIdxA !== undefined && rankIdxB !== undefined) {
        return rankIdxA - rankIdxB;
      }

      if (rankIdxA !== undefined && rankIdxB === undefined) return -1;
      if (rankIdxA === undefined && rankIdxB !== undefined) return 1;

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [normalizedProposals, selectedRegion, selectedWorkshop, selectedCategory, selectedRegType, searchQuery, proposalRanksMap]);

  const regTypeCounts = useMemo(() => {
    const targetRegion = activeUnitInfo ? activeUnitInfo.regionKey : selectedRegion;
    const scopedProposals = normalizedProposals.filter((p) => {
      if (targetRegion !== "ALL" && !matchRegionFilter(p, targetRegion)) {
        return false;
      }
      return true;
    });

    let thiDua = 0, choReview = 0, choDanhGia = 0, daDanhGia = 0, luuTru = 0;
    for (const p of scopedProposals) {
      if (matchRegTypeFilter(p, "THI_DUA")) thiDua++;
      if (matchRegTypeFilter(p, "CHO_PHE_DUYET")) choReview++;
      if (matchRegTypeFilter(p, "CHO_DANH_GIA")) choDanhGia++;
      if (matchRegTypeFilter(p, "DA_DANH_GIA")) daDanhGia++;
      if (matchRegTypeFilter(p, "LUU_TRU")) luuTru++;
    }
    return { thiDua, choReview, choDanhGia, daDanhGia, luuTru };
  }, [normalizedProposals, activeUnitInfo, selectedRegion]);

  const countThiDua = regTypeCounts.thiDua;
  const countChoReview = regTypeCounts.choReview;
  const countChoDanhGia = regTypeCounts.choDanhGia;
  const countDaDanhGia = regTypeCounts.daDanhGia;
  const countLuuTru = regTypeCounts.luuTru;

  const subPageStageCounts = useMemo(() => {
    const targetRegion = activeUnitInfo ? activeUnitInfo.regionKey : selectedRegion;
    const unitProps = normalizedProposals.filter((p) =>
      targetRegion === "ALL" ? true : matchRegionFilter(p, targetRegion)
    );
    let dauVao = 0, may = 0, go = 0, khac = 0;
    for (const p of unitProps) {
      if (matchWorkshopFilter(p, "Đầu vào")) dauVao++;
      else if (matchWorkshopFilter(p, "May")) may++;
      else if (matchWorkshopFilter(p, "Gò")) go++;
      else khac++;
    }
    return { dauVao, may, go, khac, total: unitProps.length };
  }, [normalizedProposals, activeUnitInfo, selectedRegion]);

  const regionCounts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const subItem of REGION_SUB_ITEMS) {
      result[subItem] = 0;
    }
    for (const p of normalizedProposals) {
      if (selectedWorkshop !== "ALL" && !matchWorkshopFilter(p, selectedWorkshop)) continue;
      const reg = normalizeRegion(p);
      if (result[reg] !== undefined) {
        result[reg] += 1;
      }
    }
    result["THKG"] = (result["Phòng Ban THKG"] || 0) +
                     (result["Kiên Giang 1"] || 0) +
                     (result["Kiên Giang 2"] || 0) +
                     (result["Kiên Giang 3"] || 0) +
                     (result["Hoàn Thiện Đế"] || 0);
    return result;
  }, [normalizedProposals, selectedWorkshop]);

  const categoryCounts = useMemo(() => {
    const targetRegion = activeUnitInfo ? activeUnitInfo.regionKey : selectedRegion;
    const scopedProposals = normalizedProposals.filter((p) => {
      if (targetRegion !== "ALL" && !matchRegionFilter(p, targetRegion)) {
        return false;
      }
      return true;
    });

    const result: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      result[cat.id] = scopedProposals.filter((p) => p.category === cat.id).length;
    }
    return result;
  }, [normalizedProposals, activeUnitInfo, selectedRegion]);



  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans flex flex-col md:flex-row w-full selection:bg-[#006838] selection:text-white">
      {/* SIDEBAR */}
      <aside
        className={`bg-[#0b1739] text-slate-200 flex-col flex-shrink-0 transition-all duration-300 select-none z-30 sticky top-0 h-screen overflow-y-auto ${
          isSidebarCollapsed ? "w-20 p-2.5" : "w-64 lg:w-72 p-3.5"
        } flex flex-col justify-between border-r border-slate-800 shadow-xl`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/90">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-xl px-2.5 py-1 flex items-center justify-center border border-slate-200 shadow-2xs">
                  <img
                    src="/images/tbs-logo.png"
                    alt="TBS Group Logo"
                    className="h-6 w-auto object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="mx-auto bg-white rounded-lg p-1">
                <img
                  src="/images/tbs-logo.png"
                  alt="TBS"
                  className="h-5 w-auto object-contain"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              {!isSidebarCollapsed && (
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xs font-black hover:bg-amber-500/30 transition-colors cursor-pointer"
                  title="Hướng dẫn sử dụng"
                >
                  ?
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
                title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
              >
                {isSidebarCollapsed ? <IconChevronRight size={15} /> : <IconChevronLeft size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
                MENU
              </h4>
            )}
            <div className="space-y-1">
              <Link
                href="/work"
                className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2"
                } bg-slate-800/90 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700/80 shadow-2xs mb-1`}
                title="Quay lại Trang Chủ Công Việc (/work)"
              >
                <IconArrowLeft size={18} className="shrink-0 text-emerald-400" />
                {!isSidebarCollapsed && <span className="truncate">Về Trang Chủ</span>}
              </Link>

              {activeUnitInfo && (
                <Link
                  href="/work/kaizen"
                  className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2"
                  } bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-extrabold text-xs border border-emerald-800/80 shadow-2xs mb-1`}
                  title="Về Trang Tổng Quan (7 Đơn Vị)"
                >
                  <IconBuildingFactory size={18} className="shrink-0 text-emerald-400" />
                  {!isSidebarCollapsed && <span className="truncate">🏠 Về Tổng Quan</span>}
                </Link>
              )}

              <button
                type="button"
                onClick={() => { closeAllModals(); setActiveTab("LIBRARY"); }}
                className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2.5"
                } ${
                  activeTab === "LIBRARY"
                    ? "bg-gradient-to-r from-[#b38549] to-[#996d36] text-white font-extrabold shadow-md shadow-amber-950/40"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white font-bold text-xs"
                }`}
              >
                <IconPhoto size={18} className="shrink-0" />
                {!isSidebarCollapsed && <span className="text-xs truncate">Thư viện</span>}
              </button>

              <button
                type="button"
                onClick={() => { closeAllModals(); setActiveTab("DASHBOARD"); }}
                className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2.5"
                } ${
                  activeTab === "DASHBOARD"
                    ? "bg-gradient-to-r from-[#b38549] to-[#996d36] text-white font-extrabold shadow-md shadow-amber-950/40"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white font-bold text-xs"
                }`}
              >
                <IconChartBar size={18} className="shrink-0" />
                {!isSidebarCollapsed && <span className="text-xs truncate">Dashboard</span>}
              </button>

              <button
                type="button"
                onClick={() => { closeAllModals(); setActiveTab("EARLY_WARNING"); }}
                className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2.5"
                } ${
                  activeTab === "EARLY_WARNING"
                    ? "bg-rose-900 text-white font-extrabold shadow-md border border-rose-600"
                    : "text-rose-300 hover:bg-rose-950/60 font-bold text-xs"
                }`}
              >
                <IconShieldCheck size={18} className="shrink-0 text-rose-400" />
                {!isSidebarCollapsed && <span className="truncate">Cảnh báo Ban 2.2</span>}
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2"
                } text-slate-300 hover:bg-slate-800/80 hover:text-white font-bold text-xs`}
              >
                <IconCloudUpload size={18} className="shrink-0 text-slate-400" />
                {!isSidebarCollapsed && <span className="truncate">Đăng tải nhanh</span>}
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {!isSidebarCollapsed && (
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  LỌC NHANH
                </h4>
                {isCountsLoading && (
                  <span className="flex h-2 w-2 relative" title="Đang đồng bộ số liệu...">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
            )}

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsRegTypeExpanded(!isRegTypeExpanded)}
                className={`w-full flex items-center justify-between text-xs font-extrabold text-slate-200 rounded-lg ${
                  isSidebarCollapsed ? "justify-center p-2" : "px-2 py-1 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconFilter size={16} className="text-slate-400 shrink-0" />
                  {!isSidebarCollapsed && <span>Trạng thái lọc</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-slate-400">
                    {isRegTypeExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </span>
                )}
              </button>

              {(!isSidebarCollapsed && isRegTypeExpanded) && (
                <div className="space-y-0.5 pl-2 text-xs font-bold">
                  <button
                    onClick={() => {
                      const nextReg = selectedRegType === "THI_DUA" ? "ALL" : "THI_DUA";
                      setSelectedRegType(nextReg);
                      setSelectedWorkshop("ALL");
                      setSelectedCategory("ALL");
                      setActiveTab("LIBRARY");
                    }}
                    className={`w-full text-left px-2.5 py-1 rounded-lg flex items-center justify-between transition-colors ${
                      selectedRegType === "THI_DUA"
                        ? "bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <IconTrophy size={13} className="text-amber-400 shrink-0" />
                      <span>Thi đua</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[9px] font-extrabold">
                      {countThiDua}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      const nextReg = selectedRegType === "CHO_PHE_DUYET" ? "ALL" : "CHO_PHE_DUYET";
                      setSelectedRegType(nextReg);
                      setSelectedWorkshop("ALL");
                      setSelectedCategory("ALL");
                      setActiveTab("LIBRARY");
                    }}
                    className={`w-full text-left px-2.5 py-1 rounded-lg flex items-center justify-between transition-colors ${
                      selectedRegType === "CHO_PHE_DUYET"
                        ? "bg-blue-500/20 text-blue-300 font-extrabold border border-blue-500/30"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <IconUserCheck size={13} className="text-blue-400 shrink-0" />
                      <span>Chờ phê duyệt</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-300 text-[9px] font-extrabold">
                      {countChoReview}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      const nextReg = selectedRegType === "DA_DANH_GIA" ? "ALL" : "DA_DANH_GIA";
                      setSelectedRegType(nextReg);
                      setSelectedWorkshop("ALL");
                      setSelectedCategory("ALL");
                      setActiveTab("LIBRARY");
                    }}
                    className={`w-full text-left px-2.5 py-1 rounded-lg flex items-center justify-between transition-colors ${
                      selectedRegType === "DA_DANH_GIA"
                        ? "bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <IconCircleCheck size={13} className="text-emerald-400 shrink-0" />
                      <span>Đã duyệt</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[9px] font-extrabold">
                      {countDaDanhGia}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      const nextReg = selectedRegType === "LUU_TRU" ? "ALL" : "LUU_TRU";
                      setSelectedRegType(nextReg);
                      setSelectedWorkshop("ALL");
                      setSelectedCategory("ALL");
                      setActiveTab("LIBRARY");
                    }}
                    className={`w-full text-left px-2.5 py-1 rounded-lg flex items-center justify-between transition-colors ${
                      selectedRegType === "LUU_TRU"
                        ? "bg-slate-800 text-white font-extrabold"
                        : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <IconBox size={13} className="text-slate-400 shrink-0" />
                      <span>Lưu trữ</span>
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-extrabold">
                      {countLuuTru}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsRegionExpanded(!isRegionExpanded)}
                className={`w-full flex items-center justify-between text-xs font-extrabold text-slate-200 rounded-lg ${
                  isSidebarCollapsed ? "justify-center p-2" : "px-2 py-1 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconBuilding size={16} className="text-slate-400 shrink-0" />
                  {!isSidebarCollapsed && <span>{activeUnitInfo ? "Phân xưởng sản xuất" : "Khu vực sản xuất"}</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-slate-400">
                    {isRegionExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </span>
                )}
              </button>

              {(!isSidebarCollapsed && isRegionExpanded) && (
                <div className="space-y-0.5 pl-2 text-xs font-bold">
                  {activeUnitInfo ? (
                    <>
                      <div
                        onClick={() => {
                          setSelectedWorkshop("ALL");
                          setSelectedRegType("ALL");
                          setSelectedCategory("ALL");
                        }}
                        className={`px-2 py-1 rounded flex items-center justify-between text-[11px] font-extrabold tracking-wider uppercase cursor-pointer transition-colors ${
                          selectedWorkshop === "ALL"
                            ? "text-emerald-400 bg-emerald-950/40"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/40"
                        }`}
                        title="Bấm để xem tất cả phân xưởng"
                      >
                        <span>PHÂN XƯỞNG SẢN XUẤT ({activeUnitInfo.label})</span>
                        <span className="text-[9px] text-emerald-300 font-mono font-bold">({subPageStageCounts.total})</span>
                      </div>
                      <div className="pl-4 space-y-0.5 border-l border-slate-700/80 ml-2 mb-1">
                        {[
                          { key: "Đầu vào", label: "📦 Đầu vào", count: subPageStageCounts.dauVao },
                          { key: "May", label: "🪡 May", count: subPageStageCounts.may },
                          { key: "Gò", label: "👟 Gò", count: subPageStageCounts.go },
                        ].map((stg) => (
                          <button
                            key={stg.key}
                            onClick={() => {
                              const nextWs = selectedWorkshop === stg.key ? "ALL" : stg.key;
                              setSelectedWorkshop(nextWs);
                              setSelectedRegType("ALL");
                              setSelectedCategory("ALL");
                              setActiveTab("LIBRARY");
                            }}
                            className={`w-full text-left px-2 py-1 rounded flex items-center justify-between text-[11px] transition-colors ${
                              selectedWorkshop === stg.key
                                ? "bg-emerald-900/80 text-emerald-200 font-black"
                                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium"
                            }`}
                          >
                            <span className="truncate">{stg.label}</span>
                            <span className="text-[9px] text-slate-300 font-mono font-bold">({stg.count})</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-2 py-1 text-slate-400 text-[11px] font-extrabold tracking-wider uppercase">
                        KHU VỰC SẢN XUẤT
                      </div>
                      <div className="pl-4 space-y-1 border-l border-slate-700/80 ml-2 mb-1">
                        {/* 1. Văn phòng Chuỗi */}
                        <button
                          type="button"
                          onClick={() => {
                            const nextReg = selectedRegion === "Văn phòng Chuỗi" ? "ALL" : "Văn phòng Chuỗi";
                            setSelectedRegion(nextReg);
                            setSelectedWorkshop("ALL");
                            setSelectedRegType("ALL");
                            setSelectedCategory("ALL");
                            setActiveTab("LIBRARY");
                          }}
                          className={`w-full text-left px-2 py-1 rounded flex items-center justify-between text-[11px] transition-colors cursor-pointer ${
                            selectedRegion === "Văn phòng Chuỗi" ? "bg-emerald-900/80 text-emerald-200 font-black" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium"
                          }`}
                        >
                          <span className="truncate">🏢 Văn phòng Chuỗi</span>
                          <span className="text-[9px] text-slate-300 font-mono font-bold">({regionCounts["Văn phòng Chuỗi"] || 0})</span>
                        </button>

                        {/* 2. Nhà Máy Miền Đông */}
                        <button
                          type="button"
                          onClick={() => {
                            const nextReg = selectedRegion === "Nhà Máy Miền Đông" ? "ALL" : "Nhà Máy Miền Đông";
                            setSelectedRegion(nextReg);
                            setSelectedWorkshop("ALL");
                            setSelectedRegType("ALL");
                            setSelectedCategory("ALL");
                            setActiveTab("LIBRARY");
                          }}
                          className={`w-full text-left px-2 py-1 rounded flex items-center justify-between text-[11px] transition-colors cursor-pointer ${
                            selectedRegion === "Nhà Máy Miền Đông" ? "bg-emerald-900/80 text-emerald-200 font-black" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium"
                          }`}
                        >
                          <span className="truncate">🏭 Nhà Máy Miền Đông</span>
                          <span className="text-[9px] text-slate-300 font-mono font-bold">({regionCounts["Nhà Máy Miền Đông"] || 0})</span>
                        </button>

                        {/* 3. Tổ Hợp Kiên Giang (THKG) Parent Group */}
                        <div className="space-y-0.5 pt-0.5">
                          <div
                            className={`w-full text-left px-2 py-1 rounded flex items-center justify-between text-[11px] transition-colors cursor-pointer ${
                              selectedRegion === "THKG" ? "bg-emerald-900/80 text-emerald-200 font-black" : "text-slate-300 hover:bg-slate-800/60 hover:text-white font-bold"
                            }`}
                            onClick={() => {
                              const nextReg = selectedRegion === "THKG" ? "ALL" : "THKG";
                              setSelectedRegion(nextReg);
                              setSelectedWorkshop("ALL");
                              setSelectedRegType("ALL");
                              setSelectedCategory("ALL");
                              setActiveTab("LIBRARY");
                            }}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsThkgExpanded(!isThkgExpanded);
                                }}
                                className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                title="Đóng/Mở danh sách đơn vị THKG"
                              >
                                {isThkgExpanded ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
                              </button>
                              <span className="truncate">📍 THKG</span>
                            </div>
                            <span className="text-[9px] text-emerald-400 font-mono font-black bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
                              ({regionCounts["THKG"] || 0})
                            </span>
                          </div>

                          {/* THKG 5 Sub-units */}
                          {isThkgExpanded && (
                            <div className="pl-3 space-y-0.5 border-l border-slate-700/60 ml-2 pt-0.5">
                              {[
                                { label: "Phòng Ban THKG", slug: "phong-ban-thkg" },
                                { label: "Kiên Giang 1", slug: "kien-giang-1" },
                                { label: "Kiên Giang 2", slug: "kien-giang-2" },
                                { label: "Kiên Giang 3", slug: "kien-giang-3" },
                                { label: "Hoàn Thiện Đế", slug: "hoan-thien-de" },
                              ].map((subItem) => {
                                const cnt = regionCounts[subItem.label] ?? 0;
                                return (
                                  <button
                                    key={subItem.label}
                                    type="button"
                                    onClick={() => {
                                      const nextReg = selectedRegion === subItem.label ? "ALL" : subItem.label;
                                      setSelectedRegion(nextReg);
                                      setSelectedWorkshop("ALL");
                                      setSelectedRegType("ALL");
                                      setSelectedCategory("ALL");
                                      setActiveTab("LIBRARY");
                                    }}
                                    className={`w-full text-left px-2 py-0.5 rounded flex items-center justify-between text-[10.5px] transition-colors cursor-pointer ${
                                      selectedRegion === subItem.label ? "bg-emerald-900/80 text-emerald-200 font-black" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium"
                                    }`}
                                  >
                                    <span className="truncate">└ {subItem.label}</span>
                                    <span className="text-[9px] text-slate-300 font-mono font-bold">({cnt})</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
                className={`w-full flex items-center justify-between text-xs font-extrabold text-slate-200 rounded-lg ${
                  isSidebarCollapsed ? "justify-center p-2" : "px-2 py-1 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconTag size={16} className="text-slate-400 shrink-0" />
                  {!isSidebarCollapsed && <span>Phân loại</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-slate-400">
                    {isCategoryExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </span>
                )}
              </button>

              {(!isSidebarCollapsed && isCategoryExpanded) && (
                <div className="space-y-0.5 pl-2 text-xs font-bold">
                  {CATEGORIES.map((c) => {
                    const cnt = categoryCounts[c.id] ?? 0;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          const nextCat = selectedCategory === c.id ? "ALL" : c.id;
                          setSelectedCategory(nextCat);
                          setSelectedRegType("ALL");
                          setSelectedWorkshop("ALL");
                          setActiveTab("LIBRARY");
                        }}
                        className={`w-full text-left px-2 py-0.5 rounded-lg flex items-center justify-between transition-colors ${
                          selectedCategory === c.id ? "bg-[#006838] text-white font-extrabold" : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                        }`}
                      >
                        <span className="truncate">{c.label}</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[9px] font-extrabold">
                          {cnt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            {!isSidebarCollapsed && (
              <div className="min-w-0 leading-tight">
                <span className="text-xs font-black text-white block truncate" title={currentUser.name}>
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium truncate max-w-[130px]" title={formatTitleWithDepartment(currentUser.title, (currentUser as any).department)}>
                  {formatTitleWithDepartment(currentUser.title, (currentUser as any).department)}
                </span>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button type="button" className="text-slate-400 hover:text-white p-1 transition-colors">
              <IconDotsVertical size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 p-4 lg:p-6 space-y-4 min-w-0 overflow-x-hidden">
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white font-extrabold text-xs shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
            <IconSparkles size={16} className="text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {activeTab === "DASHBOARD" ? (
          <KaizenDashboard
            proposals={normalizedProposals}
            targetRegion={activeUnitInfo ? activeUnitInfo.regionKey : (selectedRegion !== "ALL" ? selectedRegion : undefined)}
            onBackToLibrary={() => setActiveTab("LIBRARY")}
            onSelectProposal={(p) => {
              setActiveProposal(p);
              setIsDetailModalOpen(true);
            }}
          />
        ) : activeTab === "EARLY_WARNING" ? (
          <KaizenEarlyWarning
            proposals={proposals}
            onSelectProposal={(p) => {
              setActiveProposal(p);
              setIsDetailModalOpen(true);
            }}
          />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <IconPhoto size={18} />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Thư Viện Cải Tiến</span>
                  {activeUnitInfo ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200 text-xs font-black shadow-2xs">
                      📍 Đơn vị: {activeUnitInfo.label}
                    </span>
                  ) : (
                    <span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-xl border border-blue-200 text-xs font-black shadow-2xs">
                      🌐 Tổng Quan (7 Đơn Vị)
                    </span>
                  )}
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { closeAllModals(); setActiveTab("EARLY_WARNING"); }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <IconShieldCheck size={15} />
                  <span>🚨 Cảnh Báo Ban 2.2</span>
                </button>

                <button
                  onClick={() => { closeAllModals(); setActiveTab("DASHBOARD"); }}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
                >
                  <IconChartBar size={15} />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md border border-amber-300"
                >
                  <IconQrcode size={16} />
                  <span>📱 QR Công Nhân</span>
                </button>

                <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs">
                  <button
                    onClick={() => setViewMode("GRID")}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === "GRID"
                        ? "bg-slate-100 text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <IconLayoutGrid size={15} />
                    <span>Lưới</span>
                  </button>
                  <button
                    onClick={() => setViewMode("LIST")}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === "LIST"
                        ? "bg-slate-100 text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <IconList size={15} />
                    <span>Danh sách</span>
                  </button>
                </div>

                <button
                  onClick={() => fetchProposals(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
                  title="Tải lại dữ liệu"
                >
                  <IconRefresh size={15} className={loading ? "animate-spin" : ""} />
                  <span>Làm mới</span>
                </button>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-[#11244e] hover:bg-[#0c1a38] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <IconPlus size={16} />
                  <span>Đăng ký</span>
                </button>

                <button
                  onClick={() => showToast("📊 Đã xuất file Excel dữ liệu cải tiến thành công!")}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-600 text-xs font-extrabold border border-emerald-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <IconDownload size={15} />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
                <select
                  value={selectedRegType}
                  onChange={(e) => setSelectedRegType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 outline-none focus:border-[#006838]"
                >
                  <option value="ALL">🏆 Tất cả loại</option>
                  <option value="THI_DUA">🏆 Thi đua</option>
                  <option value="CHO_PHE_DUYET">👤 Chờ phê duyệt</option>
                  <option value="DA_DANH_GIA">✅ Đã duyệt</option>
                  <option value="LUU_TRU">📦 Lưu trữ</option>
                </select>

                <div className="relative col-span-2 sm:col-span-1 md:col-span-2">
                  <input
                    type="text"
                    placeholder="🔍 Tìm mã hàng, tiêu đề..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-800 outline-none focus:border-[#006838]"
                  />
                  <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 outline-none focus:border-[#006838]"
                >
                  <option value="ALL">📁 Danh mục</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedRegion(val);
                    setSelectedWorkshop("ALL");
                    setSelectedRegType("ALL");
                    setSelectedCategory("ALL");
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 outline-none focus:border-[#006838]"
                  title="Chọn Khu vực sản xuất"
                >
                  <option value="ALL">🏢 Khu vực sản xuất (Tất cả)</option>
                  <option value="Văn phòng Chuỗi">🏢 Văn phòng Chuỗi ({regionCounts["Văn phòng Chuỗi"] || 0})</option>
                  <option value="Nhà Máy Miền Đông">🏭 Nhà Máy Miền Đông ({regionCounts["Nhà Máy Miền Đông"] || 0})</option>
                  <optgroup label="📍 TỔ HỢP KIÊN GIANG (THKG)">
                    <option value="THKG">📍 Tất cả THKG ({regionCounts["THKG"] || 0})</option>
                    <option value="Phòng Ban THKG">  └ Phòng Ban THKG ({regionCounts["Phòng Ban THKG"] || 0})</option>
                    <option value="Kiên Giang 1">  └ Kiên Giang 1 ({regionCounts["Kiên Giang 1"] || 0})</option>
                    <option value="Kiên Giang 2">  └ Kiên Giang 2 ({regionCounts["Kiên Giang 2"] || 0})</option>
                    <option value="Kiên Giang 3">  └ Kiên Giang 3 ({regionCounts["Kiên Giang 3"] || 0})</option>
                    <option value="Hoàn Thiện Đế">  └ Hoàn Thiện Đế ({regionCounts["Hoàn Thiện Đế"] || 0})</option>
                  </optgroup>
                </select>

                <select
                  value={selectedWorkshop}
                  onChange={(e) => setSelectedWorkshop(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 outline-none focus:border-[#006838]"
                  title="Lọc theo Phân xưởng sản xuất"
                >
                  <option value="ALL">🏭 Phân xưởng sản xuất (Tất cả)</option>
                  <option value="Đầu vào">Đầu vào</option>
                  <option value="May">May</option>
                  <option value="Gò">Gò</option>
                </select>

                <select className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 outline-none focus:border-[#006838]">
                  <option value="ALL">📅 Tháng/Năm</option>
                  <option value="8/2026">T8/2026</option>
                  <option value="7/2026">T7/2026</option>
                </select>

                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("ALL");
                    setSelectedRegion("ALL");
                    setSelectedWorkshop("ALL");
                    setSelectedRegType("ALL");
                    setSelectedSubStatus("ALL");
                    setSelectedStatus("ALL");
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                >
                  <IconRotate size={14} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-6 text-xs font-extrabold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="text-blue-600 font-bold">📁</span>
                <span>Tổng: <strong className="font-black text-slate-900">{proposals.length}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">🔻</span>
                <span>Đã lọc: <strong className="font-black text-slate-900">{filteredProposals.length}</strong></span>
              </span>
            </div>

            <div className="w-full space-y-4">

              {viewMode === "GRID" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredProposals.map((prop) => {
                    const catObj = CATEGORIES.find((c) => c.id === prop.category) || CATEGORIES[6];
                    const rankInfo = proposalRanksMap[prop.id];
                    return (
                      <div
                        key={prop.id}
                        onClick={() => handleRecordView(prop)}
                        className="rounded-2xl bg-[#ffffff] border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#006838]/60 transition-all cursor-pointer overflow-hidden flex flex-col justify-between group"
                      >
                        <div className="relative h-28 bg-slate-100 border-b border-slate-100 overflow-hidden flex items-center justify-center group/img">
                          <KaizenCardImage
                            src={prop.before_image_url}
                            alt={prop.title}
                            attachmentsJson={prop.attachments_json}
                          />

                          <div className="absolute top-1.5 right-1.5 pointer-events-none z-10">
                            {renderCardTopRightBadge(prop, rankInfo)}
                          </div>

                          <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-slate-950/90 via-slate-950/70 to-transparent text-white flex items-center justify-between text-[10px] font-bold">
                            <div className="flex items-center gap-1 truncate max-w-[70%]">
                              <IconUser size={12} className="text-slate-300 shrink-0" />
                              <span className="truncate">{prop.proposer_name}</span>
                            </div>
                            <span className="text-[9px] text-amber-300 font-mono">#{prop.code}</span>
                          </div>
                        </div>

                        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[9.5px] font-bold text-slate-500">
                              <IconTag size={10} className="text-emerald-600 shrink-0" />
                              <span className="truncate text-emerald-700">{prop.category_label || catObj.label}</span>
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-xs line-clamp-2 leading-snug group-hover:text-[#006838] transition-colors" title={getKaizenDisplayTitle(prop)}>
                              {getKaizenDisplayTitle(prop)}
                            </h3>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
                              <span className="flex items-center gap-1 truncate">
                                <IconMapPin size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate">{prop.region || prop.factory || "VP CHUỖI"}</span>
                              </span>
                              <span className="flex items-center gap-1 truncate">
                                <IconBuildingFactory size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate">{prop.department}</span>
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 min-h-[32px]">
                            <button
                              type="button"
                              onClick={(e) => handleVote(e, prop.id)}
                              className="flex items-center gap-1 hover:text-emerald-600 font-bold transition-colors cursor-pointer"
                            >
                              <IconThumbUp size={13} className="text-slate-400 hover:text-emerald-600" />
                              <span>{prop.vote_count || 0}</span>
                            </button>

                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="flex items-center gap-0.5 text-slate-400">
                                <IconEye size={13} />
                                <span>{prop.view_count || 0}</span>
                              </span>



                              {isApprovedProposal(prop) && (
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black shadow-xs flex items-center gap-1 shrink-0 border ${
                                    rankInfo ? rankInfo.badgeStyle : "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  }`}
                                  title={rankInfo ? `Xếp hạng thi đua: ${rankInfo.rankTitle}` : "Sáng kiến đã được phê duyệt"}
                                >
                                  <span>{rankInfo ? rankInfo.badgeLabel : "✅ Đã duyệt"}</span>
                                </span>
                              )}

                              {((currentUser?.empCode && prop.proposer_emp_code && currentUser.empCode.trim().toUpperCase() === prop.proposer_emp_code.trim().toUpperCase()) ||
                                (currentUser?.name && prop.proposer_name && currentUser.name.trim().toLowerCase() === prop.proposer_name.trim().toLowerCase()) ||
                                isExecutiveOrAdmin ||
                                ["201711002", "210602002", "202608001", "202608010", "222102020"].includes((currentUser?.empCode || "").trim().toUpperCase())) && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteProposal(prop.id, e)}
                                  className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0 border border-rose-200"
                                  title="Xóa đề xuất cải tiến này"
                                >
                                  <IconTrash size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {viewMode === "LIST" && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase">
                          <th className="p-3">Mã</th>
                          <th className="p-3">Tiêu đề đề xuất</th>
                          <th className="p-3">Phân loại</th>
                          <th className="p-3">Khu vực</th>
                          <th className="p-3">Người đề xuất</th>
                          <th className="p-3 text-center">Trạng thái</th>
                          <th className="p-3 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredProposals.map((prop) => {
                          const rankInfo = proposalRanksMap[prop.id];
                          const isRejected =
                            Boolean(prop.is_archived) ||
                            prop.approval_status === "TU_CHOI" ||
                            prop.sub_status === "TU_CHOI_TRIEN_KHAI" ||
                            prop.sub_status === "TU_CHOI_DUYET" ||
                            prop.status === "REJECTED";
                          const isApproved = isApprovedProposal(prop);
                          const isPending = isPendingApprovalProposal(prop);

                          let badgeText = "Chờ duyệt";
                          let badgeStyle = "bg-amber-50 text-amber-900 border-amber-200 font-extrabold";

                          if (isRejected) {
                            badgeText = "Từ chối";
                            badgeStyle = "bg-rose-50 text-rose-800 border-rose-200 font-extrabold";
                          } else if (isPending) {
                            badgeText = "Chờ duyệt";
                            badgeStyle = "bg-amber-50 text-amber-900 border-amber-200 font-extrabold";
                          } else if (isApproved) {
                            if (rankInfo) {
                              badgeText = rankInfo.badgeLabel;
                              badgeStyle = `${rankInfo.badgeStyle} border font-black`;
                            } else {
                              badgeText = "Đã duyệt";
                              badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold";
                            }
                          }

                          return (
                            <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-mono font-bold text-amber-700">#{prop.code}</td>
                              <td className="p-3 font-bold text-slate-900">
                                <span>{getKaizenDisplayTitle(prop)}</span>
                                {isApproved && rankInfo && (
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black inline-flex items-center gap-1 ml-2 ${rankInfo.badgeStyle}`}>
                                    {rankInfo.badgeLabel}
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#006838] text-[10px] font-bold border border-emerald-200">
                                  {prop.category_label}
                                </span>
                              </td>
                              <td className="p-3">{prop.region || prop.factory || "VP CHUỖI"}</td>
                              <td className="p-3">{prop.proposer_name}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeStyle}`}>
                                  {badgeText}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleRecordView(prop)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#006838] hover:text-white transition-colors cursor-pointer text-[11px] font-bold"
                                  >
                                    Xem
                                  </button>

                                  {isApproved && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEvaluatingProposal(prop);
                                        setIsEvaluationModalOpen(true);
                                      }}
                                      className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer flex items-center justify-center"
                                      title="Chấm điểm chuyên môn 5 tiêu chí QĐ-TBKG"
                                    >
                                      <IconTrophy size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <KaizenPublicSubmitForm
          isModal={true}
          initialData={selectedRegion && selectedRegion !== "ALL" ? { region: selectedRegion, factory: selectedRegion } : undefined}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchProposals();
          }}
        />
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingProposal && (
        <KaizenPublicSubmitForm
          isModal={true}
          isEdit={true}
          proposalId={editingProposal.id}
          initialData={editingProposal}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProposal(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingProposal(null);
            fetchProposals();
          }}
        />
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && activeProposal && (
        <KaizenDetailModal
          proposal={activeProposal}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onEdit={() => {
            setEditingProposal(activeProposal);
            setIsDetailModalOpen(false);
            setIsEditModalOpen(true);
          }}
          onDelete={() => handleDeleteProposal(activeProposal.id)}
          onEvaluate={() => {
            fetchProposals();
          }}
          onRate={() => {
            fetchProposals();
          }}
          onSaveSuccess={handleProposalUpdated}
        />
      )}

      {/* WORKER QR MODAL */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden text-center animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-[#006838] to-[#0b1739] text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <IconQrcode size={22} className="text-amber-400" />
                <h3 className="text-sm font-black tracking-tight text-white">Mã QR Đăng Ký Cho Công Nhân</h3>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <IconX size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              <p className="text-xs text-slate-600 font-bold">
                Công nhân chỉ cần dùng camera điện thoại quét mã QR này để trực tiếp nộp đề xuất Kaizen <strong>không cần đăng nhập</strong>:
              </p>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registerUrl)}`}
                    alt="Mã QR Công Nhân Nộp Bài Kaizen"
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-800 break-all bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {registerUrl}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(registerUrl);
                    showToast("📋 Đã sao chép đường dẫn QR công nhân vào bộ nhớ tạm!");
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
                >
                  <IconCopy size={15} />
                  <span>Sao Chép Link</span>
                </button>

                <a
                  href={registerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-[#006838] hover:bg-[#004d29] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <IconExternalLink size={15} />
                  <span>Xem Trang Form</span>
                </a>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-black hover:bg-slate-900 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVALUATION MODAL */}
      <EvaluationModal
        isOpen={isEvaluationModalOpen}
        proposal={evaluatingProposal}
        onClose={() => {
          setIsEvaluationModalOpen(false);
          setEvaluatingProposal(null);
        }}
        onSuccess={() => {
          showToast("🎉 Đã lưu kết quả đánh giá hiệu quả sáng kiến!");
          fetchProposals();
          refetchStatusCounts();
        }}
      />

      {/* FEASIBILITY APPROVAL MODAL */}
      <FeasibilityApprovalModal
        isOpen={isApprovalModalOpen}
        proposal={approvalModalProposal}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setApprovalModalProposal(null);
        }}
        onSuccess={() => {
          showToast("🎉 Đã hoàn tất phê duyệt tính khả thi sáng kiến!");
          fetchProposals();
          refetchStatusCounts();
        }}
      />

      {/* PRELIMINARY REVIEW MODAL */}
      {isPreliminaryModalOpen && preliminaryProposal && (
        <PreliminaryReviewModal
          proposal={preliminaryProposal}
          onClose={() => {
            setIsPreliminaryModalOpen(false);
            setPreliminaryProposal(null);
          }}
          onSuccess={() => {
            showToast("🎉 Đã hoàn tất sơ duyệt hiện trường!");
            fetchProposals();
            refetchStatusCounts();
          }}
        />
      )}

      {/* DUPLICATE COMPARE MODAL */}
      {isDuplicateModalOpen && duplicateNewSubmission && (
        <KaizenDuplicateCompareModal
          newSubmission={duplicateNewSubmission}
          matchedMatches={duplicateMatches}
          onConfirmMerge={async (orig) => {
            try {
              const res = await fetch("/api/ci-kaizen/merge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  originalProposalId: orig.id,
                  newAttachments: duplicateNewSubmission.attachments || [],
                  proposerName: duplicateNewSubmission.proposerName,
                }),
              });
              const json = await res.json();
              if (json.success) {
                showToast(`🎉 ${json.message}`);
                setIsDuplicateModalOpen(false);
                setIsCreateModalOpen(false);
                fetchProposals();
                refetchStatusCounts();
              } else {
                showToast(`❌ ${json.error || "Lỗi khi gộp"}`);
              }
            } catch (e) {
              showToast("❌ Lỗi khi thực hiện gộp!");
            }
          }}
          onProceedAsNew={async () => {
            try {
              const res = await fetch("/api/ci-kaizen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...duplicateNewSubmission,
                  registrationType: "THI_DUA",
                }),
              });
              const json = await res.json();
              if (json.success) {
                showToast(`🎉 Đã gửi thành công đề xuất mới ${json.code || ""}!`);
                setIsDuplicateModalOpen(false);
                setIsCreateModalOpen(false);
                fetchProposals();
                refetchStatusCounts();
              } else {
                showToast(`❌ ${json.error || "Lỗi khi gửi đề xuất"}`);
              }
            } catch (e) {
              showToast("❌ Lỗi kết nối!");
            }
          }}
          onClose={() => setIsDuplicateModalOpen(false)}
        />
      )}
    </div>
  );
}
