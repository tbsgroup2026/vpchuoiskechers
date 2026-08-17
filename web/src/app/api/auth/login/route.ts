import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { getRedirectRouteForUser } from '@/lib/rbac';

export async function POST(request: Request) {
  try {
    const { empCode, password, role } = await request.json();

    const EXECUTIVE_ROLES = ['ceo', 'deputy_ceo', 'director', 'deputy_director', 'TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC', 'GIAM_DOC', 'PHO_GIAM_DOC'];

    // Check Executive Roles (Tổng Giám Đốc, Phó Tổng Giám Đốc, Giám Đốc, Phó Giám Đốc)
    if (role && EXECUTIVE_ROLES.includes(role)) {
      if (!password) {
        return NextResponse.json({ error: 'Vui lòng nhập mật khẩu xác thực' }, { status: 400 });
      }

      const roleNames: Record<string, string> = {
        ceo: 'Tổng Giám Đốc TBS Group',
        deputy_ceo: 'Phó Tổng Giám Đốc TBS Group',
        director: 'Giám Đốc Chuỗi Skechers',
        deputy_director: 'Phó Giám Đốc Chuỗi Skechers',
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

    // User 0.1: MSNV 202608001 (Phạm Nguyễn Anh Huy)
    if (empCode === '202608001' && password === '21032004') {
      const payload = {
        userId: 100,
        empCode: '202608001',
        name: 'Phạm Nguyễn Anh Huy',
        title: 'IT - Team chuyển đổi số',
        email: 'anhy.work.2004@gmail.com',
        phone: '0522511245',
        roleId: 1,
        roleCode: 'SUPER_ADMIN',
        roleLevel: 1,
        departmentId: 11,
        departmentCode: 'IT_DIGITAL',
        departmentName: 'IT - Team chuyển đổi số',
      };

      const token = await signToken(payload);

      return NextResponse.json({
        success: true,
        token,
        user: payload,
        redirectUrl: '/work',
      });
    }

    // User 0.2: MSNV 202608002 (Trần Ngọc Huy)
    if (empCode === '202608002' && password === '123456') {
      const payload = {
        userId: 101,
        empCode: '202608002',
        name: 'Trần Ngọc Huy',
        title: 'IT - Team chuyển đổi số',
        email: 'tranhuy110421@gmail.com',
        roleId: 1,
        roleCode: 'SUPER_ADMIN',
        roleLevel: 1,
        departmentId: 11,
        departmentCode: 'IT_DIGITAL',
        departmentName: 'IT - Team chuyển đổi số',
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
      const cleanEmpCode = (empCode || '').trim();
      const knownNames: Record<string, { name: string; title: string; dept: string }> = {
        '202608001': { name: 'Phạm Nguyễn Anh Huy', title: 'Trưởng Phòng CN-CI', dept: 'CN-CI (Cải Tiến Liên Tục)' },
        '202608002': { name: 'Trần Ngọc Huy', title: 'Lễ Tân Văn Phòng', dept: 'Nhân Sự - Hành Chánh' },
        'EMP-004': { name: 'Phạm Văn Bảo Trì', title: 'Kỹ Thuật Viên Bảo Trì', dept: 'Tổ Hợp Nhà Máy & Sản Xuất' },
      };

      const matched = knownNames[cleanEmpCode] || (cleanEmpCode === '202608001' ? {
        name: 'Phạm Nguyễn Anh Huy',
        title: 'Trưởng Phòng CN-CI',
        dept: 'CN-CI (Cải Tiến Liên Tục)',
      } : {
        name: cleanEmpCode ? `Nhân Viên (${cleanEmpCode})` : 'Phạm Nguyễn Anh Huy',
        title: 'Cán Bộ Công Nhân Viên',
        dept: 'Văn Phòng Chuỗi SKECHERS',
      });

      const payload = {
        userId: 888,
        empCode: cleanEmpCode || empCode,
        name: matched.name,
        title: matched.title,
        roleId: 4,
        roleCode: 'STAFF',
        roleLevel: 4,
        departmentId: 2,
        departmentCode: 'SAN_XUAT',
        departmentName: matched.dept,
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
