import { NextResponse } from 'next/server';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';

export const runtime = 'edge';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}
function getR2Binding(): any {
  return (process.env as any).R2_STORAGE || (globalThis as any).R2_STORAGE || null;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    const db = getDbBinding();
    const r2 = getR2Binding();
    if (!db || !r2) return NextResponse.json({ success: false, error: 'Missing bindings' }, { status: 500 });
    
    await ensureKaizenSchema(db);

    const body = await request.json();
    const batchSize = body.batchSize || 10;
    const { results: trips } = await db.prepare('SELECT id, creator, invoices_json, attachments_json FROM business_trips WHERE invoices_json LIKE "%data:%" OR attachments_json LIKE "%data:%" LIMIT ?').bind(batchSize).all();

    if (!trips || trips.length === 0) {
      return NextResponse.json({ success: true, message: 'All clear! No base64 files found to migrate.' });
    }

    let migratedFiles = 0;

    for (const trip of trips) {
       // Migrate invoices
       if (trip.invoices_json && trip.invoices_json.includes('data:')) {
          let invoices = [];
          try { invoices = JSON.parse(trip.invoices_json); } catch(e){}
          let updatedInvoices = [];
          for (const inv of invoices) {
             if (inv.fileData && inv.fileData.startsWith('data:')) {
                const base64Data = inv.fileData.split(',')[1];
                const mimeType = inv.fileData.split(';')[0].split(':')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const fileId = `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const r2Key = `tbs-files/${trip.creator}/${fileId}`;
                await r2.put(r2Key, buffer, { httpMetadata: { contentType: mimeType } });

                await db.prepare(`
                  INSERT INTO trip_files (id, trip_id, uploader_emp_code, file_type, original_name, mime_type, size_bytes, r2_key)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(fileId, trip.id, trip.creator, 'INVOICE', inv.name || `invoice-${fileId}`, mimeType, buffer.length, r2Key).run();

                updatedInvoices.push({ ...inv, fileUrl: `/api/files/${fileId}`, fileData: undefined });
                migratedFiles++;
             } else {
                updatedInvoices.push(inv);
             }
          }
          await db.prepare('UPDATE business_trips SET invoices_json = ? WHERE id = ?').bind(JSON.stringify(updatedInvoices), trip.id).run();
       }

       // Migrate attachments
       if (trip.attachments_json && trip.attachments_json.includes('data:')) {
          let atts = [];
          try { atts = JSON.parse(trip.attachments_json); } catch(e){}
          let updatedAtts = [];
          for (const att of atts) {
             if (att.fileData && att.fileData.startsWith('data:')) {
                const base64Data = att.fileData.split(',')[1];
                const mimeType = att.fileData.split(';')[0].split(':')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const fileId = `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const r2Key = `tbs-files/${trip.creator}/${fileId}`;
                await r2.put(r2Key, buffer, { httpMetadata: { contentType: mimeType } });

                await db.prepare(`
                  INSERT INTO trip_files (id, trip_id, uploader_emp_code, file_type, original_name, mime_type, size_bytes, r2_key)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(fileId, trip.id, trip.creator, 'ATTACHMENT', att.name || `attachment-${fileId}`, mimeType, buffer.length, r2Key).run();

                updatedAtts.push({ ...att, fileData: `/api/files/${fileId}` }); // Overwrite dataUrl with relative path
                migratedFiles++;
             } else {
                updatedAtts.push(att);
             }
          }
          await db.prepare('UPDATE business_trips SET attachments_json = ? WHERE id = ?').bind(JSON.stringify(updatedAtts), trip.id).run();
       }
    }

    return NextResponse.json({ success: true, message: `Migrated ${migratedFiles} files from ${trips.length} trips.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
