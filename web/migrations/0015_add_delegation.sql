-- Migration number: 0015
-- Add delegation columns to tasks and business trips

-- Add delegation columns to tasks
ALTER TABLE tasks ADD COLUMN delegated_to_emp_code TEXT;
ALTER TABLE tasks ADD COLUMN delegated_at DATETIME;
ALTER TABLE tasks ADD COLUMN is_escalated BOOLEAN DEFAULT 0;

-- Add delegation columns to business_trips
ALTER TABLE business_trips ADD COLUMN delegated_to_emp_code TEXT;
ALTER TABLE business_trips ADD COLUMN delegated_at DATETIME;
ALTER TABLE business_trips ADD COLUMN is_escalated BOOLEAN DEFAULT 0;

-- Audit table for delegation history
CREATE TABLE IF NOT EXISTS delegation_audit_logs (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'TASK' or 'BUSINESS_TRIP'
    entity_id TEXT NOT NULL,
    original_emp_code TEXT NOT NULL,
    delegated_to_emp_code TEXT NOT NULL,
    delegated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);
