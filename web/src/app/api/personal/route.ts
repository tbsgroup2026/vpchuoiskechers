import { NextResponse } from 'next/server';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import { SYSTEM_USERS, normalizeEmpCode } from '@/lib/userProfiles';

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để xem thông tin cá nhân (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const empCode = normalizeEmpCode(session.empCode);
    const { searchParams } = new URL(request.url);
    const requestedEmpCode = searchParams.get('empCode') ? normalizeEmpCode(searchParams.get('empCode')) : null;

    // IDOR Protection: Prevent non-admin users from viewing other employees' salary/leave
    if (requestedEmpCode && requestedEmpCode !== empCode && !isAdminUser(session)) {
      return NextResponse.json(
        {
          success: false,
          error: 'BẢO MẬT: Bạn không có quyền xem bảng lương và hồ sơ cá nhân của nhân viên khác! (403 Forbidden)',
        },
        { status: 403 }
      );
    }

    const targetCode = requestedEmpCode || empCode;
    const user = SYSTEM_USERS[targetCode] || SYSTEM_USERS[empCode] || {
      empCode: targetCode,
      name: `Cán Bộ Nhân Viên (${targetCode})`,
    };

    return NextResponse.json({
      success: true,
      empCode: user.empCode,
      name: user.name,
      payroll: {
        month: 'Tháng 8/2026',
        baseSalary: '22,000,000 VNĐ',
        allowance: '3,500,000 VNĐ',
        performanceBonus: '4,000,000 VNĐ',
        totalGross: '29,500,000 VNĐ',
        netReceive: '26,850,000 VNĐ',
        paymentStatus: 'Đã chuyển khoản (05/09/2026)',
      },
      leaveBalance: {
        totalYear: 14,
        used: 4,
        remaining: 10,
        pendingApproval: 0,
      },
      performance: {
        period: 'Quý II/2026',
        ratingGrade: 'A+',
        overallScore: 9.4,
        completionRate: '96%',
        onTimeRate: '98%',
        qualityScore: 9.5,
        managerComment: 'Hoàn thành xuất sắc tiến độ tự động hóa & cải tiến hệ thống TBS Group 2026.',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching personal data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
