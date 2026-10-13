const fs = require('fs');
let code = fs.readFileSync('d:/Work/TBS II/web/worker/index.js', 'utf8');

const fileHandlerCode = `
    if (url.pathname.startsWith('/api/files/')) {
      try {
        const fileId = url.pathname.replace('/api/files/', '');
        if (!fileId) return new Response('Not found', { status: 404 });
        const r2 = env.BUCKET;
        if (!r2) return new Response('Storage error', { status: 500 });
        
        let r2Key = 'tbs-files/migrated-kaizen/' + fileId;
        let object = await r2.get(r2Key);
        
        // Try without prefix if not found
        if (!object) {
           r2Key = fileId;
           object = await r2.get(r2Key);
        }

        if (!object) {
           return new Response('File not found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, {
          headers,
        });
      } catch (err) {
        return new Response(err.message, { status: 500 });
      }
    }
`;

// Remove old injected migration code
const migIdx = code.indexOf("if (url.pathname === '/api/admin/migrate-r2') {");
if (migIdx > -1) {
   const endIdx = code.indexOf("const url = new URL(request.url);", migIdx);
   if (endIdx > -1) {
      code = code.substring(0, migIdx) + code.substring(endIdx);
   }
}

// Inject new file handler code
const newCode = code.replace(
  'const url = new URL(request.url);',
  'const url = new URL(request.url);\n' + fileHandlerCode
);

fs.writeFileSync('d:/Work/TBS II/web/worker/index.js', newCode);
console.log('Injected /api/files/ handler into index.js');
