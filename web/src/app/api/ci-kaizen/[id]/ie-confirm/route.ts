import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { recordAuditLog } from '@/lib/auditLogger';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const userRole = (session as any).roleCode || (session as any).role || '';
    const isIEOrAdmin = ['IE', 'SUPER_ADMIN', 'ADMIN', 'TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC'].includes(userRole);

    if (!isIEOrAdmin) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Yêu cầu vai trò IE hoặc Admin để xác nhận thời gian (403 Forbidden)' },
        { status: 403 }
      );
    }

    const proposalId = params.id;
    if (!proposalId) {
      return NextResponse.json({ success: false, error: 'Mã đề xuất không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const { time_before, time_after, note } = body;

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 Database connection unavailable' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    const existing: any = await db.prepare('SELECT * FROM ci_kaizen_proposals WHERE id = ?').bind(proposalId).first();
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đề xuất Kaizen' }, { status: 404 });
    }

    const origTimeBefore = existing.saved_seconds || existing.so_giay_tiet_kiem || existing.ie_time_before_original || 0;
    const origTimeAfter = existing.ie_time_after_original || 0;

    const confirmedTimeBefore = Number(time_before) || origTimeBefore;
    const confirmedTimeAfter = Number(time_after) || origTimeAfter;
    const confirmedSavedSeconds = Math.max(0, confirmedTimeBefore - confirmedTimeAfter);

    const ieConfirmedBy = (session as any).name || (session as any).empCode || 'Kỹ Sư IE';
    const nowIso = new Date().toISOString();

    const updateSql = `
      UPDATE ci_kaizen_proposals
      SET sub_status = 'CHO_PHE_DUYET_TRIEN_KHAI',
          trang_thai = 'CHO_PHE_DUYET_TRIEN_KHAI',
          review_status = 'CHO_PHE_DUYET_TRIEN_KHAI',
          ie_confirmed_by = ?,
          ie_confirmed_at = CURRENT_TIMESTAMP,
          ie_time_before_original = COALESCE(ie_time_before_original, ?),
          ie_time_before_confirmed = ?,
          ie_time_after_original = COALESCE(ie_time_after_original, ?),
          ie_time_after_confirmed = ?,
          saved_seconds = ?,
          so_giay_tiet_kiem = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await db.prepare(updateSql).bind(
      ieConfirmedBy,
      origTimeBefore,
      confirmedTimeBefore,
      origTimeAfter,
      confirmedTimeAfter,
      confirmedSavedSeconds,
      confirmedSavedSeconds,
      proposalId
    ).run();

    await recordAuditLog(
      session,
      'KAIZEN_IE',
      'IE_CONFIRM_TIME',
      proposalId,
      { status: existing.sub_status, time_before: origTimeBefore },
      { status: 'CHO_PHE_DUYET_TRIEN_KHAI', time_before_confirmed: confirmedTimeBefore, time_after_confirmed: confirmedTimeAfter, ie_confirmed_by: ieConfirmedBy, note },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Xác nhận thời gian IE và chuyển trạng thái Chờ phê duyệt triển khai thành công!',
      proposal_id: proposalId,
      saved_seconds: confirmedSavedSeconds,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Lỗi xác nhận thời gian IE' }, { status: 500 });
  }
}
