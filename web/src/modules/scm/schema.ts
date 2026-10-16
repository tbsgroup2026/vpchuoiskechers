// Lược đồ D1 của module SCM. Worker chạy các câu lệnh này (CREATE ... IF NOT EXISTS) khi cần;
// migrations/0015_scm_core.sql chứa đúng các câu lệnh này để áp bằng wrangler d1 migrations.

const AUDIT_COLS = "created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT";

export const SCM_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS scm_suppliers (id TEXT PRIMARY KEY, name TEXT NOT NULL, origin TEXT NOT NULL DEFAULT 'NHAP_KHAU', lead_time_avg INTEGER NOT NULL DEFAULT 30, transport_days INTEGER NOT NULL DEFAULT 7, ${AUDIT_COLS})`,
  `CREATE TABLE IF NOT EXISTS scm_orders (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, site TEXT NOT NULL, plant TEXT, line TEXT, style TEXT, qty INTEGER NOT NULL DEFAULT 0, ship_date TEXT NOT NULL, supplier_id TEXT, supplier_lead_time INTEGER NOT NULL DEFAULT 30, transport_days INTEGER NOT NULL DEFAULT 7, origin TEXT NOT NULL DEFAULT 'NHAP_KHAU', eta TEXT, info_deadline TEXT, no_silent INTEGER NOT NULL DEFAULT 1, status_cache TEXT, progress_cache INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0, ${AUDIT_COLS})`,
  `CREATE INDEX IF NOT EXISTS idx_scm_orders_site_ship ON scm_orders(site, ship_date)`,
  `CREATE TABLE IF NOT EXISTS scm_order_steps (order_id TEXT NOT NULL, step_no INTEGER NOT NULL, owner_dept TEXT NOT NULL, due_at TEXT, done_at TEXT, done_by TEXT, late_days INTEGER NOT NULL DEFAULT 0, blocked_by TEXT, escalation_level INTEGER NOT NULL DEFAULT 0, escalated_at TEXT, note TEXT, ${AUDIT_COLS}, PRIMARY KEY (order_id, step_no))`,
  `CREATE TABLE IF NOT EXISTS scm_handover_items (order_id TEXT NOT NULL, item TEXT NOT NULL, delivered_at TEXT, delivered_by TEXT, ${AUDIT_COLS}, PRIMARY KEY (order_id, item))`,
  `CREATE TABLE IF NOT EXISTS scm_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, ${AUDIT_COLS})`,
  `CREATE TABLE IF NOT EXISTS scm_screen_permissions (screen TEXT NOT NULL, dept TEXT NOT NULL, access TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE', approved_by TEXT, approved_at TEXT, ${AUDIT_COLS}, PRIMARY KEY (screen, dept, status))`,
  `CREATE TABLE IF NOT EXISTS scm_dept_rules (id INTEGER PRIMARY KEY AUTOINCREMENT, pattern TEXT NOT NULL, dept TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, ${AUDIT_COLS})`,
  `CREATE TABLE IF NOT EXISTS scm_dept_members (emp_code TEXT NOT NULL, dept TEXT NOT NULL, is_head INTEGER NOT NULL DEFAULT 0, ${AUDIT_COLS}, PRIMARY KEY (emp_code, dept))`,
  `CREATE TABLE IF NOT EXISTS scm_user_prefs (emp_code TEXT PRIMARY KEY, site TEXT, ${AUDIT_COLS})`,
  // Bước 2: Kế hoạch & CCƯ, Mua hàng
  `CREATE TABLE IF NOT EXISTS scm_allocation_plans (id TEXT PRIMARY KEY, site TEXT NOT NULL, week_start TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT', submitted_by TEXT, submitted_at TEXT, approved_by TEXT, approved_at TEXT, issued_by TEXT, issued_at TEXT, tier2_sent_by TEXT, tier2_sent_at TEXT, ${AUDIT_COLS}, UNIQUE (site, week_start))`,
  `CREATE TABLE IF NOT EXISTS scm_allocation_lines (plan_id TEXT NOT NULL, order_id TEXT NOT NULL, week_start TEXT NOT NULL, plant TEXT NOT NULL, line TEXT NOT NULL, priority_312 INTEGER, tier2_sent INTEGER NOT NULL DEFAULT 0, ${AUDIT_COLS}, PRIMARY KEY (plan_id, order_id, week_start))`,
  `CREATE TABLE IF NOT EXISTS scm_plant_capacity (plant TEXT NOT NULL, line TEXT NOT NULL, week_start TEXT NOT NULL, capacity INTEGER NOT NULL, ${AUDIT_COLS}, PRIMARY KEY (plant, line, week_start))`,
  `CREATE TABLE IF NOT EXISTS scm_plan_changes (id INTEGER PRIMARY KEY AUTOINCREMENT, plan_id TEXT, order_id TEXT, action TEXT NOT NULL, reason TEXT, before_json TEXT, after_json TEXT, ${AUDIT_COLS})`,
  `CREATE TABLE IF NOT EXISTS scm_purchase_orders (id TEXT PRIMARY KEY, po_no TEXT UNIQUE, order_id TEXT NOT NULL UNIQUE, supplier_id TEXT, activated_at TEXT, activated_by TEXT, issued_at TEXT, issued_by TEXT, ${AUDIT_COLS})`,
  `CREATE TABLE IF NOT EXISTS scm_inbound_plan (id TEXT PRIMARY KEY, po_id TEXT NOT NULL, order_id TEXT NOT NULL, eta TEXT, eta_changed_from TEXT, week_start TEXT, sent_to_wh_at TEXT, sent_by TEXT, ${AUDIT_COLS})`,
  `CREATE TABLE IF NOT EXISTS scm_incidents (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, po_id TEXT, supplier_id TEXT, material TEXT NOT NULL, issue TEXT NOT NULL, plan TEXT, stage TEXT NOT NULL DEFAULT 'CONTACT', opened_at TEXT NOT NULL, closed_at TEXT, confirmed_by TEXT, confirmed_at TEXT, escalation INTEGER NOT NULL DEFAULT 0, escalated_at TEXT, note TEXT, ${AUDIT_COLS})`,
  `CREATE TABLE IF NOT EXISTS scm_uploaded_forms (id TEXT PRIMARY KEY, dept TEXT NOT NULL, file_key TEXT NOT NULL, file_name TEXT NOT NULL, size INTEGER NOT NULL DEFAULT 0, content_type TEXT, uploaded_by TEXT, uploaded_at TEXT, ${AUDIT_COLS})`,
];

/** Cột thêm vào bảng đã có (worker chạy từng câu, bỏ qua lỗi khi cột đã tồn tại) */
export const SCM_ALTERS: string[] = [
  "ALTER TABLE scm_orders ADD COLUMN bottleneck_note TEXT",
  "ALTER TABLE scm_orders ADD COLUMN bottleneck_by TEXT",
  "ALTER TABLE scm_orders ADD COLUMN bottleneck_at TEXT",
  "ALTER TABLE scm_orders ADD COLUMN eta_changed_from TEXT",
];
