import docx
import sys
import os
import time

sys.stdout.reconfigure(encoding='utf-8')

DOC_PATH = r'd:\Work\TBS II\222480201738 _PhamNguyenAnhHuy (1).docx'

def rewrite_chapter1():
    doc = docx.Document(DOC_PATH)
    
    chap1_start = 227
    chap1_end = 288

    c1_paragraphs = [
        "CHƯƠNG 1: TỔNG QUAN VỀ ĐƠN VỊ THỰC TẬP VÀ ĐỀ TÀI DỰ ÁN",
        "1.1. Giới thiệu tổng quan về Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS II)",
        "Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS II) là cụm nhà máy sản xuất da giày thể thao xuất khẩu chủ lực trực thuộc Tập đoàn TBS Group (Thái Bình Corporation) — một trong những tập đoàn sản xuất da giày và túi xách hàng đầu tại Việt Nam.",
        "- Tên đầy đủ: Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2",
        "- Tên viết tắt / Thương hiệu: Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS II Workspace)",
        "- Địa chỉ trụ sở chính & Cụm Nhà máy: 2/434, Khu phố Bình Đáng, Phường Bình Hòa, Thành phố Hồ Chí Minh",
        "- Mã số thuế: 3700148644",
        "- Điện thoại văn phòng: (0274) 3758 888 / (0297) 3922 888",
        "- Website chính thức: https://www.tbsgroup.vn/",
        "Lĩnh vực hoạt động sản xuất cốt lõi của Nhà Máy 2 bao gồm:",
        "1. Sản xuất & Gia công Da Giày Thể thao Xuất khẩu: Là đơn vị sản xuất chủ lực chuyên hoàn thiện các dòng sản phẩm giày thể thao chất lượng cao cho Chuỗi Skechers toàn cầu xuất khẩu sang thị trường Mỹ, Châu Âu và quốc tế.",
        "2. Sản xuất Phụ liệu & Đế PU / Cao su: Ép đế PU, lưu hóa đế cao su và thiết kế khuôn mẫu phụ liệu cung ứng trực tiếp cho các dây chuyền gò, may, ráp tại nhà máy.",
        "3. Quản trị Kỹ thuật IE (Industrial Engineering): Tính toán định mức thời gian tiêu chuẩn SAM (Standard Allowed Minutes), tối ưu hóa chuyền sản xuất và cân bằng công đoạn.",
        "4. Duy trì Tiêu chuẩn Gemba Walk 5S Audit: Đánh giá và duy trì văn hóa 5S (Sàng lọc, Sắp xếp, Sạch sẽ, Săn sóc, Sẵn sàng) tại từng phân xưởng sản xuất.",
        "5. Chuyển đổi số (CĐS) Vận hành: Tiên phong ứng dụng CNTT, tự động hóa quy trình quản lý thẻ Kanban công việc, kiểm định 5S và duyệt Kaizen IE trực tuyến qua hệ thống TBS II Workspace.",
        
        "1.2. Lịch sử hình thành và Quy mô phát triển của Nhà Máy 2 (TBS II)",
        "Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 được thành lập và chính thức đi vào hoạt động nhằm mở rộng năng lực sản xuất da giày xuất khẩu quy mô lớn của Tập đoàn TBS Group tại khu vực kinh tế trọng điểm phía Nam.",
        "Trải qua nhiều năm xây dựng và phát triển, Nhà Máy 2 đã sở hữu cụm xưởng sản xuất quy mô hiện đại gồm: Xưởng May thể thao xuất khẩu, Xưởng Gò Ráp giày Skechers, Xưởng Phụ liệu Đế PU/Cao su và Xưởng Đóng gói kiểm định chất lượng.",
        "Lực lượng lao động tại Nhà Máy 2 hiện vận hành với quy mô hơn 5.000 cán bộ công nhân viên (CBCNV), kỹ sư sản xuất và chuyên viên kỹ thuật IE. Năng lực sản xuất của nhà máy đạt trên 10 triệu đôi giày thể thao Skechers xuất khẩu hàng năm.",
        "Trong chiến lược Chuyển đổi số toàn diện của Tập đoàn TBS Group, Nhà Máy 2 được chọn làm đơn vị hạt nhân để nghiên cứu, phát triển và thử nghiệm hệ thống số hóa vận hành nhà máy TBS II Workspace tích hợp Gemba Walk 5S Audit & Kaizen IE Engine (ci-kaizen).",

        "1.3. Cơ cấu tổ chức, Chức năng và Nhiệm vụ của Nhà Máy 2 (TBS II)",
        "1.3.1. Chức năng chính",
        "Trên cơ sở định hướng phát triển của Tập đoàn TBS Group, Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 thực hiện các chức năng chính bao gồm:",
        "- Khối Sản xuất & Gia công Da Giày Skechers: Vận hành các chuyền may, gò, ráp và đóng gói sản phẩm giày thể thao xuất khẩu đạt chuẩn chất lượng quốc tế.",
        "- Khối Phụ liệu & Ép Đế PU / Cao su: Sản xuất đế PU, lưu hóa đế cao su và cung ứng phụ liệu ngành giày cho các chuyền gò ráp nội bộ.",
        "- Khối Kỹ thuật IE & Quản trị Sản xuất (Industrial Engineering): Tính toán định mức SAM, tối ưu hóa thao tác công nhân, giảm thiểu lãng phí (Muda) và nâng cao hiệu suất chuyền.",
        "- Khối Quản lý Chất lượng (QA/QC) & Ban Gemba 5S: Kiểm định chất lượng sản phẩm xuất khẩu, thực hiện đánh giá Gemba Walk 5S định kỳ tại các phân xưởng.",
        "- Khối Chuyển đổi số & Công nghệ Thông tin (IT / CĐS): Thiết kế, phát triển và vận hành nền tảng số hóa TBS II Workspace (Next.js 15 PWA + Dual Backend Express/Cloudflare Workers).",

        "1.3.2. Nhiệm vụ cụ thể",
        "- Đảm bảo Tiến độ và Sản lượng Xuất khẩu: Hoàn thành đúng kế hoạch các đơn hàng sản xuất giày Skechers xuất khẩu theo tiêu chuẩn chất lượng đã cam kết.",
        "- Thúc đẩy Phong trào Cải tiến Kaizen IE (ci-kaizen): Khuyến khích CBCNV nộp các sáng kiến Kaizen 5 bước, thực hiện đánh giá chuyên gia, xếp hạng và ứng dụng thực tế vào sản xuất.",
        "- Số hóa Quy trình Kiểm định Gemba 5S Audit: Thay thế kiểm tra thủ công bằng bảng tin giấy sang hệ thống ứng dụng web PWA Gemba Audit trực tuyến.",
        "- Quản lý Thẻ Công việc Kanban: Quản lý lịch trình, phân công nhiệm vụ cho Kỹ sư IE và CBCNV trên hệ thống thẻ Kanban điện tử.",
        "- Đào tạo Nguồn Nhân lực Số: Tổ chức tập huấn thao tác sản xuất chuẩn và hướng dẫn sử dụng ứng dụng số hóa cho cán bộ công nhân viên tại nhà máy.",

        "1.4. Đề tài thực tập và Nhiệm vụ được giao",
        "Trong đợt thực tập tại Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (từ ngày 17/08/2026 đến ngày 31/10/2026), em được phân công tham gia trực tiếp vào dự án phát triển phần mềm với thông tin chi tiết như sau:",
        "- Tên đề tài: Xây dựng và phát triển Hệ thống Quản trị số hóa Vận hành Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS II Workspace, Gemba Walk 5S Audit & Kaizen IE Engine)",
        "- Sinh viên thực hiện: Phạm Nguyễn Anh Huy (MSSV: 2224802010738, Lớp: D22CNTT02)",
        "- Giảng viên hướng dẫn: ThS. Trần Bá Minh Sơn (Viện Công Nghệ Số - Trường Đại học Thủ Dầu Một)",
        "- Cán bộ hướng dẫn tại đơn vị: Bà Dư Thị Thanh Tình (Trưởng phòng Hành chính & Nhân sự)",
        "Nhiệm vụ kỹ thuật cụ thể được giao trong dự án codebase (d:\\Work\\TBS II):",
        "1. Phân tích nghiệp vụ và thiết kế kiến trúc Frontend Monorepo bằng Next.js 15 PWA với React 19, TypeScript 5 và Tailwind CSS 3 (#0A8043).",
        "2. Nghiên cứu và xây dựng Dual Backend Architecture: Backend 1 (Express.js/Node.js trên VPS cho môi trường dev/local) và Backend 2 (Cloudflare Workers Hono serverless Edge với Cloudflare D1 Database & R2 Storage cho production).",
        "3. Phát triển phân hệ Kaizen IE Engine (ci-kaizen): Biểu mẫu nộp Kaizen 5 bước (KaizenFiveStepSubmitForm.tsx), kiểm tra trùng lặp AI (/api/ai/compare-kaizen), phân công Reviewer (/api/ci-kaizen/assign-reviewer), đánh giá chuyên gia (/api/ci-kaizen/expert-evaluations), xác nhận định mức Kỹ sư IE (/api/ci-kaizen/[id]/ie-confirm) và bảng xếp hạng Kaizen (/api/ci-kaizen/ranking).",
        "4. Phát triển phân hệ Gemba Walk 5S Audit (/api/maintenance, 0008_gemba_pro.sql): Sơ đồ mặt bằng xưởng (/api/maintenance/floor-plan), ticket kiểm định 5S Audit, quản lý thiết bị MMTB & gửi thông báo PWA Web Push (/api/push/subscribe).",
        "5. Cấu hình bảo mật & CI/CD: Thiết lập Rate Limiting 100 req/min, Token Blacklist (0007a_create_token_blacklist.sql), PBKDF2 Hashing và pipeline CI/CD GitHub Actions tự động triển khai lên Cloudflare Pages và Cloudflare Workers."
    ]

    idx_p = chap1_start
    for new_text in c1_paragraphs:
        if idx_p < chap1_end:
            doc.paragraphs[idx_p].text = new_text
            idx_p += 1
        else:
            doc.paragraphs[chap1_end - 1].insert_paragraph_before(new_text)

    while idx_p < chap1_end:
        doc.paragraphs[idx_p].text = ""
        idx_p += 1

    temp_path = DOC_PATH + ".tmp.docx"
    doc.save(temp_path)
    time.sleep(0.5)
    os.replace(temp_path, DOC_PATH)
    print(f"Successfully rewritten Chapter 1 in {DOC_PATH}")

if __name__ == '__main__':
    rewrite_chapter1()
