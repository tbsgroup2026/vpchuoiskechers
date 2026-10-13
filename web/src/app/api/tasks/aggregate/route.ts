import { NextResponse } from 'next/server';
import { getSessionUser, checkCrossDepartmentAccess } from '@/lib/taskPermissions';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const db = getDbBinding();
    
    // Auth check (basic)
    const sessionCookie = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || (sessionCookie?.match(/tbs_token=([^;]+)/)?.[1] || '');
    
    // Auth check
    const user = await getSessionUser(token);
    if (!user) {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('group_by') || 'department';
    const departmentId = searchParams.get('department_id') || user.departmentCode;
    
    // Check permissions using unified function
    const crossAccess = checkCrossDepartmentAccess(user, searchParams.get('department_id') || undefined);
    if (!crossAccess.allowed) {
       return NextResponse.json({ success: false, error: crossAccess.error }, { status: 403 });
    }
    
    let query = '';
    const params: any[] = [];
    
    if (groupBy === 'assignee') {
      query = `
        SELECT 
          assignee_emp_code,
          COUNT(*) as totalTasks,
          SUM(CASE WHEN status = 'DONE' OR status = 'done' OR status = 'COMPLETED' OR progress = 100 THEN 1 ELSE 0 END) as completedTasks,
          SUM(CASE WHEN status = 'DOING' OR status = 'doing' OR status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as doingTasks,
          SUM(CASE WHEN status != 'DONE' AND status != 'done' AND progress < 100 AND due_date IS NOT NULL AND datetime(due_date) < datetime('now') THEN 1 ELSE 0 END) as overdueTasks
        FROM tasks
        WHERE assignee_emp_code IS NOT NULL
      `;
      if (departmentId) {
         query += ` AND department_id = ? `;
         params.push(departmentId);
      }
      query += ` GROUP BY assignee_emp_code `;
    } else {
      query = `
        SELECT 
          department_id,
          COUNT(*) as totalTasks,
          SUM(CASE WHEN status = 'DONE' OR status = 'done' OR progress = 100 THEN 1 ELSE 0 END) as completedTasks,
          SUM(CASE WHEN status != 'DONE' AND status != 'done' AND progress < 100 AND due_date IS NOT NULL AND datetime(due_date) < datetime('now') THEN 1 ELSE 0 END) as overdueTasks,
          SUM(CASE WHEN status != 'DONE' AND status != 'done' AND progress < 100 AND due_date IS NOT NULL AND datetime(due_date) >= datetime('now') AND datetime(due_date) <= datetime('now', '+1 day') THEN 1 ELSE 0 END) as dueSoonTasks
        FROM tasks
        WHERE department_id IS NOT NULL
        GROUP BY department_id
      `;
    }
    
    const { results } = await db.prepare(query).bind(...params).all();
    
    return NextResponse.json({ success: true, aggregates: results });
  } catch (error: any) {
    console.error('Aggregate Tasks Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
