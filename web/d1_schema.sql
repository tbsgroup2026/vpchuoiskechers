-- ============================================================
-- TBS GROUP CLOUDFLARE D1 DATABASE SCHEMA
-- ============================================================

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES (1: Super Admin, 2: Ban Giám đốc, 3: Trưởng phòng, 4: Văn phòng, 5: Bảo trì, 6: Công nhân)
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    level INTEGER NOT NULL DEFAULT 4,
    department_id INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 3. USERS
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_code TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    department_id INTEGER,
    status TEXT DEFAULT 'ACTIVE',
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 4. PERMISSIONS & ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    module TEXT NOT NULL,
    action TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 5. BRANCHES, SECTORS, ZONES, LINES
CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL,
    address TEXT
);

CREATE TABLE IF NOT EXISTS sectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

-- 6. MACHINES
CREATE TABLE IF NOT EXISTS machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    serial_number TEXT,
    zone_id INTEGER,
    line_id INTEGER,
    branch_id INTEGER,
    status TEXT DEFAULT 'OPERATING', -- OPERATING, WARNING, DOWN, MAINTENANCE
    install_date TEXT,
    specs TEXT,
    qr_code_data TEXT UNIQUE,
    grid_x INTEGER DEFAULT 0,
    grid_y INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
    FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- 7. INCIDENT CATEGORIES & MAINTENANCE TICKETS
CREATE TABLE IF NOT EXISTS incident_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    default_priority TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    estimated_fix_time_mins INTEGER DEFAULT 30
);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_code TEXT NOT NULL UNIQUE,
    machine_id INTEGER NOT NULL,
    reported_by_id INTEGER NOT NULL,
    assigned_to_id INTEGER,
    category_id INTEGER,
    branch_id INTEGER,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'OPEN', -- OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
    description TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    response_time_sec INTEGER DEFAULT 0,
    resolution_time_sec INTEGER DEFAULT 0,
    total_downtime_sec INTEGER DEFAULT 0,
    root_cause TEXT,
    resolution_notes TEXT,
    spare_parts_used TEXT,
    estimated_repair_cost REAL DEFAULT 0.0,
    approval_status TEXT DEFAULT 'APPROVED',
    FOREIGN KEY (machine_id) REFERENCES machines(id),
    FOREIGN KEY (reported_by_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES incident_categories(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS maintenance_performance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mechanic_id INTEGER NOT NULL,
    log_date TEXT NOT NULL,
    tickets_resolved INTEGER DEFAULT 0,
    avg_resolution_mins REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mechanic_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. DOCUMENT DIGITIZATION
CREATE TABLE IF NOT EXISTS documents_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    doc_type TEXT NOT NULL, -- LEAVE, PROPOSAL, QC_REPORT, MAINTENANCE_REQ, OTHER
    department_id INTEGER,
    file_r2_key TEXT NOT NULL,
    file_type TEXT NOT NULL, -- docx, pdf
    placeholders_json TEXT NOT NULL, -- JSON array of detected placeholder keys & form schema
    created_by_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS documents_generated (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    creator_id INTEGER NOT NULL,
    department_id INTEGER,
    form_data_json TEXT NOT NULL,
    file_r2_key TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES documents_templates(id),
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS document_approval_flow (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    step_order INTEGER NOT NULL,
    approver_role_id INTEGER,
    approver_id INTEGER,
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    comments TEXT,
    actioned_at DATETIME,
    FOREIGN KEY (document_id) REFERENCES documents_generated(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_role_id) REFERENCES roles(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- 9. RECRUITMENT & PUBLIC SITE (JOBS & APPLICATIONS)
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    location TEXT DEFAULT 'Văn Phòng Chuỗi SKECHERS',
    department_id INTEGER,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, CLOSED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS job_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT NOT NULL,
    candidate_phone TEXT NOT NULL,
    cv_r2_key TEXT,
    cover_letter TEXT,
    status TEXT DEFAULT 'SUBMITTED', -- SUBMITTED, REVIEWING, ACCEPTED, REJECTED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- 10. NOTIFICATIONS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    target_entity TEXT,
    details TEXT,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. SEED SUPER ADMIN USERS
INSERT OR IGNORE INTO users (id, emp_code, email, name, phone, password_hash, role_id, department_id, status)
VALUES (100, '202608001', 'anhhuy@tbsgroup.vn', 'Phạm Nguyễn Anh Huy', '0900000000', '21032004', 1, 11, 'ACTIVE');

INSERT OR IGNORE INTO users (id, emp_code, email, name, phone, password_hash, role_id, department_id, status)
VALUES (101, '202608002', 'ngochuy@tbsgroup.vn', 'Trần Ngọc Huy', '0900000001', '123456', 1, 11, 'ACTIVE');

-- 12. BUSINESS TRIPS (Đăng ký & Quản lý lịch công tác)
CREATE TABLE IF NOT EXISTS business_trips (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    region TEXT DEFAULT 'VP Chuỗi',
    factory TEXT,
    creator TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days_count INTEGER DEFAULT 1,
    transport TEXT DEFAULT 'Xe công ty',
    participants_count INTEGER DEFAULT 1,
    purpose TEXT,
    address TEXT,
    proposal_text TEXT,
    participants_json TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO business_trips (id, code, title, region, factory, creator, department, location, start_date, end_date, days_count, transport, participants_count, purpose, status, created_at)
VALUES 
('rec_1', 'CT-2026-018', 'Đánh giá Gemba Walk & Kiểm định dây chuyền A1', 'VP Chuỗi', 'Nhà máy SKECHERS A1', 'Anh Huy', 'Hành chính', 'Bình Dương - Cụm Nhà Máy A1', '15/08/2026', '16/08/2026', 2, 'Xe công ty', 3, 'Kiểm định dây chuyền may tự động A1', 'APPROVED', '2026-08-14 09:30:00'),
('rec_2', 'CT-2026-019', 'Khảo sát mở rộng Trung tâm Phân phối TTPP Đồng Nai', 'VP Chuỗi', 'Tổ hợp Đế Giày TTPP', 'Trần Thị Mai', 'Logistics', 'Đồng Nai - Kho Logistics TTPP', '18/08/2026', '18/08/2026', 1, 'Xe công ty', 2, 'Khảo sát hiện trường kho bãi', 'PENDING', '2026-08-15 08:15:00');
