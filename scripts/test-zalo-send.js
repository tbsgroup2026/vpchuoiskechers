const TOKEN = process.env.ZALO_BOT_TOKEN || '2083301284890293167:mVHlZvaZN';

async function main() {
  console.log(`🤖 Testing getMe & getUpdates...`);

  // 1. getMe
  const meRes = await fetch(`https://bot-api.zaloplatforms.com/bot${TOKEN}/getMe`);
  console.log(`getMe status: ${meRes.status}`, await meRes.text());

  // 2. getUpdates
  const updatesRes = await fetch(`https://bot-api.zaloplatforms.com/bot${TOKEN}/getUpdates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeout: '5' }),
  });
  console.log(`getUpdates status: ${updatesRes.status}`, await updatesRes.text());
}

main();
