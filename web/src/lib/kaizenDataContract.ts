/**
 * UNIFIED KAIZEN DATA CONTRACT & MAPPER (VERSION 1.0.0)
 * Standardized data contract between thkiengiangshoes (Source) and vpchuoiskechers (Target).
 */

export const KAIZEN_DATA_CONTRACT_VERSION = "1.0.0";

export type KaizenCategoryGroup = "PRODUCTIVITY" | "COST_SAVING" | "NON_FINANCIAL";

export interface NormalizedKaizenSyncPayload {
  id: string;
  external_id: string;
  code: string;
  title: string;
  category: string;
  category_label: string;
  category_group: KaizenCategoryGroup;
  registration_type: string;
  region: string;
  department: string;
  factory: string;
  line: string;
  customer: string;
  product_code: string;
  pricing_direction: string;
  proposer_name: string;
  proposer_emp_code: string;
  proposer_position: string;
  before_description: string;
  after_solution: string;
  time_before_seconds: number;
  time_after_seconds: number;
  saved_seconds: number;
  efficiency_value_vnd: number;
  cost_before: number;
  cost_after: number;
  pair_quantity: number;
  total_savings_vnd: number;
  total_savings_words: string;
  before_image_url: string;
  after_image_url: string;
  before_video_url: string;
  after_video_url: string;
  attachments_json: string;
  status: string;
  sub_status: string;
  trang_thai: string;
  review_status: string;
  approval_status: string;
  site_code: string;
  source_region: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Maps any raw category string (e.g. "7.MMTB CCDC", "EQUIPMENT", "3.Tăng Năng suất")
 * into one of 3 display template groups:
 * 1. PRODUCTIVITY (Cat 3 - Time & Productivity, 6-box metric)
 * 2. COST_SAVING (Cat 1, 2 - Material & Cost Saving, 3-box metric)
 * 3. NON_FINANCIAL (Cat 4, 5, 6, 7 - Safety, 5S, Automation, MMTB CCDC, 1-box metric)
 */
export function extractCategoryGroup(categoryRaw?: string, categoryLabelRaw?: string): KaizenCategoryGroup {
  const catStr = `${categoryRaw || ""} ${categoryLabelRaw || ""}`.trim().toUpperCase();

  // Category 4, 5, 6, 7: Safety / 5S / Automation / Equipment (MMTB CCDC)
  if (
    catStr.includes("EQUIPMENT") ||
    catStr.includes("MMTB") ||
    catStr.includes("CCDC") ||
    catStr.includes("SAFETY") ||
    catStr.includes("AN TOÀN") ||
    catStr.includes("AN TOAN") ||
    catStr.includes("5S") ||
    catStr.includes("AUTOMATION") ||
    catStr.includes("TỰ ĐỘNG") ||
    catStr.includes("TU DONG") ||
    catStr.includes("MÔI TRƯỜNG") ||
    catStr.includes("MOI TRUONG") ||
    catStr.startsWith("4.") ||
    catStr.startsWith("5.") ||
    catStr.startsWith("6.") ||
    catStr.startsWith("7.")
  ) {
    return "NON_FINANCIAL";
  }

  // Category 1, 2: Material & Cost Saving
  if (
    catStr.includes("MATERIAL") ||
    catStr.includes("COST") ||
    catStr.includes("VẬT TƯ") ||
    catStr.includes("VAT TU") ||
    catStr.includes("CHI PHÍ") ||
    catStr.includes("CHI PHI") ||
    catStr.startsWith("1.") ||
    catStr.startsWith("2.")
  ) {
    return "COST_SAVING";
  }

  // Category 3 (Productivity / Default)
  return "PRODUCTIVITY";
}

/**
 * Normalizes an incoming proposal payload from any site into a standard contract object.
 * Robustly fallback across snake_case, camelCase, and alternate field names so no data is lost!
 */
export function normalizeKaizenSyncPayload(item: any, defaultSiteCode = "thkiengiangshoes"): NormalizedKaizenSyncPayload {
  if (!item) item = {};

  const siteCode = item.site_code || item.siteCode || defaultSiteCode;
  const rawId = String(item.id || item.proposal_id || item.proposalId || "").trim();
  const externalId = String(item.external_id || item.externalId || rawId).trim();

  // Local ID prefix logic
  const localId = siteCode === "thkiengiangshoes"
    ? (rawId.startsWith("tkg_") ? rawId : `tkg_${externalId || rawId}`)
    : rawId;

  const code = (item.code || item.proposal_code || item.proposalCode || "").trim();

  // Title fallback
  const rawTitle = (item.title || item.tieu_de || item.name || item.proposal_title || "").toString().trim();
  const beforeDesc = (item.before_description || item.beforeDescription || item.van_de || item.mo_ta_truoc || "").toString().trim();
  const afterSol = (item.after_solution || item.afterSolution || item.giai_phap || item.mo_ta_sau || "").toString().trim();

  let finalTitle = rawTitle;
  if (!finalTitle || finalTitle === "Sáng kiến cải tiến Kaizen" || finalTitle === "Ý tưởng đề xuất cải tiến Kaizen") {
    if (beforeDesc && beforeDesc.length > 5 && !beforeDesc.includes("Chưa có mô tả")) {
      finalTitle = beforeDesc.length > 75 ? `${beforeDesc.substring(0, 72)}...` : beforeDesc;
    } else if (afterSol && afterSol.length > 5 && !afterSol.includes("Chưa có mô tả")) {
      finalTitle = afterSol.length > 75 ? `${afterSol.substring(0, 72)}...` : afterSol;
    } else {
      finalTitle = rawTitle || "Sáng kiến cải tiến Kaizen";
    }
  }

  const category = (item.category || item.category_code || "PRODUCTIVITY").trim();
  const categoryLabel = (item.category_label || item.categoryLabel || item.category_name || "3.Tăng Năng suất").trim();
  const categoryGroup = extractCategoryGroup(category, categoryLabel);

  const region = (item.region || item.factory || item.source_region || "TH Kiên Giang Shoes").trim();
  const department = (item.department || item.bo_phan || item.phong_ban || "").trim();
  const factory = (item.factory || region).trim();
  const line = (item.line || item.chuyen || "").trim();

  const customer = (item.customer || item.khach_hang || "").trim();
  const productCode = (item.product_code || item.productCode || item.ma_hang || "").trim();
  const pricingDirection = (item.pricing_direction || item.pricingDirection || item.huong_danh_gia || "THOI_GIAN").trim();

  const proposerName = (item.proposer_name || item.proposerName || item.nguoi_de_xuat || "").trim();
  const proposerEmpCode = (item.proposer_emp_code || item.proposerEmpCode || item.msnv || "").trim();
  const proposerPosition = (item.proposer_position || item.proposerPosition || item.vtcv || "").trim();

  const timeBeforeSeconds = Number(item.time_before_seconds ?? item.timeBeforeSeconds ?? item.truoc_sec ?? 0);
  const timeAfterSeconds = Number(item.time_after_seconds ?? item.timeAfterSeconds ?? item.sau_sec ?? 0);
  const savedSeconds = (timeBeforeSeconds > 0 || timeAfterSeconds > 0)
    ? Math.max(0, timeBeforeSeconds - timeAfterSeconds)
    : Number(item.saved_seconds ?? item.so_giay_tiet_kiem ?? item.savedSeconds ?? 0);

  const efficiencyValueVnd = Number(item.efficiency_value_vnd ?? item.efficiencyValueVND ?? item.hieu_qua_vnd ?? (savedSeconds > 0 ? Math.round(savedSeconds * 12.5) : 0));
  const costBefore = Number(item.cost_before ?? item.costBefore ?? item.chi_phi_truoc ?? 0);
  const costAfter = Number(item.cost_after ?? item.costAfter ?? item.chi_phi_sau ?? 0);

  const pairQuantity = Number(item.pair_quantity ?? item.quantity ?? item.pairQuantity ?? item.so_luong_giay ?? 0);
  const totalSavingsVnd = Number(item.total_savings_vnd ?? item.tong_tien_tiet_kiem ?? item.totalSavingsVnd ?? 0);
  const totalSavingsWords = (item.total_savings_words || item.totalSavingsWords || item.bang_chu || "").trim();

  const beforeImageUrl = (item.before_image_url || item.beforeImageUrl || item.anh_truoc || "").trim();
  const afterImageUrl = (item.after_image_url || item.afterImageUrl || item.anh_sau || "").trim();
  const beforeVideoUrl = (item.before_video_url || item.beforeVideoUrl || "").trim();
  const afterVideoUrl = (item.after_video_url || item.afterVideoUrl || "").trim();

  let attachmentsJson = item.attachments_json || item.attachmentsJson || null;
  if (!attachmentsJson && Array.isArray(item.attachments)) {
    attachmentsJson = JSON.stringify(item.attachments);
  }

  const status = (item.status || "APPROVED").trim();
  const subStatus = (item.sub_status || item.subStatus || "CHO_DANH_GIA").trim();
  const trangThai = (item.trang_thai || item.trangThai || subStatus).trim();
  const reviewStatus = (item.review_status || item.reviewStatus || "CHO_PHE_DUYET").trim();
  const approvalStatus = (item.approval_status || item.approvalStatus || "PHE_DUYET").trim();

  const isArchived = Boolean(
    Number(item.is_archived) === 1 ||
    item.is_archived === true ||
    Number(item.is_deleted) === 1 ||
    item.is_deleted === true ||
    status === "DELETED" ||
    subStatus === "LUU_TRU"
  );

  const nowIso = new Date().toISOString();
  const createdAt = item.created_at || item.createdAt || nowIso;
  const updatedAt = item.updated_at || item.updatedAt || nowIso;

  return {
    id: localId,
    external_id: externalId || localId,
    code,
    title: finalTitle,
    category,
    category_label: categoryLabel,
    category_group: categoryGroup,
    registration_type: item.registration_type || "THI_DUA",
    region,
    department,
    factory,
    line,
    customer,
    product_code: productCode,
    pricing_direction: pricingDirection,
    proposer_name: proposerName,
    proposer_emp_code: proposerEmpCode,
    proposer_position: proposerPosition,
    before_description: beforeDesc,
    after_solution: afterSol,
    time_before_seconds: isNaN(timeBeforeSeconds) ? 0 : timeBeforeSeconds,
    time_after_seconds: isNaN(timeAfterSeconds) ? 0 : timeAfterSeconds,
    saved_seconds: isNaN(savedSeconds) ? 0 : savedSeconds,
    efficiency_value_vnd: isNaN(efficiencyValueVnd) ? 0 : efficiencyValueVnd,
    cost_before: isNaN(costBefore) ? 0 : costBefore,
    cost_after: isNaN(costAfter) ? 0 : costAfter,
    pair_quantity: isNaN(pairQuantity) ? 0 : pairQuantity,
    total_savings_vnd: isNaN(totalSavingsVnd) ? 0 : totalSavingsVnd,
    total_savings_words: totalSavingsWords,
    before_image_url: beforeImageUrl,
    after_image_url: afterImageUrl,
    before_video_url: beforeVideoUrl,
    after_video_url: afterVideoUrl,
    attachments_json: attachmentsJson || "",
    status,
    sub_status: subStatus,
    trang_thai: trangThai,
    review_status: reviewStatus,
    approval_status: approvalStatus,
    site_code: siteCode,
    source_region: item.source_region || region,
    is_archived: isArchived,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}
