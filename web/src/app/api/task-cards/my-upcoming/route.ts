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

    const empCode = (session as any).empCode || (session as any).userId || '';
    const db = getDbBinding();

    if (db) {
      await ensureKaizenSchema(db);
      const query = `
        SELECT * FROM task_cards
        WHERE (assignee_id = ? OR created_by = ?) AND status != 'done'
        ORDER BY CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline ASC
        LIMIT 20
      `;

      const { results } = await db.prepare(query).bind(empCode, empCode).all();
      return NextResponse.json({ success: true, data: results || [] });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
