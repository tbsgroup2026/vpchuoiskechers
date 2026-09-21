import { NextResponse } from 'next/server';
import { validateScopeAuthorization } from '@/lib/scopeAuth';
import { EquipmentScope } from '@/lib/equipmentScope';


const FLOOR_PLANS: Record<EquipmentScope, Array<{ id: string; name: string; imageUrl: string; scope: EquipmentScope; factoryId: string }>> = {
  ALL: [
    { id: 'fl_off', name: 'Sơ Đồ Văn Phòng Chuỗi SKECHERS', imageUrl: '/images/floor-plan-office.png', scope: 'OFFICE', factoryId: 'fac_office' },
    { id: 'fl_east', name: 'Sơ Đồ Phân Xưởng Sản Xuất NM Miền Đông', imageUrl: '/images/floor-plan-east.png', scope: 'EAST', factoryId: 'fac_east' },
    { id: 'fl_kg', name: 'Sơ Đồ Tổng Mặt Bằng Tổ Hợp Kiên Giang', imageUrl: '/images/floor-plan-kg.png', scope: 'KIEN_GIANG', factoryId: 'fac_kg' },
  ],
  OFFICE: [
    { id: 'fl_off', name: 'Sơ Đồ Văn Phòng Chuỗi SKECHERS', imageUrl: '/images/floor-plan-office.png', scope: 'OFFICE', factoryId: 'fac_office' },
  ],
  EAST: [
    { id: 'fl_east', name: 'Sơ Đồ Phân Xưởng Sản Xuất NM Miền Đông', imageUrl: '/images/floor-plan-east.png', scope: 'EAST', factoryId: 'fac_east' },
  ],
  KIEN_GIANG: [
    { id: 'fl_kg', name: 'Sơ Đồ Tổng Mặt Bằng Tổ Hợp Kiên Giang', imageUrl: '/images/floor-plan-kg.png', scope: 'KIEN_GIANG', factoryId: 'fac_kg' },
  ],
};

export async function GET(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  const { scope } = auth;
  const data = FLOOR_PLANS[scope] || FLOOR_PLANS.OFFICE;

  return NextResponse.json({
    success: true,
    scope,
    data,
  });
}
