'use client';

import React from 'react';
import { formatVnNumber, formatVnPercent } from './chartTheme';
import { IconTarget, IconCircleCheck } from '@tabler/icons-react';

export interface ProgressCardProps {
  title: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  current: number;
  target: number;
  unit?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  loading?: boolean;
  className?: string;
  progressColor?: string;
}

export default function ProgressCard({
  title,
  icon: HeaderIcon = IconTarget,
  current,
  target,
  unit = '',
  subtitle,
  headerAction,
  loading = false,
  className = '',
  progressColor = '#006838',
}: ProgressCardProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs animate-pulse ${className}`}>
        <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
        <div className="h-6 w-24 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-full bg-slate-100 rounded-full" />
      </div>
    );
  }

  const percent = target > 0 ? Math.min(150, Math.round((current / target) * 100)) : 0;
  const isReached = percent >= 100;

  return (
    <div className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between min-w-0 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006838] border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
            <HeaderIcon size={18} className="stroke-[2.2]" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide truncate">
            {title}
          </h3>
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      <div className="pt-4 space-y-3 my-auto">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans">
              {formatVnNumber(current)}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {formatVnNumber(target)} {unit}
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold text-sm">
            <span style={{ color: progressColor }}>{formatVnPercent(percent, 0)}</span>
            {isReached && <IconCircleCheck size={16} className="text-[#006838]" />}
          </div>
        </div>

        {/* Big Rounded Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner relative">
          <div
            className="h-full rounded-full transition-all duration-500 shadow-2xs"
            style={{
              width: `${Math.min(100, Math.max(2, percent))}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>

        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
