import { NextResponse } from 'next/server';
import { getAuthUser, isExecutiveOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');
    const judgeEmpCode = searchParams.get('judgeId') || user.empCode;
    const viewAll = searchParams.get('all') === '1' && isExecutiveOrAdmin(user);

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: true, assignments: [] });
    await ensureKaizenSchema(db);

    let query = `
      SELECT a.*, p.title, p.code, p.department, p.region, p.factory, p.before_description,
             p.after_solution, p.before_image_url, p.after_image_url, p.attachments_json,
             p.proposer_name, p.proposer_emp_code, p.sub_status, p.approval_status
      FROM ci_kaizen_judge_assignments a
      JOIN ci_kaizen_proposals p ON a.submission_id = p.id OR a.submission_id = p.code
    `;
    const params: any[] = [];

    if (!viewAll) {
      query += ` WHERE (a.judge_id = ? OR a.judge_id = ?) AND a.is_conflict = 0`;
      params.push(judgeEmpCode, user.empCode);
    } else {
      query += ` WHERE 1=1`;
    }

    if (roundId) {
      query += ` AND a.round_id = ?`;
      params.push(roundId);
    }

    query += ` ORDER BY a.assigned_at DESC`;

    const { results } = params.length > 0
      ? await db.prepare(query).bind(...params).all()
      : await db.prepare(query).all();

    return NextResponse.json({
      success: true,
      assignments: results || [],
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
    const { action, roundId, judgeId, judgeName, submissionId, conflictReason } = body;

    // Report conflict of interest (Nút "Xin rút / Báo cáo xung đột lợi ích")
    if (action === 'REPORT_CONFLICT') {
      if (!submissionId || !conflictReason) {
        return NextResponse.json({ success: false, error: 'Vui lòng cung cấp mã hồ sơ và lý do xung đột' }, { status: 400 });
      }

      await db.prepare(`
        UPDATE ci_kaizen_judge_assignments
        SET is_conflict = 1, conflict_reason = ?, status = 'CONFLICT_REPORTED', updated_at = CURRENT_TIMESTAMP
        WHERE submission_id = ? AND (judge_id = ? OR judge_id = ?)
      `).bind(conflictReason.trim(), submissionId, user.empCode, judgeId || user.empCode).run();

      // Log in sys_audit_logs
      await db.prepare(`
        INSERT INTO sys_audit_logs (id, emp_code, emp_name, module, action, target_type, target_id, changes_json)
        VALUES (?, ?, ?, 'KAIZEN_JUDGING', 'REPORT_CONFLICT', 'PROPOSAL', ?, ?)
      `).bind(
        `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user.empCode,
        user.name,
        submissionId,
        JSON.stringify({ conflictReason })
      ).run().catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Đã ghi nhận báo cáo xung đột lợi ích. Hồ sơ đã được rút khỏi danh sách chấm!',
      });
    }

    // Admin Assign Judge
    if (action === 'ASSIGN') {
      if (!isExecutiveOrAdmin(user)) {
        return NextResponse.json({ success: false, error: 'Chỉ Admin mới có quyền phân công BGK' }, { status: 403 });
      }

      if (!roundId || !judgeId || !submissionId) {
        return NextResponse.json({ success: false, error: 'Thiếu thông tin phân công' }, { status: 400 });
      }

      // Check anti-conflict: do not auto-assign judge to proposal from judge's own department if matched
      const proposal = await db.prepare(`SELECT department, region, factory, proposer_emp_code FROM ci_kaizen_proposals WHERE id = ? OR code = ?`).bind(submissionId, submissionId).first();
      if (proposal && user.department && proposal.department && user.department.toLowerCase() === proposal.department.toLowerCase()) {
        console.warn(`[ASSIGN JUDGE] Warning: Judge ${judgeId} is in same department ${user.department} as proposal ${submissionId}`);
      }

      const assignId = `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.prepare(`
        INSERT INTO ci_kaizen_judge_assignments (id, round_id, judge_id, judge_name, submission_id, status)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
      `).bind(assignId, roundId, judgeId, judgeName || judgeId, submissionId).run();

      return NextResponse.json({
        success: true,
        message: `Phân công BGK ${judgeName || judgeId} chấm hồ sơ thành công!`,
        assignId,
      });
    }

    return NextResponse.json({ success: false, error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
