-- Rollback cho 0013_tasks_performance_indexes
DROP INDEX IF EXISTS idx_tasks_dept;
DROP INDEX IF EXISTS idx_tasks_assignee;
DROP INDEX IF EXISTS idx_tasks_status_dates;
