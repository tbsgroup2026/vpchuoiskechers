import { NextResponse } from 'next/server';

const FAILED_ATTEMPTS_MAP = new Map<string, { count: number; lastAttempt: number }>();
const VALID_GATE_PIN_HASH = '152152'; // Demo PIN Code (sha256/plain check)

export async function POST(request: Request) {
  try {
    const { empCode, pinCode, ipAddress } = await request.json();
    const userEmpCode = empCode || 'PTGĐ-002';
    const clientIp = ipAddress || '127.0.0.1';

    // 1. Rate Limiting Check
    const key = `${userEmpCode}_${clientIp}`;
    const attempts = FAILED_ATTEMPTS_MAP.get(key) || { count: 0, lastAttempt: 0 };
    const now = Date.now();

    if (attempts.count >= 3 && now - attempts.lastAttempt < 15 * 60 * 1000) {
      const remainingMinutes = Math.ceil((15 * 60 * 1000 - (now - attempts.lastAttempt)) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Tài khoản đã bị tạm khóa nhập mã 1-5-2 do nhập sai 3 lần liên tiếp. Vui lòng thử lại sau ${remainingMinutes} phút!`,
          isLocked: true,
        },
        { status: 429 }
      );
    }

    // 2. PIN Verification
    if (pinCode !== VALID_GATE_PIN_HASH && pinCode !== '152152') {
      FAILED_ATTEMPTS_MAP.set(key, { count: attempts.count + 1, lastAttempt: now });
      return NextResponse.json(
        {
          success: false,
          error: `Mã PIN xác thực 1-5-2 không chính xác. Số lần còn lại: ${3 - (attempts.count + 1)}/3`,
          remainingAttempts: 3 - (attempts.count + 1),
        },
        { status: 401 }
      );
    }

    // Clear failed attempts on success
    FAILED_ATTEMPTS_MAP.delete(key);

    // 3. Grant temporary 30-minute Access Gate Session
    const verifiedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      verifiedUntil,
      message: 'Xác thực Access Gate 1-5-2 thành công. Phiên làm việc có hiệu lực trong 30 phút.',
      sessionToken: `GATE_152_${Date.now()}_${userEmpCode}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'System Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
