const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeD1(dbName, query) {
  try {
    const output = execSync(`npx wrangler d1 execute ${dbName} --remote --command "${query}" --json`, { stdio: 'pipe' }).toString();
    const result = JSON.parse(output);
    return result[0]?.results || [];
  } catch (err) {
    if (err.message.includes('no such table')) {
      return [];
    }
    console.error(`Error querying ${dbName}:`, err.message);
    return [];
  }
}

function run() {
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const queryScores = "SELECT submission_id, judge_id, c1_score, c2_score, c3_score, c4_score, c5_score, total_score FROM ci_kaizen_scores";

  console.log('Querying VP Chuoi...');
  const vpScores = executeD1('vpchuoiskechers-db', queryScores);
  console.log(`Found ${vpScores.length} scores in VP Chuoi.`);

  console.log('Querying Nguon...');
  const nguonScores = executeD1('thkiengiangshoes', queryScores);
  console.log(`Found ${nguonScores.length} scores in Nguon.`);

  // Create judge-scores-before.csv
  let csvBefore = "DB,submission_id,judge_id,total_score,c1,c2,c3,c4,c5\n";
  vpScores.forEach(s => csvBefore += `vpchuoi,${s.submission_id},${s.judge_id},${s.total_score},${s.c1_score},${s.c2_score},${s.c3_score},${s.c4_score},${s.c5_score}\n`);
  nguonScores.forEach(s => csvBefore += `nguon,${s.submission_id},${s.judge_id},${s.total_score},${s.c1_score},${s.c2_score},${s.c3_score},${s.c4_score},${s.c5_score}\n`);
  
  fs.writeFileSync(path.join(reportsDir, 'judge-scores-before.csv'), csvBefore);

  // Compare and diff
  let diffCsv = "submission_id,judge_id,vpchuoi_score,nguon_score,status\n";
  const vpMap = new Map();
  vpScores.forEach(s => vpMap.set(`${s.submission_id}_${s.judge_id}`, s));
  
  const nguonMap = new Map();
  nguonScores.forEach(s => nguonMap.set(`${s.submission_id}_${s.judge_id}`, s));

  for (const [key, vScore] of vpMap.entries()) {
    if (nguonMap.has(key)) {
      const nScore = nguonMap.get(key);
      if (vScore.total_score !== nScore.total_score) {
        diffCsv += `${vScore.submission_id},${vScore.judge_id},${vScore.total_score},${nScore.total_score},CONFLICT\n`;
      } else {
        diffCsv += `${vScore.submission_id},${vScore.judge_id},${vScore.total_score},${nScore.total_score},MATCH\n`;
      }
    } else {
      diffCsv += `${vScore.submission_id},${vScore.judge_id},${vScore.total_score},null,ONLY_IN_VPCHUOI\n`;
    }
  }

  for (const [key, nScore] of nguonMap.entries()) {
    if (!vpMap.has(key)) {
      diffCsv += `${nScore.submission_id},${nScore.judge_id},null,${nScore.total_score},ONLY_IN_NGUON\n`;
    }
  }

  fs.writeFileSync(path.join(reportsDir, 'judge-scores-diff.csv'), diffCsv);
  console.log('Done!');
}

run();
