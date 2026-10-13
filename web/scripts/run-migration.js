const https = require('https');
const MAX_ITERATIONS = 100;

function runMigration(iteration) {
  if (iteration > MAX_ITERATIONS) {
    console.log('Max iterations reached');
    return;
  }
  
  console.log(`Starting iteration ${iteration}...`);
  https.get('https://vpchuoiskechers.tbsgroup2026.workers.dev/api/admin/migrate-r2', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`Iteration ${iteration}: Processed ${json.processedCount || 0} items, Message: ${json.message}`);
        if (json.processedCount > 0) {
          runMigration(iteration + 1);
        } else {
          console.log('Migration complete!');
        }
      } catch (e) {
        console.error('Failed to parse response:', data);
      }
    });
  }).on('error', (e) => {
    console.error('Error:', e);
  });
}

runMigration(1);
