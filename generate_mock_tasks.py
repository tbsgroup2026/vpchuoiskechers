import json

# Assuming we extract DEFAULT_TASKS manually since it's just 7 tasks
tasks = [
  {
    "id": "tsk_001",
    "code": "TSK-001",
    "title": "Rùa tự động hóa dây chuyền dán đế 3 Skechers D'Lites",
    "description": "Triển khai hệ thống xe rùa tự động cấp phôi dán đế cho dây chuyền 3 nhà máy Skechers. Cần nghiệm thu chỉ số an toàn và độ chính xác vị trí.",
    "department_id": "IT_DIGITAL",
    "project_id": "PRJ-AUTOMATION",
    "assignee_emp_code": "202608001",
    "assignee_name": "Phạm Nguyễn Anh Huy",
    "reporter_emp_code": "202608002",
    "reviewer_emp_code": "202608002",
    "priority": "HIGH",
    "start_date": "2026-09-01",
    "due_date": "2026-09-15",
    "status": "DOING",
    "progress": 60,
    "tags": "KAIZEN,AUTOMATION",
    "checklist": [
      { "id": "c1", "title": "Khảo sát mặt bằng dây chuyền 3", "completed": True },
      { "id": "c2", "title": "Lập trình cảm biến vị trí xe rùa", "completed": True },
      { "id": "c3", "title": "Chạy thử nghiệm nghiệm thu 100 sản phẩm", "completed": False },
    ],
    "result_description": "",
  },
  {
    "id": "tsk_002",
    "code": "TSK-002",
    "title": "Số hóa quy trình đăng ký xe đi công tác các nhà máy",
    "description": "Xây dựng form điện tử và luồng duyệt tự động cho cán bộ đăng ký xe đi công tác liên nhà máy.",
    "department_id": "HÀNH_CHÍNH",
    "project_id": "PRJ-ADMIN-EXPENSE",
    "assignee_emp_code": "202608001",
    "assignee_name": "Phạm Nguyễn Anh Huy",
    "reporter_emp_code": "202608003",
    "reviewer_emp_code": "202608002",
    "priority": "MEDIUM",
    "start_date": "2026-09-05",
    "due_date": "2026-09-20",
    "status": "TO_DO",
    "progress": 20,
    "tags": "ISO,DIGITAL",
    "checklist": [
      { "id": "c1", "title": "Thu thập yêu cầu từ phòng Hành chính", "completed": True },
      { "id": "c2", "title": "Thiết kế giao diện đặt xe", "completed": False },
    ],
    "result_description": "",
  },
  {
    "id": "tsk_003",
    "code": "TSK-003",
    "title": "Nâng cấp hệ thống Andon báo lỗi chuyền may 5",
    "description": "Thay thế bảng LED cũ bằng màn hình Android hiển thị real-time sự cố dừng chuyền.",
    "department_id": "IT_DIGITAL",
    "project_id": "PRJ-AUTOMATION",
    "assignee_emp_code": "202608001",
    "assignee_name": "Phạm Nguyễn Anh Huy",
    "reporter_emp_code": "202608002",
    "reviewer_emp_code": "202608002",
    "priority": "URGENT",
    "start_date": "2026-08-25",
    "due_date": "2026-09-10",
    "status": "REVIEW",
    "progress": 90,
    "tags": "ANDON,GEMBA",
    "checklist": [
      { "id": "c1", "title": "Lắp đặt màn hình Android 32 inch", "completed": True },
      { "id": "c2", "title": "Kết nối WebSocket API báo hiệu", "completed": True },
    ],
    "result_description": "Đã hoàn thành lắp đặt 4 màn hình tại chuyền may 5. Độ trễ báo tín hiệu < 1s.",
  },
  {
    "id": "tsk_004",
    "code": "TSK-004",
    "title": "Tự động hóa sao lưu dữ liệu toàn hệ thống lên Google Drive",
    "description": "Cấu hình Service Account Google Drive tự động sao lưu bảng D1 định kỳ theo sự kiện thao tác.",
    "department_id": "IT_DIGITAL",
    "project_id": "PRJ-AUTOMATION",
    "assignee_emp_code": "202608001",
    "assignee_name": "Phạm Nguyễn Anh Huy",
    "reporter_emp_code": "202608002",
    "reviewer_emp_code": "202608002",
    "priority": "HIGH",
    "start_date": "2026-09-10",
    "due_date": "2026-09-12",
    "status": "DONE",
    "progress": 100,
    "tags": "BACKUP,CLOUD",
    "checklist": [
      { "id": "c1", "title": "Cấu hình Google Drive Service Account JWT", "completed": True, "assignee_name": "Phạm Nguyễn Anh Huy", "assignee_emp_code": "202608001" },
      { "id": "c2", "title": "Phân loại thư mục backup theo chủ đề", "completed": True, "assignee_name": "Nguyễn Đức Thuấn", "assignee_emp_code": "202608005" },
      { "id": "c3", "title": "Tối ưu hóa Event-Driven trigger real-time", "completed": True, "assignee_name": "Trần Văn Hùng", "assignee_emp_code": "202608003" },
    ],
    "result_description": "Đã tích hợp xong Event-Driven Backup tự động đẩy file JSON phân loại vào Google Drive khi user thao tác.",
  },
  {
    "id": "tsk_005",
    "code": "TSK-005",
    "title": "Nghiên cứu ứng dụng AI Gemba nhận diện trang phục bảo hộ",
    "description": "Sử dụng camera AI nhận diện công nhân quên đeo khẩu trang hoặc nón bảo hộ khi vào khu vực máy cắt.",
    "department_id": "IT_DIGITAL",
    "project_id": "PRJ-GEMBA-SAFETY",
    "assignee_emp_code": "202608001",
    "assignee_name": "Phạm Nguyễn Anh Huy",
    "reporter_emp_code": "202608002",
    "reviewer_emp_code": "202608002",
    "priority": "LOW",
    "start_date": "2026-09-15",
    "due_date": "2026-10-01",
    "status": "TO_DO", # BACKLOG mapped to TO_DO
    "progress": 0,
    "tags": "AI,SAFETY",
    "checklist": [
      { "id": "c1", "title": "Thu thập dataset hình ảnh đồ bảo hộ", "completed": False },
    ],
    "result_description": "",
  },
  {
    "id": "tsk_006",
    "code": "TSK-006",
    "title": "Tối ưu tồn kho cửa hàng Skechers Flagship Vincom",
    "description": "Đồng bộ tồn kho real-time giữa kho tổng Kiên Giang và các cửa hàng bán lẻ Skechers trên toàn quốc.",
    "department_id": "RETAIL_SKECHERS",
    "project_id": "PRJ-SKECHERS-RETAIL",
    "assignee_emp_code": "202608001",
    "assignee_name": "Phạm Nguyễn Anh Huy",
    "reporter_emp_code": "202608005",
    "reviewer_emp_code": "202608002",
    "priority": "HIGH",
    "start_date": "2026-09-08",
    "due_date": "2026-09-25",
    "status": "DOING",
    "progress": 75,
    "tags": "SKECHERS,RETAIL",
    "checklist": [
      { "id": "c1", "title": "Tích hợp POS API cửa hàng Vincom", "completed": True },
      { "id": "c2", "title": "Cảnh báo hết hàng tự động cho Quản lý", "completed": False },
    ],
    "result_description": "",
  },
  {
    "id": "tsk_007",
    "code": "TSK-007",
    "title": "Triển khai Kaizen giảm 30% thời gian gá dưỡng may quai",
    "description": "Áp dụng gá định hình mẫu 1-5-2 tại Xưởng May 2 giúp tăng năng suất 150 đôi/ngày.",
    "department_id": "PROD_MAY5",
    "project_id": "PRJ-KAIZEN-152",
    "assignee_emp_code": "202608001",
    "assignee_name": "Phạm Nguyễn Anh Huy",
    "reporter_emp_code": "202608008",
    "reviewer_emp_code": "202608002",
    "priority": "HIGH",
    "start_date": "2026-09-02",
    "due_date": "2026-09-18",
    "status": "DOING",
    "progress": 80,
    "tags": "KAIZEN,1-5-2",
    "checklist": [
      { "id": "c1", "title": "Chế tạo gá mẫu thử nghiệm", "completed": True },
      { "id": "c2", "title": "Đánh giá hiệu quả tiết kiệm giây", "completed": True },
    ],
    "result_description": "",
  }
]

sql = []
for t in tasks:
    escaped_title = t["title"].replace("'", "''")
    escaped_desc = t["description"].replace("'", "''")
    escaped_res = t["result_description"].replace("'", "''")
    checklist_json = json.dumps(t["checklist"]).replace("'", "''")
    sql.append(f"""
INSERT INTO tasks (
  id, code, title, description, department_id, project_id,
  assignee_emp_code, assignee_department_id, reporter_emp_code,
  start_date, due_date, status, progress, tags, checklist_json,
  result_description, is_mock, legacy_source, legacy_id, legacy_column_name
) VALUES (
  '{t['id']}', '{t['code']}', '{escaped_title}', '{escaped_desc}', '{t['department_id']}', '{t['project_id']}',
  '{t['assignee_emp_code']}', '{t['department_id']}', '{t['reporter_emp_code']}',
  '{t['start_date']}', '{t['due_date']}', '{t['status']}', {t['progress']}, '{t['tags']}', '{checklist_json}',
  '{escaped_res}', 1, 'mock_seed', '{t['id']}', ''
) ON CONFLICT(id) DO NOTHING;
""")

with open("web/scripts/staging_mock_tasks.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql))
