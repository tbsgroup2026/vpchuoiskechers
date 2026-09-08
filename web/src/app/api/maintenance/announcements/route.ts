import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      {
        id: 'ann_1',
        title: 'Bảo trì định kỳ hệ thống máy may Chuyền 1',
        content: 'Thực hiện kiểm tra dầu bôi trơn và vệ sinh kim định kỳ cho 20 máy may tự động.',
        image: null,
        createdBy: { name: 'Nguyễn Văn Nam', employeeCode: 'TBS-101' },
        targetFactory: { id: 'fac_1', name: 'Nhà Máy Kiên Giang 1' },
        targetRole: 'MAINTENANCE',
        createdAt: new Date().toISOString(),
      },
    ],
  });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Created announcement' });
}
