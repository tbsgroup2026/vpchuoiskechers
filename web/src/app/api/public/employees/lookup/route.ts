import { NextResponse } from 'next/server';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const msnv = searchParams.get('msnv')?.trim().toUpperCase();
    
    if (!msnv) {
      return NextResponse.json({ success: false, error: 'MSNV is required' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not found' }, { status: 500 });
    }

    // Rate Limit Check (Basic by IP)
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const limitCheck: any = await db.prepare(`
      SELECT COUNT(*) as cnt FROM rate_limit_log 
      WHERE ip_address = ? AND endpoint = '/api/public/employees/lookup'
        AND timestamp >= datetime('now', '-1 minute')
    `).bind(ip).first().catch(() => ({ cnt: 0 }));

    if (limitCheck && limitCheck.cnt >= 20) {
      return NextResponse.json({ success: false, error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }, { status: 429 });
    }

    // Log request
    await db.prepare(`
      INSERT INTO rate_limit_log (ip_address, endpoint, timestamp)
      VALUES (?, '/api/public/employees/lookup', CURRENT_TIMESTAMP)
    `).bind(ip).run().catch(() => {});

    // Lookup
    const employee = await db.prepare(`
      SELECT emp_code, name, department, phone 
      FROM sys_users 
      WHERE UPPER(emp_code) = ? AND status = 'ACTIVE'
    `).bind(msnv).first();

    if (!employee) {
      return NextResponse.json({ success: false, found: false });
    }

    // Mask phone number partially for security on public route (e.g. 0912***789)
    let phone = (employee.phone as string) || '';
    if (phone.length >= 9) {
      phone = phone.substring(0, 4) + '***' + phone.substring(phone.length - 3);
    }

    return NextResponse.json({ 
      success: true, 
      found: true,
      data: {
        empCode: employee.emp_code,
        fullName: employee.name,
        department: employee.department,
        phone: phone
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
