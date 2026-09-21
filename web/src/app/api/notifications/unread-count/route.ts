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
      return NextResponse.json({ success: true, count: 0, unreadCount: 0 });
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
        SELECT COUNT(*) as count FROM sys_notifications
        WHERE (emp_code = ? OR target_role IN (${placeholders})) AND is_read = 0
      `;

      const row: any = await db.prepare(sql).bind(userEmp, ...roleTargets).first().catch(() => ({ count: 0 }));
      const unreadCount = Number(row?.count || 0);

      return NextResponse.json({
        success: true,
        count: unreadCount,
        unreadCount,
      });
    }

    return NextResponse.json({ success: true, count: 1, unreadCount: 1 });
  } catch (error: any) {
    return NextResponse.json({ success: true, count: 0, unreadCount: 0 });
  }
}
