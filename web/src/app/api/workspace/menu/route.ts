import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const MANDATORY_ROUTES = [
  { route: '/work/room-booking', label: 'Đăng Ký Phòng Họp', icon: 'IconCalendar', isMandatory: true },
  { route: '/work/business-trip', label: 'Đăng Ký Công Tác', icon: 'IconBriefcase', isMandatory: true },
];

const MINIMAL_FALLBACK_ROUTES = [
  { route: '/work?dept=my-tasks', label: 'Công Việc Của Tôi', icon: 'IconChecklist', isMandatory: true },
  { route: '/work/kaizen/register', label: 'Đề Xuất Kaizen', icon: 'IconSparkles', isMandatory: false },
  { route: '/work/room-booking', label: 'Đăng Ký Phòng Họp', icon: 'IconCalendar', isMandatory: true },
  { route: '/work/business-trip', label: 'Đăng Ký Công Tác', icon: 'IconBriefcase', isMandatory: true },
  { route: '/work/notifications', label: 'Thông Báo Cá Nhân', icon: 'IconBell', isMandatory: false },
  { route: '/work/payroll/me', label: 'Bảng Lương Của Tôi', icon: 'IconReceipt', isMandatory: false },
];

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role');

    let roleCode = 'NHAN_VIEN';
    if (session) {
      roleCode = (session as any).roleCode || (session as any).role || 'NHAN_VIEN';
    } else if (roleParam) {
      roleCode = roleParam;
    }

    const db = getDbBinding();

    if (db) {
      await ensureKaizenSchema(db);

      const query = `
        SELECT * FROM role_workspace_config
        WHERE UPPER(role) = UPPER(?)
        ORDER BY sort_order ASC, created_at ASC
      `;

      const { results } = await db.prepare(query).bind(roleCode).all();

      let configuredRoutes: any[] = [];
      if (results && results.length > 0) {
        configuredRoutes = results.map((r: any) => ({
          route: r.route,
          label: r.label,
          icon: r.icon || 'IconChevronRight',
          sortOrder: r.sort_order || 0,
          isMandatory: false,
        }));
      } else {
        console.warn(`[WORKSPACE_CONFIG_WARN] Role chưa có cấu hình: ${roleCode}. Áp dụng fallback tối thiểu.`);
        configuredRoutes = MINIMAL_FALLBACK_ROUTES;
      }

      // Ensure the 2 mandatory routes are always included
      const mergedRoutes = [...configuredRoutes];
      for (const mand of MANDATORY_ROUTES) {
        if (!mergedRoutes.some((item) => item.route === mand.route)) {
          mergedRoutes.push(mand);
        }
      }

      return NextResponse.json({
        success: true,
        role: roleCode,
        menu: mergedRoutes,
        isFallback: !results || results.length === 0,
      });
    }

    return NextResponse.json({
      success: true,
      role: roleCode,
      menu: MINIMAL_FALLBACK_ROUTES,
      isFallback: true,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Lỗi truy vấn menu workspace' }, { status: 500 });
  }
}
