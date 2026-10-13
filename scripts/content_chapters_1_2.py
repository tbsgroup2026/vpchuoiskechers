# -*- coding: utf-8 -*-
"""
Content Builder for Introduction, Chapter 1, and Chapter 2.
"""

from report_core import (
    add_heading_1, add_heading_2, add_heading_3,
    add_body_p, add_bullet_p, add_figure, add_table_title
)

def build_phan_mo_dau(doc):
    add_heading_1(doc, "PHẦN MỞ ĐẦU")
    
    add_heading_2(doc, "1. Lí do chọn đề tài và bối cảnh thực tập")
    add_body_p(doc, "Trong bối cảnh cuộc Cách mạng công nghiệp lần thứ tư (Công nghiệp 4.0) đang diễn ra mạnh mẽ trên quy mô toàn cầu, việc ứng dụng công nghệ thông tin và chuyển đổi số vào quy trình quản trị sản xuất đã trở thành yêu cầu cấp thiết, đóng vai trò sống còn đối với sự phát triển bền vững của các doanh nghiệp sản xuất công nghiệp gia công xuất khẩu lớn tại Việt Nam.")
    add_body_p(doc, "Tập đoàn Thái Bình (TBS Group) là một trong những tập đoàn sản xuất da giày, túi xách, logistics và đầu tư hạ tầng công nghiệp hàng đầu Việt Nam, với quy mô hơn 40.000 cán bộ công nhân viên. Trong đó, Văn phòng Chuỗi Skechers (Khu vực Zone II) thuộc Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 giữ vai trò hạt nhân chiến lược điều phối toàn bộ chuỗi cung ứng sản xuất các dòng giày thể thao cao cấp cho thương hiệu Skechers (USA) xuất khẩu sang các thị trường khó tính như Mỹ, Châu Âu và Nhật Bản.")
    add_body_p(doc, "Tuy nhiên, trong quá trình vận hành sản xuất thực tế tại các cụm nhà máy Miền Đông (Bình Dương) và Kiên Giang, nhiều nghiệp vụ quản trị vẫn còn phụ thuộc vào các biểu mẫu giấy thủ công hoặc bảng tính Excel phân tán. Cụ thể: việc giao việc và theo dõi tiến độ công việc cá nhân thiếu tính trực quan; quy trình đi kiểm tra thực địa Gemba Walk 5S tại chuyền may, gò, ráp ghi nhận qua giấy tờ dễ dẫn đến chậm trễ xử lý các sự cố cảnh báo Andon; quy trình tiếp nhận và thẩm định thời gian tiết kiệm của các sáng kiến cải tiến Kaizen bởi các Kỹ sư IE (Industrial Engineering) mất nhiều thời gian tổng hợp; đồng thời công tác quản lý bảo trì máy móc thiết bị (MMTB) chưa được số hóa gắn liền với tem mã QR tại từng vị trí chuyền. Những rào cản này làm giảm tính liên thông dữ liệu và gia tăng độ trễ trong các quyết định điều hành.")
    add_body_p(doc, "Xuất phát từ nhu cầu thực tiễn cấp bách đó, trong đợt thực tập tốt nghiệp tại TBS Group – Zone II, dưới sự hướng dẫn khoa học của ThS. Trần Bá Minh Sơn và sự chỉ dẫn trực tiếp của cán bộ hướng dẫn Dư Thị Thanh Tình, em đã lựa chọn và thực hiện đề tài: 'Xây dựng và phát triển Hệ thống Quản trị Số hóa Vận hành Chuỗi Cung ứng & Sản xuất Skechers – TBS Group (TBS II Workspace Hub)'.")
    
    add_heading_2(doc, "2. Mục tiêu nghiên cứu và thực tập")
    add_body_p(doc, "Đợt thực tập tốt nghiệp được thực hiện nhằm hướng đến các mục tiêu trọng tâm sau:")
    add_bullet_p(doc, "Nghiên cứu và nắm vững mô hình tổ chức, quy trình sản xuất gia công giày Skechers quy mô công nghiệp, cũng như cơ chế điều phối chuỗi cung ứng tại Văn phòng Chuỗi Zone II.", "• Mục tiêu nghiệp vụ: ")
    add_bullet_p(doc, "Nghiên cứu và làm chủ kiến trúc điện toán đám mây biên Serverless Edge Computing hiện đại (Cloudflare Workers, Cloudflare D1 SQL Edge, Cloudinary CDN) kết hợp khung lập trình frontend Next.js App Router, React 18, TypeScript và Tailwind CSS.", "• Mục tiêu công nghệ: ")
    add_bullet_p(doc, "Xây dựng thành công hệ thống phần mềm TBS II Workspace Hub tích hợp đầy đủ các phân hệ cốt lõi: Quản lý công việc cá nhân Kanban với modal bắt buộc nộp minh chứng kết quả; Kiểm định thực địa Gemba Walk 5S cây phân cấp 4 cấp; Động cơ tiếp nhận và thẩm định sáng kiến Kaizen IE; Quản lý hồ sơ kỹ thuật và bảo trì MMTB; cùng cơ chế tự động sao lưu dữ liệu thời gian thực lên Google Drive xuất song song định dạng JSON và CSV UTF-8 BOM.", "• Mục tiêu sản phẩm: ")
    add_bullet_p(doc, "Rèn luyện tác phong làm việc công nghiệp, kỹ năng làm việc nhóm, khả năng giải quyết sự cố kỹ thuật phức tạp (troubleshooting) và tinh thần trách nhiệm trong môi trường doanh nghiệp quy mô lớn.", "• Mục tiêu kỹ năng: ")
    
    add_heading_2(doc, "3. Phạm vi và phương pháp thực hiện")
    add_body_p(doc, "Phạm vi nghiên cứu của đề tài tập trung vào việc số hóa các quy trình điều hành tác nghiệp tại Văn phòng Chuỗi Skechers Zone II và sự tương tác dữ liệu với các tổ hợp nhà máy sản xuất (Nhà máy 2 Thuận An, Cụm nhà máy Kiên Giang KG1, KG2, KG3).")
    add_body_p(doc, "Phương pháp thực hiện bao gồm:")
    add_bullet_p(doc, "Khảo sát thực địa tại các chuyền sản xuất may, gò, dán ráp và phỏng vấn trực tiếp các Kỹ sư IE, Giám sát chất lượng QC và cán bộ quản lý.", "• Phương pháp khảo sát & thu thập: ")
    add_bullet_p(doc, "Sử dụng mô hình phát triển phần mềm linh hoạt (Agile/Scrum), chia nhỏ khối lượng công việc theo từng tuần (sprint), họp trao đổi ngắn hàng ngày và liên tục kiểm thử hoàn thiện sản phẩm.", "• Phương pháp phát triển hệ thống: ")
    add_bullet_p(doc, "Kiểm thử hộp đen (Black-box testing) trên các ca sử dụng thực tế, đo lường thời gian phản hồi API và kiểm tra an ninh bảo mật theo chuẩn RFC 9116.", "• Phương pháp kiểm thử & đánh giá: ")
    
    add_heading_2(doc, "4. Ý nghĩa khoa học và thực tiễn của đề tài")
    add_body_p(doc, "Về mặt khoa học: Đề tài chứng minh tính khả thi, hiệu năng vượt trội và khả năng tiết kiệm chi phí vận hành lên tới 90% của kiến trúc Serverless Edge Computing khi áp dụng vào các bài toán quản trị vận hành công nghiệp quy mô lớn, thay thế cho kiến trúc máy chủ truyền thống cồng kềnh.")
    add_body_p(doc, "Về mặt thực tiễn: Hệ thống TBS II Workspace Hub được đóng gói hoàn chỉnh và triển khai thử nghiệm thành công tại địa chỉ https://vpchuoiskechers.tbsgroup2026.workers.dev, trực tiếp hỗ trợ cán bộ công nhân viên nâng cao năng suất lao động, giảm thiểu sai sót và hiện thực hóa mục tiêu Chuyển đổi số toàn diện của Tập đoàn TBS Group.")

def build_chuong_1(doc):
    add_heading_1(doc, "CHƯƠNG 1: TỔNG QUAN VỀ ĐƠN VỊ THỰC TẬP (TBS GROUP – ZONE II, CHUỖI SKECHERS)")
    
    add_heading_2(doc, "1.1. Giới thiệu tổng quan về Tập đoàn Thái Bình (TBS Group)")
    add_body_p(doc, "Công ty Cổ phần Đầu tư Thái Bình (tiền thân là Công ty TNHH Sản xuất Da Giày Thái Bình, thương hiệu quốc tế TBS Group) là một trong những tập đoàn kinh tế tư nhân đa ngành hàng đầu tại Việt Nam, được thành lập từ năm 1989. Trải qua hơn 35 năm xây dựng và phát triển vững chắc, từ một xưởng sản xuất giày da nhỏ ban đầu, TBS Group đã không ngừng mở rộng quy mô, nâng cao năng lực công nghệ và chuyển đổi mô hình quản trị để vươn tầm trở thành tập đoàn đa ngành vững mạnh.")
    add_body_p(doc, "Các thông tin pháp lý cơ bản của đơn vị thực tập:")
    add_bullet_p(doc, "Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2 (TBS Group – Zone II, Chuỗi Skechers)", "• Tên đơn vị: ")
    add_bullet_p(doc, "TBS II Workspace / Văn phòng Chuỗi Skechers Zone II", "• Tên giao dịch viết tắt: ")
    add_bullet_p(doc, "Số 2/434, Khu phố Bình Đáng, Phường Bình Hòa, Thành phố Thuận An, Tỉnh Bình Dương", "• Địa chỉ trụ sở & Cụm nhà máy: ")
    add_bullet_p(doc, "3700148644", "• Mã số thuế doanh nghiệp: ")
    add_bullet_p(doc, "(0274) 3758 888  |  Fax: (0274) 3758 889", "• Điện thoại / Fax: ")
    add_bullet_p(doc, "https://www.tbsgroup.vn/", "• Cổng thông tin chính thức: ")
    
    add_heading_2(doc, "1.2. Lịch sử hình thành và các cột mốc phát triển chiến lược")
    add_body_p(doc, "Quá trình hơn 35 năm phát triển của TBS Group ghi dấu nhiều mốc son quan trọng:")
    add_bullet_p(doc, "Khởi nghiệp với ngành sản xuất da giày xuất khẩu tại Dĩ An, Bình Dương.", "• Giai đoạn 1989 – 1995: ")
    add_bullet_p(doc, "Đầu tư mở rộng các cụm công nghiệp da giày quy mô lớn, thiết lập quan hệ đối tác gia công chiến lược với các thương hiệu thể thao quốc tế hàng đầu.", "• Giai đoạn 1996 – 2005: ")
    add_bullet_p(doc, "Thành lập ngành công nghiệp Túi xách thời trang cao cấp; vươn lên thành nhà xuất khẩu túi xách lớn thứ 2 tại Việt Nam, là đối tác tin cậy của Coach, Vera Bradley, Decathlon.", "• Giai đoạn 2006 – 2015: ")
    add_bullet_p(doc, "Tái cấu trúc tập đoàn, phát triển hệ sinh thái đa ngành: Sản xuất Công nghiệp phụ trợ, Da giày, Logistics (TBS Logistics), Bất động sản và Khách sạn nghỉ dưỡng.", "• Giai đoạn 2016 – 2020: ")
    add_bullet_p(doc, "Đẩy mạnh chiến lược Chuyển đổi số toàn diện (Digital Transformation), tự động hóa sản xuất, ứng dụng mô hình quản trị chiến lược 1-5-2 và thành lập Văn phòng Chuỗi Skechers Zone II nhằm tối ưu hóa chuỗi cung ứng sản xuất giày thể thao xuất khẩu sang thị trường Bắc Mỹ và toàn cầu.", "• Giai đoạn 2021 – 2026: ")
    
    add_heading_2(doc, "1.3. Lĩnh vực hoạt động và vị thế đối tác toàn cầu")
    add_body_p(doc, "TBS Group hoạt động trên 6 trụ cột kinh doanh cốt lõi:")
    add_bullet_p(doc, "Quy mô hàng chục nhà máy hiện đại, công suất đạt trên 40 triệu đôi giày/năm, giải quyết việc làm cho hơn 40.000 lao động.", "1. Sản xuất Da Giày Xuất khẩu: ")
    add_bullet_p(doc, "Đối tác của Coach, Kate Spade, Tory Burch với sản lượng hàng triệu sản phẩm cao cấp mỗi năm.", "2. Sản xuất Túi xách Thời trang: ")
    add_bullet_p(doc, "Trung tâm ICD TBS Tân Vạn với diện tích kho bãi logistics hàng đầu Đông Nam Á.", "3. Hạ tầng Logistics & Kho vận: ")
    add_bullet_p(doc, "Phát triển các khu đô thị sinh thái, khu công nghiệp và hạ tầng phụ trợ.", "4. Bất động sản & Hạ tầng Công nghiệp: ")
    add_bullet_p(doc, "Sở hữu và vận hành các khách sạn, sân golf cao cấp chuẩn quốc tế (Mai House Saigon, Montgomerie Links).", "5. Thương mại & Dịch vụ Khách sạn: ")
    add_bullet_p(doc, "Phân phối bán lẻ và sản xuất đế PU, cao su, khuôn mẫu kỹ thuật cao.", "6. Công nghiệp Phụ trợ & Bán lẻ: ")
    
    add_heading_2(doc, "1.4. Mối quan hệ chiến lược với thương hiệu Skechers và vai trò của Zone II")
    add_body_p(doc, "Skechers USA, Inc. là thương hiệu giày thể thao và phong cách sống đa quốc gia của Mỹ, nổi tiếng toàn cầu với công nghệ đế Memory Foam, công nghệ ép đế siêu êm Max Cushioning và phong cách thời trang trẻ trung năng động. Để đáp ứng sản lượng xuất khẩu khổng lồ sang thị trường Mỹ và các nước phát triển, Skechers đã lựa chọn TBS Group là một trong những đối tác sản xuất gia công chiến lược lớn nhất tại Đông Nam Á.")
    add_body_p(doc, "Trong cơ cấu chuỗi sản xuất gia công đó, **Văn phòng Chuỗi Skechers Zone II** (đặt tại Nhà Máy 2, Thuận An, Bình Dương) đóng vai trò là 'bộ não điều phối trung tâm' (Hub Management). Zone II chịu trách nhiệm toàn diện về: tiếp nhận mẫu thiết kế từ Skechers USA, nghiên cứu chế thử tại phòng R&D, quản lý BOM (Bill of Materials) vật tư, lập kế hoạch chuyền may - gò - dán ráp, kiểm soát chất lượng QC độc lập, thẩm định định mức giờ công IE, và điều phối sản xuất liên vùng giữa Tổ hợp Nhà máy Miền Đông và Cụm Nhà máy Kiên Giang (KG1, KG2, KG3).")
    
    add_heading_2(doc, "1.5. Cơ cấu tổ chức bộ máy và nhân sự Zone II")
    add_body_p(doc, "Cơ cấu tổ chức bộ máy tại TBS Group – Zone II và Văn phòng Chuỗi Skechers được xây dựng theo mô hình ma trận hiện đại, tinh gọn và phân quyền chuyên trách rõ ràng (xem Hình 1.1).")
    
    add_figure(doc, "images/hinh_1_1_co_cau_to_chuc_tbs_group_zone_2.png", "Hình 1.1: Sơ đồ cơ cấu tổ chức TBS Group – Zone II và Văn phòng Chuỗi Skechers", width_inches=5.8)
    
    add_body_p(doc, "Cơ cấu bao gồm các khối chức năng chính:")
    add_bullet_p(doc, "Chỉ đạo chiến lược, phê duyệt ngân sách và định hướng mục tiêu xuyên suốt 1-5-2.", "• Ban Tổng Giám Đốc Tập Đoàn: ")
    add_bullet_p(doc, "Đầu mối điều hành tác nghiệp toàn bộ chuỗi cung ứng sản xuất giày Skechers.", "• Văn phòng Chuỗi Skechers (Zone II): ")
    add_bullet_p(doc, "Phát triển rập mẫu, thử nghiệm form dáng và chuẩn hóa thông số kỹ thuật.", "• Phòng R&D và Mẫu Giày: ")
    add_bullet_p(doc, "Quản lý tồn kho da, vải, đế PU và điều phối đơn hàng sản xuất.", "• Phòng Quản lý Chuỗi Cung ứng & Kế hoạch: ")
    add_bullet_p(doc, "Đo lường thời gian thao tác từng công đoạn, tối ưu chuyền và quản lý hàng chờ thẩm định Kaizen 4.0.", "• Phòng Kỹ thuật IE (Industrial Engineering) & CI: ")
    add_bullet_p(doc, "Quản lý hạ tầng mạng, máy chủ và phát triển các hệ thống phần mềm chuyển đổi số (TBS II Workspace Hub).", "• Phòng CNTT & Chuyển đổi số: ")
    add_bullet_p(doc, "Khối Nhà máy 2 Thuận An (Miền Đông) và Cụm nhà máy Kiên Giang với hàng chục chuyền may, gò, ráp hoạt động liên tục.", "• Các Tổ hợp Nhà máy Sản xuất Thực địa: ")
    
    add_heading_2(doc, "1.6. Mô hình vận hành sản xuất chuỗi Skechers tại các tổ hợp nhà máy")
    add_body_p(doc, "Mô hình vận hành sản xuất của chuỗi Skechers tại Zone II là một quy trình khép kín, tuân thủ nghiêm ngặt các tiêu chuẩn chất lượng công nghiệp quốc tế (xem Hình 1.2).")
    
    add_figure(doc, "images/hinh_1_2_mo_hinh_van_hanh_chuoi_skechers.png", "Hình 1.2: Sơ đồ mô hình vận hành sản xuất gia công chuỗi Skechers tại Zone II", width_inches=5.8)
    
    add_body_p(doc, "Quy trình vận hành bao gồm 5 mắt xích cốt lõi: (1) Tiếp nhận đơn hàng từ Brand Skechers USA; (2) R&D làm khuôn và chế thử mẫu giày; (3) Cân đối vật tư da, vải, cao su PU; (4) Tiến hành sản xuất hàng loạt trên các dây chuyền may, gò, dán ráp và ép đế; (5) Kiểm định chất lượng QC và đóng gói xuất khẩu.")
    add_body_p(doc, "Đặc biệt, trong suốt quá trình sản xuất, hai vòng lặp kiểm soát liên tục được kích hoạt: vòng lặp Kiểm định thực địa Gemba Walk 5S để phát hiện kịp thời các bất thường và cảnh báo Andon tại hiện trường, và vòng lặp Cải tiến liên tục Kaizen 4.0 do các Kỹ sư IE phụ trách nhằm tối ưu hóa từng giây thao tác của công nhân. Toàn bộ hình ảnh thực tế nhà máy sản xuất khang trang, hiện đại của TBS Group được ghi nhận tại hiện trường (xem Hình 1.3).")
    
    add_figure(doc, "images/hinh_1_3_nha_may_san_xuat_tbs.png", "Hình 1.3: Cụm nhà máy sản xuất gia công giày Skechers hiện đại của TBS Group", width_inches=5.5)
    
    add_heading_2(doc, "1.7. Hiện trạng hệ thống công nghệ thông tin tại đơn vị")
    add_body_p(doc, "Trước khi triển khai dự án TBS II Workspace, hiện trạng hệ thống CNTT tại đơn vị ghi nhận một số đặc điểm:")
    add_bullet_p(doc, "Đã trang bị mạng LAN cáp quang tốc độ cao, hệ thống Wi-Fi phủ sóng toàn bộ khu vực văn phòng và xưởng mẫu; máy tính để bàn và máy in mã vạch trang bị đầy đủ.", "• Hạ tầng phần cứng & mạng: ")
    add_bullet_p(doc, "Đang sử dụng hệ thống ERP tổng thể cho mảng kế toán tài chính và xuất nhập kho vật tư, kết hợp hệ thống email doanh nghiệp Microsoft 365.", "• Ứng dụng nghiệp vụ hiện hữu: ")
    add_bullet_p(doc, "Tuy nhiên, các phân hệ tác nghiệp hằng ngày như quản lý task cá nhân, theo dõi kiểm tra Gemba 5S, đăng ký duyệt Kaizen và quản lý bảo trì MMTB vẫn chưa có giải pháp phần mềm tập trung. Hầu hết các bộ phận tự quản lý qua file Excel trên máy cá nhân hoặc nhóm chat trao đổi, dẫn đến dữ liệu bị phân mảnh, thiếu tính tức thời và khó truy xuất lịch sử thao tác.", "• Điểm nghẽn thông tin: ")
    
    add_heading_2(doc, "1.8. Vị trí công tác và nhiệm vụ của sinh viên trong đợt thực tập")
    add_body_p(doc, "Trong 11 tuần thực tập tại Văn phòng Chuỗi Skechers Zone II (Công Ty CP Đầu Tư Thái Bình - Nhà Máy 2), sinh viên được bố trí công tác tại Phòng CNTT & Chuyển Đổi Số dưới sự quản lý và hướng dẫn trực tiếp của cán bộ hướng dẫn Dư Thị Thanh Tình.")
    add_body_p(doc, "Nhiệm vụ cụ thể được giao:")
    add_bullet_p(doc, "Khảo sát và đặc tả yêu cầu nghiệp vụ quản lý tác nghiệp thực tế tại các phòng ban và chuyền sản xuất.", "1. Khảo sát & Phân tích: ")
    add_bullet_p(doc, "Thiết kế kiến trúc hệ thống Serverless Edge Computing, thiết kế cơ sở dữ liệu quan hệ Cloudflare D1 gồm 27 bảng dữ liệu.", "2. Thiết kế Kiến trúc & CSDL: ")
    add_bullet_p(doc, "Trực tiếp lập trình xây dựng phân hệ Bảng công việc cá nhân Kanban (/work/my-tasks), phân hệ Kiểm định thực địa Gemba Walk 5S (/work/gemba), phân hệ Động cơ Kaizen IE Queue (/work/ci), và phân hệ Quản lý máy móc thiết bị MMTB (/maintenance).", "3. Lập trình Phát triển Ứng dụng: ")
    add_bullet_p(doc, "Xây dựng cơ chế Real-time Event-Driven Backup tự động đồng bộ lên Google Drive qua Apps Script WebApp; chuẩn hóa bảo mật theo chuẩn RFC 9116.", "4. Tích hợp Đám mây & Bảo mật: ")
    add_bullet_p(doc, "Thực hiện kiểm thử chức năng, đo kiểm hiệu năng Edge, biên soạn tài liệu hướng dẫn sử dụng và bàn giao sản phẩm cho doanh nghiệp.", "5. Kiểm thử & Bàn giao: ")
    
    add_heading_2(doc, "1.9. Nhu cầu chuyển đổi số cấp thiết dẫn tới dự án TBS II Workspace")
    add_body_p(doc, "Từ những bất cập trong quản trị thủ công và yêu cầu nâng cao năng lực cạnh tranh toàn cầu, Ban Lãnh đạo Tập đoàn TBS Group đã ban hành chiến lược số hóa toàn diện. Dự án **TBS II Workspace Hub** ra đời như một mắt xích trọng yếu nhằm giải quyết đồng thời ba bài toán lớn: (1) Thống nhất môi trường làm việc số tập trung 24/7 cho toàn thể cán bộ công nhân viên; (2) Minh bạch hóa tiến độ công việc và quy trình thẩm định cải tiến Kaizen/Gemba 5S; (3) Ứng dụng công nghệ Serverless Edge Computing hiện đại để đảm bảo tốc độ phản hồi siêu tốc dưới 50ms mà không tốn kém chi phí đầu tư máy chủ vật lý cồng kềnh.")

def build_chuong_2(doc):
    add_heading_1(doc, "CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG")
    
    add_heading_2(doc, "2.1. Tổng quan về kiến trúc Điện toán đám mây biên (Edge Computing) và Serverless")
    add_body_p(doc, "Trong các mô hình điện toán đám mây truyền thống (Cloud Computing), dữ liệu và mã nguồn ứng dụng thường được triển khai tại các trung tâm dữ liệu tập trung (Centralized Data Centers) như AWS US-East hay Singapore. Khi người dùng tại Việt Nam gửi yêu cầu, tín hiệu mạng phải truyền qua các tuyến cáp quang biển quốc tế, dẫn đến độ trễ mạng (network latency) từ 100ms đến 300ms, đồng thời tiềm ẩn nguy cơ gián đoạn dịch vụ khi xảy ra sự cố đứt cáp quang biển.")
    add_body_p(doc, "Điện toán đám mây biên (Edge Computing) ra đời nhằm khắc phục triệt để nhược điểm trên. Thay vì xử lý tại các máy chủ trung tâm xa xôi, Edge Computing đẩy mã nguồn và dữ liệu ra mạng lưới hàng trăm điểm hiện diện (Points of Presence - PoPs) đặt ngay sát vị trí người dùng. Kết hợp với mô hình Không máy chủ (Serverless), nhà phát triển chỉ cần tập trung viết mã nguồn xử lý sự kiện (Event-driven code), toàn bộ công tác cấp phát tài nguyên, cân bằng tải và bảo mật đều được nền tảng tự động đảm nhiệm mà không cần quản trị máy chủ VPS.")
    
    add_heading_2(doc, "2.2. Nền tảng Cloudflare Workers Runtime và mô hình V8 Isolates")
    add_body_p(doc, "Khác với các nền tảng Serverless thế hệ cũ (như AWS Lambda sử dụng Docker Containers hay máy ảo micro-VM có hiện tượng Cold-Start kéo dài từ vài giây đến hàng chục giây), **Cloudflare Workers** sử dụng kiến trúc **V8 Isolates** – công nghệ cách ly bộ nhớ cực kỳ tân tiến của Google Chrome V8 Engine (xem Hình 2.1).")
    
    add_figure(doc, "images/hinh_2_1_kien_truc_cloudflare_edge_computing.png", "Hình 2.1: Mô hình kiến trúc Serverless Edge Computing trên nền tảng Cloudflare", width_inches=5.8)
    
    add_body_p(doc, "Mỗi Worker chạy trong một Isolate độc lập với chi phí cấp phát bộ nhớ chỉ vài kilobyte, cho phép khởi động ứng dụng chỉ trong 11 - 16ms (Zero Cold-Start). Mã nguồn được triển khai đồng thời tới hơn 300 thành phố trên toàn thế giới, tiếp nhận các yêu cầu HTTP/HTTPS, kiểm tra bảo mật WAF và tương tác trực tiếp với cơ sở dữ liệu tại biên.")
    
    add_heading_2(doc, "2.3. Cơ sở dữ liệu phân tán Cloudflare D1 (Distributed SQLite Database Engine)")
    add_body_p(doc, "Cloudflare D1 là cơ sở dữ liệu quan hệ SQL serverless đầu tiên được xây dựng trực tiếp trên mạng lưới biên của Cloudflare, dựa trên công nghệ SQLite bền bỉ và chuẩn mực. D1 giải quyết bài toán cốt lõi của các ứng dụng web phân tán: mang dữ liệu quan hệ (Relational Data) đến sát người dùng nhất có thể.")
    add_body_p(doc, "Đặc điểm kỹ thuật nổi bật của Cloudflare D1:")
    add_bullet_p(doc, "Hỗ trợ đầy đủ cú pháp SQL tiêu chuẩn (SELECT, INSERT, UPDATE, DELETE, JOIN, GROUP BY, Transactions ACID).", "• Chuẩn SQL toàn diện: ")
    add_bullet_p(doc, "Dữ liệu được lưu trữ dạng SQLite snapshot, đọc dữ liệu siêu tốc tại bộ nhớ biên mà không cần gọi ngược về máy chủ gốc.", "• Read-Replication tự động: ")
    add_bullet_p(doc, "Tích hợp liền mạch với Cloudflare Workers qua cơ chế Environment Binding (env.DB), thực thi câu lệnh SQL trực tiếp qua API chuẩn bị sẵn (Prepared Statements) giúp loại bỏ 100% nguy cơ tấn công SQL Injection.", "• Gắn kết tự nhiên (Native Binding): ")
    
    add_heading_2(doc, "2.4. Khung giao diện Next.js 14/15 App Router và React 18/19")
    add_body_p(doc, "Ở tầng giao diện người dùng (Presentation Layer), hệ thống áp dụng khung lập trình **Next.js App Router** – kiến trúc hiện đại hàng đầu thế giới cho ứng dụng web doanh nghiệp (xem Hình 2.2).")
    
    add_figure(doc, "images/hinh_2_2_kien_truc_nextjs_app_router.png", "Hình 2.2: Mô hình phân lớp xử lý ứng dụng Next.js App Router kết hợp Tailwind CSS", width_inches=5.8)
    
    add_body_p(doc, "Các đặc tính kiến trúc được khai thác:")
    add_bullet_p(doc, "Tổ chức thư mục định tuyến theo cấu trúc phân cấp trực quan (/work, /work/my-tasks, /work/gemba, /maintenance), hỗ trợ Layout lồng nhau (Nested Layouts) giúp tái sử dụng các thành phần thanh điều hướng và khung làm việc chung.", "• App Router Architecture: ")
    add_bullet_p(doc, "Ứng dụng được cấu hình build tĩnh (Static Export output: 'export' xuất thư mục out/), cho phép toàn bộ tài nguyên HTML/CSS/JS được phân phối trực tiếp từ mạng lưới Cloudflare CDN với tốc độ tải trang dưới 200ms.", "• Static HTML Export Mode: ")
    add_bullet_p(doc, "Sử dụng React Hooks (useState, useEffect, useRef, useCallback) kết hợp cơ chế Cập nhật giao diện lạc quan (Optimistic UI Updates), giúp thẻ Kanban di chuyển tức thì trên màn hình ngay khi người dùng kéo thả mà không phải chờ API phản hồi.", "• Optimistic Client State: ")
    
    add_heading_2(doc, "2.5. Ngôn ngữ TypeScript và hệ thống kiểu dữ liệu an toàn")
    add_body_p(doc, "Hệ thống sử dụng **TypeScript** 100% trên toàn bộ các module frontend và backend. Việc sử dụng hệ thống kiểu dữ liệu tĩnh nghiêm ngặt (Strict Type Checking) mang lại nhiều lợi thế vượt trội:")
    add_bullet_p(doc, "Định nghĩa rõ ràng cấu trúc của các thực thể nghiệp vụ (Task, GembaRecord, KaizenProposal, Machine, Ticket) qua các Interface và Type Aliases.", "• Type Safety: ")
    add_bullet_p(doc, "Phát hiện và ngăn chặn 95% các lỗi runtime tiềm ẩn (như truy cập thuộc tính null/undefined) ngay trong quá trình biên dịch mã nguồn.", "• Compile-time Error Detection: ")
    add_bullet_p(doc, "Hỗ trợ tính năng tự động gợi ý code (IntelliSense) và tái cấu trúc mã nguồn (Refactoring) an toàn trên môi trường làm việc quy mô lớn.", "• Developer Productivity: ")
    
    add_heading_2(doc, "2.6. Thư viện giao diện Tailwind CSS và Tabler Icons")
    add_body_p(doc, "Giao diện hệ thống được định hình theo trường phái **Industrial Aesthetic & Taste Design System**, loại bỏ hoàn toàn các phong cách thiết kế cẩu thả (AI Slop):")
    add_bullet_p(doc, "Sử dụng mã màu Xanh rừng ngọc bích đặc trưng của TBS Group (#006838), kết hợp nền tối Obsidian Emerald (#071612, #041a13) cho các thẻ điều hành trung tâm và màu nền xám sáng thanh lịch (#F8FAFC) cho các bảng biểu quản trị.", "• Palette màu nhận diện thương hiệu: ")
    add_bullet_p(doc, "Các chỉ số vận hành, mã số thiết bị và thời gian bấm giờ được hiển thị bằng font số đơn cách (Tabular Monospace Numerals), đảm bảo các cột số liệu thẳng hàng tăm tắp khi hiển thị báo cáo điều hành.", "• Kiểu chữ chuẩn kỹ thuật số: ")
    add_bullet_p(doc, "Hơn 50 biểu tượng chuyên dụng từ thư viện Tabler Icons biểu thị rõ nét từng trạng thái công việc, nút quay lại điều hướng nhất quán (/work/my-tasks) và các cảnh báo sự cố khẩn cấp.", "• Hệ thống Icon nhất quán: ")
    
    add_heading_2(doc, "2.7. Cơ chế bảo mật phiên làm việc JWT và kiểm soát truy cập RBAC")
    add_body_p(doc, "Để bảo vệ an toàn cho hệ thống dữ liệu chuỗi sản xuất, kiến trúc bảo mật được xây dựng theo mô hình Kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC) kết hợp mã hóa JSON Web Token (JWT):")
    add_bullet_p(doc, "Người dùng đăng nhập bằng Mã số nhân viên (MSNV) và mật khẩu; Worker xác thực và ký số mã thông báo JWT chứa thông tin vai trò (role_code), mã nhà máy (factory_id) và thời hạn hết hạn phiên.", "• Xác thực JWT Token: ")
    add_bullet_p(doc, "Hệ thống phân chia 6 cấp vai trò: TONG_GIAM_DOC, PHO_TONG_GIAM_DOC, GIAM_DOC_NHA_MAY, PHO_GIAM_DOC_QC, CBCNV (Công nhân/Kỹ sư), và SYSTEM_ADMIN.", "• Phân quyền 6 cấp vai trò: ")
    add_bullet_p(doc, "Các truy vấn dữ liệu SQL D1 được tự động áp bộ lọc phạm vi (Data Scoping Middleware), đảm bảo Quản lý nhà máy nào chỉ được xem và duyệt dữ liệu thuộc phạm vi phụ trách của đơn vị mình.", "• Data Scoping Engine: ")
    
    add_heading_2(doc, "2.8. Tích hợp đám mây Cloudinary và sao lưu Google Apps Script WebApp")
    add_body_p(doc, "Nhằm tối ưu hóa năng lực lưu trữ và đảm bảo an toàn dữ liệu, hệ thống tích hợp hai giải pháp đám mây chuyên biệt:")
    add_bullet_p(doc, "Toàn bộ hình ảnh chụp hiện trường kiểm tra 5S Gemba Walk, hình ảnh trước/sau cải tiến Kaizen và ảnh tem máy MMTB được tải lên Cloudinary qua API RESTful, tự động nén dung lượng và phát qua CDN toàn cầu.", "• Cloudinary Image CDN: ")
    add_bullet_p(doc, "Để giải quyết triệt để lỗi 403 storageQuotaExceeded (do tài khoản Google Service Account có dung lượng lưu trữ 0 GB), hệ thống chuyển sang mô hình kết nối Google Apps Script WebApp. Khi có sự kiện thêm/sửa/xóa, Worker gửi yêu cầu POST đồng bộ dữ liệu vào tài khoản Google Drive cá nhân (15 GB dung lượng), tự động sinh song song 2 định dạng: file .json nguyên bản phục vụ khôi phục dữ liệu và file .csv mã hóa UTF-8 BOM hiển thị chuẩn 100% Tiếng Việt có cột Tên CBNV phục vụ mở trực tiếp trên Microsoft Excel.", "• Google Apps Script WebApp Backup: ")

print("Loaded Chapters 1 & 2 Content Builder.")
