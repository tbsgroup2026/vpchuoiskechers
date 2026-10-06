import { ensureKaizenSchema } from './kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export type ZaloPriority = 'EMERGENCY' | 'IMPORTANT' | 'NORMAL';

export interface SendZaloOptions {
  priority: ZaloPriority;
  eventType: string;
  recipientEmpCode?: string;
  chatId?: string;
  targetGroupType?: 'RECEPTION' | 'CONFIRMED' | 'PERSONAL';
  idempotencyKey?: string;
}

export function getZaloBotToken(): string {
  return (process.env as any).ZALO_BOT_TOKEN || (globalThis as any).ZALO_BOT_TOKEN || '';
}

export function getZaloWebhookSecret(): string {
  return (process.env as any).ZALO_WEBHOOK_SECRET || (globalThis as any).ZALO_WEBHOOK_SECRET || '';
}

/**
 * Verify Bot Token using Zalo Bot Open API getMe endpoint
 */
export async function verifyZaloBotToken(tokenInput?: string): Promise<{ isConnected: boolean; botInfo?: any; error?: string }> {
  const token = tokenInput || getZaloBotToken();
  if (!token) {
    return { isConnected: false, error: 'Chưa cấu hình ZALO_BOT_TOKEN trong secret môi trường' };
  }
  try {
    const res = await fetch(`https://bot-api.zaloplatforms.com/bot${token}/getMe`);
    const json: any = await res.json().catch(() => ({}));
    if (json.ok === true || json.error === 0) {
      return { isConnected: true, botInfo: json.result || json };
    }
    return { isConnected: false, error: json.description || json.message || `Lỗi HTTP ${res.status}` };
  } catch (e: any) {
    return { isConnected: false, error: e.message || 'Lỗi kết nối tới Zalo Bot API' };
  }
}

/**
 * Check if current time in Asia/Ho_Chi_Minh is within Quiet Hours (Default: 17:00 to 06:30)
 */
export function isInQuietHours(quietStart = '17:00', quietEnd = '06:30'): boolean {
  try {
    const now = new Date();
    // Convert to Asia/Ho_Chi_Minh timezone
    const vnTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
    const [hh, mm] = vnTimeStr.split(':').map(Number);
    const currentMins = hh * 60 + mm;

    const [startH, startM] = quietStart.split(':').map(Number);
    const startMins = startH * 60 + startM;

    const [endH, endM] = quietEnd.split(':').map(Number);
    const endMins = endH * 60 + endM;

    if (startMins > endMins) {
      // Overnight (e.g. 21:00 to 06:30)
      return currentMins >= startMins || currentMins < endMins;
    } else {
      return currentMins >= startMins && currentMins < endMins;
    }
  } catch (e) {
    return false;
  }
}

/**
 * Get linked Zalo Chat ID for a given Employee Code
 */
export async function getZaloChatIdByEmpCode(empCode: string): Promise<string | null> {
  if (!empCode) return null;
  const db = getDbBinding();
  if (!db) return null;
  try {
    await ensureKaizenSchema(db);
    const res: any = await db.prepare('SELECT chat_id FROM zalo_user_links WHERE emp_code = ?').bind(empCode).first().catch(() => null);
    return res ? res.chat_id : null;
  } catch (e) {
    return null;
  }
}

/**
 * Save notification log into D1 database
 */
async function logZaloNotification(params: {
  eventType: string;
  priority: ZaloPriority;
  recipientEmpCode?: string;
  chatId?: string;
  messageText: string;
  status: 'SUCCESS' | 'FAILED' | 'QUEUED' | 'SKIPPED_NO_LINK' | 'SKIPPED_NO_TOKEN';
  errorDetail?: string;
  idempotencyKey?: string;
}) {
  const db = getDbBinding();
  if (!db) return;
  try {
    await ensureKaizenSchema(db);
    const id = `zlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.prepare(`
      INSERT INTO zalo_notification_logs (
        id, event_type, priority, recipient_emp_code, chat_id, message_text, status, error_detail, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      id,
      params.eventType,
      params.priority,
      params.recipientEmpCode || null,
      params.chatId || null,
      params.messageText,
      params.status,
      params.errorDetail || null,
      params.idempotencyKey || null
    ).run().catch(() => {});
  } catch (e) {
    console.warn('[logZaloNotification] Error saving log:', e);
  }
}

/**
 * Core asynchronous function to dispatch a Zalo notification
 */
export async function sendZaloNotification(
  messageText: string,
  options: SendZaloOptions
): Promise<{ success: boolean; status: string; message?: string }> {
  try {
    const { priority, eventType, recipientEmpCode, idempotencyKey, targetGroupType } = options;
    let chatId = options.chatId;

    // 1. Resolve Chat ID:
    // If personal recipient is specified, try personal link first
    if (!chatId && recipientEmpCode) {
      chatId = await getZaloChatIdByEmpCode(recipientEmpCode) || undefined;
    }

    // 2. If no personal link or if targetGroupType is RECEPTION / CONFIRMED, fetch target group chat ID from D1
    if (!chatId || targetGroupType === 'RECEPTION' || targetGroupType === 'CONFIRMED') {
      const db = getDbBinding();
      if (db) {
        await ensureKaizenSchema(db);
        const confRes: any = await db.prepare("SELECT reception_group_chat_id, confirmed_group_chat_id FROM zalo_config WHERE id = 'main'").first().catch(() => null);
        if (confRes) {
          if (targetGroupType === 'CONFIRMED' && confRes.confirmed_group_chat_id) {
            chatId = confRes.confirmed_group_chat_id;
          } else if (targetGroupType === 'RECEPTION' && confRes.reception_group_chat_id) {
            chatId = confRes.reception_group_chat_id;
          } else if (!chatId) {
            chatId = confRes.reception_group_chat_id || confRes.confirmed_group_chat_id;
          }
        }
      }
    }

    if (!chatId) {
      await logZaloNotification({
        eventType,
        priority,
        recipientEmpCode,
        messageText,
        status: 'SKIPPED_NO_LINK',
        errorDetail: 'Chưa liên kết Zalo cá nhân & chưa cấu hình Group Chat ID Lễ Tân',
        idempotencyKey,
      });
      return { success: false, status: 'SKIPPED_NO_LINK', message: 'Chưa liên kết Zalo cá nhân & chưa cấu hình Group Chat ID Lễ Tân' };
    }

    // 2. Check Idempotency Key
    if (idempotencyKey) {
      const db = getDbBinding();
      if (db) {
        await ensureKaizenSchema(db);
        const existing: any = await db.prepare('SELECT id FROM zalo_notification_logs WHERE idempotency_key = ?').bind(idempotencyKey).first().catch(() => null);
        if (existing) {
          return { success: true, status: 'SKIPPED_DUPLICATE', message: 'Thông báo trùng lặp (Idempotent)' };
        }
      }
    }

    // 3. Check Quiet Hours (EMERGENCY always passes through)
    if (priority !== 'EMERGENCY' && isInQuietHours()) {
      await logZaloNotification({
        eventType,
        priority,
        recipientEmpCode,
        chatId,
        messageText,
        status: 'QUEUED',
        errorDetail: 'Đã xếp hàng chờ gửi sau giờ yên tĩnh (21:00 - 06:30)',
        idempotencyKey,
      });
      return { success: true, status: 'QUEUED', message: 'Đã xếp hàng trong giờ yên tĩnh' };
    }

    // 4. Prefix priority badge on message text
    const badgePrefix = priority === 'EMERGENCY' ? '🔴 [KHẨN CẤP]' : priority === 'IMPORTANT' ? '🟠 [QUAN TRỌNG]' : '🟢 [THÔNG THƯỜNG]';
    const formattedText = `${badgePrefix}\n${messageText}`;

    // 5. Send via Zalo Bot OpenAPI / Webhook Bot
    const token = getZaloBotToken();
    if (!token) {
      await logZaloNotification({
        eventType,
        priority,
        recipientEmpCode,
        chatId,
        messageText: formattedText,
        status: 'SKIPPED_NO_TOKEN',
        errorDetail: 'Chưa cấu hình ZALO_BOT_TOKEN trong môi trường',
        idempotencyKey,
      });
      return { success: false, status: 'SKIPPED_NO_TOKEN', message: 'Chưa cấu hình ZALO_BOT_TOKEN' };
    }

    // Attempt HTTP call with up to 3 retries (exponential backoff)
    let lastError = '';
    let isSent = false;
    
    // Support Zalo Bot Creator Endpoint & Zalo OpenAPI OA
    const apiUrls = [
      `https://bot-api.zaloplatforms.com/bot${token}/sendMessage`,
      `https://openapi.zalo.me/v3.0/oa/message/cs`,
    ];

    for (let attempt = 1; attempt <= 3; attempt++) {
      for (const apiUrl of apiUrls) {
        try {
          const isBotCreator = apiUrl.includes('bot-api.zaloplatforms.com');
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: isBotCreator
              ? { 'Content-Type': 'application/json' }
              : { 'Content-Type': 'application/json', 'access_token': token },
            body: isBotCreator
              ? JSON.stringify({ chat_id: chatId, text: formattedText })
              : JSON.stringify({ recipient: { user_id: chatId }, message: { text: formattedText } }),
          });

          const resJson: any = await response.json().catch(() => ({}));
          if (resJson.ok === true || resJson.error === 0 || resJson.message === 'Success') {
            isSent = true;
            break;
          } else {
            lastError = resJson.description || resJson.message || `Zalo API error code: ${resJson.error || resJson.error_code || response.status}`;
          }
        } catch (err: any) {
          lastError = err.message || 'Lỗi mạng khi kết nối Zalo API';
        }
      }

      if (isSent) break;

      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }

    if (isSent) {
      await logZaloNotification({
        eventType,
        priority,
        recipientEmpCode,
        chatId,
        messageText: formattedText,
        status: 'SUCCESS',
        idempotencyKey,
      });
      return { success: true, status: 'SUCCESS' };
    } else {
      await logZaloNotification({
        eventType,
        priority,
        recipientEmpCode,
        chatId,
        messageText: formattedText,
        status: 'FAILED',
        errorDetail: lastError,
        idempotencyKey,
      });
      return { success: false, status: 'FAILED', message: lastError };
    }
  } catch (error: any) {
    console.error('[sendZaloNotification] Unhandled exception:', error);
    return { success: false, status: 'FAILED', message: error.message };
  }
}
