import { NextResponse } from 'next/server';

import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { triggerRealtimeSyncToWebTong } from '@/lib/kaizenSyncHelper';
import { SYSTEM_USERS } from '@/lib/userProfiles';
import { getValidKaizenImageUrl } from '@/lib/kaizenImageHelper';
import { getKaizenDisplayTitle, isGenericTitle } from '@/lib/kaizenTitleHelper';

import {
  STANDARD_DASHBOARD_REGIONS,
  normalizeRegion,
  getProposalValueVnd,
} from '@/lib/kaizenRegionHelper';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const DEFAULT_KAIZEN_PROPOSALS = [
  {
    id: "kz_nmmd_001",
    code: "CI-2026-001",
    title: "Tán nút ô dê bằng máy tán bán tự động",
    category: "EQUIPMENT",
    category_label: "7.MMTB CCDC",
    registration_type: "THI_DUA",
    factory: "Nhà Máy Miền Đông",
    region: "Nhà Máy Miền Đông",
    source_region: "Nhà Máy Miền Đông",
    department: "May",
    line: "May",
    proposer_name: "Nguyễn Thị Đào",
    proposer_emp_code: "201607010",
    before_description: "Tán nút ô dê bằng phương pháp thủ công bằng tay gây tốn nhiều thời gian và công sức.",
    after_solution: "Sử dụng máy tán bán tự động giúp tăng tốc độ tán nút ô dê, tiết kiệm sức lao động.",
    time_before_seconds: 15,
    time_after_seconds: 0,
    saved_seconds: 15,
    so_giay_tiet_kiem: 15,
    efficiency_value_vnd: 188,
    total_savings_vnd: 15000000,
    pair_quantity: 1,
    quantity: 1,
    score_points: 0,
    vote_count: 0,
    view_count: 9,
    status: "SUBMITTED",
    approval_status: "PENDING",
    sub_status: "CHO_DUYET",
    trang_thai: "CHO_DUYET",
    review_status: "CHO_DUYET",
    before_image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60",
    after_image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60",
    attachments_json: JSON.stringify([
      { url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60", tag: "BEFORE", type: "image" }
    ]),
    created_at: "2026-09-12 10:00:00"
  },
  {
    id: "kz_nmmd_002",
    code: "CI-2026-002",
    title: "Tăng số đôi trên khuôn in lô gô chắn bùn ngoài m...",
    category: "PRODUCTIVITY",
    category_label: "3.Tăng Năng suất",
    registration_type: "THI_DUA",
    factory: "Nhà Máy Miền Đông",
    region: "Nhà Máy Miền Đông",
    source_region: "Nhà Máy Miền Đông",
    department: "Đầu Vào",
    line: "Đầu Vào",
    proposer_name: "Nguyễn Thị Đào",
    proposer_emp_code: "201607010",
    before_description: "Khuôn in hiện tại chỉ in được số lượng đôi ít mỗi lượt, tốc độ in chưa tối ưu.",
    after_solution: "Cải tiến sắp xếp khuôn in tăng số đôi trên mỗi lượt in, nâng cao năng suất.",
    time_before_seconds: 30,
    time_after_seconds: 0,
    saved_seconds: 30,
    so_giay_tiet_kiem: 30,
    efficiency_value_vnd: 375,
    total_savings_vnd: 28000000,
    pair_quantity: 1,
    quantity: 1,
    score_points: 0,
    vote_count: 0,
    view_count: 2,
    status: "SUBMITTED",
    approval_status: "PENDING",
    sub_status: "CHO_DUYET",
    trang_thai: "CHO_DUYET",
    review_status: "CHO_DUYET",
    before_image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60",
    after_image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60",
    attachments_json: JSON.stringify([
      { url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60", tag: "BEFORE", type: "image" }
    ]),
    created_at: "2026-09-13 11:30:00"
  },
  {
    id: "kz_vpc_001",
    code: "CI-2026-003",
    title: "Số hóa quy trình duyệt đăng ký sáng kiến Kaizen realtime",
    category: "PRODUCTIVITY",
    category_label: "3.Tăng Năng suất",
    registration_type: "THI_DUA",
    factory: "Văn phòng Chuỗi",
    region: "Văn phòng Chuỗi",
    source_region: "Văn phòng Chuỗi",
    department: "Bộ Phận Chuyển Đổi Số & Kaizen",
    line: "Văn phòng Chuỗi",
    proposer_name: "Phạm Nguyễn Anh Huy",
    proposer_emp_code: "202608001",
    before_description: "Duyệt đề xuất Kaizen bằng giấy thủ công gây trễ hạn và khó tổng hợp số liệu.",
    after_solution: "Triển khai hệ thống Web/Worker duyệt tự động trên Cloudflare D1.",
    time_before_seconds: 120,
    time_after_seconds: 0,
    saved_seconds: 120,
    so_giay_tiet_kiem: 120,
    efficiency_value_vnd: 1500,
    total_savings_vnd: 35000000,
    pair_quantity: 1,
    quantity: 1,
    score_points: 0,
    vote_count: 5,
    view_count: 18,
    status: "SUBMITTED",
    approval_status: "PENDING",
    sub_status: "CHO_DUYET",
    trang_thai: "CHO_DUYET",
    review_status: "CHO_DUYET",
    before_image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60",
    after_image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60",
    attachments_json: JSON.stringify([
      { url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60", tag: "BEFORE", type: "image" }
    ]),
    created_at: "2026-09-14 09:00:00"
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const syncParam = searchParams.get('sync');
    const syncSecretHeader = request.headers.get('x-sync-secret') || request.headers.get('X-Sync-Secret');
    const expectedSecret = (process.env as any).INTERNAL_SYNC_SECRET || (globalThis as any).INTERNAL_SYNC_SECRET || 'tbs_ii_secure_jwt_secret_key_2026';

    const isInternalSync = (syncParam === '1' || Boolean(syncSecretHeader)) && syncSecretHeader === expectedSecret;

    const db = getDbBinding();

    if (db) {
      let results: any[] = [];
      try {
        const queryRes = await db.prepare(`SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500`).all();
        results = queryRes?.results || [];
      } catch (err) {
        // Fallback: If table doesn't exist yet, run schema creation once
        await ensureKaizenSchema(db).catch(() => {});
        try {
          const retryRes = await db.prepare(`SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500`).all();
          results = retryRes?.results || [];
        } catch (e) {}
      }

      let userMap: Record<string, string> = {};
      try {
        const { results: userRows } = await db.prepare(`SELECT emp_code, name FROM users WHERE emp_code IS NOT NULL AND emp_code != ''`).all();
        if (userRows) {
          for (const u of userRows as any[]) {
            if (u.emp_code && u.name) {
              userMap[String(u.emp_code).trim().toUpperCase()] = u.name;
            }
          }
        }
      } catch (e) {}

      const cleanedResults = (results || []).map((p: any) => {
        const computedTitle = getKaizenDisplayTitle(p);
        const seedMatch = DEFAULT_KAIZEN_PROPOSALS.find(
          (s) => s.id === p.id || s.code === p.code || (p.title && s.title && p.title.trim().toLowerCase() === s.title.trim().toLowerCase())
        );

        let pEmpCode = String(p.proposer_emp_code || p.proposerEmpCode || '').trim().toUpperCase();
        let resolvedName = p.proposer_name || p.proposerName || '';

        if ((!resolvedName || resolvedName.startsWith('Nhân viên (')) && pEmpCode && userMap[pEmpCode]) {
          resolvedName = userMap[pEmpCode];
        }

        let tb = Number(p.time_before_seconds || p.timeBeforeSeconds || 0);
        let ta = Number(p.time_after_seconds || p.timeAfterSeconds || 0);
        let sSecs = (tb > 0 || ta > 0) ? Math.max(0, tb - ta) : Number(p.saved_seconds || p.savedSeconds || p.so_giay_tiet_kiem || 0);
        let q = Number(p.pair_quantity || p.quantity || p.so_luong_giay || 0);
        let mult = q > 0 ? q : 1;
        let eff = Number(p.efficiency_value_vnd || p.efficiencyValueVND || (sSecs > 0 ? Math.round(sSecs * 12.5) : 0));
        let cb = Number(p.cost_before || p.costBefore || p.chi_phi_truoc || (tb > 0 ? Math.round(tb * 12.5 * mult) : 0));
        let ca = Number(p.cost_after || p.costAfter || p.chi_phi_sau || (ta > 0 ? Math.round(ta * 12.5 * mult) : 0));
        let tot = Number(p.total_savings_vnd || p.totalSavingsVnd || p.tong_tien_tiet_kiem || 0);

        // Auto-heal corrupted rows that ended up with 0s across all metrics
        if (tb <= 0 && ta <= 0 && sSecs <= 0 && tot <= 0 && seedMatch) {
          sSecs = seedMatch.saved_seconds || 15;
          tb = (seedMatch as any).time_before_seconds || sSecs;
          ta = (seedMatch as any).time_after_seconds || 0;
          tot = seedMatch.total_savings_vnd || 15000000;
          eff = Math.round(sSecs * 12.5);
          q = q > 0 ? q : 1;
          mult = q > 0 ? q : 1;
          cb = Math.round(tb * 12.5 * mult);
          ca = Math.round(ta * 12.5 * mult);
        }

        // If still 0 for non-seed proposals with missing figures, derive fallback values from saved_seconds or default
        if (tb <= 0 && ta <= 0 && sSecs > 0) {
          tb = sSecs;
          ta = 0;
        }
        if (tot <= 0) {
          tot = (cb > 0 || ca > 0) ? Math.max(0, cb - ca) : (q > 0 ? eff * q : (eff > 0 ? eff : 15000000));
        }

        return {
          ...p,
          proposer_name: resolvedName || p.proposer_name || '',
          proposerName: resolvedName || p.proposer_name || '',
          title: computedTitle,
          time_before_seconds: tb,
          timeBeforeSeconds: tb,
          time_after_seconds: ta,
          timeAfterSeconds: ta,
          saved_seconds: sSecs,
          savedSeconds: sSecs,
          so_giay_tiet_kiem: sSecs,
          efficiency_value_vnd: eff,
          efficiencyValueVND: eff,
          cost_before: cb,
          costBefore: cb,
          chi_phi_truoc: cb,
          cost_after: ca,
          costAfter: ca,
          chi_phi_sau: ca,
          total_savings_vnd: tot,
          totalSavingsVnd: tot,
          tong_tien_tiet_kiem: tot,
          pair_quantity: q > 0 ? q : 1,
          quantity: q > 0 ? q : 1,
          so_luong_giay: q > 0 ? q : 1,
          before_image_url: getValidKaizenImageUrl(p.before_image_url, p.attachments_json, "BEFORE") || p.before_image_url || '',
          after_image_url: getValidKaizenImageUrl(p.after_image_url, p.attachments_json, "AFTER") || p.after_image_url || '',
        };
      });

      const finalData = cleanedResults.length > 0 ? cleanedResults : DEFAULT_KAIZEN_PROPOSALS;

      if (searchParams.get('stats') === '1' || searchParams.get('stats') === 'true' || request.url.includes('/stats')) {
        const totalCount = finalData.length;
        const countThiDua = finalData.filter((p: any) => p.registration_type === 'THI_DUA').length;
        const countLuuTru = finalData.filter((p: any) => p.registration_type === 'LUU_TRU' || Number(p.is_archived) === 1).length;
        const activeMonthCount = finalData.filter((p: any) => {
          if (!p || !p.created_at) return false;
          const d = new Date(p.created_at);
          return !isNaN(d.getTime()) && d.getMonth() === 7 && d.getFullYear() === 2026;
        }).length;
        const countEvaluated = finalData.filter((p: any) => p.sub_status === 'DA_DANH_GIA' || Number(p.score_points || 0) > 0 || Number(p.rating_count || 0) > 0).length;
        const totalValueVnd = finalData.reduce((sum: number, p: any) => sum + getProposalValueVnd(p), 0);
        const totalValueTr = totalValueVnd / 1000000;

        const byRegion: Record<string, { count: number; totalValueVnd: number; totalValueTr: number }> = {};
        STANDARD_DASHBOARD_REGIONS.forEach((r) => {
          byRegion[r] = { count: 0, totalValueVnd: 0, totalValueTr: 0 };
        });

        finalData.forEach((p: any) => {
          const reg = normalizeRegion(p);
          if (byRegion[reg]) {
            const valVnd = getProposalValueVnd(p);
            byRegion[reg].count += 1;
            byRegion[reg].totalValueVnd += valVnd;
            byRegion[reg].totalValueTr = byRegion[reg].totalValueVnd / 1000000;
          }
        });

        const thkgCount = (byRegion['Phòng Ban THKG']?.count || 0) +
                         (byRegion['Kiên Giang 1']?.count || 0) +
                         (byRegion['Kiên Giang 2']?.count || 0) +
                         (byRegion['Kiên Giang 3']?.count || 0) +
                         (byRegion['Hoàn Thiện Đế']?.count || 0);

        const thkgVnd = (byRegion['Phòng Ban THKG']?.totalValueVnd || 0) +
                       (byRegion['Kiên Giang 1']?.totalValueVnd || 0) +
                       (byRegion['Kiên Giang 2']?.totalValueVnd || 0) +
                       (byRegion['Kiên Giang 3']?.totalValueVnd || 0) +
                       (byRegion['Hoàn Thiện Đế']?.totalValueVnd || 0);

        byRegion['THKG'] = {
          count: thkgCount,
          totalValueVnd: thkgVnd,
          totalValueTr: thkgVnd / 1000000,
        };

        return NextResponse.json(
          {
            success: true,
            data: {
              summary: {
                totalCount,
                countThiDua,
                countLuuTru,
                activeMonthCount,
                countEvaluated,
                totalValueVnd,
                totalValueTr,
              },
              byRegion,
            },
          },
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: finalData,
          proposals: finalData,
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: DEFAULT_KAIZEN_PROPOSALS,
      proposals: DEFAULT_KAIZEN_PROPOSALS,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi truy vấn Kaizen';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
    }

    const body = await request.json();
    const {
      id: existingId,
      code: existingCode,
      title,
      category = 'PRODUCTIVITY',
      categoryLabel = '3.Tăng Năng suất',
      registrationType = 'THI_DUA',
      factory = 'VP CHUỖI',
      department = 'Xưởng Sản Xuất',
      line = '',
      proposerName,
      proposerEmpCode,
      proposerPosition = 'Công nhân',
      productCode = '',
      product_code = '',
      quantity = 0,
      pair_quantity = 0,
      pairQuantity = 0,
      so_luong_giay = 0,
      beforeDescription = '',
      before_description = '',
      afterSolution = '',
      after_solution = '',
      savedSeconds = 0,
      saved_seconds = 0,
      so_giay_tiet_kiem = 0,
      timeBeforeSeconds = 0,
      time_before_seconds = 0,
      timeAfterSeconds = 0,
      time_after_seconds = 0,
      efficiencyValueVND = 0,
      efficiency_value_vnd = 0,
      totalSavingsVnd = 0,
      total_savings_vnd = 0,
      costBefore = 0,
      cost_before = 0,
      costAfter = 0,
      cost_after = 0,
      beforeImageUrl = '',
      afterImageUrl = '',
      before_image_url = '',
      after_image_url = '',
      attachments = [],
      status = 'SUBMITTED',
    } = body;

    const finalProductCode = (productCode || product_code || '').trim();
    const finalQuantity = Number(quantity || pair_quantity || pairQuantity || so_luong_giay || 0);
    const finalBeforeDesc = (beforeDescription || before_description || '').trim();
    const finalAfterSol = (afterSolution || after_solution || '').trim() || 'Đề xuất đăng ký hiện trạng trước cải tiến';
    const finalTimeBefore = Number(timeBeforeSeconds || time_before_seconds || 0);
    const finalTimeAfter = Number(timeAfterSeconds || time_after_seconds || 0);
    const calcSavedSecs = Math.max(0, finalTimeBefore - finalTimeAfter);
    const finalSavedSecs = Number(savedSeconds || saved_seconds || so_giay_tiet_kiem || calcSavedSecs || 0);
    const finalEfficiencyVnd = Number(efficiencyValueVND || efficiency_value_vnd || Math.round(finalSavedSecs * 12.5) || 0);
    const finalCostBefore = Number(costBefore || cost_before || 0);
    const finalCostAfter = Number(costAfter || cost_after || 0);
    const calcTotalSavings = finalCostBefore > 0 ? Math.max(0, finalCostBefore - finalCostAfter) : (finalQuantity > 0 ? finalEfficiencyVnd * finalQuantity : finalEfficiencyVnd);
    const finalTotalSavings = Number(totalSavingsVnd || total_savings_vnd || calcTotalSavings || 0);

    const rawBeforeImg = before_image_url || beforeImageUrl || '';
    const rawAfterImg = after_image_url || afterImageUrl || '';

    const finalTitle = (title && String(title).trim()) || (finalBeforeDesc ? `Cải tiến: ${finalBeforeDesc.substring(0, 50)}` : 'Sáng kiến cải tiến Kaizen');

    if (!proposerName) {
      return NextResponse.json({ error: 'Tên người đề xuất là bắt buộc' }, { status: 400 });
    }

    if (!proposerEmpCode || !proposerEmpCode.trim()) {
      return NextResponse.json({ success: false, error: 'MSNV_REQUIRED', message: 'Mã số nhân viên (MSNV) là bắt buộc' }, { status: 400 });
    }

    const codeUpper = proposerEmpCode.trim().toUpperCase();
    const cleanCode = codeUpper.replace(/[-_]/g, '');
    let isMsnvValid = false;

    if (db) {
      try {
        const query = `
          SELECT id AS emp_code FROM hr_employees WHERE UPPER(id) = ?
          UNION
          SELECT emp_code FROM users WHERE UPPER(emp_code) = ? OR CAST(id AS TEXT) = ?
          LIMIT 1
        `;
        const res = await db.prepare(query).bind(codeUpper, codeUpper, codeUpper).first();
        if (res) isMsnvValid = true;
      } catch (e) {}
    }

    if (!isMsnvValid && SYSTEM_USERS[codeUpper]) {
      isMsnvValid = true;
    }

    if (!isMsnvValid) {
      const sysUserKey = Object.keys(SYSTEM_USERS).find((k) => {
        const cleanK = k.toUpperCase().replace(/[-_]/g, '');
        const uEmp = (SYSTEM_USERS[k].empCode || '').toUpperCase().replace(/[-_]/g, '');
        return cleanK === cleanCode || uEmp === cleanCode;
      });
      if (sysUserKey) isMsnvValid = true;
    }

    if (!isMsnvValid && proposerName && proposerName.trim().length > 0) {
      isMsnvValid = true;
    }

    if (!isMsnvValid && /^[A-Z0-9_-]{4,15}$/i.test(codeUpper)) {
      isMsnvValid = true;
    }

    // Rate Limiting Check (Max 5 submissions per 60 seconds per IP + MSNV pair)
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateLimitKey = `${clientIp}_${codeUpper}`;

    if (db && !existingId) {
      try {
        const checkRateQuery = `
          SELECT COUNT(*) as count FROM ci_kaizen_rate_limits
          WHERE ip_emp_key = ? AND created_at > datetime('now', '-60 seconds')
        `;
        const rateRes = await db.prepare(checkRateQuery).bind(rateLimitKey).first();
        const requestCount = Number(rateRes?.count || 0);

        if (requestCount >= 5) {
          return NextResponse.json(
            {
              success: false,
              error: 'TOO_MANY_REQUESTS',
              message: 'Bạn đã gửi quá nhiều đề xuất trong thời gian ngắn, vui lòng thử lại sau ít phút.',
            },
            { status: 429 }
          );
        }

        // Record submission in rate limit table
        const rlId = `rl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.prepare(`INSERT INTO ci_kaizen_rate_limits (id, ip_emp_key) VALUES (?, ?)`).bind(rlId, rateLimitKey).run().catch(() => {});
      } catch (rlErr) {
        console.warn('[RATE LIMIT] Warning checking rate limit:', rlErr);
      }
    }

    const safeFactory = factory || 'VP CHUỖI';
    const id = existingId || `kz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const code = existingCode || `KZ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const cleanBeforeImg = getValidKaizenImageUrl(rawBeforeImg);
    const cleanAfterImg = getValidKaizenImageUrl(rawAfterImg);

    const attachmentsJson = Array.isArray(attachments) && attachments.length > 0
      ? JSON.stringify(attachments)
      : JSON.stringify([
          ...(cleanBeforeImg || rawBeforeImg ? [{ url: cleanBeforeImg || rawBeforeImg, tag: 'BEFORE', type: 'image' }] : []),
          ...(cleanAfterImg || rawAfterImg ? [{ url: cleanAfterImg || rawAfterImg, tag: 'AFTER', type: 'image' }] : []),
        ]);

    if (db) {
      const targetId = existingId || id;
      const targetCode = existingCode || code;

      const existingRecord: any = await db
        .prepare("SELECT id, code FROM ci_kaizen_proposals WHERE id = ? OR code = ?")
        .bind(targetId, targetCode)
        .first()
        .catch(() => null);

      if (existingRecord || existingId) {
        const updateId = existingRecord?.id || targetId;
        const updateQuery = `
          UPDATE ci_kaizen_proposals
          SET title = ?,
              category = ?,
              category_label = ?,
              factory = ?,
              department = ?,
              line = ?,
              proposer_name = ?,
              proposer_position = ?,
              product_code = ?,
              pair_quantity = ?,
              quantity = ?,
              before_description = ?,
              after_solution = ?,
              time_before_seconds = ?,
              time_after_seconds = ?,
              saved_seconds = ?,
              so_giay_tiet_kiem = ?,
              efficiency_value_vnd = ?,
              total_savings_vnd = ?,
              cost_before = ?,
              cost_after = ?,
              before_image_url = ?,
              after_image_url = ?,
              attachments_json = ?,
              trang_thai = 'CHO_DUYET',
              sub_status = 'CHO_DUYET',
              review_status = 'CHO_DUYET',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? OR code = ?
        `;
        await db
          .prepare(updateQuery)
          .bind(
            finalTitle,
            category,
            categoryLabel,
            safeFactory,
            department,
            line,
            proposerName,
            proposerPosition || 'Công nhân',
            finalProductCode,
            finalQuantity,
            finalQuantity,
            finalBeforeDesc,
            finalAfterSol,
            finalTimeBefore,
            finalTimeAfter,
            finalSavedSecs,
            finalSavedSecs,
            finalEfficiencyVnd,
            finalTotalSavings,
            finalCostBefore,
            finalCostAfter,
            cleanBeforeImg || rawBeforeImg,
            cleanAfterImg || rawAfterImg,
            attachmentsJson,
            updateId,
            targetCode
          )
          .run();
      } else {
        const query = `
          INSERT INTO ci_kaizen_proposals (
            id, code, title, category, category_label, registration_type,
            region, department, factory, line, proposer_name, proposer_emp_code, proposer_position,
            product_code, pair_quantity, quantity,
            before_description, after_solution,
            time_before_seconds, time_after_seconds, saved_seconds, so_giay_tiet_kiem,
            efficiency_value_vnd, total_savings_vnd, cost_before, cost_after,
            before_image_url, after_image_url, attachments_json, status, sub_status,
            trang_thai, review_status, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, 'CHO_DUYET',
            'CHO_DUYET', 'CHO_DUYET', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `;

        await db
          .prepare(query)
          .bind(
            id,
            code,
            finalTitle,
            category,
            categoryLabel,
            registrationType || 'THI_DUA',
            safeFactory,
            department,
            safeFactory,
            line,
            proposerName,
            (proposerEmpCode && proposerEmpCode.trim()) ? proposerEmpCode.trim() : (session?.empCode || 'SK-EMP'),
            proposerPosition || 'Công nhân',
            finalProductCode,
            finalQuantity,
            finalQuantity,
            finalBeforeDesc,
            finalAfterSol,
            finalTimeBefore,
            finalTimeAfter,
            finalSavedSecs,
            finalSavedSecs,
            finalEfficiencyVnd,
            finalTotalSavings,
            finalCostBefore,
            finalCostAfter,
            cleanBeforeImg || rawBeforeImg,
            cleanAfterImg || rawAfterImg,
            attachmentsJson,
            'SUBMITTED'
          )
          .run();
      }

      // Trigger real-time background sync to web tong
      db.prepare('SELECT * FROM ci_kaizen_proposals WHERE id = ?').bind(id).first()
        .then((proposalData: any) => {
          if (proposalData) triggerRealtimeSyncToWebTong(proposalData);
        }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Gửi đề xuất Kaizen và lưu trữ thành công!',
      code,
      id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi đăng ký Kaizen';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const empCodeHeader = request.headers.get('x-user-emp-code') || request.headers.get('X-User-Emp-Code');
    const token = authHeader?.replace('Bearer ', '');
    let session = token ? await verifyToken(token) : null;

    if (!session && empCodeHeader) {
      session = { empCode: empCodeHeader, name: empCodeHeader, role: 'USER' } as any;
    }

    const body = await request.json();
    const {
      id,
      code,
      title,
      category,
      category_label,
      categoryLabel,
      region,
      factory,
      department,
      line,
      customer,
      product_code,
      productCode,
      pair_quantity,
      pairQuantity,
      quantity,
      pricing_direction,
      before_description,
      beforeDescription,
      after_solution,
      afterSolution,
      time_before_seconds,
      timeBeforeSeconds,
      time_after_seconds,
      timeAfterSeconds,
      saved_seconds,
      savedSeconds,
      so_giay_tiet_kiem,
      efficiency_value_vnd,
      efficiencyValueVND,
      total_savings_vnd,
      totalSavingsVnd,
      total_savings_words,
      totalSavingsWords,
      cost_before,
      costBefore,
      cost_after,
      costAfter,
      before_image_url,
      beforeImageUrl,
      after_image_url,
      afterImageUrl,
    } = body;

    console.log("📥 [Backend PUT /api/ci-kaizen] Received Body:\n" + JSON.stringify(body, null, 2));

    const targetId = String(id || body.proposal_id || '').trim();
    const targetCode = String(code || body.proposal_code || '').trim();

    if (!targetId && !targetCode) {
      return NextResponse.json({ error: 'Mã đề xuất không hợp lệ' }, { status: 400 });
    }

    const db = getDbBinding();

    if (db) {
      const inputBeforeDesc = before_description !== undefined ? before_description : beforeDescription;
      const inputAfterSol = after_solution !== undefined ? after_solution : afterSolution;
      
      const rawTitle = title !== undefined && title !== null ? String(title).trim() : null;
      const finalTitle = rawTitle && rawTitle.length > 0 ? rawTitle : null;

      const rawBeforeDesc = inputBeforeDesc !== undefined && inputBeforeDesc !== null ? String(inputBeforeDesc).trim() : null;
      const finalBeforeDesc = rawBeforeDesc && rawBeforeDesc.length > 0 ? rawBeforeDesc : null;

      const rawAfterSol = inputAfterSol !== undefined && inputAfterSol !== null ? String(inputAfterSol).trim() : null;
      const finalAfterSol = rawAfterSol && rawAfterSol.length > 0 ? rawAfterSol : null;

      const finalCategory = category && String(category).trim() ? String(category).trim() : null;
      const catMap: Record<string, string> = {
        "MATERIAL_SAVING": "1.Tiết kiệm Vật tư",
        "COST_SAVING": "2.Tiết kiệm Chi phí",
        "PRODUCTIVITY": "3.Tăng Năng suất",
        "SAFETY": "4.An toàn lao động",
        "5S": "5.5S",
        "AUTOMATION": "6.Tự động hoá",
        "EQUIPMENT": "7.MMTB CCDC",
      };
      const finalCategoryLabel = finalCategory ? (catMap[finalCategory] || category_label || categoryLabel || null) : (category_label || categoryLabel || null);

      const finalProductCode = (product_code ?? productCode ?? body.product_code ?? '').trim();
      const finalPairQty = Number(pair_quantity ?? pairQuantity ?? quantity ?? body.so_luong_giay ?? 0);
      const finalTimeBefore = Number(time_before_seconds ?? timeBeforeSeconds ?? 0);
      const finalTimeAfter = Number(time_after_seconds ?? timeAfterSeconds ?? 0);

      const calcSavedSecs = (finalTimeBefore > 0 || finalTimeAfter > 0) ? Math.max(0, finalTimeBefore - finalTimeAfter) : 0;
      const inputSavedSecs = Number(saved_seconds ?? savedSeconds ?? so_giay_tiet_kiem ?? 0);
      const finalSavedSecs = calcSavedSecs > 0 ? calcSavedSecs : (inputSavedSecs > 0 ? inputSavedSecs : 0);

      const inputEffVnd = Number(efficiency_value_vnd ?? efficiencyValueVND ?? 0);
      const calcEffVnd = finalSavedSecs > 0 ? Math.round(finalSavedSecs * 12.5) : 0;
      const finalEffVnd = inputEffVnd > 0 ? inputEffVnd : calcEffVnd;

      const pairMult = finalPairQty > 0 ? finalPairQty : 1;
      let inputCostBefore = Number(cost_before ?? costBefore ?? body.cost_before_vnd ?? body.costBeforeVnd ?? body.chi_phi_truoc ?? 0);
      let inputCostAfter = Number(cost_after ?? costAfter ?? body.cost_after_vnd ?? body.costAfterVnd ?? body.chi_phi_sau ?? 0);

      let finalCostBefore = inputCostBefore;
      if (finalCostBefore <= 0 && finalTimeBefore > 0) {
        finalCostBefore = Math.round(finalTimeBefore * 12.5 * pairMult);
      }

      let finalCostAfter = inputCostAfter;
      if (finalCostAfter <= 0 && finalTimeAfter > 0) {
        finalCostAfter = Math.round(finalTimeAfter * 12.5 * pairMult);
      }

      const calcTotalSavings = (finalCostBefore > 0 || finalCostAfter > 0)
        ? Math.max(0, finalCostBefore - finalCostAfter)
        : (finalPairQty > 0 ? finalEffVnd * finalPairQty : (finalEffVnd > 0 ? finalEffVnd : 0));

      const inputTotalSavings = Number(total_savings_vnd ?? totalSavingsVnd ?? body.tong_tien_tiet_kiem ?? 0);
      const finalTotalSavings = inputTotalSavings > 0 ? inputTotalSavings : calcTotalSavings;

      let existingRow: any = null;
      try {
        existingRow = await db.prepare(`
          SELECT * FROM ci_kaizen_proposals
          WHERE (id = ? AND id != '')
             OR (code = ? AND code != '')
             OR (id = ? AND id != '')
             OR (code = ? AND code != '')
             OR (LOWER(id) = LOWER(?) AND id != '')
             OR (LOWER(code) = LOWER(?) AND code != '')
             OR (LOWER(id) = LOWER(?) AND id != '')
             OR (LOWER(code) = LOWER(?) AND code != '')
          LIMIT 1
        `).bind(targetId, targetCode, targetCode, targetId, targetId, targetCode, targetCode, targetId).first();
      } catch (e) {}

      const rowId = existingRow?.id || targetId;
      const rowCode = existingRow?.code || targetCode || targetId;

      const updateQuery = `
        UPDATE ci_kaizen_proposals
        SET title = ?,
            category = ?,
            category_label = ?,
            region = ?,
            factory = ?,
            department = ?,
            line = ?,
            customer = ?,
            pricing_direction = ?,
            product_code = ?,
            pair_quantity = ?,
            quantity = ?,
            before_description = ?,
            after_solution = ?,
            time_before_seconds = ?,
            time_after_seconds = ?,
            saved_seconds = ?,
            so_giay_tiet_kiem = ?,
            efficiency_value_vnd = ?,
            total_savings_vnd = ?,
            total_savings_words = ?,
            cost_before = ?,
            cost_after = ?,
            before_image_url = ?,
            after_image_url = ?,
            attachments_json = COALESCE(NULLIF(?, ''), attachments_json),
            is_edited = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR code = ? OR id = ? OR code = ? OR LOWER(id) = LOWER(?) OR LOWER(code) = LOWER(?) OR LOWER(id) = LOWER(?) OR LOWER(code) = LOWER(?)
      `;

      const finalBeforeImg = before_image_url || beforeImageUrl || existingRow?.before_image_url || '';
      const finalAfterImg = after_image_url || afterImageUrl || existingRow?.after_image_url || '';

      let updatedAttachments: any[] = [];
      if (existingRow?.attachments_json) {
        try {
          const parsed = JSON.parse(existingRow.attachments_json);
          if (Array.isArray(parsed)) updatedAttachments = [...parsed];
        } catch (e) {}
      }
      if (finalBeforeImg && !updatedAttachments.some((item) => (typeof item === 'string' ? item : item?.url) === finalBeforeImg)) {
        updatedAttachments.push({ url: finalBeforeImg, tag: "BEFORE", type: "image" });
      }
      if (finalAfterImg && !updatedAttachments.some((item) => (typeof item === 'string' ? item : item?.url) === finalAfterImg)) {
        updatedAttachments.push({ url: finalAfterImg, tag: "AFTER", type: "image" });
      }
      const finalAttachmentsJson = JSON.stringify(updatedAttachments);

      let updateRes: any = null;
      try {
        updateRes = await db.prepare(updateQuery).bind(
          finalTitle ?? existingRow?.title ?? '',
          finalCategory ?? existingRow?.category ?? 'PRODUCTIVITY',
          finalCategoryLabel ?? existingRow?.category_label ?? '3.Tăng Năng suất',
          region || factory || existingRow?.region || 'Nhà Máy Miền Đông',
          factory || region || existingRow?.factory || 'Nhà Máy Miền Đông',
          department || existingRow?.department || '',
          line || existingRow?.line || '',
          customer || existingRow?.customer || 'Skechers',
          pricing_direction || existingRow?.pricing_direction || 'THOI_GIAN',
          finalProductCode || existingRow?.product_code || '',
          finalPairQty,
          finalPairQty,
          finalBeforeDesc ?? existingRow?.before_description ?? '',
          finalAfterSol ?? existingRow?.after_solution ?? '',
          finalTimeBefore,
          finalTimeAfter,
          finalSavedSecs,
          finalSavedSecs,
          finalEffVnd,
          finalTotalSavings,
          total_savings_words || totalSavingsWords || existingRow?.total_savings_words || '',
          finalCostBefore,
          finalCostAfter,
          finalBeforeImg,
          finalAfterImg,
          finalAttachmentsJson,
          rowId,
          rowCode,
          targetId,
          targetCode,
          rowId,
          rowCode,
          targetId,
          targetCode
        ).run();
      } catch (err: any) {
        console.error("❌ [Backend PUT /api/ci-kaizen] Update SQL error:", err);
      }

      const rowsAffected = Number(updateRes?.meta?.changes || 0);
      console.log(`📊 [Backend PUT /api/ci-kaizen] DB update executed. rowsAffected: ${rowsAffected}, targetId: "${rowId}"`);

      if (rowsAffected === 0) {
        console.log(`⚠️ [Backend PUT /api/ci-kaizen] UPDATE matched 0 rows. Executing UPSERT INSERT for id: "${rowId}"...`);
        const insertQuery = `
          INSERT INTO ci_kaizen_proposals (
            id, code, title, category, category_label, registration_type,
            region, factory, department, line, customer, pricing_direction,
            product_code, pair_quantity, quantity,
            before_description, after_solution,
            time_before_seconds, time_after_seconds, saved_seconds, so_giay_tiet_kiem,
            efficiency_value_vnd, total_savings_vnd, total_savings_words,
            cost_before, cost_after,
            before_image_url, after_image_url, attachments_json,
            status, approval_status, sub_status, trang_thai, review_status,
            is_edited, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?, ?,
            'SUBMITTED', 'PENDING', 'CHO_DUYET', 'CHO_DUYET', 'CHO_DUYET',
            1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `;

        await db.prepare(insertQuery).bind(
          rowId,
          rowCode,
          finalTitle || existingRow?.title || 'Sáng kiến cải tiến Kaizen',
          finalCategory || existingRow?.category || 'PRODUCTIVITY',
          finalCategoryLabel || existingRow?.category_label || '3.Tăng Năng suất',
          'THI_DUA',
          region || factory || existingRow?.region || 'Nhà Máy Miền Đông',
          factory || region || existingRow?.factory || 'Nhà Máy Miền Đông',
          department || '',
          line || '',
          customer || 'Skechers',
          pricing_direction || 'THOI_GIAN',
          finalProductCode || '',
          finalPairQty,
          finalPairQty,
          finalBeforeDesc || '',
          finalAfterSol || '',
          finalTimeBefore,
          finalTimeAfter,
          finalSavedSecs,
          finalSavedSecs,
          finalEffVnd,
          finalTotalSavings,
          total_savings_words || totalSavingsWords || '',
          finalCostBefore,
          finalCostAfter,
          before_image_url || beforeImageUrl || '',
          after_image_url || afterImageUrl || '',
          JSON.stringify([])
        ).run().catch((insErr: any) => {
          console.error("❌ [Backend PUT /api/ci-kaizen] UPSERT Insert Error:", insErr);
        });
      }

      const updatedRow = await db.prepare(`
        SELECT * FROM ci_kaizen_proposals 
        WHERE id = ? OR code = ? OR LOWER(id) = LOWER(?) OR LOWER(code) = LOWER(?)
      `)
        .bind(rowId, rowCode, rowId, rowCode)
        .first()
        .catch(() => null);

      console.log("✅ [Backend PUT /api/ci-kaizen] Saved D1 Record:\n" + JSON.stringify(updatedRow, null, 2));

      const updatedData = {
        ...body,
        ...(updatedRow || {}),
        time_before_seconds: finalTimeBefore ?? updatedRow?.time_before_seconds ?? body.time_before_seconds ?? 0,
        timeBeforeSeconds: finalTimeBefore ?? updatedRow?.time_before_seconds ?? body.time_before_seconds ?? 0,
        time_after_seconds: finalTimeAfter ?? updatedRow?.time_after_seconds ?? body.time_after_seconds ?? 0,
        timeAfterSeconds: finalTimeAfter ?? updatedRow?.time_after_seconds ?? body.time_after_seconds ?? 0,
        saved_seconds: finalSavedSecs ?? updatedRow?.saved_seconds ?? body.saved_seconds ?? 0,
        savedSeconds: finalSavedSecs ?? updatedRow?.saved_seconds ?? body.saved_seconds ?? 0,
        so_giay_tiet_kiem: finalSavedSecs ?? updatedRow?.saved_seconds ?? body.saved_seconds ?? 0,
        total_savings_vnd: finalTotalSavings ?? updatedRow?.total_savings_vnd ?? body.total_savings_vnd ?? 0,
        totalSavingsVnd: finalTotalSavings ?? updatedRow?.total_savings_vnd ?? body.total_savings_vnd ?? 0,
        tong_tien_tiet_kiem: finalTotalSavings ?? updatedRow?.total_savings_vnd ?? body.total_savings_vnd ?? 0,
        efficiency_value_vnd: finalEffVnd ?? updatedRow?.efficiency_value_vnd ?? body.efficiency_value_vnd ?? 0,
        efficiencyValueVND: finalEffVnd ?? updatedRow?.efficiency_value_vnd ?? body.efficiency_value_vnd ?? 0,
        cost_before: finalCostBefore ?? updatedRow?.cost_before ?? body.cost_before ?? 0,
        costBefore: finalCostBefore ?? updatedRow?.cost_before ?? body.cost_before ?? 0,
        cost_after: finalCostAfter ?? updatedRow?.cost_after ?? body.cost_after ?? 0,
        costAfter: finalCostAfter ?? updatedRow?.cost_after ?? body.cost_after ?? 0,
        pair_quantity: finalPairQty ?? updatedRow?.pair_quantity ?? body.pair_quantity ?? 0,
        quantity: finalPairQty ?? updatedRow?.pair_quantity ?? body.pair_quantity ?? 0,
        before_image_url: finalBeforeImg || updatedRow?.before_image_url || body.before_image_url || '',
        beforeImageUrl: finalBeforeImg || updatedRow?.before_image_url || body.before_image_url || '',
        after_image_url: finalAfterImg || updatedRow?.after_image_url || body.after_image_url || '',
        afterImageUrl: finalAfterImg || updatedRow?.after_image_url || body.after_image_url || '',
        attachments_json: finalAttachmentsJson || updatedRow?.attachments_json || body.attachments_json || JSON.stringify([]),
      };

      if (updatedRow) {
        triggerRealtimeSyncToWebTong(updatedData);
      }

      return NextResponse.json({
        success: true,
        message: 'Cập nhật đề xuất Kaizen thành công!',
        data: updatedData,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật đề xuất Kaizen thành công!',
      data: body,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi cập nhật Kaizen';
    console.error("❌ [Backend PUT /api/ci-kaizen] Exception:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const empCodeHeader = request.headers.get('x-user-emp-code') || request.headers.get('X-User-Emp-Code');
    const token = authHeader?.replace('Bearer ', '');
    let session = token ? await verifyToken(token) : null;

    if (!session && empCodeHeader) {
      session = { empCode: empCodeHeader, name: empCodeHeader, role: 'USER' } as any;
    }

    if (!session) {
      session = { empCode: empCodeHeader || '202608001', name: 'Management User', role: 'USER' } as any;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Mã đề xuất không hợp lệ' }, { status: 400 });
    }

    const db = getDbBinding();

    if (db) {
      const query = `DELETE FROM ci_kaizen_proposals WHERE id = ?`;
      await db.prepare(query).bind(id).run();
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa đề xuất thành công!',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi xóa Kaizen';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}

