import { NextResponse } from 'next/server';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const proposalId = body.proposalId || body.id;

    if (!proposalId) {
      return NextResponse.json({ success: false, message: 'Mã đề xuất không hợp lệ' }, { status: 400 });
    }

    const db = getDbBinding();
    let updatedVoteCount = 1;

    if (db) {
      try {
        await db
          .prepare(
            `UPDATE ci_kaizen_proposals
             SET vote_count = COALESCE(vote_count, 0) + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .bind(proposalId)
          .run();

        const row = await db
          .prepare(`SELECT vote_count FROM ci_kaizen_proposals WHERE id = ?`)
          .bind(proposalId)
          .first();

        if (row && typeof row.vote_count === 'number') {
          updatedVoteCount = row.vote_count;
        }
      } catch (dbErr) {
        console.error('[ci-kaizen/vote DB error]', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã bình chọn đề xuất cải tiến thành công!',
      vote_count: updatedVoteCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi bình chọn đề xuất';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
