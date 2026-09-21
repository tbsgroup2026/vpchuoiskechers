'use client';

import React from 'react';
import Link from 'next/link';
import { IconCalendar, IconClock, IconMapPin } from '@tabler/icons-react';

export interface ScheduleEvent {
  id: string;
  title: string;
  date: Date | string; // e.g. "2026-09-22"
  time: string; // e.g. "14:00 - 16:00"
  location: string; // e.g. "Phòng họp 2"
  type?: 'MEETING' | 'TRIP' | string;
}

interface DeptScheduleCardProps {
  events: ScheduleEvent[];
  loading?: boolean;
}

export default function DeptScheduleCard({ events = [], loading = false }: DeptScheduleCardProps) {
  const displayEvents = events.slice(0, 4);

  const getDayAndMonth = (dateVal: Date | string) => {
    try {
      const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
      if (isNaN(d.getTime())) {
        return { day: '15', month: 'THG 9' };
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = `THG ${d.getMonth() + 1}`;
      return { day, month };
    } catch {
      return { day: '15', month: 'THG 9' };
    }
  };

  return (
    <div className="rounded-xl bg-white p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <IconCalendar size={18} className="text-[#006838]" />
          Lịch công tác phòng ban
        </h3>
        <Link
          href="/rooms"
          className="text-xs font-semibold text-[#006838] hover:underline flex items-center gap-0.5"
        >
          Xem tất cả ›
        </Link>
      </div>

      <div className="mt-3 divide-y divide-gray-100">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-2.5 flex items-center gap-3 animate-pulse">
              <div className="h-12 w-12 rounded-lg bg-gray-200 shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
          ))
        ) : displayEvents.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            Chưa có lịch họp hay công tác nào được xếp trong kỳ này
          </div>
        ) : (
          displayEvents.map((evt) => {
            const { day, month } = getDayAndMonth(evt.date);

            return (
              <div key={evt.id} className="py-2.5 flex items-center gap-3 group">
                {/* Date box */}
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-50 text-[#006838] border border-emerald-200/50">
                  <span className="text-sm font-bold leading-none">{day}</span>
                  <span className="text-[9px] font-semibold text-emerald-700 mt-0.5">{month}</span>
                </div>

                {/* Event info */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-[#006838] transition-colors">
                    {evt.title}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <IconClock size={13} className="text-gray-400" />
                      {evt.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconMapPin size={13} className="text-gray-400" />
                      {evt.location}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
