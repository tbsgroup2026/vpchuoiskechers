'use client';

import React, { useState } from 'react';
import { formatVnNumber, TBS_BRAND } from './chartTheme';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

export interface LineChartPoint {
  label: string;
  value: number;
  sub?: string;
}

export interface LineChartCardProps {
  title: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  data: LineChartPoint[];
  headerAction?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyText?: string;
  className?: string;
  height?: number;
  unit?: string;
  lineColor?: string;
}

export default function LineChartCard({
  title,
  icon: HeaderIcon,
  data = [],
  headerAction,
  loading = false,
  error = null,
  onRetry,
  emptyText = 'Chưa có dữ liệu xu hướng',
  className = '',
  height = 200,
  unit = '',
  lineColor = TBS_BRAND.primary,
}: LineChartCardProps) {
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
        <div className="h-48 w-full bg-slate-100 rounded-2xl my-4" />
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

  const values = data.map((d) => d.value);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 100;
  const range = maxVal - minVal || 1;

  // Compute SVG Points for smooth spline
  const width = 600;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const points = data.map((item, idx) => {
    const x = paddingX + (data.length > 1 ? (idx / (data.length - 1)) * graphWidth : graphWidth / 2);
    const y = paddingY + graphHeight - ((item.value - minVal) / range) * graphHeight;
    return { ...item, x, y, idx };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cpX1 = prev.x + (p.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (p.x - prev.x) / 2;
        const cpY2 = p.y;
        return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
      }, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

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
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {data.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 font-medium">{emptyText}</div>
      ) : (
        /* SVG Line Chart */
        <div className="pt-4 my-auto relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible"
            style={{ maxHeight: height }}
          >
            <defs>
              <linearGradient id="tbsLineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f1f5f9" strokeDasharray="4 4" />
            <line x1={paddingX} y1={paddingY + graphHeight / 2} x2={width - paddingX} y2={paddingY + graphHeight / 2} stroke="#f1f5f9" strokeDasharray="4 4" />
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e2e8f0" />

            {/* Gradient Area Fill */}
            {areaD && <path d={areaD} fill="url(#tbsLineAreaGrad)" />}

            {/* Stroke Path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points */}
            {points.map((p) => {
              const isHovered = hoveredIdx === p.idx;
              return (
                <g key={p.idx} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(p.idx)} onMouseLeave={() => setHoveredIdx(null)}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 6 : 4}
                    fill={lineColor}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="transition-all duration-150"
                  />
                  {isHovered && (
                    <circle cx={p.x} cy={p.y} r={12} fill={lineColor} fillOpacity="0.15" />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <div
              className="absolute -top-4 z-20 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full animate-in fade-in duration-150"
              style={{ left: `${(points[hoveredIdx].x / width) * 100}%` }}
            >
              <div>{points[hoveredIdx].label}</div>
              <div className="text-emerald-300 font-mono">
                {formatVnNumber(points[hoveredIdx].value)} {unit}
              </div>
            </div>
          )}

          {/* X Axis labels */}
          <div className="flex justify-between px-3 pt-2 text-[11px] font-bold text-slate-500">
            {data.map((d, i) => (
              <span key={i} className="truncate max-w-[60px] text-center">
                {d.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
