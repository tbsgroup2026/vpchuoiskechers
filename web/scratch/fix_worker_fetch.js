const fs = require('fs');
let worker = fs.readFileSync('public/_worker.js', 'utf8');

// Fix fetchFromSource caching issue
worker = worker.replace(
  /let res = await fetch\(`\$\{SOURCE_BASE_URL\}\/api\/ci-kaizen`, \{\s*signal: controller\.signal,\s*cf: \{ cacheTtl: 0 \},\s*headers: \{ 'Cache-Control': 'no-store' \}\s*\}\);/g,
  `let res = await fetch(\`\${SOURCE_BASE_URL}/api/ci-kaizen?t=\${Date.now()}\`, {
                  signal: controller.signal,
                  headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
                });`
);

// We need to also remove cf: { cacheTtl: 0 } which might be causing issues on Pages
worker = worker.replace(/cf: \{ cacheTtl: 0 \},/g, '');

// Cache-Control: no-store cho /work/kaizen
worker = worker.replace(
  /if \(isHtml \|\| pathname === "\/sw\.js" \|\| pathname === "\/manifest\.json" \|\| pathname\.startsWith\("\/api\/"\)\) \{/,
  `if (isHtml || pathname === "/sw.js" || pathname === "/manifest.json" || pathname.startsWith("/api/") || pathname.startsWith("/work/kaizen")) {`
);

fs.writeFileSync('public/_worker.js', worker);
console.log('Fixed fetch in worker');
