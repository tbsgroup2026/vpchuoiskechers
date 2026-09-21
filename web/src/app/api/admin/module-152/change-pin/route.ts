import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

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
    const { oldPin, newPin } = body;

    if (!oldPin || !oldPin.trim() || !newPin || !newPin.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập đầy đủ mã PIN hiện tại và mã PIN mới' },
        { status: 400 }
      );
    }

    if (newPin.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mã PIN mới phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    if (newPin.trim() === '123456') {
      return NextResponse.json(
        { success: false, error: 'Mã PIN mới không được trùng với mã PIN mặc định (123456)' },
        { status: 400 }
      );
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    await ensureKaizenSchema(db);

    // Fetch user PIN record
    const pinRecord: any = await db.prepare('SELECT * FROM admin_module_pin WHERE user_id = ?').bind(empCode).first();

    if (!pinRecord || pinRecord.pin_hash !== oldPin.trim()) {
      return NextResponse.json({ success: false, error: 'Mã PIN hiện tại không chính xác' }, { status: 400 });
    }

    // Update to new PIN and set must_change_pin = 0
    await db.prepare(
      'UPDATE admin_module_pin SET pin_hash = ?, must_change_pin = 0, failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).bind(newPin.trim(), empCode).run();

    // Log to audit_logs
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    await db.prepare(
      'INSERT INTO audit_logs (id, timestamp, user_id, action, module, details, ip_address) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)'
    ).bind(
      `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      empCode,
      'PIN_CHANGED',
      'MODULE_152',
      JSON.stringify({ message: 'User changed 2FA PIN successfully' }),
      clientIp
    ).run().catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Đổi mã PIN 2FA thành công! Quý vị có thể truy cập Module 1-5-2 bình thường.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
