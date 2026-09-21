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
        { success: false, error: 'FORBIDDEN', message: 'Yêu cầu vai trò IE hoặc Admin để trả thẻ (403 Forbidden)' },
        { status: 403 }
      );
    }

    const proposalId = params.id;
    if (!proposalId) {
      return NextResponse.json({ success: false, error: 'Mã đề xuất không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const { rejection_reason } = body;

    if (!rejection_reason || !rejection_reason.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng cung cấp lý do trả lại thẻ Kaizen' }, { status: 400 });
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'D1 Database connection unavailable' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    const existing: any = await db.prepare('SELECT * FROM ci_kaizen_proposals WHERE id = ?').bind(proposalId).first();
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đề xuất Kaizen' }, { status: 404 });
    }

    const updateSql = `
      UPDATE ci_kaizen_proposals
      SET sub_status = 'CAN_CHINH_SUA',
          trang_thai = 'CAN_CHINH_SUA',
          review_status = 'CAN_CHINH_SUA',
          rejection_reason = ?,
          ie_confirmed_by = ?,
          ie_confirmed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const ieConfirmedBy = (session as any).name || (session as any).empCode || 'Kỹ Sư IE';
    await db.prepare(updateSql).bind(rejection_reason.trim(), ieConfirmedBy, proposalId).run();

    await recordAuditLog(
      session,
      'KAIZEN_IE',
      'IE_REJECT_PROPOSAL',
      proposalId,
      { status: existing.sub_status },
      { status: 'CAN_CHINH_SUA', rejection_reason: rejection_reason.trim(), ie_confirmed_by: ieConfirmedBy },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Đã trả lại thẻ Kaizen cho người đề xuất chỉnh sửa!',
      proposal_id: proposalId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Lỗi khi trả lại thẻ Kaizen' }, { status: 500 });
  }
}
