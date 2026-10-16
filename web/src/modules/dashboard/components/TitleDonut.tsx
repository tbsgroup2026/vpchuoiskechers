'use client';

import React from 'react';
import { IconBriefcase } from '@tabler/icons-react';
import { DonutChartCard, DonutDataItem } from '@/components/dashboard';

export interface TitleDistribution {
  management: number;
  specialist: number;
  intern: number;
  other: number;
}

interface TitleDonutProps {
  data: TitleDistribution;
  loading?: boolean;
}

export function mapJobTitleToCategory(title?: string): 'management' | 'specialist' | 'intern' | 'other' {
  if (!title) return 'other';
  const lower = title.toLowerCase();
  if (
    lower.includes('trưởng') ||
    lower.includes('giám đốc') ||
    lower.includes('phó') ||
    lower.includes('leader') ||
    lower.includes('manager') ||
    lower.includes('quản lý')
  ) {
    return 'management';
  }
  if (
    lower.includes('chuyên viên') ||
    lower.includes('kỹ sư') ||
    lower.includes('lập trình') ||
    lower.includes('nhân viên') ||
    lower.includes('nv') ||
    lower.includes('staff') ||
    lower.includes('chuyên gia')
  ) {
    return 'specialist';
  }
  if (lower.includes('thực tập') || lower.includes('intern')) {
    return 'intern';
  }
  return 'other';
}

export default function TitleDonut({ data, loading = false }: TitleDonutProps) {
  const total = data.management + data.specialist + data.intern + data.other;

  const breakdown: DonutDataItem[] = [
    {
      key: 'management',
      label: 'Cán bộ quản lý',
      value: data.management,
      percent: total > 0 ? (data.management / total) * 100 : 0,
      color: '#3b82f6',
    },
    {
      key: 'specialist',
      label: 'Chuyên viên / Kỹ sư',
      value: data.specialist,
      percent: total > 0 ? (data.specialist / total) * 100 : 0,
      color: '#006838',
    },
    {
      key: 'intern',
      label: 'Thực tập sinh',
      value: data.intern,
      percent: total > 0 ? (data.intern / total) * 100 : 0,
      color: '#f59e0b',
    },
    {
      key: 'other',
      label: 'Khác',
      value: data.other,
      percent: total > 0 ? (data.other / total) * 100 : 0,
      color: '#8b5cf6',
    },
  ];

  return (
    <DonutChartCard
      title="CƠ CẤU CHỨC DANH"
      icon={IconBriefcase}
      centerLabel="CHỨC DANH"
      centerTotal={total}
      centerSubtitle="Nhân sự"
      breakdown={breakdown}
      loading={loading}
    />
  );
}
