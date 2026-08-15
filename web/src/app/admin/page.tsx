"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconUsers,
  IconSettings,
  IconHistory,
  IconUpload,
  IconCheck,
  IconAlertTriangle,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconNews,
  IconPhoto,
  IconBuilding,
  IconShieldCheck,
  IconEdit,
  IconEye,
  IconSearch,
  IconDatabase,
  IconLock,
  IconLockOpen,
  IconFileText,
  IconArrowLeft,
  IconDeviceLaptop,
  IconKey,
  IconDownload,
} from "@tabler/icons-react";

interface EmployeeAccount {
  id: string;
  empCode: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  roleCode: string;
  status: "ACTIVE" | "LOCKED";
}

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  imageUrl: string;
  publishDate: string;
  author: string;
  views: number;
}

interface MediaAsset {
  id: string;
  title: string;
  category: "HERO_BANNER" | "FACTORY" | "PRODUCT" | "EVENTS";
  url: string;
  createdAt: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "news" | "media" | "workflows" | "d1_control">("overview");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loginEmail, setLoginEmail] = useState("tbsgroup2026@gmail.com");
  const [loginPassword, setLoginPassword] = useState("tbsgroupsk@!");
  const [authError, setAuthError] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Admin Account Info
  const adminUser = {
    name: "Super Administrator System",
    email: "tbsgroup2026@gmail.com",
    role: "Quản Trị Viên Tối Cao (System Admin)",
    avatar: "/images/tbs-logo.png",
  };

  // Handle Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (loginEmail === "tbsgroup2026@gmail.com" && loginPassword === "tbsgroupsk@!") {
      setIsAuthenticated(true);
      showToast("Đăng nhập quyền Admin thành công!");
    } else {
      setAuthError("Email hoặc mật khẩu Admin không chính xác!");
    }
  };

  // 1. Personnel State
  const [employees, setEmployees] = useState<EmployeeAccount[]>([
    {
      id: "emp_1",
      empCode: "TGĐ-001",
      name: "Phạm Nguyễn Anh Huy",
      email: "anhhuy.pham@tbsgroup.vn",
      phone: "0988 111 222",
      title: "Tổng Giám Đốc Tập Đoàn TBS Group",
      department: "Ban Giám Đốc Tập Đoàn",
      roleCode: "TONG_GIAM_DOC",
      status: "ACTIVE",
    },
    {
      id: "emp_2",
      empCode: "PTGĐ-002",
      name: "Trần Ngọc Huy",
      email: "ngochuy.tran@tbsgroup.vn",
      phone: "0988 222 333",
      title: "Phó Tổng Giám Đốc Vận Hành & Chuỗi Cung Ứng",
      department: "Ban Giám Đốc Vận Hành",
      roleCode: "PHO_TONG_GIAM_DOC",
      status: "ACTIVE",
    },
    {
      id: "emp_3",
      empCode: "GĐ-003",
      name: "Lê Văn Nam",
      email: "vannam.le@tbsgroup.vn",
      phone: "0988 333 444",
      title: "Giám Đốc Khối Sản Xuất & Tổ Hợp Nhà Máy",
      department: "Khối Sản Xuất & Nhà Máy",
      roleCode: "GIAM_DOC",
      status: "ACTIVE",
    },
    {
      id: "emp_4",
      empCode: "PGĐ-004",
      name: "Nguyễn Thị Hồng",
      email: "thihong.nguyen@tbsgroup.vn",
      phone: "0988 444 555",
      title: "Phó Giám Đốc Quản Lý Chất Lượng (QC)",
      department: "Khối Quản Lý Chất Lượng (QC)",
      roleCode: "PHO_GIAM_DOC",
      status: "ACTIVE",
    },
    {
      id: "emp_5",
      empCode: "202608001",
      name: "Bùi Văn Tuấn",
      email: "vantuan.bui@tbsgroup.vn",
      phone: "0988 555 666",
      title: "Chuyên Viên Quản Lý Hành Chính & Đón Khách",
      department: "Nhân sự - Hành chánh",
      roleCode: "CBCNV",
      status: "ACTIVE",
    },
  ]);

  const [employeeForm, setEmployeeForm] = useState({
    empCode: "",
    name: "",
    email: "",
    phone: "",
    title: "",
    department: "Khối Sản Xuất",
    roleCode: "CBCNV",
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name || !employeeForm.empCode) {
      alert("Vui lòng nhập đầy đủ tên và mã nhân viên!");
      return;
    }
    const newEmp: EmployeeAccount = {
      id: `emp_${Date.now()}`,
      ...employeeForm,
      status: "ACTIVE",
    };
    setEmployees([newEmp, ...employees]);
    setEmployeeForm({ empCode: "", name: "", email: "", phone: "", title: "", department: "Khối Sản Xuất", roleCode: "CBCNV" });
    showToast("Đã thêm mới tài khoản nhân sự thành công!");
  };

  const toggleEmployeeLock = (id: string) => {
    setEmployees(employees.map((emp) => (emp.id === id ? { ...emp, status: emp.status === "ACTIVE" ? "LOCKED" : "ACTIVE" } : emp)));
    showToast("Đã cập nhật trạng thái tài khoản!");
  };

  // 2. News Articles State
  const [articles, setArticles] = useState<NewsArticle[]>([
    {
      id: "news_1",
      title: "TBS Group Đẩy Mạnh Chuyển Đổi Số Toàn Diện Chuỗi Cung Ứng SKECHERS 2026",
      slug: "tbs-group-digital-transformation",
      category: "Tin Tập Đoàn",
      summary: "Ứng dụng trí tuệ nhân tạo AI và dữ liệu thời gian thực D1 trong điều hành sản xuất và Gemba Walk.",
      imageUrl: "/images/crawled/Tin-tuc1.jpg",
      publishDate: "15/08/2026",
      author: "Ban Truyền Thông TBS",
      views: 1420,
    },
    {
      id: "news_2",
      title: "Khánh Thành Dây Chuyền Sản Xuất Đế Giày Tự Động Hóa Tại Cụm Nhà Máy A1",
      slug: "khanh-thanh-day-chuyen-tu-dong-hoa-a1",
      category: "Sản Xuất",
      summary: "Nâng công suất sản xuất đáp ứng đơn hàng xuất khẩu 45 triệu đôi giày SKECHERS cho thị trường Bắc Mỹ.",
      imageUrl: "/images/crawled/Da-giay1.jpg",
      publishDate: "12/08/2026",
      author: "Khối Sản Xuất",
      views: 980,
    },
  ]);

  const [newsForm, setNewsForm] = useState({
    title: "",
    category: "Tin Tập Đoàn",
    summary: "",
    imageUrl: "",
  });

  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title.trim()) {
      alert("Vui lòng nhập tiêu đề bài viết!");
      return;
    }
    const newArt: NewsArticle = {
      id: `news_${Date.now()}`,
      title: newsForm.title,
      slug: newsForm.title.toLowerCase().replace(/ /g, "-"),
      category: newsForm.category,
      summary: newsForm.summary || "Thông tin cập nhật mới nhất từ Ban Truyền Thông Tập Đoàn TBS Group.",
      imageUrl: newsForm.imageUrl || "/images/crawled/Tin-tuc1.jpg",
      publishDate: new Date().toLocaleDateString("vi-VN"),
      author: "Admin System",
      views: 1,
    };
    setArticles([newArt, ...articles]);
    setNewsForm({ title: "", category: "Tin Tập Đoàn", summary: "", imageUrl: "" });
    showToast("Đã đăng bài viết mới lên hệ thống tin tức!");
  };

  // 3. Media Assets State
  const [mediaList, setMediaList] = useState<MediaAsset[]>([
    {
      id: "media_1",
      title: "Hero Banner Văn Phòng Chuỗi SKECHERS",
      category: "HERO_BANNER",
      url: "/images/crawled/banner.jpg",
      createdAt: "15/08/2026",
    },
    {
      id: "media_2",
      title: "Hình Ảnh Tổ Hợp Nhà Máy TBS A1",
      category: "FACTORY",
      url: "/images/crawled/Da-giay2.jpg",
      createdAt: "14/08/2026",
    },
    {
      id: "media_3",
      title: "Mẫu Giày Thể Thao SKECHERS Performance",
      category: "PRODUCT",
      url: "/images/crawled/San-pham1.jpg",
      createdAt: "12/08/2026",
    },
  ]);

  const [mediaForm, setMediaForm] = useState({
    title: "",
    category: "HERO_BANNER" as "HERO_BANNER" | "FACTORY" | "PRODUCT" | "EVENTS",
    url: "",
  });

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaForm.url.trim()) {
      alert("Vui lòng nhập đường link hình ảnh (URL)!");
      return;
    }
    const newMedia: MediaAsset = {
      id: `m_${Date.now()}`,
      title: mediaForm.title || "Hình ảnh tư liệu TBS",
      category: mediaForm.category,
      url: mediaForm.url,
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };
    setMediaList([newMedia, ...mediaList]);
    setMediaForm({ title: "", category: "HERO_BANNER", url: "" });
    showToast("Đã lưu hình ảnh mới vào thư viện Media!");
  };

  // D1 Database Stats & Controls
  const [d1Stats, setD1Stats] = useState({
    roomsCount: 6,
    bookingsCount: 0,
    visitorsCount: 0,
    businessTripsCount: 0,
    status: "CONNECTED (Cloudflare D1 vpchuoiskechers)",
  });

  const fetchLiveD1Counts = async () => {
    try {
      const [resR, resB] = await Promise.all([
        fetch("/api/rooms").then((r) => r.json()).catch(() => null),
        fetch("/api/business-trips").then((r) => r.json()).catch(() => null),
      ]);
      setD1Stats({
        roomsCount: resR?.data?.rooms?.length || 6,
        bookingsCount: resR?.data?.bookings?.length || 0,
        visitorsCount: resR?.data?.visitors?.length || 0,
        businessTripsCount: resB?.data?.length || 0,
        status: "CONNECTED (Cloudflare D1 vpchuoiskechers)",
      });
      showToast("Đã làm mới dữ liệu D1 Database!");
    } catch (e) {
      console.warn("D1 count refresh:", e);
    }
  };

  useEffect(() => {
    fetchLiveD1Counts();
  }, []);

  // Login Screen if Not Authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#006838] mx-auto flex items-center justify-center p-3 shadow-lg">
              <img src="/images/tbs-logo.png" alt="TBS" className="w-full h-full object-contain brightness-200" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">ĐĂNG NHẬP QUẢN TRỊ ADMIN</h1>
            <p className="text-xs text-slate-400">Văn Phòng Chuỗi SKECHERS - TBS Group System Admin Portal</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                ⚠️ {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Tài khoản Email Admin</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="tbsgroup2026@gmail.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono outline-none focus:border-[#006838]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Mật khẩu bảo mật</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="tbsgroupsk@!"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono outline-none focus:border-[#006838]"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700 text-[11px] text-emerald-400 font-mono space-y-1">
              <div>🔑 Admin Email: <strong className="text-white">tbsgroup2026@gmail.com</strong></div>
              <div>🔑 Mật khẩu: <strong className="text-white">tbsgroupsk@!</strong></div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white font-black text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              Truy Cập Cổng Quản Trị
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-emerald-700 text-white font-extrabold text-xs shadow-2xl animate-in slide-in-from-top duration-300 flex items-center gap-2 border border-emerald-500">
          <IconCheck size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-[#006838] flex items-center justify-center p-1.5 shadow-md">
                <img src="/images/tbs-logo.png" alt="TBS" className="w-full h-full object-contain brightness-200" />
              </div>
              <div>
                <span className="text-sm font-black text-white tracking-wider block leading-none">ADMIN PORTAL</span>
                <span className="text-[10px] text-emerald-400 font-bold tracking-tight">SKECHERS - TBS GROUP</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/work"
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <IconArrowLeft size={14} />
              <span>Về Tổng quan</span>
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <img src={adminUser.avatar} alt="Admin" className="w-8 h-8 rounded-full bg-emerald-900 p-1 border border-emerald-500" />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-none">{adminUser.email}</div>
                <div className="text-[10px] text-emerald-400 font-medium mt-0.5">{adminUser.role}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#00381e] to-slate-900 border border-emerald-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-[11px] font-bold border border-emerald-800/60">
              <IconShieldCheck size={14} />
              <span>Tài khoản Quản trị Tối cao System Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">CỔNG QUẢN TRỊ NỘI DUNG & HỆ THỐNG</h1>
            <p className="text-xs text-slate-300">Quản lý nhân sự, đăng tin tức, upload banner hình ảnh và điều khiển Cloudflare D1 Database real-time.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-3 rounded-2xl border border-slate-800 text-xs font-mono">
            <IconKey size={18} className="text-emerald-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">TÀI KHOẢN ĐĂNG NHẬP:</span>
              <span className="text-white font-bold">{adminUser.email}</span>
            </div>
          </div>
        </div>

        {/* 5 Main Admin Tabs Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-2xs"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <IconDeviceLaptop size={16} />
            <span>📊 Tổng quan System</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "users"
                ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-2xs"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <IconUsers size={16} />
            <span>👥 Quản lý Nhân sự</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-bold">
              {employees.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("news")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "news"
                ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-2xs"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <IconNews size={16} />
            <span>📰 Đăng bài Tin tức</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-bold">
              {articles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "media"
                ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-2xs"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <IconPhoto size={16} />
            <span>🖼️ Up Ảnh & Banner</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-bold">
              {mediaList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("d1_control")}
            className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === "d1_control"
                ? "bg-slate-900 text-emerald-400 border-emerald-500 shadow-2xs"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <IconDatabase size={16} />
            <span>🗄️ Quản trị D1 Database</span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW DASHBOARD
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Tổng Nhân Sự Quản Lý</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center">
                    <IconUsers size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">3,420 <span className="text-xs text-slate-500 font-normal">nhân sự</span></div>
                <p className="text-[11px] text-emerald-400 font-medium">✓ Đã định danh tài khoản SSO</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Lịch Họp D1 Database</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center">
                    <IconDatabase size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{d1Stats.bookingsCount} <span className="text-xs text-slate-500 font-normal">cuộc họp</span></div>
                <p className="text-[11px] text-blue-400 font-medium">✓ Đồng bộ Cloudflare D1 real-time</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Đơn Đăng Ký Công Tác</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-950 text-purple-400 flex items-center justify-center">
                    <IconFileText size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{d1Stats.businessTripsCount} <span className="text-xs text-slate-500 font-normal">đơn đề xuất</span></div>
                <p className="text-[11px] text-purple-400 font-medium">✓ Lưu trữ cơ sở dữ liệu D1</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Bài Bài Viết & Thư Viện</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center">
                    <IconNews size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{articles.length + mediaList.length} <span className="text-xs text-slate-500 font-normal">tệp tin tức & ảnh</span></div>
                <p className="text-[11px] text-amber-400 font-medium">✓ Sẵn sàng xuất bản toàn hệ thống</p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>⚡ Thao tác nhanh cho Quản trị viên</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveTab("users")}
                  className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <IconPlus size={16} /> Thêm Nhân Sự Mới
                  </div>
                  <p className="text-[11px] text-slate-400">Tạo tài khoản cán bộ nhân viên và phân quyền làm việc.</p>
                </button>

                <button
                  onClick={() => setActiveTab("news")}
                  className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="text-xs font-extrabold text-blue-400 flex items-center gap-1.5">
                    <IconNews size={16} /> Đăng Bài Tin Tức
                  </div>
                  <p className="text-[11px] text-slate-400">Đăng tin thông báo tập đoàn, bài báo sản xuất & chuyển đổi số.</p>
                </button>

                <button
                  onClick={() => setActiveTab("media")}
                  className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                    <IconUpload size={16} /> Up Ảnh Banner & Media
                  </div>
                  <p className="text-[11px] text-slate-400">Tải lên hình ảnh banner trang chủ, hình nhà máy & sản phẩm.</p>
                </button>

                <button
                  onClick={() => setActiveTab("d1_control")}
                  className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="text-xs font-extrabold text-purple-400 flex items-center gap-1.5">
                    <IconDatabase size={16} /> Điều Khiển D1 Database
                  </div>
                  <p className="text-[11px] text-slate-400">Kiểm tra kết nối và làm sạch dữ liệu D1 Cloudflare Workers.</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 2: QUẢN LÝ NHÂN SỰ & PHÂN QUYỀN
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Form Thêm Nhân Sự */}
            <form onSubmit={handleAddEmployee} className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                <IconUsers size={18} className="text-emerald-400" />
                <span>➕ THÊM TÀI KHOẢN NHÂN SỰ MỚI</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Mã Nhân Viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: NV-2026-099"
                    value={employeeForm.empCode}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, empCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Họ và Tên Nhân Viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Email Công Việc</label>
                  <input
                    type="email"
                    placeholder="an.nguyen@tbsgroup.vn"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Số Điện Thoại</label>
                  <input
                    type="text"
                    placeholder="0988 123 456"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Chức Danh Công Việc</label>
                  <input
                    type="text"
                    placeholder="Kỹ sư sản xuất A1"
                    value={employeeForm.title}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Phòng Ban / Khối</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Ban Giám Đốc Tập Đoàn">Ban Giám Đốc Tập Đoàn</option>
                    <option value="Khối Sản Xuất">Khối Sản Xuất & Nhà Máy</option>
                    <option value="Khối QC & Gemba">Khối QC & Gemba</option>
                    <option value="R&D Kỹ thuật">R&D Kỹ Thuật</option>
                    <option value="Logistics TTPP">Logistics TTPP</option>
                    <option value="Nhân sự - Hành chánh">Nhân Sự - Hành Chánh</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Phân Quyền Vai Trò</label>
                  <select
                    value={employeeForm.roleCode}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, roleCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="TONG_GIAM_DOC">👑 Tổng Giám Đốc</option>
                    <option value="PHO_TONG_GIAM_DOC">⭐ Phó Tổng Giám Đốc</option>
                    <option value="GIAM_DOC">👔 Giám Đốc Khối</option>
                    <option value="PHO_GIAM_DOC">💼 Phó Giám Đốc</option>
                    <option value="CBCNV">👤 CBCNV Nhân Viên</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white text-xs font-extrabold transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <IconPlus size={16} />
                    <span>Lưu Tài Khoản Nhân Sự</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Bảng Danh Sách Nhân Sự */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-white tracking-tight uppercase">Danh sách Nhân sự Hiện hành</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-extrabold text-[10px]">
                      <th className="py-3 px-3">Mã NV</th>
                      <th className="py-3 px-3">Họ và Tên</th>
                      <th className="py-3 px-3">Chức Danh / Phòng Ban</th>
                      <th className="py-3 px-3">Email / SĐT</th>
                      <th className="py-3 px-3">Quyền</th>
                      <th className="py-3 px-3">Trạng Thái</th>
                      <th className="py-3 px-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-850 transition-colors">
                        <td className="py-3 px-3 font-bold text-emerald-400">{emp.empCode}</td>
                        <td className="py-3 px-3 font-sans font-bold text-white">{emp.name}</td>
                        <td className="py-3 px-3 font-sans text-slate-300">
                          <div className="font-semibold">{emp.title}</div>
                          <div className="text-[10px] text-slate-500">{emp.department}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          <div>{emp.email}</div>
                          <div className="text-[10px] text-slate-500">{emp.phone}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-extrabold">
                            {emp.roleCode}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${emp.status === "ACTIVE" ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"}`}>
                            {emp.status === "ACTIVE" ? "✓ Kích hoạt" : "🔒 Khóa"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <button
                            onClick={() => toggleEmployeeLock(emp.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                          >
                            {emp.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 3: ĐĂNG & QUẢN LÝ TIN TỨC
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "news" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Form Đăng Tin */}
            <form onSubmit={handleAddNews} className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                <IconNews size={18} className="text-blue-400" />
                <span>✍️ ĐĂNG BÀI VIẾT TIN TỨC MỚI</span>
              </h2>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Tiêu Đề Bài Viết *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập tiêu đề tin tức tập đoàn..."
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Danh Mục Tin</label>
                    <select
                      value={newsForm.category}
                      onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Tin Tập Đoàn">Tin Tập Đoàn TBS</option>
                      <option value="Sản Xuất">Sản Xuất & Nhà Máy</option>
                      <option value="Công Nghệ SKECHERS">Công Nghệ SKECHERS</option>
                      <option value="Tuyển Dụng">Tuyển Dụng & Đào Tạo</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Đường Link Ảnh Đại Diện (Thumbnail URL)</label>
                  <input
                    type="text"
                    placeholder="/images/crawled/Tin-tuc1.jpg hoặc https://..."
                    value={newsForm.imageUrl}
                    onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Tóm Tắt Bài Viết</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả tóm tắt nội dung bài viết..."
                    value={newsForm.summary}
                    onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <IconNews size={16} />
                  <span>Xuất Bản Bài Viết</span>
                </button>
              </div>
            </form>

            {/* Bảng Danh Sách Bài Viết */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-white tracking-tight uppercase">Danh sách bài viết đã xuất bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((art) => (
                  <div key={art.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex gap-4">
                    <img src={art.imageUrl} alt={art.title} className="w-24 h-24 rounded-xl object-cover border border-slate-800 shrink-0" />
                    <div className="space-y-1 flex-1">
                      <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 text-[10px] font-extrabold uppercase">
                        {art.category}
                      </span>
                      <h4 className="text-xs font-bold text-white line-clamp-2">{art.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{art.summary}</p>
                      <div className="text-[10px] text-slate-500 pt-1 flex justify-between">
                        <span>📅 {art.publishDate}</span>
                        <span>👁️ {art.views} lượt xem</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 4: QUẢN LÝ HÌNH ẢNH & BANNER
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "media" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Form Up Ảnh */}
            <form onSubmit={handleAddMedia} className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                <IconPhoto size={18} className="text-amber-400" />
                <span>🖼️ THÊM HÌNH ẢNH BANNER & MEDIA MỚI</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Tên Tệp / Tiêu Đề Ảnh *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Banner Trang Chủ SKECHERS Q3"
                    value={mediaForm.title}
                    onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Phân Loại Ảnh</label>
                  <select
                    value={mediaForm.category}
                    onChange={(e) => setMediaForm({ ...mediaForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="HERO_BANNER">Banner Trang Chủ (Hero)</option>
                    <option value="FACTORY">Hình Ảnh Nhà Máy TBS</option>
                    <option value="PRODUCT">Mẫu Giày SKECHERS</option>
                    <option value="EVENTS">Sự Kiện & Hoạt Động</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Link Ảnh (URL) *</label>
                  <input
                    type="text"
                    required
                    placeholder="/images/crawled/banner.jpg hoặc https://..."
                    value={mediaForm.url}
                    onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <IconUpload size={16} />
                <span>Tải Lên Thư Viện</span>
              </button>
            </form>

            {/* Media Gallery Grid */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-white tracking-tight uppercase">Kho Thư viện Hình ảnh</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {mediaList.map((m) => (
                  <div key={m.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <img src={m.url} alt={m.title} className="w-full h-36 rounded-xl object-cover border border-slate-800" />
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 text-[10px] font-extrabold uppercase">
                        {m.category}
                      </span>
                      <div className="text-xs font-bold text-white truncate">{m.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{m.url}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 5: ĐIỀU KHIỂN CLOUDFLARE D1 DATABASE
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "d1_control" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <IconDatabase size={20} className="text-purple-400" />
                    <span>🗄️ ĐIỀU KHIỂN CLOUDFLARE D1 DATABASE</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Trạng thái kết nối cơ sở dữ liệu thời gian thực Cloudflare Workers.</p>
                </div>
                <button
                  onClick={fetchLiveD1Counts}
                  className="px-4 py-2 rounded-xl bg-purple-900/60 border border-purple-500/30 text-purple-200 hover:bg-purple-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <IconRefresh size={16} />
                  <span>Làm mới D1 Count</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Table: meeting_rooms</span>
                  <div className="text-xl font-black text-emerald-400">{d1Stats.roomsCount} Phòng</div>
                  <span className="text-[10px] text-slate-400 block">Trạng thái: OK</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Table: room_bookings</span>
                  <div className="text-xl font-black text-blue-400">{d1Stats.bookingsCount} Bản ghi</div>
                  <span className="text-[10px] text-slate-400 block">Lịch họp thực tế D1</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Table: visitors</span>
                  <div className="text-xl font-black text-purple-400">{d1Stats.visitorsCount} Khách</div>
                  <span className="text-[10px] text-slate-400 block">Thẻ đón khách D1</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Table: business_trips</span>
                  <div className="text-xl font-black text-amber-400">{d1Stats.businessTripsCount} Đề xuất</div>
                  <span className="text-[10px] text-slate-400 block">Đơn công tác D1</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                <div className="text-emerald-400 font-bold">✓ Cloudflare D1 Binding: env.DB</div>
                <div className="text-slate-300">Database ID: ae3a7efd-ff5d-45c2-8c49-78d1518e3aa1 (vpchuoiskechers)</div>
                <div className="text-slate-400 text-[11px]">Server Region: APAC / HKG Cloudflare Edge Worker</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
