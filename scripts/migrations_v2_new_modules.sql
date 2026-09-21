-- Migration Script for VPCHUOI SKECHERS New Modules & Role Workspace System
-- Version: 2.0.0

-- 1. Role Permissions & Workspace Config
CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_workspace_config (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  route TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Department KPI & Task Board Tables
CREATE TABLE IF NOT EXISTS department_kpi_monthly (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  kpi_name TEXT NOT NULL,
  target_value REAL,
  actual_value REAL,
  unit TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  department_id TEXT,
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_lists (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_cards (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL,
  board_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT,
  deadline DATETIME,
  status TEXT DEFAULT 'in_progress',
  color_state TEXT DEFAULT 'green',
  job_position_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_card_checklist_items (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_done INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_card_attachments (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_card_reviews (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  rating INTEGER,
  comment TEXT,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_notifications_sent (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  notify_date DATE NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(card_id, notify_date)
);

CREATE TABLE IF NOT EXISTS job_position_templates (
  id TEXT PRIMARY KEY,
  position_name TEXT NOT NULL,
  department_id TEXT,
  checklist_template TEXT
);

-- 3. Audit, Login & Snapshot Logs
CREATE TABLE IF NOT EXISTS auth_login_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  emp_code TEXT,
  ip TEXT,
  user_agent TEXT,
  success INTEGER DEFAULT 1,
  failure_reason TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_change_history (
  id TEXT PRIMARY KEY,
  target_user_id TEXT NOT NULL,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credential_change_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  change_type TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_snapshots (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  snapshot_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incremental_backup_state (
  table_name TEXT PRIMARY KEY,
  last_synced_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 1-5-2 Module & Alert Tables
CREATE TABLE IF NOT EXISTS admin_module_pin (
  user_id TEXT PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  must_change_pin INTEGER DEFAULT 1,
  failed_attempts INTEGER DEFAULT 0,
  locked_until DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS module_152_access_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  success INTEGER NOT NULL,
  ip TEXT,
  user_agent TEXT,
  accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_alert_recipients (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT NOT NULL,
  role TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed Core Role Workspace Routes
INSERT OR IGNORE INTO role_workspace_config (id, role, route, label, icon, sort_order) VALUES
  ('rwc_seed_1', 'SUPER_ADMIN', '/work/overview', 'Dashboard Đa Nhà Máy', 'IconChartBar', 1),
  ('rwc_seed_2', 'SUPER_ADMIN', '/work/kaizen', 'Thư Viện Sáng Kiến Kaizen', 'IconSparkles', 2),
  ('rwc_seed_3', 'SUPER_ADMIN', '/work/gemba', 'Quản Lý GEMBA Audit', 'IconShieldCheck', 3),
  ('rwc_seed_4', 'SUPER_ADMIN', '/maintenance', 'Quản Lý Máy Móc Thiết Bị', 'IconBuildingFactory', 4),
  ('rwc_seed_5', 'SUPER_ADMIN', '/work/tasks', 'Task Board Trello', 'IconList', 5),
  ('rwc_seed_6', 'ADMIN', '/work/overview', 'Dashboard Đa Nhà Máy', 'IconChartBar', 1),
  ('rwc_seed_7', 'ADMIN', '/work/kaizen', 'Thư Viện Sáng Kiến Kaizen', 'IconSparkles', 2),
  ('rwc_seed_8', 'ADMIN', '/work/gemba', 'Quản Lý GEMBA Audit', 'IconShieldCheck', 3),
  ('rwc_seed_9', 'ADMIN', '/work/tasks', 'Task Board Trello', 'IconList', 4),
  ('rwc_seed_10', 'TRUONG_PHONG', '/work/kaizen', 'Sáng Kiến Phòng Ban', 'IconSparkles', 1),
  ('rwc_seed_11', 'TRUONG_PHONG', '/work/gemba', 'Kiểm Tra GEMBA', 'IconShieldCheck', 2),
  ('rwc_seed_12', 'TRUONG_PHONG', '/work/tasks', 'Task Board Phòng Ban', 'IconList', 3),
  ('rwc_seed_13', 'IE', '/work/kaizen/ie-queue', 'Hàng Chờ IE Xác Nhận', 'IconCheck', 1),
  ('rwc_seed_14', 'IE', '/work/kaizen', 'Thư Viện Sáng Kiến', 'IconSparkles', 2),
  ('rwc_seed_15', 'IE', '/work/tasks', 'Task Board Kỹ Thuật', 'IconList', 3),
  ('rwc_seed_16', 'NHAN_VIEN', '/work/kaizen', 'Đăng Ký Sáng Kiến Kaizen', 'IconSparkles', 1),
  ('rwc_seed_17', 'NHAN_VIEN', '/work/tasks', 'Công Việc Của Tôi', 'IconList', 2),
  ('rwc_seed_18', 'NHAN_VIEN', '/work/payroll/me', 'Bảng Lương Của Tôi', 'IconReceipt', 3),
  ('rwc_seed_19', 'NHAN_VIEN', '/work/leave-request', 'Xin Nghỉ Phép', 'IconCalendar', 4);
