-- production_backfill.sql
-- PREREQUISITES:
-- 1. `production_schema_fix.sql` has been executed successfully.
-- 2. `sys_my_tasks` is available.

INSERT INTO tasks (
  id, code, title, description, department_id, project_id,
  assignee_emp_code, assignee_department_id, reporter_emp_code,
  start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name
)
SELECT 
  'MIG_' || id, code, title, description, department_id, project_id,
  assignee_emp_code, department_id, reporter_emp_code,
  start_date, due_date,
  CASE 
    WHEN progress = 100 AND status NOT IN ('DONE', 'Hoàn thành') THEN status
    WHEN status = 'TO_DO' THEN 'TO_DO'
    WHEN status = 'DOING' THEN 'DOING'
    WHEN status = 'REVIEW' THEN 'REVIEW'
    WHEN status = 'DONE' THEN 'DONE'
    WHEN status = 'Hoàn thành' THEN 'DONE'
    WHEN status = 'BACKLOG' THEN 'TO_DO'
    ELSE 'TO_DO'
  END,
  progress, tags, checklist, result_description, 1, 'sys_my_tasks', id, ''
FROM sys_my_tasks
WHERE id NOT IN (SELECT legacy_id FROM tasks WHERE legacy_source = 'sys_my_tasks');
