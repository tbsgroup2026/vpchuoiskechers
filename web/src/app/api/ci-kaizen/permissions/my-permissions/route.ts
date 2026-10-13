import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json({ success: true, permissions: [], roles: [] });
    }

    const empCode = String((session as any).empCode || '').trim().toUpperCase();
    if (!empCode) {
      return NextResponse.json({ success: true, permissions: [], roles: [] });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: true, permissions: [], roles: [] });
    }

    await ensureKaizenSchema(db);

    const { results } = await db.prepare(`
      SELECT role_type, factory_scope FROM ci_kaizen_permissions
      WHERE UPPER(emp_code) = ? AND is_active = 1
    `).bind(empCode).all();

    const perms = results || [];
    const roles = Array.from(new Set(perms.map((p: any) => p.role_type)));

    return NextResponse.json({
      success: true,
      emp_code: empCode,
      permissions: perms,
      roles,
      isIE: roles.includes('IE') || roles.includes('CI_LEAD'),
      isCILead: roles.includes('CI_LEAD'),
      isJudge: roles.includes('JUDGE') || roles.includes('CI_LEAD'),
      isApprover: roles.includes('APPROVER') || roles.includes('CI_LEAD'),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
