-- production_schema_fix.sql
-- PREREQUISITES:
-- 1. Backup of production has been made and verified.
-- 2. Code running on production does not query `tasks`, `projects`, `project_members` yet (currently using `sys_my_tasks` via `TASKS_SOURCE='legacy'`).
-- 3. These 3 tables are currently EMPTY.

DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  scope TEXT DEFAULT 'DEPARTMENT',
  department_id TEXT,
  status TEXT DEFAULT 'ACTIVE',
  description TEXT,
  color_theme TEXT DEFAULT 'green',
  is_mock INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_members (
  project_id TEXT NOT NULL,
  emp_code TEXT NOT NULL,
  project_role TEXT DEFAULT 'MEMBER',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, emp_code)
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  department_id TEXT,
  project_id TEXT,
  assignee_emp_code TEXT,
  assignee_department_id TEXT,
  reporter_emp_code TEXT,
  start_date TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'TO_DO' CHECK (status IN ('TO_DO', 'DOING', 'REVIEW', 'DONE', 'CANCELLED')),
  sort_order INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  tags TEXT,
  checklist_json TEXT,
  attachments_json TEXT,
  result_description TEXT,
  is_mock INTEGER DEFAULT 0,
  legacy_source TEXT,
  legacy_id TEXT,
  legacy_column_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(legacy_source, legacy_id)
);

CREATE INDEX idx_tasks_assignee_emp_code ON tasks(assignee_emp_code);
CREATE INDEX idx_tasks_assignee_department_id ON tasks(assignee_department_id);
CREATE INDEX idx_tasks_department_id ON tasks(department_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
