-- ============================================================
-- MIGRATION 0002: MAINTENANCE TICKETS EXTENSION & QC MODULE TABLES
-- ============================================================

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


-- 2. CREATE QC DEFECT REPORTS TABLE
CREATE TABLE IF NOT EXISTS qc_defect_reports (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'REPORTED', -- REPORTED, INVESTIGATING, ACTION_REQUIRED, RESOLVED, VERIFIED
    created_by TEXT NOT NULL,
    description TEXT NOT NULL,
    action_required_note TEXT,
    resolved_at DATETIME,
    verified_by TEXT,
    verified_at DATETIME,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE QC KAIZEN SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS qc_kaizen_submissions (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, IMPLEMENTED
    submitted_by TEXT NOT NULL,
    description TEXT NOT NULL,
    review_note TEXT,
    reviewed_by TEXT,
    reviewed_at DATETIME,
    implemented_at DATETIME,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
