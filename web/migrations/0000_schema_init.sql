PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS zalo_bot_chat_history (id TEXT PRIMARY KEY, chat_id TEXT, user_id TEXT, role TEXT, text TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS zalo_bot_rate_limit (user_id TEXT PRIMARY KEY, count INTEGER DEFAULT 1, reset_at DATETIME);
CREATE TABLE IF NOT EXISTS zalo_bot_allowed_groups (group_id TEXT PRIMARY KEY, name TEXT, is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS task_boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'personal',
        department_id TEXT,
        owner_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE IF NOT EXISTS task_lists (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE IF NOT EXISTS task_cards (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL,
        board_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        assignee_id TEXT,
        deadline TEXT,
        status TEXT DEFAULT 'in_progress',
        color_state TEXT DEFAULT 'green',
        job_position_id TEXT,
        created_by TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      , version INTEGER DEFAULT 1, write_token TEXT, code TEXT);
INSERT INTO "task_cards" ("id","list_id","board_id","title","description","assignee_id","deadline","status","color_state","job_position_id","created_by","sort_order","created_at","updated_at","version","write_token","code") VALUES('tc_1791374443106_7xg3','list_1','board_1','Thẻ Test Concurrency Real','','202608001',NULL,'in_progress','green',NULL,'202608001',0,'2026-10-07 12:00:43','2026-10-07 12:00:43',1,NULL,NULL);
CREATE TABLE IF NOT EXISTS task_card_reviews (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        comment TEXT,
        reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE IF NOT EXISTS role_workspace_config (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        route TEXT NOT NULL,
        label TEXT NOT NULL,
        icon TEXT DEFAULT 'IconChevronRight',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE IF NOT EXISTS user_security_pin (
        user_id TEXT PRIMARY KEY,
        pin_hash TEXT NOT NULL,
        must_change_pin INTEGER DEFAULT 1,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE IF NOT EXISTS admin_module_pin (
        user_id TEXT PRIMARY KEY,
        pin_hash TEXT NOT NULL,
        must_change_pin INTEGER DEFAULT 1,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE IF NOT EXISTS module_152_access_log (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        emp_code TEXT,
        emp_name TEXT,
        role_code TEXT,
        module TEXT,
        action TEXT,
        record_id TEXT,
        changes_json TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE IF NOT EXISTS sys_my_tasks (
        id TEXT PRIMARY KEY,
        code TEXT,
        title TEXT,
        description TEXT,
        department_id TEXT,
        project_id TEXT,
        assignee_emp_code TEXT,
        assignee_name TEXT,
        reporter_emp_code TEXT,
        reviewer_emp_code TEXT,
        priority TEXT,
        start_date TEXT,
        due_date TEXT,
        status TEXT,
        progress INTEGER,
        tags TEXT,
        checklist TEXT,
        result_description TEXT,
        help_reason TEXT,
        help_notified_to TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
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
, code TEXT);
CREATE TABLE IF NOT EXISTS task_members (
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role_type TEXT CHECK(role_type IN ('ASSIGNEE', 'COLLABORATOR')) DEFAULT 'COLLABORATOR',
  PRIMARY KEY (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
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
CREATE TABLE IF NOT EXISTS performance_weight_config (
  id TEXT PRIMARY KEY,
  completion_weight REAL DEFAULT 0.3,
  on_time_weight REAL DEFAULT 0.3,
  quality_weight REAL DEFAULT 0.2,
  checklist_weight REAL DEFAULT 0.2,
  updated_by TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
DELETE FROM sqlite_sequence;
CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_task_members_task ON task_members(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);