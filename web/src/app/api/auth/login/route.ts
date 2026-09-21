import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { getRedirectRouteForUser } from '@/lib/rbac';
import { logAudit } from '@/lib/auditLogger';
import { resolveEmployeeName } from '@/lib/userProfiles';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const { empCode, password, role } = await request.json();

    const EXECUTIVE_ROLES = ['ceo', 'deputy_ceo', 'director', 'deputy_director', 'TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC', 'GIAM_DOC', 'PHO_GIAM_DOC'];

    // Database tài khoản demo chính thức cho tất cả phòng ban
    const DEMO_USERS: Record<string, {
      userId: number;
      empCode: string;
      name: string;
      title: string;
      email: string;
      phone?: string;
      roleId: number;
      roleCode: string;
      roles: string[];
      roleLevel: number;
      departmentId: number;
      departmentCode: string;
      departmentName: string;
      redirectUrl: string;
      validPasswords: string[];
    }> = {
      'TGĐ-001': {
        userId: 201,
        empCode: 'TGĐ-001',
        name: 'Tổng Giám Đốc',
        title: 'Tổng Giám Đốc Tập Đoàn TBS Group',
        email: 'tgd@tbsgroup.vn',
        roleId: 2,
        roleCode: 'TONG_GIAM_DOC',
        roles: ['ceo'],
        roleLevel: 2,
        departmentId: 1,
        departmentCode: 'BAN_GIAM_DOC',
        departmentName: 'Ban Giám Đốc Tập Đoàn',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      'PTGĐ-002': {
        userId: 202,
        empCode: 'PTGĐ-002',
        name: 'Phó Tổng Giám Đốc',
        title: 'Phó Tổng Giám Đốc Vận Hành & Chuỗi Cung Ứng',
        email: 'ptgd@tbsgroup.vn',
        roleId: 3,
        roleCode: 'PHO_TONG_GIAM_DOC',
        roles: ['deputy_ceo'],
        roleLevel: 2,
        departmentId: 2,
        departmentCode: 'VAN_HANH',
        departmentName: 'Ban Giám Đốc Vận Hành',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      'GĐ-003': {
        userId: 203,
        empCode: 'GĐ-003',
        name: 'Giám Đốc',
        title: 'Giám Đốc Khối Sản Xuất & Tổ Hợp Nhà Máy',
        email: 'gd@tbsgroup.vn',
        roleId: 4,
        roleCode: 'GIAM_DOC',
        roles: ['director'],
        roleLevel: 2,
        departmentId: 3,
        departmentCode: 'SAN_XUAT',
        departmentName: 'Khối Sản Xuất & Nhà Máy',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      'PGĐ-004': {
        userId: 204,
        empCode: 'PGĐ-004',
        name: 'Phó Giám Đốc',
        title: 'Phó Giám Đốc Quản Lý Chất Lượng (QC) & Gemba',
        email: 'pgd@tbsgroup.vn',
        roleId: 5,
        roleCode: 'PHO_GIAM_DOC',
        roles: ['deputy_director'],
        roleLevel: 2,
        departmentId: 4,
        departmentCode: 'CHAT_LUONG_QC',
        departmentName: 'Khối Quản Lý Chất Lượng (QC)',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },

      '202608001': {
        userId: 205,
        empCode: '202608001',
        name: 'Phạm Nguyễn Anh Huy',
        title: 'IT - Team Chuyển Đổi Số',
        email: 'anhy.work.2004@gmail.com',
        phone: '0522511245',
        roleId: 6,
        roleCode: 'TRUONG_PHONG',
        roles: ['employee', 'department_head', 'ci', 'admin'],
        roleLevel: 3,
        departmentId: 9,
        departmentCode: 'IT_CDS',
        departmentName: 'IT - Team Chuyển Đổi Số',
        redirectUrl: '/work',
        validPasswords: ['21032004', '123456', 'Admin@123456'],
      },
      '202608002': {
        userId: 206,
        empCode: '202608002',
        name: 'Trần Ngọc Huy',
        title: 'Kỹ Sư IT - Team Chuyển Đổi Số',
        email: 'tranhuy110421@gmail.com',
        phone: '0522511246',
        roleId: 6,
        roleCode: 'TRUONG_PHONG',
        roles: ['employee', 'department_head', 'ci', 'admin'],
        roleLevel: 3,
        departmentId: 9,
        departmentCode: 'IT_CDS',
        departmentName: 'IT - Team Chuyển Đổi Số',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      'LT-001': {
        userId: 215,
        empCode: 'LT-001',
        name: 'Lễ Tân Văn Phòng',
        title: 'Chuyên Viên Lễ Tân Văn Phòng',
        email: 'letan@tbsgroup.vn',
        phone: '0522511246',
        roleId: 9,
        roleCode: 'LE_TAN',
        roles: ['employee', 'receptionist'],
        roleLevel: 4,
        departmentId: 6,
        departmentCode: 'NHAN_SU',
        departmentName: 'Nhân Sự - Hành Chánh',
        redirectUrl: '/rooms',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      'NS-001': {
        userId: 208,
        empCode: 'NS-001',
        name: 'Nguyễn Thị Lan Anh',
        title: 'Trưởng Phòng Nhân Sự',
        email: 'ns001@tbsgroup.vn',
        phone: '0988100001',
        roleId: 6,
        roleCode: 'TRUONG_PHONG',
        roles: ['employee', 'department_head', 'hr'],
        roleLevel: 3,
        departmentId: 6,
        departmentCode: 'NHAN_SU',
        departmentName: 'Nhân Sự - Hành Chánh',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      'KT-001': {
        userId: 210,
        empCode: 'KT-001',
        name: 'Trần Thị Thu Hương',
        title: 'Trưởng Phòng Kế Toán',
        email: 'kt001@tbsgroup.vn',
        phone: '0988200001',
        roleId: 6,
        roleCode: 'TRUONG_PHONG',
        roles: ['employee', 'department_head', 'accountant'],
        roleLevel: 3,
        departmentId: 7,
        departmentCode: 'KE_TOAN',
        departmentName: 'Kế Toán & Quản Trị Tài Chính',
        redirectUrl: '/finance',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      'QC-001': {
        userId: 214,
        empCode: 'QC-001',
        name: 'Bùi Thị Hằng',
        title: 'Quản Lý QC & Kiểm Soát Chất Lượng',
        email: 'qc001@tbsgroup.vn',
        phone: '0988400001',
        roleId: 10,
        roleCode: 'QC_MANAGER',
        roles: ['employee', 'qc'],
        roleLevel: 3,
        departmentId: 4,
        departmentCode: 'CHAT_LUONG_QC',
        departmentName: 'Khối Quản Lý Chất Lượng (QC)',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      'BT-001': {
        userId: 216,
        empCode: 'BT-001',
        name: 'Phạm Văn Bảo',
        title: 'Kỹ Thuật Viên Bảo Trì Trưởng',
        email: 'bt001@tbsgroup.vn',
        phone: '0988500001',
        roleId: 8,
        roleCode: 'KY_THUAT_VIEN',
        roles: ['employee', 'maintenance'],
        roleLevel: 4,
        departmentId: 3,
        departmentCode: 'SAN_XUAT',
        departmentName: 'Tổ Hợp Nhà Máy & Sản Xuất',
        redirectUrl: '/maintenance',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      'LG-001': {
        userId: 219,
        empCode: 'LG-001',
        name: 'Nguyễn Văn Minh',
        title: 'Trưởng Phòng Logistics',
        email: 'lg001@tbsgroup.vn',
        phone: '0988600001',
        roleId: 6,
        roleCode: 'TRUONG_PHONG',
        roles: ['employee', 'department_head', 'logistics'],
        roleLevel: 3,
        departmentId: 10,
        departmentCode: 'LOGISTICS_TTPP',
        departmentName: 'Logistics - KH Chuẩn Bị TTPP',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      'RD-001': {
        userId: 212,
        empCode: 'RD-001',
        name: 'Võ Thị Kim Loan',
        title: 'Trưởng Phòng R&D',
        email: 'rd001@tbsgroup.vn',
        phone: '0988300001',
        roleId: 6,
        roleCode: 'TRUONG_PHONG',
        roles: ['employee', 'department_head', 'rd'],
        roleLevel: 3,
        departmentId: 8,
        departmentCode: 'RD_PHAT_TRIEN',
        departmentName: 'R&D - Phát Triển Sản Phẩm',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      '210602002': {
        userId: 301,
        empCode: '210602002',
        name: 'Trần Thị Ngoan',
        title: 'Chuyên Viên IE & Phê Duyệt Sáng Kiến Kaizen',
        email: '210602002@tbsgroup.vn',
        phone: '0901234567',
        roleId: 6,
        roleCode: 'IE',
        roles: ['employee', 'ie', 'ci', 'ci_lead', 'approver'],
        roleLevel: 2,
        departmentId: 12,
        departmentCode: 'KY_THUAT_IE',
        departmentName: 'Kỹ Thuật Công Nghiệp (IE)',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
      '201711002': {
        userId: 302,
        empCode: '201711002',
        name: 'Cán Bộ IE (201711002)',
        title: 'Chuyên Viên IE & Phê Duyệt Sáng Kiến Kaizen',
        email: '201711002@tbsgroup.vn',
        phone: '0901234568',
        roleId: 6,
        roleCode: 'IE',
        roles: ['employee', 'ie', 'ci', 'ci_lead', 'approver'],
        roleLevel: 2,
        departmentId: 12,
        departmentCode: 'KY_THUAT_IE',
        departmentName: 'Kỹ Thuật Công Nghiệp (IE)',
        redirectUrl: '/work',
        validPasswords: ['123456', '21032004', 'Admin@123456'],
      },
    };

    const cleanEmpCode = (empCode || role || '').trim();

    // Map role alias if role code provided instead of MSNV
    const ROLE_ALIAS_MAP: Record<string, string> = {
      ceo: '202608001',
      deputy_ceo: '202608001',
      director: '202608001',
      deputy_director: '202608001',
      receptionist: '202206011',
      letan: '202206011',
      'lt-001': '202206011',
      department_head_ci: '202608001',
      department_head_hr: '202608003',
      department_head_kt: '210602002',
      qc_manager: '202608003',
      maintenance_lead: '202112003',
      logistics_head: '202112003',
      rd_head: '202608001',
      admin: '202608001',
      ie: '210602002',
      tranthingoan: '210602002',
      ngoan: '210602002',
    };

    const targetEmpCode = ROLE_ALIAS_MAP[cleanEmpCode] || cleanEmpCode;
    const demoUser = DEMO_USERS[targetEmpCode];

    if (demoUser) {
      if (!password) {
        return NextResponse.json({ error: 'Vui lòng nhập mật khẩu xác thực' }, { status: 400 });
      }

      if (demoUser.validPasswords.includes(password) || password === '123456' || password === '21032004' || password === 'Admin@123456') {
        const payload = {
          userId: demoUser.userId,
          empCode: demoUser.empCode,
          name: demoUser.name,
          title: demoUser.title,
          email: demoUser.email,
          phone: demoUser.phone,
          roleId: demoUser.roleId,
          roleCode: demoUser.roleCode,
          roles: demoUser.roles,
          roleLevel: demoUser.roleLevel,
          departmentId: demoUser.departmentId,
          departmentCode: demoUser.departmentCode,
          departmentName: demoUser.departmentName,
          redirectUrl: demoUser.redirectUrl,
        };

        const token = await signToken(payload);

        // Record Central Audit Event for successful login
        await logAudit(request, {
          empCode: demoUser.empCode,
          empName: demoUser.name,
          roleCode: demoUser.roleCode,
          module: 'AUTH',
          action: 'LOGIN_SUCCESS',
          status: 'SUCCESS',
          changesJson: { status: 'SUCCESS', name: demoUser.name, empCode: demoUser.empCode }
        }).catch(() => {});

        return NextResponse.json({
          success: true,
          token,
          user: payload,
          redirectUrl: demoUser.redirectUrl,
        });
      } else {
        // Record Central Audit Event for failed login
        await logAudit(request, {
          empCode: demoUser.empCode,
          empName: demoUser.name,
          roleCode: demoUser.roleCode,
          module: 'AUTH',
          action: 'LOGIN_FAILED',
          status: 'FAILED',
          changesJson: { status: 'FAILED', reason: 'Mật khẩu không chính xác' }
        }).catch(() => {});

        return NextResponse.json({ error: 'Mật khẩu không chính xác' }, { status: 401 });
      }
    }

    // Fallback cho MSNV tùy chỉnh nhập trực tiếp
    if (!password) {
      return NextResponse.json({ error: 'Vui lòng nhập mật khẩu' }, { status: 400 });
    }

    const resolvedName = resolveEmployeeName(cleanEmpCode);
    const payload = {
      userId: 888,
      empCode: cleanEmpCode,
      name: resolvedName !== "Không xác định" ? resolvedName : `Nhân Viên (${cleanEmpCode})`,
      title: 'Chuyên Viên Vận Hành',
      email: `${cleanEmpCode}@tbsgroup.vn`,
      roleId: 7,
      roleCode: 'NHAN_VIEN',
      roles: ['employee'],
      roleLevel: 4,
      departmentId: 11,
      departmentCode: 'TO_HOP_NHA_MAY',
      departmentName: 'Văn Phòng Chuỗi SKECHERS',
      redirectUrl: '/work',
    };

    const token = await signToken(payload);

    // Record Central Audit Event for fallback login
    await logAudit(request, {
      empCode: cleanEmpCode,
      empName: resolvedName,
      roleCode: 'NHAN_VIEN',
      module: 'AUTH',
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      changesJson: { status: 'SUCCESS', empCode: cleanEmpCode }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      token,
      user: payload,
      redirectUrl: '/work',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


