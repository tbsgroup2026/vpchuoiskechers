import { NextResponse } from 'next/server';
import { validateScopeAuthorization } from '@/lib/scopeAuth';
import { EquipmentScope } from '@/lib/equipmentScope';


// Mock data từng đơn vị theo chuẩn độc lập
const SCOPE_DATA: Record<
  'OFFICE' | 'EAST' | 'KIEN_GIANG',
  {
    unitName: string;
    totalEquipment: number;
    totalMaintenance: number;
    totalRepairRequests: number;
    totalImprovements: number;
    totalResponseTimeMinutes: number; // Tổng thời gian phản hồi phút
    totalResponseCases: number; // Tổng số case phản hồi
    avgResponseTimeMinutes: number;
  }
> = {
  OFFICE: {
    unitName: 'Văn Phòng Chuỗi',
    totalEquipment: 45,
    totalMaintenance: 12,
    totalRepairRequests: 8,
    totalImprovements: 5,
    totalResponseTimeMinutes: 180,
    totalResponseCases: 10,
    avgResponseTimeMinutes: 18.0, // 180 / 10
  },
  EAST: {
    unitName: 'Nhà Máy Miền Đông',
    totalEquipment: 160,
    totalMaintenance: 45,
    totalRepairRequests: 28,
    totalImprovements: 19,
    totalResponseTimeMinutes: 1440,
    totalResponseCases: 60,
    avgResponseTimeMinutes: 24.0, // 1440 / 60
  },
  KIEN_GIANG: {
    unitName: 'Tổ Hợp Kiên Giang',
    totalEquipment: 215,
    totalMaintenance: 68,
    totalRepairRequests: 42,
    totalImprovements: 31,
    totalResponseTimeMinutes: 3800,
    totalResponseCases: 100,
    avgResponseTimeMinutes: 38.0, // 3800 / 100
  },
};

export async function GET(request: Request) {
  // 1. Kiểm tra Backend Scope Authorization (Trả về 403 nếu không có quyền)
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  const { scope } = auth;

  // 2. Nếu scope = ALL: Tổng hợp dữ liệu từ 3 đơn vị với đúng công thức tổng/tổng cho chỉ số trung bình (Mục 5.1)
  if (scope === 'ALL') {
    const office = SCOPE_DATA.OFFICE;
    const east = SCOPE_DATA.EAST;
    const kienGiang = SCOPE_DATA.KIEN_GIANG;

    const totalEquipment = office.totalEquipment + east.totalEquipment + kienGiang.totalEquipment;
    const totalMaintenance = office.totalMaintenance + east.totalMaintenance + kienGiang.totalMaintenance;
    const totalRepairRequests = office.totalRepairRequests + east.totalRepairRequests + kienGiang.totalRepairRequests;
    const totalImprovements = office.totalImprovements + east.totalImprovements + kienGiang.totalImprovements;

    // CÔNG THỨC CHUẨN TỔNG/TỔNG (KHÔNG PHẢI AVG-OF-AVGS):
    const totalSumMinutes =
      office.totalResponseTimeMinutes + east.totalResponseTimeMinutes + kienGiang.totalResponseTimeMinutes;
    const totalSumCases = office.totalResponseCases + east.totalResponseCases + kienGiang.totalResponseCases;

    const avgResponseTime = totalSumCases > 0 ? Number((totalSumMinutes / totalSumCases).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      scope: 'ALL',
      totalEquipment,
      totalMaintenance,
      totalRepairRequests,
      totalImprovements,
      avgResponseTime, // 5420 / 170 = 31.88 -> 31.9 phút (KHÔNG PHẢI (18+24+38)/3 = 26.6)
      totalResponseTimeMinutes: totalSumMinutes,
      totalResponseCases: totalSumCases,
      breakdown: {
        office,
        east,
        kienGiang,
      },
      comparisonTable: [
        { metric: 'MMTB', office: office.totalEquipment, east: east.totalEquipment, kienGiang: kienGiang.totalEquipment, total: totalEquipment },
        { metric: 'Bảo dưỡng', office: office.totalMaintenance, east: east.totalMaintenance, kienGiang: kienGiang.totalMaintenance, total: totalMaintenance },
        { metric: 'Sửa chữa', office: office.totalRepairRequests, east: east.totalRepairRequests, kienGiang: kienGiang.totalRepairRequests, total: totalRepairRequests },
        { metric: 'Cải tiến', office: office.totalImprovements, east: east.totalImprovements, kienGiang: kienGiang.totalImprovements, total: totalImprovements },
        { metric: 'Thời gian phản hồi (phút)', office: office.avgResponseTimeMinutes, east: east.avgResponseTimeMinutes, kienGiang: kienGiang.avgResponseTimeMinutes, total: avgResponseTime },
      ],
    });
  }

  // 3. Nếu chọn 1 đơn vị cụ thể (OFFICE / EAST / KIEN_GIANG): Trả dữ liệu độc lập của đơn vị đó
  const unitKey = scope as keyof typeof SCOPE_DATA;
  const unitData = SCOPE_DATA[unitKey] || SCOPE_DATA.OFFICE;

  return NextResponse.json({
    success: true,
    scope,
    totalEquipment: unitData.totalEquipment,
    totalMaintenance: unitData.totalMaintenance,
    totalRepairRequests: unitData.totalRepairRequests,
    totalImprovements: unitData.totalImprovements,
    avgResponseTime: unitData.avgResponseTimeMinutes,
    totalResponseTimeMinutes: unitData.totalResponseTimeMinutes,
    totalResponseCases: unitData.totalResponseCases,
    unitData,
  });
}
