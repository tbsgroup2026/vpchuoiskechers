import { NextResponse } from 'next/server';
import { validateScopeAuthorization, logSecurityAudit } from '@/lib/scopeAuth';
import { EquipmentScope } from '@/lib/equipmentScope';

let CATEGORIES_STORE = [
  // Danh mục GLOBAL dùng chung
  { id: 'cat_g1', code: 'CAT-GLOBAL-01', name: 'Tiêu Chuẩn Bảo Trì Toàn Tập Đoàn', is_global: true, data_scope: 'GLOBAL' },
  // Danh mục OFFICE
  { id: 'cat_off1', code: 'CAT-OFF-01', name: 'Danh Mục Thiết Bị Văn Phòng Chuỗi', is_global: false, data_scope: 'OFFICE' as EquipmentScope },
  // Danh mục EAST
  { id: 'cat_east1', code: 'CAT-EAST-01', name: 'Danh Mục Máy Cắt NM Miền Đông', is_global: false, data_scope: 'EAST' as EquipmentScope },
  // Danh mục KIEN_GIANG
  { id: 'cat_kg1', code: 'CAT-KG-01', name: 'Danh Mục Dây Chuyền Ép Đế Kiên Giang', is_global: false, data_scope: 'KIEN_GIANG' as EquipmentScope },
];

export async function GET(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  const { scope } = auth;

  let categories = CATEGORIES_STORE;
  if (scope !== 'ALL') {
    // Trả về danh mục thuộc đơn vị HOẶC danh mục GLOBAL
    categories = CATEGORIES_STORE.filter((c) => c.is_global || c.data_scope === scope);
  }

  return NextResponse.json({
    success: true,
    scope,
    categories,
    data: categories,
  });
}

export async function POST(request: Request) {
  const auth = validateScopeAuthorization(request);
  if (!auth.authorized || auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const user = auth.user;

    const isGlobalRequest = body.is_global === true || body.data_scope === 'GLOBAL';

    // MỤC 15.1: Kiểm tra quyền tạo Danh Mục GLOBAL (Chỉ Admin/Executive mới được phép)
    const isExecutiveOrAdmin =
      user?.roleCode === 'SUPER_ADMIN' ||
      user?.roleCode === 'ADMIN' ||
      user?.roles?.includes('admin') ||
      user?.roles?.includes('ceo') ||
      user?.empCode === '202608001' ||
      user?.empCode === 'ADMIN-2026';

    if (isGlobalRequest && !isExecutiveOrAdmin) {
      logSecurityAudit({
        empCode: user?.empCode || 'UNKNOWN',
        userName: user?.name || 'Unknown User',
        action: 'CREATE_GLOBAL_CATEGORY',
        requestedScope: 'GLOBAL',
        endpoint: '/api/maintenance/categories',
        status: 'DENIED_403',
        reason: 'Chỉ tài khoản Quản trị hệ thống / Ban Giám Đốc mới có quyền tạo danh mục GLOBAL dùng chung.',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Bạn không có quyền tạo danh mục GLOBAL dùng chung cho toàn hệ thống.',
          code: 'FORBIDDEN_GLOBAL_CATEGORY',
        },
        { status: 403 }
      );
    }

    let assignedScope: any = body.data_scope || auth.scope;
    if (assignedScope === 'ALL' || assignedScope === 'GLOBAL') {
      assignedScope = isGlobalRequest ? 'GLOBAL' : 'OFFICE';
    }

    const newCategory = {
      id: body.id || `cat_${Date.now()}`,
      code: body.code || `CAT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: body.name || 'Danh Mục Mới',
      is_global: isGlobalRequest,
      data_scope: isGlobalRequest ? 'GLOBAL' : assignedScope,
    };

    CATEGORIES_STORE.push(newCategory as any);

    return NextResponse.json({
      success: true,
      data: newCategory,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
