import docx
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

DOC_PATH = r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx'

def update_document():
    doc = docx.Document(DOC_PATH)
    
    # -------------------------------------------------------------
    # 1. PARAGRAPH TEXT REPLACEMENTS
    # -------------------------------------------------------------
    # Define mapping of old phrases / incorrect company info to correct Kiên Giang TBS II info
    replacements = [
        # Topic Title
        (r'XÂY DỰNG VÀ PHÁT TRIỂN HỆ THỐNG QUẢN TRỊ SỐ HÓA VĂN PHÒNG CHUỖI SKECHERS.*',
         'XÂY DỰNG VÀ PHÁT TRIỂN HỆ THỐNG QUẢN TRỊ SỐ HÓA VẬN HÀNH CÔNG TY CỔ PHẦN THÁI BÌNH KIÊN GIANG (TBS II WORKSPACE, GEMBA WALK 5S AUDIT & KAIZEN IE ENGINE)'),
        (r'Xây dựng và phát triển Hệ thống Quản trị số hóa Văn phòng Chuỗi Skechers.*',
         'Xây dựng và phát triển Hệ thống Quản trị số hóa Vận hành Công ty Cổ phần Thái Bình Kiên Giang (TBS II Workspace, Gemba Walk 5S Audit & Kaizen IE Engine)'),
        (r'Xây dựng và phát triển Hệ thống Quản trị số hóa TBS Work Hub.*',
         'Xây dựng và phát triển Hệ thống Quản trị số hóa Vận hành Công ty Cổ phần Thái Bình Kiên Giang (TBS II Workspace, Gemba Walk 5S Audit & Kaizen IE Engine)'),

        # Company Names
        (r'Tập đoàn Da Giày TBS Group — Văn phòng Chuỗi Skechers', 'Công Ty Cổ Phần Thái Bình Kiên Giang (TBS II - TBS GROUP)'),
        (r'Công Ty Cổ Phần Thái Bình Kiên Giang — Văn phòng Chuỗi Skechers', 'Công Ty Cổ Phần Thái Bình Kiên Giang (TBS II - TBS GROUP)'),
        (r'Công ty TNHH Cung Ứng Nhân Lực TBS Group — VP Chuỗi Skechers', 'Công Ty Cổ Phần Thái Bình Kiên Giang (TBS II)'),
        (r'TBS Group — VP Chuỗi Skechers', 'Công Ty Cổ Phần Thái Bình Kiên Giang (TBS II)'),
        (r'TẬP ĐOÀN DA GIÀY TBS GROUP — VĂN PHÒNG CHUỖI SKECHERS', 'CÔNG TY CỔ PHẦN THÁI BÌNH KIÊN GIANG (TBS II)'),

        # Address, Tax Code, Phone
        (r'1701958307-001', '1701588998'),
        (r'2/434, Khu phố Bình Đáng, Phường Bình Hòa, Thành phố Hồ Chí Minh', 'Khu công nghiệp Thạnh Lộc, Xã Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang'),
        (r'Phòng 202, Tòa nhà 57, số 57 Lê Thị Hồng Gấm, Phường Bến Thành, Thành phố Hồ Chí Minh', 'Khu công nghiệp Thạnh Lộc, Xã Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang'),
        (r'P\.202, Tòa nhà 57, Số 57 Lê Thị Hồng Gấm, Phường Bến Thành, TP\.HCM', 'KCN Thạnh Lộc, Xã Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang'),
        (r'0843959131', '(0297) 3922 888'),
        (r'028 3505 4224', '(0297) 3922 888'),

        # Geographic Scope
        (r'Bình Dương và Đồng Nai', 'tỉnh Kiên Giang (KCN Thạnh Lộc, Châu Thành)'),
        (r'Bình Dương, Đồng Nai', 'Kiên Giang'),
        (r'hai tỉnh Bình Dương và Đồng Nai', 'Tổ hợp Nhà máy Kiên Giang (TBS II) tại KCN Thạnh Lộc'),
        (r'tại Bình Dương và các tỉnh lân cận', 'tại Khu công nghiệp Thạnh Lộc, Kiên Giang'),
        (r'VSIP 1, VSIP 2, Mỹ Phước 1-2-3, Sóng Thần 1-2, Đồng An, Amata, Biên Hòa 1-2, Nhơn Trạch 1-2-3-4-5-6, Long Thành',
         'Nhà máy KG1, Nhà máy KG2, Nhà máy KG3, Xưởng Đế PU/Cao su thuộc Tổ hợp Kiên Giang (TBS II - KCN Thạnh Lộc)'),

        # Staffing / Recruitment agency descriptions -> Manufacturing / Operations digital transformation
        (r'hoạt động trong lĩnh vực cung ứng và quản lý nhân lực.*',
         'hoạt động trong lĩnh vực sản xuất da giày thể thao xuất khẩu chất lượng cao (Chuỗi Skechers toàn cầu), gia công may mặc, sản xuất phụ liệu đế PU/Cao su và chuyển đổi số vận hành sản xuất da giày.'),
        (r'chuyên cung ứng lao động phổ thông, nhân sự có tay nghề.*',
         'chuyên vận hành hệ thống tổ hợp nhà máy sản xuất da giày xuất khẩu quy mô hơn 5.000 cán bộ công nhân viên, đạt công suất trên 10 triệu đôi giày Skechers/năm.'),
        (r'định hướng trở thành đơn vị chuyên nghiệp trong lĩnh vực cung ứng và quản lý nguồn nhân lực.*',
         'định hướng trở thành Tổ hợp sản xuất da giày công nghệ cao hàng đầu vùng Đồng bằng sông Cửu Long, tiên phong trong ứng dụng chuyển đổi số và quản trị 5S Gemba Kaizen.'),
        (r'cho thuê lại lao động \(Giấy phép số 029/LĐTBXH-GP\).*',
         'mở rộng 3 Nhà máy sản xuất chính (KG1, KG2, KG3) và Xưởng phụ liệu hoàn thiện đế PU/Cao su đáp ứng tiêu chuẩn quốc tế của Chuỗi Skechers.'),
        (r'giới thiệu việc làm, mở rộng thêm phạm vi dịch vụ.*',
         'số hóa toàn bộ quy trình vận hành Gemba Walk 5S Audit và Kaizen IE Engine cho toàn bộ lực lượng công nhân và kỹ sư sản xuất.'),
    ]

    # Process all paragraphs
    print("Updating paragraphs...")
    for p in doc.paragraphs:
        for old_pattern, new_text in replacements:
            if re.search(old_pattern, p.text):
                p.text = re.sub(old_pattern, new_text, p.text)

    # -------------------------------------------------------------
    # 2. SPECIFIC OVERWRITE FOR CHAPTER 1 PARAGRAPHS (Sections 1.1, 1.2, 1.3)
    # -------------------------------------------------------------
    # Let's locate Chapter 1 paragraphs and rewrite Section 1.1 - 1.3 cleanly
    # Let's print out lines around Chapter 1 first to be 100% accurate
    
    # -------------------------------------------------------------
    # 3. TABLES UPDATE (Especially Table 8 & Table 9, plus table headers)
    # -------------------------------------------------------------
    print("Updating tables...")

    # Table 0 (Title / Cover info table if any)
    for t in doc.tables:
        for row in t.rows:
            for cell in row.cells:
                for old_pattern, new_text in replacements:
                    if re.search(old_pattern, cell.text):
                        cell.text = re.sub(old_pattern, new_text, cell.text)

    # Table 8: Organizational Chart Table
    if len(doc.tables) > 8:
        t8 = doc.tables[8]
        if len(t8.rows) >= 4:
            t8.rows[0].cells[0].text = "BAN TỔNG GIÁM ĐỐC TỔ HỢP KIÊN GIANG (TBS II)\n(Điều hành toàn bộ Hoạt động Sản xuất & Chuyển đổi số)"
            for c in t8.rows[0].cells[1:]:
                c.text = t8.rows[0].cells[0].text
            
            t8.rows[1].cells[0].text = "PHÒNG CÔNG NGHỆ THÔNG TIN & CĐS\n(Anh Ngô Hà Thanh An - Quản lý CĐS / HDTT)"
            t8.rows[1].cells[1].text = "PHÒNG KỸ THUẬT IE & QUẢN TRỊ SẢN XUẤT\n(Industrial Engineering & Operations)"
            t8.rows[1].cells[2].text = "PHÒNG QUẢN LÝ CHẤT LƯỢNG & GEMBA 5S\n(QA/QC & Kaizen Engine)"
            t8.rows[1].cells[3].text = "PHÒNG NHÂN SỰ & QUẢN TRỊ NGUỒN LỰC\n(HR & Administration)"
            if len(t8.rows[1].cells) > 4:
                t8.rows[1].cells[4].text = "KHỐI CÁC NHÀ MÁY SẢN XUẤT (KG1, KG2, KG3)\n(Xưởng Gò - Ráp - Đế PU/Cao su)"

            t8.rows[2].cells[0].text = "▼ Tổ hợp Nhà máy Kiên Giang (TBS II - KCN Thạnh Lộc, Châu Thành, Kiên Giang)"
            for c in t8.rows[2].cells[1:]:
                c.text = t8.rows[2].cells[0].text

            t8.rows[3].cells[0].text = "Nhà máy KG1\n(Sản xuất & Gò ráp Giày Skechers)"
            t8.rows[3].cells[1].text = "Nhà máy KG2\n(Sản xuất & May Thể thao xuất khẩu)"
            t8.rows[3].cells[2].text = "Nhà máy KG3\n(Đóng gói & Kiểm định Skechers)"
            if len(t8.rows[3].cells) > 3:
                t8.rows[3].cells[3].text = "Xưởng Phụ liệu Đế PU / Cao su"
            if len(t8.rows[3].cells) > 4:
                t8.rows[3].cells[4].text = "Hệ thống Số hóa TBS II Workspace"

    # Table 9: Business Activities & Services Table
    if len(doc.tables) > 9:
        t9 = doc.tables[9]
        if len(t9.rows) >= 4:
            t9.rows[0].cells[0].text = "LĨNH VỰC HOẠT ĐỘNG & NĂNG LỰC SẢN XUẤT CÔNG TY CỔ PHẦN THÁI BÌNH KIÊN GIANG (TBS II)"
            for c in t9.rows[0].cells[1:]:
                c.text = t9.rows[0].cells[0].text

            t9.rows[1].cells[0].text = "Sản xuất Giày Thể thao Skechers xuất khẩu"
            t9.rows[1].cells[1].text = "Sản xuất Phụ liệu & Đế PU / Cao su"
            t9.rows[1].cells[2].text = "Sản xuất Phụ liệu & Đế PU / Cao su"
            t9.rows[1].cells[3].text = "Quản trị Kỹ thuật IE & Định mức SAM"
            if len(t9.rows[1].cells) > 4:
                t9.rows[1].cells[4].text = "Số hóa Vận hành & Gemba Walk 5S Audit"

            t9.rows[2].cells[0].text = "Gia công, may, gò, ráp và đóng gói 10M+ đôi giày Skechers/năm"
            t9.rows[2].cells[1].text = "Ép đế PU, lưu hóa đế cao su và cung ứng khuôn mẫu cho 3 nhà máy KG1-KG3"
            t9.rows[2].cells[2].text = "Ép đế PU, lưu hóa đế cao su và cung ứng khuôn mẫu cho 3 nhà máy KG1-KG3"
            t9.rows[2].cells[3].text = "Tính định mức SAM, tối ưu hóa thao tác chuyền sản xuất và cân bằng chuyền"
            if len(t9.rows[2].cells) > 4:
                t9.rows[2].cells[4].text = "Số hóa thẻ Kanban task, chấm điểm 5S Audit và Kaizen IE trực tuyến"

            t9.rows[3].cells[0].text = "CƠ CẤU TỔ HỢP NHÀ MÁY VÀ VẬN HÀNH NỘI BỘ (TBS II)"
            for c in t9.rows[3].cells[1:]:
                c.text = t9.rows[3].cells[0].text

    # -------------------------------------------------------------
    # 4. HEADERS & FOOTERS UPDATE
    # -------------------------------------------------------------
    print("Updating headers and footers...")
    for s in doc.sections:
        for h in [s.header, s.first_page_header, s.even_page_header]:
            if h:
                for p in h.paragraphs:
                    for old_pattern, new_text in replacements:
                        if re.search(old_pattern, p.text):
                            p.text = re.sub(old_pattern, new_text, p.text)
        for f in [s.footer, s.first_page_footer, s.even_page_footer]:
            if f:
                for p in f.paragraphs:
                    for old_pattern, new_text in replacements:
                        if re.search(old_pattern, p.text):
                            p.text = re.sub(old_pattern, new_text, p.text)

    # Save updated document
    doc.save(DOC_PATH)
    print(f"Successfully saved updated document to {DOC_PATH}")

if __name__ == '__main__':
    update_document()
