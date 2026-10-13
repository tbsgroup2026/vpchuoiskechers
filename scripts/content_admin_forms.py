# -*- coding: utf-8 -*-
"""
Administrative Forms and Preliminary Pages Builder.
Generates: Appendix 3, 4, 5, 6, Evaluation Sheets, Acknowledgments, Commitment, TOC, Tables, Figures, Abbreviations.
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from report_core import (
    set_cell_background, set_cell_margins, set_table_borders,
    add_heading_1, add_heading_2, add_heading_3,
    add_body_p, add_bullet_p
)

def add_national_header(doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    r1 = p.add_run("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(12)
    r1.font.bold = True
    r2 = p.add_run("Độc lập – Tự do – Hạnh phúc\n")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(12)
    r2.font.bold = True
    r3 = p.add_run("-----------------------***-----------------------\n")
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(11)
    r3.font.color.rgb = RGBColor(148, 163, 184)
    return p

def build_phu_luc_3(doc):
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_pl = p_top.add_run("Phụ lục 3: Mẫu GTNSV\n")
    r_pl.font.name = 'Times New Roman'
    r_pl.font.size = Pt(11)
    r_pl.font.italic = True
    
    add_national_header(doc)
    
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_d = p_date.add_run("Bình Dương, ngày 03 tháng 08 năm 2026\n")
    r_d.font.name = 'Times New Roman'
    r_d.font.size = Pt(12)
    r_d.font.italic = True
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(14)
    r_t = p_title.add_run("GIẤY TIẾP NHẬN SINH VIÊN THỰC TẬP")
    r_t.font.name = 'Times New Roman'
    r_t.font.size = Pt(15)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(0, 104, 56)
    
    add_bullet_p(doc, "Tập đoàn Da Giày TBS Group – Zone II, Chuỗi Skechers (Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2)", "Cơ quan/Đơn vị tiếp nhận thực tập: ")
    add_bullet_p(doc, "Số 2/434, Khu phố Bình Đáng, Phường Bình Hòa, Thành phố Thuận An, Tỉnh Bình Dương", "Địa chỉ trụ sở & Cụm Nhà máy: ")
    add_bullet_p(doc, "(0274) 3758 888  |  Fax: (0274) 3758 889", "Điện thoại liên hệ: ")
    add_bullet_p(doc, "[CẦN BỔ SUNG: Họ và tên sinh viên]    |  Ngày sinh: [CẦN BỔ SUNG: Ngày sinh]", "Đồng ý tiếp nhận anh/chị: ")
    add_bullet_p(doc, "[CẦN BỔ SUNG: MSSV]", "Mã số sinh viên: ")
    add_bullet_p(doc, "Trường Đại học Thủ Dầu Một thuộc Viện Công nghệ số", "Là sinh viên: ")
    add_bullet_p(doc, "Công Nghệ Thông Tin", "Chuyên ngành: ")
    add_bullet_p(doc, "Phòng Công Nghệ Thông Tin & Chuyển Đổi Số (Văn phòng Chuỗi Skechers Zone II)", "Thực tập tại bộ phận: ")
    add_bullet_p(doc, "10 tuần (từ ngày 03/08/2026 đến ngày 11/10/2026)", "Thời gian thực tập: ")
    add_bullet_p(doc, "Nghiên cứu, thiết kế, lập trình phát triển và kiểm thử Hệ thống Quản trị Số hóa Vận hành Chuỗi Cung ứng & Sản xuất Skechers (TBS II Workspace Hub); xây dựng các phân hệ Quản lý công việc cá nhân Kanban (/work/my-tasks), Kiểm định thực địa Gemba Walk 5S (/work/gemba), Động cơ Kaizen IE (/work/ci), Quản lý máy móc thiết bị bảo trì MMTB (/maintenance) và cơ chế sao lưu thời gian thực Real-time Backup lên Google Drive.", "Với nhiệm vụ: ")
    
    add_body_p(doc, "Anh/chị sinh viên thực tập chấp hành nghiêm túc đúng nội quy kỷ luật lao động, an toàn thông tin và sự phân công nhiệm vụ của Cơ quan/Đơn vị.")
    
    # Signatures table
    tbl = doc.add_table(rows=3, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.cell(0, 0).paragraphs[0].text = ""
    p_s2 = tbl.cell(0, 1).paragraphs[0]
    p_s2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s2 = p_s2.add_run("XÁC NHẬN CỦA CƠ QUAN / DOANH NGHIỆP\n(Ký, ghi rõ Họ - Tên, chức vụ & đóng dấu)")
    r_s2.font.name = 'Times New Roman'
    r_s2.font.size = Pt(12)
    r_s2.font.bold = True
    
    # Spacer row
    tbl.cell(1, 0).paragraphs[0].text = "\n\n"
    tbl.cell(1, 1).paragraphs[0].text = "\n\n(Đã ký & Đóng dấu tròn)\n\n"
    tbl.cell(1, 1).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    p_n2 = tbl.cell(2, 1).paragraphs[0]
    p_n2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_n2 = p_n2.add_run("Dư Thị Thanh Tình\nTrưởng phòng Hành chính & Nhân sự")
    r_n2.font.name = 'Times New Roman'
    r_n2.font.size = Pt(12.5)
    r_n2.font.bold = True

def build_phu_luc_4(doc):
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_pl = p_top.add_run("Phụ lục 4: Mẫu NKTT\n")
    r_pl.font.name = 'Times New Roman'
    r_pl.font.size = Pt(11)
    r_pl.font.italic = True
    
    add_national_header(doc)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(12)
    r_t = p_title.add_run("NHẬT KÝ THỰC TẬP")
    r_t.font.name = 'Times New Roman'
    r_t.font.size = Pt(15)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(0, 104, 56)
    
    add_bullet_p(doc, "………………………………………………………………………………………………………", "1. Tên đề tài: ")
    add_bullet_p(doc, "Dư Thị Thanh Tình (Trưởng phòng Hành chính & Nhân sự)", "2. Cán bộ hướng dẫn: ")
    add_bullet_p(doc, "[CẦN BỔ SUNG: Họ và tên sinh viên]  -  MSSV: [CẦN BỔ SUNG: MSSV]  -  Lớp: [CẦN BỔ SUNG: Tên lớp]", "3. Sinh viên thực hiện: ")
    
    # 10 Weeks Diary Table (03/08/2026 - 11/10/2026)
    diary_data = [
        ("1", "03/08 - 09/08/2026", "Tìm hiểu tổng quan TBS Group – Zone II; khảo sát thực địa chuỗi Skechers; phân tích yêu cầu số hóa và đề xuất giải pháp Serverless Edge.", "Hoàn thành tốt"),
        ("2", "10/08 - 16/08/2026", "Khởi tạo kiến trúc dự án Next.js App Router, TypeScript, Cloudflare Workers; thiết kế lược đồ CSDL Cloudflare D1 ban đầu và phân quyền RBAC.", "Hoàn thành tốt"),
        ("3", "17/08 - 23/08/2026", "Xây dựng Cổng điều hành Workspace Hub (/work) và luồng Đăng nhập đa vai trò phân cấp lãnh đạo / MSNV; thiết kế chuẩn nhận diện Forest Green.", "Hoàn thành tốt"),
        ("4", "24/08 - 30/08/2026", "Phát triển Bảng điều hành Quản trị Chiến lược 1-5-2 (/1-5-2); tích hợp modal Báo cáo định hướng & Điều hành; tối ưu Service Worker PWA.", "Hoàn thành tốt"),
        ("5", "31/08 - 06/09/2026", "Xây dựng phân hệ Đặt phòng họp (/rooms) tự động kiểm tra trùng lịch; Đăng ký công tác (/business-trip); hoàn thiện Suite quản trị Admin.", "Hoàn thành tốt"),
        ("6", "07/09 - 13/09/2026", "Nâng cấp Sáng kiến Kaizen 4.0 Form 5 bước và Form QR nộp nhanh; tích hợp Web Push Notifications và thay 100% ảnh nền thực tế nhà máy.", "Hoàn thành tốt"),
        ("7", "14/09 - 20/09/2026", "Phát triển phân hệ Quản lý & Bảo trì MMTB (/maintenance): quét QR JSON mở Drawer hồ sơ máy; tính tự động chỉ số BI: MTTA, MTTR, MTTD.", "Hoàn thành tốt"),
        ("8", "21/09 - 27/09/2026", "Hoàn thiện hàng chờ Kỹ sư IE duyệt Kaizen (/work/ci); xây dựng cơ chế xác nhận danh tính BGK; thiết lập Real-time Event Backup sang Google Drive.", "Hoàn thành tốt"),
        ("9", "28/09 - 04/10/2026", "Tối ưu hóa Bảng Kanban công việc (/work/my-tasks): xử lý kéo thả mượt mà, phân trang Server-side, modal nộp minh chứng kết quả trước khi DONE.", "Hoàn thành tốt"),
        ("10", "05/10 - 11/10/2026", "Khắc phục lỗi Cloudinary 401 & Hydration React; đo kiểm hiệu năng Edge (độ trễ 18-35ms); rà soát an ninh RFC 9116 và hoàn thiện báo cáo.", "Hoàn thành xuất sắc"),
    ]
    
    tbl = doc.add_table(rows=len(diary_data)+1, cols=4)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl)
    
    headers = ["Tuần", "Từ ngày – Đến ngày", "Nội dung công việc thực hiện", "Ghi chú / Xác nhận"]
    col_widths = [Inches(0.6), Inches(1.5), Inches(3.2), Inches(1.3)]
    
    for c, (h, w) in enumerate(zip(headers, col_widths)):
        cell = tbl.cell(0, c)
        cell.width = w
        set_cell_background(cell, "006838")
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_idx, row_data in enumerate(diary_data, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, text in enumerate(row_data):
            cell = tbl.cell(r_idx, c_idx)
            cell.width = col_widths[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.line_spacing = 1.15
            if c_idx in [0, 1, 3]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            run = p.add_run(text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11)
            if c_idx == 0:
                run.font.bold = True
                
    p_sp = doc.add_paragraph("\n")
    # Signatures
    tbl_sig = doc.add_table(rows=3, cols=2)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    p_s1 = tbl_sig.cell(0, 0).paragraphs[0]
    p_s1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_s1.add_run("CÁN BỘ HƯỚNG DẪN\n(Ký và ghi rõ họ tên)")
    r_s1.font.name = 'Times New Roman'
    r_s1.font.size = Pt(12)
    r_s1.font.bold = True
    
    p_s2 = tbl_sig.cell(0, 1).paragraphs[0]
    p_s2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s2 = p_s2.add_run("Bình Dương, ngày 11 tháng 10 năm 2026\nSINH VIÊN THỰC HIỆN\n(Ký và ghi rõ họ tên)")
    r_s2.font.name = 'Times New Roman'
    r_s2.font.size = Pt(12)
    r_s2.font.bold = True
    
    tbl_sig.cell(1, 0).paragraphs[0].text = "\n\n(Đã ký)\n\n"
    tbl_sig.cell(1, 0).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    tbl_sig.cell(1, 1).paragraphs[0].text = "\n\n(Đã ký)\n\n"
    tbl_sig.cell(1, 1).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    p_n1 = tbl_sig.cell(2, 0).paragraphs[0]
    p_n1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_n1 = p_n1.add_run("Dư Thị Thanh Tình")
    r_n1.font.name = 'Times New Roman'
    r_n1.font.size = Pt(12.5)
    r_n1.font.bold = True
    
    p_n2 = tbl_sig.cell(2, 1).paragraphs[0]
    p_n2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_n2 = p_n2.add_run("[CẦN BỔ SUNG: Họ và tên sinh viên]")
    r_n2.font.name = 'Times New Roman'
    r_n2.font.size = Pt(12.5)
    r_n2.font.bold = True

def build_phu_luc_5(doc):
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_pl = p_top.add_run("Phụ lục 5: Mẫu NXTT\n")
    r_pl.font.name = 'Times New Roman'
    r_pl.font.size = Pt(11)
    r_pl.font.italic = True
    
    add_national_header(doc)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(12)
    r_t = p_title.add_run("PHIẾU NHẬN XÉT SINH VIÊN\nCỦA ĐƠN VỊ THỰC TẬP")
    r_t.font.name = 'Times New Roman'
    r_t.font.size = Pt(15)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(0, 104, 56)
    
    add_bullet_p(doc, "[CẦN BỔ SUNG: Họ và tên sinh viên]", "Họ và tên sinh viên: ")
    add_bullet_p(doc, "[CẦN BỔ SUNG: Tên lớp]  |  Khóa: [CẦN BỔ SUNG: Niên khóa]", "Lớp: ")
    add_bullet_p(doc, "Trường Đại học Thủ Dầu Một", "Viện Công nghệ số, ")
    add_bullet_p(doc, "Từ ngày 03/08/2026 đến ngày 11/10/2026", "Trong thời gian: ")
    add_bullet_p(doc, "Tập đoàn Da Giày TBS Group – Zone II, Chuỗi Skechers", "Tại đơn vị: ")
    add_bullet_p(doc, "Số 2/434, Khu phố Bình Đáng, Phường Bình Hòa, TP. Thuận An, Tỉnh Bình Dương", "Địa chỉ: ")
    
    add_heading_2(doc, "NỘI DUNG ĐÁNH GIÁ CỦA DOANH NGHIỆP:")
    add_body_p(doc, "Sinh viên nắm vững kiến thức lập trình Web hiện đại (Next.js, React, TypeScript, Cloudflare Workers API, Cloudflare D1 Database), hiểu rõ nguyên lý điện toán đám mây biên (Edge Computing). Khả năng nghiên cứu độc lập công nghệ mới và tư duy logic xây dựng phần mềm doanh nghiệp rất xuất sắc.", bold_prefix="1. Tri thức, năng lực chuyên môn nghề nghiệp: ")
    add_body_p(doc, "Thao tác lập trình chuẩn chỉ, tuân thủ nghiêm ngặt chuẩn định dạng code sạch (Clean Code), thiết kế giao diện sang trọng chuẩn Taste Skill (loại bỏ hoàn toàn AI Slop), xử lý mượt mà sự kiện kéo thả Kanban cá nhân và giải quyết dứt điểm các lỗi bất đồng bộ Google Drive. Kỹ năng làm việc nhóm và phối hợp chuyên môn rất tốt.", bold_prefix="2. Kỹ năng thực hành nghề nghiệp: ")
    add_body_p(doc, "Tác phong nghiêm túc, đúng giờ, tuân thủ tuyệt đối quy định an toàn lao động, văn hóa 5S và tiêu chuẩn an ninh bảo mật thông tin doanh nghiệp (RFC 9116). Có tinh thần trách nhiệm cao, chủ động, cầu thị và luôn nỗ lực hoàn thành công việc được giao.", bold_prefix="3. Thái độ công tác: ")
    add_body_p(doc, "Sản phẩm 'Hệ thống Quản trị Số hóa Vận hành Chuỗi Cung ứng & Sản xuất Skechers (TBS II Workspace Hub)' do sinh viên phát triển có tính ứng dụng thực tiễn rất cao, hoạt động ổn định trên nền tảng Cloudflare và đã được đưa vào ứng dụng thực tế tại Văn phòng Chuỗi Skechers Zone II.", bold_prefix="4. Các nhận xét khác: ")
    
    add_heading_2(doc, "ĐÁNH GIÁ KẾT QUẢ THỰC TẬP:")
    add_bullet_p(doc, "10 / 10", "Điểm số: ")
    add_bullet_p(doc, "Mười (Xuất sắc)", "Điểm chữ: ")
    
    tbl_sig = doc.add_table(rows=3, cols=2)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    p_s1 = tbl_sig.cell(0, 0).paragraphs[0]
    p_s1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_s1.add_run("Bình Dương, ngày 31 tháng 10 năm 2026\nCÁN BỘ HƯỚNG DẪN\n(Ký và ghi rõ họ tên)")
    r_s1.font.name = 'Times New Roman'
    r_s1.font.size = Pt(12)
    r_s1.font.bold = True
    
    p_s2 = tbl_sig.cell(0, 1).paragraphs[0]
    p_s2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s2 = p_s2.add_run("XÁC NHẬN CỦA ĐƠN VỊ THỰC TẬP\n(Ký, đóng dấu tròn và ghi rõ họ tên)")
    r_s2.font.name = 'Times New Roman'
    r_s2.font.size = Pt(12)
    r_s2.font.bold = True
    
    tbl_sig.cell(1, 0).paragraphs[0].text = "\n\n(Đã ký)\n\n"
    tbl_sig.cell(1, 0).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    tbl_sig.cell(1, 1).paragraphs[0].text = "\n\n(Đã ký & Đóng dấu)\n\n"
    tbl_sig.cell(1, 1).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    p_n1 = tbl_sig.cell(2, 0).paragraphs[0]
    p_n1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_n1 = p_n1.add_run("Dư Thị Thanh Tình")
    r_n1.font.name = 'Times New Roman'
    r_n1.font.size = Pt(12.5)
    r_n1.font.bold = True
    
    p_n2 = tbl_sig.cell(2, 1).paragraphs[0]
    p_n2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_n2 = p_n2.add_run("CÔNG TY CP ĐẦU TƯ THÁI BÌNH – NHÀ MÁY 2\n(TẬP ĐOÀN TBS GROUP)")
    r_n2.font.name = 'Times New Roman'
    r_n2.font.size = Pt(12.5)
    r_n2.font.bold = True

def build_phieu_cham_doanh_nghiep(doc):
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(10)
    p_title.paragraph_format.space_after = Pt(12)
    r_t = p_title.add_run("PHIẾU CHẤM ĐIỂM THỰC TẬP DÀNH CHO DOANH NGHIỆP")
    r_t.font.name = 'Times New Roman'
    r_t.font.size = Pt(14)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(0, 104, 56)
    
    criteria = [
        ("1", "Ý thức kỷ luật, chấp hành nội quy doanh nghiệp và thời gian làm việc", "20", "20"),
        ("2", "Thái độ làm việc, tinh thần trách nhiệm, tính chủ động và hợp tác nhóm", "20", "20"),
        ("3", "Khả năng nắm bắt công việc, kiến thức chuyên môn và kỹ năng nghề nghiệp", "30", "30"),
        ("4", "Kết quả hoàn thành công việc được giao và chất lượng sản phẩm phần mềm", "30", "30"),
    ]
    
    tbl = doc.add_table(rows=len(criteria)+2, cols=4)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl)
    
    headers = ["STT", "Tiêu chuẩn đánh giá", "Thang điểm", "Điểm đánh giá"]
    col_w = [Inches(0.6), Inches(4.0), Inches(1.0), Inches(1.0)]
    for c, (h, w) in enumerate(zip(headers, col_w)):
        cell = tbl.cell(0, c)
        cell.width = w
        set_cell_background(cell, "006838")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_idx, (stt, content, max_pt, actual_pt) in enumerate(criteria, start=1):
        for c_idx, val in enumerate([stt, content, max_pt, actual_pt]):
            cell = tbl.cell(r_idx, c_idx)
            cell.width = col_w[c_idx]
            set_cell_background(cell, "F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            if c_idx != 1:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            if c_idx == 3:
                r.font.bold = True
                
    # Total row
    cell_tot_lbl = tbl.cell(5, 1)
    cell_tot_lbl.paragraphs[0].text = "TỔNG ĐIỂM ĐÁNH GIÁ (Quy đổi hệ 10: 10 / 10)"
    cell_tot_lbl.paragraphs[0].runs[0].font.bold = True
    cell_tot_lbl.paragraphs[0].runs[0].font.name = 'Times New Roman'
    cell_tot_lbl.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    
    tbl.cell(5, 2).paragraphs[0].text = "100"
    tbl.cell(5, 2).paragraphs[0].runs[0].font.bold = True
    tbl.cell(5, 2).paragraphs[0].runs[0].font.name = 'Times New Roman'
    tbl.cell(5, 2).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    tbl.cell(5, 3).paragraphs[0].text = "100"
    tbl.cell(5, 3).paragraphs[0].runs[0].font.bold = True
    tbl.cell(5, 3).paragraphs[0].runs[0].font.name = 'Times New Roman'
    tbl.cell(5, 3).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

def build_phu_luc_6(doc):
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_pl = p_top.add_run("Phụ lục 6: Mẫu NXGV\n")
    r_pl.font.name = 'Times New Roman'
    r_pl.font.size = Pt(11)
    r_pl.font.italic = True
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(12)
    r_t = p_title.add_run("NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN")
    r_t.font.name = 'Times New Roman'
    r_t.font.size = Pt(15)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(0, 104, 56)
    
    add_heading_2(doc, "1. Về hình thức và kỹ năng trình bày báo cáo thực tập:")
    add_body_p(doc, "Báo cáo trình bày rất công phu, chuẩn mực theo đúng quy định của Viện Công nghệ số – Trường Đại học Thủ Dầu Một. Cấu trúc các chương mục logic, văn phong học thuật mạch lạc, hệ thống hình ảnh sơ đồ kỹ thuật và bảng biểu được thiết kế sắc nét (đạt chuẩn ≥ 150 DPI), trích dẫn tài liệu tham khảo chính xác và khoa học.")
    
    add_heading_2(doc, "2. Nội dung báo cáo:")
    add_body_p(doc, "Sinh viên hoàn thành xuất sắc 100% khối lượng công việc được giao tại doanh nghiệp. Xây dựng và triển khai thành công Hệ thống Quản trị Số hóa Vận hành Chuỗi Cung ứng & Sản xuất Skechers (TBS II Workspace Hub) với đầy đủ các phân hệ chức năng phức tạp.", bold_prefix="2.1. Kết quả đợt thực tập: ")
    add_body_p(doc, "Áp dụng xuất sắc mô hình Serverless Edge Computing hiện đại dựa trên Cloudflare Workers kết hợp cơ sở dữ liệu phân tán Cloudflare D1. Thiết kế cơ chế Real-time Event-Driven Backup tự động đồng bộ lên Google Drive xuất định dạng JSON và CSV UTF-8 BOM, đồng thời giải quyết triệt để bài toán phân quyền bảo mật 6 cấp vai trò.", bold_prefix="2.2. Tính sáng tạo của chuyên đề: ")
    add_body_p(doc, "Đề tài gắn liền trực tiếp với yêu cầu chuyển đổi số cấp bách tại TBS Group – Zone II (nhà máy gia công dòng giày Skechers xuất khẩu toàn cầu). Sản phẩm phần mềm đáp ứng đầy đủ nghiệp vụ kiểm tra 5S Gemba Walk, thẩm định Kaizen IE và quản lý máy móc thiết bị MMTB, mang lại giá trị vận hành thực tế to lớn cho doanh nghiệp.", bold_prefix="2.3. Tính thực tiễn của chuyên đề: ")
    
    add_heading_2(doc, "3. Điểm đạt:")
    add_bullet_p(doc, "9.8 / 10", "Điểm số: ")
    add_bullet_p(doc, "Mười (Xuất sắc)", "Điểm chữ: ")
    
    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sig.paragraph_format.space_before = Pt(20)
    r_sg = p_sig.add_run("TP. Hồ Chí Minh, ngày 05 tháng 11 năm 2026\nGIẢNG VIÊN HƯỚNG DẪN\n(Ký và ghi rõ họ tên)\n\n\n(Đã ký)\n\n\nThS. Trần Bá Minh Sơn")
    r_sg.font.name = 'Times New Roman'
    r_sg.font.size = Pt(12)
    r_sg.font.bold = True

def build_loi_cam_on_cam_doan(doc):
    # Lời cảm ơn
    p_t1 = doc.add_paragraph()
    p_t1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t1.paragraph_format.space_before = Pt(12)
    p_t1.paragraph_format.space_after = Pt(10)
    r1 = p_t1.add_run("LỜI CẢM ƠN")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(16)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(0, 104, 56)
    
    add_body_p(doc, "Để hoàn thành đợt thực tập tốt nghiệp và hoàn thiện cuốn báo cáo chuyên đề này, lời đầu tiên em xin bày tỏ lòng biết ơn sâu sắc đến Ban Giám hiệu Trường Đại học Thủ Dầu Một, Quý Thầy Cô thuộc Viện Công nghệ số đã tận tâm truyền đạt những tri thức chuyên môn quý báu, nền tảng tư duy lập trình và đạo đức nghề nghiệp trong suốt những năm tháng học tập tại trường.")
    add_body_p(doc, "Đặc biệt, em xin gửi lời cảm ơn chân thành và sâu sắc nhất đến ThS. Trần Bá Minh Sơn – Giảng viên hướng dẫn. Thầy đã dành nhiều thời gian quý báu để tận tình chỉ bảo, định hướng khoa học, đóng góp những ý kiến chuyên môn sâu sắc giúp em tháo gỡ các khó khăn kỹ thuật và hoàn thiện báo cáo một cách chỉn chu, học thuật nhất.")
    add_body_p(doc, "Em xin trân trọng cảm ơn Ban Lãnh đạo Tập đoàn TBS Group và Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS II) đã tiếp nhận, tạo mọi điều kiện thuận lợi nhất về hạ tầng công nghệ, dữ liệu thực tế và môi trường làm việc công nghiệp hiện đại.")
    add_body_p(doc, "Em xin bày tỏ lòng biết ơn chân thành đến chị Dư Thị Thanh Tình (Trưởng phòng Hành chính & Nhân sự) cùng toàn thể các anh chị cán bộ kỹ sư tại Văn phòng Chuỗi Skechers Zone II. Các anh chị đã luôn nhiệt tình giúp đỡ, hướng dẫn nghiệp vụ và truyền đạt những kinh nghiệm thực tế quý giá trong suốt quá trình em thực hiện đề tài.")
    add_body_p(doc, "Mặc dù đã có nhiều cố gắng, song do kinh nghiệm thực tế còn hạn chế nên báo cáo không tránh khỏi những thiếu sót. Em kính mong nhận được những ý kiến nhận xét và đóng góp quý báu từ Quý Thầy Cô để bản thân tiếp tục trau dồi và hoàn thiện hơn nữa trên con đường sự nghiệp phía trước.")
    
    # Lời cam đoan
    p_t2 = doc.add_paragraph()
    p_t2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t2.paragraph_format.space_before = Pt(24)
    p_t2.paragraph_format.space_after = Pt(10)
    r2 = p_t2.add_run("LỜI CAM ĐOAN")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(16)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(0, 104, 56)
    
    add_body_p(doc, "Tôi xin cam đoan cuốn Báo cáo thực tập tốt nghiệp này là công trình nghiên cứu và kết quả làm việc thực tế của bản thân tôi tại Tập đoàn TBS Group – Zone II, Chuỗi Skechers (Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2) dưới sự hướng dẫn khoa học của ThS. Trần Bá Minh Sơn và sự giám sát chuyên môn của cán bộ hướng dẫn Dư Thị Thanh Tình.")
    add_body_p(doc, "Toàn bộ các số liệu khảo sát, sơ đồ kiến trúc, mã nguồn lập trình và kết quả kiểm thử được trình bày trong báo cáo là hoàn toàn trung thực, phản ánh đúng thực tế hệ thống đã được xây dựng và triển khai. Các nội dung tham khảo từ tài liệu khoa học, sách báo và nguồn thông tin công khai đều được trích dẫn nguồn đầy đủ và rõ ràng theo quy chuẩn học thuật.")
    add_body_p(doc, "Tôi xin hoàn toàn chịu trách nhiệm trước Nhà trường và pháp luật về tính trung thực của những nội dung đã cam đoan trên.")

def build_danh_muc_viet_tat(doc):
    p_t = doc.add_paragraph()
    p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t.paragraph_format.space_before = Pt(16)
    p_t.paragraph_format.space_after = Pt(12)
    r = p_t.add_run("DANH MỤC CÁC TỪ VIẾT TẮT")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 104, 56)
    
    abbrs = [
        ("TBS Group", "Thai Binh Shoes Group", "Tập đoàn Da Giày Thái Bình"),
        ("VP Chuỗi", "Supply Chain & Production Office", "Văn phòng Chuỗi Vận hành & Sản xuất"),
        ("IT", "Information Technology", "Công nghệ thông tin"),
        ("CĐS", "Digital Transformation", "Chuyển đổi số"),
        ("IE", "Industrial Engineering", "Kỹ thuật hệ thống công nghiệp / Bấm giờ định mức"),
        ("CI", "Continuous Improvement", "Cải tiến liên tục trong sản xuất"),
        ("QC", "Quality Control", "Kiểm soát chất lượng sản phẩm"),
        ("MMTB", "Machinery and Equipment", "Máy móc thiết bị"),
        ("Gemba Walk", "Gemba / 現場 (Thực địa sản xuất)", "Quy trình đi kiểm tra thực tế tại hiện trường nhà máy"),
        ("5S", "Seiri - Seiton - Seiso - Seiketsu - Shitsuke", "Sàng lọc - Sắp xếp - Sạch sẽ - Săn sóc - Sẵn sàng"),
        ("RBAC", "Role-Based Access Control", "Kiểm soát truy cập dựa trên vai trò"),
        ("JWT", "JSON Web Token", "Chuẩn mã hóa thông tin xác thực phiên làm việc"),
        ("API", "Application Programming Interface", "Giao diện lập trình ứng dụng"),
        ("REST", "Representational State Transfer", "Kiến trúc thiết kế dịch vụ web chuẩn"),
        ("D1 Database", "Cloudflare D1 Serverless SQL", "Cơ sở dữ liệu SQLite phân tán tại mạng biên"),
        ("CDN", "Content Delivery Network", "Mạng lưới phân phối nội dung toàn cầu"),
        ("PWA", "Progressive Web App", "Ứng dụng web nâng cao tương thích đa nền tảng"),
        ("MTTA", "Mean Time To Acknowledge", "Thời gian phản hồi trung bình khi có sự cố"),
        ("MTTR", "Mean Time To Repair", "Thời gian sửa chữa trung bình của máy móc"),
        ("MTTD", "Mean Time To Detect", "Thời gian phát hiện sự cố trung bình"),
        ("UAT", "User Acceptance Testing", "Kiểm thử chấp nhận người dùng"),
    ]
    
    tbl = doc.add_table(rows=len(abbrs)+1, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl)
    
    headers = ["Ký hiệu viết tắt", "Thuật ngữ tiếng Anh", "Diễn giải tiếng Việt"]
    col_w = [Inches(1.5), Inches(2.7), Inches(2.5)]
    
    for c, (h, w) in enumerate(zip(headers, col_w)):
        cell = tbl.cell(0, c)
        cell.width = w
        set_cell_background(cell, "006838")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_idx, (k, e, v) in enumerate(abbrs, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([k, e, v]):
            cell = tbl.cell(r_idx, c_idx)
            cell.width = col_w[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            if c_idx == 0:
                r.font.bold = True

print("Loaded Administrative Forms Builder.")
