// QA script (đọc-chỉ, không sửa code app). Chạy: BASE_URL=http://127.0.0.1:8799 node web/scratch/qa/qa-run.mjs
import fs from 'node:fs';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8799';
const creds = JSON.parse(fs.readFileSync(new URL('../../.staging-credentials.json', import.meta.url), 'utf8'));
const results = [];
const _f = globalThis.fetch; globalThis.fetch = (u, i = {}) => _f(u, { ...i, headers: { 'x-forwarded-proto': 'https', ...(i.headers || {}) } });
const rec = (id, desc, expected, actual, pass, extra = '') => { results.push({ id, desc, expected, actual, pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${id} | ${desc} | exp=${expected} act=${actual} ${extra}`); };

async function login(code) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empCode: code, password: creds[code].password }) });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, token: j.hrToken, body: j, headers: r.headers };
}
const call = async (path, token, init = {}) => {
  const h = { ...(init.headers || {}) };
  if (token) h.authorization = `Bearer ${token}`;
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/hr${path}`, { ...init, headers: h });
  const text = await r.text();
  return { status: r.status, text, ms: Date.now() - t0, headers: r.headers };
};

const roles = ['SA001', 'HRM001', 'HRS001', 'PAY001', 'MGRA01', 'MGRB01', 'EMPA01', 'EMPA02', 'EMPB01'];
const tok = {};
for (const c of roles) {
  const l = await login(c);
  tok[c] = l.token;
  rec(`AUTH-${c}`, `Đăng nhập ${c} (${creds[c].role})`, '200+hrToken', `${l.status}${l.token ? '+token' : ' no token: ' + JSON.stringify(l.body).slice(0, 120)}`, l.status === 200 && !!l.token);
}

// RBAC matrix: [id, method, path, expected status per account]
const matrix = [
  ['employees:list', 'GET', '/employees', { SA001: 200, HRM001: 200, HRS001: 200, PAY001: 403, MGRA01: 200, EMPA01: 403 }],
  ['profile:other', 'GET', '/employees/EMPB01', { SA001: 200, HRM001: 200, HRS001: 200, PAY001: 403, MGRA01: 403, EMPA01: 403 }],
  ['profile:team', 'GET', '/employees/EMPA01', { MGRA01: 200, MGRB01: 403, EMPA02: 403, EMPA01: 200 }],
  ['payslip:other', 'GET', '/payslip/EMPA01', { SA001: 200, HRM001: 200, HRS001: 403, PAY001: 200, MGRA01: 403, EMPA02: 403, EMPA01: 200 }],
  ['payslip:me', 'GET', '/payslip/me', { HRS001: 200, EMPA01: 200 }],
  ['report:payroll', 'GET', '/reports/export?type=payroll', { SA001: 200, HRM001: 200, HRS001: 403, PAY001: 200, MGRA01: 403, EMPA01: 403 }],
  ['report:leave', 'GET', '/reports/export?type=leave', { HRS001: 403, EMPA01: 403, PAY001: 200 }],
  ['leave:list', 'GET', '/leave', { SA001: 200, EMPA01: 200 }],
  ['timesheet:list', 'GET', '/timesheet', { PAY001: 200, EMPA01: 200 }],
];
for (const [id, method, path, exp] of matrix) {
  for (const [code, want] of Object.entries(exp)) {
    const r = await call(path, tok[code], { method });
    rec(`RBAC-${id}-${code}`, `${method} ${path} bởi ${code}`, want, r.status, r.status === want);
  }
}

// Chưa đăng nhập / token xấu
for (const p of ['/me', '/employees', '/employees/EMPA01', '/payslip/EMPA01', '/leave', '/timesheet', '/reports/export', '/files/x']) {
  const r = await call(p, null);
  rec(`ANON-${p}`, `Không token GET ${p}`, 401, r.status, r.status === 401);
}
const none = 'eyJhbGciOiJub25lIn0.' + Buffer.from(JSON.stringify({ sub: 'SA001', exp: 9999999999 })).toString('base64url') + '.';
rec('TOK-alg-none', 'Token alg:none', 401, (await call('/me', none)).status, (await call('/me', none)).status === 401);
const t = tok.EMPA01;
const [h, b, s] = t.split('.');
const forged = `${h}.${Buffer.from(JSON.stringify({ sub: 'SA001', iat: 1, exp: 9999999999 })).toString('base64url')}.${s}`;
rec('TOK-tampered', 'Sửa payload sub=SA001 giữ chữ ký', 401, (await call('/me', forged)).status, (await call('/me', forged)).status === 401);
rec('TOK-legacy', 'Bearer MSNV thô', 401, (await call('/me', 'SA001')).status, (await call('/me', 'SA001')).status === 401);

// Lộ lương
const lst = await call('/employees', tok.HRS001);
rec('LEAK-hrs-list', 'HR Staff list không chứa baseSalary', 'no baseSalary', /baseSalary/.test(lst.text) ? 'LEAK' : 'ok', !/baseSalary/.test(lst.text));
const ps = await call('/employees/EMPA01', tok.HRS001);
rec('LEAK-hrs-profile', 'HR Staff xem hồ sơ không chứa baseSalary', 'no baseSalary', /baseSalary/.test(ps.text) ? 'LEAK' : 'ok', !/baseSalary/.test(ps.text));
const mg = await call('/employees', tok.MGRA01);
rec('LEAK-mgr-list', 'Manager list không chứa baseSalary', 'no baseSalary', /baseSalary/.test(mg.text) ? 'LEAK' : 'ok', !/baseSalary/.test(mg.text));
const pm = await call('/employees/EMPA01', tok.PAY001);
rec('LEAK-pay-profile', 'Payroll xem hồ sơ NV khác', 403, pm.status, pm.status === 403);

// Nghỉ phép: validate + edge
const post = (p, token, body) => call(p, token, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
let r = await post('/leave', tok.EMPA01, { startDate: '2026-11-02', endDate: '2026-11-03', leaveType: 'FULL', reason: '<script>alert(1)</script>' });
rec('LEAVE-create', 'Tạo đơn 2 ngày với reason chứa <script>', 201, r.status, r.status === 201, r.text.slice(0, 120));
const leaveId = (() => { try { return JSON.parse(r.text).data.id; } catch { return null; } })();
r = await post('/leave', tok.EMPA01, { startDate: '2026-11-03', endDate: '2026-11-04', leaveType: 'FULL' });
rec('LEAVE-overlap', 'Đơn trùng ngày với đơn PENDING', '4xx', r.status, r.status >= 400 && r.status < 500, r.text.slice(0, 100));
r = await post('/leave', tok.EMPA01, { startDate: '2026-12-10', endDate: '2026-12-01', leaveType: 'FULL' });
rec('LEAVE-end-before-start', 'Ngày kết thúc < bắt đầu', '4xx', r.status, r.status >= 400 && r.status < 500, r.text.slice(0, 100));
r = await post('/leave', tok.EMPA01, { startDate: '2026-12-01', endDate: '2026-12-31', leaveType: 'FULL' });
rec('LEAVE-over-balance', 'Đơn vượt số dư', 422, r.status, r.status === 422, r.text.slice(0, 100));
r = await post('/leave', tok.EMPA01, { startDate: '2026-11-14', endDate: '2026-11-15', leaveType: 'FULL' });
rec('LEAVE-weekend', 'Đơn rơi vào T7-CN: không trừ phép', 'days=0 hoặc 4xx', r.status + ' ' + r.text.slice(0, 100), true, '(ghi nhận, xem chi tiết)');
r = await post('/leave', tok.EMPA01, { startDate: '2026-11-20', endDate: '2026-11-20', leaveType: 'HALF' });
rec('LEAVE-half-nosession', 'HALF thiếu halfSession', 400, r.status, r.status === 400);
r = await post('/leave', tok.EMPA01, { startDate: 'abc', endDate: 'xyz' });
rec('LEAVE-bad-date', 'Ngày rác', 400, r.status, r.status === 400);
r = await call('/leave', tok.EMPA01, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
rec('LEAVE-bad-json', 'JSON hỏng', 400, r.status, r.status === 400);
if (leaveId) {
  r = await call(`/leave/${leaveId}/approve`, tok.EMPA02, { method: 'POST' });
  rec('LEAVE-emp-approve', 'Nhân viên duyệt đơn', 403, r.status, r.status === 403);
  r = await call(`/leave/${leaveId}/approve`, tok.HRS001, { method: 'POST' });
  rec('LEAVE-hrs-approve', 'HR Staff duyệt đơn (đặc tả: HR Staff không có quyền duyệt? ghi nhận)', 403, r.status, r.status === 403);
  r = await call(`/leave/${leaveId}/approve`, tok.MGRB01, { method: 'POST' });
  rec('LEAVE-other-team-mgr', 'Manager team khác duyệt', 403, r.status, r.status === 403);
  const [a1, a2] = await Promise.all([call(`/leave/${leaveId}/approve`, tok.MGRA01, { method: 'POST' }), call(`/leave/${leaveId}/approve`, tok.HRM001, { method: 'POST' })]);
  rec('LEAVE-race', 'Hai người duyệt cùng lúc: chỉ 1 thành công', '1x200 + 1x409', `${a1.status}/${a2.status}`, [a1.status, a2.status].sort().join() === '200,409');
  r = await call(`/leave/${leaveId}/approve`, tok.HRM001, { method: 'POST' });
  rec('LEAVE-reapprove', 'Duyệt lại đơn đã duyệt', 409, r.status, r.status === 409);
  r = await call(`/leave/${leaveId}/reject`, tok.HRM001, { method: 'POST' });
  rec('LEAVE-reject-after-approve', 'Từ chối đơn đã duyệt', 409, r.status, r.status === 409);
  const me = JSON.parse((await call('/me', tok.EMPA01)).text);
  rec('LEAVE-balance', 'Số dư phép sau duyệt 2 ngày = 10 (hoặc 12 - days)', 10, me.data.leaveBalance, me.data.leaveBalance === 10);
}
r = await post('/leave', tok.EMPA02, { startDate: '2026-11-09', endDate: '2026-11-09', leaveType: 'FULL' });
const rejId = (() => { try { return JSON.parse(r.text).data.id; } catch { return null; } })();
if (rejId) {
  const rj = await call(`/leave/${rejId}/reject`, tok.MGRA01, { method: 'POST' });
  rec('LEAVE-reject-no-reason', 'Từ chối KHÔNG cần lý do (đặc tả: bắt buộc lý do)', '400 thiếu lý do', rj.status, rj.status === 400, rj.text.slice(0, 80));
  const rj2 = await call(`/leave/${rejId}/reject`, tok.MGRA01, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason: 'Trùng đợt cao điểm sản xuất' }) });
  rec('LEAVE-reject-with-reason', 'Từ chối có lý do tiếng Việt', 200, rj2.status, rj2.status === 200);
}
// Tự duyệt
r = await post('/leave', tok.MGRA01, { startDate: '2026-11-23', endDate: '2026-11-23', leaveType: 'FULL' });
const selfId = (() => { try { return JSON.parse(r.text).data.id; } catch { return null; } })();
if (selfId) { const x = await call(`/leave/${selfId}/approve`, tok.MGRA01, { method: 'POST' }); rec('LEAVE-self-approve', 'Tự duyệt đơn của mình', 403, x.status, x.status === 403); }

// Chấm công
r = await post('/timesheet', tok.EMPA01, { checkIn: '2026-10-05T01:00:00Z', checkOut: '2026-10-05T10:30:00Z' });
rec('TS-create', 'Chấm công bình thường', 201, r.status, r.status === 201, r.text.slice(0, 120));
r = await post('/timesheet', tok.EMPA01, { checkIn: '2026-10-05T01:00:00Z', checkOut: '2026-10-05T10:30:00Z' });
rec('TS-dup', 'Chấm công trùng', 409, r.status, r.status === 409);
r = await post('/timesheet', tok.EMPA01, { checkIn: '2026-10-06T10:00:00Z', checkOut: '2026-10-06T02:00:00Z' });
rec('TS-out-before-in', 'Giờ ra < giờ vào', 422, r.status, r.status === 422);
r = await post('/timesheet', tok.EMPA01, { checkIn: '2026-10-07T15:00:00Z', checkOut: '2026-10-07T23:00:00Z', nightShift: true });
rec('TS-night', 'Ca đêm qua 0h', 201, r.status, r.status === 201, r.text.slice(0, 140));
r = await post('/timesheet', tok.EMPA01, { checkIn: '2026-10-08T00:00:00Z', checkOut: '2026-10-08T20:00:00Z' });
rec('TS-too-long', 'Ca 20 giờ', 422, r.status, r.status === 422);
r = await post('/timesheet', tok.EMPA01, { checkIn: '2030-01-01T01:00:00Z', checkOut: '2030-01-01T10:00:00Z' });
rec('TS-future', 'Chấm công ngày tương lai', '4xx', r.status, r.status >= 400 && r.status < 500, '(đặc tả: dữ liệu tương lai cần chặn)');
r = await post('/timesheet', tok.EMPA01, { checkIn: '2026-10-09T01:00:00Z', checkOut: '2026-10-09T10:00:00Z', empCode: 'EMPB01' });
rec('TS-mass-assign', 'Body gửi empCode khác: không được ghi cho người khác', 'own only', r.status, true);
const tsB = JSON.parse((await call('/timesheet', tok.EMPB01)).text).data || [];
rec('TS-mass-assign-check', 'EMPB01 không có dòng do EMPA01 tạo', 0, tsB.filter((x) => x.work_date === '2026-10-09').length, tsB.filter((x) => x.work_date === '2026-10-09').length === 0);

// Upload
const mk = (name, bytes, type = 'application/octet-stream') => { const f = new FormData(); f.append('file', new Blob([bytes], { type }), name); return f; };
const up = (token, form) => call('/files', token, { method: 'POST', body: form });
const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(100, 65)]);
r = await up(tok.EMPA01, mk('NV001_CCCD.pdf', pdf));
rec('UP-pdf', 'Upload PDF hợp lệ', 201, r.status, r.status === 201);
const fileId = (() => { try { return JSON.parse(r.text).data.id; } catch { return null; } })();
r = await up(tok.EMPA01, mk('virus.pdf', Buffer.from('MZ\x90\x00exe-content')));
rec('UP-exe-as-pdf', 'EXE đổi đuôi .pdf', 415, r.status, r.status === 415);
r = await up(tok.EMPA01, mk('a.exe', Buffer.from('MZ')));
rec('UP-exe', 'Đuôi .exe', 415, r.status, r.status === 415);
r = await up(tok.EMPA01, mk('big.pdf', Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(10 * 1024 * 1024 + 10, 1)])));
rec('UP-11MB', 'File > 10MB', 413, r.status, r.status === 413);
r = await up(tok.EMPA01, mk('../../etc/passwd.pdf', pdf));
rec('UP-traversal', 'Tên ../../etc/passwd.pdf', '201 + tên đã làm sạch', `${r.status} ${r.text.slice(0, 120)}`, r.status === 201 && !/\.\./.test(r.text));
r = await up(tok.EMPA01, mk('<img src=x onerror=alert(1)>.pdf', pdf));
rec('UP-xss-name', 'Tên file chứa HTML', 'sanitized', `${r.status} ${r.text.slice(0, 140)}`, r.status === 201 && !/<img/.test(r.text));
r = await up(tok.EMPA01, mk('NV001_CCCD.pdf', pdf));
rec('UP-dup-name', 'Trùng tên → không ghi đè', 201, r.status, r.status === 201);
r = await up(tok.EMPA01, mk('empty.pdf', Buffer.alloc(0)));
rec('UP-empty', 'File rỗng', 400, r.status, r.status === 400);
r = await up(tok.EMPA01, mk('tài liệu tiếng Việt.pdf', pdf));
rec('UP-vi-name', 'Tên tiếng Việt có dấu', 201, r.status, r.status === 201, r.text.slice(0, 100));
r = await up(null, mk('x.pdf', pdf));
rec('UP-anon', 'Upload không token', 401, r.status, r.status === 401);
if (fileId) {
  r = await call(`/files/${fileId}`, null);
  rec('DL-anon', 'Tải file không token', 401, r.status, r.status === 401);
  for (const [c, want] of [['EMPB01', 403], ['EMPA02', 403], ['PAY001', 403], ['HRS001', 200], ['EMPA01', 200], ['MGRA01', 403]]) {
    r = await call(`/files/${fileId}`, tok[c]);
    rec(`DL-${c}`, `Tải file của EMPA01 bởi ${c}`, want, r.status, r.status === want);
  }
  r = await call(`/files/${fileId}`, tok.EMPA01);
  rec('DL-headers', 'Header bảo mật tải file', 'nosniff + attachment', `${r.headers.get('x-content-type-options')} | ${r.headers.get('content-disposition')}`, r.headers.get('x-content-type-options') === 'nosniff');
}
// Audit log & rate limit
for (const p of ['/audit-logs', '/audit', '/notifications', '/contracts', '/departments', '/documents', '/payroll']) {
  r = await call(p, tok.SA001);
  rec(`SPEC-${p}`, `Endpoint theo đặc tả ${p} tồn tại`, '200', r.status, r.status === 200);
}
const bad = []; 
for (let i = 0; i < 15; i++) bad.push((await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empCode: 'SA001', password: 'sai' + i }) })).status);
rec('BRUTE-login', '15 lần sai mật khẩu liên tiếp → có khoá/429', 'có 429/423', bad.join(','), bad.some((s) => s === 429 || s === 423));
const good = await login('SA001');
rec('BRUTE-after', 'Đăng nhập đúng sau brute force', 'bị khoá (429/423)', good.status, good.status === 429 || good.status === 423, '(nếu 200 → không có lockout)');
r = await call('/employees/%27%20OR%201%3D1--', tok.SA001);
rec('SQLI-param', "SQLi trong :code", '404', r.status, r.status === 404);
r = await call('/employees', tok.SA001, { headers: { origin: 'https://evil.example' } });
rec('CORS-origin', 'CORS: Access-Control-Allow-Origin với Origin lạ', 'không phải *', r.headers.get('access-control-allow-origin') || '(none)', r.headers.get('access-control-allow-origin') !== '*');
// Hiệu năng cơ bản
const times = []; for (let i = 0; i < 10; i++) times.push((await call('/employees', tok.SA001)).ms);
rec('PERF-employees', '/employees p max < 1000ms (local)', '<1000', Math.max(...times) + 'ms', Math.max(...times) < 1000);

const pass = results.filter((x) => x.pass).length;
console.log(`\nTOTAL ${results.length} | PASS ${pass} | FAIL ${results.length - pass}`);
fs.writeFileSync(new URL('./qa-results.json', import.meta.url), JSON.stringify(results, null, 2));
