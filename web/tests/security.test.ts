import { describe, it, expect } from 'vitest';

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

describe('Security & Fallback Tests', () => {
  it('BUG-001: Catch-all route trả về 404 cho endpoint không tồn tại (Không phải 200)', async () => {
    // Gọi một route không tồn tại (vd: /api/this-route-does-not-exist)
    const res = await fetch(`${API_BASE}/this-route-does-not-exist`);
    
    // Bản code cũ trả 200, bản mới phải trả 404.
    expect(res.status).toBe(404);
  });

  it('Kiểm tra fallback không trả dữ liệu nhạy cảm khi không có token', async () => {
    const res = await fetch(`${API_BASE}/this-route-does-not-exist`);
    const text = await res.text();
    // Đảm bảo không lộ thông tin biến môi trường hay dữ liệu user
    expect(text).not.toContain('env');
    expect(text).not.toContain('password');
  });
});
