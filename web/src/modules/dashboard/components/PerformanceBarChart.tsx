'use client';

import React from 'react';
import { IconChartBar } from '@tabler/icons-react';
import { BarChartCard, BarChartDataItem } from '@/components/dashboard';

export interface EmployeePerformance {
  code: string;
  name: string;
  score: number; // 0 to 10 scale
  isCurrentUser?: boolean;
}

interface PerformanceBarChartProps {
  data: EmployeePerformance[];
  currentUserId?: string;
  loading?: boolean;
  periodLabel?: string;
}

export default function PerformanceBarChart({
  data = [],
  currentUserId,
  loading = false,
  periodLabel = 'Tháng này',
}: PerformanceBarChartProps) {
  const chartData: BarChartDataItem[] = data.map((emp) => {
    const parts = emp.name.split(' ');
    const shortName = parts.length > 2 ? `${parts[parts.length - 2]} ${parts[parts.length - 1]}` : emp.name;
    const isCurrent = emp.isCurrentUser || (currentUserId && emp.code === currentUserId);

    return {
      label: shortName,
      value: emp.score,
      color: isCurrent ? '#006838' : '#34d399',
    };
  });

  return (
    <BarChartCard
      title="HIỆU SUẤT NHÂN VIÊN"
      icon={IconChartBar}
      data={chartData}
      valueLabel="Điểm đánh giá (/10)"
      maxValue={10}
      subtitle={periodLabel}
      loading={loading}
    />
  );
}
