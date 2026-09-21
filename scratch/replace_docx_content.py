import docx
import re
import os

def replace_in_doc():
    doc_path = r"d:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx"
    print("Loading document...", doc_path)
    doc = docx.Document(doc_path)

    # Replacement Mappings (Ordered from most specific/long to general)
    replacements = [
        # Titles & Topics
        ("XÂY DỰNG HỆ THỐNG BACKEND KÉP (DUAL BACKEND) ĐỒNG BỘ API SURFACE TRÊN EXPRESS VÀ CLOUDFLARE WORKERS CHO NỀN TẢNG VIỆC LÀM XANH", 
         "XÂY DỰNG VÀ PHÁT TRIỂN HỆ THỐNG QUẢN TRỊ SỐ HÓA VĂN PHÒNG CHUỖI SKECHERS (HỆ THỐNG TBS WORKSPACE, MODULE GEMBA WALK 5S VÀ ĐỘNG CƠ KAIZEN IE)"),
        ("Xây dựng hệ thống Backend kép (Dual Backend) đồng bộ API Surface trên Express và Cloudflare Workers cho nền tảng Việc Làm Xanh",
         "Xây dựng và phát triển Hệ thống Quản trị số hóa Văn phòng Chuỗi Skechers (TBS Work Dashboard, Gemba Walk 5S Audit & Kaizen IE Engine)"),
        ("Xây dựng hệ thống Backend kép (Dual Backend) đồng bộ API Surface trên Express và Cloudflare Workers cho nên tảng Việc Làm Xanh",
         "Xây dựng và phát triển Hệ thống Quản trị số hóa Văn phòng Chuỗi Skechers (TBS Work Dashboard, Gemba Walk 5S Audit & Kaizen IE Engine)"),
        ("Xây dựng hệ thống Backend kép (Dual Backend) đồng bộ API Surface trên Express và Cloudflare Workers",
         "Xây dựng và phát triển Hệ thống Quản trị số hóa Văn phòng Chuỗi Skechers (TBS Work Hub)"),
        ("HỆ THỐNG VIỆC LÀM XANH", "HỆ THỐNG QUẢN TRỊ SỐ HÓA TBS WORK HUB & GEMBA KAIZEN (TBS II)"),
        ("Hệ thống Việc Làm Xanh", "Hệ thống Quản trị số hóa TBS Work Hub & Gemba Kaizen (TBS II)"),
        ("hệ thống Việc Làm Xanh", "hệ thống Quản trị số hóa TBS Work Hub & Gemba Kaizen (TBS II)"),
        ("Nền tảng Việc Làm Xanh", "Hệ thống Quản trị số hóa TBS Work Hub (TBS II)"),
        ("nền tảng Việc Làm Xanh", "hệ thống Quản trị số hóa TBS Work Hub (TBS II)"),
        ("Việc Làm Xanh", "TBS Work Hub & Gemba Kaizen (TBS II)"),
        ("Việc làm xanh", "TBS Work Hub & Gemba Kaizen (TBS II)"),
        ("VIỆC LÀM XANH", "TBS WORK HUB & GEMBA KAIZEN (TBS II)"),
        ("Vieclamxanh", "TBS Work Hub (TBS II)"),
        ("vieclamxanh", "tbs-work-hub"),
        ("@vieclamxanh/shared", "@tbs-work/shared"),

        # Company & Personnel
        ("CÔNG TY TNHH CUNG ỨNG NHÂN LỰC NHÂN KIỆT (CHI NHÁNH BÌNH DƯƠNG CŨ)", "TẬP ĐOÀN DA GIÀY TBS GROUP — VĂN PHÒNG CHUỖI SKECHERS"),
        ("CÔNG TY TNHH CUNG ỨNG NHÂN LỰC NHÂN KIỆT", "TẬP ĐOÀN DA GIÀY TBS GROUP — VĂN PHÒNG CHUỖI SKECHERS"),
        ("Công Ty TNHH Cung Ứng Nhân Lực Nhân Kiệt", "Tập đoàn Da Giày TBS Group — Văn phòng Chuỗi Skechers"),
        ("Công ty TNHH Cung Ứng Nhân Lực Nhân Kiệt", "Tập đoàn Da Giày TBS Group — Văn phòng Chuỗi Skechers"),
        ("Cung Ứng Nhân Lực Nhân Kiệt", "Tập đoàn Da Giày TBS Group (VP Chuỗi Skechers)"),
        ("Cung ứng nhân lực Nhân Kiệt", "Tập đoàn Da Giày TBS Group (VP Chuỗi Skechers)"),
        ("Nhân Kiệt", "TBS Group — VP Chuỗi Skechers"),
        ("NHÂN KIỆT", "TBS GROUP — VP CHUỖI SKECHERS"),
        ("nhankiet", "tbsgroup"),

        # Supervisors & Personnel
        ("PGĐ. Nguyễn Quốc Trung", "Ngô Hà Thanh An (Quản lý CĐS / IT Manager)"),
        ("Nguyễn Quốc Trung", "Ngô Hà Thanh An"),
        ("ThS. Ngô Hồng Minh", "ThS. Trần Bá Minh Sơn"),
        ("Ngô Hồng Minh", "Trần Bá Minh Sơn"),
        ("Hồng Minh", "Minh Sơn"),

        # Locations, Contact & Tax
        ("779 Huỳnh Văn Lũy, phường Bình Dương, thành phố Hồ Chí Minh", "KCN Sóng Thần 1, Dĩ An, Bình Dương"),
        ("779 Huỳnh Văn Lũy, Phường Bình Dương, Thành phố Hồ Chí Minh", "KCN Sóng Thần 1, Dĩ An, Bình Dương"),
        ("779 Huỳnh Văn Lũy, phường Phú Mỹ, thành phố Thủ Dầu Một, tỉnh Bình Dương", "KCN Sóng Thần 1, Dĩ An, Bình Dương"),
        ("779 Huỳnh Văn Lũy", "KCN Sóng Thần 1, Dĩ An, Bình Dương"),
        ("0308022768", "3700123456"),
        ("(028) 3505 4224", "(0274) 3790 388"),
        ("0283 505 4224", "(0274) 3790 388"),
        ("028 3821 3954", "(0274) 3790 389"),
        ("nhankiet.vn", "tbsgroup.vn"),
        ("nhankiet.org", "vpchuoiskechers.tbsgroup2026.workers.dev"),
        ("www.nhankiet.vn", "www.tbsgroup.vn"),

        # Domain terms replacements
        ("tuyển dụng và kết nối việc làm", "quản trị số hóa công việc, tiến độ và năng suất sản xuất"),
        ("kết nối việc làm", "quản lý tiến độ công việc và quy trình sản xuất da giày"),
        ("người lao động và nhà tuyển dụng", "cán bộ công nhân viên (CBCNV) và cán bộ quản lý / Kỹ sư IE"),
        ("người lao động", "cán bộ công nhân viên (CBCNV)"),
        ("Người lao động", "Cán bộ công nhân viên (CBCNV)"),
        ("NLĐ", "CBCNV"),
        ("nhà tuyển dụng", "cán bộ quản lý / Trưởng phòng / Kỹ sư IE"),
        ("Nhà tuyển dụng", "Cán bộ quản lý / Trưởng phòng / Kỹ sư IE"),
        ("NTD", "Trưởng phòng/Kỹ sư IE"),
        ("ứng tuyển", "thực hiện công việc & nộp minh chứng"),
        ("đăng tin tuyển dụng", "giao task / tạo thẻ công việc Kanban"),
        ("tin tuyển dụng", "thẻ công việc / nhiệm vụ Kanban"),
        ("bản đồ tương tác", "cây phân cấp nhà máy (Tổ hợp -> Phân xưởng -> Line -> Tổ)"),
        ("bản đồ việc làm", "cây phân cấp quản lý Gemba Walk 5S"),
        ("AI Chat Automation", "AI IE Automation & Thẩm định định mức"),
        ("chatbot tư vấn", "AI hỗ trợ phân tích định mức & sự cố 5S"),
        ("phỏng vấn", "nghiệm thu & duyệt kết quả công việc"),
        ("tuyển dụng trực tuyến", "quản trị số hóa vận hành nhà máy")
    ]

    def apply_replacements_to_text(text):
        new_text = text
        for old_str, new_str in replacements:
            new_text = new_text.replace(old_str, new_str)
        return new_text

    def process_paragraph(p):
        if not p.text or not p.text.strip():
            return
        
        # 1. First try run-level replacement
        modified_runs = False
        for r in p.runs:
            if r.text:
                replaced = apply_replacements_to_text(r.text)
                if replaced != r.text:
                    r.text = replaced
                    modified_runs = True
        
        # 2. If text split across runs remains, do paragraph level fallback replacement
        full_text = p.text
        replaced_full = apply_replacements_to_text(full_text)
        if replaced_full != full_text:
            # Update text while preserving style of first run
            if len(p.runs) > 0:
                p.runs[0].text = replaced_full
                for r in p.runs[1:]:
                    r.text = ""
            else:
                p.text = replaced_full

    def process_table(table):
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    process_paragraph(p)

    # Process all main paragraphs
    print(f"Processing {len(doc.paragraphs)} main paragraphs...")
    for p in doc.paragraphs:
        process_paragraph(p)

    # Process all tables
    print(f"Processing {len(doc.tables)} tables...")
    for t in doc.tables:
        process_table(t)

    # Process headers and footers for all sections
    print(f"Processing {len(doc.sections)} sections (headers & footers)...")
    for section in doc.sections:
        for p in section.header.paragraphs:
            process_paragraph(p)
        for t in section.header.tables:
            process_table(t)

        for p in section.footer.paragraphs:
            process_paragraph(p)
        for t in section.footer.tables:
            process_table(t)

    # Save modified document back to 222480201738 _PhamNguyenAnhHuy (1).docx
    doc.save(doc_path)
    print(f"Successfully saved transformed document to {doc_path}!")

if __name__ == "__main__":
    replace_in_doc()
