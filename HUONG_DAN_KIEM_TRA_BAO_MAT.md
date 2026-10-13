# 📋 HƯỚNG DẪN KIỂM TRA BẢO MẬT

## MỤC ĐÍCH
Hướng dẫn kiểm tra xem website đã được bảo mật sau khi deploy code mới.

---

## KIỂM TRA CƠ BẢN (Bất kỳ ai cũng làm được)

### ✅ Test 1: Truy cập ẩn danh

**Mục đích:** Kiểm tra web KHÔNG còn tự động đăng nhập

**Cách làm:**
1. Mở trình duyệt Chrome
2. Nhấn `Ctrl + Shift + N` (mở cửa sổ ẩn danh)
3. Truy cập: `https://vpchuoiskechers.tbsgroup2026.workers.dev`

**Kết quả mong đợi:**
- ✅ **ĐÚNG**: Hiện trang đăng nhập, yêu cầu nhập empCode và password
- ❌ **SAI**: Tự động vào tài khoản, thấy tên "Phạm Nguyễn Anh Huy" ở góc phải

**Nếu SAI:**
```bash
# Clear Cloudflare cache
# Vào Cloudflare Dashboard → Caching → Purge Everything
# Hoặc:
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

### ✅ Test 2: Đăng nhập rồi đăng xuất

**Cách làm:**
1. Đăng nhập bằng tài khoản của bạn
2. Click nút "Đăng xuất" (góc phải trên)
3. KHÔNG đóng trình duyệt
4. Truy cập lại: `https://vpchuoiskechers.tbsgroup2026.workers.dev`

**Kết quả mong đợi:**
- ✅ **ĐÚNG**: Hiện lại trang đăng nhập, BẮT BUỘC phải đăng nhập lại
- ❌ **SAI**: Vẫn vào được tài khoản cũ mà không cần đăng nhập

---

### ✅ Test 3: Đăng nhập từ 2 thiết bị khác nhau

**Cách làm:**
1. **Máy tính A**: Đăng nhập tài khoản của bạn
2. **Điện thoại B**: Truy cập web (chưa đăng nhập)

**Kết quả mong đợi:**
- ✅ **ĐÚNG**: Điện thoại B hiện trang đăng nhập, YÊU CẦU đăng nhập riêng
- ❌ **SAI**: Điện thoại B tự động vào cùng tài khoản với Máy tính A

---

## KIỂM TRA KỸ THUẬT (Cần kiến thức IT)

### ✅ Test 4: API call không có token

**Cách làm:**
```bash
curl https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/me
```

**Kết quả mong đợi:**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
}
```

**HTTP Status Code:** `401`

**Nếu SAI:**
```json
// ❌ KHÔNG được thấy:
{
  "success": true,
  "user": {
    "empCode": "202608001",
    "name": "Phạm Nguyễn Anh Huy",
    ...
  }
}
```

---

### ✅ Test 5: Check response headers

**Cách làm:**
```bash
curl -I https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/me
```

**Kết quả mong đợi:**
```
HTTP/2 401
cache-control: no-store, no-cache, must-revalidate, private
pragma: no-cache
content-type: application/json
```

**Phải có:**
- ✅ `Cache-Control: no-store, no-cache, must-revalidate, private`
- ✅ `Pragma: no-cache`

---

### ✅ Test 6: Token không hợp lệ

**Cách làm:**
```bash
curl https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/me \
  -H "Authorization: Bearer invalid_token_12345"
```

**Kết quả mong đợi:**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
}
```

**HTTP Status Code:** `401`

---

### ✅ Test 7: Token đã hết hạn

**Cách làm:**
```bash
# Lấy token cũ (trước ngày deploy)
# Thử gọi API với token cũ
curl https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/me \
  -H "Authorization: Bearer [OLD_TOKEN]"
```

**Kết quả mong đợi:**
- ✅ **ĐÚNG**: Trả về 401 Unauthorized
- ❌ **SAI**: Vẫn trả về thông tin user

---

### ✅ Test 8: Check cookie security

**Cách làm:**
```bash
# Login và lấy Set-Cookie header
curl -i https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"empCode":"YOUR_EMP_CODE","password":"YOUR_PASSWORD"}'
```

**Kết quả mong đợi (trong Set-Cookie header):**
```
Set-Cookie: tbs_token=...; Path=/; Max-Age=86400; SameSite=Lax; Secure; HttpOnly
```

**Phải có:**
- ✅ `Secure` flag (bắt buộc HTTPS)
- ✅ `HttpOnly` flag (không thể đọc bằng JavaScript)
- ✅ `SameSite=Lax` (chống CSRF)

---

## KIỂM TRA BẢO MẬT NÂNG CAO

### ✅ Test 9: Secrets không còn trong code

**Cách làm:**
```bash
# Check wrangler.jsonc không còn chứa secrets
grep -i "jwt_secret\|zalo_bot_token\|mmtb_auto_login_password" wrangler.jsonc
```

**Kết quả mong đợi:**
- ✅ **ĐÚNG**: Không tìm thấy gì (No matches found)
- ❌ **SAI**: Vẫn thấy các secrets

---

### ✅ Test 10: Secrets đã được thêm vào Cloudflare

**Cách làm:**
```bash
wrangler secret list
```

**Kết quả mong đợi:**
```
[
  {
    "name": "JWT_SECRET",
    "type": "secret_text"
  },
  {
    "name": "ZALO_BOT_TOKEN",
    "type": "secret_text"
  },
  ...
]
```

---

### ✅ Test 11: IDOR Protection (Đang develop)

**Cách làm:**
```bash
# User A tạo task với id=TASK-001
# User B (không phải owner) cố gắng xóa:
curl -X DELETE "https://vpchuoiskechers.tbsgroup2026.workers.dev/api/tasks/TASK-001" \
  -H "Authorization: Bearer [USER_B_TOKEN]"
```

**Kết quả mong đợi:**
```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "Bạn không có quyền xóa task này"
}
```

**HTTP Status Code:** `403`

**⚠️ LƯU Ý:** Test này sẽ PASS sau khi sửa IDOR vulnerabilities (đang trong TODO)

---

## CHECKLIST TỔNG HỢP

| # | Test | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Truy cập ẩn danh | ⬜ Chưa test | Phải hiện trang login |
| 2 | Logout hoàn toàn | ⬜ Chưa test | Phải đăng nhập lại |
| 3 | 2 thiết bị riêng biệt | ⬜ Chưa test | Không share session |
| 4 | API không có token → 401 | ⬜ Chưa test | |
| 5 | Response có Cache-Control | ⬜ Chưa test | |
| 6 | Token không hợp lệ → 401 | ⬜ Chưa test | |
| 7 | Token cũ → 401 | ⬜ Chưa test | |
| 8 | Cookie có Secure/HttpOnly | ⬜ Chưa test | |
| 9 | Secrets không trong code | ⬜ Chưa test | |
| 10 | Secrets ở Cloudflare | ⬜ Chưa test | |
| 11 | IDOR Protection | ⬜ Skip | Chưa implement |

---

## NẾU CÓ VẤN ĐỀ

### ❌ Vẫn tự động đăng nhập

**Nguyên nhân có thể:**
1. Cloudflare cache chưa được purge
2. Browser cache chưa được clear
3. Code chưa được deploy đúng

**Cách khắc phục:**
```bash
# 1. Purge Cloudflare cache
# Vào Dashboard → Caching → Purge Everything

# 2. Clear browser cache
# Chrome: Ctrl+Shift+Del → Select "All time" → Clear

# 3. Verify deployment
wrangler deployments list
# Check xem deployment mới nhất có timestamp gần đây không

# 4. Check worker logs
wrangler tail
# Gọi API và xem logs có chạy code mới không
```

---

### ❌ API trả về 500 Internal Error

**Cách debug:**
```bash
# Xem logs real-time
wrangler tail

# Hoặc xem logs trên Dashboard
# Cloudflare Dashboard → Workers → vpchuoiskechers → Logs
```

---

### ❌ Không thể đăng nhập

**Nguyên nhân có thể:**
1. JWT_SECRET chưa được set trong Cloudflare Secrets
2. Database connection issues
3. Token generation bị lỗi

**Cách khắc phục:**
```bash
# Verify secrets
wrangler secret list

# Check JWT_SECRET có trong list không?
# Nếu không:
wrangler secret put JWT_SECRET
```

---

## LIÊN HỆ HỖ TRỢ

**Nếu gặp bất kỳ vấn đề nào:**

1. Check logs: `wrangler tail`
2. Check deployment: `wrangler deployments list`
3. Check secrets: `wrangler secret list`
4. Rollback nếu cần: `wrangler rollback`

**Hoặc xem hướng dẫn chi tiết trong:**
- `SECURITY_REPORT.md` (Phần 5: Kết quả kiểm thử)
- `DEPLOY_CHECKLIST.md` (Troubleshooting section)

---

**Thời gian kiểm tra ước tính:** 15-20 phút cho tất cả tests cơ bản
