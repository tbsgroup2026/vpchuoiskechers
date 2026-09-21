import docx
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

DOC_PATH = r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx'

def rewrite_all_chapters():
    doc = docx.Document(DOC_PATH)
    
    # -------------------------------------------------------------
    # 1. CORE REPLACEMENT DICTIONARY & REGEX PATTERNS
    # -------------------------------------------------------------
    COMPANY_FULL = "Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2"
    COMPANY_SHORT = "Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS II)"
    ADDRESS_FULL = "2/434, Khu phố Bình Đáng, Phường Bình Hòa, Thành phố Hồ Chí Minh"
    ADVISOR_FULL = "Dư Thị Thanh Tình (TP. Hành chính & Nhân sự)"
    ADVISOR_NAME = "Dư Thị Thanh Tình"
    TOPIC_TITLE = "Xây dựng và phát triển Hệ thống Quản trị số hóa Vận hành Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS II Workspace, Gemba Walk 5S Audit & Kaizen IE Engine)"

    patterns = [
        # Topics & Titles
        (r'XÂY DỰNG VÀ PHÁT TRIỂN HỆ THỐNG QUẢN TRỊ SỐ HÓA.*', TOPIC_TITLE.upper()),
        (r'Xây dựng và phát triển Hệ thống Quản trị số hóa.*', TOPIC_TITLE),
        
        # Company names
        (r'Công Ty Cổ Phần Thái Bình Kiên Giang \(TBS II - TBS GROUP\)', COMPANY_SHORT),
        (r'Công ty Cổ phần Thái Bình Kiên Giang \(TBS II\)', COMPANY_SHORT),
        (r'Công Ty Cổ Phần Thái Bình Kiên Giang', COMPANY_FULL),
        (r'Công ty Cổ phần Thái Bình Kiên Giang', COMPANY_FULL),
        (r'Tập đoàn Da Giày TBS Group — Văn phòng Chuỗi Skechers', COMPANY_SHORT),
        (r'Công ty TNHH Cung Ứng Nhân Lực TBS Group — VP Chuỗi Skechers', COMPANY_SHORT),
        (r'TBS Group — VP Chuỗi Skechers', COMPANY_SHORT),
        (r'TẬP ĐOÀN DA GIÀY TBS GROUP — VĂN PHÒNG CHUỖI SKECHERS', COMPANY_FULL.upper()),

        # Advisors
        (r'Ngô Hà Thanh An', ADVISOR_NAME),
        (r'PGĐ\. Ngô Hà Thanh An', ADVISOR_FULL),
        (r'Quản lý CĐS: Dư Thị Thanh Tình', f'TP. Hành chính & Nhân sự: {ADVISOR_NAME}'),
        (r'Quản lý CĐS: Ngô Hà Thanh An', f'TP. Hành chính & Nhân sự: {ADVISOR_NAME}'),

        # Addresses & Locations
        (r'Khu công nghiệp Thạnh Lộc, Xã Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang, Việt Nam', ADDRESS_FULL),
        (r'Khu công nghiệp Thạnh Lộc, Xã Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang', ADDRESS_FULL),
        (r'KCN Thạnh Lộc, Xã Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang', ADDRESS_FULL),
        (r'KCN Thạnh Lộc, Châu Thành, Kiên Giang', ADDRESS_FULL),
        (r'KCN Thạnh Lộc', 'Khu phố Bình Đáng, Phường Bình Hòa'),
        (r'Châu Thành, Kiên Giang', 'Phường Bình Hòa, Thành phố Hồ Chí Minh'),
        (r'Châu Thành', 'Bình Hòa'),
        (r'Thạnh Lộc', 'Bình Đáng'),
        (r'Bình Dương và Đồng Nai', 'Thành phố Hồ Chí Minh (Khu phố Bình Đáng, Phường Bình Hòa)'),
        (r'Bình Dương, Đồng Nai', 'Thành phố Hồ Chí Minh'),

        # Dates & Internship duration
        (r'18 / 05 / 2026 đến 26 / 07 / 2026', '17 / 08 / 2026 đến 31 / 10 / 2026'),
        (r'18/5/2026 đến ngày 26/7/2026', '17/8/2026 đến ngày 31/10/2026'),
        (r'18/5 đến 26/7/2026', '17/8 đến 31/10/2026'),
        (r'18/5 đến 26/7', '17/8 đến 31/10'),
        (r'10 tuần', '11 tuần'),
        (r'2 tháng', '11 tuần (17/08 – 31/10/2026)'),
        (r'ngày 27  tháng 7  năm 2026', 'ngày 12 tháng 09 năm 2026'),
        (r'ngày 27 tháng 7 năm 2026', 'ngày 12 tháng 09 năm 2026'),
        
        # Legacy Staffing Agency Phrases -> Operations & Manufacturing Digital Transformation
        (r'lĩnh vực cung ứng và quản lý nhân lực.*', 'lĩnh vực sản xuất da giày thể thao xuất khẩu chất lượng cao (Chuỗi Skechers), sản xuất phụ liệu đế PU/Cao su, kiểm định Gemba Walk 5S và Chuyển đổi số vận hành sản xuất da giày.'),
        (r'cho thuê lại lao động.*', 'số hóa quy trình vận hành Gemba Walk 5S Audit và Kaizen IE Engine cho toàn bộ xưởng sản xuất tại Nhà Máy 2.'),
        (r'giới thiệu việc làm.*', 'quản trị thẻ công việc Kanban, kiểm định định mức IE và duyệt Kaizen tự động.'),
    ]

    print("Overwriting paragraphs across all chapters...")
    for p in doc.paragraphs:
        for old_patt, new_t in patterns:
            if re.search(old_patt, p.text):
                p.text = re.sub(old_patt, new_t, p.text)

    print("Overwriting tables across all chapters...")
    for t in doc.tables:
        for r in t.rows:
            for c in r.cells:
                for old_patt, new_t in patterns:
                    if re.search(old_patt, c.text):
                        c.text = re.sub(old_patt, new_t, c.text)

    print("Overwriting headers and footers...")
    for s in doc.sections:
        for h in [s.header, s.first_page_header, s.even_page_header]:
            if h:
                for p in h.paragraphs:
                    for old_patt, new_t in patterns:
                        if re.search(old_patt, p.text):
                            p.text = re.sub(old_patt, new_t, p.text)
        for f in [s.footer, s.first_page_footer, s.even_page_footer]:
            if f:
                for p in f.paragraphs:
                    for old_patt, new_t in patterns:
                        if re.search(old_patt, p.text):
                            p.text = re.sub(old_patt, new_t, p.text)

    # -------------------------------------------------------------
    # 2. ENHANCE AND POLISH SPECIFIC CHAPTER SECTIONS
    # -------------------------------------------------------------
    # Chapter 1 Overview Paragraph (Paragraph 227 onwards)
    print("Polishing Chapter 1 (Giới thiệu đơn vị thực tập)...")
    for i, p in enumerate(doc.paragraphs):
        if 'TỔNG QUAN VỀ CÔNG TY CP ĐẦU TƯ THÁI BÌNH' in p.text:
            # Check next paragraph for company profile summary
            if i + 2 < len(doc.paragraphs):
                doc.paragraphs[i+2].text = f"Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS II) là cụm nhà máy sản xuất da giày thể thao xuất khẩu chủ lực trực thuộc Tập đoàn TBS Group (Thái Bình Corporation). Đặt tại địa chỉ {ADDRESS_FULL}, Nhà Máy 2 được đầu tư quy mô hiện đại với các chuyền may, gò, ráp giày da thể thao xuất khẩu (phục vụ Chuỗi Skechers toàn cầu) cùng Xưởng sản xuất phụ liệu đế PU và cao su hoàn thiện. Với quy mô hàng nghìn cán bộ công nhân viên (CBCNV) và kỹ sư, Nhà Máy 2 đóng vai trò quan trọng trong chuỗi cung ứng sản xuất da giày công nghệ cao của TBS Group."

    doc.save(DOC_PATH)
    print(f"Successfully updated all chapters in {DOC_PATH}")

if __name__ == '__main__':
    rewrite_all_chapters()
