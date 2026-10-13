-- Schema HR cho staging (D1). Tách khỏi web/migrations để không chạm DB production.
CREATE TABLE IF NOT EXISTS sys_users (
  id TEXT PRIMARY KEY, emp_code TEXT UNIQUE, name TEXT, email TEXT, phone TEXT, title TEXT, department TEXT,
  role_code TEXT, status TEXT DEFAULT 'ACTIVE', ngay_vao TEXT, vtcv_hien_tai TEXT, phong_ban_hien_tai TEXT,
  vtcv_sap TEXT, vtcv_sap_xep TEXT, pb_sap_xep TEXT, bo_phan_moi TEXT, phong_ban_moi TEXT, ghi_chu TEXT,
  password_hash TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_employees (
  emp_code TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  hr_role TEXT NOT NULL CHECK (hr_role IN ('SUPER_ADMIN','HR_MANAGER','HR_STAFF','PAYROLL','MANAGER','EMPLOYEE')),
  team_id TEXT,
  manager_code TEXT,
  base_salary INTEGER NOT NULL DEFAULT 0,
  dependents INTEGER NOT NULL DEFAULT 0,
  leave_balance REAL NOT NULL DEFAULT 12,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);
CREATE INDEX IF NOT EXISTS idx_hr_emp_team ON hr_employees(team_id);

CREATE TABLE IF NOT EXISTS hr_leave_requests (
  id TEXT PRIMARY KEY, emp_code TEXT NOT NULL, team_id TEXT, start_date TEXT NOT NULL, end_date TEXT NOT NULL,
  leave_type TEXT NOT NULL, half_session TEXT, days REAL NOT NULL, reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', decided_by TEXT, decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_hr_leave_emp ON hr_leave_requests(emp_code);
CREATE INDEX IF NOT EXISTS idx_hr_leave_team ON hr_leave_requests(team_id);

CREATE TABLE IF NOT EXISTS hr_timesheets (
  id TEXT PRIMARY KEY, emp_code TEXT NOT NULL, team_id TEXT, work_date TEXT NOT NULL,
  check_in TEXT NOT NULL, check_out TEXT, night_shift INTEGER NOT NULL DEFAULT 0,
  hours REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (emp_code, check_in)
);
CREATE INDEX IF NOT EXISTS idx_hr_ts_emp ON hr_timesheets(emp_code);
CREATE INDEX IF NOT EXISTS idx_hr_ts_team ON hr_timesheets(team_id);

CREATE TABLE IF NOT EXISTS hr_files (
  id TEXT PRIMARY KEY, owner_code TEXT NOT NULL, team_id TEXT, original_name TEXT NOT NULL,
  r2_key TEXT NOT NULL, size INTEGER NOT NULL, sha256 TEXT NOT NULL, content_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_hr_files_owner ON hr_files(owner_code);
