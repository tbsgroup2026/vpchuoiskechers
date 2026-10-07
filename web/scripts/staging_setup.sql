-- ====================================================
-- MIGRATION V2 - Staging Script
-- Target DB: vpchuoiskechers-db-staging (2c4b166d-77cb-4615-a53b-e5975b5774b9)
-- KHÔNG chạy trên production DB.
-- ====================================================

-- ==== BƯỚC 1: Tạo bảng mới ====

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  scope TEXT DEFAULT 'DEPARTMENT',
  department_id TEXT,
  status TEXT DEFAULT 'ACTIVE',
  description TEXT,
  color_theme TEXT DEFAULT 'green',
  is_mock INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id TEXT NOT NULL,
  emp_code TEXT NOT NULL,
  project_role TEXT DEFAULT 'MEMBER',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, emp_code)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  department_id TEXT,
  project_id TEXT,
  assignee_emp_code TEXT,
  assignee_department_id TEXT,
  reporter_emp_code TEXT,
  start_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'TO_DO',
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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==== BƯỚC 2: Tạo bảng sys_my_tasks giả lập (legacy) ====
-- Cấu trúc khớp chính xác với production để migration chạy được.

CREATE TABLE IF NOT EXISTS sys_my_tasks (
  id TEXT PRIMARY KEY,
  code TEXT,
  title TEXT,
  description TEXT,
  department_id TEXT,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  project_id TEXT,
  help_reason TEXT,
  help_notified_to TEXT
);

-- ==== BƯỚC 3: Seed 30 tasks từ production (dữ liệu thực để test migration) ====

INSERT OR IGNORE INTO sys_my_tasks (id, title, status, assignee_emp_code, reporter_emp_code, department_id, due_date, start_date, progress) VALUES
('tsk_001','Triển khai hệ thống Work Hub nội bộ TBS Group','TO_DO','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_002','Số hóa quy trình đăng ký xe đi công tác các nhà máy','REVIEW','202608001','202608001','IT_DIGITAL','2026-09-20','2026-09-15',100),
('tsk_003','Nâng cấp hệ thống Andon báo lỗi chuyền may 5','TO_DO','202608001','202608001','IT_DIGITAL','2026-09-10','2026-09-15',100),
('tsk_004','Tự động hóa sao lưu dữ liệu toàn hệ thống lên Google Drive','DOING','202608001','202608001','IT_DIGITAL','2026-09-12','2026-09-15',100),
('tsk_1789445769874_e6hw','213','REVIEW','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445770973_63zo','213','REVIEW','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445780516_eqqz','213','DOING','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445786831_nt00','213','DOING','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445787116_tecl','213','DOING','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445787259_8u3b','213','BACKLOG','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445787429_bs5q','213','DOING','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445787609_uibd','213','DOING','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445788233_3kbj','213','BACKLOG','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445788233_u1e5','213','BACKLOG','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445792588_kklk','213','DOING','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789445912839_6gf6','123','REVIEW','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_1789543291210_2c22','test 169','BACKLOG','202608001','202608001','PRJ-AUTOMATION','2026-09-16','2026-09-16',0),
('tsk_1789629317683_xmt3','test113','BACKLOG','202203002','202608001','PRJ-AUTOMATION','2026-09-30','2026-09-17',0),
('tsk_1789629478830_cbfk','179','BACKLOG','202608001','202608001','PRJ-AUTOMATION','2026-09-17','2026-09-17',0),
('tsk_1789630002678_bt5e','test179','BACKLOG','202608001','202608001','PRJ-AUTOMATION','2026-09-17','2026-09-17',0),
('tsk_1789630412955_gamr','1','BACKLOG','202608001','202608001','PRJ-AUTOMATION','2026-09-17','2026-09-17',0),
('tsk_1789632064686_jeb0','123','DOING','202608001','202608001','PRJ-AUTOMATION','2026-09-17','2026-09-17',0),
('tsk_1789633109731_tsxh','318','DOING','202608001','202608001','PRJ-AUTOMATION','2026-09-17','2026-09-17',0),
('tsk_1789634297675_ndhx','338','BACKLOG','202608001','202608001','PRJ-AUTOMATION','2026-09-17','2026-09-17',0),
('tsk_1789634682097_yeah','344','REVIEW','202608001','202608001','PRJ-AUTOMATION','2026-09-17','2026-09-17',0),
('tsk_1789634947207_nhr9','348','TO_DO','202608001','202608001','PRJ-AUTOMATION','2026-09-17','2026-09-17',0),
('tsk_1789981834802_vmqp','Hoàn tất phần mềm đăng ký công tác','REVIEW','202608001','202608001','PRJ-AUTOMATION','2026-09-23','2026-09-21',0),
('tsk_extra_001','Task test 1','TO_DO','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_extra_002','Task test 2','TO_DO','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0),
('tsk_extra_003','Task test 3','BACKLOG','202608001','202608001','IT_DIGITAL','2026-09-15','2026-09-15',0);

-- ==== BƯỚC 4: Seed bảng task_boards (giả lập từ production) ====

CREATE TABLE IF NOT EXISTS task_boards (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT DEFAULT 'personal',
  department_id TEXT,
  owner_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO task_boards (id, name, type, department_id, owner_id) VALUES
('tb_dept_it', 'Bảng Công Việc Phòng IT & CĐS', 'department', 'IT_CDS', '202608001'),
('tb_202608001_personal', 'Bảng Công Việc Cá Nhân', 'personal', 'IT_CDS', '202608001');

CREATE TABLE IF NOT EXISTS task_lists (
  id TEXT PRIMARY KEY,
  board_id TEXT,
  name TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_cards (
  id TEXT PRIMARY KEY,
  list_id TEXT,
  board_id TEXT,
  title TEXT,
  description TEXT,
  assignee_emp_code TEXT,
  due_date TEXT,
  color_state TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
