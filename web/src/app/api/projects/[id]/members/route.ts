import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const db = getDbBinding();

    if (db) {
      const { results } = await db.prepare(
        `SELECT * FROM project_members WHERE project_id = ? ORDER BY joined_at ASC`
      ).bind(projectId).all().catch(() => ({ results: [] }));

      return NextResponse.json({ success: true, members: results || [] });
    }

    return NextResponse.json({ success: true, members: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();
    const { empCode, emp_code, empName, emp_name, departmentId, department_id, role = 'MEMBER' } = body;

    const code = empCode || emp_code;
    const name = empName || emp_name || code;
    const dept = departmentId || department_id || 'IT_DIGITAL';

    if (!code) {
      return NextResponse.json({ success: false, error: 'emp_code là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });
    }

    await db.prepare(`
      INSERT INTO project_members (project_id, emp_code, emp_name, department_id, role, joined_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id, emp_code) DO UPDATE SET
        emp_name = excluded.emp_name,
        department_id = excluded.department_id,
        role = excluded.role
    `).bind(projectId, code, name, dept, role).run();

    return NextResponse.json({ success: true, message: `Đã thêm thành viên ${name} (${code}) vào dự án` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const projectId = params.id;
    const { searchParams } = new URL(request.url);
    const empCode = searchParams.get('emp_code') || searchParams.get('empCode');

    if (!empCode) {
      return NextResponse.json({ success: false, error: 'emp_code là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });
    }

    await db.prepare(`DELETE FROM project_members WHERE project_id = ? AND emp_code = ?`)
      .bind(projectId, empCode).run();

    return NextResponse.json({ success: true, message: `Đã xóa thành viên ${empCode} khỏi dự án` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
