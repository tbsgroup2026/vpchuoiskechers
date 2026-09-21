let isSchemaMigrated = false;

export async function ensureKaizenSchema(db: any, force = false) {
  if (!db) return;
  if (isSchemaMigrated && !force) return;

  try {
    const columns = [
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
    ];

    for (const sql of columns) {
      await db.prepare(sql).run().catch(() => {});
    }

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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

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

    isSchemaMigrated = true;
  } catch (err) {
    console.error("[ensureKaizenSchema] Migration error:", err);
  }
}

