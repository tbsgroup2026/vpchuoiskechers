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