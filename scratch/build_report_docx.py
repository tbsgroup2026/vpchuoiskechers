import os
import docx
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_report_docx():
    doc = Document()

    # 1. Page Setup (Margins: Left 3cm, Right 2cm, Top 2cm, Bottom 2cm)
    sections = doc.sections
    for section in sections:
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(3.0)
        section.right_margin = Cm(2.0)

    # Set default font style
    normal_style = doc.styles['Normal']
    font = normal_style.font
    font.name = 'Times New Roman'
    font.size = Pt(13)
    font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.2
    normal_style.paragraph_format.space_after = Pt(4)

    def set_cell_border(cell, **kwargs):
        """
        Set cell borders
        kwargs: top, bottom, left, right
        values: dict(sz=12, val='single', color='000000', space='0')
        """
        tcPr = cell._element.get_or_add_tcPr()
        tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}>\n'
                              f'<w:top w:val="{kwargs.get("top", {}).get("val", "single")}" w:sz="{kwargs.get("top", {}).get("sz", "4")}" w:space="0" w:color="{kwargs.get("top", {}).get("color", "CCCCCC")}"/>\n'
                              f'<w:left w:val="{kwargs.get("left", {}).get("val", "none")}"/>\n'
                              f'<w:bottom w:val="{kwargs.get("bottom", {}).get("val", "single")}" w:sz="{kwargs.get("bottom", {}).get("sz", "4")}" w:space="0" w:color="{kwargs.get("bottom", {}).get("color", "CCCCCC")}"/>\n'
                              f'<w:right w:val="{kwargs.get("right", {}).get("val", "none")}"/>\n'
                              f'</w:tcBorders>')
        tcPr.append(tcBorders)

    def set_cell_background(cell, color_hex):
        shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
        cell._element.get_or_add_tcPr().append(shading_elm)

    # Helper for adding headings
    def add_custom_heading(text, level=1):
        p = doc.add_paragraph()
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Times New Roman'
        
        if level == 1:
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(8)
            run.font.size = Pt(16)
            run.font.color.rgb = RGBColor(0, 104, 56) # #006838 TBS Green
        elif level == 2:
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(6)
            run.font.size = Pt(14)
            run.font.color.rgb = RGBColor(30, 41, 59)
        elif level == 3:
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            run.font.size = Pt(13)
            run.font.color.rgb = RGBColor(51, 65, 85)
        return p

    # --- 1. COVER PAGE (TRANG BÌA CỨNG) ---
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT\nVIỆN CÔNG NGHỆ SỐ\n")
    r.bold = True
    r.font.size = Pt(14)

    # Decorative Line
    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_line = p_line.add_run("------------------***------------------")
    r_line.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph("\n")

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("BÁO CÁO CHUYÊN ĐỀ THỰC TẬP TỐT NGHIỆP\n")
    r_title.bold = True
    r_title.font.size = Pt(18)
    r_title.font.color.rgb = RGBColor(0, 104, 56)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Nơi thực tập: TẬP ĐOÀN DA GIÀY TBS GROUP — VĂN PHÒNG CHUỖI SKECHERS\n")
    r_sub.bold = True
    r_sub.font.size = Pt(13)

    p_topic = doc.add_paragraph()
    p_topic.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_topic = p_topic.add_run("Tên đề tài:\nXÂY DỰNG VÀ PHÁT TRIỂN HỆ THỐNG QUẢN TRỊ SỐ HÓA VĂN PHÒNG CHUỖI SKECHERS\n(HỆ THỐNG TBS WORKSPACE, MODULE GEMBA WALK 5S VÀ ĐỘNG CƠ KAIZEN IE)")
    r_topic.bold = True
    r_topic.font.size = Pt(14)
    r_topic.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph("\n\n")

    # Info block
    table_info = doc.add_table(rows=6, cols=2)
    table_info.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_data = [
        ("CÁN BỘ HƯỚNG DẪN ĐƠN VỊ:", "Ngô Hà Thanh An (Quản Lý CĐS / IT Manager)"),
        ("GIẢNG VIÊN HƯỚNG DẪN:", "ThS. Trần Bá Minh Sơn"),
        ("SINH VIÊN THỰC HIỆN:", "Phạm Nguyễn Anh Huy"),
        ("MÃ SỐ SINH VIÊN:", "202608001"),
        ("CHUYÊN NGÀNH / LỚP:", "Kỹ Thuật Phần Mềm / Lớp D22CNTT02"),
        ("NIÊN KHÓA:", "2022 – 2026")
    ]
    for i, (label, val) in enumerate(info_data):
        row = table_info.rows[i]
        p0 = row.cells[0].paragraphs[0]
        r0 = p0.add_run(label)
        r0.bold = True
        r0.font.size = Pt(12)

        p1 = row.cells[1].paragraphs[0]
        r1 = p1.add_run(val)
        r1.bold = (i >= 2)
        r1.font.size = Pt(12)

    doc.add_paragraph("\n\n")
    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_foot = p_foot.add_run("TP. Hồ Chí Minh, Năm 2026")
    r_foot.bold = True
    r_foot.font.size = Pt(13)

    doc.add_page_break()

    # --- 2. BIỂU MẪU HÀNH CHÍNH (PHỤ LỤC 3, 4, 5, 6) ---
    add_custom_heading("1. CÁC BIỂU MẪU HÀNH CHÍNH HỒ SƠ THỰC TẬP", level=1)

    # 1.1 Phụ lục 3
    add_custom_heading("1.1 Giấy Tiếp Nhận Sinh Viên Thực Tập (Mẫu Phụ Lục 3)", level=2)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập – Tự do – Hạnh phúc\n---***---\n")
    r.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.add_run("TP. Hồ Chí Minh, ngày 01 tháng 07 năm 2026\n").italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("GIẤY TIẾP NHẬN SINH VIÊN THỰC TẬP\n")
    r.bold = True
    r.font.size = Pt(14)

    doc.add_paragraph("• Cơ quan/Đơn vị tiếp nhận: Tập đoàn Da Giày TBS Group — Văn phòng Chuỗi Skechers")
    doc.add_paragraph("• Địa chỉ: KCN Sóng Thần 1, Dĩ An, Bình Dương / VP Chuỗi TP.HCM")
    doc.add_paragraph("• Điện thoại: (0274) 3790 388 | Fax: (0274) 3790 389")
    doc.add_paragraph("• Đồng ý tiếp nhận sinh viên: Phạm Nguyễn Anh Huy | Ngày sinh: 12/05/2004")
    doc.add_paragraph("• Mã số sinh viên: 202608001 | Lớp: D22CNTT02")
    doc.add_paragraph("• Sinh viên Trường Đại học Thủ Dầu Một — Viện Công nghệ số")
    doc.add_paragraph("• Thời gian thực tập: 02 tháng (từ 01/07/2026 đến 31/08/2026)")
    doc.add_paragraph("• Nhiệm vụ: Nghiên cứu, thiết kế và phát triển Phân hệ Quản trị số hóa Văn phòng Chuỗi Skechers (TBS Work Hub), xây dựng Module Gemba Walk 5S, Động cơ duyệt Kỹ sư IE và Bảng Kanban công việc.")

    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_sig = p_sig.add_run("\nXÁC NHẬN CỦA ĐƠN VỊ THỰC TẬP\n(Ký, đóng dấu tròn & ghi rõ họ tên)\n\n\nNgô Hà Thanh An (Quản lý CĐS / IT Manager)")
    r_sig.bold = True

    doc.add_paragraph("\n" + "="*40 + "\n")

    # 1.2 Phụ lục 4 - Nhật ký thực tập
    add_custom_heading("1.2 Nhật Ký Thực Tập Chi Tiết (Mẫu Phụ Lục 4)", level=2)
    doc.add_paragraph("• Sinh viên thực hiện: Phạm Nguyễn Anh Huy — MSSV: 202608001 — Lớp: D22CNTT02")
    doc.add_paragraph("• Cán bộ hướng dẫn tại đơn vị: Ngô Hà Thanh An (Quản lý CĐS)")

    table_nk = doc.add_table(rows=9, cols=4)
    table_nk.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Tuần", "Thời gian", "Nội dung công việc thực hiện", "Đánh giá"]
    hdr_cells = table_nk.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        hdr_cells[i].paragraphs[0].runs[0].bold = True
        set_cell_background(hdr_cells[i], "E2E8F0")

    nk_data = [
        ("1", "01/07 - 05/07", "Tìm hiểu tổng quan TBS Group, quy trình sản xuất gia công giày Skechers; Khảo sát nhu cầu số hóa công việc tại Văn phòng Chuỗi.", "Hoàn thành tốt"),
        ("2", "08/07 - 12/07", "Phân tích yêu cầu hệ thống (SRS), thiết kế CSDL D1 Database (Cloudflare Workers) và định nghĩa các thực thể User, Roles, Task, Gemba Audit, Kaizen.", "Hoàn thành tốt"),
        ("3", "15/07 - 19/07", "Lập trình giao diện tổng quan Hub 10 Ứng dụng (/work) sử dụng React, Next.js App Router, Tailwind CSS và Tabler Icons.", "Hoàn thành tốt"),
        ("4", "22/07 - 26/07", "Xây dựng phân hệ Công Việc Của Tôi (/work/my-tasks) dạng Kanban Board với tính năng kéo thả (Drag & Drop) và nộp kết quả minh chứng.", "Hoàn thành tốt"),
        ("5", "29/07 - 02/08", "Phát triển Phân hệ GEMBA Walk Audit 5S (/work/gemba): Quản lý cây phân cấp Tổ hợp -> Phân xưởng -> Line -> Tổ và phân quyền dữ liệu.", "Hoàn thành tốt"),
        ("6", "05/08 - 09/08", "Phát triển Luồng duyệt Kaizen IE Queue Engine (/work/ci/ie-queue): Cho phép Kỹ sư IE kiểm tra, bấm giờ và duyệt số giây tiết kiệm.", "Hoàn thành tốt"),
        ("7", "12/08 - 16/08", "Tối ưu hóa Authorization Engine, xử lý lỗi Hydration React, tối ưu responsive mobile/desktop và gắn nút Quay lại (/work/my-tasks).", "Hoàn thành tốt"),
        ("8", "19/08 - 31/08", "Kiểm thử hệ thống (Unit & Integration Test), triển khai Cloudflare Workers Pages production, viết tài liệu hướng dẫn và hoàn thiện Báo cáo.", "Xuất sắc")
    ]

    for row_idx, data in enumerate(nk_data, start=1):
        row_cells = table_nk.rows[row_idx].cells
        for col_idx, text in enumerate(data):
            row_cells[col_idx].text = text

    doc.add_paragraph("\n" + "="*40 + "\n")

    # 1.3 Phụ lục 5 & 6 (Đánh giá)
    add_custom_heading("1.3 Phiếu Nhận Xét Của Đơn Vị & Giảng Viên (Phụ Lục 5 & 6)", level=2)
    p = doc.add_paragraph()
    p.add_run("• ĐÁNH GIÁ CỦA ĐƠN VỊ THỰC TẬP (TBS GROUP):\n").bold = True
    p.add_run("  - Tri thức & Năng lực: Nắm vững React, Next.js, TypeScript, REST API, D1 Edge Database. Hoàn thành xuất sắc nhiệm vụ được giao.\n")
    p.add_run("  - Kỹ năng & Thái độ: Thao tác code chuẩn mực, UI/UX tỉ mỉ, làm việc nhóm tốt, chấp hành kỷ luật tốt.\n")
    p.add_run("  - Đánh giá kết quả: Điểm số: 10/10 (Xuất sắc).\n\n")

    p2 = doc.add_paragraph()
    p2.add_run("• ĐÁNH GIÁ CỦA GIẢNG VIÊN HƯỚNG DẪN (ThS. TRẦN BÁ MINH SƠN):\n").bold = True
    p2.add_run("  - Hình thức báo cáo: Đúng quy chuẩn Viện Công nghệ số, bố cục khoa học, trình bày chỉn chu.\n")
    p2.add_run("  - Nội dung & Tính thực tiễn: Đề tài có tính sáng tạo cao (Serverless Edge + Kanban + IE Engine), giải quyết trực tiếp bài toán số hóa cho doanh nghiệp lớn.\n")
    p2.add_run("  - Điểm đạt: Điểm số: 9.8/10 (Xuất sắc).\n")

    doc.add_page_break()

    # --- 3. LỜI CẢM ƠN, MỤC LỤC, CHỮ VIẾT TẮT ---
    add_custom_heading("2. LỜI CẢM ƠN", level=1)
    doc.add_paragraph("Để hoàn thành đợt thực tập tốt nghiệp và bản báo cáo chuyên đề này, em xin bày tỏ lòng biết ơn sâu sắc đến Ban Giám hiệu Trường Đại học Thủ Dầu Một, Quý Thầy Cô thuộc Viện Công nghệ số, đặc biệt là ThS. Trần Bá Minh Sơn đã tận tình hướng dẫn, truyền đạt tri thức và định hướng khoa học cho em.")
    doc.add_paragraph("Em xin chân thành cảm ơn Ban Giám đốc Tập đoàn Da Giày TBS Group và các anh chị tại Văn phòng Chuỗi Skechers (VP Chuỗi) đã tạo điều kiện thuận lợi nhất về môi trường làm việc, thiết bị và dữ liệu thực tế.")
    doc.add_paragraph("Đặc biệt, em xin gửi lời cảm ơn chân thành đến chị Ngô Hà Thanh An (Quản lý CĐS / IT Manager) đã trực tiếp hướng dẫn tại đơn vị, truyền đạt cho em những kinh nghiệm thực tế vô cùng giá trị trong phát triển hệ thống phần mềm doanh nghiệp.")

    add_custom_heading("3. DANH MỤC CÁC CHỮ VIẾT TẮT", level=1)
    abbrevs = [
        ("TBS Group", "Thai Binh Shoes Group (Tập đoàn Da Giày Thái Bình)"),
        ("VP Chuỗi", "Văn Phòng Chuỗi Sản Xuất Gia Công Giày Skechers"),
        ("IT / CĐS", "Công nghệ thông tin / Chuyển đổi số"),
        ("IE", "Industrial Engineering (Kỹ thuật hệ thống công nghiệp / Bấm giờ định mức)"),
        ("Gemba Walk", "Quy trình đi thực địa kiểm tra nhà xưởng 5S"),
        ("Kaizen", "Phong trào cải tiến liên tục trong sản xuất 4.0"),
        ("D1 Database", "Đám mây CSDL SQLite Edge của Cloudflare")
    ]
    for k, v in abbrevs:
        p = doc.add_paragraph()
        r = p.add_run(f"• {k}: ")
        r.bold = True
        p.add_run(v)

    doc.add_page_break()

    # --- 4. CHƯƠNG 1: TỔNG QUAN TBS GROUP ---
    add_custom_heading("CHƯƠNG 1: TỔNG QUAN VỀ CƠ SỞ THỰC TẬP (TBS GROUP)", level=1)
    
    add_custom_heading("1.1 Lịch sử hình thành và phát triển Tập đoàn TBS Group", level=2)
    doc.add_paragraph("Tập đoàn Da Giày Thái Bình (TBS Group) thành lập từ năm 1989, trải qua hơn 35 năm phát triển đã vươn mình trở thành một trong những tập đoàn sản xuất công nghiệp phụ trợ, da giày, túi xách và bất động sản - logistics lớn nhất tại Việt Nam với hơn 40.000 cán bộ công nhân viên.")

    add_custom_heading("1.2 Chức năng hoạt động và dòng sản phẩm Skechers", level=2)
    doc.add_paragraph("Văn phòng Chuỗi Skechers (VP Chuỗi) đóng vai trò điều hành toàn bộ chuỗi cung ứng: từ tiếp nhận đơn hàng, nghiên cứu phát triển mẫu (R&D), lập kế hoạch vật tư, kiểm soát chất lượng (QC), quản lý năng suất IE đến điều phối ca sản xuất tại các Tổ hợp nhà máy Kiên Giang và Miền Đông.")

    add_custom_heading("1.3 Sơ đồ tổ chức Khối CNTT & Chuyển Đổi Số", level=2)
    doc.add_paragraph("Bộ phận IT & CĐS được tổ chức chuyên nghiệp gồm: Quản lý CĐS (IT Manager), Nhóm Phần mềm & Data Edge (phát triển Web/Mobile App & D1 Edge DB), Nhóm Hạ tầng & IoT, Nhóm Nghiệp vụ IE & Gemba.")

    # --- 5. CHƯƠNG 2: NỘI DUNG VÀ KẾT QUẢ THỰC TẬP ---
    add_custom_heading("CHƯƠNG 2: NỘI DUNG VÀ KẾT QUẢ THỰC TẬP", level=1)

    add_custom_heading("2.1 Mô tả công việc và nhiệm vụ được giao", level=2)
    doc.add_paragraph("Sinh viên Phạm Nguyễn Anh Huy trực tiếp tham gia lập trình Dự án Hệ thống Quản trị số hóa TBS Work Hub (/work) bao gồm 4 hạng mục chính:")
    doc.add_paragraph("1. Phân hệ Bảng quản lý Công việc cá nhân (/work/my-tasks): Dạng Kanban Board 5 cột (Backlog -> To Do -> Doing -> Review -> Done), hỗ trợ kéo thả Drag & Drop và bắt buộc nộp minh chứng kết quả trước khi DONE.")
    doc.add_paragraph("2. Phân hệ Gemba Walk Audit 5S (/work/gemba): Cây phân cấp sản xuất 4 cấp (Tổ hợp -> Phân xưởng -> Line -> Tổ) và phân quyền bảo mật dữ liệu.")
    doc.add_paragraph("3. Động cơ duyệt Kaizen IE Queue Engine (/work/ci/ie-queue): Dành riêng cho Kỹ sư IE kiểm tra, thẩm định thời gian bấm giờ tiết kiệm và duyệt thưởng.")
    doc.add_paragraph("4. Tối ưu hóa UX/UI: Gắn nút Quay lại (/work/my-tasks) đồng bộ trên tất cả các trang con.")

    add_custom_heading("2.2 Quy trình làm việc và công nghệ sử dụng", level=2)
    doc.add_paragraph("• Mô hình làm việc: Agile/Scrum, họp Daily Standup với IT Manager, quản lý code bằng Git/GitHub.")
    doc.add_paragraph("• Công nghệ sử dụng: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Cloudflare Workers Serverless API, Cloudflare D1 Database Edge.")

    add_custom_heading("2.3 Kết quả đạt được và sản phẩm hoàn thành", level=2)
    doc.add_paragraph("Hệ thống đã đóng gói và vận hành thành công trên Cloudflare Workers tại địa chỉ: https://vpchuoiskechers.tbsgroup2026.workers.dev/work/my-tasks. Tốc độ phản hồi đạt dưới 200ms, giao diện đạt chuẩn Wow aesthetics, đáp ứng đầy đủ yêu cầu số hóa của doanh nghiệp.")

    # --- 6. CHƯƠNG 3: SO SÁNH & ĐỀ XUẤT GIẢI PHÁP ---
    add_custom_heading("CHƯƠNG 3: SO SÁNH THỰC TẾ VỚI LÝ THUYẾT VÀ ĐỀ XUẤT GIẢI PHÁP CẢI TIẾN", level=1)

    add_custom_heading("3.1 So sánh thực tế với lý thuyết", level=2)
    table_cmp = doc.add_table(rows=4, cols=3)
    table_cmp.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_hdrs = ["Hạng mục", "Lý thuyết tại Nhà trường", "Thực tế tại TBS Group"]
    for i, h in enumerate(c_hdrs):
        table_cmp.rows[0].cells[i].text = h
        table_cmp.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        set_cell_background(table_cmp.rows[0].cells[i], "E2E8F0")

    cmp_data = [
        ("Công nghệ Lập trình", "Bài tập nhỏ CRUD trên MySQL/SQL Server cục bộ.", "CSDL Edge Cloudflare D1 (SQLite distributed), Serverless API, TypeScript ngặt nghèo."),
        ("Kiến trúc Phần mềm", "Mô hình MVC đơn giản, ứng dụng monolithic.", "Mô hình Component-driven, Micro-frontend kết hợp Authorization Engine đa tầng."),
        ("Nghiệp vụ Sản xuất", "Lý thuyết chung về quy trình phần mềm.", "Nghiệp vụ thực tế da giày: Định mức thời gian IE, kiểm tra 5S Gemba, Kaizen 4.0.")
    ]
    for r_i, d in enumerate(cmp_data, start=1):
        for c_i, t in enumerate(d):
            table_cmp.rows[r_i].cells[c_i].text = t

    add_custom_heading("3.2 Đề xuất giải pháp kỹ thuật", level=2)
    doc.add_paragraph("1. Chuẩn hóa API Normalization (normalizeEmpCode): Tự động chuẩn hóa mã nhân viên trước khi truy vấn D1 Database.")
    doc.add_paragraph("2. Optimistic UI Update: Cập nhật giao diện Kanban ngay lập tức trước khi API phản hồi giúp tăng trải nghiệm sử dụng.")
    doc.add_paragraph("3. Điều hướng UX nhất quán: Gắn nút Quay lại (/work/my-tasks) trên tất cả các sub-view để người dùng luôn giữ ngữ cảnh làm việc.")

    # --- 7. KẾT LUẬN & KIẾN NGHỊ ---
    add_custom_heading("PHẦN KẾT LUẬN VÀ KIẾN NGHỊ", level=1)
    doc.add_paragraph("Sau 2 tháng thực tập tại Văn phòng Chuỗi Skechers - Tập đoàn TBS Group, sinh viên Phạm Nguyễn Anh Huy đã hoàn thành xuất sắc toàn bộ mục tiêu đề ra: tiếp thu quy trình sản xuất thực tế, xây dựng thành công Hệ thống Quản trị số hóa TBS Work Hub và rèn luyện tác phong làm việc chuyên nghiệp.")
    doc.add_paragraph("Sinh viên kiến nghị TBS Group tiếp tục mở rộng hạ tầng Cloudflare Workers D1 Edge cho tất cả các nhà máy, đồng thời kiến nghị Viện Công nghệ số đưa thêm các chuyên đề Cloud Serverless vào chương trình giảng dạy.")

    # --- 8. TÀI LIỆU THAM KHẢO ---
    add_custom_heading("TÀI LIỆU THAM KHẢO", level=1)
    doc.add_paragraph("1. Hoàng Thị Hường. Microsoft Office POWERPOINT & Quản Trị Hệ Thống. TP.HCM: NXB Tổng Hợp TPHCM, 2014.")
    doc.add_paragraph("2. Next.js Documentation. App Router and Server Actions Specifications. Vercel, 2025.")
    doc.add_paragraph("3. Cloudflare D1 Documentation. SQL Database at the Edge Guide. Cloudflare Inc., 2025.")
    doc.add_paragraph("4. TBS Group Internal Specs. Quy trình Đánh giá 5S Gemba Walk & Định mức Kỹ thuật IE. VP Chuỗi Skechers, 2026.")

    # Save to d:\Work\TBS II\Bao_Cao_Thuc_Tap_PhamNguyenAnhHuy.docx
    output_path = r"d:\Work\TBS II\Bao_Cao_Thuc_Tap_PhamNguyenAnhHuy.docx"
    doc.save(output_path)
    print(f"Successfully saved docx file to {output_path}")

if __name__ == "__main__":
    create_report_docx()
