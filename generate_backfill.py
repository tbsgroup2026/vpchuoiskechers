import json
import sqlite3
import uuid

# Recreate the data from TS files
projects = [
  {"id": "PRJ-AUTOMATION", "name": "Tự động hóa dây chuyền & CĐS IT", "dept": "Phòng IT & Chuyển đổi số"},
  {"id": "PRJ-SKECHERS-RETAIL", "name": "Vận hành chuỗi Skechers HQ & Store", "dept": "Phối hợp chuỗi Skechers"},
  {"id": "PRJ-ADMIN-EXPENSE", "name": "Số hóa hành chính & đăng ký xe", "dept": "Phòng Hành chính nhân sự"},
  {"id": "PRJ-KAIZEN-152", "name": "Sáng kiến cải tiến Kaizen & 1-5-2", "dept": "Ban 2.2 / CI-152"},
  {"id": "PRJ-GEMBA-SAFETY", "name": "An toàn lao động & kiểm soát Gemba", "dept": "Ban An toàn & QC"},
  {"id": "PROJ-DIGITAL-2026", "name": "Dự án Chuyển đổi số 2026", "dept": "Phòng IT & Chuyển đổi số"}
]

members = [
    ("PROJ-DIGITAL-2026", "202608001", "PROJECT_MANAGER"),
    ("PROJ-DIGITAL-2026", "202608002", "MEMBER"),
    ("PROJ-DIGITAL-2026", "202608003", "MEMBER"),
    ("PROJ-DIGITAL-2026", "202608005", "MEMBER")
]

# We need to map tasks from sys_my_tasks
sql = []

# Seed Projects
for p in projects:
    sql.append(f"INSERT INTO projects (id, code, name, department_id, is_mock) VALUES ('{p['id']}', '{p['id']}', '{p['name']}', '{p['dept']}', 1) ON CONFLICT(id) DO NOTHING;")

# Seed Project Members
for m in members:
    sql.append(f"INSERT INTO project_members (project_id, emp_code, project_role) VALUES ('{m[0]}', '{m[1]}', '{m[2]}') ON CONFLICT DO NOTHING;")

# Backfill tasks from sys_my_tasks
sql.append("""
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
""")

with open("web/scripts/staging_backfill.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql))
