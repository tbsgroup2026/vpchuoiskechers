INSERT INTO projects (id, code, name, department_id, is_mock) VALUES ('PRJ-AUTOMATION', 'PRJ-AUTOMATION', 'Tự động hóa dây chuyền & CĐS IT', 'Phòng IT & Chuyển đổi số', 1) ON CONFLICT(id) DO NOTHING;
INSERT INTO projects (id, code, name, department_id, is_mock) VALUES ('PRJ-SKECHERS-RETAIL', 'PRJ-SKECHERS-RETAIL', 'Vận hành chuỗi Skechers HQ & Store', 'Phối hợp chuỗi Skechers', 1) ON CONFLICT(id) DO NOTHING;
INSERT INTO projects (id, code, name, department_id, is_mock) VALUES ('PRJ-ADMIN-EXPENSE', 'PRJ-ADMIN-EXPENSE', 'Số hóa hành chính & đăng ký xe', 'Phòng Hành chính nhân sự', 1) ON CONFLICT(id) DO NOTHING;
INSERT INTO projects (id, code, name, department_id, is_mock) VALUES ('PRJ-KAIZEN-152', 'PRJ-KAIZEN-152', 'Sáng kiến cải tiến Kaizen & 1-5-2', 'Ban 2.2 / CI-152', 1) ON CONFLICT(id) DO NOTHING;
INSERT INTO projects (id, code, name, department_id, is_mock) VALUES ('PRJ-GEMBA-SAFETY', 'PRJ-GEMBA-SAFETY', 'An toàn lao động & kiểm soát Gemba', 'Ban An toàn & QC', 1) ON CONFLICT(id) DO NOTHING;
INSERT INTO projects (id, code, name, department_id, is_mock) VALUES ('PROJ-DIGITAL-2026', 'PROJ-DIGITAL-2026', 'Dự án Chuyển đổi số 2026', 'Phòng IT & Chuyển đổi số', 1) ON CONFLICT(id) DO NOTHING;
INSERT INTO project_members (project_id, emp_code, project_role) VALUES ('PROJ-DIGITAL-2026', '202608001', 'PROJECT_MANAGER') ON CONFLICT DO NOTHING;
INSERT INTO project_members (project_id, emp_code, project_role) VALUES ('PROJ-DIGITAL-2026', '202608002', 'MEMBER') ON CONFLICT DO NOTHING;
INSERT INTO project_members (project_id, emp_code, project_role) VALUES ('PROJ-DIGITAL-2026', '202608003', 'MEMBER') ON CONFLICT DO NOTHING;
INSERT INTO project_members (project_id, emp_code, project_role) VALUES ('PROJ-DIGITAL-2026', '202608005', 'MEMBER') ON CONFLICT DO NOTHING;

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
