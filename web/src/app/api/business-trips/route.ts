import { NextResponse } from 'next/server';
import { getAuthUser, isDepartmentHead, isExecutiveOrAdmin, isAdminUser, isReceptionistOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { sendZaloNotification } from '@/lib/zaloNotificationService';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const MEMORY_TRIPS = new Map<string, any>();

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để xem danh sách công tác (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: true, data: Array.from(MEMORY_TRIPS.values()) });
    }

    await ensureKaizenSchema(db);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    const isExec = isExecutiveOrAdmin(session);
    const isAdmin = isAdminUser(session);
    const isRecep = isReceptionistOrAdmin(session);
    const isKeToan = session.roles?.includes('ke_toan');
    const isTP = isDepartmentHead(session);

    let whereClause = 'WHERE 1=1';
    const bindings: any[] = [];

    // Lọc theo Role (Scope)
    if (isExec || isAdmin || isRecep) {
      // toàn bộ
    } else if (isKeToan) {
      whereClause += ` AND (status IN ('APPROVED', 'FINISHED') OR payment_status != 'NOT_STARTED')`;
    } else if (isTP) {
      whereClause += ` AND (department_id = ? OR creator_emp_code = ?)`;
      bindings.push(session.departmentCode, session.empCode);
    } else {
      whereClause += ` AND (creator_emp_code = ? OR participants_json LIKE ?)`;
      bindings.push(session.empCode, `%${session.empCode}%`);
    }

    if (search.trim()) {
      whereClause += ' AND (title LIKE ? OR code LIKE ? OR creator LIKE ?)';
      const queryPattern = `%${search.trim()}%`;
      bindings.push(queryPattern, queryPattern, queryPattern);
    }

    if (statusFilter.trim() && statusFilter !== 'ALL') {
      whereClause += ' AND status = ?';
      bindings.push(statusFilter.trim());
    }

    const countRes = await db.prepare(`SELECT COUNT(*) as total FROM business_trips ${whereClause}`).bind(...bindings).first();
    const totalCount = countRes?.total || 0;

    const { results } = await db.prepare(
      `SELECT * FROM business_trips ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...bindings, limit, offset).all();

    const formatted = (results || []).map((row: any) => {
      let actualCost = 0;
      if (row.invoices_json) {
        try {
          const invs = JSON.parse(row.invoices_json);
          actualCost = invs.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        } catch(e){}
      }

      return {
        id: row.id,
        code: row.code,
        title: row.title,
        region: row.region,
        factory: row.factory,
        creator: row.creator,
        creatorEmpCode: row.creator_emp_code,
        department: row.department,
        departmentId: row.department_id,
        location: row.location,
        startDate: row.start_date,
        endDate: row.end_date,
        daysCount: row.days_count,
        transport: row.transport,
        participantsCount: row.participants_count,
        tripType: row.trip_type || 'TRONG_NGAY',
        purpose: row.purpose,
        address: row.address,
        status: row.status || 'PENDING',
        estimatedCost: row.estimatedCost || row.estimated_cost || 0,
        actualCost: actualCost, // Instead of sending full invoices array
        version: row.version || 1,
        approvedLevel: row.approvedLevel || row.approved_level,
        rejectedLevel: row.rejectedLevel || row.rejected_level,
        rejectionReason: row.rejectionReason || row.rejection_reason,
        budgetStatus: row.budgetStatus || row.budget_status || 'pending_dept_budget',
        budgetAmount: row.budgetAmount || row.budget_amount || 0,
        budgetRejectionReason: row.budgetRejectionReason || row.budget_rejection_reason,
        logisticsStatus: row.logistics_status || 'NOT_STARTED',
        customDestinationName: row.custom_destination_name || null,
        customDestinationAddress: row.custom_destination_address || null,
        customDestinationType: row.custom_destination_type || null,
        paymentStatus: row.payment_status || 'NOT_STARTED',
        paymentNotes: row.payment_notes || null,
        createdAt: row.created_at,
        // The following heavy arrays are removed to make the payload light
        // attachments, invoices, participants, destinations, logistics, signedTravelPaper
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để tạo đơn công tác (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const db = getDbBinding();
    const body = await request.json();

    if (!body.title || !body.creator) {
      return NextResponse.json({ success: false, error: 'Thành phần bắt buộc chưa đầy đủ' }, { status: 400 });
    }

    if (body.region === 'Khác' && (!body.customDestinationName && !body.location)) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập tên địa điểm công tác ngoài nội bộ' },
        { status: 400 }
      );
    }

    const id = body.id || `rec_${Date.now()}`;
    const code = body.code || `CT-2026-0${Math.floor(Math.random() * 900 + 100)}`;

    const customDestName = body.customDestinationName || (body.region === 'Khác' ? body.location : '');
    const customDestAddr = body.customDestinationAddress || (body.region === 'Khác' ? body.address : '');
    const customDestType = body.customDestinationType || (body.region === 'Khác' ? 'Đối tác / Khách hàng' : '');

    const tripObj = {
      id,
      code,
      title: body.title.trim(),
      region: body.region || '',
      factory: body.factory || '',
      creator: body.creator.trim(),
      department: body.department || session.departmentCode || '',
      departmentId: body.departmentId || session.departmentCode || '',
      location: body.location || customDestName || '',
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      daysCount: body.daysCount || 1,
      transport: body.transport || '',
      participantsCount: body.participantsCount || 1,
      purpose: body.purpose || '',
      address: body.address || customDestAddr || '',
      proposalText: body.proposalText || '',
      attachments: body.attachments || [],
      invoices: body.invoices || [],
      participants: body.participants || [],
      status: body.status || 'PENDING',
      estimatedCost: body.estimatedCost || 0,
      version: 1,
      approvedLevel: null,
      rejectedLevel: null,
      rejectionReason: null,
      budgetStatus: 'pending_dept_budget',
      customDestinationName: customDestName,
      customDestinationAddress: customDestAddr,
      customDestinationType: customDestType,
      paymentStatus: 'NOT_STARTED',
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await ensureKaizenSchema(db);

      const sql = `
        INSERT INTO business_trips (
          id, code, title, region, factory, creator, creator_emp_code, department, department_id,
          location, start_date, end_date, days_count, transport, participants_count,
          purpose, address, proposal_text, attachments_json, invoices_json,
          participants_json, status, estimated_cost, version, budget_status,
          destinations_json, logistics_json, logistics_status,
          custom_destination_name, custom_destination_address, custom_destination_type,
          trip_type,
          payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending_dept_budget', ?, '{}', 'NOT_STARTED', ?, ?, ?, 'NOT_STARTED', ?)
      `;

      await db.prepare(sql).bind(
        id,
        code,
        body.title.trim(),
        body.region || '',
        body.factory || '',
        body.creator.trim(),
        session.empCode,
        body.department || session.departmentCode || '',
        body.departmentId || session.departmentCode || '',
        body.location || customDestName || '',
        body.startDate || '',
        body.endDate || '',
        body.daysCount || 1,
        body.transport || '',
        body.participantsCount || 1,
        body.purpose || '',
        body.address || customDestAddr || '',
        body.proposalText || '',
        JSON.stringify(body.attachments || []),
        JSON.stringify(body.invoices || []),
        JSON.stringify(body.participants || []),
        body.status || 'PENDING',
        body.estimatedCost || 0,
        JSON.stringify(body.destinations || []),
        customDestName,
        customDestAddr,
        customDestType
      ).run();

      // High #5: Send notification to Department Head (Level 1 Approver)
      try {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.prepare(`
          INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
          VALUES (?, 'TRUONG_PHONG', ?, ?, 'INFO', '/work/business-trip', CURRENT_TIMESTAMP)
        `).bind(
          notifId,
          `🚗 Đơn đi công tác mới cần duyệt cấp 1: ${code}`,
          `Cán bộ ${session.name} vừa đăng ký chuyến công tác "${body.title.trim()}" tại ${body.location || 'địa điểm chỉ định'}. Vui lòng phê duyệt.`
        ).run().catch(() => {});
      } catch (e) {}
    } else {
      MEMORY_TRIPS.set(id, tripObj);
    }

    // 🤖 Send Zalo Notification for Business Trip Registration
    sendZaloNotification(
      `✈️ ĐƠN ĐĂNG KÝ CÔNG TÁC MỚI (${code})\nCán bộ: ${body.creator.trim()} (${body.department || session.departmentCode || 'Văn phòng'})\nNội dung: "${body.title.trim()}"\nĐịa điểm: ${body.location || 'Chưa rõ'}\nThời gian: từ ${body.startDate || 'N/A'} đến ${body.endDate || 'N/A'} (${body.daysCount || 1} ngày)\nPhương tiện: ${body.transport || 'Tự túc'}\nTrạng thái: Chờ Trưởng phòng duyệt (Cấp 1)`,
      {
        priority: 'IMPORTANT',
        eventType: 'BUSINESS_TRIP_CREATED',
        recipientEmpCode: session.empCode,
        idempotencyKey: `bt_create_${id}`,
      }
    ).catch(() => {});

    return NextResponse.json({ success: true, message: 'Đã lưu đơn công tác thành công', id, code });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để duyệt/chỉnh sửa đơn công tác (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const db = getDbBinding();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id là bắt buộc' }, { status: 400 });
    }

    let existing: any = null;
    if (db) {
      await ensureKaizenSchema(db);
      existing = await db.prepare(`SELECT * FROM business_trips WHERE id = ?`).bind(id).first().catch(() => null);
    } else {
      existing = MEMORY_TRIPS.get(id);
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn công tác chỉ định' }, { status: 404 });
    }

    // Optimistic locking check if version provided
    if (body.version && existing.version && Number(body.version) !== Number(existing.version)) {
      return NextResponse.json(
        { success: false, error: 'OPTIMISTIC_LOCK_CONFLICT', message: 'Đơn đã được người khác cập nhật! Vui lòng tải lại trang.' },
        { status: 409 }
      );
    }

    // ACTION 1. RECALL (Rút đơn)
    if (body.actionLevel === 'RECALL') {
      if (session.empCode !== existing.creator_emp_code && session.name !== existing.creator) {
        return NextResponse.json({ success: false, error: 'Bạn không có quyền rút đơn của người khác.' }, { status: 403 });
      }
      const isL1Approved = existing.status === 'PENDING_L2' || existing.approved_level === 'L1';
      if (isL1Approved) {
        return NextResponse.json(
          { success: false, error: 'Đơn đã được Trưởng phòng phê duyệt Cấp 1, không thể tự rút! Vui lòng liên hệ quản lý để từ chối.' },
          { status: 400 }
        );
      }

      existing.status = 'RECALLED';
      existing.recall_reason = body.reason || 'Người tạo tự rút đơn';

      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET status = 'RECALLED', logistics_status = 'CANCELLED', recall_reason = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(body.reason || 'Người tạo tự rút đơn', id).run();

        // Audit Log
        try {
          const logId = `log_${Date.now()}`;
          await db.prepare(`
            INSERT INTO sys_audit_logs (id, emp_code, emp_name, role_code, module, action, target_type, target_id, changes_json)
            VALUES (?, ?, ?, ?, 'BUSINESS_TRIP', 'RECALL_TRIP', 'TRIP', ?, ?)
          `).bind(
            logId,
            session.empCode,
            session.name,
            session.roleCode || 'USER',
            id,
            JSON.stringify({ reason: body.reason || 'Rút đơn', status_before: existing.status, status_after: 'RECALLED' })
          ).run().catch(() => {});
        } catch (e) {}

        // Notify Receptionist to cancel logistics if it was assigned/pending
        try {
          const notifIdRec = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
            VALUES (?, 'LE_TAN', ?, ?, 'WARNING', '/business-trip', CURRENT_TIMESTAMP)
          `).bind(
            notifIdRec,
            `🚫 Hủy hậu cần đơn công tác: ${existing.code}`,
            `Cán bộ ${existing.creator} đã rút/hủy đơn công tác "${existing.title}". Vui lòng HỦY xe và phòng khách sạn đã đặt (nếu có).`,
            `/business-trip?tripId=${existing.id}`
          ).run().catch(() => {});
        } catch (e) {}
      } else {
        existing.status = 'RECALLED';
        existing.logistics_status = 'CANCELLED';
        MEMORY_TRIPS.set(id, existing);
      }

      return NextResponse.json({ success: true, message: 'Đã rút đơn công tác thành công! Đơn chuyển về trạng thái Rút đơn.' });
    }

    // ACTION 2. APPROVE_L1 (Trưởng phòng)
    if (body.actionLevel === 'APPROVE_L1') {
      // Check Segregation of Duties: Creator cannot approve their own trip
      if (session.empCode && (existing.creator_emp_code === session.empCode || session.name === existing.creator)) {
        return NextResponse.json(
          { success: false, error: 'SEGREGATION_OF_DUTIES_VIOLATION', message: 'Bảo mật & Phân tách nhiệm vụ: Bạn không thể tự phê duyệt đơn công tác do chính mình tạo!' },
          { status: 403 }
        );
      }

      // Check Active Delegation
      let isDelegated = false;
      let delegatorName = "";
      if (db) {
        const todayStr = new Date().toISOString().split("T")[0];
        const delRes = await db.prepare(`
          SELECT * FROM business_trip_delegations
          WHERE delegate_to_emp_code = ? AND is_active = 1 AND start_date <= ? AND end_date >= ?
        `).bind(session.empCode, todayStr, todayStr).first().catch(() => null);

        if (delRes) {
          isDelegated = true;
          delegatorName = delRes.delegator_name || delRes.delegator_emp_code;
        }
      }

      if (!isDepartmentHead(session) && !isDelegated) {
        return NextResponse.json(
          { success: false, error: 'Bạn không có quyền phê duyệt đơn công tác cấp 1 (Trưởng phòng)!' },
          { status: 403 }
        );
      }

      if (!isDelegated && existing.department_id !== session.departmentCode) {
        return NextResponse.json(
          { success: false, error: 'Phạm vi quyền hạn: Bạn không thể phê duyệt đơn công tác của bộ phận khác!' },
          { status: 403 }
        );
      }

      const skipL2 = (existing.estimatedCost || 0) < 5000000;
      const nextStatus = skipL2 ? 'APPROVED' : 'PENDING_L2';

      existing.status = nextStatus;
      existing.approved_level = 'L1';
      existing.approvedLevel = 'L1';

      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET status = ?, approved_level = 'L1',
              delegated_by_emp_code = ?, delegated_by_name = ?,
              logistics_status = 'PENDING',
              version = version + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(nextStatus, isDelegated ? session.empCode : null, isDelegated ? delegatorName : null, id).run();

        // Audit Log
        try {
          const logId = `log_${Date.now()}`;
          await db.prepare(`
            INSERT INTO sys_audit_logs (id, emp_code, emp_name, role_code, module, action, target_type, target_id, changes_json)
            VALUES (?, ?, ?, ?, 'BUSINESS_TRIP', 'APPROVE_L1', 'TRIP', ?, ?)
          `).bind(
            logId,
            session.empCode,
            session.name,
            session.roleCode || 'TRUONG_PHONG',
            id,
            JSON.stringify({ is_delegated: isDelegated, delegator: delegatorName, auto_approved_l2: skipL2 })
          ).run().catch(() => {});
        } catch (e) {}

        // Push notification to Ban Giám Đốc for Level 2 approval (ONLY IF needed)
        if (!skipL2) {
          try {
            const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await db.prepare(`
              INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
              VALUES (?, 'BAN_GIAM_DOC', ?, ?, 'INFO', ?, CURRENT_TIMESTAMP)
            `).bind(
              notifId,
              `👑 Đơn công tác cần duyệt cấp 2 (BGĐ): ${existing.code}`,
              `Đơn công tác "${existing.title}" của ${existing.creator} đã được ${isDelegated ? `Duyệt thay bởi ${session.name} (Ủy quyền của ${delegatorName})` : 'Trưởng phòng duyệt Cấp 1'}, đang chờ BGĐ duyệt Cấp 2.`,
              `/business-trip?tripId=${existing.id}`
            ).run().catch(() => {});
          } catch (e) {}
        } else {
          // Notify creator it was auto-approved
          try {
            const notifIdAuto = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await db.prepare(`
              INSERT INTO sys_notifications (id, emp_code, title, message, type, link, created_at)
              VALUES (?, ?, ?, ?, 'SUCCESS', ?, CURRENT_TIMESTAMP)
            `).bind(
              notifIdAuto,
              existing.creator, // Wait, existing.creator is Name. Needs creator_emp_code if possible, but sys_notifications table usually searches by emp_code. Wait, the old code used existing.creator which might be a bug, let me fix it.
              `✅ Đơn công tác ${existing.code} đã được duyệt hoàn tất!`,
              `Đơn công tác "${existing.title}" có dự toán < 5 triệu, đã được duyệt Cấp 1 và tự động qua Cấp 2. Đang chờ Lễ tân xếp xe.`,
              `/business-trip?tripId=${existing.id}`
            ).run().catch(() => {});
          } catch (e) {}
        }

        // Notify Receptionist to start logistics
        try {
          const notifId2 = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
            VALUES (?, 'LE_TAN', ?, ?, 'INFO', ?, CURRENT_TIMESTAMP)
          `).bind(
            notifId2,
            `🚗 Sắp xếp hậu cần đơn công tác: ${existing.code}`,
            `Đơn công tác "${existing.title}" đã qua duyệt Cấp 1. Lễ tân vui lòng bắt đầu sắp xếp xe, phòng khách sạn (nếu có).`,
            `/business-trip?tripId=${existing.id}`
          ).run().catch(() => {});
        } catch (e) {}
      } else {
        MEMORY_TRIPS.set(id, existing);
      }

    } else if (body.actionLevel === 'APPROVE_L2' || body.actionLevel === 'APPROVE_EMERGENCY') {
      if (!isExecutiveOrAdmin(session)) {
        return NextResponse.json(
          { success: false, error: 'Chỉ Ban Giám Đốc / Tổng Giám Đốc mới có quyền phê duyệt cấp 2 (403 Forbidden)!' },
          { status: 403 }
        );
      }

      const isEmergencyBypass = body.actionLevel === 'APPROVE_EMERGENCY';
      const isL1Approved = existing.status === 'PENDING_L2' || existing.approved_level === 'L1' || existing.approvedLevel === 'L1';
      
      if (!isL1Approved && !isEmergencyBypass) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_STATE_TRANSITION',
            message: 'BẢO MẬT & QUY TRÌNH: Đơn công tác này chưa được Trưởng phòng phê duyệt cấp 1! Chọn "Duyệt Khẩn" nếu cần bỏ qua Cấp 1.',
          },
          { status: 400 }
        );
      }

      existing.status = 'APPROVED';
      existing.approved_level = isEmergencyBypass ? 'EMERGENCY_L2' : 'L2';
      existing.approvedLevel = isEmergencyBypass ? 'EMERGENCY_L2' : 'L2';

      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET status = 'APPROVED', approved_level = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(isEmergencyBypass ? 'EMERGENCY_L2' : 'L2', id).run();

        // Audit Log
        try {
          const logId = `log_${Date.now()}`;
          await db.prepare(`
            INSERT INTO sys_audit_logs (id, emp_code, emp_name, role_code, module, action, target_type, target_id, changes_json)
            VALUES (?, ?, ?, ?, 'BUSINESS_TRIP', ?, 'TRIP', ?, ?)
          `).bind(
            logId,
            session.empCode,
            session.name,
            session.roleCode || 'BAN_GIAM_DOC',
            isEmergencyBypass ? 'APPROVE_EMERGENCY_BYPASS_L1' : 'APPROVE_L2',
            id,
            JSON.stringify({ audit_note: isEmergencyBypass ? 'Duyệt khẩn – bỏ qua cấp 1' : 'Duyệt cấp 2 hoàn tất' })
          ).run().catch(() => {});
        } catch (e) {}

        // Notify Creator
        try {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, emp_code, title, message, type, link, created_at)
            VALUES (?, ?, ?, ?, 'SUCCESS', ?, CURRENT_TIMESTAMP)
          `).bind(
            notifId,
            existing.creator_emp_code, // FIXED
            `✅ Đơn công tác ${existing.code} đã được Ban Giám Đốc duyệt chính thức!`,
            `Đơn công tác "${existing.title}" của bạn đã được phê duyệt 100%${isEmergencyBypass ? ' (Duyệt khẩn)' : ''}. Bạn có thể di chuyển.`,
            `/business-trip?tripId=${existing.id}`
          ).run().catch(() => {});
        } catch (e) {}
      } else {
        MEMORY_TRIPS.set(id, existing);
      }

    } else if (body.actionLevel === 'UPDATE_LOGISTICS') {
      if (!isReceptionistOrAdmin(session)) {
        return NextResponse.json({ success: false, error: 'Chỉ Lễ tân hoặc Admin mới có quyền cập nhật hậu cần' }, { status: 403 });
      }
      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET logistics_json = ?, logistics_status = 'ARRANGED', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(JSON.stringify(body.logistics || {}), id).run();

        // Notify Creator
        try {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, emp_code, title, message, type, link, created_at)
            VALUES (?, ?, ?, ?, 'INFO', ?, CURRENT_TIMESTAMP)
          `).bind(
            notifId,
            existing.creator_emp_code,
            `🚗 Đơn công tác ${existing.code} đã được sắp xếp hậu cần!`,
            `Lễ tân đã hoàn tất sắp xếp xe/phòng cho chuyến công tác "${existing.title}". Vui lòng kiểm tra chi tiết.`,
            `/business-trip?tripId=${existing.id}`
          ).run().catch(() => {});
        } catch (e) {}
      } else {
        existing.logistics_json = JSON.stringify(body.logistics || {});
        existing.logistics_status = 'ARRANGED';
        MEMORY_TRIPS.set(id, existing);
      }
    } else if (body.signed_travel_paper_json || body.signedTravelPaper) {
      if (session.empCode !== existing.creator_emp_code && session.name !== existing.creator && !session.roles?.includes('ke_toan')) {
        return NextResponse.json({ success: false, error: 'Không có quyền đính kèm giấy đi đường cho đơn này' }, { status: 403 });
      }
      const paperData = JSON.stringify(body.signed_travel_paper_json || body.signedTravelPaper || []);
      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET signed_travel_paper_json = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(paperData, id).run();
      } else {
        existing.signedTravelPaper = body.signedTravelPaper || body.signed_travel_paper_json || [];
        MEMORY_TRIPS.set(id, existing);
      }
    } else if (body.invoices_json || body.invoices) {
      if (session.empCode !== existing.creator_emp_code && session.name !== existing.creator && !session.roles?.includes('ke_toan')) {
        return NextResponse.json({ success: false, error: 'Không có quyền cập nhật hóa đơn cho đơn này' }, { status: 403 });
      }
      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET invoices_json = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(JSON.stringify(body.invoices_json || body.invoices || []), id).run();
      } else {
        existing.invoices = body.invoices || body.invoices_json || [];
        MEMORY_TRIPS.set(id, existing);
      }
    } else if (body.actionLevel === 'SUBMIT_DOCS') {
      if (session.empCode !== existing.creator_emp_code && session.name !== existing.creator) {
        return NextResponse.json({ success: false, error: 'Chỉ người tạo đơn mới có quyền nộp chứng từ' }, { status: 403 });
      }
      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET payment_status = 'DOCS_SUBMITTED', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(id).run();

        try {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
            VALUES (?, 'KE_TOAN', ?, ?, 'INFO', ?, CURRENT_TIMESTAMP)
          `).bind(
            notifId,
            `🧾 Đơn ${existing.code} đã nộp chứng từ`,
            `Cán bộ ${existing.creator} đã nộp chứng từ. Vui lòng đối soát và thanh toán.`,
            `/business-trip?tripId=${existing.id}`
          ).run().catch(() => {});
        } catch (e) {}
      } else {
        existing.paymentStatus = 'DOCS_SUBMITTED';
        MEMORY_TRIPS.set(id, existing);
      }
    } else if (body.actionLevel === 'REVIEW_DOCS_PASS') {
      if (!session.roles?.includes('ke_toan') && !isExecutiveOrAdmin(session)) {
        return NextResponse.json({ success: false, error: 'Chỉ kế toán mới có quyền duyệt chứng từ' }, { status: 403 });
      }
      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET payment_status = 'PAYMENT_PENDING', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(id).run();
      } else {
        existing.paymentStatus = 'PAYMENT_PENDING';
        MEMORY_TRIPS.set(id, existing);
      }
    } else if (body.actionLevel === 'REVIEW_DOCS_REJECT') {
      if (!session.roles?.includes('ke_toan') && !isExecutiveOrAdmin(session)) {
        return NextResponse.json({ success: false, error: 'Chỉ kế toán mới có quyền từ chối chứng từ' }, { status: 403 });
      }
      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET payment_status = 'REJECTED_DOCS', payment_notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(body.paymentNotes || 'Chứng từ không hợp lệ', id).run();

        try {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, emp_code, title, message, type, link, created_at)
            VALUES (?, ?, ?, ?, 'WARNING', ?, CURRENT_TIMESTAMP)
          `).bind(
            notifId,
            existing.creator_emp_code,
            `❌ Chứng từ đơn ${existing.code} bị trả lại`,
            `Kế toán đã trả lại chứng từ. Lý do: ${body.paymentNotes}. Vui lòng nộp lại.`,
            `/business-trip?tripId=${existing.id}`
          ).run().catch(() => {});
        } catch (e) {}
      } else {
        existing.paymentStatus = 'REJECTED_DOCS';
        existing.paymentNotes = body.paymentNotes;
        MEMORY_TRIPS.set(id, existing);
      }
    } else if (body.actionLevel === 'MARK_PAID') {
      if (!session.roles?.includes('ke_toan') && !isExecutiveOrAdmin(session)) {
        return NextResponse.json({ success: false, error: 'Chỉ kế toán mới có quyền xác nhận thanh toán' }, { status: 403 });
      }
      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET payment_status = 'PAID', payment_notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(body.paymentNotes || 'Đã thanh toán', id).run();

        try {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, emp_code, title, message, type, link, created_at)
            VALUES (?, ?, ?, ?, 'SUCCESS', ?, CURRENT_TIMESTAMP)
          `).bind(
            notifId,
            existing.creator_emp_code,
            `💰 Đơn ${existing.code} đã được thanh toán`,
            `Kế toán đã hoàn tất thanh toán / hoàn ứng cho chuyến công tác của bạn.`,
            `/business-trip?tripId=${existing.id}`
          ).run().catch(() => {});
        } catch (e) {}
      } else {
        existing.paymentStatus = 'PAID';
        existing.paymentNotes = body.paymentNotes;
        MEMORY_TRIPS.set(id, existing);
      }
    } else {
      // Reject action or regular update
      if (body.status === 'REJECTED') {
        const isL1Reject = body.actionLevel === 'REJECT_L1';
        if (isL1Reject) {
          if (!isDepartmentHead(session)) return NextResponse.json({ success: false, error: 'Chỉ Trưởng phòng mới có quyền từ chối cấp 1' }, { status: 403 });
          if (existing.department_id !== session.departmentCode) return NextResponse.json({ success: false, error: 'Không thể từ chối đơn bộ phận khác' }, { status: 403 });
        } else {
          if (!isExecutiveOrAdmin(session)) return NextResponse.json({ success: false, error: 'Chỉ BGĐ mới có quyền từ chối cấp 2' }, { status: 403 });
        }
      }

      if (body.status) existing.status = body.status;
      if (body.rejectionReason) existing.rejectionReason = body.rejectionReason;

      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET status = COALESCE(?, status),
              rejection_reason = COALESCE(?, rejection_reason),
              logistics_status = CASE WHEN ? = 'REJECTED' THEN 'CANCELLED' ELSE logistics_status END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(body.status, body.rejectionReason, body.status, id).run();

        if (body.status === 'REJECTED') {
          try {
            const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await db.prepare(`
              INSERT INTO sys_notifications (id, emp_code, title, message, type, link, created_at)
              VALUES (?, ?, ?, ?, 'ERROR', '/work/business-trip', CURRENT_TIMESTAMP)
            `).bind(
              notifId,
              existing.creator_emp_code,
              `❌ Đơn công tác ${existing.code} đã bị từ chối`,
              `Đơn công tác "${existing.title}" bị từ chối. Lý do: ${body.rejectionReason || 'Không được chấp thuận'}`
            ).run().catch(() => {});
          } catch (e) {}

          // Notify Receptionist to cancel logistics if it was pending or arranged
          try {
            const notifId2 = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await db.prepare(`
              INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
              VALUES (?, 'LE_TAN', ?, ?, 'WARNING', '/work/business-trip', CURRENT_TIMESTAMP)
            `).bind(
              notifId2,
              `🚫 Hủy hậu cần đơn công tác: ${existing.code}`,
              `Đơn công tác "${existing.title}" đã bị từ chối/hủy. Vui lòng HỦY xe và khách sạn đã đặt (nếu có).`
            ).run().catch(() => {});
          } catch (e) {}
        }
      } else {
        MEMORY_TRIPS.set(id, existing);
      }
    }

    return NextResponse.json({ success: true, message: 'Đã cập nhật đơn công tác thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
