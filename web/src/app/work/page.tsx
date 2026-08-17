"use client";

import React, { useState, useEffect } from "react";
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
  IconAlertTriangle,
  IconAlertCircle,
  IconMessage,
  IconFlame,
  IconCircleCheck,
  IconCalendar,
  IconInfoCircle,
  IconPlus,
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
  // Default to QC department as shown in the executive screenshot
  const [selectedDept, setSelectedDept] = useState<string | null>("qc");
  const [timeFilter, setTimeFilter] = useState("7 ngày");
  const [factoryScope, setFactoryScope] = useState("Toàn nhà máy");
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
          showToast("🖼️ Đã nạp ảnh! Đang đồng bộ...");

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
                showToast("🖼️ Đã cập nhật ảnh đại diện!");
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
        showToast("Đã lưu & cập nhật thông tin thành công!");
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

  // 7 Executive Departments List matching the screenshot
  const departments: DepartmentItem[] = [
    {
      id: "hr",
      num: "01",
      name: "Nhân sự – Hành chính",
      sub: "Quản lý văn thư, tài sản & tuyển dụng",
      icon: IconUsers,
      hasData: true,
    },
    {
      id: "finance",
      num: "02",
      name: "Kế toán và quản trị",
      sub: "Quản lý tài chính, ngân sách & báo cáo",
      icon: IconCalculator,
      hasData: false,
    },
    {
      id: "rd",
      num: "03",
      name: "R&D (phát triển sản phẩm)",
      sub: "Nghiên cứu, thiết kế & mẫu & kỹ thuật",
      icon: IconFlask,
      hasData: true,
    },
    {
      id: "ci",
      num: "04",
      name: "CN–CI",
      sub: "Cải tiến liên tục & năng suất 4.0",
      icon: IconSettings,
      hasData: false,
    },
    {
      id: "qc",
      num: "05",
      name: "Quản lý chất lượng (QC)",
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

  const activeDeptObj = departments.find((d) => d.id === selectedDept);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f0f4f2] text-slate-900 font-sans antialiased selection:bg-[#08221a] selection:text-white">
      {/* ════════════════════════════════════════════════════════════════
          LEFT SIDEBAR (Human-Crafted Executive Sidebar)
         ════════════════════════════════════════════════════════════════ */}
      <aside
        className={`bg-white h-screen flex flex-col justify-between border-r border-slate-200/90 flex-shrink-0 shadow-sm transition-all duration-300 ease-in-out z-30 ${
          isSidebarCollapsed ? "w-[72px] px-2 py-3" : "w-[270px] lg:w-[290px] p-3.5"
        }`}
      >
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          {/* Executive Brand Lockup */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 flex-shrink-0">
              <Link
                href="/"
                title="Về Trang Chủ TBS Group"
                className="flex items-center gap-2 group cursor-pointer overflow-hidden"
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
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#08221a] text-slate-600 hover:text-white border border-slate-200 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                title="Thu nhỏ menu"
              >
                <IconChevronLeft size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pb-2.5 border-b border-slate-200/80 flex-shrink-0 w-full">
              <Link href="/" title="Về Trang Chủ TBS Group" className="flex flex-col items-center gap-1 group">
                <img src="/images/tbs-logo.png" alt="TBS Group" className="h-5 w-auto object-contain" />
              </Link>
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-7 h-7 rounded-lg bg-[#08221a] text-white shadow-xs flex items-center justify-center hover:bg-[#0b3226] transition-colors cursor-pointer"
                title="Mở rộng menu"
              >
                <IconChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Department List */}
          <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 min-h-0">
            {departments.map((dept) => {
              const IconComp = dept.icon;
              const isSelected = selectedDept === dept.id;

              if (isSidebarCollapsed) {
                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(isSelected ? null : dept.id)}
                    className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer ${
                      isSelected
                        ? "bg-[#08221a] text-white shadow-md shadow-emerald-950/20"
                        : "bg-slate-50 hover:bg-emerald-50/80 text-slate-700 hover:text-[#08221a] border border-slate-200/80"
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
                  onClick={() => setSelectedDept(isSelected ? null : dept.id)}
                  className={`w-full text-left rounded-xl flex items-center p-2.5 gap-3 transition-all duration-200 group relative cursor-pointer ${
                    isSelected
                      ? "bg-[#08221a] text-white shadow-md shadow-emerald-950/20 border border-[#08221a]"
                      : "bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-2xs"
                  }`}
                >
                  {/* Icon Box */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? "bg-white/15 text-emerald-300"
                        : "bg-slate-100 text-[#08221a] group-hover:bg-[#08221a] group-hover:text-white"
                    }`}
                  >
                    <IconComp size={19} />
                  </div>

                  {/* Title & Sub */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate tracking-tight">
                      {dept.name}
                    </h4>
                    <p
                      className={`text-[10px] truncate mt-0.5 font-medium ${
                        isSelected ? "text-emerald-200/80" : "text-slate-500"
                      }`}
                    >
                      {dept.sub}
                    </p>
                  </div>

                  {/* Soon Tag */}
                  {!dept.hasData && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
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
        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-1.5">
                <img src="/images/tbs-logo.png" alt="TBS" className="h-3.5 w-auto object-contain" />
                <span className="font-bold text-slate-700 text-[10px]">TBS GROUP SYSTEM</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">v2.4.0</span>
            </>
          ) : (
            <img src="/images/tbs-logo.png" alt="TBS" className="h-3.5 mx-auto object-contain" />
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════
          MAIN DASHBOARD AREA (Exact 1-Viewport Fit Dashboard)
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col justify-between bg-[#f0f4f2]">
        {/* Top Header Bar */}
        <header className="h-[52px] min-h-[52px] px-5 py-2 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex-shrink-0 z-40">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Xin chào,</span>
              <span className="text-[#08221a]">{userInfo.name}!</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Chúc bạn một ngày làm việc hiệu quả tại Văn Phòng Chuỗi SKECHERS – TBS Group.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <NotificationCenter />

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Toàn màn hình"
            >
              <IconMaximize size={17} />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group"
                title="Tài khoản cá nhân"
              >
                <div className="w-8 h-8 rounded-full border-2 border-[#08221a] overflow-hidden shadow-2xs group-hover:scale-105 transition-transform bg-slate-900">
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <IconChevronDown
                  size={14}
                  className={`text-slate-500 transition-transform ${isUserDropdownOpen ? "rotate-180 text-[#08221a]" : ""}`}
                />
              </button>

              {/* User Dropdown Popup */}
              {isUserDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setIsUserDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3.5 bg-gradient-to-br from-[#08221a] to-[#0b3226] text-white space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full border border-white/60 overflow-hidden flex-shrink-0">
                          <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black truncate">{userInfo.name}</h4>
                          <p className="text-[10px] text-emerald-200 truncate">{userInfo.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full p-2 rounded-xl text-left flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-[#08221a] transition-colors cursor-pointer"
                      >
                        <IconUser size={15} className="text-[#08221a]" />
                        <span>Thông tin cá nhân</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setIsPasswordModalOpen(true);
                        }}
                        className="w-full p-2 rounded-xl text-left flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer"
                      >
                        <IconLock size={15} className="text-amber-700" />
                        <span>Đổi mật khẩu</span>
                      </button>

                      <div className="h-[1px] bg-slate-100 my-1" />

                      <Link
                        href="/login"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full p-2 rounded-xl text-left flex items-center gap-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

        {/* ════════════════════════════════════════════════════════════════
            DASHBOARD CONTENT CONTAINER (Zero-Scroll 1-Screen Proportioned View)
           ════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 p-3.5 flex flex-col justify-between overflow-hidden gap-2.5">
          {/* ════════════════════════════════════════════════════════════════
              MODE: QUẢN LÝ CHẤT LƯỢNG (QC) DASHBOARD (Matching Exact Screenshot Layout)
             ════════════════════════════════════════════════════════════════ */}
          {selectedDept === "qc" && (
            <div className="h-full flex flex-col justify-between gap-2.5 overflow-hidden">
              {/* TOP CARD: DEPARTMENT BANNER & TITLE */}
              <div className="bg-gradient-to-r from-[#08221a] via-[#0b3226] to-[#0c3c2e] text-white p-3.5 sm:p-4 rounded-2xl border border-emerald-950/40 shadow-md flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-emerald-300">
                    <IconShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                        PHÒNG BAN
                      </span>
                      <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                        Quản Lý Chất Lượng (QC)
                      </h2>
                    </div>
                    <p className="text-xs text-emerald-100/80 mt-0.5 font-medium">
                      Kiểm soát tiêu chuẩn chất lượng SKECHERS, chỉ số OEE và tỷ lệ lỗi trên chuyền.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs font-bold text-emerald-200 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Dữ liệu được cập nhật <strong className="text-white font-mono">08:35 15/08/2026</strong></span>
                </div>
              </div>

              {/* FILTER & EXPORT TOOLBAR */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Phạm vi nhà máy</span>
                    <select
                      value={factoryScope}
                      onChange={(e) => setFactoryScope(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <option value="Toàn nhà máy">Toàn nhà máy</option>
                      <option value="Nhà máy 1">Nhà máy 1 (Xưởng May)</option>
                      <option value="Nhà máy 2">Nhà máy 2 (Xưởng Gò)</option>
                      <option value="Nhà máy 3">Nhà máy 3 (Xưởng Đế)</option>
                    </select>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Khoảng thời gian</span>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800">
                      <span>09/08/2026 – 15/08/2026</span>
                      <IconCalendar size={14} className="text-slate-400" />
                    </div>
                  </div>

                  {/* Time Quick Filter Pills */}
                  <div className="flex items-center gap-1.5 pt-3 sm:pt-0">
                    {["Hôm nay", "7 ngày", "30 ngày", "Tùy chọn"].map((pill) => (
                      <button
                        key={pill}
                        onClick={() => setTimeFilter(pill)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          timeFilter === pill
                            ? "bg-[#08221a] text-white shadow-xs"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                        }`}
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="px-4 py-2 rounded-xl bg-[#08221a] text-white text-xs font-bold hover:bg-[#0b3226] transition-colors shadow-xs cursor-pointer flex items-center gap-1.5">
                  <IconDownload size={15} />
                  <span>Xuất báo cáo</span>
                </button>
              </div>

              {/* MIDDLE ROW: PERFORMANCE GAUGES (LEFT) + DEFECT OVERVIEW & LINE CHART (RIGHT) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
                {/* LEFT PANEL: HIỆU SUẤT TỔNG THỂ (2 RING GAUGES) */}
                <div className="lg:col-span-5 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0">
                  <div className="flex items-center justify-between pb-1 flex-shrink-0">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <span>Hiệu suất tổng thể</span>
                      <IconInfoCircle size={14} className="text-slate-400" />
                    </h3>
                  </div>

                  {/* 2 Circular Ring Gauges */}
                  <div className="grid grid-cols-2 gap-3 items-center justify-center my-auto py-1">
                    {/* Ring Gauge 1: Tỷ lệ đạt QC */}
                    <div className="flex flex-col items-center text-center space-y-1.5">
                      <span className="text-xs font-bold text-slate-600">Tỷ lệ đạt QC</span>
                      
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="11" fill="transparent" />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#08221a"
                            strokeWidth="11"
                            fill="transparent"
                            strokeDasharray="251.2"
                            strokeDashoffset="7"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">97.2%</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">Đạt</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-0.5">
                          ▲ 2.1% so với kỳ trước
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block">Mục tiêu: ≥ 95%</span>
                      </div>
                    </div>

                    {/* Ring Gauge 2: OEE Tổng thể */}
                    <div className="flex flex-col items-center text-center space-y-1.5">
                      <span className="text-xs font-bold text-slate-600">OEE Tổng thể</span>

                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="11" fill="transparent" />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#2fd39a"
                            strokeWidth="11"
                            fill="transparent"
                            strokeDasharray="251.2"
                            strokeDashoffset="28.6"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">88.6%</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">Hiệu quả</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-0.5">
                          ▲ 1.8% so với kỳ trước
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block">Mục tiêu: ≥ 85%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT PANEL: TÌNH HÌNH LỖI (4 METRIC BOXES + SMOOTH LINE CHART) */}
                <div className="lg:col-span-7 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0">
                  <div className="pb-1 flex-shrink-0">
                    <h3 className="text-sm font-black text-slate-900">Tình hình lỗi</h3>
                  </div>

                  {/* 4 Stat Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-shrink-0">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 block truncate">Tổng số lỗi</span>
                      <div className="text-xl font-black text-slate-900 mt-0.5">1,248</div>
                      <span className="text-[10px] font-bold text-rose-600 mt-0.5 block">▲ 12.4%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 block truncate">Lỗi nghiêm trọng (SOS)</span>
                      <div className="text-xl font-black text-slate-900 mt-0.5">15</div>
                      <span className="text-[10px] font-bold text-rose-600 mt-0.5 block">▲ 36.4%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 block truncate">Lỗi cần cải thiện</span>
                      <div className="text-xl font-black text-slate-900 mt-0.5">87</div>
                      <span className="text-[10px] font-bold text-amber-600 mt-0.5 block">▲ 8.3%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 block truncate">Lỗi đã xử lý</span>
                      <div className="text-xl font-black text-slate-900 mt-0.5">1,146</div>
                      <span className="text-[10px] font-bold text-emerald-600 mt-0.5 block">▲ 15.7%</span>
                    </div>
                  </div>

                  {/* Line Chart: Xu hướng lỗi theo ngày */}
                  <div className="mt-2 flex-1 min-h-[110px] flex flex-col justify-between">
                    <span className="text-xs font-bold text-slate-700 block mb-1">Xu hướng lỗi theo ngày</span>
                    
                    {/* SVG Line Graph */}
                    <div className="relative w-full h-full min-h-[90px] flex items-end">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />

                        {/* Smooth Line Path */}
                        <path
                          d="M 20 65 Q 80 40 150 35 T 280 70 T 380 45 T 480 60"
                          fill="none"
                          stroke="#08221a"
                          strokeWidth="2.5"
                        />

                        {/* Line Nodes */}
                        <circle cx="20" cy="65" r="4" fill="#08221a" />
                        <circle cx="95" cy="48" r="4" fill="#08221a" />
                        <circle cx="170" cy="38" r="4" fill="#08221a" />
                        <circle cx="245" cy="72" r="4" fill="#08221a" />
                        <circle cx="320" cy="45" r="4" fill="#08221a" />
                        <circle cx="395" cy="48" r="4" fill="#08221a" />
                        <circle cx="475" cy="62" r="4" fill="#08221a" />
                      </svg>
                    </div>

                    {/* Date Labels below Graph */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-1">
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

              {/* LOWER ROW: QUICK FUNCTIONS (COL-4) + REALTIME ALERTS (COL-4) + FACTORY PERFORMANCE (COL-4) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
                {/* PANEL 1: CHỨC NĂNG NHANH (8 TILES) */}
                <div className="lg:col-span-4 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0">
                  <h3 className="text-xs font-black text-slate-900 pb-1.5">Chức năng nhanh</h3>
                  
                  <div className="grid grid-cols-4 gap-1.5 my-auto">
                    {[
                      { label: "Báo cáo vấn đề", icon: IconShieldCheck, bg: "bg-emerald-100 text-[#08221a]" },
                      { label: "Nhiệm vụ & Công việc", icon: IconClipboardList, bg: "bg-blue-100 text-blue-700" },
                      { label: "Thông báo của bạn", icon: IconClock, bg: "bg-purple-100 text-purple-700" },
                      { label: "Thư viện PO & Lỗi", icon: IconPackage, bg: "bg-amber-100 text-amber-800" },
                      { label: "Dashboard chi tiết", icon: IconTrendingUp, bg: "bg-sky-100 text-sky-700" },
                      { label: "Chat tiếp nhận", icon: IconMessage, bg: "bg-orange-100 text-orange-700" },
                      { label: "Chạy thử & Theo dõi", icon: IconLayoutGrid, bg: "bg-[#08221a] text-white" },
                      { label: "Câu trả lời khẩn cấp (SOS)", icon: IconFlame, bg: "bg-rose-100 text-rose-700" },
                    ].map((tile, idx) => (
                      <button
                        key={idx}
                        className="p-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/70 flex flex-col items-center text-center justify-center gap-1 transition-all cursor-pointer group hover:scale-[1.02]"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tile.bg} group-hover:scale-105 transition-transform`}>
                          <tile.icon size={16} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-700 group-hover:text-[#08221a] leading-tight line-clamp-2">
                          {tile.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* PANEL 2: CẢNH BÁO THỜI GIAN THỰC */}
                <div className="lg:col-span-4 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0">
                  <div className="flex items-center justify-between pb-1 flex-shrink-0">
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span>Cảnh báo thời gian thực</span>
                    </h3>
                    <button className="text-[11px] font-bold text-[#08221a] hover:underline cursor-pointer">
                      Xem tất cả →
                    </button>
                  </div>

                  <div className="space-y-1.5 my-auto">
                    {/* Alert 1 */}
                    <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-200/70 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                          <IconAlertTriangle size={14} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">02 sự cố quá 2 giờ</h4>
                          <span className="text-[10px] text-slate-500 font-medium block truncate">PX MAY 2 – Chuyền 5</span>
                        </div>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        2
                      </span>
                    </div>

                    {/* Alert 2 */}
                    <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                          <IconAlertCircle size={14} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">01 sự cố chưa hoàn tất</h4>
                          <span className="text-[10px] text-slate-500 font-medium block truncate">PX GÒ – Chuyền 2</span>
                        </div>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        1
                      </span>
                    </div>

                    {/* Alert 3 */}
                    <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-200/70 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                          <IconFlame size={14} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">01 sự cố nguy cơ SOS</h4>
                          <span className="text-[10px] text-slate-500 font-medium block truncate">PX ĐẾ – Chuyền 1</span>
                        </div>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        1
                      </span>
                    </div>
                  </div>
                </div>

                {/* PANEL 3: HIỆU SUẤT THEO NHÀ MÁY */}
                <div className="lg:col-span-4 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0">
                  <div className="flex items-center justify-between pb-1 flex-shrink-0">
                    <h3 className="text-xs font-black text-slate-900">Hiệu suất theo nhà máy</h3>
                    <button className="text-[11px] font-bold text-[#08221a] hover:underline cursor-pointer">
                      Xem chi tiết →
                    </button>
                  </div>

                  <div className="space-y-2 my-auto">
                    {[
                      { name: "Nhà máy 1", pct: "98.1%", val: 98.1, color: "bg-emerald-600" },
                      { name: "Nhà máy 2", pct: "96.5%", val: 96.5, color: "bg-emerald-600" },
                      { name: "Nhà máy 3", pct: "94.2%", val: 94.2, color: "bg-amber-500" },
                      { name: "Toàn nhà máy", pct: "97.2%", val: 97.2, color: "bg-[#08221a]" },
                    ].map((fac, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700">{fac.name}</span>
                          <span className="text-slate-900 font-black">{fac.pct}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${fac.color} rounded-full`} style={{ width: `${fac.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BOTTOM STRIP: DARK GREEN QUICK CREATION BAR */}
              <div className="bg-[#08221a] text-white p-2.5 rounded-2xl border border-emerald-950/60 shadow-md flex items-center justify-between flex-shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                  <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2.5 text-left cursor-pointer group border border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                      <IconPlus size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">Tạo báo cáo kiểm tra</h4>
                      <span className="text-[9px] text-emerald-200/80 block truncate">Ghi nhận &amp; báo cáo QC</span>
                    </div>
                  </button>

                  <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2.5 text-left cursor-pointer group border border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                      <IconClipboardList size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">Tạo nhiệm vụ QC</h4>
                      <span className="text-[9px] text-emerald-200/80 block truncate">Giao việc &amp; theo dõi</span>
                    </div>
                  </button>

                  <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2.5 text-left cursor-pointer group border border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                      <IconTrendingUp size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">Xem Dashboard chi tiết</h4>
                      <span className="text-[9px] text-emerald-200/80 block truncate">Phân tích chuyên sâu</span>
                    </div>
                  </button>

                  <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2.5 text-left cursor-pointer group border border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center flex-shrink-0">
                      <IconFlame size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">Quản lý sự cố (SOS)</h4>
                      <span className="text-[9px] text-rose-200/80 block truncate">Xử lý khẩn cấp →</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              MODE: NHÂN SỰ HÀNH CHÍNH (HR) DASHBOARD (Zero-Scroll Viewport Fit)
             ════════════════════════════════════════════════════════════════ */}
          {selectedDept === "hr" && (
            <div className="h-full flex flex-col justify-between gap-2 overflow-hidden">
              <div className="space-y-1.5 flex-shrink-0">
                <div className="flex items-center gap-2 pb-0.5">
                  <div className="w-7 h-7 rounded-lg bg-[#08221a] text-white flex items-center justify-center">
                    <IconBuilding size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-900 tracking-tight">HÀNH CHÍNH</h2>
                    <p className="text-[10px] text-slate-500">Quản lý hành chính, văn phòng và công tác</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <Link
                    href="/rooms"
                    className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-start gap-3 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#08221a] flex items-center justify-center flex-shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                      <IconDevices size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-[#08221a] transition-colors">
                        Quản lý phòng họp
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Đặt lịch phòng họp, thiết bị, đón khách ngoài &amp; cấp thẻ.
                      </p>
                    </div>
                    <IconArrowRight size={16} className="text-slate-400 group-hover:text-[#08221a] group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link
                    href="/business-trip"
                    className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-start gap-3 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0 border border-amber-100 group-hover:scale-105 transition-transform">
                      <IconBriefcase size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                        Đăng ký công tác
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Tạo yêu cầu, theo dõi phê duyệt và lịch sử công tác toàn chuỗi.
                      </p>
                    </div>
                    <IconArrowRight size={16} className="text-slate-400 group-hover:text-amber-800 group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
              </div>

              {/* Sub Section: Nhân sự */}
              <div className="space-y-1.5 flex-1 min-h-0 flex flex-col justify-between">
                <div className="flex items-center gap-2 pb-0.5 flex-shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <IconUsers size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-900 tracking-tight">NHÂN SỰ</h2>
                    <p className="text-[10px] text-slate-500">Quản lý thông tin và phát triển nguồn nhân lực</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 min-h-0">
                  {[
                    { title: "Hồ sơ nhân sự", icon: IconId, href: "/hr", desc: "Thông tin hồ sơ & công tác" },
                    { title: "Quản lý nghỉ phép", icon: IconCalendarEvent, desc: "Đăng ký & phê duyệt phép" },
                    { title: "Chấm công", icon: IconClockCheck, desc: "Dữ liệu chấm công ca" },
                    { title: "Đánh giá nhân viên", icon: IconTrendingUp, desc: "Đánh giá hiệu suất & KPI" },
                    { title: "Đào tạo & phát triển", icon: IconSchool, desc: "Kế hoạch nâng cao kỹ năng" },
                    { title: "Lương & phúc lợi", icon: IconCash, desc: "Thông tin lương & thưởng" },
                    { title: "Tuyển dụng", icon: IconUserPlus, href: "/careers", desc: "Theo dõi quy trình tuyển" },
                    { title: "Báo cáo nhân sự", icon: IconFileText, desc: "Báo cáo tổng hợp nhân sự" },
                  ].map((sub, idx) => (
                    <Link
                      key={idx}
                      href={sub.href || "/hr"}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-[#08221a] hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#08221a] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <sub.icon size={15} />
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#08221a] truncate">
                          {sub.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal line-clamp-1">{sub.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OTHER DEPARTMENTS OR COMING SOON */}
          {selectedDept && selectedDept !== "qc" && selectedDept !== "hr" && (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#08221a] flex items-center justify-center border border-emerald-100">
                <IconClock size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Bảng Điều Khiển {activeDeptObj?.name}
              </h3>
              <p className="text-slate-500 text-xs max-w-sm">
                Dữ liệu bảng điều khiển dành riêng cho {activeDeptObj?.name} đang được đồng bộ và cập nhật theo thời gian thực.
              </p>
              <button
                onClick={() => setSelectedDept("qc")}
                className="px-4 py-2 rounded-xl bg-[#08221a] text-white text-xs font-bold hover:bg-[#0b3226] transition-colors cursor-pointer"
              >
                Về Bảng Quản Lý Chất Lượng (QC)
              </button>
            </div>
          )}
        </div>

        {/* Executive Footer Bar */}
        <footer className="h-7 min-h-[28px] px-4 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between bg-white flex-shrink-0">
          <span>Văn Phòng Chuỗi SKECHERS – TBS Group Dashboard v2.4</span>
          <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Online 24/7</span>
          </span>
        </footer>
      </main>

      {/* ════════════════════════════════════════════════════════════════
          MODALS & OVERLAYS
         ════════════════════════════════════════════════════════════════ */}
      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-[#08221a] to-[#0b3226] text-white flex items-center justify-between">
              <h3 className="text-sm font-black">Thông Tin Cá Nhân</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-white hover:opacity-80">
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-left">
              <input type="file" ref={fileInputRef} onChange={handleAvatarFileChange} accept="image/*" className="hidden" />

              <div className="relative w-28 h-28 mx-auto">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full rounded-full border-4 border-[#08221a] overflow-hidden bg-slate-100 cursor-pointer relative group"
                >
                  <img src={editProfileForm.avatar} alt={editProfileForm.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <IconCamera size={22} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editProfileForm.name}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#08221a]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Số điện thoại</label>
                <input
                  type="text"
                  required
                  value={editProfileForm.phone}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#08221a]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email công việc</label>
                <input
                  type="email"
                  required
                  value={editProfileForm.email}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#08221a]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#08221a] text-white text-xs font-bold hover:bg-[#0b3226]"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
              <h3 className="text-sm font-black">Đổi Mật Khẩu</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-white hover:opacity-80">
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-5 space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-amber-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-amber-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DonutChartModal isOpen={isDonutModalOpen} onClose={() => setIsDonutModalOpen(false)} />

      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl z-50 flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom-2">
          <IconCheck size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
