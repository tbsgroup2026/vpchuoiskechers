// API Bước 3 của module SCM: Kế hoạch sản xuất theo ngày (/api/scm/khsx*).
// KHSX = ngày lên chuyền may và ngày lên chuyền gò của từng đơn; là căn cứ tính mốc đồng bộ vật tư
// (may: trước SYNC_SEW_DAYS ngày, gò: trước SYNC_LAST_DAYS ngày). Gọi từ handleScmApi (server.ts).
import { SITES, SYNC_LAST_DAYS, SYNC_SEW_DAYS, SYNC_STAGES, SYNC_STREAMS, SYNC_WEEKS } from "./config";
import { addDays } from "./engine";
import type { Step2Ctx } from "./server-step2";
import type { D1 } from "./server";

const SITE_KEYS = SITES.map((s) => s.key as string);
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
/** Nhận yyyy-mm-dd hoặc dd/mm/yyyy; rỗng → null; sai → undefined */
function parseDay(v: unknown): string | null | undefined {
  const s = str(v, 20);
  if (!s) return null;
  if (isDate(s)) return s;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return isDate(iso) ? iso : undefined;
  }
  return undefined;
}

export interface KhsxRow {
  orderId: string;
  code: string;
  plant: string | null;
  line: string | null;
  style: string | null;
  qty: number;
  shipDate: string;
  sewStart: string | null;
  lastStart: string | null;
  note: string | null;
  suggestSewWeek: string | null;
  syncDueSew: string | null;
  syncDueLast: string | null;
  warnings: string[];
  updatedBy: string | null;
  updatedAt: string | null;
}

export function khsxWarnings(r: { sewStart: string | null; lastStart: string | null; shipDate: string }): string[] {
  const w: string[] = [];
  if (!r.sewStart) w.push("Chưa có ngày may");
  if (!r.lastStart) w.push("Chưa có ngày gò");
  if (r.sewStart && r.lastStart && r.lastStart < r.sewStart) w.push("Ngày gò trước ngày may");
  if (r.lastStart && r.lastStart > r.shipDate) w.push("Ngày gò sau ngày xuất hàng");
  else if (r.sewStart && r.sewStart > r.shipDate) w.push("Ngày may sau ngày xuất hàng");
  return w;
}

export async function handleScmStep3(c: Step2Ctx): Promise<Response | null> {
  if (c.parts[2] === "khsx") return khsx(c);
  if (c.parts[2] === "sync") return sync(c);
  return null;
}

async function khsx(c: Step2Ctx): Promise<Response> {
  const { db, parts, method, body } = c;
  if (c.access.planning === "lock") return c.fail(403, "FORBIDDEN", "Bạn không có quyền xem Kế hoạch sản xuất");
  const edit = c.access.planning === "edit";

  // GET /api/scm/khsx?site=  — đơn đang theo dõi (chưa lưu trữ, xuất hàng từ 7 ngày trước trở đi)
  if (!parts[3] && method === "GET") {
    const site = str(c.url.searchParams.get("site"), 10).toUpperCase();
    if (!SITE_KEYS.includes(site)) return c.reply({ success: true, needSite: true });
    const fromShip = addDays(c.today, -7);
    const { results } = await db
      .prepare(
        `SELECT o.id, o.code, o.plant, o.line, o.style, o.qty, o.ship_date,
                s.sew_start, s.last_start, s.note, s.updated_by, s.updated_at,
                (SELECT MIN(l.week_start) FROM scm_allocation_lines l JOIN scm_allocation_plans p ON p.id = l.plan_id WHERE l.order_id = o.id AND p.site = o.site) AS first_week
         FROM scm_orders o LEFT JOIN scm_production_schedule s ON s.order_id = o.id
         WHERE o.site = ? AND o.archived = 0 AND o.ship_date >= ?
         ORDER BY COALESCE(s.sew_start, o.ship_date), o.code
         LIMIT 1000`
      )
      .bind(site, fromShip)
      .all<Record<string, unknown>>();
    const rows: KhsxRow[] = (results || []).map((r) => {
      const sewStart = (r.sew_start as string) || null;
      const lastStart = (r.last_start as string) || null;
      const shipDate = String(r.ship_date);
      return {
        orderId: String(r.id),
        code: String(r.code),
        plant: (r.plant as string) || null,
        line: (r.line as string) || null,
        style: (r.style as string) || null,
        qty: Number(r.qty) || 0,
        shipDate,
        sewStart,
        lastStart,
        note: (r.note as string) || null,
        suggestSewWeek: sewStart ? null : ((r.first_week as string) || null),
        syncDueSew: sewStart ? addDays(sewStart, -SYNC_SEW_DAYS) : null,
        syncDueLast: lastStart ? addDays(lastStart, -SYNC_LAST_DAYS) : null,
        warnings: khsxWarnings({ sewStart, lastStart, shipDate }),
        updatedBy: (r.updated_by as string) || null,
        updatedAt: (r.updated_at as string) || null,
      };
    });
    const missing = rows.filter((r) => !r.sewStart || !r.lastStart).length;
    return c.reply({ success: true, site, today: c.today, rows, missing, canEdit: edit, syncSewDays: SYNC_SEW_DAYS, syncLastDays: SYNC_LAST_DAYS });
  }

  if (!edit) return c.fail(403, "FORBIDDEN", "Chỉ Kế hoạch được cập nhật KHSX");

  // POST /api/scm/khsx/import {site, rows:[{code, sewStart, lastStart, note?}]}
  if (parts[3] === "import" && method === "POST") {
    const site = str(body.site, 10).toUpperCase();
    if (!SITE_KEYS.includes(site)) return c.fail(400, "BAD_SITE", "Chưa chọn nhà máy");
    const input = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
    if (input.length === 0) return c.fail(400, "EMPTY", "File không có dòng dữ liệu");
    if (input.length > 3000) return c.fail(400, "TOO_MANY", "Tối đa 3.000 dòng mỗi lần nhập");
    const { results: orders } = await db.prepare("SELECT id, code FROM scm_orders WHERE site = ? AND archived = 0").bind(site).all<{ id: string; code: string }>();
    const byCode = new Map((orders || []).map((o) => [o.code.trim().toUpperCase(), o.id]));
    const notFound: string[] = [];
    const invalid: { code: string; reason: string }[] = [];
    const stmts = [];
    for (const r of input) {
      const code = str(r.code, 60).toUpperCase();
      if (!code) continue;
      const id = byCode.get(code);
      if (!id) { notFound.push(code); continue; }
      const sew = parseDay(r.sewStart), last = parseDay(r.lastStart);
      if (sew === undefined || last === undefined) { invalid.push({ code, reason: "Ngày không đúng định dạng (dd/mm/yyyy)" }); continue; }
      stmts.push(
        db.prepare(
          `INSERT INTO scm_production_schedule (order_id, sew_start, last_start, note, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(order_id) DO UPDATE SET sew_start = excluded.sew_start, last_start = excluded.last_start, note = COALESCE(excluded.note, note), updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by`
        ).bind(id, sew, last, str(r.note, 500) || null, c.user.empCode, c.user.empCode)
      );
    }
    for (let i = 0; i < stmts.length; i += 100) await db.batch(stmts.slice(i, i + 100));
    await c.audit("KHSX_IMPORT", site, null, { updated: stmts.length, notFound: notFound.length, invalid: invalid.length });
    return c.reply({ success: true, updated: stmts.length, notFound: notFound.slice(0, 50), notFoundCount: notFound.length, invalid: invalid.slice(0, 50) });
  }

  // PUT /api/scm/khsx/:orderId {sewStart, lastStart, note}
  if (parts[3] && method === "PUT") {
    const orderId = decodeURIComponent(parts[3]);
    const order = await db.prepare("SELECT id, code, ship_date FROM scm_orders WHERE id = ?").bind(orderId).first<{ id: string; code: string; ship_date: string }>();
    if (!order) return c.fail(404, "NOT_FOUND", "Không tìm thấy đơn hàng");
    const sew = parseDay(body.sewStart), last = parseDay(body.lastStart);
    if (sew === undefined || last === undefined) return c.fail(400, "BAD_INPUT", "Ngày không hợp lệ (dd/mm/yyyy)");
    const before = await db.prepare("SELECT sew_start, last_start, note FROM scm_production_schedule WHERE order_id = ?").bind(orderId).first();
    await db
      .prepare(
        `INSERT INTO scm_production_schedule (order_id, sew_start, last_start, note, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(order_id) DO UPDATE SET sew_start = excluded.sew_start, last_start = excluded.last_start, note = excluded.note, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by`
      )
      .bind(orderId, sew, last, str(body.note, 500) || null, c.user.empCode, c.user.empCode)
      .run();
    await c.audit("KHSX_UPDATE", orderId, before, { sew_start: sew, last_start: last });
    return c.reply({
      success: true,
      warnings: khsxWarnings({ sewStart: sew, lastStart: last, shipDate: order.ship_date }),
      syncDueSew: sew ? addDays(sew, -SYNC_SEW_DAYS) : null,
      syncDueLast: last ? addDays(last, -SYNC_LAST_DAYS) : null,
    });
  }

  return c.fail(404, "NOT_FOUND", "API không tồn tại");
}

// ─── Đồng bộ vật tư 8 tuần (KH & KQ) ─────────────────────────────────────────
// Mỗi đơn có 2 mốc: may (hạn = ngày may − 14) và gò (hạn = ngày gò − 7); mỗi mốc có 2 luồng (CĐ, CƯ).
// Mỗi ô ghi KH (ngày dự kiến cấp) và KQ (ngày cấp thực tế, đủ / thiếu, thiếu gì).

export type SyncStage = (typeof SYNC_STAGES)[number]["key"];
export type SyncStream = (typeof SYNC_STREAMS)[number]["key"];
export type SyncStatus = "DONE" | "DONE_LATE" | "SHORT" | "OVERDUE" | "DUE_SOON" | "PLAN_LATE" | "NO_PLAN" | "OPEN";
export const SYNC_STATUS_LABEL: Record<SyncStatus, string> = {
  DONE: "Đã cấp đủ, đúng hạn",
  DONE_LATE: "Đã cấp đủ, trễ hạn",
  SHORT: "Cấp thiếu",
  OVERDUE: "Quá hạn, chưa cấp",
  DUE_SOON: "Sắp tới hạn (≤ 3 ngày)",
  PLAN_LATE: "Kế hoạch cấp sau hạn",
  NO_PLAN: "Chưa có kế hoạch cấp",
  OPEN: "Đã có kế hoạch",
};
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

/** Trạng thái 1 ô đồng bộ (thuần, để kiểm thử) */
export function syncCellStatus(cell: { due: string; planDate: string | null; resultDate: string | null; result: string | null }, today: string): SyncStatus {
  if (cell.result === "DU" && cell.resultDate) return cell.resultDate <= cell.due ? "DONE" : "DONE_LATE";
  if (cell.result === "THIEU") return "SHORT";
  if (today > cell.due) return "OVERDUE";
  if (daysBetween(today, cell.due) <= 3) return "DUE_SOON";
  if (!cell.planDate) return "NO_PLAN";
  if (cell.planDate > cell.due) return "PLAN_LATE";
  return "OPEN";
}
const OPEN_BAD: SyncStatus[] = ["OVERDUE", "SHORT", "PLAN_LATE"];
const mondayOfDay = (d: string) => addDays(d, -((new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7));

interface SyncCell { stage: SyncStage; stream: SyncStream; due: string; planDate: string | null; resultDate: string | null; result: string | null; shortage: string | null; status: SyncStatus; updatedBy: string | null }
interface SyncRow { orderId: string; code: string; site: string; plant: string | null; line: string | null; style: string | null; qty: number; shipDate: string; sewStart: string | null; lastStart: string | null; cells: SyncCell[] }

/** Dựng bảng 8 tuần cho 1 nhà máy hoặc ALL: đơn có hạn may/gò trong 8 tuần tới + đơn quá hạn chưa xong */
export async function buildSyncBoard(db: D1, site: string, today: string) {
  const week0 = mondayOfDay(today);
  const end = addDays(week0, SYNC_WEEKS * 7);
  const { results } = await db
    .prepare(
      `SELECT o.id, o.code, o.site, o.plant, o.line, o.style, o.qty, o.ship_date, s.sew_start, s.last_start
       FROM scm_orders o JOIN scm_production_schedule s ON s.order_id = o.id
       WHERE o.archived = 0 ${site === "ALL" ? "" : "AND o.site = ?"} AND (s.sew_start IS NOT NULL OR s.last_start IS NOT NULL)
       ORDER BY COALESCE(s.sew_start, s.last_start), o.code LIMIT 2000`
    )
    .bind(...(site === "ALL" ? [] : [site]))
    .all<Record<string, unknown>>();
  const ids = (results || []).map((r) => String(r.id));
  const saved = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < ids.length; i += 90) {
    const chunk = ids.slice(i, i + 90);
    const { results: rows } = await db.prepare(`SELECT * FROM scm_material_sync WHERE order_id IN (${chunk.map(() => "?").join(",")})`).bind(...chunk).all<Record<string, unknown>>();
    for (const r of rows || []) saved.set(`${r.order_id}|${r.stage}|${r.stream}`, r);
  }
  const rows: SyncRow[] = [];
  for (const r of results || []) {
    const sewStart = (r.sew_start as string) || null, lastStart = (r.last_start as string) || null;
    const cells: SyncCell[] = [];
    for (const st of SYNC_STAGES) {
      const base = st.key === "MAY" ? sewStart : lastStart;
      if (!base) continue;
      const due = addDays(base, -st.leadDays);
      for (const sm of SYNC_STREAMS) {
        const v = saved.get(`${r.id}|${st.key}|${sm.key}`) || {};
        const cell = { due, planDate: (v.plan_date as string) || null, resultDate: (v.result_date as string) || null, result: (v.result as string) || null };
        cells.push({ stage: st.key, stream: sm.key, ...cell, shortage: (v.shortage as string) || null, status: syncCellStatus(cell, today), updatedBy: (v.updated_by as string) || null });
      }
    }
    // Trong cửa sổ 8 tuần, hoặc quá hạn / cấp thiếu chưa xử lý xong
    const inWindow = cells.some((x) => x.due >= week0 && x.due < end);
    const pending = cells.some((x) => x.due < week0 && (x.status === "OVERDUE" || x.status === "SHORT"));
    if (!inWindow && !pending) continue;
    rows.push({ orderId: String(r.id), code: String(r.code), site: String(r.site), plant: (r.plant as string) || null, line: (r.line as string) || null, style: (r.style as string) || null, qty: Number(r.qty) || 0, shipDate: String(r.ship_date), sewStart, lastStart, cells });
  }
  // Tổng hợp theo tuần (theo hạn đồng bộ)
  const weeks = Array.from({ length: SYNC_WEEKS }, (_, i) => {
    const ws = addDays(week0, i * 7), we = addDays(ws, 7);
    const cs = rows.flatMap((x) => x.cells).filter((c) => c.due >= ws && c.due < we);
    return {
      weekStart: ws,
      total: cs.length,
      done: cs.filter((c) => c.status === "DONE").length,
      late: cs.filter((c) => c.status === "DONE_LATE").length,
      problem: cs.filter((c) => OPEN_BAD.includes(c.status)).length,
      open: cs.filter((c) => c.status === "OPEN" || c.status === "NO_PLAN" || c.status === "DUE_SOON").length,
    };
  });
  const all = rows.flatMap((x) => x.cells);
  const totals = {
    overdue: all.filter((c) => c.status === "OVERDUE").length,
    short: all.filter((c) => c.status === "SHORT").length,
    dueSoon: all.filter((c) => c.status === "DUE_SOON").length,
    noPlan: all.filter((c) => c.status === "NO_PLAN").length,
    planLate: all.filter((c) => c.status === "PLAN_LATE").length,
  };
  return { week0, rows, weeks, totals };
}

/** Nội dung báo cáo 11h hàng ngày (null = không có gì cần báo) */
export async function syncDailySummary(db: D1, today: string): Promise<{ title: string; message: string } | null> {
  const b = await buildSyncBoard(db, "ALL", today);
  if (b.rows.length === 0) return null;
  const name = (k: string) => SYNC_STREAMS.find((s) => s.key === k)?.name || k;
  const stage = (k: string) => SYNC_STAGES.find((s) => s.key === k)?.name || k;
  const bad = b.rows.flatMap((r) => r.cells.filter((c) => c.status === "OVERDUE" || c.status === "SHORT").map((c) => `${r.code} ${stage(c.stage)}/${name(c.stream)}`));
  const t = b.totals;
  const w0 = b.weeks[0];
  const message = [
    `Tuần này: ${w0.total} mốc, đã cấp đủ đúng hạn ${w0.done}, trễ ${w0.late}, có vấn đề ${w0.problem}.`,
    `Toàn 8 tuần: quá hạn chưa cấp ${t.overdue}, cấp thiếu ${t.short}, sắp tới hạn ${t.dueSoon}, chưa có kế hoạch ${t.noPlan}, kế hoạch sau hạn ${t.planLate}.`,
    bad.length ? `Cần xử lý: ${bad.slice(0, 10).join("; ")}${bad.length > 10 ? `… (+${bad.length - 10})` : ""}.` : "",
  ].filter(Boolean).join(" ");
  return { title: `Báo cáo đồng bộ vật tư 11:00 ngày ${today.slice(8, 10)}/${today.slice(5, 7)}`, message };
}

async function sync(c: Step2Ctx): Promise<Response> {
  const { db, parts, method, body } = c;
  if (c.access.warehouse === "lock") return c.fail(403, "FORBIDDEN", "Bạn không có quyền xem màn Trung tâm phân phối");
  const edit = c.access.warehouse === "edit";

  // GET /api/scm/sync?site=
  if (!parts[3] && method === "GET") {
    const site = str(c.url.searchParams.get("site"), 10).toUpperCase();
    if (!SITE_KEYS.includes(site)) return c.reply({ success: true, needSite: true });
    const board = await buildSyncBoard(db, site, c.today);
    return c.reply({ success: true, site, today: c.today, ...board, streams: SYNC_STREAMS, stages: SYNC_STAGES, statusLabel: SYNC_STATUS_LABEL, canEdit: edit });
  }

  // PUT /api/scm/sync/:orderId {stage, stream, planDate, resultDate, result: 'DU'|'THIEU'|'', shortage}
  if (parts[3] && method === "PUT") {
    if (!edit) return c.fail(403, "FORBIDDEN", "Chỉ Trung tâm phân phối được cập nhật đồng bộ vật tư");
    const orderId = decodeURIComponent(parts[3]);
    const stage = str(body.stage, 5).toUpperCase(), stream = str(body.stream, 5).toUpperCase();
    if (!SYNC_STAGES.some((s) => s.key === stage) || !SYNC_STREAMS.some((s) => s.key === stream)) return c.fail(400, "BAD_INPUT", "Mốc hoặc luồng không hợp lệ");
    const order = await db.prepare("SELECT id FROM scm_orders WHERE id = ?").bind(orderId).first();
    if (!order) return c.fail(404, "NOT_FOUND", "Không tìm thấy đơn hàng");
    const planDate = parseDay(body.planDate), resultDate = parseDay(body.resultDate);
    if (planDate === undefined || resultDate === undefined) return c.fail(400, "BAD_INPUT", "Ngày không hợp lệ (dd/mm/yyyy)");
    const result = str(body.result, 6).toUpperCase();
    if (result && result !== "DU" && result !== "THIEU") return c.fail(400, "BAD_INPUT", "Kết quả chỉ nhận Đủ hoặc Thiếu");
    if (result && !resultDate) return c.fail(400, "BAD_INPUT", "Ghi kết quả cần có ngày cấp thực tế");
    if (resultDate && resultDate > c.today) return c.fail(400, "BAD_INPUT", "Ngày cấp thực tế không được sau hôm nay");
    const shortage = str(body.shortage, 500) || null;
    if (result === "THIEU" && !shortage) return c.fail(400, "BAD_INPUT", "Cấp thiếu cần ghi rõ thiếu vật tư gì");
    const before = await db.prepare("SELECT plan_date, result_date, result, shortage FROM scm_material_sync WHERE order_id = ? AND stage = ? AND stream = ?").bind(orderId, stage, stream).first();
    await db
      .prepare(
        `INSERT INTO scm_material_sync (order_id, stage, stream, plan_date, result_date, result, shortage, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(order_id, stage, stream) DO UPDATE SET plan_date = excluded.plan_date, result_date = excluded.result_date, result = excluded.result, shortage = excluded.shortage, updated_at = CURRENT_TIMESTAMP, updated_by = excluded.updated_by`
      )
      .bind(orderId, stage, stream, planDate, resultDate, result || null, shortage, c.user.empCode, c.user.empCode)
      .run();
    await c.audit("SYNC_UPDATE", `${orderId}|${stage}|${stream}`, before, { plan_date: planDate, result_date: resultDate, result: result || null, shortage });
    return c.reply({ success: true });
  }

  return c.fail(404, "NOT_FOUND", "API không tồn tại");
}
