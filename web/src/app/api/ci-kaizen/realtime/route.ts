import { NextResponse } from 'next/server';
import { normalizeRegion, isTHKGRegion, STANDARD_DASHBOARD_REGIONS } from '@/lib/kaizenRegionHelper';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET() {
  try {
    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: 0,
      });
    }

    const res: any = await db
      .prepare(`
        SELECT MAX(updated_at) as max_updated, COUNT(*) as total_count
        FROM ci_kaizen_proposals
      `)
      .first()
      .catch(() => null);

    const maxUpdated = res?.max_updated || new Date().toISOString();
    const totalCount = Number(res?.total_count || 0);

    // Quick region counts using a lightweight query
    let regionCounts: Record<string, number> = {};
    try {
      const allRes = await db.prepare(`
        SELECT region, factory, source_region, department, site_code
        FROM ci_kaizen_proposals
      `).all();

      for (const r of STANDARD_DASHBOARD_REGIONS) {
        regionCounts[r] = 0;
      }

      if (allRes?.results) {
        for (const row of allRes.results as any[]) {
          const norm = normalizeRegion(row);
          regionCounts[norm] = (regionCounts[norm] || 0) + 1;
        }
      }

      // THKG parent total
      const thkgTotal = Object.entries(regionCounts)
        .filter(([key]) => isTHKGRegion(key))
        .reduce((sum, [, count]) => sum + count, 0);
      regionCounts['THKG'] = thkgTotal;
    } catch (e) {}

    return NextResponse.json(
      {
        success: true,
        timestamp: maxUpdated,
        count: totalCount,
        regions: regionCounts,
        server_time: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi kiểm tra thời gian thực' },
      { status: 500 }
    );
  }
}
