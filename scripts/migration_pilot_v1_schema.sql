-- Migration Pilot v1: Hoàn thiện Schema CSDL D1 cho đợt Pilot 100 người dùng TBS Group
-- Database: vpchuoiskechers-db (Cloudflare D1 SQLite)
-- An toàn, có thể chạy lại nhiều lần (idempotent), không làm mất dữ liệu hiện có.

-- 1. Bổ sung các cột xác thực, phân cấp vai trò và tài khoản test cho sys_users
-- (D1 SQLite hỗ trợ ALTER TABLE ADD COLUMN từng cột)
ALTER TABLE sys_users ADD COLUMN password_hash TEXT;
ALTER TABLE sys_users ADD COLUMN must_change_pwd INTEGER DEFAULT 1;
ALTER TABLE sys_users ADD COLUMN is_test_account INTEGER DEFAULT 0;
ALTER TABLE sys_users ADD COLUMN role_level INTEGER DEFAULT 4;
ALTER TABLE sys_users ADD COLUMN avatar TEXT DEFAULT '';

-- 2. Bổ sung các trường quản lý nghiệm thu, đổi deadline và lịch sử cho sys_my_tasks
ALTER TABLE sys_my_tasks ADD COLUMN reject_reason TEXT;
ALTER TABLE sys_my_tasks ADD COLUMN history_log TEXT;
ALTER TABLE sys_my_tasks ADD COLUMN is_test_data INTEGER DEFAULT 0;

-- 3. Bảng Dự Án Liên Phòng Ban (projects)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_outcome TEXT,
  start_date TEXT,
  end_date TEXT,
  manager_emp_code TEXT,
  manager_name TEXT,
  status TEXT DEFAULT 'IN_PROGRESS',
  progress INTEGER DEFAULT 0,
  is_test_data INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Phòng Ban Tham Gia Dự Án (project_departments)
CREATE TABLE IF NOT EXISTS project_departments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  department_name TEXT,
  lead_emp_code TEXT,
  lead_name TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 5. Bảng Phụ Thuộc Chéo Task Dự Án (project_dependencies)
CREATE TABLE IF NOT EXISTS project_dependencies (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  predecessor_task_id TEXT NOT NULL,
  successor_task_id TEXT NOT NULL,
  dependency_type TEXT DEFAULT 'FINISH_TO_START',
  lag_days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 6. Bảng Cấu Hình Nhận Thông Báo Của Người Dùng (user_notification_settings)
CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id TEXT PRIMARY KEY,
  in_app_enabled INTEGER DEFAULT 1,
  web_push_enabled INTEGER DEFAULT 1,
  telegram_enabled INTEGER DEFAULT 0,
  telegram_chat_id TEXT,
  zalo_enabled INTEGER DEFAULT 0,
  notify_assigned INTEGER DEFAULT 1,
  notify_due_change INTEGER DEFAULT 1,
  notify_due_warning INTEGER DEFAULT 1,
  notify_review INTEGER DEFAULT 1,
  notify_overdue INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng Mã Liên Kết Telegram 1 Lần (user_telegram_links)
CREATE TABLE IF NOT EXISTS user_telegram_links (
  link_code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tối ưu hóa Index cho Pilot 100 Users
CREATE INDEX IF NOT EXISTS idx_sys_users_dept ON sys_users(department);
CREATE INDEX IF NOT EXISTS idx_sys_users_role ON sys_users(role_code);
CREATE INDEX IF NOT EXISTS idx_sys_my_tasks_assignee ON sys_my_tasks(assignee_emp_code);
CREATE INDEX IF NOT EXISTS idx_sys_my_tasks_reporter ON sys_my_tasks(reporter_emp_code);
CREATE INDEX IF NOT EXISTS idx_sys_my_tasks_dept ON sys_my_tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_sys_my_tasks_status ON sys_my_tasks(status);
CREATE INDEX IF NOT EXISTS idx_sys_my_tasks_project ON sys_my_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_deps_pred ON project_dependencies(predecessor_task_id);
CREATE INDEX IF NOT EXISTS idx_project_deps_succ ON project_dependencies(successor_task_id);
