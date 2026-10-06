import { NextResponse } from 'next/server';


import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { normalizeRegion, STANDARD_DASHBOARD_REGIONS, isTHKGRegion } from '@/lib/kaizenRegionHelper';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET() {
  try {
    const db = getDbBinding();

    if (db) {
      await ensureKaizenSchema(db);

      const countsQuery = `
        SELECT 
          SUM(CASE WHEN (COALESCE(trang_thai, sub_status) IN ('CHO_DUYET', 'CHO_DANH_GIA', 'DA_DANH_GIA', 'DA_XEP_HANG') AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as thi_dua,
          SUM(CASE WHEN (COALESCE(trang_thai, sub_status, review_status) = 'CHO_DUYET' OR COALESCE(trang_thai, sub_status, review_status) = 'CHO_PHE_DUYET') AND COALESCE(is_archived, 0) = 0 THEN 1 ELSE 0 END) as cho_phe_duyet,
          SUM(CASE WHEN (COALESCE(trang_thai, sub_status, review_status) = 'CHO_DANH_GIA' AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as cho_danh_gia,
          SUM(CASE WHEN ((COALESCE(trang_thai, sub_status, review_status) = 'DA_DANH_GIA' OR COALESCE(trang_thai, sub_status, review_status) = 'DA_XEP_HANG') AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as da_danh_gia,
          SUM(CASE WHEN (COALESCE(is_archived, 0) = 1 OR registration_type = 'LUU_TRU' OR sub_status = 'LUU_TRU' OR trang_thai = 'DA_GOP') THEN 1 ELSE 0 END) as luu_tru
        FROM ci_kaizen_proposals
      `;

      const countsRes = await db.prepare(countsQuery).first().catch(() => null);

      // Fetch all proposals with region-relevant fields for normalizeRegion()
      const allQuery = `
        SELECT id, region, factory, source_region, department, site_code, category
        FROM ci_kaizen_proposals
      `;
      const { results: allResults } = await db.prepare(allQuery).all().catch(() => ({ results: [] }));

      // Compute region counts using normalizeRegion() for accurate grouping
      const regionMap: Record<string, number> = {};
      const categoryMap: Record<string, number> = {};

      // Initialize standard regions
      for (const r of STANDARD_DASHBOARD_REGIONS) {
        regionMap[r] = 0;
      }

      if (Array.isArray(allResults)) {
        for (const row of allResults as any[]) {
          // Region normalization
          const norm = normalizeRegion(row);
          regionMap[norm] = (regionMap[norm] || 0) + 1;

          // Category counting
          if (row.category) {
            const cat = String(row.category);
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
          }
        }
      }

      // Compute THKG total (parent group)
      const thkgTotal = Object.entries(regionMap)
        .filter(([key]) => isTHKGRegion(key))
        .reduce((sum, [, count]) => sum + count, 0);
      regionMap['THKG'] = thkgTotal;

      const counts = {
        thi_dua: Number(countsRes?.thi_dua || 0),
        cho_phe_duyet: Number(countsRes?.cho_phe_duyet || 0),
        cho_danh_gia: Number(countsRes?.cho_danh_gia || 0),
        da_danh_gia: Number(countsRes?.da_danh_gia || 0),
        luu_tru: Number(countsRes?.luu_tru || 0),
      };

      return NextResponse.json(
        {
          success: true,
          counts,
          regions: regionMap,
          category_counts: categoryMap,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      counts: {
        thi_dua: 0,
        cho_phe_duyet: 0,
        cho_danh_gia: 0,
        da_danh_gia: 0,
        luu_tru: 0,
      },
      regions: {},
      category_counts: {},
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi lấy status-counts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
