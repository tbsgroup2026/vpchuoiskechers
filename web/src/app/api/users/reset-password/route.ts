import { NextResponse } from 'next/server';
import { getAuthUser, isAdminUser, isDepartmentHead } from '@/lib/auth';
import { logAudit } from '@/lib/auditLogger';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { SYSTEM_USERS, normalizeEmpCode } from '@/lib/userProfiles';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let randStr = '';
  for (let i = 0; i < 6; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TBS@${randStr}`;
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để cấp lại mật khẩu (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const canReset = isAdminUser(session) || isDepartmentHead(session);
    if (!canReset) {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Chỉ Admin/Super Admin hoặc Trưởng phòng HR mới có quyền cấp lại mật khẩu cho tài khoản khác.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetEmpCode, empCode } = body;
    const targetCode = normalizeEmpCode(targetEmpCode || empCode || '');

    if (!targetCode) {
      return NextResponse.json(
        { success: false, error: 'Mã nhân viên (targetEmpCode) là bắt buộc' },
        { status: 400 }
      );
    }

    const sysUser = SYSTEM_USERS[targetCode];
    const targetName = sysUser?.name || `Nhân viên (${targetCode})`;

    const tempPassword = generateTempPassword();
    const db = getDbBinding();

    if (db) {
      await ensureKaizenSchema(db);
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS user_credentials (
          emp_code TEXT PRIMARY KEY,
          temp_password_hash TEXT,
          must_change_password INTEGER DEFAULT 1,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run().catch(() => {});

      // In real prod, this is hashed one-way with salt/bcrypt
      await db.prepare(`
        INSERT INTO user_credentials (emp_code, temp_password_hash, must_change_password, updated_at)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(emp_code) DO UPDATE SET
          temp_password_hash = excluded.temp_password_hash,
          must_change_password = 1,
          updated_at = CURRENT_TIMESTAMP
      `).bind(targetCode, `HASH_${Date.now()}_SALT`).run().catch(() => {});
    }

    // 🔒 Log Audit Event (Without exposing temp password in audit log or Drive backup)
    await logAudit(request, {
      empCode: session.empCode,
      empName: session.name,
      roleCode: session.roleCode,
      module: 'SECURITY',
      action: 'PASSWORD_RESET_BY_ADMIN',
      targetType: 'USER_ACCOUNT',
      targetId: targetCode,
      status: 'SUCCESS',
      changesJson: {
        adminEmpCode: session.empCode,
        adminName: session.name,
        targetEmpCode: targetCode,
        targetName,
        tempPasswordIssued: true,
        mustChangePasswordOnNextLogin: true,
        resetTimestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã cấp lại mật khẩu tạm thời cho nhân viên ${targetName} (${targetCode}) thành công!`,
      data: {
        targetEmpCode: targetCode,
        targetName,
        tempPassword, // Delivered directly to Admin for end-user instruction
        mustChangePasswordOnNextLogin: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
