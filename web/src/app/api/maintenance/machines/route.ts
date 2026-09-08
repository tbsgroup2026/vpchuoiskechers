import { NextResponse } from 'next/server';

const MOCK_MACHINES = [
  {
    id: 'mc_1',
    code: 'MC-MAY-01',
    name: 'Máy May Tự Động 1 kim A1',
    serial: 'SN-99812',
    statusName: 'Đang sử dụng',
    status: 'OPERATING',
    factoryId: 'fac_1',
    areaId: 'area_1',
    areaName: 'Phân Xưởng May A',
    lineId: 'line_1',
    lineName: 'Chuyền May 01',
    machineTypeName: 'Máy May 1 Kim',
    qrData: 'TBS_MC_MAY_01',
  },
  {
    id: 'mc_2',
    code: 'MC-MAY-04',
    name: 'Máy May Tự Động 1 kim A4',
    serial: 'SN-99815',
    statusName: 'Không sử dụng',
    status: 'DOWN',
    factoryId: 'fac_1',
    areaId: 'area_1',
    areaName: 'Phân Xưởng May A',
    lineId: 'line_2',
    lineName: 'Chuyền May 02',
    machineTypeName: 'Máy May 1 Kim',
    qrData: 'TBS_MC_MAY_04',
  },
  {
    id: 'mc_3',
    code: 'MC-CAT-02',
    name: 'Máy Cắt Laser Công Nghiệp B2',
    serial: 'SN-44310',
    statusName: 'Đang sử dụng',
    status: 'OPERATING',
    factoryId: 'fac_2',
    areaId: 'area_3',
    areaName: 'Phân Xưởng Cắt C',
    lineId: 'line_4',
    lineName: 'Chuyền Cắt 01',
    machineTypeName: 'Máy Cắt Laser',
    qrData: 'TBS_MC_CAT_02',
  },
  {
    id: 'mc_4',
    code: 'MC-EP-05',
    name: 'Máy Ép Keo Nhiệt E5',
    serial: 'SN-77219',
    statusName: 'Sửa chữa / Bảo trì',
    status: 'WARNING',
    factoryId: 'fac_1',
    areaId: 'area_2',
    areaName: 'Phân Xưởng Gò B',
    lineId: 'line_3',
    lineName: 'Chuyền Gò 01',
    machineTypeName: 'Máy Ép Keo',
    qrData: 'TBS_MC_EP_05',
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: MOCK_MACHINES });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMachine = {
      id: body.id || `mc_${Date.now()}`,
      code: body.code || `MC-NEW-${Math.floor(100 + Math.random() * 900)}`,
      name: body.name || 'Máy MMTB Mới',
      serial: body.serial || '',
      statusName: body.statusName || 'Đang sử dụng',
      status: body.status || 'OPERATING',
      factoryId: body.factoryId || 'fac_1',
      areaId: body.areaId || 'area_1',
      areaName: body.areaName || 'Phân Xưởng May A',
      lineId: body.lineId || 'line_1',
      lineName: body.lineName || 'Chuyền May 01',
      machineTypeName: body.machineTypeName || 'Máy May 1 Kim',
      qrData: body.qrData || body.code,
    };
    return NextResponse.json({ success: true, data: newMachine });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
