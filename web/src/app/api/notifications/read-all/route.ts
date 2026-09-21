import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để cập nhật thông báo (401 Unauthorized)' },
        { status: 401 }
      );
    }

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
        UPDATE sys_notifications
        SET is_read = 1
        WHERE emp_code = ? OR target_role IN (${placeholders})
      `;

      await db.prepare(sql).bind(userEmp, ...roleTargets).run().catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
