import { NextResponse } from 'next/server';
import { getAuthUser, isExecutiveOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isExecutiveOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: true, flags: [] });
    await ensureKaizenSchema(db);

    const { results } = await db.prepare(`
      SELECT f.*, p.title, p.code, p.department, p.factory, p.region
      FROM ci_kaizen_score_flags f
      JOIN ci_kaizen_proposals p ON f.submission_id = p.id OR f.submission_id = p.code
      WHERE f.is_resolved = 0
      ORDER BY f.created_at DESC
    `).all();

    return NextResponse.json({
      success: true,
      flags: results || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isExecutiveOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Chỉ Admin/Ban 2.2 mới có quyền xử lý cờ chênh lệch điểm' }, { status: 403 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    await ensureKaizenSchema(db);

    const body = await request.json();
    const { flagId, submissionId, action, overrideScore, resolutionNote } = body;

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Thiếu submissionId' }, { status: 400 });
    }

    if (action === 'RESOLVE_OVERRIDE') {
      const finalScore = Number(overrideScore);
      if (isNaN(finalScore) || finalScore < 0 || finalScore > 100) {
        return NextResponse.json({ success: false, error: 'Điểm chốt thủ công không hợp lệ (0-100đ)' }, { status: 400 });
      }

      // Mark flag resolved
      await db.prepare(`
        UPDATE ci_kaizen_score_flags
        SET is_resolved = 1, resolved_by = ?, resolution_note = ?, resolved_score = ?, updated_at = CURRENT_TIMESTAMP
        WHERE submission_id = ? OR id = ?
      `).bind(user.empCode, resolutionNote || 'Đã họp chốt điểm thủ công', finalScore, submissionId, flagId || '').run();

      // Unflag proposal and set final score for ranking
      await db.prepare(`
        UPDATE ci_kaizen_proposals
        SET is_score_flagged = 0,
            judge_final_score = ?,
            score_points = ?,
            sub_status = 'DA_DANH_GIA',
            trang_thai = 'DA_DANH_GIA',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR code = ?
      `).bind(finalScore, finalScore, submissionId, submissionId).run();

      return NextResponse.json({
        success: true,
        message: `Đã chốt điểm thủ công ${finalScore}đ và đưa hồ sơ trở lại bảng xếp hạng!`,
      });
    }

    if (action === 'RE_JUDGE') {
      await db.prepare(`
        UPDATE ci_kaizen_judge_assignments
        SET status = 'PENDING', updated_at = CURRENT_TIMESTAMP
        WHERE submission_id = ?
      `).bind(submissionId).run();

      await db.prepare(`
        UPDATE ci_kaizen_score_flags
        SET is_resolved = 1, resolved_by = ?, resolution_note = 'Yêu cầu BGK chấm lại', updated_at = CURRENT_TIMESTAMP
        WHERE submission_id = ? OR id = ?
      `).bind(user.empCode, submissionId, flagId || '').run();

      return NextResponse.json({
        success: true,
        message: 'Đã yêu cầu BGK chấm lại hồ sơ!',
      });
    }

    return NextResponse.json({ success: false, error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
