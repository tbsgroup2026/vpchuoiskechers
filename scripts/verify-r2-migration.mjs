import fs from 'fs';
import path from 'path';

// Load .env.local
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

const manifestPath = path.resolve(process.cwd(), 'migration/cloudinary_manifest.json');
const mappingPath = path.resolve(process.cwd(), 'migration/url_mapping.json');

if (!fs.existsSync(manifestPath) || !fs.existsSync(mappingPath)) {
  console.error('❌ Thiếu manifest hoặc url_mapping.json!');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const rawMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

const mappingList = Array.isArray(rawMapping) ? rawMapping : Object.values(rawMapping);
const successfulItems = mappingList.filter((m) => m.status === 'success' || m.status?.startsWith('skipped'));

console.log('======================================================');
console.log('🔍 KIỂM THỬ XÁC MINH CLOUDFLARE R2 MIGRATION');
console.log(`📊 Tổng manifest: ${manifest.length}`);
console.log(`📊 Đã migrate/mapping: ${mappingList.length}`);
console.log(`✅ Thành công / Có sẵn: ${successfulItems.length}`);
console.log('======================================================\n');

if (successfulItems.length === 0) {
  console.error('❌ Chưa có item nào thành công trong mapping!');
  process.exit(1);
}

// Select 20 random items
const sampleSize = Math.min(20, successfulItems.length);
// Shuffle array
const shuffled = [...successfulItems].sort(() => 0.5 - Math.random());
const sample = shuffled.slice(0, sampleSize);

console.log(`🧪 Đang kiểm tra ${sampleSize} items ngẫu nhiên qua HTTP HEAD...\n`);

const results = [];

for (let i = 0; i < sample.length; i++) {
  const item = sample[i];
  const url = item.new_url;
  const manifestItem = manifest.find((m) => m.public_id === item.public_id);
  const expectedBytes = manifestItem?.bytes || item.bytes;

  try {
    const res = await fetch(url, { method: 'HEAD' });
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    const contentType = res.headers.get('content-type') || 'unknown';

    const statusOk = res.status === 200;
    const sizeOk = Math.abs(contentLength - expectedBytes) < 100; // Exact or within header margin

    const isPass = statusOk && sizeOk;

    results.push({
      index: i + 1,
      public_id: item.public_id,
      r2_key: item.r2_key,
      httpStatus: res.status,
      contentType,
      expectedBytes,
      actualBytes: contentLength,
      passed: isPass,
      url,
    });

    console.log(
      `[${i + 1}/${sampleSize}] ${isPass ? '✅' : '❌'} ${item.r2_key} | HTTP ${res.status} | Size: ${contentLength}/${expectedBytes}B | Type: ${contentType}`
    );
  } catch (err) {
    results.push({
      index: i + 1,
      public_id: item.public_id,
      r2_key: item.r2_key,
      httpStatus: 'ERR',
      contentType: 'ERR',
      expectedBytes,
      actualBytes: 0,
      passed: false,
      error: err.message,
      url,
    });
    console.error(`[${i + 1}/${sampleSize}] ❌ Lỗi fetch ${url}: ${err.message}`);
  }
}

const passedCount = results.filter((r) => r.passed).length;
console.log('\n======================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedCount}/${sampleSize} PASS (${((passedCount / sampleSize) * 100).toFixed(1)}%)`);
console.log('======================================================\n');

if (passedCount === sampleSize) {
  console.log('🎉 TẤT CẢ 20 ITEMS ĐỀU HỢP LỆ VÀ SẴN SÀNG SỬ DỤNG!');
} else {
  console.warn(`⚠️ Có ${sampleSize - passedCount} items kiểm tra thất bại!`);
}
