-- Rollback 0015

ALTER TABLE tasks DROP COLUMN delegated_to_emp_code;
ALTER TABLE tasks DROP COLUMN delegated_at;
ALTER TABLE tasks DROP COLUMN is_escalated;

ALTER TABLE business_trips DROP COLUMN delegated_to_emp_code;
ALTER TABLE business_trips DROP COLUMN delegated_at;
ALTER TABLE business_trips DROP COLUMN is_escalated;

DROP TABLE IF EXISTS delegation_audit_logs;
