// Cấu hình module "Kế hoạch chuẩn bị và trung tâm phân phối" (SCM).
// File thuần TypeScript, dùng chung cho worker (/api/scm/*), giao diện và vitest.

export type StepNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export const STEP_NOS: StepNo[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Bộ phận giữ việc của từng bước */
export type OwnerDept = "KD" | "CN" | "KH" | "MH" | "KHO" | "QC";
/** Phòng ban dùng để phân quyền màn hình (mục 6) */
export type ScmDept = "KH" | "MH" | "KHO" | "KDCNQC" | "SH" | "BDH";

export interface StepMeta {
  no: StepNo;
  title: string;
  short: string;
  owner: OwnerDept;
  deps: StepNo[];
  sla: string;
}

export const STEPS: Record<StepNo, StepMeta> = {
  1: { no: 1, title: "Bàn giao đơn hàng, BOM, Wink, Giày mẫu, Squatbook", short: "Bàn giao TT", owner: "KD", deps: [], sla: "Theo deadline tính ngược" },
  2: { no: 2, title: "Cung cấp Rập, định mức vật tư, thông tin kỹ thuật", short: "Rập & định mức", owner: "CN", deps: [1], sla: "Trước khi hàng về" },
  3: { no: 3, title: "Kế hoạch phân bổ cuốn chiếu 4 tuần", short: "Phân bổ 4 tuần", owner: "KH", deps: [1], sla: "Cập nhật hằng tuần" },
  4: { no: 4, title: "Ban hành Kế hoạch 312", short: "KH 312", owner: "KH", deps: [3], sla: "Hằng tuần (thứ Hai)" },
  5: { no: 5, title: "Bàn giao No Silent cho Mua hàng", short: "No Silent", owner: "KH", deps: [3], sla: "Đúng thời hạn (cấu hình)" },
  6: { no: 6, title: "Kích hoạt và đặt hàng đơn đủ điều kiện", short: "Đặt hàng", owner: "MH", deps: [2, 5], sla: "≤ 3 ngày từ khi có No Silent" },
  7: { no: 7, title: "Kế hoạch dự kiến nhập hàng 4 tuần gửi Kho", short: "KH nhập 4 tuần", owner: "MH", deps: [4], sla: "Hằng tuần (thứ Ba)" },
  8: { no: 8, title: "Tiếp nhận và kiểm tra hàng", short: "Tiếp nhận", owner: "KHO", deps: [6], sla: "Nội địa ≤ 3 ngày, nhập khẩu ≤ 7 ngày" },
  9: { no: 9, title: "Lab test (hóa tính, lý tính) và ký màu", short: "Lab & ký màu", owner: "QC", deps: [8], sla: "Lab ≤ 72 giờ, ký màu ≤ 2 ngày" },
  10: { no: 10, title: "Cân đối và cấp vật tư đồng bộ xuống sản xuất", short: "Cấp đồng bộ", owner: "KHO", deps: [8, 9], sla: "Trước kế hoạch may ≥ 14 ngày" },
};

export const OWNER_DEPT_NAME: Record<OwnerDept, string> = {
  KD: "Kinh doanh",
  CN: "Công nghệ",
  KH: "Kế hoạch & CCƯ",
  MH: "Mua hàng",
  KHO: "Kho",
  QC: "QC",
};

export const SCM_DEPTS: ScmDept[] = ["KH", "MH", "KHO", "KDCNQC", "SH", "BDH"];
export const SCM_DEPT_NAME: Record<ScmDept, string> = {
  KH: "Kế hoạch",
  MH: "Mua hàng",
  KHO: "Kho",
  KDCNQC: "KD·CN·QC",
  SH: "Số hóa",
  BDH: "Ban điều hành",
};

/** Bộ phận giữ việc thuộc phòng phân quyền nào */
export const OWNER_TO_SCM: Record<OwnerDept, ScmDept> = { KD: "KDCNQC", CN: "KDCNQC", QC: "KDCNQC", KH: "KH", MH: "MH", KHO: "KHO" };

// Mốc đồng bộ vật tư (trung tâm phân phối): cấp đủ trước ngày lên chuyền may 2 tuần, trước gò 1 tuần
export const SYNC_SEW_DAYS = 14;
export const SYNC_LAST_DAYS = 7;
/** Hai luồng đồng bộ vật tư của trung tâm phân phối (đổi tên hiển thị tại đây) */
export const SYNC_STREAMS = [
  { key: "CD", name: "CĐ", desc: "Cân đối vật tư" },
  { key: "CU", name: "CƯ", desc: "Cung ứng (Điều độ)" },
] as const;
export const SYNC_STAGES = [
  { key: "MAY", name: "May", leadDays: 14 },
  { key: "GO", name: "Gò", leadDays: 7 },
] as const;
/** Số tuần theo dõi liên tục */
export const SYNC_WEEKS = 8;

export const SITES = [
  { key: "VPC", name: "Văn phòng chuỗi" },
  { key: "PXM", name: "Phân xưởng mẫu" },
  { key: "NMMD", name: "Nhà máy Miền Đông" },
  { key: "KG1", name: "Nhà máy Kiên Giang 1" },
  { key: "KG2", name: "Nhà máy Kiên Giang 2" },
  { key: "KG3", name: "Nhà máy Kiên Giang 3" },
  { key: "HTD", name: "Hoàn thiện đế" },
] as const;
export type SiteKey = (typeof SITES)[number]["key"];

/** Đoán nhà máy trực thuộc từ tên phòng ban / VTCV (dùng khi admin chưa gán tay); không đoán được thì trả "" */
export function guessSiteFromText(text: string): SiteKey | "" {
  const t = String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase();
  if (/\bKG\s*-?\s*1\b|KIEN GIANG\s*1\b/.test(t)) return "KG1";
  if (/\bKG\s*-?\s*2\b|KIEN GIANG\s*2\b/.test(t)) return "KG2";
  if (/\bKG\s*-?\s*3\b|KIEN GIANG\s*3\b/.test(t)) return "KG3";
  if (/MIEN DONG|\bNMMD\b/.test(t)) return "NMMD";
  if (/HOAN THIEN DE|\bHTD\b/.test(t)) return "HTD";
  if (/PHAN XUONG MAU|\bPXM\b/.test(t)) return "PXM";
  if (/VAN PHONG CHUOI|\bVPC\b/.test(t)) return "VPC";
  return "";
}

// ─── Ngưỡng cấu hình (bảng scm_settings) ─────────────────────────────────────

export interface ScmSettings {
  no_silent_days: number;
  order_days: number;
  inspect_domestic_days: number;
  inspect_import_days: number;
  lab_hours: number;
  color_days: number;
  incident_days: number;
  supply_lead_days: number;
  sew_to_export_days: number;
  production_days: number;
  bom_days: number;
  plan_days: number;
  escalate_l1_days: number;
  escalate_l3_days: number;
  stock_variance_pct: number;
  balance_cutoff_time: string;
  balance_late_time: string;
  balance_publish_time: string;
  escalation_run_time: string;
  kpi_run_weekday: number;
  kpi_run_time: string;
  plan312_weekday: number;
  inbound_plan_weekday: number;
  digital_can_view_business: number;
  line_capacity_week: number;
  incident_escalate_day: number;
}

export const DEFAULT_SETTINGS: ScmSettings = {
  no_silent_days: 5,
  order_days: 3,
  inspect_domestic_days: 3,
  inspect_import_days: 7,
  lab_hours: 72,
  color_days: 2,
  incident_days: 14,
  supply_lead_days: 14,
  sew_to_export_days: 7,
  production_days: 30,
  bom_days: 3,
  plan_days: 1,
  escalate_l1_days: 1,
  escalate_l3_days: 3,
  stock_variance_pct: 2,
  balance_cutoff_time: "09:00",
  balance_late_time: "10:00",
  balance_publish_time: "11:00",
  escalation_run_time: "08:00",
  kpi_run_weekday: 5,
  kpi_run_time: "17:00",
  plan312_weekday: 1,
  inbound_plan_weekday: 2,
  digital_can_view_business: 0,
  line_capacity_week: 9000,
  incident_escalate_day: 10,
};

export const SETTING_LABELS: Record<keyof ScmSettings, string> = {
  no_silent_days: "Hạn bàn giao No Silent sau khi có kế hoạch (ngày, đề xuất)",
  order_days: "Đặt hàng sau khi có No Silent (ngày)",
  inspect_domestic_days: "Kiểm tra hàng nội địa (ngày)",
  inspect_import_days: "Kiểm tra hàng nhập khẩu (ngày)",
  lab_hours: "Lab test (giờ)",
  color_days: "Ký màu (ngày)",
  incident_days: "Xử lý sự cố NCC (ngày)",
  supply_lead_days: "Cấp vật tư trước ngày may (ngày)",
  sew_to_export_days: "Ngày may trước ngày xuất (ngày, đề xuất)",
  production_days: "Thời gian sản xuất trong công thức hạn chót (ngày)",
  bom_days: "Xử lý định mức/BOM trong công thức hạn chót (ngày)",
  plan_days: "Đưa đơn mới vào kế hoạch (ngày, đề xuất)",
  escalate_l1_days: "Nhắc cấp 1 khi còn ≤ (ngày)",
  escalate_l3_days: "Leo thang cấp 3 khi quá hạn ≥ (ngày)",
  stock_variance_pct: "Ngưỡng sai lệch tồn kho (%, đề xuất)",
  balance_cutoff_time: "Giờ chốt dữ liệu cân đối",
  balance_late_time: "Giờ cho phép phát hành kèm ghi chú",
  balance_publish_time: "Hạn phát hành báo cáo cân đối",
  escalation_run_time: "Giờ chạy leo thang tự động",
  kpi_run_weekday: "Thứ chạy KPI tuần (1 = thứ Hai)",
  kpi_run_time: "Giờ chạy KPI tuần",
  plan312_weekday: "Thứ ban hành Kế hoạch 312 (1 = thứ Hai)",
  inbound_plan_weekday: "Thứ gửi kế hoạch nhập 4 tuần (2 = thứ Ba)",
  digital_can_view_business: "Số hóa được xem nghiệp vụ bộ phận khác (0/1, chờ Ban điều hành)",
  line_capacity_week: "Năng lực mặc định mỗi chuyền mỗi tuần (đôi, đề xuất)",
  incident_escalate_day: "Hiện nút leo thang sự cố NCC từ ngày thứ",
};

/** Đọc các dòng key/value từ D1, giữ mặc định cho khóa thiếu hoặc sai kiểu */
export function parseSettings(rows: { key: string; value: string }[]): ScmSettings {
  const out: ScmSettings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (!(r.key in out)) continue;
    const k = r.key as keyof ScmSettings;
    const def = DEFAULT_SETTINGS[k];
    if (typeof def === "number") {
      const n = Number(r.value);
      if (Number.isFinite(n)) (out as unknown as Record<string, number>)[k] = n;
    } else if (/^\d{2}:\d{2}$/.test(String(r.value))) {
      (out as unknown as Record<string, string>)[k] = String(r.value);
    }
  }
  return out;
}

// ─── Lộ trình 4 pha (Gantt) ──────────────────────────────────────────────────

/** T1 = tuần ISO 42/2026, thứ Hai 12/10/2026 */
export const PROJECT_START = "2026-10-12";
export const PROJECT_WEEKS = 18;

export const PHASES = [
  { key: "P1", name: "Pha 1. Biểu mẫu & lead time", startWeek: 1, endWeek: 4, milestone: "M1", gate: "3 biểu mẫu chuẩn và bảng SLA đã ký" },
  { key: "P2", name: "Pha 2. Barcode & SAP ZMB52", startWeek: 4, endWeek: 9, milestone: "M2", gate: "100% ô kệ quét mã; sai lệch tồn trong ngưỡng" },
  { key: "P3", name: "Pha 3. Dashboard & báo cáo tự động", startWeek: 8, endWeek: 13, milestone: "M3", gate: "Số liệu khớp kiểm kê; báo cáo đúng giờ 10 ngày" },
  { key: "P4", name: "Pha 4. Thử nghiệm & KPI tự động", startWeek: 13, endWeek: 18, milestone: "M4", gate: "Chạy song song đạt 2 tuần; KPI thử được chấp nhận" },
] as const;
