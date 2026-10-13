import { describe, it, expect } from 'vitest';
import { generateTestToken } from '../src/lib/auth';

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

describe('RBAC / IDOR Security Tests with Real Auth Simulation', () => {
  it('1. Không có token -> 401 Unauthorized', async () => {
    const res = await fetch(`${API_BASE}/hr/me/salary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseSalary: 10000000 })
    });
    expect(res.status).toBe(401); 
  });

  it('2. EMPLOYEE gọi API tính lương cá nhân (/me/salary) -> 200', async () => {
    const token = generateTestToken('EMP123', 'EMPLOYEE');
    const res = await fetch(`${API_BASE}/hr/me/salary`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ baseSalary: 10000000 })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userId).toBe('EMP123');
  });

  it('3. IDOR: EMPLOYEE cố tình xem lương người khác qua Body -> 403', async () => {
    const token = generateTestToken('EMP123', 'EMPLOYEE');
    const res = await fetch(`${API_BASE}/hr/me/salary`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ baseSalary: 10000000, targetUserId: 'BOSS999' })
    });
    expect(res.status).toBe(403);
  });

  it('4. EMPLOYEE gọi API Admin (/admin/salary) -> 403 Forbidden', async () => {
    const token = generateTestToken('EMP123', 'EMPLOYEE');
    const res = await fetch(`${API_BASE}/hr/admin/salary`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ baseSalary: 10000000 })
    });
    expect(res.status).toBe(403);
  });

  it('5. SUPER_ADMIN gọi API Admin (/admin/salary) -> 200', async () => {
    const token = generateTestToken('SA123', 'SUPER_ADMIN');
    const res = await fetch(`${API_BASE}/hr/admin/salary`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ baseSalary: 10000000, targetUserId: 'EMP123' })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.targetUserId).toBe('EMP123');
  });
});
