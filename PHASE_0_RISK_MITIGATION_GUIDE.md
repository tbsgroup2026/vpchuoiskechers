# PHASE 0: RISK MITIGATION GUIDE - NOTIFICATION SYSTEM

**Mục tiêu:** Xử lý tất cả rủi ro kỹ thuật TRƯỚC KHI viết code production  
**Timeline:** 2 ngày  
**Priority:** 🔴 CRITICAL - BLOCKING

---

## ✅ TASK 1: Test VAPID Signing Trên Cloudflare Workers

### Option A: Tự Implement VAPID Signer (RECOMMENDED)

#### Step 1.1: Tạo VAPID Signer với Web Crypto API

**File:** `web/src/lib/vapidSigner.ts`

```typescript
/**
 * VAPID Signer for Cloudflare Workers
 * Sử dụng Web Crypto API (tương thích Workers runtime)
 * KHÔNG cần Node.js crypto module
 */

export interface VAPIDHeaders {
  Authorization: string;
  'Crypto-Key': string;
}

/**
 * Convert URL-safe Base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Convert Uint8Array to URL-safe Base64 string
 */
function uint8ArrayToUrlBase64(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...array));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Encode object to URL-safe Base64
 */
function encodeBase64URL(data: any): string {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(jsonString);
  return uint8ArrayToUrlBase64(bytes);
}

/**
 * Generate VAPID Authorization headers for Web Push
 * 
 * @param endpoint - Push service endpoint URL
 * @param vapidPrivateKey - URL-safe Base64 encoded private key
 * @param vapidPublicKey - URL-safe Base64 encoded public key
 * @param subject - mailto: or https: URL identifying your service
 * @returns Authorization and Crypto-Key headers
 */
export async function generateVAPIDHeaders(
  endpoint: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  subject: string
): Promise<VAPIDHeaders> {
  // 1. Extract audience from endpoint
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  // 2. Create JWT header
  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };
  
  // 3. Create JWT payload
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: subject,
  };
  
  // 4. Encode header and payload
  const encodedHeader = encodeBase64URL(header);
  const encodedPayload = encodeBase64URL(payload);
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  // 5. Import private key for signing
  const privateKeyBuffer = urlBase64ToUint8Array(vapidPrivateKey);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBuffer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  );
  
  // 6. Sign the token
  const encoder = new TextEncoder();
  const dataToSign = encoder.encode(unsignedToken);
  
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    cryptoKey,
    dataToSign
  );
  
  // 7. Encode signature
  const encodedSignature = uint8ArrayToUrlBase64(new Uint8Array(signature));
  
  // 8. Create JWT
  const jwt = `${unsignedToken}.${encodedSignature}`;
  
  // 9. Return headers
  return {
    Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    'Crypto-Key': `p256ecdsa=${vapidPublicKey}`,
  };
}

/**
 * Send Web Push notification
 * 
 * @param subscription - Push subscription object
 * @param payload - Notification payload
 * @param vapidKeys - VAPID public/private keys
 * @returns Success status
 */
export async function sendWebPushNotification(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  payload: any,
  vapidKeys: {
    publicKey: string;
    privateKey: string;
    subject: string;
  }
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  try {
    // 1. Generate VAPID headers
    const vapidHeaders = await generateVAPIDHeaders(
      subscription.endpoint,
      vapidKeys.privateKey,
      vapidKeys.publicKey,
      vapidKeys.subject
    );
    
    // 2. Prepare payload
    const payloadString = JSON.stringify(payload);
    const payloadBuffer = new TextEncoder().encode(payloadString);
    
    // 3. Send push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400', // 24 hours
        ...vapidHeaders,
      },
      body: payloadBuffer,
    });
    
    if (response.ok) {
      return { success: true, statusCode: response.status };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        error: errorText || response.statusText,
        statusCode: response.status,
      };
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Unknown error',
    };
  }
}
```

#### Step 1.2: Generate Test VAPID Keys

**Tool:** Online VAPID Key Generator hoặc Node.js script

```bash
# Option 1: Node.js script (local only, not in Workers)
npm install web-push --save-dev
node -e "const webpush = require('web-push'); const keys = webpush.generateVAPIDKeys(); console.log('Public:', keys.publicKey); console.log('Private:', keys.privateKey);"
```

**Output:**
```
Public: BNxxx...xxx (87 chars)
Private: xxx...xxx (43 chars)
```

**Save to `.env`:**
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BNxxx...xxx"
VAPID_PRIVATE_KEY="xxx...xxx"
VAPID_SUBJECT="mailto:admin@tbsgroup.com"
```

#### Step 1.3: Create Test Endpoint

**File:** `web/src/app/api/test-vapid/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateVAPIDHeaders, sendWebPushNotification } from '@/lib/vapidSigner';

export async function GET(request: NextRequest) {
  try {
    const testEndpoint = 'https://fcm.googleapis.com/fcm/send/test-endpoint-123';
    
    // Test 1: Can generate headers?
    const headers = await generateVAPIDHeaders(
      testEndpoint,
      process.env.VAPID_PRIVATE_KEY!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_SUBJECT || 'mailto:admin@tbsgroup.com'
    );
    
    return NextResponse.json({
      success: true,
      message: 'VAPID signing works on Workers!',
      headers: {
        Authorization: headers.Authorization.substring(0, 50) + '...',
        'Crypto-Key': headers['Crypto-Key'],
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
```

#### Step 1.4: Test Local

```bash
# Start local Workers
npx wrangler dev

# Test API
curl http://localhost:8787/api/test-vapid
```

**Expected output:**
```json
{
  "success": true,
  "message": "VAPID signing works on Workers!",
  "headers": {
    "Authorization": "vapid t=eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9...",
    "Crypto-Key": "p256ecdsa=BNxxx..."
  }
}
```

**✅ Success criteria:**
- No errors about `crypto.createSign`
- JWT token generated successfully
- Headers properly formatted

---

### Option B: Use `jose` Library (ALTERNATIVE)

```bash
npm install jose
```

```typescript
import { SignJWT, importPKCS8 } from 'jose';

export async function generateVAPIDHeadersWithJose(
  endpoint: string,
  privateKeyPEM: string,
  publicKey: string,
  subject: string
): Promise<VAPIDHeaders> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  // Import private key (must be in PKCS8 PEM format)
  const privateKey = await importPKCS8(privateKeyPEM, 'ES256');
  
  // Generate JWT
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
    .setAudience(audience)
    .setExpirationTime('12h')
    .setSubject(subject)
    .sign(privateKey);
  
  return {
    Authorization: `vapid t=${jwt}, k=${publicKey}`,
    'Crypto-Key': `p256ecdsa=${publicKey}`,
  };
}
```

**Trade-offs:**
- ✅ Less code to write
- ✅ Battle-tested library
- ❌ Extra dependency (~50KB)
- ❌ Requires PKCS8 format (not URL-safe Base64)

---

## ✅ TASK 2: Implement Authentication Middleware

### Step 2.1: Create Auth Middleware

**File:** `web/src/lib/apiAuth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    empCode: string;
    name: string;
    email: string;
    roleCode: string;
    roles: string[];
    roleLevel: number;
  };
}

/**
 * Authenticate request and extract user info
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{
  authenticated: boolean;
  user?: any;
  error?: string;
}> {
  // 1. Extract token from header or cookie
  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.replace('Bearer ', '') || null;
  
  if (!token) {
    token = request.cookies.get('tbs_token')?.value || null;
  }
  
  if (!token) {
    return {
      authenticated: false,
      error: 'Missing authentication token',
    };
  }
  
  // 2. Verify JWT
  const user = await verifyToken(token);
  
  if (!user) {
    return {
      authenticated: false,
      error: 'Invalid or expired token',
    };
  }
  
  return {
    authenticated: true,
    user,
  };
}

/**
 * HOC to require authentication for API route
 */
export function requireAuth(
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const { authenticated, user, error } = await authenticateRequest(request);
    
    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: error || 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }
    
    // Attach user to request
    (request as AuthenticatedRequest).user = user;
    
    return handler(request as AuthenticatedRequest, context);
  };
}

/**
 * Check if user has required permission
 */
export function requirePermission(permission: string) {
  return function (
    handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>
  ) {
    return requireAuth(async (request: AuthenticatedRequest, context?: any) => {
      const user = request.user;
      
      // Admin bypass
      if (user.roleCode === 'admin' || user.roleLevel === 0) {
        return handler(request, context);
      }
      
      // Check permission
      if (!user.roles?.includes(permission)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden: Insufficient permissions',
            code: 'FORBIDDEN',
            required: permission,
          },
          { status: 403 }
        );
      }
      
      return handler(request, context);
    });
  };
}

/**
 * Optional auth (allows anonymous but attaches user if present)
 */
export function optionalAuth(
  handler: (request: NextRequest, user?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const { authenticated, user } = await authenticateRequest(request);
    
    (request as any).user = authenticated ? user : null;
    
    return handler(request, context);
  };
}
```

### Step 2.2: Apply to API Routes

**Example: Secured notification creation**

**File:** `web/src/app/api/notifications/route.ts`

```typescript
import { requireAuth, AuthenticatedRequest } from '@/lib/apiAuth';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

async function handlePOST(request: AuthenticatedRequest) {
  const user = request.user; // Guaranteed to exist (from requireAuth)
  const { title, message, targetUser, type, link, module, record_id } = await request.json();
  
  // Authorization check
  if (targetUser && targetUser !== user.empCode && targetUser !== 'ALL') {
    // Only admin or specific roles can send to others
    if (user.roleLevel > 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Cannot send notification to other users',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }
  }
  
  const { env } = getRequestContext();
  const id = crypto.randomUUID();
  
  // Create notification
  await env.DB.prepare(`
    INSERT INTO notifications 
    (id, title, message, type, target_user, link, module, record_id, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    id,
    title,
    message,
    type || 'INFO',
    targetUser || user.empCode,
    link || '/work',
    module || null,
    record_id || null,
    user.empCode // Track who created it
  ).run();
  
  return NextResponse.json({ success: true, id }, { status: 201 });
}

// ✅ Secure the endpoint
export const POST = requireAuth(handlePOST);
```

**Example: Push subscription với optional auth**

**File:** `web/src/app/api/push/subscribe/route.ts`

```typescript
import { optionalAuth } from '@/lib/apiAuth';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

async function handlePOST(request: NextRequest, user?: any) {
  const { subscription, emp_code } = await request.json();
  const { env } = getRequestContext();
  
  // Determine emp_code
  let finalEmpCode = 'ANONYMOUS';
  
  if (emp_code) {
    // If emp_code provided, must match authenticated user
    if (user && emp_code !== user.empCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: emp_code mismatch with authenticated user',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }
    
    finalEmpCode = emp_code;
  } else if (user) {
    // Use authenticated user's emp_code
    finalEmpCode = user.empCode;
  }
  
  const id = crypto.randomUUID();
  
  // UPSERT subscription
  await env.DB.prepare(`
    INSERT INTO push_subscriptions 
    (id, emp_code, endpoint, p256dh, auth, user_agent, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
    ON CONFLICT(endpoint) DO UPDATE SET
      emp_code = excluded.emp_code,
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      is_active = 1,
      last_seen = datetime('now')
  `).bind(
    id,
    finalEmpCode,
    subscription.endpoint,
    subscription.keys.p256dh,
    subscription.keys.auth,
    request.headers.get('user-agent') || ''
  ).run();
  
  return NextResponse.json({ success: true, id }, { status: 201 });
}

// ✅ Allow both authenticated and anonymous
export const POST = optionalAuth(handlePOST);
```

### Step 2.3: Test Authentication

**Test cases:**

```bash
# Test 1: No auth token (should fail)
curl -X POST http://localhost:8787/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Test"}'
# Expected: 401 Unauthorized

# Test 2: Valid auth token
curl -X POST http://localhost:8787/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_VALID_JWT" \
  -d '{"title":"Test","message":"Test"}'
# Expected: 201 Created

# Test 3: Try to send to other user (non-admin)
curl -X POST http://localhost:8787/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYEE_JWT" \
  -d '{"title":"Test","message":"Test","targetUser":"CEO"}'
# Expected: 403 Forbidden

# Test 4: Subscribe without auth (should work)
curl -X POST http://localhost:8787/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{"subscription":{"endpoint":"...","keys":{...}}}'
# Expected: 201 Created, emp_code = ANONYMOUS
```

---

## ✅ TASK 3: Fix Database UNIQUE Constraint

### Step 3.1: Create New Migration

**File:** `web/migrations/0009_push_subscriptions_unique_fix.sql`

```sql
-- ============================================================
-- MIGRATION 0009: Fix push_subscriptions UNIQUE constraint
-- ============================================================

-- Step 1: Backup existing data (if any)
CREATE TABLE IF NOT EXISTS push_subscriptions_backup AS 
SELECT * FROM push_subscriptions;

-- Step 2: Drop old table
DROP TABLE IF EXISTS push_subscriptions;

-- Step 3: Recreate with proper constraints
CREATE TABLE push_subscriptions (
    id TEXT PRIMARY KEY,
    emp_code TEXT NOT NULL DEFAULT 'ANONYMOUS',
    endpoint TEXT NOT NULL UNIQUE, -- ✅ UNIQUE constraint for ON CONFLICT
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    device_info TEXT,
    is_active INTEGER DEFAULT 1,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Restore data from backup (if exists)
INSERT INTO push_subscriptions 
SELECT * FROM push_subscriptions_backup;

-- Step 5: Create indexes
CREATE INDEX idx_push_sub_emp_code ON push_subscriptions(emp_code);
CREATE INDEX idx_push_sub_active ON push_subscriptions(is_active) WHERE is_active = 1;
CREATE INDEX idx_push_sub_endpoint ON push_subscriptions(endpoint);

-- Step 6: Clean up backup
DROP TABLE push_subscriptions_backup;
```

### Step 3.2: Run Migration

```bash
# Local D1
npx wrangler d1 execute vpchuoiskechers-db --local --file=web/migrations/0009_push_subscriptions_unique_fix.sql

# Production D1
npx wrangler d1 execute vpchuoiskechers-db --file=web/migrations/0009_push_subscriptions_unique_fix.sql
```

### Step 3.3: Verify

```bash
# Check table schema
npx wrangler d1 execute vpchuoiskechers-db --local --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='push_subscriptions'"

# Expected output should include: endpoint TEXT NOT NULL UNIQUE
```

---

## ✅ TASK 4: Add iOS PWA Detection & Warning

### Step 4.1: Device Detection Utility

**File:** `web/src/lib/deviceDetection.ts`

```typescript
/**
 * Detect if device is iOS (iPhone, iPad, iPod)
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Detect if running as PWA (standalone mode)
 */
export function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // iOS Safari
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  // Other browsers
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  return false;
}

/**
 * Check if device can receive push notifications
 * iOS requires PWA to be installed
 */
export function canReceivePushNotifications(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if Notification API is supported
  if (!('Notification' in window)) {
    return false;
  }
  
  // iOS special check
  if (isIOSDevice()) {
    return isRunningAsPWA();
  }
  
  // Other platforms are OK
  return true;
}

/**
 * Get device info for logging
 */
export function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = window.navigator.userAgent;
  
  if (isIOSDevice()) {
    if (isRunningAsPWA()) {
      return 'iOS PWA';
    }
    return 'iOS Safari (not PWA)';
  }
  
  if (/android/i.test(ua)) {
    if (isRunningAsPWA()) {
      return 'Android PWA';
    }
    return 'Android Browser';
  }
  
  return 'Desktop';
}
```

### Step 4.2: iOS PWA Install Prompt

**File:** `web/src/components/IOSPWAPrompt.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { isIOSDevice, isRunningAsPWA } from '@/lib/deviceDetection';
import { IconX, IconDeviceMobile, IconArrowUp } from '@tabler/icons-react';

export default function IOSPWAPrompt() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Check if should show
    if (dismissed) return;
    
    const shouldShow = isIOSDevice() && !isRunningAsPWA();
    setShow(shouldShow);
    
    // Check localStorage for previous dismissal
    const dismissedBefore = localStorage.getItem('ios_pwa_prompt_dismissed');
    if (dismissedBefore === 'true') {
      setShow(false);
    }
  }, [dismissed]);
  
  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('ios_pwa_prompt_dismissed', 'true');
  };
  
  const handleRemindLater = () => {
    setShow(false);
    // Don't set dismissed flag - will show again on next visit
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006838] to-[#004d29] p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <IconDeviceMobile size={32} />
              <div>
                <h3 className="text-xl font-black">Cài Đặt Ứng Dụng</h3>
                <p className="text-sm text-emerald-100 mt-1">
                  Để nhận thông báo trên iPhone
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <p className="text-sm font-bold text-amber-900">
              ⚠️ Thông báo chỉ hoạt động khi cài app vào màn hình chính
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900">Hướng dẫn cài đặt (3 bước):</h4>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#006838] text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-900">Bấm nút Share</p>
                <p className="text-sm text-slate-600">
                  Biểu tượng <IconArrowUp size={16} className="inline" /> ở thanh dưới
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#006838] text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-slate-900">Chọn "Add to Home Screen"</p>
                <p className="text-sm text-slate-600">
                  Cuộn xuống tìm "Thêm vào Màn hình Chính"
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#006838] text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-slate-900">Bấm "Add"</p>
                <p className="text-sm text-slate-600">
                  App sẽ xuất hiện trên màn hình chính
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t space-y-2">
            <button
              onClick={handleRemindLater}
              className="w-full py-3 px-4 bg-[#006838] hover:bg-[#004d29] text-white font-bold rounded-xl transition"
            >
              Đã hiểu, tôi sẽ cài đặt
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Không nhắc lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 4.3: Integrate vào NotificationInitializer

**Update:** `web/src/components/NotificationInitializer.tsx`

```typescript
import { canReceivePushNotifications, getDeviceInfo } from '@/lib/deviceDetection';

useEffect(() => {
  const initNotifications = async () => {
    // Check if device can receive push
    if (!canReceivePushNotifications()) {
      console.log(`⚠️ Device cannot receive push: ${getDeviceInfo()}`);
      // Don't proceed with push subscription
      return;
    }
    
    // Continue with normal flow
    await registerServiceWorker();
    // ...
  };
  
  initNotifications();
}, []);
```

### Step 4.4: Add to Layout

**Update:** `web/src/app/layout.tsx`

```tsx
import IOSPWAPrompt from '@/components/IOSPWAPrompt';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <IOSPWAPrompt /> {/* ✅ Show iOS PWA prompt */}
        <NotificationInitializer />
      </body>
    </html>
  );
}
```

---

## ✅ TASK 5: Integration Test với Wrangler Dev

### Step 5.1: Test Checklist

```bash
# 1. Start local development server
npx wrangler dev

# 2. Test VAPID signing
curl http://localhost:8787/api/test-vapid
# Should return: { success: true, message: "VAPID signing works..." }

# 3. Test auth middleware - no token
curl -X POST http://localhost:8787/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Test"}'
# Should return: { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }

# 4. Test push subscription - anonymous
curl -X POST http://localhost:8787/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/test-123",
      "keys": {
        "p256dh": "test-p256dh",
        "auth": "test-auth"
      }
    }
  }'
# Should return: { success: true, id: "..." }

# 5. Verify database
npx wrangler d1 execute vpchuoiskechers-db --local --command="SELECT * FROM push_subscriptions"
# Should show 1 row with emp_code = 'ANONYMOUS'

# 6. Test iOS detection (manual in browser)
# Open http://localhost:8787 on iOS Safari
# Should show PWA install prompt

# 7. Test push subscription with auth (need valid JWT)
# ... (after login)
```

### Step 5.2: Automated Test Script

**File:** `scripts/test-phase0.sh`

```bash
#!/bin/bash

echo "🧪 Testing Phase 0: Risk Mitigation"
echo "===================================="

BASE_URL="http://localhost:8787"

# Test 1: VAPID Signing
echo ""
echo "Test 1: VAPID Signing..."
response=$(curl -s "$BASE_URL/api/test-vapid")
if echo "$response" | grep -q "success.*true"; then
  echo "✅ VAPID signing works"
else
  echo "❌ VAPID signing failed"
  echo "$response"
  exit 1
fi

# Test 2: Auth middleware (should fail without token)
echo ""
echo "Test 2: Auth middleware (no token)..."
response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X POST "$BASE_URL/api/notifications" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Test"}')

if [ "$response" = "401" ]; then
  echo "✅ Auth middleware blocks unauthenticated requests"
else
  echo "❌ Auth middleware failed (expected 401, got $response)"
  cat /tmp/response.json
  exit 1
fi

# Test 3: Push subscription (anonymous)
echo ""
echo "Test 3: Push subscription (anonymous)..."
response=$(curl -s -X POST "$BASE_URL/api/push/subscribe" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint-'$(date +%s)'",
      "keys": {
        "p256dh": "test-p256dh-key",
        "auth": "test-auth-key"
      }
    }
  }')

if echo "$response" | grep -q "success.*true"; then
  echo "✅ Push subscription works (anonymous)"
else
  echo "❌ Push subscription failed"
  echo "$response"
  exit 1
fi

echo ""
echo "===================================="
echo "✅ All Phase 0 tests passed!"
echo "Ready to proceed to Phase 1"
```

**Run:**
```bash
chmod +x scripts/test-phase0.sh
./scripts/test-phase0.sh
```

---

## ✅ SUCCESS CRITERIA

### Phase 0 Complete When:

- ✅ VAPID signing hoạt động trên Workers (test endpoint returns 200)
- ✅ Authentication middleware blocks unauthorized requests (401)
- ✅ Anonymous push subscriptions work (201 Created)
- ✅ Database UNIQUE constraint works (no ON CONFLICT errors)
- ✅ iOS PWA prompt shows correctly on iOS Safari
- ✅ All integration tests pass (`test-phase0.sh` exits 0)

### Files Created/Modified:

**New files:**
- `web/src/lib/vapidSigner.ts` ✅
- `web/src/lib/apiAuth.ts` ✅
- `web/src/lib/deviceDetection.ts` ✅
- `web/src/components/IOSPWAPrompt.tsx` ✅
- `web/src/app/api/test-vapid/route.ts` ✅
- `web/migrations/0009_push_subscriptions_unique_fix.sql` ✅
- `scripts/test-phase0.sh` ✅

**Modified files:**
- `web/src/app/api/push/subscribe/route.ts` (add auth)
- `web/src/app/api/notifications/route.ts` (add auth)
- `web/src/components/NotificationInitializer.tsx` (add iOS check)
- `web/src/app/layout.tsx` (add IOSPWAPrompt)

---

## 🚀 NEXT STEPS

After Phase 0 passes:
1. ✅ Commit all Phase 0 changes
2. ✅ Deploy to staging for real device testing
3. ✅ Proceed to Phase 1: Core Implementation

---

**Prepared by:** Kiro AI Assistant  
**Date:** 03/09/2026  
**Status:** ✅ Ready for Execution
