"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  IconActivity,
  IconArrowUpRight,
  IconBolt,
  IconCircleCheck,
  IconSparkles,
  IconBuildingFactory,
  IconFilter,
  IconLayoutGrid,
} from "@tabler/icons-react";
import { getCurrentUser, normalizeEmpCode, getSystemUser } from "@/lib/userProfiles";

interface OverviewDashboardProps {
  onSelectDept?: (deptId: string) => void;
  userName?: string;
  userCode?: string;
  currentUser?: any;
  canViewFinance?: boolean;
}

interface ChartPoint {
  day: string;
  val: number;
  x: number;
  y: number;
  highlight?: boolean;
}

interface DepartmentKpiConfig {
  id: string;
  name: string;
  headcount: string;
  headcountSub: string;
  tasksCount: string;
  pendingReviewCount: string;
  progressPercent: string;
  progressSub: string;
  kpiPercent: string;
  kpiSub: string;
  chartPeak: number;
  tasks: Array<{
    id: string;
    title: string;
    dept: string;
    deadline: string;
    icon: any;
    iconBg: string;
    href: string;
    tag: string;
    tagBg: string;
  }>;
}

const DEPT_KPI_CONFIGS: Record<string, DepartmentKpiConfig> = {
  hr: {
    id: "hr",
    name: "Nhân Sự - Hành Chính",
    headcount: "18",
    headcountSub: "Đang làm việc đầy đủ",
    tasksCount: "24",
    pendingReviewCount: "4 task chờ bạn duyệt",
    progressPercent: "91.2%",
    progressSub: "+4.5% so với tháng trước",
    kpiPercent: "96.5%",
    kpiSub: "Đạt chỉ tiêu kế hoạch tháng",
    chartPeak: 78,
    tasks: [
      {
        id: "hr-1",
        title: "Duyệt yêu cầu đăng ký phòng họp tuần này",
        dept: "Nhân Sự - Hành Chính",
        deadline: "29/08",
        icon: IconCalendarEvent,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/rooms",
        tag: "CẦN DUYỆT",
        tagBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        id: "hr-2",
        title: "Rà soát chỉ số KPI phòng Nhân Sự - Hành Chính tháng 8",
        dept: "Nhân Sự - Hành Chính",
        deadline: "30/08",
        icon: IconActivity,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/tasks",
        tag: "ĐANG XỬ LÝ",
        tagBg: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        id: "hr-3",
        title: "Tổng hợp danh sách lịch công tác phòng",
        dept: "Nhân Sự - Hành Chính",
        deadline: "31/08",
        icon: IconFileText,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/business-trip",
        tag: "CẦN DUYỆT",
        tagBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
    ],
  },
  finance: {
    id: "finance",
    name: "Kế Toán - Tài Chính",
    headcount: "12",
    headcountSub: "Đang làm việc đầy đủ",
    tasksCount: "19",
    pendingReviewCount: "2 task chờ bạn duyệt",
    progressPercent: "94.8%",
    progressSub: "+3.2% so với tháng trước",
    kpiPercent: "98.2%",
    kpiSub: "Đạt chỉ tiêu kế hoạch tháng",
    chartPeak: 85,
    tasks: [
      {
        id: "fin-1",
        title: "Phê duyệt đối soát công nợ đối tác tháng 8",
        dept: "Kế Toán - Tài Chính",
        deadline: "28/08",
        icon: IconCalculator,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/finance",
        tag: "CẦN DUYỆT",
        tagBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        id: "fin-2",
        title: "Chốt báo cáo tài chính quý 3",
        dept: "Kế Toán - Tài Chính",
        deadline: "30/08",
        icon: IconFileText,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/finance/bao-cao",
        tag: "ĐANG XỬ LÝ",
        tagBg: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        id: "fin-3",
        title: "Kiểm tra ngân sách phòng ban 1-5-2",
        dept: "Kế Toán - Tài Chính",
        deadline: "31/08",
        icon: IconLayoutGrid,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/finance",
        tag: "HOÀN THÀNH",
        tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    ],
  },
  rd: {
    id: "rd",
    name: "R&D (Phát Triển Sản Phẩm)",
    headcount: "25",
    headcountSub: "12 dự án mẫu mới",
    tasksCount: "36",
    pendingReviewCount: "6 task chờ bạn duyệt",
    progressPercent: "88.5%",
    progressSub: "+6.0% so với tháng trước",
    kpiPercent: "95.0%",
    kpiSub: "Đạt chỉ tiêu kế hoạch tháng",
    chartPeak: 92,
    tasks: [
      {
        id: "rd-1",
        title: "Nghiệm thu mẫu giày Skechers Autumn 2026",
        dept: "R&D",
        deadline: "29/08",
        icon: IconFlask,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/tasks",
        tag: "CẦN DUYỆT",
        tagBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        id: "rd-2",
        title: "Thử nghiệm độ bền đế cao su 4.0",
        dept: "R&D",
        deadline: "30/08",
        icon: IconFlask,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/tasks",
        tag: "ĐANG THỬ NGHIỆM",
        tagBg: "bg-amber-50 text-amber-700 border-amber-200",
      },
      {
        id: "rd-3",
        title: "Lập thông số kỹ thuật mẫu mã mới Q4",
        dept: "R&D",
        deadline: "02/09",
        icon: IconFileText,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/tasks",
        tag: "ĐANG XỬ LÝ",
        tagBg: "bg-blue-50 text-blue-700 border-blue-200",
      },
    ],
  },
  qc: {
    id: "qc",
    name: "Quản Lý Chất Lượng (QC)",
    headcount: "30",
    headcountSub: "Kiểm soát QC & OEE 100%",
    tasksCount: "42",
    pendingReviewCount: "5 task chờ bạn duyệt",
    progressPercent: "93.1%",
    progressSub: "+2.8% so với tháng trước",
    kpiPercent: "97.4%",
    kpiSub: "Đạt chỉ tiêu kế hoạch tháng",
    chartPeak: 104,
    tasks: [
      {
        id: "qc-1",
        title: "Báo cáo kiểm tra chất lượng lô hàng xuất khẩu",
        dept: "QC",
        deadline: "29/08",
        icon: IconShieldCheck,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/tasks",
        tag: "CẦN DUYỆT",
        tagBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        id: "qc-2",
        title: "Đánh giá tỷ lệ lỗi khâu may chuyền 12",
        dept: "QC",
        deadline: "30/08",
        icon: IconActivity,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/tasks",
        tag: "ĐANG XỬ LÝ",
        tagBg: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        id: "qc-3",
        title: "Cập nhật tiêu chuẩn AQL 2.5 cho xưởng may",
        dept: "QC",
        deadline: "31/08",
        icon: IconShieldCheck,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/tasks",
        tag: "HOÀN THÀNH",
        tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    ],
  },
  logistics: {
    id: "logistics",
    name: "Kho & Logistics",
    headcount: "45",
    headcountSub: "33 dây chuyền cung ứng",
    tasksCount: "51",
    pendingReviewCount: "8 task chờ bạn duyệt",
    progressPercent: "90.0%",
    progressSub: "+4.1% so với tháng trước",
    kpiPercent: "94.8%",
    kpiSub: "Đạt chỉ tiêu kế hoạch tháng",
    chartPeak: 110,
    tasks: [
      {
        id: "lg-1",
        title: "Kế hoạch nhập nguyên vật liệu da thuộc Q4",
        dept: "Logistics",
        deadline: "29/08",
        icon: IconTruck,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/inventory",
        tag: "CẦN DUYỆT",
        tagBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        id: "lg-2",
        title: "Điều phối 15 xe container hàng xuất cảng",
        dept: "Logistics",
        deadline: "30/08",
        icon: IconTruck,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/inventory",
        tag: "ĐANG ĐIỀU PHỐI",
        tagBg: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        id: "lg-3",
        title: "Kiểm kê vật tư tồn kho định kỳ",
        dept: "Logistics",
        deadline: "31/08",
        icon: IconPackage,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/inventory",
        tag: "HOÀN THÀNH",
        tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    ],
  },
  production: {
    id: "production",
    name: "Tổ Hợp Nhà Máy - Sản Xuất",
    headcount: "420",
    headcountSub: "Đang vận hành 100% công suất",
    tasksCount: "68",
    pendingReviewCount: "12 task chờ bạn duyệt",
    progressPercent: "92.6%",
    progressSub: "+5.2% so với tháng trước",
    kpiPercent: "96.8%",
    kpiSub: "Đạt chỉ tiêu kế hoạch tháng",
    chartPeak: 145,
    tasks: [
      {
        id: "prd-1",
        title: "Bảo trì định kỳ máy chặt thủy lực khu A",
        dept: "Sản Xuất",
        deadline: "29/08",
        icon: IconBolt,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/maintenance",
        tag: "ĐANG BẢO TRÌ",
        tagBg: "bg-amber-50 text-amber-700 border-amber-200",
      },
      {
        id: "prd-2",
        title: "Phê duyệt kế hoạch tăng ca chuyền gò 3",
        dept: "Sản Xuất",
        deadline: "30/08",
        icon: IconFileText,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/tasks",
        tag: "CẦN DUYỆT",
        tagBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        id: "prd-3",
        title: "Tổng kết năng suất sản xuất ngày 28/8",
        dept: "Sản Xuất",
        deadline: "31/08",
        icon: IconActivity,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/tasks",
        tag: "HOÀN THÀNH",
        tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    ],
  },
  ci: {
    id: "ci",
    name: "CN-CI (Cải Tiến Liên Tục)",
    headcount: "15",
    headcountSub: "8 dự án chuyển đổi số",
    tasksCount: "22",
    pendingReviewCount: "3 task chờ bạn duyệt",
    progressPercent: "95.5%",
    progressSub: "+7.4% so với tháng trước",
    kpiPercent: "99.0%",
    kpiSub: "Xuất sắc chỉ tiêu tháng",
    chartPeak: 80,
    tasks: [
      {
        id: "ci-1",
        title: "Duyệt đề xuất sáng kiến Kaizen 4.0 tháng 8",
        dept: "CN-CI",
        deadline: "29/08",
        icon: IconSparkles,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/ci",
        tag: "CẦN DUYỆT",
        tagBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        id: "ci-2",
        title: "Triển khai phần mềm quản lý Kanban công việc",
        dept: "CN-CI",
        deadline: "30/08",
        icon: IconLayoutGrid,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work?dept=my-tasks",
        tag: "ĐANG TRIỂN KHAI",
        tagBg: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        id: "ci-3",
        title: "Báo cáo Gemba Walk xưởng dán đính 2",
        dept: "CN-CI",
        deadline: "31/08",
        icon: IconShieldCheck,
        iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
        href: "/work/gemba",
        tag: "HOÀN THÀNH",
        tagBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    ],
  },
};

export default function OverviewDashboard({
  onSelectDept,
  userName: userNameProp,
  userCode,
  currentUser: currentUserProp,
  canViewFinance = true,
}: OverviewDashboardProps) {
  const [chartTab, setChartTab] = useState<"thisMonth" | "lastMonth">("thisMonth");
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentUser = isMounted
    ? currentUserProp || (typeof window !== "undefined" ? getCurrentUser() : null)
    : currentUserProp;
  const rawCode = currentUser?.empCode || userCode || "202608001";
  const normalizedCode = rawCode ? normalizeEmpCode(rawCode) : "202608001";
  const sysUser = getSystemUser(normalizedCode);

  const deptCode = (
    sysUser?.department ||
    currentUser?.departmentCode ||
    currentUser?.department ||
    ""
  ).toUpperCase();
  const rawDeptName = sysUser?.department || currentUser?.department || "Nhân Sự - Hành Chính";

  // Determine initial selected department key based on user department
  const defaultDeptKey = useMemo(() => {
    if (deptCode.includes("KE_TOAN") || deptCode.includes("FINANCE") || rawDeptName.includes("KẾ TOÁN")) return "finance";
    if (deptCode.includes("RD") || rawDeptName.includes("R&D")) return "rd";
    if (deptCode.includes("QC") || rawDeptName.includes("CHẤT LƯỢNG")) return "qc";
    if (deptCode.includes("LOGISTICS") || rawDeptName.includes("LOGISTICS") || rawDeptName.includes("KHO")) return "logistics";
    if (deptCode.includes("SAN_XUAT") || rawDeptName.includes("SẢN XUẤT") || rawDeptName.includes("NHÀ MÁY")) return "production";
    if (deptCode.includes("CI") || rawDeptName.includes("CẢI TIẾN")) return "ci";
    return "hr";
  }, [deptCode, rawDeptName]);

  const [activeDeptKey, setActiveDeptKey] = useState<string>(defaultDeptKey);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");

  useEffect(() => {
    setActiveDeptKey(defaultDeptKey);
  }, [defaultDeptKey]);

  const currentDeptKpi = DEPT_KPI_CONFIGS[activeDeptKey] || DEPT_KPI_CONFIGS.hr;

  // Chart points generator according to department peak
  const chartPointsThisMonth: ChartPoint[] = useMemo(() => {
    const peak = currentDeptKpi.chartPeak;
    return [
      { day: "01", val: Math.round(peak * 0.38), x: 25, y: 120 },
      { day: "05", val: Math.round(peak * 0.55), x: 85, y: 95 },
      { day: "08", val: Math.round(peak * 0.60), x: 135, y: 88 },
      { day: "10", val: Math.round(peak * 0.45), x: 180, y: 105 },
      { day: "12", val: Math.round(peak * 0.70), x: 230, y: 78 },
      { day: "13", val: peak, x: 260, y: 35, highlight: true }, // Peak Point
      { day: "15", val: Math.round(peak * 0.65), x: 300, y: 80 },
      { day: "18", val: Math.round(peak * 0.75), x: 350, y: 70 },
      { day: "20", val: Math.round(peak * 0.52), x: 400, y: 95 },
      { day: "23", val: Math.round(peak * 0.78), x: 450, y: 68 },
      { day: "26", val: Math.round(peak * 0.88), x: 505, y: 55 },
      { day: "28", val: Math.round(peak * 0.62), x: 555, y: 82 },
      { day: "30", val: Math.round(peak * 0.85), x: 610, y: 55 },
    ];
  }, [currentDeptKpi.chartPeak]);

  const chartPointsLastMonth: ChartPoint[] = useMemo(() => {
    const peak = currentDeptKpi.chartPeak;
    return [
      { day: "01", val: Math.round(peak * 0.3), x: 25, y: 128 },
      { day: "05", val: Math.round(peak * 0.48), x: 85, y: 105 },
      { day: "08", val: Math.round(peak * 0.58), x: 135, y: 98 },
      { day: "10", val: Math.round(peak * 0.62), x: 180, y: 85 },
      { day: "12", val: Math.round(peak * 0.55), x: 230, y: 90 },
      { day: "13", val: Math.round(peak * 0.72), x: 260, y: 70 },
      { day: "15", val: Math.round(peak * 0.82), x: 300, y: 60 },
      { day: "18", val: Math.round(peak * 0.65), x: 350, y: 80 },
      { day: "20", val: Math.round(peak * 0.70), x: 400, y: 75 },
      { day: "23", val: Math.round(peak * 0.60), x: 450, y: 85 },
      { day: "26", val: Math.round(peak * 0.78), x: 505, y: 65 },
      { day: "28", val: Math.round(peak * 0.68), x: 555, y: 78 },
      { day: "30", val: Math.round(peak * 0.78), x: 610, y: 65 },
    ];
  }, [currentDeptKpi.chartPeak]);

  const currentPoints = chartTab === "thisMonth" ? chartPointsThisMonth : chartPointsLastMonth;

  // Generate SVG Path
  const pathD = currentPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  return (
    <div className="space-y-4 w-full min-w-0 animate-in fade-in duration-300">
      {/* ════════════════════════════════════════════════════════════════
          DEPARTMENT SELECTION STRIP (Allows switching KPI per department)
         ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-black text-slate-800">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-200">
            <IconFilter size={16} />
          </div>
          <span>Bảng chỉ số KPI &amp; Hiệu suất theo Phòng Ban:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer outline-none"
          >
            <option value="all">🗓️ Tất cả các quý</option>
            <option value="q1">Quý 1 / 2026</option>
            <option value="q2">Quý 2 / 2026</option>
            <option value="q3">Quý 3 / 2026</option>
            <option value="q4">Quý 4 / 2026</option>
          </select>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {Object.values(DEPT_KPI_CONFIGS).map((dept) => {
              const isActive = dept.id === activeDeptKey;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setActiveDeptKey(dept.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#006838] text-white shadow-2xs"
                      : "bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-[#006838] border border-slate-200/80"
                  }`}
                >
                  <span>{dept.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          1. ROW 1: 4 THẺ KPI CHỈ SỐ HOẠT ĐỘNG PHÒNG BAN TƯƠNG ỨNG
         ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Nhân sự phòng ban */}
        <div
          onClick={() => onSelectDept?.(currentDeptKpi.id)}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#006838] hover:shadow-md transition-all duration-300 flex items-center gap-4 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] border border-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <IconUsers size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="truncate">Nhân sự phòng {currentDeptKpi.name}</span>
              <IconChevronRight size={14} className="text-slate-400 group-hover:text-[#006838] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900 font-sans">{currentDeptKpi.headcount}</span>
              <span className="text-[11px] font-bold text-slate-500">người</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#006838] mt-0.5">
              <span>{currentDeptKpi.headcountSub}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Công việc phòng ban */}
        <div
          onClick={() => onSelectDept?.(currentDeptKpi.id)}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#006838] hover:shadow-md transition-all duration-300 flex items-center gap-4 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] border border-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <IconFileText size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="truncate">Công việc phòng ban</span>
              <IconChevronRight size={14} className="text-slate-400 group-hover:text-[#006838] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900 font-sans">{currentDeptKpi.tasksCount}</span>
              <span className="text-[11px] font-bold text-slate-500">task</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 mt-0.5">
              <span>{currentDeptKpi.pendingReviewCount}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Tiến độ phòng ban */}
        <div
          onClick={() => onSelectDept?.(currentDeptKpi.id)}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#006838] hover:shadow-md transition-all duration-300 flex items-center gap-4 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] border border-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <IconActivity size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="truncate">Tiến độ phòng ban</span>
              <IconChevronRight size={14} className="text-slate-400 group-hover:text-[#006838] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900 font-sans">{currentDeptKpi.progressPercent}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#006838] mt-0.5">
              <span>{currentDeptKpi.progressSub}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Chỉ số KPI & Chất lượng */}
        <div
          onClick={() => onSelectDept?.(currentDeptKpi.id)}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#006838] hover:shadow-md transition-all duration-300 flex items-center gap-4 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] border border-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <IconShieldCheck size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="truncate">Chỉ số KPI &amp; Chất lượng</span>
              <IconChevronRight size={14} className="text-slate-400 group-hover:text-[#006838] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900 font-sans">{currentDeptKpi.kpiPercent}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#006838] mt-0.5">
              <span>{currentDeptKpi.kpiSub}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          2. ROW 2: BIỂU ĐỒ HOẠT ĐỘNG + CÔNG VIỆC CẦN XỬ LÝ + THÔNG BÁO
         ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Col 5/12: Biểu đồ biến động hoạt động theo tháng */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          {/* Header & Month Toggle */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006838] flex items-center justify-center">
                <IconActivity size={16} />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                Hoạt động &amp; Tiến độ phòng {currentDeptKpi.name} theo tháng
              </h3>
            </div>

            {/* Toggle Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
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
                  <stop offset="0%" stopColor="#006838" stopOpacity="0.22" />
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
                <g key={idx} className="cursor-pointer group">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.highlight ? "6" : "4"}
                    fill="#ffffff"
                    stroke="#006838"
                    strokeWidth={pt.highlight ? "3" : "2"}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="transition-all duration-150 group-hover:r-7 group-hover:fill-[#006838]"
                  />
                  {/* X Axis Labels */}
                  {["01", "05", "10", "15", "20", "25", "30"].includes(pt.day) && (
                    <text x={pt.x} y="156" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="700" className="font-mono select-none">
                      {pt.day}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {/* Dynamic Hover Tooltip */}
            {hoveredPoint ? (
              <div
                style={{
                  left: `${(hoveredPoint.x / 640) * 100}%`,
                  top: `${(hoveredPoint.y / 160) * 100}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-full mb-3 bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-2xl border border-slate-700 pointer-events-none text-center z-30 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ngày {hoveredPoint.day}</div>
                <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">{hoveredPoint.val} Hoạt động</div>
              </div>
            ) : chartTab === "thisMonth" ? (
              /* Default Peak Point Tooltip */
              <div className="absolute left-[38%] top-[14%] -translate-x-1/2 -translate-y-full bg-white border-2 border-[#006838] px-2.5 py-1 rounded-xl shadow-md text-center pointer-events-none animate-bounce">
                <div className="text-xs font-black text-slate-900 leading-none">{currentDeptKpi.chartPeak}</div>
                <div className="text-[9px] font-extrabold text-[#006838] leading-none mt-0.5">Hoạt động</div>
                <div className="w-2 h-2 bg-white border-r-2 border-b-2 border-[#006838] rotate-45 mx-auto -mb-2 mt-0.5" />
              </div>
            ) : null}
          </div>
        </div>

        {/* Col 4/12: Công Việc Cần Xử Lý */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006838] flex items-center justify-center">
                <IconCircleCheck size={16} />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                Công việc cần xử lý
              </h3>
            </div>
            <span className="h-5 px-2 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
              {currentDeptKpi.tasks.length} việc
            </span>
          </div>

          <div className="space-y-2.5">
            {currentDeptKpi.tasks.map((task, idx) => {
              const TIcon = task.icon;
              return (
                <Link
                  key={idx}
                  href={task.href}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-[#006838] hover:shadow-2xs transition-all duration-200 flex items-center justify-between gap-3 group block"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${task.iconBg}`}>
                      <TIcon size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-800 truncate group-hover:text-[#006838] transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{task.dept}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black whitespace-nowrap">
                      Hạn: {task.deadline}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${task.tagBg}`}>
                      {task.tag}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Col 3/12: Thông Báo */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006838] flex items-center justify-center">
                <IconBell size={16} />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                Thông báo
              </h3>
            </div>
            <Link href="/news" className="text-[11px] font-extrabold text-[#006838] hover:underline flex items-center gap-1">
              <span>Xem tất cả</span>
              <IconArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: "Khai trương mô hình số hóa Văn phòng Chuỗi SKECHERS",
                date: "26/08/2025",
                icon: IconSpeakerphone,
                iconBg: "bg-emerald-50 text-[#006838] border-emerald-100",
              },
              {
                title: "Cập nhật quy trình nhập liệu tài chính kế toán",
                date: "24/08/2025",
                icon: IconInfoCircle,
                iconBg: "bg-blue-50 text-blue-700 border-blue-100",
              },
              {
                title: "Lịch đào tạo nội bộ tháng 9",
                date: "22/08/2025",
                icon: IconCalendar,
                iconBg: "bg-purple-50 text-purple-700 border-purple-100",
              },
            ].map((news, idx) => {
              const NIcon = news.icon;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-[#006838] hover:shadow-2xs transition-all duration-200 flex items-start gap-2.5 group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${news.iconBg}`}>
                    <NIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#006838] transition-colors">
                      {news.title}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400 mt-1 block">{news.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          3. FOOTER THƯƠNG HIỆU & SỨ MỆNH
         ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] font-bold text-[#006838]">
        <div className="flex items-center gap-2">
          <IconSparkles size={16} />
          <span>Sống tinh gọn – Làm việc hiệu quả – Cùng phát triển bền vững</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span>© 2026 TBS Group – Văn phòng Chuỗi SKECHERS – R&amp;D Center</span>
        </div>
      </div>
    </div>
  );
}
