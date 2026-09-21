const fs = require('fs');
const sharp = require('sharp');
const { execSync } = require('child_process');

async function compressBase64(base64Str) {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
    return base64Str;
  }
  // If base64 is already small (< 50KB), return as is
  if (base64Str.length < 50000) return base64Str;

  try {
    const parts = base64Str.split(',');
    const prefix = parts[0];
    const buffer = Buffer.from(parts[1], 'base64');

    const resizedBuffer = await sharp(buffer)
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();

    const newBase64 = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
    console.log(`  [Compressed image] From ${base64Str.length} chars -> ${newBase64.length} chars`);
    return newBase64;
  } catch (err) {
    console.warn('  Image compression warning:', err.message);
    return base64Str;
  }
}

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

async function optimizeAndMigrateAll() {
  const headers = { 'x-sync-secret': 'tbs_ii_secure_jwt_secret_key_2026' };
  console.log('Fetching source cards...');
  const resSource = await fetch('https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1', { headers });
  const srcJson = await resSource.json();
  const sourceCards = srcJson.data || [];

  console.log(`Processing ${sourceCards.length} cards...`);

  // Compress all base64 images across cards
  for (let i = 0; i < sourceCards.length; i++) {
    const c = sourceCards[i];
    if (c.before_image_url) c.before_image_url = await compressBase64(c.before_image_url);
    if (c.after_image_url) c.after_image_url = await compressBase64(c.after_image_url);

    if (c.attachments_json) {
      try {
        let atts = JSON.parse(c.attachments_json);
        if (Array.isArray(atts)) {
          for (let att of atts) {
            if (att.url) att.url = await compressBase64(att.url);
          }
          c.attachments_json = JSON.stringify(atts);
        }
      } catch (e) {}
    }
  }

  // Generate single bulk SQL file now that all image strings are compressed and small!
  const sqlStatements = [];
  for (const c of sourceCards) {
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
    sqlStatements.push(sql);
  }

  const fullSql = sqlStatements.join('\n');
  fs.writeFileSync('migrate_compressed_cards.sql', fullSql, 'utf8');
  console.log(`Generated migrate_compressed_cards.sql (${fullSql.length} bytes total).`);

  console.log('Executing bulk migration to Cloudflare D1...');
  const out = execSync('npx wrangler d1 execute vpchuoiskechers-db --remote --file=migrate_compressed_cards.sql', { encoding: 'utf8' });
  console.log('Bulk Migration Output:\n', out);

  // Final count check
  const checkOut = execSync('npx wrangler d1 execute vpchuoiskechers-db --remote --command="SELECT COUNT(*) as count FROM ci_kaizen_proposals;"', { encoding: 'utf8' });
  console.log('Final target card count check:\n', checkOut);

  // Clean up SQL file
  if (fs.existsSync('migrate_compressed_cards.sql')) fs.unlinkSync('migrate_compressed_cards.sql');
}

optimizeAndMigrateAll().catch(console.error);
