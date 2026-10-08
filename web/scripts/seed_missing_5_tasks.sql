-- Seed the missing 5 mock tasks for PROJECTS_INITIAL to match 12 tasks total
INSERT INTO tasks (
  id, code, title, description, department_id, project_id,
  assignee_emp_code, assignee_department_id, reporter_emp_code,
  start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name
) VALUES 
(
  'tsk_mock_008', 'TSK-008', 'Khảo sát nhu cầu tự động hóa VP Chuỗi', 'Khảo sát và đánh giá hệ thống', 'IT_DIGITAL', 'PRJ-AUTOMATION',
  '202608001', 'IT_DIGITAL', '202608002',
  '2026-09-01', '2026-09-15', 'DOING', 50, 'AUTOMATION', '[]',
  '', 1, 'mock_seed', 'tsk_mock_008', ''
),
(
  'tsk_mock_009', 'TSK-009', 'Thiết kế POS mới', 'Lên wireframe cho POS Skechers', 'RETAIL_SKECHERS', 'PRJ-SKECHERS-RETAIL',
  '202608002', 'RETAIL_SKECHERS', '202608001',
  '2026-09-05', '2026-09-20', 'TO_DO', 0, 'SKECHERS', '[]',
  '', 1, 'mock_seed', 'tsk_mock_009', ''
),
(
  'tsk_mock_010', 'TSK-010', 'Số hóa phòng họp', 'Lắp đặt màn hình cảm ứng phòng họp', 'HÀNH_CHÍNH', 'PRJ-ADMIN-EXPENSE',
  '202608003', 'HÀNH_CHÍNH', '202608001',
  '2026-09-10', '2026-09-12', 'DONE', 100, 'ADMIN', '[]',
  'Hoàn tất', 1, 'mock_seed', 'tsk_mock_010', ''
),
(
  'tsk_mock_011', 'TSK-011', 'Triển khai Kaizen 1-5-2 kho', 'Cải tiến lưu kho', 'PROD_MAY5', 'PRJ-KAIZEN-152',
  '202608005', 'PROD_MAY5', '202608001',
  '2026-09-15', '2026-10-01', 'REVIEW', 90, 'KAIZEN', '[]',
  '', 1, 'mock_seed', 'tsk_mock_011', ''
),
(
  'tsk_mock_012', 'TSK-012', 'Ghi nhận lỗi an toàn PCCC', 'Kiểm tra PCCC định kỳ', 'IT_DIGITAL', 'PRJ-GEMBA-SAFETY',
  '202608001', 'IT_DIGITAL', '202608002',
  '2026-09-08', '2026-09-25', 'DOING', 20, 'SAFETY', '[]',
  '', 1, 'mock_seed', 'tsk_mock_012', ''
)
ON CONFLICT(legacy_source, legacy_id) DO NOTHING;
