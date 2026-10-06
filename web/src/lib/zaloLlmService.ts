import { askLLM, LlmMessage } from '@/lib/llmClient';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { sendZaloNotification } from '@/lib/zaloNotificationService';
import { maskPII } from '@/lib/piiMasker';
import fs from 'fs';
import path from 'path';

export async function processZaloBotMention(
  db: any,
  chatId: string,
  userId: string,
  senderName: string,
  cleanText: string
): Promise<void> {
  if (!db) return;

  await ensureKaizenSchema(db);

  // 1. Rate Limit Check (5 requests per minute per user)
  const now = new Date();
  const resetAt = new Date(now.getTime() + 60 * 1000).toISOString();
  
  // Cleanup old rate limits
  await db.prepare('DELETE FROM zalo_bot_rate_limit WHERE reset_at < ?').bind(now.toISOString()).run().catch(() => {});
  
  let rate = await db.prepare('SELECT count FROM zalo_bot_rate_limit WHERE user_id = ?').bind(userId).first().catch(() => null);
  
  if (rate) {
    if (rate.count >= 5) {
      await sendZaloNotification('Xin lỗi, bạn thao tác quá nhanh. Vui lòng đợi 1 phút nữa nhé.', { chatId });
      return;
    }
    await db.prepare('UPDATE zalo_bot_rate_limit SET count = count + 1 WHERE user_id = ?').bind(userId).run().catch(() => {});
  } else {
    await db.prepare('INSERT INTO zalo_bot_rate_limit (user_id, count, reset_at) VALUES (?, 1, ?)').bind(userId, resetAt).run().catch(() => {});
  }

  // 2. Load Knowledge Base (System Prompt - PUBLIC items ONLY)
  let knowledgeText = 'Bạn là Bot Zalo nội bộ của công ty TBS Group. Bạn chỉ cung cấp thông tin công khai (public). Hãy trả lời ngắn gọn, thân thiện (tối đa 5 câu). Nếu không biết hoặc thông tin là nội bộ, hãy nói "Tôi chưa có thông tin về vấn đề này".';
  try {
    const knowledgePath = path.join(process.cwd(), 'src/config/zalo-bot-knowledge.md');
    if (fs.existsSync(knowledgePath)) {
      knowledgeText = fs.readFileSync(knowledgePath, 'utf8');
    }
  } catch (e) {}

  // Load PUBLIC knowledge entries from bot_knowledge database table
  try {
    const publicItems = await db.prepare(
      "SELECT question, answer FROM bot_knowledge WHERE access_label = 'public' AND status = 'approved' ORDER BY hit_count DESC LIMIT 20"
    ).all().catch(() => ({ results: [] }));

    if (publicItems?.results && publicItems.results.length > 0) {
      const publicDocs = publicItems.results.map((item: any) => `Q: ${item.question}\nA: ${item.answer}`).join('\n---\n');
      knowledgeText += `\n\n[TRI THỨC CÔNG KHAI (PUBLIC KNOWLEDGE)]:\n${publicDocs}`;
    }
  } catch (err) {
    console.warn('[ZaloLlmService] Could not load public knowledge entries:', err);
  }

  // 3. Mask PII in incoming message before passing to Cloud LLM
  const sanitizedText = maskPII(cleanText);

  // 4. Load Chat History (last 6 turns, max 30 mins old)
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  
  // Cleanup old history
  await db.prepare('DELETE FROM zalo_bot_chat_history WHERE created_at < ?').bind(thirtyMinsAgo).run().catch(() => {});

  const historyRows = await db.prepare(
    'SELECT role, text FROM zalo_bot_chat_history WHERE chat_id = ? ORDER BY created_at ASC LIMIT 6'
  ).bind(chatId).all().catch(() => ({ results: [] }));
  
  const history: LlmMessage[] = (historyRows?.results || []).map((row: any) => ({
    role: row.role as 'user' | 'assistant',
    content: maskPII(row.text) // Ensure history is also PII-masked
  }));

  const messages: LlmMessage[] = [
    { role: 'system', content: knowledgeText },
    ...history,
    { role: 'user', content: `${senderName}: ${sanitizedText}` } // Append sender name & sanitized input
  ];

  // 4. Save User Message
  const userMsgId = crypto.randomUUID();
  await db.prepare(
    'INSERT INTO zalo_bot_chat_history (id, chat_id, user_id, role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(userMsgId, chatId, userId, 'user', cleanText, now.toISOString()).run().catch(() => {});

  // 5. Call LLM
  let replyText = '';
  try {
    replyText = await askLLM(messages, 800);
  } catch (err: any) {
    console.error('LLM Error:', err);
    replyText = 'Xin lỗi, tôi đang gặp lỗi kết nối AI. Vui lòng thử lại sau.';
  }

  // 6. Save Assistant Reply
  const assistantMsgId = crypto.randomUUID();
  await db.prepare(
    'INSERT INTO zalo_bot_chat_history (id, chat_id, user_id, role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(assistantMsgId, chatId, 'bot', 'assistant', replyText, new Date().toISOString()).run().catch(() => {});

  // 7. Split response and send
  const MAX_ZALO_LENGTH = 2000;
  const chunks = [];
  let currentChunk = '';

  const paragraphs = replyText.split('\n');
  for (const p of paragraphs) {
    if (currentChunk.length + p.length + 1 > MAX_ZALO_LENGTH) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = p + '\n';
    } else {
      currentChunk += p + '\n';
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());

  if (chunks.length === 0) chunks.push(replyText);

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks.length > 1 ? `[${i+1}/${chunks.length}] ${chunks[i]}` : chunks[i];
    await sendZaloNotification(chunkText, { chatId }).catch(() => {});
  }
}
