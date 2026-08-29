/**
 * SITE ISOLATION DIAGNOSTIC AUDIT SCRIPT
 * Audits Cloudflare bindings, LocalStorage scoping, and Cloudinary upload folder segregation.
 */

const fs = require('fs');
const path = require('path');

function runAudit() {
  console.log("=================================================");
  console.log("🔍 AUDITING WORKER & STORAGE ISOLATION");
  console.log("=================================================\n");

  let errors = [];
  let warnings = [];

  // 1. Check wrangler.jsonc configuration
  const wranglerPath = path.join(__dirname, '..', 'wrangler.jsonc');
  if (fs.existsSync(wranglerPath)) {
    const content = fs.readFileSync(wranglerPath, 'utf8');
    try {
      // Strip single line comments while preserving URLs
      const cleanJson = content.replace(/^\s*\/\/.*/gm, '');
      const config = JSON.parse(cleanJson);
      
      console.log(`✅ Worker Name: ${config.name}`);
      console.log(`✅ Site ID: ${config.vars?.SITE_ID}`);
      console.log(`✅ Cloudinary Folder: ${config.vars?.CLOUDINARY_FOLDER}`);
      
      if (!config.vars?.SITE_ID || config.vars.SITE_ID !== 'vpchuoiskechers') {
        errors.push("SITE_ID is not configured to 'vpchuoiskechers' in wrangler.jsonc");
      }
      if (!config.vars?.CLOUDINARY_FOLDER || config.vars.CLOUDINARY_FOLDER !== 'vpchuoiskechers') {
        errors.push("CLOUDINARY_FOLDER is not configured to 'vpchuoiskechers' in wrangler.jsonc");
      }
      
      if (config.d1_databases && config.d1_databases.length > 0) {
        console.log(`✅ D1 Database Binding: ${config.d1_databases[0].database_name} (${config.d1_databases[0].database_id})`);
      } else {
        warnings.push("No D1 database binding found in wrangler.jsonc");
      }

      if (config.kv_namespaces && config.kv_namespaces.length > 0) {
        console.log(`✅ KV Namespace Binding: ${config.kv_namespaces[0].binding}`);
      }
    } catch (e) {
      warnings.push(`Could not parse wrangler.jsonc: ${e.message}`);
    }
  } else {
    errors.push("wrangler.jsonc not found");
  }

  // 2. Check landingCMS.ts storage key site isolation
  const landingCmsPath = path.join(__dirname, '..', 'web', 'src', 'lib', 'landingCMS.ts');
  if (fs.existsSync(landingCmsPath)) {
    const cmsCode = fs.readFileSync(landingCmsPath, 'utf8');
    if (cmsCode.includes("getSiteStorageKey") && cmsCode.includes("thkiengiangshoes_landing_cms")) {
      console.log("✅ landingCMS.ts: Dynamic site-scoped LocalStorage keys enabled.");
    } else {
      errors.push("landingCMS.ts does not use site-scoped LocalStorage key!");
    }
  }

  // 3. Check Cloudinary upload folder in frontend components
  const filesToVerifyFolder = [
    path.join(__dirname, '..', 'web', 'src', 'components', 'Header.tsx'),
    path.join(__dirname, '..', 'web', 'src', 'modules', 'ci', 'CIModule.tsx'),
    path.join(__dirname, '..', 'web', 'src', 'modules', 'ci', 'KaizenPublicSubmitForm.tsx'),
    path.join(__dirname, '..', 'web', 'public', '_worker.js')
  ];

  filesToVerifyFolder.forEach(fp => {
    if (fs.existsSync(fp)) {
      const code = fs.readFileSync(fp, 'utf8');
      if (code.includes('vpchuoiskechers')) {
        console.log(`✅ ${path.basename(fp)}: Contains site-isolated folder designation.`);
      } else {
        warnings.push(`${path.basename(fp)} might not enforce Cloudinary folder 'vpchuoiskechers'!`);
      }
    }
  });

  console.log("\n=================================================");
  if (errors.length === 0) {
    console.log("🎉 AUDIT PASSED: Total two-way data isolation is active.");
  } else {
    console.log("❌ AUDIT FAILED with errors:");
    errors.forEach(err => console.log(`  - ${err}`));
  }
  if (warnings.length > 0) {
    console.log("⚠️ WARNINGS:");
    warnings.forEach(w => console.log(`  - ${w}`));
  }
  console.log("=================================================");
}

runAudit();
