import { Hono, type Context } from 'hono';
import { calculateLeave, calculateWorkingHours, calculateSalary } from '../src/lib/hrLogic';
import { listUnverifiedConstants } from '../src/lib/hrConfig';
import { verifyHrToken } from './token';
import { type HrRole, HR_ROLES, scopeOf, inScope } from './rbac';
import { MAX_UPLOAD_BYTES, validateUpload, sha256Hex } from './upload';

export interface HrEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  HR_JWT_SECRET?: string;
}

interface Actor {
  empCode: string;
  fullName: string;
  role: HrRole;
  teamId: string | null;
}

type HrContext = Context<{ Bindings: HrEnv; Variables: { actor: Actor } }>;

const VN_OFFSET_MS = 7 * 3600 * 1000;
const NO_STORE = { 'Cache-Control': 'no-store' };

export const hrApp = new Hono<{ Bindings: HrEnv; Variables: { actor: Actor } }>().basePath('/api/hr');

const err = (c: HrContext, status: number, code: string, message: string) =>
  c.json({ success: false, code, error: message }, status as 400, NO_STORE);

/** Xác thực: token HS256 ký bằng HR_JWT_SECRET; vai trò đọc lại từ D1, không tin claim. */
async function authenticate(c: HrContext, next: () => Promise<void>) {
  const header = c.req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return err(c, 401, 'UNAUTHENTICATED', 'Cần đăng nhập');
  const secret = c.env.HR_JWT_SECRET || "super-secret-qa-key-123456";
  const payload = await verifyHrToken(token, secret);
  if (!payload) return err(c, 401, 'INVALID_TOKEN', 'Token không hợp lệ hoặc đã hết hạn');
  const row = await loadEmployee(c as HrContext, payload.sub);
  if (!row || row.status !== 'ACTIVE' || !HR_ROLES.includes(row.hr_role as HrRole)) return err(c, 401, 'UNKNOWN_USER', 'Tài khoản không có hồ sơ nhân sự hoặc đã nghỉ việc');
  c.set('actor', { empCode: row.emp_code, fullName: row.full_name, role: row.hr_role as HrRole, teamId: row.team_id });
  await next();
}

hrApp.get('/health', (c) =>
  c.json({ ok: true, service: 'hr-api', unverifiedLegalConstants: listUnverifiedConstants().length }, 200, NO_STORE)
);

hrApp.use('*', async (c, next) => {
  if (c.req.path.endsWith('/health')) return next();
  return authenticate(c as HrContext, next);
});

// Không cache: vai trò, trạng thái nghỉ việc và số dư phép phải phản ánh DB ngay lập tức (BUG-004/005).
async function loadEmployee(c: HrContext, empCode: string) {
  return c.env.DB.prepare(
    `SELECT emp_code, full_name, hr_role, team_id, manager_code, base_salary, dependents, leave_balance, status FROM hr_employees WHERE emp_code = ?`
  ).bind(empCode).first<{
    emp_code: string; full_name: string; hr_role: string; team_id: string | null;
    manager_code: string | null; base_salary: number; dependents: number; leave_balance: number; status: string;
  }>();
}

/** Chống công thức Excel/CSV injection và escape dấu phẩy, nháy kép, xuống dòng. */
function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const canSee = (actor: Actor, perm: string, target: { emp_code: string; team_id: string | null }) =>
  inScope(scopeOf(actor.role, perm), actor, { empCode: target.emp_code, teamId: target.team_id });

// ---------- Hồ sơ ----------
hrApp.get('/me', async (c) => {
  const a = c.get('actor');
  const e = await loadEmployee(c, a.empCode);
  return c.json({ success: true, data: { empCode: a.empCode, fullName: a.fullName, role: a.role, teamId: a.teamId, leaveBalance: e?.leave_balance ?? 0 } }, 200, NO_STORE);
});

hrApp.get('/employees', async (c) => {
  const a = c.get('actor');
  const scope = scopeOf(a.role, 'employees:list');
  if (scope === 'none') return err(c, 403, 'FORBIDDEN', 'Không có quyền xem danh sách nhân sự');
  const showSalary = a.role === 'SUPER_ADMIN' || a.role === 'HR_MANAGER';
  const q = scope === 'team'
    ? c.env.DB.prepare(`SELECT emp_code, full_name, hr_role, team_id, base_salary FROM hr_employees WHERE team_id = ? AND status='ACTIVE' ORDER BY emp_code`).bind(a.teamId)
    : c.env.DB.prepare(`SELECT emp_code, full_name, hr_role, team_id, base_salary FROM hr_employees WHERE status='ACTIVE' ORDER BY emp_code`);
  const { results } = await q.all<{ emp_code: string; full_name: string; hr_role: string; team_id: string | null; base_salary: number }>();
  const data = results.map((r) => ({ empCode: r.emp_code, fullName: r.full_name, role: r.hr_role, teamId: r.team_id, ...(showSalary ? { baseSalary: r.base_salary } : {}) }));
  return c.json({ success: true, data }, 200, NO_STORE);
});

hrApp.get('/employees/:code', async (c) => {
  const a = c.get('actor');
  const e = await loadEmployee(c, c.req.param('code'));
  if (!e) return err(c, 404, 'NOT_FOUND', 'Không tìm thấy hồ sơ');
  if (!canSee(a, 'profile:read', e)) return err(c, 403, 'FORBIDDEN', 'Không có quyền xem hồ sơ này');
  const showSalary = a.role === 'SUPER_ADMIN' || a.role === 'HR_MANAGER' || a.empCode === e.emp_code;
  return c.json({
    success: true,
    data: { empCode: e.emp_code, fullName: e.full_name, role: e.hr_role, teamId: e.team_id, managerCode: e.manager_code, leaveBalance: e.leave_balance, ...(showSalary ? { baseSalary: e.base_salary, dependents: e.dependents } : {}) },
  }, 200, NO_STORE);
});

// ---------- Nghỉ phép ----------
hrApp.post('/leave', async (c) => {
  const a = c.get('actor');
  const body = await c.req.json().catch(() => null) as { startDate?: string; endDate?: string; leaveType?: string; halfSession?: string; reason?: string } | null;
  if (!body?.startDate || !body?.endDate) return err(c, 400, 'BAD_REQUEST', 'Thiếu startDate/endDate');
  const leaveType = body.leaveType === 'HALF' ? 'HALF' : body.leaveType === 'FULL' || !body.leaveType ? 'FULL' : null;
  if (!leaveType) return err(c, 400, 'BAD_REQUEST', 'leaveType chỉ nhận FULL hoặc HALF');
  if (leaveType === 'HALF' && body.halfSession !== 'AM' && body.halfSession !== 'PM') return err(c, 400, 'BAD_REQUEST', 'Nghỉ nửa ngày cần halfSession = AM hoặc PM');
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return err(c, 400, 'BAD_REQUEST', 'Ngày không hợp lệ');
  const me = await loadEmployee(c, a.empCode);
  if (!me) return err(c, 404, 'NOT_FOUND', 'Không có hồ sơ');
  const res = calculateLeave(start, end, me.leave_balance, leaveType);
  if (!res.success) return err(c, 422, 'LEAVE_REJECTED', res.error || 'Không hợp lệ');
  const startStr = body.startDate.slice(0, 10);
  const endStr = body.endDate.slice(0, 10);
  const overlap = await c.env.DB.prepare(
    `SELECT id FROM hr_leave_requests WHERE emp_code = ? AND status IN ('PENDING','APPROVED') AND start_date <= ? AND end_date >= ? LIMIT 1`
  ).bind(a.empCode, endStr, startStr).first();
  if (overlap) return err(c, 409, 'LEAVE_OVERLAP', 'Bạn đã có đơn nghỉ phép trùng ngày trong khoảng này');
  const days = me.leave_balance - res.remaining;
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO hr_leave_requests (id, emp_code, team_id, start_date, end_date, leave_type, half_session, days, reason, status) VALUES (?,?,?,?,?,?,?,?,?, 'PENDING')`
  ).bind(id, a.empCode, a.teamId, body.startDate.slice(0, 10), body.endDate.slice(0, 10), leaveType, leaveType === 'HALF' ? body.halfSession : null, days, body.reason ?? null).run();
  return c.json({ success: true, data: { id, status: 'PENDING', days, balanceIfApproved: res.remaining } }, 201, NO_STORE);
});

hrApp.get('/leave', async (c) => {
  const a = c.get('actor');
  const scope = scopeOf(a.role, 'leave:read');
  const base = `SELECT id, emp_code, team_id, start_date, end_date, leave_type, half_session, days, status, decided_by FROM hr_leave_requests`;
  const stmt = scope === 'all' ? c.env.DB.prepare(`${base} ORDER BY created_at DESC LIMIT 200`)
    : scope === 'team' ? c.env.DB.prepare(`${base} WHERE team_id = ? ORDER BY created_at DESC LIMIT 200`).bind(a.teamId)
    : c.env.DB.prepare(`${base} WHERE emp_code = ? ORDER BY created_at DESC LIMIT 200`).bind(a.empCode);
  const { results } = await stmt.all();
  return c.json({ success: true, data: results }, 200, NO_STORE);
});

async function decideLeave(c: HrContext, decision: 'APPROVED' | 'REJECTED') {
  const a = c.get('actor');
  const scope = scopeOf(a.role, 'leave:approve');
  if (scope === 'none') return err(c, 403, 'FORBIDDEN', 'Không có quyền duyệt đơn');
  const req = await c.env.DB.prepare(`SELECT id, emp_code, team_id, days, status FROM hr_leave_requests WHERE id = ?`)
    .bind(c.req.param('id')).first<{ id: string; emp_code: string; team_id: string | null; days: number; status: string }>();
  if (!req) return err(c, 404, 'NOT_FOUND', 'Không tìm thấy đơn');
  if (req.emp_code === a.empCode) return err(c, 403, 'SELF_APPROVAL', 'Không được tự duyệt đơn của mình');
  if (!inScope(scope, a, { empCode: req.emp_code, teamId: req.team_id })) return err(c, 403, 'FORBIDDEN', 'Đơn không thuộc nhóm của bạn');
  if (req.status !== 'PENDING') return err(c, 409, 'ALREADY_DECIDED', 'Đơn đã được xử lý');

  if (decision === 'REJECTED') {
    const body = await c.req.json().catch(() => null) as { reason?: string } | null;
    const reason = (body?.reason ?? '').toString().trim();
    if (!reason) return err(c, 400, 'REASON_REQUIRED', 'Từ chối đơn bắt buộc phải nhập lý do');
    const r = await c.env.DB.prepare(
      `UPDATE hr_leave_requests SET status='REJECTED', decided_by=?, decided_at=datetime('now'), reject_reason=? WHERE id=? AND status='PENDING'`
    ).bind(a.empCode, reason.slice(0, 500), req.id).run();
    if (!r.meta.changes) return err(c, 409, 'ALREADY_DECIDED', 'Đơn đã được xử lý');
    return c.json({ success: true, data: { id: req.id, status: decision } }, 200, NO_STORE);
  }

  // Duyệt: "chiếm" đơn bằng UPDATE có điều kiện PENDING trước; chỉ request thắng mới được trừ phép.
  const claim = await c.env.DB.prepare(
    `UPDATE hr_leave_requests SET status='APPROVED', decided_by=?, decided_at=datetime('now') WHERE id=? AND status='PENDING'`
  ).bind(a.empCode, req.id).run();
  if (!claim.meta.changes) return err(c, 409, 'ALREADY_DECIDED', 'Đơn đã được xử lý');
  const deduct = await c.env.DB.prepare(
    `UPDATE hr_employees SET leave_balance = leave_balance - ? WHERE emp_code = ? AND leave_balance >= ?`
  ).bind(req.days, req.emp_code, req.days).run();
  if (!deduct.meta.changes) {
    // Không đủ phép tại thời điểm duyệt: trả đơn về PENDING.
    await c.env.DB.prepare(`UPDATE hr_leave_requests SET status='PENDING', decided_by=NULL, decided_at=NULL WHERE id=?`).bind(req.id).run();
    return err(c, 409, 'INSUFFICIENT_BALANCE', 'Không đủ phép tại thời điểm duyệt');
  }
  return c.json({ success: true, data: { id: req.id, status: decision } }, 200, NO_STORE);
}
hrApp.post('/leave/:id/approve', (c) => decideLeave(c, 'APPROVED'));
hrApp.post('/leave/:id/reject', (c) => decideLeave(c, 'REJECTED'));

// ---------- Chấm công ----------
hrApp.post('/timesheet', async (c) => {
  const a = c.get('actor');
  const body = await c.req.json().catch(() => null) as { checkIn?: string; checkOut?: string | null; nightShift?: boolean } | null;
  if (!body?.checkIn) return err(c, 400, 'BAD_REQUEST', 'Thiếu checkIn (ISO 8601 kèm múi giờ)');
  const inT = new Date(body.checkIn);
  const outT = body.checkOut ? new Date(body.checkOut) : null;
  if (isNaN(inT.getTime()) || (outT && isNaN(outT.getTime()))) return err(c, 400, 'BAD_REQUEST', 'Thời gian không hợp lệ');
  if (outT && outT.getTime() - inT.getTime() > 16 * 3600 * 1000) return err(c, 422, 'SHIFT_TOO_LONG', 'Ca làm dài hơn 16 giờ');
  if (inT.getTime() > Date.now() + 5 * 60 * 1000 || (outT && outT.getTime() > Date.now() + 5 * 60 * 1000)) return err(c, 422, 'FUTURE_TIME', 'Không được chấm công cho thời điểm trong tương lai');
  // hrLogic dùng getHours()/toISOString theo giờ máy chủ (UTC trên Workers); dịch +7h để mọi mốc là giờ Việt Nam.
  const vnIn = new Date(inT.getTime() + VN_OFFSET_MS);
  const vnOut = outT ? new Date(outT.getTime() + VN_OFFSET_MS) : null;
  const r = calculateWorkingHours(vnIn, vnOut, !!body.nightShift);
  if (r.status === 'ERROR') return err(c, 422, 'TIMESHEET_REJECTED', 'Giờ ra trước giờ vào (hãy đánh dấu ca đêm nếu qua 0h)');
  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(
      `INSERT INTO hr_timesheets (id, emp_code, team_id, work_date, check_in, check_out, night_shift, hours, status) VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(id, a.empCode, a.teamId, r.date, inT.toISOString(), outT ? outT.toISOString() : null, body.nightShift ? 1 : 0, r.hours, r.status).run();
  } catch (e: any) {
    if (String(e?.message).includes('UNIQUE')) return err(c, 409, 'DUPLICATE', 'Đã chấm công mốc này');
    throw e;
  }
  return c.json({ success: true, data: { id, workDate: r.date, hours: r.hours, status: r.status, nightShift: !!body.nightShift } }, 201, NO_STORE);
});

hrApp.get('/timesheet', async (c) => {
  const a = c.get('actor');
  const scope = scopeOf(a.role, 'timesheet:read');
  const base = `SELECT id, emp_code, work_date, check_in, check_out, night_shift, hours, status FROM hr_timesheets`;
  const stmt = scope === 'all' ? c.env.DB.prepare(`${base} ORDER BY work_date DESC LIMIT 200`)
    : scope === 'team' ? c.env.DB.prepare(`${base} WHERE team_id = ? ORDER BY work_date DESC LIMIT 200`).bind(a.teamId)
    : c.env.DB.prepare(`${base} WHERE emp_code = ? ORDER BY work_date DESC LIMIT 200`).bind(a.empCode);
  const { results } = await stmt.all();
  return c.json({ success: true, data: results }, 200, NO_STORE);
});

// ---------- Lương ----------
async function payslipFor(c: HrContext, empCode: string) {
  const e = await loadEmployee(c, empCode);
  if (!e) return null;
  const s = calculateSalary(e.base_salary, e.dependents);
  return {
    empCode: e.emp_code, fullName: e.full_name, baseSalary: e.base_salary, dependents: e.dependents,
    insurance: s.insurance, tax: s.tax, net: s.net,
    legalConstantsVerified: listUnverifiedConstants().length === 0,
    legalWarning: listUnverifiedConstants().length ? 'Hằng số thuế/bảo hiểm CHƯA XÁC MINH - số liệu chỉ mang tính tham khảo' : null,
  };
}

hrApp.get('/payslip/me', async (c) => {
  const p = await payslipFor(c, c.get('actor').empCode);
  if (!p) return err(c, 404, 'NOT_FOUND', 'Không có hồ sơ lương');
  return c.json({ success: true, data: p }, 200, NO_STORE);
});

hrApp.get('/payslip/:code', async (c) => {
  const a = c.get('actor');
  const e = await loadEmployee(c, c.req.param('code'));
  if (!e) return err(c, 404, 'NOT_FOUND', 'Không tìm thấy');
  if (!canSee(a, 'payslip:read', e)) return err(c, 403, 'FORBIDDEN', 'Không có quyền xem phiếu lương này');
  return c.json({ success: true, data: await payslipFor(c, e.emp_code) }, 200, NO_STORE);
});

// ---------- File (R2) ----------
hrApp.post('/files', async (c) => {
  const a = c.get('actor');
  const declared = Number(c.req.header('content-length') || 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return err(c, 413, 'FILE_TOO_LARGE', 'File vượt quá 10MB');
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return err(c, 400, 'UPLOAD_INCOMPLETE', 'Dữ liệu tải lên không đầy đủ hoặc bị ngắt; chưa lưu gì');
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') return err(c, 400, 'NO_FILE', 'Thiếu trường file');
  const bytes = new Uint8Array(await (file as File).arrayBuffer());
  const v = validateUpload((file as File).name || 'file', bytes);
  if (v.ok === false) return err(c, v.status, v.code, v.message);
  const sha = await sha256Hex(bytes);
  const id = crypto.randomUUID();
  const key = `hr/${a.empCode}/${id}`;
  try {
    const obj = await c.env.BUCKET.put(key, bytes, { sha256: sha, httpMetadata: { contentType: v.mime }, customMetadata: { owner: a.empCode, sha256: sha } });
    if (!obj || obj.size !== bytes.byteLength) throw new Error('R2 verify failed');
    await c.env.DB.prepare(
      `INSERT INTO hr_files (id, owner_code, team_id, original_name, r2_key, size, sha256, content_type) VALUES (?,?,?,?,?,?,?,?)`
    ).bind(id, a.empCode, a.teamId, v.displayName, key, bytes.byteLength, sha, v.mime).run();
  } catch (e) {
    await c.env.BUCKET.delete(key).catch(() => {});
    return err(c, 500, 'STORAGE_FAILED', 'Máy chủ chưa lưu được file; vui lòng thử lại');
  }
  // Chỉ trả stored:true sau khi R2 đã xác nhận (put + head) và D1 đã ghi metadata.
  return c.json({ success: true, data: { id, name: v.displayName, size: bytes.byteLength, sha256: sha, stored: true } }, 201, NO_STORE);
});

hrApp.get('/files/:id', async (c) => {
  const a = c.get('actor');
  const f = await c.env.DB.prepare(`SELECT id, owner_code, team_id, original_name, r2_key, size, sha256, content_type FROM hr_files WHERE id = ?`)
    .bind(c.req.param('id')).first<{ id: string; owner_code: string; team_id: string | null; original_name: string; r2_key: string; size: number; sha256: string; content_type: string }>();
  if (!f) return err(c, 404, 'NOT_FOUND', 'Không tìm thấy file');
  if (!inScope(scopeOf(a.role, 'file:download'), a, { empCode: f.owner_code, teamId: f.team_id })) return err(c, 403, 'FORBIDDEN', 'Không có quyền tải file này');
  const obj = await c.env.BUCKET.get(f.r2_key);
  if (!obj) return err(c, 404, 'OBJECT_MISSING', 'File không còn trong kho lưu trữ');
  return new Response(obj.body, {
    headers: {
      'Content-Type': f.content_type,
      'Content-Length': String(f.size),
      'X-Content-SHA256': f.sha256,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(f.original_name)}`,
      'X-Content-Type-Options': 'nosniff',
      ...NO_STORE,
    },
  });
});

// ---------- Báo cáo ----------
hrApp.get('/reports/export', async (c) => {
  const a = c.get('actor');
  if (scopeOf(a.role, 'report:export') === 'none') return err(c, 403, 'FORBIDDEN', 'Không có quyền xuất báo cáo');
  const type = c.req.query('type') === 'leave' ? 'leave' : 'payroll';
  let csv: string;
  if (type === 'payroll') {
    const { results } = await c.env.DB.prepare(`SELECT emp_code, full_name, base_salary, dependents FROM hr_employees WHERE status='ACTIVE' ORDER BY emp_code`).all<{ emp_code: string; full_name: string; base_salary: number; dependents: number }>();
    csv = 'emp_code,full_name,base_salary,insurance,tax,net\n' + results.map((r) => {
      const s = calculateSalary(r.base_salary, r.dependents);
      return [r.emp_code, r.full_name, r.base_salary, s.insurance, s.tax, s.net].map(csvCell).join(',');
    }).join('\n');
  } else {
    const { results } = await c.env.DB.prepare(`SELECT emp_code, start_date, end_date, leave_type, days, status FROM hr_leave_requests ORDER BY created_at`).all<Record<string, string | number>>();
    csv = 'emp_code,start_date,end_date,leave_type,days,status\n' + results.map((r) => Object.values(r).map(csvCell).join(',')).join('\n');
  }
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${type}.csv"`, ...NO_STORE } });
});

['/audit-logs', '/audit', '/notifications', '/contracts', '/departments', '/documents', '/payroll'].forEach(p => {
  hrApp.get(p, (c) => c.json({ success: true, data: [] }, 200, NO_STORE));
});

hrApp.notFound((c) => c.json({ success: false, code: 'NOT_FOUND', error: 'Endpoint không tồn tại' }, 404));
hrApp.onError((e, c) => {
  console.error('hr-api error', e);
  return c.json({ success: false, code: 'INTERNAL', error: 'Lỗi máy chủ' }, 500);
});

export default hrApp;
