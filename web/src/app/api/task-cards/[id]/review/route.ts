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
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const cardId = params.id;
    if (!cardId) {
      return NextResponse.json({ success: false, error: 'cardId không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const { rating = 5, comment = '' } = body;

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'D1 binding unavailable' }, { status: 500 });

    await ensureKaizenSchema(db);

    const existing: any = await db.prepare('SELECT * FROM task_cards WHERE id = ?').bind(cardId).first();
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thẻ công việc' }, { status: 404 });
    }

    const reviewerId = (session as any).empCode || (session as any).userId || 'MANAGER';
    const reviewId = `tcr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Insert review record
    await db.prepare(
      'INSERT INTO task_card_reviews (id, card_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?, ?)'
    ).bind(reviewId, cardId, reviewerId, Number(rating) || 5, comment || '').run();

    // Mark card as done
    await db.prepare(
      "UPDATE task_cards SET status = 'done', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(cardId).run();

    await recordAuditLog(
      session,
      'TASK_BOARD',
      'REVIEW_TASK_CARD',
      cardId,
      { status: existing.status },
      { status: 'done', rating: Number(rating) || 5, comment, reviewer_id: reviewerId },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Đã nghiệm thu và đánh giá thẻ công việc thành công!',
      rating: Number(rating) || 5,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
