# 🏬 HỆ THỐNG QUẢN TRỊ VẬN HÀNH CHUỖI CUNG ỨNG & SẢN XUẤT SKECHERS — TBS GROUP

> **Văn Phòng Chuỗi SKECHERS - TBS Group**  
> Cổng Điều Hành Vận Hành, Số Hóa Quy Trình, Quản Trị Chiến Lược 1-5-2 & Cải Tiến Liên Tục (CI/Kaizen 4.0)  
> 🌐 **Production Deployment**: [https://vpchuoiskechers.tbsgroup2026.workers.dev](https://vpchuoiskechers.tbsgroup2026.workers.dev)

---

## 📋 MỤC LỤC
1. [Giới Thiệu Tổng Quan](#-1-giới-thiệu-tổng-quan)
2. [Khung Quản Trị Chiến Lược 1-5-2](#-2-khung-quản-trị-chiến-lược-1-5-2)
3. [Sơ Đồ Kiến Trúc Hệ Thống (System Architecture)](#-3-sơ-đồ-kiến-trúc-hệ-thống-system-architecture)
4. [Sơ Đồ Luồng Hoạt Động Chi Tiết (Detailed Flowcharts)](#-4-sơ-đồ-luồng-hoạt-động-chi-tiết-detailed-flowcharts)
   - [4.1. Luồng Đề Xuất & Phê Duyệt Sáng Kiến Kaizen (5 Bước)](#41-luồng-đề-xuất--phê-duyệt-sáng-kiến-kaizen-5-bước)
   - [4.2. Luồng Điều Hành Hệ Thống Quản Trị Chiến Lược 1-5-2](#42-luồng-điều-hành-hệ-thống-quản-trị-chiến-lược-1-5-2)
   - [4.3. Luồng Xác Thực, Phân Quyền (RBAC) & Scoping Nhà Máy](#43-luồng-xác-thực-phân-quyền-rbac--scoping-nhà-máy)
   - [4.4. Luồng Kiểm Tra & So Sánh Trùng Lặp Sáng Kiến Bằng AI](#44-luồng-kiểm-tra--so-sánh-trùng-lặp-sáng-kiến-bằng-ai)
5. [Các Phân Hệ Chức Năng Chính](#-5-các-phân-hệ-chức-năng-chính)
6. [Công Nghệ Sử Dụng (Tech Stack)](#-6-công-nghệ-sử-dụng-tech-stack)
7. [Cấu Trúc Thư Mục Dự Án (Project Structure)](#-7-cấu-trúc-thư-mục-dự-án-project-structure)
8. [Hướng Dẫn Phát Triển & Triển Khai (Development & Deployment)](#-8-hướng-dẫn-phát-triển--triển-khai-development--deployment)

---

## 📌 1. GIỚI THIỆU TỔNG QUAN

**Hệ Thống Quản Trị Vận Hành Chuỗi Cung Ứng & Sản Xuất SKECHERS - TBS Group** là nền tảng điều hành tập trung phục vụ toàn bộ hoạt động vận hành, sản xuất, kiểm soát chất lượng, cải tiến liên tục và quản trị chiến lược tại **Văn Phòng Chuỗi SKECHERS (Zone II)** của Tập đoàn TBS.

Hệ thống được thiết kế hướng đến sự tinh gọn, hiện đại, đảm bảo tính bảo mật, linh hoạt cao trên hạ tầng **Cloudflare Serverless Edge Computing** kết hợp cơ sở dữ liệu phân tán **Cloudflare D1**.

---

## 🎯 2. KHUNG QUẢN TRỊ CHIẾN LƯỢC 1-5-2

Hệ thống vận hành theo mô hình quản trị chiến lược **1-5-2**:

```
                       ┌───────────────────────────────────────────────────────────┐
                       │                   1. MỤC ĐÍCH XUYÊN SUỐT                 │
                       │   Đối tác không thể thay thế trong chuỗi giá trị toàn cầu │
                       └─────────────────────────────┬─────────────────────────────┘
                                                     │
       ┌──────────────────┬──────────────────┬───────┴──────────┬──────────────────┐
       │                  │                  │                  │                  │
┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐
│1.CHIẾN LƯỢC │    │2. TC-CN-HTS │    │  3. KH & CC │    │ 4. TH & NM  │    │  5. VHDN    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │                  │
       └──────────────────┴──────────────────┼──────────────────┴──────────────────┘
                                                     │
                       ┌─────────────────────────────┴─────────────────────────────┐
                       │                   2. NỀN TẢNG QUẢN TRỊ                    │
                       │     1. TỔ CHỨC - HẠ TẦNG  │  2. DỮ LIỆU SỐ (BI 24/7)      │
                       └───────────────────────────────────────────────────────────┘
```

- **1 Mục đích xuyên suốt**: Xây dựng TBS Group là một **đối tác không thể thay thế** trong chuỗi giá trị gia tăng toàn cầu, có khả năng tự vận hành, tự kiểm soát và phát triển bền vững.
- **5 Trụ cột vận hành**:
  1. **CHIẾN LƯỢC**: Định hướng và mục tiêu chiến lược dài hạn.
  2. **TC-CN-HTS**: Tổ chức - Công nghệ - Hạ tầng số.
  3. **KH & CC**: Khách hàng (SKECHERS) & Chuỗi cung ứng (Supply Chain).
  4. **TH & NM**: Thương hiệu & Quản trị Nhà máy sản xuất.
  5. **VHDN**: Văn hóa doanh nghiệp & Phát triển nguồn nhân lực.
- **2 Nền tảng quản trị**:
  1. **TỔ CHỨC - HẠ TẦNG**: Quản lý danh mục tài liệu hạ tầng kiến trúc kỹ thuật (1.TH KG, 2.NM_SKMĐ).
  2. **DỮ LIỆU SỐ**: Nền tảng báo cáo phân tích số liệu điều hành real-time 24/7.

---

## 🏗️ 3. SƠ ĐỒ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống áp dụng kiến trúc **JAMstack / Edge First** hiện đại:

```mermaid
flowchart TD
    subgraph CLIENT_LAYER ["📱 Client Layer (Trình duyệt / Mobile / Desktop PWA)"]
        User["Người dùng / Nhân viên / Cán bộ quản lý"]
        Browser["Next.js React Client Interface"]
        User --> Browser
    end

    subgraph EDGE_ROUTER ["☁️ Cloudflare Global Edge Network"]
        CF_Worker["Cloudflare Workers Engine (Serverless API & Static Assets)"]
        CF_Assets["Cloudflare Static Assets CDN (JS / CSS / Images)"]
        Browser -->|HTTPS Request| CF_Worker
        Browser -->|Static Files| CF_Assets
    end

    subgraph API_ROUTER ["🔌 Backend API Service Layer (/api/*)"]
        API_Kaizen["/api/ci-kaizen (REST API Sáng kiến Kaizen)"]
        API_Auth["/api/auth (Xác thực & Cấp JWT Token)"]
        API_AI["/api/ai/compare-kaizen (Engine so sánh trùng lặp AI)"]
        CF_Worker --> API_Kaizen
        CF_Worker --> API_Auth
        CF_Worker --> API_AI
    end

    subgraph DATABASE_STORAGE ["💾 Database & Storage Layer"]
        D1_DB[("Cloudflare D1 SQL DB\n(vpchuoiskechers-db)")]
        Cloudinary["Cloudinary CDN\n(Lưu trữ hình ảnh Kaizen)"]
        GDrive["Google Drive Docs\n(Tài liệu hạ tầng & PDF)"]
        
        API_Kaizen -->|SQLite SQL Query| D1_DB
        API_Kaizen -->|Upload Image| Cloudinary
        CF_Worker -->|External Link Integration| GDrive
    end
```

---

## 🔄 4. SƠ ĐỒ LUỒNG HOẠT ĐỘNG CHI TIẾT (DETAILED FLOWCHARTS)

### 4.1. Luồng Đề Xuất & Phê Duyệt Sáng Kiến Kaizen (5 Bước)

Luồng nghiệp vụ xử lý ý tưởng cải tiến CI/Kaizen từ lúc khởi tạo đến khi vinh danh khen thưởng:

```mermaid
flowchart TD
    Start([1. Tác giả tạo đề xuất Kaizen]) --> ChoiceForm{Chọn hình thức gửi}
    ChoiceForm -->|Cán bộ / Nhân viên| FormInternal[Nội bộ: Form 5 Bước chuẩn CI]
    ChoiceForm -->|Công nhân / Public| FormPublic[Public: Form nhanh QR Code / Link]

    FormInternal --> CheckDup[2. Engine AI chạy kiểm tra trùng lặp tự động]
    FormPublic --> CheckDup

    CheckDup -->|Phát hiện trùng >80%| WarnDup[Cảnh báo trùng lặp sáng kiến đã có]
    WarnDup -->|Tác giả vẫn gửi| SaveDB
    CheckDup -->|Hợp lệ| SaveDB[(3. Lưu đề xuất vào D1 Database)]

    SaveDB --> Step1[4. Sơ duyệt - Trưởng Ban / Thư ký CI]
    Step1 -->|Từ chối| StatusRejected[Trạng thái: Từ chối / Cần bổ sung]
    Step1 -->|Đạt yêu cầu| Step2[5. Duyệt Tính Khả Thi - Giám Đốc Nhà Máy]

    Step2 -->|Không khả thi| StatusRejected
    Step2 -->|Phê duyệt| Step3[6. Triển Khai Gemba & Thực Hiện Cải Tiến]

    Step3 --> Step4[7. Đánh Giá Kết Quả & Chấm Điểm - Hội Đồng Chuyên Gia]
    Step4 --> Step5[8. Xếp Hạng Leaderboard & Khen Thưởng Vinh Danh]

    StatusRejected --> End([Kết thúc luồng])
    Step5 --> End
```

---

### 4.2. Luồng Điều Hành Hệ Thống Quản Trị Chiến Lược 1-5-2

```mermaid
flowchart TD
    Dashboard[Truy cập Trang /1-5-2 hoặc Module Finance] --> CheckDept{Đã chọn Khối Quản trị?}
    CheckDept -->|Chưa chọn| ShowOverview[Hiển thị Overview 7 Thẻ Phòng Ban]
    CheckDept -->|Đã chọn| StrategicView[Hiển thị Bảng Điều Khiển Quản Trị 1-5-2]

    StrategicView --> ColLeft[Cột Trái: BÁO CÁO NHANH & MISC]
    StrategicView --> ColRight[Cột Phải: 1 MỤC ĐÍCH + 5 TRỤ CỘT + 2 NỀN TẢNG]

    ColLeft -->|Click Định Hướng| ModalDinhHuong[Modal Báo Cáo Định Hướng & Ngân Sách - 3 Thẻ]
    ColLeft -->|Click Điều Hành| ModalDieuHanh[Modal Báo Cáo Điều Hành CH001-CH005 - 5 Thẻ]
    ColLeft -->|Click Thư Viện| ModalThuVien[Modal Thư Viện Biểu Mẫu & Tài Liệu]

    ColRight -->|Click CHIẾN LƯỢC| ModalChienLuoc[Popup Danh Mục Tài Liệu Chiến Lược]
    ColRight -->|Click TC-CN-HTS| ModalTCCNHTS[Popup Tài Liệu Tổ Chức - Công Nghệ - Hạ Tầng]
    ColRight -->|Click TỔ CHỨC - HẠ TẦNG| ModalInfra[Popup Cây Folder: 1.TH KG & 2.NM_SKMĐ]

    ModalInfra --> SelectFolder{Chọn Folder}
    SelectFolder -->|1. TH KG| ViewFolder1[Danh sách 8 file PDF & DS MMTB]
    SelectFolder -->|2. NM_SKMĐ| ViewFolder2[Danh sách 3 file Quy Trình & Tài Liệu]
    ViewFolder1 -->|Click File| OpenGDrive[Mở file trực tiếp trên Google Drive]
    ViewFolder2 -->|Click File| OpenGDrive
```

---

### 4.3. Luồng Xác Thực, Phân Quyền (RBAC) & Scoping Nhà Máy

```mermaid
flowchart TD
    LoginReq[Người dùng đăng nhập bằng MSNV / Mật khẩu] --> AuthCheck{Xác thực thông tin}
    AuthCheck -->|Thất bại| LoginErr[Báo lỗi đăng nhập]
    AuthCheck -->|Thành công| IssueJWT[Cấp Session JWT Token & Lưu User Profile]

    IssueJWT --> GetRole{Đọc Role của User}
    GetRole -->|Superadmin / Admin| FullAccess[Quyền Admin: Truy cập /admin, Quản trị User, Full dữ liệu]
    GetRole -->|Giám đốc Nhà máy / Leader| FactoryAccess[Quyền Quản lý: Duyệt Kaizen theo Nhà máy phụ trách]
    GetRole -->|Nhân viên / Tác giả| UserAccess[Quyền Nhân viên: Đóng góp ý tưởng, xem báo cáo chung]

    FactoryAccess --> ScopeData[Filter dữ liệu SQL: REAL_FACTORIES = VP CHUỖI, VP2 SKECHERS, NM MIỀN ĐÔNG]
    UserAccess --> ScopeData
```

---

### 4.4. Luồng Kiểm Tra & So Sánh Trùng Lặp Sáng Kiến Bằng AI

```mermaid
flowchart TD
    InputText[Nhập Tiêu đề & Nội dung sáng kiến mới] --> TriggerAI[Gọi API /api/ci-kaizen/check-duplicate]
    TriggerAI --> FetchExist[Lấy danh sách các đề xuất Kaizen hiện có từ D1 Database]
    FetchExist --> ComputeSim[Chạy thuật toán Cosine Similarity / Text Matching]
    ComputeSim --> FilterTop[Lọc ra Top 3 sáng kiến có độ tương đồng cao nhất]

    FilterTop --> CheckScore{Điểm tương đồng max?}
    CheckScore -->|> 80%| DisplayHighWarn[Hiển thị Cảnh báo đỏ: Trùng lặp cao + Chi tiết bài cũ]
    CheckScore -->|50% - 80%| DisplayMedWarn[Hiển thị Cảnh báo vàng: Có thể tham khảo sáng kiến tương tự]
    CheckScore -->|< 50%| DisplayPass[Xác nhận sáng kiến mới độc lập]
```

---

## 🛠️ 5. CÁC PHÂN HỆ CHỨC NĂNG CHÍNH

| STT | Phân Hệ Chức Năng | Mô Tả Nghiệp Vụ | Đường Dẫn (Route) |
|---|---|---|---|
| **1** | **Hệ Thống Quản Trị 1-5-2** | Bảng điều khiển chiến lược 1 mục đích, 5 trụ cột, 2 nền tảng & báo cáo định hướng | `/1-5-2` |
| **2** | **Cải Tiến Liên Tục (CN-CI)** | Quản lý đề xuất Kaizen 5 bước, sơ duyệt, duyệt tính khả thi, chấm điểm, vinh danh | `/work/kaizen` |
| **3** | **Đăng Ký Kaizen Public** | Form gửi sáng kiến nhanh cho công nhân / bên ngoài qua mã QR | `/work/kaizen/register` |
| **4** | **Đăng Ký Công Tác (Business Trip)** | Quản lý lịch trình, lập kế hoạch công tác & phê duyệt chi phí | `/business-trip` |
| **5** | **Đặt Phòng Họp (Room Booking)** | Đặt lịch phòng họp thông minh, quản lý thiết bị & máy chiếu | `/rooms` |
| **6** | **Quản Trị Nhân Sự (HR Shell)** | Sơ đồ tổ chức, định biên nhân sự, hồ sơ cán bộ | `/hr` |
| **7** | **Kế Toán & Quản Trị (Finance)** | Theo dõi ngân sách, thu chi, công nợ, đối soát hóa đơn | `/finance` |
| **8** | **Cổng Quản Trị Hệ Thống (Admin)** | Phân quyền vai trò, quản lý người dùng, nhà máy, dòng sản phẩm | `/admin` |

---

## 💻 6. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

- **Frontend Core**: Next.js 14 (App Router, Static HTML Export Mode), React 18, TypeScript.
- **Styling & UI**: TailwindCSS, Vanilla Custom CSS, Lucide React Icons, Tabler Icons.
- **Serverless Runtime**: Cloudflare Workers, Cloudflare Assets Page Rules.
- **Edge Database**: Cloudflare D1 Database (SQLite Engine tại Edge).
- **Asset Storage**: Cloudinary Storage API (Hình ảnh Kaizen), Google Drive API (File PDF & Biểu mẫu).
- **Automation & Build**: Node.js, Wrangler CLI, Next Export.

---

## 📂 7. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```
vpchuoiskechers/
├── web/
│   ├── src/
│   │   ├── app/                               # Next.js App Router Pages & API Routes
│   │   │   ├── 1-5-2/                         # Route Hệ thống quản trị 1-5-2
│   │   │   ├── work/                          # Route Dashboard điều hành chính
│   │   │   │   ├── kaizen/                    # Route Cải tiến liên tục Kaizen
│   │   │   │   │   └── register/              # Form đăng ký Kaizen Public
│   │   │   ├── api/                           # Serverless Edge API endpoints
│   │   │   │   └── ci-kaizen/                 # API Xử lý dữ liệu Kaizen & DB SQL
│   │   │   ├── business-trip/                 # Module Công tác
│   │   │   ├── rooms/                         # Module Đặt phòng họp
│   │   │   ├── finance/                       # Module Kế toán & Quản trị
│   │   │   ├── hr/                            # Module Quản trị nhân sự
│   │   │   └── admin/                         # Cổng quản trị hệ thống Admin
│   │   ├── components/                        # React UI Components
│   │   │   ├── home/                          # StrategicManagementDashboard.tsx
│   │   │   └── work/                          # OverviewDashboard.tsx
│   │   ├── modules/                           # Domain Specific Modules
│   │   │   └── ci/                            # CIModule, KaizenDashboard, Form Submit...
│   │   └── lib/                               # Data Store, Profiles & Utilities
│   │       ├── userProfiles.ts                # Hồ sơ người dùng & Phân quyền
│   │       ├── organizationTree.ts            # Cơ cấu tổ chức phòng ban
│   │       └── translations.ts                # Đa ngôn ngữ VN / EN
│   ├── public/                                # Static Assets (Logos, Icons, Compiled CSS)
│   ├── migrations/                            # D1 Database Schema Migrations SQL
│   ├── wrangler.jsonc                         # Cloudflare Workers Deployment Config
│   ├── package.json                           # Dependencies & Build Scripts
│   └── tailwind.config.js                     # Custom Tailwind Palette & Design Tokens
└── README.md                                  # Tài liệu hệ thống chi tiết
```

---

## 🚀 8. HƯỚNG DẪN PHÁT TRIỂN & TRIỂN KHAI (DEVELOPMENT & DEPLOYMENT)

### 8.1. Yêu Cầu Môi Trường (Prerequisites)
- **Node.js**: `>= 18.17.0`
- **npm**: `>= 9.0.0`
- **Cloudflare Wrangler CLI**: `npm install -g wrangler`

---

### 8.2. Cài Đặt Khởi Chạy Cục Bộ (Local Setup)

```bash
# 1. Di chuyển vào thư mục ứng dụng web
cd web

# 2. Cài đặt các gói phụ thuộc (Dependencies)
npm install

# 3. Chạy Server phát triển cục bộ (Development Server)
npm run dev
```

Mở trình duyệt truy cập tại địa chỉ: `http://localhost:3000`

---

### 8.3. Thao Tác Với Cơ Sở Dữ Liệu Cloudflare D1 (Database Execution)

```bash
# Truy vấn thử bảng Kaizen từ D1 Remote Database
npx wrangler d1 execute vpchuoiskechers-db --remote --command="SELECT COUNT(*) FROM ci_kaizen_proposals;"

# Thêm cột hoặc chạy migration vào Remote Database
npx wrangler d1 execute vpchuoiskechers-db --remote --file="./migrations/0001_kaizen_init.sql"
```

---

### 8.4. Biên Dịch & Triển Khai Lên Cloudflare Workers (Production Deployment)

```bash
# 1. Di chuyển vào thư mục web
cd web

# 2. Biên dịch Tailwind CSS & Next.js Static Export Bundle
npm run build

# 3. Triển khai ứng dụng hoàn chỉnh lên Cloudflare Workers
npx wrangler deploy
```

Trang web sẽ tự động được cập nhật tại domain chính thức:  
👉 **[https://vpchuoiskechers.tbsgroup2026.workers.dev](https://vpchuoiskechers.tbsgroup2026.workers.dev)**

---

### 📜 Bản Quyền & Phát Triển
**Văn Phòng Chuỗi SKECHERS — TBS Group © 2026**. All Rights Reserved.  
Được phát triển & duy trì bởi **Team Chuyển Đổi Số (IT Digital Transformation) - TBS Group**.
