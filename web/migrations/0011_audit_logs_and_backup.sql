-- ============================================================
-- MIGRATION 0011: AUTOMATED AUDIT LOGS & GOOGLE DRIVE BACKUP SYSTEM
-- ============================================================

-- 1. AUDIT LOGS TABLE FOR CENTRALIZED CHANGE TRACKING
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    emp_code TEXT,
    role_code TEXT,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    record_id TEXT,
    data_before TEXT,
    data_after TEXT,
    changes_json TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action ON audit_logs(module, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_emp_code ON audit_logs(emp_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(module, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 2. SYSTEM BACKUPS LOG TABLE
CREATE TABLE IF NOT EXISTS system_backups (
    id TEXT PRIMARY KEY,
    backup_type TEXT NOT NULL, -- MANUAL, SCHEDULED
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER DEFAULT 0,
    gdrive_file_id TEXT,
    status TEXT DEFAULT 'SUCCESS', -- SUCCESS, FAILED
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON system_backups(created_at DESC);
