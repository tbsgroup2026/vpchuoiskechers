-- Migration 0010: RBAC/ABAC Security Engine, Department Tasks, Projects, 1-5-2 Access Gate & Audit Logs
-- Date: 2026-09-09

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    manager_emp_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Positions Table
CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department_id TEXT NOT NULL,
    management_level INTEGER DEFAULT 4, -- 1: CEO, 2: DEPUTY_CEO/DIRECTOR, 3: DEPARTMENT_HEAD, 4: STAFF
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    default_scope TEXT DEFAULT 'DEPARTMENT',
    description TEXT
);

-- 5. Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- 6. User Roles Junction Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL,
    role_id TEXT NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

-- 7. User Permission Overrides Table (Granular User Allow/Deny)
CREATE TABLE IF NOT EXISTS user_permission_overrides (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    permission_id TEXT NOT NULL,
    is_granted INTEGER NOT NULL DEFAULT 1, -- 1: ALLOW, 0: DENY
    data_scope TEXT DEFAULT 'SELF',
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Job Descriptions & Task Templates
CREATE TABLE IF NOT EXISTS job_descriptions (
    id TEXT PRIMARY KEY,
    position_id TEXT NOT NULL,
    title TEXT NOT NULL,
    responsibilities_json TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_templates (
    id TEXT PRIMARY KEY,
    job_description_id TEXT,
    department_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    estimated_hours REAL DEFAULT 1.0,
    checklist_template_json TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Work Plans & Task Board
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    department_id TEXT NOT NULL,
    creator_emp_code TEXT NOT NULL,
    period_type TEXT DEFAULT 'WEEKLY', -- DAILY, WEEKLY, MONTHLY, QUARTERLY
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    department_id TEXT NOT NULL,
    project_id TEXT,
    plan_id TEXT,
    template_id TEXT,
    assignee_emp_code TEXT NOT NULL,
    assignee_name TEXT NOT NULL,
    reporter_emp_code TEXT NOT NULL,
    reviewer_emp_code TEXT,
    priority TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    start_date TEXT,
    due_date TEXT,
    status TEXT DEFAULT 'TO_DO', -- BACKLOG, TO_DO, DOING, REVIEW, DONE
    progress INTEGER DEFAULT 0,
    tags TEXT,
    result_description TEXT,
    result_attachments_json TEXT DEFAULT '[]',
    manager_review_comment TEXT,
    performance_rating INTEGER, -- 1 to 5 stars
    performance_score REAL DEFAULT 0.0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Task Checklists
CREATE TABLE IF NOT EXISTS task_checklists (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_by_emp_code TEXT,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Task Comments & Activity Logs
CREATE TABLE IF NOT EXISTS task_comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    author_emp_code TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    attachments_json TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_activity_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    actor_emp_code TEXT NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Projects & Cross-department Members
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    manager_emp_code TEXT NOT NULL,
    manager_name TEXT NOT NULL,
    status TEXT DEFAULT 'IN_PROGRESS', -- PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED
    start_date TEXT,
    end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL,
    emp_code TEXT NOT NULL,
    emp_name TEXT NOT NULL,
    project_role TEXT DEFAULT 'MEMBER', -- PROJECT_MANAGER, LEADER, MEMBER, VIEWER
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, emp_code)
);

-- 13. Access Gate 1-5-2 Security Sessions & Verification Config
CREATE TABLE IF NOT EXISTS access_gate_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    emp_code TEXT NOT NULL,
    verified_until DATETIME NOT NULL,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    emp_code TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Performance Scorecard Config
CREATE TABLE IF NOT EXISTS performance_configs (
    id TEXT PRIMARY KEY,
    weight_completion_rate REAL DEFAULT 0.3,
    weight_ontime_rate REAL DEFAULT 0.3,
    weight_quality REAL DEFAULT 0.2,
    weight_manager_rating REAL DEFAULT 0.2,
    penalty_overdue_day REAL DEFAULT 2.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Departments
INSERT OR IGNORE INTO departments (id, code, name, description, manager_emp_code) VALUES
  ('dept_bdg', 'BAN_GIAM_DOC', 'Ban Giám Đốc Tập Đoàn', 'Ban Giám Đốc Điều Hành Tập Đoàn TBS Group', 'TGĐ-001'),
  ('dept_it', 'IT_CDS', 'IT - Team Chuyển Đổi Số', 'Phòng Công Nghệ Thông Tin & Chuyển Đổi Số', '202608001'),
  ('dept_hr', 'NHAN_SU', 'Nhân Sự - Hành Chánh', 'Phòng Quản Trị Nhân Sự & Hành Chính SKECHERS', 'NS-001'),
  ('dept_kt', 'KE_TOAN', 'Kế Toán & Quản Trị Tài Chính', 'Phòng Tài Chính Kế Toán SKECHERS', 'KT-001'),
  ('dept_qc', 'CHAT_LUONG_QC', 'Khối Quản Lý Chất Lượng (QC)', 'Bộ Phận QC & Kiểm Soát Chất Lượng Nhà Máy', 'QC-001'),
  ('dept_rd', 'RD_PHAT_TRIEN', 'R&D - Phát Triển Sản Phẩm', 'Phòng R&D Thiết Kế & Phát Triển Mẫu Giày', 'RD-001'),
  ('dept_lg', 'LOGISTICS_TTPP', 'Logistics - KH Chuẩn Bị TTPP', 'Phòng Logistics & Chuỗi Cung Ứng', 'LG-001'),
  ('dept_sx', 'TO_HOP_NHA_MAY', 'Tổ Hợp Nhà Máy & Sản Xuất', 'Khối Sản Xuất & Bảo Trì Thiết Bị MMTB', 'BT-001');

-- Insert Default Performance Config
INSERT OR IGNORE INTO performance_configs (id, weight_completion_rate, weight_ontime_rate, weight_quality, weight_manager_rating, penalty_overdue_day)
VALUES ('cfg_default', 0.30, 0.30, 0.20, 0.20, 2.0);
