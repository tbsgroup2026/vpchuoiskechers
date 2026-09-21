import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { recordAuditLog } from '@/lib/auditLogger';

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
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
    const { result_description } = body;

    if (!result_description || !result_description.trim()) {
      return NextResponse.json(
        { success: false, error: 'Kết quả đã thực hiện (result_description) là bắt buộc trước khi gửi đánh giá' },
        { status: 400 }
      );
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 database binding unavailable' }, { status: 500 });
    }

    const existing: any = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first();
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy công việc' }, { status: 404 });
    }

    // Find review column if exists in the board
    const reviewColumn: any = await db.prepare(
      "SELECT id FROM task_board_columns WHERE board_id = ? AND semantic_type = 'REVIEW' LIMIT 1"
    ).bind(existing.board_id).first();

    const targetColumnId = reviewColumn?.id || existing.column_id;
    const empCode = session.empCode || 'USER';

    await db.prepare(`
      UPDATE tasks
      SET status = 'REVIEW',
          column_id = ?,
          result_description = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(targetColumnId, result_description.trim(), taskId).run();

    // Log Activity
    const logId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.prepare(
      'INSERT INTO task_activity_logs (id, task_id, actor_id, action, details) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      logId,
      taskId,
      empCode,
      'SUBMIT_REVIEW',
      `Nhân viên gửi kết quả đánh giá: "${result_description.trim().substring(0, 80)}..."`
    ).run();

    await recordAuditLog(
      session,
      'TBS_WORK',
      'SUBMIT_REVIEW',
      taskId,
      { status: existing.status },
      { status: 'REVIEW', result_description: result_description.trim() },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Đã gửi đánh giá thành công',
      task: {
        id: taskId,
        status: 'REVIEW',
        column_id: targetColumnId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
