import { NextResponse } from 'next/server';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const MEMORY_NOTIFICATIONS = [
  {
    id: 'notif_default_1',
    emp_code: '202608001',
    target_role: 'TRUONG_PHONG',
    title: '🎉 Chào mừng bạn đến với TBS Work System',
    message: 'Hệ thống quản trị nội bộ đa vai trò TBS Group đã khởi tạo thành công.',
    type: 'INFO',
    is_read: 0,
    link: '/work',
    created_at: new Date().toISOString(),
  },
];

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để xem thông báo (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const db = getDbBinding();

    if (db) {
      await ensureKaizenSchema(db);
      const userEmp = session.empCode;
      const roleCode = (session.roleCode || '').toUpperCase();
      const userLevel = session.roleLevel || 4;

      const roleTargets: string[] = ['ALL', roleCode];
      if (userLevel <= 2) roleTargets.push('BAN_GIAM_DOC');
      if (userLevel <= 3) roleTargets.push('TRUONG_PHONG');

      const placeholders = roleTargets.map(() => '?').join(',');

      const sql = `
        SELECT * FROM sys_notifications
        WHERE emp_code = ? OR target_role IN (${placeholders})
        ORDER BY created_at DESC
        LIMIT ?
      `;

      const params = [userEmp, ...roleTargets, limit];
      const { results } = await db.prepare(sql).bind(...params).all();

      const formatted = (results || []).map((r: any) => ({
        id: r.id,
        empCode: r.emp_code,
        targetRole: r.target_role,
        title: r.title,
        message: r.message,
        type: r.type || 'INFO',
        isRead: Boolean(r.is_read),
        link: r.link || '/work',
        createdAt: r.created_at,
      }));

      return NextResponse.json({
        success: true,
        data: formatted,
        notifications: formatted,
      });
    }

    return NextResponse.json({
      success: true,
      data: MEMORY_NOTIFICATIONS,
      notifications: MEMORY_NOTIFICATIONS,
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
        { success: false, error: 'Yêu cầu đăng nhập để gửi thông báo (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emp_code, target_role = 'ALL', title, message, type = 'INFO', link = '/work' } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Tiêu đề và nội dung thông báo là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (db) {
      await ensureKaizenSchema(db);
      await db.prepare(`
        INSERT INTO sys_notifications (id, emp_code, target_role, title, message, type, is_read, link, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
      `).bind(id, emp_code || null, target_role || 'ALL', title.trim(), message.trim(), type, link).run();

      return NextResponse.json({ success: true, message: 'Đã gửi thông báo thành công', id });
    }

    return NextResponse.json({ success: true, message: 'Đã lưu thông báo tạm thời', id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
