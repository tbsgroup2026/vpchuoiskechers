import fs from 'node:fs';

const BASE = 'http://127.0.0.1:8798';
const routesRaw = JSON.parse(fs.readFileSync('web/scratch/qa/extracted-routes.json', 'utf8'));

// Filter out templates/regex fragments like ${qs}, ${suffix}
const cleanRoutes = routesRaw
  .map(r => r.replace(/\$\{.*\}/g, '').replace(/\/+$/, ''))
  .filter(r => r.startsWith('/api/') && r.length > 5);
const uniqueRoutes = Array.from(new Set(cleanRoutes));

// Helper fetch
async function req(path, token, method = 'GET', body = null) {
  const headers = {
    'x-forwarded-proto': 'https',
    'User-Agent': 'TBS-QA-Verifier/1.0'
  };
  if (token !== undefined && token !== null) {
    headers['Authorization'] = token ? `Bearer ${token}` : 'Bearer ';
  }
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()), text: text.slice(0, 300), json };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function run() {
  console.log(`Starting T1 Verification on ${uniqueRoutes.length} routes...`);

  // Step 1: Login to get a valid token
  const loginRes = await req('/api/auth/login', null, 'POST', { empCode: '202608001', password: 'any_password' });
  const validToken = loginRes.json?.token || loginRes.json?.hrToken;
  console.log(`Valid token obtained: ${validToken ? 'YES (length ' + validToken.length + ')' : 'NO'}`);

  // Construct tokens
  const noToken = null;
  const emptyToken = '';
  const badSigToken = validToken ? validToken.slice(0, -6) + 'XXXXXX' : 'header.payload.invalidsig';
  
  // alg=none token
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const algNoneToken = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ empCode: '202608001', roleCode: 'SUPER_ADMIN', roleLevel: 1, exp: 9999999999 })}.`;
  
  // Expired token
  const expiredToken = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ empCode: '202608001', roleCode: 'SUPER_ADMIN', exp: 1500000000 })}.fake_signature`;
  
  // Legacy raw empCode
  const legacyEmpCodeToken = '202608001';

  // Logout test token
  const loginForLogout = await req('/api/auth/login', null, 'POST', { empCode: '202608002', password: 'test' });
  const tokenToLogout = loginForLogout.json?.token;
  if (tokenToLogout) {
    await req('/api/auth/logout', tokenToLogout, 'POST');
  }

  // 1. Test every route with NO TOKEN
  const routeAudit = [];
  const whitelistExpected = [
    '/api/auth/login',
    '/api/public/kaizen',
    '/api/ci-kaizen/upload-media',
    '/api/zalo/webhook',
    '/api/kaizen/version'
  ];

  for (const path of uniqueRoutes) {
    const resNoToken = await req(path, noToken);
    const resEmpty = await req(path, emptyToken);
    const resBadSig = await req(path, badSigToken);
    const resAlgNone = await req(path, algNoneToken);
    const resExpired = await req(path, expiredToken);
    const resLegacy = await req(path, legacyEmpCodeToken);

    const requiresAuth = resNoToken.status === 401;
    const isWhitelisted = whitelistExpected.some(w => path.startsWith(w));

    routeAudit.push({
      path,
      noTokenStatus: resNoToken.status,
      emptyStatus: resEmpty.status,
      badSigStatus: resBadSig.status,
      algNoneStatus: resAlgNone.status,
      expiredStatus: resExpired.status,
      legacyEmpCodeStatus: resLegacy.status,
      requiresAuth,
      isWhitelisted,
      sampleResponse: resNoToken.text.slice(0, 100)
    });
  }

  fs.writeFileSync('web/scratch/qa/t1-route-audit.json', JSON.stringify(routeAudit, null, 2));
  console.log(`Route audit completed. Saved to web/scratch/qa/t1-route-audit.json`);

  // Summary counts
  const total = routeAudit.length;
  const requireAuthCount = routeAudit.filter(r => r.requiresAuth).length;
  const noAuthCount = routeAudit.filter(r => !r.requiresAuth);
  console.log(`Total routes: ${total}`);
  console.log(`Routes returning 401 without token: ${requireAuthCount}`);
  console.log(`Routes NOT returning 401 without token: ${noAuthCount.length}`);
  
  console.log('\n--- ROUTES NOT RETURNING 401 WITHOUT TOKEN ---');
  for (const r of noAuthCount) {
    console.log(`${r.noTokenStatus} | ${r.path} | sample: ${r.sampleResponse.slice(0, 60)}`);
  }

  // Check alg=none bypass
  const algNoneBypass = routeAudit.filter(r => r.requiresAuth && r.algNoneStatus !== 401);
  console.log(`\nRoutes where alg=none bypassed 401: ${algNoneBypass.length}`);
  for (const r of algNoneBypass) {
    console.log(`Bypass alg=none: ${r.path} -> ${r.algNoneStatus}`);
  }

  // Check bad signature bypass
  const badSigBypass = routeAudit.filter(r => r.requiresAuth && r.badSigStatus !== 401);
  console.log(`\nRoutes where bad signature bypassed 401: ${badSigBypass.length}`);
  for (const r of badSigBypass) {
    console.log(`Bypass bad signature: ${r.path} -> ${r.badSigStatus}`);
  }

  // Check legacy empCode bypass
  const legacyBypass = routeAudit.filter(r => r.requiresAuth && r.legacyEmpCodeStatus !== 401);
  console.log(`\nRoutes where Bearer 202608001 bypassed 401: ${legacyBypass.length}`);
  for (const r of legacyBypass) {
    console.log(`Bypass legacy Bearer: ${r.path} -> ${r.legacyEmpCodeStatus}`);
  }

  // Check logged out token reuse
  if (tokenToLogout) {
    const afterLogoutRes = await req('/api/auth/me', tokenToLogout);
    console.log(`\nAfter logout /api/auth/me status: ${afterLogoutRes.status} (Expected 401 if revoked)`);
  }
}

run();
