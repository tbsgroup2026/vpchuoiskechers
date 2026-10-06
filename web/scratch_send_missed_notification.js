const token = "2083301284890293167:jgjialyvCtjfRJJnTjgOEzqFeBlkXtNlAYwhlayRbprqgNDRBjRejfFgpobQyGWS";
const chatId = "zgr-14b10f10137ffa21a36e";
const message = `🟠 [QUAN TRỌNG]
✅ LỊCH HỌP ĐÃ ĐƯỢC PHÊ DUYỆT
Cuộc họp: "Họp opex các đầu cầu chuẩn bị hội thảo - kết nối VP1"
Phòng họp: Phòng Họp Số 1 (P. Điều Hành)
Thời gian: 15:00 - 17:00 - Ngày: 06/10/2026
Hình thức: OFFLINE`;

fetch(`https://bot-api.zaloplatforms.com/bot${token}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chat_id: chatId, text: message })
})
  .then(r => r.json())
  .then(r => console.log('Result:', r))
  .catch(e => console.error(e));
