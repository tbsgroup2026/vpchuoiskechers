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
    const { decision, rating = 5, note = '' } = body;

    if (!decision || !['APPROVE', 'REQUEST_CHANGES'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'decision phải là APPROVE hoặc REQUEST_CHANGES' },
        { status: 400 }
      );
    }

    if (decision === 'REQUEST_CHANGES' && (!note || !note.trim())) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập lý do yêu cầu chỉnh sửa (note)' },
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

    const empCode = session.empCode || 'MANAGER';
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Insert Task Review
    await db.prepare(`
      INSERT INTO task_reviews (id, task_id, reviewer_id, decision, rating, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(reviewId, taskId, empCode, decision, rating, note ? note.trim() : '').run();

    let targetSemantic = 'DONE';
    let newStatus = 'DONE';
    if (decision === 'REQUEST_CHANGES') {
      targetSemantic = 'IN_PROGRESS';
      newStatus = 'DOING';
    }

    // Find target column for targetSemantic
    const targetColumn: any = await db.prepare(
      'SELECT id FROM task_board_columns WHERE board_id = ? AND semantic_type = ? LIMIT 1'
    ).bind(existing.board_id, targetSemantic).first();

    const finalColumnId = targetColumn?.id || existing.column_id;

    await db.prepare(`
      UPDATE tasks
      SET status = ?,
          column_id = ?,
          reviewer_id = ?,
          completed_at = CASE WHEN ? = 'DONE' THEN CURRENT_TIMESTAMP ELSE completed_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newStatus, finalColumnId, empCode, newStatus, taskId).run();

    // Log activity
    const logId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const actionLabel = decision === 'APPROVE' ? 'APPROVE_TASK' : 'REQUEST_CHANGES_TASK';
    const detailsLabel = decision === 'APPROVE'
      ? `Cấp trên phê duyệt hoàn thành (Đánh giá ${rating}⭐): "${note || 'Tốt'}"`
      : `Cấp trên yêu cầu chỉnh sửa: "${note}"`;

    await db.prepare(
      'INSERT INTO task_activity_logs (id, task_id, actor_id, action, details) VALUES (?, ?, ?, ?, ?)'
    ).bind(logId, taskId, empCode, actionLabel, detailsLabel).run();

    await recordAuditLog(
      session,
      'TBS_WORK',
      actionLabel,
      taskId,
      { status: existing.status },
      { status: newStatus, decision, rating, note },
      request
    );

    return NextResponse.json({
      success: true,
      message: decision === 'APPROVE' ? 'Đã phê duyệt công việc hoàn thành' : 'Đã trả về yêu cầu chỉnh sửa',
      task: {
        id: taskId,
        status: newStatus,
        column_id: finalColumnId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
