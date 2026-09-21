import { NextResponse } from 'next/server';
import { getAuthUser, isDepartmentHead, isAdminUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để thực hiện bàn giao task (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { empCode, previousDepartmentId, newDepartmentId, handoverNote = '' } = body;

    const targetEmp = empCode || session.empCode;
    const oldDept = previousDepartmentId || session.departmentCode || 'OLD_DEPT';
    const newDept = newDepartmentId;

    if (!newDept) {
      return NextResponse.json(
        { success: false, error: 'newDepartmentId (phòng ban mới) là bắt buộc để bàn giao' },
        { status: 400 }
      );
    }

    const db = getDbBinding();
    let updatedCount = 0;

    if (db) {
      await ensureKaizenSchema(db);

      // Find all active/open tasks assigned to or reported by targetEmp
      const { results } = await db.prepare(`
        SELECT id, title, department_id FROM sys_my_tasks
        WHERE (assignee_emp_code = ? OR reporter_emp_code = ?)
          AND status NOT IN ('DONE', 'CANCELLED')
      `).bind(targetEmp, targetEmp).all();

      if (results && results.length > 0) {
        for (const task of results) {
          await db.prepare(`
            UPDATE sys_my_tasks
            SET handover_status = 'PENDING_HANDOVER',
                previous_department_id = COALESCE(department_id, ?),
                new_department_id = ?,
                handover_note = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(oldDept, newDept, handoverNote, task.id).run().catch(() => {});
          updatedCount++;
        }

        // Send notifications to BOTH Old and New Department Heads
        try {
          // 1. Notification to Old Department Head
          const notifOldId = `notif_${Date.now()}_old_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
            VALUES (?, 'TRUONG_PHONG', ?, ?, 'WARNING', '/work/tasks', CURRENT_TIMESTAMP)
          `).bind(
            notifOldId,
            `📋 Cảnh báo Bàn giao Task: Nhân viên ${targetEmp} chuyển phòng ban`,
            `Nhân viên ${targetEmp} chuyển từ ${oldDept} sang ${newDept}. Đã gắn nhãn Bàn giao cho ${updatedCount} task đang mở.`
          ).run().catch(() => {});

          // 2. Notification to New Department Head
          const notifNewId = `notif_${Date.now()}_new_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, target_role, title, message, type, link, created_at)
            VALUES (?, 'TRUONG_PHONG', ?, ?, 'INFO', '/work/tasks', CURRENT_TIMESTAMP)
          `).bind(
            notifNewId,
            `📋 Tiếp nhận Bàn giao Task từ nhân viên mới chuyển tới`,
            `Nhân viên ${targetEmp} vừa chuyển tới phòng ban ${newDept}. Có ${updatedCount} task đang chờ xác nhận bàn giao.`
          ).run().catch(() => {});
        } catch (e) {}
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã đưa ${updatedCount} task đang mở vào luồng PENDING_HANDOVER`,
      updatedCount,
      previousDepartmentId: oldDept,
      newDepartmentId: newDept,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
