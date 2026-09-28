import { NextResponse } from 'next/server';
import { getAuthUser, isExecutiveOrAdmin, verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    let user = await getAuthUser(request);
    if (!user) {
      const headerEmp = request.headers.get('x-user-emp-code') || request.headers.get('x-emp-code');
      if (headerEmp) {
        user = await verifyToken(headerEmp);
      }
    }

    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId');

    if (!proposalId) {
      return NextResponse.json({ success: false, error: 'Thiếu proposalId' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: true, canSeeExpertTab: false, data: null });
    }
    await ensureKaizenSchema(db);

    const cleanId = String(proposalId || '').replace(/^ci_/i, '').trim();
    const withCiId = cleanId ? `ci_${cleanId}` : proposalId;

    // Fetch proposal
    let proposal = await db.prepare(`
      SELECT * FROM ci_kaizen_proposals
      WHERE id = ? OR code = ?
         OR UPPER(id) = UPPER(?) OR UPPER(code) = UPPER(?)
         OR id = ? OR code = ?
         OR UPPER(id) = UPPER(?) OR UPPER(code) = UPPER(?)
    `).bind(proposalId, proposalId, proposalId, proposalId, cleanId, cleanId, withCiId, withCiId).first().catch(() => null);

    if (!proposal) {
      proposal = await db.prepare(`
        SELECT * FROM kaizen_submissions
        WHERE id = ? OR code = ?
           OR UPPER(id) = UPPER(?) OR UPPER(code) = UPPER(?)
           OR id = ? OR code = ?
           OR UPPER(id) = UPPER(?) OR UPPER(code) = UPPER(?)
      `).bind(proposalId, proposalId, proposalId, proposalId, cleanId, cleanId, withCiId, withCiId).first().catch(() => null);
    }

    if (!proposal) {
      proposal = {
        id: proposalId,
        code: proposalId,
        title: `Sáng kiến (${proposalId})`,
        category: 'Cải tiến sản xuất',
        sub_status: 'DANG_DANH_GIA',
        trang_thai: 'DANG_DANH_GIA'
      };
    }

    const userEmp = String(user?.empCode || '').trim().toUpperCase();
    const userName = String((user as any)?.name || (user as any)?.empName || '').trim().toLowerCase();
    const roleCode = String((user as any)?.roleCode || (user as any)?.role || '').toUpperCase();
    const userRoles = Array.isArray((user as any)?.roles) ? (user as any).roles : [];
    const isGuest = Boolean((user as any)?.isGuest || roleCode === 'JUDGE_GUEST' || userRoles.includes('judge_guest'));
    const roleLevel = Number((user as any)?.roleLevel || (user as any)?.levelRank || 4);

    // Check MSNV Whitelist in DB
    const whRow = await db.prepare(`
      SELECT emp_code FROM ci_kaizen_judge_whitelist_msnv WHERE emp_code = ?
    `).bind(userEmp).first().catch(() => null);
    const staticWhitelist = ['202608001', '202608010', '222102020', '202608002', '202112003', '2026080001', 'LEKHAI', 'DUTHITHANHTINH'];
    const isWhitelistedMsnv =
      Boolean(whRow) ||
      staticWhitelist.includes(userEmp) ||
      userName.includes('anh huy') ||
      userName.includes('lê khải') ||
      userName.includes('le khai') ||
      userName.includes('thanh tình') ||
      userName.includes('thanh tinh') ||
      userName.includes('dư thị thanh tình');

    // Rule 2.2: Auto-grant full scoring access for BGĐ (roleLevel <= 2 or BOD roles) OR Whitelisted MSNV
    const isAutoGrantFullJudge =
      isExecutiveOrAdmin(user) ||
      roleLevel <= 2 ||
      isWhitelistedMsnv ||
      ['TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC', 'GIAM_DOC', 'PHO_GIAM_DOC', 'EXECUTIVE', 'EXECUTIVE_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'CI_LEAD', 'TRUONG_PHONG'].includes(roleCode);

    // Check assignment scope for judges
    const { results: assignments } = await db.prepare(`
      SELECT * FROM ci_kaizen_judge_assignments
      WHERE submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?)
    `).bind(proposalId, proposalId).all().catch(() => ({ results: [] }));

    const isExplicitlyAssigned = (assignments || []).some(
      (a: any) => (a.judge_id || '').trim().toUpperCase() === userEmp
    );

    // General Judge Role check
    const isJudgeRole =
      isAutoGrantFullJudge ||
      isGuest ||
      isExplicitlyAssigned ||
      userRoles.includes('judge') ||
      userRoles.includes('internal_judge') ||
      userRoles.includes('ci_lead') ||
      userRoles.includes('ci') ||
      userRoles.includes('ie') ||
      ['TRUONG_PHONG', 'CI_LEAD', 'IE', 'QC', 'JUDGE', 'INTERNAL_JUDGE'].includes(roleCode);

    // Rule 1 & 2: Regular employees WITHOUT judge role CANNOT see the expert evaluation tab at server level
    if (!user || !isJudgeRole) {
      return NextResponse.json({
        success: true,
        canSeeExpertTab: false,
        data: null,
      });
    }

    let readOnly = false;
    let readOnlyReason = '';
    if (!isAutoGrantFullJudge && !isGuest && assignments && assignments.length > 0 && !isExplicitlyAssigned) {
      readOnly = true;
      readOnlyReason = 'Hồ sơ này không thuộc danh sách phân công/xung đột - Chế độ chỉ đọc';
    }

    // Guest Declaration check
    let declarationRequired = false;
    let guestAccount = null;
    if (isGuest) {
      const guestId = (user as any)?.empCode?.replace('GUEST_', '') || '';
      guestAccount = await db.prepare(`
        SELECT * FROM ci_kaizen_judge_guest_accounts WHERE id = ?
      `).bind(guestId).first().catch(() => null);

      if (guestAccount && !Boolean(guestAccount.declaration_submitted)) {
        declarationRequired = true;
      }
    }

    // Step 0 Prerequisite check
    const prereqCheck = await db.prepare(`
      SELECT * FROM ci_kaizen_prerequisite_checks
      WHERE submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?)
      ORDER BY created_at DESC LIMIT 1
    `).bind(proposalId, proposalId).first().catch(() => null);

    // Fetch scores
    const { results: scores } = await db.prepare(`
      SELECT * FROM ci_kaizen_scores
      WHERE UPPER(submission_id) = UPPER(?) 
         OR UPPER(submission_id) = UPPER(?) 
         OR UPPER(submission_id) = (SELECT UPPER(code) FROM ci_kaizen_proposals WHERE id = ?) 
         OR UPPER(submission_id) = (SELECT UPPER(id) FROM ci_kaizen_proposals WHERE code = ?)
      ORDER BY created_at DESC
    `).bind(proposalId, proposal.code || proposalId, proposalId, proposalId).all();

    const myScore = (scores || []).find((s: any) => {
      const jId = (s.judge_id || '').trim().toUpperCase();
      const rEmp = (s.real_scorer_emp_code || '').trim().toUpperCase();
      return jId === userEmp || jId === `GUEST_${userEmp}` || userEmp === `GUEST_${jId}` || (rEmp && rEmp === userEmp);
    }) || null;

    // Sanitize scores for client view
    const sanitizedScores = (scores || []).map((s: any) => {
      if (!isExecutiveOrAdmin(user) && (s.judge_id || '').trim().toUpperCase() !== userEmp) {
        return {
          id: s.id,
          judge_id: '***',
          judge_name: 'Giám Khảo',
          total_score: s.total_score,
          is_locked: s.is_locked,
          created_at: s.created_at,
        };
      }
      return s;
    });

    const totalJudgesScored = (scores || []).length;
    let computedAvgScore: number | null = null;
    if (scores && scores.length > 0) {
      const sum = scores.reduce((acc: number, s: any) => acc + Number(s.total_score || 0), 0);
      computedAvgScore = Math.round((sum / scores.length) * 10) / 10;

      if (!proposal.judge_final_score || Number(proposal.judge_final_score) <= 0 || proposal.sub_status === 'CHO_DUYET' || proposal.sub_status === 'CHO_DANH_GIA') {
        proposal.judge_final_score = computedAvgScore;
        proposal.score_points = computedAvgScore;
        if (proposal.sub_status === 'CHO_DUYET' || proposal.sub_status === 'CHO_DANH_GIA') {
          proposal.sub_status = 'DA_DANH_GIA';
          proposal.trang_thai = 'DA_DANH_GIA';
        }
        await db.prepare(`
          UPDATE ci_kaizen_proposals
          SET judge_final_score = ?,
              score_points = ?,
              sub_status = CASE WHEN sub_status IN ('CHO_DUYET', 'CHO_DANH_GIA') THEN 'DA_DANH_GIA' ELSE sub_status END,
              trang_thai = CASE WHEN trang_thai IN ('CHO_DUYET', 'CHO_DANH_GIA') THEN 'DA_DANH_GIA' ELSE trang_thai END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? OR code = ?
        `).bind(computedAvgScore, computedAvgScore, proposalId, proposal.code || proposalId).run().catch(() => {});
      }
    }

    // Fetch classification group mapping from DB config (Phase 1 & Phase 5)
    const catRaw = String(proposal.category || proposal.category_label || proposal.product_group || '').trim();
    const classMapRow = await db.prepare(`
      SELECT nhom_barem, tu_dong, ghi_chu FROM ci_kaizen_classification_group_map WHERE phan_loai = ?
    `).bind(catRaw).first().catch(() => null);

    const catUpper = catRaw.toUpperCase();
    let defaultNhom = 'Nhóm 1';
    if (catUpper.includes('MATERIAL') || catUpper.includes('COST') || catUpper.includes('VẬT TƯ') || catUpper.includes('CHI PHÍ')) {
      if (!catUpper.includes('AUTOMATION') && !catUpper.includes('TỰ ĐỘNG')) {
        defaultNhom = 'Nhóm 2';
      }
    } else if (catUpper.includes('SAFETY') || catUpper.includes('AN TOÀN') || catUpper.includes('5S')) {
      defaultNhom = 'Nhóm 3';
    }

    return NextResponse.json({
      success: true,
      canSeeExpertTab: true,
      readOnly,
      readOnlyReason,
      declarationRequired,
      isGuest,
      guestAccount,
      classMapConfig: classMapRow || { nhom_barem: defaultNhom, tu_dong: 1, ghi_chu: `Ánh xạ tự động từ ${catRaw}` },
      data: {
        proposal,
        prereqCheck,
        myScore,
        scores: sanitizedScores,
        totalJudgesScored,
        judgeFinalScore: computedAvgScore || proposal.judge_final_score || proposal.score_points || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }
    await ensureKaizenSchema(db);

    const body = await request.json();
    const { action = 'SUBMIT_SCORE', proposalId, roundId = 'ROUND_2026' } = body;

    if (!proposalId && action !== 'SUBMIT_DECLARATION') {
      return NextResponse.json({ success: false, error: 'Vui lòng cung cấp proposalId' }, { status: 400 });
    }

    // 1. Guest Declaration Submission
    if (action === 'SUBMIT_DECLARATION') {
      const { fullName, organization, contactInfo, noConflictDeclared, msnv, phone, email } = body;
      if (!fullName || !fullName.trim()) {
        return NextResponse.json({ success: false, error: 'Họ và tên là bắt buộc' }, { status: 400 });
      }
      if (!noConflictDeclared) {
        return NextResponse.json({ success: false, error: 'Vui lòng xác nhận cam kết không có xung đột lợi ích' }, { status: 400 });
      }

      const guestId = (user as any)?.empCode?.replace('GUEST_', '') || '';
      const bgkUsername = (user as any)?.username || (user as any)?.empCode || '';

      const finalPhone = (phone || '').trim();
      const finalEmail = (email || '').trim();
      const finalMsnv = (msnv || '').trim();
      const finalOrg = (organization || '').trim();
      const finalContactInfo = (contactInfo || '').trim() || (finalPhone && finalEmail ? `${finalPhone} | ${finalEmail}` : (finalPhone || finalEmail));

      await db.prepare(`
        UPDATE ci_kaizen_judge_guest_accounts
        SET full_name = ?,
            organization = ?,
            contact_info = ?,
            msnv = ?,
            phone = ?,
            email = ?,
            declaration_submitted = 1,
            no_conflict_declared = 1,
            used_at = CURRENT_TIMESTAMP
        WHERE id = ? OR UPPER(username) = UPPER(?) OR UPPER(username) = UPPER(?)
      `).bind(
        fullName.trim(),
        finalOrg,
        finalContactInfo,
        finalMsnv,
        finalPhone,
        finalEmail,
        guestId,
        bgkUsername,
        (user as any)?.empCode || ''
      ).run();

      // Audit logs
      await db.prepare(`
        INSERT INTO sys_audit_logs (id, emp_code, emp_name, module, action, target_type, target_id, changes_json)
        VALUES (?, ?, ?, 'KAIZEN_JUDGING', 'GUEST_DECLARATION', 'GUEST_ACCOUNT', ?, ?)
      `).bind(
        `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        (user as any)?.empCode || guestId,
        fullName.trim(),
        guestId,
        JSON.stringify({ fullName: fullName.trim(), organization, contactInfo })
      ).run().catch(() => {});

      await db.prepare(`
        INSERT INTO ci_kaizen_score_audit_log (id, judge_account_id, submission_id, hanh_dong, gia_tri_truoc, gia_tri_sau, ip_thiet_bi)
        VALUES (?, ?, ?, 'GUEST_DECLARATION', null, ?, ?)
      `).bind(
        `salog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        guestId,
        proposalId || 'DECLARATION',
        JSON.stringify({ fullName: fullName.trim(), organization, contactInfo }),
        request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || '127.0.0.1'
      ).run().catch(() => {});

      // Backup Guest Declaration JSON to Google Drive
      try {
        const { getGoogleAccessToken, resolveGDriveFolder, uploadFileToGDrive } = await import('@/lib/googleDriveBackup');
        const clientEmail = (process.env as any).GDRIVE_CLIENT_EMAIL || (process.env as any).GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = (process.env as any).GDRIVE_PRIVATE_KEY || (process.env as any).GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
        if (clientEmail && privateKey) {
          const accessToken = await getGoogleAccessToken(clientEmail, privateKey);
          const declFolderId = await resolveGDriveFolder(accessToken, 'Backup-TBS-System', 'guest_declarations');
          const declFileName = `guest_declaration_${guestId || 'anon'}_${Date.now()}.json`;
          const declContent = JSON.stringify({
            guest_id: guestId,
            full_name: fullName.trim(),
            organization: organization || '',
            contact_info: contactInfo || '',
            no_conflict_declared: true,
            proposal_id: proposalId || null,
            submitted_at: new Date().toISOString(),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || '127.0.0.1',
          }, null, 2);

          await uploadFileToGDrive(accessToken, declFileName, declContent, declFolderId);
          console.log(`✓ Guest declaration backed up to Google Drive: ${declFileName}`);
        }
      } catch (gdriveErr) {
        console.warn('Google Drive declaration backup warning:', gdriveErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Khai báo thông tin BGK khách mời thành công và đã lưu D1 / Google Drive!',
      });
    }

    // 2. Conflict of Interest Report (Xin rút do xung đột lợi ích)
    if (action === 'REPORT_CONFLICT') {
      const { conflictReason = 'Xung đột lợi ích cá nhân' } = body;
      const assignmentId = `asgn_conflict_${Date.now()}`;

      await db.prepare(`
        INSERT INTO ci_kaizen_judge_assignments (
          id, round_id, judge_id, judge_name, submission_id, status, is_conflict, conflict_reason
        ) VALUES (?, ?, ?, ?, ?, 'CONFLICT_REPORTED', 1, ?)
      `).bind(
        assignmentId,
        roundId,
        user.empCode,
        user.name,
        proposalId,
        conflictReason.trim()
      ).run();

      // Rule 5.1: Move proposal sub_status to 'CHO_PHAN_CONG_LAI'
      await db.prepare(`
        UPDATE ci_kaizen_proposals
        SET sub_status = 'CHO_PHAN_CONG_LAI',
            trang_thai = 'CHO_PHAN_CONG_LAI',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR code = ?
      `).bind(proposalId, proposalId).run().catch(() => {});

      // Audit Log
      await db.prepare(`
        INSERT INTO sys_audit_logs (id, emp_code, emp_name, module, action, target_type, target_id, changes_json)
        VALUES (?, ?, ?, 'KAIZEN_JUDGING', 'REPORT_CONFLICT', 'PROPOSAL', ?, ?)
      `).bind(
        `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user.empCode,
        user.name,
        proposalId,
        JSON.stringify({ conflictReason })
      ).run().catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Đã báo cáo xung đột lợi ích thành công và đề xuất đã chuyển trạng thái chờ phân công lại!',
      });
    }

    // 3. Admin Unlock Score
    if (action === 'UNLOCK_SCORE') {
      if (!isExecutiveOrAdmin(user)) {
        return NextResponse.json({ success: false, error: 'Chỉ Admin/Ban 2.2 mới có quyền mở khóa điểm' }, { status: 403 });
      }

      const { judgeId } = body;
      await db.prepare(`
        UPDATE ci_kaizen_scores
        SET is_locked = 0
        WHERE round_id = ? AND (submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?)) AND judge_id = ?
      `).bind(roundId, proposalId, proposalId, judgeId).run();

      return NextResponse.json({
        success: true,
        message: 'Đã mở khóa điểm cho phép giám khảo chấm lại!',
      });
    }

    // 4. Scoring Submission (SUBMIT_SCORE)
    const {
      p1Pass = true,
      p2Pass = true,
      p3Pass = true,
      p4Pass = true,
      prereqNote = '',
      c1Group = 'GROUP1',
      c1Score = 0,
      c2Score = 0,
      c3Score = 0,
      c4Score = 0,
      c5Score = 0,
      c1Basis = '',
      c2Basis = '',
      c3Basis = '',
      c4Basis = '',
      c5Basis = '',
      isVerifiedData = true,
      noConflictDeclared = true,
    } = body;

    // Check conflict declaration
    if (!noConflictDeclared) {
      return NextResponse.json({
        success: false,
        error: 'Bạn phải xác nhận không có xung đột lợi ích trước khi gửi điểm!',
      }, { status: 400 });
    }

    const cleanId = String(proposalId || '').replace(/^ci_/i, '').trim();
    const withCiId = cleanId ? `ci_${cleanId}` : proposalId;

    // Lookup proposal record to resolve canonical ID and Code
    let targetProp = await db.prepare(`
      SELECT id, code, is_disqualified, sub_status, trang_thai FROM ci_kaizen_proposals
      WHERE id = ? OR code = ?
         OR UPPER(id) = UPPER(?) OR UPPER(code) = UPPER(?)
         OR id = ? OR code = ?
         OR UPPER(id) = UPPER(?) OR UPPER(code) = UPPER(?)
    `).bind(proposalId, proposalId, proposalId, proposalId, cleanId, cleanId, withCiId, withCiId).first().catch(() => null);

    if (!targetProp) {
      targetProp = await db.prepare(`
        SELECT id, code, is_disqualified, sub_status, trang_thai FROM kaizen_submissions
        WHERE id = ? OR code = ?
           OR UPPER(id) = UPPER(?) OR UPPER(code) = UPPER(?)
           OR id = ? OR code = ?
           OR UPPER(id) = UPPER(?) OR UPPER(code) = UPPER(?)
      `).bind(proposalId, proposalId, proposalId, proposalId, cleanId, cleanId, withCiId, withCiId).first().catch(() => null);
    }

    if (!targetProp) {
      targetProp = { id: proposalId, code: proposalId, is_disqualified: 0, sub_status: 'DANG_DANH_GIA', trang_thai: 'DANG_DANH_GIA' };
    }

    if (targetProp.is_disqualified == 1 || targetProp.sub_status === 'KHONG_DAT_DIEU_KIEN') {
      return NextResponse.json({
        success: false,
        error: 'Sáng kiến này đã bị loại do không đạt điều kiện tiên quyết (Bước 0), không thể chấm điểm.',
      }, { status: 400 });
    }

    const canonicalId = targetProp.id || proposalId;
    const canonicalCode = targetProp.code || canonicalId;

    // Step 0: Prerequisite check
    const isAllPrereqPass = Boolean(p1Pass && p2Pass && p3Pass && p4Pass);
    const prereqId = `prereq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.prepare(`
      INSERT INTO ci_kaizen_prerequisite_checks (
        id, submission_id, round_id, p1_pass, p2_pass, p3_pass, p4_pass, is_all_pass, checked_by, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      prereqId,
      canonicalCode,
      roundId,
      p1Pass ? 1 : 0,
      p2Pass ? 1 : 0,
      p3Pass ? 1 : 0,
      p4Pass ? 1 : 0,
      isAllPrereqPass ? 1 : 0,
      user.empCode,
      prereqNote
    ).run();

    // If prerequisite failed -> Disqualify proposal
    if (!isAllPrereqPass) {
      await db.prepare(`
        UPDATE ci_kaizen_proposals
        SET is_disqualified = 1,
            disqualified_reason = ?,
            disqualified_by = ?,
            sub_status = 'KHONG_DAT_DIEU_KIEN',
            trang_thai = 'KHONG_DAT_DIEU_KIEN',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR code = ?
      `).bind(
        `Không đạt điều kiện tiên quyết (Bước 0): ${prereqNote || 'Vi phạm tiêu chí sơ khảo'}`,
        user.empCode,
        canonicalId,
        canonicalCode
      ).run();

      return NextResponse.json({
        success: true,
        isDisqualified: true,
        message: 'Hồ sơ không đạt điều kiện tiên quyết (Bước 0) và đã chuyển sang trạng thái "Không đạt điều kiện – loại".',
      });
    }

    // Allow optional basis / justification text for criteria
    const cleanC1Basis = (c1Basis || '').trim();
    const cleanC2Basis = (c2Basis || '').trim();
    const cleanC3Basis = (c3Basis || '').trim();
    const cleanC4Basis = (c4Basis || '').trim();
    const cleanC5Basis = (c5Basis || '').trim();

    // Real Scorer Identity handling for Shared Guest Accounts
    const {
      realScorerEmpCode = '',
      realScorerName = '',
      realScorerOrg = '',
      realScorerPhone = '',
      realScorerEmail = '',
    } = body;

    const empCodeStr = String(user?.empCode || '').toLowerCase();
    const nameStr = String(user?.name || '').toLowerCase();
    const emailStr = String(user?.email || '').toLowerCase();
    const roleCode = String((user as any)?.roleCode || (user as any)?.role || '').toUpperCase();
    const userRoles = Array.isArray((user as any)?.roles) ? (user as any).roles : [];

    const isGuest = Boolean(
      (user as any)?.isGuest ||
      (user as any)?.is_guest_shared ||
      roleCode === 'JUDGE_GUEST' ||
      userRoles.includes('judge_guest') ||
      empCodeStr.startsWith('guest_') ||
      empCodeStr.includes('khách mời') ||
      empCodeStr.includes('khach moi') ||
      empCodeStr.includes('bgk') ||
      nameStr.includes('khách mời') ||
      nameStr.includes('khach moi') ||
      nameStr.includes('bgk') ||
      emailStr.includes('khách mời') ||
      emailStr.includes('khach moi')
    );

    const effectiveScorerName = (realScorerName || (isGuest ? '' : user?.name || 'BGK Chuyên Môn')).trim();
    const effectiveScorerEmp = (realScorerEmpCode || (isGuest ? '' : user?.empCode || '')).trim();
    const effectiveScorerOrg = (realScorerOrg || (isGuest ? '' : user?.title || user?.department || 'Văn Phòng Chuỗi SKECHERS')).trim();
    const effectiveScorerPhone = (realScorerPhone || (isGuest ? '' : user?.phone || '')).trim();
    const effectiveScorerEmail = (realScorerEmail || (isGuest ? '' : user?.email || '')).trim();

    const lowerEffectiveName = effectiveScorerName.toLowerCase();
    const isVirtualDefaultName = !effectiveScorerName || lowerEffectiveName.includes('khách mời') || lowerEffectiveName.includes('khach moi') || lowerEffectiveName.includes('bgk');

    if (isGuest || isVirtualDefaultName) {
      if (isVirtualDefaultName) {
        return NextResponse.json({
          success: false,
          error: '⚠️ Tài khoản ảo / BGK Khách Mời: Bắt buộc phải khai báo Họ và tên người chấm thực (không dùng tên mặc định) ở Bước 1 trước khi nộp điểm!',
        }, { status: 400 });
      }
    }

    let userEmpCode = user?.empCode || 'UNKNOWN';
    let effectiveJudgeId = userEmpCode;
    if (isGuest) {
      const cleanScorerSlug = effectiveScorerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      effectiveJudgeId = effectiveScorerEmp ? "GUEST_" + effectiveScorerEmp : "GUEST_" + userEmpCode + "_" + cleanScorerSlug;

      // Sync declaration identity to guest account record in real time
      const guestId = (user as any)?.empCode?.replace('GUEST_', '') || '';
      const bgkUsername = (user as any)?.username || (user as any)?.empCode || '';
      const finalContact = effectiveScorerPhone && effectiveScorerEmail ? `${effectiveScorerPhone} | ${effectiveScorerEmail}` : (effectiveScorerPhone || effectiveScorerEmail);
      await db.prepare(`
        UPDATE ci_kaizen_judge_guest_accounts
        SET full_name = ?,
            organization = ?,
            contact_info = ?,
            msnv = ?,
            phone = ?,
            email = ?,
            declaration_submitted = 1,
            no_conflict_declared = 1,
            used_at = CURRENT_TIMESTAMP
        WHERE id = ? OR UPPER(username) = UPPER(?) OR UPPER(username) = UPPER(?)
      `).bind(
        effectiveScorerName,
        effectiveScorerOrg,
        finalContact,
        effectiveScorerEmp,
        effectiveScorerPhone,
        effectiveScorerEmail,
        guestId,
        bgkUsername,
        (user as any)?.empCode || ''
      ).run().catch(() => {});
    }

    // Check if score is already locked for this judge
    const existingScore = await db.prepare(`
      SELECT is_locked FROM ci_kaizen_scores
      WHERE round_id = ? AND (submission_id = ? OR submission_id = ?) AND (judge_id = ? OR judge_id = ?)
    `).bind(roundId, canonicalId, canonicalCode, effectiveJudgeId, userEmpCode).first().catch(() => null);

    if (existingScore && Boolean(existingScore.is_locked) && !isExecutiveOrAdmin(user)) {
      return NextResponse.json({
        success: false,
        error: 'Điểm của bạn đã được gửi và khóa. Chỉ Admin/Ban 2.2 mới có thể mở khóa để sửa điểm.',
      }, { status: 403 });
    }

    const sessionId = `gss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const guestAccountId = (user as any)?.empCode?.replace('GUEST_', '') || user.empCode;
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || '127.0.0.1';

    // Apply 60% cap if data is not independently verified
    const rawC1 = Number(c1Score) || 0;
    const rawC2 = Number(c2Score) || 0;
    const rawC3 = Number(c3Score) || 0;
    const rawC4 = Number(c4Score) || 0;
    const rawC5 = Number(c5Score) || 0;

    const maxCaps = { c1: 35, c2: 20, c3: 20, c4: 15, c5: 10 };
    const capFactor = isVerifiedData ? 1.0 : 0.6;

    const finalC1 = Math.min(rawC1, maxCaps.c1 * capFactor);
    const finalC2 = Math.min(rawC2, maxCaps.c2 * capFactor);
    const finalC3 = Math.min(rawC3, maxCaps.c3 * capFactor);
    const finalC4 = Math.min(rawC4, maxCaps.c4 * capFactor);
    const finalC5 = Math.min(rawC5, maxCaps.c5 * capFactor);

    const judgeTotalScore = Math.round((finalC1 + finalC2 + finalC3 + finalC4 + finalC5) * 10) / 10;
    const scoreId = `score_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Prepare atomic transaction statements for D1
    const batchStatements: any[] = [];

    if (isGuest) {
      batchStatements.push(
        db.prepare(`
          INSERT INTO ci_kaizen_guest_scoring_sessions (
            id, judge_account_id, submission_id, nguoi_cham_thuc_ho_ten, nguoi_cham_thuc_msnv,
            nguoi_cham_thuc_sdt, nguoi_cham_thuc_email, thoi_diem_gui, ip_thiet_bi, da_gui
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 1)
        `).bind(
          sessionId,
          guestAccountId,
          canonicalCode,
          effectiveScorerName,
          effectiveScorerEmp,
          effectiveScorerPhone,
          effectiveScorerEmail,
          clientIp
        )
      );
    }

    // 1. Remove existing score entry if re-scoring
    batchStatements.push(
      db.prepare(`
        DELETE FROM ci_kaizen_scores
        WHERE round_id = ? AND (submission_id = ? OR submission_id = ?) AND (judge_id = ? OR judge_id = ?)
      `).bind(roundId, canonicalId, canonicalCode, effectiveJudgeId, user.empCode)
    );

    // 2. Insert new score record (is_locked = 1 after submission)
    batchStatements.push(
      db.prepare(`
        INSERT INTO ci_kaizen_scores (
          id, round_id, submission_id, judge_id, judge_name, c1_group,
          c1_score, c2_score, c3_score, c4_score, c5_score, total_score,
          c1_basis, c2_basis, c3_basis, c4_basis, c5_basis, is_verified_data, is_locked,
          guest_scoring_session_id, nguoi_cham_thuc_ho_ten, real_scorer_emp_code,
          real_scorer_org, real_scorer_phone, real_scorer_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
      `).bind(
        scoreId,
        roundId,
        canonicalCode,
        effectiveJudgeId,
        effectiveScorerName,
        c1Group,
        finalC1,
        finalC2,
        finalC3,
        finalC4,
        finalC5,
        judgeTotalScore,
        cleanC1Basis,
        cleanC2Basis,
        cleanC3Basis,
        cleanC4Basis,
        cleanC5Basis,
        isVerifiedData ? 1 : 0,
        isGuest ? sessionId : null,
        effectiveScorerName,
        effectiveScorerEmp,
        effectiveScorerOrg,
        effectiveScorerPhone,
        effectiveScorerEmail
      )
    );

    // 3. Update assignment status to SCORED
    batchStatements.push(
      db.prepare(`
        UPDATE ci_kaizen_judge_assignments
        SET status = 'SCORED', updated_at = CURRENT_TIMESTAMP
        WHERE (submission_id = ? OR submission_id = ?) AND (judge_id = ? OR judge_id = ? OR judge_id = ?)
      `).bind(canonicalId, canonicalCode, user.empCode, effectiveJudgeId, (user as any)?.username || '')
    );

    // Execute atomic batch for D1 database
    await db.batch(batchStatements);

    // Trigger async backup of score session to Google Drive
    try {
      const { syncGuestScoringSessionToGDrive } = await import('@/lib/googleDriveBackup');
      (async () => {
        await syncGuestScoringSessionToGDrive(process.env, {
          sessionId: isGuest ? sessionId : scoreId,
          judgeAccountId: guestAccountId,
          username: (user as any)?.username || user.name,
          submissionId: canonicalCode,
          realScorerName: effectiveScorerName,
          realScorerPhone: effectiveScorerPhone,
          realScorerEmail: effectiveScorerEmail,
          c1Score: finalC1,
          c2Score: finalC2,
          c3Score: finalC3,
          c4Score: finalC4,
          c5Score: finalC5,
          totalScore: judgeTotalScore,
          submittedAt: new Date().toISOString(),
          ip: clientIp,
        });
      })().catch((err) => console.warn('[GDrive Sync Error]:', err));
    } catch (e) {}

    // Calculate exact N-judge average total score (sumTotal / judgeCount)
    const { results: allJudgeScores } = await db.prepare(`
      SELECT total_score, c1_score, c3_score FROM ci_kaizen_scores
      WHERE UPPER(submission_id) = UPPER(?) 
         OR UPPER(submission_id) = UPPER(?) 
         OR UPPER(submission_id) = (SELECT UPPER(code) FROM ci_kaizen_proposals WHERE id = ?) 
         OR UPPER(submission_id) = (SELECT UPPER(id) FROM ci_kaizen_proposals WHERE code = ?)
    `).bind(canonicalId, canonicalCode, canonicalId, canonicalCode).all();

    let updatedProposalStatus = 'DA_DANH_GIA';
    let avgFinalTotalScore = judgeTotalScore;
    let judgeCount = 1;

    if (allJudgeScores && allJudgeScores.length > 0) {
      judgeCount = allJudgeScores.length;
      const sumTotal = allJudgeScores.reduce((acc: number, s: any) => acc + Number(s.total_score || 0), 0);
      const sumC1 = allJudgeScores.reduce((acc: number, s: any) => acc + Number(s.c1_score || 0), 0);
      const sumC3 = allJudgeScores.reduce((acc: number, s: any) => acc + Number(s.c3_score || 0), 0);

      avgFinalTotalScore = Math.round((sumTotal / judgeCount) * 10) / 10;
      const avgFinalC1Score = Math.round((sumC1 / judgeCount) * 10) / 10;
      const avgFinalC3Score = Math.round((sumC3 / judgeCount) * 10) / 10;

      const scoreValues = allJudgeScores.map((s: any) => Number(s.total_score || 0));
      const maxScore = Math.max(...scoreValues);
      const minScore = Math.min(...scoreValues);
      const diff = maxScore - minScore;

      let isFlagged = 0;
      if (judgeCount >= 2 && diff > 15) {
        isFlagged = 1;
        const flagId = `flag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.prepare(`
          INSERT INTO ci_kaizen_score_flags (id, submission_id, round_id, flag_type, flag_message)
          VALUES (?, ?, ?, 'DIVERGENCE_EXCEEDED_15', ?)
        `).bind(
          flagId,
          canonicalCode,
          roundId,
          `⚠️ Chênh lệch điểm giữa các Giám khảo > 15 điểm (${minScore}đ vs ${maxScore}đ, chênh lệch ${diff}đ). Cần Ban 2.2 rà soát!`
        ).run().catch(() => {});
      }

      updatedProposalStatus = isFlagged === 1 ? 'CHO_RA_SOAT_DANG_FLAG' : 'DA_DANH_GIA';

      await db.prepare(`
        UPDATE ci_kaizen_proposals
        SET judge_final_score = ?,
            score_points = ?,
            c1_score_final = ?,
            c3_score_final = ?,
            is_score_flagged = ?,
            sub_status = ?,
            trang_thai = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR code = ?
      `).bind(
        avgFinalTotalScore,
        avgFinalTotalScore,
        avgFinalC1Score,
        avgFinalC3Score,
        isFlagged,
        updatedProposalStatus,
        updatedProposalStatus,
        canonicalId,
        canonicalCode
      ).run();
    }

    // Insert Audit Logs
    await db.prepare(`
      INSERT INTO sys_audit_logs (id, emp_code, emp_name, module, action, target_type, target_id, changes_json)
      VALUES (?, ?, ?, 'KAIZEN_JUDGING', 'SUBMIT_SCORE', 'PROPOSAL', ?, ?)
    `).bind(
      `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user.empCode,
      user.name,
      canonicalCode,
      JSON.stringify({ judgeTotalScore, isVerifiedData, effectiveScorerName })
    ).run().catch(() => {});

    await db.prepare(`
      INSERT INTO ci_kaizen_score_audit_log (id, judge_account_id, submission_id, hanh_dong, gia_tri_truoc, gia_tri_sau, ip_thiet_bi)
      VALUES (?, ?, ?, 'SUBMIT_SCORE', null, ?, ?)
    `).bind(
      `salog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user.empCode,
      canonicalCode,
      JSON.stringify({ judgeTotalScore, isVerifiedData, effectiveScorerName }),
      clientIp
    ).run().catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Đã nộp điểm chuyên môn và khóa bảng chấm điểm thành công!',
      judgeTotalScore,
      avgFinalTotalScore,
      totalJudgesScored: judgeCount,
      updatedProposalStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
