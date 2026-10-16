import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { recordAuditLog } from '@/lib/auditLogger';
import { SYSTEM_USERS } from '@/lib/userProfiles';

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

    const board: any = await db.prepare('SELECT * FROM task_boards WHERE id = ?').bind(boardId).first().catch(() => null);
    if (!board) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bảng công việc' }, { status: 404 });
    }

    const empCode = (session as any).empCode || (session as any).userId || '';
    const userProfile = SYSTEM_USERS[empCode] || null;
    const userRoleLevel = userProfile?.roleLevel ?? ((session as any).roleLevel ?? 4);
    const userManagedDept = userProfile?.managedDepartmentId || userProfile?.departmentCode || (session as any).departmentCode || '';

    // Check board access permission:
    if (userRoleLevel > 2) {
      if (board.type === 'personal' && board.owner_id !== empCode) {
        return NextResponse.json({ success: false, error: 'FORBIDDEN', message: 'Bạn không có quyền truy cập bảng cá nhân của người khác!' }, { status: 403 });
      }
      if (board.type === 'department' && board.department_id && board.department_id !== userManagedDept) {
        return NextResponse.json({ success: false, error: 'FORBIDDEN', message: 'Bạn không có quyền truy cập bảng của phòng ban khác!' }, { status: 403 });
      }
    }

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

    const board: any = await db.prepare('SELECT * FROM task_boards WHERE id = ?').bind(board_id).first().catch(() => null);
    if (!board) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bảng công việc' }, { status: 404 });
    }

    const empCode = (session as any).empCode || (session as any).userId || 'USER';
    const userProfile = SYSTEM_USERS[empCode] || null;
    const userRoleLevel = userProfile?.roleLevel ?? ((session as any).roleLevel ?? 4);
    const userManagedDept = userProfile?.managedDepartmentId || userProfile?.departmentCode || (session as any).departmentCode || '';

    // Check board write permission:
    if (userRoleLevel > 2) {
      if (board.type === 'personal' && board.owner_id !== empCode) {
        return NextResponse.json({ success: false, error: 'FORBIDDEN', message: 'Bạn không có quyền thêm thẻ vào bảng cá nhân của người khác!' }, { status: 403 });
      }
      if (board.type === 'department' && board.department_id && board.department_id !== userManagedDept) {
        return NextResponse.json({ success: false, error: 'FORBIDDEN', message: 'Bạn không có quyền thêm thẻ vào bảng của phòng ban khác!' }, { status: 403 });
      }
    }

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

    const board: any = await db.prepare('SELECT * FROM task_boards WHERE id = ?').bind(existing.board_id).first().catch(() => null);

    const empCode = (session as any).empCode || (session as any).userId || '';
    const userProfile = SYSTEM_USERS[empCode] || null;
    const userRoleLevel = userProfile?.roleLevel ?? ((session as any).roleLevel ?? 4);
    const userManagedDept = userProfile?.managedDepartmentId || userProfile?.departmentCode || (session as any).departmentCode || '';

    // RBAC: Check permission to update card
    if (userRoleLevel >= 4) {
      const isCardAssignee = existing.assignee_id === empCode;
      const isCardCreator = existing.created_by === empCode;
      const isBoardOwner = board && board.owner_id === empCode;
      if (!isCardAssignee && !isCardCreator && !isBoardOwner) {
        return NextResponse.json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Nhân viên chỉ có quyền cập nhật thẻ công việc của chính mình hoặc do mình tạo!',
        }, { status: 403 });
      }
    } else if (userRoleLevel === 3) {
      if (board && board.type === 'department' && board.department_id !== userManagedDept && existing.assignee_id !== empCode && existing.created_by !== empCode) {
        return NextResponse.json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Trưởng phòng chỉ quản lý thẻ công việc trong phòng ban của mình!',
        }, { status: 403 });
      }
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

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('card_id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    await ensureKaizenSchema(db);

    const existing: any = await db.prepare('SELECT * FROM task_cards WHERE id = ?').bind(id).first().catch(() => null);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thẻ công việc' }, { status: 404 });
    }

    const board: any = await db.prepare('SELECT * FROM task_boards WHERE id = ?').bind(existing.board_id).first().catch(() => null);

    const empCode = (session as any).empCode || (session as any).userId || '';
    const userProfile = SYSTEM_USERS[empCode] || null;
    const userRoleLevel = userProfile?.roleLevel ?? ((session as any).roleLevel ?? 4);
    const userManagedDept = userProfile?.managedDepartmentId || userProfile?.departmentCode || (session as any).departmentCode || '';

    // RBAC Check for Card Deletion:
    if (userRoleLevel >= 4) {
      const isCardCreator = existing.created_by === empCode;
      const isBoardOwner = board && board.owner_id === empCode;
      if (!isCardCreator && !isBoardOwner) {
        return NextResponse.json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Nhân viên chỉ có thể xóa thẻ công việc do chính mình tạo ra!',
        }, { status: 403 });
      }
    } else if (userRoleLevel === 3) {
      if (board && board.type === 'department' && board.department_id !== userManagedDept && existing.created_by !== empCode) {
        return NextResponse.json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Trưởng phòng chỉ có thể xóa thẻ thuộc phòng ban của mình!',
        }, { status: 403 });
      }
    }

    await db.prepare('DELETE FROM task_cards WHERE id = ?').bind(id).run();
    await recordAuditLog(session, 'TASK_BOARD', 'DELETE_TASK_CARD', id, { title: existing.title }, null, request);

    return NextResponse.json({ success: true, message: 'Đã xóa thẻ công việc thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
