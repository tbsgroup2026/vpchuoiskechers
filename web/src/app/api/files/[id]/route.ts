import { NextResponse } from 'next/server';
import { getAuthUser, isExecutiveOrAdmin, isAdminUser, isReceptionistOrAdmin, isAccountantOrAdmin } from '@/lib/auth';

export const runtime = 'edge';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}
function getR2Binding(): any {
  return (process.env as any).BUCKET || (globalThis as any).BUCKET || (process.env as any).R2_STORAGE || (globalThis as any).R2_STORAGE || null;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const db = getDbBinding();
    const r2 = getR2Binding();

    if (!db || !r2) {
      return new Response('Server configuration error', { status: 500 });
    }

    const fileId = params.id;
    const fileRecord = await db.prepare('SELECT * FROM trip_files WHERE id = ?').bind(fileId).first();

    if (!fileRecord) {
      return new Response('File not found', { status: 404 });
    }

    // Access control:
    // User can see the file if:
    // 1. They are the uploader
    // 2. Or they are the trip creator
    // 3. Or they are admin, executive, receptionist, or accountant.
    // We fetch the trip to check if they are the creator.
    let hasAccess = false;
    
    if (fileRecord.uploader_emp_code === user.empCode) hasAccess = true;
    else if (isAdminUser(user) || isExecutiveOrAdmin(user) || isReceptionistOrAdmin(user) || isAccountantOrAdmin(user)) hasAccess = true;
    else if (fileRecord.trip_id) {
       const trip = await db.prepare('SELECT creator FROM business_trips WHERE id = ?').bind(fileRecord.trip_id).first();
       if (trip && trip.creator.includes(user.empCode)) hasAccess = true; // Simple check
    }

    if (!hasAccess) {
       return new Response('Forbidden', { status: 403 });
    }

    const object = await r2.get(fileRecord.r2_key);

    if (object === null) {
      return new Response('Object Not Found In R2', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(fileRecord.original_name)}"`);

    return new Response(object.body, {
      headers,
    });
  } catch (err: any) {
    console.error("Get file error:", err);
    return new Response('Server Error', { status: 500 });
  }
}
