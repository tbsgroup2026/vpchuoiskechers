const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../web/public/_worker.js');
let code = fs.readFileSync(filePath, 'utf8');

const oldBlock = `    // 1. HTTP to HTTPS 301 Permanent Redirect
    const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    if (proto === "http") {
      return Response.redirect(\`https://\${url.host}\${url.pathname}\${url.search}\`, 301);
    }`;

const newBlock = `    // 1. HTTP to HTTPS 301 Permanent Redirect (exempt local development)
    const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    if (proto === "http" && !isLocal) {
      return Response.redirect(\`https://\${url.host}\${url.pathname}\${url.search}\`, 301);
    }`;

const normalizedCode = code.replace(/\r\n/g, '\n');
const normalizedOld = oldBlock.replace(/\r\n/g, '\n');
const normalizedNew = newBlock.replace(/\r\n/g, '\n');

if (normalizedCode.includes(normalizedOld)) {
  const isCRLF = code.includes('\r\n');
  const patched = normalizedCode.replace(normalizedOld, normalizedNew);
  fs.writeFileSync(filePath, isCRLF ? patched.replace(/\n/g, '\r\n') : patched, 'utf8');
  console.log("✅ Successfully patched _worker.js redirect!");
} else {
  console.log("❌ Target block not found");
}
