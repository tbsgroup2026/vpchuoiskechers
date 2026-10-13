import { NextResponse } from 'next/server';
import { calculateLeave } from '@/lib/hrLogic';

export async function POST(request: Request) {
  try {
    // In a real app, we'd verify the auth token here.
    const body = await request.json();
    const { startDate, endDate, remainingLeave, leaveType } = body;
    
    if (!startDate || !endDate || remainingLeave === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const result = calculateLeave(start, end, remainingLeave, leaveType || 'FULL');

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // In a real app, we'd save to the database here.
    return NextResponse.json({ 
      success: true, 
      message: 'Nghỉ phép thành công',
      remaining: result.remaining 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
