import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { recordAuditLog } from '@/lib/auditLogger';
import { getSessionUser } from '@/lib/taskPermissions';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    const user = await getSessionUser(session);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để truy cập Task Board' },
        { status: 401 }
      );
    }
    const { empCode, roleLevel, departmentCode } = user;

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: true, data: [] });

    const { searchParams } = new URL(request.url);
    const requestedDept = searchParams.get('department_id') || searchParams.get('dept');

    let query = '';
    let params: any[] = [];

    if (roleLevel <= 2) {
      if (requestedDept && requestedDept !== 'all') {
        query = `SELECT * FROM task_boards WHERE department_id = ? OR owner_id = ? OR type = 'personal' ORDER BY created_at DESC`;
        params = [requestedDept, empCode];
      } else {
        query = `SELECT * FROM task_boards ORDER BY created_at DESC`;
      }
    } else {
      query = `SELECT * FROM task_boards WHERE owner_id = ? OR type = 'personal' OR (department_id IS NOT NULL AND department_id = ?) ORDER BY created_at DESC`;
      params = [empCode, departmentCode];
    }

    const { results } = await db.prepare(query).bind(...params).all();

    if (!results || results.length === 0) {
      const defaultBoardId = `tb_${empCode}_personal`;
      const defaultLists = ['Plan', 'To Do', 'Doing', 'Need Help'];

      await db.prepare(
        "INSERT INTO task_boards (id, name, type, owner_id) VALUES (?, 'Board Cá Nhân', 'personal', ?)"
      ).bind(defaultBoardId, empCode).run().catch(() => {});

      for (let i = 0; i < defaultLists.length; i++) {
        const listId = `tl_${defaultBoardId}_${i}`;
        await db.prepare(
          "INSERT INTO task_lists (id, board_id, name, sort_order) VALUES (?, ?, ?, ?)"
        ).bind(listId, defaultBoardId, defaultLists[i], i).run().catch(() => {});
      }

      const { results: fresh } = await db.prepare('SELECT * FROM task_boards WHERE id = ?').bind(defaultBoardId).all();
      return NextResponse.json({ success: true, data: fresh || [] });
    }

    return NextResponse.json({ success: true, data: results || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;
    
    const user = await getSessionUser(session);
    if (!user) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    const { empCode, roleLevel, departmentCode } = user;

    const body = await request.json();
    const { name, type = 'personal', department_id = null } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Tên Task Board là bắt buộc' }, { status: 400 });
    }

    if (roleLevel > 2 && department_id && department_id !== departmentCode) {
      return NextResponse.json({ success: false, error: 'Bạn chỉ được tạo Board trong phòng ban của mình' }, { status: 403 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    await ensureKaizenSchema(db);

    const boardId = `tb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.prepare(
      'INSERT INTO task_boards (id, name, type, department_id, owner_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(boardId, name.trim(), type, department_id, empCode).run();

    const defaultLists = ['Plan', 'To Do', 'Doing', 'Need Help'];
    for (let i = 0; i < defaultLists.length; i++) {
      const listId = `tl_${boardId}_${i}`;
      await db.prepare(
        'INSERT INTO task_lists (id, board_id, name, sort_order) VALUES (?, ?, ?, ?)'
      ).bind(listId, boardId, defaultLists[i], i).run().catch(() => {});
    }

    await recordAuditLog(
      session,
      'TASK_BOARD',
      'CREATE_TASK_BOARD',
      boardId,
      null,
      { name, type, department_id, owner_id: empCode },
      request
    );

    return NextResponse.json({ success: true, message: 'Đã tạo Task Board thành công', id: boardId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
