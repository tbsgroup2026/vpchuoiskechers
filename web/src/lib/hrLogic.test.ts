import { describe, it, expect } from 'vitest';
import { calculateLeave, calculateWorkingHours, calculateSalary, validators } from './hrLogic';

describe('HR Logic - Tính phép', () => {
  it('Nghỉ nửa ngày sáng/chiều hợp lệ', () => {
    const res = calculateLeave(new Date('2026-06-01'), new Date('2026-06-01'), 12, 'HALF');
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(11.5);
  });

  it('Nghỉ 0.25 ngày (Phải bị từ chối)', () => {
    const res = calculateLeave(new Date('2026-06-01'), new Date('2026-06-01'), 12, 'QUARTER');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Phải là bội số của 0.5');
  });

  it('Nghỉ nửa ngày nhưng truyền 2 ngày khác nhau sẽ bị từ chối', () => {
    const res = calculateLeave(new Date('2026-06-01'), new Date('2026-06-02'), 12, 'HALF');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Nghỉ < 1 ngày chỉ áp dụng trong cùng 1 ngày');
  });
  
  it('Từ chối nếu số dư phép bị âm hoặc không đủ', () => {
    expect(calculateLeave(new Date('2026-06-01'), new Date('2026-06-02'), -1).success).toBe(false);
    expect(calculateLeave(new Date('2026-06-01'), new Date('2026-06-02'), 1).success).toBe(false); // Cần 2 ngày nhưng chỉ có 1
  });

  it('Từ chối nếu ngày bắt đầu > ngày kết thúc', () => {
    expect(calculateLeave(new Date('2026-06-02'), new Date('2026-06-01'), 10).success).toBe(false);
  });

  it('Nghỉ liên tiếp qua cuối tuần (Thứ 6 đến Thứ 2) chỉ trừ 2 ngày phép', () => {
    const res = calculateLeave(new Date('2026-06-05'), new Date('2026-06-08'), 12); // T6, T7, CN, T2
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(10); // trừ T6 và T2
  });

  it('Nghỉ qua ngày lễ (VD: 30/04 - 01/05) không bị trừ phép', () => {
    const res = calculateLeave(new Date('2026-04-29'), new Date('2026-05-02'), 12); // T4 (29), T5 (30/4), T6 (1/5), T7 (2/5)
    // 30/4 và 1/5 là HOLIDAY, 2/5 là thứ 7. Nên chỉ tính 29/04 (1 ngày).
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(11);
  });

  it('Lỗi nếu toàn bộ thời gian xin nghỉ rơi vào cuối tuần/lễ', () => {
    const res = calculateLeave(new Date('2026-04-30'), new Date('2026-05-01'), 12);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Không có ngày làm việc nào trong khoảng thời gian nghỉ");
  });

  it('Nghỉ vắt qua 31/12 và năm nhuận (2024)', () => {
    const res = calculateLeave(new Date('2024-12-31'), new Date('2025-01-02'), 12);
    expect(res.success).toBe(true);
  });
});

describe('HR Logic - Tính công', () => {
  it('Đi làm bình thường đúng giờ', () => {
    const res = calculateWorkingHours(new Date('2026-10-01T08:00:00'), new Date('2026-10-01T17:00:00'));
    expect(res.hours).toBe(9);
    expect(res.status).toBe('OK');
  });

  it('Đi muộn quá ngưỡng 1 phút (08:01)', () => {
    const res = calculateWorkingHours(new Date('2026-10-01T08:01:00'), new Date('2026-10-01T17:00:00'));
    expect(res.status).toBe('DI_MUON');
  });

  it('Về sớm', () => {
    const res = calculateWorkingHours(new Date('2026-10-01T08:00:00'), new Date('2026-10-01T15:00:00'));
    expect(res.status).toBe('VE_SOM');
  });

  it('Quên chấm ra', () => {
    const res = calculateWorkingHours(new Date('2026-10-01T08:00:00'), null);
    expect(res.status).toBe('QUEN_CHAM_RA');
    expect(res.hours).toBe(0);
  });

  it('Ca đêm qua 0h thuộc về ngày bắt đầu ca', () => {
    const checkIn = new Date('2026-10-01T22:00:00');
    const checkOut = new Date('2026-10-02T06:00:00');
    // Cố tình truyền sai checkout (VD chấm 06:00 nhưng Date object parser bị trùng ngày checkin)
    const badCheckOut = new Date('2026-10-01T06:00:00'); // -16 hours diff
    
    const res = calculateWorkingHours(checkIn, badCheckOut, true); 
    expect(res.hours).toBe(8); // Tự động +24h
    expect(res.date).toBe('2026-10-01'); // Thuộc về ngày bắt đầu
  });

  it('Ca thường mà ra trước vào thì báo lỗi', () => {
    const res = calculateWorkingHours(new Date('2026-10-01T17:00:00'), new Date('2026-10-01T08:00:00'));
    expect(res.status).toBe('ERROR');
  });
});

describe('HR Logic - Tính lương & Thuế TNCN lũy tiến', () => {
  it('Lương <= 0', () => {
    expect(calculateSalary(0).net).toBe(0);
    expect(calculateSalary(-500000).net).toBe(0);
  });

  it('Lương 10 triệu (Dưới mức chịu thuế, 0 phụ thuộc)', () => {
    const res = calculateSalary(10000000);
    expect(res.insurance).toBe(1050000); // 10.5%
    expect(res.tax).toBe(0); 
    expect(res.net).toBe(8950000);
  });

  it('Trần bảo hiểm', () => {
    // BHXH/BHYT base max 46.8M, BHTN base max 99.2M
    const res = calculateSalary(100000000);
    const expectedInsurance = (46800000 * 0.095) + (99200000 * 0.01);
    expect(res.insurance).toBe(Math.round(expectedInsurance)); // 5438000
  });

  it('Thuế TNCN Bậc 1', () => {
    // Lương 18tr, BH = 1.89tr, Giảm trừ 11tr => Chịu thuế = 5.11tr -> bậc 2
    // Lương 17.5tr, BH = 1.837.500, Giảm trừ 11tr => Chịu thuế = 4.662.500 -> bậc 1
    const res = calculateSalary(17500000);
    expect(res.tax).toBe(Math.round(4662500 * 0.05));
  });

  it('Thuế TNCN Bậc 2', () => {
    // Lương 23tr, BH = 23tr * 0.105 = 2.415.000, Giảm trừ 11tr => Chịu thuế = 9.585.000 (thuộc bậc 2)
    const res = calculateSalary(23000000);
    const taxable = 23000000 - 2415000 - 11000000;
    const expectedTax = 250000 + (taxable - 5000000) * 0.10;
    expect(res.tax).toBe(Math.round(expectedTax));
  });

  it('Thuế TNCN Bậc 7 (Lương Rất Cao)', () => {
    const res = calculateSalary(150000000); 
    // BH: 5.438.000, Cá nhân: 11tr => Tính thuế = 133.562.000
    // Thuế bậc 7 = 18.150.000 + 35% * (133.562.000 - 80.000.000) = 36.896.700
    expect(res.tax).toBe(36896700);
  });

  describe('Biên Thuế (Thresholds)', () => {
    // Để test đúng biên thuế, ta giả lập số tiền sao cho taxableIncome = chính xác mức biên.
    // Base = taxableIncome + insurance + 11000000.
    // Lương thấp dưới trần BHXH (46.8M) => insurance = base * 0.105
    // Vậy: base - (base * 0.105) - 11000000 = taxable
    // => base * 0.895 = taxable + 11000000
    // => base = (taxable + 11000000) / 0.895

    it('Đúng ngưỡng 5 triệu (Bậc 1)', () => {
      // taxable = 5,000,000 => base = 16M / 0.895 = 17,877,094.97
      const base = 17877095;
      const res = calculateSalary(base);
      // Chịu thuế ~ 5,000,000 => Thuế = 250,000
      expect(res.tax).toBe(250000);
    });

    it('Qua ngưỡng 5 triệu + 1 VNĐ (Sang Bậc 2)', () => {
      const base = 17877095 + 1000; // Tăng base thêm xíu để taxable > 5tr
      const res = calculateSalary(base);
      expect(res.tax).toBeGreaterThan(250000);
    });

    it('Đúng ngưỡng 10 triệu (Bậc 2)', () => {
      // taxable = 10,000,000 => base = 21M / 0.895 = 23,463,687.15
      const base = 23463687;
      const res = calculateSalary(base);
      expect(res.tax).toBe(750000);
    });

    it('Qua ngưỡng 10 triệu + 1 VNĐ (Sang Bậc 3)', () => {
      const base = 23463687 + 1000;
      const res = calculateSalary(base);
      expect(res.tax).toBeGreaterThan(750000);
    });
  });

  it('Có người phụ thuộc (2 người)', () => {
    const res = calculateSalary(20000000, 2);
    // BH: 2.1tr
    // Giảm trừ: 11tr + 8.8tr = 19.8tr
    // Tổng giảm trừ + BH = 21.9tr > 20tr => Không nộp thuế
    expect(res.tax).toBe(0);
  });
  
  it('Bậc thuế 3', () => {
    const res = calculateSalary(25000000);
    expect(res.tax).toBeGreaterThan(750000); 
  });
  it('Bậc thuế 4', () => {
    const res = calculateSalary(35000000);
    expect(res.tax).toBeGreaterThan(1950000); 
  });
  it('Bậc thuế 5', () => {
    const res = calculateSalary(55000000);
    expect(res.tax).toBeGreaterThan(4750000); 
  });
  it('Bậc thuế 6', () => {
    const res = calculateSalary(75000000);
    expect(res.tax).toBeGreaterThan(9750000); 
  });
});

describe('HR Logic - Validate Data', () => {
  it('Validate CCCD', () => {
    expect(validators.isValidCCCD('079090123456')).toBe(true);
    expect(validators.isValidCCCD('07909012')).toBe(false); // thiếu số 8 số
    expect(validators.isValidCCCD('0790901234567')).toBe(false); // thừa số 13 số
    expect(validators.isValidCCCD('A79090123456')).toBe(false); // có chữ
  });
  
  it('Validate SĐT', () => {
    expect(validators.isValidPhone('0901234567')).toBe(true);
    expect(validators.isValidPhone('0123456789')).toBe(false); 
    expect(validators.isValidPhone('1901234567')).toBe(false); 
  });

  it('Validate Email', () => {
    expect(validators.isValidEmail('test@tbs.vn')).toBe(true);
    expect(validators.isValidEmail('test.com')).toBe(false); 
  });

  it('Validate MST', () => {
    expect(validators.isValidMST('0123456789')).toBe(true);
    expect(validators.isValidMST('0123456789-001')).toBe(true);
    expect(validators.isValidMST('01234')).toBe(false); 
  });
});
