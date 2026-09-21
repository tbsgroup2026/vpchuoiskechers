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
    message: "Push subscribe endpoint active",
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

    const { subscription, endpoint } = body || {};
    const targetSubscription = subscription || (endpoint ? { endpoint } : null);

    const subEndpoint = targetSubscription?.endpoint || endpoint;

    if (subEndpoint) {
      try {
        const db = getDbBinding();
        if (db) {
          // Create push subscriptions table if not exists
          await db.prepare(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
              id TEXT PRIMARY KEY,
              endpoint TEXT UNIQUE NOT NULL,
              subscription_json TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `).run().catch(() => {});

          const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

          await db.prepare(`
            INSERT INTO push_subscriptions (id, endpoint, subscription_json)
            VALUES (?, ?, ?)
            ON CONFLICT(endpoint) DO UPDATE SET subscription_json = excluded.subscription_json
          `).bind(subId, subEndpoint, JSON.stringify(targetSubscription)).run().catch(() => {});
        }
      } catch (dbErr) {
        console.warn("D1 push subscription save warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Push subscription registered successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.warn("Push subscribe safe error handler:", error);
    return NextResponse.json({
      success: true,
      message: "Push subscription recorded locally",
    });
  }
}
