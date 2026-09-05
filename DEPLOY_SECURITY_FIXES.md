# 🚀 DEPLOY SECURITY FIXES - COMPLETE GUIDE

**Date**: September 3, 2026  
**System**: TBS II Backend Security Hardening  
**Target**: Cloudflare Workers + D1 Database

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before deploying, verify you have:

- [ ] Node.js 18+ installed
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] Cloudflare account access
- [ ] Database backup capability
- [ ] Git repository for rollback

---

## 🎯 DEPLOYMENT PHASES

### Phase 1: Backup & Preparation (5 minutes)

#### 1.1 Backup Database

```bash
# Backup current D1 database
wrangler d1 export vpchuoiskechers-db > backup_pre_security_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_pre_security_*.sql
```

#### 1.2 Backup Current Worker

```bash
# Tag current version in git
git tag -a v1.0-pre-security -m "Before security hardening"
git push origin v1.0-pre-security

# Or create manual backup
cp web/public/_worker.js web/public/_worker.js.pre-security
```

#### 1.3 Install Dependencies

```bash
# Install required packages (if not already installed)
cd web
npm install

# Verify installation
npm list
```

---

### Phase 2: Apply Database Migration (10 minutes)

#### 2.1 Review Migration

```bash
# Review SQL migration
cat web/migrations/0007_security_hardening.sql | less

# Count changes
grep -c "CREATE" web/migrations/0007_security_hardening.sql
grep -c "ALTER" web/migrations/0007_security_hardening.sql
grep -c "CREATE INDEX" web/migrations/0007_security_hardening.sql
```

#### 2.2 Run Migration (DRY RUN)

```bash
# Test migration syntax (optional)
wrangler d1 execute vpchuoiskechers-db \
  --file=./web/migrations/0007_security_hardening.sql \
  --preview

# Check for errors in output
```

#### 2.3 Run Migration (PRODUCTION)

```bash
# Execute migration
wrangler d1 execute vpchuoiskechers-db \
  --file=./web/migrations/0007_security_hardening.sql

# Expected output:
# ✅ Executed 0007_security_hardening.sql
# 🌀 Mapping SQL input into an array of statements
# 🌀 Executing on remote database vpchuoiskechers-db...
# ✅ To execute on your local development database, run:
#    wrangler d1 execute vpchuoiskechers-db --local --file=...
```

#### 2.4 Verify Migration

```bash
# Check new tables exist
wrangler d1 execute vpchuoiskechers-db \
  --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"

# Should see:
# - token_blacklist ✓
# - rate_limit_log ✓

# Check new columns
wrangler d1 execute vpchuoiskechers-db \
  --command="PRAGMA table_info(users)"

# Should see:
# - password_hash ✓
# - failed_login_attempts ✓
# - locked_until ✓

# Check indexes
wrangler d1 execute vpchuoiskechers-db \
  --command="SELECT name FROM sqlite_master WHERE type='index' ORDER BY name"

# Should see 20+ indexes
```

---

### Phase 3: Set Environment Variables (5 minutes)

#### 3.1 Generate JWT Secret

```bash
# Generate secure 64-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# 7f3d8e9a2b1c4f6e8d5a7c9b3e1f4d6a8c2e5b7f9d1a3c5e7b9f1d3a5c7e9b1f
```

#### 3.2 Set Secrets in Cloudflare

```bash
# Set JWT_SECRET
wrangler secret put JWT_SECRET
# Paste the generated secret when prompted

# Verify secret is set
wrangler secret list
# Expected output:
# Secret Name         
# ───────────────────
# JWT_SECRET (set)
```

#### 3.3 Optional: Set Additional Secrets

```bash
# GROQ API Key (for AI features)
wrangler secret put GROQ_API_KEY
# Paste your Groq API key

# Cloudinary (for image uploads)
wrangler secret put CLOUDINARY_API_KEY
wrangler secret put CLOUDINARY_API_SECRET
```

---

### Phase 4: Apply Security Headers (5 minutes)

#### 4.1 Auto-Patch Worker File

```bash
# Run auto-patcher
node apply_security_headers.js

# Expected output:
# 🔒 TBS II Security Headers Auto-Patcher
# =====================================
# 
# 📦 Step 1: Creating backup...
# ✅ Backup created: _worker.js.backup
# 
# 📖 Step 2: Reading _worker.js...
# ✅ File read successfully
# 
# 🔍 Step 3: Checking if already patched...
# ✅ File not yet patched, proceeding...
# 
# 💉 Step 4: Injecting security header functions...
# ✅ Security functions injected
# 
# 🔄 Step 5: Replacing Response patterns...
# ✅ Replaced 47 Response patterns
# 
# 🔄 Step 6: Updating SECURE_JSON_HEADERS constant...
# ✅ SECURE_JSON_HEADERS updated
# 
# 🔄 Step 7: Wrapping static asset responses...
# ✅ Static assets wrapped
# 
# 💾 Step 8: Writing patched file...
# ✅ File written successfully
# 
# ========================================
# ✅ SECURITY HEADERS PATCH COMPLETE!
# ========================================
```

#### 4.2 Review Changes

```bash
# Review git diff
git diff web/public/_worker.js | head -100

# Check file size increase (should be ~3-5KB)
ls -lh web/public/_worker.js
ls -lh web/public/_worker.js.backup
```

#### 4.3 Test Locally (Optional)

```bash
# Start local dev server
cd web
npm run dev
# or
wrangler dev

# In another terminal, test security headers
curl -I http://localhost:8787

# Expected headers:
# HTTP/1.1 200 OK
# strict-transport-security: max-age=31536000; includeSubDomains; preload
# content-security-policy: default-src 'self'; script-src ...
# x-frame-options: SAMEORIGIN
# x-content-type-options: nosniff
# x-xss-protection: 1; mode=block
# referrer-policy: strict-origin-when-cross-origin
# permissions-policy: geolocation=(), microphone=(), ...
```

---

### Phase 5: Hash User Passwords (10 minutes)

#### 5.1 Create Password Hashing Script

```bash
cat > hash_demo_passwords.js << 'EOF'
const crypto = require('crypto');

function hashPassword(password) {
  const hash = crypto.createHash('sha256');
  hash.update(password + 'TBS_SALT_2026');
  return 'sha256:' + hash.digest('hex');
}

// Demo passwords
const passwords = {
  '123456': hashPassword('123456'),
  '21032004': hashPassword('21032004'),
  'Admin@123456': hashPassword('Admin@123456')
};

console.log('Password Hashes:');
console.log('================\n');
Object.entries(passwords).forEach(([pass, hash]) => {
  console.log(`${pass} -> ${hash}`);
});

// Generate SQL update statement
const hash_123456 = passwords['123456'];
console.log('\n\nSQL Update Statement:');
console.log('=====================\n');
console.log(`UPDATE users SET password_hash = '${hash_123456}' WHERE password_hash IS NULL;`);
EOF

node hash_demo_passwords.js
```

#### 5.2 Update User Passwords in Database

```bash
# Get the hash from previous step
PASS_HASH=$(node -e "const crypto = require('crypto'); const hash = crypto.createHash('sha256'); hash.update('123456' + 'TBS_SALT_2026'); console.log('sha256:' + hash.digest('hex'));")

# Update all users without password
wrangler d1 execute vpchuoiskechers-db \
  --command="UPDATE users SET password_hash = '$PASS_HASH' WHERE password_hash IS NULL OR password_hash = ''"

# Verify update
wrangler d1 execute vpchuoiskechers-db \
  --command="SELECT emp_code, password_hash FROM users WHERE password_hash IS NOT NULL LIMIT 5"
```

---

### Phase 6: Build & Deploy (10 minutes)

#### 6.1 Build Next.js Application

```bash
cd web
npm run build

# Expected output:
# ✓ Creating an optimized production build
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization
# 
# Route (app)                    Size
# ┌ ○ /                          1.23 kB
# ├ ○ /about                     854 B
# ├ ○ /login                     1.45 kB
# ...
```

#### 6.2 Deploy to Cloudflare Workers

```bash
# Deploy from root directory
cd ..
npm run deploy

# Or use wrangler directly
wrangler deploy

# Expected output:
# Total Upload: xx.xx KiB / gzip: xx.xx KiB
# Uploaded vpchuoiskechers (x.xx sec)
# Published vpchuoiskechers (x.xx sec)
#   https://vpchuoiskechers.tbsgroup2026.workers.dev
# Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### 6.3 Verify Deployment

```bash
# Check deployment status
wrangler deployments list

# Expected output:
# Created:       xxxx-xx-xx xx:xx:xx
# Source:        Upload
# Author:        your-email@example.com
# Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# ✅ Active
```

---

### Phase 7: Post-Deployment Verification (10 minutes)

#### 7.1 Test Security Headers

```bash
# Check security headers
curl -I https://vpchuoiskechers.tbsgroup2026.workers.dev

# Verify all required headers present:
# ✓ strict-transport-security
# ✓ content-security-policy
# ✓ x-frame-options
# ✓ x-content-type-options
# ✓ referrer-policy
# ✓ permissions-policy
```

#### 7.2 Test Password Authentication

```bash
# Test 1: Login WITHOUT password (should fail)
curl -X POST https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"empCode":"ADMIN-2026"}'

# Expected: 400 Bad Request
# {"error":"Vui lòng nhập mật khẩu"}

# Test 2: Login with WRONG password (should fail)
curl -X POST https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"empCode":"ADMIN-2026","password":"wrongpassword"}'

# Expected: 401 Unauthorized
# {"error":"Mật khẩu không đúng..."}

# Test 3: Login with CORRECT password (should succeed)
curl -X POST https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"empCode":"ADMIN-2026","password":"123456"}'

# Expected: 200 OK
# {"success":true,"token":"eyJ...","user":{...},"redirectUrl":"/admin"}
```

#### 7.3 Test Token Blacklist

```bash
# Login and get token
TOKEN=$(curl -s -X POST https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"empCode":"ADMIN-2026","password":"123456"}' | jq -r '.token')

# Use token (should work)
curl https://vpchuoiskechers.tbsgroup2026.workers.dev/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with user data

# Logout (blacklist token)
curl -X POST https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK
# {"success":true,"message":"Đăng xuất thành công"}

# Try to use token again (should fail)
curl https://vpchuoiskechers.tbsgroup2026.workers.dev/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# Expected: 401 Unauthorized
# {"error":"Unauthorized"}
```

#### 7.4 Test Rate Limiting

```bash
# Test rate limit (10 attempts)
for i in {1..12}; do
  echo "Attempt $i:"
  curl -s -X POST https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"empCode":"test","password":"test"}' | jq -r '.error'
  sleep 1
done

# Expected:
# Attempts 1-10: "Mật khẩu không đúng..." or "Tài khoản không tồn tại"
# Attempts 11-12: "Quá nhiều lần thử đăng nhập..."
```

#### 7.5 Test Security Headers Online

```bash
# Open in browser
open https://securityheaders.com/?q=vpchuoiskechers.tbsgroup2026.workers.dev

# Expected Score: A or A+
# 
# ✓ Strict-Transport-Security
# ✓ Content-Security-Policy
# ✓ X-Frame-Options
# ✓ X-Content-Type-Options
# ✓ Referrer-Policy
# ✓ Permissions-Policy
```

---

### Phase 8: Monitor & Optimize (Ongoing)

#### 8.1 Monitor Error Rates

```bash
# Check Cloudflare Workers dashboard
open https://dash.cloudflare.com/workers

# Monitor:
# - Request count
# - Error rate (should be < 1%)
# - CPU time (should be < 50ms)
# - Success rate (should be > 99%)
```

#### 8.2 Check Database Performance

```bash
# Query slow queries (if available)
wrangler d1 execute vpchuoiskechers-db \
  --command="SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10"

# Monitor response times in Cloudflare Analytics
```

#### 8.3 Review Audit Logs

```bash
# Check recent audit events
wrangler d1 execute vpchuoiskechers-db \
  --command="SELECT module, action, emp_code, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20"

# Look for:
# - Unusual login patterns
# - Multiple failed logins
# - Unauthorized access attempts
```

---

## 🔄 ROLLBACK PROCEDURE

If issues occur, follow this rollback procedure:

### Rollback Step 1: Worker Code

```bash
# Option A: Rollback via Wrangler
wrangler rollback

# Option B: Rollback via Git
git checkout web/public/_worker.js.pre-security
npm run deploy

# Option C: Restore from backup
cp web/public/_worker.js.backup web/public/_worker.js
npm run deploy
```

### Rollback Step 2: Database (if needed)

```bash
# Restore from backup SQL file
wrangler d1 execute vpchuoiskechers-db \
  --file=backup_pre_security_YYYYMMDD_HHMMSS.sql

# Or drop new tables
wrangler d1 execute vpchuoiskechers-db \
  --command="DROP TABLE IF EXISTS token_blacklist"

wrangler d1 execute vpchuoiskechers-db \
  --command="DROP TABLE IF EXISTS rate_limit_log"
```

### Rollback Step 3: Verify Rollback

```bash
# Test basic functionality
curl https://vpchuoiskechers.tbsgroup2026.workers.dev

# Check deployment version
wrangler deployments list
```

---

## 📊 SUCCESS METRICS

After deployment, these metrics should improve:

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Security Headers Score | D | A+ | securityheaders.com |
| Password Verification | ❌ None | ✅ SHA-256 | Manual test |
| Token Revocation | ❌ No | ✅ Yes | Manual test |
| Data Isolation | ❌ Leakage | ✅ Filtered | API test |
| Rate Limiting | ❌ None | ✅ 10/min | Stress test |
| Response Time (avg) | 50-150ms | < 100ms | Cloudflare Analytics |
| Error Rate | < 1% | < 0.5% | Cloudflare Analytics |
| Uptime | 99.9% | 99.99% | Cloudflare Analytics |

---

## 🆘 TROUBLESHOOTING

### Issue 1: Migration Fails

**Symptoms**: SQL error during migration

**Solution**:
```bash
# Check database schema
wrangler d1 execute vpchuoiskechers-db \
  --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"

# If users table doesn't exist, run base migrations first
wrangler d1 execute vpchuoiskechers-db \
  --file=./web/migrations/0001_concurrency_rbac.sql
```

### Issue 2: JWT_SECRET Not Set

**Symptoms**: "Server configuration error" when accessing site

**Solution**:
```bash
# Verify secret is set
wrangler secret list

# If missing, set it
wrangler secret put JWT_SECRET
```

### Issue 3: Password Login Fails

**Symptoms**: All logins fail with "Invalid password"

**Solution**:
```bash
# Check if password_hash is set
wrangler d1 execute vpchuoiskechers-db \
  --command="SELECT emp_code, password_hash FROM users LIMIT 1"

# If NULL, run password update script
node hash_demo_passwords.js
```

### Issue 4: Security Headers Not Appearing

**Symptoms**: securityheaders.com shows low score

**Solution**:
```bash
# Check if patch was applied
grep "getSecurityHeaders" web/public/_worker.js

# If not found, re-run patcher
node apply_security_headers.js

# Redeploy
npm run deploy
```

### Issue 5: High Error Rate After Deployment

**Symptoms**: Error rate > 5% in Cloudflare dashboard

**Solution**:
```bash
# Check recent errors
wrangler tail

# Rollback immediately
wrangler rollback

# Review logs
wrangler tail --format pretty
```

---

## 📞 SUPPORT CONTACTS

- **Cloudflare Support**: https://dash.cloudflare.com/support
- **TBS IT Team**: it@tbsgroup.vn
- **Emergency Rollback**: Phạm Nguyễn Anh Huy - 0522511245

---

## ✅ POST-DEPLOYMENT CHECKLIST

After successful deployment, verify:

- [ ] Security headers present (curl test)
- [ ] Password authentication works
- [ ] Token blacklist works (logout test)
- [ ] Rate limiting works (stress test)
- [ ] No errors in Cloudflare dashboard
- [ ] Response times < 100ms
- [ ] Error rate < 0.5%
- [ ] All API endpoints functional
- [ ] Frontend loads correctly
- [ ] securityheaders.com score = A+
- [ ] Documentation updated
- [ ] Team notified of changes

---

**Deployment Time**: ~45 minutes total  
**Downtime**: 0 seconds (rolling deployment)  
**Risk Level**: Low (with rollback plan)

🚀 **Ready to deploy!**

*Generated by Kiro AI - TBS II Security Deployment Guide*
