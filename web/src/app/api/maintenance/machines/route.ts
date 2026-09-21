import { NextResponse } from 'next/server';
import { validateScopeAuthorization } from '@/lib/scopeAuth';
import { EquipmentScope } from '@/lib/equipmentScope';

// In-memory machine list với trường data_scope
let MACHINES_STORE = [
  {
    id: 'mc_1',
    code: 'MC-OFFICE-01',
    name: 'Máy May Tự Động 1 Kim VP-01',
    serial: 'SN-OFF-99812',
    statusName: 'Đang sử dụng',
    status: 'OPERATING',
    factoryId: 'fac_office',
    areaId: 'area_1',
    areaName: 'Phân Xưởng May Mẫu VP',
    lineId: 'line_1',
    lineName: 'Chuyền May 01 VP',
    machineTypeName: 'Máy May 1 Kim',
    qrData: 'TBS_MC_OFFICE_01',
    data_scope: 'OFFICE' as EquipmentScope,
  },
  {
    id: 'mc_2',
    code: 'MC-EAST-01',
    name: 'Máy Cắt Laser Công Nghiệp EAST-01',
    serial: 'SN-EAST-44310',
    statusName: 'Đang sử dụng',
    status: 'OPERATING',
    factoryId: 'fac_east',
    areaId: 'area_east_3',
    areaName: 'Phân Xưởng Cắt Miền Đông',
    lineId: 'line_east_4',
    lineName: 'Chuyền Cắt 01 NM Miền Đông',
    machineTypeName: 'Máy Cắt Laser',
    qrData: 'TBS_MC_EAST_01',
    data_scope: 'EAST' as EquipmentScope,
  },
  {
    id: 'mc_3',
    code: 'MC-KG-01',
    name: 'Máy Ép Keo Nhiệt Kiên Giang KG-01',
    serial: 'SN-KG-77219',
    statusName: 'Đang sử dụng',
    status: 'OPERATING',
    factoryId: 'fac_kg',
    areaId: 'area_kg_2',
    areaName: 'Phân Xưởng Gò KG',
    lineId: 'line_kg_3',
    lineName: 'Chuyền Gò 01 TH Kiên Giang',
    machineTypeName: 'Máy Ép Keo',
    qrData: 'TBS_MC_KG_01',
    data_scope: 'KIEN_GIANG' as EquipmentScope,
  },
  {
    id: 'mc_4',
    code: 'MC-KG-02',
    name: 'Máy Gò Mũi Tự Động KG-02',
    serial: 'SN-KG-88123',
    statusName: 'Sửa chữa / Bảo trì',
    status: 'WARNING',
    factoryId: 'fac_kg',
    areaId: 'area_kg_2',
    areaName: 'Phân Xưởng Gò KG',
    lineId: 'line_kg_3',
    lineName: 'Chuyền Gò 02 TH Kiên Giang',
    machineTypeName: 'Máy Gò Mũi',
    qrData: 'TBS_MC_KG_02',
    data_scope: 'KIEN_GIANG' as EquipmentScope,
  },
];

export async function GET(request: Request) {
  // 1. Validate Scope Authorization
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  const { scope } = auth;

  // 2. Filter machines per scope
  let data = MACHINES_STORE;
  if (scope !== 'ALL') {
    data = MACHINES_STORE.filter((m) => m.data_scope === scope);
  }

  return NextResponse.json({
    success: true,
    scope,
    total: data.length,
    data,
  });
}

export async function POST(request: Request) {
  // 1. Validate Scope Authorization
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    // 2. Scope cho thiết bị mới (Mục 8: ALL không bao giờ được lưu trong DB)
    let assignedScope: EquipmentScope = body.data_scope || auth.scope;
    if (assignedScope === 'ALL') {
      assignedScope = 'OFFICE'; // Fallback nếu client truyền ALL
    }

    const newMachine = {
      id: body.id || `mc_${Date.now()}`,
      code: body.code || `MC-NEW-${Math.floor(100 + Math.random() * 900)}`,
      name: body.name || 'Máy MMTB Mới',
      serial: body.serial || '',
      statusName: body.statusName || 'Đang sử dụng',
      status: body.status || 'OPERATING',
      factoryId: body.factoryId || 'fac_1',
      areaId: body.areaId || 'area_1',
      areaName: body.areaName || 'Phân Xưởng Vận Hành',
      lineId: body.lineId || 'line_1',
      lineName: body.lineName || 'Chuyền Vận Hành 01',
      machineTypeName: body.machineTypeName || 'Máy May 1 Kim',
      qrData: body.qrData || body.code,
      data_scope: assignedScope,
    };

    MACHINES_STORE.push(newMachine);

    return NextResponse.json({
      success: true,
      scope: assignedScope,
      data: newMachine,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
