import { NextResponse } from 'next/server';
import { getAuthUser, JWTPayload } from '@/lib/auth';

export type AuthSession = JWTPayload;

const DEV_MOCK_SESSION: AuthSession = {
  userId: -1,
  empCode: 'DEV-MOCK',
  name: 'Dev Mock (local only)',
  roleId: 1,
  roleCode: 'SUPER_ADMIN',
  roleLevel: 1,
  departmentId: 1,
  departmentCode: 'IT_DIGITAL',
};

// Chỉ bật khi đồng thời: chạy next dev (NODE_ENV=development) + cờ tường minh + KHÔNG phải staging/production.
function devAuthEnabled(): boolean {
  const env = process.env.ENVIRONMENT;
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_DEV_AUTH === 'true' &&
    env !== 'production' &&
    env !== 'staging'
  );
}

type Options = {
  /** roleLevel càng nhỏ quyền càng cao (1 = SUPER_ADMIN, 2 = BGĐ, 3 = Trưởng phòng, 4 = Nhân viên). Bỏ trống = chỉ cần đăng nhập. */
  maxRoleLevel?: number;
};

export async function requireAuth(
  request: Request,
  opts: Options = {},
): Promise<{ session: AuthSession; response?: undefined } | { session?: undefined; response: NextResponse }> {
  let session = await getAuthUser(request);

  if (!session || !session.empCode) {
    if (devAuthEnabled()) {
      session = DEV_MOCK_SESSION;
    } else {
      return {
        response: NextResponse.json(
          { success: false, error: 'Yêu cầu đăng nhập (401 Unauthorized)' },
          { status: 401 },
        ),
      };
    }
  }

  if (opts.maxRoleLevel !== undefined && (session.roleLevel ?? 99) > opts.maxRoleLevel) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Không đủ quyền thực hiện thao tác này (403 Forbidden)' },
        { status: 403 },
      ),
    };
  }

  return { session };
}
