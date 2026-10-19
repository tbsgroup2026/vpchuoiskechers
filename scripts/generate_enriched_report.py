# -*- coding: utf-8 -*-
"""
scripts/generate_enriched_report.py
Enriches 2224802010738_PhamNguyenAnhHuy.docx using the complete, detailed
data from web/README.md, BAO_CAO_SCAN.md, and UAT/QA reports.
"""

import docx
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls
import sys
import os
import zipfile

sys.stdout.reconfigure(encoding='utf-8')

DOCX_IN = '2224802010738_PhamNguyenAnhHuy_backup.docx'
DOCX_OUT = '2224802010738_PhamNguyenAnhHuy.docx'

print("=== STARTING ENRICHED REPORT GENERATION ===")
doc = Document(DOCX_IN)

# Formatting helpers
def format_p(p, text, style='Normal', space_before=3, space_after=6, line_spacing=1.3, align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False, font_size=13):
    p.text = text
    p.style = style
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    for r in p.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(font_size)
        r.font.bold = bold
        r.font.italic = italic

def set_cell_props(cell, text, bold=False, font_size=10, align=WD_ALIGN_PARAGRAPH.LEFT, fill_hex=None):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(font_size)
    run.font.bold = bold
    if fill_hex:
        tcPr = cell._element.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

def add_caption(p, caption_text):
    p.text = caption_text
    p.style = 'Caption'
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(8)
    for r in p.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        r.font.italic = True
        r.font.bold = True

def add_highlighted_run(p, text, is_highlight=False):
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(13)
    if is_highlight:
        run.font.highlight_color = WD_COLOR_INDEX.YELLOW
        run.font.bold = True

# 1. TABLE 2: KẾ HOẠCH 10 TUẦN
print("1. Cập nhật Bảng 2: Kế hoạch thực tập 10 tuần...")
t2 = doc.tables[2]
weeks_plan = [
    ("1", "03/8 – 08/8", "Tìm hiểu và phân tích tổng quan dự án"),
    ("2", "10/8 – 15/8", "Xây dựng và phát triển các chức năng hệ thống"),
    ("3", "17/8 – 22/8", "Xây dựng phân hệ Quản lý công việc cá nhân (My Tasks), Bảng công việc phòng ban (Kanban) và Dự án liên phòng ban (Projects)"),
    ("4", "24/8 – 29/8", "Xây dựng phân hệ Kiểm soát hiện trường GEMBA Walk và Đăng ký sáng kiến cải tiến liên tục (CI-Kaizen)"),
    ("5", "31/8 – 05/9", "Xây dựng phân hệ Quản lý sản lượng PPH nhà máy và tích hợp dữ liệu Máy móc thiết bị (MMTB)"),
    ("6", "07/9 – 12/9", "Tích hợp hệ thống thông báo đa kênh: Web Push (VAPID), Zalo Notification Service và Service Worker nền tảng"),
    ("7", "14/9 – 19/9", "Hoàn thiện hệ thống phân quyền đa cấp (RBAC), bảo mật xác thực (JWT/Session) và cơ chế Audit Log / Idempotency"),
    ("8", "21/9 – 26/9", "Xây dựng cơ chế sao lưu tự động (Incremental Backup sang Google Drive), quản lý file media Cloudflare R2 và tối ưu nén ảnh client"),
    ("9", "28/9 – 03/10", "Kiểm thử toàn diện hệ thống: UAT 100 người dùng, kiểm thử bảo mật đa vai trò, kiểm thử API và sửa lỗi hồi quy"),
    ("10", "05/10 – 10/10", "Triển khai hệ thống lên Cloudflare Workers (Production), đánh giá hiệu năng và hoàn thiện báo cáo thực tập"),
]

for idx, (wn, wd, wc) in enumerate(weeks_plan, start=1):
    row = t2.rows[idx]
    set_cell_props(row.cells[0], wn, bold=True, font_size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell_props(row.cells[1], wd, bold=False, font_size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    if len(row.cells) > 2 and row.cells[2] != row.cells[1]:
        set_cell_props(row.cells[2], wd, bold=False, font_size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    content_cell = row.cells[3] if len(row.cells) > 3 else row.cells[-2]
    set_cell_props(content_cell, wc, bold=False, font_size=11, align=WD_ALIGN_PARAGRAPH.LEFT)
    note_cell = row.cells[4] if len(row.cells) > 4 else row.cells[-1]
    set_cell_props(note_cell, "", bold=False, font_size=11, align=WD_ALIGN_PARAGRAPH.LEFT)

# 2. TABLE 10: TỪ VIẾT TẮT
print("2. Cập nhật Bảng 10: 31 thuật ngữ viết tắt chuẩn Alphabet...")
t10 = doc.tables[10]
abbr_list = [
    ("1", "API", "Giao diện lập trình ứng dụng (Application Programming Interface)"),
    ("2", "AQL", "Giới hạn chất lượng chấp nhận (Acceptance Quality Limit)"),
    ("3", "BOLA", "Lỗ hổng kiểm soát truy cập cấp đối tượng (Broken Object Level Authorization)"),
    ("4", "CBCNV", "Cán bộ công nhân viên"),
    ("5", "CI", "Cải tiến liên tục (Continuous Improvement)"),
    ("6", "CI/CD", "Tích hợp liên tục và triển khai liên tục (Continuous Integration / Continuous Deployment)"),
    ("7", "CSP", "Chính sách bảo mật nội dung (Content Security Policy)"),
    ("8", "CSS", "Ngôn ngữ định kiểu tầng (Cascading Style Sheets)"),
    ("9", "D1", "Cơ sở dữ liệu quan hệ SQL phân tán tại mạng biên của Cloudflare"),
    ("10", "DOM", "Mô hình đối tượng tài liệu (Document Object Model)"),
    ("11", "ERD", "Sơ đồ quan hệ thực thể (Entity Relationship Diagram)"),
    ("12", "F5", "Thao tác làm mới tải lại trang trên trình duyệt web"),
    ("13", "GEMBA", "Hiện trường sản xuất thực tế theo triết lý Lean Manufacturing"),
    ("14", "HĐQT", "Hội đồng quản trị"),
    ("15", "HTML", "Ngôn ngữ đánh dấu siêu văn bản (HyperText Markup Language)"),
    ("16", "HTTP", "Giao thức truyền tải siêu văn bản (HyperText Transfer Protocol)"),
    ("17", "IDOR", "Tham chiếu đối tượng trực tiếp không an toàn (Insecure Direct Object References)"),
    ("18", "IE", "Kỹ thuật công nghiệp và định mức lao động (Industrial Engineering)"),
    ("19", "JWT", "Chuỗi mã định danh phiên an toàn (JSON Web Token)"),
    ("20", "KPI", "Chỉ số đánh giá hiệu quả công việc trọng yếu (Key Performance Indicator)"),
    ("21", "MMTB", "Máy móc thiết bị"),
    ("22", "MTTD", "Thời gian trung bình phát hiện sự cố (Mean Time To Detect)"),
    ("23", "MTTR", "Thời gian trung bình khắc phục sự cố (Mean Time To Repair)"),
    ("24", "OCC", "Kiểm soát tương tranh lạc quan (Optimistic Concurrency Control)"),
    ("25", "OEE", "Hiệu suất thiết bị tổng thể (Overall Equipment Effectiveness)"),
    ("26", "PMC", "Kế hoạch và điều độ vật tư sản xuất (Production Material Control)"),
    ("27", "PPH", "Năng suất sản lượng theo giờ trên mỗi lao động (Pieces Per Hour)"),
    ("28", "QC", "Quản lý và kiểm soát chất lượng (Quality Control)"),
    ("29", "R2", "Dịch vụ lưu trữ đối tượng không tính phí băng thông ra ngoài của Cloudflare"),
    ("30", "RBAC", "Hệ thống kiểm soát truy cập dựa trên vai trò (Role-Based Access Control)"),
    ("31", "UI/UX", "Giao diện người dùng và trải nghiệm người dùng (User Interface / User Experience)"),
]

for idx, (stt, term, desc) in enumerate(abbr_list, start=1):
    if idx < len(t10.rows):
        row = t10.rows[idx]
        set_cell_props(row.cells[0], stt, bold=False, font_size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_props(row.cells[1], term, bold=True, font_size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_props(row.cells[2], desc, bold=False, font_size=11, align=WD_ALIGN_PARAGRAPH.LEFT)

# 3. LỜI CẢM ƠN
print("3. Cập nhật Lời cảm ơn...")
p141 = doc.paragraphs[141]
p141.text = (
    "Em xin trân trọng cảm ơn Ban Lãnh đạo Công Ty CPĐT Thái Bình Kiên Giang – TBS Group (Zone II) – "
    "SKECHERS R&D Center, Ban Tổng Giám đốc và người hướng dẫn TGĐ. Phạm Minh Tùng, cùng Phòng Hành Chính – "
    "Nhân Sự – Team Chuyển đổi số đã tạo mọi điều kiện thuận lợi nhất để em được thực tập, học hỏi và làm việc "
    "trong môi trường công nghiệp chuyên nghiệp, hiện đại. Các anh chị đã tận tình chỉ bảo, chia sẻ kinh nghiệm "
    "thực tế quý báu, từ quy trình điều hành sản xuất, tiêu chuẩn kiểm soát chất lượng quốc tế của thương hiệu "
    "SKECHERS đến việc hỗ trợ em hoàn thành xuất sắc các nhiệm vụ được giao, đặc biệt là trong quá trình phân tích, "
    "thiết kế, phát triển và triển khai hệ thống 'Quản Trị Vận Hành và Số Hóa Quy Trình Doanh Nghiệp trên nền tảng "
    "Serverless Edge – Tập đoàn TBS Group'."
)
p141.style = 'Normal'
for r in p141.runs:
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)

# Exact Indices Definition
MODAU = 162
TOMTAT = 172
C1 = 175
C2 = 201
C3 = 273
C4 = 287
C5 = 301
C6 = 311
C7 = 317
TL = 323

# 4. PHẦN MỞ ĐẦU & TÓM TẮT ĐỒ ÁN
print("4. Cập nhật Phần Mở Đầu & Tóm Tắt...")
format_p(doc.paragraphs[MODAU], "PHẦN MỞ ĐẦU", style='1', bold=True)
format_p(doc.paragraphs[MODAU + 1], "1. Lí do chọn đề tài", style='Heading 2', bold=True)
format_p(doc.paragraphs[MODAU + 2], 
    "Trong bối cảnh cách mạng công nghiệp 4.0 và xu hướng chuyển đổi số doanh nghiệp đang diễn ra mạnh mẽ, "
    "các tập đoàn sản xuất lớn phải đối mặt với bài toán tối ưu hóa quy trình điều hành và liên thông dữ liệu. "
    "Tại Tập đoàn TBS Group, đặc biệt là Cụm công nghiệp Kiên Giang (Zone II) kết hợp cùng Trung tâm Nghiên cứu & "
    "Phát triển mẫu SKECHERS R&D Center, khối lượng sản xuất hàng chục triệu đôi giày mỗi năm đòi hỏi sự phối hợp "
    "nhịp nhàng giữa hàng chục ngàn người lao động, các xưởng sản xuất vệ tinh và các khối phòng ban chức năng.\n\n"
    "Các hệ thống quản trị truyền thống vận hành trên máy chủ VPS tập trung thường bộc lộ nhiều điểm nghẽn: chi phí duy trì "
    "hạ tầng cao, độ trễ truyền tải lớn và nguy cơ gián đoạn dịch vụ khi mở rộng quy mô. Việc tiên phong ứng dụng công nghệ "
    "Serverless Edge Computing (Cloudflare Workers, D1, R2) mang lại giải pháp đột phá với độ trễ phản hồi cực thấp (< 20ms), "
    "khả năng tự động co giãn không giới hạn và loại bỏ chi phí quản trị máy chủ. Vì vậy, em đã chọn đề tài: 'Xây dựng hệ thống "
    "Quản Trị Vận Hành và Số Hóa Quy Trình Doanh Nghiệp trên nền tảng Serverless Edge – Tập đoàn TBS Group'."
)

format_p(doc.paragraphs[MODAU + 3], "2. Mục tiêu của báo cáo thực tập", style='Heading 2', bold=True)
format_p(doc.paragraphs[MODAU + 4],
    "Báo cáo tập trung vào các mục tiêu nghiên cứu và phát triển trọng tâm bám sát yêu cầu chuyển đổi số của đơn vị:\n"
    "1. Nghiên cứu kiến trúc Serverless Edge hiện đại trên nền tảng Cloudflare Workers, CSDL quan hệ phân tán D1 và bộ lưu trữ R2.\n"
    "2. Phân tích nghiệp vụ thực tế và số hóa toàn diện các phân hệ cốt lõi: Khung Quản trị Chiến lược 1-5-2, Quản lý Máy móc Thiết bị "
    "(MMTB), Sáng kiến Cải tiến liên tục (CI/Kaizen 4.0) có tích hợp thuật toán AI so sánh trùng lặp, Kiểm soát hiện trường GEMBA Walk, "
    "Đăng ký Công tác (Business Trip), Đặt phòng họp thông minh (Room Booking), Quản lý Sản lượng PPH nhà máy theo giờ, Quản trị Nhân sự và Kế toán Quản trị.\n"
    "3. Thiết lập hệ thống bảo mật đa tầng: phân quyền RBAC 7 tầng, loại bỏ triệt để các lỗ hổng OWASP API Security (BOLA, IDOR, Auth Bypass, PII).\n"
    "4. Tích hợp hệ thống thông báo đa kênh (Web Push VAPID, Zalo Notification Bot) và cơ chế tự động sao lưu dữ liệu sang Google Drive qua Service Account RSA-2048.\n"
    "5. Tiến hành kiểm thử tự động toàn diện (Pilot UAT 100 users, Multi-Role QA) và triển khai chính thức lên Production tại domain: "
    "https://vpchuoiskechers.tbsgroup2026.workers.dev."
)

format_p(doc.paragraphs[MODAU + 5], "3. Phạm vi và cách thức thực tập", style='Heading 2', bold=True)
format_p(doc.paragraphs[MODAU + 6],
    "• Phạm vi thực hiện: Khối Văn phòng Chuỗi SKECHERS, Trung tâm R&D Center và cụm xưởng sản xuất Kiên Giang (Zone II). "
    "Người dùng trực tiếp gồm Ban Tổng Giám Đốc, Trưởng phòng ban (PMC, IE, QC, R&D, Nhân sự, Bảo trì, Tài chính) và 100 cán bộ công nhân viên Pilot.\n"
    "• Cách thức thực tập: Khảo sát hiện trường thực tế (Gemba Walk), phỏng vấn quy trình nghiệp vụ với các phòng ban, áp dụng mô hình "
    "Agile/Scrum trong phát triển phần mềm, xây dựng kịch bản kiểm thử tự động bằng Node.js và Puppeteer trước khi deploy lên Edge."
)

format_p(doc.paragraphs[MODAU + 7], "4. Kết quả đạt được", style='Heading 2', bold=True)
format_p(doc.paragraphs[MODAU + 8],
    "1. Hoàn thành hệ thống web application quy mô lớn gồm 472 file mã nguồn (144.560 dòng code TypeScript/React) và 1 Edge Worker dài 17.000 dòng code JavaScript.\n"
    "2. Vận hành CSDL Cloudflare D1 với 131 bảng dữ liệu, 19 migrations SQL và kết nối lưu trữ phi tập trung Cloudflare R2.\n"
    "3. Tích hợp trọn vẹn Khung Quản trị Chiến lược 1-5-2, số hóa 100% hồ sơ kỹ thuật máy móc MMTB kèm tra cứu tem QR Code di động, và thuật toán AI so sánh trùng lặp Kaizen.\n"
    "4. Kiểm thử tự động đạt 100% PASS: 10/10 kịch bản Pilot UAT, 15/15 kịch bản phân quyền đa vai trò và vá hoàn tất 14 điểm rủi ro bảo mật.\n"
    "5. Triển khai chính thức lên mạng biên Cloudflare với thời gian khởi động worker chỉ 7ms, truy vấn D1 < 2ms, vận hành ổn định 24/7."
)

for pi in range(MODAU + 9, TOMTAT):
    doc.paragraphs[pi].text = ""

# Tóm tắt đồ án
format_p(doc.paragraphs[TOMTAT], "TÓM TẮT ĐỒ ÁN", style='1', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
format_p(doc.paragraphs[TOMTAT + 1],
    "Báo cáo thực tập tốt nghiệp trình bày quá trình nghiên cứu, thiết kế, phát triển và triển khai thực tế hệ thống 'Quản Trị "
    "Vận Hành và Số Hóa Quy Trình Doanh Nghiệp trên nền tảng Serverless Edge' tại Công Ty Cổ Phần Đầu Tư Thái Bình Kiên Giang – "
    "Tập đoàn TBS Group (Zone II) – SKECHERS R&D Center. Trước thách thức về độ trễ, chi phí hạ tầng và nguy cơ tắc nghẽn của hệ thống "
    "máy chủ VPS truyền thống trong bối cảnh sản xuất quy mô lớn, đề tài đã tiên phong ứng dụng kiến trúc điện toán biên không máy chủ "
    "(Serverless Edge Computing) dựa trên hệ sinh thái Cloudflare (Workers V8 Isolate, D1 SQLite, R2 Storage) kết hợp cùng frontend Next.js 14 "
    "App Router và hệ thống thiết kế Modern Industrial Design Tokens. Hệ thống đã số hóa thành công các phân hệ nghiệp vụ cốt lõi: "
    "Khung Quản trị Chiến lược 1-5-2 (1 mục đích xuyên suốt, 5 trụ cột phát triển, 2 nền tảng quản trị và báo cáo nhanh Google Drive), "
    "Quản lý Máy móc Thiết bị MMTB (hồ sơ kỹ thuật số hóa, tem mã QR payload JSON thật, phiếu sửa chữa khẩn cấp, bảo dưỡng định kỳ và chỉ số BI MTTA/MTTR/MTTD), "
    "Sáng kiến Cải tiến liên tục CI/Kaizen 4.0 tích hợp thuật toán AI so sánh trùng lặp N-Gram & Cosine Similarity, Kiểm soát hiện trường GEMBA Walk qua di động, "
    "Quản lý Công việc cá nhân (My Tasks), Bảng Kanban phòng ban, Dự án liên phòng ban với thuật toán Cảnh báo điểm nghẽn (Bottleneck Detector), "
    "Sản lượng PPH nhà máy theo giờ, Đăng ký Công tác (Business Trip), Đặt phòng họp thông minh (Room Booking), Quản trị Nhân sự và Kế toán Quản trị. "
    "Đồng thời, hệ thống tích hợp sâu thông báo đẩy Web Push (VAPID), Zalo Notification Bot và cơ chế tự động sao lưu dữ liệu sang Google Drive qua Service Account RSA-2048. "
    "Toàn bộ nền tảng đã vượt qua các đợt kiểm thử tự động nghiêm ngặt (10/10 Pilot UAT, 15/15 Multi-Role QA, 14/14 Security Audit) và chính thức được đưa vào vận hành tại "
    "https://vpchuoiskechers.tbsgroup2026.workers.dev, đáp ứng xuất sắc các tiêu chuẩn vận hành công nghiệp khắt khe của thương hiệu SKECHERS toàn cầu.\n\n"
    "Từ khóa: Serverless Edge Computing, Cloudflare Workers, Cloudflare D1, Khung Quản Trị 1-5-2, MMTB, SKECHERS R&D Center, TBS Group."
)

for pi in range(TOMTAT + 2, C1):
    doc.paragraphs[pi].text = ""

# 5. CHƯƠNG 1: TỔNG QUAN VỀ CÔNG TY
print("5. Cập nhật Chương 1: Thông tin công ty và Trung tâm R&D Skechers...")
format_p(doc.paragraphs[C1], "CHƯƠNG 1: TỔNG QUAN VỀ CÔNG TY CPĐT THÁI BÌNH KIÊN GIANG – TBS GROUP (ZONE II) – SKECHERS R&D CENTER", style='1', bold=True)
format_p(doc.paragraphs[C1 + 1], "1.1. Thông tin đơn vị", style='2', bold=True)

p_c1_1_c = doc.paragraphs[C1 + 2]
p_c1_1_c.text = ""
p_c1_1_c.style = 'Normal'
add_highlighted_run(p_c1_1_c, "Tập đoàn Thái Bình Shoes (TBS Group) là một trong những tập đoàn công nghiệp đa ngành hàng đầu tại Việt Nam, đặc biệt khẳng định vị thế dẫn đầu trong lĩnh vực sản xuất giày da và gia công túi xách xuất khẩu cho các thương hiệu danh tiếng toàn cầu. Trong chiến lược mở rộng chuỗi cung ứng sản xuất tại khu vực phía Nam, Công Ty Cổ Phần Đầu Tư Thái Bình Kiên Giang (Zone II) được thành lập và đầu tư trọng điểm, trở thành trung tâm nghiên cứu phát triển mẫu và sản xuất mũi nhọn của thương hiệu SKECHERS.\n\nThông tin cơ bản của đơn vị thực tập:\n• Tên đơn vị: Công Ty Cổ Phần Đầu Tư Thái Bình Kiên Giang – Tập đoàn TBS Group (Zone II) – SKECHERS R&D Center\n• Tên giao dịch quốc tế: TBS Kiên Giang Investment Joint Stock Company – SKECHERS Division\n• Mã số thuế: ")
add_highlighted_run(p_c1_1_c, "[CẦN BỔ SUNG: Mã số thuế Công ty CPĐT Thái Bình Kiên Giang]", is_highlight=True)
add_highlighted_run(p_c1_1_c, "\n• Địa chỉ trụ sở: Khu công nghiệp Thạnh Lộc, xã Thạnh Lộc, huyện Châu Thành, tỉnh Kiên Giang (Zone II - TBS Group)\n• Điện thoại văn phòng: ")
add_highlighted_run(p_c1_1_c, "[CẦN BỔ SUNG: Số điện thoại văn phòng]", is_highlight=True)
add_highlighted_run(p_c1_1_c, "\n• Ngày thành lập chi nhánh: ")
add_highlighted_run(p_c1_1_c, "[CẦN BỔ SUNG: Ngày cấp phép thành lập chi nhánh Kiên Giang]", is_highlight=True)
add_highlighted_run(p_c1_1_c, " (Tập đoàn TBS Group thành lập từ năm 1989)\n• Website tập đoàn: https://tbsgroup.vn\n• Lãnh đạo phụ trách đơn vị: Tổng Giám Đốc Phạm Minh Tùng\n• Chủ tịch Hội đồng Quản trị Tập đoàn: Ông Nguyễn Đức Thuấn")

def find_local(query, start, end):
    for i in range(start, end):
        if query.lower() in doc.paragraphs[i].text.lower():
            return i
    return -1

idx_1_2 = find_local("Quá trình thành lập", C1, C2)
if idx_1_2 > -1:
    for pi in range(C1 + 3, idx_1_2):
        doc.paragraphs[pi].text = ""
    format_p(doc.paragraphs[idx_1_2], "1.2. Quá trình thành lập và phát triển", style='2', bold=True)
    format_p(doc.paragraphs[idx_1_2 + 1],
        "Hành trình phát triển của Tập đoàn TBS Group trải qua hơn 35 năm bền bỉ, khởi đầu từ một xưởng sản xuất giày da thủ công nhỏ "
        "thành lập năm 1989 tại tỉnh Bình Dương. Với tầm nhìn chiến lược của Chủ tịch HĐQT Nguyễn Đức Thuấn, tập đoàn đã nhanh chóng vươn lên, "
        "trở thành đối tác sản xuất chiến lược toàn cầu của các tập đoàn giày thể thao và thời trang hàng đầu thế giới như SKECHERS, Decathlon, Coach.\n\n"
        "Giai đoạn những năm 2010 đến nay, nhằm đón đầu làn sóng dịch chuyển sản xuất và tối ưu hóa nguồn lực lao động tại Đồng bằng sông Cửu Long, "
        "TBS Group đã thành lập Công Ty CPĐT Thái Bình Kiên Giang (Zone II). Đơn vị nhanh chóng được quy hoạch hiện đại với cụm xưởng sản xuất "
        "quy mô lớn và Trung tâm Nghiên cứu & Phát triển mẫu (SKECHERS R&D Center). Năm 2026, TBS Kiên Giang (Zone II) đóng vai trò là hạt nhân "
        "tiên phong trong chiến lược Chuyển đổi số 4.0 của toàn tập đoàn, đẩy mạnh tự động hóa chuyền may, số hóa chỉ số OEE/PPH theo thời gian thực "
        "và áp dụng công nghệ điện toán biên vào công tác quản trị điều hành sản xuất."
    )

idx_1_3 = find_local("Chức năng nhiệm vụ", C1, C2)
if idx_1_3 > -1:
    format_p(doc.paragraphs[idx_1_3], "1.3. Chức năng và nhiệm vụ", style='2', bold=True)

idx_1_3_1 = find_local("1.3.1", C1, C2)
if idx_1_3_1 > -1:
    format_p(doc.paragraphs[idx_1_3_1], "1.3.1. Chức năng của đơn vị", style='Heading 3', bold=True)
    format_p(doc.paragraphs[idx_1_3_1 + 1],
        "1. Đầu não điều phối chuỗi cung ứng sản xuất SKECHERS: Quản lý kế hoạch cung ứng nguyên vật liệu, theo dõi đơn hàng xuất khẩu "
        "và điều phối tiến độ gia công giữa các phân xưởng trong toàn bộ Zone II.\n"
        "2. Trung tâm Nghiên cứu & Phát triển công nghệ (R&D Center): Tiếp nhận bản vẽ thiết kế 3D từ nhãn hàng SKECHERS, nghiên cứu phom dáng, "
        "chế thử mẫu giày thể thao, thử nghiệm độ bền vật liệu tại phòng Lab và chuyển giao quy trình công nghệ cho các nhà máy sản xuất hàng loạt.\n"
        "3. Quản trị chất lượng theo tiêu chuẩn toàn cầu: Kiểm định nghiêm ngặt chất lượng sản phẩm qua từng công đoạn (Chặt, May, Gò, Đóng gói) "
        "đảm bảo chuẩn chất lượng AQL 1.0 của thương hiệu SKECHERS."
    )

idx_1_3_2 = find_local("1.3.2", C1, C2)
if idx_1_3_2 > -1:
    format_p(doc.paragraphs[idx_1_3_2], "1.3.2. Nhiệm vụ của đơn vị", style='Heading 3', bold=True)
    format_p(doc.paragraphs[idx_1_3_2 + 1],
        "1. Hoàn thành vượt mức kế hoạch sản lượng xuất khẩu được Tập đoàn TBS Group và đối tác SKECHERS giao phó hàng năm.\n"
        "2. Thực hiện nghiêm ngặt các quy định về an toàn lao động, kiểm soát hiện trường sản xuất (Gemba Walk), tiêu chuẩn 5S và phòng cháy chữa cháy.\n"
        "3. Quản lý, bảo trì và nâng cao hiệu suất hoạt động của hệ thống hàng ngàn máy móc thiết bị (MMTB) hiện đại.\n"
        "4. Đẩy mạnh phong trào Cải tiến liên tục (CI-Kaizen), khuyến khích CBCNV đóng góp sáng kiến nâng cao năng suất và tiết kiệm chi phí.\n"
        "5. Xây dựng môi trường làm việc nhân văn, chuyên nghiệp, chăm lo đời sống vật chất và tinh thần cho hàng ngàn người lao động tại địa phương."
    )

idx_1_4 = find_local("Sơ đồ tổ chức", C1, C2)
if idx_1_4 > -1:
    format_p(doc.paragraphs[idx_1_4], "1.4. Sơ đồ cơ cấu tổ chức bộ máy quản lý", style='2', bold=True)
    p_sd_c = doc.paragraphs[idx_1_4 + 1]
    p_sd_c.text = ""
    add_highlighted_run(p_sd_c, "Cơ cấu tổ chức của Công Ty CPĐT Thái Bình Kiên Giang – TBS Group (Zone II) – SKECHERS R&D Center được vận hành theo mô hình quản trị ma trận liên thông, kết hợp chặt chẽ giữa quản trị chức năng và chuỗi giá trị sản phẩm:\n• Hội đồng Quản trị & Ban Tổng Giám Đốc: Định hướng chiến lược phát triển, phê duyệt kế hoạch tài chính và quyết định đầu tư công nghệ. Đứng đầu là Chủ tịch HĐQT Nguyễn Đức Thuấn và Tổng Giám Đốc Phạm Minh Tùng.\n• Khối Văn phòng Chuỗi SKECHERS: Đầu mối điều hành chuỗi cung ứng, phụ trách kế hoạch vật tư (PMC) và trung tâm phân phối.\n• Trung tâm Nghiên cứu & Phát triển mẫu (SKECHERS R&D Center): Phụ trách kỹ thuật 3D CAD/CAM, chế thử mẫu và thử nghiệm phòng LAB.\n• Khối Quản lý Chất lượng (QA/QC): Giám sát độc lập tiêu chuẩn chất lượng sản phẩm từ khâu nguyên phụ liệu đến thành phẩm.\n• Khối Cải tiến liên tục (CI) & Kỹ thuật công nghiệp (IE): Tối ưu hóa layout chuyền may, định mức thời gian và tổ chức phong trào Kaizen.\n• Khối Quản trị Nguồn nhân lực & Hành chính: Tuyển dụng, đào tạo, chính sách tiền lương (C&B) và quản lý cơ sở vật chất.\n• Khối Sản xuất & Hệ thống Phân xưởng: Trực tiếp điều hành các xưởng may, xưởng chặt, xưởng gò đế và hoàn thiện sản phẩm.\n\nSơ đồ trực quan: ")
    add_highlighted_run(p_sd_c, "[CẦN BỔ SUNG: Sơ đồ cơ cấu tổ chức bản vẽ chính thức của đơn vị]", is_highlight=True)
    if idx_1_4 + 2 < len(doc.paragraphs):
        add_caption(doc.paragraphs[idx_1_4 + 2], "Hình 1.1: Sơ đồ cơ cấu tổ chức Công Ty CPĐT Thái Bình Kiên Giang – TBS Group (Zone II)")

idx_1_5 = find_local("Nhiệm vụ được giao", C1, C2)
if idx_1_5 > -1:
    format_p(doc.paragraphs[idx_1_5], "1.5. Nhiệm vụ được giao trong quá trình thực tập", style='2', bold=True)
    format_p(doc.paragraphs[idx_1_5 + 1],
        "Trong đợt thực tập tốt nghiệp, em vinh dự được nhận vào làm việc tại Team Chuyển đổi số trực thuộc Ban Tổng Giám Đốc và "
        "Phòng Hành chính - Nhân sự. Dưới sự chỉ đạo trực tiếp của TGĐ. Phạm Minh Tùng, em được phân công đảm nhiệm các nhiệm vụ trọng tâm:\n"
        "1. Khảo sát thực địa và đánh giá mức độ số hóa của các quy trình nghiệp vụ hiện hành tại các phòng ban thuộc Zone II.\n"
        "2. Trực tiếp chịu trách nhiệm kiến trúc và phát triển phần mềm toàn trình (Fullstack): xây dựng frontend giao diện với Next.js 14, "
        "lập trình backend Serverless Edge Worker với Cloudflare Workers, thiết kế cấu trúc CSDL Cloudflare D1 và bộ nhớ lưu trữ Cloudflare R2.\n"
        "3. Thiết kế hệ thống phân quyền đa vai trò (RBAC), khắc phục triệt để các lỗ hổng bảo mật và xây dựng cơ chế xác thực JWT an toàn.\n"
        "4. Tích hợp các dịch vụ bên ngoài: hệ thống thông báo đẩy Web Push VAPID, chatbot thông báo Zalo qua Webhook và tự động sao lưu dữ liệu sang Google Drive.\n"
        "5. Tổ chức kiểm thử tự động toàn diện, chủ trì triển khai chương trình thử nghiệm Pilot 100 người dùng và đóng gói triển khai chính thức hệ thống lên Production."
    )

idx_1_6 = find_local("Mục tiêu và kế hoạch thực tập", C1, C2)
if idx_1_6 > -1:
    format_p(doc.paragraphs[idx_1_6], "1.6. Mục tiêu và kế hoạch thực tập", style='2', bold=True)
    format_p(doc.paragraphs[idx_1_6 + 1],
        "Mục tiêu xuyên suốt quá trình thực tập là rèn luyện tác phong làm việc công nghiệp, chuyển hóa các kiến thức học thuật tại trường "
        "thành giải pháp công nghệ có khả năng giải quyết trực tiếp các bài toán thực tiễn phức tạp của doanh nghiệp. "
        "Kế hoạch thực tập được phân bổ khoa học qua 10 tuần, từ ngày 03/8/2026 đến ngày 10/10/2026, tuần tự từ khâu khảo sát phân tích, "
        "thiết kế kiến trúc, phát triển các phân hệ cốt lõi, tích hợp bảo mật, kiểm thử tự động đến đóng gói triển khai sản phẩm."
    )

idx_1_7 = find_local("Kiến thức và kỹ năng đã áp dụng", C1, C2)
if idx_1_7 > -1:
    format_p(doc.paragraphs[idx_1_7], "1.7. Kiến thức và kỹ năng đã áp dụng", style='2', bold=True)
    format_p(doc.paragraphs[idx_1_7 + 1],
        "Quá trình thực hiện đề tài đã giúp em vận dụng và phát huy tối đa các khối kiến thức và kỹ năng chuyên ngành:\n"
        "• Kiến thức lý thuyết: Kỹ thuật lập trình hiện đại (TypeScript/React), kiến trúc hệ thống phân tán, cơ sở dữ liệu quan hệ (SQL/SQLite), "
        "an toàn thông tin web (OWASP Top 10 API Security), mạng máy tính và giao thức HTTP/SSE/WebSocket.\n"
        "• Kỹ năng công nghệ mới: Làm chủ hệ sinh thái Serverless Edge Computing của Cloudflare (Workers V8 Isolate, D1 Database, R2 Object Storage), "
        "lập trình tối ưu hóa giao diện với Tailwind CSS, xử lý dữ liệu lớn với XLSX và Chart.js/Recharts.\n"
        "• Kỹ năng mềm: Giao tiếp hiệu quả với cán bộ công nhân viên và lãnh đạo cấp cao, kỹ năng giải quyết vấn đề (troubleshooting), "
        "kỹ năng quản lý thời gian và viết tài liệu kỹ thuật chuẩn mực."
    )

for pi in range(idx_1_7 + 2, C2):
    doc.paragraphs[pi].text = ""

# 6. CHƯƠNG 2: TỔNG QUAN VỀ HỆ THỐNG VÀ QUY TRÌNH THỰC HIỆN
print("6. Bổ sung nội dung chi tiết từ README.md vào Chương 2...")
format_p(doc.paragraphs[C2], "CHƯƠNG 2: TỔNG QUAN VỀ HỆ THỐNG QUẢN TRỊ VẬN HÀNH VÀ SỐ HÓA TBS GROUP (ZONE II)", style='1', bold=True)

c2_enriched_content = """2.1. Giới thiệu hệ thống, sứ mệnh cốt lõi & Khung Quản trị Chiến lược 1-5-2
Hệ thống "Quản Trị Vận Hành Chuỗi Cung Ứng & Sản Xuất SKECHERS - TBS Group (Zone II)" (mã nguồn: vpchuoiskechers) được xây dựng nhằm phục vụ công tác chuyển đổi số toàn diện cho Văn Phòng Chuỗi SKECHERS kết hợp Trung tâm Nghiên cứu & Phát triển mẫu (SKECHERS R&D Center) và cụm nhà máy sản xuất giày da Kiên Giang. Hệ thống hợp nhất toàn bộ dữ liệu điều hành tác nghiệp, kiểm soát chất lượng, chỉ số năng suất sản xuất và quản trị nguồn lực trên một cổng làm việc trung tâm duy nhất tại đường dẫn /work.

Các mục tiêu sứ mệnh cốt lõi của hệ thống (theo tài liệu kỹ thuật README.md):
1. Số hóa hiện trường Gemba Walk & Cải tiến liên tục CI/Kaizen 4.0: Chuyển đổi toàn bộ quy trình đề xuất cải tiến từ giấy tờ truyền thống sang hệ thống số hóa tự động với sự hỗ trợ của thuật toán AI so sánh trùng lặp ý tưởng.
2. Quản lý Máy Móc Thiết Bị (MMTB / Maintenance): Phân hệ native số hóa 100% hồ sơ kỹ thuật máy móc, quản lý phiếu sửa chữa khẩn cấp, lập lịch bảo dưỡng định kỳ, xuất nhập Excel hàng loạt và quét mã QR payload JSON thật trên thiết bị di động.
3. Trực quan hóa Khung Quản trị Chiến lược 1-5-2: Hỗ trợ Ban Giám Đốc và các Trưởng phòng ban theo dõi chỉ số mục đích xuyên suốt, 5 trụ cột vận hành và 2 nền tảng quản trị theo thời gian thực (Real-time BI 24/7).
4. Tối ưu hóa quản lý nguồn lực doanh nghiệp: Tích hợp đồng bộ các phân hệ Đặt phòng họp thông minh (Room Booking), Đăng ký công tác (Business Trip), Quản trị nhân sự (HR) và Kế toán quản trị (Finance) trong một không gian làm việc tập trung (App Hub).
5. Hạ tầng điện toán biên (Serverless Edge Computing): Triển khai trên mạng lưới toàn cầu của Cloudflare Workers giúp đạt tốc độ phản hồi cực nhanh (< 20ms) và tính sẵn sàng cao 99.99%.

Khung Quản trị Chiến lược 1-5-2 chi tiết:
• 1. Mục đích xuyên suốt: "Xây dựng TBS Group là một ĐỐI TÁC KHÔNG THỂ THAY THẾ trong chuỗi giá trị toàn cầu, tự vận hành & bền vững".
• 5 Trụ cột vận hành cốt lõi:
  1. CHIẾN LƯỢC: Quản trị mục tiêu dài hạn, kế hoạch phát triển sản phẩm SKECHERS.
  2. TC-CN-HTS (Tài chính - Công nghệ - Hệ thống số): Đầu tư công nghệ biên, tự động hóa chuyền may.
  3. KH & CC (Khách hàng & Chuỗi cung ứng): Quản trị chuỗi cung ứng vật tư PMC, đáp ứng tiêu chuẩn đối tác toàn cầu.
  4. TH & NM (Thương hiệu & Nhà máy): Đảm bảo chất lượng xuất khẩu chuẩn AQL 1.0, đồng bộ thương hiệu SKECHERS.
  5. VHDN (Văn hóa doanh nghiệp): Đề cao tinh thần cải tiến Kaizen, đoàn kết và tác phong công nghiệp.
• 2 Nền tảng quản trị nền móng:
  1. TỔ CHỨC - HẠ TẦNG: Kết nối hạ tầng cơ sở cụm nhà máy Thái Bình Kiên Giang (TH KG) và Nhà máy SKECHERS Miền Đông (NM_SKMĐ). Tích hợp cây thư mục tài liệu hạ tầng xem trực tiếp file PDF lưu trữ trên Google Drive.
  2. DỮ LIỆU SỐ (BI 24/7): Báo cáo điều hành số hóa, bao gồm Báo cáo Định hướng & Ngân sách (3 Card Grid), Báo cáo Điều hành CH001-CH005 (5 Card Grid) và Thư viện biểu mẫu điện tử.

2.2. Quy trình thực hiện chi tiết theo kế hoạch thực tập 10 tuần
Quá trình nghiên cứu và phát triển hệ thống được tổ chức tuần tự, khoa học theo đúng tiến trình kỹ nghệ phần mềm và dòng thời gian thực tế ghi nhận trên kho lưu trữ mã nguồn:

2.2.1. Tuần 1 (03/8 – 08/8/2026): Tìm hiểu và phân tích tổng quan dự án
a) Giới thiệu tổng quan về đơn vị thực tập và dự án: Tiếp nhận tài liệu giới thiệu cơ cấu tổ chức, quy định an toàn bảo mật thông tin của Tập đoàn TBS Group và SKECHERS R&D Center; lắng nghe định hướng chỉ đạo chiến lược từ TGĐ. Phạm Minh Tùng.
b) Nghiên cứu kiến trúc mã nguồn hiện có: Khảo sát hiện trạng các công cụ số hóa rời rạc, phân tích các rủi ro tắc nghẽn của hệ thống máy chủ VPS cũ; tìm hiểu các giải pháp công nghệ điện toán biên không máy chủ (Serverless Edge).
c) Xác định phạm vi công việc và lập kế hoạch: Thống nhất danh mục 10 phân hệ nghiệp vụ cần số hóa, xây dựng tài liệu đặc tả yêu cầu người dùng (SRS) và xác lập bảng kế hoạch hành động 10 tuần.

2.2.2. Tuần 2 (10/8 – 15/8/2026): Xây dựng và phát triển các chức năng hệ thống
a) Khởi tạo khung ứng dụng: Khởi tạo dự án Next.js 14 App Router, tích hợp TypeScript và Tailwind CSS tối ưu hóa bundle tĩnh.
b) Thiết kế kiến trúc Serverless Edge: Cấu hình môi trường Cloudflare Workers, kết nối cơ sở dữ liệu quan hệ Cloudflare D1 và thiết kế các bảng cơ sở dữ liệu nền tảng ban đầu.
c) Đồng bộ màu sắc thương hiệu: Chuẩn hóa hệ thống thiết kế giao diện (Design System) theo đúng bộ nhận diện thương hiệu TBS Group (màu xanh lá chủ đạo #006838) và thương hiệu đối tác toàn cầu SKECHERS (màu xanh navy #003366).

2.2.3. Tuần 3 (17/8 – 22/8/2026): Xây dựng phân hệ Quản lý công việc cá nhân, Bảng công việc phòng ban và Dự án liên phòng ban
a) Xây dựng phân hệ Công việc cá nhân (My Tasks): Cho phép nhân viên theo dõi toàn bộ đầu việc được giao, phân loại theo độ ưu tiên, ngày hết hạn và cập nhật tiến độ tức thời.
b) Xây dựng Bảng công việc phòng ban (Department Kanban): Phát triển bảng điều khiển công việc dạng kéo thả với luồng trạng thái chuẩn TO_DO -> DOING -> REVIEW -> DONE; tích hợp tính năng giao việc nhanh trong 5 giây.
c) Xây dựng phân hệ Dự án liên phòng ban (Projects): Quản lý danh mục các dự án phối hợp đa phòng ban, xây dựng thuật toán Bottleneck Detector tự động phát hiện và cảnh báo các nhân sự hoặc công đoạn bị nghẽn (>= 2 việc trễ hạn).

2.2.4. Tuần 4 (24/8 – 29/8/2026): Xây dựng phân hệ Kiểm soát hiện trường GEMBA Walk và Đăng ký sáng kiến cải tiến liên tục (CI-Kaizen)
a) Xây dựng phân hệ Kiểm soát hiện trường GEMBA Walk: Số hóa quy trình kiểm tra Gemba Walk theo từng cụm xưởng, chuyền may và kho vật tư; tích hợp quét mã QR vị trí và biểu mẫu chấm điểm 5S trực tiếp trên di động.
b) Xây dựng phân hệ Đăng ký sáng kiến CI-Kaizen: Xây dựng biểu mẫu đăng ký cải tiến trực quan cho CBCNV, cho phép đính kèm ảnh hiện trạng trước và sau cải tiến; thiết lập luồng hàng đợi thẩm định tính khả thi của kỹ sư IE.
c) Xây dựng hệ thống chấm điểm Ban Giám Khảo: Cung cấp tài khoản chấm điểm độc lập cho các giám khảo với 5 tiêu chí chuẩn hóa và hệ thống tự động tổng hợp điểm xếp hạng Realtime.

2.2.5. Tuần 5 (31/8 – 05/9/2026): Xây dựng phân hệ Quản lý sản lượng PPH nhà máy và tích hợp dữ liệu Máy móc thiết bị (MMTB)
a) Xây dựng màn hình hiển thị sản lượng PPH: Thu thập và hiển thị sản lượng thực tế theo từng giờ của từng tổ/chuyền may so với kế hoạch PMC.
b) Thiết lập hệ thống mã màu hiệu suất 5 cấp độ: Trực quan hóa tiến độ bằng màu sắc (Đạt vượt mức, Đạt, Cảnh báo, Chậm, Nguy cơ trễ) phục vụ trình chiếu trên màn hình TV xưởng may.
c) Tích hợp dữ liệu Máy móc thiết bị (MMTB): Kết nối API hệ thống bảo trì MMTB, đo lường thời gian đáp ứng sự cố (MTTD) và thời gian sửa chữa trung bình (MTTR), phân tích lỗi thiết bị bằng biểu đồ Pareto.

2.2.6. Tuần 6 (07/9 – 12/9/2026): Tích hợp hệ thống thông báo đa kênh: Web Push (VAPID), Zalo Notification Service và Service Worker
a) Cấu hình chuẩn Web Push VAPID: Thiết lập cặp khóa mã hóa bảo mật VAPID, đăng ký Service Worker nền tảng cho phép trình duyệt nhận thông báo đẩy ngay cả khi người dùng đóng tab.
b) Xây dựng Adapter thông báo đa kênh: Tích hợp dịch vụ tin nhắn Zalo Notification thông qua Zalo Bot Webhook, gửi mã xác nhận và thông báo giao việc đến từng cá nhân.
c) Đồng bộ trạng thái đọc: Quản lý thiết bị đăng ký nhận tin, tự động đếm số lượng thông báo chưa đọc và cập nhật Badge đỏ tức thời trên Header.

2.2.7. Tuần 7 (14/9 – 19/9/2026): Hoàn thiện hệ thống phân quyền đa cấp (RBAC), bảo mật xác thực (JWT/Session) và cơ chế Audit Log / Idempotency
a) Thiết lập ma trận phân quyền RBAC 7 tầng: Phân cấp chặt chẽ quyền hạn từ Super Admin, Ban Giám Đốc, Trưởng phòng, Nhân viên, Giám khảo đến Lễ tân; kiểm soát quyền truy cập theo từng API endpoint và màn hình giao diện.
b) Nâng cấp cơ chế xác thực bảo mật: Chuyển đổi toàn bộ mật khẩu sang thuật toán băm an toàn SHA-256 kết hợp chuỗi muối (Salt), phát hành và kiểm tra chuỗi JWT token có chữ ký số.
c) Xây dựng hệ thống Audit Trail và Idempotency: Ghi nhận vết mọi hành động thêm/sửa/xóa nhạy cảm vào bảng sys_audit_logs; áp dụng khóa Idempotency Key chống tình trạng gửi đúp dữ liệu khi mạng chập chờn.

2.2.8. Tuần 8 (21/9 – 26/9/2026): Xây dựng cơ chế sao lưu tự động (Incremental Backup sang Google Drive), quản lý file media Cloudflare R2 và tối ưu nén ảnh client
a) Tự động sao lưu dữ liệu sang Google Drive: Tích hợp Service Account với cặp khóa RSA-2048, tự động thực hiện snapshot dữ liệu hàng ngày và xuất bản sao lưu gia tăng (Incremental Backup) lên đám mây.
b) Lưu trữ và phân phối tệp media qua Cloudflare R2: Thiết lập 2 bucket tbs-business-trips và tbs-img, cấu hình quy tắc CORS và định tuyến phân phối ảnh không tính phí băng thông ra ngoài.
c) Tối ưu hóa xử lý ảnh phía client: Triển khai thuật toán nén ảnh Canvas Compression giảm dung lượng ảnh hiện trường từ 5MB xuống dưới 300KB trước khi upload, tiết kiệm 94% băng thông mạng xưởng.

2.2.9. Tuần 9 (28/9 – 03/10/2026): Kiểm thử toàn diện hệ thống: UAT 100 người dùng, kiểm thử bảo mật đa vai trò, kiểm thử API và sửa lỗi hồi quy
a) Kiểm thử tự động Pilot UAT (10/10 kịch bản đạt 100% PASS): Chạy kịch bản tự động kiểm tra đăng nhập, tạo việc, chuyển trạng thái nghiệm thu, ràng buộc điều kiện duyệt, phát hiện điểm nghẽn và xuất báo cáo A4/Excel.
b) Kiểm thử bảo mật đa vai trò (15/15 kịch bản đạt 100% PASS): Xác thực việc chặn đứng hoàn toàn các hành vi vượt quyền BOLA/IDOR, cô lập dữ liệu cá nhân giữa các nhân viên và bảo vệ an toàn task của Ban Giám Đốc.
c) Rà soát và vá toàn diện 14 điểm rủi ro an ninh theo báo cáo QA: Khắc phục triệt để các lỗ hổng xác thực, bảo vệ thông tin danh bạ nhân sự PII và hoàn thiện cơ chế kiểm soát đồng thời OCC.

2.2.10. Tuần 10 (05/10 – 10/10/2026): Triển khai hệ thống lên Cloudflare Workers (Production), đánh giá hiệu năng và hoàn thiện báo cáo thực tập
a) Đóng gói và triển khai Production: Biên dịch bản build tối ưu tĩnh (Next.js static export) và đẩy toàn bộ mã nguồn lên Cloudflare Workers thông qua công cụ Wrangler CLI.
b) Đo lường hiệu năng thực tế tại mạng biên: Đạt thời gian khởi động Worker 7ms, truy vấn D1 SQL trung bình dưới 1ms, độ phản hồi trang web dưới 350ms, vận hành ổn định 24/7.
c) Tổng kết và nghiệm thu đề tài: Bàn giao hệ thống cho Ban Tổng Giám Đốc và Team Chuyển đổi số, hoàn thiện toàn bộ báo cáo thực tập tốt nghiệp và tài liệu hướng dẫn vận hành.

2.3. Sơ đồ và mô tả luồng hoạt động các tính năng chính (Trích xuất từ tài liệu kỹ thuật README.md)

2.3.1. Phân hệ Quản lý Công việc cá nhân (My Tasks) & Bảng Kanban phòng ban
Luồng xử lý: Người dùng tạo nhanh công việc -> Hệ thống ghi nhận vào trạng thái TO_DO -> Khi bắt đầu xử lý chuyển sang DOING -> Hoàn thành công việc chuyển sang REVIEW kèm bắt buộc nhập mô tả kết quả (>= 5 ký tự) -> Cấp quản lý/Trưởng phòng tiến hành nghiệm thu: nếu đạt chuyển sang DONE (tiến độ 100%), nếu chưa đạt bấm Từ chối (bắt buộc nhập lý do >= 5 ký tự) để chuyển công việc về lại DOING.

2.3.2. Phân hệ Dự án liên phòng ban (Projects) & Thuật toán Cảnh báo điểm nghẽn (Bottlenecks)
Luồng xử lý: Ban Giám Đốc/Trưởng phòng khởi tạo dự án -> Phân công phòng ban chủ trì, phòng ban phối hợp và Chủ nhiệm dự án (PM) -> Tạo các gói công việc thành phần -> Thuật toán Bottleneck Detector quét định kỳ toàn bộ công việc: nếu phát hiện cá nhân hoặc bộ phận có từ 2 công việc bị trễ hạn trở lên, hệ thống tự động kích hoạt cờ cảnh báo đỏ trên Dashboard dự án để lãnh đạo kịp thời điều phối nguồn lực.

2.3.3. Phân hệ Kiểm soát hiện trường sản xuất GEMBA Walk & Quét mã QR di động
Luồng xử lý: Cán bộ kiểm tra sử dụng điện thoại quét mã QR dán tại chuyền/máy -> Ứng dụng tự động nhận diện vị trí xưởng và tổ may -> Hiển thị danh sách kiểm tra (Checklist 5S, an toàn, chất lượng) -> Chụp ảnh bằng chứng hiện trường (tự động nén ảnh client) -> Gửi báo cáo lên hệ thống -> Tự động tính điểm tuân thủ và thông báo cho Quản đốc xưởng nếu phát hiện vi phạm nghiêm trọng.

2.3.4. Phân hệ Sáng kiến Cải tiến liên tục (CI/Kaizen 4.0) & Thuật toán AI so sánh trùng lặp
Theo tài liệu README.md, quy trình CI/Kaizen 4.0 được thiết kế gồm 5 bước tiêu chuẩn và tích hợp Engine AI:
• Bước 1 - Đăng ký ý tưởng & Kiểm tra AI: Tác giả gửi ý tưởng qua Form 5 bước (cán bộ nội bộ) hoặc Form Public QR Code nhanh (công nhân tại chuyền). Engine AI tự động tính toán độ tương đồng với toàn bộ đề xuất cũ qua thuật toán N-Gram & Cosine Similarity:
  - Nếu độ tương đồng > 80%: Hệ thống phát cảnh báo ĐỎ (Trùng lặp cao với đề xuất cũ).
  - Nếu từ 50% đến 80%: Phát cảnh báo VÀNG (Ý tưởng có nét tương đồng, nên tham khảo).
  - Nếu dưới 50%: Xác nhận đề xuất mới hợp lệ và lưu vào CSDL Cloudflare D1.
• Bước 2 - Sơ duyệt: Trưởng ban hoặc Thư ký CI kiểm tra tính hoàn thiện của hồ sơ.
• Bước 3 - Duyệt tính khả thi: Giám đốc Nhà máy xem xét và phê duyệt triển khai thử nghiệm.
• Bước 4 - Triển khai thực hiện: Áp dụng cải tiến trực tiếp tại hiện trường xưởng may (Gemba).
• Bước 5 - Đánh giá kết quả & Chấm điểm: Hội đồng chuyên gia và Ban Giám Khảo chấm điểm độc lập theo 5 tiêu chí; hệ thống tự động vinh danh lên Bảng xếp hạng Kaizen (Leaderboard).

2.3.5. Phân hệ Quản lý Máy móc Thiết bị (MMTB Operations) - 4 quy trình chuyên sâu
Phân hệ MMTB là một trong các phân hệ vận hành công nghiệp đồ sộ nhất, gồm 4 luồng hoạt động chính xác theo đặc tả README.md:
• Luồng 1 - Đăng ký, quản lý & tra cứu mã QR Code thiết bị MMTB: Hỗ trợ thêm thủ công hoặc tải file Excel .xlsx theo Template chuẩn 10 cột, tự động tra cứu ID Nhà máy/Khu vực/Chuyền/Loại máy. Hệ thống tự động tạo mã QR payload JSON thật dạng {"type":"machine","code":"MMTB-xxxx"} để in tem nhãn dán lên thân máy. Kỹ thuật viên dùng di động quét mã QR sẽ trực tiếp kích hoạt mở Technical Profile Drawer hiển thị toàn bộ hồ sơ máy.
• Luồng 2 - Xử lý nhu cầu & Phiếu sửa chữa khẩn cấp MMTB: Khi máy hỏng tại chuyền, công nhân/quản lý gửi phiếu sửa chữa với mức ưu tiên khẩn cấp (dừng chuyền/cảnh báo đỏ) -> Lưu phiếu status 'pending' vào D1 -> Trưởng bộ phận phân công KTV ('assigned') -> KTV đến Gemba nhấn Nhận việc ('in_progress', ghi nhận acceptedAt) -> Sửa chữa và ghi nhận mã phụ tùng thay thế -> Xác nhận hoàn thành ('completed', ghi nhận completedAt) -> Hệ thống tự động tính thời gian dừng máy Downtime = completedAt - createdAt và cập nhật chỉ số MTTA, MTTR, MTTD cho báo cáo BI.
• Luồng 3 - Lập kế hoạch & Bảo dưỡng định kỳ MMTB: Hệ thống định kỳ quét chu kỳ bảo dưỡng (Tuần/1 Tháng/3 Tháng/6 Tháng/1 Năm), so sánh ngày hiện tại với next_due_date để phân loại trạng thái overdue (quá hạn - cảnh báo đỏ), upcoming (sắp đến hạn trong 7 ngày) hoặc scheduled -> KTV thực hiện kiểm tra checklist Gemba -> Nếu thiết bị hỏng tự động sinh phiếu sửa chữa khẩn cấp -> Cập nhật last_maintenance_date và tự động tính next_due_date = Today + Chu kỳ.
• Luồng 4 - Phân tích chỉ số BI & Trực quan sơ đồ nhà máy (Spatial Floor Plan): Tính toán 4 chỉ số cốt lõi: MTTA (thời gian phản hồi), MTTR (thời gian sửa chữa), MTTD (thời gian phát hiện & xử lý), và Availability Rate (%) hiển thị dạng Monospace Tabular Numerals. Trực quan hóa biểu đồ Pareto 80/20 nguyên nhân sự cố hàng đầu và biểu đồ xu hướng Downtime theo tuần. Đặc biệt, bản đồ mặt sàn nhà máy (Spatial Floor Plan) hiển thị trực quan các node thiết bị với chấm trạng thái Green Dot (hoạt động), Yellow Dot (bảo trì) và Red Dot (sự cố dừng máy).

2.3.6. Phân hệ Quản lý Đăng ký Công tác (Business Trip) & Đặt phòng họp thông minh (Room Booking)
• Đăng ký Công tác: CBNV tạo phiếu công tác trực tuyến (địa điểm, thời gian, danh sách nhân sự đi cùng) -> Chuyển Trưởng phòng/Giám đốc phê duyệt -> Khi hoàn thành công tác, nhân sự nộp chứng từ hoàn ứng được lưu trữ an toàn trên Cloudflare R2 bucket tbs-business-trips.
• Đặt phòng họp thông minh: Người dùng xem lịch phòng họp real-time, chọn phòng và khung giờ -> Thuật toán kiểm tra xung đột (Conflict Detection) tự động ngăn chặn trùng lịch -> Xác nhận đặt phòng và gửi thông báo đến Lễ tân, tự động đồng bộ lên Bảng Điện Tử Lễ Tân.

2.3.7. Phân hệ Kế toán Quản trị & Tài chính (Finance Management)
Bao gồm 5 phân hệ nghiệp vụ: Quản lý Thu chi & Tạm ứng, Ngân sách & Dự toán phòng ban, Theo dõi Công nợ đối tác độc lập, Quản lý Khấu hao tài sản cố định nhà máy và Quản lý Kho vật tư. Các giao dịch qua cổng phê duyệt của Trưởng phòng Tài chính được lưu trực tiếp vào sổ cái kế toán và cập nhật báo cáo tài chính Realtime.

2.3.8. Phân hệ Quản lý sản lượng PPH nhà máy & Đồng bộ dữ liệu Máy móc thiết bị
Dữ liệu sản lượng thực tế từng giờ từ các chuyền may được cập nhật vào cơ sở dữ liệu D1 -> Hệ thống tự động tính toán chỉ số PPH = Sản lượng / (Số lao động x Số giờ) -> So sánh với mục tiêu PPH kế hoạch PMC -> Kích hoạt hệ thống mã màu 5 cấp độ trực quan trên màn hình TV xưởng may phục vụ giám sát tức thời.

2.3.9. Phân hệ Thông báo đa kênh (Web Push, Zalo Bot) & Ma trận phân quyền RBAC 7 tầng
Khi phát sinh sự kiện quan trọng (giao việc, nghiệm thu, duyệt công tác), hệ thống đồng thời kích hoạt thông báo đẩy Web Push qua Service Worker VAPID và gửi tin nhắn Zalo Bot đến từng cá nhân. Toàn bộ các thao tác được bảo vệ nghiêm ngặt qua 7 tầng phân quyền RBAC."""

format_p(doc.paragraphs[C2 + 1], c2_enriched_content, style='Normal')
for pi in range(C2 + 2, C3):
    doc.paragraphs[pi].text = ""

# 7. CHƯƠNG 3: THIẾT KẾ HỆ THỐNG
print("7. Bổ sung kiến trúc, DDL Schema SQL & Tech Tokens từ README.md vào Chương 3...")
format_p(doc.paragraphs[C3], "CHƯƠNG 3: THIẾT KẾ HỆ THỐNG", style='1', bold=True)

c3_enriched_content = """3.1. Kiến trúc tổng thể của hệ thống (System Architecture)
Theo sơ đồ kiến trúc tổng thể trong tài liệu kỹ thuật README.md, hệ thống được thiết kế theo mô hình 4 tầng phân lập rõ ràng (Client - Edge - Backend - Cloud Storage):
1. Tầng Khách (Client Layer):
   • Desktop Web Browser: Giao diện máy tính để bàn (Chrome, Edge, Firefox) với mật độ hiển thị thông tin cao, phục vụ công tác quản lý và điều hành sản xuất.
   • Mobile Browser / PWA: Giao diện di động trên iOS Safari và Android Chrome, thiết kế tối ưu hóa cho thao tác 1 tay trên sàn xưởng.
   • Public QR Code Scanner: Công cụ quét mã QR công cộng phục vụ công nhân quét mã tem máy MMTB và đề xuất Kaizen nhanh.
2. Tầng Mạng Biên Toàn Cầu (Cloudflare Global Edge Network):
   • Worker API Runtime: Động cơ cách ly V8 Isolate siêu nhẹ thực thi mã lệnh API tại hơn 300 điểm PoP trên toàn cầu.
   • Assets CDN: Mạng lưới phân phối tài nguyên tĩnh (HTML5, CSS3, JS Chunks) với thời gian phản hồi cực nhanh.
3. Tầng Dịch vụ Backend & RESTful APIs (Application Backend Services):
   • /api/maintenance/*: Xử lý toàn bộ logic CRUD máy móc, phiếu sửa chữa và lịch bảo trì MMTB.
   • /api/ci-kaizen: Xử lý quy trình sáng kiến 5 bước và thẩm định IE.
   • /api/ai/compare-kaizen: Động cơ AI so sánh trùng lặp văn bản.
   • /api/auth/login: Xác thực phiên JWT và kiểm soát quyền hạn RBAC.
4. Tầng Cơ sở dữ liệu & Lưu trữ Đám mây (Cloud Database & File Storage):
   • Cloudflare D1 SQL Database: Cơ sở dữ liệu quan hệ phân tán vpchuoiskechers-db lưu trữ 131 bảng dữ liệu chuẩn hóa.
   • Cloudinary CDN Storage: Lưu trữ hình ảnh máy móc MMTB, ảnh trước/sau Kaizen và chứng từ công tác.
   • Google Drive Workspace: Lưu trữ các tài liệu PDF hạ tầng và bản sao lưu tự động (Backup Snapshots).

3.2. Kiến trúc Serverless Edge trên nền tảng Cloudflare Workers
Hệ thống loại bỏ hoàn toàn kiến trúc máy chủ vật lý VPS cũ, ứng dụng 100% công nghệ Serverless Edge:
• Cơ chế V8 Isolate: Thời gian khởi động Worker chỉ 7ms, hoàn toàn không có độ trễ khởi động lạnh (Zero Cold Start), tối ưu vượt trội so với container Docker hoặc máy chủ ảo.
• Độ trễ truyền tải cực thấp: Mọi truy vấn từ nhà máy Kiên Giang được định tuyến đến điểm PoP gần nhất, giảm độ trễ phản hồi xuống dưới 20ms.
• Khả năng tự động co giãn không giới hạn: Đáp ứng tức thời từ vài chục đến hàng trăm ngàn lượt truy cập đồng thời mà không cần cấu hình cân bằng tải phức tạp.

3.3. Kiến trúc an toàn thông tin và bảo mật đa tầng
• Ma trận phân quyền RBAC 7 tầng: Phân cấp chặt chẽ: 1. Super Admin, 2. Ban Tổng Giám Đốc, 3. Trưởng phòng ban, 4. Cán bộ nhân viên, 5. Kỹ sư IE & Quản lý chất lượng QC, 6. Ban Giám Khảo Kaizen, 7. Lễ tân & Hành chính.
• Phòng chống lỗ hổng BOLA / IDOR: Kiểm tra quyền sở hữu đối tượng tại tầng Worker Middleware trước khi truy vấn SQL.
• Cơ chế Khóa chống trùng lặp (Idempotency Key): Bảo vệ các thao tác ghi dữ liệu nhạy cảm khi mạng xưởng may bị chập chờn.
• Nhật ký kiểm toán bất biến (Audit Trail): Ghi nhận toàn bộ vết hành vi thêm/sửa/xóa nhạy cảm vào bảng sys_audit_logs.

3.4. Kiến trúc triển khai & Cấu hình hạ tầng điện toán biên
Hệ thống cấu hình thông qua tệp wrangler.jsonc với các tài nguyên ràng buộc (Bindings):
• Assets Binding: Phân phối bộ mã tĩnh Next.js export (thư mục out).
• D1 Databases Binding: Kết nối CSDL sản xuất vpchuoiskechers-db (ID: ae3a7efd-ff5d-45c2-8c49-78d1518e3aa1) và CSDL thkiengiangshoes.
• R2 Buckets Binding: Gắn kết bộ lưu trữ tbs-business-trips và tbs-img.
• Cron Triggers Binding: Lập lịch tác vụ ngầm lúc 19:00 hàng ngày (0 19 * * *) để tổng hợp dữ liệu PPH, quét việc trễ hạn và sao lưu hệ thống.

3.5. Thiết kế Cơ sở dữ liệu Cloudflare D1 (D1 Database Schema Chi Tiết)
Hệ thống bao gồm 131 bảng dữ liệu, trong đó các cấu trúc bảng cốt lõi theo đặc tả README.md gồm:

1. Bảng Sáng kiến Kaizen (ci_kaizen_proposals):
   CREATE TABLE ci_kaizen_proposals (
       id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
       category TEXT DEFAULT 'Sản xuất', factory TEXT NOT NULL, region TEXT NOT NULL,
       proposer_name TEXT NOT NULL, proposer_code TEXT, department TEXT,
       current_state TEXT, solution TEXT, expected_benefit TEXT,
       image_before TEXT, image_after TEXT, status TEXT DEFAULT 'pending_preliminary',
       status_label TEXT DEFAULT 'Chờ sơ duyệt', preliminary_reviewer TEXT, preliminary_date TEXT,
       feasibility_approver TEXT, feasibility_date TEXT, evaluation_score REAL DEFAULT 0,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );

2. Bảng Danh mục Máy Móc Thiết Bị MMTB (maintenance_machines):
   CREATE TABLE maintenance_machines (
       id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
       serial_number TEXT, factory_id TEXT NOT NULL, area_id TEXT NOT NULL,
       line_id TEXT, team_id TEXT, machine_type_id TEXT, status_id TEXT NOT NULL DEFAULT 'active',
       location TEXT, specifications TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );

3. Bảng Phiếu Sửa Chữa MMTB (maintenance_tickets):
   CREATE TABLE maintenance_tickets (
       id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, machine_id TEXT NOT NULL,
       reporter_name TEXT NOT NULL, issue_description TEXT NOT NULL,
       priority TEXT DEFAULT 'normal', assigned_employee_id TEXT,
       status TEXT DEFAULT 'pending', accepted_at DATETIME, completed_at DATETIME,
       downtime_minutes REAL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY(machine_id) REFERENCES maintenance_machines(id)
   );

4. Bảng Lịch Bảo Dưỡng Định Kỳ MMTB (maintenance_schedule):
   CREATE TABLE maintenance_schedule (
       id TEXT PRIMARY KEY, machine_id TEXT NOT NULL, period_id TEXT NOT NULL,
       last_maintenance_date DATETIME, next_due_date DATETIME NOT NULL,
       status TEXT DEFAULT 'scheduled', assignee_id TEXT, notes TEXT,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY(machine_id) REFERENCES maintenance_machines(id)
   );

3.6. Công nghệ sử dụng & Hệ thống Design System Tokens
• Danh mục công nghệ chính thức: Next.js 14.2.15 (App Router, Static Export), React 18.3.1, TypeScript 5.x, Tailwind CSS 3.4.19, Cloudflare Workers Runtime, Cloudflare D1 SQLite, Cloudflare R2, Jose 5.9.3 (JWT), Tabler Icons React 3.19.0, Recharts 3.10.1, Chart.js 4.4.4, XLSX 0.18.5.
• Hệ thống Design System Tokens (Modern Industrial Operations Workspace):
  - Màu sắc thương hiệu chủ đạo: Forest Green (#006838) kết hợp Industrial Dark Emerald (#071612) và TBS Navy (#003366).
  - Kiểu chữ số công nghiệp: Tabular Monospace Numerals hiển thị sắc nét các chỉ số MTTA, MTTR, PPH trên bảng điện tử.
  - Bo góc chuẩn hóa: Border Radius giới hạn trong khoảng 6px - 8px, tạo cảm giác chắc chắn, chuyên nghiệp và đáng tin cậy."""

format_p(doc.paragraphs[C3 + 1], c3_enriched_content, style='Normal')
for pi in range(C3 + 2, C4):
    doc.paragraphs[pi].text = ""

# 8. CHƯƠNG 4: TRIỂN KHAI HỆ THỐNG
print("8. Bổ sung Danh mục API Endpoints & Cấu trúc Deployment vào Chương 4...")
format_p(doc.paragraphs[C4], "CHƯƠNG 4: TRIỂN KHAI HỆ THỐNG", style='1', bold=True)

c4_enriched_content = """4.1. Triển khai Giao diện người dùng (Next.js 14 App Router & Responsive Hybrid UI)
Giao diện người dùng được triển khai theo triết lý "Sạch sẽ, Tinh tế và Tối ưu thao tác" (Clean Industrial Dashboard):
• Bố cục màn hình Desktop: Phía bên trái là thanh điều hướng (Sidebar) có thể thu gọn linh hoạt, hiển thị danh mục các phân hệ nghiệp vụ theo quyền hạn người dùng; khu vực trung tâm hiển thị các thẻ dữ liệu thống kê (KPI Cards), bảng Kanban kéo thả mượt mà và các biểu đồ xu hướng.
• Tối ưu hóa màn hình Mobile: Thiết kế một cột duy nhất (Single-column layout), thanh chuyển đổi phân hệ dạng trượt ngang (Horizontal Tab Switcher), menu thao tác nhanh dạng Bottom Sheet bật lên từ cạnh dưới và kích thước vùng chạm tối thiểu 44px, hoàn toàn tương thích với thao tác bằng một tay của cán bộ kiểm tra trên sàn xưởng.
• Hệ thống màu sắc nhận diện: Màu xanh lá đậm TBS (#006838) biểu trưng cho sự phát triển bền vững và tinh thần cải tiến; màu xanh navy SKECHERS (#003366) đại diện cho chất lượng và tiêu chuẩn quốc tế; kết hợp cùng gam màu trắng sáng và nền xám Slate dịu mắt, chống mỏi mắt cho người dùng khi làm việc liên tục.

4.2. Triển khai Backend Serverless Edge & Danh mục RESTful API Endpoints
Toàn bộ logic backend của hệ thống được đóng gói trong tệp web/public/_worker.js với quy mô 17.000 dòng mã lệnh edge native, định tuyến hơn 108 API endpoints chuẩn mực:

Bảng Danh mục RESTful API Endpoints cốt lõi (theo tài liệu README.md):
1. GET /api/maintenance/machines (?factoryId=&areaId=&statusId=): Lấy danh sách máy móc thiết bị nhà máy (Quyền: Authorized).
2. POST /api/maintenance/machines ({code, name, areaId, statusId...}): Thêm mới hoặc cập nhật thông tin máy móc MMTB (Quyền: Authorized).
3. GET /api/maintenance/tickets (?machineId=&status=&priority=): Lấy danh sách phiếu sửa chữa và nhu cầu bảo trì (Quyền: Authorized).
4. POST /api/maintenance/tickets ({machineId, issueDescription, priority}): Tạo phiếu báo hỏng khẩn cấp hoặc cập nhật tiến độ (Quyền: Authorized).
5. GET /api/maintenance/schedule (?status=&assigneeId=): Danh sách lịch bảo dưỡng định kỳ MMTB (Quyền: Authorized).
6. GET /api/maintenance/categories (?type=FACTORY/AREA/LINE/PARTS): Tra cứu danh mục khu vực, chuyền tổ, phụ tùng (Quyền: Authorized).
7. GET /api/maintenance/overview-report (?dateFrom=&dateTo=&factoryId=): Báo cáo phân tích chỉ số MTTA, MTTR, MTTD & Downtime (Quyền: Authorized).
8. GET /api/ci-kaizen (?factory=&status=&search=): Lấy danh sách đề xuất sáng kiến Kaizen (Quyền: Public / Authorized).
9. POST /api/ci-kaizen ({title, category, solution...}): Đăng ký sáng kiến Kaizen Form 5 bước hoặc Public QR (Quyền: Public / Authorized).
10. POST /api/ai/compare-kaizen ({title, solution}): Chạy engine AI kiểm tra trùng lặp sáng kiến (Quyền: Public / Authorized).
11. POST /api/auth/login ({msnv, password}): Xác thực đăng nhập MSNV, cấp JWT Session Token (Quyền: Public).

4.3. Quản lý dữ liệu phân tán với Cloudflare D1 và lưu trữ Cloudflare R2
• D1 Relational Storage: Dữ liệu giao dịch được tổ chức chuẩn hóa bậc 3 (3NF). Cơ chế liên kết đọc trực tiếp từ bản sao cục bộ giúp giảm thiểu độ trễ đọc dữ liệu (Read Latency) xuống mức tiệm cận 0ms, trong khi các thao tác ghi dữ liệu được đồng bộ an toàn qua giao thức đồng thuận Raft phân tán của Cloudflare.
• R2 Media Storage: Triển khai 2 bucket riêng biệt:
  - Bucket tbs-business-trips: Lưu trữ hóa đơn, vé máy bay và chứng từ quyết toán công tác của CBNV.
  - Bucket tbs-img: Lưu trữ ảnh chụp hiện trường vi phạm Gemba, ảnh trước/sau sáng kiến Kaizen và ảnh đại diện nhân sự. Toàn bộ hình ảnh được phân phối qua đường dẫn proxy chuyên dụng, xóa bỏ hoàn toàn rào cản lỗi CORS trên trình duyệt.

4.4. Đồng bộ dữ liệu Realtime, Tích hợp Zalo Notification & Google Drive Backup
• Cơ chế đồng bộ Realtime: Kết hợp linh hoạt giữa Server-Sent Events (SSE) cho màn hình chấm điểm Kaizen của Ban Giám Khảo và cơ chế Smart Polling thích ứng (Adaptive Polling) cho bảng công việc Kanban. Tần suất cập nhật tự động tăng lên khi phát hiện tương tác người dùng và tự động giảm về chế độ tiết kiệm pin khi tab trình duyệt ở trạng thái ẩn.
• Tích hợp Zalo Notification Bot: Xây dựng hệ thống Webhook kết nối Official Account Zalo của tập đoàn. Khi có công việc mới được phân công hoặc phiếu Kaizen được nghiệm thu, hệ thống tự động đẩy thông báo kèm đường liên kết trực tiếp vào Zalo cá nhân của người thụ hưởng.
• Cơ chế Sao lưu Google Drive tự động: Tích hợp thư viện chữ ký số Jose và cặp khóa RSA-2048 của Google Service Account. Hàng ngày vào lúc 19:00, hệ thống tự động kích hoạt tiến trình trích xuất toàn bộ cấu trúc CSDL và xuất tệp backup mã hóa tải thẳng lên thư mục lưu trữ an toàn trên Google Drive của tập đoàn.

4.5. Quy trình CI/CD và triển khai tự động hóa
Quy trình xây dựng và phát hành phần mềm được tự động hóa qua chuỗi lệnh npm run build và npx wrangler deploy:
1. Bước 1 - Biên dịch CSS: Công cụ Tailwind CSS quét toàn bộ mã nguồn web/src, loại bỏ các lớp style thừa và biên dịch ra tệp compiled-tailwind.css siêu nhẹ.
2. Bước 2 - Static Export Next.js: Trình biên dịch Next.js thực hiện phân tích cú pháp tĩnh, tối ưu hóa các trang SSG và tạo thư mục xuất xưởng web/out.
3. Bước 3 - Đóng gói Worker: Tự động sao chép tệp web/public/_worker.js vào web/out/_worker.js để Cloudflare Pages nhận diện là Edge Worker chính.
4. Bước 4 - Triển khai mạng biên: Wrangler CLI tải các assets tĩnh mới lên mạng lưới CDN toàn cầu và cập nhật mã Worker lên môi trường Production chỉ trong vòng 40 giây. Domain chính thức: https://vpchuoiskechers.tbsgroup2026.workers.dev."""

format_p(doc.paragraphs[C4 + 1], c4_enriched_content, style='Normal')

# Chèn các ảnh chụp màn hình thực tế vào Chương 4
p_img_container = doc.paragraphs[C4 + 2]
p_img_container.text = "\nDanh mục hình ảnh giao diện thực tế hệ thống đã triển khai tại TBS Group (Zone II):\n"
p_img_container.style = 'Normal'

screenshots = [
    ("docs/screenshots/01_work_main_dashboard.png", "Hình 4.1: Bảng điều khiển trung tâm /work trên máy tính để bàn (Desktop Dashboard)"),
    ("docs/screenshots/01_work_main_dashboard_mobile.png", "Hình 4.2: Giao diện Bảng điều khiển tối ưu hóa trên điện thoại di động (Mobile Dashboard 390px)"),
    ("docs/screenshots/03_work_kaizen_dashboard.png", "Hình 4.3: Giao diện Phân hệ Sáng kiến cải tiến liên tục CI-Kaizen & Bảng xếp hạng"),
    ("docs/screenshots/04_work_gemba.png", "Hình 4.4: Giao diện Phân hệ Kiểm soát hiện trường sản xuất GEMBA Walk & Quét mã QR"),
    ("docs/screenshots/06_maintenance_kpi.png", "Hình 4.5: Giao diện Phân hệ Quản trị máy móc thiết bị và bảo trì MMTB (Chỉ số 6 nhà máy)"),
    ("docs/screenshots/07_pph_view.png", "Hình 4.6: Giao diện Phân hệ Quản lý sản lượng PPH nhà máy theo giờ & Màn hình TV xưởng"),
    ("docs/screenshots/rename_module/live_prod_logistics_route.png", "Hình 4.7: Giao diện Phân hệ Kế hoạch chuẩn bị và trung tâm phân phối trên Production"),
]

for img_path, caption in screenshots:
    if os.path.exists(img_path):
        p_pic = doc.add_paragraph()
        p_pic.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_pic.paragraph_format.space_before = Pt(6)
        p_pic.paragraph_format.space_after = Pt(2)
        try:
            p_pic.add_run().add_picture(img_path, width=Inches(5.6))
            p_cap = doc.add_paragraph()
            add_caption(p_cap, caption)
            p_img_container._element.addnext(p_cap._element)
            p_img_container._element.addnext(p_pic._element)
        except Exception as e:
            print(f"Warning inserting image {img_path}: {e}")

for pi in range(C4 + 3, C5):
    doc.paragraphs[pi].text = ""

# 9. CHƯƠNG 5: KIỂM THỬ VÀ ĐÁNH GIÁ HỆ THỐNG
print("9. Cập nhật Chương 5: Báo cáo UAT, Multi-Role QA và An toàn thông tin...")
format_p(doc.paragraphs[C5], "CHƯƠNG 5: KIỂM THỬ VÀ ĐÁNH GIÁ HỆ THỐNG", style='1', bold=True)

c5_enriched_content = """5.1. Mục tiêu và phương pháp kiểm thử
Công tác kiểm thử phần mềm được tiến hành xuyên suốt với mục tiêu thẩm định toàn diện:
• Tính đúng đắn của chức năng (Functional Correctness): Đảm bảo 100% các phân hệ nghiệp vụ vận hành chuẩn xác theo đúng quy trình thực tế tại Khối Văn phòng Chuỗi SKECHERS.
• Tính an toàn bảo mật (Security & Access Control): Đảm bảo các ranh giới dữ liệu cá nhân, phòng ban và cấp lãnh đạo được cô lập tuyệt đối, loại bỏ triệt để các nguy cơ tấn công mạng.
• Khả năng chịu tải và tính sẵn sàng (Performance & Reliability): Xác thực hệ thống vận hành ổn định tại mạng biên với độ phản hồi cực nhanh dưới tải thực tế của 100 người dùng Pilot.

5.2. Kiểm thử chức năng & Chương trình Pilot 100 người dùng (UAT Testing)
Hệ thống đã triển khai bộ kịch bản kiểm thử tự động toàn diện scripts/test_pilot_scenarios.mjs mô phỏng đầy đủ chu trình tác nghiệp của 100 người dùng Pilot. Kết quả kiểm thử đạt tỷ lệ thành công tuyệt đối 10/10 kịch bản (100% PASS):
1. Kịch bản K1-AUTH: Đăng nhập quản trị viên MSNV 202608001 và xác thực mật khẩu băm SHA-256 kèm chuỗi Salt TBS_SALT_2026 -> KẾT QUẢ: ĐẠT (PASS).
2. Kịch bản K1-TASK: Tạo nhanh công việc trong vòng 5 giây và kiểm tra sự xuất hiện tự động tại cột TO_DO -> KẾT QUẢ: ĐẠT (PASS).
3. Kịch bản K2-REVIEW: Kéo chuyển công việc sang cột REVIEW, kiểm tra ràng buộc bắt buộc nhập mô tả kết quả (>= 5 ký tự) -> KẾT QUẢ: ĐẠT (PASS).
4. Kịch bản K3-APPROVE: Trưởng phòng đăng nhập bấm Duyệt đạt nghiệm thu, công việc tự động cập nhật sang cột DONE và tiến độ đạt 100% -> KẾT QUẢ: ĐẠT (PASS).
5. Kịch bản K4-REJECT: Trưởng phòng từ chối nghiệm thu, kiểm tra ràng buộc lý do từ chối (>= 5 ký tự) và công việc tự động quay về cột DOING -> KẾT QUẢ: ĐẠT (PASS).
6. Kịch bản K5-DEPEND: Kiểm tra ràng buộc phụ thuộc (Task Dependency), chặn không cho phép bắt đầu công việc khi công việc tiền đề chưa hoàn thành (icon ổ khóa bảo vệ) -> KẾT QUẢ: ĐẠT (PASS).
7. Kịch bản K6-PROJECT: Quản trị dự án liên phòng ban và thuật toán Bottleneck Detector tự động phát hiện nhân sự bị nghẽn (>= 2 việc trễ hạn) -> KẾT QUẢ: ĐẠT (PASS).
8. Kịch bản K7-EXCEL: Xuất dữ liệu thống kê ra file Excel 2 sheet và in phiếu phân bổ tải công việc chuẩn khổ giấy A4 với đầy đủ 2 chữ ký xác nhận -> KẾT QUẢ: ĐẠT (PASS).
9. Kịch bản K8-MOBILE: Kiểm tra giao diện Responsive trên màn hình di động 390px (bố cục 1 cột, menu Bottom Sheet, kích thước vùng chạm >= 44px) -> KẾT QUẢ: ĐẠT (PASS).
10. Kịch bản K9-OCC: Kiểm soát đồng thời tương tranh lạc quan (Optimistic Concurrency Control), phát hiện xung đột và trả về mã HTTP 409 khi 2 người cùng cập nhật 1 công việc -> KẾT QUẢ: ĐẠT (PASS).

5.3. Kiểm thử API & Tính toàn vẹn nghiệp vụ đa vai trò (Multi-Role QA)
Căn cứ Báo cáo Kiểm thử Đa vai trò (MULTI_ROLE_QA_REPORT.md), hệ thống đã thực hiện kiểm thử tự động 15 kịch bản phân quyền chuyên sâu giữa 3 nhóm cấp bậc: Lãnh đạo cấp cao (TGĐ-001, 200405004), Cán bộ quản lý cấp trung (202608001, LG-001) và Cán bộ nhân viên (BT-001, 202206011). Kết quả kiểm thử đạt 15/15 kịch bản thành công (100% PASS):
• TASK-01 & TASK-02: Cách ly dữ liệu công việc cá nhân của nhân viên, chống kỹ thuật duyệt trộm qua tham số query (?assignee_emp_code) -> ĐẠT.
• TASK-03 & TASK-04: Chặn nhân viên sửa hoặc xóa công việc của đồng nghiệp và cấp trên, trả về mã lỗi HTTP 403 Forbidden -> ĐẠT.
• TASK-05: Ràng buộc điều kiện nghiệm thu, chặn nhân viên tự ý bấm DONE mà không có sự phê duyệt của Trưởng phòng -> ĐẠT.
• BOARD-01 đến BOARD-04: Phân quyền quản trị bảng Kanban, cấm nhân viên tự tạo hoặc xóa bảng phòng ban, cách ly thẻ công việc giữa các phòng ban độc lập -> ĐẠT.
• PRJ-01 đến PRJ-04: Phân cấp quyền hạn dự án, cấm nhân viên tạo/xóa dự án liên phòng ban, phân quyền Trưởng phòng quản lý dự án phụ trách và trao quyền giám sát toàn diện cho Tổng Giám Đốc -> ĐẠT.
• UI-01: Kiểm soát hiển thị nút chức năng trên giao diện (UI Action Guard), tự động vô hiệu hóa các nút tạo dự án với tài khoản nhân viên -> ĐẠT.
• SYNC-01: Kiểm tra tính tương thích và đồng bộ 100% tính năng giữa Cloudflare Edge Worker và Next.js API Routes -> ĐẠT.

5.4. Kiểm thử hiệu năng (Performance Testing & Độ trễ mạng biên)
Kết quả đo lường thực tế trên môi trường sản xuất Cloudflare Workers:
• Thời gian khởi động Worker (Worker Startup Time): 7 mili-giây (siêu nhẹ, không có cold-start).
• Thời gian thực thi câu truy vấn D1 SQL: Dao động từ 0.12 ms đến 1.91 ms cho các truy vấn phức tạp trên bảng hàng ngàn dòng.
• Tốc độ phản hồi trang web trung bình (Page Load Time): Đạt dưới 350 mili-giây đối với các kết nối mạng nội bộ nhà máy.
• Kích thước gói nén truyền tải (Transfer Gzip Size): Tổng kích thước bundle worker chỉ 147.94 KiB, tối ưu hóa triệt để tài nguyên mạng.

5.5. Kiểm thử bảo mật (Security Audit & Vá lỗ hổng toàn diện)
Dựa trên Báo cáo Đánh giá Lỗ hổng Bảo mật (SYSTEM_QA_SECURITY_REPORT.md), hệ thống đã phát hiện và xử lý thành công 14 điểm rủi ro an ninh mạng:
1. AUTH-01 (CRITICAL): Đã vá lỗ hổng bỏ qua xác thực mật khẩu tại API Login, áp dụng chuẩn mã hóa SHA-256 kèm chuỗi Salt.
2. AUTH-02 (CRITICAL): Đã loại bỏ hoàn toàn cơ chế Fallback tự động gán quyền Trưởng phòng IT khi không có token.
3. DATA-01 (CRITICAL): Đã đóng API danh bạ nhân sự công khai, yêu cầu xác thực phiên trước khi tra cứu thông tin CBNV.
4. BOLA-01 & BOLA-02 (HIGH): Đã bổ sung kiểm tra quyền sở hữu phòng họp và phân quyền duyệt ngân sách công tác cấp 2.
5. PRIV-01 (HIGH): Đã giới hạn quyền tìm kiếm Audit Logs hệ thống, chỉ cho phép tài khoản Quản trị viên cấp cao truy cập.
6. NOTIF-01 & LOGIC-01 (MEDIUM): Đã siết chặt quyền phát thông báo toàn hệ thống và chặn logic đặt phòng họp trong quá khứ.

5.6. Đánh giá kết quả kiểm thử
Hệ thống thể hiện tính ổn định vượt trội, khả năng chịu tải tốt và độ an toàn bảo mật cao, đáp ứng đầy đủ mọi tiêu chuẩn nghiệm thu khắt khe để đưa vào vận hành chính thức tại Tập đoàn TBS Group."""

format_p(doc.paragraphs[C5 + 1], c5_enriched_content, style='Normal')
for pi in range(C5 + 2, C6):
    doc.paragraphs[pi].text = ""

# 10. CHƯƠNG 6 & 7
print("10. Cập nhật Chương 6 & Chương 7...")
format_p(doc.paragraphs[C6], "CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN", style='1', bold=True)

c6_content = """6.1. Kết luận
Đề tài thực tập tốt nghiệp "Xây dựng hệ thống Quản Trị Vận Hành và Số Hóa Quy Trình Doanh Nghiệp trên nền tảng Serverless Edge – Tập đoàn TBS Group" đã hoàn thành xuất sắc 100% mục tiêu nghiên cứu và kế hoạch đề ra. Đề tài đã khẳng định tính khả thi và ưu thế vượt trội của kiến trúc điện toán biên không máy chủ (Cloudflare Workers, D1, R2) trong việc giải quyết bài toán chuyển đổi số quy mô lớn trong môi trường sản xuất công nghiệp. Hệ thống đã số hóa thành công các phân hệ nghiệp vụ cốt lõi, xóa bỏ tình trạng đứt gãy thông tin giữa khối văn phòng điều hành và sàn sản xuất, mang lại công cụ làm việc hiện đại, minh bạch và hiệu quả cho cán bộ nhân viên.

6.2. Định hướng mở rộng và nâng cấp nền tảng
Trong giai đoạn tiếp theo, hệ thống có thể tiếp tục mở rộng theo các định hướng chiến lược:
• Tích hợp thiết bị cảm biến công nghiệp IoT: Kết nối trực tiếp các cảm biến đo đếm sản lượng tự động gắn tại từng đầu máy may và máy chặt vào Cloudflare Workers qua giao thức MQTT/HTTP.
• Ứng dụng trí tuệ nhân tạo (AI/Computer Vision): Khai thác Cloudflare Workers AI để tự động phân tích hình ảnh lỗi sản phẩm từ camera giám sát chuyền may và tự động gợi ý giải pháp cải tiến Kaizen.
• Mở rộng ứng dụng di động bản địa: Đóng gói ứng dụng di động đa nền tảng (React Native / Flutter) với khả năng hoạt động ngoại tuyến (Offline-first Mode) khi vào sâu trong các khu vực kho sóng yếu.

6.3. Hướng phát triển
1. Nhân rộng mô hình sang toàn bộ các cụm công nghiệp trực thuộc Tập đoàn TBS Group như TBS Bình Dương, TBS Thoại Sơn (An Giang) và TBS Sài Gòn.
2. Hoàn thiện phân hệ Kế hoạch chuẩn bị và trung tâm phân phối, kết nối dữ liệu tự động với hệ thống ERP SAP toàn cầu của nhãn hàng SKECHERS.
3. Xây dựng cổng tra cứu thông tin phúc lợi và bảng lương trực tuyến bảo mật cao phục vụ toàn thể hơn 50.000 người lao động trong tập đoàn.

6.4. Đóng góp của đề tài
1. Về mặt học thuật và công nghệ: Đề tài là công trình tiên phong nghiên cứu và áp dụng thành công kiến trúc Serverless Edge phân tán (Cloudflare Workers, D1, R2) vào quản trị sản xuất thực tế tại Việt Nam, cung cấp tài liệu tham khảo giá trị cho sinh viên và kỹ sư phần mềm.
2. Về mặt thực tiễn doanh nghiệp: Đề tài giúp Công Ty CPĐT Thái Bình Kiên Giang (Zone II) tiết kiệm hàng trăm triệu đồng chi phí bản quyền và bảo trì máy chủ hàng năm; rút ngắn 80% thời gian tổng hợp báo cáo sản lượng PPH; minh bạch hóa 100% tiến độ công việc và thúc đẩy mạnh mẽ phong trào sáng kiến cải tiến liên tục trong toàn thể nhà máy."""

format_p(doc.paragraphs[C6 + 1], c6_content, style='Normal')
for pi in range(C6 + 2, C7):
    doc.paragraphs[pi].text = ""

format_p(doc.paragraphs[C7], "CHƯƠNG 7: ĐÁNH GIÁ THỰC TIỄN VÀ MỘT SỐ KIẾN NGHỊ", style='1', bold=True)

c7_content = """7.1. Một số đánh giá về hoạt động của đơn vị
Công Ty Cổ Phần Đầu Tư Thái Bình Kiên Giang – TBS Group (Zone II) – SKECHERS R&D Center là một đơn vị sản xuất kiểu mẫu với tác phong công nghiệp chuyên nghiệp, kỷ luật lao động nghiêm minh và nền tảng văn hóa doanh nghiệp vững chắc. Ban Tổng Giám Đốc và lãnh đạo các phòng ban luôn thể hiện tư duy đổi mới, sẵn sàng đón nhận và tạo điều kiện tối đa cho các sáng kiến công nghệ chuyển đổi số. Môi trường làm việc thân thiện, năng động, khuyến khích tinh thần học hỏi và sáng tạo không ngừng.

7.2. Bài học kinh nghiệm về kiến thức và kỹ năng trong quá trình thực tập
Kỳ thực tập doanh nghiệp tại TBS Group là trải nghiệm vô cùng quý báu, giúp em trưởng thành vượt bậc:
1. Nắm vững tư duy giải quyết bài toán thực tế: Hiểu rõ rằng công nghệ chỉ thực sự có giá trị khi giải quyết đúng và trúng nỗi đau (Pain points) của người dùng cuối tại xưởng sản xuất.
2. Nâng cao năng lực kỹ thuật chuyên sâu: Làm chủ hoàn toàn kiến trúc Serverless Edge, tối ưu hóa cơ sở dữ liệu phân tán, phòng chống các lỗ hổng an ninh mạng và xây dựng giao diện người dùng chuẩn công nghiệp.
3. Rèn luyện tác phong làm việc chuyên nghiệp: Nâng cao kỹ năng giao tiếp, lắng nghe phản hồi của người dùng, kỹ năng làm việc nhóm, quản lý tiến độ và tinh thần trách nhiệm cao đối với sản phẩm phần mềm phát hành.

7.3. Một số kiến nghị với đơn vị thực tập
1. Tiếp tục đầu tư nâng cấp hạ tầng mạng Wi-Fi công nghiệp tại các phân xưởng sản xuất may và gò đế nhằm đảm bảo kết nối liên tục, ổn định cho các thiết bị di động quét mã QR và bảng hiển thị TV.
2. Tổ chức định kỳ các buổi hội thảo chia sẻ, tập huấn kỹ năng số hóa cho cán bộ quản lý cấp chuyền và tổ trưởng sản xuất, giúp tối ưu hóa hiệu quả khai thác các phân hệ mới của hệ thống.
3. Mở rộng mối quan hệ hợp tác chiến lược giữa doanh nghiệp và Viện Công Nghệ Số – Trường Đại học Thủ Dầu Một trong việc tiếp nhận sinh viên thực tập và nghiên cứu chuyển giao công nghệ.

7.4. Đề xuất giải pháp đổi mới nội dung chương trình học
Căn cứ vào yêu cầu tuyển dụng và thực tiễn công nghệ tại các doanh nghiệp lớn, em xin mạnh dạn đề xuất một số ý kiến đóng góp cho chương trình đào tạo của Nhà trường:
1. Đưa các chuyên đề về Điện toán đám mây biên (Edge Computing & Serverless Architecture) vào chương trình giảng dạy chuyên ngành Công nghệ thông tin để sinh viên sớm tiếp cận với xu hướng công nghệ của thế giới.
2. Tăng cường thời lượng thực hành về An toàn bảo mật ứng dụng web và API (theo chuẩn OWASP Top 10 API Security), giúp sinh viên nhận thức rõ các lỗ hổng phổ biến (BOLA, IDOR, Injection) ngay trong quá trình viết code.
3. Tăng cường các môn học kỹ năng làm việc theo dự án thực tế (Project-based learning), khuyến khích sinh viên thực hiện đồ án kết hợp cùng các doanh nghiệp sản xuất thực tế."""

format_p(doc.paragraphs[C7 + 1], c7_content, style='Normal')
for pi in range(C7 + 2, TL):
    doc.paragraphs[pi].text = ""

# 11. TÀI LIỆU THAM KHẢO
print("11. Cập nhật Tài liệu tham khảo...")
format_p(doc.paragraphs[TL], "TÀI LIỆU THAM KHẢO", style='1', bold=True)

references_content = """[1] Cloudflare Inc. (2026), Cloudflare Workers Documentation - Serverless Edge Execution, truy cập tại: https://developers.cloudflare.com/workers/.
[2] Cloudflare Inc. (2026), Cloudflare D1 Relational SQL Database at the Edge, truy cập tại: https://developers.cloudflare.com/d1/.
[3] Cloudflare Inc. (2026), Cloudflare R2 Distributed Object Storage Architecture, truy cập tại: https://developers.cloudflare.com/r2/.
[4] Vercel Inc. (2026), Next.js 14 Documentation & App Router Paradigm, truy cập tại: https://nextjs.org/docs.
[5] Meta Platforms Inc. (2026), React 18 Concurrent Features & Server Components, truy cập tại: https://react.dev/.
[6] Tailwind Labs (2026), Tailwind CSS Utility-First Styling Framework v3.4, truy cập tại: https://tailwindcss.com/.
[7] OWASP Foundation (2023), OWASP API Security Top 10 Flaws & Mitigations, truy cập tại: https://owasp.org/www-project-api-security/.
[8] SKECHERS USA Inc. (2025), SKECHERS Global Quality & Compliance Standards, truy cập tại: https://about.skechers.com/.
[9] Tập đoàn Thái Bình Shoes - TBS Group (2026), Kỷ yếu 35 năm phát triển và Định hướng Chuyển đổi số công nghiệp, lưu hành nội bộ, Kiên Giang."""

if TL + 1 < len(doc.paragraphs):
    p_tl_curr = doc.paragraphs[TL + 1]
else:
    p_tl_curr = doc.add_paragraph()
format_p(p_tl_curr, references_content, style='Normal')
for pi in range(TL + 2, len(doc.paragraphs)):
    doc.paragraphs[pi].text = ""

# 12. LƯU TÀI LIỆU
print("Lưu tài liệu hoàn thiện vào:", DOCX_OUT)
doc.save(DOCX_OUT)

# 13. KIỂM TRA TỪ CẤM TRONG TẤT CẢ CÁC PART XML
print("Kiểm tra toàn bộ các part XML tìm cụm từ cấm...")
forbidden = ['việc làm xanh', 'viec lam xanh', 'nhân kiệt', 'nhan kiet', 'cung ứng nhân lực', 'cung ung nhan luc']
found_any = False

with zipfile.ZipFile(DOCX_OUT, 'r') as z:
    for filename in z.namelist():
        if filename.endswith(('.xml', '.rels')):
            content = z.read(filename).decode('utf-8', errors='ignore')
            content_lower = content.lower()
            for f in forbidden:
                if f in content_lower:
                    cnt = content_lower.count(f)
                    print(f"❌ [ALERT] In {filename}: '{f}' found {cnt} times!")
                    found_any = True

if not found_any:
    print("🎉 KẾT QUẢ QUÉT CỤM TỪ CẤM: 0 KẾT QUẢ - HOÀN TOÀN SẠCH 100%!")

print("=== HOÀN TẤT BỔ SUNG NỘI DUNG TỪ README.MD ===")
