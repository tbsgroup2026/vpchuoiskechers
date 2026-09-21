"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  IconHome,
  IconChecklist,
  IconBuilding,
  IconCalendar,
  IconBriefcase,
  IconUser,
  IconShieldLock,
  IconLock,
  IconChevronRight,
  IconFolder,
  IconFileText,
  IconChartBar,
  IconUsers,
  IconSparkles,
} from "@tabler/icons-react";

interface UserMePayload {
  user: {
    name: string;
    title: string;
    department: string;
    roleCode: string;
    managementLevel?: number;
    avatar?: string;
  };
  allowedModules: string[];
}

export default function DynamicSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deptParam = searchParams ? searchParams.get("dept") : null;
  const [data, setData] = useState<UserMePayload | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch {
        console.error("Dynamic sidebar payload load failed");
      }
    };
    fetchMe();
  }, []);

  if (!data) return null;

  const { user, allowedModules } = data;
  const isExecutive = user.managementLevel && user.managementLevel <= 2;
  const isAdmin = user.roleCode === "SUPER_ADMIN" || allowedModules.includes("admin");
  const isDeptHead = user.roleCode === "TRUONG_PHONG" || allowedModules.includes("dept_management");

  return (
    <aside className="w-64 lg:w-72 bg-[#0b1739] text-slate-200 p-4 shrink-0 flex flex-col justify-between select-none border-r border-slate-800 shadow-xl min-h-screen">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="bg-white rounded-xl px-2.5 py-1 border border-slate-200 shadow-2xs">
            <img src="/images/tbs-logo.png" alt="TBS Group" className="h-6 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <span className="text-xs font-black text-white block">SKECHERS HQ</span>
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">
              Workspace Động
            </span>
          </div>
        </div>

        {/* Dynamic Nav Groups */}
        <div className="space-y-4">
          {/* Group 1: TỔNG QUAN & CÔNG VIỆC */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
              CÔNG VIỆC CỦA TÔI
            </h4>

            <Link
              href="/work"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname === "/work"
                  ? "bg-[#006838] text-white font-extrabold shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <IconHome size={18} className="shrink-0 text-emerald-400" />
              <span>Trang Chủ Công Việc</span>
            </Link>

            <Link
              href="/work?dept=my-tasks"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname === "/work/my-tasks" || (pathname === "/work" && (deptParam === "my-tasks" || deptParam === "my_tasks"))
                  ? "bg-[#006838] text-white font-extrabold shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <IconChecklist size={18} className="shrink-0 text-amber-400" />
              <span>Kanban Công Việc Của Tôi</span>
            </Link>

            <Link
              href="/work/cn-ci"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/work/cn-ci") || pathname.startsWith("/work/kaizen")
                  ? "bg-[#006838] text-white font-extrabold shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <IconSparkles size={18} className="shrink-0 text-emerald-400" />
              <span>CN-CI (Cải Tiến Liên Tục)</span>
            </Link>
          </div>

          {/* Group 2: QUẢN LÝ PHÒNG BAN (Chỉ hiện cho Trưởng Phòng) */}
          {isDeptHead && (
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
                QUẢN LÝ PHÒNG BAN
              </h4>
              <Link
                href="/work/dept-management"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/work/dept-management"
                    ? "bg-blue-600 text-white font-extrabold shadow-md"
                    : "text-blue-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <IconChartBar size={18} className="shrink-0 text-blue-400" />
                <span>Dashboard Trưởng Phòng</span>
              </Link>
            </div>
          )}

          {/* Group 3: TIỆN ÍCH DÙNG CHUNG (Tất cả CBCNV đều thấy) */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
              TIỆN ÍCH DÙNG CHUNG
            </h4>
            <Link
              href="/rooms"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/rooms")
                  ? "bg-slate-800 text-white font-black"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <IconBuilding size={18} className="shrink-0 text-sky-400" />
              <span>Đăng Ký Phòng Họp</span>
            </Link>

            <Link
              href="/business-trip"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/business-trip")
                  ? "bg-slate-800 text-white font-black"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <IconBriefcase size={18} className="shrink-0 text-amber-400" />
              <span>Đăng Ký Công Tác</span>
            </Link>
          </div>

          {/* Group 4: PHÂN HỆ QUẢN TRỊ 1-5-2 (Chỉ Phó TGĐ trở lên thấy) */}
          {isExecutive && (
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <h4 className="text-[10px] font-black uppercase text-amber-400 tracking-wider px-2">
                HỆ THỐNG QUẢN TRỊ RESTRICTED
              </h4>
              <Link
                href="/1-5-2"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname.startsWith("/1-5-2")
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "text-amber-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <IconShieldLock size={18} className="shrink-0 text-amber-400" />
                <span>Quản Trị 1-5-2 (Access Gate)</span>
              </Link>
            </div>
          )}

          {/* Group 5: ADMIN SYSTEM */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <h4 className="text-[10px] font-black uppercase text-rose-400 tracking-wider px-2">
                ADMIN SYSTEM
              </h4>
              <Link
                href="/admin/permissions"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname.startsWith("/admin/permissions")
                    ? "bg-rose-600 text-white font-black shadow-md"
                    : "text-rose-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <IconLock size={18} className="shrink-0 text-rose-400" />
                <span>Permission Inspector</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center shrink-0">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0 leading-tight">
          <span className="text-xs font-black text-white block truncate">{user.name}</span>
          <span className="text-[10px] text-slate-400 block font-medium truncate">{user.title}</span>
        </div>
      </div>
    </aside>
  );
}
