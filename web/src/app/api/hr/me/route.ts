import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSystemUser, normalizeEmpCode } from "@/lib/userProfiles";

/**
/api/hr/me
 * API bảo mật lấy dữ liệu nhân sự cá nhân của CHÍNH NGƯỜI DÙNG đang đăng nhập.
 *
 * QUY TẮC BẢO MẬT SERVER-SIDE:
 * 1. Tự động trích xuất empCode từ Cookie / Header Token của Session hiện tại.
 * 2. CỐ TÌNH BỎ QUA mọi tham số query như ?empCode=xxx hay ?employeeId=yyy để chống tấn công IDOR.
 * 3. Kiểm tra quyền truy cập đối với dữ liệu nhạy cảm (Lương, Đánh giá).
 */
export async function GET(request: Request) {
  try {
    // 1. Xác thực session user từ token / cookie phía server
    const authUser = await getAuthUser(request);
    
    if (!authUser || !authUser.empCode) {
      return NextResponse.json(
        { success: false, error: "Chưa đăng nhập hoặc phiên làm việc hết hạn." },
        { status: 401 }
      );
    }

    const currentEmpCode = normalizeEmpCode(authUser.empCode);
    const userProfile = getSystemUser(currentEmpCode);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ người dùng trong hệ thống." },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const section = url.searchParams.get("section") || "all";

    // Ghi nhận log cảnh báo nếu phát hiện ai đó cố truyền employeeId / empCode của người khác qua URL query
    const attemptedTargetCode = url.searchParams.get("empCode") || url.searchParams.get("employeeId");
    if (attemptedTargetCode && normalizeEmpCode(attemptedTargetCode) !== currentEmpCode) {
      console.warn(
        `[SECURITY AUDIT] User ${currentEmpCode} tried to access data for ${attemptedTargetCode}. Access DENIED. Forcing self data.`
      );
    }

    // Response object chứa dữ liệu cá nhân của CHÍNH user này
    const personalData = {
      profile: {
        userId: userProfile.userId,
        empCode: userProfile.empCode,
        name: userProfile.name,
        title: userProfile.title,
        department: userProfile.department,
        email: userProfile.email,
        phone: userProfile.phone || "Chưa cập nhật",
        avatar: userProfile.avatar,
        roleCode: userProfile.roleCode,
        joinDate: "01/03/2024", // TODO: Lấy từ bảng nhân sự DB khi kết nối D1
        status: "CHÍNH THỨC",
      },
      leave: {
        totalDays: 12,
        usedDays: 3,
        remainingDays: 9,
        // TODO: Đấu nối API lấy danh sách đơn phép thực tế từ DB hr_leave_requests theo currentEmpCode
        history: [],
      },
      attendance: {
        workingDaysThisMonth: 18,
        lateDays: 0,
        earlyLeaveDays: 0,
        // TODO: Đấu nối API log chấm công thực tế từ máy chấm công / DB hr_attendance theo currentEmpCode
        records: [],
      },
      evaluation: {
        // Dữ liệu đánh giá nhạy cảm - Chỉ trả đúng tài khoản sở hữu
        lastQuarterGrade: "A",
        kpiScore: "92/100",
        // TODO: Đấu nối API lấy kỳ đánh giá thực tế từ DB hr_evaluations
        evaluations: [],
      },
      training: {
        completedCourses: 4,
        inProgressCourses: 1,
        certificates: ["Chứng chỉ An Toàn Lao Động 2025", "Khóa Học Kỹ Năng Quản Lý"],
        // TODO: Lấy danh sách khóa học thực tế từ DB hr_training
        courses: [],
      },
      payroll: {
        // Dữ liệu lương nhạy cảm - Kiểm tra sở hữu nghiêm ngặt
        ownerEmpCode: currentEmpCode,
        hasPayslip: true,
        month: "08/2026",
        // TODO: Kết nối API bảng lương bảo mật D1 hr_payroll theo currentEmpCode
        payslips: [],
      },
      documents: {
        contractType: "Hợp đồng Lao động Không xác định thời hạn",
        contractNumber: `HDLD-TBS-${currentEmpCode}`,
        signDate: "01/03/2024",
        // TODO: Lấy danh sách văn bản / quyết định cá nhân từ DB hr_documents
        files: [],
      },
      requests: {
        totalSubmitted: 5,
        pending: 1,
        approved: 4,
        // TODO: Lấy danh sách đơn từ hành chính cá nhân từ DB hr_user_requests
        items: [],
      },
    };

    if (section !== "all" && section in personalData) {
      return NextResponse.json({
        success: true,
        section,
        data: (personalData as any)[section],
        serverUser: currentEmpCode,
      });
    }

    return NextResponse.json({
      success: true,
      data: personalData,
      serverUser: currentEmpCode,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Lỗi kết nối máy chủ";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
