'use client';

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { IconUserCheck } from '@tabler/icons-react';

ChartJS.register(ArcElement, Tooltip, Legend);

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

const COLORS = {
  working: '#006838', // xanh lá đậm
  onLeave: '#f59e0b', // cam
  personalLeave: '#ef4444', // đỏ
  other: '#64748b', // xám xanh
};

export default function StatusDonut({ data, loading = false }: StatusDonutProps) {
  const total = data.working + data.onLeave + data.personalLeave + data.other;

  const chartData = {
    labels: ['Đang làm việc', 'Nghỉ phép', 'Nghỉ việc riêng', 'Khác'],
    datasets: [
      {
        data: total > 0 ? [data.working, data.onLeave, data.personalLeave, data.other] : [0, 0, 0, 0],
        backgroundColor: [COLORS.working, COLORS.onLeave, COLORS.personalLeave, COLORS.other],
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
        <div className="h-5 w-36 bg-gray-200 rounded" />
        <div className="h-40 w-40 rounded-full border-4 border-gray-100 self-center" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <IconUserCheck size={18} className="text-[#006838]" />
          Tình trạng nhân sự
        </h3>
        <span className="text-xs text-gray-400 font-medium">{total} nhân sự</span>
      </div>

      <div className="my-4 flex flex-col sm:flex-row items-center gap-4">
        {/* Donut canvas with center text overlay */}
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
              <span className="text-[11px] text-gray-500 font-medium">Nhân viên</span>
            </div>
          )}
        </div>

        {/* Custom Legend */}
        <div className="flex flex-col gap-2.5 w-full text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.working }} />
              <span className="text-gray-600 font-medium">Đang làm việc</span>
            </div>
            <span className="font-semibold text-gray-900">
              {data.working} <span className="text-gray-400 font-normal">({calcPct(data.working)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.onLeave }} />
              <span className="text-gray-600 font-medium">Nghỉ phép</span>
            </div>
            <span className="font-semibold text-gray-900">
              {data.onLeave} <span className="text-gray-400 font-normal">({calcPct(data.onLeave)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.personalLeave }} />
              <span className="text-gray-600 font-medium">Nghỉ việc riêng</span>
            </div>
            <span className="font-semibold text-gray-900">
              {data.personalLeave} <span className="text-gray-400 font-normal">({calcPct(data.personalLeave)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.other }} />
              <span className="text-gray-600 font-medium">Khác</span>
            </div>
            <span className="font-semibold text-gray-900">
              {data.other} <span className="text-gray-400 font-normal">({calcPct(data.other)}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
