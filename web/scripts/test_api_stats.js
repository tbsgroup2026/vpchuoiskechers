const https = require('https');

function fetchAPI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve({
            headers: res.headers,
            data: JSON.parse(body)
          });
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

(async () => {
  // 1. Nguồn
  const nguonRes = await fetchAPI('https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen');
  const nguonData = nguonRes.data.data;
  console.log("=== NGUỒN ===");
  console.log("Total:", nguonData.length);
  let nguonStatuses = {}, nguonRegions = {};
  nguonData.forEach(p => {
    nguonStatuses[p.status] = (nguonStatuses[p.status] || 0) + 1;
    nguonRegions[p.region || 'Empty'] = (nguonRegions[p.region || 'Empty'] || 0) + 1;
  });
  console.log("Statuses:", nguonStatuses);
  console.log("Regions:", nguonRegions);

  // 2. VP Chuỗi
  const vpRes = await fetchAPI('https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen?region=THKG');
  const vpData = vpRes.data.data;
  console.log("\n=== VP CHUỖI ===");
  console.log("Headers:", { 
    'cache-control': vpRes.headers['cache-control'], 
    'cf-cache-status': vpRes.headers['cf-cache-status'], 
    'age': vpRes.headers['age'] 
  });
  console.log("Total (VP Chuỗi):", vpData.length);
  let vpStatuses = {}, vpRegions = {};
  vpData.forEach(p => {
    vpStatuses[p.status] = (vpStatuses[p.status] || 0) + 1;
    vpRegions[p.region || 'Empty'] = (vpRegions[p.region || 'Empty'] || 0) + 1;
  });
  console.log("Statuses:", vpStatuses);
  console.log("Regions:", vpRegions);

})();
