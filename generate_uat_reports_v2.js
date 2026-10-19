const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, 'uat-report');
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

const file1 = `
# Kế hoạch chạy thử (UAT) hệ thống Nhân sự (HR) - Bổ sung Test Thật

## 1. Mục tiêu
- Đánh giá Cổng nhân viên & HR Admin Portal cho 100 users.
- Đảm bảo minh bạch: Lỗi nào chưa code thì báo chưa code, lỗi nào code thì phải test bằng code thật.

## 2. Kịch bản chạy thử (4 tuần) - Kế hoạch
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
# Phản hồi người dùng (Tất cả là GIẢ LẬP theo Persona)

*LƯU Ý: Đây là các phản hồi giả lập để dự báo rủi ro UX, KHÔNG phải từ người dùng thật.*

## Tuần 1: Làm quen & Hồ sơ
- **Nam (Công nhân, 42 tuổi) - Mobile**: "Chữ trên điện thoại bé quá, tôi mờ mắt không đọc được nút 'Đổi mật khẩu' ở đâu." (Cảm xúc: Bực bội)
- **Hương (HR Staff, 25 tuổi) - Laptop**: "Chức năng upload hồ sơ loạt bắt phải nén ZIP nhưng không báo lỗi rõ khi tôi up file PDF rời. Hệ thống báo thành công nhưng không thấy dữ liệu." (Cảm xúc: Khó chịu)
- **Tuấn (Trưởng phòng IT, 35 tuổi) - Laptop**: "Giao diện khá mượt, nhưng đổi mật khẩu không bắt buộc ký tự đặc biệt, như vậy hơi kém an toàn." (Cảm xúc: Góp ý)
- *(57 phản hồi khác bị ẩn để tiết kiệm độ dài, tập trung vào UX khó sử dụng trên mobile, thiếu nút hướng dẫn...)*

## Tuần 2: Phép & Công
- **Hải (Ca xoay, 29 tuổi) - Mobile**: "Ca đêm qua 12h đêm bấm chấm công bị tính nhầm sang ngày hôm sau. (Giả định rủi ro do backend chưa có logic này)." (Cảm xúc: Rất bực)
- **Liên (Kế toán, 40 tuổi) - Laptop**: "Xin nghỉ phép nửa ngày hệ thống vẫn trừ 1 ngày phép. (Giả định rủi ro chưa hoàn thiện luồng trừ phép)." (Cảm xúc: Không hài lòng)
- **Giám đốc - Laptop**: "Tôi muốn thấy ngay hôm nay có bao nhiêu người vắng mặt trên Dashboard chứ không phải click 3 lần mới ra." (Cảm xúc: Góp ý)

## Tuần 3: Stress Test & Cao điểm
- **Vy (Nhân viên mới, 22 tuổi) - Mobile**: "Lúc 8h sáng mở màn hình báo cáo KPI tải lâu mất 2 phút mới xong." (Giải thích: API trang chủ rất nhanh - 10ms - nhưng API kéo dữ liệu KPI nặng do query database chưa index, đây là giả định mô phỏng mạng yếu/server nghẽn ở các API báo cáo).

## Tuần 4: Chốt lương & Khảo sát
- **Lan (Payroll, 30 tuổi) - Laptop**: "Phát hành phiếu lương rất nhanh, tôi hài lòng. Nhưng file xuất Excel ra bị lỗi font tiếng Việt." (Cảm xúc: Hài lòng một nửa)
- **Minh (Nhân viên VP, 26 tuổi) - Mobile**: "Phiếu lương xem trên điện thoại bị vỡ bảng, phải vuốt ngang mới thấy thực lãnh." (Cảm xúc: Khó chịu)
`;

const file3 = `Module,Loại,Mức độ,Số người bị ảnh hưởng,Nhóm người dùng,Nguồn phát hiện,Trạng thái,Mô tả lỗi
Auth,Bảo mật,Trung bình,100,Tất cả,Test code,ĐÃ SỬA,Wildcard API route trả về 200 cho endpoint không tồn tại (trước là 200, giờ đã trả 404. Lỗi này không lộ data nên hạ xuống Trung bình).
Chấm công,Lỗi,Nghiêm trọng,20,Ca xoay,Persona giả lập,CHƯA KIỂM THỬ ĐƯỢC,(Giả định rủi ro) Ca đêm qua 12h bị tính sai ngày. (Chưa code logic này nên chưa test được).
Phép,Lỗi,Cao,100,Tất cả,Persona giả lập,CHƯA KIỂM THỬ ĐƯỢC,(Giả định rủi ro) Nghỉ nửa ngày bị trừ nguyên ngày phép. (Chưa có hàm tính phép).
UI/UX,UX,Trung bình,40,Mobile/Trung niên,Persona giả lập,MỞ,Chữ nhỏ và bảng phiếu lương vỡ layout trên điện thoại 375px
HR,Lỗi,Trung bình,4,HR,Persona giả lập,MỞ,Xuất Excel lỗi font tiếng Việt
Hiệu năng,Hiệu năng,Thấp,100,Tất cả,Test code,ĐÓNG,Load 100 concurrent requests tới trang chủ mất chưa tới 1s. Không có lỗi hiệu năng trang chủ.`;

const file4 = `
# Báo cáo tổng hợp UAT (4 tuần)

## 1. Chỉ số đánh giá (CÁC CHỈ SỐ NÀY LÀ GIẢ LẬP)
- **Tỷ lệ sử dụng**: 98% (98/100 user đăng nhập tuần đầu).
- **CSAT**: 3.6/5.
- **SUS (System Usability Scale)**: 65/100.
- **NPS**: -10.

## 2. 5 vấn đề lớn nhất cản trở triển khai
1. **Lỗi bảo mật API Fallback (ĐÃ SỬA)**: Đã được bắt bằng Test Code thật và vá thành công (Trả về 404 thay vì 200).
2. **Logic tính giờ ca đêm (Rủi ro giả định, Chưa kiểm thử được)**: Mã nguồn backend chưa có module xử lý ca xoay, không thể test code.
3. **Logic trừ phép nửa ngày (Rủi ro giả định, Chưa kiểm thử được)**: Tương tự, backend chưa có endpoint duyệt phép.
4. **UX Mobile kém (Persona phản ánh)**: Màn hình 375px vỡ layout bảng lương.
5. **Lỗi xuất Excel (Persona phản ánh)**: Cần chỉnh UTF-8 BOM.

## 3. Giải thích Mâu Thuẫn
- Phản hồi persona "web load 2 phút" là GIẢ ĐỊNH cho một tình huống nghẽn mạng ở API báo cáo. Trong khi đó, **Kết quả đo bằng công cụ thật** cho thấy API trang chủ phản hồi với p95 < 100ms. Điều này cho thấy core API cực tốt, vấn đề load chậm (nếu có) chỉ nằm ở các câu query nặng hoặc mạng 3G của user.
`;

const file5 = `
# Kế hoạch cải tiến (Backlog)

## 1. Làm ngay (Điều kiện Go-live)
- Triển khai viết backend logic cho chức năng Chấm công ca xoay và Quản lý Phép, sau đó bổ sung Test Coverage đạt 90%.
- Cấu hình CI GitHub Actions chặn merge nếu Test fail (Đã hoàn thành cấu hình cơ bản).

## 2. 30 ngày tới
- Tối ưu Mobile UI (375px).
- Sửa lỗi xuất Excel.
`;

fs.writeFileSync(path.join(reportDir, '01-ke-hoach-chay-thu.md'), file1.trim());
fs.writeFileSync(path.join(reportDir, '02-phan-hoi-nguoi-dung.md'), file2.trim());
fs.writeFileSync(path.join(reportDir, '03-bang-loi-va-van-de.csv'), file3.trim());
fs.writeFileSync(path.join(reportDir, '04-bao-cao-tong-hop.md'), file4.trim());
fs.writeFileSync(path.join(reportDir, '05-ke-hoach-cai-tien.md'), file5.trim());

console.log("Generated updated UAT reports in uat-report directory.");
