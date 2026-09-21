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
        id: 'ann_1',
        title: 'Bảo trì định kỳ hệ thống MMTB',
        content: 'Thực hiện kiểm tra dầu bôi trơn và vệ sinh kim định kỳ cho các thiết bị thuộc đơn vị.',
        image: null,
        createdBy: { name: 'Nguyễn Văn Nam', employeeCode: 'TBS-101' },
        createdAt: new Date().toISOString(),
      },
    ],
  });
}

export async function POST(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  return NextResponse.json({ success: true, scope: auth.scope, message: 'Created announcement' });
}
