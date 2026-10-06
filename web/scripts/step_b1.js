const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeD1(dbName, query) {
  try {
    const output = execSync(`npx wrangler d1 execute ${dbName} --remote --command "${query}" --json`, { stdio: 'pipe', maxBuffer: 1024 * 1024 * 10 }).toString();
    const result = JSON.parse(output);
    return result[0]?.results || [];
  } catch (err) {
    console.error(`Error querying ${dbName}:`, err.message);
    return [];
  }
}

function run() {
  const reportsDir = path.join(__dirname, '..', 'reports');
  
  console.log('Querying VP Chuoi for scores and related proposals...');
  const vpQuery = `
    SELECT 
      s.id as score_id, 
      s.submission_id, 
      s.judge_id, 
      s.total_score, 
      COALESCE(p1.code, p2.code) as code, 
      COALESCE(p1.title, p2.title) as title, 
      COALESCE(p1.region, p2.region) as region, 
      COALESCE(p1.status, p2.status) as status, 
      COALESCE(p1.trang_thai, p2.trang_thai) as trang_thai, 
      COALESCE(p1.sub_status, p2.sub_status) as sub_status 
    FROM ci_kaizen_scores s 
    LEFT JOIN ci_kaizen_proposals p1 ON s.submission_id = p1.id
    LEFT JOIN ci_kaizen_proposals p2 ON s.submission_id = p2.code
  `.replace(/\n/g, ' ');

  const vpScores = executeD1('vpchuoiskechers-db', vpQuery);
  
  if (vpScores.length === 0) {
     console.log('WARNING: 0 scores found or query failed.');
  }

  console.log('Querying Nguon for all proposals...');
  const nguonQuery = "SELECT id, code, title, region, status, sub_status FROM ci_kaizen_proposals";
  const nguonProposals = executeD1('thkiengiangshoes', nguonQuery);
  
  const nguonMap = new Map();
  nguonProposals.forEach(p => nguonMap.set(p.code, p));

  let csvContent = "score_id,submission_id,judge_id,total_score,vp_code,vp_region,vp_status,match_status,nguon_status,nguon_region\n";
  
  let orphans = 0;
  let matches = 0;
  let suspicious = 0;
  
  let regionStats = {};
  let statusStats = {};
  let judgeStats = {};
  let distinctProposals = new Set();
  
  let scoredButPendingOrArchivedInNguon = [];

  vpScores.forEach(s => {
    regionStats[s.region] = (regionStats[s.region] || 0) + 1;
    statusStats[s.sub_status] = (statusStats[s.sub_status] || 0) + 1;
    judgeStats[s.judge_id] = (judgeStats[s.judge_id] || 0) + 1;
    distinctProposals.add(s.submission_id);
    
    let matchStatus = 'ORPHAN';
    let nguonStatus = '';
    let nguonRegion = '';
    
    if (s.code && nguonMap.has(s.code)) {
      const nP = nguonMap.get(s.code);
      nguonStatus = nP.sub_status || nP.status;
      nguonRegion = nP.region;
      
      if (s.region !== nP.region) {
        matchStatus = 'SUSPICIOUS_REGION_MISMATCH';
        suspicious++;
      } else {
        matchStatus = 'MATCHED';
        matches++;
      }
      
      if (['CHO_PHE_DUYET', 'CHO_DUYET', 'CHO_DANH_GIA', 'CHO_REVIEW', 'LUU_TRU', 'ARCHIVED'].includes(nguonStatus)) {
         scoredButPendingOrArchivedInNguon.push({
            code: s.code,
            vpStatus: s.sub_status,
            nguonStatus: nguonStatus
         });
      }
      
    } else {
      orphans++;
    }
    
    csvContent += `"${s.score_id}","${s.submission_id}","${s.judge_id}",${s.total_score},"${s.code || ''}","${s.region || ''}","${s.sub_status || ''}","${matchStatus}","${nguonStatus}","${nguonRegion}"\n`;
  });

  fs.writeFileSync(path.join(reportsDir, 'judge-scores-keymap.csv'), csvContent);

  console.log('--- PHÂN TÍCH 112 PHIẾU CHẤM ĐIỂM ---');
  console.log(`Tổng số phiếu: ${vpScores.length}`);
  console.log(`Số bản ghi distinct được chấm: ${distinctProposals.size}`);
  console.log('Theo khu vực (Region):', regionStats);
  console.log('Theo trạng thái (VP Chuỗi):', statusStats);
  console.log('Theo giám khảo:', judgeStats);
  console.log('------------------------------------');
  console.log(`Đối chiếu Nguồn - MATCHED: ${matches}, SUSPICIOUS: ${suspicious}, ORPHAN: ${orphans}`);
  
  if (scoredButPendingOrArchivedInNguon.length > 0) {
      console.log(`\nCó ${new Set(scoredButPendingOrArchivedInNguon.map(s=>s.code)).size} bản ghi Kaizen đã được chấm điểm nhưng ở Nguồn đang có trạng thái Chờ phê duyệt/Lưu trữ:`);
      const uniqueScored = Array.from(new Set(scoredButPendingOrArchivedInNguon.map(s => JSON.stringify(s)))).map(s => JSON.parse(s));
      console.table(uniqueScored);
  } else {
      console.log('Không có bản ghi Kaizen nào đã chấm nhưng trạng thái Nguồn là Chờ phê duyệt/Lưu trữ.');
  }
}

run();
