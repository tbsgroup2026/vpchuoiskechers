import { NextResponse } from "next/server";

export const runtime = "edge";

interface DailyCountsResponse {
  success: boolean;
  month: number;
  year: number;
  dailyCounts: Record<string, number>; // "YYYY-MM-DD" -> count
  totalInMonth: number;
  error?: string;
}

import { getVietnamDateStr } from "@/lib/kaizenDateHelper";
export { getVietnamDateStr };

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get("month") || `${new Date().getMonth() + 1}`, 10);
    const year = parseInt(url.searchParams.get("year") || `${new Date().getFullYear()}`, 10);

    const env = (process as any).env;
    let proposals: any[] = [];

    // Access D1 database if available
    if (env && env.DB) {
      try {
        const queryRes = await env.DB.prepare(`SELECT id, created_at, is_archived, sub_status, registration_type, status FROM ci_kaizen_proposals ORDER BY created_at DESC`).all();
        if (queryRes && Array.isArray(queryRes.results)) {
          proposals = queryRes.results;
        }
      } catch (err) {
        console.error("D1 query error in daily-counts:", err);
      }
    }

    const dailyCounts: Record<string, number> = {};
    let totalInMonth = 0;

    const formattedTargetMonth = String(month).padStart(2, "0");
    const targetYearMonthPrefix = `${year}-${formattedTargetMonth}`;

    for (const p of proposals) {
      if (!p || !p.created_at) continue;

      // Filter out archived / hidden proposals that the user shouldn't see
      const isArchived = Boolean(p.is_archived) || p.sub_status === "LUU_TRU" || p.registration_type === "LUU_TRU" || p.status === "ARCHIVED";
      if (isArchived) continue;

      // Format date into Asia/Ho_Chi_Minh YYYY-MM-DD
      const vnDateStr = getVietnamDateStr(p.created_at);
      if (!vnDateStr || !vnDateStr.startsWith(targetYearMonthPrefix)) continue;

      dailyCounts[vnDateStr] = (dailyCounts[vnDateStr] || 0) + 1;
      totalInMonth++;
    }

    return NextResponse.json({
      success: true,
      month,
      year,
      dailyCounts,
      totalInMonth,
    } as DailyCountsResponse);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch daily counts",
        dailyCounts: {},
        totalInMonth: 0,
      },
      { status: 500 }
    );
  }
}
