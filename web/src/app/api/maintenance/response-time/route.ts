import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    incidents: [
      {
        id: 'inc_1',
        isMaintenanceDue: false,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        acceptedAt: new Date(Date.now() - 3600000 * 4.8).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 4.2).toISOString(),
        assignedTo: { id: 'emp_1', name: 'Nguyễn Văn Nam', employeeCode: 'TBS-101' },
        factoryName: 'Nhà Máy Kiên Giang 1',
        areaName: 'Phân Xưởng May A',
      },
    ],
    logs: [],
  });
}
