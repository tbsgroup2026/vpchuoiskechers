import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { recordAuditLog } from '@/lib/auditLogger';
import { getTaskBoardPermissions, getCardPermissions, getSessionUser } from '@/lib/taskPermissions';
import { updateTaskAtomically } from '@/lib/services/taskCardUpdater';

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
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('board_id');
    if (!boardId) return NextResponse.json({ success: false, error: 'board_id là bắt buộc' }, { status: 400 });

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: true, lists: KANBAN_LISTS, cards: [] });

    const boardPerm = await getTaskBoardPermissions(db, boardId, session);
    if (!boardPerm.hasAccess) {
      return NextResponse.json({ success: false, error: boardPerm.error }, { status: boardPerm.status });
    }

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

        // Attach permissions to each card so UI doesn't have to duplicate logic
        for (const c of cards) {
          const perm = await getCardPermissions(db, c.id, session, tasksSource);
          c.permissions = perm.permissions;
        }

        return NextResponse.json({ success: true, lists: KANBAN_LISTS, cards, source: 'V2_tasks_table' });
      } catch (err) {
        // Fallback
      }
    }

    await ensureKaizenSchema(db);
    const { results: lists } = await db.prepare('SELECT * FROM task_lists WHERE board_id = ? ORDER BY sort_order ASC').bind(boardId).all();
    const { results: cards } = await db.prepare('SELECT * FROM task_cards WHERE board_id = ? ORDER BY sort_order ASC, created_at DESC').bind(boardId).all();
    
    for (const c of (cards || [])) {
      const perm = await getCardPermissions(db, (c as any).id, session, 'legacy');
      (c as any).permissions = perm.permissions;
    }

    return NextResponse.json({ success: true, lists: lists || [], cards: cards || [], source: 'legacy_task_cards' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;
    if (!session) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    const { board_id, list_id, title, description = '', assignee_id = null, deadline = null, job_position_id = null } = body;
    if (!board_id || !list_id || !title || !title.trim()) return NextResponse.json({ success: false, error: 'board_id, list_id và title là bắt buộc' }, { status: 400 });

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    const boardPerm = await getTaskBoardPermissions(db, board_id, session);
    if (!boardPerm.hasAccess) {
      return NextResponse.json({ success: false, error: boardPerm.error }, { status: boardPerm.status });
    }

    const { empCode } = boardPerm;
    const cardId = `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const status = statusFromListId(list_id);
    const tasksSource = (process.env as any).TASKS_SOURCE || 'V2';
    const colorState = calculateColorState(deadline);
    const writeToken = crypto.randomUUID();
    const isProject = board_id.startsWith('PROJ') || board_id.startsWith('PRJ');
    const projectId = isProject ? board_id : null;
    const deptId = !isProject ? board_id : (boardPerm.departmentCode || 'IT_DIGITAL');
    const startDate = new Date().toISOString().substring(0, 10);

    const qTaskCards = db.prepare(`
      INSERT INTO task_cards (
        id, list_id, board_id, title, description, assignee_id, deadline,
        status, color_state, job_position_id, created_by, version, write_token, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(cardId, list_id, board_id, title.trim(), description, assignee_id, deadline, colorState, job_position_id, empCode, writeToken);

    const qTasks = db.prepare(`
      INSERT INTO tasks (
        id, code, title, description, scope, department_id, project_id,
        assignee_emp_code, reporter_emp_code, priority, start_date, due_date, status, progress, kanban_position,
        version, write_token, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'MEDIUM', ?, ?, ?, 0, 0, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      cardId, `TSK-${Math.floor(100 + Math.random() * 900)}`, title.trim(), description,
      isProject ? 'CROSS_DEPT' : 'DEPARTMENT', deptId, projectId,
      assignee_id || empCode, empCode,
      startDate, deadline || startDate, status, writeToken
    );

    await ensureKaizenSchema(db);
    
    // Luôn ghi cả 2 bảng trong cùng 1 batch để đảm bảo đồng bộ
    await db.batch([qTaskCards, qTasks]);

    return NextResponse.json({ success: true, message: 'Đã tạo thẻ công việc thành công', id: cardId, version: 1 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;
    if (!session) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json();
    const { id, list_id, title, description, assignee_id, deadline, sort_order, priority, version } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Mã thẻ id là bắt buộc' }, { status: 400 });

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    const perm = await getCardPermissions(db, id, session);
    if (!perm.hasAccess) return NextResponse.json({ success: false, error: perm.error }, { status: perm.status });

    // Check what the user can do
    const newStatus = list_id ? statusFromListId(list_id) : null;
    
    // Normal employee cannot move to DONE (Hoàn thành) or REVIEW without permissions
    if (newStatus && newStatus === 'DONE' && !perm.permissions.canComplete && !perm.permissions.canReview) {
       return NextResponse.json({ success: false, error: 'Bạn không có quyền đánh giá hoàn thành thẻ này' }, { status: 403 });
    }
    if (newStatus && newStatus === 'REVIEW' && !perm.permissions.canComplete) {
       return NextResponse.json({ success: false, error: 'Bạn không có quyền chuyển thẻ sang chờ duyệt' }, { status: 403 });
    }

    if (!perm.permissions.canEditMeta && (assignee_id !== undefined || deadline !== undefined || priority !== undefined || title !== undefined || description !== undefined)) {
       return NextResponse.json({ success: false, error: 'Chỉ Trưởng phòng hoặc Admin mới được phép sửa chi tiết thẻ' }, { status: 403 });
    }
    
    if (list_id && !perm.permissions.canMove && !perm.permissions.canComplete) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền di chuyển thẻ này' }, { status: 403 });
    }

    const tasksSource = (process.env as any).TASKS_SOURCE || 'V2';
    const colorState = calculateColorState(deadline || perm.card.deadline);

    if (typeof version !== 'number') {
      return NextResponse.json({ success: false, error: 'Thiếu hoặc sai kiểu dữ liệu phiên bản (version)' }, { status: 428 });
    }

    const updates = {
      taskCardsSet: `
        list_id = COALESCE(?, list_id),
        status = COALESCE(?, status),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        assignee_id = COALESCE(?, assignee_id),
        deadline = COALESCE(?, deadline),
        color_state = ?,
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      `,
      taskCardsParams: [
        list_id,
        newStatus,
        perm.permissions.canEditMeta ? title : null,
        perm.permissions.canEditMeta ? description : null,
        perm.permissions.canEditMeta ? assignee_id : null,
        perm.permissions.canEditMeta ? deadline : null,
        colorState,
        sort_order
      ],
      tasksSet: `
        status = COALESCE(?, status),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        assignee_emp_code = COALESCE(?, assignee_emp_code),
        due_date = COALESCE(?, due_date),
        priority = COALESCE(?, priority),
        kanban_position = COALESCE(?, kanban_position),
        progress = CASE WHEN ? = 'DONE' THEN 100 ELSE progress END,
        updated_at = CURRENT_TIMESTAMP
      `,
      tasksParams: [
        newStatus,
        perm.permissions.canEditMeta ? title : null,
        perm.permissions.canEditMeta ? description : null,
        perm.permissions.canEditMeta ? assignee_id : null,
        perm.permissions.canEditMeta ? deadline : null,
        perm.permissions.canEditMeta ? priority : null,
        sort_order,
        newStatus
      ]
    };

    const updateResult = await updateTaskAtomically(db, session, id, version, updates, 'task_cards');

    if (updateResult.type === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: updateResult.error }, { status: 404 });
    }
    if (updateResult.type === 'FORBIDDEN') {
      return NextResponse.json({ success: false, error: updateResult.error }, { status: 403 });
    }
    if (updateResult.type === 'CONFLICT') {
      return NextResponse.json({ success: false, error: updateResult.error, latestCard: updateResult.latestCard }, { status: 409 });
    }
    if (updateResult.type === 'SYNC_ERROR') {
      return NextResponse.json({ success: false, error: updateResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã cập nhật thẻ thành công', version: updateResult.newVersion });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
