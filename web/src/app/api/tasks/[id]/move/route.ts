import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { recordAuditLog } from '@/lib/auditLogger';

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function PATCH(
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
    const { targetColumnId, targetPosition, version } = body;

    if (!taskId || !targetColumnId || targetPosition === undefined) {
      return NextResponse.json(
        { success: false, error: 'taskId, targetColumnId và targetPosition là bắt buộc' },
        { status: 400 }
      );
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 database binding unavailable' }, { status: 500 });
    }

    const currentTask: any = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first();
    if (!currentTask) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy công việc' }, { status: 404 });
    }

    // Check Optimistic Locking Version mismatch
    if (version !== undefined && Number(version) !== Number(currentTask.version)) {
      return NextResponse.json(
        {
          success: false,
          error: 'CONFLICT',
          message: 'Dữ liệu công việc đã được cập nhật bởi người khác. Giao diện đã được làm mới.',
          currentTask,
        },
        { status: 409 }
      );
    }

    // Find semantic_type of target column to sync task.status
    const targetColumn: any = await db.prepare(
      'SELECT semantic_type FROM task_board_columns WHERE id = ?'
    ).bind(targetColumnId).first();

    let newStatus = currentTask.status;
    if (targetColumn && targetColumn.semantic_type) {
      switch (targetColumn.semantic_type) {
        case 'TODO':
          newStatus = 'TODO';
          break;
        case 'IN_PROGRESS':
          newStatus = 'DOING';
          break;
        case 'REVIEW':
          newStatus = 'REVIEW';
          break;
        case 'DONE':
          newStatus = 'DONE';
          break;
      }
    }

    const newVersion = Number(currentTask.version || 1) + 1;
    const empCode = session.empCode || 'USER';

    const updateSql = `
      UPDATE tasks
      SET column_id = ?,
          position = ?,
          status = ?,
          version = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await db.prepare(updateSql).bind(targetColumnId, targetPosition, newStatus, newVersion, taskId).run();

    // Log activity
    const logId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.prepare(
      'INSERT INTO task_activity_logs (id, task_id, actor_id, action, details) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      logId,
      taskId,
      empCode,
      'MOVE_TASK',
      `Di chuyển từ cột [${currentTask.column_id}] sang [${targetColumnId}], vị trí ${targetPosition}`
    ).run();

    await recordAuditLog(
      session,
      'TBS_WORK',
      'MOVE_TASK',
      taskId,
      { column_id: currentTask.column_id, position: currentTask.position, status: currentTask.status },
      { column_id: targetColumnId, position: targetPosition, status: newStatus, version: newVersion },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật vị trí công việc thành công',
      task: {
        id: taskId,
        column_id: targetColumnId,
        position: targetPosition,
        status: newStatus,
        version: newVersion,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
