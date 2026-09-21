const fs = require('fs');

function escapeSqlString(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

// 63 valid columns in target D1 table ci_kaizen_proposals
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

async function buildAndRunMigration() {
  const headers = { 'x-sync-secret': 'tbs_ii_secure_jwt_secret_key_2026' };
  console.log('Fetching source cards...');
  const resSource = await fetch('https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1', { headers });
  const srcJson = await resSource.json();
  const sourceCards = srcJson.data || srcJson.proposals || [];

  console.log(`Fetched ${sourceCards.length} cards from source.`);
  if (sourceCards.length === 0) {
    throw new Error('No cards returned from source site');
  }

  const sqlStatements = [];

  for (const c of sourceCards) {
    const columns = [];
    const values = [];
    const updateSets = [];

    // Filter fields to ONLY valid columns in target schema
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
    sqlStatements.push(sql);
  }

  const fullSql = sqlStatements.join('\n');
  fs.writeFileSync('migrate_cards.sql', fullSql, 'utf8');
  console.log(`Generated migrate_cards.sql with ${sqlStatements.length} sanitized SQL statements.`);
}

buildAndRunMigration().catch(console.error);
