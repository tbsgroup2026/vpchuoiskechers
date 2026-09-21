'use client';

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { IconBriefcase } from '@tabler/icons-react';

ChartJS.register(ArcElement, Tooltip, Legend);

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

const COLORS = {
  management: '#3b82f6', // blue
  specialist: '#006838', // green TBS
  intern: '#f59e0b', // amber
  other: '#8b5cf6', // purple
};

export default function TitleDonut({ data, loading = false }: TitleDonutProps) {
  const total = data.management + data.specialist + data.intern + data.other;

  const chartData = {
    labels: ['Quản lý', 'Chuyên viên', 'Thực tập sinh', 'Khác'],
    datasets: [
      {
        data:
          total > 0
            ? [data.management, data.specialist, data.intern, data.other]
            : [0, 0, 0, 0],
        backgroundColor: [COLORS.management, COLORS.specialist, COLORS.intern, COLORS.other],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${context.label}: ${val} người (${pct}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  const calcPct = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-5 border border-gray-200/80 shadow-xs h-72 animate-pulse flex flex-col justify-between">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-40 w-40 rounded-full border-4 border-gray-100 self-center" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <IconBriefcase size={18} className="text-blue-600" />
          Phân bổ theo chức danh
        </h3>
        <span className="text-xs text-gray-400 font-medium">4 nhóm vị trí</span>
      </div>

      <div className="my-4 flex flex-col sm:flex-row items-center gap-4">
        {/* Donut canvas with center icon overlay */}
        <div className="relative h-44 w-44 shrink-0">
          {total > 0 ? (
            <Doughnut data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full w-full rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
              Chưa có dữ liệu
            </div>
          )}
          {total > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">{total}</span>
              <span className="text-[11px] text-gray-500 font-medium">Chức danh</span>
            </div>
          )}
        </div>

        {/* Custom Legend */}
        <div className="flex flex-col gap-2.5 w-full text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS.management }}
              />
              <span className="text-gray-600 font-medium">Quản lý</span>
            </div>
            <span className="font-semibold text-gray-900">
              {data.management}{' '}
              <span className="text-gray-400 font-normal">({calcPct(data.management)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS.specialist }}
              />
              <span className="text-gray-600 font-medium">Chuyên viên</span>
            </div>
            <span className="font-semibold text-gray-900">
              {data.specialist}{' '}
              <span className="text-gray-400 font-normal">({calcPct(data.specialist)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS.intern }}
              />
              <span className="text-gray-600 font-medium">Thực tập sinh</span>
            </div>
            <span className="font-semibold text-gray-900">
              {data.intern}{' '}
              <span className="text-gray-400 font-normal">({calcPct(data.intern)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS.other }}
              />
              <span className="text-gray-600 font-medium">Khác</span>
            </div>
            <span className="font-semibold text-gray-900">
              {data.other}{' '}
              <span className="text-gray-400 font-normal">({calcPct(data.other)}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
