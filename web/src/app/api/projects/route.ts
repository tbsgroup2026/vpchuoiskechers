import { NextResponse } from 'next/server';
import { verifyToken, getAuthUser } from '@/lib/auth';
import { calculateProjectMetrics } from '@/lib/services/taskMetrics';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const MOCK_PROJECTS = [
  {
    id: 'PRJ-DIGITAL-2026',
    code: 'PROJ-DIGITAL-2026',
    name: 'Chuyển Đổi Số SKECHERS 2026',
    description: 'Dự án số hóa toàn diện quy trình sản xuất, Gemba & MMTB Văn phòng chuỗi SKECHERS - TBS Group.',
    scope: 'CROSS_DEPT',
    department_id: 'IT_DIGITAL',
    manager_emp_code: '202608001',
    manager_name: 'Phạm Nguyễn Anh Huy',
    status: 'IN_PROGRESS',
    progress: 75,
    members: [
      { emp_code: '202608001', emp_name: 'Phạm Nguyễn Anh Huy', department_id: 'IT_DIGITAL', role: 'PROJECT_MANAGER' },
      { emp_code: 'NS-001', emp_name: 'Nguyễn Thị Lan Anh', department_id: 'NHAN_SU', role: 'MEMBER' },
      { emp_code: 'QC-001', emp_name: 'Bùi Thị Hằng', department_id: 'CHAT_LUONG_QC', role: 'MEMBER' },
      { emp_code: 'KT-001', emp_name: 'Trần Thị Thu Hương', department_id: 'KE_TOAN', role: 'MEMBER' },
    ],
  },
  {
    id: 'PRJ-AUTOMATION',
    code: 'PROJ-AUTO-2026',
    name: 'Tự Động Hóa Dây Chuyền Sản Xuất',
    description: 'Triển khai xe rùa tự động và bảng thông minh Gemba tại các nhà máy.',
    scope: 'DEPARTMENT',
    department_id: 'IT_DIGITAL',
    manager_emp_code: '202608001',
    manager_name: 'Phạm Nguyễn Anh Huy',
    status: 'IN_PROGRESS',
    progress: 60,
    members: [
      { emp_code: '202608001', emp_name: 'Phạm Nguyễn Anh Huy', department_id: 'IT_DIGITAL', role: 'PROJECT_MANAGER' },
      { emp_code: '202608003', emp_name: 'Trần Văn Hùng', department_id: 'PROD_MAY5', role: 'MEMBER' },
      { emp_code: '202608005', emp_name: 'Nguyễn Đức Thuấn', department_id: 'IT_DIGITAL', role: 'MEMBER' },
    ],
  }
];

export async function GET(request: Request) {
  try {
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
          const enrichedProjects = await Promise.all(
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

          if (projectId) {
            return NextResponse.json({ success: true, project: enrichedProjects[0] });
          }

          return NextResponse.json({
            success: true,
            projects: enrichedProjects,
            count: enrichedProjects.length,
          });
        }
      } catch (err) {
        console.warn('Projects table query error, using mock fallback:', err);
      }
    }

    // Fallback mock projects
    if (projectId) {
      const proj = MOCK_PROJECTS.find((p) => p.id === projectId || p.code === projectId);
      if (!proj) return NextResponse.json({ success: false, error: 'Không tìm thấy dự án' }, { status: 404 });
      return NextResponse.json({ success: true, project: proj });
    }

    return NextResponse.json({
      success: true,
      projects: MOCK_PROJECTS,
      count: MOCK_PROJECTS.length,
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
