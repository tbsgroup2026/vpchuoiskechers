'use client';

import React from 'react';
import { IconUserCheck } from '@tabler/icons-react';
import { DonutChartCard, DonutDataItem } from '@/components/dashboard';

export interface StatusData {
  working: number;
  onLeave: number;
  personalLeave: number;
  other: number;
}

interface StatusDonutProps {
  data: StatusData;
  loading?: boolean;
}

export default function StatusDonut({ data, loading = false }: StatusDonutProps) {
  const total = data.working + data.onLeave + data.personalLeave + data.other;

  const breakdown: DonutDataItem[] = [
    {
      key: 'working',
      label: 'Đang làm việc',
      value: data.working,
      percent: total > 0 ? (data.working / total) * 100 : 0,
      color: '#006838',
    },
    {
      key: 'onLeave',
      label: 'Nghỉ phép',
      value: data.onLeave,
      percent: total > 0 ? (data.onLeave / total) * 100 : 0,
      color: '#f59e0b',
    },
    {
      key: 'personalLeave',
      label: 'Nghỉ việc riêng',
      value: data.personalLeave,
      percent: total > 0 ? (data.personalLeave / total) * 100 : 0,
      color: '#ef4444',
    },
    {
      key: 'other',
      label: 'Khác',
      value: data.other,
      percent: total > 0 ? (data.other / total) * 100 : 0,
      color: '#64748b',
    },
  ];

  return (
    <DonutChartCard
      title="TÌNH TRẠNG NHÂN SỰ"
      icon={IconUserCheck}
      centerLabel="NHÂN SỰ"
      centerTotal={total}
      centerSubtitle="Nhân viên"
      breakdown={breakdown}
      loading={loading}
    />
  );
}
