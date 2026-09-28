import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ensureKaizenSchema } from "@/lib/kaizenDbMigration";

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const db = getDbBinding();
    const totalVehicles = 5; // Default fleet size
    let bookedVehiclesCount = 0;

    if (db && startDate && endDate) {
      await ensureKaizenSchema(db);
      // Count trips that overlap with requested date range and transport = 'Xe công ty'
      const countRes = await db.prepare(`
        SELECT COUNT(*) as cnt
        FROM business_trips
        WHERE transport = 'Xe công ty'
          AND status IN ('PENDING', 'PENDING_L2', 'APPROVED')
          AND start_date <= ? AND end_date >= ?
      `).bind(endDate, startDate).first().catch(() => null);

      if (countRes && countRes.cnt) {
        bookedVehiclesCount = Number(countRes.cnt);
      }
    }

    const availableCount = Math.max(0, totalVehicles - bookedVehiclesCount);

    return NextResponse.json({
      success: true,
      totalVehicles,
      bookedVehiclesCount,
      availableCount,
      isAvailable: availableCount > 0,
      message: availableCount > 0
        ? `Còn ${availableCount}/${totalVehicles} xe công ty khả dụng`
        : `⚠️ Đã hết xe công ty khả dụng trong khoảng ngày (${startDate} - ${endDate}). Vui lòng cân nhắc đổi ngày hoặc chọn phương tiện khác.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
