'use client';

import React, { useState } from 'react';
import { formatVnNumber, TBS_BRAND } from './chartTheme';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

export interface BarChartDataItem {
  label: string;
  value: number;
  secondaryValue?: number; // e.g. target or planned value
  color?: string;
  subLabel?: string;
}

export interface BarChartCardProps {
  title: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  data: BarChartDataItem[];
  headerAction?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyText?: string;
  className?: string;
  height?: number; // height of chart area (default: 220)
  primaryLegend?: string;
  secondaryLegend?: string;
  unit?: string;
}

export default function BarChartCard({
  title,
  icon: HeaderIcon,
  data = [],
  headerAction,
  loading = false,
  error = null,
  onRetry,
  emptyText = 'Chưa có dữ liệu thống kê trong kỳ này',
  className = '',
  height = 220,
  primaryLegend = 'Thực tế',
  secondaryLegend,
  unit = '',
}: BarChartCardProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (loading) {
    return (
      <div className={`bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between animate-pulse ${className}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-200" />
            <div className="h-4 w-36 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="h-52 w-full bg-slate-100 rounded-2xl my-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-3xl p-6 border border-rose-200 shadow-xs flex flex-col justify-between ${className}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            {HeaderIcon && (
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006838] border border-emerald-100 flex items-center justify-center">
                <HeaderIcon size={18} />
              </div>
            )}
            <span>{title}</span>
          </h3>
        </div>
        <div className="py-12 text-center space-y-3">
          <IconAlertCircle size={32} className="text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-bold">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <IconRefresh size={14} />
              <span>Thử lại</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.value || 0, d.secondaryValue || 0]),
    1
  );

  return (
    <div className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between min-w-0 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          {HeaderIcon && (
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006838] border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
              <HeaderIcon size={18} className="stroke-[2.2]" />
            </div>
          )}
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide truncate">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {secondaryLegend && (
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#006838]" />
                <span>{primaryLegend}</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
                <span>{secondaryLegend}</span>
              </span>
            </div>
          )}
          {headerAction}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 font-medium">
          {emptyText}
        </div>
      ) : (
        /* Bar Chart Area */
        <div className="pt-4 sm:pt-6 my-auto">
          <div
            className="w-full flex items-end gap-2 sm:gap-3 px-2 pb-2 border-b border-slate-200"
            style={{ height }}
          >
            {data.map((item, idx) => {
              const primaryHeight = Math.max(4, (item.value / maxVal) * 100);
              const secondaryHeight = item.secondaryValue !== undefined ? Math.max(4, (item.secondaryValue / maxVal) * 100) : null;
              const isHovered = hoveredIdx === idx;
              const barColor = item.color || TBS_BRAND.primary;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Floating Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap pointer-events-none transform -translate-y-1 transition-transform animate-in fade-in duration-150">
                      <div>{item.label}</div>
                      <div className="text-emerald-300 font-mono">
                        {formatVnNumber(item.value)} {unit}
                        {item.secondaryValue !== undefined && ` / KH: ${formatVnNumber(item.secondaryValue)}`}
                      </div>
                    </div>
                  )}

                  {/* Bars Container */}
                  <div className="w-full max-w-[48px] flex items-end justify-center gap-1 h-full">
                    {/* Primary Bar */}
                    <div
                      className="w-full rounded-t-xl transition-all duration-300 relative"
                      style={{
                        height: `${primaryHeight}%`,
                        backgroundColor: barColor,
                        opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                        boxShadow: isHovered ? '0 4px 12px rgba(0, 104, 56, 0.3)' : 'none',
                      }}
                    >
                      {/* Top Value Label */}
                      <span className="hidden sm:block absolute -top-5 inset-x-0 text-center text-[10px] font-black text-slate-700">
                        {formatVnNumber(item.value)}
                      </span>
                    </div>

                    {/* Secondary Bar (Target / Planned) */}
                    {secondaryHeight !== null && (
                      <div
                        className="w-full rounded-t-xl bg-slate-300 transition-all duration-300 relative"
                        style={{
                          height: `${secondaryHeight}%`,
                          opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X Axis Labels */}
          <div className="w-full flex gap-2 sm:gap-3 px-2 pt-2">
            {data.map((item, idx) => (
              <div
                key={idx}
                className="flex-1 text-center min-w-0"
                title={item.label}
              >
                <div className="text-[11px] font-bold text-slate-600 truncate">
                  {item.label}
                </div>
                {item.subLabel && (
                  <div className="text-[9px] text-slate-400 font-medium truncate">
                    {item.subLabel}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
