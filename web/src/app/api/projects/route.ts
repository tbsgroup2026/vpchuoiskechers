import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/auditLogger';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

let isProjectSchemaEnsured = false;

async function ensureProjectSchema(db: any) {
  if (isProjectSchemaEnsured) return;

  try {
    // 1. Bảng Dự Án (projects)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        target_outcome TEXT,
        lead_department TEXT,
        collaborating_departments TEXT,
        manager_id TEXT,
        manager_emp_code TEXT,
        manager_name TEXT,
        status TEXT DEFAULT 'ACTIVE',
        progress INTEGER DEFAULT 0,
        start_date TEXT,
        end_date TEXT,
        is_test_data INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // Ensure columns in case table existed earlier
    const alterCols = [
      'ALTER TABLE projects ADD COLUMN lead_department TEXT',
      'ALTER TABLE projects ADD COLUMN collaborating_departments TEXT',
      'ALTER TABLE projects ADD COLUMN manager_id TEXT',
      'ALTER TABLE projects ADD COLUMN manager_emp_code TEXT',
      'ALTER TABLE projects ADD COLUMN manager_name TEXT',
      'ALTER TABLE projects ADD COLUMN target_outcome TEXT',
      'ALTER TABLE projects ADD COLUMN is_test_data INTEGER DEFAULT 0',
    ];
    for (const sql of alterCols) {
      await db.prepare(sql).run().catch(() => {});
    }

    // 2. Bảng Thành Viên Dự Án (project_members)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        emp_code TEXT NOT NULL,
        name TEXT NOT NULL,
        department TEXT,
        role TEXT DEFAULT 'MEMBER',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // 3. Kiểm tra xem đã có dự án nào chưa, nếu chưa seed dự án ban đầu
    const { results } = await db.prepare(`SELECT COUNT(*) as cnt FROM projects`).all().catch(() => ({ results: [{ cnt: 0 }] }));
    const count = results && results[0] ? Number(results[0].cnt) : 0;

    if (count === 0) {
      const nowStr = new Date().toISOString();
      await db.prepare(`
        INSERT INTO projects (
          id, code, name, description, lead_department, collaborating_departments,
          manager_emp_code, manager_name, status, progress, start_date, end_date, created_at, updated_at
        ) VALUES (
          'PRJ-01', 'PRJ-2026-001', 'Chuyển Đổi Số SKECHERS 2026',
          'Dự án số hóa toàn diện quy trình sản xuất, Gemba & MMTB Văn phòng chuỗi SKECHERS - TBS Group.',
          'IT_DIGITAL', '["P_SX", "P_QC", "P_HR_ADMIN", "P_KHO_VAN", "P_KE_HOACH"]',
          '202608001', 'Phạm Nguyễn Anh Huy', 'ACTIVE', 65, '2026-01-01', '2026-12-31', ?, ?
        )
      `).bind(nowStr, nowStr).run().catch(() => {});

      await db.prepare(`
        INSERT INTO projects (
          id, code, name, description, lead_department, collaborating_departments,
          manager_emp_code, manager_name, status, progress, start_date, end_date, created_at, updated_at
        ) VALUES (
          'PRJ-02', 'PRJ-2026-002', 'Tự Động Hóa Dây Chuyền & PPH Lean',
          'Nâng cấp dây chuyền tự động, kiểm soát PPH xưởng sản xuất và đồng bộ Kaizen 1-5-2.',
          'P_SX', '["IT_DIGITAL", "P_MMTB", "P_QC", "P_KE_TOAN"]',
          '202608003', 'Lê Hữu Nghĩa', 'ACTIVE', 40, '2026-03-01', '2026-11-30', ?, ?
        )
      `).bind(nowStr, nowStr).run().catch(() => {});

      // Seed members for PRJ-01
      const initialMembers = [
        { id: 'pm_1', project_id: 'PRJ-01', emp_code: '202608001', name: 'Phạm Nguyễn Anh Huy', department: 'IT_DIGITAL', role: 'PROJECT_MANAGER' },
        { id: 'pm_2', project_id: 'PRJ-01', emp_code: '202608002', name: 'Nguyễn Thị Lan Anh', department: 'P_HR_ADMIN', role: 'MEMBER' },
        { id: 'pm_3', project_id: 'PRJ-01', emp_code: '202608004', name: 'Bùi Thị Hằng', department: 'P_QC', role: 'MEMBER' },
        { id: 'pm_4', project_id: 'PRJ-01', emp_code: '202608005', name: 'Trần Thị Thu Hương', department: 'P_KE_TOAN', role: 'MEMBER' },
        { id: 'pm_5', project_id: 'PRJ-02', emp_code: '202608003', name: 'Lê Hữu Nghĩa', department: 'P_SX', role: 'PROJECT_MANAGER' },
        { id: 'pm_6', project_id: 'PRJ-02', emp_code: '202608001', name: 'Phạm Nguyễn Anh Huy', department: 'IT_DIGITAL', role: 'TECH_LEAD' },
      ];

      for (const m of initialMembers) {
        await db.prepare(`
          INSERT INTO project_members (id, project_id, emp_code, name, department, role)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(m.id, m.project_id, m.emp_code, m.name, m.department, m.role).run().catch(() => {});
      }
    }

    isProjectSchemaEnsured = true;
  } catch (e) {
    console.error('Failed to ensure project schema in D1', e);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id') || searchParams.get('code');
    const leadDept = searchParams.get('lead_department');
    const statusFilter = searchParams.get('status');

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Không thể kết nối cơ sở dữ liệu D1' },
        { status: 500 }
      );
    }

    await ensureProjectSchema(db);

    // Fetch projects
    let query = `SELECT * FROM projects`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (projectId) {
      conditions.push(`(id = ? OR code = ?)`);
      params.push(projectId, projectId);
    }
    if (leadDept && leadDept !== 'ALL') {
      conditions.push(`lead_department = ?`);
      params.push(leadDept);
    }
    if (statusFilter && statusFilter !== 'ALL') {
      conditions.push(`status = ?`);
      params.push(statusFilter);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY created_at DESC`;

    const { results: rawProjects } = await db.prepare(query).bind(...params).all();
    const projectsList = rawProjects || [];

    // Fetch members for all projects
    const { results: rawMembers } = await db.prepare(`SELECT * FROM project_members ORDER BY joined_at ASC`).all().catch(() => ({ results: [] }));
    const allMembers = rawMembers || [];

    // Fetch tasks linked to projects
    const { results: rawTasks } = await db.prepare(`
      SELECT id, code, title, status, progress, priority, due_date, assignee_emp_code, assignee_name,
             department_id, project_id, parent_task_id, blocked_by_task_id
      FROM sys_my_tasks
      WHERE project_id IS NOT NULL AND project_id != ''
    `).all().catch(() => ({ results: [] }));
    const allProjectTasks = rawTasks || [];

    // Bottleneck Detector Algorithm
    const now = new Date();
    const globalBottlenecks: any[] = [];

    // Assemble projects with members and dynamic progress
    const enrichedProjects = projectsList.map((p: any) => {
      const pMembers = allMembers
        .filter((m: any) => m.project_id === p.id || m.project_id === p.code)
        .map((m: any) => ({
          empCode: m.emp_code,
          name: m.name,
          department: m.department,
          role: m.role,
        }));

      const pTasks = allProjectTasks.filter(
        (t: any) => t.project_id === p.id || t.project_id === p.code
      );

      const totalTasks = pTasks.length;
      const doneTasks = pTasks.filter((t: any) => t.status === 'DONE').length;
      const calculatedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : (p.progress || 0);

      // Detect project bottlenecks
      pTasks.forEach((t: any) => {
        const blockedOthers = pTasks.filter(
          (o: any) => o.blocked_by_task_id === t.id || o.blocked_by_task_id === t.code
        );
        const blockedCount = blockedOthers.length;
        const isNotDone = t.status !== 'DONE';
        const isOverdue = Boolean(isNotDone && t.due_date && new Date(t.due_date) < now);
        const isBlockingCritical = blockedCount >= 2 && isNotDone && (t.progress || 0) < 50;

        if (isBlockingCritical || (isOverdue && blockedCount >= 1) || (isOverdue && t.status === 'DOING')) {
          globalBottlenecks.push({
            project_id: p.id,
            project_code: p.code,
            project_name: p.name,
            task_id: t.id,
            task_code: t.code,
            task_title: t.title,
            assignee_name: t.assignee_name || 'Chưa giao',
            assignee_emp_code: t.assignee_emp_code,
            department_id: t.department_id,
            status: t.status,
            progress: t.progress || 0,
            due_date: t.due_date,
            blocked_tasks_count: blockedCount,
            blocked_task_codes: blockedOthers.map((o: any) => o.code || o.id),
            reason: isBlockingCritical
              ? `⚠️ Đang chặn ${blockedCount} việc khác và tiến độ mới đạt ${t.progress || 0}%`
              : `🚨 Trễ hạn thực hiện (hạn: ${t.due_date}) và đang chặn ${blockedCount} công việc tiếp theo`,
          });
        }
      });

      let collaboratingDepts: string[] = [];
      try {
        collaboratingDepts = typeof p.collaborating_departments === 'string'
          ? JSON.parse(p.collaborating_departments)
          : (p.collaborating_departments || []);
      } catch {
        collaboratingDepts = [];
      }

      return {
        ...p,
        collaborating_departments: collaboratingDepts,
        progress: calculatedProgress,
        tasks_count: totalTasks,
        done_tasks_count: doneTasks,
        members: pMembers,
      };
    });

    if (projectId) {
      const singleProj = enrichedProjects.find((p: any) => p.id === projectId || p.code === projectId);
      if (!singleProj) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy dự án' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        project: singleProj,
        bottlenecks: globalBottlenecks.filter((b) => b.project_id === singleProj.id || b.project_code === singleProj.code),
      });
    }

    return NextResponse.json({
      success: true,
      projects: enrichedProjects,
      bottlenecks: globalBottlenecks,
      count: enrichedProjects.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie') || '';
    let token = authHeader?.replace('Bearer ', '');
    if (!token) {
      const match = cookieHeader.match(/tbs_token=([^;]+)/);
      if (match && match[1]) token = match[1];
    }

    const session = token ? await verifyToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, error: 'Yêu cầu đăng nhập để tạo dự án' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Dữ liệu JSON không hợp lệ' }, { status: 400 });
    }

    const name = (body.name || '').trim();
    const leadDepartment = (body.lead_department || body.leadDept || '').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Tên dự án là bắt buộc' }, { status: 400 });
    }
    if (!leadDepartment) {
      return NextResponse.json({ success: false, error: 'Phòng ban chủ trì là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Không thể kết nối cơ sở dữ liệu D1' }, { status: 500 });
    }

    await ensureProjectSchema(db);

    const year = new Date().getFullYear();
    const { results } = await db.prepare(`SELECT COUNT(*) as cnt FROM projects`).all().catch(() => ({ results: [{ cnt: 0 }] }));
    const count = results && results[0] ? Number(results[0].cnt) : 0;
    const generatedCode = body.code || `PRJ-${year}-${String(count + 1).padStart(3, '0')}`;
    const projectId = `prj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const collaboratingDepts = Array.isArray(body.collaborating_departments)
      ? JSON.stringify(body.collaborating_departments)
      : typeof body.collaborating_departments === 'string'
      ? body.collaborating_departments
      : '[]';

    const managerEmpCode = body.manager_emp_code || body.manager_id || session.empCode;
    const managerName = body.manager_name || session.name;
    const startDate = body.start_date || new Date().toISOString().substring(0, 10);
    const endDate = body.end_date || new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10);
    const status = body.status || 'ACTIVE';

    await db.prepare(`
      INSERT INTO projects (
        id, code, name, description, target_outcome, lead_department, collaborating_departments,
        manager_id, manager_emp_code, manager_name, status, progress, start_date, end_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      projectId,
      generatedCode,
      name,
      (body.description || '').trim(),
      (body.target_outcome || '').trim(),
      leadDepartment,
      collaboratingDepts,
      managerEmpCode,
      managerEmpCode,
      managerName,
      status,
      startDate,
      endDate
    ).run();

    // Insert manager as first project member
    await db.prepare(`
      INSERT INTO project_members (id, project_id, emp_code, name, department, role)
      VALUES (?, ?, ?, ?, ?, 'PROJECT_MANAGER')
    `).bind(`pm_${Date.now()}`, projectId, managerEmpCode, managerName, leadDepartment).run().catch(() => {});

    // Insert additional members if provided
    if (Array.isArray(body.members)) {
      for (const m of body.members) {
        if (m.empCode && m.empCode !== managerEmpCode) {
          await db.prepare(`
            INSERT INTO project_members (id, project_id, emp_code, name, department, role)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            `pm_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            projectId,
            m.empCode,
            m.name || '',
            m.department || '',
            m.role || 'MEMBER'
          ).run().catch(() => {});
        }
      }
    }

    logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      module: 'PROJECTS',
      action: 'CREATE_PROJECT',
      targetType: 'PROJECT',
      targetId: projectId,
      changesJson: { code: generatedCode, name, leadDepartment },
    });

    return NextResponse.json({
      success: true,
      id: projectId,
      code: generatedCode,
      message: `Đã khởi tạo thành công dự án liên phòng ban [${generatedCode}] ${name}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie') || '';
    let token = authHeader?.replace('Bearer ', '');
    if (!token) {
      const match = cookieHeader.match(/tbs_token=([^;]+)/);
      if (match && match[1]) token = match[1];
    }

    const session = token ? await verifyToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const projectId = body.id || body.projectId;
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'Thiếu projectId' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'DB binding missing' }, { status: 500 });
    }

    const existing: any = await db.prepare(`SELECT * FROM projects WHERE id = ? OR code = ?`).bind(projectId, projectId).first().catch(() => null);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    const newStatus = body.status || existing.status;
    const newProgress = body.progress !== undefined ? body.progress : existing.progress;
    const newDesc = body.description !== undefined ? body.description : existing.description;
    const newOutcome = body.target_outcome !== undefined ? body.target_outcome : existing.target_outcome;

    await db.prepare(`
      UPDATE projects
      SET status = ?, progress = ?, description = ?, target_outcome = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newStatus, newProgress, newDesc, newOutcome, existing.id).run();

    logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      module: 'PROJECTS',
      action: 'UPDATE_PROJECT',
      targetId: existing.id,
      changesJson: { status: newStatus, progress: newProgress },
    });

    return NextResponse.json({ success: true, message: 'Đã cập nhật thông tin dự án thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
