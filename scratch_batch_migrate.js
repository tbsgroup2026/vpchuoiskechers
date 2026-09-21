const fs = require('fs');
const { execSync } = require('child_process');

function escapeSqlString(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

const VALID_COLUMNS = new Set([
  'id', 'code', 'title', 'category', 'category_label', 'registration_type',
  'sub_status', 'region', 'department', 'factory', 'proposer_name',
  'proposer_emp_code', 'dept_code', 'before_description', 'after_solution',
  'saved_seconds', 'before_image_url', 'after_image_url', 'attachments_json',
  'status', 'award_title', 'score_points', 'avg_rating', 'rating_count',
  'vote_count', 'view_count', 'rejection_reason', 'version', 'created_at',
  'updated_at', 'required_reviewer_ids_json', 'average_score', 'evaluated_at',
  'comments', 'review_comment', 'proposer_position', 'proposer_month',
  'proposer_year', 'hr_suggestor', 'customer', 'product_group', 'product_code',
  'quantity', 'pricing_direction', 'time_before_seconds', 'time_after_seconds',
  'efficiency_value_vnd', 'legacy_code', 'team_code', 'plant_code',
  'approval_status', 'evaluation_result', 'approved_by', 'approved_at',
  'evaluated_by', 'review_status', 'is_archived', 'before_video_url',
  'after_video_url', 'pair_quantity', 'line', 'total_savings_vnd',
  'total_savings_words'
]);

async function batchMigrate() {
  const headers = { 'x-sync-secret': 'tbs_ii_secure_jwt_secret_key_2026' };
  console.log('1. Fetching all cards from source...');
  const resSource = await fetch('https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1', { headers });
  const srcJson = await resSource.json();
  const sourceCards = srcJson.data || srcJson.proposals || [];

  console.log(`Total source cards to migrate: ${sourceCards.length}`);

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (let i = 0; i < sourceCards.length; i++) {
    const c = sourceCards[i];
    const columns = [];
    const values = [];
    const updateSets = [];

    Object.keys(c).forEach(f => {
      if (VALID_COLUMNS.has(f) && c[f] !== undefined) {
        columns.push(f);
        values.push(escapeSqlString(c[f]));
        if (f !== 'id') {
          updateSets.push(`${f} = ${escapeSqlString(c[f])}`);
        }
      }
    });

    const sql = `INSERT INTO ci_kaizen_proposals (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT(id) DO UPDATE SET ${updateSets.join(', ')};`;
    const fileName = `batch_card_${i + 1}.sql`;
    fs.writeFileSync(fileName, sql, 'utf8');

    try {
      console.log(`[${i+1}/${sourceCards.length}] Migrating card ID: ${c.id} (${c.code || 'No Code'})...`);
      execSync(`npx wrangler d1 execute vpchuoiskechers-db --remote --file=${fileName}`, { stdio: 'pipe' });
      successCount++;
    } catch (err) {
      console.error(`FAILED card ${c.id}:`, err.message);
      failCount++;
      errors.push({ id: c.id, code: c.code, error: err.message });
    } finally {
      if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
    }
  }

  console.log('\n=== MIGRATION COMPLETED ===');
  console.log(`Successfully migrated: ${successCount} cards`);
  console.log(`Failed: ${failCount} cards`);

  // Verify remote total count
  const output = execSync(`npx wrangler d1 execute vpchuoiskechers-db --remote --command="SELECT COUNT(*) as count FROM ci_kaizen_proposals;"`, { encoding: 'utf8' });
  console.log('Target database verification query output:\n', output);
}

batchMigrate().catch(console.error);
