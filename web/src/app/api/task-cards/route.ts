import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { recordAuditLog } from '@/lib/auditLogger';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
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
    if (!db) return NextResponse.json({ success: true, lists: [], cards: [] });

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

    await ensureKaizenSchema(db);

    const empCode = (session as any).empCode || 'USER';
    const cardId = `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Calculate initial color state according to deadline
    let colorState = 'green';
    if (deadline) {
      const now = new Date().getTime();
      const dlTime = new Date(deadline).getTime();
      const diffDays = (dlTime - now) / (1000 * 60 * 60 * 24);
      if (diffDays < 0) colorState = 'red';
      else if (diffDays <= 1) colorState = 'yellow';
    }

    const sql = `
      INSERT INTO task_cards (
        id, list_id, board_id, title, description, assignee_id, deadline,
        status, color_state, job_position_id, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    await db.prepare(sql).bind(
      cardId, list_id, board_id, title.trim(), description, assignee_id, deadline, colorState, job_position_id, empCode
    ).run();

    await recordAuditLog(
      session,
      'TASK_BOARD',
      'CREATE_TASK_CARD',
      cardId,
      null,
      { board_id, list_id, title: title.trim(), assignee_id, deadline, color_state: colorState },
      request
    );

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

    await ensureKaizenSchema(db);

    const existing: any = await db.prepare('SELECT * FROM task_cards WHERE id = ?').bind(id).first();
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thẻ công việc' }, { status: 404 });
    }

    let colorState = existing.color_state;
    const finalDeadline = deadline !== undefined ? deadline : existing.deadline;
    if (finalDeadline) {
      const now = new Date().getTime();
      const dlTime = new Date(finalDeadline).getTime();
      const diffDays = (dlTime - now) / (1000 * 60 * 60 * 24);
      if (diffDays < 0) colorState = 'red';
      else if (diffDays <= 1) colorState = 'yellow';
      else colorState = 'green';
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

    await recordAuditLog(
      session,
      'TASK_BOARD',
      'UPDATE_TASK_CARD',
      id,
      { list_id: existing.list_id, title: existing.title, color_state: existing.color_state },
      { list_id, title, assignee_id, deadline, color_state: colorState, sort_order },
      request
    );

    return NextResponse.json({ success: true, message: 'Đã cập nhật thẻ công việc thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
