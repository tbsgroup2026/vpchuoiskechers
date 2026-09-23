import { NextResponse } from 'next/server';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import {
  STANDARD_DASHBOARD_REGIONS,
  normalizeRegion,
  getProposalValueVnd,
  getProposalValueTr,
  StandardRegion,
} from '@/lib/kaizenRegionHelper';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusScope = (searchParams.get('statusScope') || 'ALL').toUpperCase();
    const selectedMonth = searchParams.get('month') || 'ALL';
    const selectedQuarter = searchParams.get('quarter') || 'ALL';

    const db = getDbBinding();
    let proposals: any[] = [];

    if (db) {
      await ensureKaizenSchema(db);
      const query = `SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500`;
      const { results } = await db.prepare(query).all();
      proposals = results || [];
    }

    // Filter proposals based on parameters
    const filteredProposals = proposals.filter((p) => {
      if (!p) return false;
      const subStatus = String(p.sub_status || '').toUpperCase();
      const appStatus = String(p.approval_status || '').toUpperCase();
      const mainStatus = String(p.status || '').toUpperCase();

      // Exclude rejected
      if (appStatus === 'TU_CHOI' || mainStatus === 'REJECTED' || subStatus === 'TU_CHOI_TRIEN_KHAI') {
        return false;
      }

      if (statusScope === 'APPROVED') {
        const isApprovedOrAbove =
          subStatus === 'CHO_DANH_GIA' ||
          subStatus === 'DA_DANH_GIA' ||
          subStatus === 'LUU_TRU' ||
          appStatus === 'PHE_DUYET' ||
          appStatus === 'DA_DANH_GIA' ||
          mainStatus === 'APPROVED' ||
          mainStatus === 'IMPLEMENTED' ||
          mainStatus === 'EVALUATED';
        if (!isApprovedOrAbove) return false;
      } else if (statusScope === 'EVALUATED') {
        const isEvaluated =
          subStatus === 'DA_DANH_GIA' ||
          subStatus === 'LUU_TRU' ||
          appStatus === 'DA_DANH_GIA' ||
          Number(p.score_points || p.scorePoints || 0) > 0;
        if (!isEvaluated) return false;
      }

      if (selectedQuarter !== 'ALL') {
        if (!p.created_at) return false;
        try {
          const d = new Date(p.created_at);
          if (isNaN(d.getTime())) return false;
          const month = d.getMonth() + 1;
          const q = month <= 3 ? 'Q1' : month <= 6 ? 'Q2' : month <= 9 ? 'Q3' : 'Q4';
          if (q !== selectedQuarter) return false;
        } catch {
          return false;
        }
      }

      if (selectedMonth !== 'ALL') {
        if (!p.created_at) return false;
        try {
          const d = new Date(p.created_at);
          if (isNaN(d.getTime())) return false;
          const mYear = `T${d.getMonth() + 1}/${d.getFullYear()}`;
          if (mYear !== selectedMonth) return false;
        } catch {
          return false;
        }
      }

      return true;
    });

    // Compute Summary (Top Cards)
    const totalCount = filteredProposals.length;
    const countThiDua = filteredProposals.filter((p) => p.registration_type === 'THI_DUA').length;
    const countLuuTru = filteredProposals.filter(
      (p) => p.registration_type === 'LUU_TRU' || Number(p.is_archived) === 1
    ).length;

    const activeMonthCount = filteredProposals.filter((p) => {
      if (!p || !p.created_at) return false;
      const d = new Date(p.created_at);
      if (selectedMonth !== 'ALL') return true;
      return !isNaN(d.getTime()) && d.getMonth() === 7 && d.getFullYear() === 2026;
    }).length;

    const countEvaluated = filteredProposals.filter(
      (p) =>
        p.sub_status === 'DA_DANH_GIA' ||
        Number(p.score_points || 0) > 0 ||
        Number(p.rating_count || 0) > 0
    ).length;

    const totalValueVnd = filteredProposals.reduce((sum, p) => sum + getProposalValueVnd(p), 0);
    const totalValueTr = totalValueVnd / 1000000;

    // Compute byRegion breakdown
    const byRegion: Record<string, { count: number; totalValueVnd: number; totalValueTr: number }> = {};
    STANDARD_DASHBOARD_REGIONS.forEach((r) => {
      byRegion[r] = { count: 0, totalValueVnd: 0, totalValueTr: 0 };
    });

    filteredProposals.forEach((p) => {
      const reg = normalizeRegion(p);
      if (byRegion[reg]) {
        const valVnd = getProposalValueVnd(p);
        byRegion[reg].count += 1;
        byRegion[reg].totalValueVnd += valVnd;
        byRegion[reg].totalValueTr = byRegion[reg].totalValueVnd / 1000000;
      }
    });

    // Aggregate THKG = Phòng Ban THKG + Kiên Giang 1 + Kiên Giang 2 + Kiên Giang 3 + Hoàn Thiện Đế
    const thkgCount =
      (byRegion['Phòng Ban THKG']?.count || 0) +
      (byRegion['Kiên Giang 1']?.count || 0) +
      (byRegion['Kiên Giang 2']?.count || 0) +
      (byRegion['Kiên Giang 3']?.count || 0) +
      (byRegion['Hoàn Thiện Đế']?.count || 0);

    const thkgVnd =
      (byRegion['Phòng Ban THKG']?.totalValueVnd || 0) +
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi truy vấn Kaizen Stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
