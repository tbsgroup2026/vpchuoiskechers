# -*- coding: utf-8 -*-
"""
Full Assembly Script for Bao_cao_thuc_tap_tot_nghiep.docx
Integrates:
- Section 1: Covers (bìa cứng, bìa lót)
- Section 2: Administrative forms, Lời cảm ơn, Cam đoan, Mục lục, Danh mục bảng/hình/từ viết tắt (Roman i, ii...)
- Section 3: Phần mở đầu, Chương 1-6, Kết luận & Kiến nghị, TLTK, Phụ lục (Arabic 1, 2, 3...)
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from report_core import (
    add_heading_1, add_heading_2, add_heading_3,
    add_body_p, add_bullet_p
)
from generate_full_document_pt1 import set_page_margins, setup_footer, build_cover_page
from content_admin_forms import (
    build_phu_luc_3, build_phu_luc_4, build_phu_luc_5,
    build_phieu_cham_doanh_nghiep, build_phu_luc_6,
    build_loi_cam_on_cam_doan, build_danh_muc_viet_tat
)
from content_chapters_1_2 import build_phan_mo_dau, build_chuong_1, build_chuong_2
from content_chapters_3_4 import build_chuong_3, build_chuong_4
from content_chapters_5_6_conclusion import (
    build_chuong_5, build_chuong_6_and_conclusion,
    build_references, build_appendices
)

OUTPUT_FILE = r"D:\Work\TBS II\Bao_cao_thuc_tap_tot_nghiep.docx"

def add_toc_fields(doc):
    p_t = doc.add_paragraph()
    p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t.paragraph_format.space_before = Pt(12)
    p_t.paragraph_format.space_after = Pt(12)
    r = p_t.add_run("MỤC LỤC")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 104, 56)
    
    # XML Field for dynamic TOC in Word
    p_fld = doc.add_paragraph()
    p_fld.paragraph_format.space_after = Pt(8)
    fld = parse_xml(f'<w:fldSimple {nsdecls("w")} w:instr="TOC \\o &quot;1-3&quot; \\h \\z \\u"/>')
    p_fld._element.append(fld)
    
    # Pre-render clear TOC structure for non-Word viewers
    toc_items = [
        ("CÁC BIỂU MẪU HÀNH CHÍNH & PHỤ LỤC TIẾP NHẬN", "i"),
        ("  • Phụ lục 3: Giấy tiếp nhận sinh viên thực tập", "i"),
        ("  • Phụ lục 4: Nhật ký thực tập của sinh viên (11 tuần)", "ii"),
        ("  • Phụ lục 5: Phiếu nhận xét của Đơn vị thực tập", "iii"),
        ("  • Phiếu chấm điểm thực tập dành cho Doanh nghiệp", "iv"),
        ("  • Phụ lục 6: Phiếu nhận xét của Giảng viên hướng dẫn", "v"),
        ("LỜI CẢM ƠN", "vi"),
        ("LỜI CAM ĐOAN", "vii"),
        ("DANH MỤC CÁC TỪ VIẾT TẮT", "viii"),
        ("DANH MỤC BẢNG", "ix"),
        ("DANH MỤC HÌNH ẢNH", "x"),
        ("PHẦN MỞ ĐẦU", "1"),
        ("CHƯƠNG 1: TỔNG QUAN VỀ ĐƠN VỊ THỰC TẬP (TBS GROUP – ZONE II, CHUỖI SKECHERS)", "4"),
        ("  1.1. Giới thiệu tổng quan về Tập đoàn Thái Bình (TBS Group)", "4"),
        ("  1.2. Lịch sử hình thành và các cột mốc phát triển chiến lược", "5"),
        ("  1.3. Lĩnh vực hoạt động và vị thế đối tác toàn cầu", "6"),
        ("  1.4. Mối quan hệ chiến lược với thương hiệu Skechers và vai trò của Zone II", "7"),
        ("  1.5. Cơ cấu tổ chức bộ máy và nhân sự Zone II", "8"),
        ("  1.6. Mô hình vận hành sản xuất chuỗi Skechers tại các tổ hợp nhà máy", "9"),
        ("  1.7. Hiện trạng hệ thống công nghệ thông tin tại đơn vị", "11"),
        ("  1.8. Vị trí công tác và nhiệm vụ của sinh viên trong đợt thực tập", "12"),
        ("  1.9. Nhu cầu chuyển đổi số cấp thiết dẫn tới dự án TBS II Workspace", "13"),
        ("CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG", "14"),
        ("  2.1. Tổng quan về kiến trúc Điện toán đám mây biên (Edge Computing) và Serverless", "14"),
        ("  2.2. Nền tảng Cloudflare Workers Runtime và mô hình V8 Isolates", "15"),
        ("  2.3. Cơ sở dữ liệu phân tán Cloudflare D1 (Distributed SQLite Database Engine)", "16"),
        ("  2.4. Khung giao diện Next.js 14/15 App Router và React 18/19", "17"),
        ("  2.5. Ngôn ngữ TypeScript và hệ thống kiểu dữ liệu an toàn", "18"),
        ("  2.6. Thư viện giao diện Tailwind CSS và Tabler Icons", "19"),
        ("  2.7. Cơ chế bảo mật phiên làm việc JWT và kiểm soát truy cập RBAC", "20"),
        ("  2.8. Tích hợp đám mây Cloudinary và sao lưu Google Apps Script WebApp", "21"),
        ("CHƯƠNG 3: KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU HỆ THỐNG", "22"),
        ("  3.1. Khảo sát hiện trạng quy trình vận hành thực tế tại Zone II", "22"),
        ("  3.2. Bảng tác nhân (Actors) và ma trận phân quyền người dùng", "23"),
        ("  3.3. Sơ đồ Use case tổng quát của hệ thống TBS II Workspace", "24"),
        ("  3.4. Phân tích Use case chi tiết: Phân hệ Thẻ công việc cá nhân Kanban", "25"),
        ("  3.5. Phân tích Use case chi tiết: Phân hệ Sáng kiến Kaizen 4.0 & IE Queue", "26"),
        ("  3.6. Phân tích Use case chi tiết: Phân hệ Kiểm định thực địa Gemba Walk 5S & Andon", "27"),
        ("  3.7. Phân tích Use case chi tiết: Phân hệ Quản lý & Bảo trì MMTB", "28"),
        ("  3.8. Phân tích Use case chi tiết: Phân hệ Tiện ích Đặt phòng họp & Xe công tác", "29"),
        ("  3.9. Đặc tả yêu cầu phi chức năng", "30"),
        ("CHƯƠNG 4: THIẾT KẾ KIẾN TRÚC VÀ CƠ SỞ DỮ LIỆU HỆ THỐNG", "31"),
        ("  4.1. Thiết kế kiến trúc tổng thể 4 tầng hệ thống", "31"),
        ("  4.2. Thiết kế Cơ sở dữ liệu và Sơ đồ thực thể liên kết ERD", "32"),
        ("  4.3. Đặc tả chi tiết các bảng dữ liệu trọng yếu trong CSDL D1", "33"),
        ("  4.4. Thiết kế các sơ đồ tuần tự (Sequence Diagrams) then chốt", "36"),
        ("  4.5. Thiết kế bề mặt giao tiếp API (RESTful Endpoints Specification)", "39"),
        ("CHƯƠNG 5: CÀI ĐẶT, TRIỂN KHAI VÀ KIỂM THỬ HỆ THỐNG", "41"),
        ("  5.1. Môi trường cài đặt, cấu hình và công cụ phát triển", "41"),
        ("  5.2. Hiện thực hóa các phân hệ chức năng trên giao diện thực tế", "42"),
        ("  5.3. Chiến lược và kế hoạch kiểm thử hệ thống", "47"),
        ("  5.4. Kịch bản và kết quả kiểm thử chức năng (Functional Test Cases)", "47"),
        ("  5.5. Kết quả kiểm thử hiệu năng và thời gian phản hồi (Performance Benchmark)", "49"),
        ("  5.6. Kết quả kiểm thử an toàn bảo mật và kiểm tra chuẩn RFC 9116", "50"),
        ("CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN", "51"),
        ("  6.1. Đánh giá mức độ hoàn thành nhiệm vụ so với kế hoạch ban đầu", "51"),
        ("  6.2. Những đóng góp thực tiễn của đề tài đối với TBS Group – Zone II", "52"),
        ("  6.3. Những hạn chế và khó khăn nhận diện trong quá trình thực hiện", "53"),
        ("  6.4. Định hướng nghiên cứu và mở rộng hệ thống trong tương lai", "53"),
        ("PHẦN KẾT LUẬN VÀ KIẾN NGHỊ", "54"),
        ("TÀI LIỆU THAM KHẢO", "56"),
        ("PHỤ LỤC: BẢNG CHÚ THÍCH HÌNH ẢNH", "57"),
    ]
    
    for item, pg in toc_items:
        p_item = doc.add_paragraph()
        p_item.paragraph_format.space_before = Pt(1)
        p_item.paragraph_format.space_after = Pt(2)
        p_item.paragraph_format.line_spacing = 1.15
        
        # Format tab stop with leader
        run_txt = p_item.add_run(item)
        run_txt.font.name = 'Times New Roman'
        run_txt.font.size = Pt(11)
        if item.startswith("CHƯƠNG") or item.startswith("PHẦN") or item.startswith("CÁC") or item.startswith("TÀI LIỆU") or item.startswith("LỜI") or item.startswith("DANH"):
            run_txt.font.bold = True
            
        r_tab = p_item.add_run(f"  ...........................................................................................................................  {pg}")
        r_tab.font.name = 'Times New Roman'
        r_tab.font.size = Pt(10)
        r_tab.font.color.rgb = RGBColor(148, 163, 184)

def add_list_of_tables(doc):
    p_t = doc.add_paragraph()
    p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t.paragraph_format.space_before = Pt(12)
    p_t.paragraph_format.space_after = Pt(12)
    r = p_t.add_run("DANH MỤC BẢNG")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 104, 56)
    
    tables_list = [
        ("Bảng 3.1: Danh mục các tác nhân (Actors) và phạm vi quyền hạn trong hệ thống", "23"),
        ("Bảng 4.1: Cấu trúc bảng dữ liệu thẻ công việc cá nhân Kanban (sys_my_tasks)", "33"),
        ("Bảng 4.2: Cấu trúc bảng nhật ký vết thao tác người dùng (audit_logs)", "34"),
        ("Bảng 4.3: Cấu trúc bảng sáng kiến cải tiến Kaizen 4.0 (ci_kaizen_proposals)", "35"),
        ("Bảng 4.6: Danh mục các RESTful API Endpoints chính của hệ thống TBS II Workspace", "39"),
        ("Bảng 5.1: Bảng tổng hợp kịch bản và kết quả kiểm thử chức năng chính", "47"),
        ("Bảng 5.2: Kết quả đo kiểm hiệu năng hệ thống trên mạng lưới Cloudflare Edge", "49"),
        ("Bảng 5.3: Kết quả rà soát an ninh bảo mật và tiêu chuẩn an toàn thông tin", "50"),
    ]
    
    for tbl_name, pg in tables_list:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(tbl_name)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)
        run.font.bold = True
        r_pg = p.add_run(f"  ............................................................................................  {pg}")
        r_pg.font.name = 'Times New Roman'
        r_pg.font.size = Pt(10)
        r_pg.font.color.rgb = RGBColor(148, 163, 184)

def add_list_of_figures(doc):
    p_t = doc.add_paragraph()
    p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t.paragraph_format.space_before = Pt(12)
    p_t.paragraph_format.space_after = Pt(12)
    r = p_t.add_run("DANH MỤC HÌNH ẢNH")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 104, 56)
    
    figures_list = [
        ("Hình 1.1: Sơ đồ cơ cấu tổ chức TBS Group – Zone II và Văn phòng Chuỗi Skechers", "8"),
        ("Hình 1.2: Sơ đồ mô hình vận hành sản xuất gia công chuỗi Skechers tại Zone II", "9"),
        ("Hình 1.3: Cụm nhà máy sản xuất giày Skechers hiện đại của TBS Group", "10"),
        ("Hình 2.1: Mô hình kiến trúc Serverless Edge Computing trên nền tảng Cloudflare", "15"),
        ("Hình 2.2: Mô hình phân lớp xử lý ứng dụng Next.js App Router kết hợp Tailwind CSS", "17"),
        ("Hình 3.1: Sơ đồ Use case tổng quát hệ thống TBS II Workspace", "24"),
        ("Hình 3.2: Sơ đồ Use case phân hệ Quản lý công việc Kanban (/work/my-tasks)", "25"),
        ("Hình 3.3: Sơ đồ Use case phân hệ Đề xuất & Thẩm định sáng kiến Kaizen IE", "26"),
        ("Hình 3.4: Sơ đồ Use case phân hệ Giám sát kiểm định Gemba Walk 5S", "27"),
        ("Hình 3.5: Sơ đồ Use case phân hệ Quản lý máy móc thiết bị và bảo trì MMTB", "28"),
        ("Hình 4.1: Sơ đồ kiến trúc tổng thể 4 tầng hệ thống TBS II Workspace", "31"),
        ("Hình 4.2: Sơ đồ thực thể liên kết (ERD) cơ sở dữ liệu Cloudflare D1", "32"),
        ("Hình 4.3: Sơ đồ tuần tự quy trình kéo thả thẻ Kanban và nộp minh chứng kết quả", "36"),
        ("Hình 4.4: Sơ đồ tuần tự quy trình thẩm định và phê duyệt Kaizen IE", "37"),
        ("Hình 4.5: Sơ đồ tuần tự quy trình xử lý phiếu báo hỏng máy MMTB khẩn cấp", "38"),
        ("Hình 4.6: Sơ đồ tuần tự cơ chế sao lưu thời gian thực lên Google Drive qua WebApp", "39"),
        ("Hình 5.1: Giao diện Cổng thông tin điều hành TBS II Portal", "42"),
        ("Hình 5.2: Giao diện Bảng điều hành Quản trị chiến lược 1-5-2", "42"),
        ("Hình 5.3: Giao diện Trung tâm điều hành ứng dụng Workspace Hub (/work)", "43"),
        ("Hình 5.4: Giao diện Bảng quản lý công việc cá nhân Kanban (/work/my-tasks)", "43"),
        ("Hình 5.5: Giao diện Phân hệ Kiểm định thực địa Gemba Walk 5S (/work/gemba)", "44"),
        ("Hình 5.6: Giao diện Hàng chờ thẩm định sáng kiến Kaizen IE (/work/ci)", "44"),
        ("Hình 5.7: Giao diện Tổng quan quản lý máy móc thiết bị MMTB (/maintenance)", "45"),
        ("Hình 5.8: Giao diện Danh mục hồ sơ kỹ thuật máy móc MMTB (/maintenance/machines)", "45"),
        ("Hình 5.9: Giao diện Đặt phòng họp trực tuyến thông minh (/rooms)", "46"),
        ("Hình 5.10: Giao diện Đăng ký và phê duyệt lịch công tác (/business-trip)", "46"),
    ]
    
    for fig_name, pg in figures_list:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(fig_name)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)
        run.font.italic = True
        r_pg = p.add_run(f"  .......................................................................................  {pg}")
        r_pg.font.name = 'Times New Roman'
        r_pg.font.size = Pt(10)
        r_pg.font.color.rgb = RGBColor(148, 163, 184)

def build_full_report():
    print("Initializing document...")
    doc = docx.Document()
    
    # -------------------------------------------------------------
    # SECTION 1: COVER PAGES (Trang bìa cứng + bìa lót)
    # -------------------------------------------------------------
    s1 = doc.sections[0]
    set_page_margins(s1)
    
    # Trang bìa cứng
    build_cover_page(doc, is_sub_cover=False)
    
    # Page Break
    doc.add_page_break()
    
    # Trang bìa lót (in lại bằng giấy trắng)
    build_cover_page(doc, is_sub_cover=True)
    
    # -------------------------------------------------------------
    # SECTION 2: ADMINISTRATIVE FORMS & PRELIMINARY PAGES (Số La Mã: i, ii...)
    # -------------------------------------------------------------
    s2 = doc.add_section(WD_SECTION.NEW_PAGE)
    set_page_margins(s2)
    setup_footer(s2, is_roman=True, start_num=1)
    
    print("Building Appendix 3, 4, 5, 6 & Prelim pages...")
    build_phu_luc_3(doc)
    doc.add_page_break()
    
    build_phu_luc_4(doc)
    doc.add_page_break()
    
    build_phu_luc_5(doc)
    doc.add_page_break()
    
    build_phieu_cham_doanh_nghiep(doc)
    doc.add_page_break()
    
    build_phu_luc_6(doc)
    doc.add_page_break()
    
    build_loi_cam_on_cam_doan(doc)
    doc.add_page_break()
    
    add_toc_fields(doc)
    doc.add_page_break()
    
    add_list_of_tables(doc)
    doc.add_page_break()
    
    add_list_of_figures(doc)
    doc.add_page_break()
    
    build_danh_muc_viet_tat(doc)
    
    # -------------------------------------------------------------
    # SECTION 3: MAIN REPORT CONTENT (Số Ả Rập: 1, 2, 3...)
    # -------------------------------------------------------------
    s3 = doc.add_section(WD_SECTION.NEW_PAGE)
    set_page_margins(s3)
    setup_footer(s3, is_roman=False, start_num=1)
    
    print("Building Main Chapters 1 to 6...")
    build_phan_mo_dau(doc)
    doc.add_page_break()
    
    build_chuong_1(doc)
    doc.add_page_break()
    
    build_chuong_2(doc)
    doc.add_page_break()
    
    build_chuong_3(doc)
    doc.add_page_break()
    
    build_chuong_4(doc)
    doc.add_page_break()
    
    build_chuong_5(doc)
    doc.add_page_break()
    
    build_chuong_6_and_conclusion(doc)
    doc.add_page_break()
    
    build_references(doc)
    doc.add_page_break()
    
    build_appendices(doc)
    
    print(f"Saving final report to: {OUTPUT_FILE}")
    doc.save(OUTPUT_FILE)
    print("Report saved successfully!")

if __name__ == "__main__":
    build_full_report()
