-- ============================================================
-- MIGRATION 0007: SECURITY HARDENING & PERFORMANCE OPTIMIZATION
-- Fixes: Password verification, Token blacklist, Rate limiting, Indexes
-- ============================================================

-- 1. ADD PASSWORD HASH TO USERS TABLE (if not exists)
-- Note: Use ALTER TABLE ADD COLUMN (SQLite compatible)
CREATE TABLE IF NOT EXISTS users_temp AS SELECT * FROM users;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    password_hash TEXT, -- NEW: Store bcrypt password hash
    avatar_url TEXT,
    title TEXT,
    department TEXT,
    department_id INTEGER,
    role_code TEXT NOT NULL DEFAULT 'CBCNV',
    status TEXT DEFAULT 'ACTIVE',
    failed_login_attempts INTEGER DEFAULT 0, -- NEW: Track failed logins
    locked_until DATETIME, -- NEW: Account lockout timestamp
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from temp table
INSERT INTO users (id, emp_code, name, email, phone, avatar_url, title, department, role_code, status, version, created_at, updated_at)
SELECT id, emp_code, name, email, phone, avatar_url, title, department, role_code, 
       COALESCE(status, 'ACTIVE'), COALESCE(version, 1), 
       COALESCE(created_at, CURRENT_TIMESTAMP), COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM users_temp;

DROP TABLE users_temp;

-- 2. CREATE TOKEN BLACKLIST TABLE
CREATE TABLE IF NOT EXISTS token_blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    emp_code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT DEFAULT 'LOGOUT'
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- 3. CREATE RATE LIMITING TABLE
CREATE TABLE IF NOT EXISTS rate_limit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_ip TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    window_end DATETIME
);

-- Index for rate limit checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint_window 
    ON rate_limit_log(client_ip, endpoint, window_start);

-- 4. ADD DEPARTMENT_ID TO EXISTING TABLES (for data filtering)
-- room_bookings
ALTER TABLE room_bookings ADD COLUMN department_id INTEGER;

-- business_trips (if not exists)
CREATE TABLE IF NOT EXISTS business_trips_temp AS SELECT * FROM business_trips;
DROP TABLE IF EXISTS business_trips;

CREATE TABLE business_trips (
    id TEXT PRIMARY KEY,
    emp_code TEXT NOT NULL,
    destination TEXT NOT NULL,
    purpose TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    estimated_cost REAL DEFAULT 0.0,
    department_id INTEGER, -- NEW: For filtering
    status TEXT DEFAULT 'DRAFT',
    approved_level TEXT,
    l1_approved_by TEXT,
    l1_approved_at DATETIME,
    l2_approved_by TEXT,
    l2_approved_at DATETIME,
    rejection_reason TEXT,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO business_trips SELECT 
    id, emp_code, destination, purpose, start_date, end_date, 
    COALESCE(estimated_cost, 0.0),
    NULL as department_id, -- Will be populated via trigger or update script
    COALESCE(status, 'DRAFT'),
    approved_level, l1_approved_by, l1_approved_at, 
    l2_approved_by, l2_approved_at, rejection_reason,
    COALESCE(version, 1),
    COALESCE(created_at, CURRENT_TIMESTAMP),
    COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM business_trips_temp;

DROP TABLE business_trips_temp;

-- 5. CREATE PERFORMANCE INDEXES

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_emp_code ON users(emp_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role_code, status);

-- Room bookings indexes
CREATE INDEX IF NOT EXISTS idx_room_bookings_date_status 
    ON room_bookings(booking_date, status);
CREATE INDEX IF NOT EXISTS idx_room_bookings_user 
    ON room_bookings(emp_code, booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_room_bookings_dept 
    ON room_bookings(department_id, booking_date DESC);

-- Business trips indexes
CREATE INDEX IF NOT EXISTS idx_business_trips_emp_code 
    ON business_trips(emp_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_trips_status 
    ON business_trips(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_trips_dept 
    ON business_trips(department_id, status);

-- Maintenance tickets indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status_priority 
    ON maintenance_tickets(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_assigned 
    ON maintenance_tickets(assigned_to, status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_module_record 
    ON notifications(module, record_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action 
    ON audit_logs(module, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_emp_code 
    ON audit_logs(emp_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record 
    ON audit_logs(module, record_id);

-- Idempotency logs indexes (with TTL cleanup support)
CREATE INDEX IF NOT EXISTS idx_idempotency_logs_created 
    ON idempotency_logs(created_at);

-- CI Kaizen proposals indexes
CREATE INDEX IF NOT EXISTS idx_kaizen_status_created 
    ON ci_kaizen_proposals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kaizen_category 
    ON ci_kaizen_proposals(category, status);
CREATE INDEX IF NOT EXISTS idx_kaizen_proposer 
    ON ci_kaizen_proposals(proposer_emp_code, created_at DESC);

-- 6. SET DEFAULT PASSWORDS FOR DEMO USERS (bcrypt hash of "123456")
-- Note: This should be done via application code, not SQL
-- Password: "123456" -> bcrypt hash (example, replace with actual hash)
UPDATE users SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE password_hash IS NULL AND emp_code IN (
    'TGĐ-001', 'PTGĐ-002', 'GĐ-003', 'PGĐ-004', '200405004', '222102020',
    '202608001', '202608002', 'LT-001', 'NS-001', 'KT-001'
);

-- 7. CLEANUP EXPIRED TOKENS (TTL maintenance)
-- This should be run periodically via CRON or Workers Scheduled Event
DELETE FROM token_blacklist WHERE expires_at < datetime('now', '-7 days');
DELETE FROM idempotency_logs WHERE created_at < datetime('now', '-5 minutes');
DELETE FROM rate_limit_log WHERE window_end < datetime('now', '-1 hour');

-- 8. ADD FOREIGN KEY SUPPORT (note: SQLite requires recreation)
-- Skip for now, will be done in future migration with proper FK constraints

