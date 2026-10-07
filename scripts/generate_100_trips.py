import json
import random
import datetime

# 1. Departments and Roles Roster
DEPARTMENTS = [
    "Văn Phòng Chuỗi SKECHERS",
    "Nhà Máy Miền Đông",
    "Kiên Giang 1",
    "Kiên Giang 2",
    "Kiên Giang 3",
    "Hoàn Thiện Đế",
    "Khối Kỹ Thuật & IE",
    "Khối Quản Lý Chất Lượng QC",
    "Khối Bảo Trì MMTB",
    "Phòng Kế Toán - Tài Chính",
    "Ban Quản Lý & Xuất Nhập Khẩu",
]

REGIONS = [
    "VP Chuỗi (R&D)",
    "Nhà Máy Miền Đông",
    "Kiên Giang 1",
    "Kiên Giang 2",
    "Kiên Giang 3",
    "Hoàn Thiện Đế",
]

FACTORY_MAPPING = {
    "VP Chuỗi (R&D)": ["Văn Phòng Chuỗi Chính", "Phòng R&D SKECHERS"],
    "Nhà Máy Miền Đông": ["Nhà máy Miền Đông - Chính", "Nhà máy Miền Đông - Phụ"],
    "Kiên Giang 1": ["Nhà máy NK1 - Kiên Giang 1", "Nhà máy NK1A - Phụ lô"],
    "Kiên Giang 2": ["Nhà máy NK2 - Kiên Giang 2", "Nhà máy NK2 Mở rộng"],
    "Kiên Giang 3": ["Nhà máy NK3 - Kiên Giang 3"],
    "Hoàn Thiện Đế": ["Tổ hợp Đế Giày TTPP", "Xưởng Hoàn Thiện Đế"],
}

LOCATION_MAPPING = {
    "VP Chuỗi (R&D)": "VP Chuỗi - Trụ sở chính (Bình Dương)",
    "Nhà Máy Miền Đông": "Cụm Nhà Máy Miền Đông (Đồng Nai)",
    "Kiên Giang 1": "Khu Công Nghiệp Thạnh Lộc (Kiên Giang)",
    "Kiên Giang 2": "Khu Công Nghiệp Châu Thành (Kiên Giang)",
    "Kiên Giang 3": "Cụm Sản Xuất Tân Hiệp (Kiên Giang)",
    "Hoàn Thiện Đế": "Tổ Hợp Đế Giày TTPP (Tân Uyên)",
}

TRANSPORTS = [
    "Xe công ty (Fortuner 7 chỗ - 61A-123.45)",
    "Xe công ty (Ford Transit 16 chỗ - 61B-678.90)",
    "Xe công ty (Kia Carnival 7 chỗ - 61A-999.88)",
    "Xe cá nhân / Tự túc",
    "Vé máy bay (Vietjet Air / Vietnam Airlines)",
]

FIRST_NAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"]
MIDDLE_NAMES = ["Văn", "Thị", "Quốc", "Minh", "Bảo", "Khánh", "Thanh", "Đức", "Anh", "Hoài", "Phương", "Hữu", "Tuấn", "Ngọc"]
LAST_NAMES = ["Hùng", "Mai", "Tấn", "Trinh", "Dũng", "Nam", "Linh", "Hà", "Phong", "Huy", "Thảo", "Phúc", "Khai", "Tâm", "Sơn"]

POSITIONS = [
    "Trưởng Phòng Kỹ Thuật IE",
    "Chuyên Viên Kiểm Định QC",
    "Kỹ Sư Bảo Trì MMTB",
    "Giám Sát Chuyền May",
    "Quản Lý Dự Án Kaizen",
    "Cán Bộ Hành Chính",
    "Kế Toán Viên Chi Phí",
    "Kỹ Sư R&D Mẫu Giày",
    "Phó Phòng Quản Lý Sản Xuất",
    "Trưởng Xưởng Gò Dán",
]

PURPOSES = [
    "Họp đánh giá chỉ số OEE & kiểm tra Gemba Walk hàng tháng",
    "Hỗ trợ lắp đặt & căn chỉnh máy gò dán tự động 4.0 SKECHERS",
    "Kiểm định chất lượng lô hàng xuất khẩu thị trường US/EU",
    "Tập huấn quy trình Kaizen 1-5-2 cho cán bộ quản lý chuyền",
    "Nghiệm thu mẫu giày thể thao SKECHERS Performance Q3/2026",
    "Kiểm tra hệ thống PPH, PCCC & An toàn lao động định kỳ",
    "Đánh giá định mức vật tư và chi phí công đoạn hoàn thiện đế",
    "Kiểm toán nội bộ và rà soát sổ sách chứng từ chi phí",
    "Hội nghị tổng kết kế hoạch sản xuất & Kaizen xuất sắc",
    "Khảo sát địa điểm bố trí chuyền thử nghiệm công nghệ mới",
]

def generate_sql():
    sql_statements = []
    
    # 1. Clean old simulation data (optional or keep existing)
    # sql_statements.append("DELETE FROM business_trips WHERE code LIKE 'CT-SIM-%';")
    
    start_base_date = datetime.date(2026, 8, 1)
    
    statuses = ["APPROVED"] * 45 + ["PENDING"] * 20 + ["PENDING_L2"] * 10 + ["COMPLETED"] * 15 + ["REJECTED"] * 6 + ["RECALLED"] * 4
    random.shuffle(statuses)

    for i in range(1, 101):
        trip_id = f"sim_trip_100_{i:03d}"
        code = f"CT-2026-SIM{i:03d}"
        
        creator_name = f"{random.choice(FIRST_NAMES)} {random.choice(MIDDLE_NAMES)} {random.choice(LAST_NAMES)}"
        emp_code = f"2026{random.randint(80, 89):02d}{i:03d}"
        dept = random.choice(DEPARTMENTS)
        region = random.choice(REGIONS)
        factory = random.choice(FACTORY_MAPPING[region])
        location = LOCATION_MAPPING[region]
        transport = random.choice(TRANSPORTS)
        purpose = random.choice(PURPOSES)
        
        days = random.randint(1, 4)
        offset = random.randint(1, 60)
        start_date = start_base_date + datetime.timedelta(days=offset)
        end_date = start_date + datetime.timedelta(days=days - 1)
        
        title = f"Chuyến công tác {region} - {purpose.split('&')[0].strip()}"
        
        # Participants (1-3 staff)
        part_count = random.randint(1, 3)
        participants = []
        for p_idx in range(part_count):
            p_name = creator_name if p_idx == 0 else f"{random.choice(FIRST_NAMES)} {random.choice(MIDDLE_NAMES)} {random.choice(LAST_NAMES)}"
            participants.append({
                "id": f"p_{i}_{p_idx}",
                "fullName": p_name,
                "position": random.choice(POSITIONS),
                "employeeId": f"2026{random.randint(10, 99)}{random.randint(100, 999)}",
                "department": dept,
                "phone": f"09{random.randint(10000000, 99999999)}",
                "pickupLocation": f"{dept} - Cổng chính",
            })
            
        # Attachments (Giấy đi đường / Travel Authorization)
        attachments = [
            {
                "id": f"att_{i}_1",
                "name": f"Giay_Di_Duong_{code}_Signed.pdf",
                "size": random.randint(180000, 450000),
                "type": "application/pdf",
                "dataUrl": "/images/sample-pdf-stub.png",
                "createdAt": start_date.strftime("%Y-%m-%d"),
            }
        ]
        
        status = statuses[i - 1]
        approved_level = None
        rejected_level = None
        rejection_reason = None
        budget_status = "pending_dept_budget"
        budget_amount = random.choice([1500000, 2800000, 3500000, 4200000, 5000000, 6800000])
        budget_rejection_reason = None
        
        invoices = []
        
        if status == "APPROVED":
            approved_level = "L2"
            budget_status = "budget_approved"
        elif status == "PENDING_L2":
            approved_level = "L1"
            budget_status = "pending_exec_budget"
        elif status == "COMPLETED":
            status = "APPROVED" # COMPLETED is mapped under APPROVED with invoices in D1
            approved_level = "L2"
            budget_status = "budget_approved"
            # Add invoices
            invoices = [
                {
                    "id": f"inv_{i}_1",
                    "title": f"Hóa đơn Khách sạn / Lưu trú tại {region}",
                    "category": "Khách sạn / Lưu trú",
                    "amount": random.choice([1200000, 1850000, 2400000, 3100000]),
                    "invoiceDate": end_date.strftime("%Y-%m-%d"),
                    "invoiceNumber": f"HD-{random.randint(100000, 999999)}",
                    "notes": "Đã thanh toán chuyển khoản, đính kèm hóa đơn điện tử GTGT",
                    "fileName": f"HoaDon_KhachSan_{code}.pdf",
                    "fileType": "application/pdf",
                    "fileUrl": "/images/sample-invoice-stub.png",
                    "createdAt": end_date.strftime("%Y-%m-%d"),
                },
                {
                    "id": f"inv_{i}_2",
                    "title": f"Hóa đơn Vé máy bay / Phương tiện di chuyển",
                    "category": "Vé máy bay / Tàu xe",
                    "amount": random.choice([850000, 1450000, 2200000]),
                    "invoiceDate": start_date.strftime("%Y-%m-%d"),
                    "invoiceNumber": f"HD-{random.randint(100000, 999999)}",
                    "notes": "Vé khứ hồi công tác",
                    "fileName": f"VeMayBay_{code}.pdf",
                    "fileType": "application/pdf",
                    "fileUrl": "/images/sample-invoice-stub.png",
                    "createdAt": start_date.strftime("%Y-%m-%d"),
                }
            ]
        elif status == "REJECTED":
            rejected_level = random.choice(["L1", "L2"])
            rejection_reason = "Không sắp xếp được lịch sản xuất tại điểm đến / Trùng lịch họp BGĐ"
            budget_status = "budget_rejected"
        elif status == "RECALLED":
            status = "RECALLED"
            rejection_reason = "Cán bộ chủ động rút lại đơn do thay đổi kế hoạch công tác"

        proposal_text = f"Kính gửi Ban Giám Đốc và Trưởng bộ phận,\n\nTôi xin đề xuất chuyến công tác thực tế tại {region} ({factory}) từ ngày {start_date.strftime('%d/%m/%Y')} đến ngày {end_date.strftime('%d/%m/%Y')}.\nMục đích: {purpose}.\nSố lượng nhân sự tham gia: {part_count} người.\nPhương tiện di chuyển: {transport}.\n\nRất mong nhận được sự phê duyệt của Quý Lãnh Đạo.\nTrân trọng!"
        
        address = f"Số {random.randint(10, 250)} Đường Nguyễn Huệ, {location}"
        
        # Format SQL insert with proper escape
        stmt = f"""INSERT INTO business_trips (
            id, code, title, region, factory, creator, department, department_id,
            location, start_date, end_date, days_count, transport, participants_count,
            purpose, address, proposal_text, attachments_json, invoices_json,
            participants_json, status, estimated_cost, version, approved_level,
            rejected_level, rejection_reason, budget_status, budget_amount, created_at
        ) VALUES (
            '{trip_id}', '{code}', '{title.replace("'", "''")}', '{region}', '{factory.replace("'", "''")}',
            '{creator_name.replace("'", "''")}', '{dept}', 'DEPT_{i}',
            '{location.replace("'", "''")}', '{start_date.strftime("%Y-%m-%d")}', '{end_date.strftime("%Y-%m-%d")}',
            {days}, '{transport.replace("'", "''")}', {part_count},
            '{purpose.replace("'", "''")}', '{address.replace("'", "''")}', '{proposal_text.replace("'", "''")}',
            '{json.dumps(attachments).replace("'", "''")}', '{json.dumps(invoices).replace("'", "''")}',
            '{json.dumps(participants).replace("'", "''")}', '{status}', {budget_amount},
            1, {f"'{approved_level}'" if approved_level else "NULL"},
            {f"'{rejected_level}'" if rejected_level else "NULL"},
            {f"'{rejection_reason.replace('\'', '\'\'')}'" if rejection_reason else "NULL"},
            '{budget_status}', {budget_amount}, '{start_date.strftime("%Y-%m-%d %H:%M:%S")}'
        );"""
        
        sql_statements.append(stmt)
        
    with open("scripts/seed_100_trips.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(sql_statements))
        
    print(f"[SUCCESS] Generated {len(sql_statements)} SQL INSERT statements into scripts/seed_100_trips.sql")

if __name__ == "__main__":
    generate_sql()
