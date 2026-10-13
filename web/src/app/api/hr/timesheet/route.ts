import { NextResponse } from 'next/server';
import { calculateWorkingHours } from '@/lib/hrLogic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { checkIn, checkOut, isNightShift } = body;
    
    if (!checkIn) {
      return NextResponse.json({ error: 'Missing checkIn time' }, { status: 400 });
    }

    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : null;
    
    const result = calculateWorkingHours(start, end, isNightShift || false);

    return NextResponse.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
