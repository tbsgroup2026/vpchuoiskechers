// Seed dữ liệu STAGING (không dùng cho production). Mật khẩu ngẫu nhiên, ghi ra web/.staging-credentials.json (gitignored).
// Dùng: node scripts/seed-staging.js  → tạo scripts/.seed-staging.sql, sau đó chạy wrangler d1 execute.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const rnd = () => crypto.randomBytes(9).toString('base64url');
const esc = (s) => String(s).replace(/'/g, "''");

const people = [
  // [empCode, name, hrRole, team, manager, salary, dependents, leave, sysRole]
  ['SA001', 'Quản trị hệ thống', 'SUPER_ADMIN', 'HQ', null, 45000000, 0, 12, 'SUPER_ADMIN'],
  ['HRM001', 'Nguyễn Thị Nhân Sự Trưởng', 'HR_MANAGER', 'HR', null, 30000000, 1, 12, 'HR_MANAGER'],
  ['HRS001', 'Trần Văn Nhân Sự', 'HR_STAFF', 'HR', 'HRM001', 18000000, 0, 12, 'HR_STAFF'],
  ['PAY001', 'Lê Thị Tiền Lương', 'PAYROLL', 'ACC', null, 22000000, 2, 12, 'PAYROLL'],
  ['MGRA01', 'Phạm Quản Lý Nhóm A', 'MANAGER', 'TEAM_A', null, 35000000, 2, 12, 'TRUONG_PHONG'],
  ['MGRB01', 'Hoàng Quản Lý Nhóm B', 'MANAGER', 'TEAM_B', null, 34000000, 1, 12, 'TRUONG_PHONG'],
  ['EMPA01', 'Đỗ Nhân Viên A1', 'EMPLOYEE', 'TEAM_A', 'MGRA01', 15000000, 0, 12, 'CBCNV'],
  ['EMPA02', 'Vũ Nhân Viên A2', 'EMPLOYEE', 'TEAM_A', 'MGRA01', 17500000, 1, 12, 'CBCNV'],
  ['EMPB01', 'Bùi Nhân Viên B1', 'EMPLOYEE', 'TEAM_B', 'MGRB01', 16000000, 0, 12, 'CBCNV'],
  ['EMPB02', 'Đặng Nhân Viên B2', 'EMPLOYEE', 'TEAM_B', 'MGRB01', 19000000, 2, 12, 'CBCNV'],
];

const creds = {};
const sql = [];
for (const [code, name, role, team, mgr, salary, deps, leave, sysRole] of people) {
  const pw = rnd();
  creds[code] = { password: pw, role };
  sql.push(`INSERT OR REPLACE INTO sys_users (id, emp_code, name, email, role_code, status, password_hash) VALUES ('u_${code}','${code}','${esc(name)}','${code.toLowerCase()}@staging.local','${sysRole}','ACTIVE','${sha256(pw)}');`);
  sql.push(`INSERT OR REPLACE INTO hr_employees (emp_code, full_name, hr_role, team_id, manager_code, base_salary, dependents, leave_balance, status) VALUES ('${code}','${esc(name)}','${role}','${team}',${mgr ? `'${mgr}'` : 'NULL'},${salary},${deps},${leave},'ACTIVE');`);
}

// 100 tài khoản cho load test (cùng 1 mật khẩu ngẫu nhiên, nhóm LOAD), lương/phép đủ lớn để không hết phép.
const ltPw = rnd();
creds._loadtest = { prefix: 'LT', count: 100, password: ltPw };
for (let i = 1; i <= 100; i++) {
  const code = 'LT' + String(i).padStart(3, '0');
  sql.push(`INSERT OR REPLACE INTO sys_users (id, emp_code, name, email, role_code, status, password_hash) VALUES ('u_${code}','${code}','Load Test ${i}','${code.toLowerCase()}@staging.local','CBCNV','ACTIVE','${sha256(ltPw)}');`);
  sql.push(`INSERT OR REPLACE INTO hr_employees (emp_code, full_name, hr_role, team_id, manager_code, base_salary, dependents, leave_balance, status) VALUES ('${code}','Load Test ${i}','EMPLOYEE','LOAD','MGRA01',${12000000 + i * 100000},${i % 3},100000,'ACTIVE');`);
}

fs.writeFileSync(path.join(__dirname, '.seed-staging.sql'), sql.join('\n') + '\n');
fs.writeFileSync(path.join(__dirname, '..', '.staging-credentials.json'), JSON.stringify(creds, null, 2));
console.log(`Seed: ${people.length} tài khoản vai trò + 100 tài khoản load test. Mật khẩu ở web/.staging-credentials.json`);
