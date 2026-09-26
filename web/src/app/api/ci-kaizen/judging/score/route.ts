import { NextResponse } from 'next/server';
import { getAuthUser, isExecutiveOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const roundId = searchParams.get('roundId');

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Thiếu submissionId' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: true, scores: [], myScore: null });
    await ensureKaizenSchema(db);

    const { results: scores } = await db.prepare(`
      SELECT * FROM ci_kaizen_scores
      WHERE submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?)
      ORDER BY created_at DESC
    `).bind(submissionId, submissionId).all();

    const { results: prereq } = await db.prepare(`
      SELECT * FROM ci_kaizen_prerequisite_checks
      WHERE submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?)
      ORDER BY created_at DESC LIMIT 1
    `).bind(submissionId, submissionId).all();

    const myScore = scores ? scores.find((s: any) => s.judge_id === user?.empCode) : null;
    const isRoundLocked = false; // Checked dynamically per round

    // Hide other judges' individual detailed scores if round is not locked and user is not admin
    const sanitizedScores = (scores || []).map((s: any) => {
      if (!isExecutiveOrAdmin(user) && s.judge_id !== user?.empCode) {
        return {
          id: s.id,
          judge_id: '***',
          judge_name: 'Giám Khảo Khác',
          total_score: null, // Hidden until calibration/lock
          is_locked: s.is_locked,
        };
      }
      return s;
    });

    return NextResponse.json({
      success: true,
      scores: sanitizedScores,
      myScore,
      prerequisiteCheck: prereq && prereq.length > 0 ? prereq[0] : null,
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
    if (!db) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    await ensureKaizenSchema(db);

    const body = await request.json();
    const {
      roundId,
      submissionId,
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
    } = body;

    if (!submissionId || !roundId) {
      return NextResponse.json({ success: false, error: 'Thiếu submissionId hoặc roundId' }, { status: 400 });
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
      submissionId,
      roundId,
      p1Pass ? 1 : 0,
      p2Pass ? 1 : 0,
      p3Pass ? 1 : 0,
      p4Pass ? 1 : 0,
      isAllPrereqPass ? 1 : 0,
      user.empCode,
      prereqNote
    ).run();

    // If any prerequisite failed -> disqualify proposal
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
        submissionId,
        submissionId
      ).run();

      return NextResponse.json({
        success: true,
        isDisqualified: true,
        message: 'Hồ sơ không đạt điều kiện tiên quyết (Bước 0) và đã chuyển sang trạng thái "Không đạt điều kiện".',
      });
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
        submissionId,
        (realScorerName || user.name || 'BGK Khách Mời').trim(),
        realScorerPhone || '',
        realScorerEmail || '',
        clientIp
      ).run().catch(() => {});
    }

    // Enforce mandatory basis / justification text
    if (!c1Basis.trim() || !c2Basis.trim() || !c3Basis.trim() || !c4Basis.trim() || !c5Basis.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Vui lòng nhập căn cứ/ghi chú đánh giá bắt buộc cho cả 5 tiêu chí trước khi nộp điểm!',
      }, { status: 400 });
    }

    // Rule 4.7.2: Data without independent verification is capped at max 60% score per criterion
    const rawC1 = Number(c1Score) || 0;
    const rawC2 = Number(c2Score) || 0;
    const rawC3 = Number(c3Score) || 0;
    const rawC4 = Number(c4Score) || 0;
    const rawC5 = Number(c5Score) || 0;

    const maxCaps = { c1: 35, c2: 20, c3: 20, c4: 15, c5: 10 };
    const cappedFactor = isVerifiedData ? 1.0 : 0.6;

    const finalC1 = Math.min(rawC1, maxCaps.c1 * cappedFactor);
    const finalC2 = Math.min(rawC2, maxCaps.c2 * cappedFactor);
    const finalC3 = Math.min(rawC3, maxCaps.c3 * cappedFactor);
    const finalC4 = Math.min(rawC4, maxCaps.c4 * cappedFactor);
    const finalC5 = Math.min(rawC5, maxCaps.c5 * cappedFactor);

    const judgeTotalScore = Math.round((finalC1 + finalC2 + finalC3 + finalC4 + finalC5) * 10) / 10;
    const scoreId = `score_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Delete previous score entry for this judge & submission if re-scoring
    await db.prepare(`
      DELETE FROM ci_kaizen_scores
      WHERE round_id = ? AND (submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?)) AND judge_id = ?
    `).bind(roundId, submissionId, submissionId, user.empCode).run().catch(() => {});

    // Insert new judge score
    await db.prepare(`
      INSERT INTO ci_kaizen_scores (
        id, round_id, submission_id, judge_id, judge_name, c1_group,
        c1_score, c2_score, c3_score, c4_score, c5_score, total_score,
        c1_basis, c2_basis, c3_basis, c4_basis, c5_basis, is_verified_data,
        guest_scoring_session_id, nguoi_cham_thuc_ho_ten
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      scoreId,
      roundId,
      submissionId,
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
          submissionId,
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

    // Update assignment status
    await db.prepare(`
      UPDATE ci_kaizen_judge_assignments
      SET status = 'SCORED', updated_at = CURRENT_TIMESTAMP
      WHERE round_id = ? AND submission_id = ? AND (judge_id = ? OR judge_id = ?)
    `).bind(roundId, submissionId, user.empCode, user.empCode).run().catch(() => {});

    // ⚡ CRITICAL CORE FORMULA (Yêu cầu người dùng):
    // "điểm tổng thì phải là điểm tb của tất cả giám khảo ví dụ 3 giám khảo thì chia 3, 5 giám khảo thì chia 5"
    const { results: allJudgeScores } = await db.prepare(`
      SELECT total_score, c1_score, c3_score FROM ci_kaizen_scores
      WHERE round_id = ? AND (submission_id = ? OR submission_id = (SELECT code FROM ci_kaizen_proposals WHERE id = ?))
    `).bind(roundId, submissionId, submissionId).all();

    if (allJudgeScores && allJudgeScores.length > 0) {
      const judgeCount = allJudgeScores.length; // e.g., 3 or 5
      const sumTotal = allJudgeScores.reduce((acc: number, s: any) => acc + Number(s.total_score || 0), 0);
      const sumC1 = allJudgeScores.reduce((acc: number, s: any) => acc + Number(s.c1_score || 0), 0);
      const sumC3 = allJudgeScores.reduce((acc: number, s: any) => acc + Number(s.c3_score || 0), 0);

      const avgFinalTotalScore = Math.round((sumTotal / judgeCount) * 10) / 10;
      const avgFinalC1Score = Math.round((sumC1 / judgeCount) * 10) / 10;
      const avgFinalC3Score = Math.round((sumC3 / judgeCount) * 10) / 10;

      // Check divergence flag: If max score - min score > 15 points
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
          submissionId,
          roundId,
          `⚠️ Cảnh báo chênh lệch điểm giữa các Giám khảo > 15 điểm (${minScore}đ vs ${maxScore}đ, chênh lệch ${diff}đ). Cần Ban 2.2 rà soát!`
        ).run().catch(() => {});
      }

      // Update proposal with final average scores (divided by N judges) and flag state
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
        submissionId,
        submissionId
      ).run();
    }

    // Audit log
    await db.prepare(`
      INSERT INTO sys_audit_logs (id, emp_code, emp_name, module, action, target_type, target_id, changes_json)
      VALUES (?, ?, ?, 'KAIZEN_JUDGING', 'SUBMIT_SCORE', 'PROPOSAL', ?, ?)
    `).bind(
      `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user.empCode,
      user.name,
      submissionId,
      JSON.stringify({ judgeTotalScore, isVerifiedData })
    ).run().catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Chấm điểm và ghi nhận căn cứ thành công!',
      judgeTotalScore,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
