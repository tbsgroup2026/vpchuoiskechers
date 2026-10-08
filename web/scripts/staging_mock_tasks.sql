
INSERT INTO tasks (
  id, code, title, description, department_id, project_id,
  assignee_emp_code, assignee_department_id, reporter_emp_code,
  start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name
) VALUES (
  'tsk_001', 'TSK-001', 'Rùa tự động hóa dây chuyền dán đế 3 Skechers D''Lites', 'Triển khai hệ thống xe rùa tự động cấp phôi dán đế cho dây chuyền 3 nhà máy Skechers. Cần nghiệm thu chỉ số an toàn và độ chính xác vị trí.', 'IT_DIGITAL', 'PRJ-AUTOMATION',
  '202608001', 'IT_DIGITAL', '202608002',
  '2026-09-01', '2026-09-15', 'DOING', 60, 'KAIZEN,AUTOMATION', '[{"id": "c1", "title": "Kh\u1ea3o s\u00e1t m\u1eb7t b\u1eb1ng d\u00e2y chuy\u1ec1n 3", "completed": true}, {"id": "c2", "title": "L\u1eadp tr\u00ecnh c\u1ea3m bi\u1ebfn v\u1ecb tr\u00ed xe r\u00f9a", "completed": true}, {"id": "c3", "title": "Ch\u1ea1y th\u1eed nghi\u1ec7m nghi\u1ec7m thu 100 s\u1ea3n ph\u1ea9m", "completed": false}]',
  '', 1, 'mock_seed', 'tsk_001', ''
) ON CONFLICT(id) DO NOTHING;


INSERT INTO tasks (
  id, code, title, description, department_id, project_id,
  assignee_emp_code, assignee_department_id, reporter_emp_code,
  start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name
) VALUES (
  'tsk_002', 'TSK-002', 'Số hóa quy trình đăng ký xe đi công tác các nhà máy', 'Xây dựng form điện tử và luồng duyệt tự động cho cán bộ đăng ký xe đi công tác liên nhà máy.', 'HÀNH_CHÍNH', 'PRJ-ADMIN-EXPENSE',
  '202608001', 'HÀNH_CHÍNH', '202608003',
  '2026-09-05', '2026-09-20', 'TO_DO', 20, 'ISO,DIGITAL', '[{"id": "c1", "title": "Thu th\u1eadp y\u00eau c\u1ea7u t\u1eeb ph\u00f2ng H\u00e0nh ch\u00ednh", "completed": true}, {"id": "c2", "title": "Thi\u1ebft k\u1ebf giao di\u1ec7n \u0111\u1eb7t xe", "completed": false}]',
  '', 1, 'mock_seed', 'tsk_002', ''
) ON CONFLICT(id) DO NOTHING;


INSERT INTO tasks (
  id, code, title, description, department_id, project_id,
  assignee_emp_code, assignee_department_id, reporter_emp_code,
  start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name
) VALUES (
  'tsk_003', 'TSK-003', 'Nâng cấp hệ thống Andon báo lỗi chuyền may 5', 'Thay thế bảng LED cũ bằng màn hình Android hiển thị real-time sự cố dừng chuyền.', 'IT_DIGITAL', 'PRJ-AUTOMATION',
  '202608001', 'IT_DIGITAL', '202608002',
  '2026-08-25', '2026-09-10', 'REVIEW', 90, 'ANDON,GEMBA', '[{"id": "c1", "title": "L\u1eafp \u0111\u1eb7t m\u00e0n h\u00ecnh Android 32 inch", "completed": true}, {"id": "c2", "title": "K\u1ebft n\u1ed1i WebSocket API b\u00e1o hi\u1ec7u", "completed": true}]',
  'Đã hoàn thành lắp đặt 4 màn hình tại chuyền may 5. Độ trễ báo tín hiệu < 1s.', 1, 'mock_seed', 'tsk_003', ''
) ON CONFLICT(id) DO NOTHING;


INSERT INTO tasks (
  id, code, title, description, department_id, project_id,
  assignee_emp_code, assignee_department_id, reporter_emp_code,
  start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name
) VALUES (
  'tsk_004', 'TSK-004', 'Tự động hóa sao lưu dữ liệu toàn hệ thống lên Google Drive', 'Cấu hình Service Account Google Drive tự động sao lưu bảng D1 định kỳ theo sự kiện thao tác.', 'IT_DIGITAL', 'PRJ-AUTOMATION',
  '202608001', 'IT_DIGITAL', '202608002',
  '2026-09-10', '2026-09-12', 'DONE', 100, 'BACKUP,CLOUD', '[{"id": "c1", "title": "C\u1ea5u h\u00ecnh Google Drive Service Account JWT", "completed": true, "assignee_name": "Ph\u1ea1m Nguy\u1ec5n Anh Huy", "assignee_emp_code": "202608001"}, {"id": "c2", "title": "Ph\u00e2n lo\u1ea1i th\u01b0 m\u1ee5c backup theo ch\u1ee7 \u0111\u1ec1", "completed": true, "assignee_name": "Nguy\u1ec5n \u0110\u1ee9c Thu\u1ea5n", "assignee_emp_code": "202608005"}, {"id": "c3", "title": "T\u1ed1i \u01b0u h\u00f3a Event-Driven trigger real-time", "completed": true, "assignee_name": "Tr\u1ea7n V\u0103n H\u00f9ng", "assignee_emp_code": "202608003"}]',
  'Đã tích hợp xong Event-Driven Backup tự động đẩy file JSON phân loại vào Google Drive khi user thao tác.', 1, 'mock_seed', 'tsk_004', ''
) ON CONFLICT(id) DO NOTHING;


INSERT INTO tasks (
  id, code, title, description, department_id, project_id,
  assignee_emp_code, assignee_department_id, reporter_emp_code,
  start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name
) VALUES (
  'tsk_005', 'TSK-005', 'Nghiên cứu ứng dụng AI Gemba nhận diện trang phục bảo hộ', 'Sử dụng camera AI nhận diện công nhân quên đeo khẩu trang hoặc nón bảo hộ khi vào khu vực máy cắt.', 'IT_DIGITAL', 'PRJ-GEMBA-SAFETY',
  '202608001', 'IT_DIGITAL', '202608002',
  '2026-09-15', '2026-10-01', 'TO_DO', 0, 'AI,SAFETY', '[{"id": "c1", "title": "Thu th\u1eadp dataset h\u00ecnh \u1ea3nh \u0111\u1ed3 b\u1ea3o h\u1ed9", "completed": false}]',
  '', 1, 'mock_seed', 'tsk_005', ''
) ON CONFLICT(id) DO NOTHING;


INSERT INTO tasks (
  id, code, title, description, department_id, project_id,
  assignee_emp_code, assignee_department_id, reporter_emp_code,
  start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name
) VALUES (
  'tsk_006', 'TSK-006', 'Tối ưu tồn kho cửa hàng Skechers Flagship Vincom', 'Đồng bộ tồn kho real-time giữa kho tổng Kiên Giang và các cửa hàng bán lẻ Skechers trên toàn quốc.', 'RETAIL_SKECHERS', 'PRJ-SKECHERS-RETAIL',
  '202608001', 'RETAIL_SKECHERS', '202608005',
  '2026-09-08', '2026-09-25', 'DOING', 75, 'SKECHERS,RETAIL', '[{"id": "c1", "title": "T\u00edch h\u1ee3p POS API c\u1eeda h\u00e0ng Vincom", "completed": true}, {"id": "c2", "title": "C\u1ea3nh b\u00e1o h\u1ebft h\u00e0ng t\u1ef1 \u0111\u1ed9ng cho Qu\u1ea3n l\u00fd", "completed": false}]',
  '', 1, 'mock_seed', 'tsk_006', ''
) ON CONFLICT(id) DO NOTHING;


INSERT INTO tasks (
  id, code, title, description, department_id, project_id,
  assignee_emp_code, assignee_department_id, reporter_emp_code,
  start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name
) VALUES (
  'tsk_007', 'TSK-007', 'Triển khai Kaizen giảm 30% thời gian gá dưỡng may quai', 'Áp dụng gá định hình mẫu 1-5-2 tại Xưởng May 2 giúp tăng năng suất 150 đôi/ngày.', 'PROD_MAY5', 'PRJ-KAIZEN-152',
  '202608001', 'PROD_MAY5', '202608008',
  '2026-09-02', '2026-09-18', 'DOING', 80, 'KAIZEN,1-5-2', '[{"id": "c1", "title": "Ch\u1ebf t\u1ea1o g\u00e1 m\u1eabu th\u1eed nghi\u1ec7m", "completed": true}, {"id": "c2", "title": "\u0110\u00e1nh gi\u00e1 hi\u1ec7u qu\u1ea3 ti\u1ebft ki\u1ec7m gi\u00e2y", "completed": true}]',
  '', 1, 'mock_seed', 'tsk_007', ''
) ON CONFLICT(id) DO NOTHING;
