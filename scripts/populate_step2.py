# -*- coding: utf-8 -*-
"""
populate_full_report.py
Generates full academic content for 2224802010738_PhamNguyenAnhHuy.docx
Preserving styles, fonts (Times New Roman), and structure.
"""

import docx
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

DOCX_IN = 'scratch_step1.docx'
DOCX_OUT = '2224802010738_PhamNguyenAnhHuy.docx'

print("=== STARTING FULL REPORT GENERATION ===")
doc = Document(DOCX_IN)

# Helper for paragraph formatting
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

def add_p_after(ref_p, text, style='Normal', space_before=3, space_after=6, line_spacing=1.3, align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False, font_size=13):
    new_p = doc.add_paragraph()
    format_p(new_p, text, style=style, space_before=space_before, space_after=space_after, line_spacing=line_spacing, align=align, bold=bold, italic=italic, font_size=font_size)
    ref_p._element.addnext(new_p._element)
    return new_p

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

# Let's inspect paragraph indices in scratch_step1.docx
# To be completely robust, we locate sections by their heading texts!
def find_p_by_text(query, start=0):
    for idx in range(start, len(doc.paragraphs)):
        if query.lower() in doc.paragraphs[idx].text.lower():
            return idx
    return -1

print("Locating key sections...")
idx_mo_dau = find_p_by_text("PHẦN MỞ ĐẦU")
idx_tom_tat = find_p_by_text("TÓM TẮT ĐỒ ÁN")
idx_c1 = find_p_by_text("TỔNG QUAN VỀ CÔNG TY")
idx_c2 = find_p_by_text("TỔNG QUAN VỀ HỆ THỐNG")
idx_c3 = find_p_by_text("THIẾT KẾ HỆ THỐNG")
idx_c4 = find_p_by_text("TRIỂN KHAI HỆ THỐNG")
idx_c5 = find_p_by_text("KIỂM THỬ VÀ ĐÁNH GIÁ")
idx_c6 = find_p_by_text("KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN")
idx_c7 = find_p_by_text("ĐÁNH GIÁ THỰC TIỄN")
idx_tailieu = find_p_by_text("TÀI LIỆU THAM KHẢO")

print(f"Indices found: Mở đầu={idx_mo_dau}, Tóm tắt={idx_tom_tat}, C1={idx_c1}, C2={idx_c2}, C3={idx_c3}, C4={idx_c4}, C5={idx_c5}, C6={idx_c6}, C7={idx_c7}, Tài liệu={idx_tailieu}")

# -------------------------------------------------------------
# PHẦN MỞ ĐẦU
# -------------------------------------------------------------
print("Populating PHẦN MỞ ĐẦU...")
# 1. Lí do chọn đề tài
p_li_do = doc.paragraphs[find_p_by_text("1. Lí do chọn đề tài", idx_mo_dau)]
p_li_do_content = doc.paragraphs[find_p_by_text("1. Lí do chọn đề tài", idx_mo_dau) + 1]
format_p(p_li_do_content, 
    "Trong kỷ nguyên chuyển đổi số công nghiệp 4.0, các tập đoàn sản xuất hàng đầu thế giới đang dịch chuyển "
    "mạnh mẽ từ mô hình quản trị truyền thống dựa trên sổ sách, văn bản giấy và các ứng dụng phân mảnh sang hệ thống "
    "quản trị tích hợp thời gian thực. Tại Tập đoàn Thái Bình (TBS Group), đặc biệt là tại Cụm công nghiệp Kiên Giang "
    "(Zone II) kết hợp cùng Trung tâm Nghiên cứu & Phát triển mẫu (SKECHERS R&D Center), quy mô sản xuất không ngừng "
    "mở rộng với hàng chục ngàn cán bộ công nhân viên, xử lý hàng triệu sản phẩm giày da chất lượng cao xuất khẩu mỗi năm. "
    "Mô hình vận hành đòi hỏi sự phối hợp nhịp nhàng, liên tục và chính xác tuyệt đối giữa Văn phòng Chuỗi điều hành, "
    "khối kỹ thuật R&D, kiểm soát chất lượng (QA/QC), quản lý năng suất (IE) và các phân xưởng sản xuất vệ tinh.\n\n"
    "Tuy nhiên, hạ tầng máy chủ truyền thống dựa trên các cụm VPS tập trung bộc lộ nhiều điểm nghẽn nghiêm trọng: "
    "chi phí bản quyền và duy trì phần cứng đắt đỏ, độ trễ mạng cao khi truyền tải dữ liệu lớn, nguy cơ quá tải khi "
    "đồng thời truy cập từ hiện trường và rủi ro gián đoạn dịch vụ diện rộng khi máy chủ gặp sự cố. Để khắc phục triệt để "
    "những hạn chế này, kiến trúc điện toán biên không máy chủ (Serverless Edge Computing) nổi lên như một cuộc cách mạng công nghệ. "
    "Nền tảng Cloudflare Workers kết hợp cùng cơ sở dữ liệu quan hệ SQL phân tán Cloudflare D1 và lưu trữ đối tượng Cloudflare R2 "
    "cho phép thực thi mã lệnh ngay tại các điểm PoP mạng biên gần người dùng nhất với độ trễ cực thấp (< 50ms), khả năng tự động "
    "co giãn vô hạn và loại bỏ hoàn toàn gánh nặng vận hành máy chủ vật lý. Xuất phát từ nhu cầu thực tiễn cấp bách đó, em đã "
    "chủ động đề xuất và được Ban Tổng Giám Đốc tin tưởng giao phó nghiên cứu, phát triển đề tài: 'Xây dựng hệ thống Quản Trị "
    "Vận Hành và Số Hóa Quy Trình Doanh Nghiệp trên nền tảng Serverless Edge – Tập đoàn TBS Group'."
)

# 2. Mục tiêu của báo cáo
p_muc_tieu = doc.paragraphs[find_p_by_text("2. Mục tiêu của báo cáo", idx_mo_dau)]
p_muc_tieu_content = doc.paragraphs[find_p_by_text("2. Mục tiêu của báo cáo", idx_mo_dau) + 1]
format_p(p_muc_tieu_content,
    "Báo cáo thực tập tốt nghiệp này tập trung vào các mục tiêu nghiên cứu và phát triển cụ thể sau:\n"
    "1. Nghiên cứu chuyên sâu mô hình kiến trúc Serverless Edge Computing tiên tiến nhất trên nền tảng Cloudflare Workers, "
    "đánh giá cơ chế phân phối dữ liệu phân tán với Cloudflare D1 và giải pháp lưu trữ phi tập trung Cloudflare R2.\n"
    "2. Phân tích toàn diện quy trình nghiệp vụ thực tế tại Khối Văn phòng Chuỗi SKECHERS – TBS Group (Zone II), từ đó thiết kế "
    "và xây dựng thành công 10 phân hệ nghiệp vụ cốt lõi: Quản lý công việc cá nhân (My Tasks), Bảng công việc phòng ban (Kanban), "
    "Dự án liên phòng ban (Projects & Bottleneck Detector), Kiểm soát hiện trường GEMBA Walk, Đăng ký sáng kiến cải tiến liên tục "
    "(CI-Kaizen), Quản lý sản lượng PPH nhà máy theo giờ, Bảo trì thiết bị MMTB, Hệ thống quản trị 1-5-2, Nhân sự - Hành chính "
    "và Phân hệ Kế hoạch chuẩn bị và trung tâm phân phối.\n"
    "3. Xây dựng kiến trúc bảo mật đa tầng chuẩn RBAC 7 cấp, loại bỏ triệt để các lỗ hổng OWASP API Security phổ biến (BOLA/IDOR, "
    "xác thực thiếu mật khẩu, rò rỉ dữ liệu PII), thiết lập cơ chế khóa chống trùng lặp Idempotency và ghi vết kiểm toán Audit Trail.\n"
    "4. Tích hợp đa nền tảng thông minh: Thông báo đẩy Web Push (chuẩn VAPID), kết nối Zalo Notification Bot qua Webhook, "
    "tự động sao lưu dữ liệu sang Google Drive qua khóa mã hóa Service Account RSA-2048.\n"
    "5. Triển khai thử nghiệm thành công chương trình Pilot 100 người dùng, tiến hành kiểm thử tự động toàn diện và đưa hệ thống "
    "lên môi trường Production chính thức tại địa chỉ https://vpchuoiskechers.tbsgroup2026.workers.dev."
)

# 3. Phạm vi và cách thức
p_pham_vi = doc.paragraphs[find_p_by_text("3. Phạm vi và cách thức", idx_mo_dau)]
p_pham_vi_content = doc.paragraphs[find_p_by_text("3. Phạm vi và cách thức", idx_mo_dau) + 1]
format_p(p_pham_vi_content,
    "• Phạm vi nghiên cứu và triển khai: Hệ thống được xây dựng và áp dụng trực tiếp cho Khối Văn phòng Chuỗi SKECHERS, "
    "Trung tâm R&D Center và cụm nhà máy sản xuất thuộc Công Ty Cổ Phần Đầu Tư Thái Bình Kiên Giang (Zone II). "
    "Đối tượng người dùng trực tiếp bao gồm Ban Tổng Giám Đốc, các Trưởng phòng ban (PMC, IE, QC, R&D, Nhân sự, Bảo trì, "
    "Kế hoạch chuẩn bị và trung tâm phân phối), kỹ sư giám sát chuyền và hơn 100 cán bộ công nhân viên tham gia chương trình Pilot.\n"
    "• Cách thức thực tập và tiếp cận:\n"
    "  - Khảo sát hiện trường thực tế (Gemba Walk): Trực tiếp đến các phân xưởng may mẫu, xưởng hoàn thiện, kho vật tư để nắm bắt "
    "chuẩn xác các bất cập trong khâu ghi nhận dữ liệu thủ công, đo lường năng suất và phản ứng sự cố thiết bị.\n"
    "  - Phỏng vấn chuyên sâu: Làm việc trực tiếp với Ban Tổng Giám Đốc và các Trưởng bộ phận để thống nhất đặc tả yêu cầu nghiệp vụ (SRS).\n"
    "  - Phương pháp phát triển linh hoạt (Agile/Scrum): Phân rã dự án thành các chu kỳ phát triển hàng tuần, thường xuyên báo cáo tiến độ, "
    "tiếp nhận phản hồi và liên tục tối ưu hóa trải nghiệm người dùng.\n"
    "  - Kỹ thuật kiểm thử tự động hóa (Automated QA): Xây dựng bộ script kiểm thử tự động bằng Node.js và Puppeteer nhằm kiểm định "
    "toàn diện tính năng, hiệu năng và an ninh bảo mật trước khi đóng gói triển khai lên mạng biên Cloudflare."
)

# 4. Kết quả đạt được
p_ket_qua = doc.paragraphs[find_p_by_text("4. Kết quả đạt được", idx_mo_dau)]
p_ket_qua_content = doc.paragraphs[find_p_by_text("4. Kết quả đạt được", idx_mo_dau) + 1]
format_p(p_ket_qua_content,
    "Sau 10 tuần thực tập nỗ lực, dưới sự hướng dẫn sát sao của TGĐ. Phạm Minh Tùng và ThS. Trần Bá Minh Sơn, em đã hoàn thành "
    "toàn diện khối lượng công việc được giao với các kết quả định lượng cụ thể:\n"
    "1. Xây dựng hoàn chỉnh hệ thống ứng dụng web quy mô lớn gồm 472 file mã nguồn với tổng cộng 144.560 dòng code TypeScript/React, "
    "kết hợp cùng 1 Edge Worker trung tâm dài 17.000 dòng mã lệnh edge native JavaScript xử lý hơn 106 API endpoint.\n"
    "2. Thiết kế và vận hành thành công cơ sở dữ liệu quan hệ Cloudflare D1 với 131 bảng dữ liệu, chuẩn hóa dữ liệu thông qua 19 file "
    "migration SQL, kết nối lưu trữ đối tượng Cloudflare R2 và cơ chế đồng bộ đa vùng.\n"
    "3. Hoàn thành 100% các kịch bản kiểm thử tự động: 10/10 kịch bản người dùng UAT Pilot (test_pilot_scenarios.mjs), 15/15 kịch bản "
    "kiểm thử phân quyền đa vai trò (MULTI_ROLE_QA_REPORT.md), và vá triệt để 14/14 điểm rủi ro bảo mật (SYSTEM_QA_SECURITY_REPORT.md).\n"
    "4. Hệ thống đã được đóng gói, tối ưu hóa kích thước gói tĩnh và triển khai thành công 100% traffic lên mạng biên Cloudflare Workers "
    "tại địa chỉ https://vpchuoiskechers.tbsgroup2026.workers.dev, ghi nhận thời gian phản hồi API trung bình dưới 350ms và "
    "thời gian khởi động worker chỉ 7ms."
)

# -------------------------------------------------------------
# TÓM TẮT ĐỒ ÁN
# -------------------------------------------------------------
print("Populating TÓM TẮT ĐỒ ÁN...")
p_tom_tat_head = doc.paragraphs[idx_tom_tat]
format_p(p_tom_tat_head, "TÓM TẮT ĐỒ ÁN", style='1', bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)

p_tom_tat_content = doc.paragraphs[idx_tom_tat + 1]
format_p(p_tom_tat_content,
    "Báo cáo thực tập tốt nghiệp trình bày quá trình nghiên cứu, thiết kế, phát triển và triển khai thực tế hệ thống 'Quản Trị "
    "Vận Hành và Số Hóa Quy Trình Doanh Nghiệp trên nền tảng Serverless Edge' tại Công Ty Cổ Phần Đầu Tư Thái Bình Kiên Giang – "
    "Tập đoàn TBS Group (Zone II) – SKECHERS R&D Center. Trước thách thức về độ trễ, chi phí hạ tầng và nguy cơ tắc nghẽn của hệ thống "
    "máy chủ VPS truyền thống trong bối cảnh sản xuất quy mô lớn, đề tài đã tiên phong ứng dụng kiến trúc điện toán biên không máy chủ "
    "(Serverless Edge Computing) dựa trên hệ sinh thái Cloudflare (Workers, D1 SQLite, R2 Storage) kết hợp cùng frontend Next.js 14 "
    "và Tailwind CSS. Hệ thống đã số hóa thành công 10 phân hệ nghiệp vụ cốt lõi: Quản lý công việc cá nhân (My Tasks), Bảng công việc "
    "phòng ban (Kanban), Dự án liên phòng ban và Cảnh báo điểm nghẽn (Projects & Bottleneck Detector), Kiểm soát hiện trường GEMBA Walk "
    "qua mã QR, Đăng ký và thẩm định sáng kiến cải tiến liên tục (CI-Kaizen), Quản lý sản lượng PPH nhà máy theo giờ, Bảo trì thiết bị "
    "MMTB (MTTD/MTTR, Pareto), Hệ thống quản trị 1-5-2 bảo mật mã PIN, Quản trị nhân sự định biên và Phân hệ Kế hoạch chuẩn bị và trung "
    "tâm phân phối. Đồng thời, hệ thống tích hợp sâu thông báo đẩy Web Push (VAPID), Zalo Notification Bot và cơ chế tự động sao lưu "
    "sang Google Drive qua Service Account RSA-2048. Toàn bộ nền tảng đã vượt qua các đợt kiểm thử tự động nghiêm ngặt (10/10 Pilot UAT, "
    "15/15 Multi-Role QA, 14/14 Security Audit) và chính thức được đưa vào vận hành tại https://vpchuoiskechers.tbsgroup2026.workers.dev, "
    "đáp ứng xuất sắc các tiêu chuẩn vận hành công nghiệp khắt khe của thương hiệu SKECHERS toàn cầu.\n\n"
    "Từ khóa: Serverless Edge Computing, Cloudflare Workers, Cloudflare D1, Quản Trị Vận Hành, Chuyển Đổi Số, TBS Group, SKECHERS R&D."
)

# -------------------------------------------------------------
# CHƯƠNG 1: TỔNG QUAN VỀ CÔNG TY
# -------------------------------------------------------------
print("Populating CHƯƠNG 1...")
p_c1_head = doc.paragraphs[idx_c1]
format_p(p_c1_head, "CHƯƠNG 1: TỔNG QUAN VỀ CÔNG TY CPĐT THÁI BÌNH KIÊN GIANG – TBS GROUP (ZONE II) – SKECHERS R&D CENTER", style='1', bold=True)

# 1.1 Thông tin đơn vị
p_info_head = doc.paragraphs[find_p_by_text("Thông tin đơn vị", idx_c1)]
format_p(p_info_head, "1.1. Thông tin đơn vị", style='2', bold=True)

# Fill details
p_info_body = doc.paragraphs[find_p_by_text("Thông tin cơ bản của đơn vị:", idx_c1)]
format_p(p_info_body,
    "Tập đoàn Thái Bình Shoes (TBS Group) là một trong những tập đoàn công nghiệp đa ngành hàng đầu tại Việt Nam, "
    "đặc biệt khẳng định vị thế dẫn đầu trong lĩnh vực sản xuất giày da và gia công túi xách xuất khẩu cho các thương hiệu "
    "danh tiếng toàn cầu. Trong chiến lược mở rộng chuỗi cung ứng sản xuất tại khu vực phía Nam, Công Ty Cổ Phần Đầu Tư Thái Bình "
    "Kiên Giang (Zone II) được thành lập và đầu tư trọng điểm, trở thành trung tâm nghiên cứu phát triển mẫu và sản xuất mũi nhọn "
    "của thương hiệu SKECHERS.\n\n"
    "Thông tin cơ bản của đơn vị thực tập:\n"
    "• Tên đơn vị: Công Ty Cổ Phần Đầu Tư Thái Bình Kiên Giang – Tập đoàn TBS Group (Zone II) – SKECHERS R&D Center\n"
    "• Tên giao dịch quốc tế: TBS Kiên Giang Investment Joint Stock Company – SKECHERS Division\n"
    "• Mã số thuế: [CẦN BỔ SUNG: Mã số thuế Công ty CPĐT Thái Bình Kiên Giang]\n"
    "• Địa chỉ trụ sở: Khu công nghiệp Thạnh Lộc, xã Thạnh Lộc, huyện Châu Thành, tỉnh Kiên Giang (Zone II - TBS Group)\n"
    "• Điện thoại văn phòng: [CẦN BỔ SUNG: Số điện thoại văn phòng]\n"
    "• Ngày thành lập chi nhánh: [CẦN BỔ SUNG: Ngày cấp phép thành lập chi nhánh Kiên Giang] (Tập đoàn TBS Group thành lập từ năm 1989)\n"
    "• Website tập đoàn: https://tbsgroup.vn\n"
    "• Lãnh đạo phụ trách đơn vị: Tổng Giám Đốc Phạm Minh Tùng\n"
    "• Chủ tịch Hội đồng Quản trị Tập đoàn: Ông Nguyễn Đức Thuấn"
)

# Clear legacy dots lines between 177 and 184
for p_i in range(find_p_by_text("Thông tin đơn vị", idx_c1) + 1, find_p_by_text("Quá trình thành lập", idx_c1)):
    if p_i != find_p_by_text("Thông tin cơ bản của đơn vị:", idx_c1):
        doc.paragraphs[p_i].text = ""

# 1.2 Quá trình thành lập
p_hist_head = doc.paragraphs[find_p_by_text("Quá trình thành lập", idx_c1)]
format_p(p_hist_head, "1.2. Quá trình thành lập và phát triển", style='2', bold=True)
p_hist_content = doc.paragraphs[find_p_by_text("Quá trình thành lập", idx_c1) + 1]
format_p(p_hist_content,
    "Hành trình phát triển của Tập đoàn TBS Group trải qua hơn 35 năm bền bỉ, khởi đầu từ một xưởng sản xuất giày da thủ công nhỏ "
    "thành lập năm 1989 tại tỉnh Bình Dương. Với tầm nhìn chiến lược của Chủ tịch HĐQT Nguyễn Đức Thuấn, tập đoàn đã nhanh chóng vươn lên, "
    "trở thành đối tác sản xuất chiến lược toàn cầu của các tập đoàn giày thể thao và thời trang hàng đầu thế giới như SKECHERS, Decathlon, Coach.\n\n"
    "Giai đoạn những năm 2010 đến nay, nhằm đón đầu làn sóng dịch chuyển sản xuất và tối ưu hóa nguồn lực lao động tại Đồng bằng sông Cửu Long, "
    "TBS Group đã thành lập Công Ty CPĐT Thái Bình Kiên Giang (Zone II). Đơn vị nhanh chóng được quy hoạch hiện đại với cụm xưởng sản xuất "
    "quy mô lớn và Trung tâm Nghiên cứu & Phát triển mẫu (SKECHERS R&D Center). Năm 2026, TBS Kiên Giang (Zone II) đóng vai trò là hạt nhân "
    "tiên phong trong chiến lược Chuyển đổi số 4.0 của toàn tập đoàn, đẩy mạnh tự động hóa chuyền may, số hóa chỉ số OEE/PPH theo thời gian thực "
    "và áp dụng công nghệ điện toán biên vào công tác quản trị điều hành sản xuất."
)

# 1.3 Chức năng nhiệm vụ
p_cn_head = doc.paragraphs[find_p_by_text("Chức năng nhiệm vụ", idx_c1)]
format_p(p_cn_head, "1.3. Chức năng và nhiệm vụ", style='2', bold=True)

p_cn_1 = doc.paragraphs[find_p_by_text("1.3.1. Chức năng", idx_c1)]
format_p(p_cn_1, "1.3.1. Chức năng của đơn vị", style='Heading 3', bold=True)
p_cn_1_c = doc.paragraphs[find_p_by_text("1.3.1. Chức năng", idx_c1) + 1]
format_p(p_cn_1_c,
    "1. Đầu não điều phối chuỗi cung ứng sản xuất SKECHERS: Quản lý kế hoạch cung ứng nguyên vật liệu, theo dõi đơn hàng xuất khẩu "
    "và điều phối tiến độ gia công giữa các phân xưởng trong toàn bộ Zone II.\n"
    "2. Trung tâm Nghiên cứu & Phát triển công nghệ (R&D Center): Tiếp nhận bản vẽ thiết kế 3D từ nhãn hàng SKECHERS, nghiên cứu phom dáng, "
    "chế thử mẫu giày thể thao, thử nghiệm độ bền vật liệu tại phòng Lab và chuyển giao quy trình công nghệ cho các nhà máy sản xuất hàng loạt.\n"
    "3. Quản trị chất lượng theo tiêu chuẩn toàn cầu: Kiểm định nghiêm ngặt chất lượng sản phẩm qua từng công đoạn (Chặt, May, Gò, Đóng gói) "
    "đảm bảo chuẩn chất lượng AQL 1.0 của thương hiệu SKECHERS."
)

p_nv_1 = doc.paragraphs[find_p_by_text("1.3.2. Nhiệm vụ", idx_c1)]
format_p(p_nv_1, "1.3.2. Nhiệm vụ của đơn vị", style='Heading 3', bold=True)
p_nv_1_c = doc.paragraphs[find_p_by_text("1.3.2. Nhiệm vụ", idx_c1) + 1]
format_p(p_nv_1_c,
    "1. Hoàn thành vượt mức kế hoạch sản lượng xuất khẩu được Tập đoàn TBS Group và đối tác SKECHERS giao phó hàng năm.\n"
    "2. Thực hiện nghiêm ngặt các quy định về an toàn lao động, kiểm soát hiện trường sản xuất (Gemba Walk), tiêu chuẩn 5S và phòng cháy chữa cháy.\n"
    "3. Quản lý, bảo trì và nâng cao hiệu suất hoạt động của hệ thống hàng ngàn máy móc thiết bị (MMTB) hiện đại.\n"
    "4. Đẩy mạnh phong trào Cải tiến liên tục (CI-Kaizen), khuyến khích CBCNV đóng góp sáng kiến nâng cao năng suất và tiết kiệm chi phí.\n"
    "5. Xây dựng môi trường làm việc nhân văn, chuyên nghiệp, chăm lo đời sống vật chất và tinh thần cho hàng ngàn người lao động tại địa phương."
)

# 1.4 Sơ đồ tổ chức
p_sd_head = doc.paragraphs[find_p_by_text("Sơ đồ tổ chức", idx_c1)]
format_p(p_sd_head, "1.4. Sơ đồ cơ cấu tổ chức bộ máy quản lý", style='2', bold=True)
p_sd_content = doc.paragraphs[find_p_by_text("Sơ đồ tổ chức", idx_c1) + 1]
format_p(p_sd_content,
    "Cơ cấu tổ chức của Công Ty CPĐT Thái Bình Kiên Giang – TBS Group (Zone II) – SKECHERS R&D Center được vận hành theo mô hình "
    "quản trị ma trận liên thông, kết hợp chặt chẽ giữa quản trị chức năng và chuỗi giá trị sản phẩm:\n"
    "• Hội đồng Quản trị & Ban Tổng Giám Đốc: Định hướng chiến lược phát triển, phê duyệt kế hoạch tài chính và quyết định đầu tư công nghệ. "
    "Đứng đầu là Chủ tịch HĐQT Nguyễn Đức Thuấn và Tổng Giám Đốc Phạm Minh Tùng.\n"
    "• Khối Văn phòng Chuỗi SKECHERS: Đầu mối điều hành chuỗi cung ứng, phụ trách kế hoạch vật tư (PMC) và trung tâm phân phối.\n"
    "• Trung tâm Nghiên cứu & Phát triển mẫu (SKECHERS R&D Center): Phụ trách kỹ thuật 3D CAD/CAM, chế thử mẫu và thử nghiệm phòng LAB.\n"
    "• Khối Quản lý Chất lượng (QA/QC): Giám sát độc lập tiêu chuẩn chất lượng sản phẩm từ khâu nguyên phụ liệu đến thành phẩm.\n"
    "• Khối Cải tiến liên tục (CI) & Kỹ thuật công nghiệp (IE): Tối ưu hóa layout chuyền may, định mức thời gian và tổ chức phong trào Kaizen.\n"
    "• Khối Quản trị Nguồn nhân lực & Hành chính: Tuyển dụng, đào tạo, chính sách tiền lương (C&B) và quản lý cơ sở vật chất.\n"
    "• Khối Sản xuất & Hệ thống Phân xưởng: Trực tiếp điều hành các xưởng may, xưởng chặt, xưởng gò đế và hoàn thiện sản phẩm."
)

# 1.5 Nhiệm vụ được giao
p_nvg_head = doc.paragraphs[find_p_by_text("Nhiệm vụ được giao", idx_c1)]
format_p(p_nvg_head, "1.5. Nhiệm vụ được giao trong quá trình thực tập", style='2', bold=True)
p_nvg_content = doc.paragraphs[find_p_by_text("Nhiệm vụ được giao", idx_c1) + 1]
format_p(p_nvg_content,
    "Trong đợt thực tập tốt nghiệp, em vinh dự được nhận vào làm việc tại Team Chuyển đổi số trực thuộc Ban Tổng Giám Đốc và "
    "Phòng Hành chính - Nhân sự. Dưới sự chỉ đạo trực tiếp của TGĐ. Phạm Minh Tùng, em được phân công đảm nhiệm các nhiệm vụ trọng tâm:\n"
    "1. Khảo sát thực địa và đánh giá mức độ số hóa của các quy trình nghiệp vụ hiện hành tại các phòng ban thuộc Zone II.\n"
    "2. Trực tiếp chịu trách nhiệm kiến trúc và phát triển phần mềm toàn trình (Fullstack): xây dựng frontend giao diện với Next.js 14, "
    "lập trình backend Serverless Edge Worker với Cloudflare Workers, thiết kế cấu trúc CSDL Cloudflare D1 và bộ nhớ lưu trữ Cloudflare R2.\n"
    "3. Thiết kế hệ thống phân quyền đa vai trò (RBAC), khắc phục triệt để các lỗ hổng bảo mật và xây dựng cơ chế xác thực JWT an toàn.\n"
    "4. Tích hợp các dịch vụ bên ngoài: hệ thống thông báo đẩy Web Push VAPID, chatbot thông báo Zalo qua Webhook và tự động sao lưu dữ liệu sang Google Drive.\n"
    "5. Tổ chức kiểm thử tự động toàn diện, chủ trì triển khai chương trình thử nghiệm Pilot 100 người dùng và đóng gói triển khai chính thức hệ thống lên Production."
)

# 1.6 Mục tiêu và kế hoạch
p_mtkh_head = doc.paragraphs[find_p_by_text("Mục tiêu và kế hoạch thực tập", idx_c1)]
format_p(p_mtkh_head, "1.6. Mục tiêu và kế hoạch thực tập", style='2', bold=True)
p_mtkh_content = doc.paragraphs[find_p_by_text("Mục tiêu và kế hoạch thực tập", idx_c1) + 1]
format_p(p_mtkh_content,
    "Mục tiêu xuyên suốt quá trình thực tập là rèn luyện tác phong làm việc công nghiệp, chuyển hóa các kiến thức học thuật tại trường "
    "thành giải pháp công nghệ có khả năng giải quyết trực tiếp các bài toán thực tiễn phức tạp của doanh nghiệp. "
    "Kế hoạch thực tập được phân bổ khoa học qua 10 tuần, từ ngày 03/8/2026 đến ngày 10/10/2026, tuần tự từ khâu khảo sát phân tích, "
    "thiết kế kiến trúc, phát triển các phân hệ cốt lõi, tích hợp bảo mật, kiểm thử tự động đến đóng gói triển khai sản phẩm."
)

# 1.7 Kiến thức và kỹ năng
p_ktkn_head = doc.paragraphs[find_p_by_text("Kiến thức và kỹ năng đã áp dụng", idx_c1)]
format_p(p_ktkn_head, "1.7. Kiến thức và kỹ năng đã áp dụng", style='2', bold=True)
p_ktkn_content = doc.paragraphs[find_p_by_text("Kiến thức và kỹ năng đã áp dụng", idx_c1) + 1]
format_p(p_ktkn_content,
    "Quá trình thực hiện đề tài đã giúp em vận dụng và phát huy tối đa các khối kiến thức và kỹ năng chuyên ngành:\n"
    "• Kiến thức lý thuyết: Kỹ thuật lập trình hiện đại (TypeScript/React), kiến trúc hệ thống phân tán, cơ sở dữ liệu quan hệ (SQL/SQLite), "
    "an toàn thông tin web (OWASP Top 10 API Security), mạng máy tính và giao thức HTTP/SSE/WebSocket.\n"
    "• Kỹ năng công nghệ mới: Làm chủ hệ sinh thái Serverless Edge Computing của Cloudflare (Workers V8 Isolate, D1 Database, R2 Object Storage), "
    "lập trình tối ưu hóa giao diện với Tailwind CSS, xử lý dữ liệu lớn với XLSX và Chart.js/Recharts.\n"
    "• Kỹ năng mềm: Giao tiếp hiệu quả với cán bộ công nhân viên và lãnh đạo cấp cao, kỹ năng giải quyết vấn đề (troubleshooting), "
    "kỹ năng quản lý thời gian và viết tài liệu kỹ thuật chuẩn mực."
)

doc.save("scratch_step2.docx")
print("✅ Saved Chapter 1 checkpoint to scratch_step2.docx")
