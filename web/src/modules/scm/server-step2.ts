// API Bước 2 của module SCM: Kế hoạch & CCƯ (/api/scm/plans*), Mua hàng (/api/scm/purchasing*), form (/api/scm/forms*).
// Được gọi từ handleScmApi (server.ts) với context đã xác thực và đã tính quyền.

import { SITES, SYNC_WEEKS, type ScmDept, type ScmSettings, type StepNo } from "./config";
import { addDays, fmtDMY } from "./engine";
import type { Access, ScreenKey, ScmUser } from "./permissions";
import { PLAN_STATUS, PLAN_TRANSITIONS, canIssue, capacityByWeek, mondayOf, planWeeks, rankPriority, rollForward, validatePlan, type AllocLine, type PlanStatus } from "./planning";
import {
  FORM_EXTENSIONS,
  FORM_MAX_BYTES,
  INCIDENT_PLANS,
  canEscalateIncident,
  etaImpact,
  expectedArrival,
  incidentDay,
  nextIncidentStage,
  orderConditions,
  parseProcurementForm,
  poNumber,
  type IncidentStage,
} from "./purchasing";
import type { AuthUser, D1, D1Stmt, LoadedOrder } from "./server";

export interface R2Like {
  put(key: string, value: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>;
}

export interface Step2Ctx {
  db: D1;
  bucket?: R2Like;
  request: Request;
  url: URL;
  parts: string[];
  method: string;
  body: Record<string, unknown>;
  user: AuthUser;
  scmUser: ScmUser;
  access: Record<ScreenKey, Access>;
  settings: ScmSettings;
  today: string;
  reply: (body: unknown, status?: number) => Response;
  fail: (status: number, error: string, message: string) => Response;
  audit: (action: string, recordId: string, before: unknown, after: unknown) => Promise<void>;
  notifyDept: (dept: ScmDept, headsOnly: boolean, title: string, message: string) => Promise<number>;
  loadOrders: (site: string, orderId?: string) => Promise<LoadedOrder[]>;
  /** Xác nhận bước n (kiểm tra phụ thuộc); trả về câu lệnh cần chạy */
  completeStep: (o: LoadedOrder, n: StepNo, note: string) => { ok: true; stmts: D1Stmt[]; updated: LoadedOrder } | { ok: false; error: string };
}

const SITE_KEYS = SITES.map((s) => s.key as string);
const nowVn = () => new Date(Date.now() + 7 * 3600000).toISOString().replace("T", " ").slice(0, 19);
const str = (v: unknown, max = 200) => (v == null ? "" : String(v).trim()).slice(0, max);
const int = (v: unknown, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : def;
};
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const rid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export async function handleScmStep2(c: Step2Ctx): Promise<Response | null> {
  const resource = c.parts[2];
  if (resource === "plans") return plans(c);
  if (resource === "purchasing") return purchasing(c);
  if (resource === "forms") return forms(c);
  return null;
}

// ─── Kế hoạch & CCƯ ──────────────────────────────────────────────────────────

interface PlanRow {
  id: string;
  site: string;
  week_start: string;
  status: PlanStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  issued_by: string | null;
  issued_at: string | null;
  tier2_sent_at: string | null;
}

async function loadLines(db: D1, planId: string): Promise<(AllocLine & { tier2_sent: number })[]> {
  const { results } = await db.prepare("SELECT order_id, week_start, plant, line, tier2_sent FROM scm_allocation_lines WHERE plan_id = ?").bind(planId).all<AllocLine & { tier2_sent: number }>();
  return results;
}

async function capacityFn(db: D1, weeks: string[], s: ScmSettings) {
  const { results } = await db
    .prepare(`SELECT plant, line, week_start, capacity FROM scm_plant_capacity WHERE week_start IN (${weeks.map(() => "?").join(", ")})`)
    .bind(...weeks)
    .all<{ plant: string; line: string; week_start: string; capacity: number }>();
  const map = new Map(results.map((r) => [`${r.plant}|${r.line}|${r.week_start}`, Number(r.capacity)]));
  return (plant: string, line: string, week: string) => map.get(`${plant}|${line}|${week}`) ?? s.line_capacity_week;
}

async function logChange(c: Step2Ctx, planId: string, orderId: string | null, action: string, reason: string | null, before: unknown, after: unknown) {
  await c.db
    .prepare("INSERT INTO scm_plan_changes (plan_id, order_id, action, reason, before_json, after_json, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(planId, orderId, action, reason, before == null ? null : JSON.stringify(before), after == null ? null : JSON.stringify(after), c.user.empCode, c.user.empCode)
    .run();
}

async function planView(c: Step2Ctx, plan: PlanRow) {
  const weeks = planWeeks(plan.week_start);
  const lines = await loadLines(c.db, plan.id);
  const orders = (await c.loadOrders(plan.site)).filter((o) => o.view.state !== "complete" || lines.some((l) => l.order_id === o.row.id));
  const planOrders = orders.map((o) => ({ id: o.row.id, code: o.row.code, qty: Number(o.row.qty) || 0, ship_date: o.row.ship_date }));
  const prio = rankPriority(planOrders);
  const loads = capacityByWeek(weeks, lines, planOrders, await capacityFn(c.db, weeks, c.settings));
  const errors = validatePlan(weeks, lines);
  const { results: changes } = await c.db
    .prepare("SELECT c.id, c.order_id, o.code AS order_code, c.action, c.reason, c.before_json, c.after_json, c.created_by, c.created_at FROM scm_plan_changes c LEFT JOIN scm_orders o ON o.id = c.order_id WHERE c.plan_id = ? ORDER BY c.id DESC LIMIT 40")
    .bind(plan.id)
    .all();
  const rows = orders
    .map((o) => {
      const s5 = o.view.steps[4];
      return {
        id: o.row.id,
        code: o.row.code,
        plant: o.row.plant,
        line: o.row.line,
        qty: Number(o.row.qty) || 0,
        shipDate: o.row.ship_date,
        priority: prio.get(o.row.id) ?? 0,
        noSilent: { required: Number(o.row.no_silent) === 1, doneAt: s5.doneAt, status: s5.status, reason: s5.reason, canSend: s5.status !== "done" && s5.status !== "na" && o.view.steps[2].status === "done" },
        step3: o.view.steps[2].status,
        step4: o.view.steps[3].status,
        cells: weeks.map((w) => {
          const l = lines.find((x) => x.order_id === o.row.id && x.week_start === w);
          return l ? { plant: l.plant, line: l.line, tier2Sent: Number(l.tier2_sent) === 1 } : null;
        }),
      };
    })
    .sort((a, b) => a.priority - b.priority);
  const issue = canIssue(plan.status, loads, errors);
  // Tìm kiếm, lọc, phân trang ở server; năng lực luôn tính trên toàn bộ kế hoạch
  const q = str(c.url.searchParams.get("q"), 60).toUpperCase();
  const filter = str(c.url.searchParams.get("filter"), 20);
  const page = Math.max(1, int(c.url.searchParams.get("page"), 1));
  const pageSize = Math.min(50, Math.max(1, int(c.url.searchParams.get("pageSize"), 10)));
  const filtered = rows.filter(
    (r) =>
      (!q || r.code.toUpperCase().includes(q) || String(r.plant || "").toUpperCase().includes(q)) &&
      (filter !== "unallocated" || r.cells.every((x) => !x)) &&
      (filter !== "nosilent" || r.noSilent.canSend),
  );
  return {
    plan: { ...plan, statusLabel: PLAN_STATUS.find((p) => p.key === plan.status)?.label },
    weeks,
    rows: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
    loads,
    errors,
    canIssue: issue,
    changes,
    canEdit: c.access.planning === "edit",
    canApprove: c.access.planning === "edit" && (c.scmUser.isHead || c.scmUser.bypass),
  };
}

async function plans(c: Step2Ctx): Promise<Response> {
  const { db, parts, method, body } = c;
  if (c.access.planning === "lock") return c.fail(403, "FORBIDDEN", "Bạn không có quyền xem màn Kế hoạch & CCƯ");
  const edit = c.access.planning === "edit";
  const planId = parts[3] && parts[3] !== "current" ? decodeURIComponent(parts[3]) : "";
  const action = parts[4] || "";

  // GET /api/scm/plans/current?site=
  if (parts[3] === "current" && method === "GET") {
    const site = str(c.url.searchParams.get("site"), 10).toUpperCase();
    if (!SITE_KEYS.includes(site)) return c.reply({ success: true, needSite: true });
    const plan = await db.prepare("SELECT * FROM scm_allocation_plans WHERE site = ? ORDER BY week_start DESC LIMIT 1").bind(site).first<PlanRow>();
    if (!plan) return c.reply({ success: true, plan: null, suggestWeek: mondayOf(c.today), canEdit: edit });
    return c.reply({ success: true, ...(await planView(c, plan)) });
  }

  // POST /api/scm/plans { site }  (lập kế hoạch tuần hiện tại)
  if (!planId && method === "POST") {
    if (!edit) return c.fail(403, "FORBIDDEN", "Chỉ phòng Kế hoạch được lập kế hoạch");
    const site = str(body.site, 10).toUpperCase();
    if (!SITE_KEYS.includes(site)) return c.fail(400, "BAD_SITE", "Chọn một site cụ thể để lập kế hoạch");
    const week = mondayOf(c.today);
    const exists = await db.prepare("SELECT id FROM scm_allocation_plans WHERE site = ? AND week_start = ?").bind(site, week).first();
    if (exists) return c.fail(400, "EXISTS", "Site này đã có kế hoạch cho tuần hiện tại");
    const id = rid("plan");
    await db.prepare("INSERT INTO scm_allocation_plans (id, site, week_start, status, created_by, updated_by) VALUES (?, ?, ?, 'DRAFT', ?, ?)").bind(id, site, week, c.user.empCode, c.user.empCode).run();
    await c.audit("CREATE_PLAN", id, null, { site, week_start: week });
    return c.reply({ success: true, id });
  }

  const plan = planId ? await db.prepare("SELECT * FROM scm_allocation_plans WHERE id = ?").bind(planId).first<PlanRow>() : null;
  if (!plan) return c.fail(404, "NOT_FOUND", "Không tìm thấy kế hoạch");
  if (!edit) return c.fail(403, "FORBIDDEN", "Chỉ phòng Kế hoạch được sửa kế hoạch");
  const weeks = planWeeks(plan.week_start);

  // PUT /api/scm/plans/:id/lines  { orderId, week, plant, line }  (plant rỗng = bỏ phân bổ tuần đó)
  if (action === "lines" && method === "PUT") {
    if (plan.status !== "DRAFT") return c.fail(400, "NOT_DRAFT", "Chỉ sửa được kế hoạch ở trạng thái Nháp. Hãy mở lại nháp trước.");
    const orderId = str(body.orderId, 60);
    const week = str(body.week, 10);
    const plant = str(body.plant, 60);
    const line = str(body.line, 30);
    if (!weeks.includes(week)) return c.fail(400, "BAD_WEEK", "Tuần không thuộc kế hoạch 4 tuần này");
    const [order] = await c.loadOrders("ALL", orderId);
    if (!order || order.row.site !== plan.site) return c.fail(400, "BAD_ORDER", "Đơn không thuộc site của kế hoạch");
    const before = await db.prepare("SELECT plant, line FROM scm_allocation_lines WHERE plan_id = ? AND order_id = ? AND week_start = ?").bind(plan.id, orderId, week).first();
    if (!plant) {
      await db.prepare("DELETE FROM scm_allocation_lines WHERE plan_id = ? AND order_id = ? AND week_start = ?").bind(plan.id, orderId, week).run();
    } else {
      if (!line) return c.fail(400, "BAD_INPUT", "Cần nhập chuyền");
      await db
        .prepare("INSERT INTO scm_allocation_lines (plan_id, order_id, week_start, plant, line, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(plan_id, order_id, week_start) DO UPDATE SET plant = excluded.plant, line = excluded.line, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by")
        .bind(plan.id, orderId, week, plant, line, c.user.empCode, c.user.empCode)
        .run();
    }
    await logChange(c, plan.id, orderId, plant ? "SET_LINE" : "CLEAR_LINE", null, before, plant ? { week, plant, line } : null);
    await c.audit("PLAN_SET_LINE", `${plan.id}#${orderId}`, before, plant ? { week, plant, line } : null);
    return c.reply({ success: true, ...(await planView(c, plan)) });
  }

  // POST /api/scm/plans/:id/move { orderId, fromWeek, toWeek, reason }  (Dời tuần, bắt buộc lý do)
  if (action === "move" && method === "POST") {
    if (plan.status !== "DRAFT") return c.fail(400, "NOT_DRAFT", "Chỉ dời tuần khi kế hoạch ở trạng thái Nháp");
    const orderId = str(body.orderId, 60);
    const from = str(body.fromWeek, 10);
    const to = str(body.toWeek, 10);
    const reason = str(body.reason, 300);
    if (reason.length < 5) return c.fail(400, "REASON_REQUIRED", "Cần nhập lý do dời tuần (tối thiểu 5 ký tự)");
    if (!weeks.includes(from) || !weeks.includes(to) || from === to) return c.fail(400, "BAD_WEEK", "Tuần dời không hợp lệ");
    const cur = await db.prepare("SELECT plant, line FROM scm_allocation_lines WHERE plan_id = ? AND order_id = ? AND week_start = ?").bind(plan.id, orderId, from).first<{ plant: string; line: string }>();
    if (!cur) return c.fail(400, "NO_LINE", "Đơn chưa được phân bổ ở tuần cần dời");
    const busy = await db.prepare("SELECT 1 AS x FROM scm_allocation_lines WHERE plan_id = ? AND order_id = ? AND week_start = ?").bind(plan.id, orderId, to).first();
    if (busy) return c.fail(400, "TARGET_BUSY", "Tuần đích đã có phân bổ cho đơn này; mỗi đơn chỉ một nhà máy·chuyền mỗi tuần");
    await db.batch([
      db.prepare("DELETE FROM scm_allocation_lines WHERE plan_id = ? AND order_id = ? AND week_start = ?").bind(plan.id, orderId, from),
      db.prepare("INSERT INTO scm_allocation_lines (plan_id, order_id, week_start, plant, line, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(plan.id, orderId, to, cur.plant, cur.line, c.user.empCode, c.user.empCode),
    ]);
    await logChange(c, plan.id, orderId, "MOVE_WEEK", reason, { week: from, ...cur }, { week: to, ...cur });
    await c.audit("PLAN_MOVE_WEEK", `${plan.id}#${orderId}`, { week: from }, { week: to, reason });
    return c.reply({ success: true, ...(await planView(c, plan)) });
  }

  // PUT /api/scm/plans/:id/capacity { plant, line, week, capacity }
  if (action === "capacity" && method === "PUT") {
    const week = str(body.week, 10);
    const cap = int(body.capacity, -1);
    if (!weeks.includes(week) || cap < 0 || !str(body.plant) || !str(body.line)) return c.fail(400, "BAD_INPUT", "Cần nhà máy, chuyền, tuần và năng lực ≥ 0");
    await db
      .prepare("INSERT INTO scm_plant_capacity (plant, line, week_start, capacity, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(plant, line, week_start) DO UPDATE SET capacity = excluded.capacity, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by")
      .bind(str(body.plant, 60), str(body.line, 30), week, cap, c.user.empCode, c.user.empCode)
      .run();
    await c.audit("SET_CAPACITY", `${str(body.plant)}|${str(body.line)}|${week}`, null, { capacity: cap });
    return c.reply({ success: true, ...(await planView(c, plan)) });
  }

  // POST /api/scm/plans/:id/{submit|approve|reopen|issue}
  if (action in PLAN_TRANSITIONS && method === "POST") {
    const t = PLAN_TRANSITIONS[action];
    if (!t.from.includes(plan.status)) return c.fail(400, "BAD_STATE", `Không thể thực hiện khi kế hoạch đang "${PLAN_STATUS.find((p) => p.key === plan.status)?.label}"`);
    const view = await planView(c, plan);
    const at = nowVn();
    const stmts: D1Stmt[] = [];
    let completed = 0;
    let skipped: string[] = [];

    if (action === "approve" && !(c.scmUser.isHead || c.scmUser.bypass)) return c.fail(403, "FORBIDDEN", "Chỉ trưởng bộ phận Kế hoạch được phê duyệt");
    if (action === "reopen" && str(body.reason, 300).length < 5) return c.fail(400, "REASON_REQUIRED", "Cần nhập lý do mở lại nháp");
    if (action === "issue" && !view.canIssue.ok) return c.fail(400, "CANNOT_ISSUE", view.canIssue.reason || "Chưa thể ban hành");

    // Duyệt: xác nhận bước 3 cho đơn đã phân bổ. Ban hành: xác nhận bước 4. Chỉ khi bước phụ thuộc đã xong.
    const stepNo: StepNo | null = action === "approve" ? 3 : action === "issue" ? 4 : null;
    if (stepNo) {
      const lines = await loadLines(db, plan.id);
      const ids = Array.from(new Set(lines.map((l) => l.order_id)));
      const orders = (await c.loadOrders(plan.site)).filter((o) => ids.includes(o.row.id));
      for (const o of orders) {
        if (o.done[stepNo]) continue;
        const r = c.completeStep(o, stepNo, action === "approve" ? `Kế hoạch tuần ${fmtDMY(plan.week_start)} được duyệt` : `Ban hành KH312 tuần ${fmtDMY(plan.week_start)}`);
        if ("error" in r) {
          skipped.push(`${o.row.code}: ${r.error}`);
        } else {
          stmts.push(...r.stmts);
          completed++;
        }
      }
      skipped = skipped.slice(0, 20);
    }
    const col = action === "submit" ? "submitted" : action === "approve" ? "approved" : action === "issue" ? "issued" : null;
    stmts.push(
      col
        ? db.prepare(`UPDATE scm_allocation_plans SET status = ?, ${col}_by = ?, ${col}_at = ?, updated_at = ?, updated_by = ? WHERE id = ?`).bind(t.to, c.user.empCode, at, at, c.user.empCode, plan.id)
        : db.prepare("UPDATE scm_allocation_plans SET status = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(t.to, at, c.user.empCode, plan.id),
    );
    for (let i = 0; i < stmts.length; i += 80) await db.batch(stmts.slice(i, i + 80));
    await logChange(c, plan.id, null, action.toUpperCase(), str(body.reason, 300) || null, { status: plan.status }, { status: t.to, completedSteps: completed });
    await c.audit(`PLAN_${action.toUpperCase()}`, plan.id, { status: plan.status }, { status: t.to, completedSteps: completed, skipped });
    if (action === "submit") await c.notifyDept("KH", true, `Kế hoạch tuần ${fmtDMY(plan.week_start)} chờ duyệt`, `Site ${plan.site}: kế hoạch phân bổ 4 tuần đã được gửi duyệt.`);
    if (action === "issue") await c.notifyDept("MH", false, `Đã ban hành Kế hoạch 312 tuần ${fmtDMY(plan.week_start)}`, `Site ${plan.site}. Mua hàng gửi kế hoạch nhập 4 tuần cho Kho vào thứ Ba.`);
    const fresh = (await db.prepare("SELECT * FROM scm_allocation_plans WHERE id = ?").bind(plan.id).first<PlanRow>())!;
    return c.reply({ success: true, completedSteps: completed, skipped, ...(await planView(c, fresh)) });
  }

  // POST /api/scm/plans/:id/tier2  (chuyển kế hoạch Tầng 2 cho nhà máy)
  if (action === "tier2" && method === "POST") {
    if (plan.status !== "ISSUED") return c.fail(400, "NOT_ISSUED", "Chỉ chuyển Tầng 2 sau khi đã ban hành Kế hoạch 312");
    const at = nowVn();
    await db.batch([
      db.prepare("UPDATE scm_allocation_plans SET tier2_sent_at = ?, tier2_sent_by = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(at, c.user.empCode, at, c.user.empCode, plan.id),
      db.prepare("UPDATE scm_allocation_lines SET tier2_sent = 1, updated_at = ?, updated_by = ? WHERE plan_id = ?").bind(at, c.user.empCode, plan.id),
    ]);
    await logChange(c, plan.id, null, "TIER2", null, null, { at });
    await c.audit("PLAN_TIER2", plan.id, { tier2_sent_at: plan.tier2_sent_at }, { tier2_sent_at: at });
    const fresh = (await db.prepare("SELECT * FROM scm_allocation_plans WHERE id = ?").bind(plan.id).first<PlanRow>())!;
    return c.reply({ success: true, ...(await planView(c, fresh)) });
  }

  // POST /api/scm/plans/:id/roll  (Thêm tuần mới: luôn giữ đủ 4 tuần)
  if (action === "roll" && method === "POST") {
    const lines = await loadLines(db, plan.id);
    const r = rollForward(plan.week_start, lines);
    const exists = await db.prepare("SELECT id FROM scm_allocation_plans WHERE site = ? AND week_start = ?").bind(plan.site, r.weekStart).first();
    if (exists) return c.fail(400, "EXISTS", "Đã có kế hoạch cho tuần tiếp theo");
    const id = rid("plan");
    const stmts: D1Stmt[] = [db.prepare("INSERT INTO scm_allocation_plans (id, site, week_start, status, created_by, updated_by) VALUES (?, ?, ?, 'DRAFT', ?, ?)").bind(id, plan.site, r.weekStart, c.user.empCode, c.user.empCode)];
    for (const l of r.carried) {
      stmts.push(db.prepare("INSERT INTO scm_allocation_lines (plan_id, order_id, week_start, plant, line, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, l.order_id, l.week_start, l.plant, l.line, c.user.empCode, c.user.empCode));
    }
    await db.batch(stmts);
    await logChange(c, id, null, "ROLL_FORWARD", null, { from: plan.week_start, released: r.released.length }, { week_start: r.weekStart, carried: r.carried.length });
    await c.audit("PLAN_ROLL_FORWARD", id, { from_plan: plan.id }, { week_start: r.weekStart, carried: r.carried.length, released_to_production: r.released.length });
    const fresh = (await db.prepare("SELECT * FROM scm_allocation_plans WHERE id = ?").bind(id).first<PlanRow>())!;
    return c.reply({ success: true, ...(await planView(c, fresh)) });
  }

  return c.fail(404, "NOT_FOUND", "API kế hoạch không tồn tại");
}

// ─── Mua hàng ────────────────────────────────────────────────────────────────

interface PoRow {
  id: string;
  po_no: string | null;
  order_id: string;
  activated_at: string | null;
  issued_at: string | null;
}

async function handoverMap(db: D1, orderIds: string[]) {
  const map = new Map<string, Record<string, string | null>>();
  for (let i = 0; i < orderIds.length; i += 90) {
    const ids = orderIds.slice(i, i + 90);
    const { results } = await db.prepare(`SELECT order_id, item, delivered_at FROM scm_handover_items WHERE order_id IN (${ids.map(() => "?").join(", ")})`).bind(...ids).all<{ order_id: string; item: string; delivered_at: string | null }>();
    for (const r of results) {
      const m = map.get(r.order_id) ?? {};
      m[r.item] = r.delivered_at;
      map.set(r.order_id, m);
    }
  }
  return map;
}

async function poMap(db: D1) {
  const { results } = await db.prepare("SELECT id, po_no, order_id, activated_at, issued_at FROM scm_purchase_orders").all<PoRow>();
  return new Map(results.map((p) => [p.order_id, p]));
}

function conditionRow(c: Step2Ctx, o: LoadedOrder, handover: Record<string, string | null>, po: PoRow | undefined) {
  const cond = orderConditions(
    { handover, noSilent: Number(o.row.no_silent) === 1, noSilentAt: o.done[5] ?? null, activatedAt: po?.activated_at, issuedAt: po?.issued_at ?? o.done[6] ?? null },
    c.today,
    c.settings,
  );
  return {
    id: o.row.id,
    code: o.row.code,
    plant: o.row.plant,
    shipDate: o.row.ship_date,
    qty: Number(o.row.qty) || 0,
    supplierLeadTime: Number(o.row.supplier_lead_time),
    transportDays: Number(o.row.transport_days),
    infoDeadline: o.view.infoDeadline,
    poNo: po?.po_no ?? null,
    activatedAt: po?.activated_at ?? null,
    issuedAt: po?.issued_at ?? o.done[6] ?? null,
    step2Done: Boolean(o.done[2]),
    bottleneck: o.row.bottleneck_note ?? null,
    ...cond,
  };
}

async function purchasing(c: Step2Ctx): Promise<Response> {
  const { db, parts, method, body } = c;
  const sub = parts[3] || "";
  const canView = c.access.purchasing !== "lock";
  const edit = c.access.purchasing === "edit";
  const site = str(c.url.searchParams.get("site") || body.site || "ALL", 10).toUpperCase();

  // Kho/QC xác nhận sự cố đã xử lý: được làm từ màn của Kho/QC (Bước 3), không cần quyền màn Mua hàng
  if (sub === "incidents" && parts[5] === "confirm" && method === "POST") {
    if (c.access.warehouse !== "edit" && c.access.kdcnqc !== "edit") return c.fail(403, "FORBIDDEN", "Chỉ Kho hoặc QC được xác nhận sự cố");
    const inc = await db.prepare("SELECT * FROM scm_incidents WHERE id = ?").bind(decodeURIComponent(parts[4])).first<{ id: string; stage: string; confirmed_at: string | null }>();
    if (!inc) return c.fail(404, "NOT_FOUND", "Không tìm thấy sự cố");
    if (inc.stage !== "AWAIT_CONFIRM") return c.fail(400, "BAD_STAGE", "Sự cố chưa ở giai đoạn chờ Kho/QC xác nhận");
    const at = nowVn();
    await db.prepare("UPDATE scm_incidents SET confirmed_by = ?, confirmed_at = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(c.user.empCode, at, at, c.user.empCode, inc.id).run();
    await c.audit("INCIDENT_CONFIRM", inc.id, { confirmed_at: null }, { confirmed_at: at });
    return c.reply({ success: true });
  }

  if (!canView) return c.fail(403, "FORBIDDEN", "Bạn không có quyền xem màn Mua hàng");
  const needEdit = () => (edit ? null : c.fail(403, "FORBIDDEN", "Chỉ phòng Mua hàng được thao tác"));

  // GET /api/scm/purchasing/conditions?site&q&status&page&pageSize
  if (sub === "conditions" && method === "GET") {
    const q = str(c.url.searchParams.get("q"), 60).toUpperCase();
    const status = str(c.url.searchParams.get("status"), 20);
    const page = Math.max(1, int(c.url.searchParams.get("page"), 1));
    const pageSize = Math.min(50, Math.max(1, int(c.url.searchParams.get("pageSize"), 10)));
    const orders = (await c.loadOrders(site)).filter((o) => o.view.state !== "complete" || o.done[6]);
    const hm = await handoverMap(db, orders.map((o) => o.row.id));
    const pm = await poMap(db);
    let rows = orders.map((o) => conditionRow(c, o, hm.get(o.row.id) ?? {}, pm.get(o.row.id)));
    if (q) rows = rows.filter((r) => r.code.toUpperCase().includes(q) || String(r.plant || "").toUpperCase().includes(q) || String(r.poNo || "").includes(q));
    const counts = {
      ready: rows.filter((r) => r.status === "ready" || r.status === "activated").length,
      missing: rows.filter((r) => r.status === "missing").length,
      issued: rows.filter((r) => r.status === "issued").length,
    };
    if (status === "ready") rows = rows.filter((r) => r.status === "ready" || r.status === "activated");
    else if (status === "missing") rows = rows.filter((r) => r.status === "missing");
    else if (status === "issued") rows = rows.filter((r) => r.status === "issued");
    rows.sort((a, b) => a.shipDate.localeCompare(b.shipDate));
    return c.reply({ success: true, items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize, counts });
  }

  // /api/scm/purchasing/orders/:id/{activate|issue-po|report-bottleneck|lead-time|eta}
  if (sub === "orders" && parts[4]) {
    const deny = needEdit();
    if (deny) return deny;
    const [order] = await c.loadOrders("ALL", decodeURIComponent(parts[4]));
    if (!order) return c.fail(404, "NOT_FOUND", "Không tìm thấy đơn hàng");
    const action = parts[5];
    const hm = await handoverMap(db, [order.row.id]);
    const po = (await poMap(db)).get(order.row.id);
    const row = conditionRow(c, order, hm.get(order.row.id) ?? {}, po);
    const at = nowVn();

    if (action === "activate" && method === "POST") {
      if (row.status === "issued") return c.fail(400, "ISSUED", "Đơn đã phát hành PO");
      if (row.missing.length) return c.fail(400, "MISSING", `Chưa đủ điều kiện: thiếu ${row.missing.map((m) => `${m.label} (${m.dept})`).join(", ")}`);
      if (po?.activated_at) return c.fail(400, "ACTIVATED", "Đơn đã được kích hoạt đặt hàng");
      await db
        .prepare("INSERT INTO scm_purchase_orders (id, order_id, activated_at, activated_by, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(order_id) DO UPDATE SET activated_at = excluded.activated_at, activated_by = excluded.activated_by, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by")
        .bind(rid("po"), order.row.id, at, c.user.empCode, c.user.empCode, c.user.empCode)
        .run();
      await db.prepare("UPDATE scm_orders SET bottleneck_note = NULL, bottleneck_by = NULL, bottleneck_at = NULL WHERE id = ?").bind(order.row.id).run();
      await c.audit("ACTIVATE_ORDER", order.row.id, { activated_at: null }, { activated_at: at });
      return c.reply({ success: true });
    }

    if (action === "issue-po" && method === "POST") {
      if (!po?.activated_at) return c.fail(400, "NOT_ACTIVATED", "Hãy kích hoạt đặt hàng trước khi phát hành PO");
      if (po.issued_at) return c.fail(400, "ISSUED", `Đơn đã có PO ${po.po_no}`);
      const step = c.completeStep(order, 6, "Phát hành PO");
      if ("error" in step) return c.fail(400, order.done[6] ? "ALREADY_DONE" : "DEPENDENCY", step.error);
      const seq = await db.prepare("SELECT COUNT(*) AS n FROM scm_purchase_orders WHERE po_no LIKE ?").bind(`${poNumber(0, c.today).slice(0, 8)}%`).first<{ n: number }>();
      const poNo = poNumber((seq?.n ?? 0) + 1, c.today);
      const arrival = expectedArrival(at, Number(order.row.supplier_lead_time), Number(order.row.transport_days), order.row.eta);
      await db.batch([
        db.prepare("UPDATE scm_purchase_orders SET po_no = ?, issued_at = ?, issued_by = ?, updated_at = ?, updated_by = ? WHERE order_id = ?").bind(poNo, at, c.user.empCode, at, c.user.empCode, order.row.id),
        db.prepare("INSERT INTO scm_inbound_plan (id, po_id, order_id, eta, week_start, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(rid("inb"), po.id, order.row.id, arrival, arrival ? mondayOf(arrival) : null, c.user.empCode, c.user.empCode),
        ...step.stmts,
      ]);
      await c.audit("ISSUE_PO", order.row.id, { po_no: null }, { po_no: poNo, eta: arrival });
      return c.reply({ success: true, poNo, eta: arrival });
    }

    if (action === "report-bottleneck" && method === "POST") {
      if (!row.missing.length) return c.fail(400, "NOTHING_MISSING", "Đơn đã đủ điều kiện, không có điểm nghẽn");
      const note = `Mua hàng báo thiếu: ${row.missing.map((m) => `${m.label} (${m.dept})`).join(", ")}`;
      await db.prepare("UPDATE scm_orders SET bottleneck_note = ?, bottleneck_by = ?, bottleneck_at = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(note, c.user.empCode, at, at, c.user.empCode, order.row.id).run();
      let sent = 0;
      if (row.missing.some((m) => m.dept === "Kinh doanh")) sent += await c.notifyDept("KDCNQC", false, `Đơn ${order.row.code} thiếu thông tin đặt hàng`, note);
      if (row.missing.some((m) => m.dept === "Kế hoạch")) sent += await c.notifyDept("KH", false, `Đơn ${order.row.code} chưa có No Silent`, note);
      await c.audit("REPORT_BOTTLENECK", order.row.id, { bottleneck_note: order.row.bottleneck_note ?? null }, { bottleneck_note: note });
      return c.reply({ success: true, note, notified: sent });
    }

    if (action === "lead-time" && method === "PUT") {
      const lead = int(body.supplier_lead_time, -1);
      const transport = int(body.transport_days, -1);
      if (lead < 0 || transport < 0) return c.fail(400, "BAD_INPUT", "Lead time và vận chuyển phải là số ngày ≥ 0");
      const before = { supplier_lead_time: order.row.supplier_lead_time, transport_days: order.row.transport_days, info_deadline: order.view.infoDeadline };
      await db.prepare("UPDATE scm_orders SET supplier_lead_time = ?, transport_days = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(lead, transport, at, c.user.empCode, order.row.id).run();
      const [fresh] = await c.loadOrders("ALL", order.row.id);
      await db.prepare("UPDATE scm_orders SET info_deadline = ? WHERE id = ?").bind(fresh.view.infoDeadline, order.row.id).run();
      await c.audit("APPLY_DEADLINE", order.row.id, before, { supplier_lead_time: lead, transport_days: transport, info_deadline: fresh.view.infoDeadline });
      return c.reply({ success: true, infoDeadline: fresh.view.infoDeadline });
    }

    if (action === "eta" && method === "PUT") {
      const eta = str(body.eta, 10);
      const reason = str(body.reason, 300);
      if (!isDate(eta)) return c.fail(400, "BAD_INPUT", "Ngày về mới không hợp lệ (yyyy-mm-dd)");
      if (reason.length < 3) return c.fail(400, "REASON_REQUIRED", "Cần ghi lý do NCC đổi ngày");
      const prev = order.row.eta || expectedArrival(po?.issued_at ?? null, Number(order.row.supplier_lead_time), Number(order.row.transport_days), null);
      await db.batch([
        db.prepare("UPDATE scm_orders SET eta = ?, eta_changed_from = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(eta, prev, at, c.user.empCode, order.row.id),
        db.prepare("UPDATE scm_inbound_plan SET eta_changed_from = eta, eta = ?, week_start = ?, updated_at = ?, updated_by = ? WHERE order_id = ?").bind(eta, mondayOf(eta), at, c.user.empCode, order.row.id),
      ]);
      const inspect = order.row.origin === "NOI_DIA" ? c.settings.inspect_domestic_days : c.settings.inspect_import_days;
      const impact = etaImpact(eta, inspect, order.view.steps[9].due);
      await c.audit("CHANGE_ETA", order.row.id, { eta: prev }, { eta, reason, impact });
      if (impact.late) await c.notifyDept("KH", false, `Đơn ${order.row.code}: NCC đổi ngày về`, `Ngày về ${fmtDMY(eta)}, kiểm xong ${fmtDMY(impact.readyBy)}, trễ ${-impact.slackDays} ngày so với hạn cấp vật tư ${fmtDMY(order.view.steps[9].due)}. Lý do: ${reason}`);
      return c.reply({ success: true, impact, supplyDeadline: order.view.steps[9].due });
    }
    return c.fail(404, "NOT_FOUND", "Thao tác không tồn tại");
  }

  // GET /api/scm/purchasing/inbound?site  (kế hoạch nhập 8 tuần liên tục, tự tổng hợp từ PO, cập nhật hằng ngày)
  if (sub === "inbound" && !parts[4] && method === "GET") {
    const start = mondayOf(c.today);
    const end = addDays(start, SYNC_WEEKS * 7);
    const orders = await c.loadOrders(site);
    const byId = new Map(orders.map((o) => [o.row.id, o]));
    const { results } = await db.prepare("SELECT i.*, p.po_no FROM scm_inbound_plan i LEFT JOIN scm_purchase_orders p ON p.id = i.po_id ORDER BY i.eta").all<{ id: string; order_id: string; eta: string | null; eta_changed_from: string | null; sent_to_wh_at: string | null; po_no: string }>();
    const rows = results
      .filter((r) => byId.has(r.order_id))
      .map((r) => {
        const o = byId.get(r.order_id)!;
        const inspect = o.row.origin === "NOI_DIA" ? c.settings.inspect_domestic_days : c.settings.inspect_import_days;
        const impact = r.eta ? etaImpact(r.eta, inspect, o.view.steps[9].due) : null;
        return { id: r.id, orderId: o.row.id, code: o.row.code, poNo: r.po_no, eta: r.eta, etaChangedFrom: r.eta_changed_from, sentAt: r.sent_to_wh_at, arrived: Boolean(o.done[8]), supplyDeadline: o.view.steps[9].due, impact, week: r.eta ? mondayOf(r.eta) : null };
      })
      .filter((r) => !r.arrived && r.eta && r.eta < end);
    // "Chưa gửi" = chưa gửi bản cập nhật của hôm nay (kế hoạch nhập gửi Kho hằng ngày)
    const weeks = Array.from({ length: SYNC_WEEKS }, (_, i) => addDays(start, i * 7));
    return c.reply({ success: true, weeks, rows, unsent: rows.filter((r) => !r.sentAt || String(r.sentAt).slice(0, 10) < c.today).length });
  }

  // POST /api/scm/purchasing/inbound/send { site }  (thứ Ba: gửi kế hoạch nhập cho Kho, xác nhận bước 7)
  if (sub === "inbound" && parts[4] === "send" && method === "POST") {
    const deny = needEdit();
    if (deny) return deny;
    const orders = await c.loadOrders(site);
    const ids = orders.map((o) => o.row.id);
    if (!ids.length) return c.fail(400, "EMPTY", "Không có đơn nào trong site đã chọn");
    const at = nowVn();
    const stmts: D1Stmt[] = [];
    let completed = 0;
    const skipped: string[] = [];
    for (const o of orders) {
      if (o.done[7] || o.view.state === "complete") continue;
      const r = c.completeStep(o, 7, "Gửi kế hoạch nhập 8 tuần cho Kho");
      if ("error" in r) {
        if (skipped.length < 20) skipped.push(`${o.row.code}: ${r.error}`);
      } else {
        stmts.push(...r.stmts);
        completed++;
      }
    }
    for (let i = 0; i < ids.length; i += 90) {
      const chunk = ids.slice(i, i + 90);
      stmts.push(db.prepare(`UPDATE scm_inbound_plan SET sent_to_wh_at = ?, sent_by = ? WHERE order_id IN (${chunk.map(() => "?").join(", ")})`).bind(at, c.user.empCode, ...chunk));
    }
    for (let i = 0; i < stmts.length; i += 80) await db.batch(stmts.slice(i, i + 80));
    const sent = await c.notifyDept("KHO", false, `Kế hoạch dự kiến nhập hàng 8 tuần ngày ${fmtDMY(c.today)}`, `Mua hàng đã gửi kế hoạch nhập 8 tuần liên tục (site ${site}). Vui lòng chuẩn bị tiếp nhận.`);
    await c.audit("SEND_INBOUND_PLAN", site, null, { completedSteps: completed, skipped, notified: sent });
    return c.reply({ success: true, completedSteps: completed, skipped, notified: sent });
  }

  // Sự cố vật tư không đạt
  if (sub === "incidents") {
    const incId = parts[4] ? decodeURIComponent(parts[4]) : "";
    if (!incId && method === "GET") {
      const status = str(c.url.searchParams.get("status"), 10);
      const orders = await c.loadOrders(site);
      const byId = new Map(orders.map((o) => [o.row.id, o]));
      const { results } = await db.prepare("SELECT * FROM scm_incidents ORDER BY opened_at DESC LIMIT 300").all<Record<string, string | number | null>>();
      const items = results
        .filter((r) => byId.has(String(r.order_id)))
        .filter((r) => (status === "closed" ? r.stage === "CLOSED" : status === "open" ? r.stage !== "CLOSED" : true))
        .map((r) => {
          const day = incidentDay(String(r.opened_at), r.closed_at ? String(r.closed_at).slice(0, 10) : c.today);
          return { ...r, orderCode: byId.get(String(r.order_id))!.row.code, day, of: c.settings.incident_days, canEscalate: r.stage !== "CLOSED" && canEscalateIncident(day, c.settings), overdue: day > c.settings.incident_days };
        });
      return c.reply({ success: true, items, plans: INCIDENT_PLANS });
    }
    const deny = needEdit();
    if (deny) return deny;
    if (!incId && method === "POST") {
      const orderId = str(body.orderId, 60);
      const [order] = await c.loadOrders("ALL", orderId);
      if (!order) return c.fail(400, "BAD_ORDER", "Không tìm thấy đơn hàng");
      const material = str(body.material, 120);
      const issue = str(body.issue, 500);
      if (!material || issue.length < 5) return c.fail(400, "BAD_INPUT", "Cần nhập vật tư và mô tả sự cố (tối thiểu 5 ký tự)");
      const po = (await poMap(db)).get(orderId);
      const id = rid("inc");
      await db.prepare("INSERT INTO scm_incidents (id, order_id, po_id, material, issue, stage, opened_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, 'CONTACT', ?, ?, ?)").bind(id, orderId, po?.id ?? null, material, issue, nowVn(), c.user.empCode, c.user.empCode).run();
      await c.audit("CREATE_INCIDENT", id, null, { orderId, material, issue });
      return c.reply({ success: true, id });
    }
    const inc = await db.prepare("SELECT * FROM scm_incidents WHERE id = ?").bind(incId).first<{ id: string; stage: IncidentStage; plan: string | null; confirmed_at: string | null; opened_at: string; order_id: string; escalation: number }>();
    if (!inc) return c.fail(404, "NOT_FOUND", "Không tìm thấy sự cố");
    const at = nowVn();
    if (!parts[5] && method === "PUT") {
      const plan = str(body.plan, 20);
      if (plan && !(plan in INCIDENT_PLANS)) return c.fail(400, "BAD_PLAN", "Phương án không hợp lệ");
      if (inc.stage === "CLOSED") return c.fail(400, "CLOSED", "Sự cố đã đóng");
      await db.prepare("UPDATE scm_incidents SET plan = COALESCE(?, plan), note = COALESCE(?, note), updated_at = ?, updated_by = ? WHERE id = ?").bind(plan || null, str(body.note, 500) || null, at, c.user.empCode, inc.id).run();
      await c.audit("UPDATE_INCIDENT", inc.id, { plan: inc.plan }, { plan: plan || inc.plan, note: str(body.note, 500) });
      return c.reply({ success: true });
    }
    if (parts[5] === "next" && method === "POST") {
      const r = nextIncidentStage(inc.stage, { plan: inc.plan, confirmed: Boolean(inc.confirmed_at) });
      if (!r.next) return c.fail(400, "BAD_STAGE", r.error || "Không chuyển được giai đoạn");
      if (r.next === "CLOSED") {
        await db.prepare("UPDATE scm_incidents SET stage = ?, closed_at = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(r.next, at, at, c.user.empCode, inc.id).run();
      } else {
        await db.prepare("UPDATE scm_incidents SET stage = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(r.next, at, c.user.empCode, inc.id).run();
      }
      if (r.next === "AWAIT_CONFIRM") {
        await c.notifyDept("KHO", false, "Sự cố NCC chờ xác nhận", `Sự cố ${inc.id}: Mua hàng đã xử lý theo phương án ${INCIDENT_PLANS[inc.plan as keyof typeof INCIDENT_PLANS]}, chờ Kho/QC xác nhận.`);
      }
      await c.audit("INCIDENT_STAGE", inc.id, { stage: inc.stage }, { stage: r.next, days: incidentDay(inc.opened_at, c.today) });
      return c.reply({ success: true, stage: r.next });
    }
    if (parts[5] === "escalate" && method === "POST") {
      const day = incidentDay(inc.opened_at, c.today);
      if (!canEscalateIncident(day, c.settings)) return c.fail(400, "TOO_EARLY", `Chỉ leo thang từ ngày ${c.settings.incident_escalate_day}`);
      const toBdh = day > c.settings.incident_days;
      const sent = await c.notifyDept(toBdh ? "BDH" : "MH", !toBdh, `Leo thang sự cố NCC ${inc.id}`, `Sự cố đã sang ngày ${day}/${c.settings.incident_days}.`);
      await db.prepare("UPDATE scm_incidents SET escalation = ?, escalated_at = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(toBdh ? 3 : 2, at, at, c.user.empCode, inc.id).run();
      await c.audit("ESCALATE_INCIDENT", inc.id, { escalation: inc.escalation }, { escalation: toBdh ? 3 : 2, day, notified: sent });
      return c.reply({ success: true, level: toBdh ? 3 : 2, notified: sent });
    }
  }

  return c.fail(404, "NOT_FOUND", "API Mua hàng không tồn tại");
}

// ─── Form Mua hàng (R2) ──────────────────────────────────────────────────────

async function forms(c: Step2Ctx): Promise<Response> {
  const { db, parts, method } = c;
  if (c.access.purchasing === "lock") return c.fail(403, "FORBIDDEN", "Bạn không có quyền xem form Mua hàng");
  const formId = parts[3] ? decodeURIComponent(parts[3]) : "";

  if (!formId && method === "GET") {
    const { results } = await db.prepare("SELECT id, dept, file_name, size, content_type, uploaded_by, uploaded_at FROM scm_uploaded_forms ORDER BY uploaded_at DESC LIMIT 100").all();
    return c.reply({ success: true, items: results });
  }

  if (!formId && method === "POST") {
    if (c.access.purchasing !== "edit") return c.fail(403, "FORBIDDEN", "Chỉ phòng Mua hàng được tải form lên");
    if (!c.bucket) return c.fail(500, "NO_STORAGE", "Chưa cấu hình kho lưu file (R2)");
    const form = await c.request.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || typeof file === "string") return c.fail(400, "NO_FILE", "Chưa chọn file");
    const f = file as File;
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (!FORM_EXTENSIONS.includes(ext)) return c.fail(400, "BAD_TYPE", `Chỉ nhận file ${FORM_EXTENSIONS.join(", ")}`);
    if (f.size > FORM_MAX_BYTES) return c.fail(400, "TOO_LARGE", "File vượt quá 10MB");
    const id = rid("frm");
    // Bỏ ký tự cấm trong tên file/đường dẫn, giữ chữ có dấu tiếng Việt
    const safeName = f.name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 120);
    const key = `scm-forms/mua-hang/${c.today}/${id}-${safeName}`;
    const bytes = await f.arrayBuffer();
    await c.bucket.put(key, bytes, { httpMetadata: { contentType: f.type || "application/octet-stream" } });
    const at = nowVn();
    await db.prepare("INSERT INTO scm_uploaded_forms (id, dept, file_key, file_name, size, content_type, uploaded_by, uploaded_at, created_by, updated_by) VALUES (?, 'MH', ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, key, safeName, f.size, f.type || null, c.user.empCode, at, c.user.empCode, c.user.empCode)
      .run();
    const parsed = parseProcurementForm(safeName, bytes);
    await c.audit("UPLOAD_FORM", id, null, { file_name: safeName, size: f.size });
    return c.reply({ success: true, id, parse: parsed });
  }

  if (formId && parts[4] === "download" && method === "GET") {
    const row = await db.prepare("SELECT file_key, file_name, content_type FROM scm_uploaded_forms WHERE id = ?").bind(formId).first<{ file_key: string; file_name: string; content_type: string | null }>();
    if (!row || !c.bucket) return c.fail(404, "NOT_FOUND", "Không tìm thấy file");
    const obj = await c.bucket.get(row.file_key);
    if (!obj) return c.fail(404, "NOT_FOUND", "File không còn trên kho lưu trữ");
    return new Response(obj.body, {
      headers: {
        "Content-Type": row.content_type || obj.httpMetadata?.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name)}`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  return c.fail(404, "NOT_FOUND", "API form không tồn tại");
}

// ─── Cron: sự cố NCC quá hạn ─────────────────────────────────────────────────

/** Sự cố quá incident_days: báo trưởng Mua hàng; quá thêm escalate_l3_days: báo Ban điều hành. Mỗi ngày một lần. */
export async function escalateIncidents(db: D1, s: ScmSettings, today: string, send: (dept: ScmDept, heads: boolean, title: string, message: string) => Promise<number>): Promise<number> {
  const { results } = await db.prepare("SELECT id, opened_at, escalation, escalated_at FROM scm_incidents WHERE stage <> 'CLOSED'").all<{ id: string; opened_at: string; escalation: number; escalated_at: string | null }>();
  let sent = 0;
  for (const r of results) {
    const day = incidentDay(r.opened_at, today);
    if (day <= s.incident_days) continue;
    const level = day > s.incident_days + s.escalate_l3_days ? 3 : 2;
    if (String(r.escalated_at || "").slice(0, 10) === today && Number(r.escalation) >= level) continue;
    sent += await send(level === 3 ? "BDH" : "MH", level === 2, `Sự cố NCC ${r.id} quá hạn`, `Sự cố đã sang ngày ${day}, quá giới hạn ${s.incident_days} ngày.`);
    await db.prepare("UPDATE scm_incidents SET escalation = ?, escalated_at = ? WHERE id = ?").bind(level, nowVn(), r.id).run();
  }
  return sent;
}
