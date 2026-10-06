import { NextResponse } from 'next/server';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { verifyToken } from '@/lib/auth';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || (globalThis as any).env?.DB || null;
}

export function getDbKgBinding(): any {
  return (process.env as any).DB_KG || (globalThis as any).DB_KG || (globalThis as any).env?.DB_KG || null;
}

const SOURCE_API_URL = 'https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1';

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

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, backoffMs = 1000): Promise<Response> {
  let lastError: any = null;
  const secret = getExpectedSyncSecret();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Cache-Control': 'no-cache',
          'x-sync-secret': secret,
          ...(options.headers || {}),
        },
      });
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err: any) {
      lastError = err;
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, backoffMs * attempt));
    }
  }
  throw lastError || new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

async function writeSyncLog(db: any, logData: {
  source_site: string;
  status: 'SUCCESS' | 'ERROR';
  synced_count?: number;
  created_count?: number;
  updated_count?: number;
  skipped_count?: number;
  message?: string;
  error_detail?: string;
}) {
  try {
    const id = `sync_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sql = `
      INSERT INTO ci_kaizen_sync_logs (
        id, source_site, status, synced_count, created_count,
        updated_count, skipped_count, message, error_detail, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    await db.prepare(sql).bind(
      id,
      logData.source_site || 'thkiengiangshoes',
      logData.status,
      logData.synced_count || 0,
      logData.created_count || 0,
      logData.updated_count || 0,
      logData.skipped_count || 0,
      logData.message || '',
      logData.error_detail || null
    ).run().catch((e: any) => console.warn('[SYNC LOG WARN]', e));
  } catch (e) {
    console.warn('[SYNC LOG ERROR]', e);
  }
}

async function checkD1RateLimit(db: any, siteCode: string): Promise<boolean> {
  try {
    const query = `
      SELECT COUNT(*) as count FROM ci_kaizen_rate_limits
      WHERE site_code = ? AND created_at > datetime('now', '-60 seconds')
    `;
    const res = await db.prepare(query).bind(siteCode).first();
    const count = Number(res?.count || 0);
    if (count >= 60) return false;

    const rlId = `rl_sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.prepare(`INSERT INTO ci_kaizen_rate_limits (id, site_code, ip_emp_key) VALUES (?, ?, ?)`).bind(rlId, siteCode, siteCode).run().catch(() => {});
    return true;
  } catch (e) {
    return true; // Fallback to allow if table check fails
  }
}

import { normalizeKaizenSyncPayload } from '@/lib/kaizenDataContract';

export async function upsertProposals(db: any, sourceProposals: any[], defaultSiteCode = 'thkiengiangshoes') {
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const rawItem of sourceProposals) {
    if (!rawItem || (!rawItem.id && !rawItem.external_id && !rawItem.proposal_id)) continue;

    const norm = normalizeKaizenSyncPayload(rawItem, defaultSiteCode);
    const siteCode = norm.site_code;
    const externalId = norm.external_id;
    const localId = norm.id;

    const isSoftDeleted = norm.is_archived;

    // Check if proposal exists locally by id OR (site_code AND external_id)
    const existing: any = await db
      .prepare('SELECT id, title, before_description, after_solution, updated_at, is_archived, is_edited FROM ci_kaizen_proposals WHERE id = ? OR (site_code = ? AND external_id = ?)')
      .bind(localId, siteCode, externalId)
      .first();

    if (existing) {
      // Compare updated_at timestamps if present to avoid overwriting newer data
      if (existing.updated_at && norm.updated_at) {
        const localTime = new Date(existing.updated_at).getTime();
        const itemTime = new Date(norm.updated_at).getTime();
        if (!isNaN(localTime) && !isNaN(itemTime) && itemTime < localTime && Number(existing.is_archived || 0) === (isSoftDeleted ? 1 : 0)) {
          skippedCount++;
          continue; // Skip outdated update
        }
      }

      const syncTitleToUse = norm.title || existing.title || 'Sáng kiến cải tiến Kaizen';
      const syncBeforeDescToUse = norm.before_description || existing.before_description || null;
      const syncAfterSolToUse = norm.after_solution || existing.after_solution || null;

      // UPDATE existing proposal (NOTE: Judging/Scoring fields score_points, avg_rating, award_title, etc. are NOT touched to protect vpchuoiskechers data)
      const updateSql = `
        UPDATE ci_kaizen_proposals
        SET code = COALESCE(?, code),
            title = COALESCE(?, title),
            category = COALESCE(?, category),
            category_label = COALESCE(?, category_label),
            registration_type = COALESCE(?, registration_type),
            region = COALESCE(?, region),
            department = COALESCE(?, department),
            factory = COALESCE(?, factory),
            line = COALESCE(?, line),
            customer = COALESCE(?, customer),
            product_code = COALESCE(?, product_code),
            pricing_direction = COALESCE(?, pricing_direction),
            proposer_name = COALESCE(?, proposer_name),
            proposer_emp_code = COALESCE(?, proposer_emp_code),
            proposer_position = COALESCE(?, proposer_position),
            before_description = COALESCE(?, before_description),
            after_solution = COALESCE(?, after_solution),
            time_before_seconds = COALESCE(?, time_before_seconds),
            time_after_seconds = COALESCE(?, time_after_seconds),
            saved_seconds = COALESCE(?, saved_seconds),
            so_giay_tiet_kiem = COALESCE(?, so_giay_tiet_kiem),
            efficiency_value_vnd = COALESCE(?, efficiency_value_vnd),
            cost_before = COALESCE(?, cost_before),
            cost_after = COALESCE(?, cost_after),
            before_image_url = COALESCE(?, before_image_url),
            after_image_url = COALESCE(?, after_image_url),
            before_video_url = COALESCE(?, before_video_url),
            after_video_url = COALESCE(?, after_video_url),
            attachments_json = COALESCE(?, attachments_json),
            status = COALESCE(?, status),
            sub_status = COALESCE(?, sub_status),
            trang_thai = COALESCE(?, trang_thai),
            review_status = COALESCE(?, review_status),
            pair_quantity = COALESCE(?, pair_quantity),
            quantity = COALESCE(?, quantity),
            total_savings_vnd = COALESCE(?, total_savings_vnd),
            total_savings_words = COALESCE(?, total_savings_words),
            approval_status = COALESCE(?, approval_status),
            site_code = COALESCE(?, site_code),
            external_id = COALESCE(?, external_id),
            source_region = COALESCE(?, source_region),
            is_archived = ?,
            updated_at = COALESCE(?, CURRENT_TIMESTAMP)
        WHERE id = ?
      `;

      await db
        .prepare(updateSql)
        .bind(
          norm.code || null,
          syncTitleToUse,
          norm.category,
          norm.category_label,
          norm.registration_type,
          norm.region,
          norm.department,
          norm.factory,
          norm.line,
          norm.customer || null,
          norm.product_code || null,
          norm.pricing_direction || null,
          norm.proposer_name,
          norm.proposer_emp_code,
          norm.proposer_position || null,
          syncBeforeDescToUse,
          syncAfterSolToUse,
          norm.time_before_seconds,
          norm.time_after_seconds,
          norm.saved_seconds,
          norm.saved_seconds,
          norm.efficiency_value_vnd,
          norm.cost_before,
          norm.cost_after,
          norm.before_image_url || null,
          norm.after_image_url || null,
          norm.before_video_url || null,
          norm.after_video_url || null,
          norm.attachments_json || null,
          norm.status,
          norm.sub_status,
          norm.trang_thai,
          norm.review_status,
          norm.pair_quantity,
          norm.pair_quantity,
          norm.total_savings_vnd,
          norm.total_savings_words || null,
          norm.approval_status,
          siteCode,
          externalId,
          norm.source_region,
          isSoftDeleted ? 1 : 0,
          norm.updated_at,
          existing.id
        )
        .run()
        .catch((e: any) => console.warn('[SYNC] Update warn:', e));

      updatedCount++;
    } else {
      // INSERT new proposal
      const insertSql = `
        INSERT INTO ci_kaizen_proposals (
          id, code, title, category, category_label, registration_type,
          region, department, factory, line, customer, product_code, pricing_direction,
          proposer_name, proposer_emp_code, proposer_position,
          before_description, after_solution, time_before_seconds, time_after_seconds,
          saved_seconds, so_giay_tiet_kiem, efficiency_value_vnd, cost_before, cost_after,
          before_image_url, after_image_url, before_video_url, after_video_url, attachments_json,
          status, sub_status, trang_thai, review_status, score_points, avg_rating, rating_count,
          vote_count, view_count, pair_quantity, quantity, total_savings_vnd, total_savings_words,
          approval_status, site_code, external_id, source_region, is_archived, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 0, 0, 0,
          0, 0, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP)
        )
      `;

      await db
        .prepare(insertSql)
        .bind(
          localId,
          norm.code || null,
          norm.title || 'Sáng kiến cải tiến Kaizen',
          norm.category,
          norm.category_label,
          norm.registration_type,
          norm.region,
          norm.department,
          norm.factory,
          norm.line,
          norm.customer || null,
          norm.product_code || null,
          norm.pricing_direction || null,
          norm.proposer_name,
          norm.proposer_emp_code || 'SK-KG-EMP',
          norm.proposer_position || null,
          norm.before_description,
          norm.after_solution,
          norm.time_before_seconds,
          norm.time_after_seconds,
          norm.saved_seconds,
          norm.saved_seconds,
          norm.efficiency_value_vnd,
          norm.cost_before,
          norm.cost_after,
          norm.before_image_url || null,
          norm.after_image_url || null,
          norm.before_video_url || null,
          norm.after_video_url || null,
          norm.attachments_json || null,
          norm.status,
          norm.sub_status,
          norm.trang_thai,
          norm.review_status,
          norm.pair_quantity,
          norm.pair_quantity,
          norm.total_savings_vnd,
          norm.total_savings_words || null,
          norm.approval_status,
          siteCode,
          externalId,
          norm.source_region,
          isSoftDeleted ? 1 : 0,
          norm.created_at,
          norm.updated_at
        )
        .run()
        .catch((e: any) => console.warn('[SYNC] Insert warn:', e));

      createdCount++;
    }
  }

  return { createdCount, updatedCount, skippedCount };
}

async function performKaizenSync(payload?: any) {
  const db = getDbBinding();
  if (!db) {
    return {
      success: false,
      message: 'Không tìm thấy kết nối D1 Database (process.env.DB)',
      synced_count: 0,
    };
  }

  await ensureKaizenSchema(db);

  let siteCode = payload?.site_code || 'thkiengiangshoes';

  // Handle explicit DELETE action
  if (payload?.action === 'DELETE' && (payload?.proposal?.id || payload?.proposal?.external_id)) {
    const item = payload.proposal;
    const externalId = item.external_id || item.id;
    const localId = siteCode === 'thkiengiangshoes'
      ? (String(item.id).startsWith('tkg_') ? String(item.id) : `tkg_${externalId}`)
      : String(item.id);

    await db.prepare(`
      UPDATE ci_kaizen_proposals
      SET is_archived = 1, status = 'DELETED', sub_status = 'LUU_TRU', trang_thai = 'LUU_TRU', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? OR (site_code = ? AND external_id = ?)
    `).bind(localId, siteCode, externalId).run().catch(() => {});

    await writeSyncLog(db, {
      source_site: siteCode,
      status: 'SUCCESS',
      synced_count: 1,
      message: `Đã xử lý xóa/lưu trữ sáng kiến ${localId} từ ${siteCode}!`,
    });

    return {
      success: true,
      message: `Đã xử lý xóa/lưu trữ sáng kiến ${localId} từ ${siteCode}!`,
      synced_count: 1,
    };
  }

  let sourceProposals: any[] = [];

  if (payload?.proposal) {
    sourceProposals = [payload.proposal];
  } else if (Array.isArray(payload?.proposals)) {
    sourceProposals = payload.proposals;
  } else {
    // 1. First try reading directly from D1 binding DB_KG if available (0ms cross-D1 sync on Workers)
    const dbKg = getDbKgBinding();
    if (dbKg) {
      try {
        const kgRes = await dbKg.prepare(`SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC`).all();
        if (kgRes && Array.isArray(kgRes.results) && kgRes.results.length > 0) {
          sourceProposals = kgRes.results;
          console.log(`[SYNC D1_KG] Successfully fetched ${sourceProposals.length} proposals directly from DB_KG binding!`);
        }
      } catch (kgErr: any) {
        console.warn('[SYNC D1_KG WARN] Could not query DB_KG directly:', kgErr);
      }
    }

    // 2. Fall back to HTTP fetch if DB_KG binding returned no results
    if (!sourceProposals || sourceProposals.length === 0) {
      try {
        const res = await fetchWithRetry(SOURCE_API_URL, {}, 3, 1000);
        const json = await res.json();
        sourceProposals = json.data || json.proposals || [];
      } catch (err: any) {
        await writeSyncLog(db, {
          source_site: siteCode,
          status: 'ERROR',
          message: 'Lỗi gọi API nguồn Kiên Giang',
          error_detail: err.message || String(err),
        });
        return {
          success: false,
          error: `Không thể kết nối API Kiên Giang (${err.message || 'Lỗi mạng'}). Đã ghi log hệ thống.`,
          synced_count: 0,
        };
      }
    }
  }

  if (!Array.isArray(sourceProposals) || sourceProposals.length === 0) {
    await writeSyncLog(db, {
      source_site: siteCode,
      status: 'SUCCESS',
      synced_count: 0,
      message: 'Nguồn Kiên Giang không có dữ liệu mới.',
    });

    return {
      success: true,
      message: 'Không có dữ liệu sáng kiến mới để đồng bộ!',
      synced_count: 0,
      created_count: 0,
      updated_count: 0,
      skipped_count: 0,
      synced_at: new Date().toISOString(),
    };
  }

  const { createdCount, updatedCount, skippedCount } = await upsertProposals(db, sourceProposals, siteCode);

  await writeSyncLog(db, {
    source_site: siteCode,
    status: 'SUCCESS',
    synced_count: sourceProposals.length,
    created_count: createdCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    message: `Đồng bộ thành công ${sourceProposals.length} sáng kiến từ ${siteCode}!`,
  });

  return {
    success: true,
    message: `Đồng bộ thành công ${sourceProposals.length} sáng kiến từ ${siteCode}!`,
    synced_count: sourceProposals.length,
    created_count: createdCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    synced_at: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    if (!(await verifySyncAuth(request))) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Yêu cầu Header x-sync-secret hợp lệ! (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const result = await performKaizenSync();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi đồng bộ Kaizen' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifySyncAuth(request))) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Yêu cầu Header x-sync-secret hợp lệ! (401 Unauthorized)' },
        { status: 401 }
      );
    }

    // 1. Check Payload Size Limit (Max 5MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'PAYLOAD_TOO_LARGE', message: 'Payload đồng bộ vượt quá giới hạn 5MB! (413 Payload Too Large)' },
        { status: 413 }
      );
    }

    // 2. Check D1 Rate Limit (Max 60 requests / minute)
    const db = getDbBinding();
    if (db) {
      const allowed = await checkD1RateLimit(db, 'thkiengiangshoes');
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Vượt quá giới hạn 60 request đồng bộ / phút! (429 Too Many Requests)' },
          { status: 429 }
        );
      }
    }

    let body: any = null;
    try {
      body = await request.json();
    } catch {
      // Empty body
    }

    const result = await performKaizenSync(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi đồng bộ Kaizen' },
      { status: 500 }
    );
  }
}
