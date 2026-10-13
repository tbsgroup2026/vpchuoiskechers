import { HR_CONFIG } from './hrConfig';

const HOLIDAYS = ['2026-01-01', '2026-04-30', '2026-05-01', '2026-09-02']; // Giả lập các ngày lễ

export function calculateLeave(startDate: Date, endDate: Date, remainingLeave: number, leaveType: 'FULL' | 'HALF' | 'QUARTER' = 'FULL'): { success: boolean, remaining: number, error?: string } {
  if (remainingLeave < 0) return { success: false, remaining: remainingLeave, error: "Số phép còn lại không hợp lệ (âm)" };
  if (startDate > endDate) return { success: false, remaining: remainingLeave, error: "Ngày bắt đầu lớn hơn ngày kết thúc" };
  
  let daysRequested = 0;
  
  if (leaveType !== 'FULL') {
    if (startDate.toDateString() !== endDate.toDateString()) return { success: false, remaining: remainingLeave, error: "Nghỉ < 1 ngày chỉ áp dụng trong cùng 1 ngày" };
    daysRequested = leaveType === 'HALF' ? 0.5 : 0.25;
  } else {
    // Đếm số ngày không phải thứ 7, CN và không phải ngày lễ
    let current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dateString = current.toISOString().split('T')[0];
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !HOLIDAYS.includes(dateString)) {
        daysRequested += 1;
      }
      current.setDate(current.getDate() + 1);
    }
  }

  if (daysRequested <= 0 && leaveType === 'FULL') return { success: false, remaining: remainingLeave, error: "Không có ngày làm việc nào trong khoảng thời gian nghỉ" };
  if (daysRequested % 0.5 !== 0) return { success: false, remaining: remainingLeave, error: "Phải là bội số của 0.5" };
  if (daysRequested > remainingLeave) return { success: false, remaining: remainingLeave, error: "Không đủ phép" };
  
  return { success: true, remaining: remainingLeave - daysRequested };
}

export function calculateWorkingHours(checkIn: Date, checkOut: Date | null, isNightShift: boolean = false): { hours: number, date: string, status: string } {
  if (!checkOut) return { hours: 0, date: checkIn.toISOString().split('T')[0], status: 'QUEN_CHAM_RA' };

  let diffMs = checkOut.getTime() - checkIn.getTime();
  let shiftDate = checkIn.toISOString().split('T')[0];

  if (diffMs < 0) {
    if (isNightShift) {
       // ca đêm qua 0h (vd checkIn 22:00, checkOut 06:00)
       diffMs += 24 * 60 * 60 * 1000;
       // Giữ nguyên ngày bắt đầu ca (shiftDate = checkIn)
    } else {
       return { hours: 0, date: shiftDate, status: 'ERROR' };
    }
  }
  
  const hours = diffMs / (1000 * 60 * 60);
  
  let status = 'OK';
  if (hours < 8 && !isNightShift) status = 'VE_SOM'; // Đơn giản hóa
  // Xử lý đi muộn (giả sử ca sáng bắt đầu 08:00:00)
  const checkInHour = checkIn.getHours();
  const checkInMin = checkIn.getMinutes();
  if (!isNightShift && (checkInHour > 8 || (checkInHour === 8 && checkInMin > 0))) {
    status = 'DI_MUON';
  }

  return { hours, date: shiftDate, status };
}

export function calculateSalary(baseSalary: number, dependents: number = 0): { net: number, tax: number, insurance: number } {
  if (baseSalary <= 0) return { net: 0, tax: 0, insurance: 0 }; // Lương 0 hoặc âm

  // Bảo hiểm
  const bhxh_bhyt_base = Math.min(baseSalary, HR_CONFIG.MAX_BHXH_BHYT);
  const bhtn_base = Math.min(baseSalary, HR_CONFIG.MAX_BHTN);
  
  const insurance = (bhxh_bhyt_base * (HR_CONFIG.INSURANCE_RATES.BHXH + HR_CONFIG.INSURANCE_RATES.BHYT)) 
                  + (bhtn_base * HR_CONFIG.INSURANCE_RATES.BHTN);
  
  // Giảm trừ gia cảnh
  const personalDeduction = HR_CONFIG.PERSONAL_DEDUCTION;
  const dependentDeduction = HR_CONFIG.DEPENDENT_DEDUCTION * dependents;
  
  const taxableIncome = baseSalary - insurance - personalDeduction - dependentDeduction;
  
  let tax = 0;
  if (taxableIncome > 0) {
    let lower = 0;
    for (const [ceiling, rate] of HR_CONFIG.PIT_BRACKETS) {
      if (taxableIncome > lower) {
        tax += (Math.min(taxableIncome, ceiling) - lower) * rate;
      }
      lower = ceiling;
    }
  }

  const net = baseSalary - insurance - tax;
  
  return { 
    net: Math.max(0, Math.round(net)), 
    tax: Math.max(0, Math.round(tax)), 
    insurance: Math.max(0, Math.round(insurance)) 
  };
}

export const validators = {
  isValidCCCD: (cccd: string) => /^[0-9]{12}$/.test(cccd),
  isValidPhone: (phone: string) => /^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone),
  isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  isValidMST: (mst: string) => /^([0-9]{10}|[0-9]{10}-[0-9]{3})$/.test(mst)
};
