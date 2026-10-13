import { describe, it, expect } from 'vitest';
import { sanitizeNotes } from '../src/lib/bookingMapper';

describe('sanitizeNotes', () => {
  it('should handle undefined, null, and empty string', () => {
    expect(sanitizeNotes()).toBe('');
    expect(sanitizeNotes(null as any)).toBe('');
    expect(sanitizeNotes('')).toBe('');
  });

  it('should return notes without tags unchanged', () => {
    expect(sanitizeNotes('Hỗ trợ nước uống')).toBe('Hỗ trợ nước uống');
    expect(sanitizeNotes('Cần máy chiếu và 5 chai nước')).toBe('Cần máy chiếu và 5 chai nước');
  });

  it('should remove standard approved tag', () => {
    expect(sanitizeNotes('Hỗ trợ nước uống [APPROVED_BY_RECEPTIONIST_AT_14:35]')).toBe('Hỗ trợ nước uống');
    expect(sanitizeNotes('[APPROVED_BY_RECEPTIONIST_AT_09:00]')).toBe('');
    expect(sanitizeNotes('[APPROVED_BY_RECEPTIONIST]')).toBe('');
  });

  it('should remove tags with seconds', () => {
    expect(sanitizeNotes('Hỗ trợ nước uống [APPROVED_BY_RECEPTIONIST_AT_14:35:50]')).toBe('Hỗ trợ nước uống');
    expect(sanitizeNotes('[CANCELLED_BY_RECEPTIONIST_AT_14:35:50] Cần đổi lịch')).toBe('Cần đổi lịch');
  });

  it('should remove cancelled/rejected tags', () => {
    expect(sanitizeNotes('Lý do cá nhân [CANCELLED_BY_RECEPTIONIST_AT_08:15]')).toBe('Lý do cá nhân');
    expect(sanitizeNotes('[REJECTED_BY_ADMIN] Phòng đang bảo trì')).toBe('Phòng đang bảo trì');
  });

  it('should handle tags in the middle of text', () => {
    expect(sanitizeNotes('Cần [APPROVED_BY_RECEPTIONIST_AT_10:00] máy chiếu')).toBe('Cần máy chiếu');
  });

  it('should remove multiple tags', () => {
    expect(sanitizeNotes('Chuẩn bị nước [APPROVED_BY_RECEPTIONIST_AT_14:35] [CANCELLED_BY_ADMIN_AT_15:00]')).toBe('Chuẩn bị nước');
  });
});
