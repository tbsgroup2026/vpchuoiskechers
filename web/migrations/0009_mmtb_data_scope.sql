-- Migration 0009: MMTB Data Scope Isolation Schema
-- Adds data_scope column ('OFFICE', 'EAST', 'KIEN_GIANG') to MMTB tables
-- Version: 2026-09-09

-- 1. ADD DATA_SCOPE TO MACHINES
ALTER TABLE machines ADD COLUMN data_scope TEXT DEFAULT 'OFFICE';
CREATE INDEX IF NOT EXISTS idx_machines_data_scope ON machines(data_scope);

-- 2. ADD DATA_SCOPE TO MAINTENANCE_TICKETS
ALTER TABLE maintenance_tickets ADD COLUMN data_scope TEXT DEFAULT 'OFFICE';
CREATE INDEX IF NOT EXISTS idx_tickets_data_scope ON maintenance_tickets(data_scope);

-- 3. ADD DATA_SCOPE TO MAINTENANCE_SCHEDULES
ALTER TABLE maintenance_schedules ADD COLUMN data_scope TEXT DEFAULT 'OFFICE';
CREATE INDEX IF NOT EXISTS idx_schedules_data_scope ON maintenance_schedules(data_scope);

-- 4. ADD DATA_SCOPE AND IS_GLOBAL TO EQUIPMENT_CATEGORIES
ALTER TABLE equipment_categories ADD COLUMN data_scope TEXT DEFAULT 'OFFICE';
ALTER TABLE equipment_categories ADD COLUMN is_global INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_categories_data_scope ON equipment_categories(data_scope);

-- 5. ADD DATA_SCOPE TO FACTORY_FLOOR_PLANS
CREATE TABLE IF NOT EXISTS factory_floor_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    data_scope TEXT DEFAULT 'OFFICE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_floor_plans_data_scope ON factory_floor_plans(data_scope);

-- 6. ADD DATA_SCOPE TO EQUIPMENT_IMPROVEMENTS
CREATE TABLE IF NOT EXISTS equipment_improvements (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'IMPROVEMENT_IDEA',
    reason TEXT NOT NULL,
    resolved INTEGER DEFAULT 0,
    data_scope TEXT DEFAULT 'OFFICE',
    submitted_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_improvements_data_scope ON equipment_improvements(data_scope);
