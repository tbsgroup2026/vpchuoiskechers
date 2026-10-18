// API /api/scm/* và tác vụ cron của module SCM, chạy trong Cloudflare Worker (web/public/_worker.js import file này).
// Worker truyền vào các helper sẵn có (xác thực, audit_logs, thông báo) để không viết lại cách auth/log.

import { DEFAULT_SETTINGS, OWNER_DEPT_NAME, OWNER_TO_SCM, SITES, STEPS, STEP_NOS, guessSiteFromText, parseSettings, type OwnerDept, type ScmDept, type ScmSettings, type StepNo } from "./config";
import {
  canComplete,
  computeBottlenecks,
  computeOrderView,
  diffDays,
  escalationLevel,
  fmtDMY,
  infoDeadlineFormula,
  riskScore,
  undoCascade,
  vnToday,
  type DoneMap,
  type OrderInput,
  type OrderView,
} from "./engine";
import { DEFAULT_DEPT_RULES, applyOverrides, canApprovePermissions, canEditStep, mapUserToDept, resolveAccess, resolveAll, type DeptRule, type Matrix, type ScmUser } from "./permissions";
import { SCM_ALTERS, SCM_DDL } from "./schema";
import { escalateIncidents, handleScmStep2, type R2Like } from "./server-step2";
import { handleScmStep3, syncDailySummary } from "./server-step3";

// ─── Kiểu tối thiểu của D1 và helper do worker cung cấp ──────────────────────

export interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export interface D1 {
  prepare(sql: string): D1Stmt;
  batch(stmts: D1Stmt[]): Promise<unknown>;
}

export interface AuthUser {
  authenticated: boolean;
  empCode: string;
  roleCode?: string;
  name?: string;
  isExecutiveOrAdmin?: boolean;
}

export interface ScmDeps {
  verifyServerAuth: (req: Request) => Promise<AuthUser | null>;
  /** createAndPushNotification(empCode, data) của worker */
  notify: (empCode: string, data: { title: string; message: string; url: string; type?: string; category?: string; priority?: string; senderEmpCode?: string }) => Promise<unknown>;
  headers: Record<string, string>;
}

export interface OrderRow {
  id: string;
  code: string;
  site: string;
  plant: string | null;
  line: string | null;
  style: string | null;
  qty: number;
  ship_date: string;
  supplier_id: string | null;
  supplier_lead_time: number;
  transport_days: number;
  origin: string;
  eta: string | null;
  no_silent: number;
  bottleneck_note?: string | null;
  eta_changed_from?: string | null;
}

// ─── Tiện ích ────────────────────────────────────────────────────────────────

const DEV_CONTROL_CODES = ["202608001"];
const ADMIN_ROLES = ["SUPER_ADMIN", "SYSTEM_ADMIN"];
const SITE_KEYS = SITES.map((s) => s.key as string);
const SCM_URL = "/work?dept=logistics&scm=tien-do";

const nowVn = () => new Date(Date.now() + 7 * 3600000).toISOString().replace("T", " ").slice(0, 19);
const str = (v: unknown, max = 200) => (v == null ? "" : String(v).trim()).slice(0, max);
const int = (v: unknown, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : def;
};
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

const toInput = (o: OrderRow): OrderInput => ({
  ship_date: o.ship_date,
  supplier_lead_time: Number(o.supplier_lead_time) || 0,
  transport_days: Number(o.transport_days) || 0,
  no_silent: Number(o.no_silent) === 1,
  origin: o.origin === "NOI_DIA" ? "NOI_DIA" : "NHAP_KHAU",
  eta: o.eta || null,
});

// ─── audit_logs ──────────────────────────────────────────────────────────────
// Bảng audit_logs đang có hai lược đồ khác nhau trong repo (migration 0011 có data_before/data_after,
// helper recordAuditLog của worker dùng emp_name). Ghi theo đúng các cột bảng thực sự có để không mất log.

const ga = globalThis as unknown as { __scmAuditCols?: Set<string> };

async function writeAudit(db: D1, request: Request, user: AuthUser, action: string, recordId: string, before: unknown, after: unknown): Promise<void> {
  try {
    if (!ga.__scmAuditCols) {
      const { results } = await db.prepare("PRAGMA table_info(audit_logs)").all<{ name: string }>();
      ga.__scmAuditCols = new Set(results.map((r) => r.name));
    }
    const cols = ga.__scmAuditCols;
    const row: Record<string, unknown> = {
      user_id: user.empCode,
      emp_code: user.empCode,
      emp_name: user.name || user.empCode,
      role_code: user.roleCode || null,
      module: "SCM",
      action,
      record_id: recordId,
      data_before: before == null ? null : JSON.stringify(before),
      data_after: after == null ? null : JSON.stringify(after),
      changes_json: JSON.stringify({ before: before ?? null, after: after ?? null }),
      ip_address: request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || null,
      user_agent: (request.headers.get("User-Agent") || "").slice(0, 300),
    };
    const keys = Object.keys(row).filter((k) => cols.has(k));
    if (!keys.includes("module") || !keys.includes("action")) return;
    await db
      .prepare(`INSERT INTO audit_logs (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`)
      .bind(...keys.map((k) => row[k]))
      .run();
  } catch (e) {
    console.warn("[SCM AUDIT]", e);
  }
}

// ─── Bảng, cấu hình, quyền ───────────────────────────────────────────────────

const g = globalThis as unknown as { __scmReady?: boolean };

export async function ensureScm(db: D1): Promise<void> {
  if (g.__scmReady) return;
  await db.batch(SCM_DDL.map((q) => db.prepare(q)));
  for (const q of SCM_ALTERS) await db.prepare(q).run().catch(() => null);
  await db.batch(
    Object.entries(DEFAULT_SETTINGS).map(([k, v]) => db.prepare("INSERT OR IGNORE INTO scm_settings (key, value, created_by) VALUES (?, ?, 'SYSTEM')").bind(k, String(v))),
  );
  const rules = await db.prepare("SELECT COUNT(*) AS n FROM scm_dept_rules").first<{ n: number }>();
  if (!rules?.n) {
    await db.batch(
      DEFAULT_DEPT_RULES.map((r, i) => db.prepare("INSERT INTO scm_dept_rules (pattern, dept, sort_order, created_by) VALUES (?, ?, ?, 'SYSTEM')").bind(r.pattern, r.dept, i)),
    );
  }
  g.__scmReady = true;
}

export async function loadSettings(db: D1): Promise<ScmSettings> {
  const { results } = await db.prepare("SELECT key, value FROM scm_settings").all<{ key: string; value: string }>();
  return parseSettings(results);
}

async function loadMatrix(db: D1): Promise<Matrix> {
  const { results } = await db.prepare("SELECT screen, dept, access FROM scm_screen_permissions WHERE status = 'ACTIVE'").all<{ screen: string; dept: string; access: string }>();
  return applyOverrides(results);
}

async function loadRules(db: D1): Promise<DeptRule[]> {
  const { results } = await db.prepare("SELECT pattern, dept FROM scm_dept_rules ORDER BY sort_order, id").all<DeptRule>();
  return results.length ? results : DEFAULT_DEPT_RULES;
}

async function employeeProfile(db: D1, empCode: string): Promise<{ department: string; vtcv: string; title: string } | null> {
  const queries = [
    "SELECT COALESCE(NULLIF(phong_ban_hien_tai, ''), department) AS department, vtcv_hien_tai AS vtcv, title FROM sys_users WHERE UPPER(emp_code) = ? LIMIT 1",
    "SELECT department, '' AS vtcv, title FROM users WHERE UPPER(emp_code) = ? LIMIT 1",
    "SELECT department, '' AS vtcv, title FROM hr_employees WHERE UPPER(id) = ? LIMIT 1",
  ];
  for (const q of queries) {
    const r = await db.prepare(q).bind(empCode.toUpperCase()).first<{ department: string; vtcv: string; title: string }>().catch(() => null);
    if (r && (r.department || r.title)) return r;
  }
  return null;
}

export async function resolveScmUser(db: D1, user: AuthUser): Promise<ScmUser> {
  const empCode = user.empCode.toUpperCase();
  const bypass = DEV_CONTROL_CODES.includes(empCode) || ADMIN_ROLES.includes(String(user.roleCode || "").toUpperCase());
  const { results: manual } = await db.prepare("SELECT dept, is_head FROM scm_dept_members WHERE emp_code = ?").bind(empCode).all<{ dept: ScmDept; is_head: number }>();
  let depts: ScmDept[] = manual.map((m) => m.dept);
  let isHead = manual.some((m) => Number(m.is_head) === 1);
  if (!depts.length) {
    const p = await employeeProfile(db, empCode);
    if (p) {
      const mapped = mapUserToDept(p, await loadRules(db));
      if (mapped.dept) depts = [mapped.dept];
      isHead = mapped.isHead;
    }
  }
  if (user.isExecutiveOrAdmin && !depts.includes("BDH")) depts.push("BDH");
  return { depts, isHead, bypass };
}

/** Phạm vi nhà máy: ai được chọn mọi nhà máy, ai chỉ vào nhà máy trực thuộc */
export interface SiteScope {
  canPickSite: boolean;
  /** Nhà máy trực thuộc ("" nếu chưa gán và không đoán được) */
  homeSite: string;
  /** Nhà máy bị ép cho mọi request (null: được chọn tự do) */
  forced: string | null;
}

async function resolveSiteScope(db: D1, empCode: string, scmUser: ScmUser): Promise<SiteScope> {
  const row = await db.prepare("SELECT home_site, all_sites FROM scm_user_sites WHERE emp_code = ?").bind(empCode.toUpperCase()).first<{ home_site: string | null; all_sites: number }>().catch(() => null);
  const canPickSite = scmUser.bypass || scmUser.depts.includes("BDH") || Number(row?.all_sites) === 1;
  let homeSite = row?.home_site && SITE_KEYS.includes(row.home_site) ? row.home_site : "";
  if (!homeSite) {
    const p = await employeeProfile(db, empCode);
    if (p) homeSite = guessSiteFromText(`${p.department} ${p.vtcv} ${p.title}`);
  }
  return { canPickSite, homeSite, forced: canPickSite ? null : homeSite || "NONE" };
}

/** Người nhận theo phòng ban: gán tay trước, sau đó người được map từ dữ liệu CB-CNV */
async function deptRecipients(db: D1, dept: ScmDept, headsOnly: boolean): Promise<string[]> {
  const out = new Set<string>();
  const { results: manual } = await db.prepare("SELECT emp_code, is_head FROM scm_dept_members WHERE dept = ?").bind(dept).all<{ emp_code: string; is_head: number }>();
  manual.filter((m) => !headsOnly || Number(m.is_head) === 1).forEach((m) => out.add(m.emp_code));
  const rules = await loadRules(db);
  const { results: users } = await db
    .prepare("SELECT emp_code, COALESCE(NULLIF(phong_ban_hien_tai, ''), department) AS department, vtcv_hien_tai AS vtcv, title FROM sys_users WHERE emp_code IS NOT NULL AND (status IS NULL OR UPPER(status) = 'ACTIVE') LIMIT 3000")
    .all<{ emp_code: string; department: string; vtcv: string; title: string }>()
    .catch(() => ({ results: [] as { emp_code: string; department: string; vtcv: string; title: string }[] }));
  for (const u of users) {
    const m = mapUserToDept(u, rules);
    if (m.dept === dept && (!headsOnly || m.isHead)) out.add(String(u.emp_code).toUpperCase());
  }
  return Array.from(out).slice(0, 50);
}

// ─── Đơn hàng ────────────────────────────────────────────────────────────────

export interface LoadedOrder {
  row: OrderRow;
  done: DoneMap;
  view: OrderView;
}

async function loadOrders(db: D1, site: string, settings: ScmSettings, today: string, orderId?: string): Promise<LoadedOrder[]> {
  const where: string[] = ["o.archived = 0"];
  const binds: unknown[] = [];
  if (orderId) {
    where.push("o.id = ?");
    binds.push(orderId);
  }
  if (site && site !== "ALL") {
    where.push("o.site = ?");
    binds.push(site);
  }
  const { results: rows } = await db.prepare(`SELECT o.* FROM scm_orders o WHERE ${where.join(" AND ")} ORDER BY o.ship_date LIMIT 2000`).bind(...binds).all<OrderRow>();
  if (!rows.length) return [];
  const { results: steps } = await db
    .prepare(`SELECT s.order_id, s.step_no, s.done_at FROM scm_order_steps s JOIN scm_orders o ON o.id = s.order_id WHERE ${where.join(" AND ")}`)
    .bind(...binds)
    .all<{ order_id: string; step_no: number; done_at: string | null }>();
  const doneBy = new Map<string, DoneMap>();
  for (const s of steps) {
    const m = doneBy.get(s.order_id) ?? {};
    m[s.step_no as StepNo] = s.done_at;
    doneBy.set(s.order_id, m);
  }
  return rows.map((row) => {
    const done = doneBy.get(row.id) ?? {};
    return { row, done, view: computeOrderView(toInput(row), done, today, settings) };
  });
}

/** Ghi lại hạn, số ngày trễ, bước đang chờ và trạng thái tổng của đơn (cache cho báo cáo/cron) */
function cacheStatements(db: D1, o: LoadedOrder, by: string): D1Stmt[] {
  const stmts = o.view.steps.map((s) =>
    db
      .prepare("UPDATE scm_order_steps SET due_at = ?, late_days = ?, blocked_by = ?, updated_at = ?, updated_by = ? WHERE order_id = ? AND step_no = ?")
      .bind(s.due, s.daysLate, s.waitingOn ? JSON.stringify({ step: s.waitingOn.step, dept: s.waitingOn.owner, label: s.waitingOn.label }) : null, nowVn(), by, o.row.id, s.no),
  );
  stmts.push(
    db
      .prepare("UPDATE scm_orders SET info_deadline = ?, status_cache = ?, progress_cache = ?, updated_at = ?, updated_by = ? WHERE id = ?")
      .bind(o.view.infoDeadline, o.view.state, o.view.progress, nowVn(), by, o.row.id),
  );
  return stmts;
}

function listItem(o: LoadedOrder, today: string) {
  return {
    id: o.row.id,
    code: o.row.code,
    site: o.row.site,
    plant: o.row.plant,
    line: o.row.line,
    style: o.row.style,
    qty: Number(o.row.qty) || 0,
    shipDate: o.row.ship_date,
    daysToShip: diffDays(o.row.ship_date, today),
    state: o.view.state,
    progress: o.view.progress,
    stuck: o.view.stuck ? { ...o.view.stuck, ownerName: OWNER_DEPT_NAME[o.view.stuck.owner] } : null,
    flag: o.view.state !== "complete" ? o.row.bottleneck_note ?? null : null,
    steps: o.view.steps.map((s) => ({ no: s.no, status: s.status, due: s.due, doneAt: s.doneAt, reason: s.reason })),
  };
}

/** Câu lệnh xác nhận bước n của đơn; từ chối nếu đã xong hoặc còn bước phụ thuộc chưa xong */
function stepCompletion(db: D1, o: LoadedOrder, n: StepNo, by: string, note: string, today: string, settings: ScmSettings):
  | { ok: true; stmts: D1Stmt[]; updated: LoadedOrder }
  | { ok: false; error: string } {
  if (o.done[n]) return { ok: false, error: `Bước ${n} đã hoàn thành` };
  if (n === 5 && Number(o.row.no_silent) !== 1) return { ok: false, error: "Đơn không có No Silent, bước 5 không áp dụng" };
  const chk = canComplete(toInput(o.row), o.done, n);
  if (!chk.ok) return { ok: false, error: `Chưa thể hoàn thành bước ${n}: còn bước ${chk.missing.join(", ")} chưa xong` };
  const at = nowVn();
  const done = { ...o.done, [n]: at };
  const updated: LoadedOrder = { ...o, done, view: computeOrderView(toInput(o.row), done, today, settings) };
  return {
    ok: true,
    updated,
    stmts: [
      db.prepare("UPDATE scm_order_steps SET done_at = ?, done_by = ?, note = ?, escalation_level = 0, updated_at = ?, updated_by = ? WHERE order_id = ? AND step_no = ?")
        .bind(at, by, note || null, at, by, o.row.id, n),
      ...cacheStatements(db, updated, by),
    ],
  };
}

// ─── Bộ định tuyến /api/scm/* ────────────────────────────────────────────────

export async function handleScmApi(request: Request, env: { DB: D1; BUCKET?: R2Like }, deps: ScmDeps): Promise<Response> {
  const url = new URL(request.url);
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: deps.headers });
  const fail = (status: number, error: string, message: string) => reply({ success: false, error, message }, status);

  try {
    const user = await deps.verifyServerAuth(request);
    if (!user || !user.authenticated) return fail(401, "UNAUTHORIZED", "Vui lòng đăng nhập");
    const db = env.DB;
    await ensureScm(db);
    const [settings, matrix, scmUser] = await Promise.all([loadSettings(db), loadMatrix(db), resolveScmUser(db, user)]);
    const opts = { digitalCanViewBusiness: settings.digital_can_view_business === 1 };
    const access = resolveAll(scmUser, matrix, opts);
    const today = vnToday();
    const parts = url.pathname.split("/").filter(Boolean); // api, scm, resource, id, sub, n, action
    const resource = parts[2] || "";
    const method = request.method;
    const isMultipart = (request.headers.get("content-type") || "").includes("multipart/form-data");
    const body = (method === "POST" || method === "PUT") && !isMultipart ? ((await request.json().catch(() => ({}))) as Record<string, unknown>) : {};

    if (access.progress === "lock") return fail(403, "FORBIDDEN", "Bạn không có quyền xem module này");
    // Chỉ BGĐ/BQT/Admin và người làm trong mảng này (thuộc một phòng của module) mới vào được
    if (!scmUser.bypass && !scmUser.depts.length) return fail(403, "NOT_MEMBER", "Module này chỉ dành cho bộ phận Kế hoạch, Mua hàng, Kho, KD·CN·QC, Số hóa và Ban điều hành");
    const scope = await resolveSiteScope(db, user.empCode, scmUser);
    if (scope.forced) {
      // Tài khoản không được chọn nhà máy: mọi tham số site đều ép về nhà máy trực thuộc
      url.searchParams.set("site", scope.forced);
      if (method === "POST" || method === "PUT") body.site = scope.forced;
    }
    const lo = (s: string, id?: string) => loadOrders(db, scope.forced ?? s, settings, today, id);

    // GET /api/scm/me
    if (resource === "me" && parts.length === 3 && method === "GET") {
      const pref = await db.prepare("SELECT site FROM scm_user_prefs WHERE emp_code = ?").bind(user.empCode.toUpperCase()).first<{ site: string }>();
      return reply({
        success: true,
        empCode: user.empCode,
        name: user.name || user.empCode,
        depts: scmUser.depts,
        isHead: scmUser.isHead,
        bypass: scmUser.bypass,
        access,
        canApprovePermissions: canApprovePermissions(scmUser),
        canPickSite: scope.canPickSite,
        homeSite: scope.homeSite,
        site: scope.forced ? (scope.forced === "NONE" ? "" : scope.forced) : pref?.site && (SITE_KEYS.includes(pref.site) || pref.site === "ALL") ? pref.site : "ALL",
        today,
        settings: { production_days: settings.production_days, bom_days: settings.bom_days },
      });
    }

    // PUT /api/scm/me/site
    if (resource === "me" && parts[3] === "site" && method === "PUT") {
      if (!scope.canPickSite) return reply({ success: true, site: scope.homeSite });
      const site = str(body.site, 10).toUpperCase();
      if (site !== "ALL" && !SITE_KEYS.includes(site)) return fail(400, "BAD_SITE", "Site không hợp lệ");
      await db
        .prepare("INSERT INTO scm_user_prefs (emp_code, site, created_by, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(emp_code) DO UPDATE SET site = excluded.site, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by")
        .bind(user.empCode.toUpperCase(), site, user.empCode, user.empCode)
        .run();
      return reply({ success: true, site });
    }

    if (scope.forced === "NONE") return fail(403, "NO_SITE", "Tài khoản chưa được gán nhà máy trực thuộc. Liên hệ Ban điều hành hoặc Admin để được gán.");

    // GET/PUT /api/scm/user-sites: gán nhà máy trực thuộc và quyền xem mọi nhà máy (chỉ Admin/BGĐ)
    if (resource === "user-sites") {
      if (!scmUser.bypass && !scmUser.depts.includes("BDH")) return fail(403, "FORBIDDEN", "Chỉ Ban điều hành hoặc Admin được phân nhà máy");
      if (method === "GET") {
        const { results } = await db.prepare("SELECT emp_code, home_site, all_sites, updated_by, updated_at FROM scm_user_sites ORDER BY emp_code LIMIT 500").all();
        return reply({ success: true, items: results });
      }
      if (method === "PUT") {
        const emp = str(body.empCode, 30).toUpperCase();
        const home = str(body.homeSite, 10).toUpperCase();
        const all = body.allSites ? 1 : 0;
        if (!/^[A-Z0-9_-]{3,30}$/.test(emp)) return fail(400, "BAD_INPUT", "MSNV không hợp lệ");
        if (home && !SITE_KEYS.includes(home)) return fail(400, "BAD_SITE", "Nhà máy không hợp lệ");
        const before = await db.prepare("SELECT home_site, all_sites FROM scm_user_sites WHERE emp_code = ?").bind(emp).first();
        await db
          .prepare("INSERT INTO scm_user_sites (emp_code, home_site, all_sites, created_by, updated_by) VALUES (?, ?, ?, ?, ?) ON CONFLICT(emp_code) DO UPDATE SET home_site = excluded.home_site, all_sites = excluded.all_sites, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by")
          .bind(emp, home || null, all, user.empCode, user.empCode)
          .run();
        await writeAudit(db, request, user, "SET_USER_SITE", emp, before ?? null, { home_site: home || null, all_sites: all });
        return reply({ success: true });
      }
    }

    const site = str(url.searchParams.get("site") || "ALL", 10).toUpperCase();

    // GET /api/scm/overview
    // GET /api/scm/sites: tóm tắt từng nhà máy cho màn chọn nhà máy (số đơn, trễ, bị chặn, bộ phận nghẽn nhất)
    if (resource === "sites" && method === "GET") {
      const orders = await lo("ALL");
      const summarize = (list: LoadedOrder[]) => {
        const active = list.filter((o) => o.view.state !== "complete");
        const has = (o: LoadedOrder, st: string) => o.view.steps.some((s) => s.status === st);
        const top = computeBottlenecks(list.map((o) => o.view)).find((b) => b.late + b.blocking > 0);
        return {
          tracking: active.length,
          onTrack: list.filter((o) => o.view.state === "on_track").length,
          withLate: active.filter((o) => has(o, "late")).length,
          withBlocked: active.filter((o) => has(o, "blocked")).length,
          complete: list.length - active.length,
          bottleneck: top ? { owner: top.owner, name: OWNER_DEPT_NAME[top.owner], count: top.late + top.blocking } : null,
        };
      };
      return reply({
        success: true,
        today,
        all: summarize(orders),
        sites: SITES.filter((s) => !scope.forced || s.key === scope.forced).map((s) => ({ key: s.key, name: s.name, ...summarize(orders.filter((o) => o.row.site === s.key)) })),
      });
    }

    if (resource === "overview" && method === "GET") {
      const orders = await lo(site);
      const active = orders.filter((o) => o.view.state !== "complete");
      const hasStatus = (o: LoadedOrder, st: string) => o.view.steps.some((s) => s.status === st);
      const plants = Array.from(new Set(orders.map((o) => o.row.plant).filter(Boolean))).sort();
      return reply({
        success: true,
        today,
        cards: {
          tracking: active.length,
          onTrack: orders.filter((o) => o.view.state === "on_track").length,
          withLate: active.filter((o) => hasStatus(o, "late")).length,
          withBlocked: active.filter((o) => hasStatus(o, "blocked")).length,
          shipIn45: active.filter((o) => {
            const d = diffDays(o.row.ship_date, today);
            return d >= 0 && d <= 45;
          }).length,
          complete: orders.length - active.length,
        },
        bottlenecks: computeBottlenecks(orders.map((o) => o.view)).map((b) => ({ ...b, name: OWNER_DEPT_NAME[b.owner] })),
        plants,
      });
    }

    if (resource === "orders") {
      const orderId = parts[3] ? decodeURIComponent(parts[3]) : "";

      // GET /api/scm/orders (lọc, sắp xếp, phân trang ở server)
      if (!orderId && method === "GET") {
        const q = str(url.searchParams.get("q"), 60).toUpperCase();
        const status = str(url.searchParams.get("status"), 20);
        const plant = str(url.searchParams.get("plant"), 60);
        const owner = str(url.searchParams.get("owner"), 10).toUpperCase() as OwnerDept;
        const sort = str(url.searchParams.get("sort"), 20) || "ship";
        const page = Math.max(1, int(url.searchParams.get("page"), 1));
        const pageSize = Math.min(50, Math.max(1, int(url.searchParams.get("pageSize"), 10)));
        let list = await lo(site);
        if (q) list = list.filter((o) => o.row.code.toUpperCase().includes(q) || String(o.row.plant || "").toUpperCase().includes(q) || String(o.row.style || "").toUpperCase().includes(q));
        if (plant) list = list.filter((o) => o.row.plant === plant);
        if (["blocked", "late", "on_track", "complete"].includes(status)) list = list.filter((o) => o.view.state === status);
        if (owner && owner in OWNER_DEPT_NAME) {
          list = list.filter((o) => o.view.steps.some((s) => (s.status === "late" && s.owner === owner) || (s.status === "blocked" && s.waitingOn?.owner === owner)));
        }
        if (sort === "progress") list.sort((a, b) => a.view.progress - b.view.progress || a.row.ship_date.localeCompare(b.row.ship_date));
        else if (sort === "risk") list.sort((a, b) => riskScore(b.view, b.row.ship_date, today) - riskScore(a.view, a.row.ship_date, today));
        else list.sort((a, b) => a.row.ship_date.localeCompare(b.row.ship_date) || a.row.code.localeCompare(b.row.code));
        const total = list.length;
        const items = list.slice((page - 1) * pageSize, page * pageSize).map((o) => listItem(o, today));
        return reply({ success: true, items, total, page, pageSize, today });
      }

      // POST /api/scm/orders (nhận đơn từ Kinh doanh: màn Kế hoạch)
      if (!orderId && method === "POST") {
        if (access.planning !== "edit") return fail(403, "FORBIDDEN", "Chỉ phòng Kế hoạch được thêm đơn hàng");
        const code = str(body.code, 40).toUpperCase();
        const orderSite = str(body.site, 10).toUpperCase();
        const ship = str(body.ship_date, 10);
        if (!code) return fail(400, "BAD_INPUT", "Cần nhập mã đơn");
        if (!SITE_KEYS.includes(orderSite)) return fail(400, "BAD_INPUT", "Site không hợp lệ");
        if (!isDate(ship)) return fail(400, "BAD_INPUT", "Ngày xuất hàng không hợp lệ (yyyy-mm-dd)");
        const exists = await db.prepare("SELECT id FROM scm_orders WHERE code = ?").bind(code).first();
        if (exists) return fail(400, "DUPLICATE", `Mã đơn ${code} đã tồn tại`);
        const id = `ord_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        const row: OrderRow = {
          id,
          code,
          site: orderSite,
          plant: str(body.plant, 60) || null,
          line: str(body.line, 30) || null,
          style: str(body.style, 60) || null,
          qty: Math.max(0, int(body.qty)),
          ship_date: ship,
          supplier_id: str(body.supplier_id, 40) || null,
          supplier_lead_time: Math.max(0, int(body.supplier_lead_time, 30)),
          transport_days: Math.max(0, int(body.transport_days, 7)),
          origin: body.origin === "NOI_DIA" ? "NOI_DIA" : "NHAP_KHAU",
          eta: null,
          no_silent: body.no_silent === false || body.no_silent === 0 ? 0 : 1,
        };
        const view = computeOrderView(toInput(row), {}, today, settings);
        await db.batch([
          db
            .prepare("INSERT INTO scm_orders (id, code, site, plant, line, style, qty, ship_date, supplier_id, supplier_lead_time, transport_days, origin, no_silent, info_deadline, status_cache, progress_cache, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(row.id, row.code, row.site, row.plant, row.line, row.style, row.qty, row.ship_date, row.supplier_id, row.supplier_lead_time, row.transport_days, row.origin, row.no_silent, view.infoDeadline, view.state, view.progress, user.empCode, user.empCode),
          ...view.steps.map((s) =>
            db.prepare("INSERT INTO scm_order_steps (order_id, step_no, owner_dept, due_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)").bind(id, s.no, s.owner, s.due, user.empCode, user.empCode),
          ),
        ]);
        await writeAudit(db, request, user, "CREATE_ORDER", id, null, row);
        return reply({ success: true, id, infoDeadline: view.infoDeadline });
      }

      const [order] = orderId ? await lo("ALL", orderId) : [];
      if (orderId && !order) return fail(404, "NOT_FOUND", "Không tìm thấy đơn hàng");

      // GET /api/scm/orders/:id
      if (order && parts.length === 4 && method === "GET") {
        const { results: handover } = await db.prepare("SELECT item, delivered_at, delivered_by FROM scm_handover_items WHERE order_id = ?").bind(order.row.id).all();
        return reply({
          success: true,
          order: listItem(order, today),
          detail: {
            supplierLeadTime: order.row.supplier_lead_time,
            transportDays: order.row.transport_days,
            origin: order.row.origin,
            noSilent: Number(order.row.no_silent) === 1,
            infoDeadline: order.view.infoDeadline,
            formula: infoDeadlineFormula(Number(order.row.supplier_lead_time), Number(order.row.transport_days), settings),
            steps: order.view.steps.map((s) => ({
              ...s,
              title: STEPS[s.no].title,
              sla: STEPS[s.no].sla,
              ownerName: OWNER_DEPT_NAME[s.owner],
              waitingOnName: s.waitingOn ? OWNER_DEPT_NAME[s.waitingOn.owner] : null,
              escalation: escalationLevel(s, settings),
              canEdit: canEditStep(scmUser, s.owner, matrix),
            })),
            handover,
          },
        });
      }

      // PUT /api/scm/orders/:id/ship-date (đổi ngày xuất: tính lại mọi hạn, báo Mua hàng và Kinh doanh)
      if (order && parts[4] === "ship-date" && method === "PUT") {
        if (access.planning !== "edit" && access.kdcnqc !== "edit") return fail(403, "FORBIDDEN", "Chỉ Kế hoạch hoặc Kinh doanh được đổi ngày xuất");
        const ship = str(body.ship_date, 10);
        const reason = str(body.reason, 300);
        if (!isDate(ship)) return fail(400, "BAD_INPUT", "Ngày xuất hàng không hợp lệ (yyyy-mm-dd)");
        if (reason.length < 5) return fail(400, "REASON_REQUIRED", "Cần nhập lý do đổi ngày xuất (tối thiểu 5 ký tự)");
        const before = { ship_date: order.row.ship_date, infoDeadline: order.view.infoDeadline };
        const updated: LoadedOrder = { ...order, row: { ...order.row, ship_date: ship } };
        updated.view = computeOrderView(toInput(updated.row), order.done, today, settings);
        await db.batch([
          db.prepare("UPDATE scm_orders SET ship_date = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(ship, nowVn(), user.empCode, order.row.id),
          ...cacheStatements(db, updated, user.empCode),
        ]);
        await writeAudit(db, request, user, "CHANGE_SHIP_DATE", order.row.id, before, { ship_date: ship, infoDeadline: updated.view.infoDeadline, reason });
        const recipients = new Set([...(await deptRecipients(db, "MH", false)), ...(await deptRecipients(db, "KDCNQC", false))]);
        for (const emp of recipients) {
          await deps.notify(emp, {
            title: `Đơn ${order.row.code} đổi ngày xuất`,
            message: `Ngày xuất ${fmtDMY(before.ship_date)} → ${fmtDMY(ship)}. Hạn chót giao thông tin mới: ${fmtDMY(updated.view.infoDeadline)}. Lý do: ${reason}`,
            url: SCM_URL,
            type: "WARNING",
            category: "SCM",
            senderEmpCode: user.empCode,
          }).catch(() => null);
        }
        return reply({ success: true, infoDeadline: updated.view.infoDeadline, notified: recipients.size });
      }

      // POST /api/scm/orders/:id/steps/:n/complete | undo
      if (order && parts[4] === "steps" && method === "POST") {
        const n = int(parts[5]) as StepNo;
        const action = parts[6];
        if (!STEP_NOS.includes(n)) return fail(400, "BAD_STEP", "Bước không hợp lệ");
        const owner = STEPS[n].owner;
        if (!canEditStep(scmUser, owner, matrix)) return fail(403, "FORBIDDEN", `Chỉ ${OWNER_DEPT_NAME[owner]} được xác nhận bước ${n}`);
        const at = nowVn();

        if (action === "complete") {
          const r = stepCompletion(db, order, n, user.empCode, str(body.note, 300), today, settings);
          if ("error" in r) return fail(400, order.done[n] ? "ALREADY_DONE" : "DEPENDENCY", r.error);
          await db.batch(r.stmts);
          await writeAudit(db, request, user, "COMPLETE_STEP", `${order.row.id}#${n}`, { step: n, done_at: null }, { step: n, done_at: r.updated.done[n], note: str(body.note, 300) });
          return reply({ success: true, order: listItem(r.updated, today) });
        }

        if (action === "undo") {
          const reason = str(body.reason, 300);
          if (!order.done[n]) return fail(400, "NOT_DONE", `Bước ${n} chưa hoàn thành`);
          if (reason.length < 5) return fail(400, "REASON_REQUIRED", "Cần nhập lý do hoàn tác (tối thiểu 5 ký tự)");
          const cascade = undoCascade(order.done, n);
          const reverted = [n, ...cascade];
          const done = { ...order.done };
          reverted.forEach((k) => (done[k] = null));
          const updated: LoadedOrder = { ...order, done, view: computeOrderView(toInput(order.row), done, today, settings) };
          await db.batch([
            ...reverted.map((k) =>
              db.prepare("UPDATE scm_order_steps SET done_at = NULL, done_by = NULL, note = ?, updated_at = ?, updated_by = ? WHERE order_id = ? AND step_no = ?")
                .bind(k === n ? `Hoàn tác: ${reason}` : `Hoàn tác theo bước ${n}: ${reason}`, at, user.empCode, order.row.id, k),
            ),
            ...cacheStatements(db, updated, user.empCode),
          ]);
          await writeAudit(
            db,
            request,
            user,
            "UNDO_STEP",
            `${order.row.id}#${n}`,
            Object.fromEntries(reverted.map((k) => [`step_${k}`, order.done[k]])),
            { reason, cascade },
          );
          return reply({ success: true, reverted, order: listItem(updated, today) });
        }
      }

      // POST /api/scm/orders/:id/remind | escalate  { step }
      if (order && (parts[4] === "remind" || parts[4] === "escalate") && method === "POST") {
        const n = int(body.step) as StepNo;
        const s = order.view.steps.find((x) => x.no === n);
        if (!s) return fail(400, "BAD_STEP", "Bước không hợp lệ");
        let level: number;
        let recipients: string[];
        if (parts[4] === "remind") {
          if (s.status !== "doing" && s.status !== "late") return fail(400, "NOT_ACTIVE", `Bước ${n} không ở trạng thái đang làm hoặc trễ hạn`);
          level = 1;
          recipients = await deptRecipients(db, OWNER_TO_SCM[s.owner], false);
        } else {
          const lv = escalationLevel(s, settings);
          if (lv < 2) return fail(400, "NOT_OVERDUE", `Bước ${n} chưa quá hạn, hãy dùng Nhắc cấp 1`);
          level = lv;
          recipients = lv === 3 ? await deptRecipients(db, "BDH", false) : await deptRecipients(db, OWNER_TO_SCM[s.owner], true);
        }
        const title = level === 1 ? `Nhắc việc: đơn ${order.row.code}, bước ${n}` : `Leo thang cấp ${level}: đơn ${order.row.code}, bước ${n}`;
        const ask = level === 1 ? "Vui lòng cập nhật trạng thái trong ngày." : level === 2 ? "Vui lòng nêu nguyên nhân và ngày hoàn tất dự kiến." : "Đề nghị họp xử lý trong 1 ngày làm việc.";
        const message = `${STEPS[n].title} (${OWNER_DEPT_NAME[s.owner]}): ${s.reason}. ${ask}`;
        for (const emp of recipients) {
          await deps.notify(emp, { title, message, url: SCM_URL, type: level === 1 ? "INFO" : "WARNING", category: "SCM", priority: level === 3 ? "HIGH" : "NORMAL", senderEmpCode: user.empCode }).catch(() => null);
        }
        await db.prepare("UPDATE scm_order_steps SET escalation_level = ?, escalated_at = ?, updated_at = ?, updated_by = ? WHERE order_id = ? AND step_no = ?")
          .bind(level, nowVn(), nowVn(), user.empCode, order.row.id, n).run();
        await writeAudit(db, request, user, level === 1 ? "REMIND_STEP" : "ESCALATE_STEP", `${order.row.id}#${n}`, null, { level, recipients: recipients.length });
        return reply({
          success: true,
          level,
          notified: recipients.length,
          message: recipients.length ? `Đã gửi tới ${recipients.length} người` : "Chưa có người nhận: phòng ban chưa được gán nhân sự trong SCM",
        });
      }
    }

    const notifyDept = async (dept: ScmDept, headsOnly: boolean, title: string, message: string) => {
      const to = await deptRecipients(db, dept, headsOnly);
      for (const emp of to) {
        await deps.notify(emp, { title, message, url: SCM_URL, type: "INFO", category: "SCM", senderEmpCode: user.empCode }).catch(() => null);
      }
      return to.length;
    };
    const stepCtx = {
      db,
      bucket: env.BUCKET,
      request,
      url,
      parts,
      method,
      body,
      user,
      scmUser,
      access,
      settings,
      today,
      reply,
      fail,
      audit: (action, recordId, before, after) => writeAudit(db, request, user, action, recordId, before, after),
      notifyDept,
      loadOrders: (s, id) => lo(s, id),
      completeStep: (o: LoadedOrder, n: StepNo, note: string) => stepCompletion(db, o, n, user.empCode, note, today, settings),
    };
    const step2 = await handleScmStep2(stepCtx);
    if (step2) return step2;
    const step3 = await handleScmStep3(stepCtx);
    if (step3) return step3;

    return fail(404, "NOT_FOUND", "API không tồn tại");
  } catch (err) {
    return fail(500, "SERVER_ERROR", err instanceof Error ? err.message : String(err));
  }
}

// ─── Cron mỗi giờ (gọi từ scheduled() dispatcher của worker) ─────────────────

async function insertNotification(db: D1, empCode: string, title: string, message: string, priority: string) {
  await db
    .prepare("INSERT INTO notifications (id, user_id, sender_id, type, category, title, message, url, priority, is_read, created_at) VALUES (?, ?, 'SYSTEM', 'WARNING', 'SCM', ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)")
    .bind(`notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, empCode, title, message, SCM_URL, priority)
    .run();
}

/** Leo thang tự động theo giờ cấu hình escalation_run_time (giờ Việt Nam). Trả về số thông báo đã gửi. */
export async function runScmHourly(db: D1, now: number = Date.now()): Promise<{ ran: boolean; sent: number }> {
  await ensureScm(db);
  const settings = await loadSettings(db);
  const vnHour = new Date(now + 7 * 3600000).getUTCHours();
  // 11:00 hằng ngày: báo cáo kế hoạch & kết quả đồng bộ vật tư 8 tuần cho Kho, Kế hoạch, Mua hàng
  let syncSent = 0;
  if (vnHour === 11) {
    const summary = await syncDailySummary(db, vnToday(now)).catch(() => null);
    if (summary) {
      const seen = new Set<string>();
      for (const dept of ["KHO", "KH", "MH"] as ScmDept[]) {
        for (const emp of await deptRecipients(db, dept, false)) {
          if (seen.has(emp)) continue;
          seen.add(emp);
          await insertNotification(db, emp, summary.title, summary.message, "NORMAL").catch(() => null);
          syncSent++;
        }
      }
    }
  }
  if (vnHour !== Number(settings.escalation_run_time.slice(0, 2))) return { ran: syncSent > 0, sent: syncSent };
  const today = vnToday(now);
  const orders = await loadOrders(db, "ALL", settings, today);
  const { results: prev } = await db.prepare("SELECT order_id, step_no, escalation_level, escalated_at FROM scm_order_steps").all<{ order_id: string; step_no: number; escalation_level: number; escalated_at: string | null }>();
  const prevMap = new Map(prev.map((p) => [`${p.order_id}#${p.step_no}`, p]));
  const recipientsCache = new Map<string, string[]>();
  const recipients = async (dept: ScmDept, heads: boolean) => {
    const key = `${dept}|${heads}`;
    if (!recipientsCache.has(key)) recipientsCache.set(key, await deptRecipients(db, dept, heads));
    return recipientsCache.get(key)!;
  };
  let sent = 0;
  for (const o of orders) {
    const stmts: D1Stmt[] = cacheStatements(db, o, "SYSTEM");
    for (const s of o.view.steps) {
      const level = escalationLevel(s, settings);
      if (!level) continue;
      const p = prevMap.get(`${o.row.id}#${s.no}`);
      if (p && Number(p.escalation_level) === level && String(p.escalated_at || "").slice(0, 10) === today) continue;
      const dept = OWNER_TO_SCM[s.owner];
      const to = level === 1 ? await recipients(dept, false) : level === 2 ? await recipients(dept, true) : await recipients("BDH", false);
      const title = level === 1 ? `Nhắc việc: đơn ${o.row.code}, bước ${s.no}` : `Leo thang cấp ${level}: đơn ${o.row.code}, bước ${s.no}`;
      const message = `${STEPS[s.no].title} (${OWNER_DEPT_NAME[s.owner]}): ${s.reason}.`;
      for (const emp of to) {
        await insertNotification(db, emp, title, message, level === 3 ? "HIGH" : "NORMAL").catch(() => null);
        sent++;
      }
      stmts.push(db.prepare("UPDATE scm_order_steps SET escalation_level = ?, escalated_at = ? WHERE order_id = ? AND step_no = ?").bind(level, nowVn(), o.row.id, s.no));
    }
    await db.batch(stmts);
  }
  sent += await escalateIncidents(db, settings, today, async (dept, heads, title, message) => {
    const to = await recipients(dept, heads);
    for (const emp of to) await insertNotification(db, emp, title, message, dept === "BDH" ? "HIGH" : "NORMAL").catch(() => null);
    return to.length;
  });
  return { ran: true, sent: sent + syncSent };
}

/** Quyền của một màn hình cho người dùng (dùng ở worker khi cần kiểm tra nhanh) */
export async function scmScreenAccess(db: D1, user: AuthUser, screen: Parameters<typeof resolveAccess>[1]) {
  await ensureScm(db);
  const [settings, matrix, scmUser] = await Promise.all([loadSettings(db), loadMatrix(db), resolveScmUser(db, user)]);
  return resolveAccess(scmUser, screen, matrix, { digitalCanViewBusiness: settings.digital_can_view_business === 1 });
}
