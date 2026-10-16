// Cấu hình nghiệp vụ của DEMO, bám theo "Kế hoạch triển khai số hóa vật tư" (bản điều chỉnh 14/10/2026).

import type { Access, DeptKey, RoleKey, ScreenKey, StepNo, Thresholds } from "./types";

export const DEMO_BASE_DATE = "2026-10-15";
/** T1 của dự án = tuần 42/2026, bắt đầu thứ Hai 12/10/2026 */
export const PROJECT_START = "2026-10-12";
export const STORAGE_KEY = "ttpp_demo_v1";
export const STATE_VERSION = 1;

export const STEP_NOS: StepNo[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export interface StepMeta {
  no: StepNo;
  title: string;
  short: string;
  dept: DeptKey;
  deps: StepNo[];
  sla: string;
}

// Bước 6 phụ thuộc bước 2 và 5 theo bảng mục 2; thêm bước 4 vì flowchart 7.2 bắt đầu từ "Nhận Kế hoạch 312".
export const STEPS: Record<StepNo, StepMeta> = {
  1: { no: 1, title: "Bàn giao đơn hàng, BOM, Wink, Giày mẫu, Squatbook", short: "Bàn giao TT", dept: "KD", deps: [], sla: "Theo deadline tính ngược từ ngày xuất hàng" },
  2: { no: 2, title: "Cung cấp Rập, định mức vật tư, thông tin kỹ thuật", short: "Rập & ĐM", dept: "CN", deps: [1], sla: "Trước khi hàng về" },
  3: { no: 3, title: "Kế hoạch phân bổ cuốn chiếu 4 tuần", short: "Phân bổ", dept: "KH", deps: [1], sla: "Đơn mới vào kế hoạch trong 1 ngày (đề xuất)" },
  4: { no: 4, title: "Ban hành Kế hoạch 312", short: "KH 312", dept: "KH", deps: [3], sla: "Hằng tuần, thứ Hai" },
  5: { no: 5, title: "Bàn giao thông tin No Silent cho Mua hàng", short: "No Silent", dept: "KH", deps: [3], sla: "Đúng thời hạn quy định" },
  6: { no: 6, title: "Kích hoạt và đặt hàng đơn đủ điều kiện", short: "Đặt hàng", dept: "MH", deps: [2, 4, 5], sla: "Trong 3 ngày kể từ khi có No Silent" },
  7: { no: 7, title: "Kế hoạch dự kiến nhập hàng 4 tuần gửi Kho", short: "KH nhập", dept: "MH", deps: [4], sla: "Hằng tuần, thứ Ba" },
  8: { no: 8, title: "Tiếp nhận và kiểm tra hàng", short: "Tiếp nhận", dept: "KHO", deps: [6], sla: "Nội địa ≤ 3 ngày; nhập khẩu ≤ 7 ngày" },
  9: { no: 9, title: "Lab test (hóa tính, lý tính) và ký màu", short: "Lab & màu", dept: "QC", deps: [8], sla: "Lab test ≤ 72 giờ; ký màu ≤ 2 ngày" },
  10: { no: 10, title: "Cân đối và cấp vật tư đồng bộ xuống sản xuất", short: "Cấp đồng bộ", dept: "KHO", deps: [8, 9], sla: "Trước kế hoạch may tối thiểu 2 tuần" },
};

export interface DeptMeta {
  key: DeptKey;
  name: string;
  /** Lớp màu chấm/nhãn theo quy ước màu của tài liệu (mục 7) */
  dot: string;
  chip: string;
}

export const DEPTS: Record<DeptKey, DeptMeta> = {
  KD: { key: "KD", name: "Kinh doanh", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-800 border-violet-200" },
  CN: { key: "CN", name: "Công nghệ", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-800 border-violet-200" },
  QC: { key: "QC", name: "QC", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-800 border-violet-200" },
  KH: { key: "KH", name: "Kế hoạch & CCƯ", dot: "bg-sky-500", chip: "bg-sky-50 text-sky-800 border-sky-200" },
  MH: { key: "MH", name: "Mua hàng", dot: "bg-orange-500", chip: "bg-orange-50 text-orange-800 border-orange-200" },
  KHO: { key: "KHO", name: "Kho / TTPP", dot: "bg-teal-500", chip: "bg-teal-50 text-teal-800 border-teal-200" },
  SH: { key: "SH", name: "Số hóa", dot: "bg-pink-500", chip: "bg-pink-50 text-pink-800 border-pink-200" },
  SX: { key: "SX", name: "Sản xuất", dot: "bg-slate-500", chip: "bg-slate-50 text-slate-700 border-slate-200" },
};

export interface RoleMeta {
  key: RoleKey;
  name: string;
  short: string;
  depts: DeptKey[];
  note?: string;
}

export const ROLES: RoleMeta[] = [
  { key: "BDH", name: "Ban điều hành", short: "BĐH", depts: [] },
  { key: "KH", name: "Kế hoạch & Chuỗi cung ứng", short: "Kế hoạch", depts: ["KH"] },
  { key: "MH", name: "Mua hàng", short: "Mua hàng", depts: ["MH"] },
  { key: "KHO", name: "Trung tâm phân phối / Kho", short: "Kho", depts: ["KHO"] },
  { key: "KDCNQC", name: "Kinh doanh · Công nghệ · QC", short: "KD·CN·QC", depts: ["KD", "CN", "QC"] },
  { key: "SH", name: "Số hóa & Dữ liệu", short: "Số hóa", depts: ["SH"] },
  { key: "SX", name: "Sản xuất", short: "Sản xuất", depts: ["SX"], note: "Cần xác nhận phạm vi (mục 14)" },
];

export interface ScreenMeta {
  key: ScreenKey;
  name: string;
  short: string;
}

export const SCREENS: ScreenMeta[] = [
  { key: "progress", name: "Tiến độ chung", short: "Tiến độ" },
  { key: "kh", name: "Kế hoạch & CCƯ", short: "Kế hoạch" },
  { key: "mh", name: "Mua hàng", short: "Mua hàng" },
  { key: "kho", name: "Kho / Trung tâm phân phối", short: "Kho" },
  { key: "kdcnqc", name: "Kinh doanh · Công nghệ · QC", short: "KD·CN·QC" },
  { key: "sx", name: "Sản xuất", short: "Sản xuất" },
  { key: "sh", name: "Số hóa & cấu hình", short: "Số hóa" },
  { key: "kpi", name: "KPI tự động", short: "KPI" },
  { key: "raci", name: "RACI & Rủi ro", short: "RACI" },
];

/** Ma trận phân quyền màn hình (mục 11). Ban điều hành chỉ xem, không sửa. */
export const ACCESS: Record<ScreenKey, Record<RoleKey, Access>> = {
  progress: { BDH: "view", KH: "view", MH: "view", KHO: "view", KDCNQC: "view", SH: "view", SX: "view" },
  kh: { BDH: "view", KH: "edit", MH: "lock", KHO: "lock", KDCNQC: "lock", SH: "lock", SX: "lock" },
  mh: { BDH: "view", KH: "lock", MH: "edit", KHO: "lock", KDCNQC: "lock", SH: "lock", SX: "lock" },
  kho: { BDH: "view", KH: "lock", MH: "lock", KHO: "edit", KDCNQC: "lock", SH: "lock", SX: "lock" },
  kdcnqc: { BDH: "view", KH: "lock", MH: "lock", KHO: "lock", KDCNQC: "edit", SH: "lock", SX: "lock" },
  sx: { BDH: "view", KH: "lock", MH: "lock", KHO: "lock", KDCNQC: "lock", SH: "lock", SX: "edit" },
  sh: { BDH: "view", KH: "lock", MH: "lock", KHO: "lock", KDCNQC: "lock", SH: "edit", SX: "lock" },
  kpi: { BDH: "view", KH: "view", MH: "view", KHO: "view", KDCNQC: "view", SH: "view", SX: "view" },
  raci: { BDH: "view", KH: "view", MH: "view", KHO: "view", KDCNQC: "view", SH: "view", SX: "view" },
};

/** Màn hình làm việc mặc định khi chọn vai */
export const ROLE_HOME: Record<RoleKey, ScreenKey> = {
  BDH: "progress",
  KH: "kh",
  MH: "mh",
  KHO: "kho",
  KDCNQC: "kdcnqc",
  SH: "sh",
  SX: "sx",
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  noSilentDays: 5,
  orderDays: 3,
  inspectDomestic: 3,
  inspectImport: 7,
  labHours: 72,
  colorDays: 2,
  incidentDays: 14,
  supplyLeadDays: 14,
  sewToExportDays: 7,
  productionDays: 30,
  bomDays: 3,
  planDays: 1,
  escalateL1Days: 1,
  escalateL3Days: 3,
  stockVariancePct: 2,
};

export interface ThresholdMeta {
  key: keyof Thresholds;
  label: string;
  unit: string;
  /** TAI_LIEU: số có trong quy định gốc. DE_XUAT: kế hoạch gợi ý, chờ Ban điều hành chốt. */
  source: "TAI_LIEU" | "DE_XUAT";
  min: number;
  max: number;
  note?: string;
}

export const THRESHOLD_META: ThresholdMeta[] = [
  { key: "noSilentDays", label: "Hạn bàn giao No Silent sau khi ban hành 312", unit: "ngày", source: "DE_XUAT", min: 1, max: 14, note: "Tài liệu gốc chưa có số ngày (mục 14)" },
  { key: "orderDays", label: "Đặt hàng kể từ khi có No Silent", unit: "ngày", source: "TAI_LIEU", min: 1, max: 10 },
  { key: "inspectDomestic", label: "Tiếp nhận & kiểm tra hàng nội địa", unit: "ngày", source: "TAI_LIEU", min: 1, max: 10 },
  { key: "inspectImport", label: "Tiếp nhận & kiểm tra hàng nhập khẩu", unit: "ngày", source: "TAI_LIEU", min: 1, max: 15 },
  { key: "labHours", label: "Lab test hóa tính, lý tính", unit: "giờ", source: "TAI_LIEU", min: 24, max: 168 },
  { key: "colorDays", label: "Ký màu vật tư", unit: "ngày", source: "TAI_LIEU", min: 1, max: 7 },
  { key: "incidentDays", label: "Xử lý vật tư không đạt với NCC", unit: "ngày", source: "TAI_LIEU", min: 3, max: 30 },
  { key: "supplyLeadDays", label: "Cấp vật tư trước kế hoạch may", unit: "ngày", source: "TAI_LIEU", min: 3, max: 30 },
  { key: "sewToExportDays", label: "Ngày may trước ngày xuất hàng", unit: "ngày", source: "DE_XUAT", min: 3, max: 30, note: "Giả định của bản demo để tính ngày may (ngày cấp = ngày may − 14)" },
  { key: "productionDays", label: "Thời gian sản xuất trong công thức hạn chót", unit: "ngày", source: "TAI_LIEU", min: 10, max: 60 },
  { key: "bomDays", label: "Xử lý định mức/BOM trên hệ thống", unit: "ngày", source: "TAI_LIEU", min: 1, max: 10 },
  { key: "planDays", label: "Đơn mới vào kế hoạch phân bổ", unit: "ngày", source: "DE_XUAT", min: 1, max: 5 },
  { key: "escalateL1Days", label: "Cấp 1: nhắc người giữ việc khi còn", unit: "ngày", source: "DE_XUAT", min: 0, max: 5 },
  { key: "escalateL3Days", label: "Cấp 3: báo Ban điều hành khi quá hạn từ", unit: "ngày", source: "DE_XUAT", min: 1, max: 10 },
  { key: "stockVariancePct", label: "Ngưỡng sai lệch tồn kho chấp nhận (M2)", unit: "%", source: "DE_XUAT", min: 0, max: 10 },
];

export interface PhaseMeta {
  key: string;
  name: string;
  startWeek: number;
  endWeek: number;
  /** Tiến độ tại tuần 42 theo tài liệu */
  baseProgress: number;
  milestone: string;
  gate: string;
  color: string;
}

export const PHASES: PhaseMeta[] = [
  { key: "P1", name: "Pha 1. Biểu mẫu & lead time", startWeek: 1, endWeek: 4, baseProgress: 45, milestone: "M1", gate: "3 biểu mẫu chuẩn và bảng SLA đã ký", color: "bg-pink-500" },
  { key: "P2", name: "Pha 2. Barcode & SAP ZMB52", startWeek: 4, endWeek: 9, baseProgress: 10, milestone: "M2", gate: "100% ô kệ quét mã; sai lệch tồn trong ngưỡng", color: "bg-teal-500" },
  { key: "P3", name: "Pha 3. Dashboard & báo cáo tự động", startWeek: 8, endWeek: 13, baseProgress: 0, milestone: "M3", gate: "Số liệu khớp kiểm kê; báo cáo đúng giờ 10 ngày", color: "bg-sky-500" },
  { key: "P4", name: "Pha 4. Thử nghiệm & KPI tự động", startWeek: 13, endWeek: 18, baseProgress: 0, milestone: "M4", gate: "Chạy song song đạt 2 tuần; KPI thử được chấp nhận", color: "bg-[#006838]" },
];

export const RACI_COLUMNS = ["Kế hoạch", "Mua hàng", "Kho", "KD·CN·QC", "Số hóa"];

export const RACI_ROWS: { item: string; cells: string[] }[] = [
  { item: "Chuẩn hóa 3 biểu mẫu chung", cells: ["C", "C", "C", "C", "A/R"] },
  { item: "Quy định lead time và deadline tính ngược", cells: ["A", "R", "C", "R", "I"] },
  { item: "Kế hoạch cuốn chiếu 4 tuần và Kế hoạch 312", cells: ["A/R", "C", "C", "C", "I"] },
  { item: "Đặt hàng, dự kiến nhập hàng 4 tuần", cells: ["C", "A/R", "I", "C", "I"] },
  { item: "Tiếp nhận, kiểm tra, Lab test, ký màu", cells: ["I", "I", "A/R", "R", "I"] },
  { item: "Barcode 100% ô kệ", cells: ["I", "I", "A/R", "I", "R"] },
  { item: "Kết nối SAP ZMB52, bỏ Excel thủ công", cells: ["C", "C", "C", "I", "A/R"] },
  { item: "Dashboard và KPI tự động", cells: ["C", "C", "C", "C", "A/R"] },
  { item: "Chạy thử và hiệu chỉnh KPI", cells: ["R", "R", "R", "R", "A"] },
];

export const RISKS: { level: "Cao" | "Trung bình" | "Thấp"; risk: string; mitigation: string }[] = [
  { level: "Cao", risk: "Người dùng quay lại Excel và chạy song song vô thời hạn", mitigation: "Ấn định ngày ngừng nhận báo cáo Excel; lãnh đạo chỉ họp trên Dashboard; không chấp nhận số liệu ngoài hệ thống." },
  { level: "Cao", risk: "Dữ liệu SAP/Barcode sai hoặc thiếu làm mất niềm tin", mitigation: "Kiểm tra dữ liệu hằng ngày trong 2 tuần đầu; đối chiếu kiểm kê; mỗi bộ phận có một người chịu trách nhiệm chất lượng dữ liệu." },
  { level: "Cao", risk: "Bộ phận nguồn giao thông tin trễ (BOM, No Silent, định mức)", mitigation: "Cảnh báo tự động theo deadline tính ngược; hiển thị điểm nghẽn trên màn hình chung." },
  { level: "Trung bình", risk: "Quét Barcode chưa đủ 100% ô kệ", mitigation: "Triển khai theo từng khu; dán nhãn trước khi quét; kiểm tra ngẫu nhiên hằng tuần." },
  { level: "Trung bình", risk: "Biểu mẫu chưa thống nhất giữa các bộ phận", mitigation: "Chốt bản chuẩn có chữ ký ở Pha 1; khóa biểu mẫu cũ trên hệ thống." },
  { level: "Trung bình", risk: "Chốt dữ liệu 09:00 và phát hành 11:00 bị trễ do hệ thống", mitigation: "Báo cáo chạy theo lịch tự động; có bản chụp lúc 09:00 làm phương án dự phòng." },
  { level: "Trung bình", risk: "KPI tự động gây phản ứng khi số liệu chưa ổn định", mitigation: "Chạy thử 4 tuần không tính thưởng phạt; công bố công thức KPI trước khi áp dụng." },
  { level: "Thấp", risk: "Nhân sự thiếu kỹ năng dùng phần mềm", mitigation: "Tập huấn theo vai trò; tài liệu một trang; người hỗ trợ tại chỗ 2 tuần đầu." },
];

export const INCIDENT_PLAN_LABEL: Record<string, string> = {
  DOI_HANG: "Đổi hàng",
  BU_THIEU: "Bù thiếu",
  GIAM_GIA: "Giảm giá",
  TRA_HANG: "Trả hàng",
};
