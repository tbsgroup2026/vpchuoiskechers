import { NextResponse } from 'next/server';
import { validateScopeAuthorization } from '@/lib/scopeAuth';

export async function GET(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  return NextResponse.json({
    success: true,
    scope: auth.scope,
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
    ],
  });
}

export async function POST(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  return NextResponse.json({ success: true, scope: auth.scope, message: 'Saved employee' });
}
