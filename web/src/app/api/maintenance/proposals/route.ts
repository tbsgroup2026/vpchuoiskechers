import { NextResponse } from 'next/server';
import { validateScopeAuthorization } from '@/lib/scopeAuth';
import { EquipmentScope } from '@/lib/equipmentScope';

let PROPOSALS_STORE = [
  {
    id: 'prop_off_1',
    type: 'PARTS_REQUEST',
    reason: 'Đề xuất cải tiến hệ thống hút bụi máy may mẫu VP Chuỗi',
    resolved: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    submittedBy: { id: 'u1', name: 'Phạm Nguyễn Anh Huy', employeeCode: '202608001' },
    data_scope: 'OFFICE' as EquipmentScope,
  },
  {
    id: 'prop_east_1',
    type: 'IMPROVEMENT_IDEA',
    reason: 'Thay cảm biến laser tự động nâng cao năng suất chuyền cắt Miền Đông',
    resolved: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    submittedBy: { id: 'u2', name: 'Trần Văn Bình', employeeCode: 'TBS-102' },
    data_scope: 'EAST' as EquipmentScope,
  },
  {
    id: 'prop_kg_1',
    type: 'PARTS_REQUEST',
    reason: 'Đề xuất thay thế hệ thống gia nhiệt máy ép keo Kiên Giang',
    resolved: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    submittedBy: { id: 'u3', name: 'Phạm Văn Bảo', employeeCode: 'BT-001' },
    data_scope: 'KIEN_GIANG' as EquipmentScope,
  },
];

export async function GET(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  const { scope } = auth;

  let data = PROPOSALS_STORE;
  if (scope !== 'ALL') {
    data = PROPOSALS_STORE.filter((p) => p.data_scope === scope);
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

    const newProposal = {
      id: `prop_${Date.now()}`,
      type: body.type || 'IMPROVEMENT_IDEA',
      reason: body.reason || 'Đề xuất cải tiến MMTB mới',
      resolved: false,
      createdAt: new Date().toISOString(),
      submittedBy: { id: 'u_current', name: auth.user?.name || 'User', employeeCode: auth.user?.empCode || '202608001' },
      data_scope: assignedScope,
    };

    PROPOSALS_STORE.push(newProposal);

    return NextResponse.json({
      success: true,
      scope: assignedScope,
      data: newProposal,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
