import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || '';

    const SOURCE_API_URL = 'https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen';
    const res = await fetch(`${SOURCE_API_URL}?t=${Date.now()}`, {
      headers: {
        'User-Agent': 'TBS-VPChuoi-Client',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      next: { revalidate: 0 }
    }).catch(() => null);

    if (!res || !res.ok) {
      const fallbackVersion = Math.abs(Date.now() % 1000000).toString(16);
      return NextResponse.json({ version: fallbackVersion, count: 74 }, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
    }

    const json = await res.json().catch(() => null);
    const dataArr = Array.isArray(json?.data) ? json.data : [];
    const activeArr = dataArr.filter((p: any) => !p.is_archived && p.sub_status !== 'TU_CHOI_TRIEN_KHAI');

    let maxUpdated = 0;
    let statusHash = '';
    for (const p of activeArr) {
      const ud = new Date(p.updated_at || 0).getTime();
      if (ud > maxUpdated) maxUpdated = ud;
      statusHash += String(p.sub_status || p.status || 'X').charAt(0);
    }

    const raw = `${activeArr.length}-${maxUpdated}-${statusHash}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }

    return NextResponse.json({ version: Math.abs(hash).toString(16), count: activeArr.length }, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  } catch (error: any) {
    console.error('[Route /api/kaizen/version Error]', error);
    return NextResponse.json({ version: '1.0.0', count: 74 }, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }
}
