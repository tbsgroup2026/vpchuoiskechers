import { NextResponse } from 'next/server';
import { getAuthUser, isExecutiveOrAdmin } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: true, rounds: [] });
    }

    await ensureKaizenSchema(db);

    const { results: rounds } = await db.prepare(`
      SELECT * FROM ci_kaizen_judging_rounds ORDER BY created_at DESC
    `).all();

    const { results: criteria } = await db.prepare(`
      SELECT * FROM ci_kaizen_criteria_config ORDER BY created_at ASC
    `).all();

    return NextResponse.json({
      success: true,
      rounds: rounds || [],
      criteria: criteria || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isExecutiveOrAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Chỉ Admin/Ban 2.2 mới có quyền tạo đợt chấm' }, { status: 403 });
    }

    const db = getDbBinding();
    if (!db) return NextResponse.json({ success: false, error: 'Không tìm thấy kết nối Database' }, { status: 500 });
    await ensureKaizenSchema(db);

    const body = await request.json();
    const {
      title,
      region = 'ALL',
      fiscalYear = 2026,
      nsldUnitPrice = 50000,
      startDate,
      endDate,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Tên đợt chấm là bắt buộc' }, { status: 400 });
    }

    const roundId = `round_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.prepare(`
      INSERT INTO ci_kaizen_judging_rounds (
        id, title, region, fiscal_year, nsld_unit_price, start_date, end_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      roundId,
      title.trim(),
      region,
      Number(fiscalYear) || 2026,
      Number(nsldUnitPrice) || 50000,
      startDate || null,
      endDate || null,
      user.empCode || user.name
    ).run();

    // Default Seed Criteria for 5 categories if requested
    const defaultCriteria = [
      { key: 'c1_hieu_qua', name: 'Hiệu quả thực tế đạt được', max: 35 },
      { key: 'c2_kha_thi', name: 'Tính khả thi & hiệu quả đầu tư', max: 20 },
      { key: 'c3_nhan_rong', name: 'Khả năng nhân rộng', max: 20 },
      { key: 'c4_sang_tao', name: 'Tính sáng tạo & chủ động', max: 15 },
      { key: 'c5_lan_toa', name: 'Lan tỏa & tinh thần đội nhóm', max: 10 },
    ];

    for (const c of defaultCriteria) {
      const cid = `crit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.prepare(`
        INSERT INTO ci_kaizen_criteria_config (id, round_id, criterion_key, name, max_score)
        VALUES (?, ?, ?, ?, ?)
      `).bind(cid, roundId, c.key, c.name, c.max).run();
    }

    return NextResponse.json({
      success: true,
      message: 'Tạo đợt chấm thành công!',
      roundId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
