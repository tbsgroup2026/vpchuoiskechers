# DANH MỤC CÁC HẠNG MỤC CẦN CON NGƯỜI XỬ LÝ (OPEN ITEMS & ACTION ITEMS)

**Dự án**: Hệ thống Quản trị Vận Hành Chuỗi Cung Ứng & Sản Xuất SKECHERS - TBS Group  
**Người thực hiện**: Senior QA / Test Architect (Độc lập)  
**Ngày thực hiện**: 12/10/2026  
**Nhánh kiểm thử**: `fix/qa-step1-findings`  

---

## 1. HÀNH ĐỘNG KHẨN CẤP VỀ AN TOÀN BẢO MẬT (SECURITY ESCALATIONS)

> [!CAUTION]
> **Toàn bộ các khóa bí mật dưới đây ĐÃ BỊ COMMIT vào lịch sử Git (`git log`). Chúng bắt buộc phải được coi là ĐÃ BỊ LỘ và phải được thu hồi, xoay vòng ngay lập tức!**

1. **Google Cloud Service Account Key (`GDRIVE_PRIVATE_KEY`)**:
   - **Tài khoản**: `tbs-backup-sa@photocloudapp-465001.iam.gserviceaccount.com`
   - **Vị trí lộ**: `gdrive-key.json`, `web/worker/index.js`, `web/out/_worker.js`, `put_secrets.js`.
   - **Hành động con người bắt buộc**:
     1. Truy cập [Google Cloud Console](https://console.cloud.google.com/) -> IAM & Admin -> Service Accounts.
     2. Tìm service account `tbs-backup-sa` và **XÓA KHÓA CŨ (Revoke Key ID)**.
     3. Tạo Khóa mới (Create new JSON key).
     4. Nạp khóa mới vào Cloudflare Secret qua lệnh: `wrangler secret put GDRIVE_PRIVATE_KEY`.
     5. Cập nhật quyền thư mục Google Drive cho email service account mới nếu có thay đổi.

2. **Firebase Cloud Messaging Service Account Key (`FIREBASE_PRIVATE_KEY`)**:
   - **Vị trí lộ**: `web/firebase-service-account.json`.
   - **Hành động con người bắt buộc**:
     1. Truy cập [Firebase Console](https://console.firebase.google.com/) -> Project Settings -> Service Accounts.
     2. Tạo khóa Private Key mới và thu hồi khóa cũ.
     3. Nạp vào Cloudflare Secret qua `wrangler secret put FIREBASE_PRIVATE_KEY`.

3. **JWT Secret (`JWT_SECRET`)**:
   - **Vị trí lộ**: Hardcoded trong `put_secrets.js`, `test-worker.ts`, `web/server.js`.
   - **Hành động con người bắt buộc**:
     1. Sinh chuỗi ngẫu nhiên có độ dài tối thiểu 64 ký tự (ví dụ bằng `openssl rand -base64 48`).
     2. Cập nhật secret: `wrangler secret put JWT_SECRET`.
     3. Cập nhật secret trên môi trường Staging: `wrangler secret put JWT_SECRET --env staging`.

4. **Làm sạch lịch sử Git (Git History Scrubbing)**:
   - Sử dụng công cụ `git-filter-repo` hoặc BFG Repo-Cleaner để loại bỏ vĩnh viễn các tệp `gdrive-key.json`, `firebase-service-account.json`, và chuỗi private key khỏi commit history trước khi merge vào nhánh `main`.

---

## 2. CÂU HỎI CẦN STAKEHOLDER / PRODUCT OWNER XÁC NHẬN

1. **Chính sách phân quyền theo Nhà máy (Factory Data Scoping)**:
   - *Câu hỏi*: Đối với các vị trí Cán bộ quản lý (Trưởng phòng/Phó phòng), phạm vi dữ liệu họ được xem là:
     - Toàn bộ chuỗi cung ứng (tất cả các nhà máy)?
     - Hay chỉ giới hạn trong các nhà máy họ được phân công phụ trách trong bảng `user_factory_access`?
   - *Lý do*: Hiện tại trong hệ thống chưa có quy định rõ ràng trong bảng phân quyền, dẫn đến API trả về toàn bộ dữ liệu hoặc không lọc được.

2. **Quy trình duyệt đề xuất sáng kiến Kaizen (Workflow Stages)**:
   - *Câu hỏi*: Khi một sáng kiến Kaizen được gửi lên, Trưởng bộ phận có được phép duyệt tắt lên trạng thái `HOAN_THANH` (Final Approval) hay bắt buộc phải qua 2 bước (Trưởng bộ phận sơ duyệt -> Ban Giám khảo/Hội đồng CI đánh giá chấm điểm)?
   - *Lý do*: Cần chốt quy trình để triển khai State Machine Guard trong backend chặn nhảy bước.

3. **Chính sách khóa tài khoản khi đăng nhập sai (Account Lockout Policy)**:
   - *Câu hỏi*: Sau 10 lần nhập sai mật khẩu liên tiếp, tài khoản nhân viên nên:
     - Bị khoá tạm thời trong 15 phút hay 30 phút?
     - Hay bắt buộc phải liên hệ Quản trị viên (Admin/IT) mở khoá thủ công?

---

## 3. THAO TÁC TRIỂN KHAI VÀ DEPLOY (DEPLOYMENT CHECKLIST)

1. **Chuẩn bị Secrets trên Cloudflare Dashboard / CLI**:
   - Đảm bảo các biến sau đã được set qua `wrangler secret put`:
     - `JWT_SECRET`
     - `GDRIVE_PRIVATE_KEY`
     - `FIREBASE_PRIVATE_KEY`
     - `ZALO_APP_SECRET`
     - `CLOUDINARY_API_SECRET` (nếu còn dùng)

2. **Thực thi Migration D1 an toàn**:
   - Chạy các migration mới có chứa `IF NOT EXISTS` và không chứa lệnh `DROP TABLE`.
   - Lệnh áp dụng local: `npx wrangler d1 migrations apply DB --local`.
   - Lệnh áp dụng staging: `npx wrangler d1 migrations apply DB --remote --env staging`.
   - Lệnh áp dụng production: `npx wrangler d1 migrations apply DB --remote`.

3. **Cấu hình Git Ignore**:
   - Thêm vào `.gitignore`:
     ```gitignore
     *.json.key
     gdrive-key.json
     firebase-service-account.json
     .staging-credentials.json
     web/out/
     ```
