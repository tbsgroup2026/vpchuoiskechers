import { NextResponse } from 'next/server';
import { dispatchNotification } from '@/lib/serverNotificationService';

function getDb(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ success: false, message: 'No DB binding found' }, { status: 500 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let remindersSent = 0;

    // 1. Business Trip Documents Reminder
    await db.prepare(`
      UPDATE business_trips
      SET payment_status = 'AWAITING_DOCS'
      WHERE status = 'APPROVED' 
        AND payment_status = 'NOT_STARTED' 
        AND end_date < ?
    `).bind(todayStr).run().catch(() => {});

    const { results: tripResults } = await db.prepare(`
      SELECT id, code, creator, end_date, title 
      FROM business_trips 
      WHERE payment_status IN ('AWAITING_DOCS', 'REJECTED_DOCS')
        AND (last_reminded_at IS NULL OR datetime(last_reminded_at) <= datetime('now', '-1 day'))
    `).all().catch(() => ({ results: [] }));

    if (tripResults && tripResults.length > 0) {
      for (const trip of tripResults) {
        try {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(`
            INSERT INTO sys_notifications (id, emp_code, title, message, type, link, created_at)
            VALUES (?, ?, ?, ?, 'WARNING', ?, CURRENT_TIMESTAMP)
          `).bind(
            notifId,
            trip.creator,
            `🔔 Nhắc nộp chứng từ công tác: ${trip.code}`,
            `Chuyến công tác "${trip.title}" đã kết thúc. Vui lòng nộp hóa đơn và Giấy đi đường để Kế toán thanh toán/hoàn ứng.`,
            `/business-trip?tripId=${trip.id}`
          ).run();

          await db.prepare(`
            UPDATE business_trips SET last_reminded_at = CURRENT_TIMESTAMP WHERE id = ?
          `).bind(trip.id).run();
          
          remindersSent++;
        } catch (e) {
          console.error('Error sending reminder for trip:', trip.id, e);
        }
      }
    }

    // 2. Task 24h Deadline Warning (Due Today or Tomorrow)
    const { results: warningTasks } = await db.prepare(`
      SELECT id, code, title, assignee_emp_code, due_date
      FROM sys_my_tasks
      WHERE status NOT IN ('DONE', 'CANCELLED')
        AND due_date IS NOT NULL
        AND due_date >= date('now')
        AND due_date <= date('now', '+1 day')
    `).all().catch(() => ({ results: [] }));

    if (warningTasks && warningTasks.length > 0) {
      for (const task of warningTasks) {
        if (task.assignee_emp_code) {
          await dispatchNotification(db, {
            recipientEmpCode: task.assignee_emp_code,
            title: `⏳ Sắp đến hạn (24h): ${task.title}`,
            message: `Công việc [${task.code}] có hạn chót vào ${task.due_date}. Vui lòng kiểm tra tiến độ và hoàn thành đúng hạn.`,
            eventType: 'TASK_DUE_WARNING',
            type: 'WARNING',
            link: `/work?dept=my-tasks&task=${task.id}`,
          }).catch(() => {});
          remindersSent++;
        }
      }
    }

    // 3. Task Overdue Alert (Due date past, not completed)
    const { results: overdueTasks } = await db.prepare(`
      SELECT id, code, title, assignee_emp_code, reporter_emp_code, due_date
      FROM sys_my_tasks
      WHERE status NOT IN ('DONE', 'CANCELLED')
        AND due_date IS NOT NULL
        AND due_date < date('now')
    `).all().catch(() => ({ results: [] }));

    if (overdueTasks && overdueTasks.length > 0) {
      for (const task of overdueTasks) {
        // Notify Assignee
        if (task.assignee_emp_code) {
          await dispatchNotification(db, {
            recipientEmpCode: task.assignee_emp_code,
            title: `🚨 Quá hạn công việc: ${task.title}`,
            message: `Công việc [${task.code}] đã quá hạn từ ngày ${task.due_date}. Hãy cập nhật trạng thái hoặc gửi yêu cầu gia hạn ngay.`,
            eventType: 'TASK_OVERDUE',
            type: 'WARNING',
            link: `/work?dept=my-tasks&task=${task.id}`,
          }).catch(() => {});
          remindersSent++;
        }
        // Notify Reporter / Manager if different
        if (task.reporter_emp_code && task.reporter_emp_code !== task.assignee_emp_code) {
          await dispatchNotification(db, {
            recipientEmpCode: task.reporter_emp_code,
            title: `⚠️ Nhân viên trễ hạn: ${task.title}`,
            message: `Công việc [${task.code}] giao cho nhân viên (${task.assignee_emp_code}) đã quá hạn ngày ${task.due_date}.`,
            eventType: 'TASK_OVERDUE',
            type: 'WARNING',
            link: `/work?dept=my-tasks&task=${task.id}`,
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã xử lý thông báo nhắc nhở tự động (${remindersSent} lượt gửi)`,
      remindersSent,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
