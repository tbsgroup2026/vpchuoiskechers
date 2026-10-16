// Mua hàng: điều kiện đặt hàng, số PO, ETA và ảnh hưởng tới ngày cấp, sự cố NCC. Hàm thuần, có vitest.

import type { ScmSettings } from "./config";
import { addDays, diffDays } from "./engine";

export const ORDER_CONDITIONS = [
  { key: "bom", label: "BOM", dept: "Kinh doanh" },
  { key: "wink", label: "Wink", dept: "Kinh doanh" },
  { key: "giay_mau", label: "Giày mẫu", dept: "Kinh doanh" },
] as const;

export const HANDOVER_ITEMS = [
  { key: "bom", label: "BOM", dept: "KD" },
  { key: "wink", label: "Wink", dept: "KD" },
  { key: "giay_mau", label: "Giày mẫu", dept: "KD" },
  { key: "squatbook", label: "Squatbook", dept: "KD" },
  { key: "rap", label: "Rập", dept: "CN" },
  { key: "dinh_muc", label: "Định mức", dept: "CN" },
] as const;

export type PurchaseStatus = "issued" | "activated" | "ready" | "missing";

export interface ConditionInput {
  /** item → ngày giao (null nếu chưa giao) */
  handover: Partial<Record<string, string | null>>;
  noSilent: boolean;
  /** Ngày bàn giao No Silent (bước 5 xong) */
  noSilentAt: string | null;
  activatedAt?: string | null;
  issuedAt?: string | null;
}

export interface ConditionResult {
  items: { key: string; label: string; ok: boolean; at: string | null }[];
  noSilent: { required: boolean; ok: boolean; at: string | null; day: number | null; of: number; overdue: boolean };
  missing: { label: string; dept: string }[];
  status: PurchaseStatus;
}

/** Điều kiện kích hoạt đặt hàng: đủ BOM, Wink, Giày mẫu (Kinh doanh) và No Silent (Kế hoạch) */
export function orderConditions(c: ConditionInput, today: string, s: ScmSettings): ConditionResult {
  const items = ORDER_CONDITIONS.map((x) => ({ key: x.key, label: x.label, ok: Boolean(c.handover[x.key]), at: c.handover[x.key] ?? null }));
  const nsAt = c.noSilentAt ? c.noSilentAt.slice(0, 10) : null;
  const day = nsAt ? diffDays(today, nsAt) + 1 : null;
  const noSilent = {
    required: c.noSilent,
    ok: !c.noSilent || Boolean(nsAt),
    at: nsAt,
    day,
    of: s.order_days,
    overdue: Boolean(nsAt && !c.issuedAt && day !== null && day > s.order_days),
  };
  const missing = [
    ...ORDER_CONDITIONS.filter((x) => !c.handover[x.key]).map((x) => ({ label: x.label, dept: x.dept })),
    ...(noSilent.ok ? [] : [{ label: "No Silent", dept: "Kế hoạch" }]),
  ];
  const status: PurchaseStatus = c.issuedAt ? "issued" : missing.length ? "missing" : c.activatedAt ? "activated" : "ready";
  return { items, noSilent, missing, status };
}

/** Số PO tự sinh: PO-YYMM-0001 */
export function poNumber(seq: number, today: string): string {
  return `PO-${today.slice(2, 4)}${today.slice(5, 7)}-${String(seq).padStart(4, "0")}`;
}

/** Ngày hàng dự kiến về: ETA do NCC báo, nếu chưa có thì ngày phát hành PO + lead time + vận chuyển */
export function expectedArrival(issuedAt: string | null, leadTime: number, transport: number, eta: string | null): string | null {
  if (eta) return eta;
  return issuedAt ? addDays(issuedAt.slice(0, 10), leadTime + transport) : null;
}

/** Ảnh hưởng của ngày về tới ngày cấp vật tư: còn dư bao nhiêu ngày sau khi kiểm hàng xong */
export function etaImpact(arrival: string, inspectDays: number, supplyDeadline: string): { readyBy: string; slackDays: number; late: boolean } {
  const readyBy = addDays(arrival, inspectDays);
  const slackDays = diffDays(supplyDeadline, readyBy);
  return { readyBy, slackDays, late: slackDays < 0 };
}

// ─── Sự cố vật tư không đạt ──────────────────────────────────────────────────

export const INCIDENT_PLANS = { DOI_HANG: "Đổi hàng", BU_THIEU: "Bù thiếu", GIAM_GIA: "Giảm giá", TRA_HANG: "Trả hàng" } as const;
export type IncidentPlan = keyof typeof INCIDENT_PLANS;

export const INCIDENT_STAGES = [
  { key: "CONTACT", label: "Liên hệ NCC" },
  { key: "PLAN", label: "Ghi phương án" },
  { key: "AWAIT_CONFIRM", label: "Chờ Kho/QC xác nhận" },
  { key: "CLOSED", label: "Đã đóng" },
] as const;
export type IncidentStage = (typeof INCIDENT_STAGES)[number]["key"];

/** Ngày thứ mấy kể từ khi mở sự cố (ngày mở = ngày 1) */
export function incidentDay(openedAt: string, today: string): number {
  return diffDays(today, openedAt.slice(0, 10)) + 1;
}

export function canEscalateIncident(day: number, s: ScmSettings): boolean {
  return day >= s.incident_escalate_day;
}

/** Bước tiếp theo của sự cố; chỉ đóng được khi Kho hoặc QC đã xác nhận */
export function nextIncidentStage(stage: IncidentStage, ctx: { plan: string | null; confirmed: boolean }): { next: IncidentStage | null; error?: string } {
  switch (stage) {
    case "CONTACT":
      return { next: "PLAN" };
    case "PLAN":
      if (!ctx.plan || !(ctx.plan in INCIDENT_PLANS)) return { next: null, error: "Chọn phương án xử lý trước (Đổi hàng / Bù thiếu / Giảm giá / Trả hàng)" };
      return { next: "AWAIT_CONFIRM" };
    case "AWAIT_CONFIRM":
      if (!ctx.confirmed) return { next: null, error: "Chưa thể đóng: Kho hoặc QC chưa xác nhận hàng đã xử lý" };
      return { next: "CLOSED" };
    default:
      return { next: null, error: "Sự cố đã đóng" };
  }
}

// ─── Form Mua hàng ───────────────────────────────────────────────────────────

export const FORM_MAX_BYTES = 10 * 1024 * 1024;
export const FORM_EXTENSIONS = ["xlsx", "xls", "csv", "pdf", "docx"];

/**
 * Đọc nội dung form Mua hàng.
 * TODO: chưa có mẫu form; khi nhận mẫu sẽ ánh xạ cột và trả về các dòng đặt hàng.
 */
export function parseProcurementForm(_fileName: string, _bytes?: ArrayBuffer): { status: "not_implemented"; message: string } {
  return { status: "not_implemented", message: "Chưa đọc nội dung form: đang chờ mẫu form Mua hàng" };
}
