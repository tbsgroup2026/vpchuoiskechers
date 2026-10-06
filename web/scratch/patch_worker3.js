const fs = require('fs');
let code = fs.readFileSync('public/_worker.js', 'utf8');

const targetStr = `          const cleanedResults = (results || []).map((p) => {
            const pCode = String(p.code || p.id || '').trim().toUpperCase();
            const scoreInfo = scoreAggMap[pCode];
            return {
              ...p,
              judge_final_score: scoreInfo?.avgScore ?? p.judge_final_score ?? p.score_points ?? null,
              judge_count: scoreInfo?.judgeCount ?? 0,
            };
          });`;

const repStr = `          const cleanedResults = (results || []).map((p) => {
            const pCode = String(p.code || '').trim().toUpperCase();
            const pId = String(p.id || '').trim().toUpperCase();
            const scoreInfo = scoreAggMap[pCode] || scoreAggMap[pId];
            return {
              ...p,
              judge_final_score: scoreInfo?.avgScore ?? p.judge_final_score ?? p.score_points ?? null,
              judge_count: scoreInfo?.judgeCount ?? 0,
            };
          });`;

let codeNormalized = code.replace(/\r\n/g, '\n');
let tNormalized = targetStr.replace(/\r\n/g, '\n');

if (codeNormalized.includes(tNormalized)) {
  codeNormalized = codeNormalized.replace(tNormalized, repStr.replace(/\r\n/g, '\n'));
  fs.writeFileSync('public/_worker.js', codeNormalized);
  console.log('Successfully patched _worker.js cleanedResults');
} else {
  console.log('Could not find target in _worker.js');
}
