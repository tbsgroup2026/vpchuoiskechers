import { NextResponse } from 'next/server';
import { getAuthUser, isDepartmentHead, isExecutiveOrAdmin, isAdminUser, isReceptionistOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { logAudit } from '@/lib/auditLogger';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

let inMemoryBookings: any[] = [];

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để đặt phòng họp (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      roomId,
      room_id,
      roomName,
      date,
      bookingDate,
      timeSlot,
      purpose = 'Họp công việc nội bộ',
      participantsCount = 5,
    } = body;

    const targetRoomId = roomId || room_id || 'room_1';
    const targetDate = date || bookingDate;

    if (!targetRoomId || !targetDate || !timeSlot) {
      return NextResponse.json(
        { success: false, error: 'Mã phòng họp, ngày đặt và khung giờ là bắt buộc' },
        { status: 400 }
      );
    }

    const db = getDbBinding();
    const id = `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (db) {
      await ensureKaizenSchema(db);

      // High #7: Race Condition / Conflict Check in D1 Database
      const existingConflict: any = await db.prepare(`
        SELECT * FROM room_bookings
        WHERE room_id = ? AND booking_date = ? AND time_slot = ? AND status != 'CANCELLED'
      `).bind(targetRoomId, targetDate, timeSlot).first().catch(() => null);

      if (existingConflict) {
        return NextResponse.json(
          {
            success: false,
            error: `XUNG ĐỘT THỜI GIAN: Phòng họp đã được đăng ký bởi ${existingConflict.user_name || 'người khác'} (${existingConflict.department || 'Phòng ban'}) trong khung giờ ${timeSlot} ngày ${targetDate}!`,
          },
          { status: 409 }
        );
      }

      await db.prepare(`
        INSERT INTO room_bookings (
          id, room_id, room_name, user_id, emp_code, user_name, department,
          booking_date, time_slot, purpose, participants_count, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)
      `).bind(
        id,
        targetRoomId,
        roomName || 'Phòng Họp Executive (P.101)',
        String(session.userId || 205),
        session.empCode,
        session.name || 'Cán bộ công nhân viên',
        session.departmentCode || 'Văn phòng Chuỗi',
        targetDate,
        timeSlot,
        purpose.trim(),
        participantsCount
      ).run();

      // Send notification to Receptionist (LE_TAN)
      try {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.prepare(`
          INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
          VALUES (?, 'LE_TAN', ?, ?, 'INFO', '/rooms', CURRENT_TIMESTAMP)
        `).bind(
          notifId,
          `🏢 Lịch đặt phòng họp mới: ${roomName || targetRoomId}`,
          `${session.name} (${session.departmentCode || 'Văn phòng'}) vừa đặt phòng họp lúc ${timeSlot} ngày ${targetDate}.`
        ).run().catch(() => {});
      } catch (e) {}

      // Log Central Audit Event
      await logAudit(request, {
        empCode: session.empCode,
        empName: session.name,
        roleCode: session.roleCode,
        module: 'ROOMS',
        action: 'CREATE_BOOKING',
        targetType: 'ROOM_BOOKING',
        targetId: id,
        status: 'SUCCESS',
        changesJson: {
          bookingId: id,
          roomId: targetRoomId,
          roomName: roomName || 'Phòng Họp Executive',
          date: targetDate,
          timeSlot,
          purpose,
          booker: session.name,
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Đặt phòng họp thành công và đã lưu vào hệ thống!',
        booking: {
          id,
          roomId: targetRoomId,
          roomName: roomName || 'Phòng Họp Executive (P.101)',
          empCode: session.empCode,
          userName: session.name,
          date: targetDate,
          timeSlot,
          status: 'CONFIRMED',
        },
      });
    }

    // In-memory conflict check
    const existingMemConflict = inMemoryBookings.find(
      (b) => b.roomId === targetRoomId && b.date === targetDate && b.timeSlot === timeSlot && b.status !== 'CANCELLED'
    );

    if (existingMemConflict) {
      return NextResponse.json(
        {
          success: false,
          error: `XUNG ĐỘT THỜI GIAN: Phòng họp đã được đăng ký trong khung giờ ${timeSlot} ngày ${targetDate}!`,
        },
        { status: 409 }
      );
    }

    const newMemBooking = {
      id,
      roomId: targetRoomId,
      roomName: roomName || 'Phòng Họp Executive',
      empCode: session.empCode,
      userName: session.name,
      date: targetDate,
      timeSlot,
      status: 'CONFIRMED',
    };
    inMemoryBookings.push(newMemBooking);

    await logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      roleCode: session.roleCode,
      module: 'ROOMS',
      action: 'CREATE_BOOKING',
      targetType: 'ROOM_BOOKING',
      targetId: id,
      status: 'SUCCESS',
      changesJson: newMemBooking,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Đặt phòng họp thành công (Chế độ lưu tạm)',
      booking: newMemBooking,
      id,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleBookingUpdate(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để cập nhật lịch đặt phòng (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, id, status, rejectionReason, roomId, roomName, notes } = body;
    const targetId = bookingId || id;

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Mã lịch đặt phòng là bắt buộc' }, { status: 400 });
    }

    // 🔒 BACKEND ROLE GUARD: Only LE_TAN, ADMIN, and SUPER_ADMIN can execute Bàn Lễ Tân operations
    const isRecOrAdmin = isReceptionistOrAdmin(session);

    if (!isRecOrAdmin) {
      // Check if user is cancelling their OWN booking
      const db = getDbBinding();
      let isOwnCancel = false;
      if (db) {
        await ensureKaizenSchema(db);
        const existing: any = await db.prepare('SELECT emp_code FROM room_bookings WHERE id = ?').bind(targetId).first().catch(() => null);
        if (existing && existing.emp_code === session.empCode && status === 'CANCELLED') {
          isOwnCancel = true;
        }
      } else {
        const memBooking = inMemoryBookings.find((b) => b.id === targetId);
        if (memBooking && memBooking.empCode === session.empCode && status === 'CANCELLED') {
          isOwnCancel = true;
        }
      }

      if (!isOwnCancel) {
        await logAudit(request, {
          empCode: session.empCode,
          empName: session.name,
          roleCode: session.roleCode,
          module: 'ROOMS',
          action: 'UNAUTHORIZED_BOOKING_UPDATE_ATTEMPT',
          targetType: 'ROOM_BOOKING',
          targetId: targetId,
          status: 'DENIED',
          changesJson: { attemptedStatus: status, targetId },
        }).catch(() => {});

        return NextResponse.json(
          {
            success: false,
            error: '403 Forbidden: Bạn không có quyền truy cập hoặc thực hiện thao tác Bàn Lễ Tân. Quyền này chỉ dành riêng cho Lễ Tân và Admin.',
          },
          { status: 403 }
        );
      }
    }

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      await db.prepare(`
        UPDATE room_bookings
        SET status = COALESCE(?, status),
            rejection_reason = COALESCE(?, rejection_reason),
            notes = COALESCE(?, notes),
            room_id = COALESCE(?, room_id),
            room_name = COALESCE(?, room_name)
        WHERE id = ?
      `).bind(status || null, rejectionReason || null, notes || null, roomId || null, roomName || null, targetId).run().catch(() => {});
    }

    // Log Central Audit Event
    const actionName = status === 'CANCELLED' ? 'CANCEL_BOOKING' : status === 'CONFIRMED' ? 'CONFIRM_BOOKING' : 'UPDATE_BOOKING';
    await logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      roleCode: session.roleCode,
      module: 'ROOMS',
      action: actionName,
      targetType: 'ROOM_BOOKING',
      targetId: targetId,
      status: 'SUCCESS',
      changesJson: { targetId, status, rejectionReason, roomId, roomName, notes },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật trạng thái đặt phòng họp thành công',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return handleBookingUpdate(request);
}

export async function PATCH(request: Request) {
  return handleBookingUpdate(request);
}


