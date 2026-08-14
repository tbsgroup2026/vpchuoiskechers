import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { getRedirectRouteForUser } from '@/lib/rbac';

export async function POST(request: Request) {
  try {
    const { empCode, password } = await request.json();

    if (!empCode || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập mã nhân viên và mật khẩu' }, { status: 400 });
    }

    // User 0.1: Phạm Nguyễn Anh Huy - IT Team Số Hóa (Super Admin)
    if (empCode === '202608001' && password === '21032004') {
      const payload = {
        userId: 100,
        empCode: '202608001',
        name: 'Phạm Nguyễn Anh Huy',
        title: 'IT - Team Số Hóa',
        roleId: 1,
        roleCode: 'SUPER_ADMIN',
        roleLevel: 1,
        departmentId: 11,
        departmentCode: 'IT_SO_HOA',
        departmentName: 'IT - Team Số Hóa',
      };

      const token = await signToken(payload);

      return NextResponse.json({
        success: true,
        token,
        user: payload,
        redirectUrl: '/work',
      });
    }

    // User 0.2: Trần Ngọc Huy - IT Team Số Hóa (Super Admin)
    if (empCode === '202608002' && password === '123456') {
      const payload = {
        userId: 101,
        empCode: '202608002',
        name: 'Trần Ngọc Huy',
        title: 'IT - Team Số Hóa',
        roleId: 1,
        roleCode: 'SUPER_ADMIN',
        roleLevel: 1,
        departmentId: 11,
        departmentCode: 'IT_SO_HOA',
        departmentName: 'IT - Team Số Hóa',
      };

      const token = await signToken(payload);

      return NextResponse.json({
        success: true,
        token,
        user: payload,
        redirectUrl: '/work',
      });
    }

    // Demo user 1: Super Admin / Trưởng phòng SKECHERS
    if ((empCode === 'admin@tbsgroup.vn' || empCode === 'EMP-001') && password === 'Admin@123456') {
      const payload = {
        userId: 1,
        empCode: 'EMP-001',
        name: 'Trưởng Phòng Chuỗi SKECHERS',
        roleId: 1,
        roleCode: 'SUPER_ADMIN',
        roleLevel: 1,
        departmentId: 1,
        departmentCode: 'KE_HOACH_CBVT',
        departmentName: 'Kế Hoạch & Cung Ứng Vật Tư SKECHERS',
      };

      const token = await signToken(payload);
      const redirectUrl = getRedirectRouteForUser(payload);

      return NextResponse.json({
        success: true,
        token,
        user: payload,
        redirectUrl: '/work',
      });
    }

    // Demo user 2: Staff / CBCNV Thường
    if (empCode === 'EMP-002' && password === 'User@123456') {
      const payload = {
        userId: 2,
        empCode: 'EMP-002',
        name: 'Nguyễn Văn Nhân Viên SKECHERS',
        roleId: 4,
        roleCode: 'STAFF',
        roleLevel: 4,
        departmentId: 2,
        departmentCode: 'SAN_XUAT',
        departmentName: 'Phòng Sản Xuất Giày SKECHERS',
      };

      const token = await signToken(payload);

      return NextResponse.json({
        success: true,
        token,
        user: payload,
        redirectUrl: '/work',
      });
    }

    // Standard authentication against D1 database
    return NextResponse.json({ error: 'Mã nhân viên hoặc mật khẩu không chính xác' }, { status: 401 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
