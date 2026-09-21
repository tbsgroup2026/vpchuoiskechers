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
      { id: 'fc_1', name: 'Lỗi Cơ Khí (Đứt chỉ, gãy kim, kẹt ổ)', isOther: false, order: 1, scopeCategoryId: null },
      { id: 'fc_2', name: 'Lỗi Điện & Cảm Biến (Mất nguồn, báo lỗi E01-E99)', isOther: false, order: 2, scopeCategoryId: null },
      { id: 'fc_3', name: 'Lỗi Khí Nén & Thủy Lực (Rò rỉ khí, tụt áp)', isOther: false, order: 3, scopeCategoryId: null },
      { id: 'fc_4', name: 'Lỗi Khác', isOther: true, order: 4, scopeCategoryId: null },
    ],
  });
}

export async function POST(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  return NextResponse.json({ success: true, scope: auth.scope, message: 'Saved failure category' });
}
