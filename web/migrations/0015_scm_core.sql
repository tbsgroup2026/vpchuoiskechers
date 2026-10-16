-- Migration 0015: module "Kế hoạch chuẩn bị và trung tâm phân phối" (SCM), Bước 1
-- Bảng mới, rỗng; không sửa dữ liệu cũ. Worker cũng tự tạo các bảng này khi cần
-- (danh sách câu lệnh giữ đồng bộ với web/src/modules/scm/schema.ts).
-- Ngưỡng cấu hình (scm_settings) và quyền mặc định do worker nạp khi bảng còn rỗng.

CREATE TABLE IF NOT EXISTS scm_suppliers (id TEXT PRIMARY KEY, name TEXT NOT NULL, origin TEXT NOT NULL DEFAULT 'NHAP_KHAU', lead_time_avg INTEGER NOT NULL DEFAULT 30, transport_days INTEGER NOT NULL DEFAULT 7, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT);

CREATE TABLE IF NOT EXISTS scm_orders (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, site TEXT NOT NULL, plant TEXT, line TEXT, style TEXT, qty INTEGER NOT NULL DEFAULT 0, ship_date TEXT NOT NULL, supplier_id TEXT, supplier_lead_time INTEGER NOT NULL DEFAULT 30, transport_days INTEGER NOT NULL DEFAULT 7, origin TEXT NOT NULL DEFAULT 'NHAP_KHAU', eta TEXT, info_deadline TEXT, no_silent INTEGER NOT NULL DEFAULT 1, status_cache TEXT, progress_cache INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT);
CREATE INDEX IF NOT EXISTS idx_scm_orders_site_ship ON scm_orders(site, ship_date);

CREATE TABLE IF NOT EXISTS scm_order_steps (order_id TEXT NOT NULL, step_no INTEGER NOT NULL, owner_dept TEXT NOT NULL, due_at TEXT, done_at TEXT, done_by TEXT, late_days INTEGER NOT NULL DEFAULT 0, blocked_by TEXT, escalation_level INTEGER NOT NULL DEFAULT 0, escalated_at TEXT, note TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT, PRIMARY KEY (order_id, step_no));

CREATE TABLE IF NOT EXISTS scm_handover_items (order_id TEXT NOT NULL, item TEXT NOT NULL, delivered_at TEXT, delivered_by TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT, PRIMARY KEY (order_id, item));

CREATE TABLE IF NOT EXISTS scm_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT);

CREATE TABLE IF NOT EXISTS scm_screen_permissions (screen TEXT NOT NULL, dept TEXT NOT NULL, access TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE', approved_by TEXT, approved_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT, PRIMARY KEY (screen, dept, status));

CREATE TABLE IF NOT EXISTS scm_dept_rules (id INTEGER PRIMARY KEY AUTOINCREMENT, pattern TEXT NOT NULL, dept TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT);

CREATE TABLE IF NOT EXISTS scm_dept_members (emp_code TEXT NOT NULL, dept TEXT NOT NULL, is_head INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT, PRIMARY KEY (emp_code, dept));

CREATE TABLE IF NOT EXISTS scm_user_prefs (emp_code TEXT PRIMARY KEY, site TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT);
