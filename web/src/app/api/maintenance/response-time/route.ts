import { NextResponse } from 'next/server';
import { validateScopeAuthorization } from '@/lib/scopeAuth';
import { EquipmentScope } from '@/lib/equipmentScope';


const INCIDENTS_DATA = [
  {
    id: 'inc_off_1',
    code: 'INC-OFF-01',
    machineName: 'Máy May Tự Động VP-01',
    responseTimeMinutes: 18,
    assignedTo: { id: 'emp_1', name: 'Nguyễn Văn Nam', employeeCode: 'TBS-101' },
    factoryName: 'Văn Phòng Chuỗi SKECHERS',
    areaName: 'May Mẫu VP',
    data_scope: 'OFFICE' as EquipmentScope,
  },
  {
    id: 'inc_east_1',
    code: 'INC-EAST-01',
    machineName: 'Máy Cắt Laser EAST-01',
    responseTimeMinutes: 24,
    assignedTo: { id: 'emp_2', name: 'Trần Văn Bình', employeeCode: 'TBS-102' },
    factoryName: 'Nhà Máy Miền Đông',
    areaName: 'Phân Xưởng Cắt',
    data_scope: 'EAST' as EquipmentScope,
  },
  {
    id: 'inc_kg_1',
    code: 'INC-KG-01',
    machineName: 'Máy Ép Keo KG-01',
    responseTimeMinutes: 38,
    assignedTo: { id: 'emp_3', name: 'Phạm Văn Bảo', employeeCode: 'BT-001' },
    factoryName: 'Tổ Hợp Kiên Giang',
    areaName: 'Phân Xưởng Gò',
    data_scope: 'KIEN_GIANG' as EquipmentScope,
  },
];

export async function GET(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  const { scope } = auth;

  let incidents = INCIDENTS_DATA;
  if (scope !== 'ALL') {
    incidents = INCIDENTS_DATA.filter((i) => i.data_scope === scope);
  }

  // Thống kê tổng quan đúng công thức tổng / tổng (Mục 5.1)
  const totalMinutes = incidents.reduce((sum, item) => sum + item.responseTimeMinutes, 0);
  const totalCases = incidents.length;
  const avgResponseTime = totalCases > 0 ? Number((totalMinutes / totalCases).toFixed(1)) : 0;

  return NextResponse.json({
    success: true,
    scope,
    avgResponseTime,
    totalMinutes,
    totalCases,
    incidents,
    logs: [],
  });
}
