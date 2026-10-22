/**
 * Helper cho trang Kaizen công khai (/work/kaizen/register): chuẩn hoá SĐT,
 * nhận diện MSNV/SĐT và ánh xạ 13 trạng thái DB vào stepper 5 bước.
 */

/** Chuẩn hoá SĐT Việt Nam về dạng 0xxxxxxxxx; trả về null nếu không hợp lệ hoặc rỗng. */
export function normalizeVnPhone(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).replace(/[\s.\-()]/g, "");
  if (!s) return null;
  if (s.startsWith("+84")) s = "0" + s.slice(3);
  else if (s.startsWith("84") && s.length === 11) s = "0" + s.slice(2);
  return /^0\d{9}$/.test(s) ? s : null;
}

/** MSNV trong DB là 6 hoặc 9 chữ số (hoặc dạng CN-xxxxx), SĐT là 10 số bắt đầu bằng 0. */
export function detectLookupType(raw: string): "phone" | "msnv" {
  const s = raw.replace(/[\s.\-()]/g, "");
  return /^(\+84|0)\d{9}$/.test(s) ? "phone" : "msnv";
}

export const KAIZEN_STEPS = ["Đã gửi", "Chờ duyệt", "Đã duyệt", "Chờ đánh giá", "Đã đánh giá"] as const;

export type StepFlag = "normal" | "warn" | "fail";

export interface KaizenStatusInfo {
  label: string;
  /** Lớp Tailwind cho badge */
  badge: string;
  /** Chỉ số bước đang ở (0..4); các bước trước đó coi là đã xong */
  step: number;
  /** true nếu bước `step` cũng đã hoàn thành */
  stepDone: boolean;
  flag: StepFlag;
  note?: string;
}

const STATUS_MAP: Record<string, KaizenStatusInfo> = {
  CHO_DUYET: { label: "Chờ duyệt", badge: "bg-amber-100 text-amber-800 border-amber-200", step: 1, stepDone: false, flag: "normal" },
  CAN_CHINH_SUA: { label: "Cần chỉnh sửa", badge: "bg-orange-100 text-orange-800 border-orange-200", step: 1, stepDone: false, flag: "warn", note: "Sáng kiến được trả về để bổ sung, chỉnh sửa." },
  CHO_IE_XAC_NHAN: { label: "Chờ IE xác nhận", badge: "bg-amber-100 text-amber-800 border-amber-200", step: 1, stepDone: false, flag: "normal" },
  CHO_PHE_DUYET: { label: "Chờ phê duyệt", badge: "bg-amber-100 text-amber-800 border-amber-200", step: 1, stepDone: false, flag: "normal" },
  CHO_PHAN_CONG_LAI: { label: "Đã duyệt - chờ phân công", badge: "bg-blue-100 text-blue-800 border-blue-200", step: 2, stepDone: false, flag: "normal" },
  CHO_DANH_GIA: { label: "Đã duyệt - chờ đánh giá", badge: "bg-blue-100 text-blue-800 border-blue-200", step: 3, stepDone: false, flag: "normal" },
  DANG_DANH_GIA: { label: "Đang đánh giá", badge: "bg-violet-100 text-violet-800 border-violet-200", step: 3, stepDone: false, flag: "normal" },
  CHO_PHE_DUYET_TRIEN_KHAI: { label: "Chờ duyệt triển khai", badge: "bg-violet-100 text-violet-800 border-violet-200", step: 3, stepDone: false, flag: "normal" },
  DA_DANH_GIA: { label: "Đã đánh giá", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", step: 4, stepDone: true, flag: "normal" },
  DA_XEP_HANG: { label: "Đã xếp hạng", badge: "bg-emerald-600 text-white border-emerald-700", step: 4, stepDone: true, flag: "normal" },
  KHONG_DAT_DIEU_KIEN: { label: "Không đạt", badge: "bg-rose-100 text-rose-800 border-rose-200", step: 1, stepDone: false, flag: "fail", note: "Sáng kiến không đạt điều kiện xét duyệt." },
  LUU_TRU: { label: "Lưu trữ", badge: "bg-slate-100 text-slate-700 border-slate-200", step: 2, stepDone: true, flag: "normal", note: "Lưu trữ, không tham gia thi đua." },
};

/**
 * Giai đoạn do API tra cứu tính sẵn — bám đúng cách /work/kaizen xác định trạng thái
 * (approval_status / sub_status / status + điểm BGK), nên ưu tiên hơn trang_thai.
 */
const STAGE_MAP: Record<string, KaizenStatusInfo> = {
  PENDING: { label: "Chờ duyệt", badge: "bg-amber-100 text-amber-800 border-amber-200", step: 1, stepDone: false, flag: "normal" },
  NEEDS_EDIT: STATUS_MAP.CAN_CHINH_SUA,
  REJECTED: { label: "Từ chối", badge: "bg-rose-100 text-rose-800 border-rose-200", step: 1, stepDone: false, flag: "fail", note: "Sáng kiến không được duyệt." },
  ARCHIVED: STATUS_MAP.LUU_TRU,
  APPROVED: { label: "Đã duyệt - chờ đánh giá", badge: "bg-blue-100 text-blue-800 border-blue-200", step: 3, stepDone: false, flag: "normal" },
  EVALUATED: STATUS_MAP.DA_DANH_GIA,
};

export function getKaizenStatusInfo(trangThai?: string | null, reviewStatus?: string | null, stage?: string | null): KaizenStatusInfo {
  if (stage && STAGE_MAP[stage]) return STAGE_MAP[stage];
  const key = String(trangThai || reviewStatus || "CHO_DUYET").trim().toUpperCase();
  return STATUS_MAP[key] || STATUS_MAP.CHO_DUYET;
}

/** Nhận xét hiển thị trên thẻ / chi tiết, theo trạng thái. */
export function getKaizenReviewComment(item: { trang_thai?: string | null; nhan_xet_kiem_chung?: string | null; rejection_reason?: string | null }): string {
  const key = String(item.trang_thai || "").toUpperCase();
  if (key === "KHONG_DAT_DIEU_KIEN" || key === "CAN_CHINH_SUA") {
    return (item.rejection_reason || item.nhan_xet_kiem_chung || "").trim();
  }
  return (item.nhan_xet_kiem_chung || "").trim();
}
