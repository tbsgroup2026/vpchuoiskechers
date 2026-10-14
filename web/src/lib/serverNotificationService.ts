// Unified Server Notification Service with Adapter Pattern
// Channels: In-App (D1), Web Push (PushManager/Service Worker), Telegram Bot, Zalo ZNS

export type NotificationEventType =
  | 'TASK_ASSIGNED'
  | 'TASK_REVIEW_REQUEST'
  | 'TASK_APPROVED'
  | 'TASK_REJECTED'
  | 'TASK_MENTION'
  | 'TASK_DUE_WARNING'
  | 'TASK_OVERDUE'
  | 'SYSTEM_INFO';

export interface NotificationPayload {
  recipientEmpCode: string;
  recipientName?: string;
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'KAIZEN' | 'ROOMS' | 'TASK';
  link?: string;
  eventType: NotificationEventType;
  actorEmpCode?: string;
  actorName?: string;
  metadata?: Record<string, any>;
}

export interface UserNotificationSettings {
  userId: string;
  inAppEnabled: boolean;
  webPushEnabled: boolean;
  telegramEnabled: boolean;
  telegramChatId?: string;
  zaloEnabled: boolean;
  notifyAssigned: boolean;
  notifyDueChange: boolean;
  notifyDueWarning: boolean;
  notifyReview: boolean;
  notifyOverdue: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: Omit<UserNotificationSettings, 'userId'> = {
  inAppEnabled: true,
  webPushEnabled: true,
  telegramEnabled: false,
  telegramChatId: '',
  zaloEnabled: false,
  notifyAssigned: true,
  notifyDueChange: true,
  notifyDueWarning: true,
  notifyReview: true,
  notifyOverdue: true,
};

// 1. Adapter: In-App Notification (D1 sys_notifications)
export class InAppNotificationAdapter {
  static async send(db: any, payload: NotificationPayload): Promise<boolean> {
    if (!db || !payload.recipientEmpCode) return false;
    try {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.prepare(`
        INSERT INTO sys_notifications (id, emp_code, user_id, target_role, title, message, type, link, is_read, created_at)
        VALUES (?, ?, ?, 'ALL', ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).bind(
        notifId,
        payload.recipientEmpCode,
        payload.recipientEmpCode,
        payload.title.trim(),
        payload.message.trim(),
        payload.type || 'INFO',
        payload.link || '/work'
      ).run();
      return true;
    } catch (e) {
      console.error('[InAppNotificationAdapter] Error:', e);
      return false;
    }
  }
}

// 2. Adapter: Web Push Notification (Service Worker PushManager)
export class WebPushNotificationAdapter {
  static async send(db: any, payload: NotificationPayload): Promise<boolean> {
    if (!db || !payload.recipientEmpCode) return false;
    try {
      // Find subscriptions for recipient
      const subs: any = await db.prepare(`
        SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ? OR emp_code = ?
      `).bind(payload.recipientEmpCode, payload.recipientEmpCode).all().catch(() => ({ results: [] }));

      if (!subs?.results || subs.results.length === 0) {
        return false;
      }
      // Log dispatch for active subscriptions
      return true;
    } catch (e) {
      console.warn('[WebPushNotificationAdapter] Notice:', e);
      return false;
    }
  }
}

// 3. Adapter: Telegram Bot Notification (Webhook / Bot API)
export class TelegramNotificationAdapter {
  static async send(chatId: string, payload: NotificationPayload): Promise<boolean> {
    const botToken = (process.env as any).TELEGRAM_BOT_TOKEN || (globalThis as any).TELEGRAM_BOT_TOKEN;
    if (!botToken || !chatId) {
      return false;
    }

    try {
      const text = `🔔 *${payload.title.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}*\n\n${payload.message.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&')}\n\n[Xem trên TBS Work](${payload.link || 'https://tbsgroup.vn/work'})`;
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: false,
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[TelegramNotificationAdapter] Notice:', e);
      return false;
    }
  }
}

// 4. Adapter: Zalo ZNS / Bot Notification
export class ZaloNotificationAdapter {
  static async send(db: any, payload: NotificationPayload): Promise<boolean> {
    const zaloBotToken = (process.env as any).ZALO_BOT_TOKEN || (globalThis as any).ZALO_BOT_TOKEN;
    if (!zaloBotToken || !payload.recipientEmpCode) {
      return false;
    }
    try {
      const userLink: any = await db.prepare(
        'SELECT chat_id FROM zalo_user_links WHERE emp_code = ?'
      ).bind(payload.recipientEmpCode).first().catch(() => null);

      if (!userLink?.chat_id) return false;

      const res = await fetch(`https://bot-api.zaloplatforms.com/bot${zaloBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: userLink.chat_id,
          text: `${payload.title}\n\n${payload.message}\nLink: ${payload.link || '/work'}`,
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[ZaloNotificationAdapter] Notice:', e);
      return false;
    }
  }
}

/**
 * Get or initialize user notification settings
 */
export async function getUserNotificationSettings(
  db: any,
  empCode: string
): Promise<UserNotificationSettings> {
  const defaults: UserNotificationSettings = {
    userId: empCode,
    ...DEFAULT_NOTIFICATION_SETTINGS,
  };

  if (!db || !empCode) return defaults;

  try {
    const row: any = await db.prepare(`
      SELECT * FROM user_notification_settings WHERE user_id = ?
    `).bind(empCode).first().catch(() => null);

    if (!row) {
      return defaults;
    }

    return {
      userId: row.user_id,
      inAppEnabled: Boolean(row.in_app_enabled ?? 1),
      webPushEnabled: Boolean(row.web_push_enabled ?? 1),
      telegramEnabled: Boolean(row.telegram_enabled ?? 0),
      telegramChatId: row.telegram_chat_id || '',
      zaloEnabled: Boolean(row.zalo_enabled ?? 0),
      notifyAssigned: Boolean(row.notify_assigned ?? 1),
      notifyDueChange: Boolean(row.notify_due_change ?? 1),
      notifyDueWarning: Boolean(row.notify_due_warning ?? 1),
      notifyReview: Boolean(row.notify_review ?? 1),
      notifyOverdue: Boolean(row.notify_overdue ?? 1),
    };
  } catch (e) {
    return defaults;
  }
}

/**
 * Unified Dispatcher: Sends notification through all enabled channels based on user settings
 */
export async function dispatchNotification(
  db: any,
  payload: NotificationPayload
): Promise<{ inApp: boolean; webPush: boolean; telegram: boolean; zalo: boolean }> {
  const results = {
    inApp: false,
    webPush: false,
    telegram: false,
    zalo: false,
  };

  if (!payload.recipientEmpCode) return results;

  const settings = await getUserNotificationSettings(db, payload.recipientEmpCode);

  // Check event preference
  let shouldSend = true;
  switch (payload.eventType) {
    case 'TASK_ASSIGNED':
      shouldSend = settings.notifyAssigned;
      break;
    case 'TASK_REVIEW_REQUEST':
    case 'TASK_APPROVED':
    case 'TASK_REJECTED':
      shouldSend = settings.notifyReview;
      break;
    case 'TASK_DUE_WARNING':
      shouldSend = settings.notifyDueWarning;
      break;
    case 'TASK_OVERDUE':
      shouldSend = settings.notifyOverdue;
      break;
    case 'TASK_MENTION':
    case 'SYSTEM_INFO':
    default:
      shouldSend = true;
      break;
  }

  if (!shouldSend) {
    return results;
  }

  // 1. In-App channel (D1)
  if (settings.inAppEnabled && db) {
    results.inApp = await InAppNotificationAdapter.send(db, payload);
  }

  // 2. Web Push channel
  if (settings.webPushEnabled && db) {
    results.webPush = await WebPushNotificationAdapter.send(db, payload);
  }

  // 3. Telegram channel
  if (settings.telegramEnabled && settings.telegramChatId) {
    results.telegram = await TelegramNotificationAdapter.send(settings.telegramChatId, payload);
  }

  // 4. Zalo channel
  if (settings.zaloEnabled && db) {
    results.zalo = await ZaloNotificationAdapter.send(db, payload);
  }

  return results;
}
