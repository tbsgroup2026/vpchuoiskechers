import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      { id: 'fc_1', name: 'Lỗi Cơ Khí (Đứt chỉ, gãy kim, kẹt ổ)', isOther: false, order: 1, scopeCategoryId: null },
      { id: 'fc_2', name: 'Lỗi Điện & Cảm Biến (Mất nguồn, báo lỗi E01-E99)', isOther: false, order: 2, scopeCategoryId: null },
      { id: 'fc_3', name: 'Lỗi Khí Nén & Thủy Lực (Rò rỉ khí, tụt áp)', isOther: false, order: 3, scopeCategoryId: null },
      { id: 'fc_4', name: 'Lỗi Khác', isOther: true, order: 4, scopeCategoryId: null },
    ],
  });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Saved failure category' });
}
