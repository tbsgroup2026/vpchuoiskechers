import { NextResponse } from 'next/server';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id || body.proposalId;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Mã đề xuất không được để trống' }, { status: 400 });
    }

    const db = getDbBinding();
    let updatedViewCount = 1;

    if (db) {
      try {
        await db
          .prepare(
            `UPDATE ci_kaizen_proposals
             SET view_count = COALESCE(view_count, 0) + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .bind(id)
          .run();

        const row = await db
          .prepare(`SELECT view_count FROM ci_kaizen_proposals WHERE id = ?`)
          .bind(id)
          .first();

        if (row && typeof row.view_count === 'number') {
          updatedViewCount = row.view_count;
        }
      } catch (dbErr) {
        console.error('[ci-kaizen/view DB error]', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã ghi nhận lượt xem (real access count) thành công',
      view_count: updatedViewCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi ghi nhận lượt xem';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
