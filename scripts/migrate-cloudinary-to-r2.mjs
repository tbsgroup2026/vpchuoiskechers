import fs from 'fs';
import path from 'path';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Load .env.local and .env
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), 'web/.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'web/.env'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

// Parse CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
let limit = null;
const limitIdx = args.indexOf('--limit');
if (limitIdx !== -1 && args[limitIdx + 1]) {
  limit = parseInt(args[limitIdx + 1], 10);
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '3b346f8398b8d1143acd52516011cfb4';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || 'tbs-img';
const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

const CONCURRENCY = 8;
const MAX_RETRIES = 3;

// MIME type lookup
const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

function getMimeType(format) {
  const cleanFmt = (format || '').toLowerCase().replace(/^\./, '');
  return MIME_TYPES[cleanFmt] || 'application/octet-stream';
}

function getR2Key(publicId, format) {
  let cleanId = publicId.replace(/^\/+/, '');
  const fmt = (format || '').toLowerCase().replace(/^\./, '');
  if (fmt && !cleanId.toLowerCase().endsWith(`.${fmt}`)) {
    cleanId = `${cleanId}.${fmt}`;
  }
  return cleanId;
}

let s3Client = null;
if (!isDryRun) {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('❌ LỖI: Thiếu biến môi trường R2_ACCESS_KEY_ID hoặc R2_SECRET_ACCESS_KEY!');
    console.error('   Vui lòng cấu hình trong web/.env.local hoặc chạy ở chế độ --dry-run.');
    process.exit(1);
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

const migrationDir = path.resolve(process.cwd(), 'migration');
const manifestPath = path.join(migrationDir, 'cloudinary_manifest.json');
const mappingPath = path.join(migrationDir, 'url_mapping.json');
const errorsLogPath = path.join(migrationDir, 'errors.log');

if (!fs.existsSync(manifestPath)) {
  console.error(`❌ Không tìm thấy file manifest tại: ${manifestPath}`);
  console.error('   Vui lòng chạy `node scripts/generate-cloudinary-manifest.mjs` trước!');
  process.exit(1);
}

// Load existing url_mapping.json if exists for incremental resume
let urlMapping = {};
if (fs.existsSync(mappingPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    if (Array.isArray(existing)) {
      existing.forEach((item) => {
        if (item.public_id && item.status !== 'dry-run') {
          urlMapping[item.public_id] = item;
        }
      });
    } else if (typeof existing === 'object') {
      for (const [k, v] of Object.entries(existing)) {
        if (v && v.status !== 'dry-run') {
          urlMapping[k] = v;
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Không thể đọc mapping cũ, khởi tạo mapping mới:', e.message);
  }
}

function logError(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(errorsLogPath, line, 'utf8');
}

async function checkObjectExistsOnR2(key, expectedSize) {
  if (!s3Client) return false;
  try {
    const res = await s3Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    if (res.ContentLength !== undefined && expectedSize !== undefined && expectedSize > 0) {
      return res.ContentLength === expectedSize;
    }
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    // If permission or other error, return false to attempt upload
    return false;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadWithRetry(url, maxRetries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const backoff = Math.pow(2, attempt) * 500;
      await sleep(backoff);
    }
  }
}

async function uploadToR2WithRetry(key, buffer, contentType, maxRetries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
      return;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const backoff = Math.pow(2, attempt) * 500;
      await sleep(backoff);
    }
  }
}

async function migrateAsset(item, index, total) {
  const r2Key = getR2Key(item.public_id, item.format);
  const newUrl = R2_PUBLIC_BASE_URL ? `${R2_PUBLIC_BASE_URL}/${r2Key}` : `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${r2Key}`;
  const contentType = getMimeType(item.format);

  const prefix = `[${index + 1}/${total}]`;

  // Check if already migrated in mapping file
  if (urlMapping[item.public_id] && (urlMapping[item.public_id].status === 'success' || urlMapping[item.public_id].status?.startsWith('skipped'))) {
    return {
      old_url: item.secure_url,
      public_id: item.public_id,
      r2_key: r2Key,
      new_url: newUrl,
      status: 'skipped (already mapped)',
      bytes: item.bytes,
    };
  }

  if (isDryRun) {
    console.log(`${prefix} [DRY-RUN] Sẽ di chuyển: ${item.public_id} (${(item.bytes / 1024).toFixed(1)} KB) -> R2 key: ${r2Key}`);
    return {
      old_url: item.secure_url,
      public_id: item.public_id,
      r2_key: r2Key,
      new_url: newUrl,
      status: 'dry-run',
      bytes: item.bytes,
    };
  }

  // Idempotency: Check if already on R2 with matching size
  const exists = await checkObjectExistsOnR2(r2Key, item.bytes);
  if (exists) {
    console.log(`${prefix} ⏭️ Bỏ qua (Đã tồn tại trên R2 với cùng size): ${r2Key}`);
    return {
      old_url: item.secure_url,
      public_id: item.public_id,
      r2_key: r2Key,
      new_url: newUrl,
      status: 'skipped (exists on R2)',
      bytes: item.bytes,
    };
  }

  // Download from original secure_url
  console.log(`${prefix} ⬇️ Tải xuống: ${item.public_id} (${(item.bytes / 1024).toFixed(1)} KB)...`);
  let buffer;
  try {
    buffer = await downloadWithRetry(item.secure_url);
  } catch (err) {
    const errMsg = `${prefix} ❌ Lỗi tải từ Cloudinary (${item.secure_url}): ${err.message}`;
    console.error(errMsg);
    logError(errMsg);
    return {
      old_url: item.secure_url,
      public_id: item.public_id,
      r2_key: r2Key,
      new_url: newUrl,
      status: 'error_download',
      error: err.message,
      bytes: item.bytes,
    };
  }

  // Upload to R2
  console.log(`${prefix} ⬆️ Đẩy lên R2: ${r2Key}...`);
  try {
    await uploadToR2WithRetry(r2Key, buffer, contentType);
    console.log(`${prefix} ✅ Thành công: ${r2Key}`);
    return {
      old_url: item.secure_url,
      public_id: item.public_id,
      r2_key: r2Key,
      new_url: newUrl,
      status: 'success',
      bytes: buffer.length,
    };
  } catch (err) {
    const errMsg = `${prefix} ❌ Lỗi upload lên R2 (${r2Key}): ${err.message}`;
    console.error(errMsg);
    logError(errMsg);
    return {
      old_url: item.secure_url,
      public_id: item.public_id,
      r2_key: r2Key,
      new_url: newUrl,
      status: 'error_upload',
      error: err.message,
      bytes: item.bytes,
    };
  }
}

async function runPool(items, concurrency, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const curIdx = index++;
      const item = items[curIdx];
      const res = await fn(item, curIdx, items.length);
      results[curIdx] = res;

      // Periodically flush mapping to disk every 20 items
      if (curIdx % 20 === 0 && !isDryRun) {
        urlMapping[item.public_id] = res;
        fs.writeFileSync(mappingPath, JSON.stringify(Object.values(urlMapping), null, 2), 'utf8');
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('======================================================');
  console.log('🚀 CLOUDINARY SANG CLOUDFLARE R2 MIGRATION RUNNER');
  console.log(`📌 Bucket R2: ${R2_BUCKET}`);
  console.log(`📌 R2 Endpoint: ${R2_ENDPOINT}`);
  console.log(`📌 Public Base URL: ${R2_PUBLIC_BASE_URL || '(Chưa cấu hình, dùng direct R2 URL)'}`);
  console.log(`📌 Chế độ: ${isDryRun ? 'DRY-RUN (Không upload thật)' : 'LIVE EXECUTION'}`);
  if (limit) console.log(`📌 Giới hạn: ${limit} assets`);
  console.log('======================================================\n');

  const rawManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let itemsToProcess = rawManifest;

  if (limit && limit > 0) {
    itemsToProcess = rawManifest.slice(0, limit);
  }

  console.log(`👉 Bắt đầu xử lý ${itemsToProcess.length} assets với concurrency = ${CONCURRENCY}...\n`);

  const startTime = Date.now();
  const results = await runPool(itemsToProcess, CONCURRENCY, migrateAsset);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // Update in-memory mapping with final results
  results.forEach((res) => {
    if (res && res.public_id) {
      urlMapping[res.public_id] = res;
    }
  });

  fs.writeFileSync(mappingPath, JSON.stringify(Object.values(urlMapping), null, 2), 'utf8');

  // Summary counts
  const summary = {
    total: results.length,
    success: results.filter((r) => r.status === 'success').length,
    skipped: results.filter((r) => r.status.startsWith('skipped')).length,
    dry_run: results.filter((r) => r.status === 'dry-run').length,
    error_download: results.filter((r) => r.status === 'error_download').length,
    error_upload: results.filter((r) => r.status === 'error_upload').length,
  };

  console.log('\n======================================================');
  console.log(`🏁 HOÀN TẤT TRONG ${elapsedSec} GIÂY!`);
  console.log(`📊 Tổng xử lý: ${summary.total}`);
  if (isDryRun) {
    console.log(`   - Dry-run: ${summary.dry_run}`);
  } else {
    console.log(`   - Upload thành công: ${summary.success}`);
    console.log(`   - Đã tồn tại (Bỏ qua): ${summary.skipped}`);
    console.log(`   - Lỗi tải xuống: ${summary.error_download}`);
    console.log(`   - Lỗi upload R2: ${summary.error_upload}`);
  }
  console.log(`📁 Mapping đã lưu: ${mappingPath}`);
  if (fs.existsSync(errorsLogPath)) {
    console.log(`⚠️ Log lỗi tại: ${errorsLogPath}`);
  }
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('❌ Lỗi runtime migration:', err);
  process.exit(1);
});
