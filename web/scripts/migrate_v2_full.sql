-- ====================================================
-- MIGRATION V2 - Tách 2 phần: CREATE và INSERT
-- Bước này: Tạo bảng và seed hoàn chỉnh.
-- ====================================================

-- ==== Phần A: Tạo bảng ====

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

-- ==== Phần B: Seed Projects ====

INSERT OR IGNORE INTO projects (id, code, name, scope, department_id, description, color_theme, is_mock)
VALUES 
  ('PROJ-01', 'PROJ-DIGITAL-2026', 'Chuyển Đổi Số SKECHERS 2026', 'CROSS_DEPT', 'IT_CDS',
   'Dự án số hóa toàn diện quy trình sản xuất, Gemba & MMTB Văn phòng chuỗi SKECHERS - TBS Group.', 'amber', 1),
  ('PRJ-AUTOMATION', 'PRJ-AUTOMATION', 'Tự động hóa dây chuyền & CĐS IT', 'DEPARTMENT', 'IT_CDS',
   'Tự động hóa báo cáo, tích hợp AI Gemba & hệ thống ERP sản xuất.', 'indigo', 1),
  ('PRJ-SKECHERS-RETAIL', 'PRJ-SKECHERS-RETAIL', 'Vận hành chuỗi Skechers HQ & Store', 'DEPARTMENT', 'PHOIHOP',
   'Quản lý đơn hàng, kho vận và đồng bộ sản phẩm chuỗi cửa hàng.', 'green', 1),
  ('PRJ-ADMIN-EXPENSE', 'PRJ-ADMIN-EXPENSE', 'Số hóa hành chính & đăng ký xe', 'DEPARTMENT', 'HCNS',
   'Số hóa công tác phí, đăng ký xe công tác và phòng họp thông minh.', 'amber', 1),
  ('PRJ-KAIZEN-152', 'PRJ-KAIZEN-152', 'Sáng kiến cải tiến Kaizen & 1-5-2', 'DEPARTMENT', 'CI152',
   'Thống kê đề xuất Kaizen, thẩm định hiệu quả tiết kiệm và chấm điểm.', 'blue', 1),
  ('PRJ-GEMBA-SAFETY', 'PRJ-GEMBA-SAFETY', 'An toàn lao động & kiểm soát Gemba', 'DEPARTMENT', 'QC',
   'Ghi nhận lỗi Gemba walk, theo dõi khắc phục sự cố tại xưởng.', 'rose', 1);

INSERT OR IGNORE INTO project_members (project_id, emp_code, project_role) VALUES
  ('PROJ-01', '202608001', 'PROJECT_MANAGER'),
  ('PROJ-01', 'NS-001', 'MEMBER'),
  ('PROJ-01', 'QC-001', 'MEMBER'),
  ('PROJ-01', 'KT-001', 'MEMBER');

-- ==== Phần C: Migrate sys_my_tasks ====

INSERT OR IGNORE INTO tasks (
  id, code, title, description, department_id, assignee_emp_code, assignee_department_id,
  reporter_emp_code, start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name,
  created_at, updated_at
)
SELECT
  'MIG_' || id,
  code,
  title,
  description,
  department_id,
  assignee_emp_code,
  department_id AS assignee_department_id,
  reporter_emp_code,
  CASE WHEN start_date LIKE '____-__-__%' THEN SUBSTR(start_date, 1, 10) ELSE NULL END,
  CASE WHEN due_date LIKE '____-__-__%' THEN SUBSTR(due_date, 1, 10) ELSE NULL END,
  CASE
    WHEN status = 'BACKLOG'   THEN 'TO_DO'
    WHEN status = 'TO_DO'     THEN 'TO_DO'
    WHEN status = 'DOING'     THEN 'DOING'
    WHEN status = 'REVIEW'    THEN 'REVIEW'
    WHEN status = 'DONE'      THEN 'DONE'
    WHEN status = 'CANCELLED' THEN 'CANCELLED'
    ELSE 'TO_DO'
  END,
  COALESCE(progress, 0),
  tags,
  checklist,
  result_description,
  1,
  'sys_my_tasks',
  id,
  NULL,
  created_at,
  updated_at
FROM sys_my_tasks;

-- ==== Phần D: Migrate task_cards ====

INSERT OR IGNORE INTO tasks (
  id, title, description, assignee_emp_code, due_date, status,
  is_mock, legacy_source, legacy_id, legacy_column_name, created_at, updated_at
)
SELECT
  'CARD_' || tc.id,
  tc.title,
  tc.description,
  tc.assignee_emp_code,
  CASE WHEN tc.due_date LIKE '____-__-__%' THEN SUBSTR(tc.due_date, 1, 10) ELSE NULL END,
  CASE
    WHEN tl.name IN ('Hoàn thành', 'Done', 'Xong', 'DONE') THEN 'DONE'
    WHEN tl.name IN ('Đang làm', 'In Progress', 'DOING', 'Doing') THEN 'DOING'
    WHEN tl.name IN ('Review', 'Chờ duyệt', 'REVIEW') THEN 'REVIEW'
    ELSE 'TO_DO'
  END,
  1,
  'task_cards',
  tc.id,
  tl.name,
  tc.created_at,
  tc.updated_at
FROM task_cards tc
LEFT JOIN task_lists tl ON tl.id = tc.list_id;

-- ==== Phần E: Seed 12 mock tasks ====

INSERT OR IGNORE INTO tasks (id, title, project_id, department_id, status, progress, is_mock, created_at)
VALUES
  ('MOCK-TASK-01', 'Tự động hóa báo cáo nội bộ',         'PRJ-AUTOMATION',    'IT_CDS',  'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-02', 'Tích hợp AI cho hệ thống Gemba',      'PRJ-AUTOMATION',    'IT_CDS',  'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-03', 'Kết nối hệ thống ERP sản xuất',       'PRJ-AUTOMATION',    'IT_CDS',  'DOING',  50, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-04', 'Đồng bộ đơn hàng Skechers HQ',        'PRJ-SKECHERS-RETAIL','PHOIHOP','DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-05', 'Quản lý kho vận chuỗi cửa hàng',      'PRJ-SKECHERS-RETAIL','PHOIHOP','DOING',  60, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-06', 'Số hóa biểu mẫu công tác phí',        'PRJ-ADMIN-EXPENSE', 'HCNS',    'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-07', 'Module đăng ký xe đi công tác',       'PRJ-ADMIN-EXPENSE', 'HCNS',    'DOING',  40, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-08', 'Thống kê đề xuất Kaizen theo tháng',  'PRJ-KAIZEN-152',    'CI152',   'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-09', 'Thẩm định hiệu quả tiết kiệm Q3',     'PRJ-KAIZEN-152',    'CI152',   'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-10', 'Chấm điểm sáng kiến 1-5-2 đợt 2',    'PRJ-KAIZEN-152',    'CI152',   'DOING',  70, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-11', 'Ghi nhận lỗi Gemba walk khu vực A',   'PRJ-GEMBA-SAFETY',  'QC',      'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-12', 'Khắc phục sự cố an toàn lao động',    'PRJ-GEMBA-SAFETY',  'QC',      'DOING',  30, 1, CURRENT_TIMESTAMP);

-- ==== Phần F: Indexes ====

CREATE INDEX IF NOT EXISTS idx_tasks_assignee      ON tasks(assignee_emp_code);
CREATE INDEX IF NOT EXISTS idx_tasks_dept          ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_dept ON tasks(assignee_department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project       ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date      ON tasks(due_date);
