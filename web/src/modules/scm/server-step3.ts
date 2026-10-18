// API Bước 3 của module SCM: Kế hoạch sản xuất theo ngày (/api/scm/khsx*).
// KHSX = ngày lên chuyền may và ngày lên chuyền gò của từng đơn; là căn cứ tính mốc đồng bộ vật tư
// (may: trước SYNC_SEW_DAYS ngày, gò: trước SYNC_LAST_DAYS ngày). Gọi từ handleScmApi (server.ts).
import { SITES, SYNC_LAST_DAYS, SYNC_SEW_DAYS } from "./config";
import { addDays } from "./engine";
import type { Step2Ctx } from "./server-step2";

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
