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
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      const { searchParams } = new URL(request.url);
      const roleParam = searchParams.get('role');

      let query = 'SELECT * FROM role_workspace_config ORDER BY role ASC, sort_order ASC';
      let bindings: any[] = [];

      if (roleParam) {
        query = 'SELECT * FROM role_workspace_config WHERE UPPER(role) = UPPER(?) ORDER BY sort_order ASC';
        bindings.push(roleParam);
      }

      const { results } = await db.prepare(query).bind(...bindings).all();

      return NextResponse.json({ success: true, data: results || [] });
    }

    return NextResponse.json({ success: true, data: [] });
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
    const { role, route, label, icon = 'IconChevronRight', sort_order = 0 } = body;

    if (!role || !route || !label) {
      return NextResponse.json({ success: false, error: 'Role, route và label là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    await ensureKaizenSchema(db);

    const id = `rwc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sql = `INSERT INTO role_workspace_config (id, role, route, label, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.prepare(sql).bind(id, role.toUpperCase(), route, label, icon, Number(sort_order) || 0).run();

    await recordAuditLog(
      session,
      'ADMIN_WORKSPACE',
      'CREATE_WORKSPACE_CONFIG',
      id,
      null,
      { role, route, label, icon, sort_order },
      request
    );

    return NextResponse.json({ success: true, message: 'Đã thêm cấu hình menu cho role thành công', id });
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 });
    }

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      await db.prepare('DELETE FROM role_workspace_config WHERE id = ?').bind(id).run();
      await recordAuditLog(session, 'ADMIN_WORKSPACE', 'DELETE_WORKSPACE_CONFIG', id, null, null, request);
    }

    return NextResponse.json({ success: true, message: 'Đã xóa cấu hình menu thành công' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
