import { NextResponse } from 'next/server';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const db = getDbBinding();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not found' }, { status: 500 });
    }
    const res = await db.prepare(`SELECT id, code, name FROM departments ORDER BY name ASC`).all();
    return NextResponse.json({ success: true, data: res.results || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
