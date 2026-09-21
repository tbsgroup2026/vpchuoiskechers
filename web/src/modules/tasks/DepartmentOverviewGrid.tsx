"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconDevices,
  IconShirt,
  IconUsers,
  IconSparkles,
  IconShieldCheck,
  IconBuildingFactory,
  IconAward,
  IconSearch,
  IconRefresh,
  IconArrowLeft,
  IconArrowRight,
  IconAlertCircle,
  IconFileText,
  IconClock,
  IconTrendingUp,
  IconCircleCheck,
  IconBuilding,
  IconX,
  IconChecklist,
} from "@tabler/icons-react";
import { usePermission } from "@/hooks/usePermission";
import Forbidden403 from "@/components/common/Forbidden403";

export interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
  manager: string;
  description: string;
  icon: any;
  category: "it" | "retail" | "hr" | "kaizen" | "production" | "qc";
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  inProgressTasks: number;
}

export const DEFAULT_DEPARTMENTS: Omit<DepartmentInfo, "totalTasks" | "completedTasks" | "overdueTasks" | "dueSoonTasks" | "inProgressTasks">[] = [
  {
    id: "IT_DIGITAL",
    name: "Phòng IT & Chuyển đổi số",
    code: "prj-automation",
    manager: "Phạm Nguyễn Anh Huy",
    description: "Tự động hóa dây chuyền, phần mềm & hạ tầng CĐS",
    icon: IconDevices,
    category: "it",
  },
  {
    id: "RETAIL_SKECHERS",
    name: "Phối hợp chuỗi Skechers HQ & Store",
    code: "prj-skechers-retail",
    manager: "Vận Hành Skechers",
    description: "Bán lẻ, tồn kho & vận hành hệ thống chuỗi cửa hàng",
    icon: IconShirt,
    category: "retail",
  },
  {
    id: "HÀNH_CHÍNH",
    name: "Phòng Hành chính nhân sự",
    code: "prj-admin-expense",
    manager: "Nguyễn Thị Mai",
    description: "Số hóa hành chính, xe công tác, nhân sự & văn phòng",
    icon: IconUsers,
    category: "hr",
  },
  {
    id: "SO_HOA_152",
    name: "Ban Sáng kiến cải tiến 1-5-2",
    code: "prj-kaizen-152",
    manager: "Ban Kaizen 2.2",
    description: "Cải tiến Kaizen 1-5-2, tiết kiệm chi phí & năng suất",
    icon: IconSparkles,
    category: "kaizen",
  },
  {
    id: "GEMBA_SAFETY",
    name: "Ban An toàn lao động & Kiểm soát Gemba",
    code: "prj-gemba-safety",
    manager: "Ban An Toàn & QC",
    description: "Kiểm soát Gemba, an toàn lao động & 5S xưởng may",
    icon: IconShieldCheck,
    category: "qc",
  },
  {
    id: "PROD_MAY5",
    name: "Xưởng may 5 & Quản lý sản xuất",
    code: "prj-prod-may5",
    manager: "Trần Văn Hùng",
    description: "Quản lý tiến độ chuyền may 5, đơn hàng & kỹ thuật",
    icon: IconBuildingFactory,
    category: "production",
  },
  {
    id: "QC_QUALITY",
    name: "Ban Quản lý chất lượng QC",
    code: "prj-qc-quality",
    manager: "Lê Văn Tấn",
    description: "Kiểm soát chất lượng nguyên phụ liệu & thành phẩm",
    icon: IconAward,
    category: "qc",
  },
];

interface DepartmentOverviewGridProps {
  onSelectDepartment: (deptId: string) => void;
}

function getInitials(name: string): string {
  if (!name) return "TB";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function DepartmentOverviewGrid({ onSelectDepartment }: DepartmentOverviewGridProps) {
  const router = useRouter();
  const { isExecutiveOrAdmin } = usePermission();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [kpiFilter, setKpiFilter] = useState<"all" | "overdue" | "due_soon" | "in_progress" | "completed">("all");
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setLastUpdatedTime(`${hours}:${mins}`);
    };
    updateTime();
  }, []);

  const fetchDepartmentTasks = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/tasks", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.tasks)) {
          setTasks(json.tasks);
        }
      }
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setLastUpdatedTime(`${hours}:${mins}`);
    } catch (e) {
      console.error("Lỗi tải danh sách thẻ công việc phòng ban", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExecutiveOrAdmin) {
      fetchDepartmentTasks();
    }
  }, [isExecutiveOrAdmin]);

  const departmentsWithStats = useMemo(() => {
    return DEFAULT_DEPARTMENTS.map((dept) => {
      const deptTasks = tasks.filter(
        (t) => t.department_id && t.department_id.toUpperCase() === dept.id.toUpperCase()
      );
      const totalTasks = deptTasks.length;
      const completedTasks = deptTasks.filter(
        (t) => t.status === "DONE" || t.progress === 100
      ).length;
      const overdueTasks = deptTasks.filter((t) => {
        if (!t.due_date || t.status === "DONE") return false;
        return new Date(t.due_date).getTime() < new Date().getTime();
      }).length;
      const dueSoonTasks = deptTasks.filter((t) => {
        if (!t.due_date || t.status === "DONE") return false;
        const diff = new Date(t.due_date).getTime() - new Date().getTime();
        return diff >= 0 && diff <= 86400000;
      }).length;
      const inProgressTasks = Math.max(0, totalTasks - completedTasks);

      return {
        ...dept,
        totalTasks,
        completedTasks,
        overdueTasks,
        dueSoonTasks,
        inProgressTasks,
      };
    });
  }, [tasks]);

  const filteredDepartments = useMemo(() => {
    return departmentsWithStats.filter((dept) => {
      const matchesSearch =
        !searchQuery.trim() ||
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.manager.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCat === "all" || dept.category === selectedCat;

      let matchesKpi = true;
      if (kpiFilter === "overdue") matchesKpi = dept.overdueTasks > 0;
      else if (kpiFilter === "due_soon") matchesKpi = dept.dueSoonTasks > 0;
      else if (kpiFilter === "in_progress") matchesKpi = dept.inProgressTasks > 0;
      else if (kpiFilter === "completed") matchesKpi = dept.completedTasks > 0;

      return matchesSearch && matchesCat && matchesKpi;
    });
  }, [departmentsWithStats, searchQuery, selectedCat, kpiFilter]);

  if (!isExecutiveOrAdmin) {
    return (
      <div className="w-full min-h-[75vh] bg-slate-50 p-6 flex items-center justify-center">
        <Forbidden403
          title="403 — Màn hình dành riêng cho Ban Giám đốc"
          description="Màn hình Bảng công việc & tiến độ tất cả phòng ban (TBS Work Board Hub - Ban quản trị) chỉ dành riêng cho Ban Giám đốc và Quản trị viên hệ thống."
          requiredPermission="ROLES.EXECUTIVE_BOARD (Ban Giám đốc / Admin)"
        />
      </div>
    );
  }

  // Overall totals across all departments
  const grandTotal = tasks.length;
  const grandOverdue = tasks.filter((t) => {
    if (!t.due_date || t.status === "DONE") return false;
    return new Date(t.due_date).getTime() < new Date().getTime();
  }).length;
  const grandDueSoon = tasks.filter((t) => {
    if (!t.due_date || t.status === "DONE") return false;
    const diff = new Date(t.due_date).getTime() - new Date().getTime();
    return diff >= 0 && diff <= 86400000;
  }).length;
  const grandCompleted = tasks.filter((t) => t.status === "DONE" || t.progress === 100).length;
  const grandInProgress = Math.max(0, grandTotal - grandCompleted);
  const grandPercent = grandTotal > 0 ? Math.round((grandCompleted / grandTotal) * 100) : 0;

  const handleCardClick = (deptId: string) => {
    onSelectDepartment(deptId);
  };

  return (
    <div className="w-full space-y-6 min-w-0 font-sans text-slate-800 antialiased max-w-[1600px] mx-auto">
      {/* ════════════════════════════════════════════════════════════════
          3.1 SYSTEM STYLE WELCOME HEADER CARD (MATCHES IMAGE 1 HOMECLEASSIC)
         ════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/80 text-[#006838] font-bold text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006838] animate-pulse" />
              TBS WORK BOARD HUB • BAN QUẢN TRỊ
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Danh sách bảng công việc & tiến độ <span className="text-[#006838]">các phòng ban</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Vui lòng chọn 1 phòng ban để xem chi tiết bảng Kanban, tiến độ công việc & đơn vị phụ trách.
          </p>
        </div>

        {/* Right Button Secondary & Timestamp */}
        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/work"
              className="bg-emerald-50 hover:bg-[#006838] text-[#006838] hover:text-white border border-emerald-200 text-xs font-bold rounded-xl shadow-2xs px-3.5 py-2 flex items-center gap-1.5 cursor-pointer transition active:scale-95 shrink-0 group"
              title="Quay lại Trang Chủ Work Hub"
            >
              <IconArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Quay lại Trang Chủ</span>
            </Link>
            <button
              type="button"
              onClick={fetchDepartmentTasks}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs px-3.5 py-2 flex items-center gap-2 cursor-pointer transition active:scale-95 shrink-0"
            >
              <IconRefresh size={15} className={`text-slate-500 ${loading ? "animate-spin text-[#006838]" : ""}`} />
              <span>Làm mới dữ liệu</span>
            </button>
          </div>
          {lastUpdatedTime && (
            <span className="text-[11px] text-slate-400 font-medium">
              Cập nhật lúc {lastUpdatedTime}
            </span>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          3.2 FIVE KPI TILES (EXACT MATCH WITH IMAGE 1 DASHBOARD TILES)
         ════════════════════════════════════════════════════════════════ */}
      <section aria-label="Thống kê công việc">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Tile 1: Tổng thẻ công việc */}
          <div
            onClick={() => setKpiFilter("all")}
            className={`bg-blue-50/70 border rounded-xl p-4 shadow-2xs flex items-center justify-between transition cursor-pointer hover:shadow-xs ${
              kpiFilter === "all" ? "ring-2 ring-[#006838] border-[#006838]" : "border-blue-200/90"
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-bold text-blue-800">Tổng thẻ công việc</div>
              <div className="text-2xl font-black text-blue-900 leading-none">
                {loading ? "..." : grandTotal}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Toàn hệ thống</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <IconFileText size={20} />
            </div>
          </div>

          {/* Tile 2: Quá hạn */}
          <div
            onClick={() => setKpiFilter(kpiFilter === "overdue" ? "all" : "overdue")}
            className={`bg-rose-50/70 border rounded-xl p-4 shadow-2xs flex items-center justify-between transition cursor-pointer hover:shadow-xs ${
              kpiFilter === "overdue" ? "ring-2 ring-[#006838] border-[#006838]" : "border-rose-200/90"
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-bold text-rose-700 flex items-center gap-1">
                <span>Quá hạn</span>
                {grandOverdue > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />}
              </div>
              <div className="text-2xl font-black text-rose-800 leading-none">
                {loading ? "..." : grandOverdue}
              </div>
              <div className="text-[10px] text-rose-600 font-bold">Cần xử lý gấp</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
              <IconAlertCircle size={20} />
            </div>
          </div>

          {/* Tile 3: Sắp đến hạn 24h */}
          <div
            onClick={() => setKpiFilter(kpiFilter === "due_soon" ? "all" : "due_soon")}
            className={`bg-amber-50/70 border rounded-xl p-4 shadow-2xs flex items-center justify-between transition cursor-pointer hover:shadow-xs ${
              kpiFilter === "due_soon" ? "ring-2 ring-[#006838] border-[#006838]" : "border-amber-200/90"
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-bold text-amber-800">Sắp đến hạn 24h</div>
              <div className="text-2xl font-black text-amber-900 leading-none">
                {loading ? "..." : grandDueSoon}
              </div>
              <div className="text-[10px] text-amber-700 font-medium">Theo dõi sát</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <IconClock size={20} />
            </div>
          </div>

          {/* Tile 4: Đang tiến hành */}
          <div
            onClick={() => setKpiFilter(kpiFilter === "in_progress" ? "all" : "in_progress")}
            className={`bg-sky-50/70 border rounded-xl p-4 shadow-2xs flex items-center justify-between transition cursor-pointer hover:shadow-xs ${
              kpiFilter === "in_progress" ? "ring-2 ring-[#006838] border-[#006838]" : "border-sky-200/90"
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-bold text-sky-800">Đang tiến hành</div>
              <div className="text-2xl font-black text-sky-900 leading-none">
                {loading ? "..." : grandInProgress}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Đang triển khai</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
              <IconTrendingUp size={20} />
            </div>
          </div>

          {/* Tile 5: Đã hoàn thành */}
          <div
            onClick={() => setKpiFilter(kpiFilter === "completed" ? "all" : "completed")}
            className={`bg-emerald-50/70 border rounded-xl p-4 shadow-2xs flex items-center justify-between transition cursor-pointer hover:shadow-xs col-span-2 sm:col-span-1 ${
              kpiFilter === "completed" ? "ring-2 ring-[#006838] border-[#006838]" : "border-emerald-200/90"
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-bold text-[#006838]">Đã hoàn thành</div>
              <div className="text-2xl font-black text-[#006838] leading-none">
                {loading ? "..." : grandCompleted}
              </div>
              <div className="text-[10px] text-emerald-700 font-bold">{grandPercent}% đạt chỉ tiêu</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006838] border border-emerald-200 flex items-center justify-center shrink-0">
              <IconCircleCheck size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          3.3 TOOLBAR & LIST HEADER
         ════════════════════════════════════════════════════════════════ */}
      <section className="space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2">
            <IconBuilding size={18} className="text-[#006838]" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Danh sách phòng ban & dự án vận hành
            </h2>
            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-xs font-bold">
              {filteredDepartments.length}
            </span>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {kpiFilter !== "all" && (
              <button
                type="button"
                onClick={() => setKpiFilter("all")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#006838] border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
              >
                <span>Đang lọc KPI</span>
                <IconX size={14} />
              </button>
            )}

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm phòng ban, mã dự án..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#006838] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
              />
            </div>

            {/* Category Segmented Control Pills */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: "all", label: "Tất cả" },
                { id: "it", label: "IT & CĐS" },
                { id: "retail", label: "Skechers Retail" },
                { id: "hr", label: "Hành chính HR" },
                { id: "kaizen", label: "Kaizen 1-5-2" },
                { id: "qc", label: "Gemba & QC" },
                { id: "production", label: "Xưởng may" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCat(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCat === tab.id
                      ? "bg-[#006838] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            3.4 DEPARTMENT CARDS GRID (CANONICAL TBS LIGHT THEME)
           ════════════════════════════════════════════════════════════════ */}
        {loading ? (
          /* Skeleton Loading State */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 animate-pulse h-[250px] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 bg-slate-100 rounded-full w-full" />
                  <div className="h-4 bg-slate-100 rounded w-1/2 pt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDepartments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {filteredDepartments.map((dept) => {
              const IconComp = dept.icon;
              const completionPercent = dept.totalTasks > 0 ? Math.round((dept.completedTasks / dept.totalTasks) * 100) : 0;

              return (
                <div
                  key={dept.id}
                  onClick={() => handleCardClick(dept.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(dept.id);
                    }
                  }}
                  className="bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006838]"
                >
                  <div className="space-y-3">
                    {/* Top Row: Icon + Title & Code */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006838] border border-emerald-200/80 flex items-center justify-center shrink-0 group-hover:bg-[#006838] group-hover:text-white transition-colors">
                        <IconComp size={18} stroke={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-base font-bold text-slate-900 group-hover:text-[#006838] transition-colors line-clamp-2 leading-snug"
                          title={dept.name}
                        >
                          {dept.name}
                        </h3>
                        <span className="text-xs font-mono text-slate-400 font-semibold block mt-0.5">
                          {dept.code.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed min-h-[38px]">
                      {dept.description}
                    </p>

                    {/* Manager Row (Flat row, NO boxed container) */}
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Phụ trách:</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-[#006838] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {getInitials(dept.manager)}
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {dept.manager}
                        </span>
                      </div>
                    </div>

                    {/* Overall Progress */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Tiến độ tổng thể</span>
                        <span className="text-xs font-black text-[#006838]">
                          {completionPercent}%
                        </span>
                      </div>
                      <div
                        className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60"
                        role="progressbar"
                        aria-valuenow={completionPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            completionPercent === 100 ? "bg-emerald-600" : "bg-[#006838]"
                          }`}
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer (Strict single row, no wrap) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs whitespace-nowrap overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${dept.totalTasks > 0 ? "text-slate-700" : "text-slate-400"}`}>
                        {dept.totalTasks} thẻ công việc
                      </span>
                      {dept.overdueTasks > 0 && (
                        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 border border-rose-200/60 shrink-0">
                          <IconAlertCircle size={12} stroke={1.75} />
                          {dept.overdueTasks} quá hạn
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#006838] group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
                      Xem bảng Kanban <IconArrowRight size={14} stroke={1.75} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
            <IconFileText size={36} stroke={1.5} className="text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Chưa có dự án nào phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              Không tìm thấy phòng ban hoặc dự án nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCat("all");
                setKpiFilter("all");
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#006838] border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
