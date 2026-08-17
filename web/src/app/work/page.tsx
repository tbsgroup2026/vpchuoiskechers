"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import NotificationCenter from "@/components/NotificationCenter";
import DonutChartModal from "@/components/DonutChartModal";
import {
  IconUsers,
  IconCalculator,
  IconFlask,
  IconSettings,
  IconShieldCheck,
  IconTruck,
  IconBuildingFactory,
  IconBell,
  IconMaximize,
  IconChevronRight,
  IconChevronLeft,
  IconTrendingUp,
  IconClipboardList,
  IconPackage,
  IconClock,
  IconArrowUpRight,
  IconBuilding,
  IconBriefcase,
  IconPlane,
  IconId,
  IconCalendarEvent,
  IconClockCheck,
  IconSchool,
  IconCash,
  IconUserPlus,
  IconFileText,
  IconArrowRight,
  IconDevices,
  IconUser,
  IconLock,
  IconLogout,
  IconCamera,
  IconX,
  IconCheck,
  IconChevronDown,
  IconDownload,
  IconCalendar,
  IconAlertCircle,
  IconAlertTriangle,
  IconPlayerPlay,
  IconRefresh,
  IconFilter,
  IconLayoutGrid,
} from "@tabler/icons-react";

interface DepartmentItem {
  id: string;
  num: string;
  name: string;
  sub: string;
  icon: React.ElementType;
  hasData: boolean;
}

export default function WorkDashboardPage() {
  // Default selected department is QC ("qc") as shown in screenshot
  const [selectedDept, setSelectedDept] = useState<string | null>("qc");
  const [plantFilter, setPlantFilter] = useState("Toàn nhà máy");
  const [timeFilterTab, setTimeFilterTab] = useState("7 ngày");
  const [dateRange, setDateRange] = useState("09/08/2026 - 15/08/2026");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // User Profile & Account Dropdown State
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Profile Form State
  const [userInfo, setUserInfo] = useState({
    empCode: "202608001",
    name: "Phạm Nguyễn Anh Huy",
    phone: "0522511245",
    email: "anhy.work.2004@gmail.com",
    avatar: "/images/tbs-logo.png",
    title: "IT - Team chuyển đổi số",
  });

  useEffect(() => {
    if (isProfileModalOpen) {
      setEditProfileForm({ ...userInfo });
    }
  }, [isProfileModalOpen, userInfo]);

  // Edit Profile Form Temp State
  const [editProfileForm, setEditProfileForm] = useState({ ...userInfo });

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Donut Chart Modal State
  const [isDonutModalOpen, setIsDonutModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  function compressImage(dataUrl: string, maxWidth = 360, maxHeight = 360, quality = 0.8): Promise<string> {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith("data:image")) {
        return resolve(dataUrl);
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Dung lượng ảnh quá lớn! Vui lòng chọn ảnh dưới 10MB.");
        return;
      }

      showToast("⏳ Đang nạp & xử lý ảnh...");

      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === "string") {
          const rawDataUrl = reader.result;
          const compressed = await compressImage(rawDataUrl, 400, 400, 0.85);

          setEditProfileForm((prev) => ({ ...prev, avatar: compressed }));
          setUserInfo((prev) => ({ ...prev, avatar: compressed }));
          showToast("🖼️ Đã nạp ảnh! Đang đồng bộ Cloudinary...");

          try {
            const res = await fetch("/api/upload-avatar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: compressed, empCode: userInfo.empCode || "202608001" }),
            });

            if (res.ok) {
              const json = await res.json();
              if (json.url) {
                setEditProfileForm((prev) => ({ ...prev, avatar: json.url }));
                setUserInfo((prev) => ({ ...prev, avatar: json.url }));
                if (typeof window !== "undefined") {
                  localStorage.setItem(
                    "tbs_current_user",
                    JSON.stringify({
                      ...userInfo,
                      avatar: json.url,
                    })
                  );
                  window.dispatchEvent(new Event("tbs_profile_updated"));
                }
                showToast(
                  json.isCloudinary
                    ? "☁️ Đã tải avatar thành công lên Cloudinary!"
                    : "🖼️ Đã cập nhật ảnh đại diện!"
                );
              }
            }
          } catch (uploadErr) {
            console.warn("Avatar upload endpoint warning:", uploadErr);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch initial profile data from D1 Database & Local Storage
  useEffect(() => {
    let localCustomAvatar: string | null = null;
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const deptParam = searchParams.get("dept");
      if (deptParam) {
        setSelectedDept(deptParam);
      }

      const storedUser = localStorage.getItem("tbs_current_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.name && parsed.name !== "Bùi Văn Tuấn") {
            if (parsed.avatar && parsed.avatar !== "/images/tbs-logo.png") {
              localCustomAvatar = parsed.avatar;
            }
            const loaded = {
              empCode: parsed.empCode || "202608001",
              name: parsed.name,
              phone: parsed.phone || "0522511245",
              email: parsed.email || "anhy.work.2004@gmail.com",
              avatar: parsed.avatar || "/images/tbs-logo.png",
              title: parsed.title || "IT - Team chuyển đổi số",
            };
            setUserInfo(loaded);
            setEditProfileForm(loaded);
          }
        } catch (e) {}
      }
    }

    async function loadD1Profile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d1Avatar = json.data.avatar || json.data.avatar_url;
            const finalAvatar =
              d1Avatar && d1Avatar !== "/images/tbs-logo.png"
                ? d1Avatar
                : localCustomAvatar || d1Avatar || "/images/tbs-logo.png";
            const loaded = {
              empCode: json.data.emp_code || json.data.empCode || "202608001",
              name: json.data.name || "Phạm Nguyễn Anh Huy",
              phone: json.data.phone || "0522511245",
              email: json.data.email || "anhy.work.2004@gmail.com",
              avatar: finalAvatar,
              title: json.data.title || "IT - Team chuyển đổi số",
            };
            setUserInfo(loaded);
            setEditProfileForm(loaded);
            if (typeof window !== "undefined") {
              localStorage.setItem("tbs_current_user", JSON.stringify(loaded));
            }
          }
        }
      } catch (err) {
        console.log("Using default profile state:", err);
      }
    }
    loadD1Profile();

    if (typeof window !== "undefined") {
      window.addEventListener("tbs_profile_updated", loadD1Profile);
      return () => {
        window.removeEventListener("tbs_profile_updated", loadD1Profile);
      };
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserInfo({ ...editProfileForm });
    if (typeof window !== "undefined") {
      localStorage.setItem("tbs_current_user", JSON.stringify(editProfileForm));
      window.dispatchEvent(new Event("tbs_profile_updated"));
    }
    setIsProfileModalOpen(false);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProfileForm),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Đã lưu & cập nhật thông tin thành công vào D1 Database!");
      } else {
        showToast("Cập nhật thông tin cá nhân thành công!");
      }
    } catch (err) {
      showToast("Cập nhật thông tin cá nhân thành công!");
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Mật khẩu mới xác nhận không khớp!");
      return;
    }
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setIsPasswordModalOpen(false);
    showToast("Đổi mật khẩu tài khoản thành công!");
  };

  // 7 Numbered Departments List
  const departments: DepartmentItem[] = [
    {
      id: "hr",
      num: "01",
      name: "Nhân sự – Hành chánh",
      sub: "Quản lý văn thư, tài sản & tuyển dụng",
      icon: IconUsers,
      hasData: true,
    },
    {
      id: "finance",
      num: "02",
      name: "Kế toán và quản trị",
      sub: "Quản lý tài chính, ngân sách & b...",
      icon: IconCalculator,
      hasData: false,
    },
    {
      id: "rd",
      num: "03",
      name: "R&D (phát triển sản phẩm)",
      sub: "Nghiên cứu, thiết kế mẫu & kỹ thuật",
      icon: IconFlask,
      hasData: true,
    },
    {
      id: "ci",
      num: "04",
      name: "CN-CI",
      sub: "Cải tiến liên tục & năng suất 4.0",
      icon: IconSettings,
      hasData: false,
    },
    {
      id: "qc",
      num: "05",
      name: "Quản lý chất lượng",
      sub: "Kiểm soát QC, OEE & chỉ số lỗi",
      icon: IconShieldCheck,
      hasData: true,
    },
    {
      id: "logistics",
      num: "06",
      name: "Kế hoạch chuẩn bị – TTPP",
      sub: "Logistics, vật tư & chuỗi cung ứng",
      icon: IconTruck,
      hasData: false,
    },
    {
      id: "production",
      num: "07",
      name: "Tổ hợp Nhà máy",
      sub: "Quản lý tổ hợp nhà máy & sản xuất chuỗi",
      icon: IconBuildingFactory,
      hasData: true,
    },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const activeDeptObj = departments.find((d) => d.id === selectedDept) || departments[4]; // Default to QC

  return (
    <div className="h-screen w-full flex bg-[#f3f6f4] text-slate-900 font-sans antialiased overflow-hidden selection:bg-[#006838] selection:text-white">
      {/* ════════════════════════════════════════════════════════════════
          LEFT SIDEBAR (Zero-scroll, clean ratio matching screenshot)
         ════════════════════════════════════════════════════════════════ */}
      <aside
        className={`bg-white h-full flex flex-col justify-between border-r border-slate-200/90 flex-shrink-0 shadow-2xs transition-all duration-300 ease-in-out z-30 ${
          isSidebarCollapsed ? "w-20 p-3" : "w-72 lg:w-80 p-4"
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          {/* Executive Brand Lockup */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 flex-shrink-0">
              <Link
                href="/"
                title="Trang Chủ TBS Group"
                className="flex items-center gap-2.5 group cursor-pointer overflow-hidden"
              >
                <img
                  src="/images/tbs-logo.png"
                  alt="TBS Group Logo"
                  className="h-7 w-auto object-contain group-hover:scale-105 transition-transform"
                />
                <div className="h-5 w-[1px] bg-slate-200 flex-shrink-0" />
                <img
                  src="/images/skechers-logo.png"
                  alt="Skechers Logo"
                  className="h-6 w-auto object-contain group-hover:scale-105 transition-transform flex-shrink-0"
                />
              </Link>

              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#006838] text-slate-600 hover:text-white border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                title="Thu nhỏ menu"
              >
                <IconChevronLeft size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pb-2.5 border-b border-slate-200/80 flex-shrink-0">
              <Link href="/" title="Trang Chủ TBS Group" className="flex flex-col items-center gap-1 group cursor-pointer">
                <img src="/images/tbs-logo.png" alt="TBS Group" className="h-5 w-auto object-contain" />
              </Link>

              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-7 h-7 rounded-full bg-[#006838] text-white shadow-xs flex items-center justify-center hover:bg-[#00522c] transition-all cursor-pointer"
                title="Mở rộng menu"
              >
                <IconChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Department List (7 Items) */}
          <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 min-h-0">
            {departments.map((dept) => {
              const IconComp = dept.icon;
              const isSelected = selectedDept === dept.id;

              if (isSidebarCollapsed) {
                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer ${
                      isSelected
                        ? "bg-[#006838] text-white shadow-md"
                        : "bg-white hover:bg-emerald-50 text-[#006838] border border-slate-200/80"
                    }`}
                    title={dept.name}
                  >
                    <IconComp size={20} />
                    {!dept.hasData && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 border border-white" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  className={`w-full text-left rounded-xl flex items-center p-2.5 gap-3 transition-all duration-200 group relative cursor-pointer ${
                    isSelected
                      ? "bg-[#006838] text-white shadow-md border border-[#006838]"
                      : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80"
                  }`}
                >
                  {/* Icon Container */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-emerald-50 text-[#006838] group-hover:bg-[#006838] group-hover:text-white"
                    }`}
                  >
                    <IconComp size={19} />
                  </div>

                  {/* Title & Subtitle */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate tracking-tight">
                      {dept.name}
                    </h4>
                    <p
                      className={`text-[10px] truncate mt-0.5 ${
                        isSelected ? "text-emerald-100/90" : "text-slate-500"
                      }`}
                    >
                      {dept.sub}
                    </p>
                  </div>

                  {/* Soon Badge */}
                  {!dept.hasData && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-800 border border-amber-200/80"
                      }`}
                    >
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 flex-shrink-0">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <img src="/images/tbs-logo.png" alt="TBS Logo" className="h-3 w-auto object-contain" />
                <span>TBS Group System</span>
              </div>
              <span className="font-mono text-[9px]">© 2026</span>
            </>
          ) : (
            <img src="/images/tbs-logo.png" alt="TBS Logo" className="h-3 w-auto mx-auto object-contain" />
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════
          MAIN DASHBOARD AREA (1-Page Viewport Layout)
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 h-full flex flex-col justify-between overflow-hidden p-3.5 sm:p-4 gap-2.5">
        {/* ─── Top Header Bar ─── */}
        <header className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex-shrink-0">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Xin chào,</span>
              <span className="text-[#006838]">{userInfo.name}!</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
              Chúc bạn một ngày làm việc hiệu quả tại Văn Phòng Chuỗi SKECHERS – TBS Group.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <NotificationCenter />

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-2xs"
              title="Toàn màn hình"
            >
              <IconMaximize size={16} />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#006838] border-2 border-[#006838] overflow-hidden shadow-2xs">
                  <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full object-cover" />
                </div>
                <IconChevronDown size={13} className="text-slate-400 group-hover:text-[#006838]" />
              </button>

              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setIsUserDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-[100] overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 bg-gradient-to-br from-[#006838] to-[#083324] text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full border border-white/80 overflow-hidden flex-shrink-0">
                          <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold truncate">{userInfo.name}</h4>
                          <p className="text-[10px] text-emerald-100 truncate">{userInfo.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full p-2 rounded-xl text-left flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-[#006838] transition-colors cursor-pointer"
                      >
                        <IconUser size={15} />
                        <span>Thông tin cá nhân</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setIsPasswordModalOpen(true);
                        }}
                        className="w-full p-2 rounded-xl text-left flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer"
                      >
                        <IconLock size={15} />
                        <span>Đổi mật khẩu</span>
                      </button>

                      <div className="h-[1px] bg-slate-100 my-1" />

                      <Link
                        href="/login"
                        className="w-full p-2 rounded-xl text-left flex items-center gap-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <IconLogout size={15} />
                        <span>Đăng xuất</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ─── Department Hero Banner Card ("PHÒNG BAN") ─── */}
        <div className="bg-gradient-to-r from-[#006838] via-[#083324] to-[#041a12] text-white px-4 py-2.5 rounded-2xl shadow-sm border border-[#006838]/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs text-emerald-200 flex items-center justify-center border border-white/20 flex-shrink-0">
              <IconShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300/90 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  PHÒNG BAN
                </span>
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Quản Lý Chất Lượng (QC)
                </h2>
              </div>
              <p className="text-[11px] text-emerald-100/90 font-medium mt-0.5">
                Kiểm soát tiêu chuẩn chất lượng SKECHERS, chỉ số OEE và tỷ lệ lỗi trên chuyền.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-emerald-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dữ liệu được cập nhật <strong>08:35 15/08/2026</strong></span>
          </div>
        </div>

        {/* ─── Filter Bar (Inline Controls matching screenshot) ─── */}
        <div className="bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Plant Scope Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">Phạm vi nhà máy</span>
              <select
                value={plantFilter}
                onChange={(e) => setPlantFilter(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="Toàn nhà máy">Toàn nhà máy</option>
                <option value="Nhà máy 1">Nhà máy 1</option>
                <option value="Nhà máy 2">Nhà máy 2</option>
                <option value="Nhà máy 3">Nhà máy 3</option>
              </select>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

            {/* Date Range Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">Khoảng thời gian</span>
              <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                <span>{dateRange}</span>
                <IconCalendar size={14} className="text-slate-400" />
              </div>
            </div>

            {/* Quick Time Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
              {["Hôm nay", "7 ngày", "30 ngày", "Tùy chọn"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTimeFilterTab(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    timeFilterTab === tab
                      ? "bg-[#006838] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Export Report Button */}
          <button
            onClick={() => showToast("📊 Đang xuất báo cáo QC định dạng PDF/Excel...")}
            className="px-3 py-1.5 rounded-xl bg-[#006838] text-white text-xs font-bold hover:bg-[#00522c] transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <IconDownload size={15} />
            <span>Xuất báo cáo</span>
          </button>
        </div>

        {/* ─── Grid Row 1: Donut Gauges (Hiệu suất tổng thể) + Line Chart (Tình hình lỗi) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
          {/* Left Column (5/12): Hiệu suất tổng thể */}
          <div className="lg:col-span-5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-0">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>Hiệu suất tổng thể</span>
                <span className="text-slate-400 text-xs font-normal" title="Thông tin tổng quan">(ⓘ)</span>
              </h3>
            </div>

            {/* 2 Donut Gauges */}
            <div className="grid grid-cols-2 gap-3 items-center my-auto py-1">
              {/* Gauge 1: Tỷ lệ đạt QC */}
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="10" />
                    {/* 97.2% filled */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#006838"
                      strokeWidth="10"
                      strokeDasharray="244.2 7.1"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-xl font-black text-slate-900 leading-none">97.2%</span>
                    <span className="text-[10px] font-bold text-slate-500 mt-0.5">Đạt</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-[#006838] flex items-center justify-center gap-0.5">
                    ▲ 2.1% <span className="text-slate-500 font-normal">so với kỳ trước</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Mục tiêu: ≥ 95%
                  </span>
                </div>
              </div>

              {/* Gauge 2: OEE Tổng thể */}
              <div className="flex flex-col items-center text-center space-y-1">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="10" />
                    {/* 88.6% filled */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray="222.6 28.7"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-xl font-black text-slate-900 leading-none">88.6%</span>
                    <span className="text-[10px] font-bold text-slate-500 mt-0.5">Hiệu quả</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-0.5">
                    ▲ 1.8% <span className="text-slate-500 font-normal">so với kỳ trước</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Mục tiêu: ≥ 85%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7/12): Tình hình lỗi */}
          <div className="lg:col-span-7 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-0">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">Tình hình lỗi</h3>
            </div>

            {/* Top 4 KPI Metric Cards */}
            <div className="grid grid-cols-4 gap-2 my-1">
              <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-medium text-slate-500 block truncate">Tổng số lỗi</span>
                <div className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">1,248</div>
                <span className="text-[9px] font-bold text-emerald-600">▲ 12.4%</span>
              </div>

              <div className="bg-rose-50/70 p-2 rounded-xl border border-rose-100">
                <span className="text-[10px] font-medium text-rose-700 block truncate">Lỗi nghiêm trọng (SOS)</span>
                <div className="text-base sm:text-lg font-black text-rose-700 leading-tight mt-0.5">15</div>
                <span className="text-[9px] font-bold text-rose-600">▲ 36.4%</span>
              </div>

              <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                <span className="text-[10px] font-medium text-amber-800 block truncate">Lỗi cần cải thiện</span>
                <div className="text-base sm:text-lg font-black text-amber-800 leading-tight mt-0.5">87</div>
                <span className="text-[9px] font-bold text-amber-700">▲ 8.3%</span>
              </div>

              <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-medium text-emerald-800 block truncate">Lỗi đã xử lý</span>
                <div className="text-base sm:text-lg font-black text-[#006838] leading-tight mt-0.5">1,146</div>
                <span className="text-[9px] font-bold text-emerald-700">▲ 15.7%</span>
              </div>
            </div>

            {/* Daily Trend Line Chart */}
            <div className="space-y-1 flex-1 flex flex-col justify-end">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Xu hướng lỗi theo ngày</span>
                <span className="flex items-center gap-1 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-[#006838]" />
                  <span>Tổng số lỗi</span>
                </span>
              </div>

              {/* Line Chart SVG */}
              <div className="w-full h-20 sm:h-24 relative">
                <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#006838" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#006838" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Gradient Area Fill */}
                  <polygon
                    points="35,45 105,25 175,70 245,35 315,45 385,50 455,75 455,95 35,95"
                    fill="url(#chartGradient)"
                  />

                  {/* Main Line */}
                  <path
                    d="M 35 45 L 105 25 L 175 70 L 245 35 L 315 45 L 385 50 L 455 75"
                    fill="none"
                    stroke="#006838"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {[
                    { x: 35, y: 45 },
                    { x: 105, y: 25 },
                    { x: 175, y: 70 },
                    { x: 245, y: 35 },
                    { x: 315, y: 45 },
                    { x: 385, y: 50 },
                    { x: 455, y: 75 },
                  ].map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#ffffff"
                      stroke="#006838"
                      strokeWidth="2.5"
                    />
                  ))}
                </svg>

                {/* X-Axis Date Labels */}
                <div className="flex justify-between px-2 text-[9px] font-semibold text-slate-400 mt-1">
                  <span>09/08</span>
                  <span>10/08</span>
                  <span>11/08</span>
                  <span>12/08</span>
                  <span>13/08</span>
                  <span>14/08</span>
                  <span>15/08</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Grid Row 2: Chức năng nhanh (8 tiles) + Cảnh báo thời gian thực + Hiệu suất theo nhà máy ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
          {/* Col 1 (5/12): Chức năng nhanh (8 Icons Grid) */}
          <div className="lg:col-span-5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-0">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">Chức năng nhanh</h3>
            </div>

            {/* 8 Apps Grid (2 rows x 4 cols) */}
            <div className="grid grid-cols-4 gap-2 my-auto">
              {[
                { name: "Báo cáo vấn đề", icon: IconAlertCircle, bg: "bg-emerald-50 text-[#006838]" },
                { name: "Nhiệm vụ & Công việc", icon: IconBriefcase, bg: "bg-blue-50 text-blue-600" },
                { name: "Thông báo của bạn", icon: IconBell, bg: "bg-purple-50 text-purple-600" },
                { name: "Thư viện PO & Lỗi", icon: IconFileText, bg: "bg-amber-50 text-amber-600" },
                { name: "Dashboard chi tiết", icon: IconTrendingUp, bg: "bg-blue-50 text-blue-600" },
                { name: "Chốt tiếp nhận", icon: IconCheck, bg: "bg-amber-50 text-amber-600" },
                { name: "Chạy thử & Theo dõi", icon: IconPlayerPlay, bg: "bg-purple-50 text-purple-600" },
                { name: "Cứu hộ lỗi khẩn cấp (SOS)", icon: IconAlertTriangle, bg: "bg-rose-50 text-rose-600" },
              ].map((app, idx) => {
                const AppIcon = app.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => showToast(`Mở ứng dụng: ${app.name}`)}
                    className="p-2 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-white hover:border-[#006838]/60 hover:shadow-xs transition-all flex flex-col items-center text-center gap-1 group cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-lg ${app.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <AppIcon size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 leading-tight line-clamp-2">
                      {app.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Col 2 (3.5/12): Cảnh báo thời gian thực */}
          <div className="lg:col-span-3.5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-0">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Cảnh báo thời gian thực</span>
              </h3>
              <button className="text-[10px] font-bold text-[#006838] hover:underline">Xem tất cả →</button>
            </div>

            {/* Alerts List */}
            <div className="space-y-2 my-auto">
              <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-extrabold text-rose-900 truncate">02 sự cố quá 2 giờ</h4>
                    <p className="text-[9px] text-rose-700 font-medium">PX MAY 2 - Chuyền 5</p>
                  </div>
                </div>
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 ml-1">
                  2
                </span>
              </div>

              <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-extrabold text-amber-900 truncate">01 sự cố chưa hoàn tất</h4>
                    <p className="text-[9px] text-amber-700 font-medium">PX GỖ - Chuyền 2</p>
                  </div>
                </div>
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 ml-1">
                  1
                </span>
              </div>

              <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-extrabold text-rose-900 truncate">01 sự cố nguy cơ SOS</h4>
                    <p className="text-[9px] text-rose-700 font-medium">PX ĐẾ - Chuyền 1</p>
                  </div>
                </div>
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 ml-1">
                  1
                </span>
              </div>
            </div>
          </div>

          {/* Col 3 (3.5/12): Hiệu suất theo nhà máy */}
          <div className="lg:col-span-3.5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-0">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">Hiệu suất theo nhà máy</h3>
              <button className="text-[10px] font-bold text-[#006838] hover:underline">Xem chi tiết →</button>
            </div>

            {/* Factory Progress Bars */}
            <div className="space-y-2.5 my-auto">
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-700">Nhà máy 1</span>
                  <span className="text-[#006838]">98.1%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#006838]" style={{ width: "98.1%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-700">Nhà máy 2</span>
                  <span className="text-[#006838]">96.5%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#006838]" style={{ width: "96.5%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-700">Nhà máy 3</span>
                  <span className="text-amber-600">94.2%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: "94.2%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-900 font-black">Toàn nhà máy</span>
                  <span className="text-[#006838] font-black">97.2%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#006838] to-[#083324]" style={{ width: "97.2%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Bar: 4 Primary Dark Emerald Action Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-shrink-0">
          <button
            onClick={() => showToast("📋 Đang tạo báo cáo kiểm tra QC...")}
            className="p-3 rounded-2xl bg-gradient-to-r from-[#006838] to-[#083324] text-white hover:brightness-110 shadow-xs transition-all flex items-center gap-3 group cursor-pointer text-left border border-[#006838]"
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center flex-shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
              <IconFileText size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black truncate">Tạo báo cáo kiểm tra</h4>
              <p className="text-[10px] text-emerald-200 truncate font-medium">Ghi nhận &amp; báo cáo QC</p>
            </div>
          </button>

          <button
            onClick={() => showToast("📥 Đang giao nhiệm vụ QC mới...")}
            className="p-3 rounded-2xl bg-gradient-to-r from-[#006838] to-[#083324] text-white hover:brightness-110 shadow-xs transition-all flex items-center gap-3 group cursor-pointer text-left border border-[#006838]"
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center flex-shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
              <IconClipboardList size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black truncate">Tạo nhiệm vụ QC</h4>
              <p className="text-[10px] text-emerald-200 truncate font-medium">Giao việc &amp; theo dõi</p>
            </div>
          </button>

          <button
            onClick={() => setIsDonutModalOpen(true)}
            className="p-3 rounded-2xl bg-gradient-to-r from-[#006838] to-[#083324] text-white hover:brightness-110 shadow-xs transition-all flex items-center gap-3 group cursor-pointer text-left border border-[#006838]"
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center flex-shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
              <IconTrendingUp size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black truncate">Xem Dashboard chi tiết</h4>
              <p className="text-[10px] text-emerald-200 truncate font-medium">Phân tích chuyên sâu</p>
            </div>
          </button>

          <button
            onClick={() => showToast("🔔 Mở trung tâm xử lý khẩn cấp SOS...")}
            className="p-3 rounded-2xl bg-gradient-to-r from-[#006838] to-[#083324] text-white hover:brightness-110 shadow-xs transition-all flex items-center justify-between group cursor-pointer text-left border border-[#006838]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center flex-shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
                <IconAlertTriangle size={20} className="text-amber-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black truncate">Quản lý sự cố (SOS)</h4>
                <p className="text-[10px] text-emerald-200 truncate font-medium">Xử lý khẩn cấp</p>
              </div>
            </div>
            <IconArrowRight size={16} className="text-emerald-200 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-1" />
          </button>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════════
          MODAL 1: THÔNG TIN CÁ NHÂN (PROFILE EDIT MODAL)
         ════════════════════════════════════════════════════════════════ */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-[#006838] to-[#083324] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <IconUser size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Thông Tin Cá Nhân</h3>
                  <p className="text-[11px] text-emerald-100 font-medium">Cập nhật thông tin &amp; ảnh đại diện</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-left">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="relative w-28 h-28 mx-auto">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full rounded-full border-4 border-[#006838] shadow-md overflow-hidden relative bg-slate-100 cursor-pointer group"
                >
                  <img src={editProfileForm.avatar} alt={editProfileForm.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <IconCamera size={24} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 rounded-full bg-white text-[#006838] border border-emerald-200 shadow-md hover:scale-110 flex items-center justify-center absolute bottom-0 right-0 cursor-pointer transition-transform"
                >
                  <IconCamera size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editProfileForm.name}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  required
                  value={editProfileForm.phone}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Địa chỉ Email công việc</label>
                <input
                  type="email"
                  required
                  value={editProfileForm.email}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#006838] text-white text-xs font-bold hover:bg-[#00522c] transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <IconCheck size={15} />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL 2: ĐỔI MẬT KHẨU (PASSWORD CHANGE MODAL)
         ════════════════════════════════════════════════════════════════ */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <IconLock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Đổi Mật Khẩu</h3>
                  <p className="text-[11px] text-amber-100 font-medium">Bảo mật tài khoản TBS Group System</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-5 space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-amber-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-amber-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <IconCheck size={15} />
                  <span>Cập nhật mật khẩu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DONUT CHART DASHBOARD MODAL */}
      <DonutChartModal isOpen={isDonutModalOpen} onClose={() => setIsDonutModalOpen(false)} />

      {/* TOAST NOTIFICATION MESSAGE */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <IconCheck size={14} />
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
