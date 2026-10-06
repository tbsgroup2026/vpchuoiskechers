const fs = require('fs');
let code = fs.readFileSync('public/_worker.js', 'utf8');

const targetStr = `          let scoreAggMap = {};
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
              \`;`;

const repStr = `          let scoreAggMap = {};
          try {
            const allKeys = [];
            for (const p of results) {
              if (p.code) allKeys.push(String(p.code).trim());
              if (p.id) allKeys.push(String(p.id).trim());
            }
            const uniqueKeys = [...new Set(allKeys)].filter(Boolean);
            const chunkSize = 50;
            for (let i = 0; i < uniqueKeys.length; i += chunkSize) {
              const chunk = uniqueKeys.slice(i, i + chunkSize);
              const placeholders = chunk.map(() => '?').join(',');
              const query = \`
                SELECT submission_id, AVG(total_score) as avg_score, COUNT(id) as cnt
                FROM ci_kaizen_scores
                WHERE submission_id IN (\${placeholders})
                GROUP BY submission_id
              \`;`;

let codeNormalized = code.replace(/\r\n/g, '\n');
let tNormalized = targetStr.replace(/\r\n/g, '\n');

if (codeNormalized.includes(tNormalized)) {
  codeNormalized = codeNormalized.replace(tNormalized, repStr.replace(/\r\n/g, '\n'));
  fs.writeFileSync('public/_worker.js', codeNormalized);
  console.log('Successfully patched _worker.js');
} else {
  console.log('Could not find target in _worker.js');
}
