import fs from 'node:fs';
import path from 'node:path';

const searchPatterns = [
  { name: 'JWT_SECRET', regex: /JWT_SECRET\s*[:=]\s*["']([^"'\s]+)["']/gi },
  { name: 'CLOUDINARY_API_SECRET', regex: /CLOUDINARY_API_SECRET\s*[:=]\s*["']([^"'\s]+)["']/gi },
  { name: 'CLOUDINARY_URL', regex: /cloudinary:\/\/[^"'\s]+/gi },
  { name: 'GDRIVE_PRIVATE_KEY', regex: /BEGIN (?:RSA )?PRIVATE KEY/gi },
  { name: 'GDRIVE_CLIENT_SECRET', regex: /GDRIVE_CLIENT_SECRET\s*[:=]\s*["']([^"'\s]+)["']/gi },
  { name: 'ZALO_APP_SECRET', regex: /ZALO_APP_SECRET\s*[:=]\s*["']([^"'\s]+)["']/gi },
  { name: 'FIREBASE_API_KEY', regex: /AIza[0-9A-Za-z-_]{35}/g },
  { name: 'FIREBASE_PRIVATE_KEY', regex: /firebase.*private_key/gi },
  { name: 'HARDCODED_API_KEY', regex: /(?:api_key|apiKey|secret_key|secretKey)\s*[:=]\s*["']([A-Za-z0-9_\-]{16,})["']/gi },
  { name: 'HARDCODED_AUTH_TOKEN', regex: /bearer\s+([A-Za-z0-9\-_]{20,})/gi }
];

const ignoredDirs = new Set(['.git', 'node_modules', '.next']);
const findings = [];

function scanFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 2 * 1024 * 1024 && !filePath.includes('web/out')) return; // skip huge files except out bundle
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const p of searchPatterns) {
        if (p.regex.test(line)) {
          findings.push({
            patternName: p.name,
            file: filePath.replace(/\\/g, '/'),
            line: i + 1,
            // DO NOT output the secret value, only note presence
            hasMatch: true
          });
        }
      }
    }
  } catch (e) {
    // ignore unreadable binary
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(full);
      }
    } else {
      walkFile(full);
    }
  }
}

function walkFile(file) {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file).toLowerCase();
  if (['.js', '.ts', '.tsx', '.mjs', '.json', '.jsonc', '.env', '.html', '.txt', '.md'].includes(ext) ||
      base.startsWith('.env') || base === 'wrangler.jsonc') {
    scanFile(file);
  }
}

console.log('Scanning repository for hardcoded secrets...');
walk('.');

console.log(`Scan completed. Found ${findings.length} secret occurrences.`);
fs.writeFileSync('web/scratch/qa/secrets-findings.json', JSON.stringify(findings, null, 2));

// Summary by file and pattern
const byPattern = {};
for (const f of findings) {
  byPattern[f.patternName] = (byPattern[f.patternName] || 0) + 1;
}
console.log('Findings by pattern:', byPattern);

// Group by file
const byFile = {};
for (const f of findings) {
  byFile[f.file] = byFile[f.file] || [];
  byFile[f.file].push(`${f.patternName} at L${f.line}`);
}

console.log('\nTop files containing secrets:');
for (const [file, items] of Object.entries(byFile)) {
  console.log(`- ${file} (${items.length} items): ${items.slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''}`);
}
