'use client';

import React from 'react';
import Link from 'next/link';
import { formatVnNumber } from './chartTheme';
import { IconArrowUp, IconArrowDown, IconMinus } from '@tabler/icons-react';

export interface KpiCardProps {
  /** Main KPI title (e.g. "Sản Lượng PPH Nhà Máy") */
  title: string;
  /** Primary metric value (formatted with Vietnamese thousand separators) */
  value: number | string | null | undefined;
  /** Subtitle text below the value (e.g. "Sản lượng tháng này") */
  subtitle?: string;
  /** Icon component (Tabler icon) */
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  /** Change percentage compared to previous period (e.g. 18.2 or -18.2 or "+18.2%") */
  changePercent?: number | string | null;
  /** Direction override or auto-calculated from changePercent */
  trendDirection?: 'up' | 'down' | 'neutral';
  /** If true, decrease is GOOD (green) and increase is BAD (red) - e.g. for machine breakdown or incidents */
  invertTrend?: boolean;
  /** Optional link navigation when card is clicked */
  href?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Loading state skeleton */
  loading?: boolean;
  /** Extra class names */
  className?: string;
  /** Custom badge text instead of percent (e.g. "Mục tiêu 100%") */
  customBadge?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  changePercent,
  trendDirection,
  invertTrend = false,
  href,
  onClick,
  loading = false,
  className = '',
  customBadge,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4 animate-pulse min-h-[108px] ${className}`}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
          <div className="space-y-2 min-w-0 flex-1">
            <div className="h-3 w-28 bg-slate-200 rounded" />
            <div className="h-7 w-20 bg-slate-200 rounded" />
            <div className="h-2.5 w-36 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-5 w-14 bg-slate-100 rounded-full shrink-0" />
      </div>
    );
  }

  // Parse trend numeric value & direction
  let numericTrend: number | null = null;
  let direction: 'up' | 'down' | 'neutral' = trendDirection || 'neutral';

  if (typeof changePercent === 'number') {
    numericTrend = changePercent;
    if (!trendDirection) {
      if (changePercent > 0) direction = 'up';
      else if (changePercent < 0) direction = 'down';
      else direction = 'neutral';
    }
  } else if (typeof changePercent === 'string') {
    const cleaned = changePercent.replace(/[+%\s]/g, '');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      numericTrend = parsed;
      if (!trendDirection) {
        if (changePercent.includes('↑') || parsed > 0) direction = 'up';
        else if (changePercent.includes('↓') || parsed < 0) direction = 'down';
        else direction = 'neutral';
      }
    }
  }

  // Calculate colors based on invertTrend
  // Standard: UP is GOOD (green), DOWN is BAD (red)
  // Invert: DOWN is GOOD (green), UP is BAD (red)
  const isPositiveGood = !invertTrend;
  const isGood = direction === 'up' ? isPositiveGood : direction === 'down' ? !isPositiveGood : true;

  const trendColorClass =
    direction === 'neutral'
      ? 'text-slate-500'
      : isGood
      ? 'text-[#006838]' // TBS Green
      : 'text-rose-600'; // Alert Red

  const trendText =
    customBadge ||
    (numericTrend !== null
      ? `${Math.abs(numericTrend).toFixed(1)}%`
      : typeof changePercent === 'string'
      ? changePercent
      : null);

  const formattedValue = formatVnNumber(value);

  const cardContent = (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-4 min-w-0 ${
        href || onClick ? 'cursor-pointer hover:border-emerald-300' : ''
      } ${className}`}
    >
      {/* Left Icon + Text Block */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Rounded square box: light green background, dark green icon */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-50/90 text-[#006838] border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
          <Icon size={24} className="stroke-[1.8]" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Small title, dark gray */}
          <div className="text-xs font-bold text-slate-600 truncate tracking-tight">
            {title}
          </div>

          {/* Large bold value in Vietnamese number formatting */}
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans tracking-tight leading-tight my-0.5">
            {formattedValue}
          </div>

          {/* Subtitle, light gray */}
          {subtitle && (
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right Trend Indicator */}
      {trendText && (
        <div className="shrink-0 flex items-center justify-end self-center pl-2">
          <div
            className={`flex items-center gap-1 text-xs font-bold font-sans ${trendColorClass}`}
          >
            {direction === 'up' && <IconArrowUp size={14} className="stroke-[2.5]" />}
            {direction === 'down' && <IconArrowDown size={14} className="stroke-[2.5]" />}
            {direction === 'neutral' && !customBadge && <IconMinus size={14} className="stroke-[2]" />}
            <span>{trendText}</span>
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
