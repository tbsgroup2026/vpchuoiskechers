# -*- coding: utf-8 -*-
import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''<w:tcMar {nsdecls("w")}>
        <w:top w:w="{top}" w:type="dxa"/>
        <w:bottom w:w="{bottom}" w:type="dxa"/>
        <w:left w:w="{left}" w:type="dxa"/>
        <w:right w:w="{right}" w:type="dxa"/>
    </w:tcMar>''')
    tcPr.append(tcMar)

def add_header_styled(doc, text, level=1):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    if level == 1:
        run.font.size = Pt(15)
        run.font.color.rgb = RGBColor(0, 85, 46) # TBS Forest Green
    elif level == 2:
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(15, 65, 51)
    else:
        run.font.size = Pt(11.5)
        run.font.color.rgb = RGBColor(40, 40, 40)
    return p

def create_script_document():
    doc = Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        section.different_first_page_header_footer = False
        
        # Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("KỊCH BẢN QUAY VIDEO BÁO CÁO THỰC TẬP TỐT NGHIỆP — PHẠM NGUYỄN ANH HUY")
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(120, 120, 120)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Đại Học Thủ Dầu Một — Tập Đoàn TBS Group (VP Chuỗi SKECHERS) | Năm 2026")
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(120, 120, 120)

    # 1. TIÊU ĐỀ CHÍNH
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    
    r1 = title_p.add_run("TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT — VIỆN CÔNG NGHỆ SỐ\n")
    r1.font.size = Pt(12)
    r1.bold = True
    r1.font.color.rgb = RGBColor(60, 60, 60)

    r2 = title_p.add_run("KỊCH BẢN CHI TIẾT QUAY CLIP BÁO CÁO TIẾN TRÌNH\nTHỰC TẬP TỐT NGHIỆP\n")
    r2.font.size = Pt(17)
    r2.bold = True
    r2.font.color.rgb = RGBColor(0, 104, 56) # Primary Emerald

    r3 = title_p.add_run("ĐỀ TÀI: XÂY DỰNG VÀ PHÁT TRIỂN HỆ THỐNG QUẢN TRỊ SỐ HÓA VĂN PHÒNG CHUỖI SKECHERS (TBS WORKSPACE, GEMBA WALK 5S VÀ KAIZEN IE ENGINE)")
    r3.font.size = Pt(11.5)
    r3.bold = True
    r3.font.color.rgb = RGBColor(30, 30, 30)

    # 2. KHỐI THÔNG TIN HÀNH CHÍNH
    info_table = doc.add_table(rows=5, cols=2)
    info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_data = [
        ("Sinh viên thực hiện:", "Phạm Nguyễn Anh Huy — MSSV: 202608001 — Lớp: D22CNTT02"),
        ("Chuyên ngành:", "Kỹ Thuật Phần Mềm / Công Nghệ Thông Tin (Niên khóa 2022 – 2026)"),
        ("Đơn vị thực tập:", "Tập đoàn Da Giày TBS Group — Văn phòng Chuỗi SKECHERS (Bình Dương / TP.HCM)"),
        ("Cán bộ hướng dẫn tại đơn vị:", "Ngô Hà Thanh An (Quản Lý CĐS / IT Manager Văn phòng Chuỗi)"),
        ("Giảng viên hướng dẫn:", "ThS. Trần Bá Minh Sơn (Viện Công nghệ số — ĐH Thủ Dầu Một)")
    ]
    for row_idx, (label, val) in enumerate(info_data):
        row = info_table.rows[row_idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.8)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(2)
        r_lbl = p0.add_run(label)
        r_lbl.bold = True
        r_lbl.font.size = Pt(10)
        r_lbl.font.color.rgb = RGBColor(0, 85, 46)

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(2)
        r_val = p1.add_run(val)
        r_val.font.size = Pt(10)
        
        set_cell_background(c0, "F0F7F4")
        set_cell_background(c1, "FBFDFB")
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. MỤC TIÊU VÀ NGUYÊN TẮC QUAY VIDEO
    box_p = doc.add_paragraph()
    box_p.paragraph_format.space_before = Pt(6)
    box_p.paragraph_format.space_after = Pt(8)
    b_run = box_p.add_run("HƯỚNG DẪN DÀNH CHO SINH VIÊN KHI THỰC HIỆN VIDEO CLIP BÁO CÁO:\n")
    b_run.bold = True
    b_run.font.size = Pt(10.5)
    b_run.font.color.rgb = RGBColor(160, 70, 0)
    
    notes_text = (
        "1. Thời lượng khuyến nghị: 15 – 20 phút (chia thành 5 giai đoạn mạch lạc: Chưa có gì -> Khảo sát thiết kế -> Hiện tại demo -> Kết quả đạt được -> Tương lai mở rộng).\n"
        "2. Thiết lập kỹ thuật: Quay màn hình ở độ phân giải Full HD (1920x1080) 60fps; sử dụng micro chống ồn rõ tiếng; camera góc nhỏ của sinh viên ở góc phải dưới (trang phục công sở chỉnh tề, thái độ tự tin).\n"
        "3. Thao tác thực tế: Mở sẵn trình duyệt tại địa chỉ Production: https://vpchuoiskechers.tbsgroup2026.workers.dev. Thao tác dứt khoát, nói tới đâu trỏ chuột và mở màn hình tới đó, không để khoảng chết (dead air).\n"
        "4. Cấu trúc kịch bản bên dưới gồm 4 cột chi tiết: [Thời lượng] | [Thao tác màn hình / Visual] | [Lời thoại chi tiết (Script)] | [Ghi chú & Điểm cộng chuyên môn]."
    )
    r_notes = box_p.add_run(notes_text)
    r_notes.font.size = Pt(9.5)
    r_notes.font.color.rgb = RGBColor(60, 60, 60)

    # 4. BẢNG PHÂN CẢNH CHI TIẾT
    add_header_styled(doc, "BẢNG PHÂN CẢNH & LỜI THOẠI CHI TIẾT TỪNG PHÂN ĐOẠN (TIMELINE)", level=1)

    scenes = [
        # GIAI ĐOẠN 1: MỞ ĐẦU & TỔNG QUAN
        {
            "part": "PHẦN 1: LỜI MỞ ĐẦU, BỐI CẢNH DOANH NGHIỆP & HIỆN TRẠNG BAN ĐẦU (TỪ CON SỐ 0)",
            "time": "00:00 - 02:30",
            "visual": (
                "- Khung hình 1 (00:00 - 00:45): Camera toàn cảnh sinh viên mặc áo sơ mi / đồng phục thực tập TBS Group, slide bìa báo cáo trình chiếu phía sau.\n"
                "- Khung hình 2 (00:45 - 01:30): Mở slide / tài liệu hình ảnh thực tế nhà máy TBS Group Dĩ An, các chuyền may gò giày Skechers đông đúc, sổ sách ghi chép bằng tay.\n"
                "- Khung hình 3 (01:30 - 02:30): Màn hình hiển thị sơ đồ phân tích Pain Points (Điểm nghẽn thủ công trước khi có hệ thống)."
            ),
            "script": (
                "\"Kính thưa quý Thầy Cô trong Hội đồng chấm Thực tập tốt nghiệp Viện Công nghệ số – Trường Đại học Thủ Dầu Một! "
                "Kính thưa Ban Lãnh đạo và anh chị Quản lý tại Văn phòng Chuỗi SKECHERS – Tập đoàn Da Giày TBS Group!\n\n"
                "Em tên là Phạm Nguyễn Anh Huy, sinh viên lớp D22CNTT02, chuyên ngành Kỹ Thuật Phần Mềm. Trong kỳ thực tập tốt nghiệp vừa qua, "
                "em đã có cơ hội quý báu được nhận vào thực tập tại Phòng Công Nghệ Thông Tin & Chuyển Đổi Số thuộc Văn phòng Chuỗi SKECHERS – TBS Group, "
                "dưới sự hướng dẫn trực tiếp của anh Ngô Hà Thanh An – Quản lý Chuyển đổi số, cùng sự chỉ dẫn tận tình từ Giảng viên hướng dẫn ThS. Trần Bá Minh Sơn.\n\n"
                "Hôm nay, em xin phép được trình bày video báo cáo toàn diện về tiến trình thực tập và đề tài tốt nghiệp của mình: "
                "'XÂY DỰNG VÀ PHÁT TRIỂN HỆ THỐNG QUẢN TRỊ SỐ HÓA VĂN PHÒNG CHUỖI SKECHERS (TBS WORKSPACE, MODULE GEMBA WALK 5S VÀ ĐỘNG CƠ KAIZEN IE)'.\n\n"
                "Kính thưa quý Thầy Cô, trước khi bắt tay vào dự án – tức ở thời điểm GIAI ĐOẠN ĐẦU KHI CHƯA CÓ GÌ, hiện trạng vận hành tại Văn phòng Chuỗi "
                "đối mặt với rất nhiều thách thức thực tế của một doanh nghiệp sản xuất gia công quy mô hàng chục ngàn lao động:\n"
                "+ Thứ nhất: Việc giao việc và giám sát tiến độ công việc nội bộ chủ yếu thông qua các nhóm chat Zalo rời rạc hoặc các file Excel chia sẻ thủ công. "
                "Các đầu việc thường xuyên bị trôi tin nhắn, thiếu cơ chế đối soát minh chứng hoàn thành, người quản lý không có góc nhìn tổng thể thời gian thực.\n"
                "+ Thứ hai: Quy trình Gemba Walk – tức kiểm tra hiện trường chất lượng và tuân thủ an toàn 5S tại các xưởng sản xuất – hoàn toàn được ghi chép trên sổ giấy. "
                "Khi phát hiện sự cố máy móc dừng chuyền hoặc rủi ro 5S, kỹ sư phải điền phiếu giấy rồi mang về văn phòng nhập liệu lại, hình ảnh chụp bằng điện thoại cá nhân "
                "dễ thất lạc, dẫn đến thời gian phản hồi sự cố kéo dài nhiều giờ đồng hồ.\n"
                "+ Thứ ba: Phong trào Cải tiến Sáng kiến Kaizen – nét văn hóa sống còn của TBS Group – trước đây công nhân phải viết đơn trên giấy gửi tổ trưởng, "
                "kỹ sư IE (Industrial Engineering) phải cầm đồng hồ bấm giây xuống hiện trường đo đạc thủ công, rồi họp hội đồng chấm điểm trên bảng tính. Một chu kỳ xét duyệt "
                "mất từ 3 đến 4 tuần, làm giảm nhiệt huyết đóng góp sáng kiến của người lao động.\n"
                "+ Thứ tư: Lịch phòng họp và lễ tân đón tiếp các đoàn chuyên gia nhãn hàng Skechers quốc tế thường xuyên bị trùng lịch, thiếu bảng thông tin điện tử.\n\n"
                "Chính vì vậy, nhiệm vụ được Lãnh đạo đơn vị giao cho em là: Thiết kế và xây dựng một nền tảng Web App quản trị điều hành số hóa tập trung, "
                "giải quyết triệt để 4 bài toán trên với tiêu chí: Tốc độ tức thời, bảo mật doanh nghiệp, giao diện thân thiện với công nhân và chi phí vận hành tối ưu nhất.\""
            ),
            "notes": (
                "- Điểm nhấn: Nhấn mạnh tính cấp thiết từ thực tế sản xuất.\n"
                "- Thể hiện rõ vai trò kỹ sư CNTT giải quyết bài toán nghiệp vụ công nghiệp (Smart Manufacturing).\n"
                "- Giọng nói truyền cảm, dõng dạc, tác phong tự tin."
            )
        },
        # GIAI ĐOẠN 2: KIẾN TRÚC & CÔNG NGHỆ
        {
            "part": "PHẦN 2: KIẾN TRÚC HỆ THỐNG, CÔNG NGHỆ CHỌN LỰA & GIẢI PHÁP ĐỘT PHÁ",
            "time": "02:30 - 05:00",
            "visual": (
                "- Khung hình 1 (02:30 - 03:30): Trình chiếu Sơ đồ Kiến trúc Hệ thống (System Architecture Diagram) hiển thị luồng: Client Browser -> Cloudflare Edge Network -> Cloudflare Workers Serverless -> D1 SQLite Database + R2 Object Storage.\n"
                "- Khung hình 2 (03:30 - 04:15): Mở Visual Studio Code, lướt nhanh cấu trúc thư mục dự án Next.js 14 App Router, các worker backend API, schema migration SQL.\n"
                "- Khung hình 3 (04:15 - 05:00): Trình chiếu Bảng Ma trận Phân quyền người dùng RBAC (Role-Based Access Control 5 cấp độ)."
            ),
            "script": (
                "\"Để đáp ứng yêu cầu một hệ thống công nghiệp hoạt động 24/7 với độ trễ thấp nhất cho cả văn phòng tại TP.HCM và các cụm nhà máy tại Bình Dương, Kiên Giang, "
                "em đã nghiên cứu và đề xuất áp dụng KIẾN TRÚC SERVERLESS EDGE COMPUTING HIỆN ĐẠI NHẤT HIỆN NAY:\n\n"
                "1. Nền tảng Điện toán Đám mây Biên Cloudflare Workers: Thay vì thuê máy chủ ảo VPS truyền thống vừa tốn kém chi phí bảo trì vừa đối mặt nguy cơ downtime, "
                "hệ thống được triển khai trên Cloudflare Workers. Ứng dụng chạy trên hơn 300 trung tâm dữ liệu toàn cầu của Cloudflare, phản hồi người dùng chỉ trong 10-30 mili-giây, "
                "tự động co giãn (auto-scaling) và có chi phí hạ tầng thực tế gần như bằng 0 đồng cho doanh nghiệp.\n\n"
                "2. Cơ sở Dữ liệu Cloudflare D1 Database: CSDL SQL phân tán dựa trên SQLite thế hệ mới. Em đã thiết kế hệ thống CSDL chuẩn hóa quan hệ gồm các bảng nòng cốt: "
                "users (quản lý 384 nhân sự), tasks (quản lý công việc Kanban), gemba_walk_audits, kaizen_proposals, ie_standards, room_bookings và audit_logs ghi vết bảo mật.\n\n"
                "3. Kho Lưu trữ Tệp Cloudflare R2 Object Storage: Đóng vai trò lưu trữ toàn bộ hình ảnh minh chứng sự cố Gemba và biên bản Kaizen. Điểm ưu việt tuyệt đối của R2 "
                "là hoàn toàn miễn phí băng thông truyền tải dữ liệu (Zero Egress Fees), giúp doanh nghiệp lưu trữ hàng trăm gigabyte ảnh hiện trường mà không phát sinh chi phí phát sinh.\n\n"
                "4. Frontend & Trải nghiệm Người dùng: Xây dựng trên Next.js 14, React 18, Tailwind CSS và Tabler Icons. Giao diện được thiết kế theo đúng Brand Identity "
                "chuẩn của Tập đoàn TBS Group và nhãn hàng SKECHERS với tông màu chủ đạo Xanh Rừng Rậm (#006838) và Xanh Ngọc Tương Lai (#2fd39a), hỗ trợ song ngữ Việt – Anh, "
                "tương thích hoàn hảo từ màn hình máy tính để bàn văn phòng đến điện thoại di động của công nhân tại hiện trường.\n\n"
                "5. Bảo mật Đa Tầng: Sử dụng cơ chế định danh JSON Web Token (JWT) kết hợp HttpOnly/SameSite Lax Cookies, chống tấn công XSS/CSRF, phân quyền RBAC nghiêm ngặt: "
                "Super Admin, Ban Giám Đốc, IT Manager, Trưởng bộ phận, Kỹ sư IE và Công nhân viên.\""
            ),
            "notes": (
                "- Điểm cộng học thuật: Nêu bật tính tiên phong trong việc áp dụng Serverless Edge (Cloudflare D1 & R2).\n"
                "- Giải thích lý do chọn công nghệ dựa trên bài toán kinh tế & kỹ thuật của doanh nghiệp."
            )
        },
        # GIAI ĐOẠN 3: DEMO TRỰC TIẾP TỪNG CHỨC NĂNG TRÊN PRODUCTION
        {
            "part": "PHẦN 3: DEMO THAO TÁC THỰC TẾ TỪNG CHỨC NĂNG TRÊN PRODUCTION (LIVE DEMO)",
            "time": "05:00 - 15:30",
            "visual": (
                "Chuyển sang màn hình trình duyệt Production (https://vpchuoiskechers.tbsgroup2026.workers.dev). "
                "Thao tác trực tiếp theo từng kịch bản con dưới đây:"
            ),
            "script": (
                "\"Và ngay sau đây, em xin kính mời quý Thầy Cô cùng quý Lãnh đạo bước vào phần quan trọng nhất: "
                "DEMO TRỰC TIẾP TOÀN BỘ CÁC CHỨC NĂNG ĐÃ HOÀN THÀNH VÀ ĐANG VẬN HÀNH THỰC TẾ TRÊN MÔI TRƯỜNG PRODUCTION!\""
            ),
            "notes": "Mở tab ẩn danh hoặc tab mới, chuẩn bị sẵn tài khoản demo."
        },
        # DEMO 1: TRANG CHỦ & BRANDING
        {
            "part": "  -> Phân đoạn 3.1: Trang Chủ Public, Nhận diện Thương hiệu & Đa Ngôn Ngữ",
            "time": "05:15 - 06:30",
            "visual": (
                "- Mở trang chủ: https://vpchuoiskechers.tbsgroup2026.workers.dev/\n"
                "- Cuộn trang mượt mà qua Hero Banner, số liệu thống kê (30+ năm, 10M+ sản phẩm, 5,000+ nhân sự).\n"
                "- Bấm chuyển đổi ngôn ngữ VI <-> EN trên thanh Header Controls.\n"
                "- Chỉ chuột vào nút 'Đăng Nhập' mới được chuẩn hóa, chứng minh người chưa đăng nhập không bị dính tài khoản cũ."
            ),
            "script": (
                "\"Đầu tiên là Cổng Thông Tin & Văn Hóa Doanh Nghiệp tại trang chủ. "
                "Giao diện được thiết kế hiện đại, thể hiện rõ vị thế của Văn Phòng Chuỗi SKECHERS – TBS Group với khẩu hiệu 'Excellence in Manufacturing. Excellence in Leadership'. "
                "Hệ thống cung cấp đầy đủ thông tin về các dòng sản phẩm tiêu biểu của Skechers do TBS sản xuất như Go Walk, D'Lites, Arch Fit, Work Relaxed Fit.\n\n"
                "Em xin đặc biệt lưu ý về tính năng Header Controls ở góc phải: Hệ thống có bộ chuyển đổi đa ngôn ngữ tức thời VI - EN giúp các chuyên gia quốc tế của Skechers "
                "dễ dàng tiếp cận thông tin. Khi người dùng chưa đăng nhập, thanh Header hiển thị nút 'Đăng Nhập' trang nhã, bảo mật tuyệt đối dữ liệu nội bộ và không để lộ "
                "thông tin tài khoản cán bộ công nhân viên ra ngoài.\""
            ),
            "notes": "Minh chứng tính hoàn thiện UI/UX và tính bảo mật dành cho khách truy cập."
        },
        # DEMO 2: ĐĂNG NHẬP & PHÂN QUYỀN
        {
            "part": "  -> Phân đoạn 3.2: Xác Thực Đăng Nhập JWT & Audit Log Giám Sát",
            "time": "06:30 - 07:45",
            "visual": (
                "- Bấm nút 'Đăng Nhập' chuyển sang trang /login.\n"
                "- Nhập MSNV: 202608001 (Phạm Nguyễn Anh Huy) và mật khẩu.\n"
                "- Bấm 'Đăng Nhập Hệ Thống' -> hiệu ứng chuyển trang mượt mà vào /work hoặc /admin.\n"
                "- Nhấn mạnh việc ghi nhận Audit Log vào CSDL D1."
            ),
            "script": (
                "\"Bây giờ, em thực hiện đăng nhập vào hệ thống với tư cách Quản trị viên Chuyển đổi số (MSNV: 202608001 – Phạm Nguyễn Anh Huy). "
                "Tại màn hình /login, người dùng nhập Mã số nhân viên và mật khẩu. "
                "Ngay khi nhấn Đăng Nhập, Worker API sẽ băm và đối chiếu thông tin với cơ sở dữ liệu Cloudflare D1, khởi tạo phiên JWT và đồng thời "
                "bắn webhook ghi nhận nhật ký Audit Log sự kiện đăng nhập vào bảng login_logout_logs kèm IP, thiết bị và thời gian chính xác đến từng giây. "
                "Hệ thống nhận diện vai trò và tự động điều hướng người dùng đến đúng không gian làm việc được cấp quyền.\""
            ),
            "notes": "Nêu bật tính năng Audit Trail đáp ứng tiêu chuẩn an toàn thông tin ISO/IEC 27001 của TBS Group."
        },
        # DEMO 3: WORKSPACE HUB
        {
            "part": "  -> Phân đoạn 3.3: Trung Tâm Điều Hành Workspace Hub (/work)",
            "time": "07:45 - 09:00",
            "visual": (
                "- Mở trang /work.\n"
                "- Chỉ vào thanh chào đón cá nhân hóa 'Chào mừng trở lại, PHẠM NGUYỄN ANH HUY - Trưởng Ban CI & Chuyển Đổi Số'.\n"
                "- Rê chuột qua biểu đồ Donut phân loại công việc và biểu đồ cột tiến độ tuần.\n"
                "- Cuộn xuống Hub 10 ứng dụng số hóa liên kết các phân hệ."
            ),
            "script": (
                "\"Đây là Cổng Không Gian Làm Việc Trung Tâm – TBS Workspace Hub (/work). "
                "Màn hình tổng quan cung cấp bức tranh toàn cảnh về hiệu suất làm việc của cán bộ quản lý: "
                "Thống kê số lượng công việc hôm nay, công việc đang thực hiện và đã hoàn thành. "
                "Biểu đồ phân bố tải công việc theo danh mục (Dự án 40%, Hành chính 30%, Nhân sự 20%, Khác 10%) và biểu đồ cột năng suất làm việc từ Thứ 2 đến Chủ nhật. "
                "Phía dưới là lối tắt vào 10 phân hệ nghiệp vụ số hóa được liên kết chặt chẽ trong hệ sinh thái TBS Group.\""
            ),
            "notes": "Chứng minh khả năng trực quan hóa dữ liệu (Data Visualization) phục vụ lãnh đạo ra quyết định."
        },
        # DEMO 4: KANBAN MY-TASKS
        {
            "part": "  -> Phân đoạn 3.4: Bảng Quản Lý Công Việc Cá Nhân Kanban (/work/my-tasks)",
            "time": "09:00 - 10:30",
            "visual": (
                "- Mở trang /work/my-tasks.\n"
                "- Quay cảnh 5 dự án trọng điểm với thanh tiến độ (70% - 83%).\n"
                "- Thao tác bấm vào 1 task: mở modal xem chi tiết, hạn chót, độ ưu tiên.\n"
                "- Kéo thả thẻ task từ cột 'Đang Thực Hiện' sang 'Hoàn Thành' (DONE).\n"
                "- Trình diễn tính năng bắt buộc đính kèm ghi chú kết quả/minh chứng trước khi hoàn thành task."
            ),
            "script": (
                "\"Tiếp theo là Phân hệ Quản Lý Công Việc Cá Nhân & Dự Án (/work/my-tasks). "
                "Trước đây công việc giao qua chat rất dễ quên hạn chót. Giờ đây, toàn bộ nhiệm vụ được trực quan hóa theo mô hình KANBAN BOARD chuẩn quốc tế. "
                "Các dự án trọng điểm như 'Tự động hóa dây chuyền sản xuất Skechers', 'Vận hành chuỗi HQ & Store' đều có thước đo tiến độ cụ thể. "
                "Các cột trạng thái gồm: Việc cần làm (Todo) -> Đang làm (In Progress) -> Đang nghiệm thu (In Review) -> Hoàn thành (Done).\n\n"
                "Em xin thao tác kéo thả một thẻ task: Thao tác cực kỳ mượt mà. Đặc biệt, để ngăn chặn tình trạng 'hoàn thành khống', "
                "hệ thống có cơ chế ràng buộc: Khi nhân viên chuyển task sang DONE, hệ thống yêu cầu xác nhận kết quả nghiệm thu hoặc link tệp minh chứng. "
                "Dữ liệu được cập nhật tức thời xuống D1 Database giúp cấp quản lý nắm bắt tiến độ dự án mà không cần họp báo cáo rườm rà hàng tuần.\""
            ),
            "notes": "Điểm nhấn tính năng chống báo cáo ảo, kỷ luật lao động số hóa."
        },
        # DEMO 5: GEMBA WALK 5S
        {
            "part": "  -> Phân đoạn 3.5: Module Kiểm Soát Hiện Trường Gemba Walk 5S (/work/gemba)",
            "time": "10:30 - 12:00",
            "visual": (
                "- Mở trang /work/gemba.\n"
                "- Chỉ vào bộ lọc đa tầng: Cụm Nhà Máy (Miền Đông, Kiên Giang) -> Phân xưởng -> Line chuyền may/gò.\n"
                "- Bấm nút 'Lập Biên Bản Sự Cố Gemba Mới'.\n"
                "- Điền form sự cố: Phân loại 5S (Sàng lọc, Sắp xếp,...), mức độ nghiêm trọng (Cảnh báo dừng máy Line 2).\n"
                "- Upload 1 hình ảnh hiện trường giả lập -> ảnh được đẩy thẳng lên Cloudflare R2 và hiển thị ngay lập tức.\n"
                "- Xem danh sách các biên bản đã xử lý."
            ),
            "script": (
                "\"Bây giờ là một trong những Module cốt lõi nhất của đề tài: PHÂN HỆ GEMBA WALK 5S HIỆN TRƯỜNG (/work/gemba). "
                "Trong phương pháp quản trị sản xuất Lean Manufacturing của TBS Group, Gemba nghĩa là 'đi đến tận nơi xảy ra sự việc'. "
                "Module này trao quyền cho kỹ sư chất lượng và giám sát xưởng phát hiện bất thường ngay tại chuyền may gò.\n\n"
                "Em xin thao tác tạo một biên bản: "
                "Hệ thống phân cấp chính xác theo cơ cấu tổ chức: Chọn Nhà máy Miền Đông -> Xưởng 1 -> Line May 2 -> Công đoạn ráp đế. "
                "Kỹ sư chọn hạng mục vi phạm 5S hoặc sự cố kỹ thuật, đánh dấu mức độ Khẩn cấp. "
                "Đặc biệt, tính năng chụp ảnh và tải tệp minh chứng kết nối trực tiếp với Cloudflare R2 Storage. Ảnh chụp được tối ưu nén dung lượng, "
                "lưu trữ an toàn vĩnh viễn và tạo đường dẫn CDN tức thời. Ngay khi bấm Lưu, biên bản xuất hiện trên Dashboard kiểm soát, "
                "tổ trưởng bộ phận liên quan nhận thông báo để lập tức khắc phục trong vòng 15 phút thay vì mất nửa ngày như quy trình giấy cũ!\""
            ),
            "notes": "Nêu rõ sự kết hợp giữa CNTT và nghiệp vụ Quản lý Sản xuất Tinh gọn (Lean 5S)."
        },
        # DEMO 6: KAIZEN CI & IE QUEUE
        {
            "part": "  -> Phân đoạn 3.6: Động Cơ Xét Duyệt Sáng Kiến Kaizen & IE Queue Engine",
            "time": "12:00 - 13:45",
            "visual": (
                "- Mở trang /work/kaizen và /work/ci.\n"
                "- Trình bày form Đăng ký Sáng kiến Kaizen trực tuyến dành cho công nhân (mô tả hiện trạng cũ vs giải pháp mới đề xuất).\n"
                "- Chuyển sang giao diện Kỹ sư IE (/work/ci/ie-queue hoặc /work/kaizen/ie-queue): Bấm vào một sáng kiến chờ duyệt, nhập thông số đo lường bấm giờ: 'Tiết kiệm 4.2 giây/đôi giày', bấm Phê Duyệt.\n"
                "- Chuyển sang màn hình Hội đồng Giám khảo (/work/kaizen/judge): Nhập điểm tiêu chí định lượng, định tính."
            ),
            "script": (
                "\"Điểm sáng học thuật lớn nhất trong đề tài của em chính là: ĐỘNG CƠ XÉT DUYỆT SÁNG KIẾN KAIZEN & IE QUEUE ENGINE (/work/kaizen & /work/ci).\n\n"
                "Trước đây, sáng kiến cải tiến của công nhân bị ứ đọng vì quy trình thẩm định phức tạp. Em đã số hóa toàn bộ vòng đời Kaizen thành một Workflow khép kín:\n"
                "1. Bước 1: Công nhân hoặc tổ trưởng đăng ký ý tưởng online, đính kèm ảnh chụp trước và sau cải tiến.\n"
                "2. Bước 2: Sáng kiến tự động đổ vào Hàng đợi của Kỹ sư IE (Industrial Engineering Queue). Kỹ sư IE dùng công cụ bấm giờ chuẩn hóa (Standard Time Study) "
                "đo lường thời gian chu kỳ tiết kiệm được trên từng đôi giày Skechers. Như Thầy Cô thấy trên màn hình: Kỹ sư nhập số giây tiết kiệm, "
                "hệ thống tự động tính ra số tiền làm lợi dự kiến cho nhà máy.\n"
                "3. Bước 3: Sáng kiến chuyển tiếp lên Hội đồng Giám khảo Ban Giám Đốc (/work/kaizen/judge). Các giám khảo chấm điểm độc lập trên thang điểm 100 "
                "dựa trên tính sáng tạo, khả năng nhân rộng và giá trị kinh tế.\n\n"
                "Nhờ động cơ xét duyệt tự động này, thời gian luân chuyển một hồ sơ Kaizen từ 21 ngày đã rút ngắn xuống chỉ còn chưa đầy 48 giờ! "
                "Công nhân được vinh danh và nhận thưởng nóng kịp thời, thúc đẩy tinh thần cải tiến liên tục trong toàn chuỗi.\""
            ),
            "notes": "Đây là chức năng mang hàm lượng nghiệp vụ IE và logic phần mềm cao nhất của đề tài."
        },
        # DEMO 7: ĐẶT PHÒNG HỌP & ADMIN
        {
            "part": "  -> Phân đoạn 3.7: Quản Lý Phòng Họp (/rooms) & Cổng Quản Trị Hệ Thống (/admin)",
            "time": "13:45 - 15:30",
            "visual": (
                "- Mở trang /rooms: Trình bày lưới lịch họp D1 realtime, chọn phòng họp VIP đón đối tác Skechers, xem sơ đồ bàn đón khách và mã QR check-in.\n"
                "- Mở trang /admin: Trình chiếu danh sách quản lý 384 nhân sự, tìm kiếm phân trang tức thời, quản trị danh mục dòng giày và trạng thái máy móc Cloudflare D1."
            ),
            "script": (
                "\"Hai phân hệ bổ trợ nhưng vô cùng thiết thực tiếp theo là:\n\n"
                "1. Hệ thống Đặt Phòng Họp & Đón Khách VIP (/rooms): "
                "Hiển thị trực quan lịch biểu các phòng họp của Văn phòng Chuỗi theo thời gian thực kết nối CSDL D1. "
                "Lễ tân và thư ký có thể đăng ký phòng, yêu cầu trang thiết bị trình chiếu, gắn thẻ đón tiếp đoàn khách đối tác nhãn hàng Skechers quốc tế "
                "và xuất mã QR Check-in điện tử tại quầy lễ tân.\n\n"
                "2. Cổng Quản Trị Hệ Thống Toàn Quyền (/admin): "
                "Dành riêng cho Quản trị viên cấp cao. Tại đây, em quản lý danh bạ tập trung của 384 cán bộ nhân sự, phân bổ quyền hạn phòng ban linh hoạt, "
                "quản lý danh mục dòng sản phẩm và theo dõi trạng thái đồng bộ dữ liệu Cloudflare D1. Mọi thao tác thêm sửa xóa nhân sự đều được đồng bộ hai chiều "
                "với hệ thống xác thực an toàn tuyệt đối.\""
            ),
            "notes": "Minh chứng tính toàn diện và hoàn thiện của sản phẩm từ Core nghiệp vụ đến phân hệ Quản trị nền tảng."
        },
        # GIAI ĐOẠN 4: KẾT QUẢ ĐẠT ĐƯỢC
        {
            "part": "PHẦN 4: TỔNG KẾT ĐÁNH GIÁ KẾT QUẢ ĐẠT ĐƯỢC SO VỚI TRƯỚC THỰC TẬP",
            "time": "15:30 - 17:30",
            "visual": (
                "- Mở slide Bảng So sánh Đối chiếu Chỉ số Hiệu quả (Before vs After Comparison Table).\n"
                "- Chiếu Giấy xác nhận / Đánh giá kết quả thực tập từ Lãnh đạo TBS Group (Đạt loại Xuất sắc).\n"
                "- Chiếu các số liệu đo lường kỹ thuật: Thời gian tải trang (LCP < 1.2s), Điểm hiệu năng Lighthouse 98/100, Chi phí server 0 USD."
            ),
            "script": (
                "\"Kính thưa quý Thầy Cô, sau 2 tháng nỗ lực nghiên cứu, lập trình và triển khai thực tế tại Văn phòng Chuỗi SKECHERS – TBS Group, "
                "em xin vui mừng báo cáo những KẾT QUẢ ĐỊNH LƯỢNG CỤ THỂ mà hệ thống đã mang lại so với giai đoạn trước khi thực tập:\n\n"
                "1. Về tiến độ công việc: Tỷ lệ trôi việc, sót việc giảm từ 35% xuống còn 0% nhờ Bảng Kanban và thông báo thời gian thực.\n"
                "2. Về xử lý sự cố hiện trường: Thời gian phản hồi và khắc phục sự cố dừng chuyền 5S giảm từ 4 giờ xuống còn trung bình 15-20 phút, "
                "toàn bộ biên bản có hình ảnh minh chứng R2 rõ ràng, không còn tranh cãi trách nhiệm giữa các ca kíp.\n"
                "3. Về hiệu quả Kaizen: Chu kỳ xét duyệt sáng kiến rút ngắn từ 21 ngày xuống dưới 48 giờ, nâng số lượng sáng kiến đăng ký tăng gấp 3 lần trong tháng 8/2026.\n"
                "4. Về mặt công nghệ: Hệ thống đạt hiệu năng tải trang vượt trội với LCP dưới 1.2 giây, điểm Lighthouse đạt 98/100, "
                "và quan trọng nhất là chi phí duy trì máy chủ cho doanh nghiệp bằng 0 đồng nhờ tận dụng tối đa nền tảng Cloudflare Serverless.\n\n"
                "Sản phẩm đã được Cán bộ hướng dẫn – anh Ngô Hà Thanh An và Ban Quản lý Văn phòng Chuỗi nghiệm thu đánh giá loại HOÀN THÀNH XUẤT SẮC "
                "và hiện đang được đưa vào sử dụng hàng ngày cho các bộ phận nghiệp vụ.\""
            ),
            "notes": "Khẳng định giá trị thực tiễn và đóng góp thực chất của sinh viên cho doanh nghiệp."
        },
        # GIAI ĐOẠN 5: TƯƠNG LAI & LỜI KẾT
        {
            "part": "PHẦN 5: ĐỊNH HƯỚNG PHÁT TRIỂN TRONG TƯƠNG LAI & LỜI CẢM ƠN KẾT THÚC",
            "time": "17:30 - 19:30",
            "visual": (
                "- Khung hình 1 (17:30 - 18:30): Mở slide Lộ trình Nâng cấp Tương lai (Future Roadmap 2026 - 2027) gồm 4 mũi nhọn: AI Vision, LLM Kaizen Copilot, PWA Mobile Offline, Multi-Factory Expansion.\n"
                "- Khung hình 2 (18:30 - 19:30): Camera quay cận cảnh sinh viên chào kết thúc, slide hiện thông tin liên hệ và Lời cảm ơn chân thành."
            ),
            "script": (
                "\"Dù đã đạt được những kết quả ban đầu rất khả quan, song để hệ thống phát triển thành một giải pháp Smart Factory toàn diện hơn nữa, "
                "trong KẾ HOẠCH DỰ KIẾN TƯƠNG LAI, em và đội ngũ Chuyển đổi số TBS Group đã vạch ra 4 hướng nâng cấp trọng tâm:\n\n"
                "1. Tích hợp Thị Giác Máy Tính (AI Vision): Sử dụng mô hình AI phân tích tự động hình ảnh Gemba Walk để phát hiện lỗi trang phục bảo hộ lao động, "
                "lối thoát hiểm bị cản trở hoặc máy móc rò rỉ dầu mà không cần con người chụp ảnh thủ công.\n"
                "2. Trợ lý Ảo AI Kaizen Copilot: Ứng dụng mô hình ngôn ngữ lớn (LLM) để tự động đối chiếu đề xuất Kaizen mới với kho tri thức hàng ngàn sáng kiến "
                "lịch sử của TBS Group, đưa ra gợi ý tối ưu và cảnh báo trùng lặp ý tưởng ngay khi công nhân vừa gõ phím.\n"
                "3. Nâng cấp Ứng dụng Di Động Offline-First PWA: Hỗ trợ công nhân và kỹ sư quét mã QR máy móc và ghi nhận biên bản ngay cả khi vào sâu trong các hầm xưởng "
                "mất sóng Wi-Fi/4G, tự động đồng bộ lên mây khi có kết nối trở lại.\n"
                "4. Mở rộng Toàn Diện Chuỗi Nhà Máy: Nhân rộng mô hình từ Văn phòng Chuỗi sang toàn bộ các cụm nhà máy vệ tinh tại Kiên Giang 1, 2, 3 và Thoại Sơn – An Giang.\n\n"
                "Kính thưa quý Thầy Cô! Kỳ thực tập tốt nghiệp tại Tập đoàn Da Giày TBS Group là một chặng đường vô cùng ý nghĩa trong quãng đời sinh viên của em. "
                "Em không chỉ được rèn luyện kỹ năng lập trình phần mềm chuyên nghiệp mà còn được cọ xát thực tế với tư duy quản trị công nghiệp hiện đại.\n\n"
                "Em xin bày tỏ lòng biết ơn sâu sắc nhất đến Ban Giám hiệu, quý Thầy Cô Viện Công nghệ số – Trường Đại học Thủ Dầu Một, đặc biệt là Thầy Trần Bá Minh Sơn "
                "đã tận tình định hướng và truyền dạy kiến thức cho em suốt 4 năm qua. "
                "Em cũng xin trân trọng cảm ơn Ban Lãnh đạo Tập đoàn TBS Group, anh Ngô Hà Thanh An cùng toàn thể các anh chị đồng nghiệp tại Văn phòng Chuỗi SKECHERS "
                "đã tạo mọi điều kiện thuận lợi và tin tưởng giao cho em dự án trọng điểm này.\n\n"
                "Em xin kính chúc quý Thầy Cô và các anh chị dồi dào sức khỏe, hạnh phúc và thành công! "
                "Em xin chân thành cảm ơn và kính mong nhận được những lời nhận xét, góp ý quý báu từ Hội đồng!\""
            ),
            "notes": (
                "- Kết thúc chuyên nghiệp, khiêm tốn, lịch sự.\n"
                "- Tạo ấn tượng sâu sắc về tiềm năng phát triển của đề tài khóa luận."
            )
        }
    ]

    # Render Table
    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(1.2), Inches(2.2), Inches(2.6), Inches(1.2)]
    
    # Header Row
    hdr_cells = table.rows[0].cells
    headers_text = ["Thời Lượng", "Phân Cảnh & Thao Tác Màn Hình", "Lời Thoại Chi Tiết (Script Nói)", "Ghi Chú Kỹ Thuật"]
    for i, title in enumerate(headers_text):
        hdr_cells[i].width = col_widths[i]
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(hdr_cells[i], "00552E")
        set_cell_margins(hdr_cells[i], 120, 120, 100, 100)

    # Data Rows
    for sc in scenes:
        # Part separator row if specified
        if sc.get("part"):
            sep_row = table.add_row()
            sep_cell = sep_row.cells[0]
            # Merge all 4 cells
            for j in range(1, 4):
                sep_row.cells[0].merge(sep_row.cells[j])
            p_sep = sep_cell.paragraphs[0]
            p_sep.paragraph_format.space_before = Pt(4)
            p_sep.paragraph_format.space_after = Pt(4)
            r_sep = p_sep.add_run(sc["part"])
            r_sep.bold = True
            r_sep.font.size = Pt(10.5)
            r_sep.font.color.rgb = RGBColor(0, 75, 40)
            set_cell_background(sep_cell, "E3F2EB")
            set_cell_margins(sep_cell, 80, 80, 120, 120)

        row = table.add_row()
        c_time, c_vis, c_scr, c_note = row.cells[0], row.cells[1], row.cells[2], row.cells[3]
        
        c_time.width = col_widths[0]
        c_vis.width = col_widths[1]
        c_scr.width = col_widths[2]
        c_note.width = col_widths[3]

        # Time cell
        pt = c_time.paragraphs[0]
        pt.alignment = WD_ALIGN_PARAGRAPH.CENTER
        rt = pt.add_run(sc["time"])
        rt.bold = True
        rt.font.size = Pt(9.5)
        rt.font.color.rgb = RGBColor(180, 50, 0)

        # Visual cell
        pv = c_vis.paragraphs[0]
        rv = pv.add_run(sc["visual"])
        rv.font.size = Pt(9)
        rv.font.color.rgb = RGBColor(40, 40, 40)

        # Script cell
        ps = c_scr.paragraphs[0]
        rs = ps.add_run(sc["script"])
        rs.font.size = Pt(9.5)
        rs.font.color.rgb = RGBColor(20, 20, 20)

        # Notes cell
        pn = c_note.paragraphs[0]
        rn = pn.add_run(sc["notes"])
        rn.font.size = Pt(8.5)
        rn.italic = True
        rn.font.color.rgb = RGBColor(90, 90, 90)

        # Margins & alternating background
        for c in (c_time, c_vis, c_scr, c_note):
            set_cell_margins(c, 80, 80, 100, 100)
            c.vertical_alignment = WD_ALIGN_VERTICAL.TOP

    # Output file
    output_path = os.path.abspath("script.docx")
    doc.save(output_path)
    print(f"[SUCCESS] Generated script.docx successfully at: {output_path}")

if __name__ == "__main__":
    create_script_document()
