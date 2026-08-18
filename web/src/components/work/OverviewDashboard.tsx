"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconUsers,
  IconCalculator,
  IconFlask,
  IconShieldCheck,
  IconTruck,
  IconChartBar,
  IconFileText,
  IconCalendarEvent,
  IconHeadset,
  IconChevronRight,
  IconSpeakerphone,
  IconInfoCircle,
  IconCalendar,
  IconPackage,
  IconBell,
} from "@tabler/icons-react";

interface OverviewDashboardProps {
  onSelectDept?: (deptId: string) => void;
  userName?: string;
}

interface ChartPoint {
  day: string;
  val: number;
  x: number;
  y: number;
  highlight?: boolean;
}

export default function OverviewDashboard({
  onSelectDept,
  userName = "Phạm Nguyễn Anh Huy",
}: OverviewDashboardProps) {
  const [chartTab, setChartTab] = useState<"thisMonth" | "lastMonth">("thisMonth");

  // Mock Activity Chart Points for This Month
  const chartPointsThisMonth: ChartPoint[] = [
    { day: "01", val: 20, x: 25, y: 120 },
    { day: "05", val: 38, x: 85, y: 95 },
    { day: "08", val: 42, x: 135, y: 88 },
    { day: "10", val: 32, x: 180, y: 105 },
    { day: "12", val: 50, x: 230, y: 78 },
    { day: "13", val: 78, x: 260, y: 35, highlight: true }, // PEAK POINT
    { day: "15", val: 48, x: 300, y: 80 },
    { day: "18", val: 55, x: 350, y: 70 },
    { day: "20", val: 38, x: 400, y: 95 },
    { day: "23", val: 56, x: 450, y: 68 },
    { day: "26", val: 65, x: 505, y: 55 },
    { day: "28", val: 46, x: 555, y: 82 },
    { day: "30", val: 65, x: 610, y: 55 },
  ];

  const chartPointsLastMonth: ChartPoint[] = [
    { day: "01", val: 15, x: 25, y: 128 },
    { day: "05", val: 30, x: 85, y: 105 },
    { day: "08", val: 35, x: 135, y: 98 },
    { day: "10", val: 45, x: 180, y: 85 },
    { day: "12", val: 40, x: 230, y: 90 },
    { day: "13", val: 55, x: 260, y: 70 },
    { day: "15", val: 62, x: 300, y: 60 },
    { day: "18", val: 48, x: 350, y: 80 },
    { day: "20", val: 52, x: 400, y: 75 },
    { day: "23", val: 45, x: 450, y: 85 },
    { day: "26", val: 58, x: 505, y: 65 },
    { day: "28", val: 50, x: 555, y: 78 },
    { day: "30", val: 58, x: 610, y: 65 },
  ];

  const currentPoints = chartTab === "thisMonth" ? chartPointsThisMonth : chartPointsLastMonth;

  // Generate SVG Path
  const pathD = currentPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  return (
    <div className="space-y-4 sm:space-y-4.5 w-full min-w-0 animate-in fade-in duration-300">
      {/* ════════════════════════════════════════════════════════════════
          1. HERO BANNER CARD (XANH LÁ TBS + GIÀY SKECHERS NEON)
         ════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-md bg-gradient-to-r from-[#006838] via-[#008f4c] to-[#005a30] text-white p-5 sm:p-7 border border-emerald-700/40 flex flex-col md:flex-row items-center justify-between gap-6 min-h-[170px]">
        {/* Subtle Wave Neon Background Graphic */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right_center,rgba(141,198,63,0.25),transparent_60%)] pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Left: Greeting & Mission Pills */}
        <div className="relative z-10 space-y-3.5 max-w-xl text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-white flex items-center gap-2">
              <span>👋</span>
              <span>Xin chào, {userName}!</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
              Chúc bạn một ngày làm việc hiệu quả tại Văn phòng Chuỗi SKECHERS – TBS Group.
            </p>
          </div>

          {/* 3 Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <span className="px-3.5 py-1 rounded-full bg-white/20 hover:bg-white/25 border border-white/25 text-[11px] font-bold text-white backdrop-blur-xs transition-colors shadow-2xs">
              Hiệu quả hơn
            </span>
            <span className="px-3.5 py-1 rounded-full bg-white/20 hover:bg-white/25 border border-white/25 text-[11px] font-bold text-white backdrop-blur-xs transition-colors shadow-2xs">
              Minh bạch hơn
            </span>
            <span className="px-3.5 py-1 rounded-full bg-white/20 hover:bg-white/25 border border-white/25 text-[11px] font-bold text-white backdrop-blur-xs transition-colors shadow-2xs">
              Số hóa toàn diện
            </span>
          </div>
        </div>

        {/* Right: Skechers Shoe 3D Graphic with Glowing Neon Orb */}
        <div className="relative z-10 flex-shrink-0 flex items-center justify-center">
          <div className="relative w-56 sm:w-64 h-32 sm:h-36 flex items-center justify-center">
            {/* Neon Speed Ring Effect */}
            <div className="absolute inset-0 rounded-full border-2 border-lime-300/40 blur-xs scale-90 -rotate-12 animate-pulse" />
            <div className="absolute w-44 h-16 bg-lime-400/20 rounded-full blur-xl top-1/2 -translate-y-1/2" />

            {/* Glowing Shoe Graphic */}
            <img
              src="/images/crawled/De-giay.jpg"
              alt="SKECHERS Innovation Shoe"
              className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] hover:scale-105 transition-transform duration-500 rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          2. ROW 1: 6 THẺ PHÒNG BAN + KHỐI TRUY CẬP NHANH (4 ICON)
         ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left (Col 8/12): 6 Thẻ Phòng Ban Chính */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            {
              id: "hr",
              name: "Nhân sự\n& Hành chính",
              icon: IconUsers,
              iconBg: "bg-emerald-100 text-emerald-700",
            },
            {
              id: "finance",
              name: "Kế toán\n& Tài chính",
              icon: IconCalculator,
              iconBg: "bg-blue-100 text-blue-700",
            },
            {
              id: "rd",
              name: "R&D\n(Phát triển SP)",
              icon: IconFlask,
              iconBg: "bg-purple-100 text-purple-700",
            },
            {
              id: "qc",
              name: "Quản lý\nchất lượng",
              icon: IconShieldCheck,
              iconBg: "bg-teal-100 text-teal-700",
            },
            {
              id: "logistics",
              name: "Kho &\nLogistics",
              icon: IconTruck,
              iconBg: "bg-orange-100 text-orange-700",
            },
            {
              id: "report",
              name: "Báo cáo\nthống kê",
              icon: IconChartBar,
              iconBg: "bg-cyan-100 text-cyan-700",
              href: "/finance/bao-cao",
            },
          ].map((item) => {
            const IconC = item.icon;
            const content = (
              <div className="flex flex-col items-center text-center p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-[#006838]/60 hover:shadow-sm transition-all duration-200 group cursor-pointer h-full justify-center space-y-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${item.iconBg}`}>
                  <IconC size={20} />
                </div>
                <span className="text-[11px] font-extrabold text-slate-700 leading-tight whitespace-pre-line group-hover:text-[#006838] transition-colors">
                  {item.name}
                </span>
              </div>
            );

            if (item.href) {
              return (
                <Link key={item.id} href={item.href} className="block h-full">
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectDept?.(item.id)}
                className="block h-full w-full text-left cursor-pointer"
              >
                {content}
              </button>
            );
          })}
        </div>

        {/* Right (Col 4/12): Khối Truy Cập Nhanh */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <span className="text-emerald-600">⚡</span>
              <span>Truy cập nhanh</span>
            </div>
            <Link
              href="/finance"
              className="text-[11px] font-extrabold text-[#006838] hover:underline flex items-center gap-0.5"
            >
              <span>Xem tất cả</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Nhập liệu", icon: IconFileText, href: "/finance?tab=desk", color: "text-emerald-700", bg: "bg-emerald-50 hover:bg-emerald-100" },
              { label: "Báo cáo", icon: IconChartBar, href: "/finance/bao-cao", color: "text-blue-700", bg: "bg-blue-50 hover:bg-blue-100" },
              { label: "Lịch công việc", icon: IconCalendarEvent, href: "/business-trip", color: "text-amber-700", bg: "bg-amber-50 hover:bg-amber-100" },
              { label: "Hỗ trợ", icon: IconHeadset, href: "/rooms", color: "text-purple-700", bg: "bg-purple-50 hover:bg-purple-100" },
            ].map((q, idx) => {
              const QIcon = q.icon;
              return (
                <Link
                  key={idx}
                  href={q.href}
                  className="flex flex-col items-center text-center p-2 rounded-xl border border-slate-200/70 hover:border-[#006838]/60 hover:shadow-2xs transition-all duration-200 group bg-slate-50/60"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${q.bg} ${q.color}`}>
                    <QIcon size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 mt-1.5 truncate w-full group-hover:text-[#006838] transition-colors">
                    {q.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          3. ROW 2: 4 THẺ KPI CHỈ SỐ HOẠT ĐỘNG TOÀN HỆ THỐNG
         ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Nhân sự toàn hệ thống */}
        <div
          onClick={() => onSelectDept?.("hr")}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-400 hover:shadow-sm transition-all duration-200 flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-[#006838] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <IconUsers size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="truncate">Nhân sự toàn hệ thống</span>
              <IconChevronRight size={14} className="text-slate-400 group-hover:text-[#006838] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-sans">586</span>
              <span className="text-[11px] font-bold text-slate-500">Đang hoạt động</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 mt-0.5">
              <span>▲ +12% so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Đơn hàng / Logistics */}
        <div
          onClick={() => onSelectDept?.("logistics")}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-sm transition-all duration-200 flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <IconTruck size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="truncate">Đơn hàng / Logistics</span>
              <IconChevronRight size={14} className="text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-sans">33</span>
              <span className="text-[11px] font-bold text-slate-500">chuyền</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-700 mt-0.5">
              <span>▲ +8% so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Tỷ lệ chất lượng (QC) */}
        <div
          onClick={() => onSelectDept?.("qc")}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-purple-400 hover:shadow-sm transition-all duration-200 flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-100/80 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <IconPackage size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="truncate">Tỷ lệ chất lượng (QC)</span>
              <IconChevronRight size={14} className="text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-sans">92.4%</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 mt-0.5">
              <span>▲ +5% so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Dự án R&D */}
        <div
          onClick={() => onSelectDept?.("rd")}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-400 hover:shadow-sm transition-all duration-200 flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-100/80 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <IconFlask size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="truncate">Dự án R&amp;D</span>
              <IconChevronRight size={14} className="text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-sans">12</span>
              <span className="text-[11px] font-bold text-slate-500">dự án</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-teal-700 mt-0.5">
              <span>▲ +20% so với tháng trước</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          4. ROW 3: BIỂU ĐỒ HOẠT ĐỘNG (TRAI) + VIỆC CẦN XỬ LÝ + THÔNG BÁO
         ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Col 5/12: Biểu đồ biến động hoạt động theo tháng */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
          {/* Header & Month Toggle */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-emerald-100 text-[#006838] flex items-center justify-center text-xs">
                📈
              </span>
              <span>Biến động hoạt động theo tháng</span>
            </h3>

            {/* Toggle Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setChartTab("thisMonth")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartTab === "thisMonth"
                    ? "bg-white text-[#006838] font-black shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => setChartTab("lastMonth")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartTab === "lastMonth"
                    ? "bg-white text-[#006838] font-black shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tháng trước
              </button>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="relative w-full h-48 sm:h-52 pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 640 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="overviewAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#006838" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#006838" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[
                { val: 100, y: 20 },
                { val: 80, y: 45 },
                { val: 60, y: 70 },
                { val: 40, y: 95 },
                { val: 20, y: 120 },
                { val: 0, y: 145 },
              ].map((g, idx) => (
                <g key={idx}>
                  <text x="12" y={g.y + 3.5} textAnchor="end" fill="#94a3b8" fontSize="9" fontWeight="700" className="font-mono select-none">
                    {g.val}
                  </text>
                  <line x1="20" y1={g.y} x2="630" y2={g.y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray={g.val === 0 ? "none" : "3 3"} />
                </g>
              ))}

              {/* Area Polygon */}
              <polygon points={currentPoints.map((p) => `${p.x},${p.y}`).join(" ") + ` 610,145 25,145`} fill="url(#overviewAreaGradient)" />

              {/* Line Curve */}
              <path d={pathD} fill="none" stroke="#006838" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Points */}
              {currentPoints.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r={pt.highlight ? "5" : "3.5"} fill="#ffffff" stroke="#006838" strokeWidth={pt.highlight ? "3" : "2"} />
                  {/* X Axis Labels */}
                  {["01", "05", "10", "15", "20", "25", "30"].includes(pt.day) && (
                    <text x={pt.x} y="156" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="700" className="font-mono select-none">
                      {pt.day}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {/* Peak Point Tooltip (78 Hoạt Động) */}
            {chartTab === "thisMonth" && (
              <div className="absolute left-[38%] top-[14%] -translate-x-1/2 -translate-y-full bg-white border-2 border-[#006838] px-2.5 py-1 rounded-xl shadow-md text-center pointer-events-none animate-bounce">
                <div className="text-xs font-black text-slate-900 leading-none">78</div>
                <div className="text-[9px] font-extrabold text-[#006838] leading-none mt-0.5">Hoạt động</div>
                {/* Arrow */}
                <div className="w-2 h-2 bg-white border-r-2 border-b-2 border-[#006838] rotate-45 mx-auto -mb-2 mt-0.5" />
              </div>
            )}
          </div>
        </div>

        {/* Col 4/12: Công Việc Cần Xử Lý */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="text-emerald-600">🌱</span>
              <span>Công việc cần xử lý</span>
              <span className="h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                3
              </span>
            </h3>
            <span className="text-slate-400 text-xs">›</span>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: "Nhập số liệu kế toán tháng 8/2025",
                dept: "Phòng Kế toán",
                deadline: "28/08",
                icon: IconFileText,
                iconBg: "bg-emerald-100 text-emerald-700",
                href: "/finance",
              },
              {
                title: "Báo cáo tiến độ dự án R&D",
                dept: "Phòng R&D",
                deadline: "30/08",
                icon: IconFlask,
                iconBg: "bg-purple-100 text-purple-700",
                href: "/work",
              },
              {
                title: "Kiểm tra chất lượng lô hàng",
                dept: "Phòng QC",
                deadline: "29/08",
                icon: IconShieldCheck,
                iconBg: "bg-teal-100 text-teal-700",
                href: "/work",
              },
            ].map((task, idx) => {
              const TIcon = task.icon;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-[#006838]/60 hover:shadow-2xs transition-all duration-200 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${task.iconBg}`}>
                      <TIcon size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-800 truncate group-hover:text-[#006838] transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{task.dept}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-black whitespace-nowrap">
                    Hạn: {task.deadline}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Col 3/12: Thông Báo */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
              <IconBell size={16} className="text-emerald-600" />
              <span>Thông báo</span>
            </h3>
            <Link href="/news" className="text-[11px] font-extrabold text-[#006838] hover:underline flex items-center gap-0.5">
              <span>Xem tất cả</span>
              <span>→</span>
            </Link>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: "Khai trương mô hình số hóa Văn phòng Chuỗi SKECHERS",
                date: "26/08/2025",
                icon: IconSpeakerphone,
                iconBg: "bg-emerald-100 text-[#006838]",
              },
              {
                title: "Cập nhật quy trình nhập liệu mới",
                date: "24/08/2025",
                icon: IconInfoCircle,
                iconBg: "bg-blue-100 text-blue-700",
              },
              {
                title: "Lịch đào tạo nội bộ tháng 9",
                date: "22/08/2025",
                icon: IconCalendar,
                iconBg: "bg-purple-100 text-purple-700",
              },
            ].map((news, idx) => {
              const NIcon = news.icon;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-[#006838]/60 hover:shadow-2xs transition-all duration-200 flex items-start gap-2.5 group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${news.iconBg}`}>
                    <NIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#006838] transition-colors">
                      {news.title}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">{news.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          5. FOOTER THƯƠNG HIỆU & SỨ MỆNH
         ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] font-bold text-[#006838]">
        <div className="flex items-center gap-2">
          <span>🌱</span>
          <span>Sống tinh gọn – Làm việc hiệu quả – Cùng phát triển bền vững</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span>© 2025 TBS Group – Văn phòng Chuỗi SKECHERS – R&amp;D Center</span>
          <span>💚</span>
        </div>
      </div>
    </div>
  );
}
