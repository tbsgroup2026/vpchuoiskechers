import { NextResponse } from 'next/server';
import { validateScopeAuthorization } from '@/lib/scopeAuth';
import { EquipmentScope } from '@/lib/equipmentScope';

let TICKETS_STORE = [
  {
    id: 'tk_1',
    code: 'YCSC-OFF-001',
    title: 'Sự cố máy may mẫu đứt chỉ VP Chuỗi',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    machineCode: 'MC-OFFICE-01',
    machineName: 'Máy May Tự Động 1 Kim VP-01',
    createdAt: new Date().toISOString(),
    assignedTo: 'Nguyễn Văn Nam',
    data_scope: 'OFFICE' as EquipmentScope,
  },
  {
    id: 'tk_2',
    code: 'YCSC-EAST-001',
    title: 'Máy cắt laser không nhận tín hiệu NM Miền Đông',
    status: 'OPEN',
    priority: 'URGENT',
    machineCode: 'MC-EAST-01',
    machineName: 'Máy Cắt Laser Công Nghiệp EAST-01',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    assignedTo: 'Trần Văn Bình',
    data_scope: 'EAST' as EquipmentScope,
  },
  {
    id: 'tk_3',
    code: 'YCSC-KG-001',
    title: 'Hỏng bộ phận gia nhiệt máy ép keo Kiên Giang',
    status: 'RESOLVED',
    priority: 'NORMAL',
    machineCode: 'MC-KG-01',
    machineName: 'Máy Ép Keo Nhiệt Kiên Giang KG-01',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    assignedTo: 'Phạm Văn Bảo',
    data_scope: 'KIEN_GIANG' as EquipmentScope,
  },
];

export async function GET(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  const { scope } = auth;

  let data = TICKETS_STORE;
  if (scope !== 'ALL') {
    data = TICKETS_STORE.filter((t) => t.data_scope === scope);
  }

  return NextResponse.json({
    success: true,
    scope,
    total: data.length,
    data,
  });
}

export async function POST(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    let assignedScope: EquipmentScope = body.data_scope || auth.scope;
    if (assignedScope === 'ALL') {
      assignedScope = 'OFFICE';
    }

    const newTicket = {
      id: `tk_${Date.now()}`,
      code: body.code || `YCSC-${assignedScope.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      title: body.title || 'Nhu cầu sửa chữa mới',
      status: body.status || 'OPEN',
      priority: body.priority || 'NORMAL',
      machineCode: body.machineCode || 'MC-GENERIC',
      machineName: body.machineName || 'Thiết Bị MMTB',
      createdAt: new Date().toISOString(),
      assignedTo: body.assignedTo || null,
      data_scope: assignedScope,
    };

    TICKETS_STORE.push(newTicket);

    return NextResponse.json({
      success: true,
      scope: assignedScope,
      data: newTicket,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
