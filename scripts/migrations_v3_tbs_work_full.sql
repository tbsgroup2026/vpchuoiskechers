-- Script Migration v3: Full TBS Work (Công việc), Authorization 7 Tầng & Security 1-5-2 PIN
-- Target D1 Database: vpchuoiskechers-db (ae3a7efd-ff5d-45c2-8c49-78d1518e3aa1)

-- 1. Bảng PIN Bảo Mật Cá Nhân Module 1-5-2 (Tên duy nhất: user_security_pin)
CREATE TABLE IF NOT EXISTS user_security_pin (
  user_id TEXT PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  must_change_pin INTEGER DEFAULT 1,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Audit Log 1-5-2
CREATE TABLE IF NOT EXISTS module_152_access_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('ACCESS_152', 'FAILED_ACCESS_152', 'LOCKED')),
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Projects & Project Members
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  department_id TEXT,
  manager_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  project_role TEXT CHECK(project_role IN ('MANAGER', 'MEMBER', 'VIEWER')) DEFAULT 'MEMBER',
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 4. Board & Board Members
CREATE TABLE IF NOT EXISTS task_boards (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('PERSONAL', 'DEPARTMENT', 'PROJECT', 'TEAM')),
  department_id TEXT,
  project_id TEXT,
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS board_members (
  board_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  board_role TEXT CHECK(board_role IN ('OWNER', 'EDITOR', 'VIEWER')) DEFAULT 'EDITOR',
  PRIMARY KEY (board_id, user_id),
  FOREIGN KEY (board_id) REFERENCES task_boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_board_columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  title TEXT NOT NULL,
  semantic_type TEXT NOT NULL CHECK(semantic_type IN ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CUSTOM')),
  position REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES task_boards(id) ON DELETE CASCADE
);

-- 5. Tasks Core
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  task_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  board_id TEXT NOT NULL,
  column_id TEXT NOT NULL,
  position REAL NOT NULL,
  department_id TEXT,
  project_id TEXT,
  creator_id TEXT NOT NULL,
  assignee_id TEXT,
  reviewer_id TEXT,
  priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'TODO',
  progress INTEGER DEFAULT 0,
  requires_review INTEGER DEFAULT 1,
  start_date TEXT,
  due_date TEXT,
  result_description TEXT,
  version INTEGER DEFAULT 1,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Task Members (Assignees & Collaborators)
CREATE TABLE IF NOT EXISTS task_members (
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role_type TEXT CHECK(role_type IN ('ASSIGNEE', 'COLLABORATOR')) DEFAULT 'COLLABORATOR',
  PRIMARY KEY (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 7. Task Labels & Label Links
CREATE TABLE IF NOT EXISTS task_labels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  color_code TEXT NOT NULL,
  department_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_label_links (
  task_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  PRIMARY KEY (task_id, label_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES task_labels(id) ON DELETE CASCADE
);

-- 8. Task Checklists & Items
CREATE TABLE IF NOT EXISTS task_checklists (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  position REAL DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_checklist_items (
  id TEXT PRIMARY KEY,
  checklist_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  completed_by TEXT,
  completed_at TEXT,
  position REAL DEFAULT 0,
  FOREIGN KEY (checklist_id) REFERENCES task_checklists(id) ON DELETE CASCADE
);

-- 9. Task Comments & Attachments
CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_attachments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  uploader_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 10. Task Reviews & Activity Logs
CREATE TABLE IF NOT EXISTS task_reviews (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('APPROVE', 'REQUEST_CHANGES')),
  rating INTEGER,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_activity_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 11. Performance Weight Config
CREATE TABLE IF NOT EXISTS performance_weight_config (
  id TEXT PRIMARY KEY,
  completion_weight REAL DEFAULT 0.3,
  on_time_weight REAL DEFAULT 0.3,
  quality_weight REAL DEFAULT 0.2,
  checklist_weight REAL DEFAULT 0.2,
  updated_by TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes tối ưu
CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_task_members_task ON task_members(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
