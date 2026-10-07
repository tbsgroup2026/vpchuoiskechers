#!/usr/bin/env node
/**
 * Script Capture Zalo Group Chat ID riêng biệt cho Terminal
 * 
 * CÁCH CHẠY:
 *   1. node capture-zalo-group.js
 *   2. node scripts/capture-zalo-group.js YOUR_BOT_TOKEN
 *   3. npm run capture-zalo
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Tự động tìm & đọc token từ tệp .env nếu có
function loadEnvToken() {
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), 'web', '.env.local'),
  ];

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const match = content.match(/^ZALO_BOT_TOKEN=(.+)$/m);
      if (match && match[1].trim()) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return null;
}

// Hỏi nhập token từ Terminal nếu chưa có
async function promptToken() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('👉 Nhập ZALO_BOT_TOKEN của bạn: ', (token) => {
      rl.close();
      resolve(token.trim());
    });
  });
}

async function captureZaloGroupChatId(providedToken) {
  console.log('\n======================================================');
  console.log('🤖 ZALO BOT GROUP CHAT ID CAPTURE TOOL (TERMINAL CLI)');
  console.log('======================================================\n');

  let token = providedToken || process.argv[2] || process.env.ZALO_BOT_TOKEN || loadEnvToken();

  if (!token) {
    console.log('⚠️ Chưa tìm thấy ZALO_BOT_TOKEN trong môi trường hoặc .env');
    token = await promptToken();
  }

  if (!token) {
    console.error('❌ Lỗi: Chưa cung cấp ZALO_BOT_TOKEN!');
    process.exit(1);
  }

  const maskedToken = token.length > 12 ? `${token.substring(0, 6)}...${token.slice(-4)}` : '***';
  console.log(`🔑 Bot Token: ${maskedToken}`);
  console.log('⏳ Đang kết nối tới Zalo Bot API (getUpdates)...');

  // Các URL endpoint của Zalo Bot Creator / OpenAPI
  const endpoints = [
    `https://bot-api.zaloplatforms.com/bot${token}/getUpdates`,
    `https://openapi.zalo.me/v3.0/oa/getupdates`,
  ];

  let response = null;
  let bodyText = '';
  let usedUrl = '';

  for (const url of endpoints) {
    try {
      usedUrl = url;
      console.log(`🌐 Calling API: ${url}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeout: '5' }),
      });
      response = res;
      bodyText = await res.text();
      if (res.ok || res.status < 500) break;
    } catch (err) {
      console.warn(`⚠️ Kênh ${url} gặp lỗi: ${err.message}`);
    }
  }

  if (!response) {
    console.error('❌ Không thể kết nối tới Zalo Bot API Server. Vui lòng kiểm tra lại kết nối mạng!');
    process.exit(1);
  }

  console.log(`\n📥 HTTP Response Code: ${response.status} ${response.statusText}`);
  console.log(`📄 RAW Output Body  : ${bodyText}\n`);

  let json = null;
  try {
    json = JSON.parse(bodyText);
  } catch (e) {
    console.error('❌ Phản hồi từ Zalo không phải định dạng JSON hợp lệ.');
    process.exit(1);
  }

  if (!json) {
    console.error('❌ Phản hồi từ Zalo rỗng!');
    process.exit(1);
  }

  if (json.ok === false || json.error) {
    const errDesc = json.description || json.message || json.error || bodyText;
    
    if (errDesc.includes('webhook is set') || errDesc.includes('remove the webhook')) {
      console.log('\n------------------------------------------------------');
      console.log('📌 PHÁT HIỆN: BOT ĐANG BẬT CHẾ ĐỘ WEBHOOK TỰ ĐỘNG!');
      console.log('------------------------------------------------------');
      console.log('💡 Nguyên nhân: Zalo Bot đang được cấu hình Webhook (để đẩy tự động về ứng dụng Web). Khi có Webhook, Zalo tạm khóa API getUpdates.');
      console.log('\n👉 GIẢI PHÁP 1 (KHUYÊN DÙNG - TỰ ĐỘNG BẮT MÃ TRÊN WEB):');
      console.log('   1. Mở trang: https://vpchuoiskechers.tbsgroup2026.workers.dev/rooms (Tab Zalo)');
      console.log('   2. Nhắn 1 tin bất kỳ vào Nhóm Zalo (ví dụ: "@Bot xin chào").');
      console.log('   3. Webhook sẽ tự động bắt và lưu mã Group Chat ID hiển thị trên trang Web!\n');
      
      console.log('👉 GIẢI PHÁP 2 (TẮT WEBHOOK TẠM THỜI ĐỂ LẤY BẰNG TERMINAL):');
      console.log('   Đang tự động gửi yêu cầu gỡ Webhook tạm thời để lấy Chat ID...\n');

      try {
        const delRes = await fetch(`https://bot-api.zaloplatforms.com/bot${token}/deleteWebhook`, { method: 'POST' });
        const delJson = await delRes.json().catch(() => ({}));
        if (delJson.ok || delRes.ok) {
          console.log('✅ Đã tạm thời gỡ Webhook thành công! Đang thử lại getUpdates...');
          // Retry getUpdates
          const retryRes = await fetch(`https://bot-api.zaloplatforms.com/bot${token}/getUpdates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeout: '5' }),
          });
          const retryText = await retryRes.text();
          const retryJson = JSON.parse(retryText);
          if (retryJson && (retryJson.ok !== false)) {
            json = retryJson;
          } else {
            console.error(`❌ Vẫn chưa lấy được update: ${retryText}`);
            process.exit(1);
          }
        } else {
          console.error(`⚠️ Không thể gỡ Webhook tự động: ${JSON.stringify(delJson)}`);
          process.exit(1);
        }
      } catch (delErr) {
        console.error(`❌ Lỗi khi gỡ Webhook: ${delErr.message}`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Zalo API trả về báo lỗi: ${errDesc}`);
      process.exit(1);
    }
  }

  let update = json.result || json.data || json.updates || json;

  // Xử lý khi Zalo trả về mảng các tin nhắn/sự kiện
  if (Array.isArray(update)) {
    if (!update.length) {
      console.error('\n⚠️ Chưa có bản ghi update mới nào!');
      console.error('💡 HƯỚNG DẪN: Hãy mời Bot vào Nhóm Zalo, tag @Bot hoặc gửi 1 tin bất kỳ trong nhóm Zalo, sau đó chạy lại lệnh này!');
      process.exit(1);
    }
    // Lấy sự kiện tin nhắn mới nhất ở cuối mảng
    update = update[update.length - 1];
  }

  const message = update.message || update.event || update;
  const chat = message.chat || message.group || message.sender || update.chat || null;

  const chatId = String((chat && chat.id) || message.chat_id || message.group_id || update.chat_id || '').trim();
  const chatType = String((chat && (chat.chat_type || chat.type)) || message.chat_type || (message.is_group ? 'GROUP' : '')).trim().toUpperCase();
  const chatTitle = (chat && (chat.title || chat.name)) || message.group_name || 'Nhóm Zalo';
  const senderName = (message.from && message.from.first_name) || (message.sender && message.sender.name) || 'Thành viên Zalo';

  if (!chatId) {
    console.error(`❌ Update nhận được chưa chứa message.chat.id hoặc group_id. RAW JSON = ${bodyText}`);
    process.exit(1);
  }

  console.log('------------------------------------------------------');
  console.log(`💬 TÊN NHÓM / CHAT : ${chatTitle}`);
  console.log(`🆔 CHAT ID         : ${chatId}`);
  console.log(`🏷️ PHÂN LOẠI CHAT  : ${chatType || 'GROUP'}`);
  console.log(`👤 NGUỜI GỬI TIN   : ${senderName}`);
  console.log('------------------------------------------------------');

  if (chatType && chatType !== 'GROUP') {
    console.warn(`⚠️ CẢNH BÁO: Cuộc trò chuyện này có loại [${chatType}], không phải [GROUP]. Vui lòng đảm bảo bạn đang kiểm tra tin nhắn trong Nhóm Zalo.`);
  }

  console.log(`\n======================================================`);
  console.log(`✅ ĐÃ BẮT VÀ LƯU THÀNH CÔNG ZALO GROUP CHAT ID = \x1b[32m\x1b[1m${chatId}\x1b[0m`);
  console.log(`======================================================\n`);
  console.log(`👉 Bạn có thể dán mã [${chatId}] vào ô "Chat ID Nhóm Lễ Tân" trong cấu hình Web!`);

  return {
    success: true,
    groupChatId: chatId,
    chatType: chatType || 'GROUP',
  };
}

if (require.main === module) {
  captureZaloGroupChatId();
}

module.exports = { captureZaloGroupChatId };
