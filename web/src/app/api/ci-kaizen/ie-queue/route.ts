import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { getValidKaizenImageUrl } from '@/lib/kaizenImageHelper';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
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
    const empCode = String((session as any).empCode || '').trim().toUpperCase();
    const userRoles = Array.isArray((session as any).roles) ? (session as any).roles : [];
    let isIEOrAdmin = ['IE', 'SUPER_ADMIN', 'ADMIN', 'TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC', 'CI_LEAD'].includes(userRole) ||
      userRoles.includes('ie') || userRoles.includes('ci_lead') || userRoles.includes('admin') ||
      ['201711002', '210602002', '202608001', '202608010', '222102020', '202112003'].includes(empCode);

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      if (!isIEOrAdmin && empCode) {
        const permRow = await db.prepare(`
          SELECT id FROM ci_kaizen_permissions 
          WHERE UPPER(emp_code) = ? AND role_type IN ('IE', 'CI_LEAD', 'ADMIN') AND is_active = 1 
          LIMIT 1
        `).bind(empCode).first().catch(() => null);
        if (permRow) isIEOrAdmin = true;
      }
    }

    if (!isIEOrAdmin) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Yêu cầu vai trò IE hoặc Admin để truy cập hàng chờ (403 Forbidden)' },
        { status: 403 }
      );
    }

    if (db) {
      const query = `
        SELECT * FROM ci_kaizen_proposals
        WHERE (sub_status = 'CHO_IE_XAC_NHAN' OR trang_thai = 'CHO_IE_XAC_NHAN' OR review_status = 'CHO_IE_XAC_NHAN' OR (status = 'SUBMITTED' AND (ie_confirmed_by IS NULL OR ie_confirmed_by = '')))
          AND (is_archived IS NULL OR is_archived = 0)
        ORDER BY created_at DESC LIMIT 500
      `;
      const { results } = await db.prepare(query).all();

      const cleanedResults = (results || []).map((p: any) => ({
        ...p,
        before_image_url: getValidKaizenImageUrl(p.before_image_url, p.attachments_json) || p.before_image_url || '',
        after_image_url: getValidKaizenImageUrl(p.after_image_url) || p.after_image_url || '',
      }));

      return NextResponse.json({
        success: true,
        data: cleanedResults,
        proposals: cleanedResults,
        total: cleanedResults.length,
      });
    }

    return NextResponse.json({ success: true, data: [], proposals: [], total: 0 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Lỗi truy vấn hàng chờ IE' }, { status: 500 });
  }
}
