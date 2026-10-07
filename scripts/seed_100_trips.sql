INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_001', 'CT-2026-SIM001', 'Chuyến công tác Kiên Giang 2 - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Dương Văn Phúc', 'Kiên Giang 2', 'DEPT_1',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-08-29', '2026-08-30',
            2, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 1,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 25 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 29/08/2026 đến ngày 30/08/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_1_1", "name": "Giay_Di_Duong_CT-2026-SIM001_Signed.pdf", "size": 234708, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-29"}]', '[]',
            '[{"id": "p_1_0", "fullName": "D\u01b0\u01a1ng V\u0103n Ph\u00fac", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202635361", "department": "Ki\u00ean Giang 2", "phone": "0995926204", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-08-29 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_002', 'CT-2026-SIM002', 'Chuyến công tác Kiên Giang 2 - Hội nghị tổng kết kế hoạch sản xuất', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng',
            'Huỳnh Phương Phong', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_2',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-09-14', '2026-09-16',
            3, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 185 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 Mở rộng) từ ngày 14/09/2026 đến ngày 16/09/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_2_1", "name": "Giay_Di_Duong_CT-2026-SIM002_Signed.pdf", "size": 262044, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-14"}]', '[]',
            '[{"id": "p_2_0", "fullName": "Hu\u1ef3nh Ph\u01b0\u01a1ng Phong", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202686115", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0975097889", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}, {"id": "p_2_1", "fullName": "Phan V\u0103n T\u1ea5n", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202663636", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0943139538", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 5000000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 5000000, '2026-09-14 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_003', 'CT-2026-SIM003', 'Chuyến công tác Kiên Giang 3 - Hỗ trợ lắp đặt', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Hồ Anh Phong', 'Khối Quản Lý Chất Lượng QC', 'DEPT_3',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-08-03', '2026-08-05',
            3, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 1,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 136 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 03/08/2026 đến ngày 05/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_3_1", "name": "Giay_Di_Duong_CT-2026-SIM003_Signed.pdf", "size": 447980, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-03"}]', '[]',
            '[{"id": "p_3_0", "fullName": "H\u1ed3 Anh Phong", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202680508", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0937924968", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-08-03 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_004', 'CT-2026-SIM004', 'Chuyến công tác Kiên Giang 1 - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô',
            'Bùi Ngọc Tấn', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_4',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-27', '2026-09-28',
            2, 'Xe cá nhân / Tự túc', 2,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 18 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1A - Phụ lô) từ ngày 27/09/2026 đến ngày 28/09/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_4_1", "name": "Giay_Di_Duong_CT-2026-SIM004_Signed.pdf", "size": 209745, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-27"}]', '[]',
            '[{"id": "p_4_0", "fullName": "B\u00f9i Ng\u1ecdc T\u1ea5n", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202634940", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0951573809", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_4_1", "fullName": "V\u0169 Thanh Khai", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202687203", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0911889246", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'REJECTED', 6800000,
            1, NULL,
            'L1',
            'Không sắp xếp được lịch sản xuất tại điểm đến / Trùng lịch họp BGĐ',
            'budget_rejected', 6800000, '2026-09-27 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_005', 'CT-2026-SIM005', 'Chuyến công tác Kiên Giang 3 - Hội nghị tổng kết kế hoạch sản xuất', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Hoàng Anh Linh', 'Kiên Giang 3', 'DEPT_5',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-09-07', '2026-09-10',
            4, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 3,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 166 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 07/09/2026 đến ngày 10/09/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_5_1", "name": "Giay_Di_Duong_CT-2026-SIM005_Signed.pdf", "size": 246394, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-07"}]', '[]',
            '[{"id": "p_5_0", "fullName": "Ho\u00e0ng Anh Linh", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202671342", "department": "Ki\u00ean Giang 3", "phone": "0951504225", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_5_1", "fullName": "Tr\u1ea7n Ho\u00e0i Ph\u00fac", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202696612", "department": "Ki\u00ean Giang 3", "phone": "0950911061", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_5_2", "fullName": "Ng\u00f4 Minh Ph\u00fac", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202653670", "department": "Ki\u00ean Giang 3", "phone": "0971144637", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 5000000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 5000000, '2026-09-07 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_006', 'CT-2026-SIM006', 'Chuyến công tác Hoàn Thiện Đế - Hỗ trợ lắp đặt', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Dương Đức Tấn', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_6',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-21', '2026-08-21',
            1, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 2,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 19 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 21/08/2026 đến ngày 21/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_6_1", "name": "Giay_Di_Duong_CT-2026-SIM006_Signed.pdf", "size": 268643, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-21"}]', '[]',
            '[{"id": "p_6_0", "fullName": "D\u01b0\u01a1ng \u0110\u1ee9c T\u1ea5n", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202633726", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0921509989", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}, {"id": "p_6_1", "fullName": "D\u01b0\u01a1ng Kh\u00e1nh Nam", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202649554", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0928316653", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 2800000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 2800000, '2026-08-21 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_007', 'CT-2026-SIM007', 'Chuyến công tác Kiên Giang 3 - Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Đặng Quốc Mai', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_7',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-09-10', '2026-09-11',
            2, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 1,
            'Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Số 155 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 10/09/2026 đến ngày 11/09/2026.
Mục đích: Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_7_1", "name": "Giay_Di_Duong_CT-2026-SIM007_Signed.pdf", "size": 275626, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-10"}]', '[]',
            '[{"id": "p_7_0", "fullName": "\u0110\u1eb7ng Qu\u1ed1c Mai", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202619833", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0978627221", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'PENDING_L2', 1500000,
            1, 'L1',
            NULL,
            NULL,
            'pending_exec_budget', 1500000, '2026-09-10 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_008', 'CT-2026-SIM008', 'Chuyến công tác Hoàn Thiện Đế - Hội nghị tổng kết kế hoạch sản xuất', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế',
            'Hoàng Hoài Huy', 'Kiên Giang 2', 'DEPT_8',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-09-07', '2026-09-07',
            1, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 89 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Xưởng Hoàn Thiện Đế) từ ngày 07/09/2026 đến ngày 07/09/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_8_1", "name": "Giay_Di_Duong_CT-2026-SIM008_Signed.pdf", "size": 260664, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-07"}]', '[{"id": "inv_8_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 1850000, "invoiceDate": "2026-09-07", "invoiceNumber": "HD-388706", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM008.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-07"}, {"id": "inv_8_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 2200000, "invoiceDate": "2026-09-07", "invoiceNumber": "HD-297780", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM008.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-07"}]',
            '[{"id": "p_8_0", "fullName": "Ho\u00e0ng Ho\u00e0i Huy", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202692185", "department": "Ki\u00ean Giang 2", "phone": "0969991385", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}, {"id": "p_8_1", "fullName": "Ng\u00f4 Minh Trinh", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202668741", "department": "Ki\u00ean Giang 2", "phone": "0984967617", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 4200000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 4200000, '2026-09-07 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_009', 'CT-2026-SIM009', 'Chuyến công tác Hoàn Thiện Đế - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Đặng Thanh Trinh', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_9',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-26', '2026-08-29',
            4, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 22 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 26/08/2026 đến ngày 29/08/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_9_1", "name": "Giay_Di_Duong_CT-2026-SIM009_Signed.pdf", "size": 441585, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-26"}]', '[]',
            '[{"id": "p_9_0", "fullName": "\u0110\u1eb7ng Thanh Trinh", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202632701", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0933996731", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_9_1", "fullName": "Phan Ph\u01b0\u01a1ng Khai", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202633104", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0979904276", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_9_2", "fullName": "\u0110\u1eb7ng Kh\u00e1nh H\u00e0", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202617966", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0969124911", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-08-26 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_010', 'CT-2026-SIM010', 'Chuyến công tác Kiên Giang 1 - Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Phạm Đức Trinh', 'Nhà Máy Miền Đông', 'DEPT_10',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-12', '2026-09-14',
            3, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 3,
            'Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Số 120 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 12/09/2026 đến ngày 14/09/2026.
Mục đích: Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_10_1", "name": "Giay_Di_Duong_CT-2026-SIM010_Signed.pdf", "size": 231685, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-12"}]', '[]',
            '[{"id": "p_10_0", "fullName": "Ph\u1ea1m \u0110\u1ee9c Trinh", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202645339", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0920953208", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}, {"id": "p_10_1", "fullName": "Ho\u00e0ng Kh\u00e1nh D\u0169ng", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202639211", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0927472725", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}, {"id": "p_10_2", "fullName": "B\u00f9i Kh\u00e1nh Nam", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202699586", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0968163098", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}]', 'PENDING_L2', 4200000,
            1, 'L1',
            NULL,
            NULL,
            'pending_exec_budget', 4200000, '2026-09-12 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_011', 'CT-2026-SIM011', 'Chuyến công tác Nhà Máy Miền Đông - Kiểm tra hệ thống PPH, PCCC', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính',
            'Võ Văn Linh', 'Kiên Giang 2', 'DEPT_11',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-08-07', '2026-08-10',
            4, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 1,
            'Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ', 'Số 53 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Chính) từ ngày 07/08/2026 đến ngày 10/08/2026.
Mục đích: Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_11_1", "name": "Giay_Di_Duong_CT-2026-SIM011_Signed.pdf", "size": 301015, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-07"}]', '[]',
            '[{"id": "p_11_0", "fullName": "V\u00f5 V\u0103n Linh", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202651239", "department": "Ki\u00ean Giang 2", "phone": "0941441508", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 5000000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 5000000, '2026-08-07 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_012', 'CT-2026-SIM012', 'Chuyến công tác Hoàn Thiện Đế - Hội nghị tổng kết kế hoạch sản xuất', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Dương Hữu Thảo', 'Kiên Giang 3', 'DEPT_12',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-06', '2026-08-08',
            3, 'Xe cá nhân / Tự túc', 1,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 11 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 06/08/2026 đến ngày 08/08/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_12_1", "name": "Giay_Di_Duong_CT-2026-SIM012_Signed.pdf", "size": 256017, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-06"}]', '[]',
            '[{"id": "p_12_0", "fullName": "D\u01b0\u01a1ng H\u1eefu Th\u1ea3o", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202627443", "department": "Ki\u00ean Giang 3", "phone": "0948826450", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 1500000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 1500000, '2026-08-06 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_013', 'CT-2026-SIM013', 'Chuyến công tác Kiên Giang 3 - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Vũ Tuấn Dũng', 'Kiên Giang 2', 'DEPT_13',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-08-15', '2026-08-15',
            1, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 3,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 84 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 15/08/2026 đến ngày 15/08/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_13_1", "name": "Giay_Di_Duong_CT-2026-SIM013_Signed.pdf", "size": 268202, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-15"}]', '[]',
            '[{"id": "p_13_0", "fullName": "V\u0169 Tu\u1ea5n D\u0169ng", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202625189", "department": "Ki\u00ean Giang 2", "phone": "0994723312", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}, {"id": "p_13_1", "fullName": "\u0110\u1ed7 Qu\u1ed1c Linh", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202651729", "department": "Ki\u00ean Giang 2", "phone": "0932018045", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}, {"id": "p_13_2", "fullName": "Hu\u1ef3nh Thanh Nam", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202694985", "department": "Ki\u00ean Giang 2", "phone": "0997581132", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 5000000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 5000000, '2026-08-15 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_014', 'CT-2026-SIM014', 'Chuyến công tác VP Chuỗi (R&D) - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'VP Chuỗi (R&D)', 'Phòng R&D SKECHERS',
            'Dương Quốc Linh', 'Khối Quản Lý Chất Lượng QC', 'DEPT_14',
            'VP Chuỗi - Trụ sở chính (Bình Dương)', '2026-09-24', '2026-09-27',
            4, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 3,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 136 Đường Nguyễn Huệ, VP Chuỗi - Trụ sở chính (Bình Dương)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại VP Chuỗi (R&D) (Phòng R&D SKECHERS) từ ngày 24/09/2026 đến ngày 27/09/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_14_1", "name": "Giay_Di_Duong_CT-2026-SIM014_Signed.pdf", "size": 307880, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-24"}]', '[]',
            '[{"id": "p_14_0", "fullName": "D\u01b0\u01a1ng Qu\u1ed1c Linh", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202683694", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0989060508", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}, {"id": "p_14_1", "fullName": "Ph\u1ea1m H\u1eefu Th\u1ea3o", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202617264", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0912634785", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}, {"id": "p_14_2", "fullName": "B\u00f9i V\u0103n Ph\u00fac", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202631550", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0995431422", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-09-24 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_015', 'CT-2026-SIM015', 'Chuyến công tác Hoàn Thiện Đế - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế',
            'Trần Thanh Phúc', 'Phòng Kế Toán - Tài Chính', 'DEPT_15',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-13', '2026-08-15',
            3, 'Xe cá nhân / Tự túc', 3,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 206 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Xưởng Hoàn Thiện Đế) từ ngày 13/08/2026 đến ngày 15/08/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_15_1", "name": "Giay_Di_Duong_CT-2026-SIM015_Signed.pdf", "size": 225700, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-13"}]', '[{"id": "inv_15_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 1850000, "invoiceDate": "2026-08-15", "invoiceNumber": "HD-853382", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM015.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-15"}, {"id": "inv_15_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 850000, "invoiceDate": "2026-08-13", "invoiceNumber": "HD-184549", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM015.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-13"}]',
            '[{"id": "p_15_0", "fullName": "Tr\u1ea7n Thanh Ph\u00fac", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202630101", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0920515267", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}, {"id": "p_15_1", "fullName": "V\u00f5 V\u0103n Linh", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202666257", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0945832843", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}, {"id": "p_15_2", "fullName": "B\u00f9i \u0110\u1ee9c Mai", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202625578", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0927646137", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 4200000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 4200000, '2026-08-13 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_016', 'CT-2026-SIM016', 'Chuyến công tác Nhà Máy Miền Đông - Hội nghị tổng kết kế hoạch sản xuất', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ',
            'Đỗ Hữu Tấn', 'Kiên Giang 3', 'DEPT_16',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-09-20', '2026-09-23',
            4, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 1,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 16 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Phụ) từ ngày 20/09/2026 đến ngày 23/09/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_16_1", "name": "Giay_Di_Duong_CT-2026-SIM016_Signed.pdf", "size": 320806, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-20"}]', '[]',
            '[{"id": "p_16_0", "fullName": "\u0110\u1ed7 H\u1eefu T\u1ea5n", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202640681", "department": "Ki\u00ean Giang 3", "phone": "0913144913", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-09-20 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_017', 'CT-2026-SIM017', 'Chuyến công tác VP Chuỗi (R&D) - Hội nghị tổng kết kế hoạch sản xuất', 'VP Chuỗi (R&D)', 'Phòng R&D SKECHERS',
            'Vũ Văn Nam', 'Khối Kỹ Thuật & IE', 'DEPT_17',
            'VP Chuỗi - Trụ sở chính (Bình Dương)', '2026-08-16', '2026-08-18',
            3, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 1,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 54 Đường Nguyễn Huệ, VP Chuỗi - Trụ sở chính (Bình Dương)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại VP Chuỗi (R&D) (Phòng R&D SKECHERS) từ ngày 16/08/2026 đến ngày 18/08/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_17_1", "name": "Giay_Di_Duong_CT-2026-SIM017_Signed.pdf", "size": 373354, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-16"}]', '[]',
            '[{"id": "p_17_0", "fullName": "V\u0169 V\u0103n Nam", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202610646", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0964121871", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-08-16 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_018', 'CT-2026-SIM018', 'Chuyến công tác Kiên Giang 2 - Kiểm tra hệ thống PPH, PCCC', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Nguyễn Quốc Phúc', 'Hoàn Thiện Đế', 'DEPT_18',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-09-21', '2026-09-21',
            1, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ', 'Số 71 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 21/09/2026 đến ngày 21/09/2026.
Mục đích: Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_18_1", "name": "Giay_Di_Duong_CT-2026-SIM018_Signed.pdf", "size": 216838, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-21"}]', '[]',
            '[{"id": "p_18_0", "fullName": "Nguy\u1ec5n Qu\u1ed1c Ph\u00fac", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202627299", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0928182749", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}, {"id": "p_18_1", "fullName": "Tr\u1ea7n Ng\u1ecdc Mai", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202696411", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0931770281", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-09-21 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_019', 'CT-2026-SIM019', 'Chuyến công tác Kiên Giang 2 - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Huỳnh Ngọc Phong', 'Kiên Giang 3', 'DEPT_19',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-09-04', '2026-09-05',
            2, 'Xe cá nhân / Tự túc', 2,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 104 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 04/09/2026 đến ngày 05/09/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_19_1", "name": "Giay_Di_Duong_CT-2026-SIM019_Signed.pdf", "size": 261555, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-04"}]', '[]',
            '[{"id": "p_19_0", "fullName": "Hu\u1ef3nh Ng\u1ecdc Phong", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202624901", "department": "Ki\u00ean Giang 3", "phone": "0948764821", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_19_1", "fullName": "Phan Qu\u1ed1c Huy", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202647706", "department": "Ki\u00ean Giang 3", "phone": "0948931235", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-09-04 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_020', 'CT-2026-SIM020', 'Chuyến công tác Kiên Giang 1 - Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô',
            'Hồ Đức Sơn', 'Khối Quản Lý Chất Lượng QC', 'DEPT_20',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-15', '2026-09-15',
            1, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 3,
            'Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Số 226 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1A - Phụ lô) từ ngày 15/09/2026 đến ngày 15/09/2026.
Mục đích: Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_20_1", "name": "Giay_Di_Duong_CT-2026-SIM020_Signed.pdf", "size": 229009, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-15"}]', '[{"id": "inv_20_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ki\u00ean Giang 1", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 2400000, "invoiceDate": "2026-09-15", "invoiceNumber": "HD-793259", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM020.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-15"}, {"id": "inv_20_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 850000, "invoiceDate": "2026-09-15", "invoiceNumber": "HD-252392", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM020.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-15"}]',
            '[{"id": "p_20_0", "fullName": "H\u1ed3 \u0110\u1ee9c S\u01a1n", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202668254", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0952181340", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}, {"id": "p_20_1", "fullName": "Ph\u1ea1m V\u0103n D\u0169ng", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202678423", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0925865903", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}, {"id": "p_20_2", "fullName": "Hu\u1ef3nh H\u1eefu H\u00f9ng", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202639839", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0982155152", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-09-15 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_021', 'CT-2026-SIM021', 'Chuyến công tác Hoàn Thiện Đế - Họp đánh giá chỉ số OEE', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Hoàng Phương Sơn', 'Nhà Máy Miền Đông', 'DEPT_21',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-09-08', '2026-09-10',
            3, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 3,
            'Họp đánh giá chỉ số OEE & kiểm tra Gemba Walk hàng tháng', 'Số 105 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 08/09/2026 đến ngày 10/09/2026.
Mục đích: Họp đánh giá chỉ số OEE & kiểm tra Gemba Walk hàng tháng.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_21_1", "name": "Giay_Di_Duong_CT-2026-SIM021_Signed.pdf", "size": 339565, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-08"}]', '[]',
            '[{"id": "p_21_0", "fullName": "Ho\u00e0ng Ph\u01b0\u01a1ng S\u01a1n", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202619486", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0967520603", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}, {"id": "p_21_1", "fullName": "Nguy\u1ec5n B\u1ea3o H\u00f9ng", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202612675", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0918738341", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}, {"id": "p_21_2", "fullName": "H\u1ed3 Minh Th\u1ea3o", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202659562", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0973462620", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 1500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 1500000, '2026-09-08 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_022', 'CT-2026-SIM022', 'Chuyến công tác Hoàn Thiện Đế - Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Đỗ Thị Trinh', 'Nhà Máy Miền Đông', 'DEPT_22',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-16', '2026-08-19',
            4, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 1,
            'Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Số 189 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 16/08/2026 đến ngày 19/08/2026.
Mục đích: Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_22_1", "name": "Giay_Di_Duong_CT-2026-SIM022_Signed.pdf", "size": 201873, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-16"}]', '[]',
            '[{"id": "p_22_0", "fullName": "\u0110\u1ed7 Th\u1ecb Trinh", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202676178", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0949695619", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 5000000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 5000000, '2026-08-16 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_023', 'CT-2026-SIM023', 'Chuyến công tác VP Chuỗi (R&D) - Hỗ trợ lắp đặt', 'VP Chuỗi (R&D)', 'Phòng R&D SKECHERS',
            'Đặng Đức Hà', 'Khối Quản Lý Chất Lượng QC', 'DEPT_23',
            'VP Chuỗi - Trụ sở chính (Bình Dương)', '2026-08-29', '2026-09-01',
            4, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 118 Đường Nguyễn Huệ, VP Chuỗi - Trụ sở chính (Bình Dương)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại VP Chuỗi (R&D) (Phòng R&D SKECHERS) từ ngày 29/08/2026 đến ngày 01/09/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_23_1", "name": "Giay_Di_Duong_CT-2026-SIM023_Signed.pdf", "size": 260984, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-29"}]', '[]',
            '[{"id": "p_23_0", "fullName": "\u0110\u1eb7ng \u0110\u1ee9c H\u00e0", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202670862", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0914313703", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}, {"id": "p_23_1", "fullName": "V\u00f5 Kh\u00e1nh Nam", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202653284", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0947337162", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 4200000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 4200000, '2026-08-29 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_024', 'CT-2026-SIM024', 'Chuyến công tác Kiên Giang 2 - Hội nghị tổng kết kế hoạch sản xuất', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng',
            'Đặng Đức Phúc', 'Phòng Kế Toán - Tài Chính', 'DEPT_24',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-08-18', '2026-08-19',
            2, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 25 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 Mở rộng) từ ngày 18/08/2026 đến ngày 19/08/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_24_1", "name": "Giay_Di_Duong_CT-2026-SIM024_Signed.pdf", "size": 241562, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-18"}]', '[]',
            '[{"id": "p_24_0", "fullName": "\u0110\u1eb7ng \u0110\u1ee9c Ph\u00fac", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202685519", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0932669310", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}, {"id": "p_24_1", "fullName": "Hu\u1ef3nh Ng\u1ecdc Huy", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202686919", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0997553222", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-08-18 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_025', 'CT-2026-SIM025', 'Chuyến công tác Kiên Giang 2 - Kiểm tra hệ thống PPH, PCCC', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Lê Phương Tâm', 'Phòng Kế Toán - Tài Chính', 'DEPT_25',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-08-07', '2026-08-08',
            2, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ', 'Số 52 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 07/08/2026 đến ngày 08/08/2026.
Mục đích: Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_25_1", "name": "Giay_Di_Duong_CT-2026-SIM025_Signed.pdf", "size": 380902, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-07"}]', '[]',
            '[{"id": "p_25_0", "fullName": "L\u00ea Ph\u01b0\u01a1ng T\u00e2m", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202646254", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0915584310", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}, {"id": "p_25_1", "fullName": "V\u00f5 V\u0103n Mai", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202614881", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0936039803", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}, {"id": "p_25_2", "fullName": "Hu\u1ef3nh Kh\u00e1nh S\u01a1n", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202654554", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0975018532", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}]', 'PENDING_L2', 6800000,
            1, 'L1',
            NULL,
            NULL,
            'pending_exec_budget', 6800000, '2026-08-07 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_026', 'CT-2026-SIM026', 'Chuyến công tác Kiên Giang 1 - Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Dương Ngọc Nam', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_26',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-20', '2026-09-21',
            2, 'Xe cá nhân / Tự túc', 1,
            'Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Số 193 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 20/09/2026 đến ngày 21/09/2026.
Mục đích: Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_26_1", "name": "Giay_Di_Duong_CT-2026-SIM026_Signed.pdf", "size": 400791, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-20"}]', '[]',
            '[{"id": "p_26_0", "fullName": "D\u01b0\u01a1ng Ng\u1ecdc Nam", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202654990", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0943470359", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 1500000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 1500000, '2026-09-20 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_027', 'CT-2026-SIM027', 'Chuyến công tác Kiên Giang 3 - Họp đánh giá chỉ số OEE', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Võ Anh Khai', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_27',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-08-15', '2026-08-18',
            4, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 3,
            'Họp đánh giá chỉ số OEE & kiểm tra Gemba Walk hàng tháng', 'Số 51 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 15/08/2026 đến ngày 18/08/2026.
Mục đích: Họp đánh giá chỉ số OEE & kiểm tra Gemba Walk hàng tháng.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_27_1", "name": "Giay_Di_Duong_CT-2026-SIM027_Signed.pdf", "size": 398444, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-15"}]', '[]',
            '[{"id": "p_27_0", "fullName": "V\u00f5 Anh Khai", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202690389", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0934869674", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_27_1", "fullName": "D\u01b0\u01a1ng H\u1eefu S\u01a1n", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202682179", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0971938032", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_27_2", "fullName": "V\u00f5 Ph\u01b0\u01a1ng Khai", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202651926", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0988378512", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'RECALLED', 3500000,
            1, NULL,
            NULL,
            'Cán bộ chủ động rút lại đơn do thay đổi kế hoạch công tác',
            'pending_dept_budget', 3500000, '2026-08-15 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_028', 'CT-2026-SIM028', 'Chuyến công tác Hoàn Thiện Đế - Hỗ trợ lắp đặt', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế',
            'Dương Văn Hùng', 'Hoàn Thiện Đế', 'DEPT_28',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-22', '2026-08-23',
            2, 'Xe cá nhân / Tự túc', 3,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 16 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Xưởng Hoàn Thiện Đế) từ ngày 22/08/2026 đến ngày 23/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_28_1", "name": "Giay_Di_Duong_CT-2026-SIM028_Signed.pdf", "size": 364875, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-22"}]', '[]',
            '[{"id": "p_28_0", "fullName": "D\u01b0\u01a1ng V\u0103n H\u00f9ng", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202679783", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0967722409", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}, {"id": "p_28_1", "fullName": "Ng\u00f4 H\u1eefu Phong", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202641369", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0925353474", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}, {"id": "p_28_2", "fullName": "Hu\u1ef3nh Tu\u1ea5n Nam", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202684173", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0967933686", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 4200000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 4200000, '2026-08-22 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_029', 'CT-2026-SIM029', 'Chuyến công tác Hoàn Thiện Đế - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế',
            'Đặng Đức Nam', 'Khối Kỹ Thuật & IE', 'DEPT_29',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-09-18', '2026-09-18',
            1, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 2,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 106 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Xưởng Hoàn Thiện Đế) từ ngày 18/09/2026 đến ngày 18/09/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_29_1", "name": "Giay_Di_Duong_CT-2026-SIM029_Signed.pdf", "size": 360787, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-18"}]', '[]',
            '[{"id": "p_29_0", "fullName": "\u0110\u1eb7ng \u0110\u1ee9c Nam", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202685233", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0972931732", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}, {"id": "p_29_1", "fullName": "H\u1ed3 Anh H\u00e0", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202615144", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0935388955", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 3500000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 3500000, '2026-09-18 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_030', 'CT-2026-SIM030', 'Chuyến công tác Nhà Máy Miền Đông - Hỗ trợ lắp đặt', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ',
            'Hoàng Thị Dũng', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_30',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-09-08', '2026-09-10',
            3, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 127 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Phụ) từ ngày 08/09/2026 đến ngày 10/09/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_30_1", "name": "Giay_Di_Duong_CT-2026-SIM030_Signed.pdf", "size": 434631, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-08"}]', '[]',
            '[{"id": "p_30_0", "fullName": "Ho\u00e0ng Th\u1ecb D\u0169ng", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202619209", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0980925624", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}, {"id": "p_30_1", "fullName": "Nguy\u1ec5n \u0110\u1ee9c T\u1ea5n", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202629930", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0940094476", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 4200000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 4200000, '2026-09-08 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_031', 'CT-2026-SIM031', 'Chuyến công tác Kiên Giang 3 - Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Đỗ Tuấn Dũng', 'Kiên Giang 2', 'DEPT_31',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-08-21', '2026-08-24',
            4, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Số 221 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 21/08/2026 đến ngày 24/08/2026.
Mục đích: Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_31_1", "name": "Giay_Di_Duong_CT-2026-SIM031_Signed.pdf", "size": 191837, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-21"}]', '[]',
            '[{"id": "p_31_0", "fullName": "\u0110\u1ed7 Tu\u1ea5n D\u0169ng", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202666788", "department": "Ki\u00ean Giang 2", "phone": "0942040244", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}, {"id": "p_31_1", "fullName": "V\u00f5 Tu\u1ea5n Huy", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202613616", "department": "Ki\u00ean Giang 2", "phone": "0934615665", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 1500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 1500000, '2026-08-21 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_032', 'CT-2026-SIM032', 'Chuyến công tác VP Chuỗi (R&D) - Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính',
            'Hoàng Khánh Sơn', 'Phòng Kế Toán - Tài Chính', 'DEPT_32',
            'VP Chuỗi - Trụ sở chính (Bình Dương)', '2026-09-26', '2026-09-29',
            4, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Số 181 Đường Nguyễn Huệ, VP Chuỗi - Trụ sở chính (Bình Dương)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại VP Chuỗi (R&D) (Văn Phòng Chuỗi Chính) từ ngày 26/09/2026 đến ngày 29/09/2026.
Mục đích: Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_32_1", "name": "Giay_Di_Duong_CT-2026-SIM032_Signed.pdf", "size": 210493, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-26"}]', '[]',
            '[{"id": "p_32_0", "fullName": "Ho\u00e0ng Kh\u00e1nh S\u01a1n", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202698244", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0927384109", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}, {"id": "p_32_1", "fullName": "B\u00f9i Anh Linh", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202662620", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0987244943", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}, {"id": "p_32_2", "fullName": "Tr\u1ea7n V\u0103n Huy", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202658508", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0935878146", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 1500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 1500000, '2026-09-26 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_033', 'CT-2026-SIM033', 'Chuyến công tác Hoàn Thiện Đế - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Võ Phương Nam', 'Khối Bảo Trì MMTB', 'DEPT_33',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-09-28', '2026-10-01',
            4, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 2,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 205 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 28/09/2026 đến ngày 01/10/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_33_1", "name": "Giay_Di_Duong_CT-2026-SIM033_Signed.pdf", "size": 283532, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-28"}]', '[]',
            '[{"id": "p_33_0", "fullName": "V\u00f5 Ph\u01b0\u01a1ng Nam", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202612530", "department": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB", "phone": "0973749858", "pickupLocation": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB - C\u1ed5ng ch\u00ednh"}, {"id": "p_33_1", "fullName": "D\u01b0\u01a1ng Qu\u1ed1c H\u00f9ng", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202616749", "department": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB", "phone": "0992650455", "pickupLocation": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-09-28 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_034', 'CT-2026-SIM034', 'Chuyến công tác Kiên Giang 1 - Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô',
            'Bùi Minh Hùng', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_34',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-08-12', '2026-08-15',
            4, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Số 126 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1A - Phụ lô) từ ngày 12/08/2026 đến ngày 15/08/2026.
Mục đích: Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_34_1", "name": "Giay_Di_Duong_CT-2026-SIM034_Signed.pdf", "size": 398143, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-12"}]', '[]',
            '[{"id": "p_34_0", "fullName": "B\u00f9i Minh H\u00f9ng", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202681885", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0941162041", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_34_1", "fullName": "Ng\u00f4 Thanh S\u01a1n", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202683674", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0929462314", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_34_2", "fullName": "L\u00ea Thanh H\u00e0", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202624948", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0941791856", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-08-12 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_035', 'CT-2026-SIM035', 'Chuyến công tác Kiên Giang 1 - Hội nghị tổng kết kế hoạch sản xuất', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Phạm Khánh Dũng', 'Kiên Giang 2', 'DEPT_35',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-08-22', '2026-08-24',
            3, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 2,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 233 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 22/08/2026 đến ngày 24/08/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_35_1", "name": "Giay_Di_Duong_CT-2026-SIM035_Signed.pdf", "size": 262177, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-22"}]', '[{"id": "inv_35_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ki\u00ean Giang 1", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 2400000, "invoiceDate": "2026-08-24", "invoiceNumber": "HD-612733", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM035.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-24"}, {"id": "inv_35_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 850000, "invoiceDate": "2026-08-22", "invoiceNumber": "HD-263185", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM035.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-22"}]',
            '[{"id": "p_35_0", "fullName": "Ph\u1ea1m Kh\u00e1nh D\u0169ng", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202683538", "department": "Ki\u00ean Giang 2", "phone": "0950303108", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}, {"id": "p_35_1", "fullName": "\u0110\u1ed7 Anh D\u0169ng", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202673597", "department": "Ki\u00ean Giang 2", "phone": "0932618688", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-08-22 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_036', 'CT-2026-SIM036', 'Chuyến công tác Kiên Giang 3 - Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Trần Tuấn Tấn', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_36',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-09-07', '2026-09-09',
            3, 'Xe cá nhân / Tự túc', 1,
            'Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Số 215 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 07/09/2026 đến ngày 09/09/2026.
Mục đích: Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_36_1", "name": "Giay_Di_Duong_CT-2026-SIM036_Signed.pdf", "size": 420456, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-07"}]', '[]',
            '[{"id": "p_36_0", "fullName": "Tr\u1ea7n Tu\u1ea5n T\u1ea5n", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202627849", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0994215319", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 5000000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 5000000, '2026-09-07 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_037', 'CT-2026-SIM037', 'Chuyến công tác Kiên Giang 2 - Họp đánh giá chỉ số OEE', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Vũ Văn Nam', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_37',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-09-19', '2026-09-22',
            4, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Họp đánh giá chỉ số OEE & kiểm tra Gemba Walk hàng tháng', 'Số 67 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 19/09/2026 đến ngày 22/09/2026.
Mục đích: Họp đánh giá chỉ số OEE & kiểm tra Gemba Walk hàng tháng.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_37_1", "name": "Giay_Di_Duong_CT-2026-SIM037_Signed.pdf", "size": 385848, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-19"}]', '[]',
            '[{"id": "p_37_0", "fullName": "V\u0169 V\u0103n Nam", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202639400", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0944839776", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}, {"id": "p_37_1", "fullName": "\u0110\u1ed7 Ho\u00e0i H\u00f9ng", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202613601", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0956297125", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'RECALLED', 4200000,
            1, NULL,
            NULL,
            'Cán bộ chủ động rút lại đơn do thay đổi kế hoạch công tác',
            'pending_dept_budget', 4200000, '2026-09-19 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_038', 'CT-2026-SIM038', 'Chuyến công tác Kiên Giang 1 - Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Phạm Anh Dũng', 'Khối Quản Lý Chất Lượng QC', 'DEPT_38',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-08-03', '2026-08-05',
            3, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 1,
            'Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Số 184 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 03/08/2026 đến ngày 05/08/2026.
Mục đích: Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_38_1", "name": "Giay_Di_Duong_CT-2026-SIM038_Signed.pdf", "size": 340541, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-03"}]', '[]',
            '[{"id": "p_38_0", "fullName": "Ph\u1ea1m Anh D\u0169ng", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202687600", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0966715398", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 1500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 1500000, '2026-08-03 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_039', 'CT-2026-SIM039', 'Chuyến công tác Kiên Giang 2 - Hội nghị tổng kết kế hoạch sản xuất', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng',
            'Lê Anh Tâm', 'Kiên Giang 3', 'DEPT_39',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-08-11', '2026-08-12',
            2, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 3,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 104 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 Mở rộng) từ ngày 11/08/2026 đến ngày 12/08/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_39_1", "name": "Giay_Di_Duong_CT-2026-SIM039_Signed.pdf", "size": 270071, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-11"}]', '[]',
            '[{"id": "p_39_0", "fullName": "L\u00ea Anh T\u00e2m", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202650543", "department": "Ki\u00ean Giang 3", "phone": "0945178206", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_39_1", "fullName": "Ph\u1ea1m Ng\u1ecdc Huy", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202628695", "department": "Ki\u00ean Giang 3", "phone": "0980806862", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_39_2", "fullName": "Tr\u1ea7n B\u1ea3o S\u01a1n", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202668445", "department": "Ki\u00ean Giang 3", "phone": "0970503552", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 1500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 1500000, '2026-08-11 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_040', 'CT-2026-SIM040', 'Chuyến công tác Kiên Giang 1 - Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô',
            'Dương Bảo Hùng', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_40',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-08-09', '2026-08-12',
            4, 'Xe cá nhân / Tự túc', 1,
            'Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Số 158 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1A - Phụ lô) từ ngày 09/08/2026 đến ngày 12/08/2026.
Mục đích: Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_40_1", "name": "Giay_Di_Duong_CT-2026-SIM040_Signed.pdf", "size": 238310, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-09"}]', '[]',
            '[{"id": "p_40_0", "fullName": "D\u01b0\u01a1ng B\u1ea3o H\u00f9ng", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202622429", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0944730229", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 4200000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 4200000, '2026-08-09 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_041', 'CT-2026-SIM041', 'Chuyến công tác VP Chuỗi (R&D) - Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính',
            'Võ Minh Phong', 'Nhà Máy Miền Đông', 'DEPT_41',
            'VP Chuỗi - Trụ sở chính (Bình Dương)', '2026-09-19', '2026-09-20',
            2, 'Xe cá nhân / Tự túc', 2,
            'Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Số 188 Đường Nguyễn Huệ, VP Chuỗi - Trụ sở chính (Bình Dương)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại VP Chuỗi (R&D) (Văn Phòng Chuỗi Chính) từ ngày 19/09/2026 đến ngày 20/09/2026.
Mục đích: Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_41_1", "name": "Giay_Di_Duong_CT-2026-SIM041_Signed.pdf", "size": 328083, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-19"}]', '[]',
            '[{"id": "p_41_0", "fullName": "V\u00f5 Minh Phong", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202634241", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0986392012", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}, {"id": "p_41_1", "fullName": "\u0110\u1ed7 Qu\u1ed1c Phong", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202632677", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0952490611", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-09-19 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_042', 'CT-2026-SIM042', 'Chuyến công tác Kiên Giang 2 - Hỗ trợ lắp đặt', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng',
            'Lê Khánh Dũng', 'Kiên Giang 3', 'DEPT_42',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-08-22', '2026-08-25',
            4, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 2,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 163 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 Mở rộng) từ ngày 22/08/2026 đến ngày 25/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_42_1", "name": "Giay_Di_Duong_CT-2026-SIM042_Signed.pdf", "size": 212136, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-22"}]', '[]',
            '[{"id": "p_42_0", "fullName": "L\u00ea Kh\u00e1nh D\u0169ng", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202630402", "department": "Ki\u00ean Giang 3", "phone": "0933947763", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_42_1", "fullName": "Ho\u00e0ng Kh\u00e1nh T\u1ea5n", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202635517", "department": "Ki\u00ean Giang 3", "phone": "0989516664", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'PENDING_L2', 4200000,
            1, 'L1',
            NULL,
            NULL,
            'pending_exec_budget', 4200000, '2026-08-22 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_043', 'CT-2026-SIM043', 'Chuyến công tác Kiên Giang 1 - Hội nghị tổng kết kế hoạch sản xuất', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Lê Quốc Thảo', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_43',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-22', '2026-09-22',
            1, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 1,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 180 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 22/09/2026 đến ngày 22/09/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_43_1", "name": "Giay_Di_Duong_CT-2026-SIM043_Signed.pdf", "size": 269945, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-22"}]', '[]',
            '[{"id": "p_43_0", "fullName": "L\u00ea Qu\u1ed1c Th\u1ea3o", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202643836", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0997273868", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 5000000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 5000000, '2026-09-22 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_044', 'CT-2026-SIM044', 'Chuyến công tác Kiên Giang 3 - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Hoàng Văn Linh', 'Kiên Giang 2', 'DEPT_44',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-09-13', '2026-09-13',
            1, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 1,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 200 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 13/09/2026 đến ngày 13/09/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_44_1", "name": "Giay_Di_Duong_CT-2026-SIM044_Signed.pdf", "size": 399168, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-13"}]', '[{"id": "inv_44_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ki\u00ean Giang 3", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 1850000, "invoiceDate": "2026-09-13", "invoiceNumber": "HD-314164", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM044.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-13"}, {"id": "inv_44_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 1450000, "invoiceDate": "2026-09-13", "invoiceNumber": "HD-934377", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM044.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-13"}]',
            '[{"id": "p_44_0", "fullName": "Ho\u00e0ng V\u0103n Linh", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202658155", "department": "Ki\u00ean Giang 2", "phone": "0939470112", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-09-13 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_045', 'CT-2026-SIM045', 'Chuyến công tác Kiên Giang 1 - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô',
            'Huỳnh Thị Linh', 'Kiên Giang 1', 'DEPT_45',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-20', '2026-09-21',
            2, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 2,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 100 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1A - Phụ lô) từ ngày 20/09/2026 đến ngày 21/09/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_45_1", "name": "Giay_Di_Duong_CT-2026-SIM045_Signed.pdf", "size": 298276, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-20"}]', '[]',
            '[{"id": "p_45_0", "fullName": "Hu\u1ef3nh Th\u1ecb Linh", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202685661", "department": "Ki\u00ean Giang 1", "phone": "0967226871", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}, {"id": "p_45_1", "fullName": "D\u01b0\u01a1ng Th\u1ecb Phong", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202664924", "department": "Ki\u00ean Giang 1", "phone": "0946599159", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}]', 'REJECTED', 2800000,
            1, NULL,
            'L1',
            'Không sắp xếp được lịch sản xuất tại điểm đến / Trùng lịch họp BGĐ',
            'budget_rejected', 2800000, '2026-09-20 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_046', 'CT-2026-SIM046', 'Chuyến công tác Nhà Máy Miền Đông - Hỗ trợ lắp đặt', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ',
            'Phan Thanh Phúc', 'Kiên Giang 1', 'DEPT_46',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-08-13', '2026-08-15',
            3, 'Xe cá nhân / Tự túc', 1,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 45 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Phụ) từ ngày 13/08/2026 đến ngày 15/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_46_1", "name": "Giay_Di_Duong_CT-2026-SIM046_Signed.pdf", "size": 402222, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-13"}]', '[]',
            '[{"id": "p_46_0", "fullName": "Phan Thanh Ph\u00fac", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202624723", "department": "Ki\u00ean Giang 1", "phone": "0974822228", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-08-13 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_047', 'CT-2026-SIM047', 'Chuyến công tác Nhà Máy Miền Đông - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ',
            'Đỗ Bảo Sơn', 'Hoàn Thiện Đế', 'DEPT_47',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-09-28', '2026-09-29',
            2, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 1,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 216 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Phụ) từ ngày 28/09/2026 đến ngày 29/09/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_47_1", "name": "Giay_Di_Duong_CT-2026-SIM047_Signed.pdf", "size": 275587, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-28"}]', '[]',
            '[{"id": "p_47_0", "fullName": "\u0110\u1ed7 B\u1ea3o S\u01a1n", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202652695", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0971952833", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-09-28 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_048', 'CT-2026-SIM048', 'Chuyến công tác Nhà Máy Miền Đông - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ',
            'Ngô Tuấn Dũng', 'Khối Quản Lý Chất Lượng QC', 'DEPT_48',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-08-13', '2026-08-14',
            2, 'Xe cá nhân / Tự túc', 1,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 16 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Phụ) từ ngày 13/08/2026 đến ngày 14/08/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_48_1", "name": "Giay_Di_Duong_CT-2026-SIM048_Signed.pdf", "size": 366826, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-13"}]', '[]',
            '[{"id": "p_48_0", "fullName": "Ng\u00f4 Tu\u1ea5n D\u0169ng", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202692296", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0986624023", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 1500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 1500000, '2026-08-13 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_049', 'CT-2026-SIM049', 'Chuyến công tác VP Chuỗi (R&D) - Hội nghị tổng kết kế hoạch sản xuất', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính',
            'Lê Phương Thảo', 'Nhà Máy Miền Đông', 'DEPT_49',
            'VP Chuỗi - Trụ sở chính (Bình Dương)', '2026-08-06', '2026-08-06',
            1, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 1,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 82 Đường Nguyễn Huệ, VP Chuỗi - Trụ sở chính (Bình Dương)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại VP Chuỗi (R&D) (Văn Phòng Chuỗi Chính) từ ngày 06/08/2026 đến ngày 06/08/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_49_1", "name": "Giay_Di_Duong_CT-2026-SIM049_Signed.pdf", "size": 191657, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-06"}]', '[]',
            '[{"id": "p_49_0", "fullName": "L\u00ea Ph\u01b0\u01a1ng Th\u1ea3o", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202635796", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0922680213", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}]', 'REJECTED', 5000000,
            1, NULL,
            'L1',
            'Không sắp xếp được lịch sản xuất tại điểm đến / Trùng lịch họp BGĐ',
            'budget_rejected', 5000000, '2026-08-06 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_050', 'CT-2026-SIM050', 'Chuyến công tác Kiên Giang 1 - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Phạm Đức Trinh', 'Kiên Giang 3', 'DEPT_50',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-08-28', '2026-08-31',
            4, 'Xe cá nhân / Tự túc', 2,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 193 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 28/08/2026 đến ngày 31/08/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_50_1", "name": "Giay_Di_Duong_CT-2026-SIM050_Signed.pdf", "size": 382973, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-28"}]', '[]',
            '[{"id": "p_50_0", "fullName": "Ph\u1ea1m \u0110\u1ee9c Trinh", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202660992", "department": "Ki\u00ean Giang 3", "phone": "0974659091", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_50_1", "fullName": "\u0110\u1ed7 Ph\u01b0\u01a1ng Phong", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202688235", "department": "Ki\u00ean Giang 3", "phone": "0934806445", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'RECALLED', 2800000,
            1, NULL,
            NULL,
            'Cán bộ chủ động rút lại đơn do thay đổi kế hoạch công tác',
            'pending_dept_budget', 2800000, '2026-08-28 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_051', 'CT-2026-SIM051', 'Chuyến công tác Kiên Giang 1 - Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô',
            'Vũ Phương Hà', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_51',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-27', '2026-09-28',
            2, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Số 102 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1A - Phụ lô) từ ngày 27/09/2026 đến ngày 28/09/2026.
Mục đích: Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_51_1", "name": "Giay_Di_Duong_CT-2026-SIM051_Signed.pdf", "size": 340059, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-27"}]', '[]',
            '[{"id": "p_51_0", "fullName": "V\u0169 Ph\u01b0\u01a1ng H\u00e0", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202636797", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0957308213", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}, {"id": "p_51_1", "fullName": "L\u00ea Kh\u00e1nh Nam", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202659947", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0943629802", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}, {"id": "p_51_2", "fullName": "D\u01b0\u01a1ng Minh Khai", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202621175", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0931862361", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 4200000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 4200000, '2026-09-27 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_052', 'CT-2026-SIM052', 'Chuyến công tác VP Chuỗi (R&D) - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính',
            'Huỳnh Phương Hà', 'Phòng Kế Toán - Tài Chính', 'DEPT_52',
            'VP Chuỗi - Trụ sở chính (Bình Dương)', '2026-08-16', '2026-08-17',
            2, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 1,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 110 Đường Nguyễn Huệ, VP Chuỗi - Trụ sở chính (Bình Dương)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại VP Chuỗi (R&D) (Văn Phòng Chuỗi Chính) từ ngày 16/08/2026 đến ngày 17/08/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_52_1", "name": "Giay_Di_Duong_CT-2026-SIM052_Signed.pdf", "size": 382976, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-16"}]', '[]',
            '[{"id": "p_52_0", "fullName": "Hu\u1ef3nh Ph\u01b0\u01a1ng H\u00e0", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202631730", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0931406690", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-08-16 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_053', 'CT-2026-SIM053', 'Chuyến công tác Nhà Máy Miền Đông - Kiểm tra hệ thống PPH, PCCC', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính',
            'Hồ Hữu Thảo', 'Hoàn Thiện Đế', 'DEPT_53',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-08-24', '2026-08-24',
            1, 'Xe cá nhân / Tự túc', 1,
            'Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ', 'Số 233 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Chính) từ ngày 24/08/2026 đến ngày 24/08/2026.
Mục đích: Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_53_1", "name": "Giay_Di_Duong_CT-2026-SIM053_Signed.pdf", "size": 404037, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-24"}]', '[]',
            '[{"id": "p_53_0", "fullName": "H\u1ed3 H\u1eefu Th\u1ea3o", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202688370", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0932905518", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 6800000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 6800000, '2026-08-24 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_054', 'CT-2026-SIM054', 'Chuyến công tác Nhà Máy Miền Đông - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính',
            'Đặng Đức Sơn', 'Kiên Giang 3', 'DEPT_54',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-08-25', '2026-08-26',
            2, 'Xe cá nhân / Tự túc', 2,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 115 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Chính) từ ngày 25/08/2026 đến ngày 26/08/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_54_1", "name": "Giay_Di_Duong_CT-2026-SIM054_Signed.pdf", "size": 328617, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-25"}]', '[]',
            '[{"id": "p_54_0", "fullName": "\u0110\u1eb7ng \u0110\u1ee9c S\u01a1n", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202693464", "department": "Ki\u00ean Giang 3", "phone": "0910746992", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_54_1", "fullName": "L\u00ea H\u1eefu Phong", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202688950", "department": "Ki\u00ean Giang 3", "phone": "0940269301", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 6800000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 6800000, '2026-08-25 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_055', 'CT-2026-SIM055', 'Chuyến công tác Kiên Giang 2 - Kiểm tra hệ thống PPH, PCCC', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng',
            'Dương Khánh Phúc', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_55',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-09-01', '2026-09-01',
            1, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 2,
            'Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ', 'Số 213 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 Mở rộng) từ ngày 01/09/2026 đến ngày 01/09/2026.
Mục đích: Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_55_1", "name": "Giay_Di_Duong_CT-2026-SIM055_Signed.pdf", "size": 261897, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-01"}]', '[{"id": "inv_55_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ki\u00ean Giang 2", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 1200000, "invoiceDate": "2026-09-01", "invoiceNumber": "HD-802574", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM055.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-01"}, {"id": "inv_55_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 850000, "invoiceDate": "2026-09-01", "invoiceNumber": "HD-496109", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM055.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-01"}]',
            '[{"id": "p_55_0", "fullName": "D\u01b0\u01a1ng Kh\u00e1nh Ph\u00fac", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202658328", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0987187107", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_55_1", "fullName": "B\u00f9i Kh\u00e1nh Huy", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202626341", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0943217636", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 1500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 1500000, '2026-09-01 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_056', 'CT-2026-SIM056', 'Chuyến công tác VP Chuỗi (R&D) - Hỗ trợ lắp đặt', 'VP Chuỗi (R&D)', 'Phòng R&D SKECHERS',
            'Bùi Hữu Dũng', 'Kiên Giang 2', 'DEPT_56',
            'VP Chuỗi - Trụ sở chính (Bình Dương)', '2026-08-04', '2026-08-04',
            1, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 217 Đường Nguyễn Huệ, VP Chuỗi - Trụ sở chính (Bình Dương)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại VP Chuỗi (R&D) (Phòng R&D SKECHERS) từ ngày 04/08/2026 đến ngày 04/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_56_1", "name": "Giay_Di_Duong_CT-2026-SIM056_Signed.pdf", "size": 348539, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-04"}]', '[]',
            '[{"id": "p_56_0", "fullName": "B\u00f9i H\u1eefu D\u0169ng", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202654494", "department": "Ki\u00ean Giang 2", "phone": "0957215558", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}, {"id": "p_56_1", "fullName": "H\u1ed3 H\u1eefu T\u1ea5n", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202697712", "department": "Ki\u00ean Giang 2", "phone": "0999239616", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}, {"id": "p_56_2", "fullName": "Tr\u1ea7n Ph\u01b0\u01a1ng Phong", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202682685", "department": "Ki\u00ean Giang 2", "phone": "0935734749", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-08-04 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_057', 'CT-2026-SIM057', 'Chuyến công tác Kiên Giang 1 - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô',
            'Đỗ Tuấn Huy', 'Kiên Giang 1', 'DEPT_57',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-10', '2026-09-13',
            4, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 220 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1A - Phụ lô) từ ngày 10/09/2026 đến ngày 13/09/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_57_1", "name": "Giay_Di_Duong_CT-2026-SIM057_Signed.pdf", "size": 361665, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-10"}]', '[]',
            '[{"id": "p_57_0", "fullName": "\u0110\u1ed7 Tu\u1ea5n Huy", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202695943", "department": "Ki\u00ean Giang 1", "phone": "0987579333", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}, {"id": "p_57_1", "fullName": "Phan Ph\u01b0\u01a1ng Trinh", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202672895", "department": "Ki\u00ean Giang 1", "phone": "0919498553", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 6800000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 6800000, '2026-09-10 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_058', 'CT-2026-SIM058', 'Chuyến công tác Kiên Giang 1 - Hội nghị tổng kết kế hoạch sản xuất', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Bùi Quốc Phong', 'Hoàn Thiện Đế', 'DEPT_58',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-22', '2026-09-23',
            2, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 1,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 130 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 22/09/2026 đến ngày 23/09/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_58_1", "name": "Giay_Di_Duong_CT-2026-SIM058_Signed.pdf", "size": 430014, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-22"}]', '[{"id": "inv_58_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ki\u00ean Giang 1", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 1200000, "invoiceDate": "2026-09-23", "invoiceNumber": "HD-480733", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM058.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-23"}, {"id": "inv_58_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 2200000, "invoiceDate": "2026-09-22", "invoiceNumber": "HD-513544", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM058.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-22"}]',
            '[{"id": "p_58_0", "fullName": "B\u00f9i Qu\u1ed1c Phong", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202694716", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0966258068", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-09-22 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_059', 'CT-2026-SIM059', 'Chuyến công tác Hoàn Thiện Đế - Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế',
            'Đặng Anh Huy', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_59',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-26', '2026-08-26',
            1, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 1,
            'Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Số 147 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Xưởng Hoàn Thiện Đế) từ ngày 26/08/2026 đến ngày 26/08/2026.
Mục đích: Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_59_1", "name": "Giay_Di_Duong_CT-2026-SIM059_Signed.pdf", "size": 429555, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-26"}]', '[{"id": "inv_59_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 1850000, "invoiceDate": "2026-08-26", "invoiceNumber": "HD-677468", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM059.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-26"}, {"id": "inv_59_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 850000, "invoiceDate": "2026-08-26", "invoiceNumber": "HD-432459", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM059.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-26"}]',
            '[{"id": "p_59_0", "fullName": "\u0110\u1eb7ng Anh Huy", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202683186", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0955650892", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-08-26 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_060', 'CT-2026-SIM060', 'Chuyến công tác Hoàn Thiện Đế - Hội nghị tổng kết kế hoạch sản xuất', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Hoàng Phương Phúc', 'Khối Bảo Trì MMTB', 'DEPT_60',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-15', '2026-08-15',
            1, 'Xe cá nhân / Tự túc', 3,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 130 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 15/08/2026 đến ngày 15/08/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_60_1", "name": "Giay_Di_Duong_CT-2026-SIM060_Signed.pdf", "size": 319806, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-15"}]', '[]',
            '[{"id": "p_60_0", "fullName": "Ho\u00e0ng Ph\u01b0\u01a1ng Ph\u00fac", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202631665", "department": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB", "phone": "0995451706", "pickupLocation": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB - C\u1ed5ng ch\u00ednh"}, {"id": "p_60_1", "fullName": "\u0110\u1ed7 Kh\u00e1nh Ph\u00fac", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202664461", "department": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB", "phone": "0918421521", "pickupLocation": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB - C\u1ed5ng ch\u00ednh"}, {"id": "p_60_2", "fullName": "Phan Ng\u1ecdc Th\u1ea3o", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202656671", "department": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB", "phone": "0929084616", "pickupLocation": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB - C\u1ed5ng ch\u00ednh"}]', 'PENDING_L2', 4200000,
            1, 'L1',
            NULL,
            NULL,
            'pending_exec_budget', 4200000, '2026-08-15 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_061', 'CT-2026-SIM061', 'Chuyến công tác Hoàn Thiện Đế - Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Hoàng Minh Sơn', 'Kiên Giang 1', 'DEPT_61',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-09-16', '2026-09-19',
            4, 'Xe cá nhân / Tự túc', 1,
            'Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Số 153 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 16/09/2026 đến ngày 19/09/2026.
Mục đích: Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_61_1", "name": "Giay_Di_Duong_CT-2026-SIM061_Signed.pdf", "size": 280890, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-16"}]', '[]',
            '[{"id": "p_61_0", "fullName": "Ho\u00e0ng Minh S\u01a1n", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202662288", "department": "Ki\u00ean Giang 1", "phone": "0995962519", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 3500000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 3500000, '2026-09-16 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_062', 'CT-2026-SIM062', 'Chuyến công tác Kiên Giang 3 - Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Dương Thị Mai', 'Khối Bảo Trì MMTB', 'DEPT_62',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-08-09', '2026-08-09',
            1, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 2,
            'Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Số 99 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 09/08/2026 đến ngày 09/08/2026.
Mục đích: Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_62_1", "name": "Giay_Di_Duong_CT-2026-SIM062_Signed.pdf", "size": 443430, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-09"}]', '[]',
            '[{"id": "p_62_0", "fullName": "D\u01b0\u01a1ng Th\u1ecb Mai", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202634358", "department": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB", "phone": "0946005353", "pickupLocation": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB - C\u1ed5ng ch\u00ednh"}, {"id": "p_62_1", "fullName": "Phan \u0110\u1ee9c D\u0169ng", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202638205", "department": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB", "phone": "0971360218", "pickupLocation": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 3500000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 3500000, '2026-08-09 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_063', 'CT-2026-SIM063', 'Chuyến công tác Kiên Giang 2 - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Nguyễn Khánh Khai', 'Kiên Giang 1', 'DEPT_63',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-09-30', '2026-09-30',
            1, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 3,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 208 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 30/09/2026 đến ngày 30/09/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_63_1", "name": "Giay_Di_Duong_CT-2026-SIM063_Signed.pdf", "size": 227937, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-30"}]', '[]',
            '[{"id": "p_63_0", "fullName": "Nguy\u1ec5n Kh\u00e1nh Khai", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202668303", "department": "Ki\u00ean Giang 1", "phone": "0940020737", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}, {"id": "p_63_1", "fullName": "D\u01b0\u01a1ng Qu\u1ed1c Th\u1ea3o", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202624248", "department": "Ki\u00ean Giang 1", "phone": "0953108529", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}, {"id": "p_63_2", "fullName": "Hu\u1ef3nh Thanh Huy", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202659700", "department": "Ki\u00ean Giang 1", "phone": "0975564914", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-09-30 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_064', 'CT-2026-SIM064', 'Chuyến công tác Nhà Máy Miền Đông - Hỗ trợ lắp đặt', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ',
            'Phan Thanh Nam', 'Kiên Giang 3', 'DEPT_64',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-09-23', '2026-09-24',
            2, 'Xe cá nhân / Tự túc', 2,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 212 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Phụ) từ ngày 23/09/2026 đến ngày 24/09/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_64_1", "name": "Giay_Di_Duong_CT-2026-SIM064_Signed.pdf", "size": 362910, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-23"}]', '[]',
            '[{"id": "p_64_0", "fullName": "Phan Thanh Nam", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202635986", "department": "Ki\u00ean Giang 3", "phone": "0963515558", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_64_1", "fullName": "V\u00f5 Ng\u1ecdc H\u00e0", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202699424", "department": "Ki\u00ean Giang 3", "phone": "0999113027", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 5000000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 5000000, '2026-09-23 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_065', 'CT-2026-SIM065', 'Chuyến công tác Kiên Giang 2 - Hỗ trợ lắp đặt', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Vũ Văn Tâm', 'Nhà Máy Miền Đông', 'DEPT_65',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-08-09', '2026-08-11',
            3, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 2,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 35 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 09/08/2026 đến ngày 11/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_65_1", "name": "Giay_Di_Duong_CT-2026-SIM065_Signed.pdf", "size": 428863, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-09"}]', '[]',
            '[{"id": "p_65_0", "fullName": "V\u0169 V\u0103n T\u00e2m", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202691803", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0936541383", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}, {"id": "p_65_1", "fullName": "H\u1ed3 Qu\u1ed1c Th\u1ea3o", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202670695", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0923933653", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 3500000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 3500000, '2026-08-09 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_066', 'CT-2026-SIM066', 'Chuyến công tác Kiên Giang 1 - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô',
            'Trần Hoài Trinh', 'Kiên Giang 3', 'DEPT_66',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-25', '2026-09-25',
            1, 'Xe cá nhân / Tự túc', 1,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 128 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1A - Phụ lô) từ ngày 25/09/2026 đến ngày 25/09/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_66_1", "name": "Giay_Di_Duong_CT-2026-SIM066_Signed.pdf", "size": 231768, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-25"}]', '[{"id": "inv_66_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ki\u00ean Giang 1", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 1850000, "invoiceDate": "2026-09-25", "invoiceNumber": "HD-318946", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM066.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-25"}, {"id": "inv_66_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 850000, "invoiceDate": "2026-09-25", "invoiceNumber": "HD-767613", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM066.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-25"}]',
            '[{"id": "p_66_0", "fullName": "Tr\u1ea7n Ho\u00e0i Trinh", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202629431", "department": "Ki\u00ean Giang 3", "phone": "0959056185", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 4200000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 4200000, '2026-09-25 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_067', 'CT-2026-SIM067', 'Chuyến công tác Kiên Giang 3 - Hỗ trợ lắp đặt', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Ngô Thị Sơn', 'Nhà Máy Miền Đông', 'DEPT_67',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-08-24', '2026-08-25',
            2, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 1,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 161 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 24/08/2026 đến ngày 25/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_67_1", "name": "Giay_Di_Duong_CT-2026-SIM067_Signed.pdf", "size": 315593, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-24"}]', '[]',
            '[{"id": "p_67_0", "fullName": "Ng\u00f4 Th\u1ecb S\u01a1n", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202691165", "department": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "phone": "0938288334", "pickupLocation": "Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-08-24 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_068', 'CT-2026-SIM068', 'Chuyến công tác Nhà Máy Miền Đông - Kiểm tra hệ thống PPH, PCCC', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ',
            'Huỳnh Tuấn Khai', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_68',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-08-10', '2026-08-10',
            1, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ', 'Số 219 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Phụ) từ ngày 10/08/2026 đến ngày 10/08/2026.
Mục đích: Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_68_1", "name": "Giay_Di_Duong_CT-2026-SIM068_Signed.pdf", "size": 372651, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-10"}]', '[{"id": "inv_68_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 1850000, "invoiceDate": "2026-08-10", "invoiceNumber": "HD-549555", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM068.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-10"}, {"id": "inv_68_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 2200000, "invoiceDate": "2026-08-10", "invoiceNumber": "HD-241240", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM068.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-10"}]',
            '[{"id": "p_68_0", "fullName": "Hu\u1ef3nh Tu\u1ea5n Khai", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202681293", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0932366737", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_68_1", "fullName": "Ph\u1ea1m Kh\u00e1nh H\u00e0", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202651883", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0959750603", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_68_2", "fullName": "Ng\u00f4 Tu\u1ea5n H\u00e0", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202627221", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0999738717", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-08-10 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_069', 'CT-2026-SIM069', 'Chuyến công tác Kiên Giang 3 - Hỗ trợ lắp đặt', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Ngô Đức Thảo', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_69',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-08-24', '2026-08-24',
            1, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 72 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 24/08/2026 đến ngày 24/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_69_1", "name": "Giay_Di_Duong_CT-2026-SIM069_Signed.pdf", "size": 443686, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-24"}]', '[]',
            '[{"id": "p_69_0", "fullName": "Ng\u00f4 \u0110\u1ee9c Th\u1ea3o", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202655550", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0976163727", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_69_1", "fullName": "Nguy\u1ec5n Th\u1ecb Linh", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202629855", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0963812911", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_69_2", "fullName": "D\u01b0\u01a1ng Tu\u1ea5n S\u01a1n", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202620406", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0964198026", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-08-24 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_070', 'CT-2026-SIM070', 'Chuyến công tác Kiên Giang 2 - Hỗ trợ lắp đặt', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Ngô Hoài Trinh', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_70',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-09-07', '2026-09-08',
            2, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 3,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 199 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 07/09/2026 đến ngày 08/09/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_70_1", "name": "Giay_Di_Duong_CT-2026-SIM070_Signed.pdf", "size": 347842, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-07"}]', '[]',
            '[{"id": "p_70_0", "fullName": "Ng\u00f4 Ho\u00e0i Trinh", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202618683", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0930337296", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}, {"id": "p_70_1", "fullName": "L\u00ea B\u1ea3o H\u00f9ng", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202687834", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0914499470", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}, {"id": "p_70_2", "fullName": "Nguy\u1ec5n Thanh Huy", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202682996", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0989717050", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 2800000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 2800000, '2026-09-07 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_071', 'CT-2026-SIM071', 'Chuyến công tác Nhà Máy Miền Đông - Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính',
            'Võ Văn Linh', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_71',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-09-01', '2026-09-03',
            3, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 1,
            'Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Số 49 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Chính) từ ngày 01/09/2026 đến ngày 03/09/2026.
Mục đích: Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_71_1", "name": "Giay_Di_Duong_CT-2026-SIM071_Signed.pdf", "size": 229599, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-01"}]', '[]',
            '[{"id": "p_71_0", "fullName": "V\u00f5 V\u0103n Linh", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202670917", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0973306101", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'PENDING_L2', 3500000,
            1, 'L1',
            NULL,
            NULL,
            'pending_exec_budget', 3500000, '2026-09-01 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_072', 'CT-2026-SIM072', 'Chuyến công tác Kiên Giang 2 - Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Hồ Ngọc Phúc', 'Hoàn Thiện Đế', 'DEPT_72',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-09-06', '2026-09-09',
            4, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 3,
            'Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Số 102 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 06/09/2026 đến ngày 09/09/2026.
Mục đích: Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_72_1", "name": "Giay_Di_Duong_CT-2026-SIM072_Signed.pdf", "size": 282864, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-06"}]', '[]',
            '[{"id": "p_72_0", "fullName": "H\u1ed3 Ng\u1ecdc Ph\u00fac", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202621412", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0967985652", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}, {"id": "p_72_1", "fullName": "Tr\u1ea7n Ph\u01b0\u01a1ng T\u00e2m", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202639451", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0963036118", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}, {"id": "p_72_2", "fullName": "Ho\u00e0ng Tu\u1ea5n Linh", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202638357", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0948555991", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 2800000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 2800000, '2026-09-06 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_073', 'CT-2026-SIM073', 'Chuyến công tác Kiên Giang 3 - Hội nghị tổng kết kế hoạch sản xuất', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Hồ Hữu Dũng', 'Khối Kỹ Thuật & IE', 'DEPT_73',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-08-26', '2026-08-26',
            1, 'Xe cá nhân / Tự túc', 3,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 215 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 26/08/2026 đến ngày 26/08/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_73_1", "name": "Giay_Di_Duong_CT-2026-SIM073_Signed.pdf", "size": 200685, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-26"}]', '[]',
            '[{"id": "p_73_0", "fullName": "H\u1ed3 H\u1eefu D\u0169ng", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202686270", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0994934226", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}, {"id": "p_73_1", "fullName": "Ng\u00f4 B\u1ea3o Trinh", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202611367", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0964954074", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}, {"id": "p_73_2", "fullName": "V\u00f5 Minh Khai", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202661775", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0982948444", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 4200000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 4200000, '2026-08-26 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_074', 'CT-2026-SIM074', 'Chuyến công tác Kiên Giang 3 - Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Phan Phương Thảo', 'Kiên Giang 3', 'DEPT_74',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-08-15', '2026-08-16',
            2, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 2,
            'Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Số 16 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 15/08/2026 đến ngày 16/08/2026.
Mục đích: Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_74_1", "name": "Giay_Di_Duong_CT-2026-SIM074_Signed.pdf", "size": 189910, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-15"}]', '[]',
            '[{"id": "p_74_0", "fullName": "Phan Ph\u01b0\u01a1ng Th\u1ea3o", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202661262", "department": "Ki\u00ean Giang 3", "phone": "0946904875", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_74_1", "fullName": "\u0110\u1ed7 Ph\u01b0\u01a1ng T\u1ea5n", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202684857", "department": "Ki\u00ean Giang 3", "phone": "0990417975", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'PENDING_L2', 6800000,
            1, 'L1',
            NULL,
            NULL,
            'pending_exec_budget', 6800000, '2026-08-15 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_075', 'CT-2026-SIM075', 'Chuyến công tác Hoàn Thiện Đế - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Đỗ Bảo Hùng', 'Khối Kỹ Thuật & IE', 'DEPT_75',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-10', '2026-08-12',
            3, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 3,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 232 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 10/08/2026 đến ngày 12/08/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_75_1", "name": "Giay_Di_Duong_CT-2026-SIM075_Signed.pdf", "size": 238741, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-10"}]', '[]',
            '[{"id": "p_75_0", "fullName": "\u0110\u1ed7 B\u1ea3o H\u00f9ng", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202668550", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0925419382", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}, {"id": "p_75_1", "fullName": "Tr\u1ea7n B\u1ea3o H\u00e0", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202646880", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0988604619", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}, {"id": "p_75_2", "fullName": "Ng\u00f4 Ph\u01b0\u01a1ng Ph\u00fac", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202612168", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0973164836", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}]', 'RECALLED', 5000000,
            1, NULL,
            NULL,
            'Cán bộ chủ động rút lại đơn do thay đổi kế hoạch công tác',
            'pending_dept_budget', 5000000, '2026-08-10 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_076', 'CT-2026-SIM076', 'Chuyến công tác Kiên Giang 2 - Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Đặng Anh Khai', 'Kiên Giang 1', 'DEPT_76',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-09-16', '2026-09-17',
            2, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 1,
            'Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Số 230 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 16/09/2026 đến ngày 17/09/2026.
Mục đích: Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_76_1", "name": "Giay_Di_Duong_CT-2026-SIM076_Signed.pdf", "size": 215901, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-16"}]', '[]',
            '[{"id": "p_76_0", "fullName": "\u0110\u1eb7ng Anh Khai", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202688659", "department": "Ki\u00ean Giang 1", "phone": "0961737548", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}]', 'REJECTED', 3500000,
            1, NULL,
            'L2',
            'Không sắp xếp được lịch sản xuất tại điểm đến / Trùng lịch họp BGĐ',
            'budget_rejected', 3500000, '2026-09-16 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_077', 'CT-2026-SIM077', 'Chuyến công tác Kiên Giang 2 - Hội nghị tổng kết kế hoạch sản xuất', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng',
            'Hồ Tuấn Linh', 'Hoàn Thiện Đế', 'DEPT_77',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-08-28', '2026-08-31',
            4, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 1,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 119 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 Mở rộng) từ ngày 28/08/2026 đến ngày 31/08/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_77_1", "name": "Giay_Di_Duong_CT-2026-SIM077_Signed.pdf", "size": 392333, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-28"}]', '[{"id": "inv_77_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ki\u00ean Giang 2", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 3100000, "invoiceDate": "2026-08-31", "invoiceNumber": "HD-950937", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM077.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-31"}, {"id": "inv_77_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 2200000, "invoiceDate": "2026-08-28", "invoiceNumber": "HD-396183", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM077.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-28"}]',
            '[{"id": "p_77_0", "fullName": "H\u1ed3 Tu\u1ea5n Linh", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202648260", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0972969266", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-08-28 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_078', 'CT-2026-SIM078', 'Chuyến công tác Kiên Giang 2 - Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Hoàng Văn Nam', 'Ban Quản Lý & Xuất Nhập Khẩu', 'DEPT_78',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-08-08', '2026-08-08',
            1, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Số 18 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 08/08/2026 đến ngày 08/08/2026.
Mục đích: Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_78_1", "name": "Giay_Di_Duong_CT-2026-SIM078_Signed.pdf", "size": 319063, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-08"}]', '[]',
            '[{"id": "p_78_0", "fullName": "Ho\u00e0ng V\u0103n Nam", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202666659", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0992879774", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}, {"id": "p_78_1", "fullName": "Ph\u1ea1m Minh Phong", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202633147", "department": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u", "phone": "0995130936", "pickupLocation": "Ban Qu\u1ea3n L\u00fd & Xu\u1ea5t Nh\u1eadp Kh\u1ea9u - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 3500000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 3500000, '2026-08-08 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_079', 'CT-2026-SIM079', 'Chuyến công tác Hoàn Thiện Đế - Hỗ trợ lắp đặt', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Vũ Minh Hà', 'Kiên Giang 1', 'DEPT_79',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-19', '2026-08-19',
            1, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 124 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 19/08/2026 đến ngày 19/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_79_1", "name": "Giay_Di_Duong_CT-2026-SIM079_Signed.pdf", "size": 438071, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-19"}]', '[]',
            '[{"id": "p_79_0", "fullName": "V\u0169 Minh H\u00e0", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202620998", "department": "Ki\u00ean Giang 1", "phone": "0924497999", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}, {"id": "p_79_1", "fullName": "D\u01b0\u01a1ng V\u0103n Linh", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202629910", "department": "Ki\u00ean Giang 1", "phone": "0977992144", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}, {"id": "p_79_2", "fullName": "Tr\u1ea7n B\u1ea3o Ph\u00fac", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202674707", "department": "Ki\u00ean Giang 1", "phone": "0944641511", "pickupLocation": "Ki\u00ean Giang 1 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-08-19 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_080', 'CT-2026-SIM080', 'Chuyến công tác Hoàn Thiện Đế - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Bùi Thanh Tâm', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_80',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-12', '2026-08-15',
            4, 'Xe cá nhân / Tự túc', 1,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 154 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 12/08/2026 đến ngày 15/08/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_80_1", "name": "Giay_Di_Duong_CT-2026-SIM080_Signed.pdf", "size": 347012, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-12"}]', '[]',
            '[{"id": "p_80_0", "fullName": "B\u00f9i Thanh T\u00e2m", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202680958", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0968189610", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'PENDING_L2', 1500000,
            1, 'L1',
            NULL,
            NULL,
            'pending_exec_budget', 1500000, '2026-08-12 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_081', 'CT-2026-SIM081', 'Chuyến công tác Kiên Giang 3 - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Đỗ Thị Mai', 'Hoàn Thiện Đế', 'DEPT_81',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-09-14', '2026-09-15',
            2, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 2,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 92 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 14/09/2026 đến ngày 15/09/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_81_1", "name": "Giay_Di_Duong_CT-2026-SIM081_Signed.pdf", "size": 261253, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-14"}]', '[]',
            '[{"id": "p_81_0", "fullName": "\u0110\u1ed7 Th\u1ecb Mai", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202654958", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0987146767", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}, {"id": "p_81_1", "fullName": "V\u00f5 Anh T\u00e2m", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202667366", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0980601958", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 5000000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 5000000, '2026-09-14 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_082', 'CT-2026-SIM082', 'Chuyến công tác Kiên Giang 3 - Hỗ trợ lắp đặt', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3',
            'Võ Hữu Thảo', 'Hoàn Thiện Đế', 'DEPT_82',
            'Cụm Sản Xuất Tân Hiệp (Kiên Giang)', '2026-08-23', '2026-08-25',
            3, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 2,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 170 Đường Nguyễn Huệ, Cụm Sản Xuất Tân Hiệp (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 3 (Nhà máy NK3 - Kiên Giang 3) từ ngày 23/08/2026 đến ngày 25/08/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_82_1", "name": "Giay_Di_Duong_CT-2026-SIM082_Signed.pdf", "size": 245638, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-23"}]', '[{"id": "inv_82_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ki\u00ean Giang 3", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 1850000, "invoiceDate": "2026-08-25", "invoiceNumber": "HD-300817", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM082.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-25"}, {"id": "inv_82_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 2200000, "invoiceDate": "2026-08-23", "invoiceNumber": "HD-743742", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM082.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-23"}]',
            '[{"id": "p_82_0", "fullName": "V\u00f5 H\u1eefu Th\u1ea3o", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202652636", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0996171332", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}, {"id": "p_82_1", "fullName": "Nguy\u1ec5n Anh Th\u1ea3o", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202631242", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0971871408", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-08-23 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_083', 'CT-2026-SIM083', 'Chuyến công tác Nhà Máy Miền Đông - Hỗ trợ lắp đặt', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ',
            'Nguyễn Khánh Nam', 'Phòng Kế Toán - Tài Chính', 'DEPT_83',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-09-02', '2026-09-04',
            3, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 1,
            'Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS', 'Số 185 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Phụ) từ ngày 02/09/2026 đến ngày 04/09/2026.
Mục đích: Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_83_1", "name": "Giay_Di_Duong_CT-2026-SIM083_Signed.pdf", "size": 419928, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-02"}]', '[]',
            '[{"id": "p_83_0", "fullName": "Nguy\u1ec5n Kh\u00e1nh Nam", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202641758", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0912804235", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-09-02 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_084', 'CT-2026-SIM084', 'Chuyến công tác Hoàn Thiện Đế - Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế',
            'Đỗ Hoài Tâm', 'Phòng Kế Toán - Tài Chính', 'DEPT_84',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-09-16', '2026-09-16',
            1, 'Xe cá nhân / Tự túc', 1,
            'Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Số 56 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Xưởng Hoàn Thiện Đế) từ ngày 16/09/2026 đến ngày 16/09/2026.
Mục đích: Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_84_1", "name": "Giay_Di_Duong_CT-2026-SIM084_Signed.pdf", "size": 339548, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-16"}]', '[]',
            '[{"id": "p_84_0", "fullName": "\u0110\u1ed7 Ho\u00e0i T\u00e2m", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202611314", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0987717817", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 2800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 2800000, '2026-09-16 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_085', 'CT-2026-SIM085', 'Chuyến công tác Nhà Máy Miền Đông - Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính',
            'Đỗ Quốc Hùng', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_85',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-09-30', '2026-10-02',
            3, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 2,
            'Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Số 33 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Chính) từ ngày 30/09/2026 đến ngày 02/10/2026.
Mục đích: Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_85_1", "name": "Giay_Di_Duong_CT-2026-SIM085_Signed.pdf", "size": 378869, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-30"}]', '[]',
            '[{"id": "p_85_0", "fullName": "\u0110\u1ed7 Qu\u1ed1c H\u00f9ng", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202680477", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0918330067", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_85_1", "fullName": "Phan B\u1ea3o Linh", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202675359", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0918310932", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'PENDING_L2', 3500000,
            1, 'L1',
            NULL,
            NULL,
            'pending_exec_budget', 3500000, '2026-09-30 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_086', 'CT-2026-SIM086', 'Chuyến công tác Kiên Giang 1 - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Nguyễn Khánh Tấn', 'Kiên Giang 3', 'DEPT_86',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-11', '2026-09-13',
            3, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 2,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 21 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 11/09/2026 đến ngày 13/09/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_86_1", "name": "Giay_Di_Duong_CT-2026-SIM086_Signed.pdf", "size": 375812, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-11"}]', '[]',
            '[{"id": "p_86_0", "fullName": "Nguy\u1ec5n Kh\u00e1nh T\u1ea5n", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202677902", "department": "Ki\u00ean Giang 3", "phone": "0915941176", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_86_1", "fullName": "Ph\u1ea1m Th\u1ecb Linh", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202672300", "department": "Ki\u00ean Giang 3", "phone": "0916446506", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 4200000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 4200000, '2026-09-11 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_087', 'CT-2026-SIM087', 'Chuyến công tác VP Chuỗi (R&D) - Hội nghị tổng kết kế hoạch sản xuất', 'VP Chuỗi (R&D)', 'Phòng R&D SKECHERS',
            'Đỗ Khánh Mai', 'Khối Quản Lý Chất Lượng QC', 'DEPT_87',
            'VP Chuỗi - Trụ sở chính (Bình Dương)', '2026-09-16', '2026-09-16',
            1, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 2,
            'Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc', 'Số 177 Đường Nguyễn Huệ, VP Chuỗi - Trụ sở chính (Bình Dương)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại VP Chuỗi (R&D) (Phòng R&D SKECHERS) từ ngày 16/09/2026 đến ngày 16/09/2026.
Mục đích: Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_87_1", "name": "Giay_Di_Duong_CT-2026-SIM087_Signed.pdf", "size": 352450, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-16"}]', '[]',
            '[{"id": "p_87_0", "fullName": "\u0110\u1ed7 Kh\u00e1nh Mai", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202649577", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0952677671", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}, {"id": "p_87_1", "fullName": "Ph\u1ea1m Th\u1ecb T\u00e2m", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202630421", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0987803963", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-09-16 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_088', 'CT-2026-SIM088', 'Chuyến công tác Kiên Giang 2 - Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng',
            'Lê Quốc Tấn', 'Phòng Kế Toán - Tài Chính', 'DEPT_88',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-08-05', '2026-08-07',
            3, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 3,
            'Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí', 'Số 167 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 Mở rộng) từ ngày 05/08/2026 đến ngày 07/08/2026.
Mục đích: Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_88_1", "name": "Giay_Di_Duong_CT-2026-SIM088_Signed.pdf", "size": 372469, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-05"}]', '[]',
            '[{"id": "p_88_0", "fullName": "L\u00ea Qu\u1ed1c T\u1ea5n", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202631766", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0912325213", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}, {"id": "p_88_1", "fullName": "\u0110\u1ed7 Qu\u1ed1c T\u1ea5n", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202655655", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0966201408", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}, {"id": "p_88_2", "fullName": "Tr\u1ea7n Anh T\u00e2m", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202641439", "department": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh", "phone": "0948988010", "pickupLocation": "Ph\u00f2ng K\u1ebf To\u00e1n - T\u00e0i Ch\u00ednh - C\u1ed5ng ch\u00ednh"}]', 'REJECTED', 3500000,
            1, NULL,
            'L2',
            'Không sắp xếp được lịch sản xuất tại điểm đến / Trùng lịch họp BGĐ',
            'budget_rejected', 3500000, '2026-08-05 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_089', 'CT-2026-SIM089', 'Chuyến công tác Kiên Giang 1 - Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Hồ Tuấn Hà', 'Kiên Giang 2', 'DEPT_89',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-08', '2026-09-10',
            3, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 1,
            'Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Số 186 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 08/09/2026 đến ngày 10/09/2026.
Mục đích: Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_89_1", "name": "Giay_Di_Duong_CT-2026-SIM089_Signed.pdf", "size": 318135, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-08"}]', '[]',
            '[{"id": "p_89_0", "fullName": "H\u1ed3 Tu\u1ea5n H\u00e0", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202649827", "department": "Ki\u00ean Giang 2", "phone": "0917376373", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}]', 'PENDING_L2', 6800000,
            1, 'L1',
            NULL,
            NULL,
            'pending_exec_budget', 6800000, '2026-09-08 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_090', 'CT-2026-SIM090', 'Chuyến công tác Nhà Máy Miền Đông - Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính',
            'Đỗ Đức Trinh', 'Khối Bảo Trì MMTB', 'DEPT_90',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-08-23', '2026-08-24',
            2, 'Xe cá nhân / Tự túc', 2,
            'Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới', 'Số 128 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Chính) từ ngày 23/08/2026 đến ngày 24/08/2026.
Mục đích: Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_90_1", "name": "Giay_Di_Duong_CT-2026-SIM090_Signed.pdf", "size": 227795, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-23"}]', '[{"id": "inv_90_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 3100000, "invoiceDate": "2026-08-24", "invoiceNumber": "HD-317168", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM090.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-24"}, {"id": "inv_90_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 850000, "invoiceDate": "2026-08-23", "invoiceNumber": "HD-528609", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM090.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-23"}]',
            '[{"id": "p_90_0", "fullName": "\u0110\u1ed7 \u0110\u1ee9c Trinh", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202613376", "department": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB", "phone": "0980943483", "pickupLocation": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB - C\u1ed5ng ch\u00ednh"}, {"id": "p_90_1", "fullName": "L\u00ea Th\u1ecb Huy", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202661939", "department": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB", "phone": "0990799032", "pickupLocation": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-08-23 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_091', 'CT-2026-SIM091', 'Chuyến công tác Kiên Giang 1 - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Ngô Bảo Trinh', 'Hoàn Thiện Đế', 'DEPT_91',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-08-07', '2026-08-07',
            1, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 184 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 07/08/2026 đến ngày 07/08/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_91_1", "name": "Giay_Di_Duong_CT-2026-SIM091_Signed.pdf", "size": 181862, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-07"}]', '[]',
            '[{"id": "p_91_0", "fullName": "Ng\u00f4 B\u1ea3o Trinh", "position": "Chuy\u00ean Vi\u00ean Ki\u1ec3m \u0110\u1ecbnh QC", "employeeId": "202672513", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0995793605", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}, {"id": "p_91_1", "fullName": "Tr\u1ea7n Thanh Ph\u00fac", "position": "Tr\u01b0\u1edfng Ph\u00f2ng K\u1ef9 Thu\u1eadt IE", "employeeId": "202637805", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0986044372", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}, {"id": "p_91_2", "fullName": "\u0110\u1eb7ng Th\u1ecb Huy", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202645257", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0982165928", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 3500000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 3500000, '2026-08-07 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_092', 'CT-2026-SIM092', 'Chuyến công tác Hoàn Thiện Đế - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế',
            'Bùi Khánh Tấn', 'Kiên Giang 3', 'DEPT_92',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-31', '2026-09-02',
            3, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 3,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 90 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Xưởng Hoàn Thiện Đế) từ ngày 31/08/2026 đến ngày 02/09/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_92_1", "name": "Giay_Di_Duong_CT-2026-SIM092_Signed.pdf", "size": 409778, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-31"}]', '[]',
            '[{"id": "p_92_0", "fullName": "B\u00f9i Kh\u00e1nh T\u1ea5n", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202649771", "department": "Ki\u00ean Giang 3", "phone": "0987958768", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_92_1", "fullName": "Ng\u00f4 Anh Linh", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202695908", "department": "Ki\u00ean Giang 3", "phone": "0948001691", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_92_2", "fullName": "Nguy\u1ec5n H\u1eefu H\u00e0", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202678742", "department": "Ki\u00ean Giang 3", "phone": "0978279057", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'REJECTED', 4200000,
            1, NULL,
            'L2',
            'Không sắp xếp được lịch sản xuất tại điểm đến / Trùng lịch họp BGĐ',
            'budget_rejected', 4200000, '2026-08-31 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_093', 'CT-2026-SIM093', 'Chuyến công tác Nhà Máy Miền Đông - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính',
            'Vũ Khánh Hùng', 'Khối Quản Lý Chất Lượng QC', 'DEPT_93',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-09-14', '2026-09-16',
            3, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 2,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 42 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Chính) từ ngày 14/09/2026 đến ngày 16/09/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_93_1", "name": "Giay_Di_Duong_CT-2026-SIM093_Signed.pdf", "size": 400330, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-14"}]', '[{"id": "inv_93_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Nh\u00e0 M\u00e1y Mi\u1ec1n \u0110\u00f4ng", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 2400000, "invoiceDate": "2026-09-16", "invoiceNumber": "HD-232965", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM093.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-16"}, {"id": "inv_93_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 1450000, "invoiceDate": "2026-09-14", "invoiceNumber": "HD-917606", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM093.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-09-14"}]',
            '[{"id": "p_93_0", "fullName": "V\u0169 Kh\u00e1nh H\u00f9ng", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202631663", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0941361432", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}, {"id": "p_93_1", "fullName": "Hu\u1ef3nh H\u1eefu D\u0169ng", "position": "K\u1ef9 S\u01b0 B\u1ea3o Tr\u00ec MMTB", "employeeId": "202635398", "department": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC", "phone": "0972356984", "pickupLocation": "Kh\u1ed1i Qu\u1ea3n L\u00fd Ch\u1ea5t L\u01b0\u1ee3ng QC - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 3500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 3500000, '2026-09-14 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_094', 'CT-2026-SIM094', 'Chuyến công tác VP Chuỗi (R&D) - Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính',
            'Dương Thanh Tấn', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_94',
            'VP Chuỗi - Trụ sở chính (Bình Dương)', '2026-08-11', '2026-08-12',
            2, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 1,
            'Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026', 'Số 239 Đường Nguyễn Huệ, VP Chuỗi - Trụ sở chính (Bình Dương)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại VP Chuỗi (R&D) (Văn Phòng Chuỗi Chính) từ ngày 11/08/2026 đến ngày 12/08/2026.
Mục đích: Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_94_1", "name": "Giay_Di_Duong_CT-2026-SIM094_Signed.pdf", "size": 437654, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-11"}]', '[]',
            '[{"id": "p_94_0", "fullName": "D\u01b0\u01a1ng Thanh T\u1ea5n", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202618159", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0954330609", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 4200000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 4200000, '2026-08-11 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_095', 'CT-2026-SIM095', 'Chuyến công tác Kiên Giang 1 - Kiểm tra hệ thống PPH, PCCC', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1',
            'Vũ Phương Phong', 'Khối Kỹ Thuật & IE', 'DEPT_95',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-16', '2026-09-16',
            1, 'Xe công ty (Fortuner 7 chỗ - 61A-123.45)', 3,
            'Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ', 'Số 149 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1 - Kiên Giang 1) từ ngày 16/09/2026 đến ngày 16/09/2026.
Mục đích: Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe công ty (Fortuner 7 chỗ - 61A-123.45).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_95_1", "name": "Giay_Di_Duong_CT-2026-SIM095_Signed.pdf", "size": 359501, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-16"}]', '[]',
            '[{"id": "p_95_0", "fullName": "V\u0169 Ph\u01b0\u01a1ng Phong", "position": "Tr\u01b0\u1edfng X\u01b0\u1edfng G\u00f2 D\u00e1n", "employeeId": "202660530", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0982373936", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}, {"id": "p_95_1", "fullName": "Ho\u00e0ng H\u1eefu T\u00e2m", "position": "Qu\u1ea3n L\u00fd D\u1ef1 \u00c1n Kaizen", "employeeId": "202661867", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0972846517", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}, {"id": "p_95_2", "fullName": "B\u00f9i Tu\u1ea5n Mai", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202684937", "department": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE", "phone": "0940042224", "pickupLocation": "Kh\u1ed1i K\u1ef9 Thu\u1eadt & IE - C\u1ed5ng ch\u00ednh"}]', 'PENDING', 1500000,
            1, NULL,
            NULL,
            NULL,
            'pending_dept_budget', 1500000, '2026-09-16 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_096', 'CT-2026-SIM096', 'Chuyến công tác Kiên Giang 2 - Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2',
            'Vũ Hoài Phong', 'Khối Bảo Trì MMTB', 'DEPT_96',
            'Khu Công Nghiệp Châu Thành (Kiên Giang)', '2026-08-11', '2026-08-11',
            1, 'Xe cá nhân / Tự túc', 1,
            'Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền', 'Số 129 Đường Nguyễn Huệ, Khu Công Nghiệp Châu Thành (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 2 (Nhà máy NK2 - Kiên Giang 2) từ ngày 11/08/2026 đến ngày 11/08/2026.
Mục đích: Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_96_1", "name": "Giay_Di_Duong_CT-2026-SIM096_Signed.pdf", "size": 249989, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-11"}]', '[]',
            '[{"id": "p_96_0", "fullName": "V\u0169 Ho\u00e0i Phong", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202616284", "department": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB", "phone": "0946960513", "pickupLocation": "Kh\u1ed1i B\u1ea3o Tr\u00ec MMTB - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 5000000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 5000000, '2026-08-11 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_097', 'CT-2026-SIM097', 'Chuyến công tác Hoàn Thiện Đế - Họp đánh giá chỉ số OEE', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP',
            'Phan Tuấn Thảo', 'Văn Phòng Chuỗi SKECHERS', 'DEPT_97',
            'Tổ Hợp Đế Giày TTPP (Tân Uyên)', '2026-08-04', '2026-08-04',
            1, 'Xe cá nhân / Tự túc', 3,
            'Họp đánh giá chỉ số OEE & kiểm tra Gemba Walk hàng tháng', 'Số 103 Đường Nguyễn Huệ, Tổ Hợp Đế Giày TTPP (Tân Uyên)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Hoàn Thiện Đế (Tổ hợp Đế Giày TTPP) từ ngày 04/08/2026 đến ngày 04/08/2026.
Mục đích: Họp đánh giá chỉ số OEE & kiểm tra Gemba Walk hàng tháng.
Số lượng nhân sự tham gia: 3 người.
Phương tiện di chuyển: Xe cá nhân / Tự túc.

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_97_1", "name": "Giay_Di_Duong_CT-2026-SIM097_Signed.pdf", "size": 436545, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-04"}]', '[{"id": "inv_97_1", "title": "H\u00f3a \u0111\u01a1n Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa t\u1ea1i Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "category": "Kh\u00e1ch s\u1ea1n / L\u01b0u tr\u00fa", "amount": 2400000, "invoiceDate": "2026-08-04", "invoiceNumber": "HD-293745", "notes": "\u0110\u00e3 thanh to\u00e1n chuy\u1ec3n kho\u1ea3n, \u0111\u00ednh k\u00e8m h\u00f3a \u0111\u01a1n \u0111i\u1ec7n t\u1eed GTGT", "fileName": "HoaDon_KhachSan_CT-2026-SIM097.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-04"}, {"id": "inv_97_2", "title": "H\u00f3a \u0111\u01a1n V\u00e9 m\u00e1y bay / Ph\u01b0\u01a1ng ti\u1ec7n di chuy\u1ec3n", "category": "V\u00e9 m\u00e1y bay / T\u00e0u xe", "amount": 1450000, "invoiceDate": "2026-08-04", "invoiceNumber": "HD-499950", "notes": "V\u00e9 kh\u1ee9 h\u1ed3i c\u00f4ng t\u00e1c", "fileName": "VeMayBay_CT-2026-SIM097.pdf", "fileType": "application/pdf", "fileUrl": "/images/sample-invoice-stub.png", "createdAt": "2026-08-04"}]',
            '[{"id": "p_97_0", "fullName": "Phan Tu\u1ea5n Th\u1ea3o", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202648537", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0917495417", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_97_1", "fullName": "H\u1ed3 Anh H\u00e0", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202628221", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0973321373", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}, {"id": "p_97_2", "fullName": "Ng\u00f4 Kh\u00e1nh Khai", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202673374", "department": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS", "phone": "0910332449", "pickupLocation": "V\u0103n Ph\u00f2ng Chu\u1ed7i SKECHERS - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 1500000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 1500000, '2026-08-04 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_098', 'CT-2026-SIM098', 'Chuyến công tác Nhà Máy Miền Đông - Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ',
            'Trần Minh Thảo', 'Hoàn Thiện Đế', 'DEPT_98',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-08-24', '2026-08-26',
            3, 'Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)', 2,
            'Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU', 'Số 14 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Phụ) từ ngày 24/08/2026 đến ngày 26/08/2026.
Mục đích: Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Kia Carnival 7 chỗ - 61A-999.88).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_98_1", "name": "Giay_Di_Duong_CT-2026-SIM098_Signed.pdf", "size": 222307, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-24"}]', '[]',
            '[{"id": "p_98_0", "fullName": "Tr\u1ea7n Minh Th\u1ea3o", "position": "Gi\u00e1m S\u00e1t Chuy\u1ec1n May", "employeeId": "202613885", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0949723601", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}, {"id": "p_98_1", "fullName": "Ph\u1ea1m Anh Linh", "position": "K\u1ebf To\u00e1n Vi\u00ean Chi Ph\u00ed", "employeeId": "202688799", "department": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf", "phone": "0953137472", "pickupLocation": "Ho\u00e0n Thi\u1ec7n \u0110\u1ebf - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 4200000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 4200000, '2026-08-24 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_099', 'CT-2026-SIM099', 'Chuyến công tác Nhà Máy Miền Đông - Kiểm tra hệ thống PPH, PCCC', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ',
            'Phạm Văn Trinh', 'Kiên Giang 3', 'DEPT_99',
            'Cụm Nhà Máy Miền Đông (Đồng Nai)', '2026-08-17', '2026-08-18',
            2, 'Xe công ty (Ford Transit 16 chỗ - 61B-678.90)', 2,
            'Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ', 'Số 36 Đường Nguyễn Huệ, Cụm Nhà Máy Miền Đông (Đồng Nai)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Nhà Máy Miền Đông (Nhà máy Miền Đông - Phụ) từ ngày 17/08/2026 đến ngày 18/08/2026.
Mục đích: Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ.
Số lượng nhân sự tham gia: 2 người.
Phương tiện di chuyển: Xe công ty (Ford Transit 16 chỗ - 61B-678.90).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_99_1", "name": "Giay_Di_Duong_CT-2026-SIM099_Signed.pdf", "size": 259934, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-08-17"}]', '[]',
            '[{"id": "p_99_0", "fullName": "Ph\u1ea1m V\u0103n Trinh", "position": "K\u1ef9 S\u01b0 R&D M\u1eabu Gi\u00e0y", "employeeId": "202647755", "department": "Ki\u00ean Giang 3", "phone": "0934995420", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}, {"id": "p_99_1", "fullName": "Phan H\u1eefu Linh", "position": "Ph\u00f3 Ph\u00f2ng Qu\u1ea3n L\u00fd S\u1ea3n Xu\u1ea5t", "employeeId": "202661974", "department": "Ki\u00ean Giang 3", "phone": "0939375962", "pickupLocation": "Ki\u00ean Giang 3 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 6800000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 6800000, '2026-08-17 00:00:00'
        );
INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            'sim_trip_100_100', 'CT-2026-SIM100', 'Chuyến công tác Kiên Giang 1 - Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô',
            'Phan Bảo Phong', 'Kiên Giang 2', 'DEPT_100',
            'Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', '2026-09-08', '2026-09-11',
            4, 'Vé máy bay (Vietjet Air / Vietnam Airlines)', 1,
            'Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế', 'Số 135 Đường Nguyễn Huệ, Khu Công Nghiệp Thạnh Lộc (Kiên Giang)', 'Kính gửi Ban Giám Đốc và Trưởng bộ phận,

Tôi xin đề xuất chuyến công tác thực tế tại Kiên Giang 1 (Nhà máy NK1A - Phụ lô) từ ngày 08/09/2026 đến ngày 11/09/2026.
Mục đích: Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế.
Số lượng nhân sự tham gia: 1 người.
Phương tiện di chuyển: Vé máy bay (Vietjet Air / Vietnam Airlines).

Rất mong nhận được sự phê duyệt của Quý Lãnh Đạo.
Trân trọng!',
            '[{"id": "att_100_1", "name": "Giay_Di_Duong_CT-2026-SIM100_Signed.pdf", "size": 387697, "type": "application/pdf", "dataUrl": "/images/sample-pdf-stub.png", "createdAt": "2026-09-08"}]', '[]',
            '[{"id": "p_100_0", "fullName": "Phan B\u1ea3o Phong", "position": "C\u00e1n B\u1ed9 H\u00e0nh Ch\u00ednh", "employeeId": "202623390", "department": "Ki\u00ean Giang 2", "phone": "0991353762", "pickupLocation": "Ki\u00ean Giang 2 - C\u1ed5ng ch\u00ednh"}]', 'APPROVED', 5000000,
            1, 'L2',
            NULL,
            NULL,
            'budget_approved', 5000000, '2026-09-08 00:00:00'
        );