import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để cập nhật thông báo (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Mã thông báo không hợp lệ' }, { status: 400 });
    }

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      await db.prepare(`
        UPDATE sys_notifications
        SET is_read = 1
        WHERE id = ?
      `).bind(id).run().catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
