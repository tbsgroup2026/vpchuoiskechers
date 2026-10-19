// Kiểu dữ liệu của bản DEMO "Kế hoạch chuẩn bị & Trung tâm phân phối".
// Toàn bộ dữ liệu là giả lập, lưu trong trình duyệt (localStorage).

export type StepNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Bộ phận giữ việc của từng bước */
export type DeptKey = "KD" | "CN" | "KH" | "MH" | "KHO" | "QC" | "SX" | "SH";

/** Vai người xem trên thanh chọn vai trò */
export type RoleKey = "KH" | "MH" | "KHO" | "KDCNQC" | "SH" | "BDH" | "SX";

export type ScreenKey = "progress" | "kh" | "mh" | "kho" | "kdcnqc" | "sh" | "kpi" | "sx" | "raci";

export type Access = "edit" | "view" | "lock";

export type StepStatus = "done" | "doing" | "late" | "blocked" | "pending" | "na";

export interface Supplier {
  id: string;
  name: string;
  /** Lead time bình quân (ngày) */
  leadTime: number;
  /** Thời gian vận chuyển (ngày) */
  transport: number;
  origin: "NOI_DIA" | "NHAP_KHAU";
}

export interface StepRecord {
  doneAt?: string | null;
  na?: boolean;
}

export interface OrderDocs {
  bom: boolean;
  wink: boolean;
  giayMau: boolean;
  squatbook: boolean;
  rap: boolean;
  dinhMuc: boolean;
}

export interface Order {
  id: string;
  code: string;
  style: string;
  qty: number;
  exportDate: string;
  supplierId: string;
  noSilent: boolean;
  docs: OrderDocs;
  factory: string;
  line: string;
  /** Tuần may đã phân bổ (ngày thứ Hai của tuần, YYYY-MM-DD) */
  planWeek: string;
  priority: number;
  /** Lý do thay đổi kế hoạch gần nhất (nếu có) */
  changeNote?: string;
  poNo?: string | null;
  /** Ngày về dự kiến theo PO */
  eta?: string | null;
  /** Ngày hàng thực tế về (sự kiện bên ngoài, tự kích hoạt khi tới ngày) */
  actualArrival?: string | null;
  /** Số ngày NCC đã báo trễ so với ETA ban đầu */
  supplierDelay?: number;
  steps: Record<StepNo, StepRecord>;
  /** Ngày QC nhận mẫu (bắt đầu đếm 72 giờ / 2 ngày) */
  qcReceivedAt?: string | null;
  labPassedAt?: string | null;
  colorSignedAt?: string | null;
  /** % vật tư đồng bộ đã có trong kho */
  syncPct: number;
  /** Sản xuất đã xác nhận nhận vật tư */
  prodConfirmedAt?: string | null;
  hero?: boolean;
}

export type IncidentKind = "CHAT_LUONG" | "SO_LUONG";
export type IncidentStatus = "OPEN" | "PLAN_AGREED" | "AWAITING_CONFIRM" | "CLOSED";
export type IncidentPlan = "DOI_HANG" | "BU_THIEU" | "GIAM_GIA" | "TRA_HANG";

export interface Incident {
  id: string;
  orderId: string;
  supplierId: string;
  kind: IncidentKind;
  note: string;
  createdAt: string;
  status: IncidentStatus;
  plan?: IncidentPlan;
  /** Ngày hàng thay thế/bù dự kiến về */
  replacementEta?: string | null;
  closedAt?: string | null;
}

export interface DailyReport {
  date: string;
  /** Đã chốt dữ liệu 09:00 */
  locked: boolean;
  /** Số dòng dữ liệu lỗi còn lại */
  invalidRows: number;
  publishedAt?: string | null;
  onTime?: boolean;
  note?: string;
}

export interface BarcodeZone {
  zone: string;
  total: number;
  scanned: number;
}

export interface FormStatus {
  key: string;
  name: string;
  status: "NHAP" | "GOP_Y" | "THONG_NHAT" | "DA_KY";
}

export interface Thresholds {
  noSilentDays: number;
  orderDays: number;
  inspectDomestic: number;
  inspectImport: number;
  labHours: number;
  colorDays: number;
  incidentDays: number;
  supplyLeadDays: number;
  sewToExportDays: number;
  productionDays: number;
  bomDays: number;
  planDays: number;
  escalateL1Days: number;
  escalateL3Days: number;
  stockVariancePct: number;
}

export interface LogEntry {
  at: string;
  role: RoleKey;
  text: string;
}

export interface DemoState {
  version: number;
  today: string;
  role: RoleKey;
  screen: ScreenKey;
  suppliers: Supplier[];
  orders: Order[];
  incidents: Incident[];
  reports: DailyReport[];
  barcode: BarcodeZone[];
  forms: FormStatus[];
  thresholds: Thresholds;
  /** Các tuần đang có trong kế hoạch cuốn chiếu */
  planWeeks: string[];
  /** Tuần mà kế hoạch phân bổ đã được trưởng bộ phận duyệt */
  planApprovedWeek: string | null;
  /** Tuần gần nhất Mua hàng đã gửi kế hoạch nhập hàng 4 tuần */
  inboundPlanSentWeek: string | null;
  log: LogEntry[];
  seq: number;
}
