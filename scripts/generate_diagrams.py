# -*- coding: utf-8 -*-
"""
Script to generate high-resolution professional diagrams (>= 150 DPI)
for the Internship Report.
"""
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUTPUT_DIR = "images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def draw_box(ax, x, y, w, h, text, bg_color="#F8FAFC", border_color="#006838", text_color="#0F172A", fontsize=9, bold=False, subtext="", corner_radius=0.02):
    rect = patches.FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0.01,rounding_size={corner_radius}",
        facecolor=bg_color,
        edgecolor=border_color,
        linewidth=1.5,
        mutation_aspect=1
    )
    ax.add_patch(rect)
    
    fontweight = 'bold' if bold else 'normal'
    if subtext:
        ax.text(x + w/2, y + h*0.62, text, ha='center', va='center', fontsize=fontsize, fontweight=fontweight, color=text_color)
        ax.text(x + w/2, y + h*0.28, subtext, ha='center', va='center', fontsize=fontsize-1.5, color="#64748B", style='italic')
    else:
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=fontsize, fontweight=fontweight, color=text_color)

def draw_arrow(ax, x1, y1, x2, y2, color="#006838", lw=1.5, label=""):
    ax.annotate(
        "", xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(arrowstyle="->", color=color, lw=lw, mutation_scale=12)
    )
    if label:
        ax.text((x1+x2)/2, (y1+y2)/2 + 0.02, label, ha='center', va='bottom', fontsize=8, color="#0F172A", backgroundcolor='white')

# -------------------------------------------------------------
# 1. HÌNH 1.1: SƠ ĐỒ CƠ CẤU TỔ CHỨC TBS GROUP - ZONE II & VP CHUỖI SKECHERS
# -------------------------------------------------------------
def gen_fig_1_1():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=180)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')
    
    ax.text(5, 6.7, "SƠ ĐỒ CƠ CẤU TỔ CHỨC TBS GROUP - ZONE II & VĂN PHÒNG CHUỖI SKECHERS", 
            ha='center', va='center', fontsize=11, fontweight='bold', color='#006838')
    
    # Level 1: Lãnh đạo
    draw_box(ax, 3.2, 5.7, 3.6, 0.7, "BAN TỔNG GIÁM ĐỐC TBS GROUP", bg_color="#006838", border_color="#004D29", text_color="white", bold=True, fontsize=10)
    
    # Level 2: Khối Zone II & VP Chuỗi
    draw_box(ax, 3.0, 4.4, 4.0, 0.7, "VĂN PHÒNG CHUỖI SKECHERS (ZONE II)", subtext="Điều phối Toàn bộ Chuỗi Cung ứng & Vận hành", bg_color="#E6F4EA", border_color="#006838", bold=True, fontsize=9.5)
    
    draw_arrow(ax, 5.0, 5.7, 5.0, 5.1)
    
    # Level 3: Các Phòng Ban Chức Năng
    depts = [
        ("Phòng R&D - Mẫu Giày", "Thiết kế & Tiêu chuẩn Kỹ thuật", 0.5, 3.0),
        ("Phòng Quản lý Chuỗi Cung Ứng", "Vật tư & Kế hoạch Đơn hàng", 2.8, 3.0),
        ("Phòng Quản lý Kỹ thuật IE & CI", "Định mức Giờ & Kaizen 4.0", 5.1, 3.0),
        ("Phòng CNTT & Chuyển đổi số", "TBS II Workspace & Hạ tầng Cloud", 7.4, 3.0),
    ]
    
    for title, sub, x, y in depts:
        draw_box(ax, x, y, 2.1, 0.75, title, subtext=sub, bg_color="#F1F5F9", border_color="#64748B", bold=True, fontsize=8.5)
        draw_arrow(ax, 5.0, 4.4, x + 1.05, y + 0.75, color="#64748B")
        
    # Level 4: Khối Nhà máy Sản xuất Thực địa
    plants = [
        ("TỔ HỢP NHÀ MÁY MIỀN ĐÔNG", "Thuận An, Bình Dương (TBS II)", 1.5, 1.2),
        ("TỔ HỢP NHÀ MÁY KIÊN GIANG", "Cụm KG1, KG2, KG3 (Vĩnh Hòa Hiệp)", 5.5, 1.2),
    ]
    
    for title, sub, x, y in plants:
        draw_box(ax, x, y, 3.0, 0.8, title, subtext=sub, bg_color="#EFF6FF", border_color="#2563EB", text_color="#1E40AF", bold=True, fontsize=9)
        draw_arrow(ax, 5.0, 3.0, x + 1.5, y + 0.8, color="#2563EB")
        
    # Sub-teams inside plants
    draw_box(ax, 0.5, 0.2, 9.0, 0.6, "Các Chuyền May - Gò - Ráp - Ép Đế PU | Đội Bảo trì MMTB | Giám sát Chất lượng QC & Đội Kiểm tra Gemba 5S", bg_color="#F8FAFC", border_color="#CBD5E1", fontsize=8)
    draw_arrow(ax, 3.0, 1.2, 3.0, 0.8, color="#94A3B8")
    draw_arrow(ax, 7.0, 1.2, 7.0, 0.8, color="#94A3B8")
    
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_1_1_co_cau_to_chuc_tbs_group_zone_2.png"), dpi=180)
    plt.close()
    print("Done fig 1.1")

# -------------------------------------------------------------
# 2. HÌNH 1.2: MÔ HÌNH VẬN HÀNH CHUỖI SẢN XUẤT SKECHERS
# -------------------------------------------------------------
def gen_fig_1_2():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=180)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')
    
    ax.text(5, 5.6, "MÔ HÌNH VẬN HÀNH SẢN XUẤT GIA CÔNG CHUỖI SKECHERS TẠI ZONE II", 
            ha='center', va='center', fontsize=11, fontweight='bold', color='#006838')
    
    steps = [
        ("1. Tiếp nhận Đơn hàng", "Brand Skechers USA giao mẫu", 0.3, 3.5),
        ("2. R&D & Phát triển Mẫu", "Làm khuôn, thử form giày", 2.2, 3.5),
        ("3. Lập Kế hoạch Vật tư", "Điều phối da, vải, cao su PU", 4.1, 3.5),
        ("4. Sản xuất Gia công", "May, gò, dán ráp, ép đế", 6.0, 3.5),
        ("5. QC & Xuất khẩu", "Kiểm định, đóng gói, xuất", 7.9, 3.5),
    ]
    
    for i, (title, sub, x, y) in enumerate(steps):
        draw_box(ax, x, y, 1.8, 0.9, title, subtext=sub, bg_color="#F8FAFC", border_color="#006838", bold=True, fontsize=8.5)
        if i < len(steps) - 1:
            draw_arrow(ax, x + 1.8, y + 0.45, x + 2.2, y + 0.45)
            
    # Feedback / Governance loops
    draw_box(ax, 1.5, 1.5, 3.2, 0.9, "KIỂM ĐỊNH GEMBA WALK 5S & ANDON", subtext="Giám sát hiện trường & ngăn chặn lỗi chuyền", bg_color="#FEF3C7", border_color="#D97706", text_color="#92400E", bold=True, fontsize=8.5)
    draw_box(ax, 5.3, 1.5, 3.2, 0.9, "CẢI TIẾN LIÊN TỤC CI/KAIZEN 4.0", subtext="Kỹ sư IE thẩm định tiết kiệm giờ công", bg_color="#ECFDF5", border_color="#059669", text_color="#065F46", bold=True, fontsize=8.5)
    
    draw_arrow(ax, 6.9, 3.5, 6.9, 2.4, label="Đề xuất cải tiến", color="#059669")
    draw_arrow(ax, 6.9, 1.5, 6.9, 0.8, color="#059669")
    draw_arrow(ax, 3.1, 3.5, 3.1, 2.4, label="Kiểm tra 5S", color="#D97706")
    
    draw_box(ax, 1.5, 0.2, 7.0, 0.6, "HỆ THỐNG TBS II WORKSPACE HUB SỐ HÓA TOÀN BỘ DỮ LIỆU ĐIỀU HÀNH REAL-TIME", bg_color="#006838", border_color="#004D29", text_color="white", bold=True, fontsize=8.5)
    draw_arrow(ax, 3.1, 1.5, 3.1, 0.8, color="#006838")
    
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_1_2_mo_hinh_van_hanh_chuoi_skechers.png"), dpi=180)
    plt.close()
    print("Done fig 1.2")

# -------------------------------------------------------------
# 3. HÌNH 2.1: KIẾN TRÚC CLOUDFLARE EDGE COMPUTING
# -------------------------------------------------------------
def gen_fig_2_1():
    fig, ax = plt.subplots(figsize=(10, 6), dpi=180)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')
    
    ax.text(5, 5.7, "MÔ HÌNH KIẾN TRÚC SERVERLESS EDGE COMPUTING TRÊN NỀN TẢNG CLOUDFLARE", 
            ha='center', va='center', fontsize=11, fontweight='bold', color='#006838')
    
    # Client layer
    draw_box(ax, 0.5, 3.8, 2.5, 1.2, "NGƯỜI DÙNG DOANH NGHIỆP", subtext="Web PC / Tablet / Mobile PWA\nQuét mã QR Máy Móc & Kaizen", bg_color="#EFF6FF", border_color="#2563EB", text_color="#1E40AF", bold=True, fontsize=9)
    
    # Edge Network
    draw_box(ax, 3.8, 2.8, 2.8, 2.5, "CLOUDFLARE GLOBAL EDGE\n(300+ Trung tâm dữ liệu)", subtext="• Cloudflare Assets (HTML/CSS/JS)\n• V8 Isolate Worker Engine\n• SSL/TLS Termination\n• DDoS Protection & WAF\n• Phản hồi siêu tốc < 50ms", bg_color="#FEF3C7", border_color="#D97706", text_color="#92400E", bold=True, fontsize=9)
    
    # Data Layer
    draw_box(ax, 7.3, 4.0, 2.3, 1.1, "CLOUDFLARE D1", subtext="Distributed SQLite Edge\n27 bảng dữ liệu quan hệ", bg_color="#ECFDF5", border_color="#059669", text_color="#065F46", bold=True, fontsize=8.5)
    draw_box(ax, 7.3, 2.6, 2.3, 1.1, "CLOUDINARY CDN", subtext="Lưu trữ Ảnh Kaizen,\nTem QR & Minh chứng MMTB", bg_color="#F1F5F9", border_color="#64748B", bold=True, fontsize=8.5)
    draw_box(ax, 7.3, 1.2, 2.3, 1.1, "GOOGLE DRIVE API", subtext="Real-time Event Backup\nJSON & UTF-8 BOM CSV", bg_color="#F8FAFC", border_color="#475569", bold=True, fontsize=8.5)
    
    draw_arrow(ax, 3.0, 4.4, 3.8, 4.4, label="HTTPS/WSS", color="#2563EB")
    draw_arrow(ax, 6.6, 4.5, 7.3, 4.5, label="SQL Query", color="#059669")
    draw_arrow(ax, 6.6, 3.5, 7.3, 3.2, label="Upload API", color="#64748B")
    draw_arrow(ax, 6.6, 3.0, 7.3, 1.8, label="Backup POST", color="#475569")
    
    # Bottom Note
    draw_box(ax, 0.5, 0.3, 6.0, 1.0, "ƯU ĐIỂM CỐT LÕI:\n• Không cần quản trị máy chủ VPS (Zero Server Management)\n• Khởi động tức thì (Zero Cold-Start: 11 - 16ms)\n• Tối ưu chi phí hạ tầng 90% so với kiến trúc truyền thống", bg_color="#F8FAFC", border_color="#CBD5E1", fontsize=8)
    
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_2_1_kien_truc_cloudflare_edge_computing.png"), dpi=180)
    plt.close()
    print("Done fig 2.1")

# -------------------------------------------------------------
# 4. HÌNH 2.2: KIẾN TRÚC NEXT.JS APP ROUTER & TAILWIND CSS
# -------------------------------------------------------------
def gen_fig_2_2():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=180)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')
    
    ax.text(5, 5.6, "MÔ HÌNH PHÂN LỚP ỨNG DỤNG FRONTEND NEXT.JS APP ROUTER & DESIGN SYSTEM", 
            ha='center', va='center', fontsize=11, fontweight='bold', color='#006838')
    
    layers = [
        ("PRESENTATION LAYER (Next.js App Router)", 
         "• Root Layout (Header, Sidebar, User Context)\n• Routes: /work/my-tasks, /work/gemba, /work/ci, /maintenance, /1-5-2\n• Tabler Icons + Tailwind CSS Emerald Theme (#006838)", 0.5, 3.8, 9.0, 1.3, "#E6F4EA", "#006838"),
        ("COMPONENT & STATE MANAGEMENT LAYER", 
         "• Shared Components (MaintenanceShell, TaskCard, ResultModal, FilterSelect)\n• Optimistic UI Updates + Drag & Drop Event Handlers (HTML5 Drag API)\n• React 18 Hooks (useState, useEffect, useRef, useCallback)", 0.5, 2.1, 9.0, 1.3, "#EFF6FF", "#2563EB"),
        ("DATA FETCHING & INTEGRATION LAYER", 
         "• Fetch Wrapper với JWT Session Authentication & Error Boundary\n• Cloudflare Worker Endpoint Handlers (GET/POST/PATCH/DELETE)\n• Static Export Engine (Next.js out/ build target)", 0.5, 0.4, 9.0, 1.3, "#F8FAFC", "#64748B"),
    ]
    
    for title, desc, x, y, w, h, bg, border in layers:
        draw_box(ax, x, y, w, h, title, subtext=desc, bg_color=bg, border_color=border, bold=True, fontsize=9.5)
        
    draw_arrow(ax, 5.0, 3.8, 5.0, 3.4, color="#006838")
    draw_arrow(ax, 5.0, 2.1, 5.0, 1.7, color="#2563EB")
    
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_2_2_kien_truc_nextjs_app_router.png"), dpi=180)
    plt.close()
    print("Done fig 2.2")

# -------------------------------------------------------------
# 5. HÌNH 3.1: USE CASE TỔNG QUÁT HỆ THỐNG
# -------------------------------------------------------------
def gen_fig_3_1():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=180)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')
    
    ax.text(5, 6.7, "SƠ ĐỒ USE CASE TỔNG QUÁT HỆ THỐNG TBS II WORKSPACE", 
            ha='center', va='center', fontsize=11, fontweight='bold', color='#006838')
    
    # Boundary box
    rect = patches.Rectangle((2.3, 0.3), 5.4, 6.0, fill=False, edgecolor="#006838", lw=1.5, linestyle="--")
    ax.add_patch(rect)
    ax.text(5.0, 6.1, "<< Hệ Thống TBS II Workspace Hub >>", ha='center', va='center', fontsize=9, fontweight='bold', color="#006838")
    
    # Actors
    actors_left = [
        ("CBCNV / Công nhân", 1.1, 4.8),
        ("Kỹ sư IE", 1.1, 3.0),
        ("Giám sát QC / Gemba", 1.1, 1.2),
    ]
    actors_right = [
        ("Trưởng bộ phận / GĐ", 8.9, 4.8),
        ("Kỹ thuật viên MMTB", 8.9, 3.0),
        ("Quản trị hệ thống (Admin)", 8.9, 1.2),
    ]
    
    for name, x, y in actors_left + actors_right:
        draw_box(ax, x - 0.9, y - 0.4, 1.8, 0.8, name, bg_color="#EFF6FF", border_color="#2563EB", text_color="#1E40AF", bold=True, fontsize=8)
        
    # Use cases
    use_cases = [
        ("UC01: Quản lý Công việc Cá nhân (Kanban)", 3.0, 5.2),
        ("UC02: Đề xuất Sáng kiến Kaizen 4.0", 3.0, 4.3),
        ("UC03: Thẩm định Bấm giờ IE Queue", 3.0, 3.5),
        ("UC04: Kiểm định Gemba Walk 5S & Andon", 3.0, 2.7),
        ("UC05: Báo hỏng & Bảo trì MMTB", 3.0, 1.9),
        ("UC06: Đặt Phòng Họp & Xe Công Tác", 3.0, 1.1),
        ("UC07: Quản trị Hệ thống & Audit Logs", 3.0, 0.4),
    ]
    
    for name, x, y in use_cases:
        ellipse = patches.Ellipse((5.0, y + 0.25), 4.0, 0.55, facecolor="#F8FAFC", edgecolor="#006838", lw=1.2)
        ax.add_patch(ellipse)
        ax.text(5.0, y + 0.25, name, ha='center', va='center', fontsize=8, fontweight='bold', color="#0F172A")
        
    # Connect lines
    lines = [
        (1.8, 4.8, 3.2, 5.45), # CBCNV -> UC01
        (1.8, 4.8, 3.2, 4.55), # CBCNV -> UC02
        (1.8, 4.8, 3.2, 1.35), # CBCNV -> UC06
        (1.8, 3.0, 3.2, 3.75), # IE -> UC03
        (1.8, 1.2, 3.2, 2.95), # QC -> UC04
        (8.2, 4.8, 6.8, 5.45), # GĐ -> UC01
        (8.2, 4.8, 6.8, 4.55), # GĐ -> UC02
        (8.2, 3.0, 6.8, 2.15), # KTV MMTB -> UC05
        (8.2, 1.2, 6.8, 0.65), # Admin -> UC07
    ]
    for x1, y1, x2, y2 in lines:
        ax.plot([x1, x2], [y1, y2], color="#94A3B8", lw=1, linestyle="-")
        
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_3_1_use_case_tong_quat.png"), dpi=180)
    plt.close()
    print("Done fig 3.1")

# -------------------------------------------------------------
# 6. HÌNH 3.2: USE CASE KANBAN TASKS
# -------------------------------------------------------------
def gen_fig_3_2():
    fig, ax = plt.subplots(figsize=(9, 5), dpi=180)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 5)
    ax.axis('off')
    
    ax.text(4.5, 4.7, "SƠ ĐỒ USE CASE PHÂN HỆ QUẢN LÝ CÔNG VIỆC KANBAN (/work/my-tasks)", 
            ha='center', va='center', fontsize=10.5, fontweight='bold', color='#006838')
    
    draw_box(ax, 0.5, 2.0, 1.8, 1.0, "CÁN BỘ CÔNG NHÂN VIÊN\n(Người nhận task)", bg_color="#EFF6FF", border_color="#2563EB", text_color="#1E40AF", bold=True, fontsize=8)
    
    ucs = [
        ("Xem Danh sách Thẻ Công Việc Cá Nhân", 3.0, 3.8),
        ("Kéo Thả Đổi Trạng Thái (TODO -> IN_PROGRESS -> REVIEW)", 3.0, 2.8),
        ("Nộp Minh Chứng Kết Quả Hoàn Thành (DONE)", 3.0, 1.8),
        ("Lọc Theo Phòng Ban, Mức Ưu Tiên & Deadline", 3.0, 0.8),
    ]
    
    for title, x, y in ucs:
        ellipse = patches.Ellipse((5.5, y + 0.25), 4.8, 0.6, facecolor="#F8FAFC", edgecolor="#006838", lw=1.2)
        ax.add_patch(ellipse)
        ax.text(5.5, y + 0.25, title, ha='center', va='center', fontsize=8, fontweight='bold', color="#0F172A")
        ax.plot([2.3, 3.3], [2.5, y + 0.25], color="#94A3B8", lw=1)
        
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_3_2_use_case_phan_he_kanban_tasks.png"), dpi=180)
    plt.close()
    print("Done fig 3.2")

# -------------------------------------------------------------
# 7. HÌNH 3.3: USE CASE KAIZEN IE
# -------------------------------------------------------------
def gen_fig_3_3():
    fig, ax = plt.subplots(figsize=(9, 5), dpi=180)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 5)
    ax.axis('off')
    
    ax.text(4.5, 4.7, "SƠ ĐỒ USE CASE PHÂN HỆ SÁNG KIẾN KAIZEN 4.0 & IE QUEUE", 
            ha='center', va='center', fontsize=10.5, fontweight='bold', color='#006838')
    
    draw_box(ax, 0.4, 2.8, 1.8, 0.9, "CÔNG NHÂN / TÁC GIẢ\n(Đề xuất cải tiến)", bg_color="#EFF6FF", border_color="#2563EB", bold=True, fontsize=8)
    draw_box(ax, 0.4, 1.2, 1.8, 0.9, "KỸ SƯ IE / THƯ KÝ CI\n(Thẩm định định mức)", bg_color="#FEF3C7", border_color="#D97706", bold=True, fontsize=8)
    
    ucs = [
        ("Nộp Đề Xuất Cải Tiến (Form 5 Bước / QR Code)", 3.0, 3.8, 1),
        ("Kiểm Tra Trùng Lặp Tự Động (AI Compare Engine)", 3.0, 2.8, 1),
        ("Thẩm Định Tiết Kiệm Giờ Công (IE Queue)", 3.0, 1.8, 2),
        ("Phê Duyệt Khen Thưởng & Xếp Hạng Leaderboard", 3.0, 0.8, 2),
    ]
    
    for title, x, y, actor in ucs:
        ellipse = patches.Ellipse((5.5, y + 0.25), 4.8, 0.6, facecolor="#F8FAFC", edgecolor="#006838", lw=1.2)
        ax.add_patch(ellipse)
        ax.text(5.5, y + 0.25, title, ha='center', va='center', fontsize=8, fontweight='bold', color="#0F172A")
        actor_y = 3.25 if actor == 1 else 1.65
        ax.plot([2.2, 3.3], [actor_y, y + 0.25], color="#94A3B8", lw=1)
        
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_3_3_use_case_phan_he_kaizen_ie.png"), dpi=180)
    plt.close()
    print("Done fig 3.3")

# -------------------------------------------------------------
# 8. HÌNH 3.4 & 3.5: USE CASE GEMBA & MMTB
# -------------------------------------------------------------
def gen_fig_3_4_5():
    # 3.4 Gemba 5S
    fig, ax = plt.subplots(figsize=(9, 4.8), dpi=180)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 4.8)
    ax.axis('off')
    ax.text(4.5, 4.5, "SƠ ĐỒ USE CASE PHÂN HỆ KIỂM ĐỊNH THỰC ĐỊA GEMBA WALK 5S", 
            ha='center', va='center', fontsize=10.5, fontweight='bold', color='#006838')
    draw_box(ax, 0.4, 1.8, 1.8, 1.0, "GIÁM SÁT VIÊN GEMBA\n(Trưởng xưởng / QC)", bg_color="#EFF6FF", border_color="#2563EB", bold=True, fontsize=8)
    ucs = [
        ("Duyệt Cây Phân Cấp Sản Xuất (Nhà máy -> Xưởng -> Line -> Tổ)", 3.0, 3.6),
        ("Chấm Điểm 5S Gemba Walk Theo Danh Mục Tiêu Chuẩn", 3.0, 2.6),
        ("Phát Thẻ Cảnh Báo Sự Cố Andon & Yêu Cầu Khắc Phục", 3.0, 1.6),
        ("Xem Báo Cáo Tuân Thủ 5S Toàn Chuỗi Skechers", 3.0, 0.6),
    ]
    for title, x, y in ucs:
        ellipse = patches.Ellipse((5.5, y + 0.25), 4.8, 0.6, facecolor="#F8FAFC", edgecolor="#006838", lw=1.2)
        ax.add_patch(ellipse)
        ax.text(5.5, y + 0.25, title, ha='center', va='center', fontsize=8, fontweight='bold', color="#0F172A")
        ax.plot([2.2, 3.3], [2.3, y + 0.25], color="#94A3B8", lw=1)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_3_4_use_case_phan_he_gemba_5s.png"), dpi=180)
    plt.close()
    print("Done fig 3.4")
    
    # 3.5 MMTB
    fig, ax = plt.subplots(figsize=(9, 4.8), dpi=180)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 4.8)
    ax.axis('off')
    ax.text(4.5, 4.5, "SƠ ĐỒ USE CASE PHÂN HỆ BẢO TRÌ MÁY MÓC THIẾT BỊ MMTB", 
            ha='center', va='center', fontsize=10.5, fontweight='bold', color='#006838')
    draw_box(ax, 0.4, 1.8, 1.8, 1.0, "KỸ THUẬT VIÊN MMTB\n(Đội Cơ Điện / Bảo Trì)", bg_color="#FEF3C7", border_color="#D97706", bold=True, fontsize=8)
    ucs_m = [
        ("Quét Mã QR & Tra Cứu Hồ Sơ Kỹ Thuật Máy Móc", 3.0, 3.6),
        ("Tiếp Nhận & Xử Lý Phiếu Báo Hỏng Khẩn Cấp (Tickets)", 3.0, 2.6),
        ("Lập Kế Hoạch & Nghiệm Thu Bảo Dưỡng Định Kỳ (Schedule)", 3.0, 1.6),
        ("Phân Tích Chỉ Số BI: MTTA, MTTR, MTTD & Sơ Đồ Floor Plan", 3.0, 0.6),
    ]
    for title, x, y in ucs_m:
        ellipse = patches.Ellipse((5.5, y + 0.25), 4.8, 0.6, facecolor="#F8FAFC", edgecolor="#006838", lw=1.2)
        ax.add_patch(ellipse)
        ax.text(5.5, y + 0.25, title, ha='center', va='center', fontsize=8, fontweight='bold', color="#0F172A")
        ax.plot([2.2, 3.3], [2.3, y + 0.25], color="#94A3B8", lw=1)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_3_5_use_case_phan_he_mmtb_bao_tri.png"), dpi=180)
    plt.close()
    print("Done fig 3.5")

# -------------------------------------------------------------
# 9. HÌNH 4.1: SƠ ĐỒ KIẾN TRÚC TỔNG THỂ HỆ THỐNG
# -------------------------------------------------------------
def gen_fig_4_1():
    fig, ax = plt.subplots(figsize=(10, 7), dpi=180)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7.2)
    ax.axis('off')
    
    ax.text(5, 6.9, "SƠ ĐỒ KIẾN TRÚC TỔNG THỂ 4 TẦNG HỆ THỐNG TBS II WORKSPACE", 
            ha='center', va='center', fontsize=11, fontweight='bold', color='#006838')
    
    # Layer 1: Client
    draw_box(ax, 0.5, 5.5, 9.0, 1.0, "TẦNG GIAO DIỆN NGƯỜI DÙNG (CLIENT PRESENTATION LAYER)", 
             subtext="Desktop Browser (Chrome/Edge) | Tablet Quản lý | Di động PWA Quét QR Tem Máy & Kaizen\nReact 18 + Next.js App Router + Tailwind CSS (#006838 Emerald Theme) + Tabler Icons", 
             bg_color="#EFF6FF", border_color="#2563EB", bold=True, fontsize=9.5)
    
    # Layer 2: Edge CDN
    draw_box(ax, 0.5, 3.9, 9.0, 1.1, "TẦNG BIÊN TOÀN CẦU (CLOUDFLARE GLOBAL EDGE & SECURITY LAYER)", 
             subtext="WAF & DDoS Mitigation | HTTPS SSL/TLS Termination | HTTP Security Headers (RFC 9116)\nCloudflare Pages Static Assets CDN Cache | V8 Isolated Worker API Handler", 
             bg_color="#FEF3C7", border_color="#D97706", bold=True, fontsize=9.5)
    
    # Layer 3: Application & Business Logic
    draw_box(ax, 0.5, 2.1, 9.0, 1.3, "TẦNG NGHIỆP VỤ & DỊCH VỤ BACKEND (EDGE SERVICES & API LAYER)", 
             subtext="• JWT Auth & RBAC Engine (Phân quyền 6 cấp vai trò: TGĐ, GĐ, IE, QC, CBCNV, Admin)\n• Phân hệ Kanban Tasks (/api/tasks) + Modal bắt buộc Result Description\n• Phân hệ CI/Kaizen 4.0 (/api/ci-kaizen) + AI Compare Duplication Engine\n• Phân hệ Bảo trì MMTB (/api/maintenance/*: Machines, Tickets, Schedules)\n• Phân hệ Gemba Walk 5S, Đặt Phòng Họp & Đăng Ký Lịch Công Tác", 
             bg_color="#E6F4EA", border_color="#006838", bold=True, fontsize=9)
    
    # Layer 4: Storage & External Cloud
    draw_box(ax, 0.5, 0.4, 4.3, 1.2, "CLOUDFLARE D1 DATABASE", 
             subtext="Distributed Relational SQLite Database\n27 Bảng dữ liệu chuẩn hóa quan hệ", 
             bg_color="#ECFDF5", border_color="#059669", bold=True, fontsize=9)
             
    draw_box(ax, 5.2, 0.4, 4.3, 1.2, "DỊCH VỤ LƯU TRỮ ĐÁM MÂY MỞ RỘNG", 
             subtext="• Cloudinary CDN (Hình ảnh hiện trường 5S & Kaizen)\n• Google Drive WebApp API (Real-time Event Backup: JSON & CSV)", 
             bg_color="#F1F5F9", border_color="#64748B", bold=True, fontsize=9)
             
    draw_arrow(ax, 5.0, 5.5, 5.0, 5.0, color="#2563EB")
    draw_arrow(ax, 5.0, 3.9, 5.0, 3.4, color="#D97706")
    draw_arrow(ax, 2.65, 2.1, 2.65, 1.6, color="#006838")
    draw_arrow(ax, 7.35, 2.1, 7.35, 1.6, color="#64748B")
    
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_4_1_kien_truc_tong_the_he_thong.png"), dpi=180)
    plt.close()
    print("Done fig 4.1")

# -------------------------------------------------------------
# 10. HÌNH 4.2: SƠ ĐỒ THỰC THỂ LIÊN KẾT ERD
# -------------------------------------------------------------
def gen_fig_4_2():
    fig, ax = plt.subplots(figsize=(10.5, 7), dpi=180)
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 7)
    ax.axis('off')
    
    ax.text(5.25, 6.7, "SƠ ĐỒ THỰC THỂ LIÊN KẾT (ERD) CƠ SỞ DỮ LIỆU CLOUDFLARE D1", 
            ha='center', va='center', fontsize=11, fontweight='bold', color='#006838')
    
    tables = [
        ("sys_users", "PK: id\n• emp_code (Unique)\n• full_name\n• email, role_code\n• factory_id, dept_id", 0.4, 4.5),
        ("sys_my_tasks", "PK: id\n• code (Unique)\n• title, description\n• status (TODO/DONE)\n• result_description\nFK: assignee_emp_code", 3.8, 4.5),
        ("audit_logs", "PK: id\n• emp_code\n• emp_name (Tên CBNV)\n• module, action\n• changes_json, ip\n• created_at", 7.2, 4.5),
        ("ci_kaizen_proposals", "PK: id\n• code\n• title, current_state\n• solution, benefit\n• status (5 bước)\nFK: proposer_code", 0.4, 1.8),
        ("maintenance_machines", "PK: id\n• code (MMTB-xxxx)\n• name, serial_number\n• factory_id, line_id\n• status_id (active/broken)\n• specifications", 3.8, 1.8),
        ("maintenance_tickets", "PK: id\n• code\nFK: machine_id\n• issue_description\n• priority (urgent/norm)\n• downtime_minutes", 7.2, 1.8),
    ]
    
    for title, fields, x, y in tables:
        draw_box(ax, x, y, 2.9, 1.7, f"[TABLE] {title}", subtext=fields, bg_color="#F8FAFC", border_color="#006838", bold=True, fontsize=8.5)
        
    # Relationship arrows
    draw_arrow(ax, 3.3, 5.3, 3.8, 5.3, label="1 : N", color="#006838")
    draw_arrow(ax, 6.7, 5.3, 7.2, 5.3, label="Log thao tác", color="#64748B")
    draw_arrow(ax, 1.85, 4.5, 1.85, 3.5, label="1 : N", color="#006838")
    draw_arrow(ax, 6.7, 2.6, 7.2, 2.6, label="1 : N", color="#D97706")
    
    # Bottom Note
    draw_box(ax, 0.4, 0.3, 9.7, 0.8, "Quan hệ toàn vẹn dữ liệu: CSDL phân tán Cloudflare D1 hỗ trợ Foreign Keys, Indexing mã nhân viên và kiểm soát giao dịch ACID đáp ứng truy vấn đồng thời cao.", bg_color="#EFF6FF", border_color="#2563EB", fontsize=8)
    
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_4_2_erd_co_so_du_lieu_d1.png"), dpi=180)
    plt.close()
    print("Done fig 4.2")

# -------------------------------------------------------------
# 11. HÌNH 4.3, 4.4, 4.5, 4.6: SEQUENCE DIAGRAMS
# -------------------------------------------------------------
def gen_fig_sequence():
    # 4.3 Sequence Kanban Result Modal
    fig, ax = plt.subplots(figsize=(9, 5), dpi=180)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 5)
    ax.axis('off')
    ax.text(4.5, 4.7, "SƠ ĐỒ TUẦN TỰ: KÉO THẢ KANBAN & NỘP MINH CHỨNG KẾT QUẢ", 
            ha='center', va='center', fontsize=10.5, fontweight='bold', color='#006838')
    cols = [("User (Browser)", 1.2), ("MyTasksKanbanView", 3.7), ("Cloudflare Worker", 6.2), ("D1 / GDrive Backup", 8.2)]
    for name, x in cols:
        draw_box(ax, x-1.0, 3.9, 2.0, 0.5, name, bg_color="#E2E8F0", border_color="#475569", bold=True, fontsize=8)
        ax.plot([x, x], [0.6, 3.9], color="#CBD5E1", linestyle="--", lw=1)
    # Flows
    draw_arrow(ax, 1.2, 3.5, 3.7, 3.5, label="1. Kéo thẻ sang cột DONE", color="#2563EB")
    draw_arrow(ax, 3.7, 3.0, 1.2, 3.0, label="2. Bật Modal nhập kết quả", color="#D97706")
    draw_arrow(ax, 1.2, 2.5, 3.7, 2.5, label="3. Nhập text & nhấn Xác nhận", color="#2563EB")
    draw_arrow(ax, 3.7, 2.0, 6.2, 2.0, label="4. PATCH /api/tasks + result_description", color="#006838")
    draw_arrow(ax, 6.2, 1.5, 8.2, 1.5, label="5. Update D1 & Trigger GDrive Backup", color="#006838")
    draw_arrow(ax, 6.2, 1.0, 3.7, 1.0, label="6. Phản hồi 200 OK + Optimistic Update", color="#2563EB")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_4_3_sequence_kanban_result_modal.png"), dpi=180)
    plt.close()
    print("Done fig 4.3")

    # 4.4 Sequence Kaizen IE Queue
    fig, ax = plt.subplots(figsize=(9, 5), dpi=180)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 5)
    ax.axis('off')
    ax.text(4.5, 4.7, "SƠ ĐỒ TUẦN TỰ: DUYỆT SÁNG KIẾN KAIZEN QUA HÀNG CHỜ KỸ SƯ IE", 
            ha='center', va='center', fontsize=10.5, fontweight='bold', color='#006838')
    cols = [("Tác giả Kaizen", 1.2), ("Hệ thống CI/Kaizen", 3.7), ("Kỹ sư IE (IE Queue)", 6.2), ("Ban Lãnh đạo", 8.2)]
    for name, x in cols:
        draw_box(ax, x-1.0, 3.9, 2.0, 0.5, name, bg_color="#E2E8F0", border_color="#475569", bold=True, fontsize=8)
        ax.plot([x, x], [0.6, 3.9], color="#CBD5E1", linestyle="--", lw=1)
    draw_arrow(ax, 1.2, 3.5, 3.7, 3.5, label="1. Nộp đề xuất cải tiến", color="#2563EB")
    draw_arrow(ax, 3.7, 3.0, 3.7, 2.6, label="2. AI so sánh trùng lặp", color="#D97706")
    draw_arrow(ax, 3.7, 2.4, 6.2, 2.4, label="3. Đưa vào hàng chờ IE Queue", color="#006838")
    draw_arrow(ax, 6.2, 1.9, 3.7, 1.9, label="4. Nhập giây tiết kiệm & xác nhận", color="#059669")
    draw_arrow(ax, 3.7, 1.4, 8.2, 1.4, label="5. Chuyển duyệt khả thi & khen thưởng", color="#2563EB")
    draw_arrow(ax, 8.2, 0.9, 1.2, 0.9, label="6. Thông báo kết quả cho tác giả", color="#006838")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_4_4_sequence_duyet_kaizen_ie_queue.png"), dpi=180)
    plt.close()
    print("Done fig 4.4")

    # 4.5 Sequence MMTB Urgent Repair
    fig, ax = plt.subplots(figsize=(9, 5), dpi=180)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 5)
    ax.axis('off')
    ax.text(4.5, 4.7, "SƠ ĐỒ TUẦN TỰ: XỬ LÝ SỰ CỐ BÁO HỎNG MÁY MMTB KHẨN CẤP", 
            ha='center', va='center', fontsize=10.5, fontweight='bold', color='#006838')
    cols = [("Công nhân chuyền", 1.2), ("Hệ thống MMTB", 3.7), ("Kỹ thuật viên Bảo trì", 6.2), ("Báo cáo BI Downtime", 8.2)]
    for name, x in cols:
        draw_box(ax, x-1.0, 3.9, 2.0, 0.5, name, bg_color="#E2E8F0", border_color="#475569", bold=True, fontsize=8)
        ax.plot([x, x], [0.6, 3.9], color="#CBD5E1", linestyle="--", lw=1)
    draw_arrow(ax, 1.2, 3.5, 3.7, 3.5, label="1. Quét QR báo máy hỏng dừng chuyền", color="#DC2626")
    draw_arrow(ax, 3.7, 3.0, 6.2, 3.0, label="2. Cảnh báo ĐỎ khẩn cấp (Push Ticket)", color="#DC2626")
    draw_arrow(ax, 6.2, 2.5, 3.7, 2.5, label="3. Có mặt Gemba, bấm Nhận Việc (in_progress)", color="#D97706")
    draw_arrow(ax, 6.2, 2.0, 3.7, 2.0, label="4. Khắc phục xong sự cố (completed)", color="#059669")
    draw_arrow(ax, 3.7, 1.4, 8.2, 1.4, label="5. Tính Downtime = Completed - Created", color="#006838")
    draw_arrow(ax, 8.2, 0.9, 3.7, 0.9, label="6. Cập nhật chỉ số MTTA / MTTR / MTTD", color="#2563EB")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_4_5_sequence_sua_chua_khan_cap_mmtb.png"), dpi=180)
    plt.close()
    print("Done fig 4.5")

    # 4.6 Sequence Real-time Backup GDrive
    fig, ax = plt.subplots(figsize=(9, 5), dpi=180)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 5)
    ax.axis('off')
    ax.text(4.5, 4.7, "SƠ ĐỒ TUẦN TỰ: SAO LƯU THỜI GIAN THỰC LÊN GOOGLE DRIVE", 
            ha='center', va='center', fontsize=10.5, fontweight='bold', color='#006838')
    cols = [("User / Action", 1.2), ("Cloudflare Worker", 3.7), ("Google Apps Script WebApp", 6.2), ("Google Drive Storage", 8.2)]
    for name, x in cols:
        draw_box(ax, x-1.0, 3.9, 2.0, 0.5, name, bg_color="#E2E8F0", border_color="#475569", bold=True, fontsize=8)
        ax.plot([x, x], [0.6, 3.9], color="#CBD5E1", linestyle="--", lw=1)
    draw_arrow(ax, 1.2, 3.5, 3.7, 3.5, label="1. Thực hiện thao tác thêm/sửa/xóa", color="#2563EB")
    draw_arrow(ax, 3.7, 3.0, 3.7, 2.6, label="2. Ghi Audit Log kèm Tên CBNV", color="#006838")
    draw_arrow(ax, 3.7, 2.4, 6.2, 2.4, label="3. POST Payload sao lưu đến WebApp", color="#006838")
    draw_arrow(ax, 6.2, 1.9, 8.2, 1.9, label="4. Ghi file .json vào thư mục đích", color="#059669")
    draw_arrow(ax, 6.2, 1.4, 8.2, 1.4, label="5. Chuyển đổi CSV UTF-8 BOM có Tên CBNV", color="#059669")
    draw_arrow(ax, 6.2, 0.9, 3.7, 0.9, label="6. Phản hồi 200 OK: Backup Success", color="#2563EB")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "hinh_4_6_sequence_realtime_backup_gdrive.png"), dpi=180)
    plt.close()
    print("Done fig 4.6")

if __name__ == "__main__":
    gen_fig_1_1()
    gen_fig_1_2()
    gen_fig_2_1()
    gen_fig_2_2()
    gen_fig_3_1()
    gen_fig_3_2()
    gen_fig_3_3()
    gen_fig_3_4_5()
    gen_fig_4_1()
    gen_fig_4_2()
    gen_fig_sequence()
    print("All diagrams generated successfully!")
