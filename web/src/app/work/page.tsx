"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import CircularMenu, { MenuItem } from "@/components/home/CircularMenu";
import DepartmentRadialMenu from "@/components/departments/DepartmentRadialMenu";
import DonutChartModal from "@/components/home/DonutChartModal";
import DailyManagementModals, { DailyModalType } from "@/components/daily-management/DailyManagementModals";
import {
  IconChartBar,
  IconBuildingFactory,
  IconBulb,
  IconBrain,
  IconShieldCheck,
  IconTool,
  IconFileText,
  IconUsers,
  IconZoomIn,
  IconZoomOut,
  IconRefresh,
  IconChevronDown,
  IconSparkles,
  IconAdjustmentsHorizontal,
} from "@tabler/icons-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"functions" | "departments">("functions");
  const [activeModal, setActiveModal] = useState<DailyModalType>(null);
  const [isDonutOpen, setIsDonutOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // User state from JWT token
  const [userRoleCode, setUserRoleCode] = useState("SUPER_ADMIN");
  const [userDeptCode, setUserDeptCode] = useState("KE_HOACH_CBVT");
  const [userName, setUserName] = useState("Trưởng Phòng Chuỗi SKECHERS");

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("tbs_token="));
    const token = tokenCookie ? tokenCookie.split("=")[1] : null;

    if (token) {
      try {
        const payloadBase64 = token.split(".")[1];
        if (payloadBase64) {
          const decoded = JSON.parse(atob(payloadBase64));
          setUserRoleCode(decoded.roleCode || "SUPER_ADMIN");
          setUserDeptCode(decoded.departmentCode || "KE_HOACH_CBVT");
          setUserName(decoded.name || "Trưởng Phòng Chuỗi SKECHERS");
        }
      } catch {
        // Fallback
      }
    }
  }, []);

  // 14 Operational Function Items for Main Circular Menu
  const functionItems: MenuItem[] = [
    {
      id: "daily-review",
      label: "1. Daily Review",
      subLabel: "Dashboard Ngày",
      icon: IconChartBar,
      isActive: true,
      onClick: () => setActiveModal("daily-review"),
    },
    {
      id: "gemba",
      label: "2. Gemba Walk",
      subLabel: "Sự Cố Máy Móc",
      icon: IconBuildingFactory,
      isActive: true,
      onClick: () => setActiveModal("gemba"),
    },
    {
      id: "ci",
      label: "3. Cải Tiến CI",
      subLabel: "Năng Suất 4.0",
      icon: IconBulb,
      isActive: true,
      onClick: () => setActiveModal("ci"),
    },
    {
      id: "kaizen",
      label: "4. Kaizen AI Groq",
      subLabel: "Quét Trùng Lặp",
      icon: IconBrain,
      isActive: true,
      onClick: () => setActiveModal("kaizen"),
    },
    {
      id: "docs",
      label: "5. Số Hóa Biểu Mẫu",
      subLabel: "Xuất Word/PDF",
      icon: IconFileText,
      isActive: true,
      onClick: () => alert("Mở module Số Hóa Biểu Mẫu"),
    },
    {
      id: "maint",
      label: "6. Bảo Trì Kỹ Thuật",
      subLabel: "App Mobile Native",
      icon: IconTool,
      isActive: true,
      onClick: () => alert("Mở module Bảo Trì Kỹ Thuật"),
    },
    {
      id: "qc",
      label: "7. Kiểm Soát QC",
      subLabel: "Tiêu Chuẩn SKECHERS",
      icon: IconShieldCheck,
      isActive: true,
      onClick: () => alert("Mở module QC"),
    },
    {
      id: "hr-kpi",
      label: "8. KPI Nhân Sự",
      subLabel: "Đánh Giá 360",
      icon: IconUsers,
      isActive: false,
      disabledReason: "Sắp ra mắt",
    },
    {
      id: "planning",
      label: "9. Kế Hoạch Sản Xuất",
      subLabel: "Tiến Độ Ca May",
      icon: IconSparkles,
      isActive: false,
      disabledReason: "Sắp ra mắt",
    },
    {
      id: "logistics-hub",
      label: "10. Kho Vận & ICD",
      subLabel: "Quản Lý Vỏ Cont",
      icon: IconBuildingFactory,
      isActive: false,
      disabledReason: "Sắp ra mắt",
    },
    {
      id: "energy",
      label: "11. Năng Lượng Xanh",
      subLabel: "Giám Sát Điện/Nước",
      icon: IconSparkles,
      isActive: false,
      disabledReason: "Sắp ra mắt",
    },
    {
      id: "audit-history",
      label: "12. Nhật Ký Audit",
      subLabel: "Lịch Sử Vận Hành",
      icon: IconFileText,
      isActive: false,
      disabledReason: "Sắp ra mắt",
    },
    {
      id: "compliance",
      label: "13. Tuân Thủ An Toàn",
      subLabel: "EHS Standard",
      icon: IconShieldCheck,
      isActive: false,
      disabledReason: "Sắp ra mắt",
    },
    {
      id: "global-sync",
      label: "14. Đồng Bộ Quốc Tế",
      subLabel: "SKECHERS Global API",
      icon: IconBrain,
      isActive: false,
      disabledReason: "Sắp ra mắt",
    },
  ];

  return (
    <div
      className="min-h-screen bg-slate-50/70 font-sans text-slate-900 antialiased selection:bg-[#006838] selection:text-white"
      style={{ zoom: `${zoomLevel}%` }}
    >
      <Header />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto space-y-6">
        {/* Function-first Control Toolbar (TBS Green on White) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#006838] flex items-center justify-center p-1.5 shadow-sm border border-emerald-800 overflow-hidden">
              <img src="/images/tbs-logo.png" alt="TBS Group Logo" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Văn Phòng Chuỗi SKECHERS - TBS Group
                </h1>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-[#006838] border border-emerald-200 px-2 py-0.5 rounded uppercase">
                  Hệ thống vận hành
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tài khoản: <span className="text-[#006838] font-bold">{userName}</span> ({userRoleCode})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                className="p-1 text-slate-600 hover:text-slate-900 transition-colors"
                title="Thu nhỏ"
              >
                <IconZoomOut size={15} />
              </button>
              <span className="px-2.5 font-mono text-xs font-bold text-[#006838]">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(125, z + 10))}
                className="p-1 text-slate-600 hover:text-slate-900 transition-colors"
                title="Phóng to"
              >
                <IconZoomIn size={15} />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1 text-slate-400 hover:text-slate-700 border-l border-slate-300 ml-1.5 pl-1.5 transition-colors"
                title="Đặt lại 100%"
              >
                <IconRefresh size={13} />
              </button>
            </div>

            {/* Quick Dropdown Selector in TBS Green */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006838] text-white border border-[#006838] text-xs font-bold hover:bg-[#08522d] shadow-sm transition-colors">
                <IconAdjustmentsHorizontal size={15} />
                <span>Danh sách Chức Năng (14)</span>
                <IconChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-64 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-xl hidden group-hover:block z-30 max-h-72 overflow-y-auto">
                {functionItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.isActive && item.onClick) item.onClick();
                    }}
                    disabled={!item.isActive}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      item.isActive
                        ? "text-slate-800 hover:text-[#006838] hover:bg-emerald-50 cursor-pointer"
                        : "text-slate-400 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <span>{item.label}</span>
                    {!item.isActive && (
                      <span className="text-[10px] text-amber-600 font-bold font-mono">Sắp ra mắt</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Clean Mode Selector Tabs */}
        <div className="flex items-center justify-center p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/80 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("functions")}
            className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === "functions"
                ? "bg-[#006838] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            14 Chức Năng Vận Hành
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === "departments"
                ? "bg-[#006838] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            14 Phòng Ban Sản Xuất
          </button>
        </div>

        {/* Main Operational Radial Canvas on White Container */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm">
          {activeTab === "functions" ? (
            <CircularMenu
              items={functionItems}
              centerTotalCount={398}
              onCenterClick={() => setIsDonutOpen(true)}
            />
          ) : (
            <DepartmentRadialMenu
              userRoleCode={userRoleCode}
              userDepartmentCode={userDeptCode}
              onSelectDepartment={(deptId, deptName) => {
                alert(`Bạn đã chọn Phòng Ban: ${deptName} (${deptId})`);
              }}
            />
          )}
        </div>

        {/* 4 Primary Daily Management Operational Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveModal("daily-review")}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#006838] hover:shadow-md transition-all text-left group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center mb-3 border border-emerald-200 group-hover:scale-105 transition-transform">
              <IconChartBar size={20} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1 group-hover:text-[#006838] transition-colors">
              1. Dashboard Daily Review
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Theo dõi KPI sản lượng, chỉ số OEE &amp; thời gian xử lý sự cố hàng ngày.
            </p>
          </button>

          <button
            onClick={() => setActiveModal("gemba")}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#006838] hover:shadow-md transition-all text-left group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center mb-3 border border-emerald-200 group-hover:scale-105 transition-transform">
              <IconBuildingFactory size={20} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1 group-hover:text-[#006838] transition-colors">
              2. Gemba Walk Hiện Trường
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ghi nhận biên bản sự cố thiết bị, hình ảnh thực tế và theo dõi thời gian SLA.
            </p>
          </button>

          <button
            onClick={() => setActiveModal("ci")}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#006838] hover:shadow-md transition-all text-left group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center mb-3 border border-emerald-200 group-hover:scale-105 transition-transform">
              <IconBulb size={20} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1 group-hover:text-[#006838] transition-colors">
              3. Đề Xuất Cải Tiến CI
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tổng hợp giải pháp nâng cao năng suất, 5S và tối ưu hóa dây chuyền.
            </p>
          </button>

          <button
            onClick={() => setActiveModal("kaizen")}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#006838] hover:shadow-md transition-all text-left group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center mb-3 border border-emerald-200 group-hover:scale-105 transition-transform">
              <IconBrain size={20} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1 group-hover:text-[#006838] transition-colors">
              4. Kaizen + AI Groq
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Công cụ trí tuệ nhân tạo tự động quét và so sánh mức độ trùng lặp sáng kiến.
            </p>
          </button>
        </div>
      </main>

      {/* Popups & Modals */}
      <DonutChartModal isOpen={isDonutOpen} onClose={() => setIsDonutOpen(false)} />
      <DailyManagementModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}

