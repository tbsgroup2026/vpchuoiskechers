const fs = require('fs');

async function runMigration() {
  const syncSecret = 'tbs_ii_secure_jwt_secret_key_2026';
  const headers = { 'x-sync-secret': syncSecret, 'Content-Type': 'application/json' };

  console.log('1. Fetching all 38 cards from source: https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1');
  const resSource = await fetch('https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1', { headers });
  const srcJson = await resSource.json();
  const sourceCards = srcJson.data || srcJson.proposals || [];

  console.log(`Extracted ${sourceCards.length} cards from source site.`);
  if (sourceCards.length === 0) {
    console.error('Error: Source cards count is 0. Aborting.');
    return;
  }

  console.log('\n2. Posting proposals payload to target: https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen/sync');
  const resMigrate = await fetch('https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen/sync', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      site_code: 'thkiengiangshoes',
      proposals: sourceCards
    })
  });

  const migrateResult = await resMigrate.json();
  console.log('Migration API response status:', resMigrate.status);
  console.log('Migration API result:', JSON.stringify(migrateResult, null, 2));

  console.log('\n3. Verifying target cards after migration...');
  const resTarget = await fetch('https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1', { headers });
  const tgtJson = await resTarget.json();
  const targetCards = tgtJson.data || tgtJson.proposals || [];

  console.log(`=== MIGRATION VERIFICATION ===`);
  console.log(`Total target cards after migration: ${targetCards.length}`);
  
  if (targetCards.length > 0) {
    console.log('\nSample migrated cards:');
    targetCards.slice(0, 5).forEach((c, idx) => {
      console.log(`${idx+1}. [ID: ${c.id}] Code: ${c.code} | Title: ${c.title} | Region: ${c.region} | Proposer: ${c.proposer_name}`);
    });
  }

  // Save migration result summary to JSON
  fs.writeFileSync('migration_summary.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    sourceCardsCount: sourceCards.length,
    targetCardsCountAfter: targetCards.length,
    migrateResult,
    sampleCards: targetCards.slice(0, 5)
  }, null, 2));
}

runMigration().catch(console.error);
