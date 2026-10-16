// Phân quyền màn hình SCM (mục 6): ma trận Xem/Sửa/Khóa theo phòng ban, map người dùng vào phòng ban.
// Hàm thuần, dùng chung cho worker (kiểm tra ở server) và giao diện (ẩn/hiện thẻ).

import { OWNER_TO_SCM, SCM_DEPTS, type OwnerDept, type ScmDept } from "./config";

export type Access = "view" | "edit" | "lock";
export type ScreenKey = "progress" | "planning" | "purchasing" | "warehouse" | "kdcnqc" | "digital" | "kpi" | "permissions";

export const SCREENS: { key: ScreenKey; name: string; editor: string }[] = [
  { key: "progress", name: "Tiến độ chung", editor: "Mọi bộ phận: Xem" },
  { key: "kpi", name: "Dashboard KPI", editor: "Theo phạm vi vai trò" },
  { key: "planning", name: "Kế hoạch & Chuỗi cung ứng", editor: "Sửa: Kế hoạch" },
  { key: "purchasing", name: "Mua hàng", editor: "Sửa: Mua hàng" },
  { key: "warehouse", name: "Trung tâm phân phối / Kho", editor: "Sửa: Kho" },
  { key: "kdcnqc", name: "Kinh doanh · Công nghệ · QC", editor: "Sửa: KD·CN·QC" },
  { key: "digital", name: "Số hóa & Dữ liệu", editor: "Sửa: Số hóa" },
  { key: "permissions", name: "Phân quyền màn hình", editor: "Duyệt: Ban điều hành" },
];

export type Matrix = Record<ScreenKey, Record<ScmDept, Access>>;

const row = (edit: ScmDept | null, others: Access = "lock"): Record<ScmDept, Access> =>
  Object.fromEntries(SCM_DEPTS.map((d) => [d, d === "BDH" ? "view" : d === edit ? "edit" : others])) as Record<ScmDept, Access>;

/** Ma trận mặc định theo mục 6 (chờ Ban điều hành duyệt) */
export const DEFAULT_MATRIX: Matrix = {
  progress: row(null, "view"),
  kpi: row(null, "view"),
  planning: row("KH"),
  purchasing: row("MH"),
  warehouse: row("KHO"),
  kdcnqc: row("KDCNQC"),
  digital: row("SH"),
  permissions: row("SH"),
};

/** Dòng Tiến độ chung và cột Ban điều hành luôn ở quyền Xem, không đổi được */
export function isLockedCell(screen: ScreenKey, dept: ScmDept): boolean {
  return screen === "progress" || dept === "BDH";
}

/** Áp các thay đổi đã được Ban điều hành duyệt lên ma trận mặc định; ô khóa giữ nguyên */
export function applyOverrides(overrides: { screen: string; dept: string; access: string }[]): Matrix {
  const m = JSON.parse(JSON.stringify(DEFAULT_MATRIX)) as Matrix;
  for (const o of overrides) {
    const screen = o.screen as ScreenKey;
    const dept = o.dept as ScmDept;
    if (!(screen in m) || !SCM_DEPTS.includes(dept) || !["view", "edit", "lock"].includes(o.access)) continue;
    if (isLockedCell(screen, dept)) continue;
    m[screen][dept] = o.access as Access;
  }
  return m;
}

export interface ScmUser {
  depts: ScmDept[];
  isHead: boolean;
  /** Tài khoản dev/control và Admin hệ thống bỏ qua kiểm tra quyền như hiện tại */
  bypass: boolean;
}

const RANK: Record<Access, number> = { lock: 0, view: 1, edit: 2 };
const BUSINESS: ScreenKey[] = ["planning", "purchasing", "warehouse", "kdcnqc"];

export function resolveAccess(user: ScmUser, screen: ScreenKey, matrix: Matrix = DEFAULT_MATRIX, opts: { digitalCanViewBusiness?: boolean } = {}): Access {
  if (user.bypass) return "edit";
  if (user.depts.length === 0) return screen === "progress" || screen === "kpi" ? "view" : "lock";
  let best: Access = "lock";
  for (const d of user.depts) {
    let a = matrix[screen][d];
    if (d === "SH" && a === "lock" && opts.digitalCanViewBusiness && BUSINESS.includes(screen)) a = "view";
    if (RANK[a] > RANK[best]) best = a;
  }
  return best;
}

export function resolveAll(user: ScmUser, matrix: Matrix = DEFAULT_MATRIX, opts: { digitalCanViewBusiness?: boolean } = {}): Record<ScreenKey, Access> {
  return Object.fromEntries(SCREENS.map((s) => [s.key, resolveAccess(user, s.key, matrix, opts)])) as Record<ScreenKey, Access>;
}

/** Màn hình của bộ phận giữ việc: chỉ người có quyền Sửa màn hình đó mới xác nhận/hoàn tác bước */
export const OWNER_SCREEN: Record<OwnerDept, ScreenKey> = {
  KD: "kdcnqc",
  CN: "kdcnqc",
  QC: "kdcnqc",
  KH: "planning",
  MH: "purchasing",
  KHO: "warehouse",
};

export function canEditStep(user: ScmUser, owner: OwnerDept, matrix: Matrix = DEFAULT_MATRIX): boolean {
  return resolveAccess(user, OWNER_SCREEN[owner], matrix) === "edit";
}

export function canApprovePermissions(user: ScmUser): boolean {
  return user.bypass || user.depts.includes("BDH");
}

export function ownerToDept(owner: OwnerDept): ScmDept {
  return OWNER_TO_SCM[owner];
}

// ─── Map người dùng vào phòng ban (dữ liệu CB-CNV: cột Phòng Ban, VTCV) ──────

export const normText = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toUpperCase();

export interface DeptRule {
  pattern: string;
  dept: ScmDept;
}

/** Quy tắc mặc định, khớp nguyên từ theo thứ tự; quy tắc đầu tiên khớp được dùng */
export const DEFAULT_DEPT_RULES: DeptRule[] = [
  ...["BAN GIAM DOC", "BAN TONG GIAM DOC", "BAN DIEU HANH", "BOD"].map((p) => ({ pattern: p, dept: "BDH" as ScmDept })),
  ...["CHUYEN DOI SO", "SO HOA", "CONG NGHE THONG TIN", "IT", "CDS"].map((p) => ({ pattern: p, dept: "SH" as ScmDept })),
  ...["KE HOACH", "PPC", "CUNG UNG"].map((p) => ({ pattern: p, dept: "KH" as ScmDept })),
  ...["MUA HANG", "THU MUA", "PURCHASING"].map((p) => ({ pattern: p, dept: "MH" as ScmDept })),
  ...["KHO", "TRUNG TAM PHAN PHOI", "KHO VAN", "LOGISTICS", "TTPP"].map((p) => ({ pattern: p, dept: "KHO" as ScmDept })),
  ...["KINH DOANH", "MERCHANDISE", "CONG NGHE", "KY THUAT", "QC", "QA", "CHAT LUONG", "LAB"].map((p) => ({ pattern: p, dept: "KDCNQC" as ScmDept })),
];

const hasWords = (text: string, pattern: string) => ` ${text} `.includes(` ${normText(pattern)} `);

export function mapUserToDept(
  info: { department?: string | null; vtcv?: string | null; title?: string | null },
  rules: DeptRule[] = DEFAULT_DEPT_RULES,
): { dept: ScmDept | null; isHead: boolean } {
  const dept = normText(info.department);
  const role = normText(`${info.vtcv ?? ""} ${info.title ?? ""}`);
  const match = dept ? rules.find((r) => hasWords(dept, r.pattern)) : undefined;
  const isHead = hasWords(role, "TRUONG") || hasWords(role, "GIAM DOC") || hasWords(role, "MANAGER") || hasWords(role, "HEAD");
  return { dept: match?.dept ?? null, isHead };
}
