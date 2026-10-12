import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as createTask, DELETE as deleteTask } from '../tasks/route';
import { GET as judgingReports } from '../ci-kaizen/judging/reports/route';
import { POST as approve } from '../ci-kaizen/approve/route';
import { signToken } from '@/lib/auth';

const anon = (method: string, url: string, body?: unknown) =>
  new Request(`http://localhost${url}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

const authenticated = (token: string, method: string, url: string, body?: unknown) =>
  new Request(`http://localhost${url}`, {
    method,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

describe('Không token => 401 (không còn fallback SUPER_ADMIN)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.ALLOW_DEV_AUTH;
    process.env.NODE_ENV = 'production';
    delete process.env.ENVIRONMENT;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('POST /api/tasks trả về 401 khi không có token', async () => {
    const res = await createTask(anon('POST', '/api/tasks', { title: 'Test Task' }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('DELETE /api/tasks trả về 401 khi không có token', async () => {
    const res = await deleteTask(anon('DELETE', '/api/tasks?taskId=tsk_test&version=1'));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('GET /api/ci-kaizen/judging/reports trả về 401 khi không có token', async () => {
    const res = await judgingReports(anon('GET', '/api/ci-kaizen/judging/reports'));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('POST /api/ci-kaizen/approve trả về 401 kể cả khi giả mạo x-user-emp-code', async () => {
    const req = new Request('http://localhost/api/ci-kaizen/approve', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-emp-code': '202608001',
      },
      body: JSON.stringify({ proposalId: 'PROP-01', decision: 'APPROVE' }),
    });
    const res = await approve(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('Test ngược: ALLOW_DEV_AUTH=true nhưng ENVIRONMENT=staging vẫn phải trả về 401', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEV_AUTH = 'true';
    process.env.ENVIRONMENT = 'staging';

    const res = await createTask(anon('POST', '/api/tasks', { title: 'Test Task In Staging' }));
    expect(res.status).toBe(401);
  });

  it('Test ngược: ALLOW_DEV_AUTH=true nhưng ENVIRONMENT=production vẫn phải trả về 401', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEV_AUTH = 'true';
    process.env.ENVIRONMENT = 'production';

    const res = await createTask(anon('POST', '/api/tasks', { title: 'Test Task In Prod' }));
    expect(res.status).toBe(401);
  });
});

describe('Phân quyền cấp bậc (roleLevel) với tài khoản nhân viên (EMPA01, roleLevel: 4)', () => {
  let staffToken: string;

  beforeEach(async () => {
    delete process.env.ALLOW_DEV_AUTH;
    process.env.NODE_ENV = 'production';
    delete process.env.ENVIRONMENT;

    staffToken = await signToken({
      userId: 9001,
      empCode: 'EMPA01',
      name: 'Nhân viên kiểm thử',
      roleId: 4,
      roleCode: 'STAFF',
      roleLevel: 4,
      departmentId: 1,
      departmentCode: 'IT_DIGITAL',
    });
  });

  it('GET /api/ci-kaizen/judging/reports trả về 403 với roleLevel 4 (cần maxRoleLevel 3)', async () => {
    const res = await judgingReports(authenticated(staffToken, 'GET', '/api/ci-kaizen/judging/reports'));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Không đủ quyền');
  });

  it('POST /api/ci-kaizen/approve trả về 403 với roleLevel 4 (cần maxRoleLevel 3)', async () => {
    const res = await approve(
      authenticated(staffToken, 'POST', '/api/ci-kaizen/approve', {
        proposalId: 'PROP-01',
        decision: 'APPROVE',
      }),
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
