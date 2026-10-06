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

  // EXCLUDE Rejected proposals from ranking (they stay visible on list with badge, but not on leaderboard)
  if (appStatus === 'TU_CHOI' || appStatus === 'REJECTED' || subStatus === 'TU_CHOI_TRIEN_KHAI' || subStatus === 'TU_CHOI_DUYET' || status === 'REJECTED') {
    return false;
  }

  return true;
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
      return NextResponse.json(
        { success: true, leaderboard: [] },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
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
        AND (sub_status IS NULL OR UPPER(sub_status) NOT IN ('TU_CHOI_TRIEN_KHAI', 'TU_CHOI_DUYET'))
        AND (status IS NULL OR UPPER(status) NOT IN ('REJECTED'))
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
      return NextResponse.json(
        { success: true, leaderboard: [] },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    }

    const filteredResults = results.filter(isApprovedAndValid);

    if (filteredResults.length === 0) {
      return NextResponse.json(
        { success: true, leaderboard: [] },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    }

    let scoreAggMap: Record<
      string,
      {
        avgScore: number;
        avgC1: number;
        avgC2: number;
        avgC3: number;
        avgC4: number;
        avgC5: number;
        maxScore: number;
        minScore: number;
        judgeCount: number;
        isFlagged: boolean;
      }
    > = {};

    try {
      const { results: scoreAggRows } = await db.prepare(`
        SELECT submission_id,
               AVG(total_score) as avg_score,
               AVG(c1_score) as avg_c1,
               AVG(c2_score) as avg_c2,
               AVG(c3_score) as avg_c3,
               AVG(c4_score) as avg_c4,
               AVG(c5_score) as avg_c5,
               MAX(total_score) as max_score,
               MIN(total_score) as min_score,
               COUNT(*) as cnt
        FROM ci_kaizen_scores
        GROUP BY submission_id
      `).all();

      if (scoreAggRows) {
        for (const r of scoreAggRows as any[]) {
          if (r.submission_id) {
            const key = String(r.submission_id).trim().toUpperCase();
            const cnt = Number(r.cnt || 0);
            const maxS = Number(r.max_score || 0);
            const minS = Number(r.min_score || 0);
            scoreAggMap[key] = {
              avgScore: Math.round(Number(r.avg_score || 0) * 10) / 10,
              avgC1: Math.round(Number(r.avg_c1 || 0) * 10) / 10,
              avgC2: Math.round(Number(r.avg_c2 || 0) * 10) / 10,
              avgC3: Math.round(Number(r.avg_c3 || 0) * 10) / 10,
              avgC4: Math.round(Number(r.avg_c4 || 0) * 10) / 10,
              avgC5: Math.round(Number(r.avg_c5 || 0) * 10) / 10,
              maxScore: maxS,
              minScore: minS,
              judgeCount: cnt,
              isFlagged: cnt >= 2 && (maxS - minS > 15),
            };
          }
        }
      }
    } catch (e) {}

    const rankedList = filteredResults.map((p: any) => {
      const savingsSecs = Number(p.so_giay_tiet_kiem || p.saved_seconds || 0);
      const savingsVnd = Number(p.tong_tien_tiet_kiem || p.total_savings_vnd || 0);

      const idKey = String(p.id || '').trim().toUpperCase();
      const codeKey = String(p.code || '').trim().toUpperCase();
      const extIdKey = String(p.external_id || '').trim().toUpperCase();
      const cleanIdKey = idKey.replace(/^TKG_/i, '');
      const agg = scoreAggMap[idKey] || scoreAggMap[codeKey] || scoreAggMap[extIdKey] || scoreAggMap[cleanIdKey] || scoreAggMap[`TKG_${cleanIdKey}`];

      const hasAgg = agg && agg.avgScore > 0;
      const judgeScore = hasAgg ? agg.avgScore : Number(p.judge_final_score || p.score_points || 0);
      const c1Score = hasAgg ? agg.avgC1 : Number(p.c1_score_final || 0);
      const c2Score = hasAgg ? agg.avgC2 : Number(p.c2_score_final || 0);
      const c3Score = hasAgg ? agg.avgC3 : Number(p.c3_score_final || 0);
      const c4Score = hasAgg ? agg.avgC4 : Number(p.c4_score_final || 0);
      const c5Score = hasAgg ? agg.avgC5 : Number(p.c5_score_final || 0);
      const isFlagged = (agg && agg.isFlagged) ? 1 : Number(p.is_score_flagged || p.is_flagged || 0);

      const totalScore = judgeScore;

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
        total_savings_vnd: savingsVnd,
        judge_final_score: totalScore,
        diem_tong_hop: totalScore,
        c1_score_final: c1Score,
        c2_score_final: c2Score,
        c3_score_final: c3Score,
        c4_score_final: c4Score,
        c5_score_final: c5Score,
        is_score_flagged: isFlagged,
        is_flagged: isFlagged,
        is_appeal_open: isAppealOpen,
      };
    });

    // ⚡ BGK Ranking sort rule (6-step Tie-breaker):
    // 1. Scored items first (judge_final_score > 0), Unscored items at bottom (judge_final_score === 0)
    // 2. Primary: BGK Total score DESC
    // 3. Secondary: C1 score DESC
    // 4. Tertiary: C3 score DESC
    // 5. Quaternary: Total savings VND DESC
    // 6. Quinary: Created date ASC
    rankedList.sort((a: any, b: any) => {
      const parseScore = (val: any) => (val ? Number(String(val).replace(',', '.')) || 0 : 0);
      const scoreA = parseScore(a.judge_final_score || a.diem_tong_hop);
      const scoreB = parseScore(b.judge_final_score || b.diem_tong_hop);

      const isScoredA = scoreA > 0;
      const isScoredB = scoreB > 0;

      if (isScoredA && !isScoredB) return -1;
      if (!isScoredA && isScoredB) return 1;

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      const c1A = parseScore(a.c1_score_final);
      const c1B = parseScore(b.c1_score_final);
      if (c1B !== c1A) return c1B - c1A;

      const c3A = parseScore(a.c3_score_final);
      const c3B = parseScore(b.c3_score_final);
      if (c3B !== c3A) return c3B - c3A;

      const valA = Number(a.total_savings_vnd || a.tong_tien_tiet_kiem || 0);
      const valB = Number(b.total_savings_vnd || b.tong_tien_tiet_kiem || 0);
      if (valB !== valA) return valB - valA;

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (dateA !== dateB && dateA > 0 && dateB > 0) return dateA - dateB;

      return String(a.code || a.id || '').localeCompare(String(b.code || b.id || ''));
    });

    let currentRank = 1;
    let scoredIndex = 0;

    for (let i = 0; i < rankedList.length; i++) {
      const item = rankedList[i];
      const parseScore = (val: any) => (val ? Number(String(val).replace(',', '.')) || 0 : 0);
      const score = parseScore(item.judge_final_score || item.diem_tong_hop);
      const isScored = score > 0;

      let rank = 0;
      if (isScored) {
        if (scoredIndex > 0) {
          const prev = rankedList[i - 1];
          const prevScore = parseScore(prev.judge_final_score || prev.diem_tong_hop);
          const isTie =
            score === prevScore &&
            parseScore(item.c1_score_final) === parseScore(prev.c1_score_final) &&
            parseScore(item.c3_score_final) === parseScore(prev.c3_score_final) &&
            Number(item.total_savings_vnd || 0) === Number(prev.total_savings_vnd || 0);

          if (!isTie) {
            currentRank = scoredIndex + 1;
          }
        } else {
          currentRank = 1;
        }
        rank = currentRank;
        scoredIndex++;
      }

      item.hang_xep = rank;
    }

    return NextResponse.json(
      {
        success: true,
        count: rankedList.length,
        leaderboard: rankedList,
        weights: { weightSavings, weightEfficiency },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi lấy bảng xếp hạng';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

