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