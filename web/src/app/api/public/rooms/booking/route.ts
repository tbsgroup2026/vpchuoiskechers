import { NextResponse } from 'next/server';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { sendZaloNotification } from '@/lib/zaloNotificationService';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roomId,
      roomName,
      date,
      timeSlot,
      title,
      notes = '',
      participantsCount = 5,
      userName,
      empCode,
      department,
      zaloPhone,
      turnstileToken
    } = body;
    
    // Validate required fields
    if (!roomId || !date || !timeSlot || !userName || !zaloPhone) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng điền đầy đủ các thông tin bắt buộc (Phòng, Ngày, Giờ, Họ tên, SĐT).' },
        { status: 400 }
      );
    }

    const safePurpose = String(title || 'Họp').trim();
    const safeNotes = typeof notes === 'string' ? notes.trim() : (notes ? String(notes) : null);
    
    // Validate past dates
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return NextResponse.json(
        { success: false, error: 'Không thể đặt phòng cho ngày trong quá khứ.' },
        { status: 400 }
      );
    }

    // TODO: Verify Turnstile Token (mocked for now, as CF secret is needed)
    // if (!turnstileToken) throw new Error('Missing captcha token');

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Lỗi kết nối cơ sở dữ liệu.' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    // Rate Limiting by IP or ZaloPhone
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const limitCheck: any = await db.prepare(`
      SELECT COUNT(*) as cnt FROM room_bookings 
      WHERE (zalo_phone = ? OR user_id = ?) 
        AND created_at >= datetime('now', '-1 day')
        AND source = 'PUBLIC_QR'
    `).bind(zaloPhone, ip).first().catch(() => ({ cnt: 0 }));

    if (limitCheck && limitCheck.cnt >= 5) {
      return NextResponse.json(
        { success: false, error: 'Bạn đã đạt giới hạn số lượng đặt phòng trong ngày (5 đơn/ngày).' },
        { status: 429 }
      );
    }

    const id = `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Note: WE DO NOT BLOCK PUBLIC BOOKINGS ON OVERLAPS here.
    // Allow PENDING overlap, let Receptionist decide.
    await db.prepare(`
      INSERT INTO room_bookings (
        id, room_id, room_name, user_id, emp_code, user_name, department,
        booking_date, time_slot, purpose, notes, participants_count, status, created_at,
        meeting_type, source, zalo_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, 'OFFLINE', 'PUBLIC_QR', ?)
    `).bind(
      id,
      roomId,
      roomName || 'Phòng họp',
      ip, // use IP as user_id for public
      empCode || 'GUEST',
      userName,
      department || 'Khách/Công cộng',
      date,
      timeSlot,
      safePurpose,
      safeNotes,
      participantsCount,
      zaloPhone
    ).run();

    // Notify Receptionist (In-app Notification)
    try {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.prepare(`
        INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
        VALUES (?, 'LE_TAN', ?, ?, 'INFO', '/rooms', CURRENT_TIMESTAMP)
      `).bind(
        notifId,
        `📲 Lịch đặt phòng từ QR: ${roomName}`,
        `${userName} (${zaloPhone}) vừa đặt phòng lúc ${timeSlot} ngày ${date}. Đang chờ duyệt.`
      ).run().catch(() => {});
    } catch (e) {}

    // Zalo Notification to Reception Group
    try {
      await sendZaloNotification(
        `📲 CÓ ĐƠN ĐẶT PHÒNG TỪ MÃ QR (CÔNG KHAI)\nNgười đặt: ${userName} - ${zaloPhone}\nBộ phận/Đơn vị: ${department || 'Không rõ'}\nKhung giờ: ${timeSlot} - Ngày: ${date}\nPhòng: ${roomName}\nNội dung: "${safePurpose}"\n🔗 Lễ Tân mở ứng dụng để xem & duyệt: https://vpchuoiskechers.tbsgroup2026.workers.dev/rooms`,
        {
          priority: 'IMPORTANT',
          eventType: 'ROOM_BOOKING_CREATED_PUBLIC',
          targetGroupType: 'RECEPTION',
          idempotencyKey: `rb_qr_${id}`,
        }
      );
    } catch (zaloErr) {
      console.warn('Zalo notice failed', zaloErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Gửi yêu cầu đặt phòng thành công!',
      bookingId: id
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
