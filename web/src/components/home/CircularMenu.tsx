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
        {/* Simple dashed guide circle */}
        <div className="absolute inset-16 rounded-full border border-dashed border-slate-800 pointer-events-none" />
        <div className="absolute inset-28 rounded-full border border-slate-800/60 pointer-events-none" />

        {/* Center Node (Dashboard Popup Trigger) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <button
            onClick={onCenterClick}
            className="group relative w-44 h-44 rounded-full bg-slate-950 border-2 border-slate-700 p-2 shadow-xl hover:border-slate-500 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center mb-1 border border-slate-700">
              <IconChartBar size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Dashboard Tổng
            </span>
            <span className="text-3xl font-black font-mono text-slate-100 tracking-tight my-0.5">
              {centerTotalCount}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
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
                  className="group w-32 h-16 rounded-xl bg-slate-900 border border-slate-800 shadow-md hover:border-slate-600 hover:bg-slate-850 active:scale-95 transition-colors p-2.5 flex items-center gap-2.5 text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-700">
                    <IconComponent size={17} />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors block truncate leading-tight">
                      {node.label}
                    </span>
                    {node.subLabel && (
                      <span className="text-[9px] text-slate-400 font-mono block truncate">
                        {node.subLabel}
                      </span>
                    )}
                  </div>
                </button>
              ) : (
                /* Disabled / Sắp ra mắt Node */
                <div className="w-32 h-16 rounded-xl bg-slate-950/60 border border-slate-850 opacity-50 p-2.5 flex items-center gap-2.5 text-left cursor-not-allowed select-none">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-slate-500 flex items-center justify-center flex-shrink-0 border border-slate-800">
                    <IconComponent size={17} />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-medium text-slate-400 block truncate leading-tight">
                      {node.label}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">
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
      <div className="lg:hidden w-full space-y-4">
        {/* Mobile Center Summary Card */}
        <button
          onClick={onCenterClick}
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center border border-slate-700">
              <IconChartBar size={22} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Dashboard Tổng Khu Vực
              </span>
              <span className="text-xl font-bold font-mono text-slate-100">
                {centerTotalCount} Cải Tiến
              </span>
            </div>
          </div>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
            Xem Chi Tiết →
          </span>
        </button>

        {/* 14 Nodes Grid (2 cols mobile, 3 cols tablet) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((node) => {
            const IconComponent = node.icon || IconSparkles;
            return node.isActive ? (
              <button
                key={node.id}
                onClick={node.onClick}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left flex items-center gap-2.5 min-h-[48px] hover:border-slate-700 active:scale-95 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-700">
                  <IconComponent size={16} />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-medium text-slate-200 block truncate leading-tight">
                    {node.label}
                  </span>
                  {node.subLabel && (
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {node.subLabel}
                    </span>
                  )}
                </div>
              </button>
            ) : (
              <div
                key={node.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 opacity-50 text-left flex items-center gap-2.5 min-h-[48px] cursor-not-allowed select-none"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-slate-500 flex items-center justify-center flex-shrink-0 border border-slate-800">
                  <IconComponent size={16} />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-medium text-slate-400 block truncate leading-tight">
                    {node.label}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block">
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
