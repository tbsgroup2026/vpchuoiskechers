import { NextResponse } from 'next/server';
import { getAuthUser, isDepartmentHead, isExecutiveOrAdmin, isAdminUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

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

    const { results } = await db.prepare(
      'SELECT * FROM business_trips ORDER BY created_at DESC'
    ).all();

    const formatted = (results || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      region: row.region,
      factory: row.factory,
      creator: row.creator,
      department: row.department,
      departmentId: row.department_id,
      location: row.location,
      startDate: row.start_date,
      endDate: row.end_date,
      daysCount: row.days_count,
      transport: row.transport,
      participantsCount: row.participants_count,
      purpose: row.purpose,
      address: row.address,
      proposalText: row.proposal_text,
      attachments: typeof row.attachments_json === 'string' ? JSON.parse(row.attachments_json || '[]') : [],
      invoices: typeof row.invoices_json === 'string' ? JSON.parse(row.invoices_json || '[]') : [],
      participants: typeof row.participants_json === 'string' ? JSON.parse(row.participants_json || '[]') : [],
      status: row.status || 'PENDING',
      estimatedCost: row.estimated_cost || 0,
      version: row.version || 1,
      approvedLevel: row.approved_level,
      rejectedLevel: row.rejected_level,
      rejectionReason: row.rejection_reason,
      budgetStatus: row.budget_status || 'pending_dept_budget',
      budgetAmount: row.budget_amount || 0,
      budgetRejectionReason: row.budget_rejection_reason,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ success: true, data: formatted });
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

    const id = body.id || `rec_${Date.now()}`;
    const code = body.code || `CT-2026-0${Math.floor(Math.random() * 900 + 100)}`;

    const tripObj = {
      id,
      code,
      title: body.title.trim(),
      region: body.region || '',
      factory: body.factory || '',
      creator: body.creator.trim(),
      department: body.department || session.departmentCode || '',
      departmentId: body.departmentId || session.departmentCode || '',
      location: body.location || '',
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      daysCount: body.daysCount || 1,
      transport: body.transport || '',
      participantsCount: body.participantsCount || 1,
      purpose: body.purpose || '',
      address: body.address || '',
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
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await ensureKaizenSchema(db);

      const sql = `
        INSERT INTO business_trips (
          id, code, title, region, factory, creator, department, department_id,
          location, start_date, end_date, days_count, transport, participants_count,
          purpose, address, proposal_text, attachments_json, invoices_json,
          participants_json, status, estimated_cost, version, budget_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending_dept_budget')
      `;

      await db.prepare(sql).bind(
        id,
        code,
        body.title.trim(),
        body.region || '',
        body.factory || '',
        body.creator.trim(),
        body.department || session.departmentCode || '',
        body.departmentId || session.departmentCode || '',
        body.location || '',
        body.startDate || '',
        body.endDate || '',
        body.daysCount || 1,
        body.transport || '',
        body.participantsCount || 1,
        body.purpose || '',
        body.address || '',
        body.proposalText || '',
        JSON.stringify(body.attachments || []),
        JSON.stringify(body.invoices || []),
        JSON.stringify(body.participants || []),
        body.status || 'PENDING',
        body.estimatedCost || 0
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
          SET status = 'RECALLED', recall_reason = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
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
      } else {
        MEMORY_TRIPS.set(id, existing);
      }

      return NextResponse.json({ success: true, message: 'Đã rút đơn công tác thành công! Đơn chuyển về trạng thái Rút đơn.' });
    }

    // ACTION 2. APPROVE_L1 (Trưởng phòng)
    if (body.actionLevel === 'APPROVE_L1') {
      // Check Segregation of Duties: Creator cannot approve their own trip
      if (session.empCode && existing.creator && session.empCode.trim().toUpperCase() === existing.creator.trim().toUpperCase()) {
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

      existing.status = 'PENDING_L2';
      existing.approved_level = 'L1';
      existing.approvedLevel = 'L1';

      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET status = 'PENDING_L2', approved_level = 'L1',
              delegated_by_emp_code = ?, delegated_by_name = ?,
              version = version + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(isDelegated ? session.empCode : null, isDelegated ? delegatorName : null, id).run();

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
            JSON.stringify({ is_delegated: isDelegated, delegator: delegatorName })
          ).run().catch(() => {});
        } catch (e) {}

        // Push notification to Ban Giám Đốc for Level 2 approval
        try {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
            VALUES (?, 'BAN_GIAM_DOC', ?, ?, 'INFO', '/work/business-trip', CURRENT_TIMESTAMP)
          `).bind(
            notifId,
            `👑 Đơn công tác cần duyệt cấp 2 (BGĐ): ${existing.code}`,
            `Đơn công tác "${existing.title}" của ${existing.creator} đã được ${isDelegated ? `Duyệt thay bởi ${session.name} (Ủy quyền của ${delegatorName})` : 'Trưởng phòng duyệt Cấp 1'}, đang chờ BGĐ duyệt Cấp 2.`
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
            VALUES (?, ?, ?, ?, 'SUCCESS', '/work/business-trip', CURRENT_TIMESTAMP)
          `).bind(
            notifId,
            existing.creator,
            `✅ Đơn công tác ${existing.code} đã được Ban Giám Đốc duyệt chính thức!`,
            `Đơn công tác "${existing.title}" của bạn đã được phê duyệt 100%${isEmergencyBypass ? ' (Duyệt khẩn)' : ''}. Bạn có thể di chuyển.`
          ).run().catch(() => {});
        } catch (e) {}
      } else {
        MEMORY_TRIPS.set(id, existing);
      }

    } else if (body.invoices_json || body.invoices) {
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
    } else {
      if (body.status) existing.status = body.status;
      if (body.rejectionReason) existing.rejectionReason = body.rejectionReason;

      if (db) {
        await db.prepare(`
          UPDATE business_trips
          SET status = COALESCE(?, status),
              rejection_reason = COALESCE(?, rejection_reason),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(body.status, body.rejectionReason, id).run();

        if (body.status === 'REJECTED') {
          try {
            const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await db.prepare(`
              INSERT INTO sys_notifications (id, emp_code, title, message, type, link, created_at)
              VALUES (?, ?, ?, ?, 'ERROR', '/work/business-trip', CURRENT_TIMESTAMP)
            `).bind(
              notifId,
              existing.creator,
              `❌ Đơn công tác ${existing.code} đã bị từ chối`,
              `Đơn công tác "${existing.title}" bị từ chối. Lý do: ${body.rejectionReason || 'Không được chấp thuận'}`
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
