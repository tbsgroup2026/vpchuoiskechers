import { NextResponse } from 'next/server';
import { calculateSalary } from '@/lib/hrLogic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { baseSalary, dependents } = body;
    
    if (baseSalary === undefined) {
      return NextResponse.json({ error: 'Missing baseSalary' }, { status: 400 });
    }

    const result = calculateSalary(baseSalary, dependents || 0);

    return NextResponse.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
