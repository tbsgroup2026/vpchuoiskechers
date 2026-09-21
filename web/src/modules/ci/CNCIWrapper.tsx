"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconBulb,
  IconTrendingUp,
  IconMapPin,
  IconArrowRight,
  IconArrowLeft,
  IconClock,
  IconSparkles,
  IconAlertCircle,
  IconBuildingFactory,
  IconBook,
  IconFileText,
  IconDeviceMobile,
  IconSchool,
  IconEye,
  IconChartBar,
  IconUsers,
  IconTools,
  IconCalendar,
  IconStar,
  IconFolder,
  IconChevronRight,
  IconBuilding,
  IconExternalLink,
} from "@tabler/icons-react";
import CIModule from "./CIModule";
import { EquipmentScope, EQUIPMENT_SCOPES, SCOPE_KEYS, STORAGE_KEY_SCOPE } from "@/lib/equipmentScope";
import { usePermission } from "@/hooks/usePermission";

export default function CNCIWrapper() {
  const router = useRouter();
  const { canAccessScope } = usePermission();
  const [subView, setSubView] = useState<"kaizen" | "ci" | "gemba" | null>(null);
  const [mmtbScope, setMmtbScope] = useState<EquipmentScope>("ALL");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_SCOPE) as EquipmentScope | null;
      if (saved && SCOPE_KEYS.includes(saved)) {
        setMmtbScope(saved);
      }
    }
  }, []);

  const handleSelectMmtbScope = (scope: EquipmentScope) => {
    setMmtbScope(scope);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SCOPE, scope);
    }
  };

  // Sync subView with URL search params if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const sub = urlParams.get("sub");
      if (sub === "kaizen" || sub === "ci" || sub === "gemba") {
        setSubView(sub);
      }
    }
  }, []);

  const handleSelectSubView = (view: "kaizen" | "ci" | "gemba") => {
    if (view === "kaizen") {
      router.push("/work/kaizen");
    } else if (view === "ci") {
      router.push("/work/ci");
    } else if (view === "gemba") {
      router.push("/work/gemba");
    }
  };

  const handleBackToLanding = () => {
    router.push("/work/cn-ci");
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* ════════════════════════════════════════════════════════════════
          BREADCRUMB / TOP NAVIGATION BAR (FOR SUB-VIEWS)
         ════════════════════════════════════════════════════════════════ */}
      {subView && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <Link
            href="/work/cn-ci"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all flex items-center gap-2 cursor-pointer border border-slate-200"
          >
            <IconArrowLeft size={16} />
            <span>Quay lại Danh Mục CN-CI</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>CN-CI (Cải Tiến Liên Tục)</span>
            <span>/</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#006838] font-black uppercase text-[10px] border border-emerald-200">
              {subView === "kaizen" ? "💡 Kaizen (Thư viện Cải tiến)" : subView === "ci" ? "📈 CI (Điểm nghẽn)" : "📍 Gemba Walk"}
            </span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          1. LANDING SELECTION VIEW (NEW 3-COLUMN LIST LAYOUT MATCHING IMAGE 2)
         ════════════════════════════════════════════════════════════════ */}
      {!subView && (
        <div className="space-y-6 animate-in zoom-in-95 duration-200">
          {/* Top Banner Intro */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-teal-900/40 group">
            {/* Background Real Image & Dark Emerald Gradient Overlay */}
            <img
              src="/images/KGLV/CĐTT 2 GÓC QUI TRÌNH GIÀY.png"
              alt="CN-CI Cải Tiến Liên Tục"
              className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#006838]/90 via-[#004d29]/80 to-slate-950/85 pointer-events-none" />
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs tracking-wider">
                <IconSparkles size={16} />
                <span>CHÀO MỪNG TRỞ LẠI!</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Cải Tiến Liên Tục &amp; Năng Suất 4.0
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
                Chọn phân hệ bên dưới để quản lý, theo dõi và cải tiến hiệu quả công việc mỗi ngày.
              </p>
            </div>

            {/* Gear + Upward Arrow Vector Graphic */}
            <div className="relative w-28 h-20 sm:w-36 sm:h-24 flex items-center justify-center shrink-0 z-10">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <svg
                viewBox="0 0 100 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full text-emerald-400 opacity-90 drop-shadow-md"
              >
                {/* Outer Gear */}
                <circle cx="35" cy="45" r="18" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" />
                <circle cx="35" cy="45" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M35 23v4M35 63v4M13 45h4M53 45h4M20 30l3 3M47 57l3 3M20 60l3-3M47 33l3-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                {/* Ascending Arrow */}
                <path
                  d="M25 65L75 15M75 15H45M75 15V45"
                  stroke="#34d399"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* 3-Column List Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ════════════════════════════════════════════════════════════════
                COLUMN 1 — THƯ VIỆN CẢI TIẾN (GREEN THEME)
               ════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Column Header */}
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#006838] text-white flex items-center justify-center shrink-0 shadow-md">
                    <IconBook size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Thư Viện Cải Tiến
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-normal mt-0.5">
                      Tài liệu, biểu mẫu và kiến thức hỗ trợ cải tiến liên tục
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  {/* Button 1: Tổng Quan */}
                  <Link
                    href="/work/kaizen"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/60 active:bg-emerald-100/70 border border-slate-200/80 hover:border-emerald-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-[#006838] flex items-center justify-center shrink-0 font-bold border border-emerald-200/50 group-hover:scale-105 transition-transform">
                        <IconChartBar size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-[#006838] transition-colors">
                        Tổng Quan
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-[#006838] group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Button 2: Văn phòng Chuỗi */}
                  <Link
                    href="/work/kaizen/van-phong-chuoi"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/60 active:bg-emerald-100/70 border border-slate-200/80 hover:border-emerald-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-[#006838] flex items-center justify-center shrink-0 font-bold border border-emerald-200/50 group-hover:scale-105 transition-transform">
                        <IconBuilding size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-[#006838] transition-colors">
                        Văn phòng Chuỗi
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-[#006838] group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Button 3: Nhà Máy Miền Đông */}
                  <Link
                    href="/work/kaizen/nha-may-mien-dong"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/60 active:bg-emerald-100/70 border border-slate-200/80 hover:border-emerald-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-[#006838] flex items-center justify-center shrink-0 font-bold border border-emerald-200/50 group-hover:scale-105 transition-transform">
                        <IconBuildingFactory size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-[#006838] transition-colors">
                        Nhà Máy Miền Đông
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-[#006838] group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Button 4: Tổ Hợp Kiên Giang */}
                  <a
                    href="https://thkiengiangshoes.tbsgroup2026.workers.dev/work/kaizen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/60 active:bg-emerald-100/70 border border-slate-200/80 hover:border-emerald-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-[#006838] flex items-center justify-center shrink-0 font-bold border border-emerald-200/50 group-hover:scale-105 transition-transform">
                        <IconMapPin size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-[#006838] transition-colors">
                        Tổ Hợp Kiên Giang
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-[#006838] group-hover:translate-x-0.5 transition-all" />
                  </a>

                  {/* Button 5: Thư Viện Cải Tiến của Ngành */}
                  <a
                    href="https://script.google.com/macros/s/AKfycbwMgjjpbOtI6pWBGkcXBIVbtY0zo1URCjb5qteNg0THY3HW9MZwXGfMVh0mBh6sD1pOdA/exec"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/60 active:bg-emerald-100/70 border border-slate-200/80 hover:border-emerald-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-[#006838] flex items-center justify-center shrink-0 font-bold border border-emerald-200/50 group-hover:scale-105 transition-transform">
                        <IconSchool size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-[#006838] transition-colors">
                        Thư Viện Cải Tiến của Ngành
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-[#006838] group-hover:translate-x-0.5 transition-all" />
                  </a>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                COLUMN 2 — GEMBA | NMMĐ | TỔ HỢP KIÊN GIANG (BLUE THEME)
               ════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Column Header */}
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <IconBuildingFactory size={28} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                      GEMBA
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-normal mt-0.5">
                      Theo dõi hiện trường, phản ánh và cải tiến tại nhà máy
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  {/* Button 1: Tổng Quan */}
                  <Link
                    href="/work/gemba"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/60 active:bg-blue-100/70 border border-slate-200/80 hover:border-blue-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 font-bold border border-blue-200/50 group-hover:scale-105 transition-transform">
                        <IconChartBar size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                        Tổng Quan
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Button 2: Văn phòng Chuỗi */}
                  <Link
                    href="/work/gemba?region=V%C4%83n+ph%C3%B2ng+Chu%E1%BB%97i"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/60 active:bg-blue-100/70 border border-slate-200/80 hover:border-blue-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 font-bold border border-blue-200/50 group-hover:scale-105 transition-transform">
                        <IconBuilding size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                        Văn phòng Chuỗi
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Button 3: Nhà Máy Miền Đông */}
                  <Link
                    href="/work/gemba?region=Nh%C3%A0+M%C3%A1y+Mi%E1%BB%81n+%C4%90%C3%B4ng"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/60 active:bg-blue-100/70 border border-slate-200/80 hover:border-blue-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 font-bold border border-blue-200/50 group-hover:scale-105 transition-transform">
                        <IconBuildingFactory size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                        Nhà Máy Miền Đông
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Button 4: Tổ Hợp Kiên Giang */}
                  <a
                    href="https://thkiengiangshoes.tbsgroup2026.workers.dev/work/gemba"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/60 active:bg-blue-100/70 border border-slate-200/80 hover:border-blue-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 font-bold border border-blue-200/50 group-hover:scale-105 transition-transform">
                        <IconMapPin size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                        Tổ Hợp Kiên Giang
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </a>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                COLUMN 3 — QUẢN LÝ MÁY MÓC THIẾT BỊ (ORANGE THEME)
               ════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Column Header */}
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <IconTools size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Quản Lý Máy Móc Thiết Bị
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-normal mt-0.5">
                      Quản lý, bảo trì và theo dõi tình trạng thiết bị
                    </p>
                  </div>
                </div>

                {/* 4 Scope Action Buttons matching Thư Viện Cải Tiến & GEMBA */}
                <div className="space-y-2.5 pt-2">
                  {/* Button 1: Tổng Quan */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMmtbScope("ALL");
                      router.push("/maintenance?scope=ALL");
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/60 active:bg-amber-100/70 border border-slate-200/80 hover:border-amber-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 font-bold border border-amber-200/50 group-hover:scale-105 transition-transform">
                        <IconChartBar size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-amber-600 transition-colors">
                        Tổng Quan
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Button 2: Văn phòng Chuỗi */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMmtbScope("OFFICE");
                      router.push("/maintenance?scope=OFFICE");
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/60 active:bg-amber-100/70 border border-slate-200/80 hover:border-amber-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 font-bold border border-amber-200/50 group-hover:scale-105 transition-transform">
                        <IconBuilding size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-amber-600 transition-colors">
                        Văn phòng Chuỗi
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Button 3: Nhà Máy Miền Đông */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMmtbScope("EAST");
                      router.push("/maintenance?scope=EAST");
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/60 active:bg-amber-100/70 border border-slate-200/80 hover:border-amber-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 font-bold border border-amber-200/50 group-hover:scale-105 transition-transform">
                        <IconBuildingFactory size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-amber-600 transition-colors">
                        Nhà Máy Miền Đông
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Button 4: Tổ Hợp Kiên Giang */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMmtbScope("KIEN_GIANG");
                      router.push("/maintenance?scope=KIEN_GIANG");
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/60 active:bg-amber-100/70 border border-slate-200/80 hover:border-amber-300 active:scale-[0.98] transition-all duration-200 group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 font-bold border border-amber-200/50 group-hover:scale-105 transition-transform">
                        <IconMapPin size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-amber-600 transition-colors">
                        Tổ Hợp Kiên Giang
                      </span>
                    </div>
                    <IconChevronRight size={18} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          2. KAIZEN SUB-VIEW (FULL GIAI ĐOẠN 2 THƯ VIỆN CẢI TIẾN)
         ════════════════════════════════════════════════════════════════ */}
      {subView === "kaizen" && (
        <div className="animate-in fade-in duration-200">
          <CIModule />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          3. CI SUB-VIEW (PLACEHOLDER "SẮP RA MẮT")
         ════════════════════════════════════════════════════════════════ */}
      {subView === "ci" && (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-8 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2f54eb] flex items-center justify-center mx-auto border border-blue-200 shadow-2xs">
            <IconTrendingUp size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Phân Hệ CI — Quản Lý &amp; Theo Dõi Điểm Nghẽn
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed max-w-md mx-auto">
              Chức năng ghi nhận điểm nghẽn sản xuất, 5 loại lãng phí Muda (Chờ đợi, Thao tác thừa, Tồn kho, Vận chuyển, Hàng lỗi) đang được chuẩn hóa giao diện và đấu nối API.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
            <IconClock size={16} />
            <span>Tính năng đang phát triển — Coming Soon</span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          4. GEMBA SUB-VIEW (PLACEHOLDER "SẮP RA MẮT")
         ════════════════════════════════════════════════════════════════ */}
      {subView === "gemba" && (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-8 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#fa8c16] flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
            <IconMapPin size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Phân Hệ GEMBA — Đi Hiện Trường &amp; Phát Hiện Vấn Đề
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed max-w-md mx-auto">
              Chức năng Gemba Walk (ghi nhận hiện trường chuyền dán, người phụ trách, ảnh chụp trực tiếp và theo dõi khắc phục sự cố) đang chuẩn bị tích hợp ở giai đoạn tiếp theo.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
            <IconClock size={16} />
            <span>Tính năng đang phát triển — Coming Soon</span>
          </div>
        </div>
      )}
    </div>
  );
}
