-- ============================================================
-- MIGRATION 0018: SECURITY HARDENING, DATA SCOPING & INDEXES
-- ============================================================

-- 1. TOKEN BLACKLIST FOR LOGOUT REVOCATION
CREATE TABLE IF NOT EXISTS token_blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    emp_code TEXT,
    expires_at DATETIME NOT NULL,
    blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT DEFAULT 'LOGOUT'
);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- 2. USER FACTORY ACCESS FOR MULTI-TENANT FACTORY SCOPING
CREATE TABLE IF NOT EXISTS user_factory_access (
    user_id TEXT NOT NULL,
    factory_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, factory_id)
);
CREATE INDEX IF NOT EXISTS idx_user_factory_access_uid ON user_factory_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_factory_access_fid ON user_factory_access(factory_id);

-- SEED INITIAL FACTORY MAPPINGS
INSERT OR IGNORE INTO user_factory_access (user_id, factory_id) VALUES ('202608001', 'TB1');
INSERT OR IGNORE INTO user_factory_access (user_id, factory_id) VALUES ('202608001', 'TB2');
INSERT OR IGNORE INTO user_factory_access (user_id, factory_id) VALUES ('202608001', 'KG');
INSERT OR IGNORE INTO user_factory_access (user_id, factory_id) VALUES ('202608002', 'KG');
INSERT OR IGNORE INTO user_factory_access (user_id, factory_id) VALUES ('202608005', 'TB1');

-- 3. ENSURE MAINTENANCE TICKETS TABLE EXISTS
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id TEXT PRIMARY KEY,
    ticket_code TEXT,
    machine_id TEXT,
    reported_by_id TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'OPEN',
    description TEXT,
    created_by TEXT,
    assigned_to TEXT,
    resolved_note TEXT,
    resolved_at DATETIME,
    reopen_reason TEXT,
    source_module TEXT,
    source_record_id TEXT,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. ESSENTIAL QUERY INDEXES TO PREVENT FULL TABLE SCANS
CREATE INDEX IF NOT EXISTS idx_kaizen_status_factory ON ci_kaizen_proposals(status, factory);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON sys_notifications(target_user);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status ON maintenance_tickets(status);
