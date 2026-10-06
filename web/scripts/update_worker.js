const fs = require('fs');

let content = fs.readFileSync('public/_worker.js', 'utf8');

// 1. Add /api/kaizen/version proxy
const versionEndpoint = `
    // ════════════════════════════════════════════════════════════════
    // 💡 KAIZEN VERSION POLLING ENDPOINT (HYBRID)
    // ════════════════════════════════════════════════════════════════
    if (url.pathname === "/api/kaizen/version") {
      const region = url.searchParams.get('region');
      if (region === 'THKG') {
        try {
          const SOURCE_API_URL = 'https://thkiengiangshoes.tbsgroup2026.workers.dev/api/internal/kaizen/version?region=THKG';
          const expectedKey = env.INTERNAL_SYNC_SECRET || 'tbs_ii_secure_jwt_secret_key_2026';
          const res = await fetch(SOURCE_API_URL, {
            headers: { 'x-internal-key': expectedKey, 'Cache-Control': 'no-cache' }
          });
          if (res.ok) {
            const data = await res.json();
            return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" } });
          }
        } catch (e) {}
      }
      return new Response(JSON.stringify({ error: "Only THKG supported" }), { status: 400 });
    }

`;

content = content.replace(
  '    // 💡 MAIN KAIZEN PROPOSALS & REALTIME SCORE AGGREGATION ENDPOINT',
  versionEndpoint + '    // 💡 MAIN KAIZEN PROPOSALS & REALTIME SCORE AGGREGATION ENDPOINT'
);

// 2. Modify /api/ci-kaizen in _worker.js to use Hybrid approach
const oldCiKaizenStart = `      if (request.method === "GET") {
        try {
          let results = [];
          try {
            const queryRes = await env.DB.prepare(\`SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500\`).all();
            results = queryRes?.results || [];
          } catch (e) {}`;

const newCiKaizenStart = `      if (request.method === "GET") {
        try {
          let results = [];
          let thkgResults = [];
          let localResults = [];
          const USE_SOURCE_API_FOR_THKG = true;
          const expectedKey = env.INTERNAL_SYNC_SECRET || 'tbs_ii_secure_jwt_secret_key_2026';

          if (USE_SOURCE_API_FOR_THKG) {
            try {
              const srcRes = await fetch('https://thkiengiangshoes.tbsgroup2026.workers.dev/api/internal/kaizen/list?region=THKG', {
                headers: { 'x-internal-key': expectedKey, 'Cache-Control': 'no-cache' }
              });
              if (srcRes.ok) {
                const srcData = await srcRes.json();
                if (srcData.success && Array.isArray(srcData.data)) {
                  thkgResults = srcData.data;
                }
              }
            } catch (e) {}
          }

          try {
            const q = USE_SOURCE_API_FOR_THKG 
              ? \`SELECT * FROM ci_kaizen_proposals WHERE UPPER(region) NOT LIKE '%KIÊN GIANG%' AND UPPER(region) NOT LIKE '%THKG%' AND UPPER(region) NOT LIKE '%HOÀN THIỆN ĐẾ%' ORDER BY created_at DESC LIMIT 500\`
              : \`SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500\`;
            const queryRes = await env.DB.prepare(q).all();
            localResults = queryRes?.results || [];
          } catch (e) {}

          results = [...thkgResults, ...localResults].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));`;

content = content.replace(oldCiKaizenStart, newCiKaizenStart);

fs.writeFileSync('public/_worker.js', content);
