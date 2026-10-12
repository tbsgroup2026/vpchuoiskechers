import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { matchRegionFilter } from '@/lib/kaizenRegionHelper';

export const runtime = 'edge';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request, { maxRoleLevel: 3 });
    if (auth.response) return auth.response;
    const session = auth.session;

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database binding (DB) not found' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query') || searchParams.get('q') || '').trim().toLowerCase();
    const region = (searchParams.get('region') || '').trim();
    const isLockedParam = searchParams.get('isLocked') || searchParams.get('locked');

    const { results: scores } = await db.prepare(`
      SELECT 
        s.id AS score_id,
        s.round_id,
        s.submission_id,
        COALESCE(p.code, p.id, s.submission_id) AS proposal_code,
        COALESCE(p.title, (SELECT title FROM ci_kaizen_proposals WHERE TRIM(id) = TRIM(s.submission_id) OR UPPER(TRIM(code)) = UPPER(TRIM(s.submission_id)) OR UPPER(TRIM(proposer_emp_code)) = UPPER(TRIM(s.submission_id)) LIMIT 1), 'Sáng kiến #' || s.submission_id) AS proposal_title,
        COALESCE(p.region, p.factory, 'Nhà Máy Miền Đông') AS proposal_region,
        COALESCE(p.department, '---') AS proposal_dept,
        s.judge_id,
        s.judge_name,
        s.c1_group,
        s.c1_score,
        s.c2_score,
        s.c3_score,
        s.c4_score,
        s.c5_score,
        s.total_score,
        s.c1_basis,
        s.c2_basis,
        s.c3_basis,
        s.c4_basis,
        s.c5_basis,
        s.is_verified_data,
        COALESCE(s.is_locked, 1) AS is_locked,
        s.guest_scoring_session_id,
        COALESCE(s.nguoi_cham_thuc_ho_ten, s.judge_name, 'BGK') AS nguoi_cham_thuc_ho_ten,
        COALESCE(s.real_scorer_emp_code, '') AS real_scorer_emp_code,
        COALESCE(s.real_scorer_org, '') AS real_scorer_org,
        COALESCE(s.real_scorer_phone, '') AS real_scorer_phone,
        COALESCE(s.real_scorer_email, '') AS real_scorer_email,
        s.created_at,
        s.updated_at,
        g.username AS guest_username,
        g.full_name AS guest_account_name,
        g.dung_chung AS is_guest_shared
      FROM ci_kaizen_scores s
      LEFT JOIN ci_kaizen_proposals p ON (TRIM(s.submission_id) = TRIM(p.id) OR UPPER(TRIM(s.submission_id)) = UPPER(TRIM(p.code)) OR UPPER(TRIM(s.submission_id)) = UPPER(TRIM(p.proposer_emp_code)) OR s.submission_id = p.id OR s.submission_id = p.code)
      LEFT JOIN ci_kaizen_judge_guest_accounts g ON (s.judge_id = g.id OR s.judge_id = ('GUEST_' || g.id) OR s.judge_id = g.username OR UPPER(s.judge_id) = UPPER(g.username))
      ORDER BY s.created_at DESC
    `).all();

    let filtered = scores || [];

    if (query) {
      filtered = filtered.filter((s: any) => {
        const fullTxt = [
          s.nguoi_cham_thuc_ho_ten,
          s.real_scorer_emp_code,
          s.real_scorer_org,
          s.proposal_code,
          s.proposal_title,
          s.judge_id,
          s.guest_username,
        ].filter(Boolean).join(' ').toLowerCase();
        return fullTxt.includes(query);
      });
    }

    if (region && region !== 'ALL') {
      filtered = filtered.filter((s: any) => matchRegionFilter(s.proposal_region, region));
    }

    if (isLockedParam && isLockedParam !== 'ALL') {
      const lockVal = isLockedParam === '1' ? 1 : 0;
      filtered = filtered.filter((s: any) => {
        const sLock = s.is_locked === undefined || s.is_locked === null ? 1 : Number(s.is_locked);
        return sLock === lockVal;
      });
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      scores: filtered,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database binding (DB) not found' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Vui lòng đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const { action, scoreId, lyDo } = body;

    if (action === 'GET_AUDIT_LOGS') {
      const { results: logs } = await db.prepare(`
        SELECT * FROM ci_kaizen_score_audit_log
        WHERE score_id = ? OR submission_id = ?
        ORDER BY created_at DESC
      `).bind(scoreId || '', scoreId || '').all().catch(() => ({ results: [] }));

      return NextResponse.json({
        success: true,
        logs: logs || [],
      });
    }

    if (action === 'UNLOCK_SCORE') {
      if (!scoreId) {
        return NextResponse.json({ success: false, error: 'Mã lượt chấm điểm không hợp lệ' }, { status: 400 });
      }

      await db.prepare(`
        UPDATE ci_kaizen_scores
        SET is_locked = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(scoreId).run();

      const unlockReason = lyDo || 'Admin (Ban 2.2) mở khóa cho phép chấm lại';

      await db.prepare(`
        INSERT INTO ci_kaizen_score_audit_log (id, score_id, judge_account_id, submission_id, hanh_dong, ly_do, created_by, gia_tri_truoc, gia_tri_sau, ip_thiet_bi)
        VALUES (?, ?, ?, (SELECT submission_id FROM ci_kaizen_scores WHERE id = ?), 'UNLOCK_SCORE', ?, ?, 'LOCKED', 'UNLOCKED', ?)
      `).bind(
        `salog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        scoreId,
        user.empCode,
        scoreId,
        unlockReason,
        user.empCode,
        request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || '127.0.0.1'
      ).run().catch(() => {});

      return NextResponse.json({
        success: true,
        message: '✅ Đã mở khóa lượt chấm điểm và ghi nhật ký score_audit_log thành công. Giám khảo có thể chỉnh sửa lại điểm.',
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Lỗi xử lý yêu cầu' }, { status: 500 });
  }
}
