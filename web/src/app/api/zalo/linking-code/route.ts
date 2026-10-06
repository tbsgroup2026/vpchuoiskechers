import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: true, isLinked: false });
    }

    await ensureKaizenSchema(db);
    const link: any = await db.prepare('SELECT chat_id, zalo_name, updated_at FROM zalo_user_links WHERE emp_code = ?').bind(session.empCode).first().catch(() => null);

    if (link) {
      return NextResponse.json({
        success: true,
        isLinked: true,
        chatId: link.chat_id,
        zaloName: link.zalo_name || 'Tài khoản Zalo',
        linkedAt: link.updated_at,
      });
    }

    return NextResponse.json({
      success: true,
      isLinked: false,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Yêu cầu đăng nhập để tạo mã liên kết' }, { status: 401 });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      // Clean up previous codes for this user
      await db.prepare('DELETE FROM zalo_linking_codes WHERE emp_code = ?').bind(session.empCode).run().catch(() => {});

      await db.prepare(`
        INSERT INTO zalo_linking_codes (code, emp_code, expires_at, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(code, session.empCode, expiresAt).run();
    }

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      message: `Mã liên kết của bạn là: ${code} (có hiệu lực 10 phút)`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      await db.prepare('DELETE FROM zalo_user_links WHERE emp_code = ?').bind(session.empCode).run().catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Đã hủy liên kết Zalo thành công',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
