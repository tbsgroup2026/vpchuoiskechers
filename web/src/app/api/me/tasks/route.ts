import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSessionUser } from '@/lib/taskPermissions';

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

    const user = await getSessionUser(session);
    if (!user || !user.empCode) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const empCode = user.empCode;
    const db = getDbBinding();

    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    // Build the query to fetch from both tables with pagination
    const query = `
      SELECT * FROM (
        SELECT id, title, description, deadline as due_date, status, 'KANBAN' as source, board_id as project_id
        FROM task_cards
        WHERE assignee_id = ? OR created_by = ?

        UNION ALL

        SELECT id, title, description, due_date, status, 'PROJECT' as source, project_id
        FROM tasks
        WHERE assignee_emp_code = ? OR reporter_emp_code = ?
      )
      ORDER BY due_date ASC
      LIMIT ? OFFSET ?
    `;

    let mergedTasks = [];
    try {
      const { results } = await db.prepare(query)
        .bind(empCode, empCode, empCode, empCode, limit, offset)
        .all();
      
      mergedTasks = (results || []).map((t: any) => {
        let mappedStatus = String(t.status).toUpperCase();
        if (t.source === 'KANBAN') {
          if (mappedStatus === 'DONE') mappedStatus = 'DONE';
          else if (mappedStatus === 'IN_PROGRESS' || mappedStatus === 'PENDING_REVIEW') mappedStatus = 'DOING';
          else mappedStatus = 'TO_DO';
        }

        return {
          id: t.id,
          title: t.title,
          description: t.description,
          due_date: t.due_date,
          source: t.source,
          project_id: t.project_id,
          status: mappedStatus,
          priority: 'MEDIUM',
        };
      });
    } catch (e) {
      console.warn("Error fetching combined tasks:", e);
    }

    // Get total count for pagination metadata
    let total = 0;
    try {
      const countQuery = `
        SELECT COUNT(*) as total FROM (
          SELECT id FROM task_cards WHERE assignee_id = ? OR created_by = ?
          UNION ALL
          SELECT id FROM tasks WHERE assignee_emp_code = ? OR reporter_emp_code = ?
        )
      `;
      const countRes: any = await db.prepare(countQuery)
        .bind(empCode, empCode, empCode, empCode)
        .first();
      total = countRes?.total || 0;
    } catch (e) {
      console.warn("Error fetching count:", e);
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ 
      success: true, 
      tasks: mergedTasks,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
