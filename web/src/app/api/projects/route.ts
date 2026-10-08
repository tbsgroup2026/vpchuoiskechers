import { NextResponse } from 'next/server';
import { verifyToken, getAuthUser, isAdminUser, isExecutiveOrAdmin } from '@/lib/auth';
import { calculateProjectMetrics } from '@/lib/services/taskMetrics';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}



export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.empCode) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    const scope = searchParams.get('scope');
    const deptId = searchParams.get('department_id') || searchParams.get('dept');

    const db = getDbBinding();

    if (db) {
      try {
        let whereClauses: string[] = ["archived_at IS NULL"];
        let params: any[] = [];

        if (projectId) {
          whereClauses.push("(id = ? OR code = ?)");
          params.push(projectId, projectId);
        }

        if (scope) {
          whereClauses.push("scope = ?");
          params.push(scope);
        }

        if (deptId && deptId !== 'all') {
          whereClauses.push("(department_id = ? OR scope = 'CROSS_DEPT')");
          params.push(deptId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const { results: projects } = await db.prepare(`SELECT * FROM projects ${whereSql} ORDER BY created_at DESC`).bind(...params).all();

        if (projects && projects.length > 0) {
          // Enrich projects with members & task metrics
          let enrichedProjects = await Promise.all(
            projects.map(async (p: any) => {
              const { results: members } = await db.prepare(
                `SELECT * FROM project_members WHERE project_id = ?`
              ).bind(p.id).all().catch(() => ({ results: [] }));

              const { results: projectTasks } = await db.prepare(
                `SELECT * FROM tasks WHERE project_id = ?`
              ).bind(p.id).all().catch(() => ({ results: [] }));

              const metrics = calculateProjectMetrics(p.id, projectTasks || []);

              return {
                ...p,
                members: members || [],
                total_tasks: metrics.total_tasks,
                completed_tasks: metrics.completed_tasks,
                overdue_tasks: metrics.overdue_tasks,
                doing_tasks: metrics.doing_tasks,
                progress: metrics.progress,
              };
            })
          );

          // Security / Authorization Filter
          const isSuper = isAdminUser(user) || isExecutiveOrAdmin(user);
          if (!isSuper) {
            enrichedProjects = enrichedProjects.filter(p => {
              const isMember = p.members.some((m: any) => m.emp_code === user.empCode);
              const isDepartmentMatch = p.scope === 'DEPARTMENT' && p.department_id === user.departmentCode;
              return isMember || isDepartmentMatch;
            });
          }

          if (projectId) {
            if (enrichedProjects.length === 0) {
              return NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
            }
            return NextResponse.json({ success: true, project: enrichedProjects[0] });
          }

          return NextResponse.json({
            success: true,
            projects: enrichedProjects,
            count: enrichedProjects.length,
          });
        }
      } catch (err) {
        console.warn('Projects table query error:', err);
      }
    }

    if (projectId) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      projects: [],
      count: 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi lấy danh sách dự án';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      code,
      name,
      description = '',
      scope = 'DEPARTMENT',
      department_id = session.departmentCode || 'IT_DIGITAL',
      manager_emp_code = session.empCode,
      manager_name = session.name,
      start_date = new Date().toISOString().substring(0, 10),
      end_date,
      budget = 0,
      members = [],
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Tên dự án là bắt buộc' }, { status: 400 });
    }

    const projId = id || `PRJ-${Date.now().toString(36).toUpperCase()}`;
    const projCode = code || `PROJ-${Math.floor(100 + Math.random() * 900)}`;

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });
    }

    await db.prepare(`
      INSERT INTO projects (
        id, code, name, description, scope, department_id,
        manager_emp_code, manager_name, start_date, end_date, budget, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      projId, projCode, name.trim(), description, scope, department_id,
      manager_emp_code, manager_name, start_date, end_date || null, budget
    ).run();

    // Add manager as PROJECT_MANAGER in project_members
    await db.prepare(`
      INSERT INTO project_members (project_id, emp_code, emp_name, department_id, role, joined_at)
      VALUES (?, ?, ?, ?, 'PROJECT_MANAGER', CURRENT_TIMESTAMP)
    `).bind(projId, manager_emp_code, manager_name, department_id).run().catch(() => {});

    // Add additional members
    if (Array.isArray(members) && members.length > 0) {
      for (const m of members) {
        if (m.emp_code || m.empCode) {
          const empC = m.emp_code || m.empCode;
          const empN = m.emp_name || m.name || empC;
          const dept = m.department_id || m.department || department_id;
          const role = m.role || 'MEMBER';
          await db.prepare(`
            INSERT INTO project_members (project_id, emp_code, emp_name, department_id, role, joined_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(projId, empC, empN, dept, role).run().catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Tạo dự án mới thành công',
      project: {
        id: projId,
        code: projCode,
        name: name.trim(),
        scope,
        department_id,
        manager_emp_code,
        manager_name,
        status: 'IN_PROGRESS',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
