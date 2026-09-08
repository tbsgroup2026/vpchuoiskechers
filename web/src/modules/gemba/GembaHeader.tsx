"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconMenu2, IconBell, IconClock, IconHome, IconGridDots, IconMaximize, IconSparkles, IconArrowLeft } from "@tabler/icons-react";

interface GembaHeaderProps {
  title: string;
  breadcrumb?: string;
  onToggleSidebar: () => void;
}

export default function GembaHeader({ title, breadcrumb = "Tổng quan", onToggleSidebar }: GembaHeaderProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const day = now.getDate();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      setTimeStr(`${hours}:${minutes}:${seconds} — ${day}/${month}/${year}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] font-sans antialiased">
      {/* Left: Hamburger, Page Title & Executive Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#006838] hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer border border-slate-200/80 shadow-2xs shrink-0"
          title="Mở / Thu gọn menu điều hướng"
        >
          <IconMenu2 size={20} />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
              {title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#006838] border border-emerald-200/80 text-[10px] font-extrabold shrink-0">
              <IconSparkles size={11} className="text-emerald-600" />
              <span>Gemba.Pro v2.5</span>
            </span>
          </div>

          {/* Linked Breadcrumb: Home -> Work Hub -> Gemba */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-0.5 truncate">
            <Link href="/" title="Về trang chủ TBS Group" className="hover:text-[#006838] flex items-center gap-1 transition-colors">
              <IconHome size={13} className="text-slate-400" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/work" title="Về Hub 10 Ứng Dụng (/work)" className="hover:text-[#006838] font-bold text-slate-700 transition-colors">
              Văn phòng Chuỗi SKECHERS
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#006838] font-bold truncate">{breadcrumb}</span>
          </div>
        </div>
      </div>

      {/* Right: Work Hub Link, Grid launcher, Fullscreen, Clock & Notification */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Back to /work button */}
        <Link
          href="/work"
          title="Quay lại Hub 10 App (/work)"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#006838] text-[#006838] hover:text-white border border-emerald-200/80 text-xs font-bold transition-all shadow-2xs group"
        >
          <IconArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Work Hub</span>
        </Link>

        {/* Grid 9-dots icon launcher linking to /work */}
        <Link
          href="/work"
          className="hidden sm:flex min-w-[38px] min-h-[38px] w-9.5 h-9.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs items-center justify-center"
          title="Danh mục ứng dụng & Trang chủ (/work)"
        >
          <IconGridDots size={19} />
        </Link>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="hidden sm:flex min-w-[38px] min-h-[38px] w-9.5 h-9.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs items-center justify-center cursor-pointer"
          title="Toàn màn hình"
        >
          <IconMaximize size={19} />
        </button>

        {/* Realtime Clock Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <IconClock size={14} className="text-slate-500" />
          <span className="tabular-nums font-mono text-[11.5px] text-slate-800">{timeStr || "14:32:32 — 07/09/2026"}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all relative cursor-pointer border border-slate-200/80 shadow-2xs">
            <IconBell size={19} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9.5px] font-black flex items-center justify-center border-2 border-white shadow-2xs animate-bounce">
              2
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}


