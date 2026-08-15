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
  IconUpload,
  IconZoomIn,
  IconZoomOut,
  IconAdjustmentsHorizontal,
  IconArrowUp,
  IconArrowDown,
  IconRotate,
  IconArrowsMaximize,
  IconPlus,
  IconMinus,
  IconMail,
  IconPhoneCall,
  IconScissors,
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
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState("Tháng này");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // User Profile & Account Dropdown State
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Profile Form State
  const [userInfo, setUserInfo] = useState({
    name: "Anh Huy",
    phone: "0988 123 456",
    email: "huy.nguyen@tbsgroup.vn",
    avatar: "/images/crawled/Da-giay1.jpg",
    title: "Quản trị viên cao cấp - SKECHERS",
  });

  // Avatar Zoom & Position Controls State
  const [avatarZoom, setAvatarZoom] = useState(1.0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);

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

  // Cropper Popup Modal State (Dark Studio Crop Overlay)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempAvatarSrc, setTempAvatarSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1.0);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Dung lượng ảnh quá lớn! Vui lòng chọn ảnh dưới 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setTempAvatarSrc(reader.result as string);
          setCropZoom(1.0);
          setCropOffsetX(0);
          setCropOffsetY(0);
          setIsCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropOffsetX, y: e.clientY - cropOffsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropOffsetX(e.clientX - dragStart.x);
    setCropOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    if (tempAvatarSrc) {
      setEditProfileForm((prev) => ({ ...prev, avatar: tempAvatarSrc }));
      setAvatarZoom(cropZoom);
      setAvatarOffsetX(cropOffsetX);
      setAvatarOffsetY(cropOffsetY);
    }
    setIsCropModalOpen(false);
  };

  // Fetch initial profile data from D1 Database vpchuoiskechers
  useEffect(() => {
    async function loadD1Profile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const loaded = {
              name: json.data.name || "Anh Huy",
              phone: json.data.phone || "0988 123 456",
              email: json.data.email || "huy.nguyen@tbsgroup.vn",
              avatar: json.data.avatar || "/images/crawled/Da-giay1.jpg",
              title: json.data.title || "Quản trị viên cao cấp - SKECHERS",
            };
            setUserInfo(loaded);
            setEditProfileForm(loaded);
          }
        }
      } catch (err) {
        console.log("Using default profile state:", err);
      }
    }
    loadD1Profile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserInfo({ ...editProfileForm });
    setIsProfileModalOpen(false);

    // Save/Update directly into Cloudflare D1 Database vpchuoiskechers
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProfileForm),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Đã lưu & cập nhật thông tin thành công vào D1 Database (vpchuoiskechers)!");
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

  // Department Hero Banner Configurations (Screenshot 1 matching)
  const deptBanners: Record<string, { bg: string; title: string; sub: string; appCount: number }> = {
    hr: {
      bg: "/images/crawled/Da-giay1.jpg",
      title: "Nhân Sự - Hành Chánh",
      sub: "Quản lý văn thư, tài sản, phòng họp, tuyển dụng và lịch công tác toàn chuỗi.",
      appCount: 10,
    },
    finance: {
      bg: "/images/crawled/Vat-tu.jpg",
      title: "Kế Toán & Quản Trị",
      sub: "Quản lý tài chính, ngân sách, chi phí sản xuất và báo cáo tài chính hợp nhất.",
      appCount: 5,
    },
    rd: {
      bg: "/images/crawled/De-giay.jpg",
      title: "R&D (Phát Triển Sản Phẩm)",
      sub: "Nghiên cứu công nghệ đế giày SKECHERS, thiết kế mẫu & chuyển giao kỹ thuật.",
      appCount: 6,
    },
    ci: {
      bg: "/images/crawled/Da-giay2.jpg",
      title: "CN-CI (Cải Tiến Liên Tục)",
      sub: "Thúc đẩy phong trào Kaizen, cải tiến Gemba Walk và năng suất tự động hóa 4.0.",
      appCount: 4,
    },
    qc: {
      bg: "/images/crawled/Muitat.jpg",
      title: "Quản Lý Chất Lượng (QC)",
      sub: "Kiểm soát tiêu chuẩn chất lượng SKECHERS, chỉ số OEE và tỷ lệ lỗi trên chuyền.",
      appCount: 8,
    },
    supply: {
      bg: "/images/tbs-logistics-hub.png",
      title: "Kế Hoạch Chuẩn Bị - TTPP",
      sub: "Điều phối logistics, cung ứng vật tư & chuỗi cung ứng chuỗi nhà máy SKECHERS.",
      appCount: 7,
    },
    factory: {
      bg: "/images/tbs-factory-plant.png",
      title: "Tổ Hợp Nhà Máy",
      sub: "Quản lý chuỗi xưởng sản xuất, máy móc thiết bị và điều hành ca sản xuất.",
      appCount: 9,
    },
  };

  // 7 Numbered Departments List
  const departments: DepartmentItem[] = [
    {
      id: "hr",
      num: "01",
      name: "Nhân sự - Hành chánh",
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

  const activeDeptObj = departments.find((d) => d.id === selectedDept);

  return (
    <div className="min-h-screen w-full flex bg-[#f4f7f5] text-slate-900 font-sans antialiased selection:bg-[#006838] selection:text-white">
      {/* ════════════════════════════════════════════════════════════════
          LEFT SIDEBAR (With Circular Floating Toggle Button)
         ════════════════════════════════════════════════════════════════ */}
      <aside
        className={`bg-white min-h-screen flex flex-col justify-between border-r border-slate-200/80 flex-shrink-0 shadow-sm transition-all duration-300 ease-in-out z-30 ${
          isSidebarCollapsed ? "w-20 px-2.5 py-4" : "w-80 lg:w-96 p-4 lg:p-5"
        }`}
      >
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Executive Brand Lockup & Header Toggle Button */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 flex-shrink-0 min-h-[56px]">
              <Link href="/" title="Về Trang Chủ TBS Group (https://vpchuoiskechers.tbsgroup2026.workers.dev)" className="flex items-center gap-2.5 group overflow-hidden cursor-pointer">
                <img
                  src="/images/tbs-logo.png"
                  alt="TBS Group Logo"
                  className="h-7 sm:h-8 w-auto object-contain group-hover:scale-105 transition-transform"
                />
                <div className="h-5.5 w-[1px] bg-slate-200 flex-shrink-0" />
                <img
                  src="/images/skechers-logo.png"
                  alt="Skechers Logo"
                  className="h-6 sm:h-7 w-auto object-contain group-hover:scale-105 transition-transform flex-shrink-0"
                />
              </Link>

              {/* Clean Inline Toggle Button (Expanded State) */}
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-[#006838] text-slate-600 hover:text-white border border-slate-200/80 flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0 ml-2 shadow-2xs group"
                title="Thu nhỏ menu"
              >
                <IconChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 pb-3 border-b border-slate-200/80 flex-shrink-0 w-full">
              <Link href="/" title="Về Trang Chủ TBS Group & SKECHERS" className="flex flex-col items-center gap-1.5 py-0.5 group cursor-pointer">
                <img
                  src="/images/tbs-logo.png"
                  alt="TBS Group"
                  className="h-5.5 w-auto object-contain group-hover:scale-105 transition-transform"
                />
                <div className="w-5 h-[1px] bg-slate-200/90" />
                <img
                  src="/images/skechers-logo.png"
                  alt="SKECHERS"
                  className="h-4.5 w-auto object-contain group-hover:scale-105 transition-transform"
                />
              </Link>

              {/* Clean Inline Toggle Button (Collapsed State) */}
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-8 h-8 rounded-xl bg-[#006838] text-white shadow-md flex items-center justify-center hover:bg-[#00522c] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
                title="Mở rộng menu"
              >
                <IconChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Department List (Executive Responsive Sidebar Cards) */}
          <div className={`flex-1 pr-0.5 w-full flex flex-col items-center ${isSidebarCollapsed ? "space-y-3.5 pt-1" : "space-y-2.5"}`}>
            {departments.map((dept) => {
              const IconComp = dept.icon;
              const isSelected = selectedDept === dept.id;

              // COLLAPSED MODE RENDERING (Ultra Sleek Single 44x44 Icon Tile with Generous Breathing Space)
              if (isSidebarCollapsed) {
                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(isSelected ? null : dept.id)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer ${
                      isSelected
                        ? "bg-[#006838] text-white shadow-md shadow-emerald-900/30 ring-2 ring-emerald-600/30 scale-105"
                        : "bg-white hover:bg-[#e6f4ed] text-[#006838] border border-slate-200/90 shadow-2xs"
                    }`}
                    title={dept.name}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && (
                      <span className="absolute -left-3.5 top-2 bottom-2 w-1 bg-[#006838] rounded-r-full shadow-xs" />
                    )}

                    <IconComp size={22} className="flex-shrink-0" />

                    {/* Coming Soon Dot Indicator */}
                    {!dept.hasData && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
                    )}

                    {/* Collapsed Hover Tooltip Popup */}
                    <div className="absolute left-full ml-3 px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none flex items-center gap-2 border border-slate-700/60">
                      <span>{dept.name}</span>
                      {!dept.hasData && (
                        <span className="text-[10px] font-mono text-amber-300 font-normal">
                          (Soon)
                        </span>
                      )}
                    </div>
                  </button>
                );
              }

              // EXPANDED MODE RENDERING (Full Department Card)
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(isSelected ? null : dept.id)}
                  className={`w-full text-left rounded-2xl flex items-center p-3.5 sm:p-4 gap-3.5 transition-all duration-200 group relative cursor-pointer ${
                    isSelected
                      ? "bg-[#006838] text-white shadow-md shadow-emerald-900/20 border border-[#006838]"
                      : "bg-white hover:bg-[#e6f4ed]/50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-xs"
                  }`}
                >
                  {/* Active Left Indicator Bar */}
                  {isSelected && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-white rounded-r-full" />
                  )}

                  {/* Icon Box */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white"
                    }`}
                  >
                    <IconComp size={22} />
                  </div>

                  {/* Department Title & Subtitle */}
                  <div className="flex-1 min-w-0">
                    <div>
                      <h4 className="text-sm font-extrabold truncate tracking-tight">
                        {dept.name}
                      </h4>
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 font-medium ${
                        isSelected ? "text-emerald-100" : "text-slate-500"
                      }`}
                    >
                      {dept.sub}
                    </p>
                  </div>

                  {/* Subtle Status Tag */}
                  {!dept.hasData && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-amber-100/90 text-amber-800 border border-amber-200/90"
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

        {/* Executive Footer Credit */}
        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          {!isSidebarCollapsed ? (
            <>
              <Link href="/" title="Về Trang Chủ TBS Group" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <img
                  src="/images/tbs-logo.png"
                  alt="TBS Logo"
                  className="h-3.5 w-auto object-contain"
                />
                <span className="font-semibold text-slate-700 text-[10px]">
                  TBS Group System
                </span>
              </Link>
              <span className="text-[9px] font-mono text-slate-400">
                © 2026
              </span>
            </>
          ) : (
            <Link href="/" className="mx-auto hover:opacity-80 transition-opacity" title="Về Trang Chủ TBS Group">
              <img
                src="/images/tbs-logo.png"
                alt="TBS Logo"
                className="h-3.5 w-auto object-contain"
              />
            </Link>
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════
          MAIN DASHBOARD AREA
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 min-h-screen bg-[#f4f7f5] text-slate-900 rounded-tl-[24px] flex flex-col justify-between transition-all duration-300">
        {/* Top Header Bar (High Z-Index Stacking Context) */}
        <header className="relative z-50 px-5 lg:px-6 py-3 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex-shrink-0">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
              Xin chào, <span className="text-[#006838]">{userInfo.name}!</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Chúc bạn một ngày làm việc hiệu quả tại Văn Phòng Chuỗi SKECHERS - TBS Group.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">

            {/* Notification Center */}
            <NotificationCenter />

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              title="Toàn màn hình"
            >
              <IconMaximize size={18} />
            </button>

            {/* User Avatar & Executive Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group"
                title="Tài khoản cá nhân"
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-[#006838] overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      style={{
                        transform: `scale(${avatarZoom}) translate(${avatarOffsetX}px, ${avatarOffsetY}px)`,
                        transformOrigin: "center center",
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <IconChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isUserDropdownOpen ? "rotate-180 text-[#006838]" : ""}`} />
              </button>

              {/* Dropdown Menu Popup (Highest Z-Index Overlay) */}
              {isUserDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[90]"
                    onClick={() => setIsUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2.5 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-[100] overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Header */}
                    <div className="p-4 bg-gradient-to-br from-[#006838] to-[#004d29] text-white space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full border-2 border-white/80 overflow-hidden flex-shrink-0 shadow-sm">
                          <img
                            src={userInfo.avatar}
                            alt={userInfo.name}
                            style={{
                              transform: `scale(${avatarZoom}) translate(${avatarOffsetX}px, ${avatarOffsetY}px)`,
                              transformOrigin: "center center",
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black truncate">{userInfo.name}</h4>
                          <p className="text-xs text-emerald-100 truncate font-medium">{userInfo.email}</p>
                        </div>
                      </div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider">
                        {userInfo.title}
                      </span>
                    </div>

                    {/* Menu Options */}
                    <div className="p-2 space-y-1">
                      {/* Option 1: Thông tin cá nhân */}
                      <button
                        onClick={() => {
                          setEditProfileForm({ ...userInfo });
                          setIsUserDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-[#006838] transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-[#006838] flex items-center justify-center group-hover:bg-[#006838] group-hover:text-white transition-colors flex-shrink-0">
                          <IconUser size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="font-extrabold">Thông tin cá nhân</div>
                          <div className="text-[10px] text-slate-500 font-normal">Họ tên, SĐT, Email &amp; Avatar</div>
                        </div>
                      </button>

                      {/* Option 2: Đổi mật khẩu */}
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setIsPasswordModalOpen(true);
                        }}
                        className="w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors flex-shrink-0">
                          <IconLock size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="font-extrabold">Đổi mật khẩu</div>
                          <div className="text-[10px] text-slate-500 font-normal">Cập nhật mật khẩu tài khoản</div>
                        </div>
                      </button>

                      <div className="h-[1px] bg-slate-100 my-1" />

                      {/* Option 3: Đăng xuất */}
                      <Link
                        href="/login"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors flex-shrink-0">
                          <IconLogout size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="font-extrabold">Đăng xuất</div>
                          <div className="text-[10px] text-rose-400 font-normal">Thoát tài khoản an toàn</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-4 lg:p-6 flex-1 flex flex-col justify-between overflow-y-auto gap-4">
          {/* ════════════════════════════════════════════════════════════════
              DEPARTMENT HERO BANNER CARD (Screenshot 1 Layout)
             ════════════════════════════════════════════════════════════════ */}
          {activeDeptObj && (
            <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-md flex-shrink-0 bg-slate-900 group">
              {/* Background Image with Dark Emerald Overlay */}
              <img
                src={deptBanners[activeDeptObj.id]?.bg || "/images/tbs-factory-plant.png"}
                alt={activeDeptObj.name}
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#006838]/90 via-[#004d29]/80 to-slate-950/85 pointer-events-none" />

              {/* Banner Content Layer */}
              <div className="relative z-10 p-5 sm:p-6 lg:p-7 flex flex-col justify-between min-h-[160px] sm:min-h-[180px] text-white">
                {/* Top Row: Subtitle Badge & App Count Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-emerald-200/90 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-2xs">
                    PHÒNG BAN
                  </span>
                  <div className="px-3.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 text-xs font-extrabold backdrop-blur-md flex items-center gap-1.5 shadow-2xs">
                    <IconLayoutGrid size={14} className="text-emerald-300" />
                    <span>{deptBanners[activeDeptObj.id]?.appCount || 2} ứng dụng</span>
                  </div>
                </div>

                {/* Middle Section: Main Department Title & Subtitle */}
                <div className="space-y-1.5 my-2">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tight text-white drop-shadow-sm">
                    {deptBanners[activeDeptObj.id]?.title || activeDeptObj.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
                    {deptBanners[activeDeptObj.id]?.sub || activeDeptObj.sub}
                  </p>
                </div>

                {/* Bottom Row: Feature Badges */}
                <div className="flex items-center gap-2.5 pt-1">
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] sm:text-[11px] font-bold text-emerald-100 flex items-center gap-1.5 backdrop-blur-xs">
                    ⚡ Truy cập nhanh
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] sm:text-[11px] font-bold text-emerald-100 flex items-center gap-1.5 backdrop-blur-xs">
                    📱 Gọn trên mobile
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* IF A "COMING SOON" DEPARTMENT IS SELECTED */}
          {activeDeptObj && !activeDeptObj.hasData && (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-3 max-w-xl mx-auto my-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <IconClock size={30} />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Phòng {activeDeptObj.name}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                Dữ liệu bảng điều khiển dành riêng cho {activeDeptObj.name} đang trong quá trình số hóa và đấu nối hệ thống.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/90 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
                <span>Tính năng đang phát triển — Coming Soon</span>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              IF HR (NHÂN SỰ HÀNH CHÁNH) IS SELECTED (Zero-Scroll Viewport Fit)
             ════════════════════════════════════════════════════════════════ */}
          {selectedDept === "hr" && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden gap-2.5 my-auto">
              {/* ════════ SECTION 1: HÀNH CHÍNH ════════ */}
              <div className="space-y-2 flex-shrink-0">
                {/* Section Title Header */}
                <div className="flex items-center gap-2.5 pb-0.5">
                  <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100 shadow-xs">
                    <IconBuilding size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">
                      HÀNH CHÍNH
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Quản lý hành chính, văn phòng và công tác
                    </p>
                  </div>
                </div>

                {/* 2 Main Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Main Card 1: Quản lý phòng họp */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2.5 group relative overflow-hidden">
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100">
                        <IconDevices size={36} className="stroke-[1.5]" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="text-base font-black text-slate-900 tracking-tight">
                          Quản lý phòng họp
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight">
                          Đặt lịch, quản lý phòng họp và trang thiết bị phục vụ cuộc họp.
                        </p>
                        
                        {/* Checklist */}
                        <ul className="space-y-1 pt-0.5">
                          <li className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                              ✓
                            </span>
                            <span>Đặt lịch phòng họp</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                              ✓
                            </span>
                            <span>Lịch sử sử dụng</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                              ✓
                            </span>
                            <span>Quản lý thiết bị</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Arrow Action Button */}
                    <div className="flex justify-end pt-0.5">
                      <button className="w-7.5 h-7.5 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-xs">
                        <IconArrowRight size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Main Card 2: Đăng ký công tác */}
                  <Link
                    href="/business-trip"
                    className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2.5 group relative overflow-hidden cursor-pointer"
                  >
                    {/* Background Subtle Plane Graphic */}
                    <div className="absolute right-3 top-3 text-amber-100/50 pointer-events-none">
                      <IconPlane size={72} className="stroke-[1]" />
                    </div>

                    <div className="flex items-start gap-3.5 z-10">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-100 group-hover:scale-105 transition-transform">
                        <IconBriefcase size={36} className="stroke-[1.5]" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="text-base font-black text-slate-900 tracking-tight group-hover:text-amber-800 transition-colors">
                          Đăng ký công tác
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight">
                          Đăng ký, theo dõi và quản lý các chuyến công tác.
                        </p>
                        
                        {/* Checklist */}
                        <ul className="space-y-1 pt-0.5">
                          <li className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                              ✓
                            </span>
                            <span>Tạo đăng ký công tác</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                              ✓
                            </span>
                            <span>Theo dõi phê duyệt</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                              ✓
                            </span>
                            <span>Lịch sử công tác</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Arrow Action Button */}
                    <div className="flex justify-end pt-0.5 z-10">
                      <div className="w-7.5 h-7.5 rounded-full bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors flex items-center justify-center shadow-xs">
                        <IconArrowRight size={15} />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* ════════ SECTION 2: NHÂN SỰ ════════ */}
              <div className="space-y-2 flex-shrink-0">
                {/* Section Title Header */}
                <div className="flex items-center gap-2.5 pb-0.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-xs">
                    <IconUsers size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">
                      NHÂN SỰ
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Quản lý thông tin và phát triển nguồn nhân lực
                    </p>
                  </div>
                </div>

                {/* 8 Sub-Cards Grid (4 cols x 2 rows - Zero-Scroll Fit) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Sub-Card 1: Hồ sơ nhân sự */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                        <IconId size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-[#006838] tracking-tight">
                          Hồ sơ nhân sự
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Quản lý thông tin hồ sơ và quá trình công tác của nhân viên.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 2: Quản lý nghỉ phép */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconCalendarEvent size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-[#006838] tracking-tight">
                          Quản lý nghỉ phép
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Đăng ký, theo dõi và phê duyệt các đơn nghỉ phép.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 3: Chấm công */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
                        <IconClockCheck size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-purple-700 tracking-tight">
                          Chấm công
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Theo dõi, quản lý và tổng hợp dữ liệu chấm công.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 4: Đánh giá nhân viên */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconTrendingUp size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-emerald-800 tracking-tight">
                          Đánh giá nhân viên
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Đánh giá hiệu suất làm việc và năng lực nhân viên.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 5: Đào tạo & phát triển */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                        <IconSchool size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-amber-800 tracking-tight">
                          Đào tạo &amp; phát triển
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Quản lý kế hoạch đào tạo và phát triển kỹ năng nhân viên.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 6: Lương & phúc lợi */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-100 group-hover:scale-105 transition-transform">
                        <IconCash size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-cyan-800 tracking-tight">
                          Lương &amp; phúc lợi
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Quản lý thông tin lương, thưởng và phúc lợi nhân viên.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-cyan-50 text-cyan-700 group-hover:bg-cyan-700 group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 7: Tuyển dụng */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center border border-pink-100 group-hover:scale-105 transition-transform">
                        <IconUserPlus size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-pink-700 tracking-tight">
                          Tuyển dụng
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Quản lý quy trình tuyển dụng và theo dõi ứng viên.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-pink-50 text-pink-700 group-hover:bg-pink-600 group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 8: Báo cáo nhân sự */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 group-hover:scale-105 transition-transform">
                        <IconFileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-sky-800 tracking-tight">
                          Báo cáo nhân sự
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Hệ thống báo cáo tổng hợp về nhân sự và thống kê.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IF R&D (PHÁT TRIỂN SẢN PHẨM) IS SELECTED */}
          {selectedDept === "rd" && (
            <div className="space-y-4 my-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    🧪 Chỉ Số Phòng Phát Triển Sản Phẩm (R&D)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cập nhật thời gian thực về tiến độ phát triển mẫu giày SKECHERS.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                  Dữ liệu R&D Live
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: "Mẫu Đã Duyệt", val: "142 Mẫu", trend: "+18%", color: "emerald" },
                  { title: "Mẫu Đang Thử Nghiệm", val: "28 Mẫu", trend: "+5%", color: "blue" },
                  { title: "Thời Gian Lead Time", val: "4.2 Ngày", trend: "-15%", color: "purple" },
                  { title: "Duyệt Mẫu Lần 1", val: "94.8%", trend: "+2.1%", color: "amber" },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">{item.title}</span>
                    <div className="text-xl font-black text-slate-900">{item.val}</div>
                    <span className="text-xs text-[#006838] font-bold block">{item.trend} so với tháng trước</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IF QC (QUẢN LÝ CHẤT LƯỢNG) IS SELECTED */}
          {selectedDept === "qc" && (
            <div className="space-y-4 my-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    🛡️ Chỉ Số Phòng Quản Lý Chất Lượng (QC)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống kiểm soát tỷ lệ lỗi Gemba Walk và chỉ số OEE nhà máy.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  Dữ liệu QC Live
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: "Tỷ Lệ Đạt QC", val: "98.6%", trend: "+1.2%", color: "emerald" },
                  { title: "Tổng Lỗi Kiểm Hàng", val: "14 Lỗi", trend: "-28%", color: "blue" },
                  { title: "Lỗi Gemba Cần Sửa", val: "3 Lỗi", trend: "Xử lý 92%", color: "purple" },
                  { title: "Chỉ Số OEE Nhà Máy", val: "91.5%", trend: "+3.5%", color: "amber" },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">{item.title}</span>
                    <div className="text-xl font-black text-slate-900">{item.val}</div>
                    <span className="text-xs text-[#006838] font-bold block">{item.trend} so với tháng trước</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IF TH-NM (PHÒNG SẢN XUẤT) IS SELECTED */}
          {selectedDept === "production" && (
            <div className="space-y-4 my-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    🏭 Chỉ Số Tổ hợp Nhà máy (TH-NM)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thống kê 33 dây chuyền sản xuất giày SKECHERS thuộc hệ thống nhà máy TBS Group.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  Dữ liệu Sản Xuất Live
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: "Sản Lượng Tháng", val: "586,000 Đôi", trend: "+15%", color: "emerald" },
                  { title: "Số Dây Chuyền", val: "33 Chuyền", trend: "100% Hoạt động", color: "blue" },
                  { title: "Hiệu Suất Chuyền", val: "92.4%", trend: "+5%", color: "purple" },
                  { title: "Tiến Độ Đơn Hàng", val: "89.2%", trend: "Đạt kế hoạch", color: "amber" },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">{item.title}</span>
                    <div className="text-xl font-black text-slate-900">{item.val}</div>
                    <span className="text-xs text-[#006838] font-bold block">{item.trend} so với tháng trước</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEFAULT MAIN DASHBOARD (Exact Screenshot Proportion Calibrated) */}
          {!selectedDept && (
            <div className="space-y-4">
              {/* TOP ROW: 4 Metric Cards (Left Column - 10% Reduced Width) + Donut Ring Chart (Right Column) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Left Column (4 Cards Vertical Stack - 10% Reduced Width: lg:col-span-3.5 / lg:col-span-3) */}
                <div className="lg:col-span-3.5 xl:col-span-3 flex flex-col justify-between gap-2.5">
                  {/* Card 1: R&D (Phòng phát triển) */}
                  <div
                    onClick={() => setSelectedDept(selectedDept === "rd" ? null : "rd")}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#006838]/60 transition-all cursor-pointer flex items-center gap-3 group flex-1"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
                      <IconUsers size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-600 block truncate">
                        Chỉ Số Phòng Phát Triển (R&D)
                      </span>
                      <div className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                        1,248
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#006838] mt-0.5">
                        <IconArrowUpRight size={12} />
                        <span>+12% so với tháng trước</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Đơn Hàng */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-3 group flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-blue-100">
                      <IconClipboardList size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-600 block truncate">
                        Đơn Hàng Chuỗi SKECHERS
                      </span>
                      <div className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                        342
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#006838] mt-0.5">
                        <IconArrowUpRight size={12} />
                        <span>+8% so với tháng trước</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Chỉ Số Phòng Sản Xuất (TH-NM) */}
                  <div
                    onClick={() => setSelectedDept(selectedDept === "production" ? null : "production")}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex items-center gap-3 group flex-1"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-purple-100">
                      <IconPackage size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-600 block truncate">
                        Chỉ Số Tổ hợp Nhà máy (TH-NM)
                      </span>
                      <div className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                        586
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#006838] mt-0.5">
                        <IconArrowUpRight size={12} />
                        <span>+15% so với tháng trước</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Hiệu Suất & Chỉ Số Chất Lượng (QC) */}
                  <div
                    onClick={() => setSelectedDept(selectedDept === "qc" ? null : "qc")}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex items-center gap-3 group flex-1"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-amber-100">
                      <IconTrendingUp size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-600 block truncate">
                        Chỉ Số Chất Lượng &amp; Hiệu Suất (QC)
                      </span>
                      <div className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                        92%
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#006838] mt-0.5">
                        <IconArrowUpRight size={12} />
                        <span>+5% so với tháng trước</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (TỔNG CẢI TIẾN - Donut Chart Block - Expanded Width) */}
                <div className="lg:col-span-8.5 xl:col-span-9 p-5 lg:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-100">
                        <IconSettings size={22} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        TỔNG CẢI TIẾN
                      </h3>
                    </div>

                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <option value="Tháng này">Tháng này</option>
                      <option value="Tháng trước">Tháng trước</option>
                      <option value="Quý 2/2026">Quý 2/2026</option>
                      <option value="Cả năm 2026">Cả năm 2026</option>
                    </select>
                  </div>

                  {/* Donut Ring Visual */}
                  <div className="relative py-3 flex flex-col lg:flex-row items-center justify-center gap-8 my-auto">
                    {/* Donut SVG Ring Graphic */}
                    <div className="relative w-64 h-64 lg:w-72 lg:h-72 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Blue: Nhân sự hành chánh (22.7%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#2563eb"
                          strokeWidth="15"
                          strokeDasharray="54.2 184.8"
                          strokeDashoffset="0"
                        />
                        {/* Orange: CN-CI (19.2%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#ea580c"
                          strokeWidth="15"
                          strokeDasharray="45.8 193.2"
                          strokeDashoffset="-54.2"
                        />
                        {/* TBS Green: Quản lý chất lượng (14.8%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#006838"
                          strokeWidth="15"
                          strokeDasharray="35.3 203.7"
                          strokeDashoffset="-100"
                        />
                        {/* Sky Blue: KH chuẩn bị (9.3%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#0284c7"
                          strokeWidth="15"
                          strokeDasharray="22.2 216.8"
                          strokeDashoffset="-135.3"
                        />
                        {/* Purple: TH-NM (4.1%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#7c3aed"
                          strokeWidth="15"
                          strokeDasharray="9.8 229.2"
                          strokeDashoffset="-157.5"
                        />
                        {/* Magenta Pink: R&D (13.1%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#db2777"
                          strokeWidth="15"
                          strokeDasharray="31.3 207.7"
                          strokeDashoffset="-167.3"
                        />
                        {/* Cyan: Kế toán (16.8%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#06b6d4"
                          strokeWidth="15"
                          strokeDasharray="40.1 198.9"
                          strokeDashoffset="-198.6"
                        />
                      </svg>

                      {/* Donut Center Label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] font-black text-[#006838] uppercase tracking-wider block">
                          TBS GROUP
                        </span>
                        <span className="text-4xl font-black text-slate-900 tracking-tight block my-0.5">
                          582
                        </span>
                        <span className="text-xs font-semibold text-slate-500 block">
                          Tổng Cải Tiến
                        </span>
                      </div>
                    </div>

                    {/* Donut Chart Legend Labels Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 w-full max-w-md">
                      <div className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-slate-600 block text-xs font-semibold leading-snug">Nhân sự hành chánh</span>
                          <div className="text-slate-900 font-black text-xs mt-0.5">132 <span className="text-[#006838] font-bold">(22.7%)</span></div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-orange-600 flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-slate-600 block text-xs font-semibold leading-snug">CN-CI</span>
                          <div className="text-slate-900 font-black text-xs mt-0.5">112 <span className="text-amber-600 font-bold">(19.2%)</span></div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-cyan-500 flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-slate-600 block text-xs font-semibold leading-snug">Kế toán &amp; quản trị</span>
                          <div className="text-slate-900 font-black text-xs mt-0.5">98 <span className="text-[#006838] font-bold">(16.8%)</span></div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-[#006838] flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-slate-600 block text-xs font-semibold leading-snug">Quản lý chất lượng (QC)</span>
                          <div className="text-slate-900 font-black text-xs mt-0.5">86 <span className="text-[#006838] font-bold">(14.8%)</span></div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-pink-600 flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-slate-600 block text-xs font-semibold leading-snug">R&amp;D (Phát triển mẫu)</span>
                          <div className="text-slate-900 font-black text-xs mt-0.5">76 <span className="text-[#006838] font-bold">(13.1%)</span></div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-sky-600 flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-slate-600 block text-xs font-semibold leading-snug">KH chuẩn bị - TTPP</span>
                          <div className="text-slate-900 font-black text-xs mt-0.5">54 <span className="text-[#006838] font-bold">(9.3%)</span></div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 col-span-2">
                        <span className="w-3 h-3 rounded-full bg-purple-600 flex-shrink-0 mt-1" />
                        <div>
                          <span className="text-slate-600 block text-xs font-semibold leading-snug">Tổ hợp Nhà máy (TH-NM)</span>
                          <div className="text-slate-900 font-black text-xs mt-0.5">24 <span className="text-pink-600 font-bold">(4.1%)</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: System Notifications Bar ("THÔNG BÁO HỆ THỐNG") */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    THÔNG BÁO HỆ THỐNG
                  </h3>
                  <button className="text-xs font-bold text-[#006838] hover:underline flex items-center gap-1">
                    <span>Xem tất cả</span>
                    <IconChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Notification 1 */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5 hover:bg-slate-100 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#006838] flex items-center justify-center flex-shrink-0">
                      <IconClipboardList size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        Có 12 đơn hàng đang chờ xử lý
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cập nhật 10 phút trước
                      </p>
                    </div>
                  </div>

                  {/* Notification 2 */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5 hover:bg-slate-100 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <IconUsers size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        5 nhân sự sắp hết hạn hợp đồng
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cập nhật 1 giờ trước
                      </p>
                    </div>
                  </div>

                  {/* Notification 3 */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5 hover:bg-slate-100 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                      <IconPackage size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        Báo cáo cải tiến tuần 24
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cập nhật 2 giờ trước
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar inside dashboard */}
        <footer className="py-2.5 px-6 border-t border-slate-200/70 text-xs text-slate-500 flex items-center justify-between bg-[#f4f7f5] flex-shrink-0">
          <span>Văn Phòng Chuỗi SKECHERS - TBS Group Dashboard v2.4</span>
          <span className="font-mono text-[#006838] font-bold">● System Online 24/7</span>
        </footer>
      </main>

      {/* ════════════════════════════════════════════════════════════════
          MODAL 1: THÔNG TIN CÁ NHÂN (PROFILE EDIT MODAL - SCREENSHOT 2)
         ════════════════════════════════════════════════════════════════ */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header Banner */}
            <div className="p-5 bg-gradient-to-r from-[#006838] to-[#004d29] text-white flex items-center justify-between relative overflow-hidden">
              {/* Background Decorative Rings */}
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
              
              <div className="flex items-center gap-3.5 z-10">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shadow-xs">
                  <IconUser size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Thông Tin Cá Nhân</h3>
                  <p className="text-xs text-emerald-100 font-medium">Cập nhật họ tên, SĐT, email &amp; hình đại diện</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer z-10"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5 text-left">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />

              {/* Center Circular Avatar Display with Camera Badge Button (Screenshot 2) */}
              <div className="relative w-36 h-36 mx-auto my-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full rounded-full border-4 border-[#006838] shadow-lg overflow-hidden relative bg-slate-100 cursor-pointer group"
                  title="Nhấn để tải và chỉnh sửa ảnh mới"
                >
                  <img
                    src={editProfileForm.avatar}
                    alt={editProfileForm.name}
                    style={{
                      transform: `scale(${avatarZoom}) translate(${avatarOffsetX}px, ${avatarOffsetY}px)`,
                      transformOrigin: "center center",
                    }}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <IconCamera size={26} />
                  </div>
                </div>

                {/* Camera Badge Button on Bottom Right Edge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-full bg-white text-[#006838] border border-emerald-200 shadow-md hover:scale-110 flex items-center justify-center absolute bottom-1 right-1 cursor-pointer z-10 transition-transform"
                  title="Tải ảnh mới"
                >
                  <IconCamera size={18} />
                </button>
              </div>

              {/* Input: Họ và tên */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Họ và tên</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editProfileForm.name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-slate-50/50"
                  />
                  <IconUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Input: Số điện thoại liên hệ */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  required
                  value={editProfileForm.phone}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838]"
                />
              </div>

              {/* Input: Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Địa chỉ Email công việc</label>
                <input
                  type="email"
                  required
                  value={editProfileForm.email}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838]"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#006838] text-white text-xs font-bold hover:bg-[#00522c] transition-colors shadow-md shadow-emerald-900/20 cursor-pointer flex items-center gap-1.5"
                >
                  <IconCheck size={16} />
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
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <IconLock size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Đổi Mật Khẩu</h3>
                  <p className="text-xs text-amber-100 font-medium">Bảo mật tài khoản TBS Group System</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSavePassword} className="p-6 space-y-4 text-left">
              {/* Input: Mật khẩu hiện tại */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                />
              </div>

              {/* Input: Mật khẩu mới */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                />
              </div>

              {/* Input: Xác nhận mật khẩu mới */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shadow-md shadow-amber-900/20 cursor-pointer flex items-center gap-1.5"
                >
                  <IconCheck size={16} />
                  <span>Cập nhật mật khẩu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DONUT CHART DASHBOARD MODAL */}
      <DonutChartModal
        isOpen={isDonutModalOpen}
        onClose={() => setIsDonutModalOpen(false)}
      />

      {/* TOAST NOTIFICATION MESSAGE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <IconCheck size={16} />
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
