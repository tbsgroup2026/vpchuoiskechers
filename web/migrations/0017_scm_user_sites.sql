-- Nhà máy trực thuộc của tài khoản và quyền xem/chọn mọi nhà máy (module SCM)
CREATE TABLE IF NOT EXISTS scm_user_sites (emp_code TEXT PRIMARY KEY, home_site TEXT, all_sites INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by TEXT, updated_by TEXT);
