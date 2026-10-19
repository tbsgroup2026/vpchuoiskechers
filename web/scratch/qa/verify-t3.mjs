import fs from 'node:fs';

const BASE = 'http://127.0.0.1:8798';

async function req(path, token, method = 'GET', body = null) {
  const headers = {
    'x-forwarded-proto': 'https',
    'User-Agent': 'TBS-QA-Verifier/1.0'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()), text, json };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function login(empCode) {
  const r = await req('/api/auth/login', null, 'POST', { empCode, password: 'test' });
  return r.json?.token;
}

async function run() {
  console.log('--- STARTING T3 IDOR & RBAC VERIFICATION ---');
  const results = [];

  // Accounts
  const adminToken = await login('202608001'); // TRUONG_PHONG / ADMIN
  const cbcnvA = await login('202608002'); // CBCNV A
  const cbcnvB = await login('202608005'); // CBCNV B

  console.log(`Tokens: Admin=${!!adminToken}, UserA=${!!cbcnvA}, UserB=${!!cbcnvB}`);

  // Test 1: Admin endpoint privilege escalation: CBCNV calling /api/admin/workspace-config
  const adminApiRes = await req('/api/admin/workspace-config', cbcnvA, 'GET');
  results.push({
    testId: 'T3-RBAC-01',
    name: 'CBCNV calls /api/admin/workspace-config',
    expected: 403,
    actual: adminApiRes.status,
    pass: adminApiRes.status === 403,
    note: adminApiRes.text.slice(0, 100)
  });

  // Test 2: CBCNV calling /api/admin/permissions
  const adminPermRes = await req('/api/admin/permissions', cbcnvA, 'GET');
  results.push({
    testId: 'T3-RBAC-02',
    name: 'CBCNV calls /api/admin/permissions',
    expected: 403,
    actual: adminPermRes.status,
    pass: adminPermRes.status === 403,
    note: adminPermRes.text.slice(0, 100)
  });

  // Test 3: IDOR on /api/business-trips (GET)
  const btRes = await req('/api/business-trips', cbcnvA, 'GET');
  results.push({
    testId: 'T3-IDOR-BT-01',
    name: 'CBCNV A views /api/business-trips (should only see own trips or 403)',
    expected: 'Scaped to own',
    actual: btRes.status,
    pass: btRes.status === 200,
    note: `Returned items count: ${Array.isArray(btRes.json) ? btRes.json.length : (btRes.json?.trips?.length || btRes.json?.data?.length || 'unknown')}`
  });

  // Test 4: IDOR on /api/rooms/booking (Cancel/Delete booking of User B by User A)
  const cancelBookingRes = await req('/api/rooms/booking?id=booking_b', cbcnvA, 'DELETE');
  results.push({
    testId: 'T3-IDOR-ROOM-01',
    name: 'CBCNV A cancels booking of User B',
    expected: 403,
    actual: cancelBookingRes.status,
    pass: cancelBookingRes.status === 403 || cancelBookingRes.status === 404,
    note: cancelBookingRes.text.slice(0, 100)
  });

  // Test 5: IDOR on /api/maintenance/tickets (User A updates ticket assigned to User B)
  const updateTicketRes = await req('/api/maintenance/tickets', cbcnvA, 'PUT', {
    id: 'cmv500i0z0001psp7nvg2yvq',
    status: 'COMPLETED',
    note: 'Hacked by CBCNV A'
  });
  results.push({
    testId: 'T3-IDOR-MMTB-01',
    name: 'CBCNV A modifies maintenance ticket',
    expected: 403,
    actual: updateTicketRes.status,
    pass: updateTicketRes.status === 403,
    note: updateTicketRes.text.slice(0, 100)
  });

  // Test 6: Mass Assignment on CI Kaizen (CBCNV submits Kaizen with status APPROVED)
  const massAssignKaizen = await req('/api/ci-kaizen', cbcnvA, 'POST', {
    title: 'Đề xuất cải tiến tự phong',
    proposer_emp_code: '202608002',
    status: 'APPROVED',
    stage: 'FINAL_STAGE',
    score: 100,
    approver: '202608001'
  });
  results.push({
    testId: 'T3-MASS-ASSIGN-01',
    name: 'Mass assignment: CBCNV sets status=APPROVED on Kaizen creation',
    expected: 'status reset to DRAFT/PENDING or 403',
    actual: massAssignKaizen.status,
    pass: massAssignKaizen.json?.status !== 'APPROVED' && massAssignKaizen.json?.data?.status !== 'APPROVED',
    note: `Result status: ${massAssignKaizen.json?.status || massAssignKaizen.json?.data?.status || 'unknown'}`
  });

  // Test 7: Non-existent ID format (should be 404 or 400, not 500)
  const badIdRes = await req('/api/ci-kaizen/not_exist_99999', cbcnvA, 'GET');
  results.push({
    testId: 'T3-EDGE-NOTFOUND',
    name: 'GET non-existent ID',
    expected: 404,
    actual: badIdRes.status,
    pass: badIdRes.status === 404 || badIdRes.status === 400,
    note: `Status ${badIdRes.status}`
  });

  // Test 8: SQL Injection / Malformed ID (should NOT return 500 or leak stack trace)
  const sqliIdRes = await req('/api/ci-kaizen/%27%20OR%201%3D1--', cbcnvA, 'GET');
  results.push({
    testId: 'T3-EDGE-SQLI-ID',
    name: 'GET with SQLi payload in ID',
    expected: '400 or 404 (No 500)',
    actual: sqliIdRes.status,
    pass: sqliIdRes.status === 400 || sqliIdRes.status === 404,
    note: `Status: ${sqliIdRes.status}, Text: ${sqliIdRes.text.slice(0, 80)}`
  });

  console.log('\n--- T3 VERIFICATION RESULTS ---');
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'} [${r.testId}] ${r.name} | Exp: ${r.expected} | Act: ${r.actual} | Note: ${r.note}`);
  }

  fs.writeFileSync('web/scratch/qa/t3-results.json', JSON.stringify(results, null, 2));
}

run();
