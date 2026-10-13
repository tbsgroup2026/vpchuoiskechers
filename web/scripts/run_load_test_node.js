const fs = require('fs');

async function runTest() {
  const BASE = 'https://vpchuoiskechers-staging.tbsgroup2026.workers.dev';
  const PW = 'HEDu2UWGwxzY';
  
  const VUs = 100;
  const metrics = { login: [], payslip: [], leave: [], upload: [], total: [] };
  
  const PDF = Buffer.from('%PDF-1.4\n' + 'x'.repeat(50 * 1024));
  
  async function runVU(vuId) {
    const code = 'LT' + String((vuId % 100) + 1).padStart(3, '0');
    const t0 = Date.now();
    
    // Login
    let t = Date.now();
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empCode: code, password: PW })
    });
    const loginJson = await loginRes.json();
    const token = loginJson.hrToken;
    metrics.login.push(Date.now() - t);
    
    if (!token) return;
    
    const auth = { Authorization: `Bearer ${token}` };
    
    // Payslip
    t = Date.now();
    const psRes = await fetch(`${BASE}/api/hr/payslip/me`, { headers: auth });
    await psRes.json();
    metrics.payslip.push(Date.now() - t);
    
    // Leave
    const day = 1 + ((vuId) % 28);
    const m = 1 + ((vuId * 7) % 12);
    const date = `2027-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    t = Date.now();
    const lvRes = await fetch(`${BASE}/api/hr/leave`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: date, endDate: date, leaveType: 'HALF', halfSession: 'AM' })
    });
    await lvRes.json();
    metrics.leave.push(Date.now() - t);
    
    // Upload
    const form = new FormData();
    form.append('file', new Blob([PDF], { type: 'application/pdf' }), `phieu-${code}.pdf`);
    
    t = Date.now();
    const upRes = await fetch(`${BASE}/api/hr/files`, {
      method: 'POST',
      headers: auth,
      body: form
    });
    await upRes.json();
    metrics.upload.push(Date.now() - t);
    
    metrics.total.push(Date.now() - t0);
  }
  
  const promises = [];
  for (let i = 0; i < VUs; i++) {
    promises.push(runVU(i));
  }
  
  await Promise.all(promises);
  
  const p95 = (arr) => arr.sort((a,b) => a-b)[Math.floor(arr.length * 0.95)];
  
  console.log(`p95 Login: ${p95(metrics.login)}ms`);
  console.log(`p95 Payslip: ${p95(metrics.payslip)}ms`);
  console.log(`p95 Leave: ${p95(metrics.leave)}ms`);
  console.log(`p95 Upload: ${p95(metrics.upload)}ms`);
  console.log(`p95 Total: ${p95(metrics.total)}ms`);
}

runTest().catch(console.error);
