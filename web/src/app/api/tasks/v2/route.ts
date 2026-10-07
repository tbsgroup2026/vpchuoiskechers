/**
 * /api/tasks/v2 – API Task chuẩn hóa (bảng `tasks` mới).
 *
 * Phân quyền đầy đủ ở backend. Dùng bind parameters. Mọi thao tác GHI
 * được kiểm tra quyền trước khi execute SQL.
 *
 * Cờ chuyển đổi: biến env TASKS_SOURCE ('unified' | 'legacy').
 * Mặc định là 'unified'. Nếu cần rollback: đổi sang 'legacy'.
 */

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getTaskScopeFilter, canWriteTask, isValidStatus, VALID_STATUSES } from '@/lib/services/taskScope';
import { fetchMetrics } from '@/lib/services/taskMetrics';
import { logAudit } from '@/lib/auditLogger';
import { syncBackupToDrive } from '@/lib/driveBackup';

function getDb(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

function getTasksSource(): 'unified' | 'legacy' {
  const src = (process.env as any).TASKS_SOURCE;
  return src === 'legacy' ? 'legacy' : 'unified';
}

// ──────────────────────────────────────────────────────────────────────────────
// ENSURE TABLE – tạo bảng `tasks`, `projects`, `project_members` nếu chưa có
// ──────────────────────────────────────────────────────────────────────────────

let schemasEnsured = false;
async function ensureNewSchema(db: any) {
  if (!db || schemasEnsured) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        code TEXT,
        title TEXT NOT NULL,
        description TEXT,
        department_id TEXT,
        project_id TEXT,
        assignee_emp_code TEXT,
        assignee_department_id TEXT,
        reporter_emp_code TEXT,
        start_date DATE,
        due_date DATE,
        status TEXT DEFAULT 'TO_DO',
        sort_order INTEGER DEFAULT 0,
        progress INTEGER DEFAULT 0,
        tags TEXT,
        checklist_json TEXT,
        attachments_json TEXT,
        result_description TEXT,
        is_mock INTEGER DEFAULT 0,
        legacy_source TEXT,
        legacy_id TEXT,
        legacy_column_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        scope TEXT DEFAULT 'DEPARTMENT',
        department_id TEXT,
        status TEXT DEFAULT 'ACTIVE',
        description TEXT,
        color_theme TEXT DEFAULT 'green',
        is_mock INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id TEXT NOT NULL,
        emp_code TEXT NOT NULL,
        project_role TEXT DEFAULT 'MEMBER',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, emp_code)
      )
    `).run().catch(() => {});

    // Indexes
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_emp_code)`).run().catch(() => {});
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks(department_id)`).run().catch(() => {});
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_assignee_dept ON tasks(assignee_department_id)`).run().catch(() => {});
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)`).run().catch(() => {});
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`).run().catch(() => {});
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`).run().catch(() => {});

    schemasEnsured = true;
  } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/tasks/v2
// ──────────────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Yêu cầu đăng nhập' }, { status: 401 });
  }

  // Nếu đang ở chế độ legacy, redirect về API cũ
  if (getTasksSource() === 'legacy') {
    return NextResponse.json({
      success: false,
      error: 'API này đang ở chế độ legacy. Dùng /api/tasks',
      redirect: '/api/tasks',
    }, { status: 503 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Database không khả dụng' }, { status: 500 });
  }

  await ensureNewSchema(db);

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const deptId = searchParams.get('department_id');
  const statusFilter = searchParams.get('status');
  const metricsOnly = searchParams.get('metrics') === '1';

  // Build WHERE clause với scope filter
  const scopeFilter = getTaskScopeFilter(user);
  let whereParts = [scopeFilter.sql];
  let params: unknown[] = [...scopeFilter.params];

  // Thêm filter tùy chọn
  if (projectId) {
    whereParts.push('project_id = ?');
    params.push(projectId);
  }
  if (deptId) {
    whereParts.push('department_id = ?');
    params.push(deptId);
  }
  if (statusFilter && isValidStatus(statusFilter)) {
    whereParts.push('status = ?');
    params.push(statusFilter);
  }

  const whereClause = whereParts.join(' AND ');

  // Nếu chỉ cần KPI (metrics), không cần fetch toàn bộ task
  if (metricsOnly) {
    const metrics = await fetchMetrics(db, whereClause, params);
    return NextResponse.json({ success: true, metrics });
  }

  try {
    const { results } = await db.prepare(
      `SELECT * FROM tasks WHERE ${whereClause} ORDER BY created_at DESC LIMIT 200`
    ).bind(...params).all();

    // Parse JSON fields
    const tasks = (results || []).map((t: any) => ({
      ...t,
      checklist: (() => {
        try { return JSON.parse(t.checklist_json || '[]'); } catch { return []; }
      })(),
      attachments: (() => {
        try { return JSON.parse(t.attachments_json || '[]'); } catch { return []; }
      })(),
    }));

    // Kèm metrics
    const metrics = await fetchMetrics(db, whereClause, params);

    return NextResponse.json({ success: true, tasks, metrics });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/tasks/v2
// ──────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Yêu cầu đăng nhập' }, { status: 401 });
  }

  if (getTasksSource() === 'legacy') {
    return NextResponse.json({ success: false, error: 'Dùng /api/tasks để tạo task' }, { status: 410 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ success: false, error: 'Database không khả dụng' }, { status: 500 });

  await ensureNewSchema(db);

  let body: any = {};
  try { body = await request.json(); } catch {
    return NextResponse.json({ success: false, error: 'Dữ liệu JSON không hợp lệ' }, { status: 400 });
  }

  const { title, description = '', due_date, project_id = null, department_id, tags = 'TASK', checklist = [], attachments = [] } = body;

  if (!title?.trim()) {
    return NextResponse.json({ success: false, error: 'Tiêu đề công việc là bắt buộc' }, { status: 400 });
  }

  // Xác định assignee và assignee_department_id
  let assigneeEmpCode = body.assignee_emp_code || user.empCode;
  const assigneeDeptId = body.assignee_department_id || department_id || user.departmentCode || null;
  const deptId = department_id || user.departmentCode || null;

  // Kiểm tra quyền giao task cho người khác
  const roleLevel = user.roleLevel ?? 4;
  if (assigneeEmpCode !== user.empCode && roleLevel > 3) {
    return NextResponse.json({ success: false, error: 'Không có quyền giao task cho người khác' }, { status: 403 });
  }

  // Validate due_date format
  const validatedDueDate = due_date && /^\d{4}-\d{2}-\d{2}$/.test(due_date) ? due_date : null;

  const newId = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newCode = `TSK-${Math.floor(100 + Math.random() * 900)}`;
  const startDate = new Date().toISOString().substring(0, 10);

  await db.prepare(`
    INSERT INTO tasks (
      id, code, title, description, department_id, project_id,
      assignee_emp_code, assignee_department_id, reporter_emp_code,
      start_date, due_date, status, progress, tags,
      checklist_json, attachments_json, result_description,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TO_DO', 0, ?, ?, ?, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    newId, newCode, title.trim(), description.trim(), deptId, project_id,
    assigneeEmpCode, assigneeDeptId, user.empCode,
    startDate, validatedDueDate, tags,
    JSON.stringify(checklist), JSON.stringify(attachments)
  ).run();

  logAudit(request, { empCode: user.empCode, empName: user.name, module: 'TASKS_V2', action: 'CREATE_TASK', targetId: newId, changesJson: body }).catch(() => {});
  syncBackupToDrive('TASKS', { id: newId, title }, 'CREATE_TASK').catch(() => {});

  return NextResponse.json({ success: true, message: 'Tạo công việc thành công', taskId: newId });
}

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/tasks/v2
// ──────────────────────────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Yêu cầu đăng nhập' }, { status: 401 });
  }

  if (getTasksSource() === 'legacy') {
    return NextResponse.json({ success: false, error: 'Dùng /api/tasks để cập nhật task' }, { status: 410 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ success: false, error: 'Database không khả dụng' }, { status: 500 });

  let body: any = {};
  try { body = await request.json(); } catch {
    return NextResponse.json({ success: false, error: 'Dữ liệu JSON không hợp lệ' }, { status: 400 });
  }

  const { taskId, status, progress, resultDescription, checklist, attachments } = body;
  if (!taskId) return NextResponse.json({ success: false, error: 'taskId là bắt buộc' }, { status: 400 });

  // Validate status whitelist
  if (status !== undefined && !isValidStatus(status)) {
    return NextResponse.json({
      success: false,
      error: `Status không hợp lệ. Giá trị cho phép: ${VALID_STATUSES.join(', ')}`,
    }, { status: 400 });
  }

  // Fetch task gốc từ DB
  const existing: any = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first().catch(() => null);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy công việc' }, { status: 404 });
  }

  // Kiểm tra quyền ghi
  const action = (status !== undefined || progress !== undefined || checklist !== undefined || attachments !== undefined)
    ? 'UPDATE_STATUS'
    : 'UPDATE_CONTENT';

  const allowed = await canWriteTask(user, existing, action, db);
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền cập nhật công việc này' }, { status: 403 });
  }

  // Nếu chuyển sang DONE, bắt buộc có result_description
  if (status === 'DONE') {
    const rd = (resultDescription || '').trim();
    if (!rd || rd.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Bắt buộc nhập mô tả kết quả (tối thiểu 10 ký tự) khi hoàn thành công việc',
      }, { status: 400 });
    }
  }

  // Xây dựng update
  let newStatus = status !== undefined ? status : existing.status;
  let newProgress = progress !== undefined ? Number(progress) : existing.progress;
  let newResult = resultDescription !== undefined ? resultDescription : existing.result_description;

  // Nếu DONE → progress = 100
  if (newStatus === 'DONE') newProgress = 100;
  // Nếu mở lại từ DONE → không tự set progress, giữ nguyên giá trị mới
  if (existing.status === 'DONE' && newStatus !== 'DONE' && progress === undefined) {
    newProgress = 0; // Reset khi mở lại
  }

  // Checklist
  let checklistArr: any[] = [];
  try { checklistArr = JSON.parse(existing.checklist_json || '[]'); } catch { checklistArr = []; }
  if (checklist !== undefined && Array.isArray(checklist)) {
    checklistArr = checklist;
    const doneCount = checklistArr.filter((c: any) => c.completed).length;
    if (checklistArr.length > 0 && progress === undefined) {
      newProgress = Math.round((doneCount / checklistArr.length) * 100);
    }
  }

  // Attachments
  let attachmentsArr: any[] = [];
  try { attachmentsArr = JSON.parse(existing.attachments_json || '[]'); } catch { attachmentsArr = []; }
  if (attachments !== undefined && Array.isArray(attachments)) attachmentsArr = attachments;

  await db.prepare(`
    UPDATE tasks
    SET status = ?, progress = ?, result_description = ?,
        checklist_json = ?, attachments_json = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(newStatus, newProgress, newResult, JSON.stringify(checklistArr), JSON.stringify(attachmentsArr), taskId).run();

  logAudit(request, { empCode: user.empCode, empName: user.name, module: 'TASKS_V2', action: 'UPDATE_TASK', targetId: taskId, changesJson: body }).catch(() => {});
  syncBackupToDrive('TASKS', { taskId, updatedBy: user.empCode, status: newStatus }, 'UPDATE_TASK').catch(() => {});

  return NextResponse.json({ success: true, message: 'Đã cập nhật công việc' });
}

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/tasks/v2
// ──────────────────────────────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Yêu cầu đăng nhập' }, { status: 401 });
  }

  if (getTasksSource() === 'legacy') {
    return NextResponse.json({ success: false, error: 'Dùng /api/tasks để xóa task' }, { status: 410 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ success: false, error: 'Database không khả dụng' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  if (!taskId) return NextResponse.json({ success: false, error: 'taskId là bắt buộc' }, { status: 400 });

  const existing: any = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first().catch(() => null);
  if (!existing) return NextResponse.json({ success: false, error: 'Không tìm thấy công việc' }, { status: 404 });

  const allowed = await canWriteTask(user, existing, 'DELETE', db);
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xóa công việc này' }, { status: 403 });
  }

  await db.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId).run();

  logAudit(request, { empCode: user.empCode, empName: user.name, module: 'TASKS_V2', action: 'DELETE_TASK', targetId: taskId, changesJson: { taskId } }).catch(() => {});

  return NextResponse.json({ success: true, message: 'Đã xóa công việc' });
}
