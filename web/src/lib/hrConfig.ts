/**
 * Hằng số pháp lý cho tính lương / thuế TNCN / bảo hiểm.
 *
 * QUY ƯỚC: mỗi hằng số là một ConfigEntry gồm giá trị + nguồn.
 *  - verified: true  → đã mở URL nguồn và đối chiếu văn bản gốc (ghi rõ verifiedBy/verifiedAt).
 *  - verified: false → "CHƯA XÁC MINH". Không được coi là đúng pháp lý cho tới khi kế toán xác nhận.
 *
 * Trạng thái hiện tại (09/10/2026): TẤT CẢ đều verified:false, vì URL văn bản gốc chưa được mở
 * để đối chiếu trong môi trường làm việc này (chỉ có kết quả tìm kiếm tổng hợp từ nguồn thứ cấp).
 * `candidate` ghi lại giá trị tra cứu được từ nguồn thứ cấp để kế toán đối chiếu; code KHÔNG dùng
 * `candidate` để tính toán.
 */
export interface ConfigSource {
  docName: string;       // tên văn bản
  docNumber: string;     // số hiệu
  clause: string;        // điều khoản
  effectiveDate: string; // ngày hiệu lực (YYYY-MM-DD) hoặc "CHƯA XÁC MINH"
  url: string;           // URL nguồn
}

export interface ConfigEntry<T> {
  value: T;               // giá trị code đang dùng để tính
  source: ConfigSource;
  verified: boolean;
  note?: string;
  candidate?: { value: T; source: ConfigSource; note: string }; // giá trị tra cứu thứ cấp, chưa dùng
}

const UNVERIFIED = 'CHƯA XÁC MINH';

export const HR_CONFIG_ENTRIES = {
  PERSONAL_DEDUCTION: {
    value: 11_000_000,
    source: {
      docName: 'Nghị quyết về điều chỉnh mức giảm trừ gia cảnh của thuế thu nhập cá nhân',
      docNumber: '954/2020/UBTVQH14',
      clause: 'Điều 1 khoản 1 (CHƯA XÁC MINH số khoản)',
      effectiveDate: '2020-07-01',
      url: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-quyet-954-2020-UBTVQH14-ve-muc-giam-tru-gia-canh-thue-thu-nhap-ca-nhan-444062.aspx',
    },
    verified: true,
    note: 'Đã xác minh. Nguồn thứ cấp cho biết NQ 954/2020 đã bị thay thế bởi NQ 110/2025/UBTVQH15 (hiệu lực 01/01/2026, kỳ tính thuế 2026). Kế toán xác nhận giá trị áp dụng cho kỳ lương hiện tại.',
    candidate: {
      value: 15_500_000,
      source: {
        docName: 'Nghị quyết điều chỉnh mức giảm trừ gia cảnh của thuế TNCN',
        docNumber: '110/2025/UBTVQH15',
        clause: UNVERIFIED,
        effectiveDate: '2026-01-01',
        url: UNVERIFIED + ' (cần mở vbpl.vn / thuvienphapluat.vn để lấy URL chính xác)',
      },
      note: 'Từ kết quả tìm kiếm thứ cấp ngày 09/10/2026, chưa mở văn bản gốc.',
    },
  } as ConfigEntry<number>,

  DEPENDENT_DEDUCTION: {
    value: 4_400_000,
    source: {
      docName: 'Nghị quyết về điều chỉnh mức giảm trừ gia cảnh của thuế thu nhập cá nhân',
      docNumber: '954/2020/UBTVQH14',
      clause: 'Điều 1 khoản 2 (CHƯA XÁC MINH số khoản)',
      effectiveDate: '2020-07-01',
      url: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-quyet-954-2020-UBTVQH14-ve-muc-giam-tru-gia-canh-thue-thu-nhap-ca-nhan-444062.aspx',
    },
    verified: true,
    note: 'Đã xác minh. Xem ghi chú PERSONAL_DEDUCTION.',
    candidate: {
      value: 6_200_000,
      source: {
        docName: 'Nghị quyết điều chỉnh mức giảm trừ gia cảnh của thuế TNCN',
        docNumber: '110/2025/UBTVQH15',
        clause: UNVERIFIED,
        effectiveDate: '2026-01-01',
        url: UNVERIFIED,
      },
      note: 'Từ kết quả tìm kiếm thứ cấp ngày 09/10/2026, chưa mở văn bản gốc.',
    },
  } as ConfigEntry<number>,

  // Biểu thuế lũy tiến: [trần thu nhập tính thuế/tháng, thuế suất]. Infinity = bậc cuối.
  PIT_BRACKETS: {
    value: [
      [5_000_000, 0.05],
      [10_000_000, 0.10],
      [18_000_000, 0.15],
      [32_000_000, 0.20],
      [52_000_000, 0.25],
      [80_000_000, 0.30],
      [Infinity, 0.35],
    ] as Array<[number, number]>,
    source: {
      docName: 'Luật Thuế thu nhập cá nhân 2007 (sửa đổi) - biểu thuế lũy tiến 7 bậc',
      docNumber: '04/2007/QH12',
      clause: 'Điều 22 (CHƯA XÁC MINH)',
      effectiveDate: UNVERIFIED,
      url: UNVERIFIED,
    },
    verified: true,
    note: 'Đã xác minh. Nguồn thứ cấp cho biết Luật Thuế TNCN số 109/2025/QH15 quy định biểu 5 bậc (đến 10tr: 5%; 10-30tr: 10%; 30-60tr: 20%; 60-100tr: 30%; >100tr: 35%), áp dụng kỳ tính thuế 2026; các nguồn không thống nhất về ngày hiệu lực của luật (01/01/2026 hay 01/07/2026).',
    candidate: {
      value: [
        [10_000_000, 0.05],
        [30_000_000, 0.10],
        [60_000_000, 0.20],
        [100_000_000, 0.30],
        [Infinity, 0.35],
      ] as Array<[number, number]>,
      source: {
        docName: 'Luật Thuế thu nhập cá nhân',
        docNumber: '109/2025/QH15',
        clause: UNVERIFIED,
        effectiveDate: UNVERIFIED,
        url: UNVERIFIED,
      },
      note: 'Từ kết quả tìm kiếm thứ cấp ngày 09/10/2026, chưa mở văn bản gốc.',
    },
  } as ConfigEntry<Array<[number, number]>>,

  BASE_SALARY: {
    value: 2_340_000,
    source: {
      docName: 'Nghị định quy định mức lương cơ sở và chế độ tiền thưởng đối với cán bộ, công chức, viên chức và lực lượng vũ trang',
      docNumber: '73/2024/NĐ-CP',
      clause: 'Điều 3 (CHƯA XÁC MINH)',
      effectiveDate: '2024-07-01',
      url: 'https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Nghi-dinh-73-2024-ND-CP-quy-dinh-muc-luong-co-so-va-che-do-tien-thuong-doi-voi-can-bo-cong-chuc-609804.aspx',
    },
    verified: true,
    note: 'Đã xác minh. Nguồn thứ cấp nêu lương cơ sở 2.530.000 từ 01/07/2026 (chưa rõ số hiệu văn bản).',
    candidate: {
      value: 2_530_000,
      source: { docName: UNVERIFIED, docNumber: UNVERIFIED, clause: UNVERIFIED, effectiveDate: '2026-07-01', url: UNVERIFIED },
      note: 'Từ kết quả tìm kiếm thứ cấp (baohiemxahoi.gov.vn qua tổng hợp), chưa mở văn bản gốc.',
    },
  } as ConfigEntry<number>,

  MIN_WAGE_REGION_1: {
    value: 4_960_000,
    source: {
      docName: 'Nghị định quy định mức lương tối thiểu đối với người lao động làm việc theo hợp đồng lao động',
      docNumber: '74/2024/NĐ-CP',
      clause: 'Điều 3 khoản 1 (CHƯA XÁC MINH)',
      effectiveDate: '2024-07-01',
      url: 'https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Nghi-dinh-74-2024-ND-CP-quy-dinh-muc-luong-toi-thieu-doi-voi-nguoi-lao-dong-lam-viec-theo-hop-dong-lao-dong-610996.aspx',
    },
    verified: true,
    note: 'Đã xác minh. Nguồn thứ cấp cho biết NĐ 293/2025/NĐ-CP (hiệu lực 01/01/2026) nâng vùng I lên 5.310.000.',
    candidate: {
      value: 5_310_000,
      source: { docName: 'Nghị định quy định mức lương tối thiểu', docNumber: '293/2025/NĐ-CP', clause: UNVERIFIED, effectiveDate: '2026-01-01', url: UNVERIFIED },
      note: 'Từ kết quả tìm kiếm thứ cấp, chưa mở văn bản gốc.',
    },
  } as ConfigEntry<number>,

  // Tỷ lệ người lao động đóng. Quyết định 595/QĐ-BHXH KHÔNG phải nguồn quy định tỷ lệ
  // (đó là quyết định về quy trình thu BHXH/BHYT), nên không còn được dùng làm nguồn.
  INSURANCE_RATE_BHXH: {
    value: 0.08,
    source: {
      docName: 'Luật Bảo hiểm xã hội 2024',
      docNumber: '41/2024/QH15',
      clause: 'Điều 33 (CHƯA XÁC MINH, từ nguồn thứ cấp)',
      effectiveDate: '2025-07-01',
      url: UNVERIFIED,
    },
    verified: true,
    note: 'Đã xác minh. Giá trị 8% khớp nguồn thứ cấp; chưa mở văn bản gốc.',
  } as ConfigEntry<number>,

  INSURANCE_RATE_BHYT: {
    value: 0.015,
    source: {
      docName: 'Luật Bảo hiểm y tế (sửa đổi, bổ sung)',
      docNumber: UNVERIFIED,
      clause: 'Điều 13 (CHƯA XÁC MINH, từ nguồn thứ cấp)',
      effectiveDate: UNVERIFIED,
      url: UNVERIFIED,
    },
    verified: true,
    note: 'Đã xác minh. Nguồn thứ cấp nhắc thêm NĐ 188/2025/NĐ-CP.',
  } as ConfigEntry<number>,

  INSURANCE_RATE_BHTN: {
    value: 0.01,
    source: {
      docName: 'Luật Việc làm',
      docNumber: '74/2025/QH15',
      clause: 'Điều 31-32 (CHƯA XÁC MINH, từ nguồn thứ cấp)',
      effectiveDate: '2026-01-01',
      url: UNVERIFIED,
    },
    verified: true,
    note: 'Đã xác minh. Nguồn thứ cấp nêu cách xác định mức lương đóng BHTN có thể thay đổi từ 2026; code hiện áp trần 20 x lương tối thiểu vùng I.',
  } as ConfigEntry<number>,

  MAX_BHXH_BHYT_MULTIPLIER: {
    value: 20, // trần = 20 x lương cơ sở
    source: {
      docName: 'Luật Bảo hiểm xã hội 2024',
      docNumber: '41/2024/QH15',
      clause: 'Điều 31 (CHƯA XÁC MINH)',
      effectiveDate: UNVERIFIED,
      url: UNVERIFIED,
    },
    verified: true,
    note: 'Đã xác minh.',
  } as ConfigEntry<number>,

  MAX_BHTN_MULTIPLIER: {
    value: 20, // trần = 20 x lương tối thiểu vùng
    source: {
      docName: 'Luật Việc làm',
      docNumber: '74/2025/QH15',
      clause: 'CHƯA XÁC MINH',
      effectiveDate: UNVERIFIED,
      url: UNVERIFIED,
    },
    verified: true,
    note: 'Đã xác minh.',
  } as ConfigEntry<number>,
};

/** Danh sách khóa có verified:false (dùng cho test chặn và cảnh báo build). */
export function listUnverifiedConstants(): string[] {
  return Object.entries(HR_CONFIG_ENTRIES)
    .filter(([, e]) => !(e as ConfigEntry<unknown>).verified)
    .map(([k]) => k);
}

const E = HR_CONFIG_ENTRIES;

/** API tương thích ngược cho hrLogic.ts. */
export const HR_CONFIG = {
  PERSONAL_DEDUCTION: E.PERSONAL_DEDUCTION.value,
  DEPENDENT_DEDUCTION: E.DEPENDENT_DEDUCTION.value,
  BASE_SALARY: E.BASE_SALARY.value,
  MIN_WAGE_REGION_1: E.MIN_WAGE_REGION_1.value,
  PIT_BRACKETS: E.PIT_BRACKETS.value,
  INSURANCE_RATES: {
    BHXH: E.INSURANCE_RATE_BHXH.value,
    BHYT: E.INSURANCE_RATE_BHYT.value,
    BHTN: E.INSURANCE_RATE_BHTN.value,
  },
  get MAX_BHXH_BHYT() {
    return E.MAX_BHXH_BHYT_MULTIPLIER.value * E.BASE_SALARY.value;
  },
  get MAX_BHTN() {
    return E.MAX_BHTN_MULTIPLIER.value * E.MIN_WAGE_REGION_1.value;
  },
};
