import { NextResponse } from 'next/server';

const MOCK_PROPOSALS = [
  {
    id: 'prop_1',
    type: 'PARTS_REQUEST',
    parts: JSON.stringify([{ partId: 'p1', partName: 'Sensor Cảm Biến Quang', quantity: 2 }]),
    reason: 'Đề xuất thay mới sensor cảm biến tự động máy MC-MAY-04 do hư chập chập',
    resolved: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    submittedBy: { id: 'u1', name: 'Nguyễn Văn Nam', employeeCode: 'TBS-101' },
    operator: null,
    confirmedBy: null,
    incident: {
      id: 'inc_1',
      description: 'Lỗi cảm biến',
      machine: {
        id: 'mc_2',
        code: 'MC-MAY-04',
        name: 'Máy May Tự Động 1 kim A4',
        area: { id: 'area_1', name: 'Phân Xưởng May A', parent: { id: 'fac_1', name: 'Nhà Máy Kiên Giang 1' } },
      },
    },
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: MOCK_PROPOSALS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: { id: `prop_${Date.now()}`, ...body } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
