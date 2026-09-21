import { NextResponse } from 'next/server';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { verifyToken } from '@/lib/auth';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
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

async function upsertProposals(db: any, sourceProposals: any[], defaultSiteCode = 'thkiengiangshoes') {
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const item of sourceProposals) {
    if (!item || (!item.id && !item.external_id) || !item.title) continue;

    const siteCode = item.site_code || defaultSiteCode;
    const externalId = item.external_id || item.id;
    // Prefix ID with 'tkg_' for records from thkiengiangshoes to prevent ID collision
    const localId = siteCode === 'thkiengiangshoes'
      ? (String(item.id).startsWith('tkg_') ? String(item.id) : `tkg_${externalId}`)
      : String(item.id);

    const itemRegion = 'TH Kiên Giang Shoes';

    const isSoftDeleted = Boolean(
      Number(item.is_archived) === 1 ||
      item.is_archived === true ||
      Number(item.is_deleted) === 1 ||
      item.is_deleted === true ||
      item.status === 'DELETED' ||
      item.sub_status === 'LUU_TRU' ||
      item.registration_type === 'LUU_TRU'
    );

    // Check if proposal exists locally by id OR (site_code AND external_id)
    const existing: any = await db
      .prepare('SELECT id, updated_at, is_archived FROM ci_kaizen_proposals WHERE id = ? OR (site_code = ? AND external_id = ?)')
      .bind(localId, siteCode, externalId)
      .first();

    const attachmentsJson = item.attachments_json || (
      Array.isArray(item.attachments) ? JSON.stringify(item.attachments) : null
    );

    if (existing) {
      // Compare updated_at timestamps if present
      if (existing.updated_at && item.updated_at) {
        const localTime = new Date(existing.updated_at).getTime();
        const itemTime = new Date(item.updated_at).getTime();
        if (!isNaN(localTime) && !isNaN(itemTime) && itemTime <= localTime && Number(existing.is_archived || 0) === (isSoftDeleted ? 1 : 0)) {
          skippedCount++;
          continue; // Skip outdated update
        }
      }

      // UPDATE existing proposal
      const updateSql = `
        UPDATE ci_kaizen_proposals
        SET code = COALESCE(?, code),
            title = COALESCE(?, title),
            category = COALESCE(?, category),
            category_label = COALESCE(?, category_label),
            registration_type = COALESCE(?, registration_type),
            region = ?,
            department = COALESCE(?, department),
            factory = ?,
            line = COALESCE(?, line),
            proposer_name = COALESCE(?, proposer_name),
            proposer_emp_code = COALESCE(?, proposer_emp_code),
            before_description = COALESCE(?, before_description),
            after_solution = COALESCE(?, after_solution),
            saved_seconds = COALESCE(?, saved_seconds),
            so_giay_tiet_kiem = COALESCE(?, so_giay_tiet_kiem),
            before_image_url = COALESCE(?, before_image_url),
            after_image_url = COALESCE(?, after_image_url),
            attachments_json = COALESCE(?, attachments_json),
            status = COALESCE(?, status),
            sub_status = COALESCE(?, sub_status),
            trang_thai = COALESCE(?, trang_thai),
            review_status = COALESCE(?, review_status),
            score_points = COALESCE(?, score_points),
            avg_rating = COALESCE(?, avg_rating),
            rating_count = COALESCE(?, rating_count),
            vote_count = COALESCE(?, vote_count),
            view_count = COALESCE(?, view_count),
            pair_quantity = COALESCE(?, pair_quantity),
            total_savings_vnd = COALESCE(?, total_savings_vnd),
            total_savings_words = COALESCE(?, total_savings_words),
            approval_status = COALESCE(?, approval_status),
            site_code = COALESCE(?, site_code),
            external_id = COALESCE(?, external_id),
            source_region = ?,
            is_archived = ?,
            updated_at = COALESCE(?, CURRENT_TIMESTAMP)
        WHERE id = ?
      `;

      await db
        .prepare(updateSql)
        .bind(
          item.code,
          item.title,
          item.category,
          item.category_label,
          item.registration_type,
          itemRegion,
          item.department,
          itemRegion,
          item.line,
          item.proposer_name,
          item.proposer_emp_code,
          item.before_description,
          item.after_solution,
          item.saved_seconds || item.so_giay_tiet_kiem || 0,
          item.saved_seconds || item.so_giay_tiet_kiem || 0,
          item.before_image_url,
          item.after_image_url,
          attachmentsJson,
          item.status,
          item.sub_status,
          item.trang_thai || item.sub_status,
          item.review_status || item.sub_status,
          item.score_points || 0,
          item.avg_rating || 0,
          item.rating_count || 0,
          item.vote_count || 0,
          item.view_count || 0,
          item.pair_quantity || item.quantity || 0,
          item.total_savings_vnd || item.tong_tien_tiet_kiem || 0,
          item.total_savings_words,
          item.approval_status,
          siteCode,
          externalId,
          itemRegion,
          isSoftDeleted ? 1 : 0,
          item.updated_at || new Date().toISOString(),
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
          region, department, factory, line, proposer_name, proposer_emp_code,
          before_description, after_solution, saved_seconds, so_giay_tiet_kiem,
          before_image_url, after_image_url, attachments_json, status, sub_status,
          trang_thai, review_status, score_points, avg_rating, rating_count,
          vote_count, view_count, pair_quantity, total_savings_vnd, total_savings_words,
          approval_status, site_code, external_id, source_region, is_archived, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP)
        )
      `;

      await db
        .prepare(insertSql)
        .bind(
          localId,
          item.code,
          item.title,
          item.category || 'PRODUCTIVITY',
          item.category_label || '3.Tăng Năng suất',
          item.registration_type || 'THI_DUA',
          itemRegion,
          item.department || '',
          itemRegion,
          item.line || '',
          item.proposer_name,
          item.proposer_emp_code || 'SK-KG-EMP',
          item.before_description || '',
          item.after_solution || '',
          item.saved_seconds || item.so_giay_tiet_kiem || 0,
          item.saved_seconds || item.so_giay_tiet_kiem || 0,
          item.before_image_url || '',
          item.after_image_url || '',
          attachmentsJson,
          item.status || 'APPROVED',
          item.sub_status || 'CHO_DANH_GIA',
          item.trang_thai || item.sub_status || 'CHO_DANH_GIA',
          item.review_status || 'CHO_PHE_DUYET',
          item.score_points || 0,
          item.avg_rating || 0,
          item.rating_count || 0,
          item.vote_count || 0,
          item.view_count || 0,
          item.pair_quantity || item.quantity || 0,
          item.total_savings_vnd || item.tong_tien_tiet_kiem || 0,
          item.total_savings_words || '',
          item.approval_status || 'PHE_DUYET',
          siteCode,
          externalId,
          itemRegion,
          isSoftDeleted ? 1 : 0,
          item.created_at || new Date().toISOString(),
          item.updated_at || new Date().toISOString()
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

  let sourceProposals: any[] = [];
  let siteCode = payload?.site_code || 'thkiengiangshoes';

  if (payload?.proposal) {
    sourceProposals = [payload.proposal];
  } else if (Array.isArray(payload?.proposals)) {
    sourceProposals = payload.proposals;
  } else {
    // Fetch all proposals from Kiên Giang Shoes with Exponential Backoff Retry
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
