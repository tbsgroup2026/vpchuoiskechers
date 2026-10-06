const fs = require('fs');

const workerPath = 'public/_worker.js';
let content = fs.readFileSync(workerPath, 'utf8');

// 1. Remove Kaizen version polling proxy
const versionRegex = /\/\/ ════════════════════════════════════════════════════════════════\r?\n\s*\/\/ 💡 KAIZEN VERSION POLLING ENDPOINT \(HYBRID\)\r?\n\s*\/\/ ════════════════════════════════════════════════════════════════[\s\S]*?(?=\/\/ 💡 MAIN KAIZEN PROPOSALS & REALTIME SCORE AGGREGATION ENDPOINT)/;

content = content.replace(versionRegex, '');

// 2. Add fetchFromSource and mapSourceToProposal to the GET /api/ci-kaizen
const getCiKaizenRegex = /if \(request\.method === "GET"\) \{\r?\n\s*try \{\r?\n\s*let results = \[\];\r?\n\s*try \{\r?\n\s*const queryRes = await env\.DB\.prepare\(\`SELECT \* FROM ci_kaizen_proposals ORDER BY created_at DESC LIMIT 500\`\)\.all\(\);\r?\n\s*results = queryRes\?\.results \|\| \[\];\r?\n\s*\} catch \(e\) \{\}/;

const newCiKaizenLogic = `      if (request.method === "GET") {
        try {
          async function fetchFromSource(env) {
            const SOURCE_BASE_URL = env.SOURCE_BASE_URL || 'https://thkiengiangshoes.tbsgroup2026.workers.dev';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            try {
              let res = await fetch(\`\${SOURCE_BASE_URL}/api/ci-kaizen\`, {
                signal: controller.signal,
                cf: { cacheTtl: 0 },
                headers: { 'Cache-Control': 'no-store' }
              });
              
              if (res.status >= 500) {
                res = await fetch(\`\${SOURCE_BASE_URL}/api/ci-kaizen\`, {
                  signal: controller.signal,
                  cf: { cacheTtl: 0 },
                  headers: { 'Cache-Control': 'no-store' }
                });
              }
              clearTimeout(timeoutId);
              
              if (!res.ok) return [];
              const data = await res.json();
              return data.success && Array.isArray(data.data) ? data.data : [];
            } catch (error) {
              clearTimeout(timeoutId);
              console.error("[fetchFromSource] Error:", error);
              return [];
            }
          }
          
          function mapSourceToProposal(sourceItem) {
            return {
              id: sourceItem.id || \`src_\${Date.now()}\`,
              code: sourceItem.code || '',
              title: sourceItem.title || 'Untitled',
              category: sourceItem.category || 'PRODUCTIVITY',
              category_label: sourceItem.category_label || '',
              registration_type: sourceItem.registration_type || 'THI_DUA',
              sub_status: sourceItem.sub_status || 'CHO_DANH_GIA',
              region: sourceItem.region || '',
              department: sourceItem.department || '',
              factory: sourceItem.factory || '',
              proposer_name: sourceItem.proposer_name || '',
              proposer_emp_code: sourceItem.proposer_emp_code || '',
              dept_code: sourceItem.dept_code || '',
              before_description: sourceItem.before_description || '',
              after_solution: sourceItem.after_solution || '',
              saved_seconds: sourceItem.saved_seconds || 0,
              before_image_url: sourceItem.before_image_url || null,
              after_image_url: sourceItem.after_image_url || null,
              before_video_url: sourceItem.before_video_url || null,
              after_video_url: sourceItem.after_video_url || null,
              attachments_json: sourceItem.attachments_json || '[]',
              status: sourceItem.status || 'SUBMITTED',
              award_title: sourceItem.award_title || null,
              score_points: sourceItem.score_points || 0,
              avg_rating: sourceItem.avg_rating || 0,
              rating_count: sourceItem.rating_count || 0,
              vote_count: sourceItem.vote_count || 0,
              view_count: sourceItem.view_count || 0,
              rejection_reason: sourceItem.rejection_reason || null,
              version: sourceItem.version || 1,
              created_at: sourceItem.created_at || new Date().toISOString(),
              updated_at: sourceItem.updated_at || new Date().toISOString(),
              required_reviewer_ids_json: sourceItem.required_reviewer_ids_json || '[]',
              average_score: sourceItem.average_score || 0,
              evaluated_at: sourceItem.evaluated_at || null,
              comments: sourceItem.comments || null,
              review_comment: sourceItem.review_comment || null,
              proposer_position: sourceItem.proposer_position || '',
              proposer_month: sourceItem.proposer_month || 0,
              proposer_year: sourceItem.proposer_year || 0,
              hr_suggestor: sourceItem.hr_suggestor || null,
              customer: sourceItem.customer || null,
              product_group: sourceItem.product_group || null,
              product_code: sourceItem.product_code || null,
              quantity: sourceItem.quantity || null,
              pricing_direction: sourceItem.pricing_direction || null,
              time_before_seconds: sourceItem.time_before_seconds || 0,
              time_after_seconds: sourceItem.time_after_seconds || 0,
              efficiency_value_vnd: sourceItem.efficiency_value_vnd || 0,
              legacy_code: sourceItem.legacy_code || null,
              team_code: sourceItem.team_code || null,
              plant_code: sourceItem.plant_code || null,
              approval_status: sourceItem.approval_status || null,
              evaluation_result: sourceItem.evaluation_result || null,
              approved_by: sourceItem.approved_by || null,
              approved_at: sourceItem.approved_at || null,
              evaluated_by: sourceItem.evaluated_by || null,
              review_status: sourceItem.review_status || null,
              is_archived: sourceItem.is_archived ? 1 : 0,
              pair_quantity: sourceItem.pair_quantity || 0,
              total_savings_vnd: sourceItem.total_savings_vnd || 0,
              total_savings_words: sourceItem.total_savings_words || '',
              cost_before: sourceItem.cost_before || 0,
              cost_after: sourceItem.cost_after || 0,
              chi_phi_truoc: sourceItem.chi_phi_truoc || 0,
              chi_phi_sau: sourceItem.chi_phi_sau || 0,
              tong_tien_tiet_kiem: sourceItem.tong_tien_tiet_kiem || 0,
              _source: 'thkiengiangshoes'
            };
          }

          let results = [];
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

          results = [...thkgResults, ...localResults].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));`;

if (getCiKaizenRegex.test(content)) {
  content = content.replace(getCiKaizenRegex, newCiKaizenLogic);
  fs.writeFileSync(workerPath, content);
  console.log("Updated VP Chuoi worker.js successfully with fetchFromSource and mapSourceToProposal.");
} else {
  console.log("Could not find the target code in worker.js. The regex did not match.");
}
