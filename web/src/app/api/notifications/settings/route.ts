import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getUserNotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/serverNotificationService';
import { logAudit } from '@/lib/auditLogger';

function getDb(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({
        success: true,
        data: { userId: session.empCode, ...DEFAULT_NOTIFICATION_SETTINGS },
      });
    }

    // Ensure table exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_notification_settings (
        user_id TEXT PRIMARY KEY,
        in_app_enabled INTEGER DEFAULT 1,
        web_push_enabled INTEGER DEFAULT 1,
        telegram_enabled INTEGER DEFAULT 0,
        telegram_chat_id TEXT,
        zalo_enabled INTEGER DEFAULT 0,
        notify_assigned INTEGER DEFAULT 1,
        notify_due_change INTEGER DEFAULT 1,
        notify_due_warning INTEGER DEFAULT 1,
        notify_review INTEGER DEFAULT 1,
        notify_overdue INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    const settings = await getUserNotificationSettings(db, session.empCode);
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database binding unavailable' }, { status: 500 });
    }

    const body = await request.json();
    const {
      inAppEnabled = true,
      webPushEnabled = true,
      telegramEnabled = false,
      telegramChatId = '',
      zaloEnabled = false,
      notifyAssigned = true,
      notifyDueChange = true,
      notifyDueWarning = true,
      notifyReview = true,
      notifyOverdue = true,
    } = body;

    // Ensure table exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_notification_settings (
        user_id TEXT PRIMARY KEY,
        in_app_enabled INTEGER DEFAULT 1,
        web_push_enabled INTEGER DEFAULT 1,
        telegram_enabled INTEGER DEFAULT 0,
        telegram_chat_id TEXT,
        zalo_enabled INTEGER DEFAULT 0,
        notify_assigned INTEGER DEFAULT 1,
        notify_due_change INTEGER DEFAULT 1,
        notify_due_warning INTEGER DEFAULT 1,
        notify_review INTEGER DEFAULT 1,
        notify_overdue INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      INSERT INTO user_notification_settings (
        user_id, in_app_enabled, web_push_enabled, telegram_enabled, telegram_chat_id, zalo_enabled,
        notify_assigned, notify_due_change, notify_due_warning, notify_review, notify_overdue, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        in_app_enabled = excluded.in_app_enabled,
        web_push_enabled = excluded.web_push_enabled,
        telegram_enabled = excluded.telegram_enabled,
        telegram_chat_id = excluded.telegram_chat_id,
        zalo_enabled = excluded.zalo_enabled,
        notify_assigned = excluded.notify_assigned,
        notify_due_change = excluded.notify_due_change,
        notify_due_warning = excluded.notify_due_warning,
        notify_review = excluded.notify_review,
        notify_overdue = excluded.notify_overdue,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      session.empCode,
      inAppEnabled ? 1 : 0,
      webPushEnabled ? 1 : 0,
      telegramEnabled ? 1 : 0,
      telegramChatId || null,
      zaloEnabled ? 1 : 0,
      notifyAssigned ? 1 : 0,
      notifyDueChange ? 1 : 0,
      notifyDueWarning ? 1 : 0,
      notifyReview ? 1 : 0,
      notifyOverdue ? 1 : 0
    ).run();

    logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      module: 'NOTIFICATIONS',
      action: 'UPDATE_SETTINGS',
      targetId: session.empCode,
      changesJson: body,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cài đặt thông báo thành công',
      data: {
        userId: session.empCode,
        inAppEnabled,
        webPushEnabled,
        telegramEnabled,
        telegramChatId,
        zaloEnabled,
        notifyAssigned,
        notifyDueChange,
        notifyDueWarning,
        notifyReview,
        notifyOverdue,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
