import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

export const runtime = 'edge';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}
function getR2Binding(): any {
  return (process.env as any).BUCKET || (globalThis as any).BUCKET || (process.env as any).R2_STORAGE || (globalThis as any).R2_STORAGE || null;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const r2 = getR2Binding();
    if (!r2) {
      return NextResponse.json({ success: false, error: 'R2_STORAGE binding not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string; // ATTACHMENT, INVOICE, TRAVEL_PAPER
    const tripId = formData.get('tripId') as string;

    if (!file || !fileType) {
      return NextResponse.json({ success: false, error: 'Missing file or fileType' }, { status: 400 });
    }

    // Validate size (e.g. max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large (Max 5MB)' }, { status: 400 });
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only JPG/PNG/WEBP/HEIC/PDF allowed.' }, { status: 400 });
    }

    const fileId = `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const r2Key = `tbs-files/${user.empCode}/${fileId}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await r2.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      await db.prepare(`
        INSERT INTO trip_files (id, trip_id, uploader_emp_code, file_type, original_name, mime_type, size_bytes, r2_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        fileId,
        tripId || null,
        user.empCode,
        fileType,
        file.name,
        file.type,
        file.size,
        r2Key
      ).run();
    }

    const fileUrl = `/api/files/${fileId}`;

    return NextResponse.json({ 
      success: true, 
      data: {
        id: fileId,
        originalName: file.name,
        name: file.name,
        mimeType: file.type,
        type: file.type,
        size: file.size,
        r2Key: r2Key,
        fileType: fileType,
        url: fileUrl,
        fileUrl: fileUrl,
        dataUrl: fileUrl
      }
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
