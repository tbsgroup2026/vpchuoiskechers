import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: true, attachments: [] });

    const { results: attachments } = await db.prepare(`
      SELECT * FROM task_attachments WHERE task_id = ? ORDER BY created_at DESC
    `).bind(taskId).all();

    return NextResponse.json({ success: true, attachments: attachments || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { file_name, file_url, file_size = 0, mime_type = 'application/octet-stream' } = body;

    if (!file_name || !file_url) {
      return NextResponse.json({ success: false, error: 'file_name và file_url là bắt buộc' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    const attId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const empCode = session.empCode || 'USER';

    await db.prepare(`
      INSERT INTO task_attachments (id, task_id, uploader_id, file_name, file_url, file_size, mime_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(attId, taskId, empCode, file_name.trim(), file_url.trim(), file_size, mime_type).run();

    // Log Activity
    const logId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.prepare(`
      INSERT INTO task_activity_logs (id, task_id, actor_id, action, details) VALUES (?, ?, ?, ?, ?)
    `).bind(logId, taskId, empCode, 'ADD_ATTACHMENT', `Đính kèm tệp: ${file_name.trim()}`).run();

    return NextResponse.json({
      success: true,
      message: 'Đã đính kèm tệp thành công',
      attachment: {
        id: attId,
        task_id: taskId,
        file_name: file_name.trim(),
        file_url: file_url.trim(),
        file_size,
        mime_type,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
