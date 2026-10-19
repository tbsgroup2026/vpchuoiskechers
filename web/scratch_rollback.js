const { execSync } = require('child_process');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8' });
    console.log(out);
  } catch (e) {
    console.log(`Command failed: ${e.message}\n${e.stdout}\n${e.stderr}`);
  }
}

console.log("=== SCHEMA TRƯỚC KHI ROLLBACK ===");
run('npx wrangler d1 execute vpchuoiskechers-db --local --command "PRAGMA table_info(tasks)"');
run('npx wrangler d1 execute vpchuoiskechers-db --local --command "PRAGMA table_info(business_trips)"');

console.log("=== THỰC HIỆN ROLLBACK 0015 ===");
run('npx wrangler d1 execute vpchuoiskechers-db --local --file=migrations/rollback_0015.sql');

console.log("=== SCHEMA SAU KHI ROLLBACK ===");
run('npx wrangler d1 execute vpchuoiskechers-db --local --command "PRAGMA table_info(tasks)"');
run('npx wrangler d1 execute vpchuoiskechers-db --local --command "PRAGMA table_info(business_trips)"');

