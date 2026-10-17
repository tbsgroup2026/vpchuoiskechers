const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/worker/index.js');
let code = fs.readFileSync(filePath, 'utf8');

const anchor = `          if (updateFields.length > 0) {
            bindParams.push(id);
            const sql = \`UPDATE room_bookings SET \${updateFields.join(", ")} WHERE id = ?\`;
            const result = await env.DB.prepare(sql).bind(...bindParams).run();`;

const replacement = `          if (updateFields.length > 0) {
            // Lấy thông tin phòng trước khi update để gửi Zalo
            const booking = await env.DB.prepare("SELECT * FROM room_bookings WHERE id = ?").bind(id).first().catch(() => null);

            bindParams.push(id);
            const sql = \`UPDATE room_bookings SET \${updateFields.join(", ")} WHERE id = ?\`;
            const result = await env.DB.prepare(sql).bind(...bindParams).run();
            
            // 🔔 GỬI THÔNG BÁO ZALO
            if (status === 'CONFIRMED' || status === 'CANCELLED') {
              try {
                const ZALO_NOTIFY_GROUPS = ["zgr-985a598e79e190bfc9f0"];
                const zaloBotToken = env.ZALO_BOT_TOKEN;
                if (zaloBotToken && booking) {
                  const bTitle = booking.title || "Cuộc họp";
                  const bRoom = roomName || booking.room_name || roomId || booking.room_id || "Phòng Họp";
                  const bDate = booking.booking_date || "";
                  const bTime = booking.time_slot || "";
                  
                  let zaloMsg = "";
                  if (status === 'CONFIRMED') {
                    zaloMsg = \`✅ *LỊCH HỌP ĐÃ ĐƯỢC PHÊ DUYỆT*\n\n📌 Cuộc họp: \${bTitle}\n🏢 Phòng họp: \${bRoom}\n📆 Ngày: \${bDate}\n🕐 Thời gian: \${bTime}\n👤 Người đặt: \${booking.booker_name || ''} (\${booking.department || ''})\n📝 Ghi chú: \${notes || booking.notes || 'Không có'}\`;
                  } else {
                    zaloMsg = \`❌ *LỊCH HỌP ĐÃ BỊ HỦY / TỪ CHỐI*\n\n📌 Cuộc họp: \${bTitle}\n🏢 Phòng họp: \${bRoom}\n📆 Ngày: \${bDate}\n🕐 Thời gian: \${bTime}\n👤 Người đặt: \${booking.booker_name || ''} (\${booking.department || ''})\n📝 Lý do: \${notes || 'Hủy bởi người quản trị'}\`;
                  }

                  for (const groupId of ZALO_NOTIFY_GROUPS) {
                    await fetch(\`https://bot-api.zaloplatforms.com/bot\${zaloBotToken}/sendMessage\`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ chat_id: groupId, text: zaloMsg })
                    }).catch(() => {});
                  }
                }
              } catch (err) {
                console.warn("Zalo PUT notify error:", err.message);
              }
            }`;

if (code.includes(anchor) && !code.includes('Zalo PUT notify error')) {
    code = code.replace(anchor, replacement);
    fs.writeFileSync(filePath, code);
    console.log("Successfully patched web/worker/index.js");
} else {
    console.log("Anchor not found or already patched.");
}
