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
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const roleCode = (session as any).roleCode || (session as any).role || '';
    if (roleCode !== 'SUPER_ADMIN' && roleCode !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const moduleName = searchParams.get('module');
    const action = searchParams.get('action');

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);

      const conditions: string[] = [];
      const bindings: any[] = [];

      if (userId) {
        conditions.push('(user_id = ? OR emp_code = ?)');
        bindings.push(userId, userId);
      }
      if (moduleName) {
        conditions.push('module = ?');
        bindings.push(moduleName);
      }
      if (action) {
        conditions.push('action = ?');
        bindings.push(action);
      }

      const whereStr = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const query = `SELECT * FROM audit_logs ${whereStr} ORDER BY created_at DESC LIMIT 200`;

      const { results } = await db.prepare(query).bind(...bindings).all();
      return NextResponse.json({ success: true, data: results || [] });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
