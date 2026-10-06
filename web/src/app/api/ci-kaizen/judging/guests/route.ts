import { NextResponse } from 'next/server';
import { getAuthUser, isExecutiveOrAdmin, isDepartmentHead, signToken } from '@/lib/auth';
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
    const action = searchParams.get('action') || searchParams.get('mode');
    const token = searchParams.get('token') || searchParams.get('magicToken');
    const bgkUser = searchParams.get('bgkUser') || searchParams.get('user') || searchParams.get('username');
    const bgkPass = searchParams.get('pass') || searchParams.get('password') || searchParams.get('passcode');

    // If token or User & Pass query params are provided (and not action=LIST), authenticate the guest judge
    if (action !== 'LIST' && (token || (bgkUser && bgkPass))) {
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

    const headerEmp = request.headers.get('x-user-emp-code') || request.headers.get('x-emp-code');
    if (!user && !headerEmp) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    let guests: any[] = [];
    try {
      const res = await db.prepare(`
        SELECT * FROM ci_kaizen_judge_guest_accounts ORDER BY created_at DESC
      `).all();
      guests = res.results || [];
    } catch (err) {
      const res = await db.prepare(`
        SELECT * FROM ci_kaizen_judge_guest_accounts ORDER BY rowid DESC
      `).all().catch(() => ({ results: [] }));
      guests = res.results || [];
    }

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
    const user = await getAuthUser(request).catch(() => null);
    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'Không tìm thấy kết nối Database' }, { status: 500 });
    await ensureKaizenSchema(db);

    const body = await request.json();

    // 1. Guest direct login attempt: { action: 'LOGIN', username, passcode }
    if (body.action === 'LOGIN') {
      const { username, passcode } = body;
      const guest = await db.prepare(`
        SELECT * FROM ci_kaizen_judge_guest_accounts
        WHERE UPPER(username) = UPPER(?) AND one_time_passcode = ? AND is_revoked = 0
      `).bind((username || '').trim(), (passcode || '').trim()).first();

      if (!guest) {
        return NextResponse.json({
          success: false,
          error: 'Tên đăng nhập (User) hoặc Mật khẩu không chính xác, hoặc đã bị thu hồi!',
        }, { status: 401 });
      }

      // Check 24-hour expiration
      const isExpired = new Date(guest.expires_at).getTime() < Date.now();
      if (isExpired) {
        return NextResponse.json({
          success: false,
          error: '❌ Tài khoản BGK Khách Mời đã hết hạn (chỉ có hiệu lực trong 24 giờ kể từ khi khởi tạo). Vui lòng liên hệ Admin để cấp lại!',
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
        redirectUrl: '/work/kaizen/van-phong-chuoi',
      };

      const authToken = await signToken(jwtPayload);

      return NextResponse.json({
        success: true,
        message: 'Đăng nhập BGK Khách Mời thành công!',
        authToken,
        guestUser: jwtPayload,
        declarationSubmitted: Boolean(guest.declaration_submitted),
        redirectUrl: '/work/kaizen/van-phong-chuoi',
      });
    }

    // 1.5 Admin updating existing guest account: Username & Passcode
    if (body.action === 'UPDATE' || body.action === 'EDIT') {
      const guestId = body.guestId || body.id;
      const newUsername = String(body.username || '').trim();
      const newPasscode = String(body.passcode || body.password || body.oneTimePasscode || '').trim();
      const newFullName = String(body.fullName || body.full_name || '').trim();

      if (!guestId || !newUsername || !newPasscode) {
        return NextResponse.json({
          success: false,
          error: 'Vui lòng cung cấp đầy đủ guestId, Username và Passcode!',
        }, { status: 400 });
      }

      const existingWithSameUser = await db.prepare(`
        SELECT id FROM ci_kaizen_judge_guest_accounts
        WHERE UPPER(username) = UPPER(?) AND id != ?
      `).bind(newUsername, guestId).first().catch(() => null);

      if (existingWithSameUser) {
        return NextResponse.json({
          success: false,
          error: `Username '${newUsername}' đã tồn tại ở tài khoản khác. Vui lòng chọn Username khác!`,
        }, { status: 400 });
      }

      await db.prepare(`
        UPDATE ci_kaizen_judge_guest_accounts
        SET username = ?,
            one_time_passcode = ?,
            full_name = CASE WHEN ? != '' THEN ? ELSE full_name END,
            is_revoked = 0
        WHERE id = ?
      `).bind(newUsername, newPasscode, newFullName, newFullName, guestId).run();

      return NextResponse.json({
        success: true,
        message: `✅ Cập nhật tài khoản BGK '${newUsername}' thành công!`,
        guestId,
        username: newUsername,
        oneTimePasscode: newPasscode,
        fullName: newFullName,
      });
    }

    // 2. Admin creating guest account: User & Pass (Single or Batch, 24-hour validity)
    if (!user || !isExecutiveOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Chỉ Admin/Ban 2.2 mới có quyền tạo BGK khách' }, { status: 403 });
    }

    // Batch creation mode
    if (body.action === 'BATCH_CREATE' || Array.isArray(body.guests) || Array.isArray(body.guestsList)) {
      const guestsInput = Array.isArray(body.guests) ? body.guests : (body.guestsList || []);
      if (!guestsInput || guestsInput.length === 0) {
        return NextResponse.json({ success: false, error: 'Danh sách giám khảo rỗng' }, { status: 400 });
      }

      const defaultRoundId = body.roundId || 'ROUND_2026';
      const defaultValidDays = 1; // Default 1 day (24 hours)
      const defaultDungChung = body.dungChung !== undefined ? (body.dungChung ? 1 : 0) : 1;

      // Validate custom username duplicates against DB & within input batch
      const providedUsernames = guestsInput
        .map((g: any) => (g.username || '').trim())
        .filter(Boolean);

      const batchDupes = providedUsernames.filter((u: string, idx: number) => providedUsernames.findIndex((x: string) => x.toLowerCase() === u.toLowerCase()) !== idx);
      if (batchDupes.length > 0) {
        return NextResponse.json({
          success: false,
          error: `❌ Username '${batchDupes[0]}' bị trùng lặp trong cùng danh sách nhập. Vui lòng nhập Username khác!`,
        }, { status: 400 });
      }

      for (const customUser of providedUsernames) {
        const existing = await db.prepare(`
          SELECT id FROM ci_kaizen_judge_guest_accounts WHERE UPPER(username) = UPPER(?)
        `).bind(customUser).first();
        if (existing) {
          return NextResponse.json({
            success: false,
            error: `❌ Username '${customUser}' đã tồn tại trong hệ thống. Vui lòng chọn Username khác!`,
          }, { status: 400 });
        }
      }

      let nextIndex = 1;
      try {
        const lastAccount = await db.prepare(`
          SELECT username FROM ci_kaizen_judge_guest_accounts
          WHERE username LIKE 'BGK%'
          ORDER BY created_at DESC LIMIT 1
        `).first();
        if (lastAccount && lastAccount.username) {
          const match = lastAccount.username.match(/BGK-?(\d+)/i);
          if (match && match[1]) {
            nextIndex = parseInt(match[1], 10) + 1;
          }
        }
      } catch (e) {}

      const createdGuests: any[] = [];
      const statements: any[] = [];

      for (let i = 0; i < guestsInput.length; i++) {
        const item = guestsInput[i];
        const autoUser = `BGK${String(nextIndex + i).padStart(3, '0')}`;
        const bgkUsername = (item.username && item.username.trim())
          ? item.username.trim()
          : autoUser;
        const bgkPasscode = (item.passcode && item.passcode.trim())
          ? item.passcode.trim()
          : (item.password && item.password.trim())
            ? item.password.trim()
            : Math.floor(100000 + Math.random() * 900000).toString();

        const nameToSave = (item.fullName && item.fullName.trim())
          ? item.fullName.trim()
          : (item.name && item.name.trim())
            ? item.name.trim()
            : '';
        const contactToSave = (item.emailPhone && item.emailPhone.trim())
          ? item.emailPhone.trim()
          : (item.contact && item.contact.trim())
            ? item.contact.trim()
            : '';
        const roundToSave = item.roundId || defaultRoundId;
        const expiresDays = item.validDays ? Math.max(1, Math.min(30, Number(item.validDays))) : defaultValidDays;
        const isShared = item.dungChung !== undefined ? (item.dungChung ? 1 : 0) : defaultDungChung;

        const guestId = `guest_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
        const tokenRaw = `magic_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 12)}`;

        statements.push(
          db.prepare(`
            INSERT INTO ci_kaizen_judge_guest_accounts (
              id, username, one_time_passcode, full_name, email_phone, round_id, token_hash, expires_at, created_by, dung_chung, organization, contact_info
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+${expiresDays} days'), ?, ?, '', '')
          `).bind(
            guestId,
            bgkUsername,
            bgkPasscode,
            nameToSave,
            contactToSave,
            roundToSave,
            tokenRaw,
            user?.empCode || user?.name || 'ADMIN',
            isShared
          )
        );

        createdGuests.push({
          guestId,
          fullName: nameToSave,
          emailPhone: contactToSave,
          roundId: roundToSave,
          username: bgkUsername,
          oneTimePasscode: bgkPasscode,
          dungChung: isShared,
          validHours: 24,
        });
      }

      await db.batch(statements);

      return NextResponse.json({
        success: true,
        message: `Đã tạo thành công ${createdGuests.length} tài khoản BGK khách mời (Hiệu lực 24 giờ)!`,
        count: createdGuests.length,
        createdGuests,
      });
    }

    // Single creation mode fallback
    const { fullName, emailPhone, roundId, validDays = 1, dungChung = 1, username: customUser, passcode: customPass } = body;

    let bgkUsername = (customUser && customUser.trim())
      ? customUser.trim()
      : `BGK-${Math.floor(1000 + Math.random() * 9000)}`;

    const bgkPasscode = (customPass && customPass.trim())
      ? customPass.trim()
      : Math.floor(100000 + Math.random() * 900000).toString();

    const nameToSave = (fullName && fullName.trim())
      ? fullName.trim()
      : `BGK Khách Mời (${bgkUsername})`;
    const roundToSave = roundId || 'ROUND_2026';
    const expiresDays = Math.max(1, Math.min(30, Number(validDays) || 1));
    const isShared = dungChung ? 1 : 0;

    // Check if username already exists in database -> UPSERT instead of failing with 400
    const existing = await db.prepare(`
      SELECT id FROM ci_kaizen_judge_guest_accounts WHERE UPPER(username) = UPPER(?)
    `).bind(bgkUsername).first().catch(() => null);

    if (existing) {
      await db.prepare(`
        UPDATE ci_kaizen_judge_guest_accounts
        SET one_time_passcode = ?,
            expires_at = datetime('now', '+${expiresDays} days'),
            is_revoked = 0,
            dung_chung = ?,
            full_name = CASE WHEN ? != '' THEN ? ELSE full_name END
        WHERE id = ?
      `).bind(bgkPasscode, isShared, nameToSave, nameToSave, existing.id).run();

      return NextResponse.json({
        success: true,
        message: `✅ Đã cập nhật Mật khẩu mới cho tài khoản BGK '${bgkUsername}'! Pass: ${bgkPasscode}`,
        guestId: existing.id,
        username: bgkUsername,
        oneTimePasscode: bgkPasscode,
        validHours: 24,
      });
    }

    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tokenRaw = `magic_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;

    await db.prepare(`
      INSERT INTO ci_kaizen_judge_guest_accounts (
        id, username, one_time_passcode, full_name, email_phone, round_id, token_hash, expires_at, created_by, dung_chung, organization, contact_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+${expiresDays} days'), ?, ?, '', '')
    `).bind(
      guestId,
      bgkUsername,
      bgkPasscode,
      nameToSave,
      emailPhone || '',
      roundToSave,
      tokenRaw,
      user?.empCode || user?.name || 'ADMIN',
      isShared
    ).run();

    return NextResponse.json({
      success: true,
      message: `✅ Tạo tài khoản BGK Khách Mời thành công! Username: ${bgkUsername} | Pass: ${bgkPasscode}`,
      guestId,
      username: bgkUsername,
      oneTimePasscode: bgkPasscode,
      validHours: 24,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isExecutiveOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Chỉ Admin/Ban 2.2 mới có quyền xóa' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('id');
    const isHard = searchParams.get('hard') === 'true' || searchParams.get('mode') === 'delete';

    if (!guestId) return NextResponse.json({ success: false, error: 'Thiếu guestId' }, { status: 400 });

    const db = getDbBinding();
    if (db) {
      if (isHard) {
        await db.prepare(`
          DELETE FROM ci_kaizen_judge_guest_accounts
          WHERE id = ? OR username = ?
        `).bind(guestId, guestId).run();

        return NextResponse.json({
          success: true,
          message: 'Đã xóa vĩnh viễn tài khoản BGK khỏi hệ thống!',
        });
      }

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

