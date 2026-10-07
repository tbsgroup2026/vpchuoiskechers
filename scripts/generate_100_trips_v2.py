import json
import random
from datetime import datetime, timedelta

def random_date(start, end):
    delta = end - start
    random_days = random.randrange(delta.days)
    return start + timedelta(days=random_days)

departments = ["Nhân Sự", "Kế Toán", "Hành Chính", "R&D", "QA/QC", "Đột Dập", "Công Nghệ Thông Tin", "Ban Điều Hành"]
regions = [
    ("Kiên Giang 1", ["Nhà máy NK1 - Kiên Giang 1", "Nhà máy NK1A - Phụ lô"], True),
    ("Kiên Giang 2", ["Nhà máy NK2 - Kiên Giang 2", "Nhà máy NK2 Mở rộng"], True),
    ("Kiên Giang 3", ["Nhà máy NK3 - Kiên Giang 3"], True),
    ("Hoàn Thiện Đế", ["Tổ hợp Đế Giày TTPP", "Xưởng Hoàn Thiện Đế"], False),
    ("Nhà Máy Miền Đông", ["Nhà máy Miền Đông - Chính", "Nhà máy Miền Đông - Phụ"], True),
    ("VP Chuỗi (R&D)", ["Văn Phòng Chuỗi Chính", "Phòng R&D"], False)
]

statuses = [
    "PENDING", "PENDING_L2", "APPROVED", "REJECTED", "RECALLED"
]

sql_statements = []

for i in range(1, 101):
    id_val = f"rec_sim_v2_{int(datetime.now().timestamp())}_{i}"
    code = f"CT-2026-SIMV2-{i:03d}"
    title = f"Đăng ký công tác - Kiểm tra định kỳ tháng {random.randint(9, 12)} (Mô phỏng V2)"
    creator = f"Nhân Viên {i}"
    department = random.choice(departments)
    
    start_dt = random_date(datetime(2026, 9, 1), datetime(2026, 12, 1))
    days_count = random.randint(1, 4)
    end_dt = start_dt + timedelta(days=days_count - 1)
    
    start_date_str = start_dt.strftime("%d/%m/%Y")
    end_date_str = end_dt.strftime("%d/%m/%Y")
    
    # Generate Destinations (Multi-destination logic)
    destinations = []
    num_destinations = random.choice([1, 1, 2, 2, 3]) # 1 to 3 destinations
    
    current_dt = start_dt
    for d in range(num_destinations):
        region_info = random.choice(regions)
        reg_name, fac_list, has_dorm = region_info
        factory = random.choice(fac_list)
        
        acc_type = "COMPANY_DORM" if has_dorm else "EXTERNAL_HOTEL"
        if random.random() < 0.1:
            acc_type = "NONE"
            
        destinations.append({
            "id": f"dest_{d}_{i}",
            "region": reg_name,
            "factory": factory,
            "location": f"{reg_name} - {factory}",
            "startDate": current_dt.strftime("%d/%m/%Y"),
            "endDate": current_dt.strftime("%d/%m/%Y"), # 1 day per destination for simplicity
            "daysCount": 1,
            "accommodationType": acc_type,
            "checkInDate": current_dt.strftime("%Y-%m-%d"),
            "checkOutDate": (current_dt + timedelta(days=1)).strftime("%Y-%m-%d"),
            "accommodationNote": "Cần phòng yên tĩnh" if random.random() > 0.5 else ""
        })
        current_dt = current_dt + timedelta(days=1)
        
    transport = random.choice(["Xe công ty", "Máy bay", "Tàu hỏa", "Xe khách", "Phương tiện cá nhân"])
    status = random.choice(statuses)
    
    # Logistics Status based on Approval
    logistics_status = "NOT_STARTED"
    logistics_json = {}
    
    if status in ["PENDING_L2", "APPROVED"]:
        logistics_status = random.choice(["PENDING", "ARRANGED"])
        if logistics_status == "ARRANGED":
            logistics_json = {
                "driver_name": "Tài xế Nguyễn Văn Xe",
                "license_plate": "61A-999.88",
                "pickup_time": "06:30 AM",
                "accommodations": []
            }
            for dest in destinations:
                if dest["accommodationType"] == "COMPANY_DORM":
                    logistics_json["accommodations"].append({"dest_id": dest["id"], "dorm_room_no": f"P.{random.randint(101, 305)}"})
                elif dest["accommodationType"] == "EXTERNAL_HOTEL":
                    logistics_json["accommodations"].append({"dest_id": dest["id"], "hotel_name": "Khách sạn Rạch Giá", "cost": 650000})

    if status == "REJECTED":
        logistics_status = "CANCELLED"
        
    destinations_json = json.dumps(destinations, ensure_ascii=False).replace("'", "''")
    logistics_json_str = json.dumps(logistics_json, ensure_ascii=False).replace("'", "''")
    
    # Invoices (Post-trip)
    invoices = []
    if status == "APPROVED" and random.random() > 0.3:
        invoices.append({
            "id": f"inv_{i}",
            "title": "Hóa đơn khách sạn",
            "category": "Khách sạn / Lưu trú",
            "amount": 1200000,
            "invoiceDate": end_dt.strftime("%Y-%m-%d"),
            "invoiceNumber": f"HD{random.randint(10000, 99999)}"
        })
    invoices_json = json.dumps(invoices, ensure_ascii=False).replace("'", "''")
    
    # Participants
    participants = [{"id": f"p1_{i}", "fullName": creator, "department": department}]
    participants_json = json.dumps(participants, ensure_ascii=False).replace("'", "''")
    
    # Insert SQL
    sql = f"""
    INSERT INTO business_trips (
        id, code, title, region, factory, creator, department, 
        location, start_date, end_date, days_count, transport, participants_count,
        purpose, status, estimated_cost, version, budget_status, 
        destinations_json, logistics_json, logistics_status, invoices_json, participants_json
    ) VALUES (
        '{id_val}', '{code}', '{title}', '{destinations[0]["region"]}', '{destinations[0]["factory"]}', '{creator}', '{department}',
        '{destinations[0]["location"]}', '{start_date_str}', '{end_date_str}', {days_count}, '{transport}', 1,
        'Công tác mô phỏng V2 (Đa điểm đến & Hậu cần Lễ Tân)', '{status}', {random.randint(1, 10)*500000}, 1, 'pending_dept_budget',
        '{destinations_json}', '{logistics_json_str}', '{logistics_status}', '{invoices_json}', '{participants_json}'
    );
    """
    sql_statements.append(sql.strip())

with open(r"d:\Work\TBS II\scripts\seed_100_trips_v2.sql", 'w', encoding='utf-8') as f:
    f.write("-- Mô phỏng 100 User V2 (Multi-destination & Lễ Tân Logistics)\\n")
    f.write("BEGIN TRANSACTION;\\n")
    for s in sql_statements:
        f.write(s + "\\n")
    f.write("COMMIT;\\n")

print("Generated seed_100_trips_v2.sql")
