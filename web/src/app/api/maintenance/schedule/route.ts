import { NextResponse } from 'next/server';
import { validateScopeAuthorization } from '@/lib/scopeAuth';
import { EquipmentScope } from '@/lib/equipmentScope';

let SCHEDULE_MACHINES = [
  { id: 'mc_1', code: 'MC-OFFICE-01', name: 'Máy May Tự Động 1 Kim VP-01', status: 'upcoming', lastMaintenanceDate: '2026-02-01', nextMaintenanceDate: '2026-03-15', data_scope: 'OFFICE' as EquipmentScope },
  { id: 'mc_2', code: 'MC-EAST-01', name: 'Máy Cắt Laser Công Nghiệp EAST-01', status: 'overdue', lastMaintenanceDate: '2026-01-10', nextMaintenanceDate: '2026-02-28', data_scope: 'EAST' as EquipmentScope },
  { id: 'mc_3', code: 'MC-KG-01', name: 'Máy Ép Keo Nhiệt Kiên Giang KG-01', status: 'scheduled', lastMaintenanceDate: '2026-02-15', nextMaintenanceDate: '2026-04-01', data_scope: 'KIEN_GIANG' as EquipmentScope },
];

export async function GET(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  const { scope } = auth;

  let machines = SCHEDULE_MACHINES;
  if (scope !== 'ALL') {
    machines = SCHEDULE_MACHINES.filter((m) => m.data_scope === scope);
  }

  return NextResponse.json({
    success: true,
    scope,
    machines,
    data: machines,
  });
}

export async function POST(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  return NextResponse.json({ success: true, scope: auth.scope, message: 'Updated schedule' });
}
