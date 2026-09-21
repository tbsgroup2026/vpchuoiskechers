import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
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
    const user = SYSTEM_USERS[empCode];
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: User profile not found' },
        { status: 401 }
      );
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
