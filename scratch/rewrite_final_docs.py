import docx
import re
import sys
import os
import time

sys.stdout.reconfigure(encoding='utf-8')

DOC_PATH = r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx'

def rewrite_final_docs():
    # Make sure no Word process is holding a lock
    try:
        os.system("taskkill /f /im WINWORD.EXE >nul 2>&1")
        time.sleep(0.3)
    except Exception:
        pass

    doc = docx.Document(DOC_PATH)

    COMPANY_FULL = "Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2"
    COMPANY_SHORT = "Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS II)"
    ADDRESS_FULL = "2/434, Khu phố Bình Đáng, Phường Bình Hòa, Thành phố Hồ Chí Minh"
    ADVISOR_FULL = "Dư Thị Thanh Tình (TP. Hành chính & Nhân sự)"
    ADVISOR_NAME = "Dư Thị Thanh Tình"
    TOPIC_TITLE = "Xây dựng và phát triển Hệ thống Quản trị số hóa Vận hành Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS II Workspace, Gemba Walk 5S Audit & Kaizen IE Engine)"

    # Comprehensive term replacements map
    replacements = [
        # Topics
        (r'XÂY DỰNG VÀ PHÁT TRIỂN HỆ THỐNG QUẢN TRỊ SỐ HÓA.*', TOPIC_TITLE.upper()),
        (r'Xây dựng và phát triển Hệ thống Quản trị số hóa.*', TOPIC_TITLE),
        (r'TBS Work Hub & Gemba Kaizen', 'TBS II Workspace (Gemba Walk 5S Audit & Kaizen IE Engine)'),
        (r'TBS Work Hub', 'TBS II Workspace'),

        # Company & Institutional
        (r'Công Ty Cổ Phần Thái Bình Kiên Giang.*', COMPANY_SHORT),
        (r'Công ty Cổ phần Thái Bình Kiên Giang.*', COMPANY_SHORT),
        (r'Tập đoàn Da Giày TBS Group — Văn phòng Chuỗi Skechers', COMPANY_SHORT),
        (r'Công ty TNHH Cung Ứng Nhân Lực TBS Group — VP Chuỗi Skechers', COMPANY_SHORT),
        (r'Ngô Hà Thanh An', ADVISOR_NAME),
        (r'PGĐ\. Ngô Hà Thanh An', ADVISOR_FULL),

        # Address & Location
        (r'Khu công nghiệp Thạnh Lộc.*', ADDRESS_FULL),
        (r'KCN Thạnh Lộc.*', ADDRESS_FULL),
        (r'Châu Thành, Kiên Giang', 'Phường Bình Hòa, Thành phố Hồ Chí Minh'),
        (r'Châu Thành', 'Bình Hòa'),
        (r'Thạnh Lộc', 'Bình Đáng'),
        (r'Bình Dương và Đồng Nai', 'Thành phố Hồ Chí Minh (Khu phố Bình Đáng, Phường Bình Hòa)'),
        (r'Bình Dương, Đồng Nai', 'Thành phố Hồ Chí Minh'),

        # Workshops standardization (Đầu Vào, May, Gò)
        (r'Xưởng đế-mũi-gò', 'các phân xưởng Đầu Vào, May và Gò'),
        (r'Xưởng Đế, Xưởng Mũi, Xưởng Gò', 'Phân xưởng Đầu Vào, May, Gò'),
        (r'Xưởng Đế', 'Phân xưởng Đầu Vào'),
        (r'Xưởng Mũi', 'Phân xưởng May'),
        (r'Xưởng Gò Ráp', 'Phân xưởng Gò'),
        (r'Xưởng Đóng Gói', 'Phân xưởng Gò'),

        # Dates & Timeframes
        (r'18 / 05 / 2026 đến 26 / 07 / 2026', '17 / 08 / 2026 đến 31 / 10 / 2026'),
        (r'18/5/2026 đến ngày 26/7/2026', '17/8/2026 đến ngày 31/10/2026'),
        (r'18/5 đến 26/7/2026', '17/8 đến 31/10/2026'),
        (r'18/5 đến 26/7', '17/8 đến 31/10'),
        (r'10 tuần', '11 tuần'),
        (r'2 tháng', '11 tuần (17/08 – 31/10/2026)'),
        (r'ngày 27  tháng 7  năm 2026', 'ngày 12 tháng 09 năm 2026'),
        (r'ngày 27 tháng 7 năm 2026', 'ngày 12 tháng 09 năm 2026'),
    ]

    print("Executing complete document rewrite and polish...")
    for p in doc.paragraphs:
        for old_patt, new_t in replacements:
            if re.search(old_patt, p.text):
                p.text = re.sub(old_patt, new_t, p.text)

    for t in doc.tables:
        for r in t.rows:
            for c in r.cells:
                for old_patt, new_t in replacements:
                    if re.search(old_patt, c.text):
                        c.text = re.sub(old_patt, new_t, c.text)

    for s in doc.sections:
        for h in [s.header, s.first_page_header, s.even_page_header]:
            if h:
                for p in h.paragraphs:
                    for old_patt, new_t in replacements:
                        if re.search(old_patt, p.text):
                            p.text = re.sub(old_patt, new_t, p.text)
        for f in [s.footer, s.first_page_footer, s.even_page_footer]:
            if f:
                for p in f.paragraphs:
                    for old_patt, new_t in replacements:
                        if re.search(old_patt, p.text):
                            p.text = re.sub(old_patt, new_t, p.text)

    # Save cleanly with fallback handle
    temp_path = DOC_PATH + ".tmp.docx"
    doc.save(temp_path)
    time.sleep(0.3)
    if os.path.exists(DOC_PATH):
        try:
            os.remove(DOC_PATH)
        except Exception:
            pass
    os.replace(temp_path, DOC_PATH)
    print(f"Successfully rewritten and saved final docs to {DOC_PATH}")

if __name__ == '__main__':
    rewrite_final_docs()
