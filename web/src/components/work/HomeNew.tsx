"use client";

import React from "react";
import Link from "next/link";
import DepartmentDashboardView from "@/modules/dashboard/DepartmentDashboardView";
import {
  IconUsers,
  IconLayoutGrid,
  IconChevronRight,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconFileText,
  IconFolder,
  IconPhoneCall,
  IconSettings,
  IconCalendarEvent,
  IconTruck,
  IconClipboardList,
  IconBell,
  IconAlertCircle,
  IconCategory,
  IconUser,
  IconBuilding,
} from "@tabler/icons-react";

export interface TaskItem {
  id: string;
  code?: string;
  title: string;
  description?: string;
  department_id?: string;
  priority?: string;
  due_date?: string;
  status?: string;
  assignee_name?: string;
  progress?: number;
  created_at?: string;
  start_date?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  type?: string;
  department?: string;
  date?: string;
  created_at?: string;
  dotColor?: string;
}

export interface HomeNewProps {
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
  kpiStats: {
    total: number;
    inProgress: number;
    done: number;
    needsAttention: number;
  };
  urgentTaskList: any[];
  allowedModules: any[];
  notifications: NotificationItem[];
  isLoadingNotifications: boolean;
}

export default function HomeNew({
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
  kpiStats,
  urgentTaskList,
  allowedModules,
  notifications,
  isLoadingNotifications,
}: HomeNewProps) {
  return (
    <div className="w-full space-y-4 min-w-0 font-sans text-slate-800 antialiased max-w-[1600px] mx-auto pt-2 sm:pt-3">
      {/* ════════════════════════════════════════════════════════════════
          1. REFINED HERO EMPLOYEE CONTEXT BAR (Real user session data)
         ════════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-lg overflow-hidden bg-[#092b23] text-white p-4 sm:p-5 border border-emerald-900/60 shadow-xs">
        <div
          className="absolute inset-0 bg-cover bg-right opacity-35 pointer-events-none"
          style={{ backgroundImage: `url('/images/KGLV/CĐTT 2 GÓC HÌNH VP2.png')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#092b23] via-[#092b23]/90 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-300">
              <span>VĂN PHÒNG CHUỖI SKECHERS</span>
              <span className="text-emerald-700">•</span>
              <span className="text-slate-300">MSNV: {activeCode}</span>
            </div>

            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight leading-snug">
              Xin chào, <span className="text-emerald-300 font-bold whitespace-normal sm:whitespace-nowrap">{activeName}</span>
            </h1>

            <p className="text-xs text-slate-300 font-normal">
              {activeTitle} • {activeDept} — <span className="italic text-emerald-200/90">"Kỷ luật hôm nay – Giá trị bền vững ngày mai"</span>
            </p>
          </div>

          <div className="bg-[#06211b]/80 border border-emerald-800/60 rounded-md p-3 text-right space-y-0.5 min-w-[220px] hidden sm:block">
            <div className="text-xs font-semibold text-white">
              Thứ Hai, 14 tháng 9, 2026
            </div>
            <p className="text-[11px] text-emerald-200/80 font-normal italic">
              Làm đúng ngay từ hôm nay để ngày mai tốt hơn.
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          1.5 DASHBOARD MODE SELECTOR (Dashboard Cá Nhân vs Phòng Ban)
         ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md">
          <button
            onClick={() => setDashboardMode("personal")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              dashboardMode === "personal"
                ? "bg-[#006838] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <IconUser size={15} />
            <span>Dashboard cá nhân</span>
          </button>

          {hasDeptPermission && (
            <button
              onClick={() => setDashboardMode("department")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                dashboardMode === "department"
                  ? "bg-[#006838] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <IconBuilding size={15} />
              <span>Dashboard phòng ban ({activeDept})</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#006838] text-[10px] font-bold border border-emerald-200">
                Mới
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="text-slate-400">Đang hiển thị:</span>
          <span className="font-bold text-slate-800">
            {dashboardMode === "personal" ? "Công việc & Chỉ số cá nhân" : `Báo cáo & Tiến độ ${activeDept}`}
          </span>
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
              2. ENTERPRISE KPI CARDS (Real dynamic counts from backend tasks)
             ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* KPI 1: TỔNG CÔNG VIỆC */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng công việc</div>
                <div className="text-2xl font-bold text-slate-900 leading-none">
                  {isLoadingTasks ? "..." : kpiStats.total}
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-slate-100 text-[#006838] flex items-center justify-center shrink-0 border border-slate-200">
                <IconFileText size={18} />
              </div>
            </div>

            {/* KPI 2: ĐANG THỰC HIỆN */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Đang thực hiện</div>
                <div className="text-2xl font-bold text-slate-900 leading-none">
                  {isLoadingTasks ? "..." : kpiStats.inProgress}
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-slate-100 text-amber-700 flex items-center justify-center shrink-0 border border-slate-200">
                <IconClock size={18} />
              </div>
            </div>

            {/* KPI 3: HOÀN THÀNH */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hoàn thành</div>
                <div className="text-2xl font-bold text-slate-900 leading-none">
                  {isLoadingTasks ? "..." : kpiStats.done}
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-slate-100 text-[#006838] flex items-center justify-center shrink-0 border border-slate-200">
                <IconCheck size={18} />
              </div>
            </div>

            {/* KPI 4: CẦN XỬ LÝ */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cần xử lý</div>
                <div className="text-2xl font-bold text-slate-900 leading-none">
                  {isLoadingTasks ? "..." : kpiStats.needsAttention}
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-slate-100 text-rose-600 flex items-center justify-center shrink-0 border border-slate-200">
                <IconAlertTriangle size={18} />
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              3. MAIN ASYMMETRIC GRID (8 cols Main : 4 cols Right Rail)
             ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT COLUMN (2/3 Width) */}
            <div className="lg:col-span-2 space-y-4 min-w-0">
              
              {/* SECTION 1: CÔNG VIỆC CẦN XỬ LÝ SÁT HẠN (REAL DATA TABLE) */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <IconAlertCircle size={16} className="text-amber-600" />
                    <span>Công việc cần xử lý sát hạn</span>
                  </h2>
                  <Link href="/work?dept=my-tasks" className="text-xs font-semibold text-[#006838] hover:underline flex items-center gap-1">
                    <span>Xem tất cả ({urgentTaskList.length})</span>
                    <IconChevronRight size={14} />
                  </Link>
                </div>

                {isLoadingTasks ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">Đang tải công việc thực tế...</div>
                ) : urgentTaskList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium">
                    ✅ Chưa có công việc cần xử lý sát hạn.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px] bg-slate-50/80">
                          <th className="py-2.5 px-3 w-8">#</th>
                          <th className="py-2.5 px-3">Công việc</th>
                          <th className="py-2.5 px-3">Hạn chót</th>
                          <th className="py-2.5 px-3">Phòng ban</th>
                          <th className="py-2.5 px-3">Ưu tiên</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                          <th className="py-2.5 px-3 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-normal">
                        {urgentTaskList.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 leading-snug">{item.title}</div>
                              <div className="text-[10px] text-slate-400">{item.subTitle}</div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-rose-600 whitespace-nowrap">
                              {item.dueDate}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                              {item.dept}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${item.priorityStyle}`}>
                                {item.priority}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${item.statusStyle}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {item.isPrimaryAction ? (
                                <Link
                                  href="/work?dept=my-tasks"
                                  className="px-3 py-1 rounded bg-[#006838] hover:bg-[#004d29] text-white text-xs font-semibold transition"
                                >
                                  Xử lý
                                </Link>
                              ) : (
                                <Link
                                  href="/work?dept=my-tasks"
                                  className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                                >
                                  Chi tiết
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 2: DANH MỤC PHÂN HỆ VẬN HÀNH (3 CỘT X 2 HÀNG = 6 MODULES) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <IconLayoutGrid size={16} className="text-slate-500" />
                    <span>Danh mục phân hệ vận hành</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {allowedModules.map((mod) => {
                    const MIcon = mod.icon;
                    return (
                      <Link
                        key={mod.id}
                        href={mod.route}
                        className="p-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 group-hover:text-[#006838] flex items-center justify-center shrink-0 border border-slate-200 transition-colors">
                            <MIcon size={18} />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#006838] transition-colors leading-tight">
                              {mod.title}
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal truncate">
                              {mod.subtitle}
                            </div>
                          </div>
                        </div>
                        <IconChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* BOTTOM QUOTE BANNER */}
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
                  <span className="text-emerald-700 text-base leading-none">❝</span>
                  <span>Con người tạo nên khác biệt. Kỷ luật tạo nên kết quả.</span>
                </div>
                <div className="text-xs font-serif italic text-slate-400 font-bold shrink-0">
                  Good People Great Work
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (1/3 Width Widgets) */}
            <div className="space-y-4 min-w-0">
              
              {/* WIDGET 1: PHÍM TẮT TRUY CẬP NHANH (8 SHORTCUTS) */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Phím tắt truy cập nhanh
                  </h3>
                  <button className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                    Tùy chỉnh
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {/* Shortcut 1 */}
                  <Link href="/work?dept=my-tasks" className="p-1.5 rounded-md hover:bg-slate-50 transition space-y-1 group">
                    <div className="w-9 h-9 mx-auto rounded-md bg-slate-100 group-hover:bg-[#006838] text-slate-700 group-hover:text-white flex items-center justify-center transition border border-slate-200">
                      <IconFileText size={18} />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-700 leading-tight">Công việc cá nhân</div>
                  </Link>

                  {/* Shortcut 2 */}
                  <Link href="/rooms" className="p-1.5 rounded-md hover:bg-slate-50 transition space-y-1 group">
                    <div className="w-9 h-9 mx-auto rounded-md bg-slate-100 group-hover:bg-[#006838] text-slate-700 group-hover:text-white flex items-center justify-center transition border border-slate-200">
                      <IconCalendarEvent size={18} />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-700 leading-tight">Đặt lịch phòng họp</div>
                  </Link>

                  {/* Shortcut 3 */}
                  <Link href="/business-trip" className="p-1.5 rounded-md hover:bg-slate-50 transition space-y-1 group">
                    <div className="w-9 h-9 mx-auto rounded-md bg-slate-100 group-hover:bg-[#006838] text-slate-700 group-hover:text-white flex items-center justify-center transition border border-slate-200">
                      <IconTruck size={18} />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-700 leading-tight">Đăng ký xe công tác</div>
                  </Link>

                  {/* Shortcut 4 */}
                  <Link href="/work/tasks" className="p-1.5 rounded-md hover:bg-slate-50 transition space-y-1 group">
                    <div className="w-9 h-9 mx-auto rounded-md bg-slate-100 group-hover:bg-[#006838] text-slate-700 group-hover:text-white flex items-center justify-center transition border border-slate-200">
                      <IconLayoutGrid size={18} />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-700 leading-tight">TBS Work</div>
                  </Link>

                  {/* Shortcut 5 */}
                  {hasDeptPermission && (
                    <button
                      onClick={() => setDashboardMode("department")}
                      className="p-1.5 rounded-md hover:bg-slate-50 transition space-y-1 group text-left w-full cursor-pointer"
                    >
                      <div className="w-9 h-9 mx-auto rounded-md bg-slate-100 group-hover:bg-[#006838] text-slate-700 group-hover:text-white flex items-center justify-center transition border border-slate-200">
                        <IconClipboardList size={18} />
                      </div>
                      <div className="text-[10px] font-semibold text-slate-700 leading-tight text-center">Dashboard phòng ban</div>
                    </button>
                  )}

                  {/* Shortcut 6 */}
                  <Link href="/documents/templates" className="p-1.5 rounded-md hover:bg-slate-50 transition space-y-1 group">
                    <div className="w-9 h-9 mx-auto rounded-md bg-slate-100 group-hover:bg-[#006838] text-slate-700 group-hover:text-white flex items-center justify-center transition border border-slate-200">
                      <IconFileText size={18} />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-700 leading-tight">Tài liệu nội bộ</div>
                  </Link>

                  {/* Shortcut 7 */}
                  <Link href="/documents/templates" className="p-1.5 rounded-md hover:bg-slate-50 transition space-y-1 group">
                    <div className="w-9 h-9 mx-auto rounded-md bg-slate-100 group-hover:bg-[#006838] text-slate-700 group-hover:text-white flex items-center justify-center transition border border-slate-200">
                      <IconCategory size={18} />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-700 leading-tight">Biểu mẫu</div>
                  </Link>

                  {/* Shortcut 8 */}
                  <Link href="/contact" className="p-1.5 rounded-md hover:bg-slate-50 transition space-y-1 group">
                    <div className="w-9 h-9 mx-auto rounded-md bg-slate-100 group-hover:bg-[#006838] text-slate-700 group-hover:text-white flex items-center justify-center transition border border-slate-200">
                      <IconPhoneCall size={18} />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-700 leading-tight">Liên hệ IT</div>
                  </Link>
                </div>
              </div>

              {/* WIDGET 2: THÔNG BÁO HỆ THỐNG (REAL DATA OR EMPTY STATE) */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <IconBell size={16} className="text-slate-500" />
                    <span>Thông báo hệ thống</span>
                  </h3>
                  <Link href="/documents/templates" className="text-xs font-semibold text-[#006838] hover:underline flex items-center gap-0.5">
                    <span>Xem tất cả</span>
                    <IconChevronRight size={14} />
                  </Link>
                </div>

                {isLoadingNotifications ? (
                  <div className="p-3 text-center text-xs text-slate-400">Đang tải thông báo...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-medium">Chưa có thông báo mới.</div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    {notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-2.5 p-1 rounded hover:bg-slate-50 transition cursor-pointer">
                        <div className={`w-2 h-2 rounded-full ${n.dotColor || 'bg-[#006838]'} shrink-0 mt-1.5`} />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="font-semibold text-slate-900 leading-snug truncate" title={n.title}>
                            {n.title}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-normal">
                            <span>{n.department || "Khối IT & HR"}</span>
                            <span>{n.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WIDGET 3: LỊCH LÀM VIỆC HÔM NAY (PROPER EMPTY STATE FOR REAL ACCURACY) */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <IconCalendarEvent size={16} className="text-slate-500" />
                    <span>Lịch làm việc hôm nay</span>
                  </h3>
                  <Link href="/rooms" className="text-xs font-semibold text-[#006838] hover:underline flex items-center gap-0.5">
                    <span>Xem chi tiết</span>
                    <IconChevronRight size={14} />
                  </Link>
                </div>

                <div className="p-3.5 text-center text-xs text-slate-500 font-medium">
                  Không có lịch làm việc cá nhân hôm nay.
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* FOOTER BAR */}
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
          <Link href="/contact" className="hover:text-slate-800 hover:underline">Liên hệ</Link>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-slate-400">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
