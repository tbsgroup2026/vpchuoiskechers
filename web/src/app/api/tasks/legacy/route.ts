import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { checkCrossDepartmentAccess } from '@/lib/taskPermissions';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const SUNSET_DATE = '2026-12-31T23:59:59Z';

function buildLegacyWhereClause(session: any, searchParams: URLSearchParams) {
  const params: any[] = [];
  const clauses: string[] = ["status != 'DELETED'"];
  
  if (session) {
    const roleLevel = session.roleLevel || 4;
    const roleCode = (session.roleCode || '').toUpperCase();
    const isAdmin = roleLevel === 1 || roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN';
    const isTP = !isAdmin && (roleLevel === 2 || roleCode === 'TRUONG_PHONG' || roleCode === 'TP');
    const userDept = session.departmentCode || session.department || '';
    const userEmp = session.empCode;

    if (!isAdmin && userEmp) {
      if (isTP) {
        clauses.push(`(department_id = ? OR assignee_emp_code = ? OR reporter_emp_code = ?)`);
        params.push(userDept, userEmp, userEmp);
      } else {
        clauses.push(`(assignee_emp_code = ? OR reporter_emp_code = ?)`);
        params.push(userEmp, userEmp);
      }
    }
  }

  const deptParam = searchParams.get('department_id');
  if (deptParam && session) {
    const perm = checkCrossDepartmentAccess(session, deptParam);
    if (!perm.allowed) {
      return { forbidden: true, error: perm.error };
    }
    clauses.push(`department_id = ?`);
    params.push(deptParam);
  }

  const status = searchParams.get('status');
  if (status) {
    clauses.push(`status = ?`);
    params.push(status);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return { whereSql, params, forbidden: false };
}

export async function GET(request: Request) {
  try {
    if (new Date() > new Date(SUNSET_DATE)) {
      return NextResponse.json({
        success: false,
        error: 'LEGACY_ENDPOINT_EXPIRED: Route /api/tasks/legacy đã hết hạn hỗ trợ vào ngày ' + SUNSET_DATE
      }, { status: 410 });
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const authHeader = request.headers.get('authorization') || '';
    console.warn(`[LEGACY_CALLER_LOG] Timestamp: ${new Date().toISOString()} | User-Agent: ${userAgent} | AuthPresent: ${!!authHeader}`);

    const token = authHeader.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const HARD_LIMIT = 100;
    const requestedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(HARD_LIMIT, Math.max(1, requestedLimit));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const offset = (page - 1) * limit;

    const whereResult = buildLegacyWhereClause(session, searchParams);
    if (whereResult.forbidden) {
      return NextResponse.json({ success: false, error: whereResult.error }, { status: 403 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: true, tasks: [], total: 0, legacy: true });
    }

    const { whereSql, params } = whereResult;
    const countQuery = `SELECT COUNT(*) as total FROM tasks ${whereSql}`;
    const totalResult: any = await db.prepare(countQuery).bind(...params).first().catch(() => ({ total: 0 }));
    const total = totalResult?.total || 0;

    const query = `SELECT * FROM tasks ${whereSql} ORDER BY updated_at DESC, created_at DESC, id DESC LIMIT ? OFFSET ?`;
    const { results } = await db.prepare(query).bind(...params, limit, offset).all();

    return NextResponse.json({
      success: true,
      tasks: results || [],
      total,
      page,
      limit,
      legacy: true,
      sunset_date: SUNSET_DATE
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
