/**
 * AUTO-APPLY SECURITY HEADERS TO _worker.js
 * 
 * This script automatically patches _worker.js with comprehensive security headers
 * 
 * Usage:
 *   node apply_security_headers.js
 */

const fs = require('fs');
const path = require('path');

const WORKER_FILE = path.join(__dirname, 'web', 'public', '_worker.js');
const BACKUP_FILE = path.join(__dirname, 'web', 'public', '_worker.js.backup');

console.log('🔒 TBS II Security Headers Auto-Patcher');
console.log('=====================================\n');

// Step 1: Backup original file
console.log('📦 Step 1: Creating backup...');
try {
  const original = fs.readFileSync(WORKER_FILE, 'utf8');
  fs.writeFileSync(BACKUP_FILE, original, 'utf8');
  console.log('✅ Backup created: _worker.js.backup\n');
} catch (err) {
  console.error('❌ Error creating backup:', err.message);
  process.exit(1);
}

// Step 2: Read original file
console.log('📖 Step 2: Reading _worker.js...');
let content;
try {
  content = fs.readFileSync(WORKER_FILE, 'utf8');
  console.log('✅ File read successfully\n');
} catch (err) {
  console.error('❌ Error reading file:', err.message);
  process.exit(1);
}

// Step 3: Check if already patched
console.log('🔍 Step 3: Checking if already patched...');
if (content.includes('getSecurityHeaders()') || content.includes('Strict-Transport-Security')) {
  console.log('⚠️  File appears to be already patched!');
  console.log('   If you want to re-apply, restore from backup first:\n');
  console.log('   cp web/public/_worker.js.backup web/public/_worker.js\n');
  process.exit(0);
}
console.log('✅ File not yet patched, proceeding...\n');

// Step 4: Inject security header functions
console.log('💉 Step 4: Injecting security header functions...');

const securityFunctions = `
// ============================================================
// ENHANCED SECURITY HEADERS (Added by auto-patcher)
// ============================================================

function getSecurityHeaders() {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.cloudinary.com https://api.groq.com wss://vpchuoiskechers.tbsgroup2026.workers.dev",
      "media-src 'self' https:",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; '),
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=(self)',
      'encrypted-media=(self)',
      'fullscreen=(self)',
      'picture-in-picture=(self)'
    ].join(', '),
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none'
  };
}

function applySecurityHeaders(response) {
  const headers = new Headers(response.headers);
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function secureJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...getSecurityHeaders()
    }
  });
}

function secureErrorResponse(message, status = 500) {
  return secureJsonResponse({ error: message }, status);
}

`;

// Find the handleRequest function and inject after it
const handleRequestMatch = content.match(/async handleRequest\(request, env, ctx\) \{/);
if (!handleRequestMatch) {
  console.error('❌ Could not find handleRequest() function');
  process.exit(1);
}

const injectionPoint = handleRequestMatch.index + handleRequestMatch[0].length;
content = content.slice(0, injectionPoint) + securityFunctions + content.slice(injectionPoint);
console.log('✅ Security functions injected\n');

// Step 5: Replace Response creation patterns
console.log('🔄 Step 5: Replacing Response patterns...');

let replacements = 0;

// Pattern 1: JSON.stringify with Content-Type header
content = content.replace(
  /return new Response\(JSON\.stringify\(([^)]+)\),\s*\{\s*status:\s*(\d+),?\s*headers:\s*\{[^}]*"Content-Type":\s*"application\/json"[^}]*\}\s*\}\)/g,
  (match, data, status) => {
    replacements++;
    return `return secureJsonResponse(${data}, ${status})`;
  }
);

// Pattern 2: Simple JSON.stringify
content = content.replace(
  /return new Response\(JSON\.stringify\(([^)]+)\),\s*\{\s*headers:\s*\{[^}]*"Content-Type":\s*"application\/json"[^}]*\}\s*\}\)/g,
  (match, data) => {
    replacements++;
    return `return secureJsonResponse(${data})`;
  }
);

// Pattern 3: Error responses with status
content = content.replace(
  /return new Response\(JSON\.stringify\(\{\s*error:\s*([^}]+)\}\),\s*\{\s*status:\s*(\d+)[^}]*\}\)/g,
  (match, error, status) => {
    replacements++;
    return `return secureErrorResponse(${error}, ${status})`;
  }
);

// Pattern 4: Simple error responses
content = content.replace(
  /return new Response\(JSON\.stringify\(\{\s*error:\s*([^}]+)\}\)[^)]*\)/g,
  (match, error) => {
    replacements++;
    return `return secureErrorResponse(${error})`;
  }
);

console.log(`✅ Replaced ${replacements} Response patterns\n`);

// Step 6: Update SECURE_JSON_HEADERS constant
console.log('🔄 Step 6: Updating SECURE_JSON_HEADERS constant...');
content = content.replace(
  /const SECURE_JSON_HEADERS = \{[^}]*\};/g,
  `const SECURE_JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  ...getSecurityHeaders()
};`
);
console.log('✅ SECURE_JSON_HEADERS updated\n');

// Step 7: Wrap static asset responses
console.log('🔄 Step 7: Wrapping static asset responses...');
content = content.replace(
  /return env\.ASSETS\.fetch\(request\);/g,
  `const assetResponse = await env.ASSETS.fetch(request);
    return applySecurityHeaders(assetResponse);`
);
console.log('✅ Static assets wrapped\n');

// Step 8: Write patched file
console.log('💾 Step 8: Writing patched file...');
try {
  fs.writeFileSync(WORKER_FILE, content, 'utf8');
  console.log('✅ File written successfully\n');
} catch (err) {
  console.error('❌ Error writing file:', err.message);
  console.log('   Restoring from backup...');
  try {
    const backup = fs.readFileSync(BACKUP_FILE, 'utf8');
    fs.writeFileSync(WORKER_FILE, backup, 'utf8');
    console.log('✅ Backup restored');
  } catch (restoreErr) {
    console.error('❌ Error restoring backup:', restoreErr.message);
  }
  process.exit(1);
}

// Step 9: Summary
console.log('========================================');
console.log('✅ SECURITY HEADERS PATCH COMPLETE!');
console.log('========================================\n');

console.log('📊 Summary:');
console.log(`   - Security functions added`);
console.log(`   - ${replacements} response patterns updated`);
console.log(`   - Static assets wrapped`);
console.log(`   - Backup saved: _worker.js.backup\n`);

console.log('🧪 Next Steps:');
console.log('   1. Review changes:');
console.log('      git diff web/public/_worker.js\n');
console.log('   2. Test locally:');
console.log('      cd web && npm run dev\n');
console.log('   3. Check security headers:');
console.log('      curl -I http://localhost:8787\n');
console.log('   4. Deploy:');
console.log('      npm run deploy\n');
console.log('   5. Verify online:');
console.log('      https://securityheaders.com/?q=vpchuoiskechers.tbsgroup2026.workers.dev\n');

console.log('📝 To rollback:');
console.log('   cp web/public/_worker.js.backup web/public/_worker.js\n');
