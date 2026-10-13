# -*- coding: utf-8 -*-
"""
Content Builder for Chapter 3 (Analysis & Requirements) and Chapter 4 (System Design).
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from report_core import (
    set_cell_background, set_cell_margins, set_table_borders,
    add_heading_1, add_heading_2, add_heading_3,
    add_body_p, add_bullet_p, add_figure, add_table_title
)

def build_chuong_3(doc):
    add_heading_1(doc, "CHƯƠNG 3: KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU HỆ THỐNG")
    
    add_heading_2(doc, "3.1. Khảo sát hiện trạng quy trình vận hành thực tế tại Zone II")
    add_body_p(doc, "Quá trình khảo sát thực địa tại Văn phòng Chuỗi Skechers Zone II và các cụm xưởng sản xuất thuộc Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 cho thấy các hoạt động vận hành diễn ra với tần suất cao và khối lượng công việc rất lớn. Tuy nhiên, một số quy trình tác nghiệp then chốt vẫn còn gặp phải các bất cập đáng kể:")
    add_bullet_p(doc, "Việc phân công và theo dõi tiến độ các đầu việc nội bộ trước đây chủ yếu thực hiện qua nhóm chat trao đổi hoặc bảng Excel cá nhân. Điều này khiến cán bộ quản lý khó nắm bắt khối lượng công việc tồn đọng (backlog), thiếu cơ chế bắt buộc nhân viên nộp kết quả minh chứng cụ thể trước khi đánh dấu hoàn thành, dẫn đến tình trạng chậm trễ hoặc báo cáo sai lệch.", "1. Quy trình giao việc & Quản lý Task: ")
    add_bullet_p(doc, "Đội ngũ chuyên gia và quản lý phân xưởng tiến hành đi thực địa kiểm tra tiêu chuẩn 5S hằng ngày trên 33 chuyền sản xuất. Khi phát hiện lỗi vi phạm hoặc sự cố khẩn cấp (như tràn dầu, đứt chỉ, lỗi nhiệt độ ép đế PU), việc ghi chép sổ tay gây chậm trễ trong việc phát tín hiệu cảnh báo Andon đến các bộ phận chức năng xử lý.", "2. Quy trình Gemba Walk 5S & Báo lỗi Andon: ")
    add_bullet_p(doc, "Phong trào cải tiến liên tục thu hút hàng trăm đề xuất sáng kiến mỗi tháng từ công nhân chuyền. Tuy nhiên, khâu tiếp nhận trên phiếu giấy khiến việc phân loại, rà soát ý tưởng trùng lặp và tính toán số giây tiết kiệm định mức (SMV - Standard Minute Value) của Kỹ sư IE bị quá tải.", "3. Quy trình Đề xuất & Thẩm định Kaizen IE: ")
    add_bullet_p(doc, "Hàng nghìn máy may điện tử, máy ép cao su, máy gò mũi/gót chưa có mã định danh QR trực quan tại thân máy. Kỹ thuật viên bảo trì mất nhiều thời gian tra cứu hồ sơ kỹ thuật; công tác ghi nhận phiếu sửa chữa khẩn cấp và tính toán thời gian dừng máy (Downtime) chưa được đo lường tự động.", "4. Quy trình Bảo trì Máy móc Thiết bị (MMTB): ")
    
    add_heading_2(doc, "3.2. Bảng tác nhân (Actors) và ma trận phân quyền người dùng")
    add_body_p(doc, "Dựa trên kết quả khảo sát bộ máy nhân sự tại đơn vị, hệ thống xác định 6 nhóm tác nhân chính tham gia tương tác (xem Bảng 3.1).")
    
    add_table_title(doc, "Bảng 3.1: Danh mục các tác nhân (Actors) và phạm vi quyền hạn trong hệ thống")
    actor_data = [
        ("1", "TONG_GIAM_DOC\n(Tổng Giám Đốc)", "Xem Bảng điều hành chiến lược 1-5-2 toàn chuỗi, duyệt các đề xuất đầu tư ngân sách lớn, xem báo cáo tổng hợp chỉ số BI toàn diện."),
        ("2", "GIAM_DOC_NHA_MAY\n(Giám Đốc Cụm Nhà Máy)", "Xem dashboard tiến độ sản xuất theo cụm nhà máy phụ trách, phê duyệt tính khả thi của các sáng kiến Kaizen, chỉ đạo xử lý sự cố dừng máy khẩn cấp."),
        ("3", "KY_SU_IE\n(Kỹ Sư Công Nghiệp IE)", "Truy cập hàng chờ thẩm định IE Queue (/work/ci/ie-queue), nhập bấm giờ định mức thực tế, đánh giá tỷ lệ tiết kiệm chi phí và đề xuất khen thưởng."),
        ("4", "GIAM_SAT_QC_GEMBA\n(Giám Sát Chất Lượng)", "Truy cập phân hệ Gemba Walk 5S (/work/gemba), duyệt cây phân cấp sản xuất, thực hiện chấm điểm 5S định kỳ và kích hoạt cảnh báo thẻ sự cố Andon."),
        ("5", "KY_THUAT_VIEN_MMTB\n(Kỹ Thuật Bảo Trì Máy)", "Quét mã QR tem máy trên di động, tiếp nhận phiếu báo hỏng khẩn cấp, cập nhật tiến độ sửa chữa, quản lý lịch bảo dưỡng định kỳ (/maintenance)."),
        ("6", "CBCNV_CONG_NHAN\n(Cán Bộ Công Nhân Viên)", "Quản lý bảng công việc cá nhân Kanban (/work/my-tasks), nộp đề xuất sáng kiến cải tiến Kaizen 4.0, đăng ký sử dụng phòng họp và chuyến xe công tác."),
    ]
    
    tbl_act = doc.add_table(rows=len(actor_data)+1, cols=3)
    tbl_act.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_act)
    h_act = ["STT", "Tác nhân (Actor)", "Mô tả vai trò và phạm vi quyền hạn"]
    w_act = [Inches(0.6), Inches(2.2), Inches(4.0)]
    for c, (h, w) in enumerate(zip(h_act, w_act)):
        cell = tbl_act.cell(0, c)
        cell.width = w
        set_cell_background(cell, "006838")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_i, (stt, act, desc) in enumerate(actor_data, start=1):
        bg = "F8FAFC" if r_i % 2 == 1 else "FFFFFF"
        for c_i, val in enumerate([stt, act, desc]):
            cell = tbl_act.cell(r_i, c_i)
            cell.width = w_act[c_i]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            if c_i == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif c_i == 1:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            if c_i <= 1:
                r.font.bold = True
                
    add_heading_2(doc, "3.3. Sơ đồ Use case tổng quát của hệ thống TBS II Workspace")
    add_body_p(doc, "Sơ đồ Use case tổng quát mô tả bức tranh toàn cảnh về sự tương tác giữa các nhóm tác nhân với các phân hệ chức năng chính của hệ thống TBS II Workspace (xem Hình 3.1).")
    
    add_figure(doc, "images/hinh_3_1_use_case_tong_quat.png", "Hình 3.1: Sơ đồ Use case tổng quát hệ thống TBS II Workspace", width_inches=5.8)
    
    add_body_p(doc, "Hệ thống bao gồm 7 gói ca sử dụng cốt lõi: UC01 - Quản lý Công việc Cá nhân (Kanban); UC02 - Đề xuất Sáng kiến Kaizen 4.0; UC03 - Thẩm định Bấm giờ IE Queue; UC04 - Kiểm định Gemba Walk 5S & Andon; UC05 - Báo hỏng & Bảo trì MMTB; UC06 - Đặt Phòng Họp & Xe Công Tác; và UC07 - Quản trị Hệ thống & Audit Logs.")
    
    add_heading_2(doc, "3.4. Phân tích Use case chi tiết: Phân hệ Thẻ công việc cá nhân Kanban")
    add_body_p(doc, "Phân hệ Thẻ công việc cá nhân (/work/my-tasks) là công cụ làm việc hằng ngày của cán bộ công nhân viên (xem Hình 3.2).")
    
    add_figure(doc, "images/hinh_3_2_use_case_phan_he_kanban_tasks.png", "Hình 3.2: Sơ đồ Use case phân hệ Quản lý công việc Kanban (/work/my-tasks)", width_inches=5.8)
    
    add_body_p(doc, "Đặc tả các ca sử dụng con:")
    add_bullet_p(doc, "Hệ thống tự động truy vấn các task được phân công trực tiếp cho mã nhân viên đăng nhập (assignee_emp_code), hiển thị dưới dạng 4 cột trạng thái: Cần làm (TODO), Đang thực hiện (IN_PROGRESS), Chờ duyệt (REVIEW), và Hoàn thành (DONE).", "• UC-TASK-01 (Xem danh sách task cá nhân): ")
    add_bullet_p(doc, "Người dùng sử dụng chuột kéo thả card trực tiếp giữa các cột; hệ thống cập nhật Optimistic UI tức thì trên màn hình.", "• UC-TASK-02 (Kéo thả chuyển trạng thái): ")
    add_bullet_p(doc, "Khi kéo card sang cột DONE, hệ thống chặn lại và hiển thị Modal bắt buộc nhập mô tả kết quả thực hiện (result_description) và đính kèm đường link minh chứng. Nút xác nhận chỉ khả dụng khi đã có dữ liệu hợp lệ.", "• UC-TASK-03 (Nộp minh chứng hoàn thành): ")
    
    add_heading_2(doc, "3.5. Phân tích Use case chi tiết: Phân hệ Sáng kiến Kaizen 4.0 & IE Queue")
    add_body_p(doc, "Phân hệ hỗ trợ toàn diện phong trào Cải tiến liên tục trong chuỗi sản xuất Skechers (xem Hình 3.3).")
    
    add_figure(doc, "images/hinh_3_3_use_case_phan_he_kaizen_ie.png", "Hình 3.3: Sơ đồ Use case phân hệ Đề xuất & Thẩm định sáng kiến Kaizen IE", width_inches=5.8)
    
    add_body_p(doc, "Đặc tả các ca sử dụng con:")
    add_bullet_p(doc, "Hỗ trợ 2 hình thức: Cán bộ văn phòng dùng Form 5 bước chuẩn mực; Công nhân tại chuyền quét mã QR nộp nhanh qua di động kèm ảnh hiện trường trước/sau.", "• UC-KZ-01 (Nộp đề xuất Kaizen): ")
    add_bullet_p(doc, "Thuật toán xử lý ngôn ngữ tự động so khớp tiêu đề và giải pháp mới với toàn bộ kho dữ liệu Kaizen hiện có để cảnh báo tỷ lệ tương đồng (> 80% cảnh báo đỏ trùng lặp).", "• UC-KZ-02 (AI rà soát trùng lặp): ")
    add_bullet_p(doc, "Kỹ sư IE truy cập danh sách chờ duyệt, nhập kết quả bấm giờ thực tế trước/sau cải tiến, hệ thống tự động quy đổi số giây tiết kiệm thành chi phí tiền tệ và chuyển cấp phê duyệt khen thưởng.", "• UC-KZ-03 (Thẩm định định mức IE Queue): ")
    
    add_heading_2(doc, "3.6. Phân tích Use case chi tiết: Phân hệ Kiểm định thực địa Gemba Walk 5S & Andon")
    add_body_p(doc, "Phân hệ phục vụ công tác giám sát hiện trường xưởng sản xuất (xem Hình 3.4).")
    
    add_figure(doc, "images/hinh_3_4_use_case_phan_he_gemba_5s.png", "Hình 3.4: Sơ đồ Use case phân hệ Giám sát kiểm định Gemba Walk 5S", width_inches=5.8)
    
    add_body_p(doc, "Các tính năng nghiệp vụ gồm:")
    add_bullet_p(doc, "Sidebar bên trái trực quan hóa cây cơ cấu nhà máy 4 cấp: Tổ hợp nhà máy -> Phân xưởng (Gò, May, Cắt) -> Dây chuyền (LINE_HTG, LINE_HTM...) -> Tổ công đoạn.", "• Quản lý cây phân cấp sản xuất: ")
    add_bullet_p(doc, "Biểu mẫu điện tử cho phép đánh giá theo 5 tiêu chí: Sàng lọc (Seiri), Sắp xếp (Seiton), Sạch sẽ (Seiso), Săn sóc (Seiketsu), và Sẵn sàng (Shitsuke).", "• Chấm điểm 5S Gemba: ")
    add_bullet_p(doc, "Khi phát hiện vi phạm nghiêm trọng tại chuyền, giám sát viên nhấn nút phát thẻ Andon đỏ; hệ thống phát cảnh báo tức thì đến quản lý xưởng phụ trách.", "• Cảnh báo sự cố Andon: ")
    
    add_heading_2(doc, "3.7. Phân tích Use case chi tiết: Phân hệ Quản lý & Bảo trì MMTB")
    add_body_p(doc, "Phân hệ số hóa 100% vòng đời của các thiết bị máy móc tại nhà máy (xem Hình 3.5).")
    
    add_figure(doc, "images/hinh_3_5_use_case_phan_he_mmtb_bao_tri.png", "Hình 3.5: Sơ đồ Use case phân hệ Quản lý máy móc thiết bị và bảo trì MMTB", width_inches=5.8)
    
    add_body_p(doc, "Bao gồm 4 nghiệp vụ chính: (1) Quét mã QR JSON payload tra cứu hồ sơ kỹ thuật máy; (2) Tạo phiếu báo hỏng khẩn cấp và phân công kỹ thuật viên; (3) Quản lý kế hoạch bảo dưỡng định kỳ tự động tính ngày đến hạn kế tiếp; (4) Phân tích các chỉ số BI công nghiệp (MTTA, MTTR, MTTD) và trực quan hóa sơ đồ vị trí máy trên mặt bằng nhà máy (Floor Plan).")
    
    add_heading_2(doc, "3.8. Phân tích Use case chi tiết: Phân hệ Tiện ích Đặt phòng họp & Xe công tác")
    add_body_p(doc, "Hệ thống tích hợp hai tiện ích văn phòng phục vụ công tác điều hành: Phân hệ Đặt phòng họp trực tuyến (/rooms) với tính năng kiểm tra tự động trùng khung giờ và hiển thị bảng điện tử tại quầy lễ tân; và Phân hệ Đăng ký chuyến xe công tác (/business-trip) hỗ trợ cán bộ lập kế hoạch di chuyển liên tỉnh giữa Văn phòng Chuỗi Thuận An và các nhà máy Kiên Giang, phê duyệt chi phí công tác trực tuyến.")
    
    add_heading_2(doc, "3.9. Đặc tả yêu cầu phi chức năng")
    add_body_p(doc, "Hệ thống đáp ứng các tiêu chuẩn kỹ thuật khắt khe:")
    add_bullet_p(doc, "Thời gian phản hồi API trung bình < 50ms nhờ hạ tầng Edge Computing; thời gian tải trang tĩnh ban đầu < 200ms; xử lý đồng thời > 1.000 yêu cầu/giây mà không bị nghẽn mạng.", "• Hiệu năng (Performance): ")
    add_bullet_p(doc, "Đạt mức sẵn sàng 99.99% nhờ mạng lưới toàn cầu Cloudflare; tự động phục hồi khi có sự cố mạng cục bộ.", "• Tính sẵn sàng (Availability): ")
    add_bullet_p(doc, "Mã hóa toàn bộ lưu lượng qua HTTPS (TLS 1.3); bảo vệ JWT Session; chống tấn công XSS, CSRF, SQL Injection; tuân thủ chuẩn an ninh quốc tế RFC 9116.", "• An toàn thông tin (Security): ")
    add_bullet_p(doc, "Giao diện tương thích hoàn hảo trên máy tính để bàn (1920x1080), laptop (1440x900) và điện thoại di động (iOS/Android PWA).", "• Khả năng tương thích (Usability): ")

def build_chuong_4(doc):
    add_heading_1(doc, "CHƯƠNG 4: THIẾT KẾ KIẾN TRÚC VÀ CƠ SỞ DỮ LIỆU HỆ THỐNG")
    
    add_heading_2(doc, "4.1. Thiết kế kiến trúc tổng thể 4 tầng hệ thống")
    add_body_p(doc, "Hệ thống TBS II Workspace được thiết kế theo kiến trúc 4 tầng phân lớp rõ ràng (Multi-tier Architecture), tối ưu hóa hoàn toàn cho môi trường Serverless Edge Computing (xem Hình 4.1).")
    
    add_figure(doc, "images/hinh_4_1_kien_truc_tong_the_he_thong.png", "Hình 4.1: Sơ đồ kiến trúc tổng thể 4 tầng hệ thống TBS II Workspace", width_inches=5.8)
    
    add_body_p(doc, "Chi tiết nhiệm vụ từng tầng:")
    add_bullet_p(doc, "Ứng dụng Next.js App Router biên dịch tĩnh (Static Export out/), phân phối giao diện tương tác mượt mà tới người dùng máy tính, tablet và di động.", "• Tầng 1 (Client Presentation Layer): ")
    add_bullet_p(doc, "Mạng lưới Cloudflare Edge đảm nhiệm lớp giáp bảo vệ an ninh WAF, phân phối tài nguyên tĩnh qua CDN Cache và chấm dứt phiên mã hóa SSL/TLS.", "• Tầng 2 (Cloudflare Edge & Security Layer): ")
    add_bullet_p(doc, "Worker Handler (file _worker.js) thực thi toàn bộ logic nghiệp vụ, xử lý xác thực phiên JWT, phân quyền vai trò RBAC, thuật toán so sánh Kaizen và điều phối dữ liệu.", "• Tầng 3 (Edge Services & Business Logic Layer): ")
    add_bullet_p(doc, "Cơ sở dữ liệu phân tán Cloudflare D1 (vpchuoiskechers-db) lưu trữ 27 bảng dữ liệu quan hệ; Cloudinary lưu ảnh minh chứng; Google Drive nhận bản sao lưu sự kiện thời gian thực.", "• Tầng 4 (Cloud Storage & External Services Layer): ")
    
    add_heading_2(doc, "4.2. Thiết kế Cơ sở dữ liệu và Sơ đồ thực thể liên kết ERD")
    add_body_p(doc, "Mô hình thực thể liên kết (ERD) của hệ thống được chuẩn hóa ở mức dạng chuẩn 3 (3NF), đảm bảo tính toàn vẹn dữ liệu và tối ưu hiệu năng truy vấn SQL tại biên (xem Hình 4.2).")
    
    add_figure(doc, "images/hinh_4_2_erd_co_so_du_lieu_d1.png", "Hình 4.2: Sơ đồ thực thể liên kết (ERD) cơ sở dữ liệu Cloudflare D1", width_inches=5.8)
    
    add_heading_2(doc, "4.3. Đặc tả chi tiết các bảng dữ liệu trọng yếu trong CSDL D1")
    add_body_p(doc, "Cơ sở dữ liệu Cloudflare D1 (vpchuoiskechers-db) bao gồm 27 bảng dữ liệu. Dưới đây là đặc tả chi tiết 5 bảng dữ liệu cốt lõi nhất của hệ thống.")
    
    # Table 4.1: sys_my_tasks
    add_table_title(doc, "Bảng 4.1: Cấu trúc bảng dữ liệu thẻ công việc cá nhân Kanban (sys_my_tasks)")
    cols_t1 = [
        ("id", "TEXT", "Khóa chính (PK, UUID sinh ngẫu nhiên)"),
        ("code", "TEXT", "Mã công việc duy nhất (TASK-2026-xxxx)"),
        ("title", "TEXT", "Tiêu đề công việc cần thực hiện"),
        ("description", "TEXT", "Mô tả chi tiết nội dung và yêu cầu"),
        ("status", "TEXT", "Trạng thái thẻ (TODO, IN_PROGRESS, REVIEW, DONE)"),
        ("priority", "TEXT", "Mức độ ưu tiên (urgent, high, medium, low)"),
        ("assignee_emp_code", "TEXT", "Mã số nhân viên được giao việc (FK)"),
        ("assignee_name", "TEXT", "Họ và tên cán bộ công nhân viên nhận việc"),
        ("department_id", "TEXT", "Mã phòng ban / phân xưởng công tác"),
        ("result_description", "TEXT", "Mô tả kết quả thực hiện (bắt buộc khi sang DONE)"),
        ("evidence_url", "TEXT", "Đường dẫn liên kết minh chứng hoặc hình ảnh"),
        ("due_date", "DATETIME", "Hạn chót hoàn thành công việc (Deadline)"),
        ("created_at", "DATETIME", "Thời điểm tạo thẻ công việc"),
        ("updated_at", "DATETIME", "Thời điểm cập nhật trạng thái gần nhất"),
    ]
    tbl_t1 = doc.add_table(rows=len(cols_t1)+1, cols=3)
    tbl_t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_t1)
    for c, h in enumerate(["Tên trường", "Kiểu dữ liệu", "Diễn giải ý nghĩa nghiệp vụ"]):
        cell = tbl_t1.cell(0, c)
        set_cell_background(cell, "006838")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.bold = True
        r.font.name = 'Times New Roman'
        r.font.color.rgb = RGBColor(255, 255, 255)
    for r_i, (fld, tp, dsc) in enumerate(cols_t1, start=1):
        bg = "F8FAFC" if r_i % 2 == 1 else "FFFFFF"
        for c_i, v in enumerate([fld, tp, dsc]):
            cell = tbl_t1.cell(r_i, c_i)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
            p = cell.paragraphs[0]
            r = p.add_run(v)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10.5)
            if c_i == 0:
                r.font.bold = True
                
    # Table 4.2: audit_logs
    add_table_title(doc, "Bảng 4.2: Cấu trúc bảng nhật ký vết thao tác người dùng (audit_logs)")
    cols_t2 = [
        ("id", "TEXT", "Khóa chính (PK, định danh bản ghi log)"),
        ("user_id", "TEXT", "ID người dùng thực hiện thao tác"),
        ("emp_code", "TEXT", "Mã số nhân viên (ví dụ: 202608001)"),
        ("emp_name", "TEXT", "Tên cán bộ nhân viên thực hiện (Tên CBNV)"),
        ("role_code", "TEXT", "Mã vai trò của tài khoản tại thời điểm tác động"),
        ("module", "TEXT", "Phân hệ tác động (TASKS, GEMBA, KAIZEN, MMTB)"),
        ("action", "TEXT", "Loại hành động (CREATE, UPDATE_STATUS, DELETE, APPROVE)"),
        ("record_id", "TEXT", "ID của đối tượng dữ liệu bị thay đổi"),
        ("changes_json", "TEXT", "Chuỗi JSON lưu vết giá trị trước và sau khi sửa"),
        ("ip_address", "TEXT", "Địa chỉ IP nguồn của người gửi yêu cầu"),
        ("user_agent", "TEXT", "Thông tin trình duyệt và hệ điều hành của client"),
        ("created_at", "DATETIME", "Thời điểm phát sinh thao tác"),
    ]
    tbl_t2 = doc.add_table(rows=len(cols_t2)+1, cols=3)
    tbl_t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_t2)
    for c, h in enumerate(["Tên trường", "Kiểu dữ liệu", "Diễn giải ý nghĩa nghiệp vụ"]):
        cell = tbl_t2.cell(0, c)
        set_cell_background(cell, "006838")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.bold = True
        r.font.name = 'Times New Roman'
        r.font.color.rgb = RGBColor(255, 255, 255)
    for r_i, (fld, tp, dsc) in enumerate(cols_t2, start=1):
        bg = "F8FAFC" if r_i % 2 == 1 else "FFFFFF"
        for c_i, v in enumerate([fld, tp, dsc]):
            cell = tbl_t2.cell(r_i, c_i)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
            p = cell.paragraphs[0]
            r = p.add_run(v)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10.5)
            if c_i == 0:
                r.font.bold = True
                
    # Table 4.3: ci_kaizen_proposals
    add_table_title(doc, "Bảng 4.3: Cấu trúc bảng sáng kiến cải tiến Kaizen 4.0 (ci_kaizen_proposals)")
    cols_t3 = [
        ("id", "TEXT", "Khóa chính (PK)"),
        ("code", "TEXT", "Mã đề xuất duy nhất (KZ-2026-xxxx)"),
        ("title", "TEXT", "Tiêu đề nội dung sáng kiến cải tiến"),
        ("category", "TEXT", "Phân loại (Sản xuất, 5S, Tiết kiệm năng lượng, An toàn)"),
        ("factory", "TEXT", "Cụm nhà máy áp dụng (Miền Đông, Kiên Giang)"),
        ("proposer_name", "TEXT", "Họ và tên tác giả đề xuất"),
        ("proposer_code", "TEXT", "Mã số nhân viên tác giả đề xuất"),
        ("current_state", "TEXT", "Mô tả hiện trạng và lãng phí trước cải tiến"),
        ("solution", "TEXT", "Mô tả chi tiết giải pháp đề xuất áp dụng"),
        ("expected_benefit", "TEXT", "Lợi ích dự kiến (tiết kiệm giây, giảm lỗi)"),
        ("status", "TEXT", "Trạng thái phê duyệt 5 bước quy chuẩn CI"),
        ("saved_seconds", "REAL", "Số giây tiết kiệm do Kỹ sư IE thẩm định"),
        ("cost_saving_vnd", "REAL", "Số tiền tiết kiệm quy đổi tương ứng"),
    ]
    tbl_t3 = doc.add_table(rows=len(cols_t3)+1, cols=3)
    tbl_t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_t3)
    for c, h in enumerate(["Tên trường", "Kiểu dữ liệu", "Diễn giải ý nghĩa nghiệp vụ"]):
        cell = tbl_t3.cell(0, c)
        set_cell_background(cell, "006838")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.bold = True
        r.font.name = 'Times New Roman'
        r.font.color.rgb = RGBColor(255, 255, 255)
    for r_i, (fld, tp, dsc) in enumerate(cols_t3, start=1):
        bg = "F8FAFC" if r_i % 2 == 1 else "FFFFFF"
        for c_i, v in enumerate([fld, tp, dsc]):
            cell = tbl_t3.cell(r_i, c_i)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
            p = cell.paragraphs[0]
            r = p.add_run(v)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10.5)
            if c_i == 0:
                r.font.bold = True
                
    add_heading_2(doc, "4.4. Thiết kế các sơ đồ tuần tự (Sequence Diagrams) then chốt")
    add_body_p(doc, "Nhằm đặc tả chính xác tương tác dòng thời gian giữa các đối tượng giao diện, Worker Engine và các dịch vụ lưu trữ, 4 sơ đồ tuần tự then chốt đã được thiết kế:")
    
    add_heading_3(doc, "4.4.1. Luồng kéo thả Kanban và nộp minh chứng kết quả")
    add_body_p(doc, "Mô tả quy trình xử lý sự kiện kéo thả card công việc từ cột khác sang cột DONE và cơ chế chặn hiển thị Modal bắt buộc nhập minh chứng kết quả (xem Hình 4.3).")
    add_figure(doc, "images/hinh_4_3_sequence_kanban_result_modal.png", "Hình 4.3: Sơ đồ tuần tự quy trình kéo thả thẻ Kanban và nộp minh chứng kết quả", width_inches=5.8)
    
    add_heading_3(doc, "4.4.2. Luồng thẩm định sáng kiến Kaizen qua hàng chờ Kỹ sư IE")
    add_body_p(doc, "Mô tả quy trình nộp ý tưởng cải tiến, qua engine AI kiểm tra trùng lặp, đẩy vào hàng chờ IE Queue để Kỹ sư công nghiệp thẩm định số giây tiết kiệm và chuyển cấp duyệt (xem Hình 4.4).")
    add_figure(doc, "images/hinh_4_4_sequence_duyet_kaizen_ie_queue.png", "Hình 4.4: Sơ đồ tuần tự quy trình thẩm định và phê duyệt Kaizen IE", width_inches=5.8)
    
    add_heading_3(doc, "4.4.3. Luồng xử lý sự cố báo hỏng máy MMTB khẩn cấp")
    add_body_p(doc, "Mô tả quy trình quét mã QR báo hỏng dừng chuyền, phát cảnh báo khẩn cấp tới kỹ thuật viên, theo dõi tiến độ sửa chữa và tự động tính toán thời gian dừng máy Downtime (xem Hình 4.5).")
    add_figure(doc, "images/hinh_4_5_sequence_sua_chua_khan_cap_mmtb.png", "Hình 4.5: Sơ đồ tuần tự quy trình xử lý phiếu báo hỏng máy MMTB khẩn cấp", width_inches=5.8)
    
    add_heading_3(doc, "4.4.4. Luồng sao lưu thời gian thực Real-time Backup lên Google Drive")
    add_body_p(doc, "Mô tả cơ chế bắt sự kiện thay đổi dữ liệu trên Cloudflare Worker, đóng gói payload, gửi yêu cầu POST đến Google Apps Script WebApp và ghi đồng thời file JSON cùng CSV UTF-8 BOM có cột Tên CBNV (xem Hình 4.6).")
    add_figure(doc, "images/hinh_4_6_sequence_realtime_backup_gdrive.png", "Hình 4.6: Sơ đồ tuần tự cơ chế sao lưu thời gian thực lên Google Drive qua WebApp", width_inches=5.8)
    
    add_heading_2(doc, "4.5. Thiết kế bề mặt giao tiếp API (RESTful Endpoints Specification)")
    add_body_p(doc, "Hệ thống xây dựng bộ API RESTful đồng bộ và hoàn chỉnh trên Cloudflare Workers (xem Bảng 4.6).")
    
    add_table_title(doc, "Bảng 4.6: Danh mục các RESTful API Endpoints chính của hệ thống TBS II Workspace")
    api_list = [
        ("GET", "/api/tasks", "Lấy danh sách thẻ công việc theo phòng ban hoặc cá nhân"),
        ("POST", "/api/tasks", "Tạo mới một thẻ công việc trên bảng Kanban"),
        ("PATCH", "/api/tasks/:id", "Cập nhật trạng thái kéo thả thẻ và lưu result_description"),
        ("GET", "/api/gemba/records", "Lấy dữ liệu nhật ký kiểm định 5S Gemba Walk cây phân cấp"),
        ("POST", "/api/gemba/records", "Lưu phiếu đánh giá 5S và phát tín hiệu thẻ cảnh báo Andon"),
        ("GET", "/api/ci-kaizen", "Lấy danh sách đề xuất sáng kiến cải tiến Kaizen 4.0"),
        ("POST", "/api/ci-kaizen", "Đăng ký sáng kiến Kaizen (Form 5 bước / Public QR Code)"),
        ("POST", "/api/ai/compare-kaizen", "Chạy thuật toán AI kiểm tra độ tương đồng trùng lặp sáng kiến"),
        ("GET", "/api/maintenance/machines", "Tra cứu danh mục và hồ sơ kỹ thuật máy móc thiết bị MMTB"),
        ("POST", "/api/maintenance/tickets", "Tạo phiếu báo hỏng sửa chữa máy khẩn cấp tại hiện trường"),
        ("GET", "/api/rooms/bookings", "Tra cứu lịch trống và đặt phòng họp trực tuyến"),
        ("GET", "/api/business-trip", "Lấy danh sách đăng ký lịch công tác và phê duyệt xe"),
        ("POST", "/api/auth/login", "Xác thực đăng nhập MSNV, cấp JWT Session Token"),
    ]
    tbl_api = doc.add_table(rows=len(api_list)+1, cols=3)
    tbl_api.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_api)
    for c, h in enumerate(["Phương thức", "Đường dẫn Endpoint", "Mô tả chức năng nghiệp vụ"]):
        cell = tbl_api.cell(0, c)
        set_cell_background(cell, "006838")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.bold = True
        r.font.name = 'Times New Roman'
        r.font.color.rgb = RGBColor(255, 255, 255)
    for r_i, (m, ep, dsc) in enumerate(api_list, start=1):
        bg = "F8FAFC" if r_i % 2 == 1 else "FFFFFF"
        for c_i, v in enumerate([m, ep, dsc]):
            cell = tbl_api.cell(r_i, c_i)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
            p = cell.paragraphs[0]
            r = p.add_run(v)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10.5)
            if c_i == 0:
                r.font.bold = True
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif c_i == 1:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

print("Loaded Chapters 3 & 4 Content Builder.")
