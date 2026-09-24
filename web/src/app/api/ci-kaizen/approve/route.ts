import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { convertNumberToWords } from '@/lib/numberToWords';



export async function GET() {
  return NextResponse.json({ success: true, message: 'Kaizen Approve API Endpoint' });
}

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu đăng nhập để thực hiện phê duyệt (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const roleCode = String((session as any)?.roleCode || (session as any)?.role || '').toUpperCase();
    const userEmpCode = String((session as any)?.empCode || '').trim();
    const userName = String((session as any)?.name || (session as any)?.proposer_name || '').toLowerCase();
    const userRoles = Array.isArray((session as any)?.roles) ? (session as any).roles : [];
    
    const isExplicitApprover = 
      ['202608001', '202608010', '222102020', '210602002', '201711002', '2026080001'].includes(userEmpCode) ||
      userName.includes('anh huy') || userName.includes('lê khải') || userName.includes('le khai') ||
      userName.includes('thanh tình') || userName.includes('thanh tinh') || userName.includes('trần thị ngoan') || userName.includes('ngoan');

    const isExecutiveOrAdmin = Boolean((session as any)?.isExecutiveOrAdmin) || ['TONG_GIAM_DOC', 'ADMIN', 'PHO_GIAM_DOC'].includes(roleCode) || userEmpCode === '201809012' || isExplicitApprover;
    const isApproverRole =
      isExecutiveOrAdmin ||
      isExplicitApprover ||
      (Boolean((session as any)?.levelRank) && Number((session as any).levelRank) >= 3) ||
      userEmpCode === '201809012' ||
      userRoles.includes('deputy_director') ||
      userRoles.includes('ci') ||
      userRoles.includes('ci_lead') ||
      userRoles.includes('ie') ||
      ['TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC', 'GIAM_DOC', 'PHO_GIAM_DOC', 'TRUONG_PHONG', 'CI_LEAD', 'IE', 'QC', 'ADMIN'].includes(roleCode);

    if (!isApproverRole) {
      return NextResponse.json(
        { success: false, message: 'Tài khoản của bạn không có quyền phê duyệt đề xuất này (403 Forbidden)' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      proposalId,
      decision,
      note,
      timeBeforeSeconds,
      timeAfterSeconds,
      savedSeconds,
      efficiencyValueVND,
      pairQuantity,
      so_luong_giay,
      totalSavingsVND,
      tong_tien_tiet_kiem,
      totalSavingsWords,
      tong_tien_bang_chu,
    } = body;

    if (!proposalId) {
      return NextResponse.json({ success: false, message: 'Mã đề xuất không hợp lệ' }, { status: 400 });
    }

    const pairQty = Number(pairQuantity || so_luong_giay || 0);
    const totalSavings = Number(totalSavingsVND || tong_tien_tiet_kiem || 0);
    const totalSavingsWordsVal = String(
      totalSavingsWords || tong_tien_bang_chu || (totalSavings > 0 ? convertNumberToWords(totalSavings) : 'Không đồng')
    );
    const timeBefore = Number(timeBeforeSeconds || 0);
    const timeAfter = Number(timeAfterSeconds || 0);
    const savedSecs = Number(savedSeconds || Math.max(0, timeBefore - timeAfter));
    const efficiencyVnd = Number(efficiencyValueVND || Math.round(savedSecs * 12.5));

    const isApproved = decision === 'APPROVE';
    const status = isApproved ? 'APPROVED' : 'REJECTED';
    const subStatus = isApproved ? 'DA_DANH_GIA' : 'TU_CHOI_TRIEN_KHAI';
    const approvalStatus = isApproved ? 'PHE_DUYET' : 'TU_CHOI';
    const trangThai = isApproved ? 'DA_DANH_GIA' : 'TU_CHOI_TRIEN_KHAI';

    const scorePoints = Math.round(efficiencyVnd > 0 ? efficiencyVnd : savedSecs * 12.5);
    const diemHieuQua = scorePoints;
    const diemTongHop = Math.max(1, savedSecs + Math.round(totalSavings / 10000) + scorePoints);

    const afterImageUrl = body.after_image_url || body.afterImageUrl || null;
    const attachmentsJson = body.attachments_json || body.attachmentsJson || null;
    const categoryVal = body.category || null;

    const productCodeVal = body.product_code || body.productCode || null;
    const db = getDbBinding();

    if (db) {
      try {
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN product_code TEXT').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN pair_quantity INTEGER DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN total_savings_vnd REAL DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN total_savings_words TEXT').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN after_image_url TEXT').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN attachments_json TEXT').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN category TEXT').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN trang_thai TEXT DEFAULT "CHO_DUYET"').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN review_status TEXT DEFAULT "CHO_DUYET"').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN so_giay_tiet_kiem REAL DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN diem_hieu_qua REAL DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN score_points REAL DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN diem_tong_hop REAL DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN hang_xep INTEGER DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN review_comment TEXT').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN saved_seconds REAL DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN time_before_seconds REAL DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN time_after_seconds REAL DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN efficiency_value_vnd REAL DEFAULT 0').run().catch(() => {});

        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN cost_before REAL DEFAULT 0').run().catch(() => {});
        await db.prepare('ALTER TABLE ci_kaizen_proposals ADD COLUMN cost_after REAL DEFAULT 0').run().catch(() => {});

        const query = `
          UPDATE ci_kaizen_proposals
          SET approval_status = ?,
              sub_status = ?,
              status = ?,
              trang_thai = ?,
              review_status = ?,
              category = COALESCE(?, category),
              product_code = COALESCE(?, product_code),
              time_before_seconds = CASE WHEN ? > 0 THEN ? ELSE time_before_seconds END,
              time_after_seconds = CASE WHEN ? >= 0 THEN ? ELSE time_after_seconds END,
              saved_seconds = CASE WHEN ? > 0 THEN ? ELSE saved_seconds END,
              so_giay_tiet_kiem = CASE WHEN ? > 0 THEN ? ELSE so_giay_tiet_kiem END,
              efficiency_value_vnd = CASE WHEN ? > 0 THEN ? ELSE efficiency_value_vnd END,
              diem_hieu_qua = CASE WHEN ? > 0 THEN ? ELSE diem_hieu_qua END,
              score_points = CASE WHEN ? > 0 THEN ? ELSE score_points END,
              diem_tong_hop = CASE WHEN ? > 0 THEN ? ELSE diem_tong_hop END,
              pair_quantity = CASE WHEN ? > 0 THEN ? ELSE pair_quantity END,
              total_savings_vnd = CASE WHEN ? > 0 THEN ? ELSE total_savings_vnd END,
              cost_before = CASE WHEN ? > 0 THEN ? ELSE cost_before END,
              cost_after = CASE WHEN ? >= 0 THEN ? ELSE cost_after END,
              total_savings_words = COALESCE(NULLIF(?, ''), total_savings_words),
              after_image_url = COALESCE(?, after_image_url),
              attachments_json = COALESCE(?, attachments_json),
              review_comment = COALESCE(?, review_comment),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? OR code = ? OR LOWER(id) = LOWER(?) OR LOWER(code) = LOWER(?)
        `;

        const costBeforeVal = Number(body.cost_before ?? body.costBefore ?? 0);
        const costAfterVal = Number(body.cost_after ?? body.costAfter ?? 0);

        await db
          .prepare(query)
          .bind(
            approvalStatus,
            subStatus,
            status,
            trangThai,
            subStatus,
            categoryVal,
            productCodeVal,
            timeBefore, timeBefore,
            timeAfter, timeAfter,
            savedSecs, savedSecs,
            savedSecs, savedSecs,
            efficiencyVnd, efficiencyVnd,
            diemHieuQua, diemHieuQua,
            scorePoints, scorePoints,
            diemTongHop, diemTongHop,
            pairQty, pairQty,
            totalSavings, totalSavings,
            costBeforeVal, costBeforeVal,
            costAfterVal, costAfterVal,
            totalSavingsWordsVal,
            afterImageUrl,
            attachmentsJson,
            note || null,
            proposalId,
            body.code || proposalId,
            proposalId,
            body.code || proposalId
          )
          .run();

        // Recalculate leaderboard ranks for all approved proposals
        if (isApproved) {
          try {
            const { results } = await db.prepare(`
              SELECT id, saved_seconds, so_giay_tiet_kiem, efficiency_value_vnd, diem_hieu_qua, score_points, total_savings_vnd
              FROM ci_kaizen_proposals
              WHERE approval_status = 'PHE_DUYET' OR sub_status = 'DA_DANH_GIA' OR trang_thai = 'DA_DANH_GIA'
            `).all();

            if (results && results.length > 0) {
              const scored = results.map((p: any) => {
                const secs = Number(p.so_giay_tiet_kiem || p.saved_seconds || 0);
                const eff = Number(p.diem_hieu_qua || p.score_points || 0);
                const vnd = Number(p.total_savings_vnd || 0);
                const scoreVal = secs + eff + Math.round(vnd / 10000);
                return { id: p.id, totalScore: Math.max(1, scoreVal) };
              });

              scored.sort((a: any, b: any) => b.totalScore - a.totalScore);

              for (let i = 0; i < scored.length; i++) {
                const rank = i + 1;
                await db.prepare(`
                  UPDATE ci_kaizen_proposals
                  SET hang_xep = ?, diem_tong_hop = ?, trang_thai = 'DA_DANH_GIA', sub_status = 'DA_DANH_GIA'
                  WHERE id = ?
                `).bind(rank, scored[i].totalScore, scored[i].id).run().catch(() => {});
              }
            }
          } catch (rErr) {
            console.warn('[APPROVE API] Recalculate ranks warning:', rErr);
          }
        }

        await db
          .prepare(`
            INSERT INTO ci_kaizen_status_history (
              proposal_id, from_status, to_status, action, actor_id, actor_name, note, created_at
            ) VALUES (?, 'SUBMITTED', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `)
          .bind(
            proposalId,
            subStatus,
            isApproved ? 'APPROVE' : 'REJECT',
            userEmpCode || session?.empCode || 'SYSTEM',
            session?.name || 'Người Phê Duyệt',
            note || (isApproved ? 'Đã phê duyệt tính khả thi (Bước 3)' : 'Từ chối triển khai')
          )
          .run()
          .catch(() => {});
      } catch (dbErr) {
        console.warn('[APPROVE API] DB update warning:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: isApproved ? 'Đã phê duyệt sáng kiến thành công!' : 'Đã từ chối triển khai sáng kiến.',
      status,
      sub_status: subStatus,
      approval_status: approvalStatus,
      time_before_seconds: timeBefore,
      time_after_seconds: timeAfter,
      saved_seconds: savedSecs,
      efficiency_value_vnd: efficiencyVnd,
      pair_quantity: pairQty,
      total_savings_vnd: totalSavings,
      total_savings_words: totalSavingsWordsVal,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi xử lý phê duyệt';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
