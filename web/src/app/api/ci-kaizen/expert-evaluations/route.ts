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

    // Fetch proposal
    const proposal = await db.prepare(`
      SELECT * FROM ci_kaizen_proposals
      WHERE id = ? OR code = ?
    `).bind(proposalId, proposalId).first();

    if (!proposal) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy sáng kiến' }, { status: 404 });
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
      WHERE submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?)
      ORDER BY created_at DESC
    `).bind(proposalId, proposalId).all();

    const myScore = (scores || []).find((s: any) => (s.judge_id || '').trim().toUpperCase() === userEmp) || null;

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

    // Fetch classification group mapping from DB config (Phase 1 & Phase 5)
    const catRaw = String(proposal.category || proposal.category_label || proposal.product_group || '').trim();
    const classMapRow = await db.prepare(`
      SELECT nhom_barem, tu_dong, ghi_chu FROM ci_kaizen_classification_group_map WHERE phan_loai = ?
    `).bind(catRaw).first().catch(() => null);

    return NextResponse.json({
      success: true,
      canSeeExpertTab: true,
      readOnly,
      readOnlyReason,
      declarationRequired,
      isGuest,
      guestAccount,
      classMapConfig: classMapRow || { nhom_barem: 'Nhóm 1', tu_dong: 1, ghi_chu: 'Mặc định Nhóm 1' },
      data: {
        proposal,
        prereqCheck,
        myScore,
        scores: sanitizedScores,
        totalJudgesScored,
        judgeFinalScore: proposal.judge_final_score || proposal.score_points || null,
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
      const { fullName, organization, contactInfo, noConflictDeclared } = body;
      if (!fullName || !fullName.trim()) {
        return NextResponse.json({ success: false, error: 'Họ và tên là bắt buộc' }, { status: 400 });
      }
      if (!noConflictDeclared) {
        return NextResponse.json({ success: false, error: 'Vui lòng xác nhận cam kết không có xung đột lợi ích' }, { status: 400 });
      }

      const guestId = (user as any)?.empCode?.replace('GUEST_', '') || '';
      await db.prepare(`
        UPDATE ci_kaizen_judge_guest_accounts
        SET full_name = ?, organization = ?, contact_info = ?, declaration_submitted = 1, no_conflict_declared = 1, used_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(fullName.trim(), organization || '', contactInfo || '', guestId).run();

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

    // Step 0: Prerequisite check
    const isAllPrereqPass = Boolean(p1Pass && p2Pass && p3Pass && p4Pass);
    const prereqId = `prereq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.prepare(`
      INSERT INTO ci_kaizen_prerequisite_checks (
        id, submission_id, round_id, p1_pass, p2_pass, p3_pass, p4_pass, is_all_pass, checked_by, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      prereqId,
      proposalId,
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
        proposalId,
        proposalId
      ).run();

      return NextResponse.json({
        success: true,
        isDisqualified: true,
        message: 'Hồ sơ không đạt điều kiện tiên quyết (Bước 0) và đã chuyển sang trạng thái "Không đạt điều kiện – loại".',
      });
    }

    // Enforce mandatory basis for all 5 criteria
    if (!c1Basis.trim() || !c2Basis.trim() || !c3Basis.trim() || !c4Basis.trim() || !c5Basis.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Bắt buộc phải nhập căn cứ/minh chứng chấm điểm cho cả 5 tiêu chí!',
      }, { status: 400 });
    }

    // Check if score is already locked for this judge
    const existingScore = await db.prepare(`
      SELECT is_locked FROM ci_kaizen_scores
      WHERE round_id = ? AND (submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?)) AND judge_id = ?
    `).bind(roundId, proposalId, proposalId, user.empCode).first().catch(() => null);

    if (existingScore && Boolean(existingScore.is_locked) && !isExecutiveOrAdmin(user)) {
      return NextResponse.json({
        success: false,
        error: 'Điểm của bạn đã được gửi và khóa. Chỉ Admin/Ban 2.2 mới có thể mở khóa để sửa điểm.',
      }, { status: 403 });
    }

    // Real Scorer Identity handling for Shared Guest Accounts
    const {
      realScorerName = '',
      realScorerPhone = '',
      realScorerEmail = '',
    } = body;

    const roleCode = String((user as any)?.roleCode || (user as any)?.role || '').toUpperCase();
    const userRoles = Array.isArray((user as any)?.roles) ? (user as any).roles : [];
    const isGuest = Boolean((user as any)?.isGuest || roleCode === 'JUDGE_GUEST' || userRoles.includes('judge_guest'));

    if (isGuest && (!realScorerName || !realScorerName.trim())) {
      return NextResponse.json({
        success: false,
        error: 'Vui lòng xác nhận Họ và tên người chấm thực trước khi nộp điểm!',
      }, { status: 400 });
    }

    const sessionId = `gss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const guestAccountId = (user as any)?.empCode?.replace('GUEST_', '') || user.empCode;
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || '127.0.0.1';

    if (isGuest) {
      await db.prepare(`
        INSERT INTO ci_kaizen_guest_scoring_sessions (
          id, judge_account_id, submission_id, nguoi_cham_thuc_ho_ten,
          nguoi_cham_thuc_sdt, nguoi_cham_thuc_email, thoi_diem_gui, ip_thiet_bi, da_gui
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 1)
      `).bind(
        sessionId,
        guestAccountId,
        proposalId,
        (realScorerName || user.name || 'BGK Khách Mời').trim(),
        realScorerPhone || '',
        realScorerEmail || '',
        clientIp
      ).run().catch(() => {});
    }

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

    // Remove existing score entry if re-scoring
    await db.prepare(`
      DELETE FROM ci_kaizen_scores
      WHERE round_id = ? AND (submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?)) AND judge_id = ?
    `).bind(roundId, proposalId, proposalId, user.empCode).run().catch(() => {});

    // Insert score record (is_locked = 1 after submission)
    await db.prepare(`
      INSERT INTO ci_kaizen_scores (
        id, round_id, submission_id, judge_id, judge_name, c1_group,
        c1_score, c2_score, c3_score, c4_score, c5_score, total_score,
        c1_basis, c2_basis, c3_basis, c4_basis, c5_basis, is_verified_data, is_locked,
        guest_scoring_session_id, nguoi_cham_thuc_ho_ten
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      scoreId,
      roundId,
      proposalId,
      user.empCode,
      (realScorerName || user.name || 'BGK Khách Mời').trim(),
      c1Group,
      finalC1,
      finalC2,
      finalC3,
      finalC4,
      finalC5,
      judgeTotalScore,
      c1Basis.trim(),
      c2Basis.trim(),
      c3Basis.trim(),
      c4Basis.trim(),
      c5Basis.trim(),
      isVerifiedData ? 1 : 0,
      isGuest ? sessionId : null,
      (realScorerName || user.name || 'BGK Khách Mời').trim()
    ).run();

    // Trigger async backup of score session to Google Drive
    try {
      const { syncGuestScoringSessionToGDrive } = await import('@/lib/googleDriveBackup');
      (async () => {
        await syncGuestScoringSessionToGDrive(process.env, {
          sessionId: isGuest ? sessionId : scoreId,
          judgeAccountId: guestAccountId,
          username: (user as any)?.username || user.name,
          submissionId: proposalId,
          realScorerName: (realScorerName || user.name).trim(),
          realScorerPhone,
          realScorerEmail,
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

    // ⚡ CRITICAL FORMULA: Calculate exact N-judge average total score (sumTotal / judgeCount)
    const { results: allJudgeScores } = await db.prepare(`
      SELECT total_score, c1_score, c3_score FROM ci_kaizen_scores
      WHERE round_id = ? AND (submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?))
    `).bind(roundId, proposalId, proposalId).all();

    if (allJudgeScores && allJudgeScores.length > 0) {
      const judgeCount = allJudgeScores.length; // N judges
      const sumTotal = allJudgeScores.reduce((acc: number, s: any) => acc + Number(s.total_score || 0), 0);
      const sumC1 = allJudgeScores.reduce((acc: number, s: any) => acc + Number(s.c1_score || 0), 0);
      const sumC3 = allJudgeScores.reduce((acc: number, s: any) => acc + Number(s.c3_score || 0), 0);

      const avgFinalTotalScore = Math.round((sumTotal / judgeCount) * 10) / 10;
      const avgFinalC1Score = Math.round((sumC1 / judgeCount) * 10) / 10;
      const avgFinalC3Score = Math.round((sumC3 / judgeCount) * 10) / 10;

      // Check divergence flag: max score - min score > 15 points
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
          proposalId,
          roundId,
          `⚠️ Chênh lệch điểm giữa các Giám khảo > 15 điểm (${minScore}đ vs ${maxScore}đ, chênh lệch ${diff}đ). Cần Ban 2.2 rà soát!`
        ).run().catch(() => {});
      }

      // Update proposal with final average score and flag state
      await db.prepare(`
        UPDATE ci_kaizen_proposals
        SET judge_final_score = ?,
            score_points = ?,
            c1_score_final = ?,
            c3_score_final = ?,
            is_score_flagged = ?,
            sub_status = CASE WHEN ? = 1 THEN 'CHO_RA_SOAT_DANG_FLAG' ELSE 'DA_DANH_GIA' END,
            trang_thai = CASE WHEN ? = 1 THEN 'CHO_RA_SOAT_DANG_FLAG' ELSE 'DA_DANH_GIA' END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR code = ?
      `).bind(
        avgFinalTotalScore,
        avgFinalTotalScore,
        avgFinalC1Score,
        avgFinalC3Score,
        isFlagged,
        isFlagged,
        isFlagged,
        proposalId,
        proposalId
      ).run();
    }

    // Insert Audit Logs (both sys_audit_logs and ci_kaizen_score_audit_log)
    await db.prepare(`
      INSERT INTO sys_audit_logs (id, emp_code, emp_name, module, action, target_type, target_id, changes_json)
      VALUES (?, ?, ?, 'KAIZEN_JUDGING', 'SUBMIT_SCORE', 'PROPOSAL', ?, ?)
    `).bind(
      `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user.empCode,
      user.name,
      proposalId,
      JSON.stringify({ judgeTotalScore, isVerifiedData })
    ).run().catch(() => {});

    await db.prepare(`
      INSERT INTO ci_kaizen_score_audit_log (id, judge_account_id, submission_id, hanh_dong, gia_tri_truoc, gia_tri_sau, ip_thiet_bi)
      VALUES (?, ?, ?, 'SUBMIT_SCORE', null, ?, ?)
    `).bind(
      `salog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user.empCode,
      proposalId,
      JSON.stringify({ judgeTotalScore, isVerifiedData }),
      request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || '127.0.0.1'
    ).run().catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Đã nộp điểm chuyên môn và khóa bảng chấm điểm thành công!',
      judgeTotalScore,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
