import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      {
        id: 'fl_1',
        name: 'Tầng 1 - Phân Xưởng May A',
        imageUrl: '/images/floor-plan-sample.png',
        factoryId: 'fac_1',
      },
    ],
  });
}
