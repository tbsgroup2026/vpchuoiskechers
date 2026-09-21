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
    data: [],
  });
}
