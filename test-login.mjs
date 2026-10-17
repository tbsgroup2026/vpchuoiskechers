import fs from 'node:fs';

async function test() {
  const r = await fetch('http://127.0.0.1:8798/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-proto': 'https' },
    body: JSON.stringify({ empCode: 'SA001', password: '1' })
  });
  
  const text = await r.text();
  console.log("STATUS:", r.status);
  console.log("HEADERS:", [...r.headers.entries()]);
  console.log("TEXT:", text);
}

test();
