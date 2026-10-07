-- ====================================================
-- MIGRATION V2 - Chính thức
-- Chạy SAU khi staging_setup.sql đã chạy thành công.
-- Idempotent: chạy lại nhiều lần không nhân đôi dữ liệu.
-- ====================================================

-- ==== BƯỚC 1: Seed Projects từ PROJECTS_INITIAL ====

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

-- ==== BƯỚC 2: Seed Project Members ====
-- Ghi chú: NS-001, QC-001, KT-001 là emp_code không map được sang SYSTEM_USERS.
-- Đã báo cáo bên dưới. Seed giữ nguyên emp_code cũ để không mất thông tin.

INSERT OR IGNORE INTO project_members (project_id, emp_code, project_role) VALUES
  ('PROJ-01', '202608001', 'PROJECT_MANAGER'),
  ('PROJ-01', 'NS-001', 'MEMBER'),
  ('PROJ-01', 'QC-001', 'MEMBER'),
  ('PROJ-01', 'KT-001', 'MEMBER');

-- ==== BƯỚC 3: Migrate sys_my_tasks → tasks ====
-- ID mới = 'MIG_' || id_cũ để KHÔNG đè ID cũ.
-- Ánh xạ status:
--   BACKLOG  → TO_DO   (chưa bắt đầu, chưa có trong whitelist mới)
--   TO_DO    → TO_DO
--   DOING    → DOING
--   REVIEW   → REVIEW
--   DONE     → DONE
--   CANCELLED→ CANCELLED
-- assignee_department_id: tạm lấy department_id của task (xem ghi chú trong báo cáo)

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
  CASE
    WHEN start_date LIKE '____-__-__%' THEN SUBSTR(start_date, 1, 10)
    ELSE NULL
  END AS start_date,
  CASE
    WHEN due_date LIKE '____-__-__%' THEN SUBSTR(due_date, 1, 10)
    ELSE NULL
  END AS due_date,
  CASE
    WHEN status = 'BACKLOG'   THEN 'TO_DO'
    WHEN status = 'TO_DO'     THEN 'TO_DO'
    WHEN status = 'DOING'     THEN 'DOING'
    WHEN status = 'REVIEW'    THEN 'REVIEW'
    WHEN status = 'DONE'      THEN 'DONE'
    WHEN status = 'CANCELLED' THEN 'CANCELLED'
    ELSE 'TO_DO'
  END AS status,
  COALESCE(progress, 0) AS progress,
  tags,
  checklist AS checklist_json,
  result_description,
  1 AS is_mock,
  'sys_my_tasks' AS legacy_source,
  id AS legacy_id,
  NULL AS legacy_column_name,
  created_at,
  updated_at
FROM sys_my_tasks;

-- ==== BƯỚC 4: Migrate task_cards → tasks (nếu có) ====
-- task_cards đang trống (0 bản ghi), script này idempotent và chạy đúng.

INSERT OR IGNORE INTO tasks (
  id, title, description, assignee_emp_code, due_date, status,
  is_mock, legacy_source, legacy_id, legacy_column_name,
  created_at, updated_at
)
SELECT
  'CARD_' || tc.id,
  tc.title,
  tc.description,
  tc.assignee_emp_code,
  CASE
    WHEN tc.due_date LIKE '____-__-__%' THEN SUBSTR(tc.due_date, 1, 10)
    ELSE NULL
  END AS due_date,
  CASE
    WHEN tl.name IN ('Hoàn thành', 'Done', 'Xong', 'DONE') THEN 'DONE'
    WHEN tl.name IN ('Đang làm', 'In Progress', 'DOING', 'Doing') THEN 'DOING'
    WHEN tl.name IN ('Review', 'Chờ duyệt', 'REVIEW') THEN 'REVIEW'
    ELSE 'TO_DO'
  END AS status,
  1 AS is_mock,
  'task_cards' AS legacy_source,
  tc.id AS legacy_id,
  tl.name AS legacy_column_name,
  tc.created_at,
  tc.updated_at
FROM task_cards tc
LEFT JOIN task_lists tl ON tl.id = tc.list_id;

-- ==== BƯỚC 5: Seed 12 mock tasks từ PROJECTS_INITIAL ====

INSERT OR IGNORE INTO tasks (id, title, project_id, department_id, status, progress, is_mock, created_at)
VALUES
  ('MOCK-TASK-01', 'Tự động hóa báo cáo nội bộ',          'PRJ-AUTOMATION',    'IT_CDS',   'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-02', 'Tích hợp AI cho hệ thống Gemba',       'PRJ-AUTOMATION',    'IT_CDS',   'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-03', 'Kết nối hệ thống ERP sản xuất',        'PRJ-AUTOMATION',    'IT_CDS',   'DOING',  50, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-04', 'Đồng bộ đơn hàng Skechers HQ',         'PRJ-SKECHERS-RETAIL','PHOIHOP', 'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-05', 'Quản lý kho vận chuỗi cửa hàng',       'PRJ-SKECHERS-RETAIL','PHOIHOP', 'DOING',  60, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-06', 'Số hóa biểu mẫu công tác phí',         'PRJ-ADMIN-EXPENSE', 'HCNS',     'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-07', 'Module đăng ký xe đi công tác',        'PRJ-ADMIN-EXPENSE', 'HCNS',     'DOING',  40, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-08', 'Thống kê đề xuất Kaizen theo tháng',   'PRJ-KAIZEN-152',    'CI152',    'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-09', 'Thẩm định hiệu quả tiết kiệm Q3',      'PRJ-KAIZEN-152',    'CI152',    'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-10', 'Chấm điểm sáng kiến 1-5-2 đợt 2',     'PRJ-KAIZEN-152',    'CI152',    'DOING',  70, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-11', 'Ghi nhận lỗi Gemba walk khu vực A',    'PRJ-GEMBA-SAFETY',  'QC',       'DONE',  100, 1, CURRENT_TIMESTAMP),
  ('MOCK-TASK-12', 'Khắc phục sự cố an toàn lao động',     'PRJ-GEMBA-SAFETY',  'QC',       'DOING',  30, 1, CURRENT_TIMESTAMP);

-- ==== BƯỚC 6: Tạo indexes ====

CREATE INDEX IF NOT EXISTS idx_tasks_assignee      ON tasks(assignee_emp_code);
CREATE INDEX IF NOT EXISTS idx_tasks_dept          ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_dept ON tasks(assignee_department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project       ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date      ON tasks(due_date);

-- ==== BƯỚC 7: Verification Queries (Nghiệm thu) ====
-- Chạy riêng sau khi migration xong:
-- SELECT legacy_source, COUNT(*) FROM tasks GROUP BY legacy_source;
-- SELECT COUNT(*) FROM projects;
-- SELECT COUNT(*) FROM project_members;
