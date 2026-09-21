import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { sendSecurityEmailAlert } from '@/lib/emailNotifier';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const empCode = (session as any).empCode || (session as any).userId || '';
    const body = await request.json();
    const { pin } = body;

    if (!pin || !pin.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập mã PIN 2FA' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    await ensureKaizenSchema(db);

    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // 1. Fetch user PIN record from admin_module_pin
    let pinRecord: any = await db.prepare('SELECT * FROM admin_module_pin WHERE user_id = ?').bind(empCode).first();

    // Auto-create default PIN record (default '123456', must_change_pin = 1) if not exists
    if (!pinRecord) {
      await db.prepare(
        'INSERT INTO admin_module_pin (user_id, pin_hash, must_change_pin, failed_attempts) VALUES (?, ?, 1, 0)'
      ).bind(empCode, '123456').run();

      pinRecord = { user_id: empCode, pin_hash: '123456', must_change_pin: 1, failed_attempts: 0, locked_until: null };
    }

    // 2. Check if currently locked
    if (pinRecord.locked_until) {
      const lockTime = new Date(pinRecord.locked_until).getTime();
      const nowTime = new Date().getTime();
      if (nowTime < lockTime) {
        const remainingMins = Math.ceil((lockTime - nowTime) / (1000 * 60));

        // Log failed access attempt
        await db.prepare(
          'INSERT INTO module_152_access_log (id, user_id, success, ip, user_agent) VALUES (?, ?, 0, ?, ?)'
        ).bind(`log_152_${Date.now()}`, empCode, clientIp, userAgent).run().catch(() => {});

        return NextResponse.json(
          {
            success: false,
            error: 'LOCKED',
            message: `Tài khoản đã bị tạm khóa module 1-5-2 do nhập sai quá 5 lần. Vui lòng thử lại sau ${remainingMins} phút.`,
          },
          { status: 429 }
        );
      }
    }

    // 3. Verify PIN value
    const isValidPin = pin.trim() === pinRecord.pin_hash;

    if (!isValidPin) {
      const newFailedAttempts = Number(pinRecord.failed_attempts || 0) + 1;
      let isLockedNow = false;
      let lockedUntilIso = null;

      if (newFailedAttempts >= 5) {
        isLockedNow = true;
        const lockDate = new Date();
        lockDate.setMinutes(lockDate.getMinutes() + 15);
        lockedUntilIso = lockDate.toISOString();

        // Update locked status in DB
        await db.prepare(
          'UPDATE admin_module_pin SET failed_attempts = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
        ).bind(newFailedAttempts, lockedUntilIso, empCode).run();

        // Fetch Board of Directors emails for security alert
        const { results: bgdUsers } = await db.prepare(
          "SELECT email FROM admin_alert_recipients WHERE is_active = 1 UNION SELECT email FROM users WHERE role_code IN ('TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC', 'SUPER_ADMIN')"
        ).all().catch(() => ({ results: [] }));

        const recipientEmails = (bgdUsers || []).map((u: any) => u.email).filter(Boolean);
        if (recipientEmails.length === 0) recipientEmails.push('admin@tbsgroup.vn');

        // Trigger Resend REST API email alert to BGĐ
        await sendSecurityEmailAlert((process.env as any), {
          to: recipientEmails,
          subject: '🚨 [CẢNH BÁO BẢO MẬT] Nhập sai PIN 5 lần tại Module 1-5-2',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fff1f2; border: 1px solid #fecdd3; rounded: 12px;">
              <h2 style="color: #e11d48;">🚨 CẢNH BÁO AN NINH HỆ THỐNG 1-5-2</h2>
              <p>Tài khoản <strong>${empCode}</strong> (${(session as any).name || ''}) đã nhập sai mã PIN 2FA quá 5 lần liên tiếp.</p>
              <ul>
                <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
                <li><strong>Địa chỉ IP:</strong> ${clientIp}</li>
                <li><strong>Trình duyệt:</strong> ${userAgent}</li>
                <li><strong>Trạng thái:</strong> Đã khóa tạm thời module 1-5-2 trong 15 phút.</li>
              </ul>
              <p>Vui lòng kiểm tra nhật ký truy cập hệ thống nếu đây là hành vi nghi vấn bất thường.</p>
            </div>
          `,
        });
      } else {
        await db.prepare(
          'UPDATE admin_module_pin SET failed_attempts = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
        ).bind(newFailedAttempts, empCode).run();
      }

      // Log access attempt in module_152_access_log
      await db.prepare(
        'INSERT INTO module_152_access_log (id, user_id, success, ip, user_agent) VALUES (?, ?, 0, ?, ?)'
      ).bind(`log_152_${Date.now()}`, empCode, clientIp, userAgent).run().catch(() => {});

      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_PIN',
          message: isLockedNow
            ? 'Mã PIN sai quá 5 lần! Hệ thống đã tự động khóa module trong 15 phút và phát email cảnh báo cho Ban Giám Đốc.'
            : `Mã PIN không chính xác (Sai ${newFailedAttempts}/5 lần).`,
          failed_attempts: newFailedAttempts,
        },
        { status: 400 }
      );
    }

    // 4. PIN Correct -> Reset failed attempts
    await db.prepare(
      'UPDATE admin_module_pin SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).bind(empCode).run();

    // Log successful access
    await db.prepare(
      'INSERT INTO module_152_access_log (id, user_id, success, ip, user_agent) VALUES (?, ?, 1, ?, ?)'
    ).bind(`log_152_${Date.now()}`, empCode, clientIp, userAgent).run().catch(() => {});

    // Check mandatory PIN change flag
    const mustChangePin = Number(pinRecord.must_change_pin || 0) === 1;

    return NextResponse.json({
      success: true,
      message: mustChangePin
        ? 'Xác thực PIN mặc định thành công! Yêu cầu đổi mã PIN mới trước khi vào nội dung module.'
        : 'Xác thực mã PIN 2FA thành công!',
      require_pin_change: mustChangePin,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
