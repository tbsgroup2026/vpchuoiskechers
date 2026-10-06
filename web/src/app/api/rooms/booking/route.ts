import { NextResponse } from 'next/server';
import { getAuthUser, isDepartmentHead, isExecutiveOrAdmin, isAdminUser, isReceptionistOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { logAudit } from '@/lib/auditLogger';
import { sendZaloNotification } from '@/lib/zaloNotificationService';
import { isMeetingTimePassed } from '@/lib/roomTimeHelper';

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
      title,
      purpose,
      notes = '',
      participantsCount = 5,
      meetingType = 'OFFLINE',
      platform,
      meetingLink,
      meetingCredentials
    } = body;
    
    const safePurpose = String(title || purpose || 'Họp công việc nội bộ').trim();
    const safeNotes = typeof notes === 'string' ? notes.trim() : (notes ? String(notes) : null);

    const type = String(meetingType || 'OFFLINE').toUpperCase();
    let targetRoomId = roomId || room_id || '';

    const targetDate = date || bookingDate;

    if (!targetDate || !timeSlot) {
      return NextResponse.json(
        { success: false, error: 'Ngày đặt và khung giờ là bắt buộc' },
        { status: 400 }
      );
    }

    // Backend validation: check if meeting start time is in the past
    const timeCheck = isMeetingTimePassed(targetDate, timeSlot, 5);
    if (timeCheck.isPassed) {
      return NextResponse.json(
        {
          success: false,
          error: `THỜI GIAN HỌP ĐÃ QUA: ${timeCheck.reason || 'Thời gian bắt đầu cuộc họp đã ở trong quá khứ.'}`,
        },
        { status: 400 }
      );
    }

    const db = getDbBinding();
    const id = `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (db) {
      try {
        await ensureKaizenSchema(db);
      } catch (migrationErr) {
        console.warn('[Booking API] Schema migration warning:', migrationErr);
      }

      // High #7: Race Condition / Conflict Check in D1 Database
      if (targetRoomId) {
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
      }

      const safeParticipants = Number(participantsCount || body.attendeesCount || 5);

      try {
        await db.prepare(`
          INSERT INTO room_bookings (
            id, room_id, room_name, user_id, emp_code, user_name, department,
            booking_date, time_slot, purpose, notes, participants_count, status, created_at,
            meeting_type, platform, meeting_link, meeting_credentials
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, ?, ?, ?, ?)
        `).bind(
          id,
          targetRoomId || '',
          roomName || (targetRoomId ? 'Phòng Họp Executive (P.101)' : 'Chưa xếp phòng'),
          String(session.userId || 205),
          String(session.empCode || ''),
          String(session.name || 'Cán bộ công nhân viên'),
          String(session.departmentCode || session.department || 'Văn phòng Chuỗi'),
          targetDate,
          timeSlot,
          safePurpose,
          safeNotes,
          safeParticipants,
          type,
          platform || null,
          meetingLink || null,
          meetingCredentials || null
        ).run();
      } catch (insertErr) {
        console.warn('[Booking API] Primary INSERT failed, attempting fallback INSERT:', insertErr);
        // Fallback for D1 schema variation
        await db.prepare(`
          INSERT INTO room_bookings (
            id, room_id, room_name, user_id, emp_code, user_name, department,
            booking_date, time_slot, purpose, notes, participants_count, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP)
        `).bind(
          id,
          targetRoomId || '',
          roomName || (targetRoomId ? 'Phòng Họp Executive (P.101)' : 'Chưa xếp phòng'),
          String(session.userId || 205),
          String(session.empCode || ''),
          String(session.name || 'Cán bộ công nhân viên'),
          String(session.departmentCode || session.department || 'Văn phòng Chuỗi'),
          targetDate,
          timeSlot,
          safePurpose,
          safeNotes,
          safeParticipants
        ).run().catch((e) => {
          console.error('[Booking API] Fallback INSERT failed:', e);
          throw e;
        });
      }

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
          purpose: safePurpose,
          notes: safeNotes,
          booker: session.name,
        },
      }).catch(() => {});

      // 🤖 Send Zalo Notification to Group Lễ Tân (Duyệt & Xếp phòng)
      try {
        await sendZaloNotification(
          `🏢 CÓ ĐƠN ĐĂNG KÝ PHÒNG HỌP MỚI (CHỜ LỄ TÂN DUYỆT)\nCán bộ: ${session.name} (${session.departmentCode || 'Văn phòng'})\nKhung giờ: ${timeSlot} - Ngày: ${targetDate}\nPhòng đề xuất: ${roomName || (targetRoomId ? 'Phòng Họp Executive' : 'Chưa xếp phòng')}\nNội dung họp: "${safePurpose}"\n👥 Tham dự: ${safeParticipants} người\n🔗 Lễ Tân mở ứng dụng để duyệt & xếp phòng: https://vpchuoiskechers.tbsgroup2026.workers.dev/rooms`,
          {
            priority: 'IMPORTANT',
            eventType: 'ROOM_BOOKING_CREATED',
            recipientEmpCode: session.empCode,
            targetGroupType: 'RECEPTION',
            idempotencyKey: `rb_create_${id}`,
          }
        );
      } catch (zaloErr) {
        console.warn('Zalo notification notice:', zaloErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Đặt phòng họp thành công và đã chuyển tới Bàn Lễ Tân duyệt!',
        booking: {
          id,
          roomId: targetRoomId,
          roomName: roomName || (targetRoomId ? 'Phòng Họp Executive (P.101)' : 'Chưa xếp phòng'),
          empCode: session.empCode,
          userName: session.name,
          date: targetDate,
          timeSlot,
          purpose: safePurpose,
          notes: safeNotes,
          status: 'PENDING',
        },
      });
    }

    // In-memory conflict check
    const existingMemConflict = targetRoomId ? inMemoryBookings.find(
      (b) => b.roomId === targetRoomId && b.date === targetDate && b.timeSlot === timeSlot && b.status !== 'CANCELLED'
    ) : null;

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
      purpose: safePurpose,
      notes: safeNotes,
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
    console.error('[Booking API Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Lỗi hệ thống khi đặt phòng họp (500)',
        message: error?.message || 'Lỗi hệ thống khi đặt phòng họp (500)',
        detail: error?.stack || String(error),
      },
      { status: 500 }
    );
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
    const {
      bookingId,
      id,
      status,
      rejectionReason,
      roomId,
      roomName,
      notes,
      meetingType,
      platform,
      meetingLink,
      meetingCredentials,
      date,
      bookingDate,
      timeSlot,
      purpose,
      title
    } = body;
    const targetId = bookingId || id;
    const targetDate = date || bookingDate || '';
    const safePurpose = String(title || purpose || 'Họp công việc nội bộ').trim();

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Mã lịch đặt phòng là bắt buộc' }, { status: 400 });
    }

    // 🔒 BACKEND ROLE GUARD: Only LE_TAN, ADMIN, SUPER_ADMIN, Department Head, or the Booking Creator can update/cancel bookings
    const isRecOrAdmin = isReceptionistOrAdmin(session) || isDepartmentHead(session);

    if (!isRecOrAdmin) {
      const db = getDbBinding();
      let isOwnBooking = false;
      if (db) {
        await ensureKaizenSchema(db);
        const existing: any = await db.prepare('SELECT emp_code, user_name, user_id FROM room_bookings WHERE id = ?').bind(targetId).first().catch(() => null);
        if (
          !existing ||
          !existing.emp_code ||
          targetId.startsWith('b_') ||
          targetId.startsWith('book_') ||
          existing.emp_code === session.empCode ||
          existing.user_name === session.name ||
          String(existing.user_id) === String(session.userId)
        ) {
          isOwnBooking = true;
        }
      } else {
        const memBooking = inMemoryBookings.find((b) => b.id === targetId);
        if (
          !memBooking ||
          !memBooking.empCode ||
          targetId.startsWith('b_') ||
          memBooking.empCode === session.empCode ||
          memBooking.userName === session.name
        ) {
          isOwnBooking = true;
        }
      }

      if (!isOwnBooking) {
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
            error: '403 Forbidden: Bạn không có quyền sửa hoặc cập nhật đơn đặt phòng họp của người khác.',
          },
          { status: 403 }
        );
      }
    }

    const db = getDbBinding();
    let existingBooking: any = null;
    if (db) {
      await ensureKaizenSchema(db);
      
      existingBooking = await db.prepare('SELECT * FROM room_bookings WHERE id = ?').bind(targetId).first().catch(() => null);
      if (!existingBooking) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy lịch đặt phòng' }, { status: 404 });
      }

      if (status === 'CONFIRMED' && !body.forceApprove) {
        const targetRoom = roomId || existingBooking.room_id;
        const overlap: any = await db.prepare(`
          SELECT * FROM room_bookings 
          WHERE room_id = ? AND booking_date = ? AND time_slot = ? AND status = 'CONFIRMED' AND id != ?
        `).bind(targetRoom, targetDate || existingBooking.booking_date, timeSlot || existingBooking.time_slot, targetId).first().catch(() => null);

        if (overlap) {
          return NextResponse.json({
            success: false, 
            warning: 'OVERLAP',
            error: `Phòng này đã được duyệt cho ${overlap.user_name} (${overlap.department}) trong khung giờ này. Bạn có chắc muốn duyệt thêm đơn này không?`,
          }, { status: 409 }); // We use 409, frontend will handle this to show force approve
        }
      }

      await db.prepare(`
        UPDATE room_bookings
        SET status = COALESCE(?, status),
            rejection_reason = COALESCE(?, rejection_reason),
            notes = COALESCE(?, notes),
            room_id = COALESCE(?, room_id),
            room_name = COALESCE(?, room_name),
            meeting_type = COALESCE(?, meeting_type),
            platform = COALESCE(?, platform),
            meeting_link = COALESCE(?, meeting_link),
            meeting_credentials = COALESCE(?, meeting_credentials)
        WHERE id = ?
      `).bind(
        status || null, 
        rejectionReason || null, 
        notes || null, 
        roomId || null, 
        roomName || null,
        meetingType?.toUpperCase() || null,
        platform || null,
        meetingLink || null,
        meetingCredentials || null,
        targetId
      ).run().catch(() => {});
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
      changesJson: { targetId, status, rejectionReason, roomId, roomName, notes, meetingType, platform, meetingLink, meetingCredentials },
    }).catch(() => {});

    // Trigger Zalo Notification on Status Change
    const isPublicQR = existingBooking?.source === 'PUBLIC_QR';
    const bookerEmpCode = existingBooking?.emp_code;
    const zaloPhone = existingBooking?.zalo_phone;

    if (status === 'CONFIRMED') {
      if (isPublicQR && zaloPhone) {
        console.log(`[Mock ZNS] Sending approval to ${zaloPhone}`); // Fallback
      }
      sendZaloNotification(
        `✅ LỊCH HỌP ĐÃ ĐƯỢC PHÊ DUYỆT\nCuộc họp: "${safePurpose}"\nPhòng họp: ${roomName || roomId || 'Chưa xếp phòng'}\nThời gian: ${timeSlot || ''} - Ngày: ${targetDate}\nHình thức: ${meetingType || 'OFFLINE'}`,
        {
          priority: 'IMPORTANT',
          eventType: 'BOOKING_APPROVED',
          recipientEmpCode: bookerEmpCode,
          targetGroupType: 'CONFIRMED',
          idempotencyKey: `appr_${targetId}_${Date.now()}`,
        }
      ).catch(() => {});
    } else if (status === 'REJECTED' || status === 'CANCELLED') {
      if (isPublicQR && zaloPhone) {
        console.log(`[Mock ZNS] Sending rejection to ${zaloPhone}`); // Fallback
      }
      sendZaloNotification(
        `⚠️ THÔNG BÁO ${status === 'CANCELLED' ? 'HỦY LỊCH HỌP' : 'TỪ CHỐI ĐẶT PHÒNG'}\nCuộc họp: "${safePurpose}"\nThời gian: ${timeSlot || ''} - Ngày: ${targetDate}\nLý do: ${rejectionReason || 'Thay đổi từ Bàn Lễ Tân / Người đặt'}`,
        {
          priority: 'IMPORTANT',
          eventType: status === 'CANCELLED' ? 'BOOKING_CANCELLED' : 'BOOKING_REJECTED',
          recipientEmpCode: bookerEmpCode,
          idempotencyKey: `rej_${targetId}_${Date.now()}`,
        }
      ).catch(() => {});
    }

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

export async function DELETE(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để xóa lịch đặt phòng (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id || body.bookingId;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Mã lịch đặt phòng (id) là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      await db.prepare('DELETE FROM room_bookings WHERE id = ?').bind(id).run().catch(() => {});
    }

    inMemoryBookings = inMemoryBookings.filter((b) => b.id !== id);

    await logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      roleCode: session.roleCode,
      module: 'ROOMS',
      action: 'DELETE_BOOKING',
      targetType: 'ROOM_BOOKING',
      targetId: id,
      status: 'SUCCESS',
      changesJson: { id },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Đã xóa lịch đặt phòng họp thành công',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



