import { NextResponse } from 'next/server';
import { verifyToken, getAuthUser, isAdminUser } from '@/lib/auth';
import { SYSTEM_USERS, getUserProfileInfo, setUserProfileInfo, getUserAvatar } from '@/lib/userProfiles';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie') || '';
    let token = authHeader?.replace('Bearer ', '');
    if (!token) {
      const match = cookieHeader.match(/tbs_token=([^;]+)/);
      if (match && match[1]) {
        token = match[1];
      }
    }

    const session = token ? await verifyToken(token) : null;
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const empCode = String(session.empCode);
    const sysUser = SYSTEM_USERS[empCode];
    const customInfo = getUserProfileInfo(empCode);
    const avatar = getUserAvatar(empCode) || sysUser?.avatar || session.avatar || '';

    const profileData = {
      emp_code: empCode,
      empCode: empCode,
      name: customInfo?.name || sysUser?.name || session.name || `Cán Bộ Nhân Viên (${empCode})`,
      title: customInfo?.title || sysUser?.title || session.title || 'Cán Bộ Công Nhân Viên',
      department: customInfo?.department || sysUser?.department || session.departmentCode || 'TBS Group',
      email: customInfo?.email || sysUser?.email || session.email || `${empCode}@tbsgroup.vn`,
      phone: customInfo?.phone || sysUser?.phone || session.phone || '',
      role_code: sysUser?.roleCode || session.roleCode || 'CBCNV',
      roleLevel: sysUser?.roleLevel || session.roleLevel || 4,
      avatar: avatar,
      avatar_url: avatar,
    };

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để cập nhật hồ sơ cá nhân (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const targetEmpCode = body.empCode || body.emp_code || session.empCode;

    // IDOR Protection: Cannot modify another user's profile unless Admin
    if (targetEmpCode !== session.empCode && !isAdminUser(session)) {
      return NextResponse.json(
        { success: false, error: 'BẢO MẬT: Bạn không có quyền chỉnh sửa hồ sơ của nhân viên khác! (403 Forbidden)' },
        { status: 403 }
      );
    }

    if (typeof window !== 'undefined' || typeof globalThis !== 'undefined') {
      setUserProfileInfo(targetEmpCode, body);
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công',
      data: body,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
