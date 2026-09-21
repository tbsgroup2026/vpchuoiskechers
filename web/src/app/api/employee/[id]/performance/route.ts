import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const empId = params.id;
    const db = getDbBinding();

    if (db) {
      await ensureKaizenSchema(db);
      const query = `
        SELECT r.rating, r.comment, r.reviewed_at, c.title, c.id as card_id
        FROM task_card_reviews r
        JOIN task_cards c ON r.card_id = c.id
        WHERE c.assignee_id = ? OR c.created_by = ?
        ORDER BY r.reviewed_at DESC LIMIT 100
      `;

      const { results } = await db.prepare(query).bind(empId, empId).all();
      const reviews = results || [];

      const totalReviews = reviews.length;
      const sumRatings = reviews.reduce((acc: number, item: any) => acc + (Number(item.rating) || 0), 0);
      const avgScore = totalReviews > 0 ? (sumRatings / totalReviews).toFixed(1) : '5.0';

      return NextResponse.json({
        success: true,
        employee_id: empId,
        average_score: Number(avgScore),
        total_completed_tasks: totalReviews,
        reviews,
      });
    }

    return NextResponse.json({
      success: true,
      employee_id: empId,
      average_score: 5.0,
      total_completed_tasks: 0,
      reviews: [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
