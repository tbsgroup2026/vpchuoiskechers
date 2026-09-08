import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      {
        id: 'emp_1',
        employeeCode: 'TBS-101',
        name: 'Nguyễn Văn Nam',
        phone: '0912345678',
        role: 'MAINTENANCE',
        factoryId: 'fac_1',
        factory: { id: 'fac_1', name: 'Nhà Máy Kiên Giang 1' },
        areaId: 'area_1',
        area: { id: 'area_1', name: 'Phân Xưởng May A' },
        isTeamLead: true,
      },
      {
        id: 'emp_2',
        employeeCode: 'TBS-102',
        name: 'Trần Thị Hoa',
        phone: '0987654321',
        role: 'OPERATOR',
        factoryId: 'fac_1',
        factory: { id: 'fac_1', name: 'Nhà Máy Kiên Giang 1' },
        areaId: 'area_1',
        area: { id: 'area_1', name: 'Phân Xưởng May A' },
        isTeamLead: false,
      },
    ],
  });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Saved employee' });
}
