import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SYSTEM_USERS } from '@/lib/userProfiles';
import { recordAuditLog } from '@/lib/auditLogger';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Phiên đăng nhập hết hạn' },
        { status: 401 }
      );
    }

    const empCode = session.empCode;
    const user = SYSTEM_USERS[empCode];

    // Check Executive level requirement (managementLevel <= 2 or CEO/Deputy CEO role)
    const isExecutive = user && (user.roleLevel <= 2 || ['TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC', 'SUPER_ADMIN'].includes(user.roleCode));
    if (!isExecutive) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Bạn không có quyền truy cập Module 1-5-2' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { pin } = body;

    if (!pin || !pin.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập mã PIN xác thực' },
        { status: 400 }
      );
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 database binding unavailable' }, { status: 500 });
    }

    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Query user_security_pin
    let pinRecord: any = await db.prepare('SELECT * FROM user_security_pin WHERE user_id = ?').bind(empCode).first();

    if (!pinRecord) {
      // Create default per-user PIN (123456)
      await db.prepare(
        'INSERT INTO user_security_pin (user_id, pin_hash, must_change_pin, failed_attempts) VALUES (?, ?, 1, 0)'
      ).bind(empCode, '123456').run();

      pinRecord = { user_id: empCode, pin_hash: '123456', must_change_pin: 1, failed_attempts: 0, locked_until: null };
    }

    // 2. Check if currently locked
    if (pinRecord.locked_until) {
      const lockTime = new Date(pinRecord.locked_until).getTime();
      const nowTime = Date.now();

      if (nowTime < lockTime) {
        const remainingMins = Math.ceil((lockTime - nowTime) / (1000 * 60));

        // Log locked access attempt
        const logId = `log_152_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.prepare(
          'INSERT INTO module_152_access_log (id, user_id, action, ip_address) VALUES (?, ?, ?, ?)'
        ).bind(logId, empCode, 'LOCKED', clientIp).run().catch(() => {});

        return NextResponse.json(
          {
            success: false,
            error: 'LOCKED',
            message: `Tài khoản tạm bị khóa truy cập Module 1-5-2 do nhập sai mã 3 lần. Thử lại sau ${remainingMins} phút.`,
          },
          { status: 429 }
        );
      }
    }

    // 3. Compare PIN
    const isValidPin = pin.trim() === pinRecord.pin_hash;

    if (!isValidPin) {
      const newFailedAttempts = Number(pinRecord.failed_attempts || 0) + 1;
      let isLockedNow = false;
      let lockedUntilIso = null;
      let actionRecorded = 'FAILED_ACCESS_152';

      if (newFailedAttempts >= 3) {
        isLockedNow = true;
        actionRecorded = 'LOCKED';
        const lockDate = new Date();
        lockDate.setMinutes(lockDate.getMinutes() + 15);
        lockedUntilIso = lockDate.toISOString();

        await db.prepare(
          'UPDATE user_security_pin SET failed_attempts = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
        ).bind(newFailedAttempts, lockedUntilIso, empCode).run();
      } else {
        await db.prepare(
          'UPDATE user_security_pin SET failed_attempts = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
        ).bind(newFailedAttempts, empCode).run();
      }

      // Record access log
      const logId = `log_152_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.prepare(
        'INSERT INTO module_152_access_log (id, user_id, action, ip_address) VALUES (?, ?, ?, ?)'
      ).bind(logId, empCode, actionRecorded, clientIp).run().catch(() => {});

      await recordAuditLog(
        session,
        'MANAGEMENT_152',
        actionRecorded,
        empCode,
        null,
        { failed_attempts: newFailedAttempts, ip: clientIp },
        request
      );

      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_PIN',
          message: isLockedNow
            ? 'Mã PIN sai 3 lần liên tiếp! Hệ thống đã tự động khóa truy cập 15 phút.'
            : 'Mã PIN không chính xác.',
          failed_attempts: newFailedAttempts,
        },
        { status: 400 }
      );
    }

    // 4. Success -> Reset failed attempts
    await db.prepare(
      'UPDATE user_security_pin SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).bind(empCode).run();

    // Record success log ACCESS_152
    const logId = `log_152_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.prepare(
      'INSERT INTO module_152_access_log (id, user_id, action, ip_address) VALUES (?, ?, ?, ?)'
    ).bind(logId, empCode, 'ACCESS_152', clientIp).run().catch(() => {});

    await recordAuditLog(
      session,
      'MANAGEMENT_152',
      'ACCESS_152',
      empCode,
      null,
      { ip: clientIp },
      request
    );

    const mustChangePin = Number(pinRecord.must_change_pin || 0) === 1;

    return NextResponse.json({
      success: true,
      message: 'Xác thực mã PIN 2FA thành công!',
      must_change_pin: mustChangePin,
      verified_until: Date.now() + 15 * 60 * 1000,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
