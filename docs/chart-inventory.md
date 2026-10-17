# BẢNG KIỂM KÊ TOÀN BỘ CHỈ SỐ & BIỂU ĐỒ HỆ THỐNG TBS GROUP II
**Kiểm kê & Nghiệm thu Triển khai Hệ thống Dashboard Chuẩn**
*Thời gian thực hiện: Tháng 10/2026*

---

## 1. Tổng quan hiện trạng & Thống nhất Hệ thống Component
- **Thư viện Chart cốt lõi:**
  1. `components/dashboard/DonutChartCard.tsx`: SVG vector toán học chính xác cao, lỗ tròn trung tâm hiển thị nhãn thương hiệu **TBS GROUP**, số lượng tổng cực lớn, mô tả phụ, legend 2 cột bên phải kèm chấm màu phân loại, số lượng in đậm và phần trăm màu xanh lá TBS (`#006838`). Hỗ trợ hover 2 chiều, tooltip, loading skeleton, empty state.
  2. `components/dashboard/KpiCard.tsx`: Icon ô vuông bo góc nền xanh lá nhạt, tiêu đề nhỏ xám, số lượng in đậm theo định dạng Việt Nam (`Intl.NumberFormat('vi-VN')`), dòng phụ xám, huy hiệu biến động ↑/↓ % với cờ `invertTrend`.
  3. `components/dashboard/BarChartCard.tsx`: Biểu đồ cột bo góc màu thương hiệu TBS, hover tooltip tương tác, trục nhãn rõ ràng.
  4. `components/dashboard/LineChartCard.tsx`, `StackedBarCard.tsx`, `RankingListCard.tsx`, `ProgressCard.tsx`: Các biến thể trực quan hóa cùng ngôn ngữ thiết kế.
- **Tầng dữ liệu Aggregate:**
  - Route D1 API `/api/stats/[module]` tính toán SQL aggregate trên Cloudflare D1 (`COUNT(*)`, `SUM(actual_qty)`, `GROUP BY department`).
  - Hỗ trợ tham số `month=YYYY-MM`, `region=...`, loại trừ bản ghi `is_archived = 1`.
  - Phân vùng dữ liệu an toàn, xử lý chia cho 0 trả về `null` (hiển thị "—" thay vì `NaN`/`Infinity`).

---

## 2. Bảng kiểm kê chi tiết & Trạng thái Triển khai (Chart & KPI Inventory)

| STT | Trang (Route / Module) | Tên chỉ số / Biểu đồ | Nguồn dữ liệu (Bảng D1 / API) | Loại trước đây | Loại chuẩn hóa mới | Filter Tháng/Vùng | Trạng thái |
|:---:|:---|:---|:---|:---|:---|:---:|:---:|
| **1** | `/work` (Dashboard Tổng) | **Sản Lượng PPH Nhà Máy** | Bảng `pph_entries` (`SUM(actual_qty)`) | Stat row | `KpiCard` (icon Box xanh nhạt, 111.952, ↑ 3.3%) | Có (Tháng, Vùng) | ✅ **HOÀN THÀNH** |
| **2** | `/work` (Dashboard Tổng) | **Tổng Cải Tiến** | Bảng `ci_kaizen_proposals` (`COUNT(*)`) | Stat row | `KpiCard` (icon Đèn sáng, 22, ↓ 67.6%) | Có (Tháng, Vùng) | ✅ **HOÀN THÀNH** |
| **3** | `/work` (Dashboard Tổng) | **Sự Cố MMTB** | Bảng `maintenance_tickets` (`COUNT(*)`) | Stat row | `KpiCard` (icon Tam giác, 1.115, ↓ 2.2% xanh - invertTrend) | Có (Tháng, Vùng) | ✅ **HOÀN THÀNH** |
| **4** | `/work` (Dashboard Tổng) | **Kiểm Soát Layout CBC** | Bảng `gemba_records` (`COUNT(*)`) | Stat row | `KpiCard` (icon Layout grid, 23, ↑ 228.6% đỏ - invertTrend) | Có (Tháng, Vùng) | ✅ **HOÀN THÀNH** |
| **5** | `/work` (Dashboard Tổng) | **TỔNG CẢI TIẾN Theo Bộ Phận** | Bảng `ci_kaizen_proposals` (`GROUP BY department`) | Modal Donut | `DonutChartCard` (Tâm "TBS GROUP 94", Legend 2 cột % xanh lá) | Có (Tháng, Vùng) | ✅ **HOÀN THÀNH** |
| **6** | `/work` (Trang chủ Classic) | **Tình trạng công việc** | Bảng `sys_my_tasks` | Custom SVG circle | `DonutChartCard` | Có (Ngày/Tuần/Tháng) | ✅ **HOÀN THÀNH** |
| **7** | `/work` (Trang chủ Classic) | **Công việc theo tuần** | Bảng `sys_my_tasks` | Div CSS bar | `BarChartCard` | Có (Tuần) | ✅ **HOÀN THÀNH** |
| **8** | `/work` (Trang chủ Classic) | **Công việc theo phân loại** | Bảng `sys_my_tasks` | Custom SVG circle | `DonutChartCard` | Có (Ngày/Tuần/Tháng) | ✅ **HOÀN THÀNH** |
| **9** | `/work` (Trang chủ Classic/New) | **4 Thẻ KPI Task cá nhân** | Bảng `sys_my_tasks` | Div card nhỏ | `KpiCard` (chuẩn token thiết kế mới) | Có (User, Phòng ban) | ✅ **HOÀN THÀNH** |
| **10** | `/work/kaizen` | **6 Thẻ KPI Kaizen (Tổng, Thi đua, Lưu trữ, Tháng này, Đánh giá, Trị giá)** | Bảng `ci_kaizen_proposals` | Thẻ card phẳng | `KpiCard` (chuẩn token thiết kế mới) | Có (Tháng, Quý, 8 Vùng) | ✅ **HOÀN THÀNH** |
| **11** | `/work/kaizen` | **Phân bổ cải tiến theo Khu vực** | Bảng `ci_kaizen_proposals` | HTML bar tự vẽ | `BarChartCard` / `StackedBarCard` | Có (Tháng, Quý, 8 Vùng) | ✅ **HOÀN THÀNH** |
| **12** | `/work/kaizen` | **Phân loại cải tiến (8 nhóm)** | Bảng `ci_kaizen_proposals` | Div progress bar | `DonutChartCard` | Có (Tháng, Quý, 8 Vùng) | ✅ **HOÀN THÀNH** |
| **13** | `/work/kaizen` | **Bảng xếp hạng thi đua cá nhân** | Bảng `ci_kaizen_proposals` | Table HTML thô | `RankingListCard` | Có (Tháng, Quý, Vùng) | ✅ **HOÀN THÀNH** |
| **14** | `/work/gemba` | **6 Thẻ KPI Gemba (Tổng, Mới, Đang xử lý, Hoàn thành, Quá hạn, Tháng này)** | Bảng `gemba_records` | Thẻ phẳng đơn giản | `KpiCard` (invertTrend cho thẻ Quá hạn) | Có (Tháng, Nhà máy) | ✅ **HOÀN THÀNH** |
| **15** | `/work/gemba` | **Tỷ lệ nghiệm thu** | Bảng `gemba_records` | `react-chartjs-2` | `DonutChartCard` | Có (Tháng, Nhà máy) | ✅ **HOÀN THÀNH** |
| **16** | `/work/gemba` | **Lũy kế vấn đề** | Bảng `gemba_records` | `react-chartjs-2` | `DonutChartCard` | Có (Tháng, Nhà máy) | ✅ **HOÀN THÀNH** |
| **17** | `/work/gemba` | **Gemba theo nhà máy** | Bảng `gemba_records` | `react-chartjs-2` | `BarChartCard` (cột màu TBS, tooltip chi tiết) | Có (Tháng, Nhà máy) | ✅ **HOÀN THÀNH** |
| **18** | `/work/gemba` | **Hiện trạng xử lý & Nhóm vấn đề** | Bảng `gemba_records` | `react-chartjs-2` | `BarChartCard` / `StackedBarCard` | Có (Tháng, Nhà máy) | ✅ **HOÀN THÀNH** |
| **19** | `/work/dept-management` | **6 Thẻ KPI Phòng ban (Tổng NV, Đang làm, Nghỉ phép, Hết hạn HĐ, Điểm HS, Task)** | Bảng `sys_users`, `sys_my_tasks` | `KpiCards.tsx` (kiểu cũ) | `KpiCard` (phong cách dashboard mẫu) | Có (Tháng / Quý / Năm) | ✅ **HOÀN THÀNH** |
| **20** | `/work/dept-management` | **Tình trạng nhân sự** | Bảng `sys_users` | `StatusDonut.tsx` | `DonutChartCard` (tâm hiển thị tổng NV) | Có (Tháng / Quý / Năm) | ✅ **HOÀN THÀNH** |
| **21** | `/work/dept-management` | **Cơ cấu chức danh** | Bảng `sys_users` | `TitleDonut.tsx` | `DonutChartCard` (Legend 2 cột, tâm "CHỨC DANH 12 Nhân sự") | Có (Tháng / Quý / Năm) | ✅ **HOÀN THÀNH** |
| **22** | `/work/dept-management` | **Hiệu suất nhân sự phòng ban** | Bảng `sys_users` | `PerformanceBarChart.tsx` | `BarChartCard` (cột bo góc màu TBS) | Có (Tháng / Quý / Năm) | ✅ **HOÀN THÀNH** |
| **23** | `/work/overview` | **3 Thẻ Module Đa nhà máy (Kaizen, Gemba, MMTB)** | Bảng tổng hợp | Thẻ xám border | `KpiCard` (icon box xanh, format VN) | Có (Tổ hợp, Đơn vị, Quý) | ✅ **HOÀN THÀNH** |
| **24** | `/work/overview` | **Chỉ số chi tiết từng nhà máy** | `/api/overview/*` | Thẻ phẳng cũ | `KpiCard` | Có (Tổ hợp, Đơn vị, Quý) | ✅ **HOÀN THÀNH** |
| **25** | `/maintenance/kpi` | **Thẻ KPI So sánh 6 Nhà máy** | Bảng `maintenance_tickets` | `StatCardRow` | `KpiCard` (chuẩn phong cách bảng mẫu) | Có (Tuần, Tháng) | ✅ **HOÀN THÀNH** |
| **26** | `/maintenance/kpi` | **Tổng điểm đánh giá 6 Nhà máy** | Bảng `maintenance_tickets` | `UnitDonutChart` | `DonutChartCard` | Có (Tuần, Tháng) | ✅ **HOÀN THÀNH** |
| **27** | `/maintenance/kpi` | **Xếp hạng 6 Nhà máy & Tần suất lỗi** | Bảng `maintenance_tickets` | Recharts Bar | `BarChartCard` | Có (Tuần, Tháng) | ✅ **HOÀN THÀNH** |
| **28** | `/maintenance/kpi` | **Xu hướng MTTA / MTTR / Availability** | Bảng `maintenance_tickets` | `TrendChart` | `LineChartCard` (đường cong spline mượt) | Có (Tuần, Tháng) | ✅ **HOÀN THÀNH** |
| **29** | `/pph-view` | **Thẻ KPI Sản lượng PPH Line** | Bảng `pph_entries` | Thẻ gradient cũ | `KpiCard` (format VN `111.952`, trend %) | Có (Ngày, Ca, Chuyền) | ✅ **HOÀN THÀNH** |
| **30** | `DonutChartModal.tsx` | **Modal phân bổ cải tiến theo khu vực** | Bảng `ci_kaizen_proposals` | `react-chartjs-2` | `DonutChartCard` (Legend 2 cột chuẩn) | Có (Khu vực) | ✅ **HOÀN THÀNH** |

---

## 3. Danh sách File Tạo Mới & Nâng Cấp
1. **Component Thư viện Dùng Chung (`components/dashboard/`):**
   - `chartTheme.ts`: Hằng số màu sắc chuẩn TBS Brand (`TBS_COLORS`, `CHART_PALETTE`), hàm tính toán `formatVnNumber`, `formatVnPercent`, `calculateTrendChange`, `getStableColor`.
   - `KpiCard.tsx`: Thẻ KPI chuẩn hóa theo phong cách thiết kế mẫu (icon xanh trong ô bo góc, số lớn format VN, phụ đề, trend % đổi màu theo `invertTrend`).
   - `DonutChartCard.tsx`: Biểu đồ Donut SVG vector trung tâm "TBS GROUP", tổng số lớn, legend 2 cột bên phải kèm chấm màu và % xanh lá. Hỗ trợ cả 2 prop alias `data` & `breakdown`.
   - `BarChartCard.tsx`: Biểu đồ thanh dọc/ngang chuẩn màu TBS.
   - `LineChartCard.tsx`: Biểu đồ đường xu hướng thời gian.
   - `StackedBarCard.tsx`: Biểu đồ cột xếp chồng đa phân nhóm.
   - `RankingListCard.tsx`: Bảng xếp hạng thi đua top thành tích.
   - `ProgressCard.tsx`: Thẻ tiến độ hoàn thành mục tiêu.
   - `EnterpriseOverviewSection.tsx`: Khung tổ hợp 4 `KpiCard` bên trái + 1 `DonutChartCard` lớn bên phải theo đúng bố cục ảnh mẫu.
   - `index.ts`: Barrel export cho toàn bộ thư viện dashboard.

2. **Tầng API Aggregate & D1 Worker:**
   - `web/src/app/api/stats/[module]/route.ts`: API route tổng hợp số liệu PPH, Kaizen, Gemba, MMTB từ Cloudflare D1.
   - `web/public/_worker.js`: Định tuyến Cloudflare Worker xử lý `/api/stats/*`, tính toán `COUNT`, `SUM`, `GROUP BY` trực tiếp trên D1, phân vùng theo `region` và loại trừ bản ghi `is_archived`.
   - `web/out/_worker.js`: Bản phân phối đồng bộ phục vụ production Cloudflare Pages/Workers.

3. **Giao diện Ứng dụng Đã Cập Nhật:**
   - `web/src/components/work/HomeNew.tsx`: Tích hợp `<EnterpriseOverviewSection />` ngay đầu trang chủ.
   - `web/src/components/work/HomeClassic.tsx`: Tích hợp `<EnterpriseOverviewSection />` và thay thế các biểu đồ công việc cũ bằng `DonutChartCard` & `BarChartCard`.
   - `web/src/modules/dashboard/components/KpiCards.tsx`: Viết lại bằng `KpiCard`.
   - `web/src/modules/dashboard/components/StatusDonut.tsx` & `TitleDonut.tsx`: Viết lại bằng `DonutChartCard`.
   - `web/src/modules/dashboard/components/PerformanceBarChart.tsx`: Viết lại bằng `BarChartCard`.
   - `web/src/modules/gemba/GembaDashboardView.tsx`: 6 thẻ KPI nâng cấp thành `KpiCard`, toàn bộ chart chuyển sang `BarChartCard` và `DonutChartCard`.
   - `web/src/modules/ci/KaizenDashboard.tsx`: 6 thẻ KPI nâng cấp thành `KpiCard`.
   - `web/src/modules/overview/MultiPlantOverviewView.tsx`: Module cards nâng cấp thành `KpiCard`.
   - `web/src/components/DonutChartModal.tsx`: Chuyển sang `DonutChartCard`.
   - `web/src/app/work/dept-management/page.tsx`: Cập nhật logic phân quyền nhận diện `tbs_current_user` từ local/session storage và hỗ trợ `SUPER_ADMIN`.

4. **Kiểm thử & Bằng chứng Nghiệm thu:**
   - `tests/stats_aggregate.test.mjs`: Test suite tự động cho hàm aggregate (6/6 PASS).
   - `scripts/test_pilot_scenarios.mjs`: Regression test suite (10/10 PASS).
   - `docs/screenshots/`: Bộ screenshot trực tiếp từ headless browser đối chiếu các màn hình thực tế.
