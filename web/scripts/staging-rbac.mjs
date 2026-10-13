// RBAC trên môi trường đã deploy. Dùng đăng nhập thật (/api/auth/login) → hrToken ký HMAC.
// Chạy: BASE_URL=https://... node scripts/staging-rbac.mjs   (đọc mật khẩu từ web/.staging-credentials.json)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL;
if (!BASE) throw new Error('Thiếu BASE_URL');
const creds = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.staging-credentials.json'), 'utf-8'));

const ROLES = {
  SUPER_ADMIN: 'SA001', HR_MANAGER: 'HRM001', HR_STAFF: 'HRS001', PAYROLL: 'PAY001',
  MANAGER_A: 'MGRA01', MANAGER_B: 'MGRB01', EMPLOYEE_A: 'EMPA01', EMPLOYEE_B: 'EMPB01', GUEST: null,
};
const roleNames = Object.keys(ROLES);
const log = [];
const say = (s) => { console.log(s); log.push(s); };

async function login(code) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empCode: code, password: creds[code].password }) });
  const j = await r.json();
  if (!j.hrToken) throw new Error(`Đăng nhập ${code} không có hrToken: HTTP ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j.hrToken;
}
const tokens = {};
for (const [role, code] of Object.entries(ROLES)) tokens[role] = code ? await login(code) : null;

async function call(role, method, p, body, extra = {}) {
  const headers = { ...(tokens[role] ? { Authorization: `Bearer ${tokens[role]}` } : {}), ...extra.headers };
  let init = { method, headers };
  if (body instanceof FormData) init.body = body; else if (body) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
  const r = await fetch(`${BASE}/api/hr${p}`, init);
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json() : await r.arrayBuffer();
  return { status: r.status, data };
}

let pass = 0, fail = 0;
const matrix = []; // [endpoint, {role: status}]
function check(name, role, got, expected, extra = '') {
  const ok = got === expected;
  ok ? pass++ : fail++;
  say(`${ok ? 'PASS' : 'FAIL'} | ${name} | ${role} | expected=${expected} actual=${got}${extra ? ' | ' + extra : ''}`);
  return ok;
}
async function row(name, fn, expectedByRole) {
  const cells = {};
  for (const role of roleNames) {
    const { status, extra } = await fn(role);
    cells[role] = status;
    check(name, role, status, expectedByRole[role], extra);
  }
  matrix.push([name, cells, expectedByRole]);
}
const exp = (m) => Object.fromEntries(roleNames.map((r) => [r, m[r] ?? m.default]));
const ALL_AUTH = { default: 200, GUEST: 401 };

say(`# RBAC staging | BASE=${BASE} | ${new Date().toISOString()}`);

// token giả mạo
for (const [label, header] of [['legacy Bearer MSNV', 'Bearer SA001'], ['unsigned JWT roleCode=SUPER_ADMIN', 'Bearer eyJhbGciOiJub25lIn0.' + Buffer.from(JSON.stringify({ sub: 'SA001', exp: 9999999999 })).toString('base64url') + '.'], ['tbs_token legacy', 'Bearer tbs_token_SA001_1_abc']]) {
  const r = await fetch(`${BASE}/api/hr/me`, { headers: { Authorization: header } });
  check(`forged token: ${label}`, 'ATTACKER', r.status, 401);
}

await row('GET /me', async (r) => ({ status: (await call(r, 'GET', '/me')).status }), exp(ALL_AUTH));

const empListCounts = {};
await row('GET /employees', async (r) => {
  const res = await call(r, 'GET', '/employees');
  if (res.status === 200) empListCounts[r] = res.data.data.length;
  return { status: res.status };
}, exp({ default: 403, SUPER_ADMIN: 200, HR_MANAGER: 200, HR_STAFF: 200, MANAGER_A: 200, MANAGER_B: 200, GUEST: 401 }));

// Rò rỉ nhóm: quản lý chỉ thấy nhóm của mình
for (const [role, team] of [['MANAGER_A', 'TEAM_A'], ['MANAGER_B', 'TEAM_B']]) {
  const res = await call(role, 'GET', '/employees');
  const teams = [...new Set(res.data.data.map((e) => e.teamId))];
  check('leak: /employees chỉ nhóm của mình', role, teams.join(','), team);
}

await row('GET /employees/EMPB01 (hồ sơ nhóm B)', async (r) => ({ status: (await call(r, 'GET', '/employees/EMPB01')).status }),
  exp({ default: 403, SUPER_ADMIN: 200, HR_MANAGER: 200, HR_STAFF: 200, MANAGER_B: 200, EMPLOYEE_B: 200, GUEST: 401 }));
await row('GET /employees/EMPA01 (hồ sơ nhóm A)', async (r) => ({ status: (await call(r, 'GET', '/employees/EMPA01')).status }),
  exp({ default: 403, SUPER_ADMIN: 200, HR_MANAGER: 200, HR_STAFF: 200, MANAGER_A: 200, EMPLOYEE_A: 200, GUEST: 401 }));

// Nghỉ phép: mỗi vai trò tạo đơn cho mình (ngày khác nhau để không trùng)
const leaveIds = {};
let d = 2;
await row('POST /leave (nghỉ nửa ngày, cho chính mình)', async (r) => {
  const day = `2026-11-${String(2 + (d++ % 20)).padStart(2, '0')}`;
  const res = await call(r, 'POST', '/leave', { startDate: day, endDate: day, leaveType: 'HALF', halfSession: 'AM' });
  if (res.status === 201) leaveIds[r] = res.data.data.id;
  return { status: res.status };
}, exp({ default: 201, GUEST: 401 }));

// Tạo thêm đơn nhóm B để test duyệt
const bReq = [];
for (let i = 0; i < 6; i++) {
  const day = `2026-12-${String(1 + i).padStart(2, '0')}`; // 1..6/12/2026 (T3..T1 tuần sau) - ngày làm việc không quan trọng với HALF
  const res = await call('EMPLOYEE_B', 'POST', '/leave', { startDate: day, endDate: day, leaveType: 'HALF', halfSession: 'PM' });
  bReq.push(res.data.data.id);
}
const approvers = [['SUPER_ADMIN', 200], ['HR_MANAGER', 200], ['MANAGER_B', 200], ['HR_STAFF', 403], ['PAYROLL', 403], ['MANAGER_A', 403], ['EMPLOYEE_A', 403], ['EMPLOYEE_B', 403], ['GUEST', 401]];
const approveCells = {};
let idx = 0;
for (const [role, want] of approvers) {
  const res = await call(role, 'POST', `/leave/${bReq[idx++ % bReq.length]}/approve`);
  approveCells[role] = res.status;
  check('POST /leave/:id/approve (đơn của EMPB01, nhóm B)', role, res.status, want, res.data?.code || '');
}
matrix.push(['POST /leave/:id/approve (đơn nhóm B)', approveCells, Object.fromEntries(approvers)]);
{
  const res = await call('MANAGER_A', 'POST', `/leave/${leaveIds.MANAGER_A}/approve`);
  check('tự duyệt đơn của mình', 'MANAGER_A', res.status, 403, res.data?.code);
  const res2 = await call('MANAGER_B', 'POST', `/leave/${bReq[5]}/reject`);
  check('POST /leave/:id/reject (nhóm B)', 'MANAGER_B', res2.status, 200);
}
// GET /leave phạm vi
for (const [role, check_] of [['EMPLOYEE_A', (rows) => rows.every((x) => x.emp_code === 'EMPA01')], ['MANAGER_A', (rows) => rows.every((x) => x.team_id === 'TEAM_A')], ['MANAGER_B', (rows) => rows.every((x) => x.team_id === 'TEAM_B')]]) {
  const res = await call(role, 'GET', '/leave');
  check('leak: GET /leave đúng phạm vi', role, String(res.status === 200 && check_(res.data.data)), 'true', `rows=${res.data.data?.length}`);
}
await row('GET /leave', async (r) => ({ status: (await call(r, 'GET', '/leave')).status }), exp(ALL_AUTH));

// Chấm công
let t = 1;
await row('POST /timesheet (ca đêm qua 0h)', async (r) => {
  const day = String(1 + (t++)).padStart(2, '0');
  const res = await call(r, 'POST', '/timesheet', { checkIn: `2026-11-${day}T22:00:00+07:00`, checkOut: `2026-11-${String(Number(day) + 1).padStart(2, '0')}T06:00:00+07:00`, nightShift: true });
  return { status: res.status, extra: res.status === 201 ? `workDate=${res.data.data.workDate} hours=${res.data.data.hours}` : '' };
}, exp({ default: 201, GUEST: 401 }));
await row('GET /timesheet', async (r) => ({ status: (await call(r, 'GET', '/timesheet')).status }), exp(ALL_AUTH));
{
  const res = await call('MANAGER_A', 'GET', '/timesheet');
  check('leak: GET /timesheet nhóm A', 'MANAGER_A', String(res.data.data.every((x) => ['EMPA01', 'EMPA02', 'MGRA01'].includes(x.emp_code))), 'true');
}

// Lương
await row('GET /payslip/me', async (r) => ({ status: (await call(r, 'GET', '/payslip/me')).status }), exp(ALL_AUTH));
await row('GET /payslip/EMPB01 (lương người khác)', async (r) => ({ status: (await call(r, 'GET', '/payslip/EMPB01')).status }),
  exp({ default: 403, SUPER_ADMIN: 200, HR_MANAGER: 200, PAYROLL: 200, EMPLOYEE_B: 200, GUEST: 401 }));

// Upload / tải file
const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('rbac-test-' + Date.now())]);
const fileIds = {};
await row('POST /files (upload PDF hợp lệ)', async (r) => {
  const fd = new FormData(); fd.append('file', new Blob([PDF], { type: 'application/pdf' }), 'rbac.pdf');
  const res = await call(r, 'POST', '/files', fd);
  if (res.status === 201) fileIds[r] = res.data.data.id;
  return { status: res.status };
}, exp({ default: 201, GUEST: 401 }));
await row('GET /files/:id (file của EMPA01)', async (r) => ({ status: (await call(r, 'GET', `/files/${fileIds.EMPLOYEE_A}`)).status }),
  exp({ default: 403, SUPER_ADMIN: 200, HR_MANAGER: 200, HR_STAFF: 200, EMPLOYEE_A: 200, GUEST: 401 }));

await row('GET /reports/export?type=payroll', async (r) => ({ status: (await call(r, 'GET', '/reports/export?type=payroll')).status }),
  exp({ default: 403, SUPER_ADMIN: 200, HR_MANAGER: 200, PAYROLL: 200, GUEST: 401 }));

say(`\n## TỔNG: ${pass} PASS, ${fail} FAIL (tổng ${pass + fail} kiểm tra)`);

// Ma trận markdown
const short = { SUPER_ADMIN: 'SuperAdmin', HR_MANAGER: 'HRMgr', HR_STAFF: 'HRStaff', PAYROLL: 'Payroll', MANAGER_A: 'MgrA', MANAGER_B: 'MgrB', EMPLOYEE_A: 'EmpA', EMPLOYEE_B: 'EmpB', GUEST: 'Guest' };
const md = ['| Endpoint | ' + roleNames.map((r) => short[r]).join(' | ') + ' |', '|---|' + roleNames.map(() => '---').join('|') + '|'];
for (const [name, cells, expd] of matrix) md.push(`| ${name} | ` + roleNames.map((r) => (cells[r] === undefined ? '-' : `${cells[r]}${cells[r] === expd[r] ? '' : ` (kỳ vọng ${expd[r]})`}`)).join(' | ') + ' |');
say('\n' + md.join('\n'));

const outDir = path.join(__dirname, '..', '..', 'uat-report', 'logs');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'staging-rbac.log'), log.join('\n') + '\n');
process.exit(fail ? 1 : 0);
