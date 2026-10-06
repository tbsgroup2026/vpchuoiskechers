const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const NGUON_URL = 'https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen';
const VPCHUOI_URL = 'https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen';

async function run() {
  console.log('Fetching Nguon API...');
  const nguonData = await fetchJson(NGUON_URL);
  const nguonProposals = nguonData.data || [];
  
  console.log('Fetching VP Chuoi API...');
  const vpData = await fetchJson(VPCHUOI_URL);
  const vpProposals = vpData.data || [];

  const nguonMap = new Map();
  nguonProposals.forEach(p => nguonMap.set(p.code, p));

  const vpMap = new Map();
  vpProposals.forEach(p => vpMap.set(p.code, p));

  const missingInVp = [];
  nguonProposals.forEach(p => {
    if (!vpMap.has(p.code)) {
      missingInVp.push(p);
    }
  });

  console.log(`Missing in VP Chuoi: ${missingInVp.length}`);

  let csvContent = "code,title,region,nguon_status,reason\n";

  for (const p of missingInVp) {
    csvContent += `"${p.code}","${p.title.replace(/"/g, '""')}","${p.region}","${p.sub_status || p.status}","Not in VP Chuoi API"\n`;
  }

  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, 'missing-cards.csv'), csvContent);
  console.log('Done!');
}

run();
