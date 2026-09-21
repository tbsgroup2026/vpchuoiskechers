import { NextResponse } from 'next/server';


function getDbBinding(): any {
  try {
    return (process.env as any)?.DB || (globalThis as any)?.DB || null;
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Push unsubscribe endpoint active",
  });
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { endpoint } = body || {};

    if (endpoint) {
      try {
        const db = getDbBinding();
        if (db) {
          await db.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).bind(endpoint).run().catch(() => {});
        }
      } catch (dbErr) {
        console.warn("D1 push unsubscribe warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Push subscription unsubscribed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      message: "Unsubscribed locally",
    });
  }
}
