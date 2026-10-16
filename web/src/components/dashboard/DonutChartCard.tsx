'use client';

import React, { useState, useMemo } from 'react';
import { formatVnNumber, formatVnPercent, getStableColor } from './chartTheme';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

export interface DonutDataItem {
  key?: string;
  label: string;
  value: number;
  color?: string;
  percent?: number;
}

export interface DonutChartCardProps {
  /** Title in header (e.g. "TỔNG CẢI TIẾN") */
  title: string;
  /** Header icon component */
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  /** Center hole brand label (defaults to "TBS GROUP") */
  centerBrand?: string;
  /** Center hole subtitle description (defaults to title) */
  centerSubtitle?: string;
  /** Center total override (if not provided, sum of items is used) */
  centerTotal?: number | string;
  /** Breakdown data array (alias: breakdown) */
  data?: DonutDataItem[];
  breakdown?: DonutDataItem[];
  centerLabel?: string;
  /** Optional header right action (e.g. filter dropdowns, buttons) */
  headerAction?: React.ReactNode;
  /** Loading state skeleton */
  loading?: boolean;
  /** Error message or state */
  error?: string | null;
  /** Retry callback if error occurred */
  onRetry?: () => void;
  /** Empty state message */
  emptyText?: string;
  /** Card wrapper className */
  className?: string;
  /** Donut size in pixels (default: 230) */
  donutSize?: number;
  /** Donut stroke thickness (default: 32) */
  strokeWidth?: number;
  /** Max items in legend before showing "Khác" (optional) */
  maxLegendItems?: number;
  maxLegendRows?: number;
}

export default function DonutChartCard({
  title,
  icon: HeaderIcon,
  centerBrand = 'TBS GROUP',
  centerLabel,
  centerSubtitle,
  centerTotal,
  data = [],
  breakdown,
  headerAction,
  loading = false,
  error = null,
  onRetry,
  emptyText = 'Chưa có dữ liệu thống kê trong kỳ này',
  className = '',
  donutSize = 230,
  strokeWidth = 32,
  maxLegendItems = 16,
}: DonutChartCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const effectiveBrand = centerLabel || centerBrand;
  const rawList = (data && data.length > 0) ? data : (breakdown || []);

  // 1. Process & sort data descending
  const processedData = useMemo(() => {
    if (!rawList || !Array.isArray(rawList)) return [];
    
    // Sort descending by value
    const sorted = [...rawList]
      .filter((item) => item && typeof item.value === 'number' && item.value > 0)
      .sort((a, b) => b.value - a.value);

    const totalVal = sorted.reduce((sum, item) => sum + item.value, 0);

    return sorted.slice(0, maxLegendItems).map((item, index) => {
      const pct = totalVal > 0 ? (item.value / totalVal) * 100 : 0;
      const color = item.color || getStableColor(item.label, index);
      return {
        ...item,
        percent: item.percent !== undefined ? item.percent : pct,
        color,
      };
    });
  }, [rawList, maxLegendItems]);

  const totalCalculated = useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.value, 0);
  }, [processedData]);

  const displayTotal = centerTotal !== undefined ? centerTotal : totalCalculated;
  const subtitleText = centerSubtitle || title;

  // Geometry calculations for crisp SVG donut
  const size = donutSize;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Compute strokeDasharray and strokeDashoffset for each segment
  const segments = useMemo(() => {
    let accumulatedAngle = 0;
    return processedData.map((item, index) => {
      const fraction = totalCalculated > 0 ? item.value / totalCalculated : 0;
      const strokeLength = fraction * circumference;
      const strokeOffset = -accumulatedAngle;
      accumulatedAngle += strokeLength;

      return {
        ...item,
        index,
        strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
        strokeDashoffset: strokeOffset,
        fraction,
      };
    });
  }, [processedData, totalCalculated, circumference]);

  // Loading skeleton
  if (loading) {
    return (
      <div className={`bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between animate-pulse ${className}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-200" />
            <div className="h-4 w-36 bg-slate-200 rounded" />
          </div>
          <div className="h-8 w-24 bg-slate-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6">
          <div className="md:col-span-5 flex justify-center">
            <div className="w-52 h-52 rounded-full border-8 border-slate-100 flex items-center justify-center">
              <div className="w-20 h-6 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
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

  return (
    <div className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between min-w-0 ${className}`}>
      {/* ════════════════════════════════════════════════════════════════
          1. CARD HEADER (Bo góc xanh + Tiêu đề IN HOA đậm)
         ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          {HeaderIcon && (
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006838] border border-emerald-100/90 flex items-center justify-center shrink-0 shadow-2xs">
              <HeaderIcon size={18} className="stroke-[2.2]" />
            </div>
          )}
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide truncate">
            {title}
          </h3>
        </div>

        {headerAction && (
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          2. EMPTY STATE
         ════════════════════════════════════════════════════════════════ */}
      {processedData.length === 0 ? (
        <div className="py-14 text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            {HeaderIcon ? <HeaderIcon size={26} /> : <span className="text-xl">📊</span>}
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            {emptyText}
          </p>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════
            3. MAIN BODY: Donut Left (5 cols) & 2-Column Legend Right (7 cols)
           ════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto pt-4 sm:pt-6">
          {/* Left Column: Donut Chart with Center Hole */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div
              className="relative flex items-center justify-center"
              style={{ width: size, height: size }}
            >
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
              >
                {/* Background Ring */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth={strokeWidth}
                />

                {/* Slices */}
                {segments.map((seg) => {
                  const isHovered = hoveredIndex === seg.index;
                  return (
                    <circle
                      key={seg.label + seg.index}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="transition-all duration-200 cursor-pointer"
                      style={{
                        opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                        filter: isHovered ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' : 'none',
                      }}
                      onMouseEnter={() => setHoveredIndex(seg.index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Hole Information Layer */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                <span className="text-[11px] font-black uppercase text-[#006838] tracking-widest leading-none mb-1">
                  {effectiveBrand}
                </span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none font-sans">
                  {formatVnNumber(displayTotal)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-1 truncate max-w-[140px]">
                  {subtitleText}
                </span>
              </div>
            </div>

            {/* Hover Tooltip Overlay underneath donut on mobile */}
            {hoveredIndex !== null && processedData[hoveredIndex] && (
              <div className="mt-2 text-center text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full animate-in fade-in duration-150 lg:hidden">
                <span className="font-bold">{processedData[hoveredIndex].label}:</span>{' '}
                <span className="font-black text-slate-900">
                  {formatVnNumber(processedData[hoveredIndex].value)}
                </span>{' '}
                <span className="text-[#006838] font-bold">
                  ({formatVnPercent(processedData[hoveredIndex].percent)})
                </span>
              </div>
            )}
          </div>

          {/* Right Column: 2-Column Structured Legend */}
          <div className="lg:col-span-7 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5">
              {processedData.map((item, index) => {
                const isHovered = hoveredIndex === index;
                const formattedPercent = formatVnPercent(item.percent);

                return (
                  <div
                    key={item.label + index}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    title={`${item.label}: ${formatVnNumber(item.value)} (${formattedPercent})`}
                    className={`p-1.5 -m-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
                      isHovered ? 'bg-slate-100/90 shadow-2xs' : 'hover:bg-slate-50'
                    }`}
                    style={{
                      opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                    }}
                  >
                    {/* Row 1: Colored Dot + Group Name (truncated with ...) */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs transition-transform duration-150"
                        style={{
                          backgroundColor: item.color,
                          transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                        }}
                      />
                      <span className="text-xs font-bold text-slate-700 truncate min-w-0 flex-1">
                        {item.label}
                      </span>
                    </div>

                    {/* Row 2: Value bold + Percent in parentheses in green */}
                    <div className="pl-4.5 text-xs flex items-baseline gap-1 mt-0.5">
                      <span className="font-extrabold text-slate-900 font-sans">
                        {formatVnNumber(item.value)}
                      </span>
                      <span className="font-bold text-[#006838] text-[11px] font-sans">
                        ({formattedPercent})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
