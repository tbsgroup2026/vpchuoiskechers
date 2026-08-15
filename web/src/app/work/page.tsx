"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  IconTrendingUp,
  IconClipboardList,
  IconPackage,
  IconClock,
  IconArrowUpRight,
  IconHome,
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

  // 7 Numbered Departments List
  const departments: DepartmentItem[] = [
    {
      id: "hr",
      num: "01",
      name: "Nhân sự hành chánh",
      sub: "Quản lý văn thư, tài sản & tuyển dụng",
      icon: IconUsers,
      hasData: false,
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
      name: "TH-NM",
      sub: "Thực hành nhà máy & Sản xuất chuỗi",
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
    <div className="min-h-screen flex bg-[#f4f7f5] text-slate-900 font-sans antialiased selection:bg-[#006838] selection:text-white">
      {/* ════════════════════════════════════════════════════════════════
          LEFT SIDEBAR (Human-Designed Crisp White Panel with TBS Green)
         ════════════════════════════════════════════════════════════════ */}
      <aside className="w-80 lg:w-96 bg-white flex flex-col justify-between p-6 border-r border-slate-200/80 flex-shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Executive Brand Lockup with Skechers Corporate Logo */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
            <Link href="/" className="flex items-center gap-3.5 group">
              <img
                src="/images/tbs-logo.png"
                alt="TBS Group Logo"
                className="h-9 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <div className="h-7 w-[1px] bg-slate-200" />
              {/* Skechers Corporate Brand Logo */}
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-[#002B49] text-white flex items-center justify-center font-black italic text-xs tracking-tighter shadow-sm">
                  S
                </div>
                <span className="font-black italic text-base tracking-widest text-[#002B49] font-sans">
                  SKECHERS
                </span>
              </div>
            </Link>

            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-[#006838] hover:bg-emerald-50 transition-colors border border-slate-200/80"
              title="Về Trang Chủ"
            >
              <IconHome size={18} />
            </Link>
          </div>

          {/* Department List (Clean Human Layout on Crisp White Surface) */}
          <div className="space-y-2">
            <div className="px-2 text-[11px] font-extrabold uppercase tracking-widest text-[#006838]">
              Phòng Ban Điều Hành (01 - 07)
            </div>

            <div className="space-y-1.5 pt-1">
              {departments.map((dept) => {
                const IconComp = dept.icon;
                const isSelected = selectedDept === dept.id;

                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3.5 transition-all duration-200 group relative ${
                      isSelected
                        ? "bg-[#006838] text-white shadow-md shadow-emerald-900/20 border border-[#006838]"
                        : "bg-white hover:bg-[#e6f4ed]/50 text-slate-700 hover:text-slate-900 border border-slate-100"
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r-full" />
                    )}

                    {/* Icon Box */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white"
                      }`}
                    >
                      <IconComp size={18} />
                    </div>

                    {/* Department Title & Subtitle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            isSelected ? "text-emerald-100" : "text-[#006838]/70"
                          }`}
                        >
                          {dept.num}.
                        </span>
                        <h4 className="text-xs font-extrabold truncate tracking-tight">
                          {dept.name}
                        </h4>
                      </div>
                      <p
                        className={`text-[11px] truncate mt-0.5 font-normal ${
                          isSelected ? "text-emerald-100" : "text-slate-500"
                        }`}
                      >
                        {dept.sub}
                      </p>
                    </div>

                    {/* Subtle Status Tag */}
                    {!dept.hasData && (
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-amber-100/90 text-amber-800 border border-amber-200"
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
        </div>

        {/* Executive Footer Credit */}
        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <img
              src="/images/tbs-logo.png"
              alt="TBS Logo"
              className="h-4 w-auto object-contain"
            />
            <span className="font-semibold text-slate-700 text-[11px]">
              TBS Group Operating System
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            © 2026
          </span>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════
          MAIN DASHBOARD AREA (Crisp White & Mint Corporate Surface)
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 bg-[#f4f7f5] text-slate-900 rounded-tl-[32px] overflow-y-auto flex flex-col justify-between">
        {/* Top Header Bar */}
        <header className="p-6 lg:p-8 pb-4 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Xin chào, <span className="text-[#006838]">Anh Huy!</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Chúc bạn một ngày làm việc hiệu quả tại Văn Phòng Chuỗi SKECHERS - TBS Group.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {selectedDept && (
              <button
                onClick={() => setSelectedDept(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                ← Trở về Tổng Quan
              </button>
            )}

            {/* Notifications Button */}
            <button
              className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              title="Thông báo hệ thống"
            >
              <IconBell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#006838] border-2 border-white animate-pulse" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              title="Toàn màn hình"
            >
              <IconMaximize size={20} />
            </button>

            {/* User Avatar */}
            <div className="relative flex items-center gap-3 pl-2">
              <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-[#006838] overflow-hidden shadow-md">
                <img
                  src="/images/crawled/Da-giay1.jpg"
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6 lg:p-8 space-y-8 flex-1">
          {/* IF A "COMING SOON" DEPARTMENT IS SELECTED */}
          {activeDeptObj && !activeDeptObj.hasData && (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4 max-w-2xl mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <IconClock size={36} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Phòng {activeDeptObj.name}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
                Dữ liệu bảng điều khiển dành riêng cho {activeDeptObj.name} đang trong quá trình số hóa và đấu nối hệ thống.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/90 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <span>Tính năng đang phát triển — Coming Soon</span>
              </div>
            </div>
          )}

          {/* IF R&D (PHÁT TRIỂN SẢN PHẨM) IS SELECTED */}
          {selectedDept === "rd" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    🧪 Chỉ Số Phòng Phát Triển Sản Phẩm (R&D)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Cập nhật thời gian thực về tiến độ phát triển mẫu giày SKECHERS.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                  Dữ liệu R&D Live
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { title: "Mẫu Đã Duyệt", val: "142 Mẫu", trend: "+18%", color: "emerald" },
                  { title: "Mẫu Đang Thử Nghiệm", val: "28 Mẫu", trend: "+5%", color: "blue" },
                  { title: "Thời Gian Lead Time", val: "4.2 Ngày", trend: "-15%", color: "purple" },
                  { title: "Duyệt Mẫu Lần 1", val: "94.8%", trend: "+2.1%", color: "amber" },
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-slate-500">{item.title}</span>
                    <div className="text-2xl font-black text-slate-900">{item.val}</div>
                    <span className="text-xs text-[#006838] font-bold block">{item.trend} so với tháng trước</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IF QC (QUẢN LÝ CHẤT LƯỢNG) IS SELECTED */}
          {selectedDept === "qc" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    🛡️ Chỉ Số Phòng Quản Lý Chất Lượng (QC)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Hệ thống kiểm soát tỷ lệ lỗi Gemba Walk và chỉ số OEE nhà máy.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  Dữ liệu QC Live
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { title: "Tỷ Lệ Đạt QC", val: "98.6%", trend: "+1.2%", color: "emerald" },
                  { title: "Tổng Lỗi Kiểm Hàng", val: "14 Lỗi", trend: "-28%", color: "blue" },
                  { title: "Lỗi Gemba Cần Sửa", val: "3 Lỗi", trend: "Xử lý 92%", color: "purple" },
                  { title: "Chỉ Số OEE Nhà Máy", val: "91.5%", trend: "+3.5%", color: "amber" },
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-slate-500">{item.title}</span>
                    <div className="text-2xl font-black text-slate-900">{item.val}</div>
                    <span className="text-xs text-[#006838] font-bold block">{item.trend} so với tháng trước</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IF TH-NM (PHÒNG SẢN XUẤT) IS SELECTED */}
          {selectedDept === "production" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    🏭 Chỉ Số Phòng Sản Xuất (TH-NM)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Thống kê 33 dây chuyền sản xuất giày SKECHERS thuộc hệ thống nhà máy TBS Group.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  Dữ liệu Sản Xuất Live
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { title: "Sản Lượng Tháng", val: "586,000 Đôi", trend: "+15%", color: "emerald" },
                  { title: "Số Dây Chuyền", val: "33 Chuyền", trend: "100% Hoạt động", color: "blue" },
                  { title: "Hiệu Suất Chuyền", val: "92.4%", trend: "+5%", color: "purple" },
                  { title: "Tiến Độ Đơn Hàng", val: "89.2%", trend: "Đạt kế hoạch", color: "amber" },
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-slate-500">{item.title}</span>
                    <div className="text-2xl font-black text-slate-900">{item.val}</div>
                    <span className="text-xs text-[#006838] font-bold block">{item.trend} so với tháng trước</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEFAULT MAIN DASHBOARD */}
          {!selectedDept && (
            <div className="space-y-8">
              {/* TOP ROW: 4 Metric Cards (Left Column) + Donut Ring Chart (Right Column) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Left Column (4 Cards Vertical Stack) */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Card 1: R&D (Phòng phát triển) */}
                  <div
                    onClick={() => setSelectedDept("rd")}
                    className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#006838]/60 transition-all cursor-pointer flex items-center gap-4 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#006838] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
                      <IconUsers size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-500 block">
                        Chỉ Số Phòng Phát Triển (R&D)
                      </span>
                      <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        1,248
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#006838] mt-0.5">
                        <IconArrowUpRight size={14} />
                        <span>+12% so với tháng trước</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Đơn Hàng */}
                  <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-blue-100">
                      <IconClipboardList size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-500 block">
                        Đơn Hàng Chuỗi SKECHERS
                      </span>
                      <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        342
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#006838] mt-0.5">
                        <IconArrowUpRight size={14} />
                        <span>+8% so với tháng trước</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Chỉ Số Phòng Sản Xuất (TH-NM) */}
                  <div
                    onClick={() => setSelectedDept("production")}
                    className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex items-center gap-4 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-purple-100">
                      <IconPackage size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-500 block">
                        Chỉ Số Phòng Sản Xuất (TH-NM)
                      </span>
                      <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        586
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#006838] mt-0.5">
                        <IconArrowUpRight size={14} />
                        <span>+15% so với tháng trước</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Hiệu Suất & Chỉ Số Chất Lượng (QC) */}
                  <div
                    onClick={() => setSelectedDept("qc")}
                    className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex items-center gap-4 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-amber-100">
                      <IconTrendingUp size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-500 block">
                        Chỉ Số Chất Lượng &amp; Hiệu Suất (QC)
                      </span>
                      <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        92%
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#006838] mt-0.5">
                        <IconArrowUpRight size={14} />
                        <span>+5% so với tháng trước</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (TỔNG CẢI TIẾN - Donut Chart Block) */}
                <div className="lg:col-span-8 p-6 lg:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-100">
                        <IconSettings size={22} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        TỔNG CẢI TIẾN
                      </h3>
                    </div>

                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <option value="Tháng này">Tháng này</option>
                      <option value="Tháng trước">Tháng trước</option>
                      <option value="Quý 2/2026">Quý 2/2026</option>
                      <option value="Cả năm 2026">Cả năm 2026</option>
                    </select>
                  </div>

                  {/* Donut Ring Visual matching exact colors and structure */}
                  <div className="relative py-4 flex flex-col lg:flex-row items-center justify-center gap-8">
                    {/* Donut SVG Ring Graphic */}
                    <div className="relative w-72 h-72 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Segments matching screenshot colors */}
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
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-bold w-full max-w-md">
                      <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0" />
                        <div>
                          <span className="text-slate-600 block">Nhân sự hành chánh</span>
                          <span className="text-slate-900 font-black">132 <span className="text-[#006838] font-semibold">(22.7%)</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-orange-600 flex-shrink-0" />
                        <div>
                          <span className="text-slate-600 block">CN-CI</span>
                          <span className="text-slate-900 font-black">112 <span className="text-amber-600 font-semibold">(19.2%)</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-cyan-500 flex-shrink-0" />
                        <div>
                          <span className="text-slate-600 block">Kế toán &amp; quản trị</span>
                          <span className="text-slate-900 font-black">98 <span className="text-[#006838] font-semibold">(16.8%)</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-[#006838] flex-shrink-0" />
                        <div>
                          <span className="text-slate-600 block">Quản lý chất lượng (QC)</span>
                          <span className="text-slate-900 font-black">86 <span className="text-[#006838] font-semibold">(14.8%)</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-pink-600 flex-shrink-0" />
                        <div>
                          <span className="text-slate-600 block">R&amp;D (Phát triển mẫu)</span>
                          <span className="text-slate-900 font-black">76 <span className="text-[#006838] font-semibold">(13.1%)</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50">
                        <span className="w-3 h-3 rounded-full bg-sky-600 flex-shrink-0" />
                        <div>
                          <span className="text-slate-600 block">KH chuẩn bị - TTPP</span>
                          <span className="text-slate-900 font-black">54 <span className="text-[#006838] font-semibold">(9.3%)</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 col-span-2">
                        <span className="w-3 h-3 rounded-full bg-purple-600 flex-shrink-0" />
                        <div>
                          <span className="text-slate-600 block">TH-NM (Sản xuất nhà máy)</span>
                          <span className="text-slate-900 font-black">24 <span className="text-pink-600 font-semibold">(4.1%)</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: System Notifications Bar ("THÔNG BÁO HỆ THỐNG") */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    THÔNG BÁO HỆ THỐNG
                  </h3>
                  <button className="text-xs font-bold text-[#006838] hover:underline flex items-center gap-1">
                    <span>Xem tất cả</span>
                    <IconChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Notification 1 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006838] flex items-center justify-center flex-shrink-0">
                      <IconClipboardList size={20} />
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
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <IconUsers size={20} />
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
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3.5 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                      <IconPackage size={20} />
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
        <footer className="p-4 px-8 border-t border-slate-200/70 text-xs text-slate-500 flex items-center justify-between bg-[#f4f7f5]">
          <span>Văn Phòng Chuỗi SKECHERS - TBS Group Dashboard v2.4</span>
          <span className="font-mono text-[#006838] font-bold">● System Online 24/7</span>
        </footer>
      </main>
    </div>
  );
}
