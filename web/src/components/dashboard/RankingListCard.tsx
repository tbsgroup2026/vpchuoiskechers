'use client';

import React from 'react';
import { formatVnNumber } from './chartTheme';
import { IconTrophy, IconMedal } from '@tabler/icons-react';

export interface RankingItem {
  rank?: number;
  name: string;
  dept?: string;
  avatar?: string;
  value: number | string;
  subValue?: string;
  isCurrentUser?: boolean;
}

export interface RankingListCardProps {
  title: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  data: RankingItem[];
  headerAction?: React.ReactNode;
  loading?: boolean;
  emptyText?: string;
  className?: string;
  unit?: string;
}

export default function RankingListCard({
  title,
  icon: HeaderIcon = IconTrophy,
  data = [],
  headerAction,
  loading = false,
  emptyText = 'Chưa có dữ liệu xếp hạng',
  className = '',
  unit = 'đề xuất',
}: RankingListCardProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs animate-pulse ${className}`}>
        <div className="h-4 w-36 bg-slate-200 rounded pb-4 mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-slate-100 rounded-2xl" />
          <div className="h-12 bg-slate-100 rounded-2xl" />
          <div className="h-12 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const getBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs shadow-2xs border border-amber-200">
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs shadow-2xs border border-slate-200">
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-black text-xs shadow-2xs border border-amber-200">
          🥉
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center font-bold text-xs">
        {rank}
      </span>
    );
  };

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

      {data.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 font-medium">{emptyText}</div>
      ) : (
        <div className="divide-y divide-slate-100 pt-2 my-auto">
          {data.map((item, idx) => {
            const rank = item.rank || idx + 1;
            const isHighlight = item.isCurrentUser;

            return (
              <div
                key={idx}
                className={`py-2.5 px-3 -mx-3 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                  isHighlight ? 'bg-emerald-50/70 border border-emerald-200/80' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getBadge(rank)}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.name}{' '}
                      {isHighlight && (
                        <span className="text-[10px] text-[#006838] bg-emerald-100/80 px-1.5 py-0.5 rounded font-extrabold ml-1">
                          Bạn
                        </span>
                      )}
                    </div>
                    {item.dept && (
                      <div className="text-[11px] text-slate-400 font-medium truncate">
                        {item.dept}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-slate-900 font-sans">
                    {typeof item.value === 'number' ? formatVnNumber(item.value) : item.value}{' '}
                    <span className="text-[10px] font-normal text-slate-500">{unit}</span>
                  </div>
                  {item.subValue && (
                    <div className="text-[10px] font-bold text-[#006838]">
                      {item.subValue}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
