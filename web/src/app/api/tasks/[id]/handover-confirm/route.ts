import { NextResponse } from 'next/server';
import { getAuthUser, isDepartmentHead, isAdminUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để xác nhận bàn giao (401 Unauthorized)' },
        { status: 401 }
      );
    }

    if (!isDepartmentHead(session) && !isAdminUser(session)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Trưởng phòng mới có quyền xác nhận bàn giao task (403 Forbidden)' },
        { status: 403 }
      );
    }

    const taskId = params.id;
    const body = await request.json();
    const { action = 'CONFIRM', targetDepartmentId, newAssigneeEmpCode } = body;

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      const existing: any = await db.prepare(`SELECT * FROM sys_my_tasks WHERE id = ?`).bind(taskId).first().catch(() => null);

      if (!existing) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy task chỉ định' }, { status: 404 });
      }

      const confirmedDept = targetDepartmentId || existing.new_department_id || existing.department_id;
      const confirmedAssignee = newAssigneeEmpCode || existing.assignee_emp_code;

      if (action === 'CONFIRM') {
        await db.prepare(`
          UPDATE sys_my_tasks
          SET department_id = ?,
              assignee_emp_code = ?,
              handover_status = 'HANDED_OVER',
              handover_confirmed_by = ?,
              handover_confirmed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(confirmedDept, confirmedAssignee, session.empCode, taskId).run();

        return NextResponse.json({
          success: true,
          message: `Đã hoàn tất bàn giao task ${existing.code || taskId} sang phòng ban ${confirmedDept}`,
          departmentId: confirmedDept,
          assigneeEmpCode: confirmedAssignee,
          handoverStatus: 'HANDED_OVER',
        });
      } else {
        // Keep in original department
        await db.prepare(`
          UPDATE sys_my_tasks
          SET handover_status = 'NONE',
              handover_confirmed_by = ?,
              handover_confirmed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(session.empCode, taskId).run();

        return NextResponse.json({
          success: true,
          message: `Đã hủy yêu cầu bàn giao task. Task tiếp tục ở lại phòng ban cũ.`,
          handoverStatus: 'NONE',
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Đã cập nhật trạng thái bàn giao (chế độ tạm)' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
