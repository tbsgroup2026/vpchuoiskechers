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
  IconCalendar,
  IconInfoCircle,
  IconPlus,
  IconLayoutGrid,
  IconTable,
  IconFileTypePdf,
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
  // Default to QC department as shown in Image 2
  const [selectedDept, setSelectedDept] = useState<string | null>("qc");

  // QC Filters & Dashboard State Management
  const [factoryScope, setFactoryScope] = useState<string>("Toàn nhà máy");
  const [timeFilter, setTimeFilter] = useState<string>("7 ngày");
  const [dateRange, setDateRange] = useState<string>("09/08/2026 - 15/08/2026");
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState<boolean>(false);
  const [hoveredChartPoint, setHoveredChartPoint] = useState<number | null>(null);
  const [hoveredFactory, setHoveredFactory] = useState<string | null>(null);

  // App Layout State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // User Profile & Dropdown State
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Form State
  const [userInfo, setUserInfo] = useState({
    empCode: "202608001",
    name: "Phạm Nguyễn Anh Huy",
    phone: "0522511245",
    email: "anhy.work.2004@gmail.com",
    avatar: "/images/tbs-logo.png",
    title: "IT - Team chuyển đổi số",
  });

  const [editProfileForm, setEditProfileForm] = useState({ ...userInfo });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isDonutModalOpen, setIsDonutModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (isProfileModalOpen) {
      setEditProfileForm({ ...userInfo });
    }
  }, [isProfileModalOpen, userInfo]);

  // Handle avatar upload
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Dung lượng ảnh quá lớn! Vui lòng chọn ảnh dưới 10MB.");
        return;
      }
      showToast("⏳ Đang xử lý ảnh đại diện...");
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setEditProfileForm((prev) => ({ ...prev, avatar: reader.result as string }));
          setUserInfo((prev) => ({ ...prev, avatar: reader.result as string }));
          showToast("🖼️ Đã cập nhật ảnh đại diện!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
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
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserInfo({ ...editProfileForm });
    if (typeof window !== "undefined") {
      localStorage.setItem("tbs_current_user", JSON.stringify(editProfileForm));
    }
    setIsProfileModalOpen(false);
    showToast("Đã lưu thông tin cá nhân thành công!");
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

  // Quick Filter Handlers
  const handleQuickFilter = (pill: string) => {
    setTimeFilter(pill);
    if (pill === "Hôm nay") {
      setDateRange("15/08/2026");
    } else if (pill === "7 ngày") {
      setDateRange("09/08/2026 - 15/08/2026");
    } else if (pill === "30 ngày") {
      setDateRange("16/07/2026 - 15/08/2026");
    } else {
      setDateRange("01/08/2026 - 31/08/2026");
    }
    showToast(`Đã lọc dữ liệu theo: ${pill}`);
  };

  // Export Action
  const handleExport = (type: string) => {
    setIsExportDropdownOpen(false);
    showToast(`📥 Đang xuất file ${type} báo cáo QC...`);
  };

  // ════════════════════════════════════════════════════════════════
  // DYNAMIC QC METRICS DATA MATRIX (BY FACTORY SCOPE) - EXACT MATCH IMAGE 2
  // ════════════════════════════════════════════════════════════════
  const qcMetricsData: Record<
    string,
    {
      qcRate: string;
      qcTrend: string;
      oeeRate: string;
      oeeTrend: string;
      totalDefects: string;
      totalDefectsTrend: string;
      sosDefects: string;
      sosTrend: string;
      improveDefects: string;
      improveTrend: string;
      fixedDefects: string;
      fixedTrend: string;
      chartPoints: { date: string; val: number; yPos: number; desc: string }[];
      factoryBreakdown: { name: string; pct: string; val: number; color: string; note: string }[];
    }
  > = {
    "Toàn nhà máy": {
      qcRate: "97.2%",
      qcTrend: "▲ 2.1% so với kỳ trước",
      oeeRate: "88.6%",
      oeeTrend: "▲ 1.8% so với kỳ trước",
      totalDefects: "1,248",
      totalDefectsTrend: "▲ 12.4%",
      sosDefects: "15",
      sosTrend: "▲ 36.4%",
      improveDefects: "87",
      improveTrend: "▲ 8.3%",
      fixedDefects: "1,146",
      fixedTrend: "▲ 15.7%",
      chartPoints: [
        { date: "09/08", val: 1210, yPos: 65, desc: "1,210 lỗi ghi nhận" },
        { date: "10/08", val: 1480, yPos: 48, desc: "1,480 lỗi (Đỉnh điểm nghẽn chuyền)" },
        { date: "11/08", val: 890, yPos: 78, desc: "890 lỗi (Giảm mạnh sau Gemba Walk)" },
        { date: "12/08", val: 1340, yPos: 55, desc: "1,340 lỗi (Kiểm hàng lô mới SK-02)" },
        { date: "13/08", val: 1220, yPos: 62, desc: "1,220 lỗi (Ổn định chuyền may)" },
        { date: "14/08", val: 1080, yPos: 68, desc: "1,080 lỗi (Khắc phục lỗi viền mũi)" },
        { date: "15/08", val: 870, yPos: 75, desc: "870 lỗi (Đạt chỉ tiêu ca hôm nay)" },
      ],
      factoryBreakdown: [
        { name: "Nhà máy 1", pct: "98.1%", val: 98.1, color: "bg-[#006838]", note: "Chuyền May - Đạt xuất sắc" },
        { name: "Nhà máy 2", pct: "96.5%", val: 96.5, color: "bg-emerald-600", note: "Chuyền Gò - Đạt tiêu chuẩn" },
        { name: "Nhà máy 3", pct: "94.2%", val: 94.2, color: "bg-amber-500", note: "Xưởng Ép Đế - Cần cải thiện" },
        { name: "Toàn nhà máy", pct: "97.2%", val: 97.2, color: "bg-[#006838]", note: "Hiệu suất trung bình toàn chuỗi" },
      ],
    },
    "Nhà máy 1": {
      qcRate: "98.1%",
      qcTrend: "▲ 2.5% so với kỳ trước",
      oeeRate: "91.2%",
      oeeTrend: "▲ 2.2% so với kỳ trước",
      totalDefects: "340",
      totalDefectsTrend: "▼ 5.1%",
      sosDefects: "3",
      sosTrend: "▼ 50.0%",
      improveDefects: "22",
      improveTrend: "▼ 12.0%",
      fixedDefects: "315",
      fixedTrend: "▲ 8.4%",
      chartPoints: [
        { date: "09/08", val: 380, yPos: 70, desc: "380 lỗi NM1" },
        { date: "10/08", val: 410, yPos: 65, desc: "410 lỗi NM1" },
        { date: "11/08", val: 290, yPos: 80, desc: "290 lỗi NM1" },
        { date: "12/08", val: 360, yPos: 72, desc: "360 lỗi NM1" },
        { date: "13/08", val: 330, yPos: 75, desc: "330 lỗi NM1" },
        { date: "14/08", val: 310, yPos: 78, desc: "310 lỗi NM1" },
        { date: "15/08", val: 280, yPos: 82, desc: "280 lỗi NM1" },
      ],
      factoryBreakdown: [
        { name: "Nhà máy 1 (Chuyền May 1-10)", pct: "98.5%", val: 98.5, color: "bg-[#006838]", note: "Hoàn hảo" },
        { name: "Nhà máy 1 (Chuyền May 11-20)", pct: "97.8%", val: 97.8, color: "bg-emerald-600", note: "Đạt chuẩn" },
        { name: "Toàn Nhà máy 1", pct: "98.1%", val: 98.1, color: "bg-[#006838]", note: "Tốt nhất hệ thống" },
      ],
    },
    "Nhà máy 2": {
      qcRate: "96.5%",
      qcTrend: "▲ 1.4% so với kỳ trước",
      oeeRate: "87.4%",
      oeeTrend: "▲ 1.1% so với kỳ trước",
      totalDefects: "480",
      totalDefectsTrend: "▲ 8.2%",
      sosDefects: "7",
      sosTrend: "▲ 16.6%",
      improveDefects: "38",
      improveTrend: "▲ 5.5%",
      fixedDefects: "435",
      fixedTrend: "▲ 12.1%",
      chartPoints: [
        { date: "09/08", val: 490, yPos: 60, desc: "490 lỗi NM2" },
        { date: "10/08", val: 560, yPos: 52, desc: "560 lỗi NM2" },
        { date: "11/08", val: 380, yPos: 72, desc: "380 lỗi NM2" },
        { date: "12/08", val: 510, yPos: 58, desc: "510 lỗi NM2" },
        { date: "13/08", val: 470, yPos: 62, desc: "470 lỗi NM2" },
        { date: "14/08", val: 420, yPos: 68, desc: "420 lỗi NM2" },
        { date: "15/08", val: 360, yPos: 74, desc: "360 lỗi NM2" },
      ],
      factoryBreakdown: [
        { name: "Nhà máy 2 (Chuyền Gò 1-5)", pct: "96.8%", val: 96.8, color: "bg-emerald-600", note: "Đạt chuẩn" },
        { name: "Nhà máy 2 (Chuyền Gò 6-12)", pct: "96.2%", val: 96.2, color: "bg-emerald-600", note: "Đạt chuẩn" },
        { name: "Toàn Nhà máy 2", pct: "96.5%", val: 96.5, color: "bg-[#006838]", note: "Hiệu suất cao" },
      ],
    },
    "Nhà máy 3": {
      qcRate: "94.2%",
      qcTrend: "▼ 0.8% so với kỳ trước",
      oeeRate: "84.5%",
      oeeTrend: "▼ 0.5% so với kỳ trước",
      totalDefects: "428",
      totalDefectsTrend: "▲ 18.5%",
      sosDefects: "5",
      sosTrend: "▲ 25.0%",
      improveDefects: "27",
      improveTrend: "▲ 14.2%",
      fixedDefects: "396",
      fixedTrend: "▲ 9.8%",
      chartPoints: [
        { date: "09/08", val: 340, yPos: 72, desc: "340 lỗi NM3" },
        { date: "10/08", val: 510, yPos: 55, desc: "510 lỗi NM3" },
        { date: "11/08", val: 220, yPos: 85, desc: "220 lỗi NM3" },
        { date: "12/08", val: 470, yPos: 60, desc: "470 lỗi NM3" },
        { date: "13/08", val: 420, yPos: 65, desc: "420 lỗi NM3" },
        { date: "14/08", val: 350, yPos: 72, desc: "350 lỗi NM3" },
        { date: "15/08", val: 230, yPos: 84, desc: "230 lỗi NM3" },
      ],
      factoryBreakdown: [
        { name: "Nhà máy 3 (Xưởng Ép Đế 1)", pct: "95.0%", val: 95.0, color: "bg-emerald-600", note: "Đạt chuẩn" },
        { name: "Nhà máy 3 (Xưởng Ép Đế 2)", pct: "93.4%", val: 93.4, color: "bg-amber-500", note: "Cần cải thiện" },
        { name: "Toàn Nhà máy 3", pct: "94.2%", val: 94.2, color: "bg-amber-500", note: "Theo dõi sát" },
      ],
    },
  };

  const currentQcMetrics = qcMetricsData[factoryScope] || qcMetricsData["Toàn nhà máy"];

  // 7 Executive Departments List
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
    <div className="h-screen w-screen overflow-hidden flex bg-[#f0f4f2] text-slate-900 font-sans antialiased selection:bg-[#006838] selection:text-white">
      {/* ════════════════════════════════════════════════════════════════
          LEFT SIDEBAR (Unchanged Executive Sidebar)
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
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#006838] text-slate-600 hover:text-white border border-slate-200 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
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
                className="w-7 h-7 rounded-lg bg-[#006838] text-white shadow-xs flex items-center justify-center hover:bg-[#00522c] transition-colors cursor-pointer"
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
                        ? "bg-[#006838] text-white shadow-md shadow-emerald-950/20"
                        : "bg-slate-50 hover:bg-emerald-50/80 text-slate-700 hover:text-[#006838] border border-slate-200/80"
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
                      ? "bg-[#006838] text-white shadow-md shadow-emerald-950/20 border border-[#006838]"
                      : "bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-2xs"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? "bg-white/15 text-emerald-300"
                        : "bg-slate-100 text-[#006838] group-hover:bg-[#006838] group-hover:text-white"
                    }`}
                  >
                    <IconComp size={19} />
                  </div>

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
          MAIN AREA (Top Header + Single Viewport QC Content - EXACT MATCH IMAGE 2)
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col justify-between bg-[#f0f4f2]">
        {/* Top Header Bar */}
        <header className="h-[52px] min-h-[52px] px-5 py-2 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex-shrink-0 z-40">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Xin chào,</span>
              <span className="text-[#006838]">{userInfo.name}!</span>
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
                <div className="w-8 h-8 rounded-full border-2 border-[#006838] overflow-hidden shadow-2xs group-hover:scale-105 transition-transform bg-slate-900">
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <IconChevronDown
                  size={14}
                  className={`text-slate-500 transition-transform ${isUserDropdownOpen ? "rotate-180 text-[#006838]" : ""}`}
                />
              </button>

              {/* User Dropdown Popup */}
              {isUserDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setIsUserDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3.5 bg-gradient-to-br from-[#006838] to-[#004d29] text-white space-y-1.5">
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
                        className="w-full p-2 rounded-xl text-left flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-[#006838] transition-colors cursor-pointer"
                      >
                        <IconUser size={15} className="text-[#006838]" />
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
            DASHBOARD CONTENT AREA (EXACT MATCH IMAGE 2)
           ════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden gap-2">
          {/* ════════════════════════════════════════════════════════════════
              SECTION 3: HEADER QC HERO CARD (IMAGE 2 MATCH)
             ════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-[#006838] via-[#004d29] to-[#08221a] text-white p-3 sm:p-3.5 rounded-2xl border border-emerald-950/40 shadow-sm flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-emerald-300">
                <IconShieldCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                    PHÒNG BAN
                  </span>
                  <h2 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white">
                    Quản Lý Chất Lượng (QC)
                  </h2>
                </div>
                <p className="text-xs text-emerald-100/90 mt-0.5 font-medium">
                  Kiểm soát tiêu chuẩn chất lượng SKECHERS, chỉ số OEE và tỷ lệ lỗi trên chuyền.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs font-bold text-emerald-200 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Dữ liệu được cập nhật <strong className="text-white font-mono">08:35 15/08/2026</strong></span>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 4: THANH BỘ LỌC (FILTER BAR)
             ════════════════════════════════════════════════════════════════ */}
          <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              {/* Dropdown Nhà máy */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Phạm vi nhà máy</span>
                <select
                  value={factoryScope}
                  onChange={(e) => {
                    setFactoryScope(e.target.value);
                    showToast(`Đã lọc dữ liệu theo: ${e.target.value}`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value="Toàn nhà máy">Toàn nhà máy ▼</option>
                  <option value="Nhà máy 1">Nhà máy 1 (Xưởng May)</option>
                  <option value="Nhà máy 2">Nhà máy 2 (Xưởng Gò)</option>
                  <option value="Nhà máy 3">Nhà máy 3 (Xưởng Đế)</option>
                </select>
              </div>

              {/* Range Ngày */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Khoảng thời gian</span>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800">
                  <span>{dateRange}</span>
                  <IconCalendar size={14} className="text-slate-400" />
                </div>
              </div>

              {/* Quick Filter Buttons */}
              <div className="flex items-center gap-1.5 pt-3 sm:pt-0">
                {["Hôm nay", "7 ngày", "30 ngày", "Tùy chọn"].map((pill) => (
                  <button
                    key={pill}
                    onClick={() => handleQuickFilter(pill)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      timeFilter === pill
                        ? "bg-[#006838] text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Button Xuất Báo Cáo */}
            <div className="relative">
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="px-4 py-2 rounded-xl bg-[#006838] text-white text-xs font-bold hover:bg-[#00522c] transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <IconDownload size={15} />
                <span>Xuất báo cáo</span>
                <IconChevronDown size={13} className={`transition-transform ${isExportDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isExportDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsExportDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-1.5 space-y-1 text-xs font-bold">
                    <button
                      onClick={() => handleExport("Excel (.xlsx)")}
                      className="w-full p-2 rounded-lg text-left flex items-center gap-2 hover:bg-emerald-50 text-slate-700 hover:text-[#006838] cursor-pointer"
                    >
                      <IconTable size={15} className="text-emerald-600" />
                      <span>Xuất Excel</span>
                    </button>
                    <button
                      onClick={() => handleExport("PDF (.pdf)")}
                      className="w-full p-2 rounded-lg text-left flex items-center gap-2 hover:bg-rose-50 text-slate-700 hover:text-rose-600 cursor-pointer"
                    >
                      <IconFileTypePdf size={15} className="text-rose-600" />
                      <span>Xuất PDF</span>
                    </button>
                    <button
                      onClick={() => handleExport("Báo cáo QC chi tiết")}
                      className="w-full p-2 rounded-lg text-left flex items-center gap-2 hover:bg-sky-50 text-slate-700 hover:text-sky-700 cursor-pointer"
                    >
                      <IconFileText size={15} className="text-sky-600" />
                      <span>Xuất Báo cáo QC</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              MAIN DASHBOARD GRID (IMAGE 2 MATCH)
             ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
            {/* CỘT TRÁI: HIỆU SUẤT TỔNG THỂ (2 DONUT CHARTS) */}
            <div className="lg:col-span-5 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between pb-1 flex-shrink-0">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span>Hiệu suất tổng thể</span>
                  <IconInfoCircle size={14} className="text-slate-400" />
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {factoryScope}
                </span>
              </div>

              {/* 2 Circular Donut Gauges */}
              <div className="grid grid-cols-2 gap-2 items-center justify-center my-auto py-1">
                {/* Donut 1: Tỷ lệ đạt QC */}
                <div className="flex flex-col items-center text-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-600">Tỷ lệ đạt QC</span>
                  
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center group cursor-pointer">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="11" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#006838"
                        strokeWidth="11"
                        fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset="7"
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {currentQcMetrics.qcRate}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        Đạt
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-700 block">
                      {currentQcMetrics.qcTrend}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                      Mục tiêu ≥ 95%
                    </span>
                  </div>
                </div>

                {/* Donut 2: OEE Tổng thể */}
                <div className="flex flex-col items-center text-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-600">OEE Tổng thể</span>

                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center group cursor-pointer">
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
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {currentQcMetrics.oeeRate}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        Hiệu quả
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-700 block">
                      {currentQcMetrics.oeeTrend}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                      Mục tiêu ≥ 85%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: TÌNH HÌNH LỖI (4 KPI + LINE CHART) */}
            <div className="lg:col-span-7 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between pb-1 flex-shrink-0">
                <h3 className="text-xs font-black text-slate-900">Tình hình lỗi</h3>
                <span className="text-[10px] font-bold text-slate-500">Thống kê theo ca làm việc</span>
              </div>

              {/* 4 Stat Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-shrink-0">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#006838]/60 transition-colors">
                  <span className="text-[10px] font-bold text-slate-500 block truncate">Tổng số lỗi</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{currentQcMetrics.totalDefects}</div>
                  <span className="text-[9px] font-bold text-rose-600 block">{currentQcMetrics.totalDefectsTrend}</span>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-200/80 hover:border-rose-300 transition-colors">
                  <span className="text-[10px] font-bold text-rose-700 block truncate">Lỗi nghiêm trọng (SOS)</span>
                  <div className="text-lg font-black text-rose-900 mt-0.5">{currentQcMetrics.sosDefects}</div>
                  <span className="text-[9px] font-bold text-rose-600 block">{currentQcMetrics.sosTrend}</span>
                </div>

                <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/80 hover:border-amber-300 transition-colors">
                  <span className="text-[10px] font-bold text-amber-800 block truncate">Lỗi cần cải thiện</span>
                  <div className="text-lg font-black text-amber-900 mt-0.5">{currentQcMetrics.improveDefects}</div>
                  <span className="text-[9px] font-bold text-amber-600 block">{currentQcMetrics.improveTrend}</span>
                </div>

                <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/80 hover:border-emerald-300 transition-colors">
                  <span className="text-[10px] font-bold text-emerald-800 block truncate">Lỗi đã xử lý</span>
                  <div className="text-lg font-black text-emerald-900 mt-0.5">{currentQcMetrics.fixedDefects}</div>
                  <span className="text-[9px] font-bold text-emerald-600 block">{currentQcMetrics.fixedTrend}</span>
                </div>
              </div>

              {/* Line Chart: Xu hướng lỗi theo ngày */}
              <div className="mt-1 flex-1 min-h-[90px] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Xu hướng lỗi theo ngày</span>
                  <span className="text-[9px] text-[#006838] font-mono">● Tổng số lỗi</span>
                </div>
                
                <div className="relative w-full h-full min-h-[65px] flex items-end pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />

                    <path
                      d="M 20 65 Q 80 48 150 78 T 280 55 T 380 62 T 480 75"
                      fill="none"
                      stroke="#006838"
                      strokeWidth="2.5"
                    />

                    {currentQcMetrics.chartPoints.map((pt, idx) => {
                      const cx = 20 + idx * 75;
                      return (
                        <g key={idx} className="cursor-pointer group">
                          <circle
                            cx={cx}
                            cy={pt.yPos}
                            r={hoveredChartPoint === idx ? "6" : "4"}
                            fill="#006838"
                            stroke="#ffffff"
                            strokeWidth="2"
                            onMouseEnter={() => setHoveredChartPoint(idx)}
                            onMouseLeave={() => setHoveredChartPoint(null)}
                            className="transition-all"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Interactive Tooltip on Hover */}
                  {hoveredChartPoint !== null && (
                    <div className="absolute top-0 right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg pointer-events-none animate-in fade-in">
                      <span>{currentQcMetrics.chartPoints[hoveredChartPoint].date}: {currentQcMetrics.chartPoints[hoveredChartPoint].desc}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 pt-0.5">
                  {currentQcMetrics.chartPoints.map((pt, idx) => (
                    <span key={idx} className={hoveredChartPoint === idx ? "text-[#006838] font-bold" : ""}>
                      {pt.date}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              LOWER ROW (3 CARDS GRID - IMAGE 2 MATCH)
             ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
            {/* CARD 1: CHỨC NĂNG NHANH */}
            <div className="lg:col-span-4 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0">
              <h3 className="text-xs font-black text-slate-900 pb-1">Chức năng nhanh</h3>
              
              <div className="grid grid-cols-4 gap-1 my-auto">
                {[
                  { label: "Báo cáo vấn đề", icon: IconShieldCheck, bg: "bg-emerald-100 text-[#006838]" },
                  { label: "Nhiệm vụ & Công việc", icon: IconClipboardList, bg: "bg-blue-100 text-blue-700" },
                  { label: "Thông báo của bạn", icon: IconClock, bg: "bg-purple-100 text-purple-700" },
                  { label: "Thư viện PO & Lỗi", icon: IconPackage, bg: "bg-amber-100 text-amber-800" },
                  { label: "Dashboard chi tiết", icon: IconTrendingUp, bg: "bg-sky-100 text-sky-700" },
                  { label: "Chat tiếp nhận", icon: IconMessage, bg: "bg-orange-100 text-orange-700" },
                  { label: "Chạy thử & Theo dõi", icon: IconLayoutGrid, bg: "bg-[#006838] text-white" },
                  { label: "Câu trả lời khẩn cấp (SOS)", icon: IconFlame, bg: "bg-rose-100 text-rose-700" },
                ].map((tile, idx) => (
                  <button
                    key={idx}
                    onClick={() => showToast(`Mở chức năng: ${tile.label}`)}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/70 flex flex-col items-center text-center justify-center gap-0.5 transition-all cursor-pointer group hover:scale-[1.02]"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tile.bg} group-hover:scale-105 transition-transform`}>
                      <tile.icon size={15} />
                    </div>
                    <span className="text-[8.5px] font-bold text-slate-700 group-hover:text-[#006838] leading-tight line-clamp-2">
                      {tile.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* CARD 2: CẢNH BÁO THỜI GIAN THỰC */}
            <div className="lg:col-span-4 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between pb-1 flex-shrink-0">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-rose-600">Cảnh báo thời gian thực</span>
                </h3>
                <button
                  onClick={() => showToast("Mở tất cả cảnh báo...")}
                  className="text-[10px] font-bold text-[#006838] hover:underline cursor-pointer"
                >
                  Xem tất cả →
                </button>
              </div>

              <div className="space-y-1 my-auto">
                <div className="p-1.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-1.5 hover:bg-rose-100/70 transition-colors cursor-pointer">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                      <IconAlertTriangle size={13} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-900 truncate">02 sự cố quá 2 giờ</h4>
                      <span className="text-[9px] text-slate-500 font-medium block truncate">PX MAY 2 – Chuyền 5</span>
                    </div>
                  </div>
                  <span className="w-4.5 h-4.5 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 shadow-2xs">
                    2
                  </span>
                </div>

                <div className="p-1.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-1.5 hover:bg-amber-100/70 transition-colors cursor-pointer">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                      <IconAlertCircle size={13} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-900 truncate">01 sự cố chưa hoàn tất</h4>
                      <span className="text-[9px] text-slate-500 font-medium block truncate">PX GÒ – Chuyền 2</span>
                    </div>
                  </div>
                  <span className="w-4.5 h-4.5 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 shadow-2xs">
                    1
                  </span>
                </div>

                <div className="p-1.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-1.5 hover:bg-rose-100/70 transition-colors cursor-pointer">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                      <IconFlame size={13} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-bold text-slate-900 truncate">01 sự cố nguy cơ SOS</h4>
                      <span className="text-[9px] text-slate-500 font-medium block truncate">PX ĐẾ – Chuyền 1</span>
                    </div>
                  </div>
                  <span className="w-4.5 h-4.5 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 shadow-2xs">
                    1
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: HIỆU SUẤT THEO NHÀ MÁY */}
            <div className="lg:col-span-4 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between pb-1 flex-shrink-0">
                <h3 className="text-xs font-black text-slate-900">Hiệu suất theo nhà máy</h3>
                <button
                  onClick={() => showToast("Xem chi tiết nhà máy...")}
                  className="text-[10px] font-bold text-[#006838] hover:underline cursor-pointer"
                >
                  Xem chi tiết →
                </button>
              </div>

              <div className="space-y-1.5 my-auto">
                {currentQcMetrics.factoryBreakdown.map((fac, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredFactory(fac.name)}
                    onMouseLeave={() => setHoveredFactory(null)}
                    className="space-y-0.5 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-700 group-hover:text-[#006838] transition-colors">
                        {fac.name}
                      </span>
                      <span className="text-slate-900 font-black">{fac.pct}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden relative">
                      <div
                        className={`h-full ${fac.color} rounded-full transition-all duration-500`}
                        style={{ width: `${fac.val}%` }}
                      />
                    </div>
                    {hoveredFactory === fac.name && (
                      <span className="text-[8.5px] font-bold text-slate-500 block truncate">
                        {fac.note}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              THANH ACTION BAR PHÍA DƯỚI (BOTTOM ACTION STRIP)
             ════════════════════════════════════════════════════════════════ */}
          <div className="bg-[#006838] text-white p-2 rounded-2xl border border-emerald-950/60 shadow-md flex items-center justify-between flex-shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
              <button
                onClick={() => showToast("Khởi tạo báo cáo kiểm tra QC...")}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-left cursor-pointer border border-white/10 group"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-emerald-400/20 text-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <IconPlus size={15} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Tạo báo cáo kiểm tra</h4>
                  <span className="text-[8.5px] text-emerald-100/80 block truncate">Ghi nhận &amp; báo cáo QC</span>
                </div>
              </button>

              <button
                onClick={() => showToast("Tạo nhiệm vụ QC mới...")}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-left cursor-pointer border border-white/10 group"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-emerald-400/20 text-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <IconClipboardList size={15} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Tạo nhiệm vụ QC</h4>
                  <span className="text-[8.5px] text-emerald-100/80 block truncate">Giao việc &amp; theo dõi</span>
                </div>
              </button>

              <button
                onClick={() => showToast("Mở Dashboard chi tiết...")}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-left cursor-pointer border border-white/10 group"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-emerald-400/20 text-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <IconTrendingUp size={15} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Xem Dashboard chi tiết</h4>
                  <span className="text-[8.5px] text-emerald-100/80 block truncate">Phân tích chuyên sâu</span>
                </div>
              </button>

              <button
                onClick={() => showToast("Kích hoạt quản lý sự cố khẩn cấp (SOS)...")}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/30 transition-colors flex items-center gap-2 text-left cursor-pointer border border-white/10 group"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-rose-500/30 text-rose-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <IconFlame size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">Quản lý sự cố (SOS)</h4>
                  <span className="text-[8.5px] text-rose-100/80 block truncate">Xử lý khẩn cấp →</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Executive Footer Bar */}
        <footer className="h-6 min-h-[24px] px-4 border-t border-slate-200/80 text-[10px] text-slate-500 flex items-center justify-between bg-white flex-shrink-0">
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
            <div className="p-4 bg-gradient-to-r from-[#006838] to-[#004d29] text-white flex items-center justify-between">
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
                  className="w-full h-full rounded-full border-4 border-[#006838] overflow-hidden bg-slate-100 cursor-pointer relative group"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Số điện thoại</label>
                <input
                  type="text"
                  required
                  value={editProfileForm.phone}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email công việc</label>
                <input
                  type="email"
                  required
                  value={editProfileForm.email}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-[#006838]"
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
                  className="px-4 py-1.5 rounded-xl bg-[#006838] text-white text-xs font-bold hover:bg-[#004d29]"
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
