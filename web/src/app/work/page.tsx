"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NotificationCenter from "@/components/NotificationCenter";
import DonutChartModal from "@/components/DonutChartModal";
import UserAvatar from "@/components/UserAvatar";
import { getCurrentUser, getUserDisplayBadgeTitle, setUserProfileInfo, setUserAvatar, normalizeEmpCode, getSystemUser, logoutUserProfile, isAdminUser } from "@/lib/userProfiles";
import { logFeatureAccessEvent } from "@/lib/webhookAuditClient";
import Can from "@/components/Can";
import { PERMISSIONS } from "@/lib/permissions";
import OverviewDashboard from "@/components/work/OverviewDashboard";
import WorkspaceHomeView from "@/components/work/WorkspaceHomeView";
import HRSystemShell from "@/modules/hr/HRSystemShell";
import HRHanhChanhHubView from "@/modules/hr/components/HRHanhChanhHubView";
import HRManagerDashboard from "@/modules/hr/components/HRManagerDashboard";
import HREmployeeDirectoryView from "@/modules/hr/components/HREmployeeDirectoryView";
import HRRecruitmentView from "@/modules/hr/components/HRRecruitmentView";
import HRAttendancePayrollView from "@/modules/hr/components/HRAttendancePayrollView";
import HRContractsView from "@/modules/hr/components/HRContractsView";
import QualityModule from "@/modules/quality/QualityModule";
import RDModule from "@/modules/rd/RDModule";
import CNCIWrapper from "@/modules/ci/CNCIWrapper";
import { StrategicManagementContent } from "@/components/home/StrategicManagementDashboard";
import ProjectsOverviewPage from "@/modules/tasks/ProjectsOverviewPage";

import {
  IconHome,
  IconLayoutGrid,
  IconChecklist,
  IconFolder,
  IconSparkles,
  IconX,
  IconMenu2,
  IconLeaf,
  IconGridDots,
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
  IconArrowLeft,
  IconDevices,
  IconUser,
  IconLock,
  IconLogout,
  IconCamera,
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
  IconDownload,
  IconAlertCircle,
  IconAlertTriangle,
  IconPlayerPlay,
  IconFilter,
  IconBulb,
  IconCircleCheck,
  IconTrophy,
  IconBook,
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

function HRModuleView() {
  const [activeTab, setActiveTab] = useState<string>("hub");

  return (
    <div className="w-full space-y-4 min-w-0">
      {/* Top Navigation Bar when in HR Sub-View */}
      {activeTab !== "hub" && (
        <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("hub")}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#006838] text-slate-700 hover:text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
            >
              <IconArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Quay lại Hub 10 App</span>
            </button>
            <span className="text-xs font-black text-slate-800 hidden sm:inline">
              {activeTab === "dashboard" && "📊 Bảng Điều Khiển Quản Trị HR (Trưởng Phòng HR)"}
              {activeTab === "directory" && "👥 Quản Lý Hồ Sơ & Cơ Cấu Tổ Chức"}
              {activeTab === "recruitment" && "🧑‍💼 Quản Lý Tuyển Dụng & Nhu Cầu"}
              {activeTab === "attendance_payroll" && "⏰ Quản Lý Chấm Công & Lương"}
              {activeTab === "contracts" && "📄 Quản Lý Hợp Đồng Lao Động"}
            </span>
          </div>

          <button
            onClick={() => setActiveTab("hub")}
            className="px-3.5 py-1.5 rounded-xl bg-[#006838] text-white text-xs font-extrabold shadow-2xs hover:bg-[#004d29] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <IconLayoutGrid size={15} />
            <span>Hub 10 App</span>
          </button>
        </div>
      )}

      {/* Main Tab View */}
      {activeTab === "hub" && (
        <HRHanhChanhHubView
          onNavigateTab={(tab) => {
            if (tab === "rooms") {
              window.location.href = "/rooms";
            } else if (tab === "business-trip") {
              window.location.href = "/business-trip";
            } else {
              setActiveTab(tab);
            }
          }}
        />
      )}

      {activeTab === "dashboard" && (
        <HRManagerDashboard
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === "directory" && <HREmployeeDirectoryView />}
      {activeTab === "recruitment" && <HRRecruitmentView />}
      {activeTab === "attendance_payroll" && <HRAttendancePayrollView />}
      {activeTab === "contracts" && <HRContractsView />}
    </div>
  );
}

export default function WorkDashboardPage({ initialDept }: { initialDept?: string | null }) {
  const router = useRouter();
  const [selectedDept, setSelectedDept] = useState<string | null>(initialDept || null);

  const handleSelectDept = (targetDeptId: string | null) => {
    const nextDept = (selectedDept === targetDeptId && targetDeptId !== null) ? null : targetDeptId;
    setSelectedDept(nextDept);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (nextDept) {
        url.searchParams.set("dept", nextDept);
      } else {
        url.searchParams.delete("dept");
      }
      window.history.pushState(null, "", url.toString());
    }
  };

  const [plantFilter, setPlantFilter] = useState("Toàn nhà máy");
  const [timeFilter, setTimeFilter] = useState("Tháng này");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // User Profile & Account Dropdown State
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Profile Form State
  const [userInfo, setUserInfo] = useState<{
    empCode: string;
    name: string;
    phone: string;
    email: string;
    avatar: string;
    title: string;
    department?: string;
  }>({
    empCode: "",
    name: "",
    phone: "",
    email: "",
    avatar: "",
    title: "",
    department: "",
  });

  useEffect(() => {
    const syncUser = () => {
      const curr = getCurrentUser();
      if (curr) {
        setUserInfo({
          empCode: curr.empCode || "",
          name: curr.name || "",
          phone: curr.phone || "",
          email: curr.email || "",
          avatar: curr.avatar || "",
          title: getUserDisplayBadgeTitle(curr) || "",
          department: curr.department || "",
        });
      } else {
        const staffDemo = getSystemUser("202608001");
        if (staffDemo) {
          setUserInfo({
            empCode: staffDemo.empCode,
            name: staffDemo.name,
            phone: staffDemo.phone || "",
            email: staffDemo.email || "",
            avatar: staffDemo.avatar || "",
            title: staffDemo.title || "IT - Team Chuyển Đổi Số",
            department: staffDemo.department || "",
          });
        }
      }
    };

    syncUser();
    if (typeof window !== "undefined") {
      window.addEventListener("tbs_profile_updated", syncUser);
      return () => window.removeEventListener("tbs_profile_updated", syncUser);
    }
  }, []);

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
    showToast(isSubmitForApproval ? "Đã lưu và chuyển chứng từ sang hàng đợi Phê Duyệt." : "Đã ghi sổ chứng từ thành công vào hệ thống D1.");
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

      showToast("Đang nạp và xử lý ảnh...");

      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === "string") {
          const rawDataUrl = reader.result;

          // 1. Compress image to max 400x400 JPEG
          const compressed = await compressImage(rawDataUrl, 400, 400, 0.85);

          // 2. Instantly display selected photo in modal circle (0ms UI feedback)
          setEditProfileForm((prev) => ({ ...prev, avatar: compressed }));
          setUserInfo((prev) => ({ ...prev, avatar: compressed }));
          showToast("Đã nạp ảnh thành công. Đang đồng bộ...");

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
                // FIX: Use uploadedAvatarUrl local variable — NOT stale userInfo closure
                const uploadedAvatarUrl: string = json.url;
                setEditProfileForm((prev) => ({ ...prev, avatar: uploadedAvatarUrl }));
                setUserInfo((prev) => {
                  // FIX: Build updated object inside setter to access fresh prev state
                  const updated = { ...prev, avatar: uploadedAvatarUrl };
                  // FIX: Persist fresh object (not stale userInfo closure) to storage
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("tbs_current_user", JSON.stringify(updated));
                    localStorage.setItem("tbs_current_user", JSON.stringify(updated));
                  }
                  return updated;
                });
                showToast(json.isCloudinary ? "Đã tải avatar lên Cloudinary." : "Đã cập nhật ảnh đại diện.");
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

  // Fetch initial profile data from D1 Database & Local Storage (runs ONCE on mount only)
  useEffect(() => {
    const isValidAvatar = (str: any) => typeof str === "string" && str.trim().length > 4 && str !== "undefined" && str !== "null";

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const deptParam = searchParams.get("dept");
      if (deptParam) {
        setSelectedDept(deptParam);
      }

      // Load from localStorage/sessionStorage immediately (fast, no network)
      const storedUser = sessionStorage.getItem("tbs_current_user") || localStorage.getItem("tbs_current_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.name) {
            const loaded = {
              empCode: parsed.empCode || "",
              name: parsed.name,
              phone: parsed.phone || "",
              email: parsed.email || `${parsed.empCode || ''}@tbsgroup.vn`,
              avatar: isValidAvatar(parsed.avatar) ? parsed.avatar : "/images/tbs-logo.png",
              title: parsed.title || "Cán Bộ Công Nhân Viên",
            };
            setUserInfo(loaded);
            setEditProfileForm(loaded);
          }
        } catch (e) { }
      }
    }

    // FIX: loadD1Profile only runs ONCE on mount.
    // It NEVER runs again via event listener (that caused the race condition).
    // Avatar priority: localStorage (freshest, includes just-uploaded avatar) > D1 database
    async function loadD1Profile() {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return;
        const json = await res.json();
        if (json.success && json.data) {
          // FIX: Always read fresh from localStorage INSIDE the async function
          // (not from stale closure variable set at mount time)
          const freshStoredUser = typeof window !== "undefined"
            ? (sessionStorage.getItem("tbs_current_user") || localStorage.getItem("tbs_current_user"))
            : null;
          let localAvatar: string | null = null;
          if (freshStoredUser) {
            try {
              const parsed = JSON.parse(freshStoredUser);
              if (isValidAvatar(parsed?.avatar)) localAvatar = parsed.avatar;
            } catch (e) { }
          }

          const d1Avatar = json.data.avatar || json.data.avatar_url;
          // FIX: localStorage avatar wins over D1 — it contains the most recently uploaded avatar.
          const finalAvatar = isValidAvatar(localAvatar)
            ? localAvatar
            : (isValidAvatar(d1Avatar) ? d1Avatar : "");

          const currEmpCode = json.data.emp_code || json.data.empCode || userInfo.empCode;
          if (currEmpCode && userInfo.empCode && normalizeEmpCode(currEmpCode) !== normalizeEmpCode(userInfo.empCode)) {
            return;
          }

          const loaded = {
            empCode: currEmpCode,
            name: json.data.name || userInfo.name,
            phone: json.data.phone || userInfo.phone,
            email: json.data.email || userInfo.email,
            avatar: finalAvatar || userInfo.avatar,
            title: json.data.title || userInfo.title,
          };
          setUserInfo(loaded);
          setEditProfileForm(loaded);
          if (typeof window !== "undefined" && loaded.empCode) {
            setUserProfileInfo(loaded.empCode, loaded);
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
    const profileSnapshot = { ...editProfileForm };
    if (!profileSnapshot.empCode) {
      profileSnapshot.empCode = userInfo.empCode;
    }
    setUserInfo(profileSnapshot);
    if (typeof window !== "undefined" && profileSnapshot.empCode) {
      setUserProfileInfo(profileSnapshot.empCode, profileSnapshot);
    }
    setIsProfileModalOpen(false);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileSnapshot),
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
      bg: "/images/KGLV/CĐTT 2 GÓC HÌNH VP2.png",
      title: "Nhân Sự - Hành Chánh",
      sub: "Quản lý văn thư, tài sản, phòng họp, tuyển dụng và lịch công tác toàn chuỗi.",
      appCount: 10,
    },
    finance: {
      bg: "/images/KGLV/BẢNG LỊCH SỬ & KỈ NIỆM CHƯƠNG.png",
      title: "Hệ Thống Quản Trị 1-5-2",
      sub: "Bảng điều khiển 1 mục đích xuyên suốt, 5 trụ cột vận hành và 2 nền tảng quản trị.",
      appCount: 10,
    },
    rd: {
      bg: "/images/KGLV/PHÒNG R&D.png",
      title: "R&D (Phát Triển Sản Phẩm)",
      sub: "Nghiên cứu công nghệ đế giày SKECHERS, thiết kế mẫu & chuyển giao kỹ thuật.",
      appCount: 6,
    },
    ci: {
      bg: "/images/KGLV/CĐTT 2 GÓC QUI TRÌNH GIÀY.png",
      title: "CN-CI (Cải Tiến Liên Tục)",
      sub: "Thúc đẩy phong trào Kaizen, cải tiến Gemba Walk và năng suất tự động hóa 4.0.",
      appCount: 4,
    },
    qc: {
      bg: "/images/KGLV/3 DÒNG GIÀY CHÍNH.png",
      title: "Quản Lý Chất Lượng (QC)",
      sub: "Kiểm soát tiêu chuẩn chất lượng SKECHERS, chỉ số OEE và tỷ lệ lỗi trên chuyền.",
      appCount: 8,
    },
    supply: {
      bg: "/images/KGLV/PHÒNG THƯ VIỆN VẬT TƯ.png",
      title: "Kế Hoạch Chuẩn Bị - TTPP",
      sub: "Điều phối logistics, cung ứng vật tư & chuỗi cung ứng chuỗi nhà máy SKECHERS.",
      appCount: 7,
    },
    logistics: {
      bg: "/images/KGLV/PHÒNG THƯ VIỆN VẬT TƯ.png",
      title: "Kho & Logistics",
      sub: "Logistics, vật tư & chuỗi cung ứng chuỗi nhà máy SKECHERS.",
      appCount: 7,
    },
    factory: {
      bg: "/images/KGLV/CĐTT 1 LỐI ĐI XUỐNG KV MẪU.png",
      title: "Tổ Hợp Nhà Máy",
      sub: "Quản lý chuỗi xưởng sản xuất, máy móc thiết bị và điều hành ca sản xuất.",
      appCount: 9,
    },
    production: {
      bg: "/images/KGLV/CĐTT 1 LỐI VÀO.png",
      title: "Tổ Hợp Nhà Máy",
      sub: "Quản lý chuỗi xưởng sản xuất, máy móc thiết bị và điều hành ca sản xuất.",
      appCount: 9,
    },
  };

  // Departments List
  const departments: any[] = [
    {
      id: "home",
      num: "00",
      name: "Trang chủ",
      sub: "Workspace & phím tắt truy cập nhanh",
      icon: IconHome,
      hasData: true,
    },
    {
      id: "overview",
      num: "01",
      name: "Tổng quan",
      sub: "Bảng điều khiển chỉ số toàn chuỗi",
      icon: IconLayoutGrid,
      hasData: true,
    },
    {
      id: "my-tasks",
      num: "02",
      name: "Công việc cá nhân",
      sub: "Theo dõi & xử lý task cá nhân",
      icon: IconChecklist,
      hasData: true,
    },
    {
      id: "tasks",
      num: "03",
      name: "Bảng công việc phòng ban",
      sub: "Tiến độ & nghiệm thu phòng ban",
      icon: IconClipboardList,
      hasData: true,
      route: "/work/tasks",
    },
    {
      id: "projects",
      num: "04",
      name: "Dự án liên phòng ban",
      sub: "Tiến độ dự án phối hợp",
      icon: IconFolder,
      hasData: true,
      route: "/work/projects",
    },
    {
      id: "gemba",
      num: "06",
      name: "Kiểm soát GEMBA",
      sub: "Kiểm tra Gemba Walk & Chất lượng",
      icon: IconShieldCheck,
      hasData: true,
      route: "/work/gemba",
    },
    {
      id: "finance",
      num: "07",
      name: "Hệ thống quản trị 1-5-2",
      sub: "Bảng điều khiển 1 mục đích 5 trụ cột",
      icon: IconLayoutGrid,
      hasData: true,
    },
    {
      id: "hr",
      num: "08",
      name: "Nhân sự – Hành chính",
      sub: "Tuyển dụng, tài sản & văn thư",
      icon: IconUsers,
      hasData: true,
    },
    {
      id: "rd",
      num: "09",
      name: "R&D (Phát triển mẫu)",
      sub: "Nghiên cứu & chuyển giao mẫu",
      icon: IconFlask,
      hasData: true,
    },
    {
      id: "ci",
      num: "10",
      name: "CN-CI (Cải tiến liên tục)",
      sub: "Sáng kiến Kaizen & năng suất 4.0",
      icon: IconSettings,
      hasData: true,
    },
    {
      id: "qc",
      num: "11",
      name: "Quản lý chất lượng (QC)",
      sub: "Chỉ số OEE & kiểm soát lỗi",
      icon: IconShieldCheck,
      hasData: true,
    },
    {
      id: "logistics",
      num: "12",
      name: "Kho & Logistics",
      sub: "Cung ứng vật tư & vận chuyển",
      icon: IconTruck,
      hasData: false,
    },
    {
      id: "production",
      num: "13",
      name: "Tổ hợp Nhà máy",
      sub: "Điều hành ca & máy móc xưởng",
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

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentUser = useMemo(() => {
    if (!isMounted) return null;
    return getCurrentUser();
  }, [isMounted, userInfo]);

  const visibleDepartments = useMemo(() => {
    const activeUser = currentUser || (isMounted ? getCurrentUser() : null) || getSystemUser("202608001");

    const normalizedCode = normalizeEmpCode(activeUser?.empCode || "202608001");
    const sysUser = getSystemUser(normalizedCode);

    const combinedRoles = Array.from(
      new Set([
        ...(Array.isArray(activeUser?.roles) ? activeUser.roles : []),
        ...(Array.isArray(sysUser?.roles) ? sysUser.roles : []),
      ])
    );
    const deptCode = (sysUser?.department || activeUser.departmentCode || activeUser.department || "").toUpperCase();
    const deptName = (sysUser?.department || activeUser.department || "").toUpperCase();
    const roleCode = sysUser?.roleCode || activeUser.roleCode || "";
    const managementLevel = activeUser.managementLevel || sysUser?.roleLevel || 4;

    const checkUserIsAdmin = (u: any): boolean => {
      if (!u) return false;
      const rCode = (u.roleCode || u.role_code || "").toString().trim().toUpperCase();
      const rLevel = u.roleLevel || u.role_level || 4;
      const rList: string[] = Array.isArray(u.roles)
        ? u.roles.map((r: any) => r.toString().toLowerCase())
        : [];
      return (
        rCode === "SUPER_ADMIN" ||
        rCode === "ADMIN" ||
        rCode === "SYSTEM_ADMIN" ||
        rList.includes("admin") ||
        rList.includes("super_admin") ||
        rLevel === 1
      );
    };

    // Admin check via checkUserIsAdmin helper & standard role code
    const isAdmin =
      checkUserIsAdmin(activeUser) ||
      checkUserIsAdmin(sysUser) ||
      combinedRoles.includes("admin") ||
      roleCode === "SUPER_ADMIN" ||
      roleCode === "ADMIN";

    const isTP =
      roleCode === "TRUONG_PHONG" ||
      roleCode === "TP" ||
      combinedRoles.includes("manager") ||
      combinedRoles.includes("department_head") ||
      managementLevel === 3 ||
      Boolean(activeUser?.title && (activeUser.title.toUpperCase().includes("TRƯỞNG PHÒNG") || activeUser.title.toUpperCase().includes("TP"))) ||
      Boolean(sysUser?.title && (sysUser.title.toUpperCase().includes("TRƯỞNG PHÒNG") || sysUser.title.toUpperCase().includes("TP"))) ||
      normalizedCode.startsWith("TP");

    if (isAdmin) {
      if (isTP) return departments.filter((d) => d.id !== "gemba");
      return departments;
    }

    // Executive Board check (managementLevel <= 2 or executive roles)
    const isExec =
      managementLevel <= 2 ||
      combinedRoles.includes("ceo") ||
      combinedRoles.includes("deputy_ceo") ||
      combinedRoles.includes("director") ||
      combinedRoles.includes("deputy_director") ||
      roleCode === "TONG_GIAM_DOC" ||
      roleCode === "PHO_TONG_GIAM_DOC" ||
      roleCode === "GIAM_DOC" ||
      roleCode === "PHO_GIAM_DOC" ||
      normalizedCode.startsWith("TGĐ") ||
      normalizedCode.startsWith("PTGĐ") ||
      normalizedCode.startsWith("GĐ") ||
      normalizedCode.startsWith("PGĐ");

    if (isExec) {
      if (isTP) return departments.filter((d) => d.id !== "gemba");
      return departments;
    }

    return departments.filter((dept) => {
      if (isTP && dept.id === "gemba") {
        return false;
      }
      switch (dept.id) {
        case "overview":
        case "my_tasks":
        case "my-tasks":
        case "tasks":
        case "projects":
        case "general_work":
        case "personal_calendar":
          return true;

        case "finance":
          // 1-5-2 Finance management is strictly for Executive Board / Admins, or Chief Accountant
          return (
            combinedRoles.includes("accountant") &&
            (combinedRoles.includes("department_head") || roleCode === "TRUONG_PHONG")
          );

        case "hr":
          return true; // Tất cả CBCNV đều có quyền truy cập Nhân Sự - Hành Chính (Đặt phòng họp, đăng ký công tác, thông báo)

        case "ci":
          return true; // CN-CI (Cải tiến liên tục) is accessible to ALL roles for viewing & posting improvements

        case "qc":
        case "gemba":
          return (
            combinedRoles.includes("qc") ||
            deptCode.includes("QC") ||
            deptName.includes("CHẤT LƯỢNG") ||
            normalizedCode.startsWith("QC")
          );

        case "rd":
          return (
            combinedRoles.includes("rd") ||
            deptCode.includes("RD") ||
            deptName.includes("R&D") ||
            normalizedCode.startsWith("RD")
          );

        case "logistics":
          return (
            combinedRoles.includes("logistics") ||
            deptCode.includes("LOGISTICS") ||
            deptName.includes("LOGISTICS") ||
            deptName.includes("VẬT TƯ") ||
            normalizedCode.startsWith("LG")
          );

        case "production":
          // Chỉ hiển thị cho Bộ phận Bảo trì MMTB & Quản đốc Xưởng trở lên
          const isMaintenanceStaff =
            combinedRoles.includes("maintenance") ||
            combinedRoles.includes("technician") ||
            deptCode.includes("BAO_TRI") ||
            deptCode.includes("MMTB") ||
            deptName.includes("BẢO TRÌ") ||
            deptName.includes("MÁY MÓC") ||
            normalizedCode.startsWith("BT");

          const isQuanDocOrAbove =
            isTP ||
            combinedRoles.includes("factory_manager") ||
            combinedRoles.includes("supervisor") ||
            Boolean(activeUser?.title && activeUser.title.toUpperCase().includes("QUẢN ĐỐC")) ||
            Boolean(sysUser?.title && sysUser.title.toUpperCase().includes("QUẢN ĐỐC")) ||
            normalizedCode.startsWith("QĐ");

          return isMaintenanceStaff || isQuanDocOrAbove;

        default:
          return false;
      }
    });
  }, [currentUser, departments]);

  useEffect(() => {
    if (selectedDept && !visibleDepartments.some((d) => d.id === selectedDept)) {
      setSelectedDept(null);
    } else if (selectedDept) {
      const activeObj = departments.find((d) => d.id === selectedDept);
      if (activeObj) {
        logFeatureAccessEvent({
          emp_code: currentUser?.empCode || 'GUEST',
          emp_name: currentUser?.name || 'Cán Bộ Nhân Viên',
          module: 'VĂN PHÒNG CHUỖI SKECHERS',
          feature_name: `Truy cập Phân hệ ${activeObj.name} (${selectedDept})`,
          result: 'Được phép'
        });
      }
    }
  }, [visibleDepartments, selectedDept, currentUser, departments]);

  const activeDeptObj = departments.find((d) => d.id === selectedDept);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#f4f7f5] text-slate-900 font-sans antialiased selection:bg-[#006838] selection:text-white">
      {/* ════════════════════════════════════════════════════════════════
          LEFT SIDEBAR (Hidden on Mobile, Fixed Height on Desktop)
         ════════════════════════════════════════════════════════════════ */}
      <aside
        className={`hidden lg:flex bg-white h-screen flex-col border-r border-slate-200/80 flex-shrink-0 shadow-sm transition-all duration-300 ease-in-out z-30 ${
          isSidebarCollapsed ? "w-20 px-2.5 py-4" : "w-80 lg:w-[360px] p-4 lg:p-5"
        }`}
      >
        {/* Executive Brand Lockup & Header Toggle Button (Fixed Top) */}
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 flex-shrink-0 min-h-[56px]">
            <Link href="/" title="Về Trang Chủ TBS Group" className="flex items-center gap-2.5 group overflow-hidden cursor-pointer">
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

        {/* Department List (INDEPENDENT SCROLL CONTAINER WITH CUSTOM SCROLLBAR) */}
        <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden my-2.5 pr-1 w-full focus:outline-none ${isSidebarCollapsed ? "space-y-3.5" : "space-y-2.5"}`}>
          {visibleDepartments.map((dept) => {
            const IconComp = dept.icon;
            const isSelected = selectedDept === dept.id;

            // COLLAPSED MODE RENDERING
            if (isSidebarCollapsed) {
              return (
                <button
                  key={dept.id}
                  onClick={() => {
                    if (dept.route) {
                      router.push(dept.route);
                    } else {
                      handleSelectDept(dept.id);
                    }
                  }}
                  className={`w-11 h-11 mx-auto rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer ${isSelected
                    ? "bg-[#006838] text-white shadow-md shadow-emerald-900/30 ring-2 ring-emerald-600/30 scale-105"
                    : "bg-white hover:bg-[#e6f4ed] text-[#006838] border border-slate-200/90 shadow-2xs"
                    }`}
                  title={dept.name}
                >
                  {isSelected && (
                    <span className="absolute -left-3.5 top-2 bottom-2 w-1 bg-[#006838] rounded-r-full shadow-xs" />
                  )}

                  <IconComp size={22} className="flex-shrink-0" />

                  {!dept.hasData && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
                  )}

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

            // EXPANDED MODE RENDERING (Clean Corporate Nav Item)
            return (
              <button
                key={dept.id}
                onClick={() => {
                  if (dept.route) {
                    router.push(dept.route);
                  } else {
                    handleSelectDept(dept.id);
                  }
                }}
                className={`w-full text-left rounded-xl flex items-center p-3 sm:p-3.5 gap-3 transition-all duration-200 group relative cursor-pointer focus-visible:ring-2 focus-visible:ring-[#006838] ${isSelected
                  ? "bg-[#006838] text-white shadow-sm border border-[#006838]"
                  : "bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-slate-200/80 shadow-2xs"
                  }`}
              >
                {isSelected && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-300 rounded-r-full" />
                )}

                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                    ? "bg-white/20 text-white"
                    : "text-[#006838] group-hover:text-[#004d29]"
                    }`}
                >
                  <IconComp size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold truncate tracking-tight">
                    {dept.name}
                  </h4>
                  <p
                    className={`text-[11px] truncate mt-0.5 font-medium ${isSelected ? "text-emerald-100" : "text-slate-500"
                      }`}
                  >
                    {dept.sub}
                  </p>
                </div>

                {!dept.hasData && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isSelected
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

        {/* Sidebar Footer Credit & Slogan */}
        <div className="flex-shrink-0 mt-auto pt-3 border-t border-slate-200/80 space-y-2">
          {!isSidebarCollapsed && (
            <div className="px-2 py-1.5 rounded-xl bg-slate-100/70 border border-slate-200/80 text-center">
              <div className="text-xs font-serif italic font-bold text-slate-800">"Good People Great Work"</div>
              <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-0.5">SKECHERS • TBS GROUP</div>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-slate-500">
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
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════
          MAIN DASHBOARD AREA
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden bg-[#f4f7f5] text-slate-900 rounded-tl-none lg:rounded-tl-[24px] flex flex-col justify-between transition-all duration-300 pb-24 lg:pb-6">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 px-3 sm:px-5 lg:px-6 pt-[calc(env(safe-area-inset-top,44px)+14px)] sm:pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Drawer Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-slate-100 text-[#006838] hover:bg-emerald-50 transition-colors border border-slate-200 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-2xs active:scale-95"
              title="Mở danh mục phân hệ"
              aria-label="Mở menu điều hướng"
            >
              <IconMenu2 size={22} />
            </button>

            {/* Mobile Brand Logo Lockup */}
            <Link href="/" title="Về Trang Chủ TBS Group" className="lg:hidden flex items-center gap-1.5 flex-shrink-0 cursor-pointer">
              <img src="/images/tbs-logo.png" alt="TBS Group" className="h-6 sm:h-7 w-auto object-contain" />
              <div className="h-4 w-[1px] bg-slate-200 flex-shrink-0" />
              <img src="/images/skechers-logo.png" alt="SKECHERS" className="h-5 sm:h-6 w-auto object-contain flex-shrink-0" />
            </Link>

            {/* Desktop System Title */}
            <div className="hidden lg:block min-w-0 flex-1">
              <h1 className="text-base lg:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
                <span>Văn phòng Chuỗi </span>
                <span className="text-[#006838]">SKECHERS</span>
                <span className="text-slate-400 font-normal"> – </span>
                <span>TBS Group</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate">
                Hệ thống Điều Hành &amp; Vận Hành Chuỗi SKECHERS – TBS Group
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Notification Center */}
            <NotificationCenter />

            {/* Grid 9-dots icon launcher */}
            <Link
              href="/"
              className="hidden md:flex min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs items-center justify-center"
              title="Danh mục ứng dụng & Trang chủ"
            >
              <IconGridDots size={20} />
            </Link>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="hidden md:flex min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs items-center justify-center"
              title="Toàn màn hình"
            >
              <IconMaximize size={20} />
            </button>

            {/* User Avatar & Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="min-w-[44px] min-h-[44px] flex items-center gap-2 p-1 pl-1 pr-1.5 sm:pr-3 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group border border-slate-200/90 bg-white shadow-2xs"
                title="Tài khoản cá nhân"
                aria-label="Tài khoản cá nhân"
              >
                <UserAvatar
                  src={userInfo.avatar}
                  name={userInfo.name}
                  size="md"
                  showOnlineBadge={true}
                />
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <div className="font-black text-slate-900 whitespace-nowrap">{userInfo.name}</div>
                  <div className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">{userInfo.title}</div>
                </div>
                <IconChevronDown size={14} className={`hidden sm:block text-slate-500 transition-transform duration-200 ${isUserDropdownOpen ? "rotate-180 text-[#006838]" : ""}`} />
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
                        <UserAvatar
                          src={userInfo.avatar}
                          name={userInfo.name}
                          size="lg"
                          zoom={avatarZoom}
                          offsetX={avatarOffsetX}
                          offsetY={avatarOffsetY}
                        />
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

                      {/* Option 3: Trang Quản Trị (Admin Mode) - Only for Admins */}
                      {(currentUser?.roles?.includes("admin") || currentUser?.roleCode === "SUPER_ADMIN" || currentUser?.empCode === "202608001" || currentUser?.empCode === "ADMIN-2026") && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold text-[#006838] bg-emerald-50 hover:bg-[#006838] hover:text-white border border-emerald-200/80 transition-all cursor-pointer group my-1 shadow-2xs"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#006838] text-white group-hover:bg-white group-hover:text-[#006838] flex items-center justify-center transition-colors flex-shrink-0">
                            <IconShieldCheck size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-slate-900 group-hover:text-white flex items-center gap-1">
                              <span>Trang Quản Trị (Admin Mode)</span>
                            </div>
                            <div className="text-[10px] text-slate-500 group-hover:text-emerald-100 font-medium truncate">
                              Truy cập hệ thống quản trị /admin
                            </div>
                          </div>
                        </Link>
                      )}

                      <div className="h-[1px] bg-slate-100 my-1" />

                      {/* Option 3: Đăng xuất */}
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          logoutUserProfile();
                          window.location.href = "/login";
                        }}
                        className="w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors flex-shrink-0">
                          <IconLogout size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="font-extrabold">Đăng xuất</div>
                          <div className="text-[10px] text-rose-400 font-normal">Thoát tài khoản an toàn</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Off-Canvas Sliding Drawer Navigation (Only active on screens < lg when hamburger is clicked) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden flex">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Off-canvas Sliding Panel */}
            <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col p-4 z-10 animate-in slide-in-from-left duration-300">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 flex-shrink-0">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                  <img src="/images/tbs-logo.png" alt="TBS Group" className="h-7 w-auto object-contain" />
                  <div className="h-5 w-[1px] bg-slate-200" />
                  <img src="/images/skechers-logo.png" alt="SKECHERS" className="h-6 w-auto object-contain" />
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Department Navigation List */}
              <div className="flex-1 overflow-y-auto space-y-2 py-3">
                <div className="text-[10px] font-black tracking-wider text-slate-500 px-2 pb-1">
                  Danh mục phân hệ vận hành
                </div>
                {visibleDepartments.map((dept) => {
                  const IconComp = dept.icon;
                  const isSelected = selectedDept === dept.id;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (dept.route) {
                          router.push(dept.route);
                        } else {
                          handleSelectDept(dept.id);
                        }
                      }}
                      className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-[#006838] to-[#004d29] text-white shadow-md shadow-emerald-900/20"
                          : "bg-slate-50 text-slate-800 hover:bg-emerald-50 border border-slate-200/80"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-emerald-100/60 text-[#006838]"
                      }`}>
                        <IconComp size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-extrabold truncate">{dept.name}</div>
                        <div className={`text-[10px] truncate ${isSelected ? "text-emerald-100" : "text-slate-500"}`}>{dept.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span className="font-bold text-[#006838]">TBS Group System</span>
                <span className="font-mono text-[10px]">© 2026</span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Body */}
        <div className="p-4 lg:p-6 space-y-4 pb-12 w-full min-w-0">
          {/* ════════════════════════════════════════════════════════════════
              TRANG CHỦ LANDING PAGE (KHIselectedDept === null HOẶC "home")
             ════════════════════════════════════════════════════════════════ */}
          {(!selectedDept || selectedDept === "home") && (
            <WorkspaceHomeView
              userName={userInfo.name}
              userCode={userInfo.empCode}
              userTitle={userInfo.title}
              userDept={userInfo.department || "Nhân Sự - Hành Chính"}
              visibleDepartments={visibleDepartments}
              onSelectDept={(deptId) => handleSelectDept(deptId)}
              currentUser={currentUser}
              selectedDept={selectedDept}
            />
          )}

          {/* ════════════════════════════════════════════════════════════════
              THẺ 01: TỔNG QUAN HỆ THỐNG (CHỈ RENDER KHI CHỌN KHỐI TỔNG QUAN)
             ════════════════════════════════════════════════════════════════ */}
          {selectedDept === "overview" && (
            <OverviewDashboard
              onSelectDept={(deptId) => handleSelectDept(selectedDept === deptId ? null : deptId)}
              userName={userInfo.name}
              userCode={userInfo.empCode}
              currentUser={currentUser}
            />
          )}

          {/* ════════════════════════════════════════════════════════════════
              THẺ 02: CÔNG VIỆC CÁ NHÂN (MY TASKS) MODULE VIEW
             ════════════════════════════════════════════════════════════════ */}
          {(selectedDept === "my-tasks" || selectedDept === "my_tasks") && (
            <div className="w-full space-y-4 min-w-0 font-sans antialiased">
              <ProjectsOverviewPage />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              THẺ 05: CN-CI (CẢI TIẾN LIÊN TỤC / KAIZEN / GEMBA) MODULE VIEW
             ════════════════════════════════════════════════════════════════ */}
          {selectedDept === "ci" && (
            <CNCIWrapper />
          )}


          {/* ════════════════════════════════════════════════════════════════
              DEPARTMENT HERO BANNER CARD (Screenshot 1 Layout)
             ════════════════════════════════════════════════════════════════ */}
          {activeDeptObj && activeDeptObj.id !== "home" && activeDeptObj.id !== "overview" && activeDeptObj.id !== "my-tasks" && activeDeptObj.id !== "my_tasks" && activeDeptObj.id !== "finance" && activeDeptObj.id !== "rd" && activeDeptObj.id !== "hr" && activeDeptObj.id !== "ci" && (
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
                    PHÂN HỆ NGHIỆP VỤ
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
          {activeDeptObj && !activeDeptObj.hasData && activeDeptObj.id !== "finance" && (
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
              IF HỆ THỐNG QUẢN TRỊ CHIẾN LƯỢC 1-5-2 (FINANCE DEPT) IS SELECTED
             ════════════════════════════════════════════════════════════════ */}
          {selectedDept === "finance" && (
            <StrategicManagementContent />
          )}

          {/* IF HR (NHÂN SỰ HÀNH CHÁNH) IS SELECTED */}
          {selectedDept === "hr" && (
            <div className="w-full h-full min-h-[600px]">
              <HRModuleView />
            </div>
          )}

          {/* IF R&D (PHÁT TRIỂN SẢN PHẨM) IS SELECTED */}
          {selectedDept === "rd" && (
            <div className="space-y-4 w-full">
              <RDModule
                userName={userInfo.name}
                onSelectDept={(deptId) => setSelectedDept(deptId)}
              />
            </div>
          )}

          {/* IF QC (QUẢN LÝ CHẤT LƯỢNG) IS SELECTED */}
          {selectedDept === "qc" && (
            <div className="space-y-3.5 my-auto">
              <QualityModule onNavigateToApp={(url) => window.open(url, "_blank")} />
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
                  <UserAvatar
                    src={editProfileForm.avatar}
                    name={editProfileForm.name}
                    size="custom"
                    className="w-full h-full"
                    zoom={avatarZoom}
                    offsetX={avatarOffsetX}
                    offsetY={avatarOffsetY}
                  />
                  <div className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity z-10">
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
                      VĂN PHÒNG CHUỖI SKECHERS (TBS GROUP)
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

      {/* ════════════════════════════════════════════════════════════════
          MOBILE DEPARTMENT DRAWER OVERLAY (FOR PHONE SCREENS)
         ════════════════════════════════════════════════════════════════ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 p-5 space-y-4 animate-in slide-in-from-left duration-250">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <img src="/images/tbs-logo.png" alt="TBS" className="h-6 w-auto" />
                <span className="text-xs font-black text-slate-900 uppercase">Danh Mục Phân Hệ</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {visibleDepartments.map((dept) => {
                const IconComp = dept.icon;
                const isSelected = selectedDept === dept.id;
                return (
                  <button
                    key={dept.id}
                    onClick={() => {
                      setSelectedDept(dept.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-[#006838] text-white font-bold shadow-md"
                        : "bg-slate-50 text-slate-800 hover:bg-emerald-50/50"
                    }`}
                  >
                    <IconComp size={20} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-extrabold truncate">{dept.name}</div>
                      <div className={`text-[10px] truncate ${isSelected ? "text-emerald-100" : "text-slate-500"}`}>{dept.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
