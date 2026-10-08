-- 0013_tasks_performance_indexes.sql

-- Index for querying by department and task assignment
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_emp_code);
CREATE INDEX IF NOT EXISTS idx_tasks_reporter ON tasks(reporter_emp_code);

-- Index for status filtering and fast pagination sorting
CREATE INDEX IF NOT EXISTS idx_tasks_status_date ON tasks(status, updated_at DESC, created_at DESC);

-- Index for Task Cards (Kanban) fetching
CREATE INDEX IF NOT EXISTS idx_task_cards_board ON task_cards(board_id, list_id, sort_order);
