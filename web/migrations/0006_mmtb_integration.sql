-- Migration 0006: MMTB (Maintenance) Integration Schema
-- Version: 2026-09-08

-- 1. Machines Catalog Table
CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    serial TEXT,
    zone TEXT NOT NULL,
    status TEXT DEFAULT 'OPERATING', -- OPERATING, DOWN, WARNING, MAINTENANCE
    qr_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Maintenance Tickets (Repair Requests)
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id TEXT PRIMARY KEY,
    ticket_code TEXT NOT NULL UNIQUE,
    machine_id TEXT NOT NULL,
    machine_name TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    priority TEXT DEFAULT 'NORMAL', -- NORMAL, HIGH, URGENT
    status TEXT DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, RESOLVED, CANCELLED
    reporter_name TEXT NOT NULL,
    created_by TEXT,
    assigned_to TEXT,
    resolved_note TEXT,
    resolved_at DATETIME,
    reopen_reason TEXT,
    source_module TEXT DEFAULT 'MMTB',
    source_record_id TEXT,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Maintenance Schedules (Preventive Maintenance)
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    machine_name TEXT NOT NULL,
    task_name TEXT NOT NULL,
    scheduled_date TEXT NOT NULL,
    frequency TEXT DEFAULT 'Monthly', -- Weekly, Monthly, Quarterly, Yearly
    status TEXT DEFAULT 'PLANNED', -- PLANNED, COMPLETED, OVERDUE
    technician_name TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Equipment Categories Table
CREATE TABLE IF NOT EXISTS equipment_categories (
    id TEXT PRIMARY KEY,
    category_code TEXT NOT NULL UNIQUE,
    category_name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
