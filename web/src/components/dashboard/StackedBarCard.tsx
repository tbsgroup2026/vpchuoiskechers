'use client';

import React, { useState } from 'react';
import { formatVnNumber, formatVnPercent, getStableColor } from './chartTheme';
import { IconAlertCircle } from '@tabler/icons-react';

export interface StackedSegment {
  name: string;
  value: number;
  color?: string;
}

export interface StackedBarGroup {
  groupLabel: string;
  subLabel?: string;
  segments: StackedSegment[];
}

export interface StackedBarCardProps {
  title: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  data: StackedBarGroup[];
  headerAction?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  className?: string;
  unit?: string;
}

export default function StackedBarCard({
  title,
  icon: HeaderIcon,
  data = [],
  headerAction,
  loading = false,
  error = null,
  emptyText = 'Chưa có dữ liệu phân bổ',
  className = '',
  unit = '',
}: StackedBarCardProps) {
  const [hoveredSegment, setHoveredSegment] = useState<{ groupIdx: number; segIdx: number } | null>(null);

  if (loading) {
    return (
      <div className={`bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between animate-pulse ${className}`}>
        <div className="h-4 w-36 bg-slate-200 rounded pb-4" />
        <div className="space-y-4 my-4">
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-3xl p-6 border border-rose-200 shadow-xs ${className}`}>
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          {HeaderIcon && <HeaderIcon size={18} className="text-[#006838]" />}
          <h3 className="text-sm font-black text-slate-900 uppercase">{title}</h3>
        </div>
        <div className="py-8 text-center text-xs text-rose-600 font-bold flex items-center justify-center gap-2">
          <IconAlertCircle size={16} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Collect all unique segment labels for the top legend
  const allSegmentNames = Array.from(
    new Set(data.flatMap((g) => g.segments.map((s) => s.name)))
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
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {data.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 font-medium">{emptyText}</div>
      ) : (
        <div className="space-y-4 pt-4 my-auto">
          {/* Top Segment Legend */}
          <div className="flex flex-wrap gap-3 pb-2 border-b border-slate-50">
            {allSegmentNames.map((name, i) => (
              <span key={name} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getStableColor(name, i) }}
                />
                <span>{name}</span>
              </span>
            ))}
          </div>

          {/* Groups list */}
          <div className="space-y-3.5">
            {data.map((group, gIdx) => {
              const groupTotal = group.segments.reduce((sum, s) => sum + s.value, 0);

              return (
                <div key={group.groupLabel + gIdx} className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-800">{group.groupLabel}</span>
                    <span className="font-extrabold text-slate-900">
                      {formatVnNumber(groupTotal)} {unit}
                    </span>
                  </div>

                  {/* Horizontal Stacked Bar */}
                  <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
                    {group.segments.map((seg, sIdx) => {
                      if (seg.value <= 0) return null;
                      const pct = groupTotal > 0 ? (seg.value / groupTotal) * 100 : 0;
                      const segColor = seg.color || getStableColor(seg.name, sIdx);
                      const isHovered =
                        hoveredSegment?.groupIdx === gIdx && hoveredSegment?.segIdx === sIdx;

                      return (
                        <div
                          key={seg.name + sIdx}
                          onMouseEnter={() => setHoveredSegment({ groupIdx: gIdx, segIdx: sIdx })}
                          onMouseLeave={() => setHoveredSegment(null)}
                          className="h-full relative group transition-all duration-200 cursor-pointer"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: segColor,
                            opacity: hoveredSegment && !isHovered ? 0.6 : 1,
                          }}
                          title={`${seg.name}: ${formatVnNumber(seg.value)} (${formatVnPercent(pct)})`}
                        >
                          {pct > 12 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white px-1 truncate pointer-events-none drop-shadow-xs">
                              {formatVnNumber(seg.value)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
