import fs from 'fs';
import path from 'path';

// Helper to load env from web/.env.local or .env
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

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwl2xtbqa';
const apiKey = process.env.CLOUDINARY_API_KEY || '262174383348758';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'cTK3Tc82U-5sp5e8hfe6bonPCx4';

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Thiếu thông tin xác thực Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)!');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

async function fetchAllResources(resourceType = 'image') {
  let allResources = [];
  let nextCursor = null;
  let page = 1;

  console.log(`\n🔍 Đang quét danh sách tài nguyên [${resourceType}] từ Cloudinary (Cloud: ${cloudName})...`);

  do {
    let url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}?max_results=500`;
    if (nextCursor) {
      url += `&next_cursor=${encodeURIComponent(nextCursor)}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cloudinary API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const items = data.resources || [];
    allResources.push(...items);

    console.log(`  -> Trang ${page}: lấy được ${items.length} mục (Tổng tích lũy: ${allResources.length})`);
    nextCursor = data.next_cursor || null;
    page++;
  } while (nextCursor);

  return allResources;
}

async function main() {
  try {
    const images = await fetchAllResources('image');
    let videos = [];
    let rawFiles = [];

    try {
      videos = await fetchAllResources('video');
    } catch (e) {
      console.warn('  ⚠️ Không thể lấy danh sách video hoặc không có video:', e.message);
    }

    try {
      rawFiles = await fetchAllResources('raw');
    } catch (e) {
      console.warn('  ⚠️ Không thể lấy danh sách raw files hoặc không có raw:', e.message);
    }

    const allItems = [...images, ...videos, ...rawFiles];

    const manifest = allItems.map((item) => ({
      public_id: item.public_id,
      format: item.format || path.extname(item.public_id).replace('.', '') || (item.resource_type === 'video' ? 'mp4' : 'jpg'),
      bytes: item.bytes || 0,
      secure_url: item.secure_url || item.url,
      folder: item.folder || (item.public_id.includes('/') ? path.dirname(item.public_id) : ''),
      version: item.version,
      resource_type: item.resource_type || 'image',
      created_at: item.created_at,
      width: item.width,
      height: item.height,
    }));

    const outDir = path.resolve(process.cwd(), 'migration');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outPath = path.join(outDir, 'cloudinary_manifest.json');
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');

    const totalBytes = manifest.reduce((sum, item) => sum + (item.bytes || 0), 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

    console.log('\n======================================================');
    console.log('✅ XUẤT MANIFEST CLOUDINARY HOÀN TẤT!');
    console.log(`📁 File lưu tại: ${outPath}`);
    console.log(`📊 Tổng số assets: ${manifest.length}`);
    console.log(`   - Images: ${images.length}`);
    console.log(`   - Videos: ${videos.length}`);
    console.log(`   - Raw: ${rawFiles.length}`);
    console.log(`💾 Tổng dung lượng: ${totalMb} MB (${totalBytes.toLocaleString()} bytes)`);

    // Phân loại theo định dạng
    const formats = {};
    manifest.forEach((i) => {
      formats[i.format] = (formats[i.format] || 0) + 1;
    });
    console.log('\n📋 Thống kê theo định dạng:');
    for (const [fmt, cnt] of Object.entries(formats)) {
      console.log(`   - .${fmt}: ${cnt} files`);
    }

    // Phân loại theo folder
    const folders = {};
    manifest.forEach((i) => {
      const f = i.folder || '(root)';
      folders[f] = (folders[f] || 0) + 1;
    });
    console.log('\n📂 Thống kê theo thư mục:');
    for (const [fld, cnt] of Object.entries(folders)) {
      console.log(`   - ${fld}: ${cnt} files`);
    }
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Lỗi khi quét Cloudinary assets:', err);
    process.exit(1);
  }
}

main();
