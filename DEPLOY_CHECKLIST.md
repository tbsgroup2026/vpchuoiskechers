# ✅ CHECKLIST DEPLOY BẢO MẬT

## Đã hoàn thành ✅

- [x] **Phân tích lỗ hổng**: Tìm được 13 lỗ hổng bảo mật
- [x] **Sửa code Critical**: parseSessionWorker, /api/auth/me, token generation
- [x] **Build Next.js**: Thành công (232 pages)
- [x] **Viết báo cáo**: SECURITY_REPORT.md (chi tiết đầy đủ)

## Cần làm NGAY (5 phút) 🔴

### 1. Deploy code đã sửa
```bash
wrangler deploy
```

### 2. Test ngay sau deploy
**Mở trình duyệt ẩn danh:**
- URL: https://vpchuoiskechers.tbsgroup2026.workers.dev
- **Mong đợi**: Hiện trang login, KHÔNG tự động vào tài khoản
- **Nếu vẫn tự động đăng nhập**: Clear Cloudflare cache

**Test API:**
```bash
curl https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/me
# Mong đợi: {"success":false,"error":"UNAUTHORIZED"}
```

## Cần làm HÔM NAY (30 phút) 🟠

### 3. Di chuyển secrets khỏi wrangler.jsonc

**File `wrangler.jsonc` - XÓA CÁC DÒNG:**
```jsonc
"JWT_SECRET": "tbs_ii_secure_jwt_secret_key_2026",
"ZALO_BOT_TOKEN": "2083301284890293167:...",
"MMTB_AUTO_LOGIN_PASSWORD": "123456",
"GDRIVE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----..."
```

### 4. Tạo JWT_SECRET mới

```powershell
# Tạo secret mới (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Copy output, sau đó:
wrangler secret put JWT_SECRET
# Paste giá trị vừa tạo, Enter
```

### 5. Deploy lại sau khi xóa secrets
```bash
wrangler deploy
```

## Cần làm TUẦN NÀY 🟡

### 6. Regenerate các API keys bị lộ

**Zalo Bot Token:**
1. https://developers.zalo.me
2. Chọn app → Regenerate Token
3. `wrangler secret put ZALO_BOT_TOKEN`

**Google Drive Key:**
1. https://console.cloud.google.com
2. IAM → Service Accounts → Keys → Add Key
3. `wrangler secret put GDRIVE_PRIVATE_KEY`

**MMTB Password:**
1. Đổi password trong database
2. `wrangler secret put MMTB_AUTO_LOGIN_PASSWORD`

### 7. Review code IDOR

Các file cần sửa thêm:
- `web/worker/index.js` - Tất cả DELETE/PUT/PATCH endpoints
- Thêm ownership check trước khi xóa/sửa

## Ghi nhớ quan trọng 📌

### ✅ Những gì đã được sửa:
1. parseSessionWorker() không còn trả về admin mặc định
2. /api/auth/me reject null sessions đúng cách
3. Token mạnh hơn (thêm random component)
4. Cache headers cho sensitive data
5. Cookie có HttpOnly, Secure flags

### ⚠️ Những gì vẫn cần fix:
1. JWT_SECRET vẫn ở wrangler.jsonc (XÓA NGAY!)
2. Passwords/Keys bị hardcode (XÓA NGAY!)
3. IDOR vulnerabilities (các endpoint DELETE không check ownership)
4. Chưa có rate limiting
5. Chưa có password hashing thật

## Các file quan trọng 📄

- **SECURITY_REPORT.md**: Báo cáo chi tiết 13 lỗ hổng
- **SECURITY_FIXES_URGENT_ACTIONS.md**: Hướng dẫn nhanh
- **web/worker/index.js**: File đã được sửa
- **wrangler.jsonc**: Cần xóa secrets NGAY

## Liên hệ nếu gặp vấn đề

**Deploy fail?**
```bash
wrangler tail  # Xem logs
wrangler rollback  # Rollback nếu cần
```

**Web vẫn tự động login?**
```
1. Purge Cloudflare cache
2. Clear browser cache (Ctrl+Shift+Del)
3. Test trình duyệt ẩn danh
```

**Secret commands fail?**
```bash
wrangler login  # Login lại
wrangler whoami  # Check account
```

---

**NOTE:** Tất cả users sẽ bị logout sau khi deploy - Đây là BÌNH THƯỜNG và CẦN THIẾT cho bảo mật!
