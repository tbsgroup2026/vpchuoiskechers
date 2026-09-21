import { NextResponse } from 'next/server';

export async function GET() {
  const onboardingTasks = [
    {
      id: "ob_1",
      employeeName: "Nguyễn Văn Hùng",
      department: "Khối CNTT - Chuyển đổi số",
      joinDate: "2026-09-01",
      mentor: "Phạm Nguyễn Anh Huy",
      progress: 60,
      items: [
        { text: "Nhận máy tính & cấp tài khoản TBS Email", done: true },
        { text: "Đào tạo An toàn thông tin & Nội quy văn phòng", done: true },
        { text: "Bàn giao tài liệu kiến trúc hệ thống 1-5-2", done: false },
      ],
    },
  ];

  return NextResponse.json({ success: true, data: onboardingTasks });
}

export async function POST() {
  return NextResponse.json({ success: true, message: "Onboarding status updated" });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
