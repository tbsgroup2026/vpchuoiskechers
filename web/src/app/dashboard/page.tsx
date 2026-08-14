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
  IconHierarchy,
  IconTool,
  IconFileText,
  IconUsers,
  IconZoomIn,
  IconZoomOut,
  IconRefresh,
  IconChevronDown,
  IconSparkles,
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
      className="min-h-screen bg-[#08221a] font-sans antialiased text-white selection:bg-[#2fd39a] selection:text-[#08221a] transition-all duration-300"
      style={{ zoom: `${zoomLevel}%` }}
    >
      <Header />

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto space-y-8">
        {/* Top Control Bar: Zoom controls, Functions Dropdown, User Scope */}
        <div className="bg-[#0d2419] p-4 sm:p-5 rounded-3xl border border-[#2fd39a]/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center font-bold font-mono">
              SKS
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Văn Phòng Chuỗi SKECHERS - TBS Group</span>
                <span className="text-[10px] font-mono font-bold bg-[#2fd39a] text-[#08221a] px-2 py-0.5 rounded-full uppercase">
                  LIVE 24/7
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                Xin chào, <strong className="text-[#f2dc9a]">{userName}</strong> ({userRoleCode})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center bg-[#08221a] p-1 rounded-2xl border border-white/10 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                className="p-1.5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white"
                title="Thu nhỏ"
              >
                <IconZoomOut size={16} />
              </button>
              <span className="px-2 font-mono font-bold text-[#2fd39a]">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(125, z + 10))}
                className="p-1.5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white"
                title="Phóng to"
              >
                <IconZoomIn size={16} />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white border-l border-white/10 ml-1"
                title="Đặt lại"
              >
                <IconRefresh size={14} />
              </button>
            </div>

            {/* Dropdown "Chức Năng" reading 14-button array data */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0f4133] border border-[#2fd39a]/40 text-xs font-extrabold text-[#2fd39a] hover:bg-[#2fd39a] hover:text-[#08221a] transition-all">
                <span>Dropdown Chức Năng (14 Nút)</span>
                <IconChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#08221a]/98 border border-[#2fd39a]/40 p-2 shadow-2xl backdrop-blur-2xl hidden group-hover:block z-30 max-h-72 overflow-y-auto">
                {functionItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.isActive && item.onClick) item.onClick();
                    }}
                    disabled={!item.isActive}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      item.isActive
                        ? "text-gray-200 hover:text-[#2fd39a] hover:bg-white/5 cursor-pointer"
                        : "text-gray-500 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span>{item.label}</span>
                    {!item.isActive && (
                      <span className="text-[9px] font-bold text-amber-400">Sắp ra mắt</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* Mode Selector Tabs: Vành Tròn 14 Chức Năng vs Vành Tròn 14 Phòng Ban */}
        <div className="flex items-center justify-center gap-3 bg-[#0d2419] p-1.5 rounded-2xl border border-white/10 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("functions")}
            className={`flex-1 py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === "functions"
                ? "bg-gradient-to-r from-[#2fd39a] to-[#f2dc9a] text-[#08221a] shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Vành Tròn 14 Chức Năng
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`flex-1 py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === "departments"
                ? "bg-gradient-to-r from-[#2fd39a] to-[#f2dc9a] text-[#08221a] shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Vành Tròn 14 Phòng Ban
          </button>
        </div>


        {/* Main Circular Radial View */}
        <div className="bg-[#061a14] p-6 sm:p-10 rounded-3xl border border-[#2fd39a]/20 shadow-2xl">
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


        {/* Daily Management 4 Quick Cards Access */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveModal("daily-review")}
            className="p-5 rounded-3xl bg-[#0d2419] border border-[#2fd39a]/30 hover:border-[#2fd39a] transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <IconChartBar size={22} />
            </div>
            <h3 className="text-sm font-extrabold text-white mb-1 group-hover:text-[#2fd39a] transition-colors">
              1. Dashboard Daily Review
            </h3>
            <p className="text-xs text-gray-400">KPI sản lượng, OEE &amp; thời gian xử lý sự cố</p>
          </button>

          <button
            onClick={() => setActiveModal("gemba")}
            className="p-5 rounded-3xl bg-[#0d2419] border border-red-500/30 hover:border-red-400 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <IconBuildingFactory size={22} />
            </div>
            <h3 className="text-sm font-extrabold text-white mb-1 group-hover:text-red-400 transition-colors">
              2. Gemba Walk Hiện Trường
            </h3>
            <p className="text-xs text-gray-400">Tạo biên bản sự cố, đính kèm ảnh R2 &amp; đếm SLA</p>
          </button>

          <button
            onClick={() => setActiveModal("ci")}
            className="p-5 rounded-3xl bg-[#0d2419] border border-amber-500/30 hover:border-amber-400 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <IconBulb size={22} />
            </div>
            <h3 className="text-sm font-extrabold text-white mb-1 group-hover:text-amber-400 transition-colors">
              3. Đề Xuất Cải Tiến CI
            </h3>
            <p className="text-xs text-gray-400">Ghi nhận giải pháp nâng cao chất lượng &amp; 5S</p>
          </button>

          <button
            onClick={() => setActiveModal("kaizen")}
            className="p-5 rounded-3xl bg-[#0d2419] border border-[#2fd39a]/30 hover:border-[#2fd39a] transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <IconBrain size={22} />
            </div>
            <h3 className="text-sm font-extrabold text-white mb-1 group-hover:text-[#2fd39a] transition-colors">
              4. Kaizen + AI Groq
            </h3>
            <p className="text-xs text-gray-400">Tích hợp AI so sánh trùng lặp thông minh</p>
          </button>
        </div>
      </main>

      {/* Popups & Modals */}
      <DonutChartModal isOpen={isDonutOpen} onClose={() => setIsDonutOpen(false)} />
      <DailyManagementModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
