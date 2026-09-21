'use client';

import React from 'react';
import {
  IconUsers,
  IconUserCheck,
  IconUserOff,
  IconClock,
  IconTrendingUp,
  IconCircleCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';

export interface KpiData {
  totalEmployees: number;
  totalEmployeesDiff?: string; // e.g. "+14%"
  workingCount: number;
  workingRatio?: number; // e.g. 100
  onLeaveCount: number;
  onLeaveRatio?: number;
  expiringContractsCount: number;
  expiringContractsRatio?: string; // e.g. "12.5%"
  avgPerformance: number; // e.g. 8.6
  avgPerformanceDiff?: string; // e.g. "+0.3"
  activeTasksCount: number;
  overdueTasksCount: number;
}

interface KpiCardsProps {
  data: KpiData;
  loading?: boolean;
}

export default function KpiCards({ data, loading = false }: KpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-white p-4 border border-gray-100 shadow-xs animate-pulse flex flex-col justify-between"
          >
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-7 w-14 bg-gray-200 rounded" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const workingPct = data.workingRatio ?? 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Thẻ 1: Tổng nhân viên */}
      <div className="rounded-xl bg-white p-4 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Tổng nhân viên</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#006838]">
            <IconUsers size={18} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{data.totalEmployees}</span>
          {data.totalEmployeesDiff && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              ▲ {data.totalEmployeesDiff}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-gray-400">So với tháng trước</p>
      </div>

      {/* Thẻ 2: Đang làm việc */}
      <div className="rounded-xl bg-white p-4 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Đang làm việc</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <IconUserCheck size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{data.workingCount}</span>
            <span className="text-xs font-semibold text-blue-600">{workingPct}%</span>
          </div>
        </div>
        {/* Thanh Progress */}
        <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, workingPct))}%` }}
          />
        </div>
      </div>

      {/* Thẻ 3: Đang nghỉ phép */}
      <div className="rounded-xl bg-white p-4 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Đang nghỉ phép</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <IconUserOff size={18} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{data.onLeaveCount}</span>
          {data.onLeaveRatio !== undefined && (
            <span className="text-xs font-semibold text-gray-500">{data.onLeaveRatio}%</span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-gray-400">Nghỉ phép / Việc riêng</p>
      </div>

      {/* Thẻ 4: Sắp hết hạn HĐ */}
      <div className="rounded-xl bg-amber-50/40 p-4 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-800">Sắp hết hạn HĐ</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <IconClock size={18} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-900">{data.expiringContractsCount}</span>
          {data.expiringContractsRatio && (
            <span className="text-xs font-semibold text-amber-700">
              {data.expiringContractsRatio}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-amber-700/80">Trong 30 ngày tới</p>
      </div>

      {/* Thẻ 5: Hiệu suất trung bình */}
      <div className="rounded-xl bg-white p-4 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Hiệu suất trung bình</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#006838]">
            <IconTrendingUp size={18} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-gray-900">
            {data.avgPerformance.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400 font-medium">/ 10</span>
          {data.avgPerformanceDiff && (
            <span className="text-xs font-semibold text-emerald-600 ml-1">
              ▲ {data.avgPerformanceDiff}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-gray-400">So với tháng trước</p>
      </div>

      {/* Thẻ 6: Task đang xử lý */}
      <div className="rounded-xl bg-white p-4 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Task đang xử lý</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            {data.overdueTasksCount > 0 ? (
              <IconAlertTriangle size={18} className="text-rose-600" />
            ) : (
              <IconCircleCheck size={18} className="text-emerald-600" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{data.activeTasksCount}</span>
        </div>
        <div className="mt-1">
          {data.overdueTasksCount > 0 ? (
            <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
              ⚠️ {data.overdueTasksCount} task quá hạn
            </span>
          ) : (
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              ✓ Không có task quá hạn
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
