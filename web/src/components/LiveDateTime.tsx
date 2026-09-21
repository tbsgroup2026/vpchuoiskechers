"use client";

import React, { useState, useEffect } from "react";
import { IconCalendar, IconClock } from "@tabler/icons-react";

interface LiveDateTimeProps {
  showTimeOnly?: boolean;
  showDateOnly?: boolean;
  className?: string;
}

export default function LiveDateTime({
  showTimeOnly = false,
  showDateOnly = false,
  className = "",
}: LiveDateTimeProps) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Deterministic server/initial hydration fallback
  if (!mounted || !now) {
    if (showTimeOnly) return <span className={className}>08:00</span>;
    if (showDateOnly) return <span className={className}>Thứ Sáu, 12 tháng 9, 2026</span>;
    return (
      <div className={`flex items-center gap-3 text-xs text-slate-500 font-medium ${className}`}>
        <span className="flex items-center gap-1">
          <IconCalendar size={14} className="text-[#006838]" />
          <span>Thứ Sáu, 12 tháng 9, 2026</span>
        </span>
        <span className="flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
          <IconClock size={13} className="text-[#006838]" />
          <span>08:00</span>
        </span>
      </div>
    );
  }

  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayName = days[now.getDay()];
  const dayNum = now.getDate();
  const monthNum = now.getMonth() + 1;
  const yearNum = now.getFullYear();
  const formattedDate = `${dayName}, ${dayNum} tháng ${monthNum}, ${yearNum}`;

  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  const formattedTime = `${hours}:${mins}`;

  if (showTimeOnly) return <span className={className}>{formattedTime}</span>;
  if (showDateOnly) return <span className={className}>{formattedDate}</span>;

  return (
    <div className={`flex items-center gap-3 text-xs text-slate-500 font-medium ${className}`}>
      <span className="flex items-center gap-1">
        <IconCalendar size={14} className="text-[#006838]" />
        <span>{formattedDate}</span>
      </span>
      <span className="flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
        <IconClock size={13} className="text-[#006838]" />
        <span>{formattedTime}</span>
      </span>
    </div>
  );
}
