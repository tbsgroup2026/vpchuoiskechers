const fs = require('fs');

async function detailedDryRun() {
  const headers = { 'x-sync-secret': 'tbs_ii_secure_jwt_secret_key_2026' };
  
  console.log('Fetching source data...');
  const resSource = await fetch('https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1', { headers });
  const srcJson = await resSource.json();
  const sourceCards = srcJson.data || [];

  console.log('Fetching target data...');
  const resTarget = await fetch('https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1', { headers });
  const tgtJson = await resTarget.json();
  const targetCards = tgtJson.data || [];

  console.log('=== DRY-RUN STATS ===');
  console.log('Source Card Count:', sourceCards.length);
  console.log('Target Card Count:', targetCards.length);

  const targetIds = new Set(targetCards.map(c => c.id));
  const targetCodes = new Set(targetCards.map(c => c.code).filter(Boolean));

  let newCards = 0;
  let duplicateIdCards = [];
  let duplicateCodeCards = [];

  sourceCards.forEach((c) => {
    let isIdDup = targetIds.has(c.id);
    let isCodeDup = c.code && targetCodes.has(c.code);
    if (isIdDup) duplicateIdCards.push(c);
    if (isCodeDup) duplicateCodeCards.push(c);
    if (!isIdDup && !isCodeDup) newCards++;
  });

  console.log('New Cards to Insert:', newCards);
  console.log('Duplicate ID Cards:', duplicateIdCards.length);
  console.log('Duplicate Code Cards:', duplicateCodeCards.length);

  console.log('\n=== CARD LIST PREVIEW ===');
  sourceCards.forEach((c, i) => {
    console.log(`${i+1}. [ID: ${c.id}] Code: ${c.code || 'N/A'} | Title: ${c.title} | Proposer: ${c.proposer_name || 'N/A'} | Status: ${c.status || 'N/A'} | Created: ${c.created_at}`);
  });

  // Write detailed dry run log to a JSON file for reference
  fs.writeFileSync('dryrun_result.json', JSON.stringify({
    sourceCount: sourceCards.length,
    targetCount: targetCards.length,
    newCardsCount: newCards,
    sourceCardsPreview: sourceCards.map(c => ({
      id: c.id,
      code: c.code,
      title: c.title,
      category: c.category,
      proposer_name: c.proposer_name,
      created_at: c.created_at,
      status: c.status
    }))
  }, null, 2));
}

detailedDryRun().catch(console.error);
