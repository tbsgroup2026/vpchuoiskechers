const fs = require('fs');

const workerPath = 'public/_worker.js';
let content = fs.readFileSync(workerPath, 'utf8');

const adapterRegex = /function mapSourceToProposal\(sourceItem\) \{[\s\S]*?return \{[\s\S]*?_source: 'thkiengiangshoes'\r?\n\s*\};\r?\n\s*\}/;

const newAdapterLogic = `          function mapSourceToProposal(sourceItem) {
            const SOURCE_BASE_URL = 'https://thkiengiangshoes.tbsgroup2026.workers.dev';
            
            // Fix absolute URLs for images and videos if they are relative
            const fixUrl = (url) => {
              if (!url) return null;
              if (url.startsWith('http')) return url;
              if (url.startsWith('/')) return SOURCE_BASE_URL + url;
              return SOURCE_BASE_URL + '/' + url;
            };

            let attJson = sourceItem.attachments_json || '[]';
            try {
              const atts = JSON.parse(attJson);
              if (Array.isArray(atts)) {
                for (let i = 0; i < atts.length; i++) {
                  if (atts[i].url && !atts[i].url.startsWith('http')) {
                    if (atts[i].url.startsWith('/')) {
                      atts[i].url = SOURCE_BASE_URL + atts[i].url;
                    } else {
                      atts[i].url = SOURCE_BASE_URL + '/' + atts[i].url;
                    }
                  }
                }
                attJson = JSON.stringify(atts);
              }
            } catch (e) {}

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
              before_image_url: fixUrl(sourceItem.before_image_url),
              after_image_url: fixUrl(sourceItem.after_image_url),
              before_video_url: fixUrl(sourceItem.before_video_url),
              after_video_url: fixUrl(sourceItem.after_video_url),
              attachments_json: attJson,
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
          }`;

if (adapterRegex.test(content)) {
  content = content.replace(adapterRegex, newAdapterLogic);
  fs.writeFileSync(workerPath, content);
  console.log("Updated adapter with fixUrl for absolute media URLs.");
} else {
  console.log("Could not find adapter function.");
}
