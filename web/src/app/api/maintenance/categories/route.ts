import { NextResponse } from 'next/server';

const FACTORIES = [
  { id: 'fac_1', name: 'Nhà Máy Kiên Giang 1' },
  { id: 'fac_2', name: 'Nhà Máy Miền Đông' },
];

const AREAS = [
  { id: 'area_1', name: 'Phân Xưởng May A', parent: { id: 'fac_1', name: 'Nhà Máy Kiên Giang 1' }, parentId: 'fac_1' },
  { id: 'area_2', name: 'Phân Xưởng Gò B', parent: { id: 'fac_1', name: 'Nhà Máy Kiên Giang 1' }, parentId: 'fac_1' },
  { id: 'area_3', name: 'Phân Xưởng Cắt C', parent: { id: 'fac_2', name: 'Nhà Máy Miền Đông' }, parentId: 'fac_2' },
];

const LINES = [
  { id: 'line_1', name: 'Chuyền May 01', parent: { id: 'area_1', name: 'Phân Xưởng May A', parent: { id: 'fac_1', name: 'Nhà Máy Kiên Giang 1' } } },
  { id: 'line_2', name: 'Chuyền May 02', parent: { id: 'area_1', name: 'Phân Xưởng May A', parent: { id: 'fac_1', name: 'Nhà Máy Kiên Giang 1' } } },
  { id: 'line_3', name: 'Chuyền Gò 01', parent: { id: 'area_2', name: 'Phân Xưởng Gò B', parent: { id: 'fac_1', name: 'Nhà Máy Kiên Giang 1' } } },
  { id: 'line_4', name: 'Chuyền Cắt 01', parent: { id: 'area_3', name: 'Phân Xưởng Cắt C', parent: { id: 'fac_2', name: 'Nhà Máy Miền Đông' } } },
];

const TEAMS = [
  { id: 'team_1', name: 'Team Bảo Trì 1' },
  { id: 'team_2', name: 'Team Bảo Trì 2' },
];

const MACHINE_TYPES = [
  { id: 'type_1', name: 'Máy May 1 Kim' },
  { id: 'type_2', name: 'Máy Cắt Laser' },
  { id: 'type_3', name: 'Máy Ép Keo' },
];

const MACHINE_STATUSES = [
  { id: 'status_1', name: 'Đang sử dụng' },
  { id: 'status_2', name: 'Không sử dụng' },
  { id: 'status_3', name: 'Sửa chữa / Bảo trì' },
  { id: 'status_4', name: 'Đề nghị thanh lý' },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: FACTORIES,
    factories: FACTORIES,
    areas: AREAS,
    lines: LINES,
    teams: TEAMS,
    machineTypes: MACHINE_TYPES,
    machineStatuses: MACHINE_STATUSES,
  });
}
