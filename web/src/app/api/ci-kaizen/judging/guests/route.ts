import { NextResponse } from 'next/server';
import { getAuthUser, isExecutiveOrAdmin, signToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: true, guests: [] });

    await ensureKaizenSchema(db);

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || searchParams.get('magicToken');
    const bgkUser = searchParams.get('bgkUser') || searchParams.get('user') || searchParams.get('username');
    const bgkPass = searchParams.get('pass') || searchParams.get('password') || searchParams.get('passcode');

    // If token or User & Pass query params are provided, authenticate the guest judge
    if (token || (bgkUser && bgkPass)) {
      let guest: any = null;
      if (token) {
        guest = await db.prepare(`
          SELECT * FROM ci_kaizen_judge_guest_accounts
          WHERE token_hash = ? AND is_revoked = 0 AND datetime(expires_at) > datetime('now')
        `).bind(token).first();
      } else if (bgkUser && bgkPass) {
        guest = await db.prepare(`
          SELECT * FROM ci_kaizen_judge_guest_accounts
          WHERE UPPER(username) = UPPER(?) AND one_time_passcode = ? AND is_revoked = 0 AND datetime(expires_at) > datetime('now')
        `).bind(bgkUser.trim(), bgkPass.trim()).first();
      }

      if (!guest) {
        return NextResponse.json({
          success: false,
          error: 'Tên đăng nhập / Mật khẩu hoặc Token không hợp lệ, hoặc tài khoản đã hết hạn / bị thu hồi',
        }, { status: 401 });
      }

      // Mark token as used
      await db.prepare(`
        UPDATE ci_kaizen_judge_guest_accounts
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(guest.id).run();

      const jwtPayload = {
        userId: 99000 + Math.floor(Math.random() * 900),
        empCode: `GUEST_${guest.id}`,
        name: `${guest.full_name || guest.username || 'BGK Khách Mời'} (BGK Khách Mời)`,
        roleId: 5,
        roleCode: 'JUDGE_GUEST',
        roleLevel: 3,
        roles: ['judge', 'judge_guest'],
        roundId: guest.round_id,
        isGuest: true,
        declarationSubmitted: Boolean(guest.declaration_submitted),
        username: guest.username || '',
        dungChung: Boolean(guest.dung_chung ?? 1),
      };

      const authToken = await signToken(jwtPayload);

      return NextResponse.json({
        success: true,
        message: 'Xác thực tài khoản BGK khách thành công!',
        authToken,
        guestUser: jwtPayload,
        declarationSubmitted: Boolean(guest.declaration_submitted),
      });
    }

    if (!user || !isExecutiveOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Không có quyền xem danh sách BGK khách' }, { status: 403 });
    }

    const { results: guests } = await db.prepare(`
      SELECT * FROM ci_kaizen_judge_guest_accounts ORDER BY created_at DESC
    `).all();

    return NextResponse.json({
      success: true,
      guests: guests || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'Không tìm thấy kết nối Database' }, { status: 500 });
    await ensureKaizenSchema(db);

    const body = await request.json();

    // 1. Guest direct login attempt: { action: 'LOGIN', username, passcode }
    if (body.action === 'LOGIN' || (body.username && body.passcode && !body.roundId)) {
      const { username, passcode } = body;
      const guest = await db.prepare(`
        SELECT * FROM ci_kaizen_judge_guest_accounts
        WHERE UPPER(username) = UPPER(?) AND one_time_passcode = ? AND is_revoked = 0 AND datetime(expires_at) > datetime('now')
      `).bind((username || '').trim(), (passcode || '').trim()).first();

      if (!guest) {
        return NextResponse.json({
          success: false,
          error: 'Tên đăng nhập (User) hoặc Mật khẩu 1 lần (Pass) không chính xác, hoặc đã bị thu hồi / hết hạn!',
        }, { status: 401 });
      }

      await db.prepare(`
        UPDATE ci_kaizen_judge_guest_accounts
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(guest.id).run();

      const jwtPayload = {
        userId: 99000 + Math.floor(Math.random() * 900),
        empCode: `GUEST_${guest.id}`,
        name: `${guest.full_name || guest.username || 'BGK Khách Mời'} (BGK Khách Mời)`,
        roleId: 5,
        roleCode: 'JUDGE_GUEST',
        roleLevel: 3,
        roles: ['judge', 'judge_guest'],
        roundId: guest.round_id,
        isGuest: true,
        declarationSubmitted: Boolean(guest.declaration_submitted),
        username: guest.username || '',
        dungChung: Boolean(guest.dung_chung ?? 1),
      };

      const authToken = await signToken(jwtPayload);

      return NextResponse.json({
        success: true,
        message: 'Đăng nhập BGK Khách Mời thành công!',
        authToken,
        guestUser: jwtPayload,
        declarationSubmitted: Boolean(guest.declaration_submitted),
      });
    }

    // 2. Admin creating guest account: User & Pass 1-time
    const user = await getAuthUser(request);
    if (!user || !isExecutiveOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Chỉ Admin/Ban 2.2 mới có quyền tạo BGK khách' }, { status: 403 });
    }

    const { fullName, emailPhone, roundId, validDays = 7, dungChung = 1 } = body;

    const bgkUsername = `BGK-${Math.floor(1000 + Math.random() * 9000)}`;
    const bgkPasscode = Math.floor(100000 + Math.random() * 900000).toString();

    const nameToSave = (fullName && fullName.trim())
      ? fullName.trim()
      : `BGK Khách Mời (${bgkUsername})`;
    const roundToSave = roundId || 'ROUND_2026';

    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tokenRaw = `magic_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const expiresDays = Math.max(1, Math.min(30, Number(validDays) || 7));
    const isShared = dungChung ? 1 : 0;

    await db.prepare(`
      INSERT INTO ci_kaizen_judge_guest_accounts (
        id, username, one_time_passcode, full_name, email_phone, round_id, token_hash, expires_at, created_by, dung_chung
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+${expiresDays} days'), ?, ?)
    `).bind(
      guestId,
      bgkUsername,
      bgkPasscode,
      nameToSave,
      emailPhone || '',
      roundToSave,
      tokenRaw,
      user.empCode || user.name,
      isShared
    ).run();

    const magicLink = `/work/kaizen/judge?bgkUser=${bgkUsername}&pass=${bgkPasscode}`;

    return NextResponse.json({
      success: true,
      message: `Tạo tài khoản BGK khách mời thành công! User: ${bgkUsername} | Pass: ${bgkPasscode}`,
      guestId,
      username: bgkUsername,
      oneTimePasscode: bgkPasscode,
      magicToken: tokenRaw,
      magicLink,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isExecutiveOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Chỉ Admin/Ban 2.2 mới có quyền thu hồi' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('id');

    if (!guestId) return NextResponse.json({ success: false, error: 'Thiếu guestId' }, { status: 400 });

    const db = getDbBinding();
    if (db) {
      await db.prepare(`
        UPDATE ci_kaizen_judge_guest_accounts
        SET is_revoked = 1
        WHERE id = ?
      `).bind(guestId).run();
    }

    return NextResponse.json({
      success: true,
      message: 'Đã thu hồi tài khoản BGK khách mời!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

