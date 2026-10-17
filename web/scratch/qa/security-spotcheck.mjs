import fs from 'node:fs';

const BASE = 'http://127.0.0.1:8798';

async function req(path, method = 'GET', body = null, headers = {}) {
  const h = {
    'x-forwarded-proto': 'https',
    'User-Agent': 'TBS-Security-Spotcheck/1.0',
    ...headers
  };
  if (body && typeof body === 'object') {
    h['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      text,
      json
    };
  } catch (err) {
    return { status: 0, text: err.message, json: null, headers: {} };
  }
}

async function runSpotcheck() {
  console.log('========================================================');
  console.log('🔒 STARTING SECURITY SPOT-CHECK SUITE (BƯỚC 3)');
  console.log('========================================================');

  const findings = [];
  function rec(id, category, name, exp, actual, pass, details = '') {
    findings.push({ id, category, name, expected: exp, actual, pass, details });
    console.log(`${pass ? 'PASS' : 'FAIL'} [${id}] ${name} | Exp: ${exp} | Act: ${actual} | ${details}`);
  }

  // 1. SQL Injection (Query, Body, Headers)
  console.log('\n--- 1. SQL INJECTION AUDIT ---');
  const sqliQuery = await req("/api/ci-kaizen?status=' OR 1=1--");
  rec('SEC-SQLI-01', 'SQLi', 'SQLi trong Query param', '400/404 hoặc sanitized', sqliQuery.status, sqliQuery.status !== 500 && !sqliQuery.text.includes('SQLITE_ERROR'), sqliQuery.text.slice(0, 70));

  const sqliBody = await req('/api/auth/login', 'POST', { empCode: "' OR '1'='1", password: "' OR '1'='1" });
  rec('SEC-SQLI-02', 'SQLi', 'SQLi trong Login body', 'Chặn/Không bypass auth', sqliBody.status, sqliBody.status !== 500 && !sqliBody.text.includes('SQLITE_ERROR'), sqliBody.text.slice(0, 70));

  const sqliMmtb = await req('/api/maintenance/tickets', 'PUT', { id: "1' UNION SELECT 1,2,3--", status: 'DONE' });
  const hasSqlError = sqliMmtb.text.includes('SQLITE_ERROR') || sqliMmtb.text.includes('D1_ERROR');
  rec('SEC-SQLI-03', 'SQLi', 'Lộ lỗi cú pháp SQLite trong response PUT ticket', 'Không lộ SQLITE_ERROR', hasSqlError ? 'LEAKED SQLITE_ERROR' : 'Clean', !hasSqlError, sqliMmtb.text.slice(0, 80));

  // 2. Stored XSS
  console.log('\n--- 2. STORED XSS AUDIT ---');
  const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
  const xssCreate = await req('/api/ci-kaizen', 'POST', {
    title: xssPayload,
    proposer_emp_code: '202608002',
    category: 'PRODUCTIVITY',
    before_description: xssPayload,
    after_solution: 'Giải pháp kiểm thử XSS'
  });
  // Check if response echoes raw payload unescaped or handles it
  const isRawScriptEchoed = xssCreate.text.includes('<script>alert');
  rec('SEC-XSS-01', 'XSS', 'Gửi XSS payload trong tiêu đề/nội dung Kaizen', 'Làm sạch hoặc mã hoá HTML', isRawScriptEchoed ? 'Raw script echoed' : 'Clean/Sanitized', !isRawScriptEchoed, xssCreate.text.slice(0, 70));

  // 3. CORS & CSRF Configuration
  console.log('\n--- 3. CORS & CSRF AUDIT ---');
  const evilOrigin = 'https://malicious-attacker-website.com';
  const corsRes = await req('/api/users', 'GET', null, { Origin: evilOrigin });
  const acao = corsRes.headers['access-control-allow-origin'];
  const acac = corsRes.headers['access-control-allow-credentials'];
  const isWildcardCors = acao === '*';
  rec('SEC-CORS-01', 'CORS', 'CORS Access-Control-Allow-Origin với Origin lạ', 'Không phản hồi wildcard * hoặc origin lạ', acao || '(none)', !isWildcardCors && acao !== evilOrigin, `Origin: ${evilOrigin} -> ACAO: ${acao}`);
  rec('SEC-CORS-02', 'CORS', 'CORS không cấu hình song song * và credentials', 'Không bật * cùng credentials', `${acao} / ${acac}`, !(acao === '*' && acac === 'true'));

  // 4. Security Headers Audit
  console.log('\n--- 4. SECURITY HEADERS AUDIT ---');
  const headRes = await req('/api/auth/me');
  const h = headRes.headers;
  rec('SEC-HEAD-01', 'Headers', 'Header X-Content-Type-Options: nosniff', 'nosniff', h['x-content-type-options'] || 'MISSING', h['x-content-type-options'] === 'nosniff');
  rec('SEC-HEAD-02', 'Headers', 'Header X-Frame-Options: DENY hoặc SAMEORIGIN', 'DENY/SAMEORIGIN', h['x-frame-options'] || 'MISSING', !!h['x-frame-options']);
  rec('SEC-HEAD-03', 'Headers', 'Header Strict-Transport-Security (HSTS)', 'max-age=...', h['strict-transport-security'] || 'MISSING', !!h['strict-transport-security']);

  // 5. Stack Trace & Internal Error Leaks
  console.log('\n--- 5. STACK TRACE & ERROR LEAKS AUDIT ---');
  const badJsonRes = await req('/api/auth/login', 'POST', 'INVALID_JSON_BODY', { 'Content-Type': 'application/json' });
  const leaksStack = /at\s+[\w\.]+\s+\(.*:\d+:\d+\)/.test(badJsonRes.text) || badJsonRes.text.includes('node_modules') || badJsonRes.text.includes('stack');
  rec('SEC-STACK-01', 'Stack Leak', 'Gửi JSON hỏng không làm lộ Stack Trace nội bộ', 'Không lộ stack trace', leaksStack ? 'LEAKED STACK TRACE' : 'Clean error', !leaksStack, badJsonRes.text.slice(0, 80));

  // 6. File Upload Security
  console.log('\n--- 6. FILE UPLOAD SECURITY AUDIT ---');
  // Upload oversized file header test
  const bigUploadRes = await req('/api/ci-kaizen/upload-media', 'POST', 'a'.repeat(1024), {
    'Content-Type': 'video/mp4',
    'x-file-name': '../../etc/passwd.mp4'
  });
  const traversalCleaned = !bigUploadRes.text.includes('../../');
  rec('SEC-UP-TRAVERSAL', 'Upload', 'Tên file chứa Path Traversal (../../)', 'Làm sạch tên file', traversalCleaned ? 'Sanitized' : 'Traversal retained', traversalCleaned, bigUploadRes.text.slice(0, 80));

  console.log('\n========================================================');
  const passCount = findings.filter(f => f.pass).length;
  console.log(`TOTAL SECURITY CHECKS: ${findings.length} | PASSED: ${passCount} | FAILED: ${findings.length - passCount}`);
  console.log('========================================================');

  fs.writeFileSync('web/scratch/qa/security-spotcheck-results.json', JSON.stringify(findings, null, 2));
}

runSpotcheck();
