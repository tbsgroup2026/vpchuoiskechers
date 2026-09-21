'use client';

import React from 'react';
import Link from 'next/link';
import { IconStar, IconAlertCircle, IconCircleCheck, IconClock, IconCalendar } from '@tabler/icons-react';

export interface HighlightTask {
  id: string;
  title: string;
  assigneeName?: string;
  dueDate?: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  status?: string;
}

interface HighlightTasksCardProps {
  tasks: HighlightTask[];
  loading?: boolean;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  URGENT: {
    bg: 'bg-rose-100 text-rose-700',
    text: 'gấp',
    icon: <IconAlertCircle size={15} className="text-rose-600" />,
  },
  HIGH: {
    bg: 'bg-amber-100 text-amber-700',
    text: 'cao',
    icon: <IconClock size={15} className="text-amber-600" />,
  },
  MEDIUM: {
    bg: 'bg-blue-100 text-blue-700',
    text: 'vừa',
    icon: <IconStar size={15} className="text-blue-600" />,
  },
  LOW: {
    bg: 'bg-emerald-100 text-emerald-700',
    text: 'thường',
    icon: <IconCircleCheck size={15} className="text-emerald-600" />,
  },
};

export default function HighlightTasksCard({ tasks = [], loading = false }: HighlightTasksCardProps) {
  const displayTasks = tasks.slice(0, 4);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-xl bg-white p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <IconStar size={18} className="text-amber-500 fill-amber-400" />
          Công việc nổi bật
        </h3>
        <Link
          href="/work"
          className="text-xs font-semibold text-[#006838] hover:underline flex items-center gap-0.5"
        >
          Xem tất cả ›
        </Link>
      </div>

      <div className="mt-3 divide-y divide-gray-100">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gray-200 shrink-0" />
                <div className="space-y-1">
                  <div className="h-3.5 w-36 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-3 w-10 bg-gray-100 rounded" />
            </div>
          ))
        ) : displayTasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            Không có công việc trọng tâm nào trong kỳ này
          </div>
        ) : (
          displayTasks.map((task) => {
            const style = PRIORITY_STYLES[task.priority?.toUpperCase()] || PRIORITY_STYLES.MEDIUM;

            return (
              <div key={task.id} className="py-2.5 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
                    {style.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-[#006838] transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 truncate">
                      {task.assigneeName ? `Giao cho: ${task.assigneeName}` : 'Chưa phân công'}
                    </p>
                  </div>
                </div>

                {task.dueDate && (
                  <span className="text-[11px] font-mono font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 shrink-0 flex items-center gap-1">
                    <IconCalendar size={13} className="text-gray-400" />
                    {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
