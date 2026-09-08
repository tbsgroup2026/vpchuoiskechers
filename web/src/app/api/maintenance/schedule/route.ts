import { NextResponse } from 'next/server';

const MOCK_SCHEDULE = {
  machines: [
    { id: 'mc_1', code: 'MC-MAY-01', name: 'Máy May Tự Động 1 kim A1', status: 'upcoming', lastMaintenanceDate: '2026-02-01', nextMaintenanceDate: '2026-03-15' },
    { id: 'mc_2', code: 'MC-MAY-04', name: 'Máy May Tự Động 1 kim A4', status: 'overdue', lastMaintenanceDate: '2026-01-10', nextMaintenanceDate: '2026-02-28' },
    { id: 'mc_3', code: 'MC-CAT-02', name: 'Máy Cắt Laser B2', status: 'scheduled', lastMaintenanceDate: '2026-02-15', nextMaintenanceDate: '2026-04-01' },
  ],
};

export async function GET() {
  return NextResponse.json({ success: true, ...MOCK_SCHEDULE });
}

export async function POST(request: Request) {
  return NextResponse.json({ success: true, message: 'Updated schedule' });
}
