"use client";

import React, { useState } from "react";
import FactorySelector from "./components/FactorySelector";
import FactoryInfoCard from "./components/FactoryInfoCard";
import QualityKG1KPIs from "./components/QualityKG1KPIs";
import QualityCharts from "./components/QualityCharts";
import IncidentList from "./components/IncidentList";
import { FACTORIES, KG1_KPIS, KG1_PARETO_ERRORS, KG1_INCIDENTS } from "./factoryConfig";
import { Factory } from "./types";
import {
  IconBuildingFactory2,
  IconGauge,
  IconAlertTriangle,
  IconCheck,
  IconArrowUpRight,
  IconExternalLink,
  IconShieldCheck,
  IconClock,
} from "@tabler/icons-react";

interface QualityModuleProps {
  onNavigateToApp?: (url: string) => void;
}

export default function QualityModule({ onNavigateToApp }: QualityModuleProps) {
  const [selectedFactory, setSelectedFactory] = useState<Factory>(FACTORIES[0]);

  return (
    <div className="space-y-4">
      {/* Top Controls Row: Section Header & Factory Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {selectedFactory.id === "all"
                ? "🛡️ Trung Tâm Quản Lý Chất Lượng (Toàn Chuỗi)"
                : `🛡️ Quản Lý Chất Lượng – ${selectedFactory.name}`}
            </h3>
            {selectedFactory.status === "live" && selectedFactory.id !== "all" && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {selectedFactory.code} LIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {selectedFactory.id === "all"
              ? "Giám sát chỉ số chất lượng, tỷ lệ đạt chuẩn QA/QC và OEE trên toàn bộ hệ thống nhà máy SKECHERS."
              : `Theo dõi chất lượng, sự cố và hiệu suất QC realtime tại ${selectedFactory.name}.`}
          </p>
        </div>

        {/* Factory Selector Dropdown */}
        <FactorySelector
          selectedFactoryId={selectedFactory.id}
          onSelectFactory={(f) => setSelectedFactory(f)}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          VIEW 1: NHÀ MÁY KIÊN GIANG 1 (KG1) VIEW
         ════════════════════════════════════════════════════════════════ */}
      {selectedFactory.id === "kg1" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 1. Factory Overview Banner Card with Portal CTA */}
          <FactoryInfoCard factory={selectedFactory} />

          {/* 2. 5 KPI Cards (Unprocessed, Processing, Trial, Completed, Emergency SOS) */}
          <QualityKG1KPIs kpis={KG1_KPIS} />

          {/* 3. Operational Charts (Donut Distribution, Pareto Top 5, 2H SLA Widget) */}
          <QualityCharts kpis={KG1_KPIS} paretoErrors={KG1_PARETO_ERRORS} />

          {/* 4. Realtime Incident Processing List */}
          <IncidentList
            incidents={KG1_INCIDENTS}
            portalUrl={selectedFactory.portalUrl}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 2: TOÀN CHUỖI SKECHERS (DEFAULT VIEW)
         ════════════════════════════════════════════════════════════════ */}
      {selectedFactory.id === "all" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Chain-Wide 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Tỷ Lệ Đạt Chuẩn (First Pass Yield)",
                val: "98.4%",
                trend: "+0.6%",
                sub: "Mục tiêu: ≥ 98.0%",
                color: "emerald",
              },
              {
                title: "Hiệu Suất Tổng Thể (OEE)",
                val: "92.4%",
                trend: "+1.2%",
                sub: "33 Dây chuyền toàn chuỗi",
                color: "blue",
              },
              {
                title: "Tỷ Lệ Sự Cố Khắc Phục ≤ 2H",
                val: "94.8%",
                trend: "+2.1%",
                sub: "Chuẩn SLA 2 giờ",
                color: "purple",
              },
              {
                title: "Tổng Sự Cố Đang Xử Lý",
                val: "20 Vụ",
                trend: "-5 vụ so với hôm qua",
                sub: "Kiên Giang (8), Bình Dương (12)",
                color: "amber",
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-[#006838] transition-all"
              >
                <span className="text-xs font-bold text-slate-500 block truncate">
                  {card.title}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {card.val}
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-[#006838] font-bold">{card.trend}</span>
                  <span className="text-slate-400 font-medium">{card.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Factories Quick Comparison Grid */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  🏭 Bảng Theo Dõi Trực Quan Các Nhà Máy
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Chọn một nhà máy để xem dashboard chi tiết và xử lý sự cố trực tiếp
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                2 Nhà máy kết nối
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Card KG1 */}
              <div
                onClick={() => setSelectedFactory(FACTORIES[1])}
                className="p-4.5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-300/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#006838] text-white flex items-center justify-center font-black">
                      KG1
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-900 group-hover:text-[#006838] transition-colors">
                        Nhà máy Kiên Giang 1
                      </h5>
                      <span className="text-[11px] text-slate-500 font-medium">
                        24 chuyền • Xưởng A, B, C
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#006838] text-[10px] font-black uppercase tracking-wider">
                    LIVE
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2 rounded-xl bg-white border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block">OEE</span>
                    <strong className="text-xs font-black text-emerald-800">98.2%</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block">Sự cố</span>
                    <strong className="text-xs font-black text-amber-700">12 vụ</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block">MTTR</span>
                    <strong className="text-xs font-black text-blue-700">38p</strong>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between text-xs font-bold text-[#006838] group-hover:translate-x-0.5 transition-transform">
                  <span>Mở Dashboard Nhà Máy KG1</span>
                  <IconArrowUpRight size={16} />
                </div>
              </div>

              {/* Card KG2 (Soon) */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs opacity-80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-black">
                      KG2
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-700">
                        Nhà máy Kiên Giang 2
                      </h5>
                      <span className="text-[11px] text-slate-400 font-medium">
                        16 chuyền sản xuất mới
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                    Kế hoạch
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 text-center">
                  Hệ thống đang tích hợp cổng kết nối sensor và D1 Database.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
