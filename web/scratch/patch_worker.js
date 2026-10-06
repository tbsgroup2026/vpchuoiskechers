const fs = require('fs');
let code = fs.readFileSync('public/_worker.js', 'utf8');

const target1 = `          let results = [];
          let thkgResults = [];
          let localResults = [];

          try {
            const rawThkg = await fetchFromSource(env);
            thkgResults = rawThkg.map(mapSourceToProposal);
          } catch (e) {
            console.error("[fetchFromSource Error]", e);
          }

          try {
            // Không lấy các thẻ thuộc Kiên Giang/THKG/Hoàn thiện đế từ DB VP Chuỗi
            const q = \`SELECT * FROM ci_kaizen_proposals WHERE UPPER(region) NOT LIKE '%KIÊN GIANG%' AND UPPER(region) NOT LIKE '%THKG%' AND UPPER(region) NOT LIKE '%HOÀN THIỆN ĐẾ%' ORDER BY created_at DESC LIMIT 500\`;
            const queryRes = await env.DB.prepare(q).all();
            localResults = queryRes?.results || [];
          } catch (e) {
            console.error("[Local DB Error]", e);
          }

          results = [...thkgResults, ...localResults].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

          let scoreAggMap = {};
          try {
            const { results: scoreAggRows } = await env.DB.prepare(\`
              SELECT submission_id, AVG(total_score) as avg_score, COUNT(*) as cnt
              FROM ci_kaizen_scores
              GROUP BY submission_id
            \`).all();
            if (scoreAggRows) {
              for (const r of scoreAggRows) {
                if (r.submission_id) {
                  const key = String(r.submission_id).trim().toUpperCase();
                  scoreAggMap[key] = {
                    avgScore: Math.round(Number(r.avg_score || 0) * 10) / 10,
                    judgeCount: Number(r.cnt || 0),
                  };
                }
              }
            }
          } catch (e) {}

          const cleanedResults = (results || []).map((p) => {
            const pId = String(p.id || '').trim().toUpperCase();
            const pCode = String(p.code || '').trim().toUpperCase();
            const pEmp = String(p.proposer_emp_code || '').trim().toUpperCase();
            const scoreInfo = scoreAggMap[pId] || scoreAggMap[pCode] || scoreAggMap[pEmp];

            return {
              ...p,
              judge_final_score: scoreInfo?.avgScore ?? p.judge_final_score ?? p.score_points ?? null,
              judge_count: scoreInfo?.judgeCount ?? p.rating_count ?? 0,
            };
          });

          return new Response(JSON.stringify({ success: true, data: cleanedResults, count: cleanedResults.length }), { headers: CORS });`;

const rep1 = `          let results = [];
          let thkgResults = [];
          let localResults = [];

          try {
            const rawThkg = await fetchFromSource(env);
            thkgResults = rawThkg.map(mapSourceToProposal);
          } catch (e) {
            console.error("[fetchFromSource Error]", e);
          }

          try {
            const q = \`SELECT * FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500\`;
            const queryRes = await env.DB.prepare(q).all();
            localResults = queryRes?.results || [];
          } catch (e) {
            console.error("[Local DB Error]", e);
          }

          let resultMap = new Map();
          for (const p of localResults) {
            const reg = String(p.region || '').toUpperCase();
            const isThkgLocal = reg.includes('KIÊN GIANG') || reg.includes('THKG') || reg.includes('HOÀN THIỆN ĐẾ') || reg.includes('PHÒNG BAN THKG') || p.site_code === 'thkiengiangshoes';
            if (isThkgLocal) continue; 
            const code = String(p.code || p.id).trim().toUpperCase();
            resultMap.set(code, p);
          }
          
          for (const p of thkgResults) {
            const code = String(p.code || p.id).trim().toUpperCase();
            resultMap.set(code, p);
          }
          
          results = Array.from(resultMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

          let scoreAggMap = {};
          try {
            const allCodes = results.map(p => String(p.code || p.id).trim()).filter(Boolean);
            const chunkSize = 50;
            for (let i = 0; i < allCodes.length; i += chunkSize) {
              const chunk = allCodes.slice(i, i + chunkSize);
              const placeholders = chunk.map(() => '?').join(',');
              const query = \`
                SELECT submission_id, AVG(total_score) as avg_score, COUNT(id) as cnt
                FROM ci_kaizen_scores
                WHERE submission_id IN (\${placeholders})
                GROUP BY submission_id
              \`;
              const scoreAggRows = await env.DB.prepare(query).bind(...chunk).all();
              if (scoreAggRows && scoreAggRows.results) {
                for (const r of scoreAggRows.results) {
                  const key = String(r.submission_id).trim().toUpperCase();
                  scoreAggMap[key] = {
                    avgScore: Math.round(Number(r.avg_score || 0) * 10) / 10,
                    judgeCount: Number(r.cnt || 0),
                  };
                }
              }
            }
          } catch (e) {
            console.error("[Score Chunk Error]", e);
          }

          const cleanedResults = (results || []).map((p) => {
            const pCode = String(p.code || p.id || '').trim().toUpperCase();
            const scoreInfo = scoreAggMap[pCode];
            return {
              ...p,
              judge_final_score: scoreInfo?.avgScore ?? p.judge_final_score ?? p.score_points ?? null,
              judge_count: scoreInfo?.judgeCount ?? 0,
            };
          });

          CORS["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0";
          return new Response(JSON.stringify({ success: true, data: cleanedResults, count: cleanedResults.length }), { headers: CORS });`;

const target2 = `    // ════════════════════════════════════════════════════════════════
    // 🏷️ MY SCORES ENDPOINT FOR JUDGES / GUESTS
    // ════════════════════════════════════════════════════════════════`;

const rep2 = `    // ════════════════════════════════════════════════════════════════
    // 🏷️ REALTIME VERSION ENDPOINT
    // ════════════════════════════════════════════════════════════════
    if (url.pathname === "/api/kaizen/version") {
      const CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
      if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
      
      const cacheUrl = new URL(request.url);
      const cacheKey = new Request(cacheUrl.toString(), request);
      const cache = caches.default;
      let response = await cache.match(cacheKey);
      if (response) return response;

      try {
        const SOURCE_BASE_URL = env.SOURCE_BASE_URL || 'https://thkiengiangshoes.tbsgroup2026.workers.dev';
        const fetchRes = await fetch(\`\${SOURCE_BASE_URL}/api/ci-kaizen?t=\${Date.now()}\`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await fetchRes.json();
        const arr = data.data || [];
        
        let maxUpdated = 0;
        let mediaCount = 0;
        let statusHash = "";
        
        for (const p of arr) {
          const ud = new Date(p.updated_at || 0).getTime();
          if (ud > maxUpdated) maxUpdated = ud;
          mediaCount += (p.media_count || 0);
          statusHash += p.status ? p.status.charAt(0) : "X";
        }
        
        let hash = 0;
        const raw = \`\${arr.length}-\${maxUpdated}-\${mediaCount}-\${statusHash}\`;
        for (let i = 0; i < raw.length; i++) {
          const char = raw.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash |= 0;
        }
        
        const versionStr = Math.abs(hash).toString(16);
        response = new Response(JSON.stringify({ version: versionStr }), {
          headers: { ...CORS, 'Cache-Control': 'max-age=2, s-maxage=2' }
        });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    // ════════════════════════════════════════════════════════════════
    // 🏷️ MY SCORES ENDPOINT FOR JUDGES / GUESTS
    // ════════════════════════════════════════════════════════════════`;

let oldCode = code;
// Windows line endings matching:
let target1Normalized = target1.replace(/\r\n/g, '\n');
let codeNormalized = code.replace(/\r\n/g, '\n');

if (codeNormalized.includes(target1Normalized)) {
  codeNormalized = codeNormalized.replace(target1Normalized, rep1.replace(/\r\n/g, '\n'));
  console.log('Replaced chunk 1');
}

let target2Normalized = target2.replace(/\r\n/g, '\n');
if (codeNormalized.includes(target2Normalized)) {
  codeNormalized = codeNormalized.replace(target2Normalized, rep2.replace(/\r\n/g, '\n'));
  console.log('Replaced chunk 2');
}

fs.writeFileSync('public/_worker.js', codeNormalized);
