const https = require('https');

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: "Parse error", body: body.substring(0, 500) });
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  const listUrl = "https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen";
  const statsUrl = "https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen/status-counts";
  
  const list = await fetchJSON(listUrl);
  console.log("=== GET /api/ci-kaizen ===");
  if (list.success) {
    console.log("Total items:", list.data?.length);
    console.log("First item sample keys:", list.data && list.data.length > 0 ? Object.keys(list.data[0]).join(", ") : "None");
    if(list.data && list.data.length > 0) {
      const p = list.data[0];
      console.log("Sample values:");
      console.log("- id:", p.id);
      console.log("- title:", p.title);
      console.log("- region:", p.region);
      console.log("- factory:", p.factory);
      console.log("- status:", p.status);
    }
  } else {
    console.log("Error:", list);
  }

  const stats = await fetchJSON(statsUrl);
  console.log("\n=== GET /api/ci-kaizen/status-counts ===");
  console.log(JSON.stringify(stats, null, 2).substring(0, 1000) + '...');
})();
