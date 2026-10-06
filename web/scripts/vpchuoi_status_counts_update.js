const fs = require('fs');

const workerPath = 'public/_worker.js';
let content = fs.readFileSync(workerPath, 'utf8');

const getStatusCountsRegex = /if \(url\.pathname\.endsWith\("\/status-counts"\) && request\.method === "GET"\) \{\r?\n\s*try \{\r?\n\s*const countsQuery = \`[\s\S]*?FROM ci_kaizen_proposals\r?\n\s*\`;\r?\n\s*const countsRes = await env\.DB\.prepare\(countsQuery\)\.first\(\)\.catch\(\(\) => null\);\r?\n\s*return new Response\(JSON\.stringify\(\{[\s\S]*?\}\), \{ headers: SECURE_JSON_HEADERS \}\);\r?\n\s*\} catch\(e\) \{[\s\S]*?\}\r?\n\s*\}/;

const newStatusCountsLogic = `      if (url.pathname.endsWith("/status-counts") && request.method === "GET") {
        try {
          const countsQuery = \`
            SELECT 
              SUM(CASE WHEN (COALESCE(trang_thai, sub_status) IN ('CHO_DUYET', 'CHO_DANH_GIA', 'DA_DANH_GIA', 'DA_XEP_HANG') AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as thi_dua,
              SUM(CASE WHEN (COALESCE(trang_thai, sub_status, review_status) = 'CHO_DUYET' OR COALESCE(trang_thai, sub_status, review_status) = 'CHO_PHE_DUYET') AND COALESCE(is_archived, 0) = 0 THEN 1 ELSE 0 END) as cho_phe_duyet,
              SUM(CASE WHEN (COALESCE(trang_thai, sub_status, review_status) = 'CHO_DANH_GIA' AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as cho_danh_gia,
              SUM(CASE WHEN ((COALESCE(trang_thai, sub_status, review_status) = 'DA_DANH_GIA' OR COALESCE(trang_thai, sub_status, review_status) = 'DA_XEP_HANG') AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as da_danh_gia,
              SUM(CASE WHEN (COALESCE(is_archived, 0) = 1 OR registration_type = 'LUU_TRU' OR sub_status = 'LUU_TRU' OR trang_thai = 'DA_GOP') THEN 1 ELSE 0 END) as luu_tru
            FROM ci_kaizen_proposals
            WHERE UPPER(region) NOT LIKE '%KIÊN GIANG%' AND UPPER(region) NOT LIKE '%THKG%' AND UPPER(region) NOT LIKE '%HOÀN THIỆN ĐẾ%'
          \`;
          const localCountsRes = await env.DB.prepare(countsQuery).first().catch(() => null);
          
          let sourceCounts = { thi_dua: 0, cho_phe_duyet: 0, cho_danh_gia: 0, da_danh_gia: 0, luu_tru: 0 };
          try {
            const SOURCE_BASE_URL = env.SOURCE_BASE_URL || 'https://thkiengiangshoes.tbsgroup2026.workers.dev';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            let res = await fetch(\`\${SOURCE_BASE_URL}/api/ci-kaizen/status-counts\`, {
              signal: controller.signal,
              cf: { cacheTtl: 0 },
              headers: { 'Cache-Control': 'no-store' }
            });
            
            if (res.status >= 500) {
              res = await fetch(\`\${SOURCE_BASE_URL}/api/ci-kaizen/status-counts\`, {
                signal: controller.signal,
                cf: { cacheTtl: 0 },
                headers: { 'Cache-Control': 'no-store' }
              });
            }
            clearTimeout(timeoutId);
            
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.counts) {
                sourceCounts = data.counts;
              }
            }
          } catch (e) {
            console.error("[status-counts] Fetch error:", e);
          }

          return new Response(JSON.stringify({
            success: true,
            counts: {
              thi_dua: Number(localCountsRes?.thi_dua || 0) + Number(sourceCounts.thi_dua || 0),
              cho_phe_duyet: Number(localCountsRes?.cho_phe_duyet || 0) + Number(sourceCounts.cho_phe_duyet || 0),
              cho_danh_gia: Number(localCountsRes?.cho_danh_gia || 0) + Number(sourceCounts.cho_danh_gia || 0),
              da_danh_gia: Number(localCountsRes?.da_danh_gia || 0) + Number(sourceCounts.da_danh_gia || 0),
              luu_tru: Number(localCountsRes?.luu_tru || 0) + Number(sourceCounts.luu_tru || 0)
            }
          }), { headers: SECURE_JSON_HEADERS });
        } catch(e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: SECURE_JSON_HEADERS });
        }
      }`;

if (getStatusCountsRegex.test(content)) {
  content = content.replace(getStatusCountsRegex, newStatusCountsLogic);
  fs.writeFileSync(workerPath, content);
  console.log("Updated VP Chuoi worker.js successfully with status-counts fetchFromSource.");
} else {
  console.log("Could not find the target code in worker.js. The status-counts regex did not match.");
}
