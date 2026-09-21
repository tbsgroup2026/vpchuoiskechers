'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { IconChartBar } from '@tabler/icons-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const displayData = data.length > 0 ? data : [];

  const labels = displayData.map((emp) => {
    const parts = emp.name.split(' ');
    if (parts.length > 2) {
      return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
    }
    return emp.name;
  });

  const scores = displayData.map((emp) => emp.score);

  const bgColors = displayData.map((emp) =>
    emp.isCurrentUser || (currentUserId && emp.code === currentUserId)
      ? '#006838'
      : '#34d399'
  );

  const hoverBgColors = displayData.map((emp) =>
    emp.isCurrentUser || (currentUserId && emp.code === currentUserId)
      ? '#004d28'
      : '#059669'
  );

  const chartData = {
    labels: labels.length > 0 ? labels : ['Chưa có dữ liệu'],
    datasets: [
      {
        label: 'Điểm hiệu suất (/10)',
        data: scores.length > 0 ? scores : [0],
        backgroundColor: bgColors.length > 0 ? bgColors : ['#cbd5e1'],
        hoverBackgroundColor: hoverBgColors.length > 0 ? hoverBgColors : ['#94a3b8'],
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 32,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            if (!items.length) return '';
            const idx = items[0].dataIndex;
            return displayData[idx]?.name || items[0].label;
          },
          label: (context: any) => {
            const val = context.raw || 0;
            return ` Điểm hiệu suất: ${val}/10`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          color: '#475569',
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        min: 0,
        max: 10,
        grid: { color: '#f1f5f9' },
        ticks: {
          stepSize: 2,
          font: { size: 11 },
          color: '#64748b',
          callback: (value: any) => `${value} pt`,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-5 border border-gray-200/80 shadow-xs h-72 animate-pulse flex flex-col justify-between">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-44 w-full bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <IconChartBar size={18} className="text-[#006838]" />
          Hiệu suất nhân sự
        </h3>
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
          {periodLabel}
        </span>
      </div>

      <div className="my-3 h-48 w-full">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-[#006838]" />
            <span className="font-medium text-gray-700">Bạn (Tài khoản này)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-[#34d399]" />
            <span>Thành viên khác</span>
          </span>
        </div>
        <span>Thang điểm 10</span>
      </div>
    </div>
  );
}
