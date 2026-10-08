import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { getSessionUser, getCardPermissions } from '@/lib/taskPermissions';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;
    
    const user = await getSessionUser(session);
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const { empCode } = user;
    const db = getDbBinding();

    if (db) {
      const tasksSource = (process.env as any).TASKS_SOURCE || 'V2';

      if (tasksSource !== 'legacy') {
        try {
          const { results } = await db.prepare(`
            SELECT * FROM tasks
            WHERE (assignee_emp_code = ? OR reporter_emp_code = ?) AND status != 'DONE'
            ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC
            LIMIT 20
          `).bind(empCode, empCode).all();
          
          for (const c of (results || [])) {
            const perm = await getCardPermissions(db, (c as any).id, session, tasksSource);
            (c as any).permissions = perm.permissions;
          }
          return NextResponse.json({ success: true, data: results || [] });
        } catch (err) {}
      }

      await ensureKaizenSchema(db);
      const query = `
        SELECT * FROM task_cards
        WHERE (assignee_id = ? OR created_by = ?) AND status != 'done'
        ORDER BY CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline ASC
        LIMIT 20
      `;
      const { results } = await db.prepare(query).bind(empCode, empCode).all();
      
      for (const c of (results || [])) {
        const perm = await getCardPermissions(db, (c as any).id, session, 'legacy');
        (c as any).permissions = perm.permissions;
      }
      
      return NextResponse.json({ success: true, data: results || [] });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
