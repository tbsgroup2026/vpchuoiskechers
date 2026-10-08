import { NextResponse } from 'next/server';
import { getAuthUser, isAdminUser, isExecutiveOrAdmin } from '@/lib/auth';
import { calculateProjectMetrics } from '@/lib/services/taskMetrics';

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
    const user = await getAuthUser(request);
    if (!user || !user.empCode) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const projectId = params.id;
    const db = getDbBinding();

    if (db) {
      const project: any = await db.prepare(
        `SELECT * FROM projects WHERE (id = ? OR code = ?) AND archived_at IS NULL`
      ).bind(projectId, projectId).first().catch(() => null);

      if (project) {
        const { results: members } = await db.prepare(
          `SELECT * FROM project_members WHERE project_id = ?`
        ).bind(project.id).all().catch(() => ({ results: [] }));

        const { results: projectTasks } = await db.prepare(
          `SELECT * FROM tasks WHERE project_id = ?`
        ).bind(project.id).all().catch(() => ({ results: [] }));

        // Security / Authorization check
        const isSuper = isAdminUser(user) || isExecutiveOrAdmin(user);
        const isMember = (members || []).some((m: any) => m.emp_code === user.empCode);
        const isDepartmentMatch = project.scope === 'DEPARTMENT' && project.department_id === user.departmentCode;
        
        if (!isSuper && !isMember && !isDepartmentMatch) {
          return NextResponse.json({ success: false, error: 'FORBIDDEN: Bạn không có quyền truy cập dữ liệu/tài liệu của dự án này.' }, { status: 403 });
        }

        const metrics = calculateProjectMetrics(project.id, projectTasks || []);

        return NextResponse.json({
          success: true,
          project: {
            ...project,
            members: members || [],
            tasks: projectTasks || [],
            metrics,
          },
        });
      }
    }

    return NextResponse.json({ success: false, error: 'Không tìm thấy dự án' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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
    const { name, description, scope, department_id, manager_emp_code, manager_name, status, budget, end_date } = body;

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });
    }

    await db.prepare(`
      UPDATE projects
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          scope = COALESCE(?, scope),
          department_id = COALESCE(?, department_id),
          manager_emp_code = COALESCE(?, manager_emp_code),
          manager_name = COALESCE(?, manager_name),
          status = COALESCE(?, status),
          budget = COALESCE(?, budget),
          end_date = COALESCE(?, end_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? OR code = ?
    `).bind(name, description, scope, department_id, manager_emp_code, manager_name, status, budget, end_date, projectId, projectId).run();

    return NextResponse.json({ success: true, message: 'Đã cập nhật dự án thành công' });
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
    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });
    }

    // Soft delete: set archived_at
    await db.prepare(`UPDATE projects SET archived_at = CURRENT_TIMESTAMP WHERE id = ? OR code = ?`)
      .bind(projectId, projectId).run();

    return NextResponse.json({ success: true, message: 'Đã lưu trữ dự án thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
