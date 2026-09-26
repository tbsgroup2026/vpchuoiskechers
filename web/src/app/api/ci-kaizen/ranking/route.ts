import { NextResponse } from 'next/server';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

import { verifyToken } from '@/lib/auth';

function isApprovedAndValid(p: any): boolean {
  if (p.is_archived === 1 || p.is_archived === true || p.is_deleted === 1 || p.is_deleted === true) return false;

  const subStatus = (p.sub_status || '').toUpperCase();
  const status = (p.status || '').toUpperCase();
  const appStatus = (p.approval_status || '').toUpperCase();
  const trangThai = (p.trang_thai || '').toUpperCase();

  // EXCLUDE Rejected proposals from ranking (they stay visible on list with badge, but not on leaderboard)
  if (appStatus === 'TU_CHOI' || appStatus === 'REJECTED' || subStatus === 'TU_CHOI_TRIEN_KHAI' || subStatus === 'TU_CHOI_DUYET' || status === 'REJECTED') {
    return false;
  }

  // EXCLUDE Pending approval proposals from ranking
  if (['CHO_REVIEW', 'CHO_DUYET', 'SO_DUYET', 'SO_BO', 'CHO_PHE_DUYET', 'CAN_CHINH_SUA'].includes(subStatus)) return false;
  if (['SUBMITTED', 'PENDING', 'DRAFT', 'CHO_DUYET'].includes(status)) return false;
  if (['PENDING', 'CHO_DUYET', 'CHO_PHE_DUYET'].includes(appStatus)) return false;

  // MUST BE officially approved
  const isOfficiallyApproved =
    appStatus === 'PHE_DUYET' ||
    appStatus === 'APPROVED' ||
    ['DA_DANH_GIA', 'DA_DUYET', 'DA_XEP_HANG'].includes(subStatus) ||
    ['DA_DANH_GIA', 'DA_XEP_HANG'].includes(trangThai) ||
    ['APPROVED', 'COMPLETED', 'IMPLEMENTED'].includes(status);

  if (!isOfficiallyApproved) return false;

  // MUST HAVE actual savings or efficiency score > 0
  const savingsSecs = Number(p.so_giay_tiet_kiem || p.saved_seconds || 0);
  const savingsVnd = Number(p.tong_tien_tiet_kiem || p.total_savings_vnd || 0);
  const score = Number(p.diem_hieu_qua || p.score_points || 0);

  return savingsSecs > 0 || savingsVnd > 0 || score > 0;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập để xem bảng xếp hạng Kaizen! (401 Unauthorized)' },
        { status: 401 }
      );
    }

    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: true, leaderboard: [] });
    }

    await ensureKaizenSchema(db);

    const { searchParams } = new URL(request.url);
    const weightSavings = Number(searchParams.get('weight_savings') || 1.0);
    const weightEfficiency = Number(searchParams.get('weight_efficiency') || 1.0);
    const regionFilter = searchParams.get('region');

    let query = `
      SELECT * FROM ci_kaizen_proposals
      WHERE (is_archived IS NULL OR is_archived = 0)
        AND (approval_status IS NULL OR UPPER(approval_status) NOT IN ('TU_CHOI', 'REJECTED'))
        AND (
          UPPER(approval_status) IN ('PHE_DUYET', 'APPROVED')
          OR UPPER(sub_status) IN ('DA_DANH_GIA', 'DA_DUYET', 'DA_XEP_HANG')
          OR UPPER(trang_thai) IN ('DA_DANH_GIA', 'DA_XEP_HANG')
          OR UPPER(status) IN ('APPROVED', 'COMPLETED', 'IMPLEMENTED')
        )
        AND UPPER(COALESCE(sub_status, '')) NOT IN ('CHO_REVIEW', 'CHO_DUYET', 'SO_DUYET', 'SO_BO', 'TU_CHOI_TRIEN_KHAI', 'CAN_CHINH_SUA')
        AND UPPER(COALESCE(status, '')) NOT IN ('SUBMITTED', 'REJECTED', 'PENDING', 'DRAFT')
        AND (
          COALESCE(so_giay_tiet_kiem, 0) > 0
          OR COALESCE(saved_seconds, 0) > 0
          OR COALESCE(tong_tien_tiet_kiem, 0) > 0
          OR COALESCE(total_savings_vnd, 0) > 0
          OR COALESCE(diem_hieu_qua, 0) > 0
          OR COALESCE(score_points, 0) > 0
        )
    `;

    const queryParams: any[] = [];

    if (regionFilter && regionFilter !== 'ALL') {
      const uRegion = regionFilter.toUpperCase();
      if (uRegion.includes('VĂN PHÒNG CHUỖI') || uRegion.includes('VP CHUỖI') || uRegion.includes('VP CHUOI')) {
        query += ` AND (site_code IS NULL OR site_code = 'vpchuoiskechers' OR site_code != 'thkiengiangshoes') AND (region IS NULL OR (UPPER(region) NOT LIKE '%TH KIÊN GIANG%' AND UPPER(region) NOT LIKE '%KIÊN GIANG SHOES%'))`;
      } else if (uRegion.includes('TH KIÊN GIANG') || uRegion.includes('KIÊN GIANG SHOES')) {
        query += ` AND (site_code = 'thkiengiangshoes' OR UPPER(region) LIKE '%TH KIÊN GIANG%' OR UPPER(region) LIKE '%KIÊN GIANG SHOES%')`;
      } else if (uRegion.includes('NHÀ MÁY MIỀN ĐÔNG') || uRegion.includes('MIỀN ĐÔNG') || uRegion.includes('NMMĐ') || uRegion.includes('NMMD')) {
        query += ` AND (site_code IS NULL OR site_code != 'thkiengiangshoes') AND (UPPER(region) LIKE '%MIỀN ĐÔNG%' OR UPPER(region) LIKE '%MIEN DONG%' OR UPPER(region) LIKE '%NMMĐ%' OR UPPER(region) LIKE '%NMMD%')`;
      } else {
        query += ` AND UPPER(region) LIKE ?`;
        queryParams.push(`%${uRegion}%`);
      }
    }

    query += ` ORDER BY created_at DESC`;

    const { results } = queryParams.length > 0
      ? await db.prepare(query).bind(...queryParams).all()
      : await db.prepare(query).all();

    if (!results || results.length === 0) {
      return NextResponse.json({ success: true, leaderboard: [] });
    }

    const filteredResults = results.filter(isApprovedAndValid);

    if (filteredResults.length === 0) {
      return NextResponse.json({ success: true, leaderboard: [] });
    }

    const rankedList = filteredResults.map((p: any) => {
      const savingsSecs = Number(p.so_giay_tiet_kiem || p.saved_seconds || 0);
      const efficiencyScore = Number(p.diem_hieu_qua || p.score_points || 0);
      const judgeScore = Number(p.judge_final_score || 0);
      const c1Score = Number(p.c1_score_final || 0);
      const c3Score = Number(p.c3_score_final || 0);

      const totalScore = judgeScore > 0
        ? judgeScore
        : Math.round((savingsSecs * weightSavings + efficiencyScore * weightEfficiency) * 10) / 10;

      let isAppealOpen = false;
      if (p.published_at) {
        const pubTime = new Date(p.published_at).getTime();
        const nowTime = Date.now();
        if (!isNaN(pubTime) && (nowTime - pubTime) <= 3 * 24 * 3600 * 1000) {
          isAppealOpen = true;
        }
      }

      return {
        ...p,
        so_giay_tiet_kiem: savingsSecs,
        diem_hieu_qua: efficiencyScore,
        diem_tong_hop: totalScore,
        c1_score_final: c1Score,
        c3_score_final: c3Score,
        is_appeal_open: isAppealOpen,
      };
    });

    // ⚡ Tie-breaking sort rule (Requirements 4.7.7 & 5.6):
    // Primary: Total score DESC -> Secondary: C1 score DESC -> Tertiary: C3 score DESC
    rankedList.sort((a: any, b: any) => {
      if (b.diem_tong_hop !== a.diem_tong_hop) {
        return b.diem_tong_hop - a.diem_tong_hop;
      }
      if ((b.c1_score_final || 0) !== (a.c1_score_final || 0)) {
        return (b.c1_score_final || 0) - (a.c1_score_final || 0);
      }
      return (b.c3_score_final || 0) - (a.c3_score_final || 0);
    });

    const batchStatements: any[] = [];
    const updateStmt = db.prepare(`
      UPDATE ci_kaizen_proposals
      SET hang_xep = ?,
          diem_tong_hop = ?,
          trang_thai = 'DA_DANH_GIA',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (let i = 0; i < rankedList.length; i++) {
      const rank = i + 1;
      const item = rankedList[i];
      item.hang_xep = rank;

      batchStatements.push(updateStmt.bind(rank, item.diem_tong_hop, item.id));
    }

    if (batchStatements.length > 0) {
      await db.batch(batchStatements);
    }

    return NextResponse.json({
      success: true,
      count: rankedList.length,
      leaderboard: rankedList,
      weights: { weightSavings, weightEfficiency },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi lấy bảng xếp hạng';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

