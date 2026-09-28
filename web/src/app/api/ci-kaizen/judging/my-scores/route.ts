import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function GET(request: Request) {
  try {
    let user = await getAuthUser(request);
    let userEmp = user?.empCode || '';

    if (!userEmp) {
      const headerEmp = request.headers.get('x-user-emp-code') || request.headers.get('x-emp-code');
      if (headerEmp) {
        userEmp = headerEmp.trim().toUpperCase();
      }
    }

    const { searchParams } = new URL(request.url);
    const queryEmp = searchParams.get('empCode') || searchParams.get('judgeId') || searchParams.get('user');
    if (queryEmp && queryEmp.trim()) {
      userEmp = queryEmp.trim().toUpperCase();
    }

    const db = getDbBinding();
    if (!db || !userEmp) {
      return NextResponse.json({ success: true, myScores: {} });
    }
    await ensureKaizenSchema(db);

    const cleanEmp = userEmp.replace(/^GUEST_/i, '').trim().toUpperCase();
    const guestEmp = `GUEST_${cleanEmp}`;

    const { results: scores } = await db.prepare(`
      SELECT 
        s.submission_id,
        s.total_score,
        COALESCE(s.is_locked, 1) AS is_locked,
        p.id AS prop_id,
        p.code AS prop_code
      FROM ci_kaizen_scores s
      LEFT JOIN ci_kaizen_proposals p ON (
        TRIM(s.submission_id) = TRIM(p.id) OR 
        UPPER(TRIM(s.submission_id)) = UPPER(TRIM(p.code)) OR
        s.submission_id = p.id OR
        s.submission_id = p.code
      )
      WHERE UPPER(s.judge_id) = UPPER(?)
         OR UPPER(s.judge_id) = UPPER(?)
         OR UPPER(s.real_scorer_emp_code) = UPPER(?)
         OR UPPER(s.real_scorer_emp_code) = UPPER(?)
    `).bind(userEmp, guestEmp, userEmp, cleanEmp).all().catch(() => ({ results: [] }));

    const myScores: Record<string, { totalScore: number; isLocked: boolean }> = {};

    if (scores && scores.length > 0) {
      for (const s of scores) {
        const scoreObj = {
          totalScore: Number(s.total_score || 0),
          isLocked: Boolean(s.is_locked ?? 1)
        };
        const idsToMap = new Set<string>();
        if (s.submission_id) {
          const subId = String(s.submission_id).trim();
          const cleanSub = subId.replace(/^ci_/i, '').replace(/^CI-/i, '');
          idsToMap.add(subId);
          idsToMap.add(subId.toUpperCase());
          idsToMap.add(subId.toLowerCase());
          idsToMap.add(cleanSub);
          idsToMap.add(`ci_${cleanSub}`);
          idsToMap.add(`CI-${cleanSub}`);
        }
        if (s.prop_id) {
          const pId = String(s.prop_id).trim();
          const cleanPId = pId.replace(/^ci_/i, '').replace(/^CI-/i, '');
          idsToMap.add(pId);
          idsToMap.add(cleanPId);
          idsToMap.add(`ci_${cleanPId}`);
        }
        if (s.prop_code) {
          const pCode = String(s.prop_code).trim();
          const cleanPCode = pCode.replace(/^CI-/i, '');
          idsToMap.add(pCode);
          idsToMap.add(cleanPCode);
          idsToMap.add(`CI-${cleanPCode}`);
        }

        for (const k of idsToMap) {
          if (k) myScores[k] = scoreObj;
        }
      }
    }

    return NextResponse.json({
      success: true,
      userEmp,
      myScores
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
