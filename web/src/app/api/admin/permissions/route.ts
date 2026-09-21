import { NextResponse } from 'next/server';
import { SYSTEM_USERS } from '@/lib/userProfiles';
import { getEffectivePermissions, getAllowedModulesForUser } from '@/lib/authorizationEngine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inspectEmpCode = searchParams.get('empCode');

    if (inspectEmpCode) {
      const user = SYSTEM_USERS[inspectEmpCode];
      if (!user) {
        return NextResponse.json({ error: 'Không tìm thấy nhân viên' }, { status: 404 });
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
          managedDepartmentId: user.managedDepartmentId,
          roleCode: user.roleCode,
          roles: user.roles,
          roleLevel: user.roleLevel,
          managementLevel: user.roleLevel,
          avatar: user.avatar,
        },
        permissions,
        allowedModules,
      });
    }

    // Return list of all employees for Admin Inspector dropdown
    const userList = Object.values(SYSTEM_USERS).map((u) => ({
      userId: u.userId,
      empCode: u.empCode,
      name: u.name,
      title: u.title,
      department: u.department,
      roleCode: u.roleCode,
      roles: u.roles,
      avatar: u.avatar,
    }));

    return NextResponse.json({
      success: true,
      users: userList,
      total: userList.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inspecting permissions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
