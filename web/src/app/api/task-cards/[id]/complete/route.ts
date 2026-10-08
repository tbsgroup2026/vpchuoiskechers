import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { recordAuditLog } from '@/lib/auditLogger';
import { getCardPermissions } from '@/lib/taskPermissions';
import { updateTaskAtomically } from '@/lib/services/taskCardUpdater';

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
    if (!session) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });

    const cardId = params.id;
    if (!cardId) return NextResponse.json({ success: false, error: 'cardId không hợp lệ' }, { status: 400 });

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    const perm = await getCardPermissions(db, cardId, session);
    if (!perm.hasAccess) return NextResponse.json({ success: false, error: perm.error }, { status: perm.status });

    if (!perm.permissions.canComplete) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền báo cáo hoàn thành thẻ công việc này' }, { status: 403 });
    }

    const body = await request.json();
    const { version } = body;
    if (typeof version !== 'number') {
      return NextResponse.json({ success: false, error: 'Thiếu hoặc sai kiểu dữ liệu phiên bản (version)' }, { status: 428 });
    }

    const updates = {
      taskCardsSet: "status = 'pending_review', updated_at = CURRENT_TIMESTAMP",
      taskCardsParams: [],
      tasksSet: "status = 'REVIEW', updated_at = CURRENT_TIMESTAMP",
      tasksParams: []
    };

    const updateResult = await updateTaskAtomically(db, session, cardId, version, updates, 'task_cards');

    if (updateResult.type === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: updateResult.error }, { status: 404 });
    }
    if (updateResult.type === 'FORBIDDEN') {
      return NextResponse.json({ success: false, error: updateResult.error }, { status: 403 });
    }
    if (updateResult.type === 'CONFLICT') {
      return NextResponse.json({ success: false, error: updateResult.error, latestCard: updateResult.latestCard }, { status: 409 });
    }
    if (updateResult.type === 'SYNC_ERROR') {
      return NextResponse.json({ success: false, error: updateResult.error }, { status: 500 });
    }

    recordAuditLog(
      session, 'TASK_BOARD', 'COMPLETE_TASK_CARD', cardId,
      { status: perm.card.status }, { status: 'pending_review' }, request
    ).catch(() => {});

    return NextResponse.json({ success: true, message: 'Đã đánh dấu hoàn thành! Thẻ chuyển sang trạng thái chờ Trưởng phòng nghiệm thu.', version: updateResult.newVersion });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
