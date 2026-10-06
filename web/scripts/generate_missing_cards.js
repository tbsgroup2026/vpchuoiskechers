const https = require('https');
const fs = require('fs');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

(async () => {
  const nguon = await fetchJSON('https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen');
  const vp = await fetchJSON('https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen?region=THKG');

  const nguonCards = nguon.data || [];
  const vpCards = vp.data || [];

  const vpIds = new Set(vpCards.map(c => c.id));
  const vpCodes = new Set(vpCards.map(c => c.code));

  const missing = nguonCards.filter(c => !vpIds.has(c.id) && !vpCodes.has(c.code));

  console.log(`Nguồn has ${nguonCards.length}, VP has ${vpCards.length}. Missing: ${missing.length}`);

  let csv = 'id,kaizen_code,title,region,status\n';
  missing.forEach(c => {
    csv += `"${c.id}","${c.code}","${c.title}","${c.region}","${c.status}"\n`;
  });
  
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/missing-cards.csv', csv);
  console.log('Saved to reports/missing-cards.csv');
})();
