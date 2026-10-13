const fs = require('fs');

const originalCode = fs.readFileSync('d:/Work/TBS II/web/worker/index.js.new', 'utf8') || fs.readFileSync('d:/Work/TBS II/web/worker/index.js', 'utf8');

const migrationCode = `
    if (url.pathname === '/api/admin/migrate-r2') {
      try {
        const db = env.DB;
        const r2 = env.BUCKET;
        const { results } = await db.prepare(\`
          SELECT id, before_image_url, after_image_url, attachments_json 
          FROM ci_kaizen_proposals 
          WHERE before_image_url LIKE '%cloudinary.com%' 
             OR after_image_url LIKE '%cloudinary.com%'
             OR attachments_json LIKE '%cloudinary.com%'
          LIMIT 10\`).all();

        if (!results || results.length === 0) {
          return new Response(JSON.stringify({ success: true, processedCount: 0 }), { headers: { 'content-type': 'application/json' } });
        }

        let processedCount = 0;

        async function fetchAndUpload(imgUrl) {
           if (!imgUrl || !imgUrl.includes('cloudinary.com')) return imgUrl;
           const cleanUrl = imgUrl.replace('http://', 'https://');
           const res = await fetch(cleanUrl);
           if (!res.ok) return imgUrl;
           const arrayBuffer = await res.arrayBuffer();
           const contentType = res.headers.get('content-type') || 'application/octet-stream';
           const fileId = 'IMG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
           const r2Key = 'tbs-files/migrated-kaizen/' + fileId;
           await r2.put(r2Key, arrayBuffer, { httpMetadata: { contentType } });
           return '/api/files/' + fileId;
        }

        for (const row of results) {
          let updated = false;
          let newBefore = row.before_image_url;
          let newAfter = row.after_image_url;
          let newAttachments = row.attachments_json;

          if (newBefore && newBefore.includes('cloudinary.com')) {
            const migrated = await fetchAndUpload(newBefore);
            if (migrated !== newBefore) { newBefore = migrated; updated = true; }
          }
          if (newAfter && newAfter.includes('cloudinary.com')) {
            const migrated = await fetchAndUpload(newAfter);
            if (migrated !== newAfter) { newAfter = migrated; updated = true; }
          }
          if (newAttachments && newAttachments.includes('cloudinary.com')) {
            try {
              const arr = JSON.parse(newAttachments);
              let arrUpdated = false;
              for (let i = 0; i < arr.length; i++) {
                if (arr[i]?.url && arr[i].url.includes('cloudinary.com')) {
                  const migrated = await fetchAndUpload(arr[i].url);
                  if (migrated !== arr[i].url) { arr[i].url = migrated; arrUpdated = true; }
                }
              }
              if (arrUpdated) { newAttachments = JSON.stringify(arr); updated = true; }
            } catch (e) {}
          }
          if (updated) {
            await db.prepare('UPDATE ci_kaizen_proposals SET before_image_url = ?, after_image_url = ?, attachments_json = ? WHERE id = ?')
              .bind(newBefore, newAfter, newAttachments, row.id).run();
            processedCount++;
          }
        }
        return new Response(JSON.stringify({ success: true, processedCount }), { headers: { 'content-type': 'application/json' } });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
      }
    }
`;

// use original clean index.js (index.js.new might be a backup)
let baseCode;
try {
  baseCode = fs.readFileSync('d:/Work/TBS II/web/worker/index.js.new', 'utf8');
} catch (e) {
  baseCode = fs.readFileSync('d:/Work/TBS II/web/worker/index.js', 'utf8');
  // strip old injected code if it exists
  const idx = baseCode.indexOf("if (url.pathname === '/api/admin/migrate-r2') {");
  if (idx > -1) {
     const endIdx = baseCode.indexOf("const url = new URL(request.url);", idx);
     if (endIdx > -1) {
        baseCode = baseCode.substring(0, idx) + baseCode.substring(endIdx);
     }
  }
}

const newCode = baseCode.replace(
  'const url = new URL(request.url);',
  'const url = new URL(request.url);\n' + migrationCode
);

fs.writeFileSync('d:/Work/TBS II/web/worker/index.js', newCode);
console.log('Injected FIXED migration code into index.js');
