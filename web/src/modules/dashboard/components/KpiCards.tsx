'use client';

import React from 'react';
import {
  IconUsers,
  IconUserCheck,
  IconUserOff,
  IconClock,
  IconTrendingUp,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { KpiCard } from '@/components/dashboard';

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
  // Parse numeric change if present
  const parseDiffNum = (diffStr?: string): number | undefined => {
    if (!diffStr) return undefined;
    const clean = diffStr.replace('+', '').replace('%', '').trim();
    const n = parseFloat(clean);
    return isNaN(n) ? undefined : n;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. Tổng nhân viên */}
      <KpiCard
        icon={IconUsers}
        title="Tổng nhân viên"
        value={data.totalEmployees}
        subtitle="So với tháng trước"
        changePercent={parseDiffNum(data.totalEmployeesDiff)}
        loading={loading}
      />

      {/* 2. Đang làm việc */}
      <KpiCard
        icon={IconUserCheck}
        title="Đang làm việc"
        value={data.workingCount}
        subtitle={`Tỷ lệ: ${data.workingRatio ?? 100}%`}
        loading={loading}
      />

      {/* 3. Đang nghỉ phép */}
      <KpiCard
        icon={IconUserOff}
        title="Đang nghỉ phép"
        value={data.onLeaveCount}
        subtitle="Nghỉ phép / Việc riêng"
        loading={loading}
      />

      {/* 4. Sắp hết hạn HĐ */}
      <KpiCard
        icon={IconClock}
        title="Sắp hết hạn HĐ"
        value={data.expiringContractsCount}
        subtitle="Trong 30 ngày tới"
        invertTrend={true}
        loading={loading}
      />

      {/* 5. Hiệu suất trung bình */}
      <KpiCard
        icon={IconTrendingUp}
        title="Hiệu suất TB"
        value={Number(data.avgPerformance.toFixed(1))}
        subtitle="Thang điểm 10"
        changePercent={parseDiffNum(data.avgPerformanceDiff)}
        loading={loading}
      />

      {/* 6. Task đang xử lý */}
      <KpiCard
        icon={IconAlertTriangle}
        title="Task đang xử lý"
        value={data.activeTasksCount}
        subtitle={data.overdueTasksCount > 0 ? `⚠️ ${data.overdueTasksCount} quá hạn` : "✓ Đúng tiến độ"}
        invertTrend={true}
        loading={loading}
      />
    </div>
  );
}
