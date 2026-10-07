-- Mô phỏng 100 User V2 (Multi-destination & Lễ Tân Logistics)
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_1', 'CT-2026-SIMV2-001', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính', 'Nhân Viên 1', 'Ban Điều Hành',
        'VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính', '12/11/2026', '14/11/2026', 3, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_1", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "12/11/2026", "endDate": "12/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-12", "checkOutDate": "2026-11-13", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_1", "fullName": "Nhân Viên 1", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_2', 'CT-2026-SIMV2-002', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính', 'Nhân Viên 2', 'R&D',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính', '14/11/2026', '15/11/2026', 2, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 4500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_2", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "14/11/2026", "endDate": "14/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-14", "checkOutDate": "2026-11-15", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_2", "dorm_room_no": "P.201"}]}', 'ARRANGED', '[{"id": "inv_2", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-11-15", "invoiceNumber": "HD44074"}]', '[{"id": "p1_2", "fullName": "Nhân Viên 2", "department": "R&D"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_3', 'CT-2026-SIMV2-003', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 3', 'Ban Điều Hành',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '02/09/2026', '03/09/2026', 2, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_3", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "02/09/2026", "endDate": "02/09/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-09-02", "checkOutDate": "2026-09-03", "accommodationNote": ""}, {"id": "dest_1_3", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "03/09/2026", "endDate": "03/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-03", "checkOutDate": "2026-09-04", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_1_3", "hotel_name": "Khách sạn Rạch Giá", "cost": 650000}]}', 'ARRANGED', '[]', '[{"id": "p1_3", "fullName": "Nhân Viên 3", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_4', 'CT-2026-SIMV2-004', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính', 'Nhân Viên 4', 'Công Nghệ Thông Tin',
        'VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính', '17/11/2026', '19/11/2026', 3, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_4", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "17/11/2026", "endDate": "17/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-17", "checkOutDate": "2026-11-18", "accommodationNote": ""}, {"id": "dest_1_4", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "18/11/2026", "endDate": "18/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-18", "checkOutDate": "2026-11-19", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_4", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "19/11/2026", "endDate": "19/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-19", "checkOutDate": "2026-11-20", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_4", "fullName": "Nhân Viên 4", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_5', 'CT-2026-SIMV2-005', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 5', 'Đột Dập',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '06/09/2026', '06/09/2026', 1, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_5", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "06/09/2026", "endDate": "06/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-06", "checkOutDate": "2026-09-07", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_5", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "07/09/2026", "endDate": "07/09/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-09-07", "checkOutDate": "2026-09-08", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_5", "fullName": "Nhân Viên 5", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_6', 'CT-2026-SIMV2-006', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế', 'Nhân Viên 6', 'Đột Dập',
        'Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế', '30/09/2026', '01/10/2026', 2, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_6", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "30/09/2026", "endDate": "30/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-30", "checkOutDate": "2026-10-01", "accommodationNote": ""}, {"id": "dest_1_6", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "01/10/2026", "endDate": "01/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-01", "checkOutDate": "2026-10-02", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_6", "fullName": "Nhân Viên 6", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_7', 'CT-2026-SIMV2-007', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ', 'Nhân Viên 7', 'Đột Dập',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ', '17/09/2026', '20/09/2026', 4, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_7", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "17/09/2026", "endDate": "17/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-17", "checkOutDate": "2026-09-18", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_7", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "18/09/2026", "endDate": "18/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-18", "checkOutDate": "2026-09-19", "accommodationNote": ""}, {"id": "dest_2_7", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "19/09/2026", "endDate": "19/09/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-09-19", "checkOutDate": "2026-09-20", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_7", "fullName": "Nhân Viên 7", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_8', 'CT-2026-SIMV2-008', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 8', 'Nhân Sự',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '15/11/2026', '15/11/2026', 1, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_8", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "15/11/2026", "endDate": "15/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-15", "checkOutDate": "2026-11-16", "accommodationNote": ""}, {"id": "dest_1_8", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "16/11/2026", "endDate": "16/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-16", "checkOutDate": "2026-11-17", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'PENDING', '[{"id": "inv_8", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-11-15", "invoiceNumber": "HD14812"}]', '[{"id": "p1_8", "fullName": "Nhân Viên 8", "department": "Nhân Sự"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_9', 'CT-2026-SIMV2-009', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 9', 'Hành Chính',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '29/11/2026', '30/11/2026', 2, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_9", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "29/11/2026", "endDate": "29/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-29", "checkOutDate": "2026-11-30", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_9", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "30/11/2026", "endDate": "30/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-30", "checkOutDate": "2026-12-01", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_9", "fullName": "Nhân Viên 9", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_10', 'CT-2026-SIMV2-010', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 10', 'Kế Toán',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '17/10/2026', '18/10/2026', 2, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 2000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_10", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "17/10/2026", "endDate": "17/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-17", "checkOutDate": "2026-10-18", "accommodationNote": ""}, {"id": "dest_1_10", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "18/10/2026", "endDate": "18/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-18", "checkOutDate": "2026-10-19", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_10", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "19/10/2026", "endDate": "19/10/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-10-19", "checkOutDate": "2026-10-20", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_10", "fullName": "Nhân Viên 10", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_11', 'CT-2026-SIMV2-011', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 11', 'Nhân Sự',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '23/09/2026', '23/09/2026', 1, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_11", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "23/09/2026", "endDate": "23/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-23", "checkOutDate": "2026-09-24", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_11", "dorm_room_no": "P.186"}]}', 'ARRANGED', '[{"id": "inv_11", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-09-23", "invoiceNumber": "HD57227"}]', '[{"id": "p1_11", "fullName": "Nhân Viên 11", "department": "Nhân Sự"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_12', 'CT-2026-SIMV2-012', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính', 'Nhân Viên 12', 'R&D',
        'VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính', '20/09/2026', '22/09/2026', 3, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_12", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "20/09/2026", "endDate": "20/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-20", "checkOutDate": "2026-09-21", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_12", "fullName": "Nhân Viên 12", "department": "R&D"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_13', 'CT-2026-SIMV2-013', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 13', 'QA/QC',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '23/10/2026', '24/10/2026', 2, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 5000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_13", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "23/10/2026", "endDate": "23/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-23", "checkOutDate": "2026-10-24", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_13", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "24/10/2026", "endDate": "24/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-24", "checkOutDate": "2026-10-25", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_13", "fullName": "Nhân Viên 13", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_14', 'CT-2026-SIMV2-014', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 14', 'Đột Dập',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '08/10/2026', '09/10/2026', 2, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_14", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "08/10/2026", "endDate": "08/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-08", "checkOutDate": "2026-10-09", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_14", "fullName": "Nhân Viên 14", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_15', 'CT-2026-SIMV2-015', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 15', 'Kế Toán',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '28/10/2026', '28/10/2026', 1, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_15", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "28/10/2026", "endDate": "28/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-28", "checkOutDate": "2026-10-29", "accommodationNote": ""}]', '{}', 'PENDING', '[]', '[{"id": "p1_15", "fullName": "Nhân Viên 15", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_16', 'CT-2026-SIMV2-016', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính', 'Nhân Viên 16', 'Đột Dập',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính', '17/09/2026', '17/09/2026', 1, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_16", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "17/09/2026", "endDate": "17/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-17", "checkOutDate": "2026-09-18", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_16", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "18/09/2026", "endDate": "18/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-18", "checkOutDate": "2026-09-19", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_16", "fullName": "Nhân Viên 16", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_17', 'CT-2026-SIMV2-017', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế', 'Nhân Viên 17', 'R&D',
        'Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế', '16/11/2026', '18/11/2026', 3, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_17", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "16/11/2026", "endDate": "16/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-16", "checkOutDate": "2026-11-17", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_17", "fullName": "Nhân Viên 17", "department": "R&D"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_18', 'CT-2026-SIMV2-018', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ', 'Nhân Viên 18', 'QA/QC',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ', '10/11/2026', '10/11/2026', 1, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_18", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "10/11/2026", "endDate": "10/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-10", "checkOutDate": "2026-11-11", "accommodationNote": ""}]', '{}', 'PENDING', '[{"id": "inv_18", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-11-10", "invoiceNumber": "HD91739"}]', '[{"id": "p1_18", "fullName": "Nhân Viên 18", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_19', 'CT-2026-SIMV2-019', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1', 'Nhân Viên 19', 'Ban Điều Hành',
        'Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1', '10/09/2026', '10/09/2026', 1, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_19", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "10/09/2026", "endDate": "10/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-10", "checkOutDate": "2026-09-11", "accommodationNote": ""}, {"id": "dest_1_19", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "11/09/2026", "endDate": "11/09/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-09-11", "checkOutDate": "2026-09-12", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_19", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "12/09/2026", "endDate": "12/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-12", "checkOutDate": "2026-09-13", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'PENDING', '[]', '[{"id": "p1_19", "fullName": "Nhân Viên 19", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_20', 'CT-2026-SIMV2-020', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 20', 'Đột Dập',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '29/09/2026', '01/10/2026', 3, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_20", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "29/09/2026", "endDate": "29/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-29", "checkOutDate": "2026-09-30", "accommodationNote": ""}, {"id": "dest_1_20", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "30/09/2026", "endDate": "30/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-30", "checkOutDate": "2026-10-01", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'PENDING', '[{"id": "inv_20", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-10-01", "invoiceNumber": "HD54702"}]', '[{"id": "p1_20", "fullName": "Nhân Viên 20", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_21', 'CT-2026-SIMV2-021', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ', 'Nhân Viên 21', 'Kế Toán',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ', '13/10/2026', '16/10/2026', 4, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 4500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_21", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "13/10/2026", "endDate": "13/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-13", "checkOutDate": "2026-10-14", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_21", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "14/10/2026", "endDate": "14/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-14", "checkOutDate": "2026-10-15", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_21", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "15/10/2026", "endDate": "15/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-15", "checkOutDate": "2026-10-16", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_21", "fullName": "Nhân Viên 21", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_22', 'CT-2026-SIMV2-022', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 22', 'R&D',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '20/09/2026', '22/09/2026', 3, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_22", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "20/09/2026", "endDate": "20/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-20", "checkOutDate": "2026-09-21", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_22", "fullName": "Nhân Viên 22", "department": "R&D"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_23', 'CT-2026-SIMV2-023', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 23', 'Kế Toán',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '06/09/2026', '08/09/2026', 3, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_23", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "06/09/2026", "endDate": "06/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-06", "checkOutDate": "2026-09-07", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_23", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "07/09/2026", "endDate": "07/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-07", "checkOutDate": "2026-09-08", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_23", "fullName": "Nhân Viên 23", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_24', 'CT-2026-SIMV2-024', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 24', 'Công Nghệ Thông Tin',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '06/10/2026', '07/10/2026', 2, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_24", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "06/10/2026", "endDate": "06/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-06", "checkOutDate": "2026-10-07", "accommodationNote": ""}, {"id": "dest_1_24", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "07/10/2026", "endDate": "07/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-07", "checkOutDate": "2026-10-08", "accommodationNote": "Cần phòng yên tĩnh"}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_24", "dorm_room_no": "P.268"}, {"dest_id": "dest_1_24", "hotel_name": "Khách sạn Rạch Giá", "cost": 650000}]}', 'ARRANGED', '[]', '[{"id": "p1_24", "fullName": "Nhân Viên 24", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_25', 'CT-2026-SIMV2-025', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1', 'Nhân Viên 25', 'Hành Chính',
        'Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1', '10/11/2026', '11/11/2026', 2, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_25", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "10/11/2026", "endDate": "10/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-10", "checkOutDate": "2026-11-11", "accommodationNote": ""}, {"id": "dest_1_25", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "11/11/2026", "endDate": "11/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-11", "checkOutDate": "2026-11-12", "accommodationNote": "Cần phòng yên tĩnh"}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_25", "dorm_room_no": "P.150"}, {"dest_id": "dest_1_25", "dorm_room_no": "P.295"}]}', 'ARRANGED', '[{"id": "inv_25", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-11-11", "invoiceNumber": "HD90148"}]', '[{"id": "p1_25", "fullName": "Nhân Viên 25", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_26', 'CT-2026-SIMV2-026', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ', 'Nhân Viên 26', 'R&D',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ', '03/10/2026', '03/10/2026', 1, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_26", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "03/10/2026", "endDate": "03/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-03", "checkOutDate": "2026-10-04", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_26", "fullName": "Nhân Viên 26", "department": "R&D"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_27', 'CT-2026-SIMV2-027', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính', 'Nhân Viên 27', 'Hành Chính',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính', '05/11/2026', '06/11/2026', 2, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_27", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "05/11/2026", "endDate": "05/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-05", "checkOutDate": "2026-11-06", "accommodationNote": ""}, {"id": "dest_1_27", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "06/11/2026", "endDate": "06/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-06", "checkOutDate": "2026-11-07", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_27", "fullName": "Nhân Viên 27", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_28', 'CT-2026-SIMV2-028', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 28', 'Ban Điều Hành',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '21/11/2026', '21/11/2026', 1, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 4500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_28", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "21/11/2026", "endDate": "21/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-21", "checkOutDate": "2026-11-22", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_28", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "22/11/2026", "endDate": "22/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-22", "checkOutDate": "2026-11-23", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_28", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "23/11/2026", "endDate": "23/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-23", "checkOutDate": "2026-11-24", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_28", "fullName": "Nhân Viên 28", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_29', 'CT-2026-SIMV2-029', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 29', 'Ban Điều Hành',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '04/10/2026', '04/10/2026', 1, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_29", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "04/10/2026", "endDate": "04/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-04", "checkOutDate": "2026-10-05", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_29", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "05/10/2026", "endDate": "05/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-05", "checkOutDate": "2026-10-06", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_29", "fullName": "Nhân Viên 29", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_30', 'CT-2026-SIMV2-030', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 30', 'Ban Điều Hành',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '07/10/2026', '09/10/2026', 3, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_30", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "07/10/2026", "endDate": "07/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-07", "checkOutDate": "2026-10-08", "accommodationNote": ""}, {"id": "dest_1_30", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "08/10/2026", "endDate": "08/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-08", "checkOutDate": "2026-10-09", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_30", "fullName": "Nhân Viên 30", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_31', 'CT-2026-SIMV2-031', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 31', 'R&D',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '25/10/2026', '25/10/2026', 1, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_31", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "25/10/2026", "endDate": "25/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-25", "checkOutDate": "2026-10-26", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_31", "fullName": "Nhân Viên 31", "department": "R&D"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_32', 'CT-2026-SIMV2-032', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế', 'Nhân Viên 32', 'Công Nghệ Thông Tin',
        'Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế', '24/11/2026', '24/11/2026', 1, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 2000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_32", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "24/11/2026", "endDate": "24/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-24", "checkOutDate": "2026-11-25", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_32", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "25/11/2026", "endDate": "25/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-25", "checkOutDate": "2026-11-26", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_32", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "26/11/2026", "endDate": "26/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-26", "checkOutDate": "2026-11-27", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_32", "fullName": "Nhân Viên 32", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_33', 'CT-2026-SIMV2-033', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP', 'Nhân Viên 33', 'Đột Dập',
        'Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP', '27/09/2026', '30/09/2026', 4, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_33", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "27/09/2026", "endDate": "27/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-27", "checkOutDate": "2026-09-28", "accommodationNote": ""}, {"id": "dest_1_33", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "28/09/2026", "endDate": "28/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-28", "checkOutDate": "2026-09-29", "accommodationNote": ""}]', '{}', 'PENDING', '[]', '[{"id": "p1_33", "fullName": "Nhân Viên 33", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_34', 'CT-2026-SIMV2-034', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế', 'Nhân Viên 34', 'Kế Toán',
        'Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế', '31/10/2026', '03/11/2026', 4, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 2500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_34", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "31/10/2026", "endDate": "31/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-31", "checkOutDate": "2026-11-01", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_34", "fullName": "Nhân Viên 34", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_35', 'CT-2026-SIMV2-035', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính', 'Nhân Viên 35', 'Ban Điều Hành',
        'VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính', '27/11/2026', '27/11/2026', 1, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 2000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_35", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "27/11/2026", "endDate": "27/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-27", "checkOutDate": "2026-11-28", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_35", "fullName": "Nhân Viên 35", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_36', 'CT-2026-SIMV2-036', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 36', 'Công Nghệ Thông Tin',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '01/11/2026', '01/11/2026', 1, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 2500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_36", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "01/11/2026", "endDate": "01/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-01", "checkOutDate": "2026-11-02", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_36", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "02/11/2026", "endDate": "02/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-02", "checkOutDate": "2026-11-03", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_36", "fullName": "Nhân Viên 36", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_37', 'CT-2026-SIMV2-037', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 37', 'Đột Dập',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '27/11/2026', '30/11/2026', 4, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_37", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "27/11/2026", "endDate": "27/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-27", "checkOutDate": "2026-11-28", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_37", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "28/11/2026", "endDate": "28/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-28", "checkOutDate": "2026-11-29", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_37", "fullName": "Nhân Viên 37", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_38', 'CT-2026-SIMV2-038', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 38', 'Đột Dập',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '26/10/2026', '28/10/2026', 3, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 5000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_38", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "26/10/2026", "endDate": "26/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-26", "checkOutDate": "2026-10-27", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_38", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "27/10/2026", "endDate": "27/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-27", "checkOutDate": "2026-10-28", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_38", "dorm_room_no": "P.119"}, {"dest_id": "dest_1_38", "dorm_room_no": "P.282"}]}', 'ARRANGED', '[]', '[{"id": "p1_38", "fullName": "Nhân Viên 38", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_39', 'CT-2026-SIMV2-039', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Phòng R&D', 'Nhân Viên 39', 'R&D',
        'VP Chuỗi (R&D) - Phòng R&D', '11/10/2026', '14/10/2026', 4, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_39", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "11/10/2026", "endDate": "11/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-11", "checkOutDate": "2026-10-12", "accommodationNote": ""}, {"id": "dest_1_39", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "12/10/2026", "endDate": "12/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-12", "checkOutDate": "2026-10-13", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_39", "hotel_name": "Khách sạn Rạch Giá", "cost": 650000}, {"dest_id": "dest_1_39", "dorm_room_no": "P.197"}]}', 'ARRANGED', '[]', '[{"id": "p1_39", "fullName": "Nhân Viên 39", "department": "R&D"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_40', 'CT-2026-SIMV2-040', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP', 'Nhân Viên 40', 'QA/QC',
        'Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP', '20/11/2026', '21/11/2026', 2, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_40", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "20/11/2026", "endDate": "20/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-20", "checkOutDate": "2026-11-21", "accommodationNote": ""}, {"id": "dest_1_40", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "21/11/2026", "endDate": "21/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-21", "checkOutDate": "2026-11-22", "accommodationNote": ""}]', '{}', 'PENDING', '[]', '[{"id": "p1_40", "fullName": "Nhân Viên 40", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_41', 'CT-2026-SIMV2-041', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính', 'Nhân Viên 41', 'Đột Dập',
        'VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính', '19/09/2026', '19/09/2026', 1, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_41", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "19/09/2026", "endDate": "19/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-19", "checkOutDate": "2026-09-20", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_41", "fullName": "Nhân Viên 41", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_42', 'CT-2026-SIMV2-042', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính', 'Nhân Viên 42', 'Đột Dập',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính', '15/10/2026', '16/10/2026', 2, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 4500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_42", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "15/10/2026", "endDate": "15/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-15", "checkOutDate": "2026-10-16", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_42", "fullName": "Nhân Viên 42", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_43', 'CT-2026-SIMV2-043', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 43', 'Hành Chính',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '29/09/2026', '01/10/2026', 3, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 5000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_43", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "29/09/2026", "endDate": "29/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-29", "checkOutDate": "2026-09-30", "accommodationNote": ""}, {"id": "dest_1_43", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "30/09/2026", "endDate": "30/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-30", "checkOutDate": "2026-10-01", "accommodationNote": ""}, {"id": "dest_2_43", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "01/10/2026", "endDate": "01/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-01", "checkOutDate": "2026-10-02", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_43", "fullName": "Nhân Viên 43", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_44', 'CT-2026-SIMV2-044', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Phòng R&D', 'Nhân Viên 44', 'Ban Điều Hành',
        'VP Chuỗi (R&D) - Phòng R&D', '10/10/2026', '11/10/2026', 2, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_44", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "10/10/2026", "endDate": "10/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-10", "checkOutDate": "2026-10-11", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_44", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "11/10/2026", "endDate": "11/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-11", "checkOutDate": "2026-10-12", "accommodationNote": ""}, {"id": "dest_2_44", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "12/10/2026", "endDate": "12/10/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-10-12", "checkOutDate": "2026-10-13", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_44", "fullName": "Nhân Viên 44", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_45', 'CT-2026-SIMV2-045', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP', 'Nhân Viên 45', 'Kế Toán',
        'Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP', '02/10/2026', '03/10/2026', 2, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_45", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "02/10/2026", "endDate": "02/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-02", "checkOutDate": "2026-10-03", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_45", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "03/10/2026", "endDate": "03/10/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-10-03", "checkOutDate": "2026-10-04", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_45", "fullName": "Nhân Viên 45", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_46', 'CT-2026-SIMV2-046', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 46', 'Đột Dập',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '22/10/2026', '23/10/2026', 2, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_46", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "22/10/2026", "endDate": "22/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-22", "checkOutDate": "2026-10-23", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_46", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "23/10/2026", "endDate": "23/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-23", "checkOutDate": "2026-10-24", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_46", "fullName": "Nhân Viên 46", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_47', 'CT-2026-SIMV2-047', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1', 'Nhân Viên 47', 'Đột Dập',
        'Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1', '05/09/2026', '05/09/2026', 1, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_47", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "05/09/2026", "endDate": "05/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-05", "checkOutDate": "2026-09-06", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_47", "fullName": "Nhân Viên 47", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_48', 'CT-2026-SIMV2-048', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 48', 'Hành Chính',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '29/11/2026', '29/11/2026', 1, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_48", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "29/11/2026", "endDate": "29/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-29", "checkOutDate": "2026-11-30", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_48", "fullName": "Nhân Viên 48", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_49', 'CT-2026-SIMV2-049', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính', 'Nhân Viên 49', 'Công Nghệ Thông Tin',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính', '20/10/2026', '20/10/2026', 1, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_49", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "20/10/2026", "endDate": "20/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-20", "checkOutDate": "2026-10-21", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'PENDING', '[]', '[{"id": "p1_49", "fullName": "Nhân Viên 49", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_50', 'CT-2026-SIMV2-050', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1', 'Nhân Viên 50', 'Kế Toán',
        'Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1', '29/11/2026', '02/12/2026', 4, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_50", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "29/11/2026", "endDate": "29/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-29", "checkOutDate": "2026-11-30", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_50", "fullName": "Nhân Viên 50", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_51', 'CT-2026-SIMV2-051', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 51', 'R&D',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '30/11/2026', '01/12/2026', 2, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 5000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_51", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "30/11/2026", "endDate": "30/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-30", "checkOutDate": "2026-12-01", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_51", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "01/12/2026", "endDate": "01/12/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-12-01", "checkOutDate": "2026-12-02", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_51", "dorm_room_no": "P.278"}, {"dest_id": "dest_1_51", "hotel_name": "Khách sạn Rạch Giá", "cost": 650000}]}', 'ARRANGED', '[{"id": "inv_51", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-12-01", "invoiceNumber": "HD99870"}]', '[{"id": "p1_51", "fullName": "Nhân Viên 51", "department": "R&D"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_52', 'CT-2026-SIMV2-052', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 52', 'QA/QC',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '14/10/2026', '15/10/2026', 2, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 2000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_52", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "14/10/2026", "endDate": "14/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-14", "checkOutDate": "2026-10-15", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_52", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "15/10/2026", "endDate": "15/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-15", "checkOutDate": "2026-10-16", "accommodationNote": ""}, {"id": "dest_2_52", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "16/10/2026", "endDate": "16/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-16", "checkOutDate": "2026-10-17", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_52", "fullName": "Nhân Viên 52", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_53', 'CT-2026-SIMV2-053', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 53', 'Ban Điều Hành',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '03/11/2026', '03/11/2026', 1, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 2500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_53", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "03/11/2026", "endDate": "03/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-03", "checkOutDate": "2026-11-04", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_53", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "04/11/2026", "endDate": "04/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-04", "checkOutDate": "2026-11-05", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'PENDING', '[]', '[{"id": "p1_53", "fullName": "Nhân Viên 53", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_54', 'CT-2026-SIMV2-054', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ', 'Nhân Viên 54', 'Công Nghệ Thông Tin',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ', '16/09/2026', '19/09/2026', 4, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_54", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "16/09/2026", "endDate": "16/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-16", "checkOutDate": "2026-09-17", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_54", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "17/09/2026", "endDate": "17/09/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-09-17", "checkOutDate": "2026-09-18", "accommodationNote": ""}]', '{}', 'PENDING', '[{"id": "inv_54", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-09-19", "invoiceNumber": "HD39439"}]', '[{"id": "p1_54", "fullName": "Nhân Viên 54", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_55', 'CT-2026-SIMV2-055', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính', 'Nhân Viên 55', 'Hành Chính',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính', '18/11/2026', '18/11/2026', 1, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_55", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "18/11/2026", "endDate": "18/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-18", "checkOutDate": "2026-11-19", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_55", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "19/11/2026", "endDate": "19/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-19", "checkOutDate": "2026-11-20", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_55", "fullName": "Nhân Viên 55", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_56', 'CT-2026-SIMV2-056', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 56', 'R&D',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '15/10/2026', '15/10/2026', 1, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 4500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_56", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "15/10/2026", "endDate": "15/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-15", "checkOutDate": "2026-10-16", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_56", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "16/10/2026", "endDate": "16/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-16", "checkOutDate": "2026-10-17", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_56", "fullName": "Nhân Viên 56", "department": "R&D"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_57', 'CT-2026-SIMV2-057', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 57', 'Kế Toán',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '10/10/2026', '10/10/2026', 1, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_57", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "10/10/2026", "endDate": "10/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-10", "checkOutDate": "2026-10-11", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_57", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "11/10/2026", "endDate": "11/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-11", "checkOutDate": "2026-10-12", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_57", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "12/10/2026", "endDate": "12/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-12", "checkOutDate": "2026-10-13", "accommodationNote": "Cần phòng yên tĩnh"}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_57", "dorm_room_no": "P.257"}, {"dest_id": "dest_1_57", "dorm_room_no": "P.205"}, {"dest_id": "dest_2_57", "dorm_room_no": "P.303"}]}', 'ARRANGED', '[]', '[{"id": "p1_57", "fullName": "Nhân Viên 57", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_58', 'CT-2026-SIMV2-058', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 58', 'Nhân Sự',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '08/11/2026', '11/11/2026', 4, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_58", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "08/11/2026", "endDate": "08/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-08", "checkOutDate": "2026-11-09", "accommodationNote": ""}, {"id": "dest_1_58", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "09/11/2026", "endDate": "09/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-09", "checkOutDate": "2026-11-10", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_58", "fullName": "Nhân Viên 58", "department": "Nhân Sự"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_59', 'CT-2026-SIMV2-059', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 59', 'QA/QC',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '30/09/2026', '30/09/2026', 1, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_59", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "30/09/2026", "endDate": "30/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-30", "checkOutDate": "2026-10-01", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_59", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "01/10/2026", "endDate": "01/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-01", "checkOutDate": "2026-10-02", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_59", "fullName": "Nhân Viên 59", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_60', 'CT-2026-SIMV2-060', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 60', 'Nhân Sự',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '22/10/2026', '22/10/2026', 1, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_60", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "22/10/2026", "endDate": "22/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-22", "checkOutDate": "2026-10-23", "accommodationNote": ""}, {"id": "dest_1_60", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "23/10/2026", "endDate": "23/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-23", "checkOutDate": "2026-10-24", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_60", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "24/10/2026", "endDate": "24/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-24", "checkOutDate": "2026-10-25", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_60", "fullName": "Nhân Viên 60", "department": "Nhân Sự"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_61', 'CT-2026-SIMV2-061', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 61', 'Hành Chính',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '07/11/2026', '07/11/2026', 1, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_61", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "07/11/2026", "endDate": "07/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-07", "checkOutDate": "2026-11-08", "accommodationNote": ""}]', '{}', 'PENDING', '[{"id": "inv_61", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-11-07", "invoiceNumber": "HD67036"}]', '[{"id": "p1_61", "fullName": "Nhân Viên 61", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_62', 'CT-2026-SIMV2-062', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 62', 'Nhân Sự',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '13/11/2026', '14/11/2026', 2, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 4500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_62", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "13/11/2026", "endDate": "13/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-13", "checkOutDate": "2026-11-14", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_62", "fullName": "Nhân Viên 62", "department": "Nhân Sự"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_63', 'CT-2026-SIMV2-063', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 63', 'Ban Điều Hành',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '23/10/2026', '24/10/2026', 2, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 3500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_63", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "23/10/2026", "endDate": "23/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-23", "checkOutDate": "2026-10-24", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_63", "dorm_room_no": "P.292"}]}', 'ARRANGED', '[{"id": "inv_63", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-10-24", "invoiceNumber": "HD82700"}]', '[{"id": "p1_63", "fullName": "Nhân Viên 63", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_64', 'CT-2026-SIMV2-064', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 64', 'Ban Điều Hành',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '03/10/2026', '06/10/2026', 4, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_64", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "03/10/2026", "endDate": "03/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-03", "checkOutDate": "2026-10-04", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_64", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "04/10/2026", "endDate": "04/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-04", "checkOutDate": "2026-10-05", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_64", "dorm_room_no": "P.186"}, {"dest_id": "dest_1_64", "dorm_room_no": "P.235"}]}', 'ARRANGED', '[]', '[{"id": "p1_64", "fullName": "Nhân Viên 64", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_65', 'CT-2026-SIMV2-065', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1', 'Nhân Viên 65', 'QA/QC',
        'Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1', '25/11/2026', '28/11/2026', 4, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 3500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_65", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "25/11/2026", "endDate": "25/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-25", "checkOutDate": "2026-11-26", "accommodationNote": "Cần phòng yên tĩnh"}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": []}', 'ARRANGED', '[{"id": "inv_65", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-11-28", "invoiceNumber": "HD94928"}]', '[{"id": "p1_65", "fullName": "Nhân Viên 65", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_66', 'CT-2026-SIMV2-066', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1', 'Nhân Viên 66', 'Ban Điều Hành',
        'Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1', '05/09/2026', '06/09/2026', 2, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 2500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_66", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "05/09/2026", "endDate": "05/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-05", "checkOutDate": "2026-09-06", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_66", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "06/09/2026", "endDate": "06/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-06", "checkOutDate": "2026-09-07", "accommodationNote": ""}, {"id": "dest_2_66", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "07/09/2026", "endDate": "07/09/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-09-07", "checkOutDate": "2026-09-08", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_66", "dorm_room_no": "P.111"}, {"dest_id": "dest_1_66", "hotel_name": "Khách sạn Rạch Giá", "cost": 650000}]}', 'ARRANGED', '[]', '[{"id": "p1_66", "fullName": "Nhân Viên 66", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_67', 'CT-2026-SIMV2-067', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 67', 'Ban Điều Hành',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '16/11/2026', '18/11/2026', 3, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 2500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_67", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "16/11/2026", "endDate": "16/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-16", "checkOutDate": "2026-11-17", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_67", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "17/11/2026", "endDate": "17/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-17", "checkOutDate": "2026-11-18", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_67", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "18/11/2026", "endDate": "18/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-18", "checkOutDate": "2026-11-19", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'PENDING', '[]', '[{"id": "p1_67", "fullName": "Nhân Viên 67", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_68', 'CT-2026-SIMV2-068', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP', 'Nhân Viên 68', 'Hành Chính',
        'Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP', '17/10/2026', '20/10/2026', 4, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_68", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "17/10/2026", "endDate": "17/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-17", "checkOutDate": "2026-10-18", "accommodationNote": ""}, {"id": "dest_1_68", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "18/10/2026", "endDate": "18/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-18", "checkOutDate": "2026-10-19", "accommodationNote": ""}, {"id": "dest_2_68", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "19/10/2026", "endDate": "19/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-19", "checkOutDate": "2026-10-20", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_68", "fullName": "Nhân Viên 68", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_69', 'CT-2026-SIMV2-069', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 69', 'Đột Dập',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '09/09/2026', '09/09/2026', 1, 'Phương tiện cá nhân', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 2000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_69", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "09/09/2026", "endDate": "09/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-09", "checkOutDate": "2026-09-10", "accommodationNote": ""}, {"id": "dest_1_69", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "10/09/2026", "endDate": "10/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-10", "checkOutDate": "2026-09-11", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'PENDING', '[{"id": "inv_69", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-09-09", "invoiceNumber": "HD56869"}]', '[{"id": "p1_69", "fullName": "Nhân Viên 69", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_70', 'CT-2026-SIMV2-070', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 70', 'Công Nghệ Thông Tin',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '30/11/2026', '30/11/2026', 1, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_70", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "30/11/2026", "endDate": "30/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-30", "checkOutDate": "2026-12-01", "accommodationNote": ""}, {"id": "dest_1_70", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "01/12/2026", "endDate": "01/12/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-12-01", "checkOutDate": "2026-12-02", "accommodationNote": ""}, {"id": "dest_2_70", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "02/12/2026", "endDate": "02/12/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-12-02", "checkOutDate": "2026-12-03", "accommodationNote": "Cần phòng yên tĩnh"}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_70", "dorm_room_no": "P.300"}, {"dest_id": "dest_1_70", "hotel_name": "Khách sạn Rạch Giá", "cost": 650000}, {"dest_id": "dest_2_70", "hotel_name": "Khách sạn Rạch Giá", "cost": 650000}]}', 'ARRANGED', '[{"id": "inv_70", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-11-30", "invoiceNumber": "HD79851"}]', '[{"id": "p1_70", "fullName": "Nhân Viên 70", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_71', 'CT-2026-SIMV2-071', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 71', 'Hành Chính',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '02/10/2026', '05/10/2026', 4, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_71", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "02/10/2026", "endDate": "02/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-02", "checkOutDate": "2026-10-03", "accommodationNote": ""}, {"id": "dest_1_71", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "03/10/2026", "endDate": "03/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-03", "checkOutDate": "2026-10-04", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_71", "fullName": "Nhân Viên 71", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_72', 'CT-2026-SIMV2-072', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 72', 'Ban Điều Hành',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '28/10/2026', '30/10/2026', 3, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_72", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "28/10/2026", "endDate": "28/10/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-10-28", "checkOutDate": "2026-10-29", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_72", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "29/10/2026", "endDate": "29/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-29", "checkOutDate": "2026-10-30", "accommodationNote": ""}]', '{}', 'PENDING', '[]', '[{"id": "p1_72", "fullName": "Nhân Viên 72", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_73', 'CT-2026-SIMV2-073', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP', 'Nhân Viên 73', 'Công Nghệ Thông Tin',
        'Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP', '30/11/2026', '03/12/2026', 4, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 4500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_73", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "30/11/2026", "endDate": "30/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-30", "checkOutDate": "2026-12-01", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_73", "fullName": "Nhân Viên 73", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_74', 'CT-2026-SIMV2-074', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 74', 'Hành Chính',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '20/11/2026', '20/11/2026', 1, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_74", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "20/11/2026", "endDate": "20/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-20", "checkOutDate": "2026-11-21", "accommodationNote": ""}, {"id": "dest_1_74", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "21/11/2026", "endDate": "21/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-21", "checkOutDate": "2026-11-22", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_74", "fullName": "Nhân Viên 74", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_75', 'CT-2026-SIMV2-075', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế', 'Nhân Viên 75', 'Hành Chính',
        'Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế', '13/09/2026', '15/09/2026', 3, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_75", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "13/09/2026", "endDate": "13/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-13", "checkOutDate": "2026-09-14", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'PENDING', '[{"id": "inv_75", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-09-15", "invoiceNumber": "HD94535"}]', '[{"id": "p1_75", "fullName": "Nhân Viên 75", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_76', 'CT-2026-SIMV2-076', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 76', 'Công Nghệ Thông Tin',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '24/10/2026', '25/10/2026', 2, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 4500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_76", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "24/10/2026", "endDate": "24/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-24", "checkOutDate": "2026-10-25", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_76", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "25/10/2026", "endDate": "25/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-25", "checkOutDate": "2026-10-26", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_76", "fullName": "Nhân Viên 76", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_77', 'CT-2026-SIMV2-077', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 77', 'Kế Toán',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '21/11/2026', '21/11/2026', 1, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_77", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "21/11/2026", "endDate": "21/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-21", "checkOutDate": "2026-11-22", "accommodationNote": ""}, {"id": "dest_1_77", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "22/11/2026", "endDate": "22/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-22", "checkOutDate": "2026-11-23", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_77", "dorm_room_no": "P.180"}, {"dest_id": "dest_1_77", "hotel_name": "Khách sạn Rạch Giá", "cost": 650000}]}', 'ARRANGED', '[]', '[{"id": "p1_77", "fullName": "Nhân Viên 77", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_78', 'CT-2026-SIMV2-078', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính', 'Nhân Viên 78', 'Đột Dập',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính', '12/11/2026', '13/11/2026', 2, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 3500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_78", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "12/11/2026", "endDate": "12/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-12", "checkOutDate": "2026-11-13", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_78", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "13/11/2026", "endDate": "13/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-13", "checkOutDate": "2026-11-14", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_1_78", "dorm_room_no": "P.305"}]}', 'ARRANGED', '[]', '[{"id": "p1_78", "fullName": "Nhân Viên 78", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_79', 'CT-2026-SIMV2-079', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính', 'Nhân Viên 79', 'Ban Điều Hành',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính', '06/09/2026', '06/09/2026', 1, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_79", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "06/09/2026", "endDate": "06/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-06", "checkOutDate": "2026-09-07", "accommodationNote": ""}, {"id": "dest_1_79", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "07/09/2026", "endDate": "07/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-07", "checkOutDate": "2026-09-08", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_79", "dorm_room_no": "P.250"}, {"dest_id": "dest_1_79", "hotel_name": "Khách sạn Rạch Giá", "cost": 650000}]}', 'ARRANGED', '[]', '[{"id": "p1_79", "fullName": "Nhân Viên 79", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_80', 'CT-2026-SIMV2-080', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP', 'Nhân Viên 80', 'QA/QC',
        'Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP', '11/09/2026', '11/09/2026', 1, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_80", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "11/09/2026", "endDate": "11/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-11", "checkOutDate": "2026-09-12", "accommodationNote": ""}, {"id": "dest_1_80", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "12/09/2026", "endDate": "12/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-12", "checkOutDate": "2026-09-13", "accommodationNote": ""}, {"id": "dest_2_80", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "13/09/2026", "endDate": "13/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-13", "checkOutDate": "2026-09-14", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_80", "fullName": "Nhân Viên 80", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_81', 'CT-2026-SIMV2-081', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính', 'Nhân Viên 81', 'Kế Toán',
        'VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính', '27/09/2026', '28/09/2026', 2, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_81", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "27/09/2026", "endDate": "27/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-27", "checkOutDate": "2026-09-28", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_81", "fullName": "Nhân Viên 81", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_82', 'CT-2026-SIMV2-082', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 82', 'Nhân Sự',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '05/11/2026', '05/11/2026', 1, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_82", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "05/11/2026", "endDate": "05/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-05", "checkOutDate": "2026-11-06", "accommodationNote": ""}, {"id": "dest_1_82", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "06/11/2026", "endDate": "06/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-06", "checkOutDate": "2026-11-07", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_82", "fullName": "Nhân Viên 82", "department": "Nhân Sự"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_83', 'CT-2026-SIMV2-083', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 83', 'Nhân Sự',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '05/09/2026', '06/09/2026', 2, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 3500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_83", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "05/09/2026", "endDate": "05/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-05", "checkOutDate": "2026-09-06", "accommodationNote": ""}, {"id": "dest_1_83", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "06/09/2026", "endDate": "06/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-06", "checkOutDate": "2026-09-07", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'PENDING', '[]', '[{"id": "p1_83", "fullName": "Nhân Viên 83", "department": "Nhân Sự"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_84', 'CT-2026-SIMV2-084', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 - Kiên Giang 2', 'Nhân Viên 84', 'Đột Dập',
        'Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2', '05/10/2026', '08/10/2026', 4, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_84", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "05/10/2026", "endDate": "05/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-05", "checkOutDate": "2026-10-06", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_84", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 - Kiên Giang 2", "location": "Kiên Giang 2 - Nhà máy NK2 - Kiên Giang 2", "startDate": "06/10/2026", "endDate": "06/10/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-10-06", "checkOutDate": "2026-10-07", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_84", "fullName": "Nhân Viên 84", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_85', 'CT-2026-SIMV2-085', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Phụ', 'Nhân Viên 85', 'Đột Dập',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ', '09/10/2026', '11/10/2026', 3, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 2000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_85", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "09/10/2026", "endDate": "09/10/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-10-09", "checkOutDate": "2026-10-10", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_85", "fullName": "Nhân Viên 85", "department": "Đột Dập"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_86', 'CT-2026-SIMV2-086', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 86', 'Kế Toán',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '22/11/2026', '24/11/2026', 3, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_86", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "22/11/2026", "endDate": "22/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-22", "checkOutDate": "2026-11-23", "accommodationNote": ""}, {"id": "dest_1_86", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "23/11/2026", "endDate": "23/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-23", "checkOutDate": "2026-11-24", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_86", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "24/11/2026", "endDate": "24/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-24", "checkOutDate": "2026-11-25", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_86", "fullName": "Nhân Viên 86", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_87', 'CT-2026-SIMV2-087', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính', 'Nhân Viên 87', 'Nhân Sự',
        'VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính', '17/10/2026', '19/10/2026', 3, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'APPROVED', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_87", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "17/10/2026", "endDate": "17/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-17", "checkOutDate": "2026-10-18", "accommodationNote": ""}]', '{}', 'PENDING', '[{"id": "inv_87", "title": "Hóa đơn khách sạn", "category": "Khách sạn / Lưu trú", "amount": 1200000, "invoiceDate": "2026-10-19", "invoiceNumber": "HD83673"}]', '[{"id": "p1_87", "fullName": "Nhân Viên 87", "department": "Nhân Sự"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_88', 'CT-2026-SIMV2-088', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 88', 'Kế Toán',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '30/11/2026', '01/12/2026', 2, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 3500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_88", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "30/11/2026", "endDate": "30/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-30", "checkOutDate": "2026-12-01", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_88", "fullName": "Nhân Viên 88", "department": "Kế Toán"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_89', 'CT-2026-SIMV2-089', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 89', 'QA/QC',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '12/11/2026', '12/11/2026', 1, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 2000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_89", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "12/11/2026", "endDate": "12/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-12", "checkOutDate": "2026-11-13", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_89", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "13/11/2026", "endDate": "13/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-13", "checkOutDate": "2026-11-14", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_89", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "14/11/2026", "endDate": "14/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-14", "checkOutDate": "2026-11-15", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_89", "fullName": "Nhân Viên 89", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_90', 'CT-2026-SIMV2-090', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1A - Phụ lô', 'Nhân Viên 90', 'Ban Điều Hành',
        'Kiên Giang 1 - Nhà máy NK1A - Phụ lô', '19/11/2026', '22/11/2026', 4, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_90", "region": "Kiên Giang 1", "factory": "Nhà máy NK1A - Phụ lô", "location": "Kiên Giang 1 - Nhà máy NK1A - Phụ lô", "startDate": "19/11/2026", "endDate": "19/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-19", "checkOutDate": "2026-11-20", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_90", "fullName": "Nhân Viên 90", "department": "Ban Điều Hành"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_91', 'CT-2026-SIMV2-091', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 1', 'Nhà máy NK1 - Kiên Giang 1', 'Nhân Viên 91', 'QA/QC',
        'Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1', '02/09/2026', '02/09/2026', 1, 'Xe khách', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_91", "region": "Kiên Giang 1", "factory": "Nhà máy NK1 - Kiên Giang 1", "location": "Kiên Giang 1 - Nhà máy NK1 - Kiên Giang 1", "startDate": "02/09/2026", "endDate": "02/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-02", "checkOutDate": "2026-09-03", "accommodationNote": ""}]', '{"driver_name": "Tài xế Nguyễn Văn Xe", "license_plate": "61A-999.88", "pickup_time": "06:30 AM", "accommodations": [{"dest_id": "dest_0_91", "dorm_room_no": "P.167"}]}', 'ARRANGED', '[]', '[{"id": "p1_91", "fullName": "Nhân Viên 91", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_92', 'CT-2026-SIMV2-092', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Tổ hợp Đế Giày TTPP', 'Nhân Viên 92', 'Công Nghệ Thông Tin',
        'Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP', '01/10/2026', '02/10/2026', 2, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_92", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "01/10/2026", "endDate": "01/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-01", "checkOutDate": "2026-10-02", "accommodationNote": ""}]', '{}', 'PENDING', '[]', '[{"id": "p1_92", "fullName": "Nhân Viên 92", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_93', 'CT-2026-SIMV2-093', 'Đăng ký công tác - Kiểm tra định kỳ tháng 11 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính', 'Nhân Viên 93', 'Hành Chính',
        'VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính', '16/10/2026', '18/10/2026', 3, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 3500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_93", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "16/10/2026", "endDate": "16/10/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-10-16", "checkOutDate": "2026-10-17", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_93", "fullName": "Nhân Viên 93", "department": "Hành Chính"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_94', 'CT-2026-SIMV2-094', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 94', 'Công Nghệ Thông Tin',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '12/11/2026', '14/11/2026', 3, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING', 4000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_94", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "12/11/2026", "endDate": "12/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-12", "checkOutDate": "2026-11-13", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_94", "fullName": "Nhân Viên 94", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_95', 'CT-2026-SIMV2-095', 'Đăng ký công tác - Kiểm tra định kỳ tháng 9 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 95', 'Công Nghệ Thông Tin',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '27/10/2026', '28/10/2026', 2, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_95", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "27/10/2026", "endDate": "27/10/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-10-27", "checkOutDate": "2026-10-28", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_95", "fullName": "Nhân Viên 95", "department": "Công Nghệ Thông Tin"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_96', 'CT-2026-SIMV2-096', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Kiên Giang 2', 'Nhà máy NK2 Mở rộng', 'Nhân Viên 96', 'QA/QC',
        'Kiên Giang 2 - Nhà máy NK2 Mở rộng', '04/11/2026', '07/11/2026', 4, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_96", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "04/11/2026", "endDate": "04/11/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-11-04", "checkOutDate": "2026-11-05", "accommodationNote": ""}, {"id": "dest_1_96", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "05/11/2026", "endDate": "05/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-05", "checkOutDate": "2026-11-06", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_96", "region": "Hoàn Thiện Đế", "factory": "Tổ hợp Đế Giày TTPP", "location": "Hoàn Thiện Đế - Tổ hợp Đế Giày TTPP", "startDate": "06/11/2026", "endDate": "06/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-06", "checkOutDate": "2026-11-07", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_96", "fullName": "Nhân Viên 96", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_97', 'CT-2026-SIMV2-097', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Kiên Giang 3', 'Nhà máy NK3 - Kiên Giang 3', 'Nhân Viên 97', 'QA/QC',
        'Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3', '14/09/2026', '14/09/2026', 1, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 1000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_97", "region": "Kiên Giang 3", "factory": "Nhà máy NK3 - Kiên Giang 3", "location": "Kiên Giang 3 - Nhà máy NK3 - Kiên Giang 3", "startDate": "14/09/2026", "endDate": "14/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-14", "checkOutDate": "2026-09-15", "accommodationNote": ""}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_97", "fullName": "Nhân Viên 97", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_98', 'CT-2026-SIMV2-098', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'Hoàn Thiện Đế', 'Xưởng Hoàn Thiện Đế', 'Nhân Viên 98', 'QA/QC',
        'Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế', '24/11/2026', '26/11/2026', 3, 'Xe công ty', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'REJECTED', 1500000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_98", "region": "Hoàn Thiện Đế", "factory": "Xưởng Hoàn Thiện Đế", "location": "Hoàn Thiện Đế - Xưởng Hoàn Thiện Đế", "startDate": "24/11/2026", "endDate": "24/11/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-11-24", "checkOutDate": "2026-11-25", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_98", "region": "Kiên Giang 2", "factory": "Nhà máy NK2 Mở rộng", "location": "Kiên Giang 2 - Nhà máy NK2 Mở rộng", "startDate": "25/11/2026", "endDate": "25/11/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-11-25", "checkOutDate": "2026-11-26", "accommodationNote": ""}]', '{}', 'CANCELLED', '[]', '[{"id": "p1_98", "fullName": "Nhân Viên 98", "department": "QA/QC"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_99', 'CT-2026-SIMV2-099', 'Đăng ký công tác - Kiểm tra định kỳ tháng 12 (Mô phỏng V2)', 'Nhà Máy Miền Đông', 'Nhà máy Miền Đông - Chính', 'Nhân Viên 99', 'R&D',
        'Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính', '07/09/2026', '08/09/2026', 2, 'Tàu hỏa', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'PENDING_L2', 5000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_99", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Chính", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Chính", "startDate": "07/09/2026", "endDate": "07/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-07", "checkOutDate": "2026-09-08", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_1_99", "region": "VP Chuỗi (R&D)", "factory": "Phòng R&D", "location": "VP Chuỗi (R&D) - Phòng R&D", "startDate": "08/09/2026", "endDate": "08/09/2026", "daysCount": 1, "accommodationType": "EXTERNAL_HOTEL", "checkInDate": "2026-09-08", "checkOutDate": "2026-09-09", "accommodationNote": "Cần phòng yên tĩnh"}, {"id": "dest_2_99", "region": "Nhà Máy Miền Đông", "factory": "Nhà máy Miền Đông - Phụ", "location": "Nhà Máy Miền Đông - Nhà máy Miền Đông - Phụ", "startDate": "09/09/2026", "endDate": "09/09/2026", "daysCount": 1, "accommodationType": "COMPANY_DORM", "checkInDate": "2026-09-09", "checkOutDate": "2026-09-10", "accommodationNote": ""}]', '{}', 'PENDING', '[]', '[{"id": "p1_99", "fullName": "Nhân Viên 99", "department": "R&D"}]'
    );
INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        'rec_sim_v2_1790925958_100', 'CT-2026-SIMV2-100', 'Đăng ký công tác - Kiểm tra định kỳ tháng 10 (Mô phỏng V2)', 'VP Chuỗi (R&D)', 'Văn Phòng Chuỗi Chính', 'Nhân Viên 100', 'Ban Điều Hành',
        'VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính', '27/09/2026', '29/09/2026', 3, 'Máy bay', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', 'RECALLED', 3000000, 1, 'pending_dept_budget',
        '[{"id": "dest_0_100", "region": "VP Chuỗi (R&D)", "factory": "Văn Phòng Chuỗi Chính", "location": "VP Chuỗi (R&D) - Văn Phòng Chuỗi Chính", "startDate": "27/09/2026", "endDate": "27/09/2026", "daysCount": 1, "accommodationType": "NONE", "checkInDate": "2026-09-27", "checkOutDate": "2026-09-28", "accommodationNote": "Cần phòng yên tĩnh"}]', '{}', 'NOT_STARTED', '[]', '[{"id": "p1_100", "fullName": "Nhân Viên 100", "department": "Ban Điều Hành"}]'
    );
