import { NextResponse } from 'next/server';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { getZaloWebhookSecret, sendZaloNotification } from '@/lib/zaloNotificationService';
import { processZaloBotMention } from '@/lib/zaloLlmService';
import { maskObjectPII, maskPII } from '@/lib/piiMasker';

/**
 * Zalo Bot Platform Webhook Endpoint
 * 
 * Official Documentation Source:
 * - Zalo Bot Platform Overview: https://developers.zalo.me/docs/zalo-bot-platform/overview
 * - Zalo Webhook Integration: https://developers.zalo.me/docs/zalo-bot-platform/webhook
 * 
 * Verified Specifications:
 * - Webhook Response Timeout: Must respond with HTTP 200 OK within 2,000ms (2 seconds).
 * 
 * Unverified Parameters [chưa xác minh]:
 * - Webhook Signature Header: X-Zalo-Signature / HMAC SHA256 [chưa xác minh exact payload field name until sample payload provided].
 * - Zalo Bot Rate Limit: [chưa xác minh exact limits per bot account].
 */

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

/**
 * Helper to dispatch background tasks using Cloudflare Workers ctx.waitUntil
 * Time Limit:
 * - Free Plan: Up to 30s CPU / wall-clock time
 * - Paid Plan: Up to 30s CPU time / 15m wall-clock time
 */
function runInBackground(request: Request, asyncFn: Promise<any>) {
  const ctx = (request as any).ctx || (request as any).waitUntil ? request : null;
  if (ctx && typeof (ctx as any).waitUntil === 'function') {
    (ctx as any).waitUntil(asyncFn);
  } else if (typeof (globalThis as any).waitUntil === 'function') {
    (globalThis as any).waitUntil(asyncFn);
  } else {
    // Fallback for environment without ctx.waitUntil (logged floating promise)
    asyncFn.catch((err) => console.error('[BACKGROUND_TASK_ERROR]', err));
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge') || searchParams.get('hub.challenge');
  const secret = searchParams.get('secret') || searchParams.get('hub.verify_token');

  const configuredSecret = getZaloWebhookSecret();
  if (configuredSecret && secret && secret !== configuredSecret) {
    return NextResponse.json({ error: 'Secret verification failed' }, { status: 403 });
  }

  if (challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({
    status: 'Zalo Bot Webhook endpoint active',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const configuredSecret = getZaloWebhookSecret();
    const headers = request.headers;
    const signature = headers.get('x-zalo-signature') || headers.get('x-hub-signature');

    // Webhook Secret Validation
    if (configuredSecret) {
      const urlSecret = new URL(request.url).searchParams.get('secret');
      if (urlSecret && urlSecret !== configuredSecret) {
        return NextResponse.json({ error: '403 Forbidden: Invalid Webhook Secret' }, { status: 403 });
      }
    }

    const body = await request.json().catch(() => ({}));

    // 🔒 PII MASKED PAYLOAD LOGGING (Requirement 1a)
    const maskedPayload = maskObjectPII(body);
    console.log('[ZALO_WEBHOOK_PAYLOAD_START]');
    console.log(JSON.stringify(maskedPayload, null, 2));
    console.log('[ZALO_WEBHOOK_PAYLOAD_END]');

    const message = body.message || {};
    const chat = message.chat || {};
    const sender = body.sender || message.from || {};

    const chatId = String(chat.id || sender.id || body.chat_id || body.user_id || '').trim();
    const chatType = String(chat.chat_type || body.chat_type || '').trim().toUpperCase();
    const rawText = (message.text || body.text || '').trim();
    const senderName = sender.name || body.sender_name || sender.first_name || 'Người dùng Zalo';

    const isGroup = chatType === 'GROUP' || !!body.group_id || !!body.is_group;
    const groupId = body.group_id || (isGroup ? chatId : null);
    const groupName = body.group_name || body.chat_name || (groupId ? `Nhóm Zalo (${groupId})` : null);

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
    }

    // 🛑 DEDUPLICATION CHECK (Requirement 3)
    const eventId = String(
      body.event_id || 
      body.message_id || 
      message.msg_id || 
      message.id || 
      (body.event_name ? `${body.event_name}_${body.timestamp || chatId}` : null) ||
      ''
    ).trim();

    if (eventId && db) {
      try {
        const existing = await db.prepare('SELECT event_id FROM zalo_processed_events WHERE event_id = ?')
          .bind(eventId)
          .first();

        if (existing) {
          console.log(`[DEDUPLICATION] Event ${eventId} already processed. Skipping.`);
          return NextResponse.json({ success: true, message: 'Duplicate event ignored' });
        }

        // Record event id to prevent duplicate processing
        await db.prepare('INSERT INTO zalo_processed_events (event_id) VALUES (?)')
          .bind(eventId)
          .run();
      } catch (dedupErr) {
        console.warn('[DEDUPLICATION_WARNING]', dedupErr);
      }
    }

    // 🤖 AUTOMATICALLY CAPTURE GROUP CHAT ID
    if (groupId || (isGroup && chatId)) {
      const targetGroupKey = groupId || chatId;
      if (db) {
        await db.prepare(`
          INSERT INTO zalo_captured_groups (group_chat_id, group_name, last_message, sender_name, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(group_chat_id) DO UPDATE SET
            group_name = COALESCE(excluded.group_name, group_name),
            last_message = excluded.last_message,
            sender_name = excluded.sender_name,
            updated_at = CURRENT_TIMESTAMP
        `).bind(targetGroupKey, groupName || `Nhóm Zalo (${targetGroupKey})`, maskPII(rawText) || 'Sự kiện tin nhắn', senderName).run().catch(() => {});
      }
    }

    // 🔗 HANDLE ACCOUNT LINKING CODES (6 digits)
    if (chatId && rawText) {
      const match = rawText.match(/\b\d{6}\b/);
      if (match) {
        const code = match[0];
        if (db) {
          const nowIso = new Date().toISOString();
          const activeCode: any = await db.prepare(
            'SELECT emp_code FROM zalo_linking_codes WHERE code = ? AND expires_at > ?'
          ).bind(code, nowIso).first().catch(() => null);

          if (activeCode) {
            const empCode = activeCode.emp_code;

            await db.prepare(`
              INSERT INTO zalo_user_links (emp_code, chat_id, zalo_name, updated_at)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(emp_code) DO UPDATE SET
                chat_id = excluded.chat_id,
                zalo_name = excluded.zalo_name,
                updated_at = CURRENT_TIMESTAMP
            `).bind(empCode, chatId, senderName).run().catch(() => {});

            await db.prepare('DELETE FROM zalo_linking_codes WHERE code = ?').bind(code).run().catch(() => {});

            runInBackground(request, sendZaloNotification(
              `✅ LIÊN KẾT THÀNH CÔNG!\nTài khoản Zalo của bạn đã được gắn với MSNV: ${empCode}.\nTừ bây giờ bạn sẽ nhận thông báo tự động từ Hệ thống Phòng họp & Đón khách TBS Group.`,
              {
                priority: 'NORMAL',
                eventType: 'LINK_CONFIRMATION',
                chatId,
                recipientEmpCode: empCode,
              }
            ));

            return NextResponse.json({
              success: true,
              message: `Đã liên kết Zalo với MSNV: ${empCode}`,
            });
          }
        }
      }
    }

    // 🎯 PHASE 1A MENTION FILTERING FOR GROUPS
    // In group chats: IGNORE ALL MESSAGES WITHOUT @MENTION
    let isMentioned = false;
    let cleanText = rawText;

    const mentions = body.mentions || message.mentions || body.mention_list || [];
    const botKeywords = ['@bot', '@trợ lý', '@tro ly', '@tbs bot', '@ai assistant', '@zalo bot'];

    if (Array.isArray(mentions) && mentions.length > 0) {
      isMentioned = true;
    } else {
      const lowerText = rawText.toLowerCase();
      isMentioned = botKeywords.some((kw) => lowerText.includes(kw)) || lowerText.startsWith('@');
    }

    // If in a group and NOT mentioned -> COMPLETELY IGNORE (No DB save, No LLM call)
    if (isGroup && !isMentioned) {
      console.log(`[PHASE_1A_GROUP_FILTER] Ignored non-mention message in group chat ${chatId}`);
      return NextResponse.json({ success: true, message: 'Ignored non-mention group message' });
    }

    // Clean text by stripping @mention tags if present
    if (isMentioned) {
      cleanText = rawText.replace(/@\S+/g, '').trim() || rawText;
    }

    // 🚀 EXECUTE AI RESPONSE ASYNCHRONOUSLY VIA ctx.waitUntil (Immediate 200 OK Response)
    if (chatId && cleanText && db) {
      runInBackground(
        request,
        processZaloBotMention(
          db,
          chatId,
          String(sender.id || userIdFromSender(sender) || chatId),
          senderName,
          cleanText
        )
      );
    }

    return NextResponse.json({ success: true, message: 'Webhook event received and processing in background' });
  } catch (error: any) {
    console.error('[ZALO_WEBHOOK_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function userIdFromSender(sender: any): string {
  return sender.user_id || sender.id || sender.zalo_id || 'unknown_user';
}
