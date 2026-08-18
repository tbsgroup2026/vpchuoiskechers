"use client";

import React from "react";
import { QualityKPIs } from "../types";
import {
  IconInbox,
  IconLoader2,
  IconPlayerPlay,
  IconCircleCheck,
  IconFlame,
  IconClock,
  IconAlertCircle,
} from "@tabler/icons-react";

interface QualityKG1KPIsProps {
  kpis: QualityKPIs;
  onFilterClick?: (status: string) => void;
}

export default function QualityKG1KPIs({ kpis, onFilterClick }: QualityKG1KPIsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* KPI 01: Sự cố chưa xử lý */}
      <div
        onClick={() => onFilterClick && onFilterClick("unprocessed")}
        className="p-4 rounded-2xl bg-white border border-amber-200/90 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <IconInbox size={18} />
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 text-[10px] font-black tracking-wider flex items-center gap-1">
            <IconClock size={11} />
            15 phút SLA
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {kpis.unprocessed.toString().padStart(2, "0")}
          </div>
          <div className="text-xs font-black text-amber-800 mt-0.5">
            01 – Sự cố chưa xử lý
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Cần tiếp nhận & phân bổ
          </div>
        </div>
      </div>

      {/* KPI 02: Đang xử lý */}
      <div
        onClick={() => onFilterClick && onFilterClick("processing")}
        className="p-4 rounded-2xl bg-white border border-blue-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
          <IconLoader2 size={18} className="animate-spin-slow" />
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {kpis.processing.toString().padStart(2, "0")}
          </div>
          <div className="text-xs font-black text-blue-800 mt-0.5">
            02 – Đang xử lý
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Đang điều tra / khắc phục
          </div>
        </div>
      </div>

      {/* KPI 03: Chạy thử */}
      <div
        onClick={() => onFilterClick && onFilterClick("trial")}
        className="p-4 rounded-2xl bg-white border border-purple-200/90 shadow-2xs hover:shadow-md hover:border-purple-400 transition-all cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
          <IconPlayerPlay size={18} />
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {kpis.trialRun.toString().padStart(2, "0")}
          </div>
          <div className="text-xs font-black text-purple-800 mt-0.5">
            03 – Chạy thử
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Theo dõi 3h – 48h
          </div>
        </div>
      </div>

      {/* KPI 04: Đã hoàn thành */}
      <div
        onClick={() => onFilterClick && onFilterClick("completed")}
        className="p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center group-hover:scale-105 transition-transform">
          <IconCircleCheck size={18} />
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {kpis.completed}
          </div>
          <div className="text-xs font-black text-[#006838] mt-0.5">
            04 – Đã hoàn thành
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Đã nghiệm thu đạt chuẩn
          </div>
        </div>
      </div>

      {/* KPI 05: SOS Khẩn cấp (Màu đỏ cảnh báo đặc biệt) */}
      <div
        onClick={() => onFilterClick && onFilterClick("sos")}
        className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-950/20 hover:shadow-lg hover:from-rose-600 hover:to-red-700 transition-all cursor-pointer group relative overflow-hidden ring-2 ring-rose-300/50"
      >
        <div className="absolute -right-2 -bottom-2 opacity-20 pointer-events-none">
          <IconFlame size={80} />
        </div>

        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
            <IconAlertCircle size={18} />
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black tracking-wider uppercase animate-pulse">
            CẤP BÁCH
          </span>
        </div>

        <div className="mt-3 relative z-10">
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {kpis.emergencySOS.toString().padStart(2, "0")}
          </div>
          <div className="text-xs font-black text-rose-100 mt-0.5">
            05 – SOS khẩn cấp
          </div>
          <div className="text-[11px] text-rose-100/90 font-medium mt-0.5">
            Cần xử lý ngay lập tức
          </div>
        </div>
      </div>
    </div>
  );
}
