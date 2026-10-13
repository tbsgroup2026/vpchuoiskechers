import { describe, it, expect } from 'vitest';

const API_BASE = process.env.API_URL || 'http://localhost:3001/api/hr';

describe('Integration Tests - HR API', () => {
  it('Tính lương qua API (Bậc 7)', async () => {
    const res = await fetch(`${API_BASE}/salary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseSalary: 150000000, dependents: 0 })
    });
    
    // Bản code cũ sẽ fail 404. Bản code mới pass 200.
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.tax).toBe(37275400);
  });

  it('Tính phép qua API (Nửa ngày)', async () => {
    const res = await fetch(`${API_BASE}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: '2026-06-01', endDate: '2026-06-01', remainingLeave: 12, leaveType: 'HALF' })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.remaining).toBe(11.5);
  });

  it('Tính công qua API (Ca đêm qua 0h)', async () => {
    const res = await fetch(`${API_BASE}/timesheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkIn: '2026-10-01T22:00:00Z', checkOut: '2026-10-02T06:00:00Z', isNightShift: true })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.date).toBe('2026-10-01');
    expect(data.data.hours).toBe(8);
  });
});
