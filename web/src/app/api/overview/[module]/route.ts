import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export function generateStaticParams() {
  return [{ module: 'sample' }];
}

export async function GET(request: Request, { params }: { params: { module: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const targetModule = params.module || 'kaizen';
    const { searchParams } = new URL(request.url);
    const plantGroup = searchParams.get('plant_group') || 'ALL';
    const plantCode = searchParams.get('plant_code') || 'ALL';

    const db = getDbBinding();

    if (db) {
      await ensureKaizenSchema(db);

      if (targetModule === 'kaizen') {
        let whereClause = 'WHERE (is_archived IS NULL OR is_archived = 0)';
        const bindings: any[] = [];

        if (plantGroup === 'TO_HOP_KIEN_GIANG') {
          whereClause += " AND (plant_group = 'TO_HOP_KIEN_GIANG' OR site_code = 'thkiengiangshoes' OR LOWER(source_region) LIKE '%kiên giang%' OR LOWER(factory) LIKE '%kiên giang%')";
        } else if (plantGroup === 'VPCHUOI') {
          whereClause += " AND (site_code != 'thkiengiangshoes' AND LOWER(source_region) NOT LIKE '%kiên giang%')";
        } else if (plantGroup === 'MIEN_DONG') {
          whereClause += " AND (plant_group = 'MIEN_DONG' OR LOWER(factory) LIKE '%miền đông%')";
        }

        if (plantCode !== 'ALL') {
          whereClause += " AND (plant_code = ? OR LOWER(factory) LIKE ?)";
          bindings.push(plantCode, `%${plantCode.toLowerCase()}%`);
        }

        const totalRes = await db.prepare(`SELECT COUNT(*) as count FROM ci_kaizen_proposals ${whereClause}`).bind(...bindings).first();
        const approvedRes = await db.prepare(`SELECT COUNT(*) as count FROM ci_kaizen_proposals ${whereClause} AND (approval_status = 'PHE_DUYET' OR sub_status = 'DA_DANH_GIA')`).bind(...bindings).first();
        const pendingRes = await db.prepare(`SELECT COUNT(*) as count FROM ci_kaizen_proposals ${whereClause} AND (sub_status = 'CHO_DUYET' OR sub_status = 'CHO_IE_XAC_NHAN' OR sub_status = 'CHO_PHE_DUYET_TRIEN_KHAI')`).bind(...bindings).first();
        const savingsRes = await db.prepare(`SELECT SUM(so_giay_tiet_kiem) as total_seconds, SUM(total_savings_vnd) as total_vnd FROM ci_kaizen_proposals ${whereClause}`).bind(...bindings).first();

        return NextResponse.json({
          success: true,
          module: 'kaizen',
          plant_group: plantGroup,
          plant_code: plantCode,
          stats: {
            total_proposals: Number(totalRes?.count || 0),
            approved_proposals: Number(approvedRes?.count || 0),
            pending_proposals: Number(pendingRes?.count || 0),
            total_saved_seconds: Number(savingsRes?.total_seconds || 0),
            total_savings_vnd: Number(savingsRes?.total_vnd || 0),
          },
        });
      }

      // Default stats for Gemba & Maintenance modules
      return NextResponse.json({
        success: true,
        module: targetModule,
        plant_group: plantGroup,
        plant_code: plantCode,
        stats: {
          total_items: 42,
          completed_items: 38,
          pending_items: 4,
        },
      });
    }

    return NextResponse.json({
      success: true,
      module: targetModule,
      plant_group: plantGroup,
      plant_code: plantCode,
      stats: { total_proposals: 0, approved_proposals: 0, pending_proposals: 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
