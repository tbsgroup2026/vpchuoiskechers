"use client";

import React from "react";
import {
  IconDashboard,
  IconBuildingFactory,
  IconChartBar,
  IconFileText,
  IconTool,
  IconUsers,
  IconShieldCheck,
  IconHelpCircle,
  IconLayersIntersect,
  IconSparkles,
  IconReportAnalytics,
  IconBulb,
  IconClipboardCheck,
  IconRocket,
} from "@tabler/icons-react";

export interface MenuItem {
  id: string;
  label: string;
  subLabel?: string;
  icon?: React.ElementType;
  isActive: boolean;
  disabledReason?: string;
  onClick?: () => void;
}

interface CircularMenuProps {
  items: MenuItem[];
  onCenterClick?: () => void;
  centerTotalCount?: number;
}

export default function CircularMenu({
  items,
  onCenterClick,
  centerTotalCount = 398,
}: CircularMenuProps) {
  const totalNodes = items.length;

  return (
    <div className="relative w-full max-w-4xl mx-auto py-8 px-4 flex flex-col items-center">
      {/* ════════════════════════════════════════════════════════════════
          DESKTOP RADIAL LAYOUT (Visible on lg screens ≥1024px)
         ════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block relative w-[680px] h-[680px] my-4">
        {/* Dashed background circle */}
        <div className="absolute inset-16 rounded-full border-2 border-dashed border-[#2fd39a]/20 animate-spin-slow pointer-events-none" />
        <div className="absolute inset-28 rounded-full border border-white/5 pointer-events-none" />

        {/* Center Node (Dashboard Popup Trigger) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <button
            onClick={onCenterClick}
            className="group relative w-44 h-44 rounded-full bg-gradient-to-br from-[#0f4133] via-[#08221a] to-[#0d2419] border-2 border-[#2fd39a] p-1 shadow-2xl shadow-emerald-950/80 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="absolute inset-0 rounded-full bg-[#2fd39a]/10 animate-ping opacity-30 pointer-events-none" />
            <div className="w-10 h-10 rounded-full bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <IconChartBar size={22} />
            </div>
            <span className="text-[10px] font-extrabold text-[#f2dc9a] uppercase tracking-wider">
              DASHBOARD tổng
            </span>
            <span className="text-3xl font-black font-mono text-white tracking-tight my-0.5">
              {centerTotalCount}
            </span>
            <span className="text-[9px] text-gray-300 font-bold bg-[#2fd39a]/20 px-2 py-0.5 rounded-full border border-[#2fd39a]/30">
              Cải tiến khu vực
            </span>
          </button>
        </div>

        {/* 14 Circular Nodes Positioned by Angle */}
        {items.map((node, index) => {
          // Calculate angle for 14 nodes around circle
          const angle = (index * 360) / totalNodes - 90; // Start top (-90deg)
          const radius = 270; // radius in px
          const radians = (angle * Math.PI) / 180;
          const x = radius * Math.cos(radians);
          const y = radius * Math.sin(radians);

          const IconComponent = node.icon || IconSparkles;

          return (
            <div
              key={node.id}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              className="absolute top-1/2 left-1/2 -ml-16 -mt-8 z-10"
            >
              {node.isActive ? (
                <button
                  onClick={node.onClick}
                  className="group w-32 h-16 rounded-2xl bg-gradient-to-br from-[#0f4133] to-[#08221a] border border-[#2fd39a]/60 shadow-lg hover:border-[#2fd39a] hover:shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-200 p-2 flex items-center gap-2 text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <IconComponent size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-bold text-white group-hover:text-[#2fd39a] transition-colors block truncate leading-tight">
                      {node.label}
                    </span>
                    {node.subLabel && (
                      <span className="text-[9px] text-[#f2dc9a] font-mono block truncate">
                        {node.subLabel}
                      </span>
                    )}
                  </div>
                </button>
              ) : (
                /* Disabled / Sắp ra mắt Node */
                <div className="w-32 h-16 rounded-2xl bg-white/[0.03] border border-white/10 opacity-40 p-2 flex items-center gap-2 text-left cursor-not-allowed select-none">
                  <div className="w-8 h-8 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center flex-shrink-0">
                    <IconComponent size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-semibold text-gray-300 block truncate leading-tight">
                      {node.label}
                    </span>
                    <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest block truncate">
                      Sắp ra mắt
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>


      {/* ════════════════════════════════════════════════════════════════
          MOBILE / TABLET GRID LAYOUT (<1024px)
          Touch targets ≥44px, comfortable spacing
         ════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden w-full space-y-6">
        {/* Mobile Center Summary Card */}
        <button
          onClick={onCenterClick}
          className="w-full p-5 rounded-3xl bg-gradient-to-r from-[#0f4133] via-[#08221a] to-[#0d2419] border-2 border-[#2fd39a] shadow-xl text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center">
              <IconChartBar size={26} />
            </div>
            <div>
              <span className="text-xs font-extrabold text-[#f2dc9a] uppercase tracking-wider block">
                DASHBOARD Tổng Khu Vực
              </span>
              <span className="text-2xl font-black font-mono text-white">
                {centerTotalCount} Cải Tiến
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-[#2fd39a] bg-[#2fd39a]/10 px-3 py-1.5 rounded-full border border-[#2fd39a]/30">
            Xem Donut Chart →
          </span>
        </button>

        {/* 14 Nodes Grid (2 cols mobile, 3 cols tablet) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {items.map((node) => {
            const IconComponent = node.icon || IconSparkles;
            return node.isActive ? (
              <button
                key={node.id}
                onClick={node.onClick}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0f4133] to-[#08221a] border border-[#2fd39a]/40 shadow-md text-left flex items-center gap-3 min-h-[52px] active:scale-95 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center flex-shrink-0">
                  <IconComponent size={18} />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    {node.label}
                  </span>
                  {node.subLabel && (
                    <span className="text-[10px] text-[#f2dc9a] font-mono block truncate">
                      {node.subLabel}
                    </span>
                  )}
                </div>
              </button>
            ) : (
              <div
                key={node.id}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 opacity-45 text-left flex items-center gap-3 min-h-[52px] cursor-not-allowed select-none"
              >
                <div className="w-8 h-8 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center flex-shrink-0">
                  <IconComponent size={18} />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-semibold text-gray-300 block truncate leading-tight">
                    {node.label}
                  </span>
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                    Sắp ra mắt
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
