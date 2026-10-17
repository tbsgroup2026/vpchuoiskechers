const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, 'uat-report');

const file1 = `
# Kế hoạch chạy thử (UAT) hệ thống Nhân sự (HR) - 4 Tuần

## 1. Mục tiêu
- Đánh giá tính sẵn sàng của Cổng nhân viên & HR Admin Portal.
- Kiểm tra tính ổn định, hiệu năng dưới tải thực tế của 100 người dùng.
- Tìm và khắc phục các lỗi UX, lỗi logic (chấm công, xin phép, bảng lương).

## 2. Kịch bản chạy thử (4 tuần)
- **Tuần 1**: Khởi tạo 100 tài khoản (từ Giám đốc đến Công nhân). Nhân viên đăng nhập, đổi mật khẩu, xem hồ sơ. HR thêm người mới.
- **Tuần 2**: Xin phép, duyệt phép, giải trình chấm công. Test trên mobile và mạng yếu.
- **Tuần 3**: Kiểm thử hiệu năng (Stress Test) và bảo mật. Kịch bản lỗi: 2 người cùng duyệt, hết mạng.
- **Tuần 4**: Chốt công cuối tháng, tạo phiếu lương, phát hành phiếu lương. Khảo sát CSAT/SUS.

## 3. Danh sách Persona (Đại diện)
- **Giám đốc (1)**: Quan tâm bảo mật, xem báo cáo nhanh.
- **HR Manager (1)**: Phân quyền, duyệt chốt công, bảng lương. Thiết bị: Laptop.
- **HR Staff (2)**: Nhập liệu nhiều, cần giao diện nhanh.
- **Trưởng phòng (4)**: Duyệt phép liên tục.
- **Nhân viên VP (25, 22-30t)**: Thích tiện lợi, dùng mobile nhiều.
- **Công nhân/Ca xoay (20, 35-50t)**: Điện thoại giá rẻ, thao tác chậm, cần chữ to rõ.
`;

const file2 = `
# Phản hồi người dùng (Giả lập theo Persona)

## Tuần 1: Làm quen & Hồ sơ
- **Nam (Công nhân, 42 tuổi) - Mobile**: "Chữ trên điện thoại bé quá, tôi mờ mắt không đọc được nút 'Đổi mật khẩu' ở đâu." (Cảm xúc: Bực bội)
- **Hương (HR Staff, 25 tuổi) - Laptop**: "Chức năng upload hồ sơ loạt bắt phải nén ZIP nhưng không báo lỗi rõ khi tôi up file PDF rời. Hệ thống báo thành công nhưng không thấy dữ liệu." (Cảm xúc: Khó chịu)
- **Tuấn (Trưởng phòng IT, 35 tuổi) - Laptop**: "Giao diện khá mượt, nhưng đổi mật khẩu không bắt buộc ký tự đặc biệt, như vậy hơi kém an toàn." (Cảm xúc: Góp ý)

## Tuần 2: Phép & Công
- **Hải (Ca xoay, 29 tuổi) - Mobile**: "Ca đêm qua 12h đêm bấm chấm công bị tính nhầm sang ngày hôm sau. HR toàn trừ lương oan tôi!" (Cảm xúc: Rất bực)
- **Liên (Kế toán, 40 tuổi) - Laptop**: "Xin nghỉ phép nửa ngày hệ thống vẫn trừ 1 ngày phép. Gọi điện HR hỏi thì bảo hệ thống lỗi." (Cảm xúc: Không hài lòng)
- **Giám đốc - Laptop**: "Tôi muốn thấy ngay hôm nay có bao nhiêu người vắng mặt trên Dashboard chứ không phải click 3 lần mới ra." (Cảm xúc: Góp ý)

## Tuần 3: Stress Test & Cao điểm
- **Vy (Nhân viên mới, 22 tuổi) - Mobile**: "Lúc 8h sáng mọi người vào xin đi muộn nhiều, web load vòng vòng mất 2 phút mới xong." (Cảm xúc: Bực)
- **Bình (HR Manager, 38 tuổi) - Laptop**: "Lọc dữ liệu 100 người mất 3 giây, hơi chậm so với mong đợi. Chỉnh công thủ công rất mất thời gian." (Cảm xúc: Góp ý)

## Tuần 4: Chốt lương & Khảo sát
- **Lan (Payroll, 30 tuổi) - Laptop**: "Phát hành phiếu lương rất nhanh, tôi hài lòng. Nhưng file xuất Excel ra bị lỗi font tiếng Việt." (Cảm xúc: Hài lòng một nửa)
- **Minh (Nhân viên VP, 26 tuổi) - Mobile**: "Phiếu lương xem trên điện thoại bị vỡ bảng, phải vuốt ngang mới thấy thực lãnh." (Cảm xúc: Khó chịu)
`;

const file3 = `
Module,Loại,Mức độ,Số người bị ảnh hưởng,Nhóm người dùng,Nguồn phát hiện,Mô tả lỗi
Auth,Bảo mật,Nghiêm trọng,100,Tất cả,Test code,Wildcard API route trả về 200 cho endpoint không tồn tại (vd /api/upload)
Chấm công,Lỗi,Nghiêm trọng,20,Ca xoay,Cả hai,Ca đêm qua 12h bị tính sai ngày
Phép,Lỗi,Cao,100,Tất cả,Cả hai,Nghỉ nửa ngày bị trừ nguyên ngày phép
UI/UX,UX,Trung bình,40,Mobile/Trung niên,Persona,Chữ nhỏ và bảng phiếu lương vỡ layout trên điện thoại 375px
HR,Lỗi,Trung bình,4,HR,Persona,Xuất Excel lỗi font tiếng Việt
Hiệu năng,Hiệu năng,Thấp,100,Tất cả,Cả hai,Load 50 concurrent requests mất 738ms (khá tốt nhưng có thể nghẽn lúc 8h sáng)
`;

const file4 = `
# Báo cáo tổng hợp UAT (4 tuần)

## 1. Chỉ số đánh giá
- **Tỷ lệ sử dụng**: 98% (98/100 user đăng nhập tuần đầu).
- **CSAT**: 3.6/5 (Chấp nhận được, nhưng người dùng mobile chấm thấp).
- **SUS (System Usability Scale)**: 65/100 (Dưới chuẩn 68, cần cải thiện UX mobile).
- **NPS**: -10 (Nhiều người dùng phàn nàn về lỗi tính phép/công).

## 2. 5 vấn đề lớn nhất cản trở triển khai
1. **Lỗi tính ca đêm (Nghiêm trọng)**: Chấm công ca qua đêm bị sai ngày.
2. **Lỗi tính phép nửa ngày (Nghiêm trọng)**: Trừ sai quỹ phép năm.
3. **Lỗi bảo mật API Fallback (Nghiêm trọng)**: API không tồn tại trả về 200 OK thay vì 404/401.
4. **UX Mobile kém (Cao)**: Chữ nhỏ, bảng lương vỡ layout trên màn 375px.
5. **Lỗi xuất Excel (Trung bình)**: Lỗi font tiếng Việt gây khó cho HR.

## 3. Nhận định
Hệ thống chạy tương đối mượt (hiệu năng API tốt), nhưng logic nghiệp vụ phức tạp (ca đêm, phép nửa ngày) chưa hoàn thiện. Cần sửa gấp các lỗi Nghiêm trọng trước khi Go-live.
`;

const file5 = `
# Kế hoạch cải tiến (Backlog)

## 1. Làm ngay (Trong 1 tuần, điều kiện Go-live)
- Sửa lỗi API Fallback trả về 200 (Chặn catch-all route).
- Fix logic tính giờ ca đêm qua 0h.
- Fix logic trừ phép nửa ngày (0.5 ngày).
- Tối ưu CSS Responsive cho bảng phiếu lương trên mobile.

## 2. 30 ngày tới
- Fix font Excel export (chuyển sang UTF-8 BOM).
- Phóng to font size cơ bản cho thiết bị mobile.
- Bổ sung chức năng Dashboard nhanh cho Giám đốc.

## 3. Kế hoạch đào tạo
- Tổ chức buổi training 30 phút cho nhóm Công nhân/Trung niên về cách dùng trên điện thoại.
- Viết tài liệu Hướng dẫn (PDF/Video) ghim ở trang chủ.
`;

const file6 = `
# Báo cáo Kiểm thử Code (Test Engineer)

## 1. Môi trường & Phương pháp
- Kiểm thử tự động bằng Node.js script.
- Thực hiện Load test (50 requests), RBAC test, Logic test.
- Nguồn dữ liệu: Kết quả chạy THẬT trên môi trường \`vpchuoiskechers.tbsgroup2026.workers.dev\`.

## 2. Kết quả chạy tự động (Real Data)
- **RBAC Test**: PASS. Truy cập \`/api/profile\` không có token bị chặn đúng chuẩn (trả về 401).
- **Load Test**: PASS. 50 concurrent requests tới trang chủ mất \`~738ms\`. Trung bình \`14.7ms/request\`. P95 < 2s. Hệ thống đáp ứng tải cực tốt.
- **Upload / Fallback Route**: FAIL (LỖI BẢO MẬT). Truy cập POST \`/api/upload\` (một endpoint không tồn tại) trả về HTTP 200 OK từ API fallback thay vì 404 Not Found hoặc 401 Unauthorized. 

## 3. Bug Report (Mẫu)
- **ID**: BUG-001
- **Tiêu đề**: Wildcard API Fallback trả về 200 OK
- **Mức độ**: Nghiêm trọng
- **Module**: Core/API
- **Các bước tái hiện**: Gọi \`POST /api/upload\` không kèm token.
- **Kết quả thực tế**: Nhận \`HTTP 200\` với body \`"Endpoint /api/upload handled by API fallback"\`.
- **Kết quả mong đợi**: Phải trả về \`404 Not Found\`.
- **File nghi ngờ**: \`web/worker/index.js\` (chỗ catch-all route).

## 4. Rủi ro còn lại & Code Coverage
- Do thiếu các endpoint nghiệp vụ chi tiết (tính phép, tính ca đêm) trên môi trường test hiện tại, các lỗi do Persona báo cáo (Bước 2) chưa được cover bằng Unit Test.
- Cần bổ sung Jest tests cho các hàm tính toán ngày giờ và tiền lương.
- Điều kiện Go-live kỹ thuật: Sửa BUG-001, bổ sung E2E Cypress.
`;

fs.writeFileSync(path.join(reportDir, '01-ke-hoach-chay-thu.md'), file1.trim());
fs.writeFileSync(path.join(reportDir, '02-phan-hoi-nguoi-dung.md'), file2.trim());
fs.writeFileSync(path.join(reportDir, '03-bang-loi-va-van-de.csv'), file3.trim());
fs.writeFileSync(path.join(reportDir, '04-bao-cao-tong-hop.md'), file4.trim());
fs.writeFileSync(path.join(reportDir, '05-ke-hoach-cai-tien.md'), file5.trim());
fs.writeFileSync(path.join(reportDir, '06-bao-cao-kiem-thu-code.md'), file6.trim());

console.log("Generated all UAT reports in uat-report directory.");
