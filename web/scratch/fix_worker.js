const fs = require('fs');

let worker = fs.readFileSync('public/_worker.js', 'utf8');

// FIX 1: merge logic
worker = worker.replace(
  /let localResults = \[\];\s*try {\s*\/\/[^\n]*\s*const q = `SELECT \* FROM ci_kaizen_proposals WHERE UPPER\(region\) NOT LIKE '%KIÊN GIANG%' AND UPPER\(region\) NOT LIKE '%THKG%' AND UPPER\(region\) NOT LIKE '%HOÀN THIỆN ĐẾ%' ORDER BY created_at DESC LIMIT 500`;\s*const queryRes = await env\.DB\.prepare\(q\)\.all\(\);\s*localResults = queryRes\?\.results \|\| \[\];\s*} catch \(e\) {\s*console\.error\("\[Local DB Error\]", e\);\s*}\s*results = \[\.\.\.thkgResults, \.\.\.localResults\]\.sort\(\(a, b\) => new Date\(b\.created_at \|\| 0\) - new Date\(a\.created_at \|\| 0\)\);/,
  `let localResults = [];
          try {
            const q = \`SELECT * FROM ci_kaizen_proposals WHERE UPPER(region) NOT LIKE '%KIÊN GIANG%' AND UPPER(region) NOT LIKE '%THKG%' AND UPPER(region) NOT LIKE '%HOÀN THIỆN ĐẾ%' ORDER BY created_at DESC LIMIT 500\`;
            const queryRes = await env.DB.prepare(q).all();
            const thkgKeywords = ['KIÊN GIANG', 'THKG', 'HOÀN THIỆN ĐẾ', 'PHÒNG CN', 'PHÒNG CI', 'PHÒNG CHẤT LƯỢNG', 'PHÒNG KẾ HOẠCH', 'PHÒNG NHÂN SỰ', 'PHONG CN', 'PHONG CI', 'PHONG CHAT LUONG', 'PHONG KE HOACH', 'PHONG NHAN SU'];
            localResults = (queryRes?.results || []).filter(p => {
              if (p.site_code === 'thkiengiangshoes') return false;
              const r = String(p.region || '').toUpperCase();
              if (thkgKeywords.some(kw => r.includes(kw))) return false;
              return true;
            });
          } catch (e) {
            console.error("[Local DB Error]", e);
          }

          let resultMap = new Map();
          for (const p of localResults) {
            if (p.code) resultMap.set(p.code.toUpperCase(), p);
            else resultMap.set(p.id, p);
          }
          for (const p of thkgResults) {
            if (p.code) resultMap.set(p.code.toUpperCase(), p);
            else resultMap.set(p.id, p);
          }
          results = Array.from(resultMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));`
);

// FIX 2: /api/ci-kaizen/status-counts
worker = worker.replace(
  /const countsQuery = `\s*SELECT\s*SUM\(CASE WHEN[^\`]*?WHERE UPPER\(region\) NOT LIKE '%KIÊN GIANG%' AND UPPER\(region\) NOT LIKE '%THKG%' AND UPPER\(region\) NOT LIKE '%HOÀN THIỆN ĐẾ%'\s*`;\s*const localCountsRes = await env\.DB\.prepare\(countsQuery\)\.first\(\)\.catch\(\(\) => null\);/g,
  `const countsQuery = \`
            SELECT 
              SUM(CASE WHEN (COALESCE(trang_thai, sub_status) IN ('CHO_DUYET', 'CHO_DANH_GIA', 'DA_DANH_GIA', 'DA_XEP_HANG') AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as thi_dua,
              SUM(CASE WHEN (COALESCE(trang_thai, sub_status, review_status) = 'CHO_DUYET' OR COALESCE(trang_thai, sub_status, review_status) = 'CHO_PHE_DUYET') AND COALESCE(is_archived, 0) = 0 THEN 1 ELSE 0 END) as cho_phe_duyet,
              SUM(CASE WHEN (COALESCE(trang_thai, sub_status, review_status) = 'CHO_DANH_GIA' AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as cho_danh_gia,
              SUM(CASE WHEN ((COALESCE(trang_thai, sub_status, review_status) = 'DA_DANH_GIA' OR COALESCE(trang_thai, sub_status, review_status) = 'DA_XEP_HANG') AND COALESCE(is_archived, 0) = 0) THEN 1 ELSE 0 END) as da_danh_gia,
              SUM(CASE WHEN (COALESCE(is_archived, 0) = 1 OR registration_type = 'LUU_TRU' OR sub_status = 'LUU_TRU' OR trang_thai = 'DA_GOP') THEN 1 ELSE 0 END) as luu_tru
            FROM ci_kaizen_proposals
            WHERE UPPER(region) NOT LIKE '%KIÊN GIANG%' AND UPPER(region) NOT LIKE '%THKG%' AND UPPER(region) NOT LIKE '%HOÀN THIỆN ĐẾ%'
              AND UPPER(region) NOT LIKE '%PHÒNG CN%' AND UPPER(region) NOT LIKE '%PHÒNG CI%' AND UPPER(region) NOT LIKE '%PHÒNG KẾ HOẠCH%' AND UPPER(region) NOT LIKE '%PHÒNG CHẤT LƯỢNG%' AND UPPER(region) NOT LIKE '%PHÒNG NHÂN SỰ%'
          \`;
          const localCountsRes = await env.DB.prepare(countsQuery).first().catch(() => null);`
);

fs.writeFileSync('public/_worker.js', worker);
console.log('Fixed _worker.js');
