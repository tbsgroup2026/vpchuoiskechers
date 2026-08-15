import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { getRedirectRouteForUser } from '@/lib/rbac';

export async function POST(request: Request) {
  try {
    const { empCode, password, role } = await request.json();

    // Check Executive Roles (Tổng Giám Đốc, Phó Tổng Giám Đốc, Giám Đốc, Phó Giám Đốc)
    if (role && role !== 'CBCNV') {
      if (!password) {
        return NextResponse.json({ error: 'Vui lòng nhập mật khẩu xác thực' }, { status: 400 });
      }

      const roleNames: Record<string, string> = {
        TONG_GIAM_DOC: 'Tổng Giám Đốc TBS Group',
        PHO_TONG_GIAM_DOC: 'Phó Tổng Giám Đốc TBS Group',
        GIAM_DOC: 'Giám Đốc Chuỗi Skechers',
        PHO_GIAM_DOC: 'Phó Giám Đốc Chuỗi Skechers',
      };

      const titleName = roleNames[role] || 'Ban Giám Đốc TBS Group';

      const payload = {
        userId: 900,
        empCode: role,
        name: titleName,
        title: titleName,
        roleId: 1,
        roleCode: 'SUPER_ADMIN',
        roleLevel: 1,
        departmentId: 1,
        departmentCode: 'BAN_GIAM_DOC',
        departmentName: 'Ban Giám Đốc TBS Group',
      };

      const token = await signToken(payload);

      return NextResponse.json({
        success: true,
        token,
        user: payload,
        redirectUrl: '/work',
      });
    }

    // Check Staff Role (CBCNV - Requires MSNV + Password)
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

    // If empCode provided with correct password, allow standard login
    if (password === '123456' || password === '21032004' || password === 'Admin@123456') {
      const payload = {
        userId: 888,
        empCode: empCode,
        name: `CBCNV (${empCode})`,
        title: 'Cán Bộ Công Nhân Viên',
        roleId: 4,
        roleCode: 'STAFF',
        roleLevel: 4,
        departmentId: 2,
        departmentCode: 'SAN_XUAT',
        departmentName: 'Văn Phòng Chuỗi SKECHERS',
      };

      const token = await signToken(payload);

      return NextResponse.json({
        success: true,
        token,
        user: payload,
        redirectUrl: '/work',
      });
    }

    return NextResponse.json({ error: 'Mã nhân viên hoặc mật khẩu không chính xác' }, { status: 401 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
