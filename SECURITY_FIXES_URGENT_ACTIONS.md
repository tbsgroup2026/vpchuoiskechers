# 🚨 HÀNH ĐỘNG KHẨN CẤP - SECURITY FIXES

## ⚠️ ĐỌC NGAY! NGUYÊN NHÂN TỰ ĐỘNG ĐĂNG NHẬP

Web của bạn đang bị lỗ hổng bảo mật NGHIÊM TRỌNG:

**Bất kỳ ai mở link đều TỰ ĐỘNG vào tài khoản admin (202608001) mà KHÔNG CẦN đăng nhập!**

### Nguyên nhân:
Hàm `parseSessionWorker()` trong `web/worker/index.js` trả về tài khoản admin mặc định khi token = null.

---

## ✅ ĐÃ SỬA (Tự động)

Các lỗ hổng sau đã được sửa trong code:

1. ✅ **parseSessionWorker()** - Giờ trả về NULL thay vì admin
2. ✅ **/api/auth/me** - Reject null sessions 
3. ✅ **Token generation** - Thêm random component
4. ✅ **Cache headers** - Thêm no-store, private cho sensitive data
5. ✅ **Cookie security** - Thêm HttpOnly, Secure flags

---

## 🔴 PHẢI LÀM NGAY (5-10 phút)

### Bước 1: Deploy code đã sửa

```bash
cd "d:\Work\TBS II"

# Build Next.js
npm run build

# Deploy lên Cloudflare
wrangler deploy
```

**Kết quả mong đợi:**
- Web sẽ KHÔNG còn tự động đăng nhập
- User phải đăng nhập thủ công

---

### Bước 2: Xóa secrets khỏi wrangler.jsonc

**File:** `wrangler.jsonc`

**Xóa các dòng sau:**
```jsonc
"JWT_SECRET": "tbs_ii_secure_jwt_secret_key_2026",
"ZALO_BOT_TOKEN": "2083301284890293167:...",
"MMTB_AUTO_LOGIN_PASSWORD": "123456",
"GDRIVE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n..."
```

**Chỉ giữ lại:**
```jsonc
{
  "vars": {
    "SITE_ID": "vpchuoiskechers",
    "CLOUDINARY_FOLDER": "vpchuoiskechers",
    "NEXT_PUBLIC_APP_URL": "https://vpchuoiskechers.tbsgroup2026.workers.dev",
    "VAPID_PUBLIC_KEY": "BO2jk...",
    "VAPID_CONTACT": "mailto:admin@tbsgroup.vn",
    "GDRIVE_CLIENT_EMAIL": "tbs-backup-sa@photocloudapp-465001.iam.gserviceaccount.com"
  }
}
```

---

### Bước 3: Tạo secrets mới

```bash
# 1. Tạo JWT_SECRET mới
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Copy output

# 2. Add to Cloudflare Secrets
wrangler secret put JWT_SECRET
# Paste giá trị vừa copy, Enter
```

---

### Bước 4: Kiểm tra web đã an toàn chưa

**Test 1: Truy cập ẩn danh**
```
1. Mở trình duyệt ẩn danh (Ctrl+Shift+N)
2. Truy cập https://vpchuoiskechers.tbsgroup2026.workers.dev
3. ✅ PHẢI hiện trang đăng nhập, KHÔNG tự động vào tài khoản
```

**Test 2: API không có token**
```bash
curl https://vpchuoiskechers.tbsgroup2026.workers.dev/api/auth/me

# ✅ PHẢI trả về:
# {"success":false,"error":"UNAUTHORIZED",...}
```

---

## 🟠 LÀM SAU (trong 24h)

### 1. Đổi Zalo Bot Token

**Cách làm:**
```
1. Vào https://developers.zalo.me
2. Chọn app "TBS Group Bot"
3. Settings → Regenerate Token
4. Copy token mới
5. Chạy: wrangler secret put ZALO_BOT_TOKEN
6. Paste token mới
```

---

### 2. Đổi Google Drive Private Key

**Cách làm:**
```
1. Vào https://console.cloud.google.com
2. IAM & Admin → Service Accounts
3. Chọn tbs-backup-sa@...
4. Keys → Add Key → Create New Key → JSON
5. Download file, copy "private_key"
6. Chạy: wrangler secret put GDRIVE_PRIVATE_KEY
7. Paste private key (bao gồm -----BEGIN PRIVATE KEY-----)
```

---

### 3. Đổi MMTB Password

**Cách làm:**
```bash
# Đổi password trong database cho user AMDKG
# Sau đó:
wrangler secret put MMTB_AUTO_LOGIN_PASSWORD
# Nhập password mới (tối thiểu 12 ký tự, có chữ hoa, số, ký tự đặc biệt)
```

---

## 📊 CHECK STATUS

### ✅ Đã hoàn thành:
- [x] Sửa code parseSessionWorker
- [x] Thêm security headers
- [x] Cải thiện token generation
- [x] Viết báo cáo đầy đủ (SECURITY_REPORT.md)

### ⏳ Đang chờ bạn:
- [ ] Deploy code mới
- [ ] Xóa secrets khỏi wrangler.jsonc
- [ ] Tạo JWT_SECRET mới
- [ ] Test web đã an toàn
- [ ] Đổi Zalo Bot Token
- [ ] Đổi Google Drive Key
- [ ] Đổi MMTB Password

---

## 📞 HỖ TRỢ

**Nếu gặp vấn đề:**

1. **Deploy fail?**
   ```bash
   # Check logs
   wrangler tail
   
   # Rollback nếu cần
   wrangler rollback
   ```

2. **Không tạo được secret?**
   ```bash
   # Login lại
   wrangler login
   
   # Thử lại
   wrangler secret put JWT_SECRET
   ```

3. **Web vẫn tự động đăng nhập?**
   - Clear cache trình duyệt (Ctrl+Shift+Del)
   - Thử trình duyệt ẩn danh
   - Check Cloudflare cache: Purge Everything

---

## 🔥 QUAN TRỌNG

**SAU KHI DEPLOY CODE MỚI:**

1. **TẤT CẢ users sẽ bị logout** - Đây là bình thường và cần thiết
2. **Users phải đăng nhập lại** - Với empCode và password
3. **Thông báo cho team** - Để họ biết cần login lại

---

## 📋 Đọc thêm

Chi tiết đầy đủ trong: **SECURITY_REPORT.md**

- Danh sách tất cả 13 lỗ hổng
- Cách khai thác từng lỗ hổng
- Code trước/sau khi sửa
- Khuyến nghị bảo mật dài hạn
