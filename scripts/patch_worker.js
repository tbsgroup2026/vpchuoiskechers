const fs = require('fs');
let code = fs.readFileSync('web/public/_worker.js', 'utf8');

// 1. Add images to CREATE TABLE
code = code.replace(/is_locked INTEGER DEFAULT 0,\s*created_at DATETIME DEFAULT CURRENT_TIMESTAMP/, 'is_locked INTEGER DEFAULT 0,\n                images TEXT DEFAULT \'[]\',\n                created_at DATETIME DEFAULT CURRENT_TIMESTAMP');

// Add ALTER TABLE 
if (!code.includes('ALTER TABLE meeting_rooms ADD COLUMN images TEXT')) {
  code = code.replace(/CREATE TABLE IF NOT EXISTS room_bookings/, 'ALTER TABLE meeting_rooms ADD COLUMN images TEXT;\n          `).run().catch(() => {});\n          await env.DB.prepare(`\n            CREATE TABLE IF NOT EXISTS room_bookings');
}

// 2. Add Cloudinary routes
const cloudinaryRoutes = `
      // POST /api/cloudinary/sign: Get signature for direct upload
      if (url.pathname === "/api/cloudinary/sign" && request.method === "POST") {
        try {
          const body = await request.json();
          const timestamp = Math.round(new Date().getTime() / 1000);
          const folder = body.folder || "meeting-rooms";
          const params = { timestamp: timestamp.toString(), folder };
          const sortedParams = Object.keys(params).sort().map(k => \`\${k}=\${params[k]}\`).join('&');
          const strToSign = sortedParams + env.CLOUDINARY_API_SECRET;
          const encoder = new TextEncoder();
          const data = encoder.encode(strToSign);
          const hashBuffer = await crypto.subtle.digest('SHA-1', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          return new Response(JSON.stringify({ success: true, signature, timestamp, apiKey: env.CLOUDINARY_API_KEY, cloudName: env.CLOUDINARY_CLOUD_NAME }), { headers: { "Content-Type": "application/json" } });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }

      // POST /api/cloudinary/delete: Delete image from Cloudinary
      if (url.pathname === "/api/cloudinary/delete" && request.method === "POST") {
        try {
          const body = await request.json();
          const public_id = body.public_id;
          const timestamp = Math.round(new Date().getTime() / 1000);
          const params = { public_id, timestamp: timestamp.toString() };
          const sortedParams = Object.keys(params).sort().map(k => \`\${k}=\${params[k]}\`).join('&');
          const strToSign = sortedParams + env.CLOUDINARY_API_SECRET;
          const encoder = new TextEncoder();
          const data = encoder.encode(strToSign);
          const hashBuffer = await crypto.subtle.digest('SHA-1', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          const formData = new URLSearchParams();
          formData.append("public_id", public_id);
          formData.append("signature", signature);
          formData.append("api_key", env.CLOUDINARY_API_KEY);
          formData.append("timestamp", timestamp);
          const res = await fetch(\`https://api.cloudinary.com/v1_1/\${env.CLOUDINARY_CLOUD_NAME}/image/destroy\`, { method: "POST", body: formData });
          const result = await res.json();
          return new Response(JSON.stringify({ success: true, result }), { headers: { "Content-Type": "application/json" } });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }
`;
if (!code.includes('/api/cloudinary/sign')) {
  code = code.replace('// 4. API Route: Meeting Rooms', cloudinaryRoutes + '\n// 4. API Route: Meeting Rooms');
}

fs.writeFileSync('web/public/_worker.js', code);
console.log('Worker updated');
