"use client";

import React from "react";
import { ParetoErrorItem, QualityKPIs } from "../types";
import { IconChartPie, IconChartBar, IconClockCheck, IconFlame, IconCheck, IconAlertTriangle } from "@tabler/icons-react";

interface QualityChartsProps {
  kpis: QualityKPIs;
  paretoErrors: ParetoErrorItem[];
}

export default function QualityCharts({ kpis, paretoErrors }: QualityChartsProps) {
  const totalIncidents =
    kpis.unprocessed + kpis.processing + kpis.trialRun + kpis.completed;

  // Donut chart calculations
  const donutData = [
    { label: "Hoàn thành", count: kpis.completed, color: "#10b981", percent: ((kpis.completed / totalIncidents) * 100).toFixed(1) },
    { label: "Chưa xử lý", count: kpis.unprocessed, color: "#f59e0b", percent: ((kpis.unprocessed / totalIncidents) * 100).toFixed(1) },
    { label: "Đang xử lý", count: kpis.processing, color: "#3b82f6", percent: ((kpis.processing / totalIncidents) * 100).toFixed(1) },
    { label: "Chạy thử", count: kpis.trialRun, color: "#a855f7", percent: ((kpis.trialRun / totalIncidents) * 100).toFixed(1) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Phân bố sự cố (Donut Chart - 4 cols) */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006838] flex items-center justify-center">
              <IconChartPie size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Phân Bố Sự Cố</h4>
              <p className="text-[11px] text-slate-500 font-medium">Tình trạng xử lý KG1</p>
            </div>
          </div>
          <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
            {totalIncidents} Vụ
          </span>
        </div>

        {/* Circular Donut Visual */}
        <div className="flex items-center justify-center py-2 relative">
          <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="12"
            />
            {/* Segments */}
            {(() => {
              let accumulatedPercent = 0;
              return donutData.map((item, idx) => {
                const p = parseFloat(item.percent);
                const strokeDasharray = `${p * 2.387} 238.7`;
                const strokeDashoffset = `-${accumulatedPercent * 2.387}`;
                accumulatedPercent += p;
                return (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 hover:opacity-80"
                  />
                );
              });
            })()}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-black text-slate-900">{kpis.completed}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              ĐÃ XỬ LÝ
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          {donutData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] font-bold text-slate-600 truncate">{item.label}</span>
              </div>
              <span className="font-black text-slate-900 ml-1">{item.count.toString().padStart(2, "0")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top 5 Lỗi Chất Lượng Pareto (4 cols) */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <IconChartBar size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Pareto Top 5 Lỗi</h4>
              <p className="text-[11px] text-slate-500 font-medium">20% nguyên nhân tạo 80% lỗi</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            Trọng yếu
          </span>
        </div>

        {/* Progress Bars List */}
        <div className="space-y-2.5 py-1">
          {paretoErrors.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 truncate">{item.name}</span>
                <span className="text-slate-900 font-black">{item.percentage}% ({item.count} vụ)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 font-medium flex items-center gap-2">
          <IconAlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
          <span>Cần tập trung cải tiến <strong>Đường may</strong> & <strong>Dán đế</strong> để giảm 56% lỗi.</span>
        </div>
      </div>

      {/* 3. SLA Xử Lý Sự Cố (4 cols) */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <IconClockCheck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">SLA Xử Lý Sự Cố</h4>
              <p className="text-[11px] text-slate-500 font-medium">Cam kết chuẩn 2 giờ</p>
            </div>
          </div>
          <span className="text-[10px] font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            2H SLA
          </span>
        </div>

        {/* Large SLA Indicator */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#e6f4ed] to-emerald-50 border border-emerald-200/80 text-center space-y-1">
          <div className="text-3xl sm:text-4xl font-black text-[#006838] tracking-tight">
            92.4%
          </div>
          <div className="text-xs font-bold text-[#004d29]">
            Tỷ lệ xử lý sự cố trong vòng 2 giờ
          </div>
          <div className="text-[10px] text-emerald-800/80 font-medium">
            Mục tiêu chuỗi SKECHERS: ≥ 90%
          </div>
        </div>

        {/* Sub Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-500 font-semibold">MTTR</div>
            <div className="text-xs font-black text-slate-900 mt-0.5">38 phút</div>
          </div>

          <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
            <div className="text-[10px] text-rose-600 font-semibold">Quá SLA</div>
            <div className="text-xs font-black text-rose-700 mt-0.5">02 vụ</div>
          </div>

          <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
            <div className="text-[10px] text-amber-700 font-semibold">Chờ xử lý</div>
            <div className="text-xs font-black text-amber-800 mt-0.5">{kpis.unprocessed} vụ</div>
          </div>
        </div>
      </div>
    </div>
  );
}
