import os
import re

WORKER_PATH = 'web/public/_worker.js'

with open(WORKER_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add LLM helper functions
LLM_CODE = """
// ==================== ZALO LLM BOT LOGIC ====================
async function askLLM(env, messages) {
  let apiKey = env.LLM_API_KEY || env.GROQ_API_KEY || env.OPENAI_API_KEY || env.GEMINI_API_KEY;
  let model = env.LLM_MODEL || env.GROQ_MODEL || 'llama3-8b-8192';
  
  if (!apiKey) throw new Error('Missing LLM API Key in environment variables.');

  let baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  if (apiKey.startsWith('sk-or-')) baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  if (apiKey.startsWith('AIza')) {
    const geminiUrl = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=\${apiKey}\`;
    const geminiMsgs = messages.map(m => ({
      role: m.role === 'system' || m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    const req = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: geminiMsgs })
    });
    const res = await req.json();
    if (res.error) throw new Error(res.error.message);
    return res.candidates[0].content.parts[0].text;
  }

  const req = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${apiKey}\`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 800,
      temperature: 0.3
    })
  });
  const res = await req.json();
  if (res.error) throw new Error(res.error.message);
  return res.choices[0].message.content;
}

async function sendZaloNotificationWorker(env, text, chatId) {
  const token = env.ZALO_BOT_TOKEN;
  if (!token) return;
  await fetch('https://bot-api.zaloplatforms.com/bot' + token + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}

async function handleZaloBotMention(env, chatId, userId, senderName, cleanText) {
  const db = env.DB;
  if (!db) return;
  
  const now = new Date();
  const resetAt = new Date(now.getTime() + 60 * 1000).toISOString();
  
  await db.prepare('DELETE FROM zalo_bot_rate_limit WHERE reset_at < ?').bind(now.toISOString()).run().catch(() => {});
  const rate = await db.prepare('SELECT count FROM zalo_bot_rate_limit WHERE user_id = ?').bind(userId).first().catch(() => null);
  
  if (rate) {
    if (rate.count >= 5) {
      await sendZaloNotificationWorker(env, 'Xin lỗi, bạn thao tác quá nhanh. Vui lòng đợi 1 phút nữa nhé.', chatId);
      return;
    }
    await db.prepare('UPDATE zalo_bot_rate_limit SET count = count + 1 WHERE user_id = ?').bind(userId).run().catch(() => {});
  } else {
    await db.prepare('INSERT INTO zalo_bot_rate_limit (user_id, count, reset_at) VALUES (?, 1, ?)').bind(userId, resetAt).run().catch(() => {});
  }

  let knowledgeText = 'Bạn là Bot Zalo nội bộ của TBS Group. Trả lời ngắn gọn tối đa 3 câu.';
  
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  await db.prepare('DELETE FROM zalo_bot_chat_history WHERE created_at < ?').bind(thirtyMinsAgo).run().catch(() => {});
  
  const historyRows = await db.prepare('SELECT role, text FROM zalo_bot_chat_history WHERE chat_id = ? ORDER BY created_at ASC LIMIT 6').bind(chatId).all().catch(() => ({ results: [] }));
  const messages = [
    { role: 'system', content: knowledgeText },
    ...(historyRows.results || []).map(r => ({ role: r.role, content: r.text })),
    { role: 'user', content: \`\${senderName}: \${cleanText}\` }
  ];

  await db.prepare('INSERT INTO zalo_bot_chat_history (id, chat_id, user_id, role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), chatId, userId, 'user', cleanText, now.toISOString()).run().catch(() => {});

  let replyText = '';
  try {
    replyText = await askLLM(env, messages);
  } catch (err) {
    replyText = 'Xin lỗi, hệ thống AI đang quá tải hoặc lỗi cấu hình LLM: ' + err.message;
  }

  await db.prepare('INSERT INTO zalo_bot_chat_history (id, chat_id, user_id, role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), chatId, 'bot', 'assistant', replyText, new Date().toISOString()).run().catch(() => {});

  const MAX_ZALO = 2000;
  let chunk = '';
  for (const p of replyText.split('\\n')) {
    if (chunk.length + p.length > MAX_ZALO) {
      if (chunk.trim()) await sendZaloNotificationWorker(env, chunk.trim(), chatId);
      chunk = p + '\\n';
    } else {
      chunk += p + '\\n';
    }
  }
  if (chunk.trim()) await sendZaloNotificationWorker(env, chunk.trim(), chatId);
}
// ============================================================

"""

if 'askLLM(env, messages)' not in content:
    content = LLM_CODE + content

# 2. Inject API Route
ROUTE_CODE = """
    // ============================================================
    // ZALO WEBHOOK API
    // ============================================================
    if (url.pathname === "/api/zalo/webhook") {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      
      if (request.method === "GET") {
        const challenge = url.searchParams.get('challenge');
        if (challenge) return new Response(challenge, { status: 200 });
        return new Response(JSON.stringify({ status: 'Zalo Bot Webhook endpoint active' }), { status: 200, headers: CORS });
      }

      if (request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          const message = body.message || {};
          const chat = message.chat || {};
          const sender = body.sender || message.from || {};

          const chatId = String(chat.id || sender.id || body.chat_id || body.user_id || '').trim();
          const chatType = String(chat.chat_type || body.chat_type || '').trim().toUpperCase();
          const text = (message.text || body.text || '').trim();
          const senderName = sender.name || body.sender_name || sender.first_name || 'Người dùng Zalo';
          
          const isGroup = chatType === 'GROUP' || !!body.group_id || !!body.is_group || chatType === 'SUPERGROUP';
          const groupId = body.group_id || (isGroup ? chatId : null);
          const groupName = body.group_name || body.chat_name || (groupId ? `Nhóm Zalo (${groupId})` : null);

          if (groupId && env.DB) {
            await env.DB.prepare(`
              INSERT INTO zalo_captured_groups (group_chat_id, group_name, last_message, sender_name, updated_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(group_chat_id) DO UPDATE SET group_name = COALESCE(excluded.group_name, group_name), last_message = excluded.last_message, sender_name = excluded.sender_name, updated_at = CURRENT_TIMESTAMP
            `).bind(groupId, groupName, text, senderName).run().catch(() => {});
          }

          let isMentioned = false;
          let cleanText = text;
          const entities = message.entities || [];
          if (entities.find(e => e.type === 'mention' || e.type === 'text_mention') || (body.mentions && body.mentions.length > 0)) {
            isMentioned = true;
          } else if (text.match(/@\\[([^\\]]+)\\]/)) {
            isMentioned = true;
          } else if (text.includes('@Bot') || text.includes('@bot') || text.includes('@TBS')) {
            isMentioned = true;
          }

          if (isMentioned && isGroup) {
            cleanText = text.replace(/@\\[([^\\]]+)\\]/g, '').replace(/@\\S+/g, '').trim();
            const botIdStr = (env.ZALO_BOT_TOKEN || '').split(':')[0]; 
            const senderIdStr = String(sender.id || '');
            if (senderIdStr !== botIdStr && !sender.is_bot && env.DB) {
              const allowed = await env.DB.prepare('SELECT is_active FROM zalo_bot_allowed_groups WHERE group_id = ?').bind(groupId).first().catch(() => null);
              if (allowed && allowed.is_active === 1) {
                // Run LLM logic in background (waitUntil)
                if (ctx && typeof ctx.waitUntil === "function") {
                  ctx.waitUntil(handleZaloBotMention(env, chatId, senderIdStr, senderName, cleanText));
                } else {
                  await handleZaloBotMention(env, chatId, senderIdStr, senderName, cleanText);
                }
              }
            }
          }

          return new Response(JSON.stringify({ success: true, message: 'Event received' }), { status: 200, headers: CORS });
        } catch (e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: CORS });
        }
      }
    }
"""

if 'url.pathname === "/api/zalo/webhook"' not in content:
    content = content.replace('// API CATCH-ALL SAFE JSON FALLBACK', ROUTE_CODE + '\n    // API CATCH-ALL SAFE JSON FALLBACK')

with open(WORKER_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched _worker.js successfully.")
