import { NextResponse } from 'next/server';
import { calculateSalary } from '@/lib/hrLogic';
import { verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = verifyToken(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { baseSalary, dependents, targetUserId } = body;
    
    if (baseSalary === undefined) {
      return NextResponse.json({ error: 'Missing baseSalary' }, { status: 400 });
    }

    const result = calculateSalary(baseSalary, dependents || 0);

    return NextResponse.json({ 
      success: true, 
      data: result,
      targetUserId: targetUserId || user.userId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
