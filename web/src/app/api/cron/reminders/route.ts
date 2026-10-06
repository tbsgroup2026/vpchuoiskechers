import { NextResponse } from 'next/server';

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
    
    await db.prepare(`
      UPDATE business_trips
      SET payment_status = 'AWAITING_DOCS'
      WHERE status = 'APPROVED' 
        AND payment_status = 'NOT_STARTED' 
        AND end_date < ?
    `).bind(todayStr).run();

    const { results } = await db.prepare(`
      SELECT id, code, creator, end_date, title 
      FROM business_trips 
      WHERE payment_status IN ('AWAITING_DOCS', 'REJECTED_DOCS')
        AND (last_reminded_at IS NULL OR datetime(last_reminded_at) <= datetime('now', '-1 day'))
    `).all();

    if (!results || results.length === 0) {
      return NextResponse.json({ success: true, message: 'No reminders needed' });
    }

    let remindersSent = 0;
    for (const trip of results) {
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

    return NextResponse.json({ success: true, message: `Sent ${remindersSent} reminders` });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
