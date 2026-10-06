import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}
import { SYSTEM_USERS } from '@/lib/userProfiles';
import { getEffectivePermissions, getAllowedModulesForUser } from '@/lib/authorizationEngine';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const verified = await verifyToken(token);
    if (!verified || !verified.empCode) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token payload' },
        { status: 401 }
      );
    }

    const empCode = verified.empCode;
    let user = SYSTEM_USERS[empCode];
    
    const db = getDbBinding();
    let dbUser = null;
    if (db) {
      try {
        dbUser = await db.prepare("SELECT * FROM sys_users WHERE UPPER(emp_code) = UPPER(?) OR UPPER(id) = UPPER(?)").bind(empCode, empCode).first();
      } catch (e) {}
    }

    if (!dbUser && !user) {
      if (verified.isGuest || verified.roleCode === 'JUDGE_GUEST' || empCode?.startsWith('GUEST_')) {
        return NextResponse.json({
          success: true,
          user: {
            userId: verified.userId || 99999,
            empCode: verified.empCode,
            name: verified.name || 'BGK Khách Mời',
            title: 'BGK Khách Mời chấm thi',
            department: 'Hội Đồng BGK',
            departmentCode: 'BGK_GUEST',
            roleCode: verified.roleCode || 'JUDGE_GUEST',
            roles: verified.roles || ['judge_guest'],
            roleLevel: 3,
            managementLevel: 3,
            isGuest: true,
            username: verified.username || '',
            redirectUrl: '/work/kaizen/van-phong-chuoi',
            allowedScopes: ['GUEST'],
          },
          permissions: {},
          allowedModules: ['kaizen'],
        });
      }
      return NextResponse.json(
        { success: false, error: 'Unauthorized: User profile not found in database' },
        { status: 401 }
      );
    }

    if (dbUser && dbUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: User account is inactive' },
        { status: 401 }
      );
    }

    if (dbUser && !user) {
      user = {
        userId: dbUser.id as any,
        empCode: dbUser.emp_code as string,
        name: dbUser.name as string || `Nhân Viên (${dbUser.emp_code})`,
        title: dbUser.title as string || 'Chuyên Viên Vận Hành',
        department: dbUser.department as string || 'Văn Phòng Chuỗi SKECHERS',
        roleCode: dbUser.role_code as string || 'CBCNV',
        roles: ['employee'],
        roleLevel: 4,
        avatar: '',
        redirectUrl: '/work',
      };
    }

    const permissions = getEffectivePermissions(user);
    const allowedModules = getAllowedModulesForUser(user);

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        empCode: user.empCode,
        name: user.name,
        title: user.title,
        department: user.department,
        departmentCode: user.managedDepartmentId || 'IT_CDS',
        roleCode: user.roleCode,
        roles: user.roles,
        roleLevel: user.roleLevel,
        managementLevel: user.roleLevel,
        avatar: user.avatar,
        redirectUrl: user.redirectUrl,
        allowedScopes: user.allowedScopes || ['ALL'],
      },
      permissions,
      allowedModules,
      projects: [
        {
          id: 'PROJ-01',
          code: 'PROJ-DIGITAL-2026',
          name: 'Chuyển Đổi Số SKECHERS 2026',
          role: 'PROJECT_MANAGER',
        },
      ],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
