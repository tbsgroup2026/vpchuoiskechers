"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import DepartmentDashboardView from "@/modules/dashboard/DepartmentDashboardView";
import { EnterpriseOverviewSection, KpiCard, DonutChartCard, BarChartCard } from "@/components/dashboard";
import { TaskItem, NotificationItem } from "./HomeNew";
import {
  IconUser,
  IconBuilding,
  IconCalendar,
  IconCalendarEvent,
  IconCalendarStats,
  IconFileText,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconChevronRight,
  IconFilter,
  IconInbox,
  IconBriefcase,
  IconShieldCheck,
  IconClipboardList,
  IconBell,
  IconPlus,
  IconPlane,
  IconReport,
  IconHelp,
  IconDownload,
  IconFileTypePdf,
  IconFileTypeXls,
  IconChartPie,
  IconChartBar,
  IconFolder,
  IconSparkles,
  IconArrowUpRight,
} from "@tabler/icons-react";

export interface HomeClassicProps {
  activeName: string;
  activeCode: string;
  activeTitle: string;
  activeDept: string;
  activeUser: any;
  dashboardMode: "personal" | "department";
  setDashboardMode: (mode: "personal" | "department") => void;
  hasDeptPermission: boolean;
  tasks: TaskItem[];
  isLoadingTasks: boolean;
  notifications: NotificationItem[];
  isLoadingNotifications: boolean;
}

type TimeFilter = "day" | "week" | "month";

// Helper function to format Vietnamese date
function getFormattedVietnameseDate(d: Date): string {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayName = days[d.getDay()];
  const dateNum = String(d.getDate()).padStart(2, "0");
  const monthNum = String(d.getMonth() + 1).padStart(2, "0");
  const yearNum = d.getFullYear();
  return `${dayName}, ${dateNum}/${monthNum}/${yearNum}`;
}

export default function HomeClassic({
  activeName,
  activeCode,
  activeTitle,
  activeDept,
  activeUser,
  dashboardMode,
  setDashboardMode,
  hasDeptPermission,
  tasks,
  isLoadingTasks,
  notifications,
  isLoadingNotifications,
}: HomeClassicProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("day");
  const [weekChartPeriod, setWeekChartPeriod] = useState<"this_week" | "last_week">("this_week");

  // Real-time Running Clock (Live Time HH:mm)
  const [liveTime, setLiveTime] = useState<string>("");
  const [currentDateStr, setCurrentDateStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setLiveTime(`${hours}:${mins}`);
      setCurrentDateStr(getFormattedVietnameseDate(now));
    };

    updateTime();
    const timer = setInterval(updateTime, 10000); // update every 10s
    return () => clearInterval(timer);
  }, []);

  // Date filtering logic: Ngày / Tuần / Tháng
  const filteredTasks = useMemo(() => {
    const now = new Date();

    // Monday of current week
    const currentDay = now.getDay();
    const diffToMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diffToMonday, 0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return tasks.filter((t) => {
      const datesToTest: Date[] = [];

      if (t.due_date) {
        const d = new Date(t.due_date);
        if (!isNaN(d.getTime())) datesToTest.push(d);
      }
      if (t.start_date) {
        const d = new Date(t.start_date);
        if (!isNaN(d.getTime())) datesToTest.push(d);
      }
      if (t.created_at) {
        const d = new Date(t.created_at);
        if (!isNaN(d.getTime())) datesToTest.push(d);
      }

      if (datesToTest.length === 0) return true;

      if (timeFilter === "day") {
        return datesToTest.some(
          (d) =>
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
        );
      } else if (timeFilter === "week") {
        return datesToTest.some((d) => d >= monday && d <= sunday);
      } else {
        return datesToTest.some(
          (d) => d.getFullYear() === currentYear && d.getMonth() === currentMonth
        );
      }
    });
  }, [tasks, timeFilter]);

  // Compute dynamic KPIs for filtered tasks
  const periodKpis = useMemo(() => {
    const total = filteredTasks.length;
    const inProgress = filteredTasks.filter(
      (t) => t.status === "DOING" || t.status === "IN_PROGRESS" || t.status === "TO_DO"
    ).length;
    const done = filteredTasks.filter(
      (t) => t.status === "DONE" || t.status === "COMPLETED"
    ).length;
    const needsAttention = filteredTasks.filter(
      (t) =>
        t.status === "URGENT" ||
        t.status === "NEED_HELP" ||
        t.priority === "URGENT" ||
        t.priority === "HIGH" ||
        t.priority === "VERY_HIGH" ||
        t.priority === "Rất cao" ||
        t.priority === "Cao"
    ).length;
    const unstarted = Math.max(0, total - (inProgress + done));

    return { total, inProgress, done, needsAttention, unstarted };
  }, [filteredTasks]);

  const getTimeFilterLabel = (tf: TimeFilter) => {
    if (tf === "day") return "Hôm nay (Ngày)";
    if (tf === "week") return "Tuần này";
    return "Tháng này";
  };

  const getTimeFilterTag = (tf: TimeFilter) => {
    if (tf === "day") return "(HÔM NAY)";
    if (tf === "week") return "(TUẦN NÀY)";
    return "(THÁNG NÀY)";
  };

  // Mock list of active projects for Project Progress Card
  const mockProjects = [
    { id: "PRJ-AUTOMATION", name: "Dự Án Tự Động Hóa Dây Chuyền & CĐS IT", progress: 83, colorBg: "bg-purple-500" },
    { id: "PRJ-SKECHERS-RETAIL", name: "Dự Án Vận Hành Chuỗi Skechers HQ & Store", progress: 75, colorBg: "bg-emerald-500" },
    { id: "PRJ-ADMIN-EXPENSE", name: "Dự Án Số Hóa Hành Chính & Đăng Ký Xe", progress: 60, colorBg: "bg-amber-500" },
    { id: "PRJ-KAIZEN-152", name: "Dự Án Sáng Kiến Cải Tiến Kaizen & 1-5-2", progress: 80, colorBg: "bg-blue-500" },
    { id: "PRJ-GEMBA-SAFETY", name: "Dự Án An Toàn Lao Động & Kiểm Soát Gemba", progress: 50, colorBg: "bg-rose-500" },
  ];

  // Common Template Documents
  const templateDocs = [
    {
      id: "doc-1",
      name: "Quy_trinh_danh_gia_KPI_hang_thang.pdf",
      size: "PDF • 2.4 MB",
      type: "pdf",
      url: "/documents/templates",
    },
    {
      id: "doc-2",
      name: "Bieu_mau_dang_ky_nghi_phep_tac_nghiep.xlsx",
      size: "XLSX • 1.1 MB",
      type: "xlsx",
      url: "/documents/templates",
    },
    {
      id: "doc-3",
      name: "Huong_dan_su_dung_he_thong_work_hub.pdf",
      size: "PDF • 3.8 MB",
      type: "pdf",
      url: "/documents/templates",
    },
  ];

  return (
    <div className="w-full space-y-4 min-w-0 font-sans text-slate-800 antialiased max-w-[1600px] mx-auto pt-0 mt-0">
      {/* ════════════════════════════════════════════════════════════════
          1. KHỐI CHÀO MỪNG (WELCOME HEADER)
         ════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/80 text-[#006838] font-bold">
              TRANG CHỦ TRUYỀN THỐNG
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-mono font-bold">MSNV: {activeCode}</span>
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            Chào mừng trở lại, <span className="text-[#006838] uppercase whitespace-normal sm:whitespace-nowrap">{activeName}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {activeTitle || "NV – LẬP TRÌNH – NHÂN SỰ"} | {activeDept || "Văn phòng Chuỗi SKECHERS – TBS Group"}
          </p>
        </div>

        {/* Right Info: Live System Clock & Dashboard Mode Toggle */}
        <div className="flex flex-col sm:items-end justify-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-700">
              <IconCalendar size={15} className="text-[#006838]" />
              <span>{currentDateStr || "Thứ Hai, 14/09/2026"}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-[#006838]">
              <IconClock size={15} />
              <span className="font-mono text-xs font-bold">{liveTime || "09:40"}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setDashboardMode("personal")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                dashboardMode === "personal"
                  ? "bg-[#006838] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <IconUser size={14} />
              <span>Dashboard cá nhân</span>
            </button>

            {hasDeptPermission && (
              <button
                onClick={() => setDashboardMode("department")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  dashboardMode === "department"
                    ? "bg-[#006838] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <IconBuilding size={14} />
                <span>Dashboard phòng ban</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RENDER DEPARTMENT DASHBOARD IF SELECTED */}
      {dashboardMode === "department" ? (
        <DepartmentDashboardView
          departmentName={activeDept}
          departmentCode={activeCode}
          userRoleCode={activeUser?.roleCode || activeUser?.role_code}
          userEmpCode={activeCode}
        />
      ) : (
        <>
          {/* ════════════════════════════════════════════════════════════════
              1.2 TỔNG QUAN TBS GROUP (ENTERPRISE STATS & DONUT CHART)
             ════════════════════════════════════════════════════════════════ */}
          <EnterpriseOverviewSection />

          {/* ════════════════════════════════════════════════════════════════
              2. THANH LỌC THỜI GIAN CÔNG VIỆC (PREVENT LINE BREAKS)
             ════════════════════════════════════════════════════════════════ */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider whitespace-nowrap">
              <IconFilter size={16} className="text-[#006838]" />
              <span>THỜI GIAN CÔNG VIỆC:</span>
            </div>

            {/* Time Filter Tabs with whitespace-nowrap */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                onClick={() => setTimeFilter("day")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  timeFilter === "day"
                    ? "bg-[#006838] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <IconCalendar size={14} />
                <span>Ngày (Hôm nay)</span>
              </button>

              <button
                onClick={() => setTimeFilter("week")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  timeFilter === "week"
                    ? "bg-[#006838] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <IconCalendarEvent size={14} />
                <span>Tuần (T2 – CN)</span>
              </button>

              <button
                onClick={() => setTimeFilter("month")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  timeFilter === "month"
                    ? "bg-[#006838] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <IconCalendarStats size={14} />
                <span>Tháng</span>
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              3. BỐN THẺ KPI CÔNG VIỆC CÁ NHÂN THEO THỜI GIAN
             ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KpiCard
              icon={IconFileText}
              title={`Tổng công việc ${getTimeFilterTag(timeFilter)}`}
              value={periodKpis.total}
              subtitle="Toàn bộ công việc"
              loading={isLoadingTasks}
            />
            <KpiCard
              icon={IconClock}
              title="Đang thực hiện"
              value={periodKpis.inProgress}
              subtitle="Đang triển khai"
              loading={isLoadingTasks}
            />
            <KpiCard
              icon={IconCheck}
              title="Hoàn thành"
              value={periodKpis.done}
              subtitle="Đã nghiệm thu"
              loading={isLoadingTasks}
            />
            <KpiCard
              icon={IconAlertTriangle}
              title="Cần xử lý gấp"
              value={periodKpis.needsAttention}
              subtitle="Quá hạn / Sát hạn"
              invertTrend={true}
              loading={isLoadingTasks}
            />
          </div>

          {/* ════════════════════════════════════════════════════════════════
              4. HÀNG 3 BIỂU ĐỒ (DONUT TÌNH TRẠNG, BAR HÀNG TUẦN, DONUT PHÂN LOẠI)
             ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chart 1: Donut Chart - Tình trạng công việc */}
            <DonutChartCard
              title="TÌNH TRẠNG CÔNG VIỆC"
              icon={IconChartPie}
              centerLabel="CÔNG VIỆC"
              centerTotal={periodKpis.total}
              centerSubtitle="Tổng số"
              breakdown={[
                { key: "done", label: "Hoàn thành", value: periodKpis.done, percent: periodKpis.total > 0 ? Math.round((periodKpis.done / periodKpis.total) * 100) : 0, color: "#006838" },
                { key: "doing", label: "Đang thực hiện", value: periodKpis.inProgress, percent: periodKpis.total > 0 ? Math.round((periodKpis.inProgress / periodKpis.total) * 100) : 0, color: "#f59e0b" },
                { key: "overdue", label: "Quá hạn", value: periodKpis.needsAttention, percent: periodKpis.total > 0 ? Math.round((periodKpis.needsAttention / periodKpis.total) * 100) : 0, color: "#ef4444" },
                { key: "unstarted", label: "Chưa bắt đầu", value: periodKpis.unstarted, percent: periodKpis.total > 0 ? Math.round((periodKpis.unstarted / periodKpis.total) * 100) : 0, color: "#94a3b8" },
              ]}
            />

            {/* Chart 2: Weekly Bar Chart - Công việc theo tuần */}
            <BarChartCard
              title="TIẾN ĐỘ THEO TUẦN"
              icon={IconChartBar}
              data={[
                { label: "T2", value: 4, secondaryValue: 5 },
                { label: "T3", value: 6, secondaryValue: 7 },
                { label: "T4", value: 3, secondaryValue: 4 },
                { label: "T5", value: 8, secondaryValue: 9 },
                { label: "T6", value: 5, secondaryValue: 6 },
                { label: "T7", value: 2, secondaryValue: 3 },
                { label: "CN", value: 1, secondaryValue: 1 },
              ]}
              valueLabel="Hoàn thành"
              secondaryLabel="Kế hoạch"
              subtitle={weekChartPeriod === "this_week" ? "Tuần này" : "Tuần trước"}
            />

            {/* Chart 3: Donut Chart - Công việc theo phân loại */}
            <DonutChartCard
              title="PHÂN LOẠI CÔNG VIỆC"
              icon={IconChartPie}
              centerLabel="PHÂN HỆ"
              centerTotal={periodKpis.total}
              centerSubtitle="Công việc"
              breakdown={[
                { key: "project", label: "Dự án", value: Math.round(periodKpis.total * 0.4), percent: 40, color: "#006838" },
                { key: "admin", label: "Hành chính", value: Math.round(periodKpis.total * 0.3), percent: 30, color: "#22c55e" },
                { key: "hr", label: "Nhân sự", value: Math.round(periodKpis.total * 0.2), percent: 20, color: "#f59e0b" },
                { key: "other", label: "Khác", value: Math.max(0, periodKpis.total - Math.round(periodKpis.total * 0.9)), percent: 10, color: "#94a3b8" },
              ]}
            />
          </div>

          {/* ════════════════════════════════════════════════════════════════
              5. HÀNG 4 (3 CỘT: DANH SÁCH TASK : DỰ ÁN : THÔNG BÁO MỚI)
             ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-start">
            {/* Column 1: Task List (lg:col-span-3) */}
            <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 min-h-[320px]">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <IconClipboardList size={16} className="text-[#006838]" />
                    <span>Danh sách công việc cá nhân — {getTimeFilterLabel(timeFilter)}</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {filteredTasks.length} công việc
                  </span>
                </div>

                <Link
                  href="/work?dept=my-tasks"
                  className="text-xs font-semibold text-[#006838] hover:underline flex items-center gap-1"
                >
                  <span>Mở trang Quản lý Task</span>
                  <IconChevronRight size={14} />
                </Link>
              </div>

              {isLoadingTasks ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium space-y-2">
                  <div className="w-6 h-6 mx-auto border-2 border-[#006838] border-t-transparent rounded-full animate-spin" />
                  <div>Đang tải dữ liệu công việc...</div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-medium space-y-2">
                  <IconInbox size={36} className="mx-auto text-slate-300" />
                  <div className="font-bold text-slate-700">Không có công việc nào trong {getTimeFilterLabel(timeFilter)}.</div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Bạn có thể tạo thêm công việc mới hoặc thử chuyển bộ lọc sang Tuần / Tháng.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px] bg-slate-50">
                        <th className="py-2 px-2.5 w-6">#</th>
                        <th className="py-2 px-2.5">Tên công việc</th>
                        <th className="py-2 px-2.5">Hạn chót</th>
                        <th className="py-2 px-2.5">Trạng thái</th>
                        <th className="py-2 px-2.5 text-center">Xử lý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal">
                      {filteredTasks.slice(0, 5).map((t, idx) => {
                        const rawStatus = (t.status || "").toUpperCase();
                        const isDone = rawStatus === "DONE" || rawStatus === "COMPLETED";
                        const isDoing = rawStatus === "DOING" || rawStatus === "IN_PROGRESS";

                        let statusLabel = "Cần làm";
                        let statusStyle = "bg-rose-50 text-rose-700 border border-rose-200";
                        if (isDone) {
                          statusLabel = "Hoàn thành";
                          statusStyle = "bg-emerald-50 text-emerald-800 border border-emerald-200";
                        } else if (isDoing) {
                          statusLabel = "Đang làm";
                          statusStyle = "bg-amber-50 text-amber-800 border border-amber-200";
                        }

                        return (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-2.5 font-semibold text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-2.5 max-w-[160px]">
                              <div className="font-extrabold text-slate-900 leading-tight truncate">{t.title}</div>
                              {t.description && (
                                <div className="text-[10px] text-slate-400 truncate">{t.description}</div>
                              )}
                            </td>
                            <td className="py-2 px-2.5 font-mono text-[10px] font-bold text-rose-600 whitespace-nowrap">
                              {t.due_date || "—"}
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusStyle}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-center whitespace-nowrap">
                              <Link
                                href="/work?dept=my-tasks"
                                className="px-2.5 py-1 rounded bg-[#006838] hover:bg-[#004d29] text-white text-[11px] font-bold transition inline-block"
                              >
                                Xử lý
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Column 2: Projects List (lg:col-span-2) */}
            <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 min-h-[320px] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <IconFolder size={16} className="text-[#006838]" />
                  <span>Dự án đang tham gia</span>
                </h3>
                <Link href="/work/projects" className="text-xs font-semibold text-[#006838] hover:underline flex items-center gap-1">
                  <span>Xem tất cả</span>
                  <IconChevronRight size={14} />
                </Link>
              </div>

              <div className="space-y-3 flex-1">
                {mockProjects.map((prj) => (
                  <Link
                    key={prj.id}
                    href={`/work?dept=my-tasks&project=${prj.id}`}
                    className="block space-y-1 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition"
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                      <span className="truncate max-w-[180px]">{prj.name}</span>
                      <span className="text-[#006838] font-mono">{prj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${prj.colorBg} rounded-full transition-all duration-500`}
                        style={{ width: `${prj.progress}%` }}
                      ></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 3: Notifications List (lg:col-span-2) */}
            <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 min-h-[320px] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <IconBell size={16} className="text-amber-500" />
                  <span>Thông báo mới</span>
                </h3>
                <Link href="/notifications" className="text-xs font-semibold text-[#006838] hover:underline flex items-center gap-1">
                  <span>Xem tất cả</span>
                  <IconChevronRight size={14} />
                </Link>
              </div>

              <div className="space-y-2.5 flex-1">
                {isLoadingNotifications ? (
                  <div className="p-6 text-center text-xs text-slate-400">Đang tải thông báo...</div>
                ) : notifications && notifications.length > 0 ? (
                  notifications.slice(0, 4).map((n) => (
                    <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1"></span>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-slate-900 truncate">{n.title}</div>
                        <div className="text-[10px] text-slate-500 truncate">{n.message}</div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">{(n as any).time || (n as any).created_at || "Vừa xong"}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                    <IconFileText size={28} className="mx-auto text-slate-300" />
                    <div>Chưa có thông báo mới</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              6. HÀNG 5 (LIÊN KẾT NHANH TOÀN CHIỀU RỘNG)
             ════════════════════════════════════════════════════════════════ */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <IconPlus size={16} className="text-[#006838]" />
                <span>Liên kết nhanh</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-bold">
              <Link
                href="/work?dept=my-tasks"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#006838] transition flex items-center gap-2.5 shadow-2xs"
              >
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <IconPlus size={16} />
                </div>
                <span>Tạo công việc</span>
              </Link>

              <Link
                href="/business-trip"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition flex items-center gap-2.5 shadow-2xs"
              >
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                  <IconPlane size={16} />
                </div>
                <span>Đăng ký công tác</span>
              </Link>

              <Link
                href="/work/reports"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition flex items-center gap-2.5 shadow-2xs"
              >
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                  <IconReport size={16} />
                </div>
                <span>Báo cáo</span>
              </Link>

              <Link
                href="/documents/templates"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 transition flex items-center gap-2.5 shadow-2xs"
              >
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                  <IconFileText size={16} />
                </div>
                <span>Tài liệu</span>
              </Link>

              <Link
                href="/rooms"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition flex items-center gap-2.5 shadow-2xs"
              >
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                  <IconCalendar size={16} />
                </div>
                <span>Lịch họp</span>
              </Link>

              <Link
                href="/contact"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition flex items-center gap-2.5 shadow-2xs"
              >
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                  <IconHelp size={16} />
                </div>
                <span>Hỗ trợ</span>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* FOOTER */}
      <footer className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <div className="font-bold text-slate-800 tracking-wider">TBS GROUP</div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Văn phòng Chuỗi SKECHERS</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <Link href="/contact" className="hover:text-slate-800 hover:underline">Hỗ trợ</Link>
          <span className="text-slate-300">•</span>
          <Link href="/documents/templates" className="hover:text-slate-800 hover:underline">Hướng dẫn</Link>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-slate-400">Classic Home v2.0</span>
        </div>
      </footer>
    </div>
  );
}
