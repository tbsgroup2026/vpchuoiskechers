// Gọi /api/scm/* từ giao diện (cookie đăng nhập gửi kèm cùng origin).

import type { OwnerDept, ScmDept, StepNo } from "./config";
import type { OrderState, StepStatus } from "./engine";
import type { Access, ScreenKey } from "./permissions";
import type { PlanStatus } from "./planning";
import type { IncidentStage } from "./purchasing";

export class ScmApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function scmApi<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/scm/${path}`, {
    method: init?.method || "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new ScmApiError(json.message || json.error || `Lỗi máy chủ (${res.status})`, res.status);
  return json as T;
}

export interface ScmMe {
  empCode: string;
  name: string;
  depts: ScmDept[];
  isHead: boolean;
  bypass: boolean;
  access: Record<ScreenKey, Access>;
  canApprovePermissions: boolean;
  site: string;
  today: string;
}

export interface Overview {
  today: string;
  cards: { tracking: number; onTrack: number; withLate: number; withBlocked: number; shipIn45: number; complete: number };
  bottlenecks: { owner: OwnerDept; name: string; late: number; blocking: number; total: number }[];
  plants: string[];
}

/** Tóm tắt một nhà máy (hoặc toàn chuỗi) cho màn chọn nhà máy */
export interface SiteSummary {
  tracking: number;
  onTrack: number;
  withLate: number;
  withBlocked: number;
  complete: number;
  bottleneck: { owner: OwnerDept; name: string; count: number } | null;
}

export interface SitesResponse {
  today: string;
  all: SiteSummary;
  sites: (SiteSummary & { key: string; name: string })[];
}

export interface OrderItem {
  id: string;
  code: string;
  site: string;
  plant: string | null;
  line: string | null;
  style: string | null;
  qty: number;
  shipDate: string;
  daysToShip: number;
  state: OrderState;
  progress: number;
  stuck: { step: StepNo; owner: OwnerDept; ownerName: string; text: string } | null;
  flag?: string | null;
  steps: { no: StepNo; status: StepStatus; due: string; doneAt: string | null; reason: string }[];
}

export interface OrderPage {
  items: OrderItem[];
  total: number;
  page: number;
  pageSize: number;
  today: string;
}

export interface OrderDetail {
  order: OrderItem;
  detail: {
    supplierLeadTime: number;
    transportDays: number;
    origin: string;
    noSilent: boolean;
    infoDeadline: string;
    formula: string;
    steps: {
      no: StepNo;
      owner: OwnerDept;
      ownerName: string;
      status: StepStatus;
      due: string;
      doneAt: string | null;
      daysLeft: number;
      daysLate: number;
      reason: string;
      title: string;
      sla: string;
      waitingOnName: string | null;
      escalation: 0 | 1 | 2 | 3;
      canEdit: boolean;
    }[];
  };
}

// ─── Kiểu dữ liệu Bước 2: Kế hoạch & CCƯ ─────────────────────────────────────

export interface PlanRow {
  id: string;
  site: string;
  week_start: string;
  status: PlanStatus;
  statusLabel?: string;
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  issued_by: string | null;
  issued_at: string | null;
  tier2_sent_at: string | null;
}

export interface PlanCell {
  plant: string;
  line: string;
  tier2Sent: boolean;
}

export interface PlanOrderRow {
  id: string;
  code: string;
  plant: string | null;
  line: string | null;
  qty: number;
  shipDate: string;
  priority: number;
  noSilent: {
    required: boolean;
    doneAt: string | null;
    status: StepStatus;
    reason: string;
    canSend: boolean;
  };
  step3: StepStatus;
  step4: StepStatus;
  cells: (PlanCell | null)[];
}

export interface PlanChange {
  id: number;
  order_id: string | null;
  order_code?: string | null;
  action: string;
  reason: string | null;
  before_json: string | null;
  after_json: string | null;
  created_by: string;
  created_at: string;
}

export interface CanIssueResult {
  ok: boolean;
  reason?: string;
}

export interface WeekLoad {
  week: string;
  load: number;
  capacity: number;
  over: boolean;
  /** "Nhà máy · Chuyền" vượt năng lực trong tuần */
  overLines: string[];
  /** Chi tiết từng nhà máy · chuyền (Tầng 2) */
  lines: { plant: string; line: string; load: number; capacity: number; over: boolean }[];
}

export interface PlanViewResponse {
  success: boolean;
  needSite?: boolean;
  plan?: PlanRow | null;
  suggestWeek?: string;
  weeks?: string[];
  rows?: PlanOrderRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  loads?: WeekLoad[];
  errors?: string[];
  canIssue?: CanIssueResult;
  changes?: PlanChange[];
  canEdit?: boolean;
  canApprove?: boolean;
}

// ─── Kiểu dữ liệu Bước 2: Mua hàng ──────────────────────────────────────────

export interface ConditionItem {
  id: string;
  code: string;
  plant: string | null;
  shipDate: string;
  qty: number;
  supplierLeadTime: number;
  transportDays: number;
  infoDeadline: string;
  poNo: string | null;
  activatedAt: string | null;
  issuedAt: string | null;
  step2Done: boolean;
  bottleneck: string | null;
  status: "ready" | "missing" | "activated" | "issued";
  ready: boolean;
  items: { key: string; label: string; ok: boolean; at: string | null }[];
  missing: { label: string; dept: string }[];
  noSilent: { required: boolean; ok: boolean; at: string | null; day: number | null; of: number; overdue: boolean };
}

export interface ConditionsResponse {
  success: boolean;
  items: ConditionItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: { ready: number; missing: number; issued: number };
}

export interface InboundRow {
  id: string;
  orderId: string;
  code: string;
  poNo: string | null;
  eta: string | null;
  etaChangedFrom: string | null;
  sentAt: string | null;
  arrived: boolean;
  supplyDeadline: string;
  impact: { readyBy: string; slackDays: number; late: boolean } | null;
  week: string | null;
}

export interface InboundResponse {
  success: boolean;
  weeks: string[];
  rows: InboundRow[];
  unsent: number;
}

export interface IncidentItem {
  id: string;
  order_id: string;
  po_id: string | null;
  material: string;
  issue: string;
  stage: IncidentStage;
  plan: string | null;
  note: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  opened_at: string;
  closed_at: string | null;
  escalation: number;
  orderCode: string;
  day: number;
  of: number;
  canEscalate: boolean;
  overdue: boolean;
}

export interface IncidentsResponse {
  success: boolean;
  items: IncidentItem[];
  plans: Record<string, string>;
}

export interface UploadedFormItem {
  id: string;
  dept: string;
  file_name: string;
  size: number;
  content_type: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

export interface FormsResponse {
  success: boolean;
  items: UploadedFormItem[];
}
