import { NextResponse } from 'next/server';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { getDbKgBinding, upsertProposals } from '../sync/route';
import { normalizeRegion, isTHKGRegion, STANDARD_DASHBOARD_REGIONS } from '@/lib/kaizenRegionHelper';
import { verifyToken } from '@/lib/auth';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || (globalThis as any).env?.DB || null;
}

function getExpectedSyncSecret(): string {
  return (process.env as any).INTERNAL_SYNC_SECRET || (globalThis as any).INTERNAL_SYNC_SECRET || 'tbs_ii_secure_jwt_secret_key_2026';
}

async function verifySyncAuth(request: Request): Promise<boolean> {
  const secret = getExpectedSyncSecret();
  const syncHeader = request.headers.get('x-sync-secret') || request.headers.get('X-Sync-Secret');
  if (syncHeader && syncHeader === secret) return true;

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token === secret) return true;
    const session = await verifyToken(token);
    if (session) return true;
  }

  return false;
}

/**
 * GET /api/ci-kaizen/sync/health
 * 
 * Returns sync health status:
 * - Last sync time
 * - Record counts at source (DB_KG) vs destination (DB)
 * - Region breakdown comparison
 * - Missing records list
 */
export async function GET(request: Request) {
  try {
    const db = getDbBinding();
    const dbKg = getDbKgBinding();

    if (!db) {
      return NextResponse.json({ success: false, error: 'DB binding not found' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    // Get last sync log
    let lastSync: any = null;
    try {
      lastSync = await db.prepare(`
        SELECT * FROM ci_kaizen_sync_logs 
        ORDER BY created_at DESC LIMIT 1
      `).first();
    } catch (e) {}

    // Count at destination
    const destCountRes = await db.prepare(`SELECT COUNT(*) as cnt FROM ci_kaizen_proposals`).first().catch(() => ({ cnt: 0 }));
    const destThkgRes = await db.prepare(`SELECT COUNT(*) as cnt FROM ci_kaizen_proposals WHERE site_code = 'thkiengiangshoes'`).first().catch(() => ({ cnt: 0 }));

    // Region breakdown at destination
    const destAllRes = await db.prepare(`
      SELECT id, region, factory, source_region, department, site_code
      FROM ci_kaizen_proposals WHERE site_code = 'thkiengiangshoes'
    `).all().catch(() => ({ results: [] }));

    const destRegionCounts: Record<string, number> = {};
    for (const r of STANDARD_DASHBOARD_REGIONS) {
      destRegionCounts[r] = 0;
    }
    if (destAllRes?.results) {
      for (const row of destAllRes.results as any[]) {
        const norm = normalizeRegion(row);
        destRegionCounts[norm] = (destRegionCounts[norm] || 0) + 1;
      }
    }

    // Count at source (DB_KG) if available
    let sourceCount = -1;
    let sourceRegionCounts: Record<string, number> = {};
    let missingIds: string[] = [];

    if (dbKg) {
      try {
        const srcCountRes = await dbKg.prepare(`SELECT COUNT(*) as cnt FROM ci_kaizen_proposals`).first();
        sourceCount = Number(srcCountRes?.cnt || 0);

        const srcAllRes = await dbKg.prepare(`
          SELECT id, region, factory, department
          FROM ci_kaizen_proposals
        `).all();

        if (srcAllRes?.results) {
          for (const row of srcAllRes.results as any[]) {
            const norm = normalizeRegion({ ...row, site_code: 'thkiengiangshoes' });
            sourceRegionCounts[norm] = (sourceRegionCounts[norm] || 0) + 1;
          }

          // Find missing records
          const destIds = new Set(
            (destAllRes?.results || []).map((r: any) => {
              const extId = String(r.external_id || r.id || '').replace(/^tkg_/, '');
              return extId;
            })
          );

          for (const srcRow of srcAllRes.results as any[]) {
            const srcId = String(srcRow.id || '');
            if (!destIds.has(srcId)) {
              missingIds.push(srcId);
            }
          }
        }
      } catch (e: any) {
        console.warn('[SYNC HEALTH] DB_KG query error:', e);
      }
    }

    // Region comparison
    const regionComparison: Record<string, { source: number; dest: number; diff: number }> = {};
    const allRegions = new Set([...Object.keys(sourceRegionCounts), ...Object.keys(destRegionCounts)]);
    for (const r of allRegions) {
      const src = sourceRegionCounts[r] || 0;
      const dst = destRegionCounts[r] || 0;
      regionComparison[r] = { source: src, dest: dst, diff: src - dst };
    }

    return NextResponse.json(
      {
        success: true,
        health: {
          status: missingIds.length === 0 ? 'HEALTHY' : 'SYNC_GAP',
          last_sync: lastSync ? {
            time: lastSync.created_at,
            status: lastSync.status,
            source_site: lastSync.source_site,
            synced_count: lastSync.synced_count,
            created_count: lastSync.created_count,
            updated_count: lastSync.updated_count,
            skipped_count: lastSync.skipped_count,
            message: lastSync.message,
          } : null,
          counts: {
            source_total: sourceCount,
            dest_total: Number(destCountRes?.cnt || 0),
            dest_thkg: Number(destThkgRes?.cnt || 0),
            missing: missingIds.length,
          },
          region_comparison: regionComparison,
          missing_ids: missingIds.slice(0, 50), // Cap at 50 for response size
          db_kg_available: !!dbKg,
          server_time: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Health check error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ci-kaizen/sync/health
 * 
 * Trigger a FULL backfill from DB_KG source to destination.
 * This resets is_edited flags for THKG records and re-upserts all records.
 * Requires authentication.
 */
export async function POST(request: Request) {
  try {
    if (!(await verifySyncAuth(request))) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      // Empty body
    }

    const isDryRun = searchParams.get('dryRun') === '1' || searchParams.get('dryRun') === 'true' || Boolean(body?.dryRun);

    const db = getDbBinding();
    const dbKg = getDbKgBinding();

    if (!db) {
      return NextResponse.json({ success: false, error: 'DB binding not found' }, { status: 500 });
    }

    await ensureKaizenSchema(db);

    let sourceProposals: any[] = [];
    if (dbKg) {
      const sourceRes = await dbKg.prepare(`
        SELECT * FROM ci_kaizen_proposals ORDER BY created_at ASC
      `).all().catch(() => null);
      if (sourceRes?.results) {
        sourceProposals = sourceRes.results;
      }
    }

    if (sourceProposals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nguồn DB_KG không có bản ghi nào để so sánh hoặc backfill',
        total_source: 0,
      });
    }

    // DRY-RUN MODE: Compare records and build detailed diff report without mutating database
    if (isDryRun) {
      const destRes = await db.prepare(`SELECT * FROM ci_kaizen_proposals`).all().catch(() => ({ results: [] }));
      const destMap = new Map<string, any>();
      (destRes?.results || []).forEach((row: any) => {
        if (row.id) destMap.set(String(row.id), row);
        if (row.external_id && row.site_code === 'thkiengiangshoes') {
          destMap.set(`ext_${row.external_id}`, row);
        }
      });

      const diffs: any[] = [];
      let newCount = 0;
      let diffCount = 0;
      let unchangedCount = 0;

      const compareFields = [
        'title',
        'product_code',
        'before_description',
        'after_solution',
        'saved_seconds',
        'total_savings_vnd',
        'before_image_url',
        'after_image_url',
        'category',
        'department',
        'factory',
        'line',
        'customer',
        'pricing_direction',
      ];

      for (const src of sourceProposals) {
        const srcId = String(src.id);
        const externalId = src.external_id || src.id;
        const localId = src.site_code === 'thkiengiangshoes' || !src.site_code
          ? (srcId.startsWith('tkg_') ? srcId : `tkg_${externalId}`)
          : srcId;

        const existing = destMap.get(localId) || destMap.get(`ext_${externalId}`);

        if (!existing) {
          newCount++;
          diffs.push({
            code: src.code || 'UNKNOWN',
            id: localId,
            action: 'INSERT (Tạo mới)',
            title: src.title || 'Sáng kiến Kaizen mới',
            proposer_name: src.proposer_name || '',
            changes: { _record: { old: 'KHÔNG TỒN TẠI BÊN VPCHUOI', new: 'SẼ TẠO MỚI TỪ KIÊN GIANG' } },
          });
        } else {
          const fieldDiffs: Record<string, { old: any; new: any }> = {};
          for (const field of compareFields) {
            const oldVal = (existing[field] !== undefined && existing[field] !== null) ? String(existing[field]).trim() : '';
            const newVal = (src[field] !== undefined && src[field] !== null) ? String(src[field]).trim() : '';
            
            if (oldVal !== newVal) {
              // Ignore generic default title overrides if target already has custom title
              if (field === 'title' && (!newVal || newVal === 'Sáng kiến cải tiến Kaizen')) continue;
              fieldDiffs[field] = { old: oldVal || '(Trống/Mặc định)', new: newVal || '(Trống)' };
            }
          }

          if (Object.keys(fieldDiffs).length > 0) {
            diffCount++;
            diffs.push({
              code: src.code || existing.code || 'UNKNOWN',
              id: existing.id,
              action: 'UPDATE (Cập nhật dữ liệu lệch)',
              title: src.title || existing.title || '',
              proposer_name: src.proposer_name || existing.proposer_name || '',
              changes: fieldDiffs,
            });
          } else {
            unchangedCount++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        dryRun: true,
        message: '🔍 KẾT QUẢ DRY-RUN SO SÁNH DỮ LIỆU: KHÔNG CÓ THAY ĐỔI NÀO ĐƯỢC GHI VÀO DATABASE BẢN LIVE.',
        summary: {
          total_source: sourceProposals.length,
          new_records_to_create: newCount,
          differing_records_to_update: diffCount,
          unchanged_records: unchangedCount,
        },
        diffs: diffs,
      });
    }

    // REAL BACKFILL EXECUTION (When dryRun is false)
    if (!dbKg) {
      return NextResponse.json({ success: false, error: 'DB_KG binding not found — cannot perform real backfill' }, { status: 500 });
    }

    // Step 1: Upsert all records
    const { createdCount, updatedCount, skippedCount } = await upsertProposals(db, sourceProposals, 'thkiengiangshoes');

    // Step 2: Write sync log
    const logId = `sync_bf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.prepare(`
      INSERT INTO ci_kaizen_sync_logs (
        id, source_site, status, synced_count, created_count,
        updated_count, skipped_count, message, created_at
      ) VALUES (?, 'thkiengiangshoes', 'SUCCESS', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      logId,
      sourceProposals.length,
      createdCount,
      updatedCount,
      skippedCount,
      `BACKFILL: Đồng bộ toàn bộ ${sourceProposals.length} sáng kiến từ DB_KG (thkiengiangshoes). Tạo mới: ${createdCount}, Cập nhật: ${updatedCount}, Bỏ qua: ${skippedCount}.`
    ).run().catch(() => {});

    // Step 3: Verify region counts after backfill
    const verifyRes = await db.prepare(`
      SELECT id, region, factory, source_region, department, site_code
      FROM ci_kaizen_proposals WHERE site_code = 'thkiengiangshoes'
    `).all().catch(() => ({ results: [] }));

    const regionCounts: Record<string, number> = {};
    for (const r of STANDARD_DASHBOARD_REGIONS) {
      regionCounts[r] = 0;
    }
    if (verifyRes?.results) {
      for (const row of verifyRes.results as any[]) {
        const norm = normalizeRegion(row);
        regionCounts[norm] = (regionCounts[norm] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      message: `Backfill hoàn tất! Tạo mới: ${createdCount}, Cập nhật: ${updatedCount}, Bỏ qua: ${skippedCount}.`,
      total_source: sourceProposals.length,
      created_count: createdCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      region_counts_after: regionCounts,
      synced_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Backfill error' },
      { status: 500 }
    );
  }
}
