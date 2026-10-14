import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dispatchNotification } from '@/lib/serverNotificationService';

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

    // Query task info for notification context
    const task: any = await db.prepare(`SELECT * FROM sys_my_tasks WHERE id = ?`).bind(taskId).first().catch(() => null);
    if (task) {
      // 1. Detect @mentions in comment
      const mentionMatches = content.match(/@([a-zA-Z0-9_\.\-]+)/g) || [];
      const mentionedCodes = new Set<string>();
      for (const m of mentionMatches) {
        const tag = m.substring(1).trim().toLowerCase();
        const u: any = await db.prepare(
          'SELECT emp_code, name FROM sys_users WHERE LOWER(emp_code) = ? OR LOWER(username) = ?'
        ).bind(tag, tag).first().catch(() => null);
        if (u && u.emp_code !== empCode) {
          mentionedCodes.add(u.emp_code);
        }
      }

      for (const targetCode of mentionedCodes) {
        dispatchNotification(db, {
          recipientEmpCode: targetCode,
          title: `Được nhắc đến: ${task.title}`,
          message: `${session.name || empCode} đã nhắc đến bạn: "${content.trim().substring(0, 100)}"`,
          eventType: 'TASK_MENTION',
          type: 'TASK',
          link: `/work?dept=my-tasks&task=${task.id}`,
          actorEmpCode: empCode,
          actorName: session.name,
        }).catch(() => {});
      }

      // 2. Notify assignee if someone else comments on their task
      if (task.assignee_emp_code && task.assignee_emp_code !== empCode && !mentionedCodes.has(task.assignee_emp_code)) {
        dispatchNotification(db, {
          recipientEmpCode: task.assignee_emp_code,
          title: `Bình luận mới: ${task.title}`,
          message: `${session.name || empCode} vừa bình luận: "${content.trim().substring(0, 80)}"`,
          eventType: 'TASK_MENTION',
          type: 'INFO',
          link: `/work?dept=my-tasks&task=${task.id}`,
          actorEmpCode: empCode,
          actorName: session.name,
        }).catch(() => {});
      }
    }

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
