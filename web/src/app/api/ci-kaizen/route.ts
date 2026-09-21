import { NextResponse } from 'next/server';

import { verifyToken } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { triggerRealtimeSyncToWebTong } from '@/lib/kaizenSyncHelper';
import { SYSTEM_USERS } from '@/lib/userProfiles';
import { getValidKaizenImageUrl } from '@/lib/kaizenImageHelper';

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
    saved_seconds: 15,
    so_giay_tiet_kiem: 15,
    total_savings_vnd: 15000000,
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
    saved_seconds: 30,
    so_giay_tiet_kiem: 30,
    total_savings_vnd: 28000000,
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
    saved_seconds: 120,
    so_giay_tiet_kiem: 120,
    total_savings_vnd: 35000000,
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
      await ensureKaizenSchema(db);

      // Seed/Upsert 2 core proposals from screenshot into D1 database if missing
      try {
        for (const seed of DEFAULT_KAIZEN_PROPOSALS) {
          await db.prepare(`
            INSERT INTO ci_kaizen_proposals (
              id, code, title, category, category_label, registration_type, factory, region, source_region, department, line, proposer_name, proposer_emp_code, before_description, after_solution, saved_seconds, total_savings_vnd, score_points, vote_count, view_count, status, approval_status, sub_status, trang_thai, review_status, before_image_url, after_image_url, attachments_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              factory = excluded.factory,
              region = excluded.region,
              source_region = excluded.source_region,
              department = excluded.department,
              title = excluded.title,
              category_label = excluded.category_label
          `).bind(
            seed.id, seed.code, seed.title, seed.category, seed.category_label, seed.registration_type,
            seed.factory, seed.region, seed.source_region, seed.department, seed.line, seed.proposer_name,
            seed.proposer_emp_code, seed.before_description, seed.after_solution, seed.saved_seconds,
            seed.total_savings_vnd, seed.score_points, seed.vote_count, seed.view_count, seed.status,
            seed.approval_status, seed.sub_status, seed.trang_thai, seed.review_status, seed.before_image_url,
            seed.after_image_url, seed.attachments_json, seed.created_at
          ).run();
        }
      } catch (seedErr) {
        console.warn('[ci-kaizen GET] Seed error:', seedErr);
      }
      // Fetch ALL proposals in System B database (vpchuoiskechers-db)
      const query = `SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500`;
      const { results } = await db.prepare(query).all();

      const cleanedResults = (results || []).map((p: any) => ({
        ...p,
        title: (p.title && String(p.title).trim()) || p.tieu_de || p.name || (p.before_description ? `Cải tiến: ${String(p.before_description).trim().substring(0, 50)}` : 'Sáng kiến cải tiến Kaizen'),
        before_image_url: getValidKaizenImageUrl(p.before_image_url, p.attachments_json) || p.before_image_url || '',
        after_image_url: getValidKaizenImageUrl(p.after_image_url) || p.after_image_url || '',
      }));

      const finalData = cleanedResults.length > 0 ? cleanedResults : DEFAULT_KAIZEN_PROPOSALS;

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
          SELECT emp_code FROM hr_employees WHERE UPPER(emp_code) = ? OR UPPER(msnv) = ?
          UNION
          SELECT id FROM users WHERE UPPER(emp_code) = ? OR UPPER(id) = ?
          LIMIT 1
        `;
        const res = await db.prepare(query).bind(codeUpper, codeUpper, codeUpper, codeUpper).first();
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
      if (existingId) {
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
          WHERE id = ?
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
            existingId
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
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để cập nhật Kaizen! (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, title, category, categoryLabel, beforeDescription, afterSolution, savedSeconds } = body;

    if (!id) {
      return NextResponse.json({ error: 'Mã đề xuất không hợp lệ' }, { status: 400 });
    }

    const db = getDbBinding();

    if (db) {
      const query = `
        UPDATE ci_kaizen_proposals
        SET title = COALESCE(?, title),
            category = COALESCE(?, category),
            category_label = COALESCE(?, category_label),
            before_description = COALESCE(?, before_description),
            after_solution = COALESCE(?, after_solution),
            saved_seconds = COALESCE(?, saved_seconds),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await db.prepare(query).bind(title, category, categoryLabel, beforeDescription, afterSolution, savedSeconds, id).run();

      db.prepare('SELECT * FROM ci_kaizen_proposals WHERE id = ?').bind(id).first()
        .then((proposalData: any) => {
          if (proposalData) triggerRealtimeSyncToWebTong(proposalData);
        }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật đề xuất Kaizen thành công!',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi cập nhật Kaizen';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để xóa Kaizen! (401 Unauthorized)' },
        { status: 401 }
      );
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
