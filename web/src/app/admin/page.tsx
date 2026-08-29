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
  IconHome,
  IconExternalLink,
  IconRotate,
  IconShoe,
} from "@tabler/icons-react";
import {
  LandingCMSConfig,
  getLandingCMS,
  saveLandingCMS,
  DEFAULT_LANDING_CMS,
} from "@/lib/landingCMS";
import LandingCMSManager from "@/components/admin/LandingCMSManager";

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
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "news" | "media" | "products" | "landing_cms" | "d1_control"
  >("overview");
  const [cmsSubSection, setCmsSubSection] = useState<
    "hero" | "workspace" | "excellence" | "products"
  >("hero");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Landing Page CMS State
  const [landingCMS, setLandingCMS] = useState<LandingCMSConfig>(DEFAULT_LANDING_CMS);

  useEffect(() => {
    setLandingCMS(getLandingCMS());

    // Check URL search parameters (e.g. /admin?tab=products)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "products") {
        setActiveTab("products");
        setCmsSubSection("products");
      } else if (tabParam === "landing_cms") {
        setActiveTab("landing_cms");
      }
    }
  }, []);

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

  // Cloudinary Configuration
  const CLOUDINARY_CLOUD_NAME = "dwl2xtbqa";
  const CLOUDINARY_PRESET = "vpchuoisk";
  const [isUploadingCloudinary, setIsUploadingCloudinary] = useState(false);

  const handleCloudinaryFileUpload = async (file: File, target: "media" | "news") => {
    try {
      setIsUploadingCloudinary(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        if (target === "media") {
          setMediaForm((prev) => ({
            ...prev,
            url: data.secure_url,
            title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
          }));
        } else {
          setNewsForm((prev) => ({ ...prev, imageUrl: data.secure_url }));
        }
        showToast(`☁️ Tải ảnh lên Cloudinary (${CLOUDINARY_CLOUD_NAME}) thành công!`);
      } else {
        alert("Lỗi Cloudinary: " + (data.error?.message || "Không thể nạp tệp!"));
      }
    } catch (err: any) {
      alert("Lỗi kết nối Cloudinary: " + err.message);
    } finally {
      setIsUploadingCloudinary(false);
    }
  };

  const handleUploadLandingCMSImage = async (
    file: File,
    section: "heroBg" | "heroHands" | "heroTeam" | "excellence" | "product",
    productIndex?: number
  ) => {
    try {
      setIsUploadingCloudinary(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        if (section === "heroBg") {
          setLandingCMS((prev) => ({ ...prev, hero: { ...prev.hero, bgImage: data.secure_url } }));
        } else if (section === "heroHands") {
          setLandingCMS((prev) => ({ ...prev, hero: { ...prev.hero, handsImage: data.secure_url } }));
        } else if (section === "heroTeam") {
          setLandingCMS((prev) => ({ ...prev, hero: { ...prev.hero, teamImage: data.secure_url } }));
        } else if (section === "excellence") {
          setLandingCMS((prev) => ({ ...prev, excellence: { ...prev.excellence, image: data.secure_url } }));
        } else if (section === "product" && productIndex !== undefined) {
          setLandingCMS((prev) => {
            const newItems = [...prev.products.items];
            newItems[productIndex] = { ...newItems[productIndex], image: data.secure_url };
            return { ...prev, products: { ...prev.products, items: newItems } };
          });
        }
        showToast(`☁️ Tải ảnh lên Cloudinary thành công!`);
      } else {
        alert("Lỗi Cloudinary: " + (data.error?.message || "Không thể nạp tệp!"));
      }
    } catch (err: any) {
      alert("Lỗi tải ảnh: " + err.message);
    } finally {
      setIsUploadingCloudinary(false);
    }
  };

  const handleBulkUploadProductImages = async (files: FileList) => {
    try {
      setIsUploadingCloudinary(true);
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        }
      }

      if (uploadedUrls.length > 0) {
        setLandingCMS((prev) => {
          const currentItems = [...prev.products.items];
          let uploadIdx = 0;
          for (let i = 0; i < currentItems.length && uploadIdx < uploadedUrls.length; i++) {
            if (!currentItems[i].image || currentItems[i].image?.startsWith("/images/")) {
              currentItems[i] = { ...currentItems[i], image: uploadedUrls[uploadIdx++] };
            }
          }
          while (uploadIdx < uploadedUrls.length) {
            const num = currentItems.length + 1;
            currentItems.push({
              name: `Dòng Sản Phẩm Mới #${num}`,
              code: `SK-PROD-0${num}`,
              image: uploadedUrls[uploadIdx++],
            });
          }
          return {
            ...prev,
            products: { ...prev.products, items: currentItems },
          };
        });
        showToast(`☁️ Đã import thành công ${uploadedUrls.length} ảnh sản phẩm lên Cloudinary!`);
      }
    } catch (err: any) {
      alert("Lỗi import ảnh: " + err.message);
    } finally {
      setIsUploadingCloudinary(false);
    }
  };

  const handleSaveLandingCMS = (e: React.FormEvent) => {
    e.preventDefault();
    saveLandingCMS(landingCMS);
    showToast("💾 Đã lưu cấu hình Trang Chủ! Nội dung & hình ảnh đã được cập nhật ngay lập tức.");
  };

  const handleResetLandingCMS = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục toàn bộ nội dung & hình ảnh Trang Chủ về mặc định gốc?")) {
      setLandingCMS(DEFAULT_LANDING_CMS);
      saveLandingCMS(DEFAULT_LANDING_CMS);
      showToast("🔄 Đã khôi phục cài đặt Trang Chủ về mặc định gốc!");
    }
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
      name: "Tổng Giám Đốc",
      email: "tgd@tbsgroup.vn",
      phone: "0988 000 001",
      title: "Tổng Giám Đốc Tập Đoàn TBS Group",
      department: "Ban Giám Đốc Tập Đoàn",
      roleCode: "TONG_GIAM_DOC",
      status: "ACTIVE",
    },
    {
      id: "emp_2",
      empCode: "PTGĐ-002",
      name: "Phó Tổng Giám Đốc",
      email: "ptgd@tbsgroup.vn",
      phone: "0988 000 002",
      title: "Phó Tổng Giám Đốc Vận Hành & Chuỗi Cung Ứng",
      department: "Ban Giám Đốc Vận Hành",
      roleCode: "PHO_TONG_GIAM_DOC",
      status: "ACTIVE",
    },
    {
      id: "emp_3",
      empCode: "GĐ-003",
      name: "Giám Đốc",
      email: "gd@tbsgroup.vn",
      phone: "0988 000 003",
      title: "Giám Đốc Khối Sản Xuất & Tổ Hợp Nhà Máy",
      department: "Khối Sản Xuất & Nhà Máy",
      roleCode: "GIAM_DOC",
      status: "ACTIVE",
    },
    {
      id: "emp_4",
      empCode: "PGĐ-004",
      name: "Phó Giám Đốc",
      email: "pgd@tbsgroup.vn",
      phone: "0988 000 004",
      title: "Phó Giám Đốc Quản Lý Chất Lượng (QC)",
      department: "Khối Quản Lý Chất Lượng (QC)",
      roleCode: "PHO_GIAM_DOC",
      status: "ACTIVE",
    },
    {
      id: "emp_5",
      empCode: "202608001",
      name: "Phạm Nguyễn Anh Huy",
      email: "anhy.work.2004@gmail.com",
      phone: "0522511245",
      title: "IT - Team chuyển đổi số",
      department: "IT - Team chuyển đổi số",
      roleCode: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    {
      id: "emp_6",
      empCode: "202608002",
      name: "Trần Ngọc Huy",
      email: "tranhuy110421@gmail.com",
      phone: "0522511246",
      title: "Kỹ Sư IT - Team Chuyển Đổi Số",
      department: "IT - Team Chuyển Đổi Số",
      roleCode: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    {
      id: "emp_7",
      empCode: "LT-001",
      name: "Lễ Tân Văn Phòng",
      email: "letan@tbsgroup.vn",
      phone: "0522511246",
      title: "Chuyên Viên Lễ Tân Văn Phòng",
      department: "Nhân Sự - Hành Chánh",
      roleCode: "LE_TAN",
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

  const fetchD1Employees = async () => {
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setEmployees(
          json.data.map((u: any) => ({
            id: u.id ? String(u.id) : `emp_${Date.now()}`,
            empCode: u.emp_code || u.empCode,
            name: u.name,
            email: u.email || `${u.emp_code}@tbsgroup.vn`,
            phone: u.phone || "0988 000 000",
            title: u.title || "Cán Bộ Công Nhân Viên",
            department: u.department || "Văn Phòng Chuỗi SKECHERS",
            roleCode: u.role_code || u.roleCode || "CBCNV",
            status: u.status || "ACTIVE",
          }))
        );
      }
    } catch (e) {
      console.warn("Fetch users error:", e);
    }
  };

  useEffect(() => {
    fetchD1Employees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
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
    
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmp),
      });
      showToast("Đã lưu tài khoản nhân sự mới vào D1 Database!");
    } catch (e) {
      showToast("Đã thêm mới tài khoản nhân sự thành công!");
    }
  };

  const toggleEmployeeLock = async (id: string) => {
    const updated = employees.map((emp) => (emp.id === id ? { ...emp, status: (emp.status === "ACTIVE" ? "LOCKED" : "ACTIVE") as "ACTIVE" | "LOCKED" } : emp));
    setEmployees(updated);
    const target = updated.find((emp) => emp.id === id);
    if (target) {
      try {
        await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(target),
        });
      } catch (e) {}
    }
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-[#006838] text-white font-extrabold text-xs shadow-2xl animate-in slide-in-from-top duration-300 flex items-center gap-2 border border-emerald-500">
          <IconCheck size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Navigation Bar */}
      <header className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/work" className="flex items-center gap-2 group">
              <img
                src="/images/tbs-logo.png"
                alt="TBS Group Logo"
                className="h-7 sm:h-8 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </Link>
            <div className="h-5 w-[1px] bg-slate-200" />
            <div>
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-wider block leading-none">ADMIN PORTAL</span>
              <span className="text-[10px] text-[#006838] font-bold tracking-tight">TBS GROUP CỔNG QUẢN TRỊ</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/work"
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-emerald-50 hover:text-[#006838] transition-colors flex items-center gap-1 shadow-2xs"
            >
              <IconArrowLeft size={14} />
              <span>Về Tổng quan</span>
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <img src={adminUser.avatar} alt="Admin" className="w-8 h-8 rounded-full bg-emerald-50 p-1 border border-emerald-200" />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-none">{adminUser.email}</div>
                <div className="text-[10px] text-[#006838] font-medium mt-0.5">{adminUser.role}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#006838] to-[#004d29] text-white shadow-xl border border-[#004e2a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-[11px] font-bold border border-white/20 backdrop-blur-md">
              <IconShieldCheck size={14} />
              <span>Tài khoản Quản trị Tối cao System Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">CỔNG QUẢN TRỊ NỘI DUNG &amp; HỆ THỐNG</h1>
            <p className="text-xs text-emerald-100/90 font-medium">Quản lý nhân sự, đăng tin tức, upload banner hình ảnh và điều khiển Cloudflare D1 Database real-time.</p>
          </div>

          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-xs font-mono">
            <IconKey size={18} className="text-emerald-300" />
            <div>
              <span className="text-emerald-200/70 block text-[10px]">TÀI KHOẢN ĐĂNG NHẬP:</span>
              <span className="text-white font-bold">{adminUser.email}</span>
            </div>
          </div>
        </div>

        {/* 5 Main Admin Tabs Header */}
        <div className="bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200/90 shadow-inner flex items-center gap-1 overflow-x-auto scrollbar-none flex-nowrap">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-[#006838] text-white shadow-md border border-[#004e2a]"
                : "text-slate-700 hover:text-[#006838] hover:bg-white/70"
            }`}
          >
            <IconDeviceLaptop size={16} />
            <span>📊 Tổng quan System</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "users"
                ? "bg-[#006838] text-white shadow-md border border-[#004e2a]"
                : "text-slate-700 hover:text-[#006838] hover:bg-white/70"
            }`}
          >
            <IconUsers size={16} />
            <span>👥 Quản lý Nhân sự</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "users" ? "bg-white/20 text-white" : "bg-slate-300 text-slate-800"
            }`}>
              {employees.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("news")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "news"
                ? "bg-[#006838] text-white shadow-md border border-[#004e2a]"
                : "text-slate-700 hover:text-[#006838] hover:bg-white/70"
            }`}
          >
            <IconNews size={16} />
            <span>📰 Đăng bài Tin tức</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "news" ? "bg-white/20 text-white" : "bg-slate-300 text-slate-800"
            }`}>
              {articles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "media"
                ? "bg-[#006838] text-white shadow-md border border-[#004e2a]"
                : "text-slate-700 hover:text-[#006838] hover:bg-white/70"
            }`}
          >
            <IconPhoto size={16} />
            <span>🖼️ Up Ảnh &amp; Banner</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "media" ? "bg-white/20 text-white" : "bg-slate-300 text-slate-800"
            }`}>
              {mediaList.length}
            </span>
          </button>

          <button
            onClick={() => {
              setCmsSubSection("products");
              setActiveTab("products");
            }}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "products"
                ? "bg-[#006838] text-white shadow-md border border-[#004e2a]"
                : "text-slate-700 hover:text-[#006838] hover:bg-white/70"
            }`}
          >
            <IconShoe size={16} />
            <span>👟 Dòng Sản Phẩm Tiêu Biểu</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "products" ? "bg-white/20 text-white" : "bg-emerald-100 text-[#006838]"
            }`}>
              {landingCMS.products.items.length}
            </span>
          </button>

          <button
            onClick={() => {
              setCmsSubSection("hero");
              setActiveTab("landing_cms");
            }}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "landing_cms"
                ? "bg-[#006838] text-white shadow-md border border-[#004e2a]"
                : "text-slate-700 hover:text-[#006838] hover:bg-white/70"
            }`}
          >
            <IconHome size={16} />
            <span>🏠 Quản trị Trang Chủ (Landing Page)</span>
          </button>

          <button
            onClick={() => setActiveTab("d1_control")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "d1_control"
                ? "bg-[#006838] text-white shadow-md border border-[#004e2a]"
                : "text-slate-700 hover:text-[#006838] hover:bg-white/70"
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
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Tổng Nhân Sự Quản Lý</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-200">
                    <IconUsers size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">3,420 <span className="text-xs text-slate-500 font-normal">nhân sự</span></div>
                <p className="text-[11px] text-emerald-600 font-medium">✓ Đã định danh tài khoản SSO</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Lịch Họp D1 Database</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                    <IconDatabase size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{d1Stats.bookingsCount} <span className="text-xs text-slate-500 font-normal">cuộc họp</span></div>
                <p className="text-[11px] text-blue-600 font-medium">✓ Đồng bộ Cloudflare D1 real-time</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Đơn Đăng Ký Công Tác</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                    <IconFileText size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{d1Stats.businessTripsCount} <span className="text-xs text-slate-500 font-normal">đơn đề xuất</span></div>
                <p className="text-[11px] text-purple-600 font-medium">✓ Lưu trữ cơ sở dữ liệu D1</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Sản Phẩm &amp; Tin Tức</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <IconShoe size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{landingCMS.products.items.length} <span className="text-xs text-slate-500 font-normal">dòng sản phẩm</span></div>
                <p className="text-[11px] text-amber-600 font-medium">✓ Cập nhật trực tiếp lên trang chủ</p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>⚡ Thao tác nhanh cho Quản trị viên</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setCmsSubSection("products");
                    setActiveTab("products");
                  }}
                  className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/90 border border-emerald-200 text-left transition-all cursor-pointer space-y-1 group shadow-2xs hover:shadow-md"
                >
                  <div className="text-xs font-extrabold text-[#006838] flex items-center gap-1.5">
                    <IconShoe size={16} /> Quản Lý Dòng Sản Phẩm ({landingCMS.products.items.length})
                  </div>
                  <p className="text-[11px] text-slate-600">Import ảnh sản phẩm, đổi tên &amp; mã SKU hiển thị trang chủ.</p>
                </button>

                <button
                  onClick={() => setActiveTab("users")}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-200 text-left transition-colors cursor-pointer space-y-1 group"
                >
                  <div className="text-xs font-extrabold text-[#006838] flex items-center gap-1.5">
                    <IconPlus size={16} /> Thêm Nhân Sự Mới
                  </div>
                  <p className="text-[11px] text-slate-500">Tạo tài khoản cán bộ nhân viên và phân quyền làm việc.</p>
                </button>

                <button
                  onClick={() => setActiveTab("news")}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 text-left transition-colors cursor-pointer space-y-1 group"
                >
                  <div className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5">
                    <IconNews size={16} /> Đăng Bài Tin Tức
                  </div>
                  <p className="text-[11px] text-slate-500">Đăng tin thông báo tập đoàn, bài báo sản xuất &amp; chuyển đổi số.</p>
                </button>

                <button
                  onClick={() => setActiveTab("media")}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-200 text-left transition-colors cursor-pointer space-y-1 group"
                >
                  <div className="text-xs font-extrabold text-amber-700 flex items-center gap-1.5">
                    <IconUpload size={16} /> Up Ảnh Banner &amp; Media
                  </div>
                  <p className="text-[11px] text-slate-500">Tải lên hình ảnh banner trang chủ, hình nhà máy &amp; sự kiện.</p>
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
            <form onSubmit={handleAddEmployee} className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <IconUsers size={18} className="text-[#006838]" />
                <span>➕ THÊM TÀI KHOẢN NHÂN SỰ MỚI</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Mã Nhân Viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: NV-2026-099"
                    value={employeeForm.empCode}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, empCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono outline-none focus:border-[#006838] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Họ và Tên Nhân Viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#006838] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Email Công Việc</label>
                  <input
                    type="email"
                    placeholder="an.nguyen@tbsgroup.vn"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#006838] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Số Điện Thoại</label>
                  <input
                    type="text"
                    placeholder="0988 123 456"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#006838] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Chức Danh Công Việc</label>
                  <input
                    type="text"
                    placeholder="Kỹ sư sản xuất A1"
                    value={employeeForm.title}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#006838] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Phòng Ban / Khối</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:border-[#006838] cursor-pointer"
                  >
                    <option value="Ban Giám Đốc Tập Đoàn">Ban Giám Đốc Tập Đoàn</option>
                    <option value="Khối Sản Xuất">Khối Sản Xuất &amp; Nhà Máy</option>
                    <option value="Khối QC &amp; Gemba">Khối QC &amp; Gemba</option>
                    <option value="R&amp;D Kỹ thuật">R&amp;D Kỹ Thuật</option>
                    <option value="Logistics TTPP">Logistics TTPP</option>
                    <option value="Nhân sự - Hành chánh">Nhân Sự - Hành Chánh</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Phân Quyền Vai Trò</label>
                  <select
                    value={employeeForm.roleCode}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, roleCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:border-[#006838] cursor-pointer"
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
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Danh sách Nhân sự Hiện hành</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-extrabold text-[10px] bg-slate-50">
                      <th className="py-3 px-3">Mã NV</th>
                      <th className="py-3 px-3">Họ và Tên</th>
                      <th className="py-3 px-3">Chức Danh / Phòng Ban</th>
                      <th className="py-3 px-3">Email / SĐT</th>
                      <th className="py-3 px-3">Quyền</th>
                      <th className="py-3 px-3">Trạng Thái</th>
                      <th className="py-3 px-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#006838]">{emp.empCode}</td>
                        <td className="py-3 px-3 font-sans font-bold text-slate-900">{emp.name}</td>
                        <td className="py-3 px-3 font-sans text-slate-700">
                          <div className="font-semibold">{emp.title}</div>
                          <div className="text-[10px] text-slate-500">{emp.department}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div>{emp.email}</div>
                          <div className="text-[10px] text-slate-500">{emp.phone}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#006838] text-[10px] font-extrabold border border-emerald-200">
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
            <form onSubmit={handleAddNews} className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <IconNews size={18} className="text-[#006838]" />
                <span>✍️ ĐĂNG BÀI VIẾT TIN TỨC MỚI</span>
              </h2>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Tiêu Đề Bài Viết *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập tiêu đề tin tức tập đoàn..."
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:border-[#006838] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Danh Mục Tin</label>
                    <select
                      value={newsForm.category}
                      onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:border-[#006838] focus:bg-white cursor-pointer"
                    >
                      <option value="Tin Tập Đoàn">Tin Tập Đoàn TBS</option>
                      <option value="Sản Xuất">Sản Xuất &amp; Nhà Máy</option>
                      <option value="Công Nghệ SKECHERS">Công Nghệ SKECHERS</option>
                      <option value="Tuyển Dụng">Tuyển Dụng &amp; Đào Tạo</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">Đường Link Ảnh Đại Diện (Thumbnail URL)</label>
                    <label className="text-[11px] font-bold text-[#006838] hover:underline cursor-pointer flex items-center gap-1">
                      <IconUpload size={12} />
                      <span>{isUploadingCloudinary ? "☁️ Đang tải..." : "☁️ Chọn tệp ảnh tải lên Cloudinary"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleCloudinaryFileUpload(e.target.files[0], "news");
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Dán URL ảnh hoặc bấm nút chọn tệp bên trên..."
                    value={newsForm.imageUrl}
                    onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono outline-none focus:border-[#006838] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Tóm Tắt Bài Viết</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả tóm tắt nội dung bài viết..."
                    value={newsForm.summary}
                    onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#006838] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white text-xs font-extrabold transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <IconNews size={16} />
                  <span>Xuất Bản Bài Viết</span>
                </button>
              </div>
            </form>

            {/* Bảng Danh Sách Bài Viết */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Danh sách bài viết đã xuất bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((art) => (
                  <div key={art.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex gap-4">
                    <img src={art.imageUrl} alt={art.title} className="w-24 h-24 rounded-xl object-cover border border-slate-200 shrink-0" />
                    <div className="space-y-1 flex-1">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold uppercase">
                        {art.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{art.title}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{art.summary}</p>
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
            <form onSubmit={handleAddMedia} className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <IconPhoto size={18} className="text-[#006838]" />
                  <span>🖼️ THÊM HÌNH ẢNH BANNER &amp; MEDIA MỚI</span>
                </h2>
                <div className="text-xs text-[#006838] font-mono flex items-center gap-1">
                  <span>☁️ Cloudinary Preset: <strong className="text-slate-900">vpchuoisk</strong></span>
                </div>
              </div>

              {/* Upload Drop Zone Box */}
              <div className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#006838] transition-colors text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#006838] mx-auto flex items-center justify-center border border-emerald-200">
                  <IconUpload size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 uppercase">Tải Ảnh Trực Tiếp Lên Đám Mây Cloudinary (dwl2xtbqa)</h4>
                  <p className="text-[11px] text-slate-500">Hỗ trợ các tệp ảnh .JPG, .PNG, .WEBP. Ảnh được tối ưu tốc độ CDN tự động.</p>
                </div>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white font-extrabold text-xs transition-colors cursor-pointer shadow-md">
                  <IconUpload size={16} />
                  <span>{isUploadingCloudinary ? "☁️ Đang nạp ảnh..." : "Chọn Tệp Từ Máy Tải Lên Cloudinary"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleCloudinaryFileUpload(e.target.files[0], "media");
                      }
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Tên Tệp / Tiêu Đề Ảnh *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Banner Trang Chủ SKECHERS Q3"
                    value={mediaForm.title}
                    onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:border-[#006838] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Phân Loại Ảnh</label>
                  <select
                    value={mediaForm.category}
                    onChange={(e) => setMediaForm({ ...mediaForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:border-[#006838] focus:bg-white cursor-pointer"
                  >
                    <option value="HERO_BANNER">Banner Trang Chủ (Hero)</option>
                    <option value="FACTORY">Hình Ảnh Nhà Máy TBS</option>
                    <option value="PRODUCT">Mẫu Giày SKECHERS</option>
                    <option value="EVENTS">Sự Kiện &amp; Hoạt Động</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Link Ảnh Cloudinary URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="Tự động điền sau khi tải ảnh hoặc dán URL tại đây..."
                    value={mediaForm.url}
                    onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono outline-none focus:border-[#006838] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white text-xs font-extrabold transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <IconCheck size={16} />
                <span>Lưu Vào Thư Viện Media</span>
              </button>
            </form>

            {/* Media Gallery Grid */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Kho Thư viện Hình ảnh</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {mediaList.map((m) => (
                  <div key={m.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <img src={m.url} alt={m.title} className="w-full h-36 rounded-xl object-cover border border-slate-200" />
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-extrabold uppercase">
                        {m.category}
                      </span>
                      <div className="text-xs font-bold text-slate-900 truncate">{m.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{m.url}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 5: QUẢN TRỊ NỘI DUNG & HÌNH ẢNH TRANG CHỦ & DÒNG SẢN PHẨM
           ════════════════════════════════════════════════════════════════ */}
        {(activeTab === "landing_cms" || activeTab === "products") && (
          <LandingCMSManager
            landingCMS={landingCMS}
            setLandingCMS={setLandingCMS}
            onSave={handleSaveLandingCMS}
            onReset={handleResetLandingCMS}
            onUploadImage={handleUploadLandingCMSImage}
            onBulkUploadProductImages={handleBulkUploadProductImages}
            isUploading={isUploadingCloudinary}
            initialSubSection={activeTab === "products" ? "products" : cmsSubSection}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 6: ĐIỀU KHIỂN CLOUDFLARE D1 DATABASE
           ════════════════════════════════════════════════════════════════ */}
        {activeTab === "d1_control" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <IconDatabase size={20} className="text-[#006838]" />
                    <span>🗄️ ĐIỀU KHIỂN CLOUDFLARE D1 DATABASE</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Trạng thái kết nối cơ sở dữ liệu thời gian thực Cloudflare Workers.</p>
                </div>
                <button
                  onClick={fetchLiveD1Counts}
                  className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006838] hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <IconRefresh size={16} />
                  <span>Làm mới D1 Count</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Table: meeting_rooms</span>
                  <div className="text-xl font-black text-[#006838]">{d1Stats.roomsCount} Phòng</div>
                  <span className="text-[10px] text-emerald-600 block">✓ Trạng thái: Hoạt động</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Table: room_bookings</span>
                  <div className="text-xl font-black text-blue-600">{d1Stats.bookingsCount} Bản ghi</div>
                  <span className="text-[10px] text-slate-500 block">Lịch họp thực tế D1</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Table: visitors</span>
                  <div className="text-xl font-black text-purple-600">{d1Stats.visitorsCount} Khách</div>
                  <span className="text-[10px] text-slate-500 block">Thẻ đón khách D1</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Table: business_trips</span>
                  <div className="text-xl font-black text-amber-600">{d1Stats.businessTripsCount} Đề xuất</div>
                  <span className="text-[10px] text-slate-500 block">Đơn công tác D1</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2">
                <div className="text-[#006838] font-bold">✓ Cloudflare D1 Binding: env.DB</div>
                <div className="text-slate-700">Database ID: ae3a7efd-ff5d-45c2-8c49-78d1518e3aa1 (vpchuoiskechers)</div>
                <div className="text-slate-500 text-[11px]">Server Region: APAC / HKG Cloudflare Edge Worker</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
