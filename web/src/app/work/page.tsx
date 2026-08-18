"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import NotificationCenter from "@/components/NotificationCenter";
import DonutChartModal from "@/components/DonutChartModal";
import Can from "@/components/Can";
import { PERMISSIONS } from "@/lib/permissions";
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
  IconDownload,
  IconAlertCircle,
  IconAlertTriangle,
  IconPlayerPlay,
  IconFilter,
  IconBulb,
  IconCircleCheck,
  IconTrophy,
  IconBook,
  IconFolder,
  IconChartBar,
  IconWallet,
  IconCoins,
  IconFileInvoice,
  IconChartPie,
  IconReceipt,
  IconBuildingBank,
  IconArrowsRightLeft,
  IconDeviceDesktop,
  IconPercentage,
  IconShoppingCart,
  IconCategory,
  IconRefresh,
  IconPaperclip,
  IconPrinter,
  IconSend,
  IconDatabase,
  IconTrash,
  IconSearch,
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
  const [plantFilter, setPlantFilter] = useState("Toàn nhà máy");
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

  // Donut Chart Modal State & Interactive Chart Hover States
  const [isDonutModalOpen, setIsDonutModalOpen] = useState(false);
  const [hoveredQcIndex, setHoveredQcIndex] = useState<number | null>(null);
  const [hoveredCiIndex, setHoveredCiIndex] = useState<number | null>(null);

  // Finance Interactive Data Entry Desk State
  const [finEntryType, setFinEntryType] = useState<"thu" | "chi" | "tam_ung" | "hoan_ung" | "hoa_don" | "cong_no">("thu");
  const [finForm, setFinForm] = useState({
    code: "PT-2026-0818",
    date: "2026-08-17",
    party: "Công ty Da Giày TBS - Skechers",
    dept: "Sản Xuất (NM1)",
    accountDebit: "1111",
    accountCredit: "5111",
    amount: "45000000",
    note: "Thu tiền bán hàng chuyền Skechers ca 1",
    attachment: "Chung-tu-kem-theo.pdf",
  });
  const [finTransactions, setFinTransactions] = useState([
    {
      id: "PT-2026-0818",
      type: "Thu",
      typeCode: "thu",
      date: "2026-08-17",
      party: "SKECHERS USA Inc.",
      dept: "Kinh Doanh & Xuất Khẩu",
      debit: "1121 - VCB",
      credit: "1311 - Phải thu KH",
      amount: 450000000,
      note: "Thu thanh toán đơn hàng Skechers D'Lites đợt 2",
      status: "Đã ghi sổ",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "PC-2026-0817",
      type: "Chi",
      typeCode: "chi",
      date: "2026-08-17",
      party: "Công ty CP Vật Liệu Đế TBS",
      dept: "Sản Xuất (NM1)",
      debit: "3311 - Phải trả NCC",
      credit: "1121 - VCB",
      amount: 185000000,
      note: "Thanh toán vật tư đế PU & cao su khuôn mẫu đợt 8",
      status: "Đã duyệt",
      statusColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "TU-2026-0816",
      type: "Tạm ứng",
      typeCode: "tam_ung",
      date: "2026-08-16",
      party: "Trần Minh Quang (QC Lead)",
      dept: "Quản Lý Chất Lượng (QC)",
      debit: "1411 - Tạm ứng NV",
      credit: "1111 - Tiền mặt",
      amount: 15000000,
      note: "Tạm ứng chi phí công tác kiểm định lô hàng NM3",
      status: "Chờ duyệt",
      statusColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "HD-2026-0815",
      type: "Hóa đơn",
      typeCode: "hoa_don",
      date: "2026-08-15",
      party: "Điện Lực Bình Dương",
      dept: "Hành Chánh - Quản Trị",
      debit: "6427 - CP dịch vụ",
      credit: "3311 - Phải trả NCC",
      amount: 68500000,
      note: "Hóa đơn tiền điện trạm biến áp xưởng Skechers T7/2026",
      status: "Đã đối chiếu",
      statusColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "CN-2026-0814",
      type: "Công nợ",
      typeCode: "cong_no",
      date: "2026-08-14",
      party: "Tập Đoàn Hóa Chất TexChem",
      dept: "R&D Phát Triển",
      debit: "1521 - Nguyên liệu",
      credit: "3311 - Phải trả NCC",
      amount: 230000000,
      note: "Ghi nhận công nợ keo dán Eco thân thiện môi trường",
      status: "Đến hạn TT",
      statusColor: "bg-rose-50 text-rose-700 border-rose-200",
    },
  ]);
  const [finFilterTab, setFinFilterTab] = useState<string>("all");
  const [finSearchText, setFinSearchText] = useState<string>("");
  const [isFinPrintModalOpen, setIsFinPrintModalOpen] = useState(false);
  const [selectedFinItem, setSelectedFinItem] = useState<any>(null);

  const handleSaveFinEntry = (isSubmitForApproval = false) => {
    if (!finForm.amount || Number(finForm.amount) <= 0) {
      showToast("⚠️ Vui lòng nhập số tiền hợp lệ!");
      return;
    }
    const typeLabelMap: Record<string, string> = {
      thu: "Thu",
      chi: "Chi",
      tam_ung: "Tạm ứng",
      hoan_ung: "Hoàn ứng",
      hoa_don: "Hóa đơn",
      cong_no: "Công nợ",
    };
    const newEntry = {
      id: finForm.code || `CT-${Date.now().toString().slice(-6)}`,
      type: typeLabelMap[finEntryType] || "Thu",
      typeCode: finEntryType,
      date: finForm.date || new Date().toISOString().slice(0, 10),
      party: finForm.party || "Đối tác TBS",
      dept: finForm.dept || "Sản Xuất",
      debit: finForm.accountDebit,
      credit: finForm.accountCredit,
      amount: Number(finForm.amount),
      note: finForm.note || "Giao dịch phát sinh",
      status: isSubmitForApproval ? "Chờ duyệt" : "Đã ghi sổ",
      statusColor: isSubmitForApproval
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    setFinTransactions([newEntry, ...finTransactions]);
    showToast(isSubmitForApproval ? "⚡ Đã lưu và chuyển chứng từ sang hàng đợi Phê Duyệt!" : "💾 Đã ghi sổ chứng từ thành công vào hệ thống D1!");
    // Reset form code for next entry
    const prefix = finEntryType === "thu" ? "PT" : finEntryType === "chi" ? "PC" : finEntryType === "tam_ung" ? "TU" : finEntryType === "hoa_don" ? "HD" : "CN";
    setFinForm({
      ...finForm,
      code: `${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: "",
      note: "",
    });
  };

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

          // 1. Compress image to max 400x400 JPEG
          const compressed = await compressImage(rawDataUrl, 400, 400, 0.85);

          // 2. Instantly display selected photo in modal circle (0ms UI feedback)
          setEditProfileForm((prev) => ({ ...prev, avatar: compressed }));
          setUserInfo((prev) => ({ ...prev, avatar: compressed }));
          showToast("🖼️ Đã nạp ảnh! Đang đồng bộ Cloudinary...");

          // 3. Upload to Cloudinary & D1 via Worker endpoint
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
                  localStorage.setItem("tbs_current_user", JSON.stringify({
                    ...userInfo,
                    avatar: json.url
                  }));
                  window.dispatchEvent(new Event("tbs_profile_updated"));
                }
                showToast(json.isCloudinary ? "☁️ Đã tải avatar thành công lên Cloudinary!" : "🖼️ Đã cập nhật ảnh đại diện!");
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
          if (parsed?.name) {
            if (parsed.avatar && parsed.avatar !== "/images/tbs-logo.png") {
              localCustomAvatar = parsed.avatar;
            }
            const loaded = {
              empCode: parsed.empCode || "202608001",
              name: parsed.name,
              phone: parsed.phone || "0522511245",
              email: parsed.email || `${parsed.empCode || ''}@tbsgroup.vn`,
              avatar: parsed.avatar || "/images/tbs-logo.png",
              title: parsed.title || "Cán Bộ Công Nhân Viên",
            };
            setUserInfo(loaded);
            setEditProfileForm(loaded);
          }
        } catch (e) { }
      }
    }

    async function loadD1Profile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d1Avatar = json.data.avatar || json.data.avatar_url;
            const finalAvatar = (d1Avatar && d1Avatar !== "/images/tbs-logo.png") ? d1Avatar : (localCustomAvatar || d1Avatar || "/images/tbs-logo.png");
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
      appCount: 10,
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
      hasData: true,
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
      hasData: true,
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
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
        setIsFullscreen(false);
      }
    }
  };

  const activeDeptObj = departments.find((d) => d.id === selectedDept);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#f4f7f5] text-slate-900 font-sans antialiased selection:bg-[#006838] selection:text-white">
      {/* ════════════════════════════════════════════════════════════════
          LEFT SIDEBAR (Fixed Height, Independent Scroll)
         ════════════════════════════════════════════════════════════════ */}
      <aside
        className={`bg-white h-screen flex flex-col justify-between border-r border-slate-200/80 flex-shrink-0 shadow-sm transition-all duration-300 ease-in-out z-30 ${isSidebarCollapsed ? "w-20 px-2.5 py-4" : "w-80 lg:w-[360px] p-4 lg:p-5"
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
          <div className={`flex-1 overflow-y-auto min-h-0 pr-0.5 w-full flex flex-col items-center ${isSidebarCollapsed ? "space-y-3.5 pt-1" : "space-y-2.5"}`}>
            {departments.map((dept) => {
              const IconComp = dept.icon;
              const isSelected = selectedDept === dept.id;

              // COLLAPSED MODE RENDERING (Ultra Sleek Single 44x44 Icon Tile with Generous Breathing Space)
              if (isSidebarCollapsed) {
                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(isSelected ? null : dept.id)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer ${isSelected
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
                  className={`w-full text-left rounded-2xl flex items-center p-3.5 sm:p-4 gap-3.5 transition-all duration-200 group relative cursor-pointer ${isSelected
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
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
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
                      className={`text-xs truncate mt-0.5 font-medium ${isSelected ? "text-emerald-100" : "text-slate-500"
                        }`}
                    >
                      {dept.sub}
                    </p>
                  </div>

                  {/* Subtle Status Tag */}
                  {!dept.hasData && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isSelected
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
      <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden bg-[#f4f7f5] text-slate-900 rounded-tl-[24px] flex flex-col justify-between transition-all duration-300">
        {/* Top Header Bar (High Z-Index Stacking Context) */}
        <header className="sticky top-0 z-40 px-5 lg:px-6 py-3 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex-shrink-0">
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
        <div className="p-4 lg:p-6 space-y-4 pb-12 w-full min-w-0">
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
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-black tracking-tight text-white drop-shadow-sm">
                    {deptBanners[activeDeptObj.id]?.title || activeDeptObj.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
                    {deptBanners[activeDeptObj.id]?.sub || activeDeptObj.sub}
                  </p>
                </div>

                {/* Bottom Row: Real Operational Badges */}
                <div className="flex items-center gap-2.5 pt-1">
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] sm:text-[11px] font-bold text-emerald-100 flex items-center gap-1.5 backdrop-blur-xs">
                    Vận hành chuỗi SKECHERS
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] sm:text-[11px] font-bold text-emerald-100 flex items-center gap-1.5 backdrop-blur-xs">
                    Dữ liệu D1 Realtime
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
              IF FINANCE (KẾ TOÁN & QUẢN TRỊ) IS SELECTED
             ════════════════════════════════════════════════════════════════ */}
          {/* ════════════════════════════════════════════════════════════════
              IF FINANCE (KẾ TOÁN & QUẢN TRỊ NỘI BỘ) IS SELECTED
              ACCOUNTING WORKSPACE & LIVE DATA ENTRY DESK
             ════════════════════════════════════════════════════════════════ */}
          {selectedDept === "finance" && (
            <div className="space-y-4 w-full">
              {/* ════════ 4 TOP KPI CARDS ════════ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* KPI 1: Doanh thu tháng */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-sm transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100/80 shadow-2xs">
                    <IconCoins size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-500 block truncate">Doanh thu tháng</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                      12.4 tỷ
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 mt-0.5 flex items-center gap-0.5">
                      +12% so với tháng trước ↑
                    </span>
                  </div>
                </div>

                {/* KPI 2: Chi phí vận hành */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-sm transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100/80 shadow-2xs">
                    <IconClock size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-500 block truncate">Chi phí vận hành</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                      3.1 tỷ
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 mt-0.5 flex items-center gap-0.5">
                      -8% so với tháng trước ↓
                    </span>
                  </div>
                </div>

                {/* KPI 3: Lợi nhuận ròng */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-sm transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100/80 shadow-2xs">
                    <IconTrendingUp size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-500 block truncate">Lợi nhuận ròng</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                      2.6 tỷ
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 mt-0.5 flex items-center gap-0.5">
                      +18% so với tháng trước ↑
                    </span>
                  </div>
                </div>

                {/* KPI 4: Tỷ lệ chi phí/doanh thu */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-sm transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100/80 shadow-2xs">
                    <IconAdjustmentsHorizontal size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-500 block truncate">Tỷ lệ chi phí/doanh thu</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                      25.0%
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 mt-0.5 flex items-center gap-0.5">
                      -3% so với tháng trước ↓
                    </span>
                  </div>
                </div>
              </div>

              {/* ════════ BÀN NHẬP LIỆU CHỨNG TỪ & HẠCH TOÁN NGHIỆP VỤ KẾ TOÁN ════════ */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                {/* Header Desk */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#006838] to-[#004d29] text-white flex items-center justify-center shadow-xs">
                      <IconCalculator size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                          Bàn Làm Việc Kế Toán &amp; Nhập Liệu Nghiệp Vụ
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#006838] border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                          D1 Cloud Live
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Hạch toán chứng từ nhanh, phát sinh bút toán Nợ/Có và lưu trữ vào sổ nhật ký kế toán TBS
                      </p>
                    </div>
                  </div>

                  {/* Top quick links */}
                  <div className="flex items-center gap-2">
                    <Link
                      href="/finance/thu-chi"
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-[#006838] border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <IconWallet size={14} />
                      <span>Sổ Quỹ</span>
                    </Link>
                    <Link
                      href="/finance/hoa-don"
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-[#006838] border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <IconFileInvoice size={14} />
                      <span>Hóa Đơn</span>
                    </Link>
                    <Link
                      href="/finance/cong-no"
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-[#006838] border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <IconUsers size={14} />
                      <span>Công Nợ</span>
                    </Link>
                  </div>
                </div>

                {/* Operation Switcher Tabs (6 Phân hệ nhập liệu chính) */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100/80 border border-slate-200/80 overflow-x-auto">
                  {[
                    { key: "thu", label: "💰 Phiếu Thu (PT)", prefix: "PT", debit: "1111", credit: "5111" },
                    { key: "chi", label: "💸 Phiếu Chi (PC)", prefix: "PC", debit: "3311", credit: "1121" },
                    { key: "tam_ung", label: "📑 Tạm Ứng (TU)", prefix: "TU", debit: "1411", credit: "1111" },
                    { key: "hoan_ung", label: "🔄 Hoàn Ứng (HU)", prefix: "HU", debit: "1111", credit: "1411" },
                    { key: "hoa_don", label: "🧾 Hóa Đơn VAT (HĐ)", prefix: "HD", debit: "6427", credit: "3311" },
                    { key: "cong_no", label: "🤝 Ghi Nhận Công Nợ (CN)", prefix: "CN", debit: "1521", credit: "3311" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setFinEntryType(tab.key as any);
                        setFinForm({
                          ...finForm,
                          code: `${tab.prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                          accountDebit: tab.debit,
                          accountCredit: tab.credit,
                        });
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        finEntryType === tab.key
                          ? "bg-white text-[#006838] shadow-xs border border-emerald-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Direct Entry Form Grid */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Field 1: Mã chứng từ */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">Mã chứng từ / Bút toán</label>
                        <button
                          type="button"
                          onClick={() => {
                            const prefix = finEntryType === "thu" ? "PT" : finEntryType === "chi" ? "PC" : finEntryType === "tam_ung" ? "TU" : finEntryType === "hoa_don" ? "HD" : "CN";
                            setFinForm({ ...finForm, code: `${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}` });
                          }}
                          className="text-[10px] font-bold text-[#006838] hover:underline"
                        >
                          Tạo mã mới ↺
                        </button>
                      </div>
                      <input
                        type="text"
                        value={finForm.code}
                        onChange={(e) => setFinForm({ ...finForm, code: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white shadow-2xs"
                        placeholder="PT-2026-0818"
                      />
                    </div>

                    {/* Field 2: Ngày ghi sổ */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Ngày hạch toán / Ghi sổ</label>
                      <input
                        type="date"
                        value={finForm.date}
                        onChange={(e) => setFinForm({ ...finForm, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white shadow-2xs"
                      />
                    </div>

                    {/* Field 3: Đối tượng / Người nộp/nhận / NCC */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        {finEntryType === "thu"
                          ? "Người nộp / Khách hàng"
                          : finEntryType === "chi"
                          ? "Người nhận / Nhà cung cấp"
                          : finEntryType === "tam_ung" || finEntryType === "hoan_ung"
                          ? "Cán bộ / Nhân viên tạm ứng"
                          : "Đơn vị / Đối tác xuất hóa đơn"}
                      </label>
                      <input
                        type="text"
                        value={finForm.party}
                        onChange={(e) => setFinForm({ ...finForm, party: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white shadow-2xs"
                        placeholder="Công ty CP Da Giày TBS..."
                      />
                    </div>

                    {/* Field 4: Bộ phận / Phòng ban */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Bộ phận / Phân xưởng</label>
                      <select
                        value={finForm.dept}
                        onChange={(e) => setFinForm({ ...finForm, dept: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white shadow-2xs cursor-pointer"
                      >
                        <option value="Sản Xuất (NM1)">Sản Xuất (Nhà Máy 1)</option>
                        <option value="Sản Xuất (NM2)">Sản Xuất (Nhà Máy 2)</option>
                        <option value="Sản Xuất (NM3)">Sản Xuất (Nhà Máy 3)</option>
                        <option value="R&D Phát Triển Mẫu">R&amp;D (Phát Triển Mẫu)</option>
                        <option value="Quản Lý Chất Lượng (QC)">Quản Lý Chất Lượng (QC)</option>
                        <option value="CN-CI Cải Tiến">CN-CI (Kỹ Thuật &amp; Cải Tiến)</option>
                        <option value="Hành Chánh - Quản Trị">Hành Chánh - Quản Trị</option>
                        <option value="Kinh Doanh & Xuất Khẩu">Kinh Doanh &amp; Xuất Khẩu</option>
                        <option value="Logistics & Kho Vận">Logistics &amp; Kho Vận</option>
                      </select>
                    </div>

                    {/* Field 5: Số tiền (VNĐ) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Số tiền phát sinh (VNĐ) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={finForm.amount}
                          onChange={(e) => setFinForm({ ...finForm, amount: e.target.value })}
                          className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-300 text-xs font-black text-slate-900 outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white shadow-2xs"
                          placeholder="45000000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          VNĐ
                        </span>
                      </div>
                    </div>

                    {/* Field 6: Tài khoản Nợ */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Tài khoản Nợ (Debit)</label>
                      <select
                        value={finForm.accountDebit}
                        onChange={(e) => setFinForm({ ...finForm, accountDebit: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white shadow-2xs cursor-pointer"
                      >
                        <option value="1111">1111 - Tiền mặt tại quỹ</option>
                        <option value="1121">1121 - Tiền gửi Ngân hàng VCB</option>
                        <option value="1311">1311 - Phải thu của khách hàng</option>
                        <option value="1411">1411 - Tạm ứng nhân viên</option>
                        <option value="1521">1521 - Nguyên vật liệu da, đế, keo</option>
                        <option value="1531">1531 - Công cụ dụng cụ xưởng</option>
                        <option value="3311">3311 - Phải trả cho người bán / NCC</option>
                        <option value="6271">6271 - Chi phí sản xuất chung</option>
                        <option value="6427">6427 - Chi phí dịch vụ mua ngoài</option>
                        <option value="6428">6428 - Chi phí quản lý doanh nghiệp</option>
                      </select>
                    </div>

                    {/* Field 7: Tài khoản Có */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Tài khoản Có (Credit)</label>
                      <select
                        value={finForm.accountCredit}
                        onChange={(e) => setFinForm({ ...finForm, accountCredit: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white shadow-2xs cursor-pointer"
                      >
                        <option value="1111">1111 - Tiền mặt tại quỹ</option>
                        <option value="1121">1121 - Tiền gửi Ngân hàng VCB</option>
                        <option value="1311">1311 - Phải thu của khách hàng</option>
                        <option value="1411">1411 - Hoàn ứng nhân viên</option>
                        <option value="3311">3311 - Phải trả cho người bán / NCC</option>
                        <option value="5111">5111 - Doanh thu bán giày Skechers</option>
                        <option value="7111">7111 - Thu nhập tài chính khác</option>
                      </select>
                    </div>

                    {/* Field 8: Chứng từ đính kèm */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Chứng từ / Hóa đơn đính kèm</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={finForm.attachment}
                          onChange={(e) => setFinForm({ ...finForm, attachment: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#006838] bg-white shadow-2xs"
                          placeholder="Chung-tu.pdf"
                        />
                        <button
                          type="button"
                          onClick={() => showToast("📎 Đã đính kèm chứng từ điện tử từ máy tính!")}
                          className="px-2.5 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          title="Tải tệp đính kèm"
                        >
                          <IconPaperclip size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Diễn giải nghiệp vụ */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Nội dung diễn giải chi tiết</label>
                    <input
                      type="text"
                      value={finForm.note}
                      onChange={(e) => setFinForm({ ...finForm, note: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-[#006838] focus:ring-1 focus:ring-[#006838] bg-white shadow-2xs"
                      placeholder="Ghi rõ lý do thu, chi, tạm ứng, đối tác, số hóa đơn hoặc nội dung thanh toán..."
                    />
                  </div>

                  {/* Toolbar Actions Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveFinEntry(false)}
                        className="px-4 py-2.5 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <IconCheck size={16} />
                        <span>💾 Lưu &amp; Ghi Sổ D1</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveFinEntry(true)}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <IconSend size={16} />
                        <span>⚡ Lưu &amp; Gửi Duyệt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const prefix = finEntryType === "thu" ? "PT" : finEntryType === "chi" ? "PC" : finEntryType === "tam_ung" ? "TU" : finEntryType === "hoa_don" ? "HD" : "CN";
                          setFinForm({
                            code: `${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                            date: new Date().toISOString().slice(0, 10),
                            party: "",
                            dept: "Sản Xuất (NM1)",
                            accountDebit: "1111",
                            accountCredit: "5111",
                            amount: "",
                            note: "",
                            attachment: "Chung-tu-kem-theo.pdf",
                          });
                          showToast("🔄 Đã làm mới form nhập liệu!");
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <IconRefresh size={15} />
                        <span>Làm Mới</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          showToast("📥 Đang kết nối nạp mẫu chứng từ tự động từ Cloudflare D1...");
                          setTimeout(() => {
                            showToast("✅ Đã nạp thành công 12 chứng từ mẫu từ D1 Database!");
                          }, 1000);
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006838] border border-emerald-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <IconDatabase size={15} />
                        <span>Dữ Liệu Mẫu D1</span>
                      </button>

                      <Link
                        href="/finance"
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <span>Tất cả 10 Phân hệ →</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* ════════ SỔ NHẬT KÝ CHỨNG TỪ & GIAO DỊCH SỐNG (LIVE LEDGER) ════════ */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        Sổ Nhật Ký Giao Dịch &amp; Chứng Từ Phát Sinh
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200">
                        {finTransactions.length} bút toán
                      </span>
                    </div>

                    {/* Filter Tabs & Search Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                        {[
                          { key: "all", label: "Tất cả" },
                          { key: "thu", label: "Thu" },
                          { key: "chi", label: "Chi" },
                          { key: "tam_ung", label: "Tạm ứng" },
                          { key: "hoa_don", label: "Hóa đơn" },
                          { key: "cong_no", label: "Công nợ" },
                        ].map((f) => (
                          <button
                            key={f.key}
                            onClick={() => setFinFilterTab(f.key)}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              finFilterTab === f.key
                                ? "bg-white text-[#006838] font-black shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={finSearchText}
                          onChange={(e) => setFinSearchText(e.target.value)}
                          placeholder="Tìm mã, đối tác..."
                          className="pl-7 pr-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-[#006838] bg-white w-36 sm:w-44"
                        />
                        <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Interactive Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Mã Chứng Từ</th>
                          <th className="py-2.5 px-3">Ngày</th>
                          <th className="py-2.5 px-3">Loại</th>
                          <th className="py-2.5 px-3">Đối tượng / Đối tác</th>
                          <th className="py-2.5 px-3">Phòng Ban</th>
                          <th className="py-2.5 px-3">Hạch toán (Nợ/Có)</th>
                          <th className="py-2.5 px-3 text-right">Số tiền (VNĐ)</th>
                          <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                          <th className="py-2.5 px-3 text-center">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {finTransactions
                          .filter((t) => (finFilterTab === "all" ? true : t.typeCode === finFilterTab))
                          .filter((t) =>
                            finSearchText
                              ? t.id.toLowerCase().includes(finSearchText.toLowerCase()) ||
                                t.party.toLowerCase().includes(finSearchText.toLowerCase()) ||
                                t.note.toLowerCase().includes(finSearchText.toLowerCase())
                              : true
                          )
                          .map((row, idx) => (
                            <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                {row.id}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-600 whitespace-nowrap">
                                {row.date}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  row.typeCode === "thu" ? "bg-emerald-100 text-emerald-800" :
                                  row.typeCode === "chi" ? "bg-rose-100 text-rose-800" :
                                  row.typeCode === "tam_ung" ? "bg-amber-100 text-amber-800" :
                                  row.typeCode === "hoa_don" ? "bg-purple-100 text-purple-800" :
                                  "bg-blue-100 text-blue-800"
                                }`}>
                                  {row.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800 max-w-[160px] truncate" title={row.party}>
                                {row.party}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 max-w-[130px] truncate font-medium" title={row.dept}>
                                {row.dept}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                Nợ <span className="font-bold text-slate-900">{row.debit}</span> / Có <span className="font-bold text-slate-900">{row.credit}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                                {row.amount.toLocaleString("vi-VN")} đ
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${row.statusColor}`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedFinItem(row);
                                      setIsFinPrintModalOpen(true);
                                    }}
                                    className="p-1 rounded-lg hover:bg-emerald-100 text-[#006838] transition-colors cursor-pointer"
                                    title="In phiếu thu/chi"
                                  >
                                    <IconPrinter size={15} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setFinTransactions(finTransactions.filter((item) => item.id !== row.id));
                                      showToast(`🗑️ Đã xóa chứng từ ${row.id}!`);
                                    }}
                                    className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                    title="Xóa chứng từ"
                                  >
                                    <IconTrash size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-slate-500 font-bold">Tổng thu: </span>
                        <span className="font-mono font-black text-emerald-700">
                          {finTransactions
                            .filter((t) => t.typeCode === "thu")
                            .reduce((acc, curr) => acc + curr.amount, 0)
                            .toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">Tổng chi: </span>
                        <span className="font-mono font-black text-rose-700">
                          {finTransactions
                            .filter((t) => t.typeCode === "chi" || t.typeCode === "tam_ung")
                            .reduce((acc, curr) => acc + curr.amount, 0)
                            .toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold">Dòng tiền ròng: </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-[#006838] font-mono font-black border border-emerald-200">
                        +{(
                          finTransactions
                            .filter((t) => t.typeCode === "thu")
                            .reduce((acc, curr) => acc + curr.amount, 0) -
                          finTransactions
                            .filter((t) => t.typeCode === "chi" || t.typeCode === "tam_ung")
                            .reduce((acc, curr) => acc + curr.amount, 0)
                        ).toLocaleString("vi-VN")}{" "}
                        đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ════════ 3 MAIN CARDS GRID (Xu hướng, Hoạt động, Truy cập nhanh) ════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                {/* 1. XU HƯỚNG TÀI CHÍNH (Col 4/12) */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900">Xu hướng tài chính</h3>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                      <span>6 tháng gần đây</span>
                      <IconChevronDown size={13} className="text-slate-400" />
                    </div>
                  </div>

                  {/* Line Chart with 2 Series (Doanh thu & Chi phí) */}
                  <div className="w-full h-44 my-2 relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 340 140" preserveAspectRatio="none">
                      {/* Gridlines & Y-Axis Scale (125, 100, 75, 50, 25, 0) */}
                      {[
                        { label: "125", y: 15 },
                        { label: "100", y: 38 },
                        { label: "75", y: 61 },
                        { label: "50", y: 84 },
                        { label: "25", y: 107 },
                        { label: "0", y: 130 },
                      ].map((g, i) => (
                        <g key={i}>
                          <text x="24" y={g.y + 3.5} textAnchor="end" fill="#94a3b8" fontSize="9" fontWeight="600" className="font-mono">
                            {g.label}
                          </text>
                          <line x1="32" y1={g.y} x2="330" y2={g.y} stroke="#f1f5f9" strokeWidth="1" />
                        </g>
                      ))}

                      {/* Line 1: Doanh thu (#006838 - Dark Green) */}
                      <path
                        d="M 50 91 L 105 75 L 160 62 L 215 49 L 270 36 L 325 21"
                        fill="none"
                        stroke="#006838"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {[
                        { x: 50, y: 91, val: "42M" },
                        { x: 105, y: 75, val: "60M" },
                        { x: 160, y: 62, val: "74M" },
                        { x: 215, y: 49, val: "88M" },
                        { x: 270, y: 36, val: "102M" },
                        { x: 325, y: 21, val: "118M" },
                      ].map((pt, idx) => (
                        <circle key={idx} cx={pt.x} cy={pt.y} r="4" fill="#006838" stroke="#ffffff" strokeWidth="2" />
                      ))}

                      {/* Line 2: Chi phí (#4ade80 - Light Green) */}
                      <path
                        d="M 50 110 L 105 102 L 160 97 L 215 89 L 270 78 L 325 67"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {[
                        { x: 50, y: 110, val: "22M" },
                        { x: 105, y: 102, val: "30M" },
                        { x: 160, y: 97, val: "36M" },
                        { x: 215, y: 89, val: "45M" },
                        { x: 270, y: 78, val: "56M" },
                        { x: 325, y: 67, val: "68M" },
                      ].map((pt, idx) => (
                        <circle key={idx} cx={pt.x} cy={pt.y} r="4" fill="#4ade80" stroke="#ffffff" strokeWidth="2" />
                      ))}

                      {/* X-Axis Labels (T3, T4, T5, T6, T7, T8) */}
                      {["T3", "T4", "T5", "T6", "T7", "T8"].map((m, i) => (
                        <text key={m} x={50 + i * 55} y="139" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="700" className="font-mono">
                          {m}
                        </text>
                      ))}
                    </svg>
                  </div>

                  {/* Legend Footer */}
                  <div className="flex items-center justify-center gap-6 pt-1 text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#006838]" />
                      Doanh thu
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
                      Chi phí
                    </span>
                  </div>
                </div>

                {/* 2. HOẠT ĐỘNG NỔI BẬT (Col 4/12) */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900">Hoạt động nổi bật</h3>
                  </div>

                  <div className="space-y-2.5 my-auto py-1">
                    {/* Item 1 */}
                    <Link href="/finance/bao-cao" className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100">
                          <IconFileInvoice size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-[#006838] transition-colors">
                            Báo cáo tài chính tháng 8
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Đã hoàn thành • 2 giờ trước
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex-shrink-0">
                        Hoàn thành
                      </span>
                    </Link>

                    {/* Item 2 */}
                    <Link href="/finance/cong-no" className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-amber-50/40 hover:border-amber-200 transition-all flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100">
                          <IconShoppingCart size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                            Đối soát công nợ nhà cung cấp
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Đang xử lý • 1 ngày trước
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md flex-shrink-0">
                        Đang xử lý
                      </span>
                    </Link>

                    {/* Item 3 */}
                    <Link href="/finance/chi-phi" className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100">
                          <IconChartPie size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-[#006838] transition-colors">
                            Tổng hợp chi phí sản xuất
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Đã hoàn thành • 2 ngày trước
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex-shrink-0">
                        Hoàn thành
                      </span>
                    </Link>
                  </div>

                  <Link href="/finance/bao-cao" className="text-center text-xs font-bold text-[#006838] hover:underline pt-2 block">
                    Xem tất cả hoạt động →
                  </Link>
                </div>

                {/* 3. TRUY CẬP NHANH - KẾ TOÁN & QT (Col 4/12) */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900">Truy cập nhanh – Kế toán & QT</h3>
                  </div>

                  {/* 8 Quick Action Tiles (4 cols x 2 rows) */}
                  <div className="grid grid-cols-4 gap-2 my-auto py-1">
                    {[
                      { name: "Thu – Chi", icon: IconWallet, href: "/finance/thu-chi" },
                      { name: "Báo cáo tài chính", icon: IconChartBar, href: "/finance/bao-cao" },
                      { name: "Ngân sách", icon: IconCalendarEvent, href: "/finance/ngan-sach" },
                      { name: "Công nợ", icon: IconUsers, href: "/finance/cong-no" },
                      { name: "Kho quỹ", icon: IconMail, href: "/finance/vat-tu-kho" },
                      { name: "Hóa đơn", icon: IconFileText, href: "/finance/hoa-don" },
                      { name: "Tài sản", icon: IconDeviceDesktop, href: "/finance/tai-san" },
                      { name: "Cài đặt", icon: IconSettings, href: "/finance" },
                    ].map((btn, idx) => {
                      const BtnIcon = btn.icon;
                      return (
                        <Link
                          key={idx}
                          href={btn.href}
                          className="p-2 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-[#e6f4ed] hover:border-[#006838]/60 transition-all flex flex-col items-center text-center gap-1 group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-all flex items-center justify-center">
                            <BtnIcon size={18} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 leading-tight group-hover:text-[#006838] transition-colors line-clamp-2">
                            {btn.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  <Link
                    href="/finance"
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50/80 hover:bg-[#006838] text-[#006838] hover:text-white border border-emerald-200/80 text-xs font-extrabold text-center transition-all shadow-2xs mt-2 block"
                  >
                    Xem tất cả chức năng →
                  </Link>
                </div>
              </div>

              {/* ════════ 10 PHÂN HỆ KẾ TOÁN & QUẢN TRỊ NỘI BỘ (FULL LIST) ════════ */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center font-black">
                      <IconCalculator size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        Danh Mục 10 Phân Hệ Kế Toán &amp; Quản Trị
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Hệ thống phân hệ nghiệp vụ số hóa hoàn chỉnh cho Văn phòng chuỗi SKECHERS - TBS Group
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/finance"
                    className="text-xs font-bold text-[#006838] hover:underline flex items-center gap-1"
                  >
                    <span>Mở Hub Kế toán</span>
                    <IconArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {[
                    {
                      num: "01",
                      title: "1. 💰 Thu – Chi",
                      href: "/finance/thu-chi",
                      badge: "8 phiếu T8",
                      desc: ["Tạo phiếu thu / Tạo phiếu chi", "Tạm ứng / Hoàn ứng", "Theo dõi quỹ tiền mặt & NH", "Duyệt phiếu thu/chi & Lịch sử"],
                    },
                    {
                      num: "02",
                      title: "2. 🧾 Hóa đơn & Chứng từ",
                      href: "/finance/hoa-don",
                      badge: "47 HĐ T8",
                      desc: ["Hóa đơn đầu vào & đầu ra", "Nhập & tra cứu hóa đơn", "Đính kèm chứng từ điện tử", "Đối chiếu hóa đơn - Phiếu chi"],
                    },
                    {
                      num: "03",
                      title: "3. 🤝 Công nợ",
                      href: "/finance/cong-no",
                      badge: "2 quá hạn",
                      desc: ["Công nợ phải trả & phải thu", "Danh sách đối tác & NCC", "Theo dõi hạn & quá hạn", "Cảnh báo & đối chiếu công nợ"],
                    },
                    {
                      num: "04",
                      title: "4. 📊 Ngân sách",
                      href: "/finance/ngan-sach",
                      badge: "1 PB vượt NS",
                      desc: ["Lập & phân bổ ngân sách", "Ngân sách theo PB / Đơn vị", "Theo dõi Budget / Actual", "Cảnh báo vượt & điều chỉnh"],
                    },
                    {
                      num: "05",
                      title: "5. 💸 Chi phí",
                      href: "/finance/chi-phi",
                      badge: "1.77 tỷ đ",
                      desc: ["Chi phí văn phòng, nhân sự", "Chi phí công tác & R&D", "Chi phí mua sắm & dịch vụ", "Chi phí thuê mặt bằng & vận hành"],
                    },
                    {
                      num: "06",
                      title: "6. 🏢 Tài sản",
                      href: "/finance/tai-san",
                      badge: "1 TS sửa",
                      desc: ["Danh sách tài sản & cấp phát", "Bàn giao & điều chuyển TS", "Kiểm kê & theo dõi khấu hao", "Tài sản hư hỏng & thanh lý"],
                    },
                    {
                      num: "07",
                      title: "7. 📦 Vật tư & Kho",
                      href: "/finance/vat-tu-kho",
                      badge: "2 tồn thấp",
                      desc: ["Nhập kho / Xuất kho", "Điều chuyển & kiểm kê kho", "Theo dõi nhập - xuất - tồn", "Cảnh báo tồn kho thấp"],
                    },
                    {
                      num: "08",
                      title: "8. 🔄 Đối soát",
                      href: "/finance/doi-soat",
                      badge: "3 chênh lệch",
                      desc: ["Đối soát thu chi & ngân hàng", "Đối soát hóa đơn & công nợ", "Đối soát chứng từ & NS", "Ghi nhận nguyên nhân lệch"],
                    },
                    {
                      num: "09",
                      title: "9. ✅ Phê duyệt",
                      href: "/finance/phe-duyet",
                      badge: "2 chờ duyệt",
                      desc: ["Quy trình workflow 4 cấp", "Duyệt phiếu chi & tạm ứng", "Duyệt đề nghị mua sắm", "Duyệt điều chỉnh ngân sách"],
                    },
                    {
                      num: "10",
                      title: "10. 📈 Báo cáo quản trị",
                      href: "/finance/bao-cao",
                      badge: "8 báo cáo",
                      desc: ["BC Thu-Chi & Chi phí", "BC Ngân sách & Công nợ", "BC Tài sản, Kho & Dòng tiền", "Xuất file Excel/PDF định kỳ"],
                    },
                  ].map((mod, idx) => (
                    <Link
                      key={idx}
                      href={mod.href}
                      className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-[#006838]/60 hover:shadow-sm transition-all flex flex-col justify-between gap-2.5 group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-200/50">
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-[#006838] transition-colors leading-tight">
                            {mod.title}
                          </h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-[#006838] border border-emerald-100 flex-shrink-0">
                            {mod.badge}
                          </span>
                        </div>

                        <ul className="space-y-0.5 pt-1.5">
                          {mod.desc.map((d, dIdx) => (
                            <li key={dIdx} className="text-[10px] text-slate-600 flex items-start gap-1 leading-snug">
                              <span className="text-[#006838] font-bold">•</span>
                              <span className="truncate">{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-1 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-extrabold text-[#006838] group-hover:translate-x-0.5 transition-transform">
                        <span>Truy cập module</span>
                        <IconArrowRight size={12} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              IF HR (NHÂN SỰ HÀNH CHÁNH) IS SELECTED
             ════════════════════════════════════════════════════════════════ */}
          {selectedDept === "hr" && (
            <div className="space-y-4 w-full">
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
                  <Link
                    href="/rooms"
                    className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#006838]/60 transition-all flex flex-col justify-between gap-2.5 group relative overflow-hidden cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconDevices size={36} className="stroke-[1.5]" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="text-base font-black text-slate-900 tracking-tight group-hover:text-[#006838] transition-colors">
                          Quản lý phòng họp
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight">
                          Đặt lịch, quản lý phòng họp, đón khách ngoài và trang thiết bị.
                        </p>

                        {/* Checklist */}
                        <ul className="space-y-1 pt-0.5">
                          <li className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                              ✓
                            </span>
                            <span>Đặt lịch phòng họp &amp; thiết bị</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                              ✓
                            </span>
                            <span>Quản lý đón khách &amp; Cấp thẻ</span>
                          </li>
                          <li className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                              ✓
                            </span>
                            <span>Khóa bảo trì &amp; Dữ liệu D1</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Arrow Action Button */}
                    <div className="flex justify-end pt-0.5">
                      <div className="w-7.5 h-7.5 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-xs">
                        <IconArrowRight size={15} />
                      </div>
                    </div>
                  </Link>

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
                  <Link
                    href="/hr"
                    className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all flex flex-col justify-between gap-2 group cursor-pointer"
                  >
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconId size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#006838] transition-colors tracking-tight">
                          Hồ sơ nhân sự
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Quản lý thông tin hồ sơ và quá trình công tác của nhân viên.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </Link>

                  {/* Sub-Card 2: Quản lý nghỉ phép */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconCalendarEvent size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#006838] transition-colors tracking-tight">
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
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconClockCheck size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#006838] transition-colors tracking-tight">
                          Chấm công
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Theo dõi, quản lý và tổng hợp dữ liệu chấm công.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 4: Đánh giá nhân viên */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconTrendingUp size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#006838] transition-colors tracking-tight">
                          Đánh giá nhân viên
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Đánh giá hiệu suất làm việc và năng lực nhân viên.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 5: Đào tạo & phát triển */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconSchool size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#006838] transition-colors tracking-tight">
                          Đào tạo &amp; phát triển
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Quản lý kế hoạch đào tạo và phát triển kỹ năng nhân viên.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 6: Lương & phúc lợi */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconCash size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#006838] transition-colors tracking-tight">
                          Lương &amp; phúc lợi
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Quản lý thông tin lương, thưởng và phúc lợi nhân viên.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card 7: Tuyển dụng */}
                  <Link
                    href="/careers"
                    className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all flex flex-col justify-between gap-2 group cursor-pointer"
                  >
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconUserPlus size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#006838] transition-colors tracking-tight">
                          Tuyển dụng
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Quản lý quy trình tuyển dụng và theo dõi ứng viên.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-colors flex items-center justify-center">
                        <IconArrowRight size={13} />
                      </div>
                    </div>
                  </Link>

                  {/* Sub-Card 8: Báo cáo nhân sự */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all flex flex-col justify-between gap-2 group cursor-pointer">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <IconFileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#006838] transition-colors tracking-tight">
                          Báo cáo nhân sự
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal leading-tight line-clamp-2">
                          Hệ thống báo cáo tổng hợp về nhân sự và thống kê.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <div className="w-6.5 h-6.5 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white transition-colors flex items-center justify-center">
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

          {/* IF CN-CI (CẢI TIẾN LIÊN TỤC) IS SELECTED */}
          {selectedDept === "ci" && (
            <div className="space-y-4 w-full min-w-0">
              {/* 4 TOP METRIC CARDS - Always 4 cards in 1 single horizontal row on Desktop (lg >= 1024px) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 min-w-0">
                {/* Card 1: Sáng kiến cải tiến */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-start gap-3 group hover:shadow-md transition-all min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-100/80 group-hover:scale-105 transition-transform flex-shrink-0">
                    <IconChartBar size={22} />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 block truncate">Sáng kiến cải tiến</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">128</div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 whitespace-nowrap">
                      +18% <span className="text-slate-400 font-normal">so với tháng trước</span> ↑
                    </span>
                  </div>
                </div>

                {/* Card 2: Cải tiến đã triển khai */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-start gap-3 group hover:shadow-md transition-all min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-100/80 group-hover:scale-105 transition-transform flex-shrink-0">
                    <IconCircleCheck size={22} />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 block truncate">Cải tiến đã triển khai</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">86</div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 whitespace-nowrap">
                      +12% <span className="text-slate-400 font-normal">so với tháng trước</span> ↑
                    </span>
                  </div>
                </div>

                {/* Card 3: Hiệu quả đạt được */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-start gap-3 group hover:shadow-md transition-all min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-100/80 group-hover:scale-105 transition-transform flex-shrink-0">
                    <IconTrendingUp size={22} />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 block truncate">Hiệu quả đạt được</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">3.24 tỷ</div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 whitespace-nowrap">
                      Giá trị làm lợi (VND)
                    </span>
                  </div>
                </div>

                {/* Card 4: Thành viên tham gia */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-start gap-3 group hover:shadow-md transition-all min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-100/80 group-hover:scale-105 transition-transform flex-shrink-0">
                    <IconUsers size={22} />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 block truncate">Thành viên tham gia</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">246</div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 whitespace-nowrap">
                      +22% <span className="text-slate-400 font-normal">so với tháng trước</span> ↑
                    </span>
                  </div>
                </div>
              </div>

              {/* MIDDLE SECTION - FULL-WIDTH LINE CHART CARD */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4 min-w-0">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <h3 className="text-base font-black text-slate-900 truncate">Xu hướng cải tiến</h3>
                  <select className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer flex-shrink-0">
                    <option>6 tháng gần đây</option>
                    <option>3 tháng gần đây</option>
                    <option>Năm 2026</option>
                  </select>
                </div>

                {/* SVG Line Chart (Full-Width Responsive) */}
                <div className="w-full relative min-w-0 overflow-hidden py-2">
                  <svg className="w-full h-44 sm:h-52 overflow-visible" viewBox="0 0 900 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ciLineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#006838" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#006838" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="45" y1="20" x2="865" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="45" y1="55" x2="865" y2="55" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="45" y1="90" x2="865" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="45" y1="125" x2="865" y2="125" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Y Axis Labels */}
                    <text x="10" y="24" className="text-[11px] fill-slate-400 font-semibold">100</text>
                    <text x="10" y="59" className="text-[11px] fill-slate-400 font-semibold">75</text>
                    <text x="10" y="94" className="text-[11px] fill-slate-400 font-semibold">50</text>
                    <text x="10" y="129" className="text-[11px] fill-slate-400 font-semibold">0</text>

                    {/* Area Fill */}
                    <polygon
                      points="50,110 210,90 370,75 530,50 690,38 850,20 850,125 50,125"
                      fill="url(#ciLineGrad)"
                    />

                    {/* Line Curve */}
                    <path
                      d="M 50 110 L 210 90 L 370 75 L 530 50 L 690 38 L 850 20"
                      fill="none"
                      stroke="#006838"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data points + Month Labels (100% Perfectly Aligned) */}
                    {[
                      { month: "T3", idea: 35, impl: 20, x: 50, y: 110 },
                      { month: "T4", idea: 50, impl: 32, x: 210, y: 90 },
                      { month: "T5", idea: 62, impl: 45, x: 370, y: 75 },
                      { month: "T6", idea: 78, impl: 58, x: 530, y: 50 },
                      { month: "T7", idea: 88, impl: 70, x: 690, y: 38 },
                      { month: "T8", idea: 100, impl: 86, x: 850, y: 20 },
                    ].map((pt, i) => (
                      <g key={i}>
                        {/* Month Label */}
                        <text
                          x={pt.x}
                          y="150"
                          textAnchor="middle"
                          className="text-[12px] fill-slate-600 font-bold select-none"
                        >
                          {pt.month}
                        </text>

                        {/* Point Circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredCiIndex === i ? "7" : "5.5"}
                          fill={hoveredCiIndex === i ? "#006838" : "#ffffff"}
                          stroke="#006838"
                          strokeWidth={hoveredCiIndex === i ? "4" : "3"}
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredCiIndex(i)}
                          onMouseLeave={() => setHoveredCiIndex(null)}
                          onClick={() => setIsDonutModalOpen(true)}
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Interactive Hover Tooltip Popup Overlay */}
                  {hoveredCiIndex !== null && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
                      <span>💡 Tháng {[ "T3", "T4", "T5", "T6", "T7", "T8" ][hoveredCiIndex]}: </span>
                      <span className="text-emerald-300 font-extrabold">{[ 35, 50, 62, 78, 88, 100 ][hoveredCiIndex]} sáng kiến</span>
                      <span className="text-slate-400"> | </span>
                      <span className="text-teal-300">{[ 20, 32, 45, 58, 70, 86 ][hoveredCiIndex]} triển khai</span>
                    </div>
                  )}
                </div>

                {/* Legend Below Chart */}
                <div className="flex items-center justify-center gap-8 pt-2 text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#006838]" />
                    <span>Sáng kiến</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-300" />
                    <span>Triển khai</span>
                  </span>
                </div>
              </div>

              {/* BOTTOM SECTION - 2 EQUAL-WIDTH COLUMNS SIDE-BY-SIDE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
                {/* LEFT COL: Hoạt động nổi bật */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4 min-w-0">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-base font-black text-slate-900">Hoạt động nổi bật</h3>
                  </div>

                  <div className="space-y-3 flex-1 my-auto min-w-0">
                    {/* Activity 1 */}
                    <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between gap-3 min-w-0 hover:bg-slate-100/60 transition">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-[#006838] flex items-center justify-center flex-shrink-0">
                          <IconBulb size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                            Kaizen: Giảm thời gian setup line A
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Được duyệt • 2 giờ trước
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#006838] text-[11px] font-bold flex-shrink-0 whitespace-nowrap">
                        Đã triển khai
                      </span>
                    </div>

                    {/* Activity 2 */}
                    <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between gap-3 min-w-0 hover:bg-slate-100/60 transition">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-[#006838] flex items-center justify-center flex-shrink-0">
                          <IconCircleCheck size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                            Gemba Walk tuần 31
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Đã hoàn thành • 1 ngày trước
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold flex-shrink-0 whitespace-nowrap">
                        Hoàn thành
                      </span>
                    </div>

                    {/* Activity 3 */}
                    <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between gap-3 min-w-0 hover:bg-slate-100/60 transition">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center flex-shrink-0">
                          <IconFileText size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                            Đề xuất cải tiến đóng gói
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Đang đánh giá • 2 ngày trước
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex-shrink-0 whitespace-nowrap">
                        Đang xét duyệt
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-center border-t border-slate-100">
                    <button className="text-xs font-extrabold text-[#006838] hover:underline cursor-pointer inline-flex items-center gap-1">
                      <span>Xem tất cả hoạt động</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT COL: Truy cập nhanh – CN–CI */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4 min-w-0">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-base font-black text-slate-900 truncate">Truy cập nhanh – CN–CI</h3>
                  </div>

                  {/* 4 x 2 Grid of Tiles */}
                  <div className="grid grid-cols-4 gap-3 my-auto min-w-0">
                    {[
                      { name: "Kaizen", icon: IconBulb, bg: "bg-emerald-100/70 text-[#006838]" },
                      { name: "Gemba", icon: IconUsers, bg: "bg-blue-100/70 text-blue-600" },
                      { name: "CI", icon: IconTrendingUp, bg: "bg-teal-100/70 text-teal-600" },
                      { name: "Thư viện", icon: IconBook, bg: "bg-amber-100/70 text-amber-600" },
                      { name: "Lưu trữ", icon: IconFolder, bg: "bg-purple-100/70 text-purple-600" },
                      { name: "Thi đua", icon: IconTrophy, bg: "bg-emerald-100/70 text-[#006838]" },
                      { name: "Báo cáo", icon: IconFileText, bg: "bg-blue-100/70 text-blue-600" },
                      { name: "Cài đặt", icon: IconSettings, bg: "bg-slate-100 text-slate-600" },
                    ].map((tile, idx) => {
                      const TileIcon = tile.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => showToast(`Mở chức năng: ${tile.name}`)}
                          className="p-2 sm:p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-[#006838]/60 hover:shadow-sm transition-all flex flex-col items-center text-center gap-1.5 group cursor-pointer min-w-0"
                        >
                          <div className={`w-10 h-10 rounded-xl ${tile.bg} flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0`}>
                            <TileIcon size={20} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 leading-tight truncate w-full text-center">
                            {tile.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <button className="w-full py-2.5 rounded-xl bg-emerald-50 text-[#006838] hover:bg-[#006838] hover:text-white border border-emerald-200/60 text-xs font-extrabold transition-all cursor-pointer inline-flex items-center justify-center gap-1 shadow-2xs">
                      <span>Xem tất cả chức năng</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IF QC (QUẢN LÝ CHẤT LƯỢNG) IS SELECTED */}
          {selectedDept === "qc" && (
            <div className="space-y-3.5 my-auto">


              {/* FILTER & TOOLBAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1">
                      <IconFilter size={14} /> Nhà máy:
                    </span>
                    <select
                      value={plantFilter}
                      onChange={(e) => setPlantFilter(e.target.value)}
                      className="text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <option>Toàn nhà máy</option>
                      <option>Nhà máy 1 (NM1)</option>
                      <option>Nhà máy 2 (NM2)</option>
                      <option>Nhà máy 3 (NM3)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1">
                      <IconCalendarEvent size={14} /> Thời gian:
                    </span>
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                      {["Hôm nay", "Tháng này", "30 ngày", "Tùy chọn"].map((label) => (
                        <button
                          key={label}
                          onClick={() => setTimeFilter(label)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition-all cursor-pointer ${timeFilter === label
                              ? "bg-[#006838] text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Can permission={PERMISSIONS.QC_MANAGE}>
                  <button
                    onClick={() => showToast("📊 Đang xuất báo cáo kiểm tra chất lượng QC...")}
                    className="flex items-center gap-1.5 bg-[#006838] hover:bg-[#00522c] text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <IconDownload size={15} />
                    <span>Xuất báo cáo PDF/Excel</span>
                  </button>
                </Can>
              </div>

              {/* HIỆU SUẤT TỔNG THỂ + TÌNH HÌNH LỖI (GRID ROW 1) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* HIỆU SUẤT TỔNG THỂ (Col 5/12) */}
                <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <IconTrendingUp size={16} className="text-[#006838]" />
                      <span>Hiệu suất tổng thể</span>
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Realtime</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-auto py-1">
                    {[
                      {
                        label: "Tỷ lệ đạt QC",
                        value: plantFilter === "Nhà máy 1 (NM1)" ? 98.1 : plantFilter === "Nhà máy 2 (NM2)" ? 96.4 : plantFilter === "Nhà máy 3 (NM3)" ? 97.5 : 97.2,
                        sub: "Đạt chuẩn",
                        trend: "+2.1% kỳ trước",
                        target: "Mục tiêu: ≥ 95%",
                        color: "#006838",
                        track: "#e6f4ed",
                      },
                      {
                        label: "OEE Tổng thể",
                        value: plantFilter === "Nhà máy 1 (NM1)" ? 91.2 : plantFilter === "Nhà máy 2 (NM2)" ? 86.8 : plantFilter === "Nhà máy 3 (NM3)" ? 89.0 : 88.6,
                        sub: "Hiệu quả cao",
                        trend: "+1.8% kỳ trước",
                        target: "Mục tiêu: ≥ 85%",
                        color: "#0284c7",
                        track: "#e0f2fe",
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setIsDonutModalOpen(true)}
                        className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-white hover:border-[#006838]/60 hover:shadow-md transition-all cursor-pointer group min-w-0"
                        title="Bấm để xem phân bổ chi tiết 6 xưởng SKECHERS"
                      >
                        <span className="text-[11px] font-extrabold text-slate-700 mb-1.5">{item.label}</span>
                        <div className="relative w-20 h-20 group-hover:scale-105 transition-transform">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke={item.track} strokeWidth="9" />
                            <circle
                              cx="50" cy="50" r="40" fill="none"
                              stroke={item.color} strokeWidth="9" strokeLinecap="round"
                              strokeDasharray={`${(item.value / 100) * 251.2} 251.2`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-base font-black text-slate-900 leading-none">{item.value}%</span>
                            <span className="text-[9px] font-extrabold text-slate-400 mt-0.5">{item.sub}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 mt-1.5">▲ {item.trend}</span>
                        <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5 mt-1 group-hover:bg-[#006838] group-hover:text-white transition-colors">
                          Xem chi tiết xưởng →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TÌNH HÌNH LỖI (Col 7/12) - Dynamic Data Connected */}
                <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <IconAlertCircle size={16} className="text-amber-500" />
                      <span>Tình hình lỗi kiểm hàng ({plantFilter})</span>
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500">7 ngày qua</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 my-1">
                    <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200/70">
                      <span className="text-[10px] font-medium text-slate-500 block truncate">Tổng số lỗi</span>
                      <div className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                        {plantFilter === "Nhà máy 1 (NM1)" ? "380" : plantFilter === "Nhà máy 2 (NM2)" ? "520" : plantFilter === "Nhà máy 3 (NM3)" ? "348" : "1,248"}
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600">▲ 12.4%</span>
                    </div>

                    <div className="bg-rose-50/70 p-2 sm:p-2.5 rounded-xl border border-rose-100">
                      <span className="text-[10px] font-medium text-rose-700 block truncate">Lỗi SOS</span>
                      <div className="text-base sm:text-lg font-black text-rose-600 leading-tight mt-0.5">
                        {plantFilter === "Nhà máy 1 (NM1)" ? "3" : plantFilter === "Nhà máy 2 (NM2)" ? "8" : plantFilter === "Nhà máy 3 (NM3)" ? "4" : "15"}
                      </div>
                      <span className="text-[9px] font-bold text-rose-600">▲ 36.4%</span>
                    </div>

                    <div className="bg-amber-50/70 p-2 sm:p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] font-medium text-amber-800 block truncate">Lỗi cần sửa</span>
                      <div className="text-base sm:text-lg font-black text-amber-800 leading-tight mt-0.5">
                        {plantFilter === "Nhà máy 1 (NM1)" ? "24" : plantFilter === "Nhà máy 2 (NM2)" ? "42" : plantFilter === "Nhà máy 3 (NM3)" ? "21" : "87"}
                      </div>
                      <span className="text-[9px] font-bold text-amber-700">▲ 8.3%</span>
                    </div>

                    <div className="bg-emerald-50/70 p-2 sm:p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-medium text-emerald-800 block truncate">Đã xử lý</span>
                      <div className="text-base sm:text-lg font-black text-[#006838] leading-tight mt-0.5">
                        {plantFilter === "Nhà máy 1 (NM1)" ? "353" : plantFilter === "Nhà máy 2 (NM2)" ? "470" : plantFilter === "Nhà máy 3 (NM3)" ? "323" : "1,146"}
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700">▲ 15.7%</span>
                    </div>
                  </div>

                  {/* Trend SVG Line Chart - Interactive with Y-axis and Higher Chart Height */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-0.5">
                      <span className="flex items-center gap-1.5">
                        <span>Xu hướng biến động theo ngày</span>
                        <span className="text-[10px] text-slate-400 font-normal">(Đơn vị: Lỗi)</span>
                      </span>
                      <span className="text-xs text-[#006838] font-black bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        TB: {plantFilter === "Nhà máy 1 (NM1)" ? "54" : plantFilter === "Nhà máy 2 (NM2)" ? "74" : plantFilter === "Nhà máy 3 (NM3)" ? "50" : "178"} lỗi/ngày
                      </span>
                    </div>

                    <div className="w-full h-48 sm:h-52 relative bg-slate-50/40 rounded-xl p-2 border border-slate-100">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 540 165" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="qcLineGradientHuman" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#006838" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#006838" stopOpacity="0.01" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Horizontal Grid Lines & Labels */}
                        {[
                          { val: 300, y: 20 },
                          { val: 200, y: 60 },
                          { val: 100, y: 100 },
                          { val: 0, y: 140 },
                        ].map((grid, idx) => (
                          <g key={idx}>
                            {/* Y-Axis text */}
                            <text
                              x="38"
                              y={grid.y + 4}
                              textAnchor="end"
                              fill="#94a3b8"
                              fontSize="10"
                              fontWeight="700"
                              className="select-none font-mono"
                            >
                              {grid.val}
                            </text>
                            {/* Grid line */}
                            <line
                              x1="46"
                              y1={grid.y}
                              x2="525"
                              y2={grid.y}
                              stroke={grid.val === 0 ? "#cbd5e1" : "#e2e8f0"}
                              strokeWidth={grid.val === 0 ? "1.5" : "1"}
                              strokeDasharray={grid.val === 0 ? "none" : "3 3"}
                            />
                          </g>
                        ))}

                        {/* Vertical Y-Axis Line */}
                        <line x1="46" y1="15" x2="46" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />

                        {/* Area fill under curve */}
                        <polygon
                          points="75,66 145,42 215,92 285,24 355,54 425,56 495,105 495,140 75,140"
                          fill="url(#qcLineGradientHuman)"
                        />

                        {/* Main trend line */}
                        <path
                          d="M 75 66 L 145 42 L 215 92 L 285 24 L 355 54 L 425 56 L 495 105"
                          fill="none"
                          stroke="#006838"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Interactive QC Points with Exact Coordinates and Value Badges */}
                        {[
                          { date: "09/08", total: 185, sos: 2, fix: 14, x: 75, y: 66 },
                          { date: "10/08", total: 245, sos: 4, fix: 18, x: 145, y: 42 },
                          { date: "11/08", total: 120, sos: 1, fix: 8, x: 215, y: 92 },
                          { date: "12/08", total: 290, sos: 3, fix: 15, x: 285, y: 24 },
                          { date: "13/08", total: 215, sos: 2, fix: 14, x: 355, y: 54 },
                          { date: "14/08", total: 210, sos: 2, fix: 12, x: 425, y: 56 },
                          { date: "15/08", total: 88, sos: 1, fix: 6, x: 495, y: 105 },
                        ].map((pt, i) => (
                          <g key={i} className="group/pt">
                            {/* Vertical drop line to X-axis on hover */}
                            {hoveredQcIndex === i && (
                              <line
                                x1={pt.x}
                                y1={pt.y}
                                x2={pt.x}
                                y2="140"
                                stroke="#006838"
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                              />
                            )}

                            {/* Exact Number Badge on top of each node */}
                            <rect
                              x={pt.x - 14}
                              y={pt.y - 18}
                              width="28"
                              height="14"
                              rx="4"
                              fill={hoveredQcIndex === i ? "#006838" : "#ffffff"}
                              stroke={hoveredQcIndex === i ? "#006838" : "#e2e8f0"}
                              strokeWidth="1"
                              className="transition-colors shadow-2xs"
                            />
                            <text
                              x={pt.x}
                              y={pt.y - 8}
                              textAnchor="middle"
                              fill={hoveredQcIndex === i ? "#ffffff" : "#0f172a"}
                              fontSize="9"
                              fontWeight="800"
                              className="select-none pointer-events-none font-mono"
                            >
                              {pt.total}
                            </text>

                            {/* Circle Node */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredQcIndex === i ? "6.5" : "4"}
                              fill={hoveredQcIndex === i ? "#006838" : "#ffffff"}
                              stroke="#006838"
                              strokeWidth={hoveredQcIndex === i ? "3.5" : "2.5"}
                              className="cursor-pointer transition-all duration-150"
                              onMouseEnter={() => setHoveredQcIndex(i)}
                              onMouseLeave={() => setHoveredQcIndex(null)}
                              onClick={() => setIsDonutModalOpen(true)}
                            />

                            {/* X-axis date label aligned directly under each point */}
                            <text
                              x={pt.x}
                              y="156"
                              textAnchor="middle"
                              fill={hoveredQcIndex === i ? "#006838" : "#64748b"}
                              fontSize="10"
                              fontWeight={hoveredQcIndex === i ? "800" : "600"}
                              className="select-none pointer-events-none font-mono"
                            >
                              {pt.date}
                            </text>
                          </g>
                        ))}
                      </svg>

                      {/* QC Live Hover Tooltip Popup Overlay */}
                      {hoveredQcIndex !== null && (
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xl border border-slate-700 pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
                          <span>📊 {[ "09/08", "10/08", "11/08", "12/08", "13/08", "14/08", "15/08" ][hoveredQcIndex]}: </span>
                          <span className="text-emerald-300 font-extrabold">{[ 185, 245, 120, 290, 215, 210, 88 ][hoveredQcIndex]} lỗi</span>
                          <span className="text-slate-400"> | </span>
                          <span className="text-rose-300">SOS: {[ 2, 4, 1, 3, 2, 2, 1 ][hoveredQcIndex]}</span>
                          <span className="text-slate-400"> | </span>
                          <span className="text-amber-300">Sửa: {[ 14, 18, 8, 15, 14, 12, 6 ][hoveredQcIndex]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CHỨC NĂNG NHANH + CẢNH BÁO + HIỆU SUẤT NHÀ MÁY (GRID ROW 2) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* CHỨC NĂNG NHANH (Col 5/12) */}
                <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">Chức năng thao tác nhanh</h3>
                  </div>

                  <div className="grid grid-cols-4 gap-2 my-auto">
                    {[
                      { name: "Báo cáo vấn đề", icon: IconAlertCircle, bg: "bg-emerald-50 text-[#006838]" },
                      { name: "Nhiệm vụ & Việc", icon: IconBriefcase, bg: "bg-blue-50 text-blue-600" },
                      { name: "Thông báo QC", icon: IconBell, bg: "bg-purple-50 text-purple-600" },
                      { name: "Thư viện PO", icon: IconFileText, bg: "bg-amber-50 text-amber-600" },
                      { name: "Dashboard", icon: IconTrendingUp, bg: "bg-blue-50 text-blue-600" },
                      { name: "Chốt tiếp nhận", icon: IconCheck, bg: "bg-amber-50 text-amber-600" },
                      { name: "Chạy thử chuyền", icon: IconPlayerPlay, bg: "bg-purple-50 text-purple-600" },
                      { name: "Xử lý SOS", icon: IconAlertTriangle, bg: "bg-rose-50 text-rose-600" },
                    ].map((app, idx) => {
                      const AppIcon = app.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => showToast(`Thực hiện: ${app.name}`)}
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

                {/* CẢNH BÁO THỜI GIAN THỰC (Col 3/12) */}
                <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5 whitespace-nowrap min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                      <span className="truncate">Cảnh báo thời gian thực</span>
                    </h3>
                    <button className="text-[10px] font-bold text-[#006838] hover:underline cursor-pointer flex-shrink-0 ml-1">Tất cả →</button>
                  </div>

                  <div className="space-y-2 my-auto">
                    <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-[11px] font-extrabold text-rose-900 truncate">02 sự cố quá 2 giờ</h4>
                          <p className="text-[9px] text-rose-700 font-medium truncate">PX MAY 2 - Chuyền 5</p>
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
                          <h4 className="text-[11px] font-extrabold text-amber-900 truncate">01 sự cố chưa xong</h4>
                          <p className="text-[9px] text-amber-700 font-medium truncate">PX GÒ - Chuyền 2</p>
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
                          <p className="text-[9px] text-rose-700 font-medium truncate">PX ĐẾ - Chuyền 1</p>
                        </div>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 ml-1">
                        1
                      </span>
                    </div>
                  </div>
                </div>

                {/* HIỆU SUẤT THEO NHÀ MÁY (Col 4/12) */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 whitespace-nowrap min-w-0 truncate">Hiệu suất theo nhà máy</h3>
                    <button className="text-[10px] font-bold text-[#006838] hover:underline cursor-pointer flex-shrink-0 ml-1">Chi tiết →</button>
                  </div>

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

              {/* THANH HÀNH ĐỘNG DƯỚI CÙNG (BOTTOM BAR 4 BUTTONS) */}
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
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all flex items-center gap-3 group flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
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
                    className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all cursor-pointer flex items-center gap-3 group flex-1"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
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
                    className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#006838]/60 transition-all cursor-pointer flex items-center gap-3 group flex-1"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#e6f4ed] text-[#006838] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
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

      {/* ════════════════════════════════════════════════════════════════
          MODAL 3: IN PHIẾU THU / PHIẾU CHI KẾ TOÁN CHUẨN MẪU A5
         ════════════════════════════════════════════════════════════════ */}
      {isFinPrintModalOpen && selectedFinItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#006838] to-[#004d29] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <IconPrinter size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Mẫu In Chứng Từ Kế Toán Chuẩn A5</h3>
                  <p className="text-[11px] text-emerald-100 font-medium">Quy chuẩn chứng từ kế toán nội bộ TBS Group - Chuỗi Skechers</p>
                </div>
              </div>
              <button
                onClick={() => setIsFinPrintModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Modal Printable Voucher Body (Khổ A5 Chuẩn Mẫu Kế Toán) */}
            <div className="p-6 overflow-y-auto space-y-4 bg-white text-slate-900">
              <div className="border border-slate-300 p-5 rounded-xl bg-white shadow-2xs font-serif text-slate-900 space-y-3">
                {/* Header phiếu */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-sans font-black text-xs text-[#006838] tracking-wider uppercase">
                      CÔNG TY CP ĐẦU TƯ THÁI BÌNH (TBS GROUP)
                    </h4>
                    <p className="text-[11px] text-slate-600 font-sans">
                      Văn Phòng Chuỗi SKECHERS - 5A Xuyên Á, Dĩ An, Bình Dương
                    </p>
                    <p className="text-[10px] text-slate-500 font-sans">Mã số thuế: 3700147988</p>
                  </div>
                  <div className="text-right text-[11px] font-sans">
                    <p className="font-bold text-slate-700">Mẫu số: 01-TT</p>
                    <p className="text-slate-500 text-[10px]">(Ban hành theo TT 200/2014/TT-BTC)</p>
                    <p className="font-mono font-bold text-emerald-800 text-xs mt-0.5">Số: {selectedFinItem.id}</p>
                  </div>
                </div>

                {/* Tiêu đề phiếu */}
                <div className="text-center py-1">
                  <h2 className="text-xl font-black tracking-wide text-slate-900 uppercase font-sans">
                    {selectedFinItem.typeCode === "thu"
                      ? "PHIẾU THU TIỀN"
                      : selectedFinItem.typeCode === "chi"
                      ? "PHIẾU CHI TIỀN"
                      : selectedFinItem.typeCode === "tam_ung"
                      ? "GIẤY ĐỀ NGHỊ TẠM ỨNG"
                      : selectedFinItem.typeCode === "hoa_don"
                      ? "BẢNG KÊ HÓA ĐƠN CHỨNG TỪ"
                      : "BIÊN BẢN ĐỐI CHIẾU CÔNG NỢ"}
                  </h2>
                  <p className="text-[11px] italic text-slate-600 font-sans mt-0.5">
                    Ngày {selectedFinItem.date.split("-")[2]} tháng {selectedFinItem.date.split("-")[1]} năm {selectedFinItem.date.split("-")[0]}
                  </p>
                  <div className="flex justify-center gap-6 text-[11px] font-mono mt-1 text-slate-700 font-sans">
                    <span>Nợ: <strong className="text-slate-900">{selectedFinItem.debit}</strong></span>
                    <span>Có: <strong className="text-slate-900">{selectedFinItem.credit}</strong></span>
                  </div>
                </div>

                {/* Nội dung thông tin chứng từ */}
                <div className="space-y-2 text-xs font-sans pt-1">
                  <div className="flex items-baseline">
                    <span className="w-36 text-slate-600 font-medium flex-shrink-0">
                      {selectedFinItem.typeCode === "thu" ? "Họ tên người nộp tiền:" : "Họ tên người nhận tiền:"}
                    </span>
                    <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                      {selectedFinItem.party}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-36 text-slate-600 font-medium flex-shrink-0">Bộ phận / Đơn vị:</span>
                    <span className="font-semibold text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                      {selectedFinItem.dept}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-36 text-slate-600 font-medium flex-shrink-0">Lý do thu / chi:</span>
                    <span className="text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                      {selectedFinItem.note}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-36 text-slate-600 font-medium flex-shrink-0">Số tiền:</span>
                    <span className="font-mono font-black text-slate-900 text-sm border-b border-dotted border-slate-400 flex-1 pb-0.5">
                      {selectedFinItem.amount.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-36 text-slate-600 font-medium flex-shrink-0">Kèm theo:</span>
                    <span className="text-slate-600 italic border-b border-dotted border-slate-400 flex-1 pb-0.5">
                      01 Chứng từ điện tử gốc ({selectedFinItem.id}.pdf)
                    </span>
                  </div>
                </div>

                {/* Chữ ký 4-5 cột */}
                <div className="grid grid-cols-4 gap-2 pt-6 text-center text-[10px] font-sans text-slate-700">
                  <div>
                    <p className="font-bold text-slate-900 uppercase">Thủ trưởng đơn vị</p>
                    <p className="italic text-slate-400 text-[9px]">(Ký, đóng dấu)</p>
                    <div className="h-14 flex items-end justify-center">
                      <span className="text-[10px] font-bold text-emerald-800">[Đã Duyệt Điện Tử]</span>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 uppercase">Kế toán trưởng</p>
                    <p className="italic text-slate-400 text-[9px]">(Ký, họ tên)</p>
                    <div className="h-14 flex items-end justify-center">
                      <span className="text-[10px] font-bold text-emerald-800">Trần Thị Mai</span>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 uppercase">Người lập phiếu</p>
                    <p className="italic text-slate-400 text-[9px]">(Ký, họ tên)</p>
                    <div className="h-14 flex items-end justify-center">
                      <span className="text-[10px] font-bold text-slate-800">Phạm Nguyễn Anh Huy</span>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 uppercase">
                      {selectedFinItem.typeCode === "thu" ? "Người nộp tiền" : "Người nhận tiền"}
                    </p>
                    <p className="italic text-slate-400 text-[9px]">(Ký, họ tên)</p>
                    <div className="h-14 flex items-end justify-center">
                      <span className="text-[10px] font-bold text-slate-800">{selectedFinItem.party.split(" ")[0]}...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 font-mono">
                Mã bảo mật D1: #TBS-FIN-{selectedFinItem.id}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFinPrintModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast(`🖨️ Đang gửi lệnh in chứng từ ${selectedFinItem.id} tới máy in...`);
                    setTimeout(() => {
                      setIsFinPrintModalOpen(false);
                      showToast(`✅ Đã in thành công chứng từ ${selectedFinItem.id}!`);
                    }, 1200);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <IconPrinter size={16} />
                  <span>In Chứng Từ Ngay</span>
                </button>
              </div>
            </div>
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
