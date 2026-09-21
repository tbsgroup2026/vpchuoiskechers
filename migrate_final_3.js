const fs = require('fs');
const sharp = require('sharp');
const { execSync } = require('child_process');

async function compressImageToSmall(base64Str) {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
    return base64Str;
  }
  try {
    const parts = base64Str.split(',');
    const buffer = Buffer.from(parts[1], 'base64');

    const resizedBuffer = await sharp(buffer)
      .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 40 })
      .toBuffer();

    const result = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
    console.log(`    Image compressed from ${base64Str.length} -> ${result.length} bytes`);
    return result;
  } catch (err) {
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

async function migrateFinal3() {
  const headers = { 'x-sync-secret': 'tbs_ii_secure_jwt_secret_key_2026' };
  
  console.log('Fetching source cards...');
  const resSource = await fetch('https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1', { headers });
  const srcJson = await resSource.json();
  const sourceCards = srcJson.data || [];

  const targetIds = ['ci_1788742708239_5lskn', 'ci_1788493664231_57n3a', 'ci_1788493379259_sip7v'];
  const missingCards = sourceCards.filter(c => targetIds.includes(c.id));

  console.log(`Processing final ${missingCards.length} cards...`);

  for (let i = 0; i < missingCards.length; i++) {
    const c = missingCards[i];
    console.log(`\nCard ${i+1}/${missingCards.length}: [ID: ${c.id}] ${c.title}`);

    if (c.before_image_url) c.before_image_url = await compressImageToSmall(c.before_image_url);
    if (c.after_image_url) c.after_image_url = await compressImageToSmall(c.after_image_url);

    // Set clean attachments_json using compressed image URLs
    const atts = [];
    if (c.before_image_url) atts.push({ url: c.before_image_url, tag: 'BEFORE', type: 'image' });
    if (c.after_image_url) atts.push({ url: c.after_image_url, tag: 'AFTER', type: 'image' });
    c.attachments_json = JSON.stringify(atts);

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
    const fileName = `final_card_${i+1}.sql`;
    fs.writeFileSync(fileName, sql, 'utf8');

    console.log(`  SQL length: ${sql.length} bytes. Executing wrangler d1...`);
    try {
      const out = execSync(`npx wrangler d1 execute vpchuoiskechers-db --remote --file=${fileName}`, { encoding: 'utf8' });
      console.log(`  ✅ Successfully inserted card ${c.id}!`);
    } catch (err) {
      console.error(`  ❌ Failed card ${c.id}:`, err.message);
    } finally {
      if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
    }
  }

  console.log('\n=======================================');
  console.log('FINAL VERIFICATION OF TARGET D1 DATABASE:');
  const verifyOut = execSync('npx wrangler d1 execute vpchuoiskechers-db --remote --command="SELECT COUNT(*) as total_cards FROM ci_kaizen_proposals;"', { encoding: 'utf8' });
  console.log(verifyOut);
}

migrateFinal3().catch(console.error);
