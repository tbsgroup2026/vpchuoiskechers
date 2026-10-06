let isSchemaMigrated = false;

export async function ensureKaizenSchema(db: any, force = false) {
  if (!db) return;
  if (isSchemaMigrated && !force) return;

  try {
    const columns = [
      'CREATE TABLE IF NOT EXISTS zalo_bot_chat_history (id TEXT PRIMARY KEY, chat_id TEXT, user_id TEXT, role TEXT, text TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE TABLE IF NOT EXISTS zalo_bot_rate_limit (user_id TEXT PRIMARY KEY, count INTEGER DEFAULT 1, reset_at DATETIME)',
      'CREATE TABLE IF NOT EXISTS zalo_bot_allowed_groups (group_id TEXT PRIMARY KEY, name TEXT, is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE TABLE IF NOT EXISTS bot_knowledge (id TEXT PRIMARY KEY, question TEXT, answer TEXT, tags TEXT, status TEXT DEFAULT \'draft\', source TEXT DEFAULT \'admin\', created_by TEXT, approved_by TEXT, hit_count INTEGER DEFAULT 0, access_label TEXT DEFAULT \'internal\', updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'ALTER TABLE bot_knowledge ADD COLUMN access_label TEXT DEFAULT "internal"',
      'CREATE TABLE IF NOT EXISTS bot_unanswered (id TEXT PRIMARY KEY, question_hash TEXT UNIQUE, question_text TEXT, count INTEGER DEFAULT 1, status TEXT DEFAULT \'new\', first_seen DATETIME DEFAULT CURRENT_TIMESTAMP, last_seen DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE TABLE IF NOT EXISTS zalo_processed_events (event_id TEXT PRIMARY KEY, processed_at DATETIME DEFAULT CURRENT_TIMESTAMP)',

                  'CREATE TABLE IF NOT EXISTS trip_files (id TEXT PRIMARY KEY, trip_id TEXT, uploader_emp_code TEXT, file_type TEXT, original_name TEXT, mime_type TEXT, size_bytes INTEGER, r2_key TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE INDEX IF NOT EXISTS idx_trip_files_trip_id ON trip_files (trip_id)',
      'ALTER TABLE business_trips ADD COLUMN trip_type TEXT DEFAULT "TRONG_NGAY"',

      'ALTER TABLE room_bookings ADD COLUMN source TEXT DEFAULT "INTERNAL"',
      'ALTER TABLE room_bookings ADD COLUMN zalo_phone TEXT',

      'CREATE TABLE IF NOT EXISTS company_vehicles (id TEXT PRIMARY KEY, plate_number TEXT NOT NULL, driver_name TEXT NOT NULL, driver_phone TEXT, seat_count INTEGER, status TEXT DEFAULT "AVAILABLE", current_trip_id TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN trang_thai TEXT DEFAULT "CHO_DUYET"',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN line TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN nguoi_kiem_chung TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN anh_kiem_chung_json TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN nhan_xet_kiem_chung TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN so_giay_tiet_kiem INTEGER DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN diem_hieu_qua REAL DEFAULT 0.0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN diem_tong_hop REAL DEFAULT 0.0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN hang_xep INTEGER DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN merged_into_id TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN review_status TEXT DEFAULT "CHO_DUYET"',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN is_archived INTEGER DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN site_code TEXT DEFAULT "vpchuoiskechers"',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN external_id TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN source_region TEXT DEFAULT "Văn phòng Chuỗi"',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN ie_confirmed_by TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN ie_confirmed_at DATETIME',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN ie_time_before_original REAL',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN ie_time_before_confirmed REAL',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN ie_time_after_original REAL',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN ie_time_after_confirmed REAL',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN plant_code TEXT DEFAULT "VPCHUOI"',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN plant_group TEXT DEFAULT "VPCHUOI"',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN product_code TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN pair_quantity REAL DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN quantity REAL DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN time_before_seconds REAL DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN time_after_seconds REAL DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN efficiency_value_vnd REAL DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN total_savings_vnd REAL DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN cost_before REAL DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN cost_after REAL DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN proposer_position TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN customer TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN pricing_direction TEXT DEFAULT "THOI_GIAN"',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN total_savings_words TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN is_edited INTEGER DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN approval_status TEXT DEFAULT "PHE_DUYET"',
    ];

    for (const sql of columns) {
      await db.prepare(sql).run().catch(() => {});
    }

    // Sync performance indexes
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_ci_kaizen_site_ext ON ci_kaizen_proposals(site_code, external_id)
    `).run().catch(() => {});
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_ci_kaizen_updated ON ci_kaizen_proposals(updated_at DESC)
    `).run().catch(() => {});

    // Role Permissions & Workspace Config Tables
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        module TEXT NOT NULL,
        action TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS role_workspace_config (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        route TEXT NOT NULL,
        label TEXT NOT NULL,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // KPI & Task Board Tables
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS department_kpi_monthly (
        id TEXT PRIMARY KEY,
        department_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        kpi_name TEXT NOT NULL,
        target_value REAL,
        actual_value REAL,
        unit TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        department_id TEXT,
        owner_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_lists (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_cards (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL,
        board_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        assignee_id TEXT,
        deadline DATETIME,
        status TEXT DEFAULT 'in_progress',
        color_state TEXT DEFAULT 'green',
        job_position_id TEXT,
        sort_order INTEGER DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_card_checklist_items (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        content TEXT NOT NULL,
        is_done INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_card_attachments (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        file_type TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_card_reviews (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        rating INTEGER,
        comment TEXT,
        reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS task_notifications_sent (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        notify_date DATE NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(card_id, notify_date)
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS job_position_templates (
        id TEXT PRIMARY KEY,
        position_name TEXT NOT NULL,
        department_id TEXT,
        checklist_template TEXT
      )
    `).run().catch(() => {});

    // Centralized Audit Logs Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS sys_audit_logs (
        id TEXT PRIMARY KEY,
        emp_code TEXT,
        emp_name TEXT,
        role_code TEXT,
        module TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        changes_json TEXT,
        ip_address TEXT,
        user_agent TEXT,
        status TEXT DEFAULT 'SUCCESS',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON sys_audit_logs(created_at DESC)
    `).run().catch(() => {});
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_emp ON sys_audit_logs(emp_code)
    `).run().catch(() => {});
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON sys_audit_logs(module, action)
    `).run().catch(() => {});

    // Extended Log & Incremental Backup Tables
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS auth_login_history (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        emp_code TEXT,
        ip TEXT,
        user_agent TEXT,
        success INTEGER DEFAULT 1,
        failure_reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});


    await db.prepare(`
      CREATE TABLE IF NOT EXISTS account_change_history (
        id TEXT PRIMARY KEY,
        target_user_id TEXT NOT NULL,
        field_changed TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_by TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS credential_change_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        changed_by TEXT NOT NULL,
        change_type TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS document_snapshots (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        snapshot_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS incremental_backup_state (
        table_name TEXT PRIMARY KEY,
        last_synced_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // 1-5-2 Security & Alert Tables
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_module_pin (
        user_id TEXT PRIMARY KEY,
        pin_hash TEXT NOT NULL,
        must_change_pin INTEGER DEFAULT 1,
        failed_attempts INTEGER DEFAULT 0,
        locked_until DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS module_152_access_log (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        success INTEGER NOT NULL,
        ip TEXT,
        user_agent TEXT,
        accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_alert_recipients (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        email TEXT NOT NULL,
        role TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_merged_proposals (
        id TEXT PRIMARY KEY,
        original_proposal_id TEXT NOT NULL,
        merged_proposal_id TEXT NOT NULL,
        attachments_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_sync_logs (
        id TEXT PRIMARY KEY,
        source_site TEXT NOT NULL,
        status TEXT NOT NULL,
        synced_count INTEGER DEFAULT 0,
        created_count INTEGER DEFAULT 0,
        updated_count INTEGER DEFAULT 0,
        skipped_count INTEGER DEFAULT 0,
        message TEXT,
        error_detail TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_rate_limits (
        id TEXT PRIMARY KEY,
        site_code TEXT,
        ip_emp_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // D1 Business Trips Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS business_trips (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        title TEXT NOT NULL,
        region TEXT,
        factory TEXT,
        creator TEXT NOT NULL,
        department TEXT NOT NULL,
        department_id TEXT,
        location TEXT,
        start_date TEXT,
        end_date TEXT,
        days_count INTEGER DEFAULT 1,
        transport TEXT,
        participants_count INTEGER DEFAULT 1,
        purpose TEXT,
        address TEXT,
        proposal_text TEXT,
        attachments_json TEXT,
        invoices_json TEXT,
        participants_json TEXT,
        status TEXT DEFAULT 'PENDING',
        estimated_cost REAL DEFAULT 0,
        version INTEGER DEFAULT 1,
        approved_level TEXT,
        rejected_level TEXT,
        rejection_reason TEXT,
        budget_status TEXT DEFAULT 'pending_dept_budget',
        budget_amount REAL DEFAULT 0,
        budget_rejection_reason TEXT,
        is_emergency INTEGER DEFAULT 0,
        emergency_reason TEXT,
        delegated_by_emp_code TEXT,
        delegated_by_name TEXT,
        recall_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // Alter table additions for business_trips
    const tripExtraCols = [
      "ALTER TABLE business_trips ADD COLUMN is_emergency INTEGER DEFAULT 0",
      "ALTER TABLE business_trips ADD COLUMN emergency_reason TEXT",
      "ALTER TABLE business_trips ADD COLUMN delegated_by_emp_code TEXT",
      "ALTER TABLE business_trips ADD COLUMN delegated_by_name TEXT",
      "ALTER TABLE business_trips ADD COLUMN recall_reason TEXT",
      "ALTER TABLE business_trips ADD COLUMN destinations_json TEXT",
      "ALTER TABLE business_trips ADD COLUMN logistics_json TEXT",
      "ALTER TABLE business_trips ADD COLUMN logistics_status TEXT DEFAULT 'NOT_STARTED'",
      "ALTER TABLE business_trips ADD COLUMN custom_destination_name TEXT",
      "ALTER TABLE business_trips ADD COLUMN custom_destination_address TEXT",
      "ALTER TABLE business_trips ADD COLUMN custom_destination_type TEXT",
      "ALTER TABLE business_trips ADD COLUMN signed_travel_paper_json TEXT",
      "ALTER TABLE business_trips ADD COLUMN payment_status TEXT DEFAULT 'NOT_STARTED'",
      "ALTER TABLE business_trips ADD COLUMN payment_notes TEXT",
      "ALTER TABLE business_trips ADD COLUMN last_reminded_at DATETIME",
      "ALTER TABLE business_trips ADD COLUMN creator_emp_code TEXT",
    ];
    for (const sql of tripExtraCols) {
      await db.prepare(sql).run().catch(() => {});
    }

    // Delegated Approvals Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS business_trip_delegations (
        id TEXT PRIMARY KEY,
        delegator_emp_code TEXT NOT NULL,
        delegator_name TEXT,
        delegate_to_emp_code TEXT NOT NULL,
        delegate_to_name TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        scope TEXT DEFAULT 'ALL',
        department_id TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // Internal Employee Directory Table for Autocomplete & Seeding
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        emp_code TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        department TEXT NOT NULL,
        department_id TEXT,
        position TEXT,
        phone TEXT,
        email TEXT,
        pickup_location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // Company Fleet Vehicles Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS company_fleet (
        id TEXT PRIMARY KEY,
        vehicle_code TEXT UNIQUE NOT NULL,
        vehicle_name TEXT NOT NULL,
        license_plate TEXT NOT NULL,
        capacity INTEGER DEFAULT 4,
        status TEXT DEFAULT 'AVAILABLE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // Seed Sample Employees if empty
    try {
      const empCount = await db.prepare("SELECT COUNT(*) as cnt FROM employees").first().catch(() => null);
      if (!empCount || Number(empCount.cnt) === 0) {
        const seedEmps = [
          ["emp_1", "202608001", "Nguyễn Văn Anh", "Văn Phòng Chuỗi SKECHERS", "VPCHUOI", "Trưởng Phòng CI", "0901234567", "anhnv@tbsgroup.vn", "VP Chuỗi SKECHERS - Cổng chính"],
          ["emp_2", "202608002", "Trần Thị Mai", "Nhà Máy Miền Đông", "MIEN_DONG", "Phó Phòng Sản Xuất", "0902345678", "maitt@tbsgroup.vn", "Nhà máy Miền Đông - Cổng A"],
          ["emp_3", "202608010", "Lê Văn Hùng", "Kiên Giang 1", "KG1", "Chuyên Viên IE", "0903456789", "hunglv@tbsgroup.vn", "Kiên Giang 1 - Phụ Lô"],
          ["emp_4", "210602002", "Phạm Quốc Tuấn", "Kiên Giang 2", "KG2", "Trưởng Xưởng May", "0904567890", "tuanpq@tbsgroup.vn", "Kiên Giang 2 - Cụm B"],
          ["emp_5", "222102020", "Đỗ Minh Đức", "Hoàn Thiện Đế", "HTD", "Kỹ Sư R&D", "0905678901", "ducdm@tbsgroup.vn", "Tổ hợp Đế Giày TTPP"],
          ["emp_6", "201711002", "Lê Khải", "Văn Phòng Chuỗi SKECHERS", "VPCHUOI", "Giám Đốc Chuỗi Cung Ứng", "0906789012", "khaile@tbsgroup.vn", "VP Chuỗi - Trụ sở chính"],
          ["emp_7", "202206011", "TRẦN THỊ BÍCH TRÂM", "HÀNH CHÍNH-LỄ TÂN", "HANH_CHINH", "Trưởng Team Lễ Tân", "", "202206011@tbsgroup.vn", "VP Chuỗi SKECHERS - Cổng chính"],
          ["emp_8", "102603069", "TRƯƠNG BẢO NGỌC", "HÀNH CHÍNH-LỄ TÂN", "HANH_CHINH", "Lễ Tân", "", "102603069@tbsgroup.vn", "VP Chuỗi SKECHERS - Cổng chính"],
          ["emp_9", "202010004", "NGUYỄN MINH HÙNG", "HÀNH CHÍNH-LỄ TÂN", "HANH_CHINH", "Lễ Tân", "", "202010004@tbsgroup.vn", "VP Chuỗi SKECHERS - Cổng chính"],
        ];
        for (const e of seedEmps) {
          await db.prepare(`
            INSERT OR IGNORE INTO employees (id, emp_code, full_name, department, department_id, position, phone, email, pickup_location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(...e).run().catch(() => {});
        }
      }
    } catch (e) {}

    // Seed Sample Fleet Vehicles if empty
    try {
      const fleetCount = await db.prepare("SELECT COUNT(*) as cnt FROM company_fleet").first().catch(() => null);
      if (!fleetCount || Number(fleetCount.cnt) === 0) {
        const seedFleet = [
          ["fleet_1", "XE-01", "Toyota Fortuner (7 chỗ)", "61A-123.45", 7, "AVAILABLE"],
          ["fleet_2", "XE-02", "Ford Transit (16 chỗ)", "61B-678.90", 16, "AVAILABLE"],
          ["fleet_3", "XE-03", "Kia Carnival (7 chỗ)", "61A-999.88", 7, "AVAILABLE"],
          ["fleet_4", "XE-04", "Hyundai Solati (16 chỗ)", "61B-555.44", 16, "AVAILABLE"],
          ["fleet_5", "XE-05", "Toyota Innova (7 chỗ)", "61A-333.22", 7, "AVAILABLE"],
        ];
        for (const f of seedFleet) {
          await db.prepare(`
            INSERT OR IGNORE INTO company_fleet (id, vehicle_code, vehicle_name, license_plate, capacity, status)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(...f).run().catch(() => {});
        }
      }
    } catch (e) {}

    // D1 Notifications Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS sys_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        emp_code TEXT,
        target_role TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'INFO',
        is_read INTEGER DEFAULT 0,
        link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});
    await db.prepare('ALTER TABLE sys_notifications ADD COLUMN target_role TEXT').run().catch(() => {});

    // D1 Meeting Rooms Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS meeting_rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        roomCode TEXT,
        capacity INTEGER DEFAULT 10,
        location TEXT,
        managingUnit TEXT,
        equipment TEXT,
        status TEXT DEFAULT 'AVAILABLE',
        isLocked INTEGER DEFAULT 0,
        colorClass TEXT DEFAULT 'bg-blue-600 border-blue-700 text-white',
        badgeBg TEXT DEFAULT 'bg-blue-100 text-blue-800',
        images TEXT,
        floor INTEGER,
        sort_order INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare('ALTER TABLE meeting_rooms ADD COLUMN floor INTEGER').run().catch(() => {});
    await db.prepare('ALTER TABLE meeting_rooms ADD COLUMN sort_order INTEGER').run().catch(() => {});


    // Seed Sample Meeting Rooms if empty
    try {
      const roomCount = await db.prepare("SELECT COUNT(*) as cnt FROM meeting_rooms").first().catch(() => null);
      if (!roomCount || Number(roomCount.cnt) === 0) {
        const seedRooms = [
          ["room_1", "Phòng Họp Executive (P.101)", "P.101", 20, "Tầng 1 - Khối Văn Phòng Chuỗi Skechers", "Khối Hành Chánh TBS Group", "Màn hình 85 inch, Camera AI Polycom, Bảng kính interactive, Micro hội nghị wireless", "AVAILABLE", 0, "bg-blue-600 border-blue-700 text-white", "bg-blue-100 text-blue-800", '["/images/rooms/room_1/1.jpg"]'],
          ["room_2", "Phòng Họp Kaizen & Gemba (P.202)", "P.202", 12, "Tầng 2 - Khu Vực Cải Tiến & Kỹ Thuật", "Khối Hành Chánh TBS Group", "Máy chiếu 4K, Bảng gá 1-5-2 demo, Hệ thống loa trợ giảng", "AVAILABLE", 0, "bg-purple-600 border-purple-700 text-white", "bg-purple-100 text-purple-800", '["/images/rooms/room_2/1.jpg"]'],
          ["room_3", "Phòng Họp Sáng Tạo & R&D (P.305)", "P.305", 10, "Tầng 3 - Trung Tâm Nghiên Cứu Mẫu", "Khối Hành Chánh TBS Group", "Bàn làm việc mô-đun, Màn hình cảm ứng 65 inch", "AVAILABLE", 0, "bg-emerald-600 border-emerald-700 text-white", "bg-emerald-100 text-emerald-800", '["/images/rooms/room_3/1.jpg"]'],
        ];
        for (const r of seedRooms) {
          await db.prepare(`
            INSERT OR IGNORE INTO meeting_rooms (id, name, roomCode, capacity, location, managingUnit, equipment, status, isLocked, colorClass, badgeBg, images)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(...r).run().catch(() => {});
        }
      }
    } catch (e) {}

    // D1 Room Bookings Table & Conflict Lock Index
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS room_bookings (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        room_name TEXT,
        user_id TEXT,
        emp_code TEXT,
        user_name TEXT,
        department TEXT,
        booking_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        purpose TEXT,
        participants_count INTEGER DEFAULT 1,
        status TEXT DEFAULT 'CONFIRMED',
        rejection_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_room_booking_conflict ON room_bookings(room_id, booking_date, time_slot)
    `).run().catch(() => {});

    await db.prepare('ALTER TABLE room_bookings ADD COLUMN notes TEXT').run().catch(() => {});
    await db.prepare('ALTER TABLE room_bookings ADD COLUMN meeting_type TEXT DEFAULT "OFFLINE"').run().catch(() => {});
    await db.prepare('ALTER TABLE room_bookings ADD COLUMN platform TEXT').run().catch(() => {});
    await db.prepare('ALTER TABLE room_bookings ADD COLUMN meeting_link TEXT').run().catch(() => {});
    await db.prepare('ALTER TABLE room_bookings ADD COLUMN meeting_credentials TEXT').run().catch(() => {});

    // Zalo Bot Integration Tables
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS zalo_user_links (
        emp_code TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        zalo_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS zalo_linking_codes (
        code TEXT PRIMARY KEY,
        emp_code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS zalo_notification_logs (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        priority TEXT NOT NULL,
        recipient_emp_code TEXT,
        chat_id TEXT,
        message_text TEXT,
        status TEXT DEFAULT 'SUCCESS',
        error_detail TEXT,
        idempotency_key TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS zalo_config (
        id TEXT PRIMARY KEY DEFAULT 'main',
        quiet_hours_start TEXT DEFAULT '21:00',
        quiet_hours_end TEXT DEFAULT '06:30',
        meeting_reminder_mins INTEGER DEFAULT 30,
        visitor_reminder_days INTEGER DEFAULT 2,
        reception_group_chat_id TEXT,
        confirmed_group_chat_id TEXT,
        event_toggles_json TEXT,
        priority_config_json TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});
    await db.prepare('ALTER TABLE zalo_config ADD COLUMN confirmed_group_chat_id TEXT').run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS zalo_captured_groups (
        group_chat_id TEXT PRIMARY KEY,
        group_name TEXT,
        last_message TEXT,
        sender_name TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare('ALTER TABLE ci_kaizen_rate_limits ADD COLUMN site_code TEXT').run().catch(() => {});

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_key_created ON ci_kaizen_rate_limits(ip_emp_key, created_at DESC)
    `).run().catch(() => {});
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_site_created ON ci_kaizen_rate_limits(site_code, created_at DESC)
    `).run().catch(() => {});

    // Task Handover Schema Alterations (Fix #11)
    const taskHandoverCols = [
      "ALTER TABLE sys_my_tasks ADD COLUMN handover_status TEXT DEFAULT 'NONE'",
      "ALTER TABLE sys_my_tasks ADD COLUMN previous_department_id TEXT",
      "ALTER TABLE sys_my_tasks ADD COLUMN new_department_id TEXT",
      "ALTER TABLE sys_my_tasks ADD COLUMN handover_note TEXT",
      "ALTER TABLE sys_my_tasks ADD COLUMN handover_confirmed_by TEXT",
      "ALTER TABLE sys_my_tasks ADD COLUMN handover_confirmed_at DATETIME",
    ];
    for (const sql of taskHandoverCols) {
      await db.prepare(sql).run().catch(() => {});
    }

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_task_handover ON sys_my_tasks(handover_status, department_id, previous_department_id, new_department_id)
    `).run().catch(() => {});

    // Additional indexes for performance optimization
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_ci_kaizen_status ON ci_kaizen_proposals(status, sub_status)',
      'CREATE INDEX IF NOT EXISTS idx_ci_kaizen_factory ON ci_kaizen_proposals(factory, region)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON sys_notifications(emp_code, is_read, created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_role ON sys_notifications(target_role, is_read, created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_task_cards_assignee ON task_cards(assignee_id, status, deadline)',
      'CREATE INDEX IF NOT EXISTS idx_task_cards_board ON task_cards(board_id, list_id, sort_order)',
    ];
    
    for (const idxSql of indexes) {
      await db.prepare(idxSql).run().catch(() => {});
    }

    // Seed role_workspace_config for ALL 13 Roles if empty
    try {
      const countRes = await db.prepare('SELECT COUNT(*) as count FROM role_workspace_config').first();
      if (Number(countRes?.count || 0) === 0) {
        const seedRows = [
          // SUPER_ADMIN
          { role: 'SUPER_ADMIN', route: '/work/overview', label: 'Dashboard Đa Nhà Máy', icon: 'IconChartBar', sort: 1 },
          { role: 'SUPER_ADMIN', route: '/work/kaizen', label: 'Thư Viện Sáng Kiến Kaizen', icon: 'IconSparkles', sort: 2 },
          { role: 'SUPER_ADMIN', route: '/work/gemba', label: 'Quản Lý GEMBA Audit', icon: 'IconShieldCheck', sort: 3 },
          { role: 'SUPER_ADMIN', route: '/maintenance', label: 'Quản Lý Máy Móc Thiết Bị', icon: 'IconBuildingFactory', sort: 4 },
          { role: 'SUPER_ADMIN', route: '/work/tasks', label: 'Công Việc (TBS Work)', icon: 'IconList', sort: 5 },
          { role: 'SUPER_ADMIN', route: '/work/admin/workspace-config', label: 'Cấu Hình Workspace Role', icon: 'IconSettings', sort: 6 },
          { role: 'SUPER_ADMIN', route: '/admin/audit-logs', label: 'Audit Logs Hệ Thống', icon: 'IconHistory', sort: 7 },
          { role: 'SUPER_ADMIN', route: '/admin/backup', label: 'Quản Lý Sao Lưu Backup', icon: 'IconCloudUpload', sort: 8 },
          { role: 'SUPER_ADMIN', route: '/work/module-152', label: 'Hệ Thống Quản Trị 1-5-2', icon: 'IconLock', sort: 9 },

          // ADMIN
          { role: 'ADMIN', route: '/work/overview', label: 'Dashboard Đa Nhà Máy', icon: 'IconChartBar', sort: 1 },
          { role: 'ADMIN', route: '/work/kaizen', label: 'Thư Viện Sáng Kiến Kaizen', icon: 'IconSparkles', sort: 2 },
          { role: 'ADMIN', route: '/work/gemba', label: 'Quản Lý GEMBA Audit', icon: 'IconShieldCheck', sort: 3 },
          { role: 'ADMIN', route: '/maintenance', label: 'Quản Lý Máy Móc Thiết Bị', icon: 'IconBuildingFactory', sort: 4 },
          { role: 'ADMIN', route: '/work/tasks', label: 'Công Việc (TBS Work)', icon: 'IconList', sort: 5 },
          { role: 'ADMIN', route: '/work/admin/workspace-config', label: 'Cấu Hình Workspace Role', icon: 'IconSettings', sort: 6 },
          { role: 'ADMIN', route: '/admin/audit-logs', label: 'Audit Logs Hệ Thống', icon: 'IconHistory', sort: 7 },

          // TONG_GIAM_DOC
          { role: 'TONG_GIAM_DOC', route: '/work/overview', label: 'Dashboard Tổng Quan', icon: 'IconChartBar', sort: 1 },
          { role: 'TONG_GIAM_DOC', route: '/work/kaizen', label: 'Phê Duyệt Sáng Kiến Kaizen', icon: 'IconSparkles', sort: 2 },
          { role: 'TONG_GIAM_DOC', route: '/work/gemba', label: 'Báo Cáo GEMBA Exec', icon: 'IconShieldCheck', sort: 3 },
          { role: 'TONG_GIAM_DOC', route: '/work/tasks', label: 'Quản Lý Dự Án & Tasks', icon: 'IconList', sort: 4 },
          { role: 'TONG_GIAM_DOC', route: '/work/module-152', label: 'Hệ Thống Quản Trị 1-5-2', icon: 'IconLock', sort: 5 },

          // PHO_TONG_GIAM_DOC
          { role: 'PHO_TONG_GIAM_DOC', route: '/work/overview', label: 'Dashboard Tổng Quan', icon: 'IconChartBar', sort: 1 },
          { role: 'PHO_TONG_GIAM_DOC', route: '/work/kaizen', label: 'Phê Duyệt Sáng Kiến Kaizen', icon: 'IconSparkles', sort: 2 },
          { role: 'PHO_TONG_GIAM_DOC', route: '/work/gemba', label: 'Báo Cáo GEMBA Exec', icon: 'IconShieldCheck', sort: 3 },
          { role: 'PHO_TONG_GIAM_DOC', route: '/work/tasks', label: 'Quản Lý Dự Án & Tasks', icon: 'IconList', sort: 4 },
          { role: 'PHO_TONG_GIAM_DOC', route: '/work/module-152', label: 'Hệ Thống Quản Trị 1-5-2', icon: 'IconLock', sort: 5 },

          // GIAM_DOC
          { role: 'GIAM_DOC', route: '/work/overview', label: 'Dashboard Nhà Máy', icon: 'IconChartBar', sort: 1 },
          { role: 'GIAM_DOC', route: '/work/kaizen', label: 'Phê Duyệt Kaizen Phân Hệ', icon: 'IconSparkles', sort: 2 },
          { role: 'GIAM_DOC', route: '/work/gemba', label: 'Quản Lý GEMBA Phân Hệ', icon: 'IconShieldCheck', sort: 3 },
          { role: 'GIAM_DOC', route: '/work/tasks', label: 'Task Board Phân Hệ', icon: 'IconList', sort: 4 },
          { role: 'GIAM_DOC', route: '/work/module-152', label: 'Hệ Thống Quản Trị 1-5-2', icon: 'IconLock', sort: 5 },

          // PHO_GIAM_DOC
          { role: 'PHO_GIAM_DOC', route: '/work/overview', label: 'Dashboard Nhà Máy', icon: 'IconChartBar', sort: 1 },
          { role: 'PHO_GIAM_DOC', route: '/work/kaizen', label: 'Phê Duyệt Kaizen Phân Hệ', icon: 'IconSparkles', sort: 2 },
          { role: 'PHO_GIAM_DOC', route: '/work/gemba', label: 'Quản Lý GEMBA Phân Hệ', icon: 'IconShieldCheck', sort: 3 },
          { role: 'PHO_GIAM_DOC', route: '/work/tasks', label: 'Task Board Phân Hệ', icon: 'IconList', sort: 4 },
          { role: 'PHO_GIAM_DOC', route: '/work/module-152', label: 'Hệ Thống Quản Trị 1-5-2', icon: 'IconLock', sort: 5 },

          // TRUONG_PHONG
          { role: 'TRUONG_PHONG', route: '/work/kaizen', label: 'Sáng Kiến Phòng Ban', icon: 'IconSparkles', sort: 1 },
          { role: 'TRUONG_PHONG', route: '/work/gemba', label: 'Kiểm Tra GEMBA', icon: 'IconShieldCheck', sort: 2 },
          { role: 'TRUONG_PHONG', route: '/work/tasks', label: 'Task Board Phòng Ban', icon: 'IconList', sort: 3 },

          // IE
          { role: 'IE', route: '/work/kaizen/ie-queue', label: 'Hàng Chờ IE Xác Nhận', icon: 'IconCheck', sort: 1 },
          { role: 'IE', route: '/work/kaizen', label: 'Thư Viện Sáng Kiến', icon: 'IconSparkles', sort: 2 },
          { role: 'IE', route: '/work/tasks', label: 'Task Board Kỹ Thuật', icon: 'IconList', sort: 3 },

          // LE_TAN
          { role: 'LE_TAN', route: '/work/car-booking', label: 'Xếp Xe Công Tác', icon: 'IconCar', sort: 1 },
          { role: 'LE_TAN', route: '/work/payroll/me', label: 'Bảng Lương Cá Nhân', icon: 'IconReceipt', sort: 2 },
          { role: 'LE_TAN', route: '/work/leave-request', label: 'Xin Nghỉ Phép', icon: 'IconCalendar', sort: 3 },
          { role: 'LE_TAN', route: '/work/notifications', label: 'Thông Báo Văn Phòng', icon: 'IconBell', sort: 4 },

          // QC_MANAGER
          { role: 'QC_MANAGER', route: '/work/gemba', label: 'Kiểm Soát Chất Lượng GEMBA', icon: 'IconShieldCheck', sort: 1 },
          { role: 'QC_MANAGER', route: '/work/kaizen', label: 'Sáng Kiến Chất Lượng', icon: 'IconSparkles', sort: 2 },
          { role: 'QC_MANAGER', route: '/work/tasks', label: 'Task Board QC', icon: 'IconList', sort: 3 },
          { role: 'QC_MANAGER', route: '/maintenance', label: 'Thiết Bị Đo Lường', icon: 'IconBuildingFactory', sort: 4 },

          // KY_THUAT_VIEN
          { role: 'KY_THUAT_VIEN', route: '/maintenance', label: 'Bảo Trì Máy Móc Thiết Bị', icon: 'IconBuildingFactory', sort: 1 },
          { role: 'KY_THUAT_VIEN', route: '/work/tasks', label: 'Nhiệm Vụ Bảo Trì', icon: 'IconList', sort: 2 },
          { role: 'KY_THUAT_VIEN', route: '/work/kaizen', label: 'Đề Xuất Cải Tiến Kỹ Thuật', icon: 'IconSparkles', sort: 3 },

          // CBCNV & NHAN_VIEN
          { role: 'CBCNV', route: '/work/kaizen', label: 'Đăng Ký Sáng Kiến Kaizen', icon: 'IconSparkles', sort: 1 },
          { role: 'CBCNV', route: '/work/tasks', label: 'Công Việc Của Tôi', icon: 'IconList', sort: 2 },
          { role: 'CBCNV', route: '/work/payroll/me', label: 'Bảng Lương Của Tôi', icon: 'IconReceipt', sort: 3 },
          { role: 'CBCNV', route: '/work/leave-request', label: 'Xin Nghỉ Phép', icon: 'IconCalendar', sort: 4 },

          { role: 'NHAN_VIEN', route: '/work/kaizen', label: 'Đăng Ký Sáng Kiến Kaizen', icon: 'IconSparkles', sort: 1 },
          { role: 'NHAN_VIEN', route: '/work/tasks', label: 'Công Việc Của Tôi', icon: 'IconList', sort: 2 },
          { role: 'NHAN_VIEN', route: '/work/payroll/me', label: 'Bảng Lương Của Tôi', icon: 'IconReceipt', sort: 3 },
          { role: 'NHAN_VIEN', route: '/work/leave-request', label: 'Xin Nghỉ Phép', icon: 'IconCalendar', sort: 4 },

          // KE_TOAN
          { role: 'KE_TOAN', route: '/work/business-trip', label: 'Quyết Toán Công Tác', icon: 'IconReceipt', sort: 1 },
          { role: 'KE_TOAN', route: '/work/payroll/me', label: 'Bảng Lương Của Tôi', icon: 'IconReceipt', sort: 2 },

          // QUAN_LY_KHU_VUC
          { role: 'QUAN_LY_KHU_VUC', route: '/work/overview', label: 'Overview Đa Đơn Vị', icon: 'IconChartBar', sort: 1 },
          { role: 'QUAN_LY_KHU_VUC', route: '/work/kaizen', label: 'Sáng Kiến Đơn Vị', icon: 'IconSparkles', sort: 2 },
          { role: 'QUAN_LY_KHU_VUC', route: '/work/gemba', label: 'GEMBA Đơn Vị', icon: 'IconShieldCheck', sort: 3 },
          { role: 'QUAN_LY_KHU_VUC', route: '/maintenance', label: 'Thiết Bị Đơn Vị', icon: 'IconBuildingFactory', sort: 4 },
        ];

        for (const r of seedRows) {
          const id = `rwc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await db.prepare(
            'INSERT INTO role_workspace_config (id, role, route, label, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(id, r.role, r.route, r.label, r.icon, r.sort).run().catch(() => {});
        }
      }
    } catch (seedErr) {
      console.warn('[ensureKaizenSchema] Seed role_workspace_config warn:', seedErr);
    }

    // Seed IE Role Permissions if empty
    try {
      const ieRes = await db.prepare("SELECT COUNT(*) as count FROM role_permissions WHERE role = 'IE'").first();
      if (Number(ieRes?.count || 0) === 0) {
        await db.prepare(
          "INSERT INTO role_permissions (id, role, module, action) VALUES (?, 'IE', 'kaizen', 'confirm_time')"
        ).bind(`rp_${Date.now()}_1`).run().catch(() => {});
        await db.prepare(
          "INSERT INTO role_permissions (id, role, module, action) VALUES (?, 'IE', 'kaizen', 'approve_ie_step')"
        ).bind(`rp_${Date.now()}_2`).run().catch(() => {});
      }
    } catch (e) {}

    // BGK / Jury System Tables & Proposal Extended Columns
    const bgkProposalColumns = [
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN published_at DATETIME',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN is_score_flagged INTEGER DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN judge_final_score REAL DEFAULT 0.0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN c1_score_final REAL DEFAULT 0.0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN c3_score_final REAL DEFAULT 0.0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN is_opex_verified INTEGER DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN opex_verified_by TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN opex_verified_at DATETIME',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN is_disqualified INTEGER DEFAULT 0',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN disqualified_reason TEXT',
      'ALTER TABLE ci_kaizen_proposals ADD COLUMN disqualified_by TEXT',
    ];
    for (const sql of bgkProposalColumns) {
      await db.prepare(sql).run().catch(() => {});
    }

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_judging_rounds (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        region TEXT DEFAULT 'ALL',
        fiscal_year INTEGER DEFAULT 2026,
        nsld_unit_price REAL DEFAULT 50000,
        start_date DATETIME,
        end_date DATETIME,
        status TEXT DEFAULT 'ACTIVE',
        is_locked INTEGER DEFAULT 0,
        published_at DATETIME,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_criteria_config (
        id TEXT PRIMARY KEY,
        round_id TEXT NOT NULL,
        criterion_key TEXT NOT NULL,
        name TEXT NOT NULL,
        max_score REAL NOT NULL,
        brackets_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_judge_assignments (
        id TEXT PRIMARY KEY,
        round_id TEXT NOT NULL,
        judge_id TEXT NOT NULL,
        judge_name TEXT,
        submission_id TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        is_conflict INTEGER DEFAULT 0,
        conflict_reason TEXT,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_judge_guest_accounts (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email_phone TEXT NOT NULL,
        round_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME,
        is_revoked INTEGER DEFAULT 0,
        organization TEXT,
        contact_info TEXT,
        declaration_submitted INTEGER DEFAULT 0,
        no_conflict_declared INTEGER DEFAULT 0,
        dung_chung INTEGER DEFAULT 1,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    const guestCols = [
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN organization TEXT',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN contact_info TEXT',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN declaration_submitted INTEGER DEFAULT 0',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN no_conflict_declared INTEGER DEFAULT 0',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN username TEXT',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN one_time_passcode TEXT',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN dung_chung INTEGER DEFAULT 1',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN msnv TEXT',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN phone TEXT',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN email TEXT',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN position_unit TEXT',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN declaration_date DATETIME',
      'ALTER TABLE ci_kaizen_judge_guest_accounts ADD COLUMN created_at DATETIME',
      'ALTER TABLE ci_kaizen_scores ADD COLUMN guest_scoring_session_id TEXT',
      'ALTER TABLE ci_kaizen_scores ADD COLUMN nguoi_cham_thuc_ho_ten TEXT',
      'ALTER TABLE ci_kaizen_scores ADD COLUMN real_scorer_emp_code TEXT',
      'ALTER TABLE ci_kaizen_scores ADD COLUMN real_scorer_org TEXT',
      'ALTER TABLE ci_kaizen_scores ADD COLUMN real_scorer_phone TEXT',
      'ALTER TABLE ci_kaizen_scores ADD COLUMN real_scorer_email TEXT',
      'ALTER TABLE ci_kaizen_scores ADD COLUMN is_locked INTEGER DEFAULT 1',
      'ALTER TABLE ci_kaizen_score_audit_log ADD COLUMN nguoi_cham_thuc_ho_ten TEXT',
      'ALTER TABLE sys_audit_logs ADD COLUMN nguoi_cham_thuc_ho_ten TEXT',
      'ALTER TABLE ci_kaizen_guest_scoring_sessions ADD COLUMN nguoi_cham_thuc_msnv TEXT',
    ];
    for (const sql of guestCols) {
      await db.prepare(sql).run().catch(() => {});
    }

    await db.prepare('UPDATE ci_kaizen_scores SET is_locked = 1 WHERE is_locked IS NULL OR is_locked = 0').run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_guest_scoring_sessions (
        id TEXT PRIMARY KEY,
        judge_account_id TEXT NOT NULL,
        submission_id TEXT NOT NULL,
        nguoi_cham_thuc_ho_ten TEXT NOT NULL,
        nguoi_cham_thuc_sdt TEXT,
        nguoi_cham_thuc_email TEXT,
        thoi_diem_bat_dau DATETIME DEFAULT CURRENT_TIMESTAMP,
        thoi_diem_gui DATETIME,
        ip_thiet_bi TEXT,
        da_gui INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_prerequisite_checks (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        round_id TEXT,
        p1_pass INTEGER DEFAULT 1,
        p2_pass INTEGER DEFAULT 1,
        p3_pass INTEGER DEFAULT 1,
        p4_pass INTEGER DEFAULT 1,
        is_all_pass INTEGER DEFAULT 1,
        checked_by TEXT NOT NULL,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_scores (
        id TEXT PRIMARY KEY,
        round_id TEXT NOT NULL,
        submission_id TEXT NOT NULL,
        judge_id TEXT NOT NULL,
        judge_name TEXT,
        c1_group TEXT DEFAULT 'GROUP1',
        c1_score REAL DEFAULT 0,
        c2_score REAL DEFAULT 0,
        c3_score REAL DEFAULT 0,
        c4_score REAL DEFAULT 0,
        c5_score REAL DEFAULT 0,
        total_score REAL DEFAULT 0,
        c1_basis TEXT,
        c2_basis TEXT,
        c3_basis TEXT,
        c4_basis TEXT,
        c5_basis TEXT,
        is_verified_data INTEGER DEFAULT 1,
        is_locked INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_score_flags (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        round_id TEXT NOT NULL,
        flag_type TEXT NOT NULL,
        flag_message TEXT NOT NULL,
        is_resolved INTEGER DEFAULT 0,
        resolved_by TEXT,
        resolution_note TEXT,
        resolved_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_judge_whitelist_msnv (
        id TEXT PRIMARY KEY,
        emp_code TEXT UNIQUE NOT NULL,
        emp_name TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_classification_group_map (
        id TEXT PRIMARY KEY,
        phan_loai TEXT UNIQUE NOT NULL,
        nhom_barem TEXT,
        tu_dong INTEGER DEFAULT 1,
        ghi_chu TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_score_audit_log (
        id TEXT PRIMARY KEY,
        judge_account_id TEXT,
        submission_id TEXT,
        hanh_dong TEXT,
        gia_tri_truoc TEXT,
        gia_tri_sau TEXT,
        thoi_gian DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_thiet_bi TEXT
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_scoring_criteria (
        id TEXT PRIMARY KEY,
        ten_tieu_chi TEXT NOT NULL,
        diem_toi_da REAL NOT NULL,
        thu_tu_hien_thi INTEGER NOT NULL,
        loai_thang TEXT DEFAULT 'co_dinh'
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_scoring_bands (
        id TEXT PRIMARY KEY,
        criteria_id TEXT NOT NULL,
        hang_muc_ap_dung TEXT,
        diem REAL NOT NULL,
        mo_ta_ngan TEXT NOT NULL
      )
    `).run().catch(() => {});

    // Seed MSNV whitelist
    try {
      const seedMsnv = [
        { code: "202608001", name: "Phạm Nguyễn Anh Huy" },
        { code: "202608010", name: "Lê Khải" },
        { code: "222102020", name: "Dư Thị Thanh Tình" },
        { code: "202608002", name: "Trần Ngọc Huy" },
        { code: "202112003", name: "Cán Bộ IE / Bảo Trì" },
      ];
      for (const m of seedMsnv) {
        await db.prepare(
          "INSERT OR IGNORE INTO ci_kaizen_judge_whitelist_msnv (id, emp_code, emp_name, created_by) VALUES (?, ?, ?, 'SYSTEM_SEED')"
        ).bind(`wh_${m.code}`, m.code, m.name).run().catch(() => {});
      }
    } catch (e) {}

    // Seed classification group map (Phase 1)
    try {
      const classMapSeed = [
        { pl: "Tiết kiệm Vật tư", nhom: "Nhóm 2", auto: 1, note: "Khớp trực tiếp" },
        { pl: "Tiết kiệm Chi phí", nhom: "Nhóm 2", auto: 1, note: "Cùng công thức với Vật tư" },
        { pl: "Tăng Năng suất", nhom: "Nhóm 1", auto: 1, note: "Khớp trực tiếp" },
        { pl: "An toàn lao động", nhom: "Nhóm 3", auto: 1, note: "Khớp trực tiếp" },
        { pl: "5S", nhom: "Nhóm 1", auto: 1, note: "Giả định Nhóm 1 - Cần Ban 2.2 xác nhận lại" },
        { pl: "Tự động hoá", nhom: "Nhóm 1", auto: 1, note: "Tương tự tăng năng suất" },
        { pl: "MMTB CCDC", nhom: "Nhóm 1", auto: 1, note: "Tương tự thiết bị công nghệ" },
        { pl: "Khác", nhom: null, auto: 0, note: "Hiện 3 nút chọn Nhóm thủ công + bắt buộc ghi rõ lý do vào ô minh chứng" },
      ];
      for (const c of classMapSeed) {
        await db.prepare(
          "INSERT OR IGNORE INTO ci_kaizen_classification_group_map (id, phan_loai, nhom_barem, tu_dong, ghi_chu) VALUES (?, ?, ?, ?, ?)"
        ).bind(`cmap_${Date.now()}_${Math.random().toString(36).substring(2,6)}`, c.pl, c.nhom, c.auto, c.note).run().catch(() => {});
      }
    } catch (e) {}

    // Seed Scoring Criteria & Bands
    try {
      const criteriaSeed = [
        { id: "c1", name: "1. Hiệu quả thực tế đạt được", max: 35, order: 1, loai: "dong_theo_hang_muc" },
        { id: "c2", name: "2. Tính khả thi & hiệu quả đầu tư", max: 20, order: 2, loai: "co_dinh" },
        { id: "c3", name: "3. Khả năng nhân rộng", max: 20, order: 3, loai: "co_dinh" },
        { id: "c4", name: "4. Tính sáng tạo & chủ động", max: 15, order: 4, loai: "co_dinh" },
        { id: "c5", name: "5. Lan tỏa & tinh thần đội nhóm", max: 10, order: 5, loai: "co_dinh" },
      ];
      for (const cr of criteriaSeed) {
        await db.prepare(
          "INSERT OR IGNORE INTO ci_kaizen_scoring_criteria (id, ten_tieu_chi, diem_toi_da, thu_tu_hien_thi, loai_thang) VALUES (?, ?, ?, ?, ?)"
        ).bind(cr.id, cr.name, cr.max, cr.order, cr.loai).run().catch(() => {});
      }

      const bandsSeed = [
        // Criteria 2
        { id: "b2_0", cid: "c2", hang: null, pts: 0, desc: "0đ: Không khả thi / Chi phí đầu tư vượt xa hiệu quả thu hồi" },
        { id: "b2_5", cid: "c2", hang: null, pts: 5, desc: "5đ: Khả thi thấp / Thời gian hoàn vốn > 2 năm" },
        { id: "b2_10", cid: "c2", hang: null, pts: 10, desc: "10đ: Khả thi trung bình / Thời gian hoàn vốn 1 - 2 năm" },
        { id: "b2_15", cid: "c2", hang: null, pts: 15, desc: "15đ: Khả thi cao / Thời gian hoàn vốn 6 tháng - 1 năm" },
        { id: "b2_20", cid: "c2", hang: null, pts: 20, desc: "20đ: Rất khả thi / Hoàn vốn < 6 tháng hoặc không tốn chi phí đầu tư" },

        // Criteria 3
        { id: "b3_0", cid: "c3", hang: null, pts: 0, desc: "0đ: Không thể nhân rộng (chỉ áp dụng duy nhất 1 vị trí/chuyền)" },
        { id: "b3_5", cid: "c3", hang: null, pts: 5, desc: "5đ: Nhân rộng cấp Tổ/Chuyền (2 - 3 chuyền tương tự)" },
        { id: "b3_10", cid: "c3", hang: null, pts: 10, desc: "10đ: Nhân rộng toàn Xưởng (4 - 10 chuyền/khu vực)" },
        { id: "b3_15", cid: "c3", hang: null, pts: 15, desc: "15đ: Nhân rộng toàn Nhà máy (tất cả xưởng thuộc NM)" },
        { id: "b3_20", cid: "c3", hang: null, pts: 20, desc: "20đ: Nhân rộng toàn Tập đoàn/Chuỗi (áp dụng cho tất cả NM & Văn phòng)" },

        // Criteria 4
        { id: "b4_0", cid: "c4", hang: null, pts: 0, desc: "0đ: Sao chép hoàn toàn giải pháp có sẵn không có cải tiến" },
        { id: "b4_3", cid: "c4", hang: null, pts: 3, desc: "3đ: Áp dụng giải pháp quen thuộc với tinh chỉnh nhỏ" },
        { id: "b4_7", cid: "c4", hang: null, pts: 7, desc: "7đ: Giải pháp có cải tiến sáng tạo tự nghiên cứu" },
        { id: "b4_11", cid: "c4", hang: null, pts: 11, desc: "11đ: Giải pháp mới áp dụng lần đầu tại Nhà máy" },
        { id: "b4_15", cid: "c4", hang: null, pts: 15, desc: "15đ: Giải pháp đột phá/Sáng chế mới lần đầu áp dụng tại Tập đoàn" },

        // Criteria 5
        { id: "b5_0", cid: "c5", hang: null, pts: 0, desc: "0đ: Cá nhân tự làm, không chia sẻ/lan tỏa" },
        { id: "b5_2", cid: "c5", hang: null, pts: 2, desc: "2đ: Nhóm 2 người, lan tỏa trong tổ" },
        { id: "b5_5", cid: "c5", hang: null, pts: 5, desc: "5đ: Phối hợp liên tổ/bộ phận (3-5 người)" },
        { id: "b5_8", cid: "c5", hang: null, pts: 8, desc: "8đ: Phối hợp liên phòng ban/xưởng (6-10 người)" },
        { id: "b5_10", cid: "c5", hang: null, pts: 10, desc: "10đ: Phong trào thi đua cấp Nhà máy/Tập đoàn (>10 người tham gia)" },
      ];
      for (const bd of bandsSeed) {
        await db.prepare(
          "INSERT OR IGNORE INTO ci_kaizen_scoring_bands (id, criteria_id, hang_muc_ap_dung, diem, mo_ta_ngan) VALUES (?, ?, ?, ?, ?)"
        ).bind(bd.id, bd.cid, bd.hang, bd.pts, bd.desc).run().catch(() => {});
      }
    } catch (e) {}

    // D1 CI Kaizen Judge Guest Accounts Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ci_kaizen_judge_guest_accounts (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        one_time_passcode TEXT NOT NULL,
        full_name TEXT,
        email_phone TEXT,
        organization TEXT,
        contact_info TEXT,
        round_id TEXT NOT NULL,
        token_hash TEXT,
        expires_at DATETIME NOT NULL,
        used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        is_revoked INTEGER DEFAULT 0,
        dung_chung INTEGER DEFAULT 1,
        declaration_submitted INTEGER DEFAULT 0
      )
    `).run().catch(() => {});

    isSchemaMigrated = true;
  } catch (err) {
    console.error("[ensureKaizenSchema] Migration error:", err);
  }
}

