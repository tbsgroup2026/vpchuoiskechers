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
    if (!db) return NextResponse.json({ success: true, comments: [] });

    const { results: comments } = await db.prepare(`
      SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC
    `).bind(taskId).all();

    return NextResponse.json({ success: true, comments: comments || [] });
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
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Nội dung bình luận không được để trống' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    const commentId = `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const empCode = session.empCode || 'USER';

    await db.prepare(`
      INSERT INTO task_comments (id, task_id, author_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(commentId, taskId, empCode, content.trim()).run();

    // Activity log
    const logId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.prepare(`
      INSERT INTO task_activity_logs (id, task_id, actor_id, action, details) VALUES (?, ?, ?, ?, ?)
    `).bind(logId, taskId, empCode, 'ADD_COMMENT', `Bình luận: "${content.trim().substring(0, 60)}..."`).run();

    return NextResponse.json({
      success: true,
      message: 'Đã thêm bình luận',
      comment: {
        id: commentId,
        task_id: taskId,
        author_id: empCode,
        content: content.trim(),
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
