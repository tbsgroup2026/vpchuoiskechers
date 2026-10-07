import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { recordAuditLog } from '@/lib/auditLogger';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const KANBAN_LISTS = [
  { id: 'list_BACKLOG', name: 'Backlog', sort_order: 0 },
  { id: 'list_TO_DO', name: 'Cần làm', sort_order: 1 },
  { id: 'list_DOING', name: 'Đang làm', sort_order: 2 },
  { id: 'list_REVIEW', name: 'Chờ duyệt', sort_order: 3 },
  { id: 'list_DONE', name: 'Hoàn thành', sort_order: 4 },
  { id: 'list_NEED_HELP', name: 'Cần hỗ trợ', sort_order: 5 },
];

function statusFromListId(listId: string): string {
  if (!listId) return 'TO_DO';
  const raw = listId.replace('list_', '').toUpperCase();
  if (['BACKLOG', 'TO_DO', 'DOING', 'REVIEW', 'DONE', 'NEED_HELP', 'CANCELLED'].includes(raw)) {
    return raw;
  }
  if (raw === 'PLAN' || raw === 'TODO' || raw === 'IN_PROGRESS') return 'DOING';
  return 'TO_DO';
}

function calculateColorState(deadline?: string | null): string {
  if (!deadline) return 'green';
  const now = new Date().getTime();
  const dlTime = new Date(deadline).getTime();
  if (isNaN(dlTime)) return 'green';
  const diffDays = (dlTime - now) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'red';
  if (diffDays <= 1) return 'yellow';
  return 'green';
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để xem danh sách thẻ công việc' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('board_id');

    if (!boardId) {
      return NextResponse.json({ success: false, error: 'board_id là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: true, lists: KANBAN_LISTS, cards: [] });

    const tasksSource = (process.env as any).TASKS_SOURCE || 'V2';

    if (tasksSource !== 'legacy') {
      try {
        const { results } = await db.prepare(`
          SELECT * FROM tasks
          WHERE project_id = ? OR department_id = ? OR project_id IS NULL
          ORDER BY kanban_position ASC, created_at DESC
        `).bind(boardId, boardId).all();

        const cards = (results || []).map((t: any) => ({
          id: t.id,
          list_id: `list_${t.status || 'TO_DO'}`,
          board_id: boardId,
          title: t.title,
          description: t.description || '',
          assignee_id: t.assignee_emp_code,
          assignee_name: t.assignee_name,
          deadline: t.due_date,
          status: t.status,
          color_state: calculateColorState(t.due_date),
          sort_order: t.kanban_position || 0,
          created_by: t.reporter_emp_code,
          created_at: t.created_at,
          updated_at: t.updated_at,
        }));

        return NextResponse.json({
          success: true,
          lists: KANBAN_LISTS,
          cards,
          source: 'V2_tasks_table',
        });
      } catch (err) {
        console.warn('Task-cards V2 query fallback to task_cards table:', err);
      }
    }

    // Legacy mode: query task_lists and task_cards
    await ensureKaizenSchema(db);

    const { results: lists } = await db.prepare(
      'SELECT * FROM task_lists WHERE board_id = ? ORDER BY sort_order ASC'
    ).bind(boardId).all();

    const { results: cards } = await db.prepare(
      'SELECT * FROM task_cards WHERE board_id = ? ORDER BY sort_order ASC, created_at DESC'
    ).bind(boardId).all();

    return NextResponse.json({
      success: true,
      lists: lists || [],
      cards: cards || [],
      source: 'legacy_task_cards',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { board_id, list_id, title, description = '', assignee_id = null, deadline = null, job_position_id = null } = body;

    if (!board_id || !list_id || !title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'board_id, list_id và title là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    const empCode = (session as any).empCode || 'USER';
    const cardId = `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const status = statusFromListId(list_id);
    const tasksSource = (process.env as any).TASKS_SOURCE || 'V2';

    if (tasksSource !== 'legacy') {
      try {
        const isProject = board_id.startsWith('PROJ') || board_id.startsWith('PRJ');
        const projectId = isProject ? board_id : null;
        const deptId = !isProject ? board_id : ((session as any).departmentCode || 'IT_DIGITAL');
        const startDate = new Date().toISOString().substring(0, 10);

        await db.prepare(`
          INSERT INTO tasks (
            id, code, title, description, scope, department_id, project_id,
            assignee_emp_code, assignee_name, reporter_emp_code, reviewer_emp_code,
            priority, start_date, due_date, status, progress, kanban_position,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Cán Bộ', ?, ?, 'MEDIUM', ?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          cardId, `TSK-${Math.floor(100 + Math.random() * 900)}`, title.trim(), description,
          isProject ? 'CROSS_DEPT' : 'DEPARTMENT', deptId, projectId,
          assignee_id || empCode, empCode, empCode,
          startDate, deadline || startDate, status
        ).run();

        recordAuditLog(
          session,
          'TASK_BOARD',
          'CREATE_TASK_CARD',
          cardId,
          null,
          { board_id, list_id, title: title.trim(), assignee_id, deadline, status },
          request
        ).catch(() => {});

        return NextResponse.json({ success: true, message: 'Đã tạo thẻ công việc thành công (bảng tasks)', id: cardId });
      } catch (err) {
        console.warn('Failed insert into tasks table from task-cards, fallback to legacy:', err);
      }
    }

    await ensureKaizenSchema(db);
    const colorState = calculateColorState(deadline);

    const sql = `
      INSERT INTO task_cards (
        id, list_id, board_id, title, description, assignee_id, deadline,
        status, color_state, job_position_id, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    await db.prepare(sql).bind(
      cardId, list_id, board_id, title.trim(), description, assignee_id, deadline, colorState, job_position_id, empCode
    ).run();

    recordAuditLog(
      session,
      'TASK_BOARD',
      'CREATE_TASK_CARD',
      cardId,
      null,
      { board_id, list_id, title: title.trim(), assignee_id, deadline, color_state: colorState },
      request
    ).catch(() => {});

    return NextResponse.json({ success: true, message: 'Đã tạo thẻ công việc thành công', id: cardId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { id, list_id, title, description, assignee_id, deadline, sort_order } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Mã thẻ id là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    const tasksSource = (process.env as any).TASKS_SOURCE || 'V2';

    if (tasksSource !== 'legacy') {
      try {
        const existing: any = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
        if (existing) {
          const newStatus = list_id ? statusFromListId(list_id) : existing.status;
          const newProgress = newStatus === 'DONE' ? 100 : existing.progress;

          await db.prepare(`
            UPDATE tasks
            SET status = ?,
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                assignee_emp_code = COALESCE(?, assignee_emp_code),
                due_date = COALESCE(?, due_date),
                kanban_position = COALESCE(?, kanban_position),
                progress = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(newStatus, title, description, assignee_id, deadline, sort_order, newProgress, id).run();

          recordAuditLog(
            session,
            'TASK_BOARD',
            'UPDATE_TASK_CARD',
            id,
            { status: existing.status, title: existing.title },
            { status: newStatus, title, assignee_id, deadline, sort_order },
            request
          ).catch(() => {});

          return NextResponse.json({ success: true, message: 'Đã cập nhật thẻ công việc (bảng tasks)' });
        }
      } catch (err) {
        console.warn('Failed update in tasks table from task-cards, fallback to legacy:', err);
      }
    }

    await ensureKaizenSchema(db);
    const existing: any = await db.prepare('SELECT * FROM task_cards WHERE id = ?').bind(id).first();
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thẻ công việc' }, { status: 404 });
    }

    let colorState = existing.color_state;
    const finalDeadline = deadline !== undefined ? deadline : existing.deadline;
    if (finalDeadline) {
      colorState = calculateColorState(finalDeadline);
    }

    const updateSql = `
      UPDATE task_cards
      SET list_id = COALESCE(?, list_id),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          assignee_id = COALESCE(?, assignee_id),
          deadline = COALESCE(?, deadline),
          color_state = ?,
          sort_order = COALESCE(?, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await db.prepare(updateSql).bind(list_id, title, description, assignee_id, deadline, colorState, sort_order, id).run();

    recordAuditLog(
      session,
      'TASK_BOARD',
      'UPDATE_TASK_CARD',
      id,
      { list_id: existing.list_id, title: existing.title, color_state: existing.color_state },
      { list_id, title, assignee_id, deadline, color_state: colorState, sort_order },
      request
    ).catch(() => {});

    return NextResponse.json({ success: true, message: 'Đã cập nhật thẻ công việc thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
