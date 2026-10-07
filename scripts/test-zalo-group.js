/**
 * Test Zalo Group Message Script (Node.js Compatible for Terminal Execution)
 * Simulates TEST_ZALO_GROUP Google Apps Script / Worker dispatch
 */

function formatDateVN(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const dd = pad(date.getDate());
  const MM = pad(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${dd}/${MM}/${yyyy} ${HH}:${mm}:${ss}`;
}

async function TEST_ZALO_GROUP() {
  const baseUrl = 'https://vpchuoiskechers.tbsgroup2026.workers.dev';
  const nowFormatted = formatDateVN(new Date());

  const testMessage = 
    '🧪 TEST GEMBA.PRO\n\n' +
    'Kết nối Zalo Group thành công.\n\n' +
    'Thời gian: ' + nowFormatted;

  console.log('--- 🚀 Executing TEST_ZALO_GROUP() ---');
  console.log('Payload Message:\n', testMessage);
  console.log('\n--- 1. Dispatching to Group Lễ Tân (RECEPTION) ---');

  let res = await fetch(`${baseUrl}/api/zalo/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'TEST_RECEPTION',
      customMessage: testMessage,
    }),
  });
  let result = await res.json().catch(() => ({}));
  console.log('Result (Group Lễ Tân):');
  console.log(JSON.stringify(result, null, 2));

  console.log('\n--- 2. Dispatching to Group Phản Hồi (CONFIRMED) ---');
  res = await fetch(`${baseUrl}/api/zalo/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'TEST_CONFIRMED',
      customMessage: testMessage,
    }),
  });
  let resultConfirmed = await res.json().catch(() => ({}));
  console.log('Result (Group Phản Hồi):');
  console.log(JSON.stringify(resultConfirmed, null, 2));

  return result;
}

TEST_ZALO_GROUP();
