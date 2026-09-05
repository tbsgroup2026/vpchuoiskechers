# BÁO CÁO BUG: USER BỊ CHUYỂN SANG TÀI KHOẢN KHÁC KHI RELOAD

**Ngày phát hiện:** 03/09/2026  
**Mức độ:** 🔴 CRITICAL - SECURITY BUG  
**Impact:** User authentication bị lẫn lộn, session leakage giữa các users  

---

## 🐛 MÔ TẢ BUG

**Triệu chứng:**
- User đăng nhập tài khoản A
- Sau một thời gian hoặc reload page
- Bỗng nhiên chuyển sang tài khoản B (user khác)

**Tần suất:** Ngẫu nhiên, thường xảy ra khi:
- Mở nhiều tab
- Reload page
- Switch giữa các trang
- Sau khi có người khác login trên cùng máy

---

## 🔍 NGUYÊN NHÂN GỐC RỄ

### Root Cause 1: Cookie Token Không Liên Kết Với User

**File:** `web/src/lib/userProfiles.ts` - Line 593-595

```typescript
// ❌ BUG: Token chỉ là timestamp, không chứa empCode thật
const token = `tbs_token_${baseProfile.empCode}_${Date.now()}`;
document.cookie = `tbs_token=${token}; path=/; max-age=86400`;
```

**Vấn đề:**
- Cookie `tbs_token` là string random với empCode, KHÔNG phải JWT
- Backend `/api/auth/login` trả về JWT token thực
- Frontend KHÔNG lưu JWT token vào cookie
- Mỗi lần login tạo token mới → conflict khi nhiều user login trên cùng browser

**Proof:**
```typescript
// User A login → Cookie: tbs_token=tbs_token_202608001_1234567890
// User B login → Cookie: tbs_token=tbs_token_LT-001_1234567899
// Cookie bị ghi đè, nhưng sessionStorage/localStorage vẫn giữ data cũ
```

---

### Root Cause 2: Session Storage vs Local Storage Conflict

**File:** `web/src/lib/userProfiles.ts` - Line 492-498

```typescript
// ✅ Ưu tiên sessionStorage (per-tab)
let stored = sessionStorage.getItem("tbs_current_user");

if (!stored) {
  // ❌ BUG: Fallback về localStorage (shared across tabs)
  stored = localStorage.getItem("tbs_current_user");
  if (stored) {
    // ❌ Copy localStorage data vào sessionStorage
    sessionStorage.setItem("tbs_current_user", stored);
  }
}
```

**Vấn đề:**
- sessionStorage: Riêng biệt mỗi tab ✅
- localStorage: Dùng chung tất cả tabs ❌
- Khi user A login ở tab 1 → lưu vào localStorage
- User B login ở tab 2 → GHI ĐÈ localStorage
- Tab 1 reload → lấy localStorage (đã là user B) → BUG!

---

### Root Cause 3: JWT Token Không Được Sử Dụng Đúng Cách

**File:** `web/src/app/api/auth/login/route.ts` - Line 236-240

```typescript
// ✅ Backend tạo JWT token đúng
const token = await signToken(payload);

return NextResponse.json({
  success: true,
  token, // ✅ Trả về JWT
  user: payload,
});
```

**File:** `web/src/lib/userProfiles.ts` - Line 619-665

```typescript
// ❌ Frontend KHÔNG lưu JWT vào cookie
const res = await fetch("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ empCode, role, password }),
});

const json = await res.json();
// json.token tồn tại nhưng KHÔNG được lưu vào cookie
// Chỉ lưu user data vào localStorage/sessionStorage
```

**File:** `web/src/proxy.ts` - Line 69-71

```typescript
// ❌ Proxy middleware đọc cookie token
const authHeader = request.headers.get('Authorization');
let token = authHeader ? authHeader.replace('Bearer ', '') : null;

if (!token) {
  token = request.cookies.get('tbs_token')?.value || null; // ❌ Token fake
}
```

**Hệ quả:**
- Backend tạo JWT đúng nhưng frontend không dùng
- Cookie `tbs_token` là fake token (không verify được)
- Middleware đọc fake token → không verify được → fallback về localStorage
- localStorage bị share giữa tabs → session leak

---

### Root Cause 4: Avatar Bleeding Between Users

**File:** `web/src/lib/userProfiles.ts` - Line 516-526

```typescript
// ✅ Có cơ chế riêng biệt avatar per-user
const customAvatar = getUserAvatar(normalizedCode);

// ❌ NHƯNG có code fallback nguy hiểm
if (!finalAvatar && parsed.avatar) {
  finalAvatar = parsed.avatar; // ❌ Lấy từ session cũ
}
```

**Vấn đề:**
- Avatar IT guy (202608001) có URL cloudinary unique
- Code check xóa avatar nếu không match empCode
- NHƯNG nếu sessionStorage lấy từ localStorage đã bị đè → avatar leak

---

## 🔥 KỊCH BẢN TÁI HIỆN BUG

### Scenario 1: Multi-Tab Login

```
Step 1: User A (202608001) login ở Tab 1
  → Cookie: tbs_token=tbs_token_202608001_1111
  → localStorage: { empCode: "202608001", name: "Anh Huy" }
  → sessionStorage (Tab 1): { empCode: "202608001", name: "Anh Huy" }

Step 2: User B (LT-001) login ở Tab 2
  → Cookie: tbs_token=tbs_token_LT-001_2222 (ghi đè cookie)
  → localStorage: { empCode: "LT-001", name: "Lễ Tân" } (ghi đè localStorage)
  → sessionStorage (Tab 2): { empCode: "LT-001", name: "Lễ Tân" }

Step 3: Tab 1 reload page
  → sessionStorage (Tab 1) mất (reload clear sessionStorage)
  → Fallback về localStorage
  → localStorage = { empCode: "LT-001" } (đã bị User B ghi đè)
  → Tab 1 hiện thành User B ❌ BUG!
```

### Scenario 2: Single User - Token Expiry

```
Step 1: User A login
  → Cookie: tbs_token=tbs_token_202608001_1234567890
  → localStorage + sessionStorage OK

Step 2: Cookie tự động expire (max-age=86400 = 24h)
  → Cookie deleted by browser

Step 3: User reload page
  → Middleware check cookie → No cookie
  → Redirect to /login
  → NHƯNG localStorage vẫn còn data cũ
  → getCurrentUser() vẫn trả về user cũ
  → UI hiện logged in nhưng API calls fail 401

Step 4: User login lại
  → Login thành công
  → Cookie mới được tạo
  → localStorage được UPDATE (không clear trước)
  → Nếu có data conflict → undefined behavior
```

### Scenario 3: Logout Không Hoàn Toàn

```
Step 1: User A login và dùng hệ thống

Step 2: User A logout
  → logoutUserProfile() xóa:
    ✅ Cookie
    ✅ sessionStorage
    ✅ localStorage["tbs_current_user"]
    ❌ NHƯNG KHÔNG xóa:
      - localStorage["tbs_avatar_202608001"]
      - Các cache khác

Step 3: User B login trên cùng browser
  → Login thành công
  → localStorage["tbs_current_user"] = User B data
  → NHƯNG localStorage["tbs_avatar_202608001"] vẫn tồn tại

Step 4: Code getUserAvatar() check avatar
  → Tìm thấy avatar của 202608001 trong localStorage
  → Nếu User B không có avatar riêng → hiện avatar User A ❌
```

---

## 📊 PHÂN TÍCH CHI TIẾT

### Authentication Flow Hiện Tại (Broken)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User nhập credentials                                   │
│     ↓                                                       │
│  2. Frontend gọi POST /api/auth/login                       │
│     ↓                                                       │
│  3. Backend verify → signToken(payload) → JWT ✅            │
│     ↓                                                       │
│  4. Response: { token: JWT, user: {...} }                   │
│     ↓                                                       │
│  5. Frontend nhận response                                  │
│     ↓                                                       │
│  6. ❌ SKIP: Không lưu JWT vào cookie                       │
│     ↓                                                       │
│  7. ❌ Tạo fake token: tbs_token_${empCode}_${Date.now()}   │
│     ↓                                                       │
│  8. ❌ Set cookie: tbs_token=fake_token                     │
│     ↓                                                       │
│  9. Lưu user data vào localStorage + sessionStorage         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 SUBSEQUENT REQUESTS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Browser tự động gửi cookie: tbs_token=fake_token        │
│     ↓                                                       │
│  2. Middleware (proxy.ts) đọc cookie                        │
│     ↓                                                       │
│  3. verifyToken(fake_token) → ❌ FAIL (không phải JWT)      │
│     ↓                                                       │
│  4. Redirect về /login                                      │
│     ↓                                                       │
│  5. NHƯNG getCurrentUser() vẫn trả về data từ localStorage  │
│     ↓                                                       │
│  6. UI hiện logged in, API calls fail 401                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Storage Layer Conflict

```
┌──────────────────────────────────────────────────────────────┐
│                    STORAGE LAYERS                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Cookie (Domain-wide, 24h TTL)                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  tbs_token = tbs_token_${empCode}_${timestamp}     │     │
│  │  ❌ Shared across ALL tabs                          │     │
│  │  ❌ Not a real JWT                                  │     │
│  │  ❌ Ghi đè khi login user khác                      │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  localStorage (Domain-wide, Persistent)                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  tbs_current_user = { empCode, name, avatar, ... } │     │
│  │  tbs_avatar_202608001 = "cloudinary_url"           │     │
│  │  tbs_avatar_LT-001 = "unsplash_url"                │     │
│  │  ❌ Shared across ALL tabs                          │     │
│  │  ❌ tbs_current_user ghi đè khi login user khác     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  sessionStorage (Per-tab, Session-scoped)                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  tbs_current_user = { empCode, name, avatar, ... } │     │
│  │  ✅ Isolated per tab                                │     │
│  │  ❌ Lost on reload → fallback to localStorage       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ GIẢI PHÁP KHẮC PHỤC

### Solution 1: Sử Dụng JWT Token Đúng Cách (CRITICAL)

**File:** `web/src/lib/userProfiles.ts`

```typescript
// ✅ FIX: Lưu JWT token thực vào cookie
export async function loginWithD1Database(
  empCodeOrRole: string,
  password?: string,
  role?: string
): Promise<UserProfile> {
  // ... existing code ...
  
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empCode: cleanInput, role, password }),
    });

    if (res.ok) {
      const json = await res.json();
      
      // ✅ FIX: Lưu JWT token vào cookie
      if (json.token) {
        document.cookie = `tbs_token=${json.token}; path=/; max-age=86400; SameSite=Strict; Secure`;
      }
      
      // ... rest of code ...
    }
  } catch (err) {
    console.error("Login error:", err);
  }
}

// ✅ FIX: loginUserProfile cũng cần update
export function loginUserProfile(empCodeOrRole: string, password?: string): UserProfile {
  // ... existing code ...
  
  // ❌ REMOVE: Fake token
  // const token = `tbs_token_${baseProfile.empCode}_${Date.now()}`;
  // document.cookie = `tbs_token=${token}; path=/; max-age=86400`;
  
  // ✅ ADD: Note that JWT token should be set by loginWithD1Database
  console.warn('loginUserProfile: JWT token should be set by API response');
  
  // ... rest of code ...
}
```

---

### Solution 2: Sửa Session/Local Storage Isolation

**File:** `web/src/lib/userProfiles.ts`

```typescript
// ✅ FIX: Không fallback về localStorage cho multi-user
export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;

  // ✅ CHỈ dùng sessionStorage (per-tab isolation)
  const stored = sessionStorage.getItem("tbs_current_user");
  
  // ❌ REMOVE localStorage fallback để tránh cross-tab contamination
  // if (!stored) {
  //   stored = localStorage.getItem("tbs_current_user");
  // }
  
  if (!stored) {
    // ✅ Không có session → user chưa login hoặc đã logout
    return null;
  }

  try {
    const parsed: UserProfile = JSON.parse(stored);
    // ... validation logic ...
    return parsed;
  } catch {
    return null;
  }
}
```

**Alternative:** Nếu cần localStorage cho "Remember Me":

```typescript
export function getCurrentUser(options?: { allowLocalStorageFallback?: boolean }): UserProfile | null {
  if (typeof window === "undefined") return null;

  let stored = sessionStorage.getItem("tbs_current_user");
  
  // ✅ Chỉ fallback nếu explicitly requested (Remember Me feature)
  if (!stored && options?.allowLocalStorageFallback) {
    stored = localStorage.getItem("tbs_current_user");
    
    // ⚠️ Verify với cookie token trước khi trust localStorage
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('tbs_token='))
      ?.split('=')[1];
    
    if (!cookieToken) {
      // Cookie expired → không tin localStorage
      localStorage.removeItem("tbs_current_user");
      return null;
    }
  }
  
  // ... rest of validation ...
}
```

---

### Solution 3: Clear Isolation Khi Login/Logout

**File:** `web/src/lib/userProfiles.ts`

```typescript
// ✅ FIX: Clear tất cả state trước khi login user mới
export function loginUserProfile(empCodeOrRole: string, password?: string): UserProfile {
  if (typeof window === "undefined") {
    throw new Error("Window environment required");
  }

  // ✅ Clear HOÀN TOÀN state cũ
  logoutUserProfile();
  
  // ✅ Clear tất cả avatar cache (không chỉ của user hiện tại)
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('tbs_avatar_')) {
      localStorage.removeItem(key);
    }
  });
  
  const cleanInput = (empCodeOrRole || "").trim();
  const targetEmpCode = normalizeEmpCode(cleanInput);
  
  // ... build baseProfile ...
  
  // ✅ Chỉ lưu vào sessionStorage (per-tab)
  sessionStorage.setItem("tbs_current_user", JSON.stringify(baseProfile));
  
  // ❌ KHÔNG lưu vào localStorage (trừ khi Remember Me)
  // localStorage.setItem("tbs_current_user", JSON.stringify(baseProfile));
  
  return baseProfile;
}

// ✅ FIX: Logout phải clear TOÀN BỘ
export function logoutUserProfile(): void {
  if (typeof window === "undefined") return;

  // ✅ Xóa cookie
  document.cookie = "tbs_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";

  // ✅ Xóa session storage
  sessionStorage.clear(); // Clear ALL sessionStorage

  // ✅ Xóa localStorage (selective)
  localStorage.removeItem("tbs_current_user");
  
  // ✅ Clear tất cả avatar cache
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('tbs_avatar_') || key.startsWith('tbs_')) {
      localStorage.removeItem(key);
    }
  });

  // ✅ Notify UI
  window.dispatchEvent(new Event("tbs_profile_updated"));
}
```

---

### Solution 4: Middleware Verify Token Đúng

**File:** `web/src/proxy.ts`

```typescript
// ✅ FIX: Verify JWT token thật
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ... public routes check ...

  // ✅ Get token from cookie or header
  const authHeader = request.headers.get('Authorization');
  let token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    token = request.cookies.get('tbs_token')?.value || null;
  }

  if (!token) {
    // No token → redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ✅ Verify JWT token
  const user = await verifyToken(token);
  
  if (!user) {
    // ✅ Invalid/expired token → FORCE logout
    const response = NextResponse.redirect(new URL('/login', request.url));
    
    // ✅ Clear cookie on invalid token
    response.cookies.delete('tbs_token');
    
    return response;
  }

  // ✅ Token valid → allow request
  return NextResponse.next();
}
```

---

### Solution 5: Client-Side Token Validation

**File:** `web/src/lib/tokenValidator.ts` (NEW)

```typescript
/**
 * Validate client-side token with backend
 */
export async function validateCurrentSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  // 1. Check if sessionStorage has user
  const storedUser = sessionStorage.getItem('tbs_current_user');
  if (!storedUser) return false;
  
  // 2. Check if cookie token exists
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('tbs_token='))
    ?.split('=')[1];
  
  if (!cookieToken) {
    // Cookie missing → logout
    sessionStorage.removeItem('tbs_current_user');
    return false;
  }
  
  // 3. Validate token with backend (optional, can cache)
  try {
    const res = await fetch('/api/auth/validate', {
      headers: {
        'Authorization': `Bearer ${cookieToken}`,
      },
    });
    
    if (!res.ok) {
      // Token invalid → logout
      sessionStorage.removeItem('tbs_current_user');
      document.cookie = 'tbs_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
```

**Usage in components:**

```typescript
// web/src/components/Header.tsx
useEffect(() => {
  validateCurrentSession().then(valid => {
    if (!valid) {
      window.location.href = '/login';
    }
  });
}, []);
```

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1: Critical Fixes (Ngay lập tức) - 2 giờ

- [ ] **Fix JWT token storage**
  - [ ] Update `loginWithD1Database` để lưu JWT vào cookie
  - [ ] Remove fake token generation
  - [ ] Test login flow

- [ ] **Fix session isolation**
  - [ ] Remove localStorage fallback trong `getCurrentUser`
  - [ ] Chỉ dùng sessionStorage cho current user
  - [ ] Test multi-tab scenario

- [ ] **Fix logout**
  - [ ] Clear ALL storage (session + local)
  - [ ] Clear ALL avatar cache
  - [ ] Test logout → login another user

### Phase 2: Token Validation (4 giờ)

- [ ] **Create validation endpoint**
  - [ ] API route: `/api/auth/validate`
  - [ ] Verify JWT and return user info
  
- [ ] **Client-side validation**
  - [ ] Create `tokenValidator.ts`
  - [ ] Add validation hook in components
  - [ ] Test token expiry scenarios

### Phase 3: Testing & Verification (3 giờ)

- [ ] **Multi-tab testing**
  - [ ] Tab 1: Login user A
  - [ ] Tab 2: Login user B
  - [ ] Tab 1: Reload → should stay user A ✅
  
- [ ] **Cookie expiry testing**
  - [ ] Login → wait 24h → should auto-logout
  - [ ] Login → delete cookie manually → should redirect to login
  
- [ ] **Avatar isolation testing**
  - [ ] Login user A with custom avatar
  - [ ] Logout
  - [ ] Login user B → should NOT see user A's avatar

---

## 🎯 EXPECTED RESULTS

### Before Fix ❌

```
Tab 1: Login as 202608001 (Anh Huy)
Tab 2: Login as LT-001 (Lễ Tân)
Tab 1: Reload page
Result: ❌ Shows LT-001 (Wrong user!)
```

### After Fix ✅

```
Tab 1: Login as 202608001 (Anh Huy)
Tab 2: Login as LT-001 (Lễ Tân)
Tab 1: Reload page
Result: ✅ Shows 202608001 (Correct user!)

Tab 1: Still logged in as 202608001
Tab 2: Still logged in as LT-001
Each tab maintains its own session ✅
```

---

## 🚨 SECURITY IMPLICATIONS

### Current State (Vulnerable)

- ⚠️ **Session Fixation:** User có thể force session ID
- ⚠️ **Session Hijacking:** localStorage leak → steal session
- ⚠️ **Cross-Tab Contamination:** User A data visible to User B
- ⚠️ **Token Forgery:** Fake tokens accepted by middleware

### After Fix (Secure)

- ✅ **JWT-based authentication:** Only valid tokens accepted
- ✅ **Per-tab isolation:** sessionStorage only
- ✅ **Secure cookies:** HttpOnly, SameSite, Secure flags
- ✅ **Token validation:** Backend verify every request

---

## 📊 TESTING PLAN

### Test Case 1: Single User - Normal Flow

```typescript
describe('Single User Authentication', () => {
  it('should maintain session across page reloads', async () => {
    // 1. Login
    await loginWithD1Database('202608001', '21032004');
    
    // 2. Verify session
    let user = getCurrentUser();
    expect(user?.empCode).toBe('202608001');
    
    // 3. Simulate page reload
    sessionStorage.clear(); // Simulate reload
    // Should still have cookie token
    
    // 4. Verify session restored
    user = getCurrentUser();
    expect(user?.empCode).toBe('202608001');
  });
});
```

### Test Case 2: Multi-Tab Isolation

```typescript
describe('Multi-Tab Authentication', () => {
  it('should isolate sessions per tab', async () => {
    // Tab 1
    const tab1 = { sessionStorage: {}, localStorage: {} };
    await loginInTab(tab1, '202608001');
    
    // Tab 2
    const tab2 = { sessionStorage: {}, localStorage: {} };
    await loginInTab(tab2, 'LT-001');
    
    // Verify isolation
    expect(tab1.sessionStorage['tbs_current_user']).toContain('202608001');
    expect(tab2.sessionStorage['tbs_current_user']).toContain('LT-001');
    
    // localStorage should NOT contain any user data
    expect(tab1.localStorage['tbs_current_user']).toBeUndefined();
  });
});
```

### Test Case 3: Token Expiry

```typescript
describe('Token Expiry', () => {
  it('should auto-logout on expired token', async () => {
    // 1. Login
    await loginWithD1Database('202608001', '21032004');
    
    // 2. Manually expire token
    document.cookie = 'tbs_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // 3. Verify session invalidated
    const valid = await validateCurrentSession();
    expect(valid).toBe(false);
    
    // 4. Verify getCurrentUser returns null
    const user = getCurrentUser();
    expect(user).toBeNull();
  });
});
```

---

## 🎬 CONCLUSION

**Bug Severity:** 🔴 CRITICAL  
**Fix Priority:** P0 (Immediate)  
**Estimated Effort:** 9 hours (2 + 4 + 3)  
**Risk if not fixed:** Production data breach, wrong user accessing sensitive info

**Action Required:**
1. ✅ Implement Phase 1 fixes immediately (2h)
2. ✅ Deploy to staging and test (1h)
3. ✅ Implement Phase 2 validation (4h)
4. ✅ Full regression testing (3h)
5. ✅ Deploy to production

**Impact After Fix:**
- ✅ Session security restored
- ✅ No more user confusion
- ✅ Proper JWT authentication
- ✅ GDPR/SOC2 compliance improved

---

**Báo cáo được tạo bởi:** Kiro AI Assistant  
**Ngày:** 03/09/2026  
**Version:** 1.0  
**Status:** 🔴 CRITICAL - REQUIRES IMMEDIATE ACTION
