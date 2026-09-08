import { NextResponse } from 'next/server';

const MOCK_TICKETS = [
  {
    id: 'tk_1',
    code: 'YCSC-001',
    title: 'Sự cố máy may đứt chỉ liên tục Chuyền 1',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    machineCode: 'MC-MAY-01',
    machineName: 'Máy May Tự Động 1 kim A1',
    createdAt: new Date().toISOString(),
    assignedTo: 'Nguyễn Văn Nam',
  },
  {
    id: 'tk_2',
    code: 'YCSC-002',
    title: 'Máy cắt laser không nhận tín hiệu khởi động',
    status: 'OPEN',
    priority: 'URGENT',
    machineCode: 'MC-CAT-02',
    machineName: 'Máy Cắt Laser B2',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    assignedTo: null,
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: MOCK_TICKETS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: { id: `tk_${Date.now()}`, ...body } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
