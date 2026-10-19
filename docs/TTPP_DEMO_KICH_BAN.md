# Kịch bản thuyết trình DEMO – Kế hoạch chuẩn bị & Trung tâm phân phối

Dành cho người trình bày trước Ban điều hành. Thời lượng gợi ý: 15–20 phút.

## Chuẩn bị

- Link: `/work?dept=logistics&demo=1` (không cần đăng nhập). Người đã đăng nhập cũng mở được trong `/work`, mục "Kế hoạch chuẩn bị và trung tâm phân phối".
- Dữ liệu hoàn toàn giả lập, chỉ lưu trên trình duyệt đang mở. Mỗi máy có dữ liệu riêng; thao tác trên máy này không hiện ở máy khác.
- Trước giờ họp bấm **Reset demo**: dữ liệu về ngày 15/10/2026 (tuần 42, T1 của dự án).
- Màn hình chiếu nên rộng từ 1366px; trên điện thoại vẫn dùng được.

## Thông điệp chính

1. Mỗi bộ phận nhập dữ liệu một lần, tại nguồn; báo cáo lấy tự động, không tổng hợp Excel.
2. Mọi bộ phận thấy tiến độ chung và điểm nghẽn, nhưng chỉ mở được màn hình làm việc của mình.
3. Hạn của từng bước tính ngược từ ngày xuất hàng; quá hạn thì hệ thống tự leo thang 3 cấp.

## Diễn tiến (bấm "Chạy kịch bản demo")

| # | Màn hình / vai | Nói gì | Bấm |
|---|---|---|---|
| 1 | Tiến độ chung · Ban điều hành | 40 đơn, 10 bước, màu trạng thái. Thanh Điểm nghẽn chỉ ra bộ phận đang chặn. Đơn SO-26-0412 (nhãn TOUR) còn 1 ngày đến hạn bàn giao, thiếu Wink → cảnh báo cấp 1. | Mở chi tiết đơn |
| 2 | KD·CN·QC | Kinh doanh giao Wink, bước 1 xong, các bước sau mở khóa. | Giao Wink |
| 3 | KD·CN·QC | Công nghệ giao Rập và định mức trước khi hàng về. | Giao Rập & định mức |
| 4 | Kế hoạch | Phân bổ 4 tuần cuốn chiếu; không ban hành 312 khi chưa phê duyệt. Chỉ ra bảng năng lực chuyền, dời tuần phải ghi lý do. | Phân bổ → phê duyệt → ban hành 312 |
| 5 | Kế hoạch | No Silent: thời hạn chưa có trong tài liệu, demo đặt 5 ngày (nhãn Đề xuất). | Gửi No Silent |
| 6 | Mua hàng | Công cụ tính hạn chót có ví dụ 18/12 → 01/10. Bảng 4 điều kiện; chỉ đơn đủ điều kiện mới được đặt hàng. | Kích hoạt & phát hành PO |
| 7 | Mua hàng | Kế hoạch nhập hàng 4 tuần tự tổng hợp từ PO. | Gửi kế hoạch nhập hàng |
| 8 | Kho | Tua đến 21/10. Hàng nội địa hạn kiểm 3 ngày; đạt thì quét Barcode nhập ô kệ. | Tua đến 21/10 và tiếp nhận |
| 9 | KD·CN·QC | Tua đến 22/10. Lab test 72 giờ, ký màu 2 ngày. Lab không đạt tự lập biên bản cho Mua hàng. | Ký màu và ghi Lab không đạt |
| 10 | Tiến độ chung | Bước 9 chuyển Bị chặn, điểm nghẽn ghi "chờ Mua hàng xử lý hàng không đạt". Màn hình chung không lộ kết quả test chi tiết. | Mở chi tiết đơn |
| 11 | Mua hàng | NCC xác nhận đổi hàng; đếm 2 tuần vẫn chạy. | Chọn phương án Đổi hàng |
| 12 | KD·CN·QC | Tua đến 25/10. Chỉ Kho/QC được đóng sự cố; QC test lại đạt. | Tua đến 25/10 và xác nhận đạt |
| 13 | Kho | Chốt 09:00, sửa lỗi trước 10:00, phát hành trước 11:00; cấp đồng bộ trước ngày may 14 ngày. | Chốt, phát hành và cấp vật tư |
| 14 | Sản xuất | Tổ trưởng xác nhận nhận đủ trong ngày (phạm vi Sản xuất cần xác nhận). | Xác nhận đã nhận |
| 15 | KPI · Ban điều hành | KPI NCC, Mua hàng, Kho, Sản xuất và KPI cá nhân tính từ chính các thao tác trên; chạy thử không thưởng phạt. | Kết thúc |

## Phần tự do (nếu còn thời gian)

- **Đổi vai** ở ô "Xem với vai": vai Mua hàng mở màn hình Kho sẽ thấy khóa (mục 11). Ban điều hành xem mọi màn hình nhưng không sửa.
- **Tua +3 / +7 ngày** trên Tiến độ chung: thêm bước trễ, cảnh báo lên cấp 2, cấp 3.
- **Số hóa → Ngưỡng thời gian**: đổi "Hạn bàn giao No Silent" từ 5 xuống 2 ngày, quay lại Tiến độ chung để thấy hạn và cảnh báo tính lại ngay. Nhấn mạnh các ngưỡng gắn nhãn Đề xuất là phần Ban điều hành cần chốt.
- **Số hóa → biểu mẫu**: chuyển 3 biểu mẫu sang "Đã ký duyệt", tiến độ Pha 1 trên Gantt tăng theo (điều kiện mốc M1).
- **Kho → Quét tiếp** các khu ô kệ: tiến độ Pha 2 tăng.

## Câu hỏi nên xin quyết định ngay trong buổi họp

1. Số ngày "đúng thời hạn" bàn giao No Silent.
2. Ngưỡng sai lệch tồn kho (đề xuất ≤ 2%) và các mốc leo thang (cấp 1: còn 1 ngày, cấp 3: quá hạn từ 3 ngày).
3. Có cần màn hình riêng cho Sản xuất không.
4. Quyền xem của Số hóa với nội dung nghiệp vụ bộ phận khác.
5. Ngày may trước ngày xuất hàng (demo giả định 7 ngày) để tính ngày cấp vật tư.

## Giả định của bản demo (cần nói rõ nếu được hỏi)

- Ngày may = ngày xuất hàng − 7 ngày (chỉnh được). Với công thức gốc, nếu không có giả định này thì hạn hàng về trùng đúng hạn cấp vật tư, không còn thời gian kiểm hàng và QC.
- Bước 6 (Đặt hàng) chờ cả Kế hoạch 312 (bước 4), theo flowchart mục 7.2.
- Năng lực chuyền 9.000 đôi/tuần, 3 nhà máy × 4 chuyền; số liệu mẫu.
- Một số chỉ số KPI chưa có nguồn dữ liệu trong demo dùng số mẫu và được ghi "(số mẫu)".
