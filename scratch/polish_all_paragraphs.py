import docx
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

DOC_PATH = r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx'

def polish_document():
    doc = docx.Document(DOC_PATH)
    
    # Define exact refinement mapping dictionary
    transforms = [
        # Chapter titles and subheadings polish
        (r'2\.3\.2\. Sơ đồ phễu tuyển dụng 6 bước', '2.3.2. Sơ đồ quy trình 5 bước nộp & duyệt Kaizen IE (ci-kaizen)'),
        (r'2\.3\.4\. Tuần 5–6 \(14/09 – 27/09/2026\): Retention Features và tuyển dụng thông minh', '2.3.4. Tuần 5–6 (14/09 – 27/09/2026): Tối ưu hóa UI/UX PWA, Retention Features & gợi ý Kaizen IE'),
        (r'nền tảng tuyển dụng truyền thống', 'quy trình vận hành thủ công bằng sổ sách giấy và bảng tin'),
        (r'nền tảng tuyển dụng chuyên biệt', 'hệ thống số hóa vận hành sản xuất công nghệ cao'),
        (r'nền tảng tuyển dụng', 'hệ thống số hóa vận hành nhà máy (TBS II Workspace)'),
        (r'quy trình tuyển dụng và tìm việc', 'quy trình kiểm định 5S Gemba Walk và quản trị Kaizen IE Engine'),
        (r'quy trình tuyển dụng', 'quy trình quản lý task Kanban & duyệt Kaizen IE (`ci-kaizen`)'),
        
        # Operational module terminology polish
        (r'đăng tin và tìm kiếm việc làm', 'giao task Kanban, kiểm định Gemba 5S Audit và phân công công việc'),
        (r'đăng tin - tìm kiếm việc làm', 'quản lý thẻ nhiệm vụ Kanban và nộp đề xuất Kaizen IE'),
        (r'nghiệm thu & duyệt kết quả công việc và tuyển dụng', 'kiểm định chất lượng Gemba 5S và duyệt Kaizen IE đa cấp'),
        (r'nghiệm thu & duyệt kết quả công việc', 'kiểm định 5S Audit & duyệt đề xuất Kaizen IE'),
        (r'buổi nghiệm thu & duyệt kết quả công việc', 'đợt kiểm định Gemba Walk 5S & nghiệm thu Kaizen IE'),
        (r'Interview Coach', 'AI Audit & Kaizen Coach'),
        (r'phễu tuyển dụng 6 bước', 'mô hình 5 bước quy trình Kaizen IE (`ci-kaizen`: Nộp -> Phân công Reviewer -> Đánh giá Chuyên gia -> Xếp hạng -> Phê duyệt)'),
        (r'phễu tuyển dụng', 'quy trình Kaizen IE 5 bước'),
        (r'Video Recruitment', 'Video minh chứng Gemba 5S & Kaizen'),
        (r'tuyển dụng thông minh', 'quản trị vận hành & Kaizen IE thông minh'),
        (r'Chatbot tư vấn việc làm', 'AI IE Automation Chatbot (Tư vấn định mức SAM & Gemba 5S)'),
        (r'từ bốn trang web tuyển dụng lớn', 'từ các xưởng sản xuất và dây chuyền may - gò - ráp nội bộ'),
        (r'thu thập \(crawler\) tự động.*tuyển dụng lớn', 'hệ thống thu thập & tổng hợp dữ liệu định mức Kaizen IE tự động từ các xưởng sản xuất'),
        
        # Geographic and company context polish
        (r'Sau hai tháng thực tập', 'Sau 11 tuần thực tập (17/08 – 31/10/2026, tính đến mốc 12/09/2026)'),
        (r'hai tháng thực tập', '11 tuần thực tập (17/08/2026 – 31/10/2026)'),
        (r'bàn giao hệ thống, hoàn thiện báo cáo thực tập', 'hoàn thiện báo cáo thực tập, nghiệm thu sản phẩm & bàn giao hệ thống TBS II Workspace'),
        
        # Formatting and spelling fixes
        (r'Đon vị thực tập', 'Đơn vị thực tập'),
        (r'MSSV: 2224802010738 - Lớp: D22CNTT02', 'MSSV: 2224802010738 - Lớp: D22CNTT02'),
        (r'tbsgrouptbsgroup', ''),
        (r'www\.tbsgroup\.vnwww\.tbsgroup\.vnwww\.tbsgroup\.vn', 'https://www.tbsgroup.vn/'),
    ]

    print("Polishing paragraphs...")
    for p in doc.paragraphs:
        for old_patt, new_t in transforms:
            if re.search(old_patt, p.text):
                p.text = re.sub(old_patt, new_t, p.text)

    print("Polishing tables...")
    for t in doc.tables:
        for r in t.rows:
            for c in r.cells:
                for old_patt, new_t in transforms:
                    if re.search(old_patt, c.text):
                        c.text = re.sub(old_patt, new_t, c.text)

    print("Polishing headers and footers...")
    for s in doc.sections:
        for h in [s.header, s.first_page_header, s.even_page_header]:
            if h:
                for p in h.paragraphs:
                    for old_patt, new_t in transforms:
                        if re.search(old_patt, p.text):
                            p.text = re.sub(old_patt, new_t, p.text)
        for f in [s.footer, s.first_page_footer, s.even_page_footer]:
            if f:
                for p in f.paragraphs:
                    for old_patt, new_t in transforms:
                        if re.search(old_patt, p.text):
                            p.text = re.sub(old_patt, new_t, p.text)

    doc.save(DOC_PATH)
    print(f"Successfully polished and saved {DOC_PATH}")

if __name__ == '__main__':
    polish_document()
