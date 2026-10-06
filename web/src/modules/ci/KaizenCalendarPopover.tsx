import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconCheck,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react";

export interface KaizenCalendarPopoverProps {
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  singleDate?: string; // YYYY-MM-DD if single date mode active
  onApplyRange: (from: string, to: string, single?: string) => void;
  onClear: () => void;
  isProposalMatchingFilters?: (p: any, ignoreDate?: boolean) => boolean;
  proposals?: any[];
}

import { formatVnDateDisplay, formatShortVnDateDisplay } from "@/lib/kaizenDateHelper";
export { formatVnDateDisplay, formatShortVnDateDisplay };

export function KaizenCalendarPopover({
  fromDate,
  toDate,
  singleDate: propSingleDate,
  onApplyRange,
  onClear,
  isProposalMatchingFilters,
  proposals = [],
}: KaizenCalendarPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Today in Asia/Ho_Chi_Minh timezone
  const todayVnStr = useMemo(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now); // YYYY-MM-DD
  }, []);

  // Calendar view month & year state
  const [viewYear, setViewYear] = useState<number>(() => {
    const dStr = propSingleDate || fromDate || todayVnStr;
    const y = parseInt(dStr.split("-")[0], 10);
    return isNaN(y) ? new Date().getFullYear() : y;
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    const dStr = propSingleDate || fromDate || todayVnStr;
    const m = parseInt(dStr.split("-")[1], 10);
    return isNaN(m) ? new Date().getMonth() + 1 : m;
  });

  // Local states for inputs
  const [localFromDate, setLocalFromDate] = useState("");
  const [localToDate, setLocalToDate] = useState("");
  const [localSingleDate, setLocalSingleDate] = useState("");

  // Badge counts & loading states
  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});
  const [validationError, setValidationError] = useState("");

  // Body Scroll Lock when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Sync props to local state when popover opens or props change
  useEffect(() => {
    if (propSingleDate) {
      setLocalSingleDate(propSingleDate);
      setLocalFromDate("");
      setLocalToDate("");
    } else if (fromDate && toDate && fromDate === toDate) {
      setLocalSingleDate(fromDate);
      setLocalFromDate("");
      setLocalToDate("");
    } else if (fromDate || toDate) {
      setLocalSingleDate("");
      setLocalFromDate(fromDate);
      setLocalToDate(toDate);
    } else {
      setLocalSingleDate("");
      setLocalFromDate("");
      setLocalToDate("");
    }

    const dStr = propSingleDate || fromDate || todayVnStr;
    const parts = dStr.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [fromDate, toDate, propSingleDate, todayVnStr, isOpen]);

  // Compute daily counts directly from proposals array (client fallback)
  const computeClientDailyCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    const prefix = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;

    for (const p of proposals) {
      if (!p || !p.created_at) continue;
      
      // Apply the unified filter, ignoring the date selection filter
      if (isProposalMatchingFilters && !isProposalMatchingFilters(p, true)) continue;

      const isArchived = Boolean(p.is_archived) || p.sub_status === "LUU_TRU" || p.registration_type === "LUU_TRU" || p.status === "ARCHIVED";
      if (isArchived) continue;

      const d = new Date(p.created_at);
      if (isNaN(d.getTime())) continue;

      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const vnDateStr = formatter.format(d);
      if (vnDateStr.startsWith(prefix)) {
        counts[vnDateStr] = (counts[vnDateStr] || 0) + 1;
      }
    }
    return counts;
  }, [viewYear, viewMonth, proposals, isProposalMatchingFilters]);

  // Update daily counts when dependencies change
  useEffect(() => {
    if (isOpen) {
      setDailyCounts(computeClientDailyCounts());
    }
  }, [computeClientDailyCounts, isOpen]);

  // Close on Outside Click or Esc Key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Generate days grid with current, previous, and next month days
  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();

    const cells: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];

    // Leading days from previous month
    const prevMonthLastDay = new Date(viewYear, viewMonth - 1, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevM = viewMonth === 1 ? 12 : viewMonth - 1;
      const prevY = viewMonth === 1 ? viewYear - 1 : viewYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({ dayNum, dateStr, isCurrentMonth: false });
    }

    // Days 1..daysInMonth
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dayNum: d, dateStr, isCurrentMonth: true });
    }

    // Trailing days from next month
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 12 ? 1 : viewMonth + 1;
      const nextY = viewMonth === 12 ? viewYear + 1 : viewYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    return cells;
  }, [viewYear, viewMonth]);

  // Select day handler
  const handleDayClick = (dateStr: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) {
      const parts = dateStr.split("-");
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10));
    }
    setLocalSingleDate(dateStr);
    setLocalFromDate("");
    setLocalToDate("");
    setValidationError("");
    
    // Auto-apply single date
    onApplyRange(dateStr, dateStr, dateStr);
    setIsOpen(false);
  };

  // Date Range Inputs Handlers
  const handleFromInputChange = (val: string) => {
    setLocalFromDate(val);
    setLocalSingleDate("");
    if (localToDate && val && localToDate < val) {
      setValidationError("Ngày kết thúc không được trước Ngày bắt đầu!");
    } else {
      setValidationError("");
    }
  };

  const handleToInputChange = (val: string) => {
    setLocalToDate(val);
    setLocalSingleDate("");
    if (localFromDate && val && val < localFromDate) {
      setValidationError("Ngày kết thúc không được trước Ngày bắt đầu!");
    } else {
      setValidationError("");
    }
  };

  // Apply button click
  const handleApplyRangeClick = () => {
    if (localFromDate && localToDate && localToDate < localFromDate) {
      setValidationError("Ngày kết thúc không được trước Ngày bắt đầu!");
      return;
    }
    setValidationError("");

    if (localSingleDate) {
      onApplyRange(localSingleDate, localSingleDate, localSingleDate);
    } else if (localFromDate && localToDate) {
      if (localFromDate === localToDate) {
        onApplyRange(localFromDate, localToDate, localFromDate);
      } else {
        onApplyRange(localFromDate, localToDate, "");
      }
    } else if (localFromDate) {
      onApplyRange(localFromDate, "", "");
    } else if (localToDate) {
      onApplyRange("", localToDate, "");
    } else {
      onClear();
    }
    setIsOpen(false);
  };

  // Shortcuts
  const handleShortcut7Days = () => {
    const today = new Date();
    const past7 = new Date();
    past7.setDate(today.getDate() - 6);

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const fStr = formatter.format(past7);
    const tStr = formatter.format(today);

    setLocalFromDate(fStr);
    setLocalToDate(tStr);
    setLocalSingleDate("");
    setValidationError("");
    onApplyRange(fStr, tStr, "");
    setIsOpen(false);
  };

  const handleShortcut30Days = () => {
    const today = new Date();
    const past30 = new Date();
    past30.setDate(today.getDate() - 29);

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const fStr = formatter.format(past30);
    const tStr = formatter.format(today);

    setLocalFromDate(fStr);
    setLocalToDate(tStr);
    setLocalSingleDate("");
    setValidationError("");
    onApplyRange(fStr, tStr, "");
    setIsOpen(false);
  };

  const handleShortcutThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const fStr = formatter.format(firstDay);
    const tStr = formatter.format(lastDay);

    setLocalFromDate(fStr);
    setLocalToDate(tStr);
    setLocalSingleDate("");
    setValidationError("");
    onApplyRange(fStr, tStr, "");
    setIsOpen(false);
  };

  const handleShortcutLastMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const fStr = formatter.format(firstDay);
    const tStr = formatter.format(lastDay);

    setLocalFromDate(fStr);
    setLocalToDate(tStr);
    setLocalSingleDate("");
    setValidationError("");
    onApplyRange(fStr, tStr, "");
    setIsOpen(false);
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLocalFromDate("");
    setLocalToDate("");
    setLocalSingleDate("");
    setValidationError("");
    onClear();
    setIsOpen(false);
  };

  // Trigger button label
  const hasActiveFilter = Boolean(propSingleDate || fromDate || toDate);

  const buttonLabel = useMemo(() => {
    if (propSingleDate) {
      return formatVnDateDisplay(propSingleDate).replace('/2026', '').replace('/2027', ''); // simple hack to remove year if it's 2026/2027 or we can just keep DD/MM
    }
    if (fromDate && toDate) {
      if (fromDate === toDate) {
        return formatShortVnDateDisplay(fromDate);
      }
      return `${formatShortVnDateDisplay(fromDate)} - ${formatShortVnDateDisplay(toDate)}`;
    }
    if (fromDate) return `Từ ${formatShortVnDateDisplay(fromDate)}`;
    if (toDate) return `Đến ${formatShortVnDateDisplay(toDate)}`;
    return "Lịch";
  }, [propSingleDate, fromDate, toDate]);

  // Main inner content for both desktop popover and mobile bottom sheet
  const renderPopupInner = () => (
    <>
      {/* MOBILE TOP DRAG HANDLE & CLOSE BUTTON */}
      <div className="sm:hidden flex items-center justify-between mb-2 shrink-0">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="p-1 rounded text-slate-400 hover:text-slate-600:text-slate-200"
        >
          <IconX size={18} />
        </button>
      </div>

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-20 bg-white pb-1 shrink-0">
        <div className="mb-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center sm:text-left mb-2">
            CHỌN 1 NGÀY
          </div>
          <div className="flex items-center justify-between px-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-slate-100:bg-slate-800 text-slate-500 transition-colors"
              title="Tháng trước"
            >
              <IconChevronLeft size={18} />
            </button>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[13px] font-bold text-slate-800">
                Tháng {viewMonth}/{viewYear}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
              title="Tháng sau"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* WEEKDAY HEADERS */}
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 py-1">
          <span>CN</span>
          <span>T2</span>
          <span>T3</span>
          <span>T4</span>
          <span>T5</span>
          <span>T6</span>
          <span>T7</span>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 py-1 space-y-4 px-1 min-h-0">
        {/* CALENDAR DAYS GRID */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center relative">
          {calendarGrid.map((cell, index) => {
            if (!cell.isCurrentMonth) {
              return <div key={`${cell.dateStr}-${index}`} className="h-8 w-full"></div>;
            }

            const isToday = cell.dateStr === todayVnStr;
            const isSelected =
              cell.dateStr === localSingleDate ||
              (cell.dateStr === localFromDate && cell.dateStr === localToDate);
            const isInRange =
              localFromDate &&
              localToDate &&
              cell.dateStr >= localFromDate &&
              cell.dateStr <= localToDate;
            const badgeCount = dailyCounts[cell.dateStr] || 0;
            const tooltipText = `${badgeCount} sáng kiến đăng ngày ${formatVnDateDisplay(cell.dateStr)}`;

            return (
              <button
                key={`${cell.dateStr}-${index}`}
                type="button"
                onClick={() => handleDayClick(cell.dateStr, cell.isCurrentMonth)}
                title={badgeCount > 0 ? tooltipText : undefined}
                className={`h-8 w-full rounded text-[11px] font-semibold relative flex items-center justify-center transition-all cursor-pointer select-none mx-auto ${
                  isSelected
                    ? "bg-[#006838] text-white shadow-xs"
                    : isInRange
                    ? "bg-emerald-100 text-emerald-900"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
                style={{ maxWidth: '30px' }}
              >
                <span>{cell.dayNum}</span>

                {/* RED BADGE */}
                {badgeCount > 0 && (
                  <span
                    className={`absolute top-0 right-0 translate-x-1 -translate-y-1 min-w-[14px] h-[14px] px-[2px] rounded-full text-[8.5px] font-extrabold leading-none flex items-center justify-center shadow-xs z-10 ${
                      isSelected
                        ? "bg-white text-emerald-800 border border-emerald-300"
                        : "bg-rose-500 text-white"
                    }`}
                    title={tooltipText}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* RETRY WARNING IF FETCH HAD ISSUE */}
        {hasFetchError && (
          <div className="flex items-center justify-between text-[10px] text-amber-600 pt-1">
            <span>Không tải được đếm</span>
            <button
              type="button"
              onClick={fetchBadges}
              className="underline font-bold hover:text-amber-700:text-amber-300 flex items-center gap-0.5 cursor-pointer"
            >
              <IconRefresh size={10} />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* SECTION 2: HOẶC CHỌN KHOẢNG NGÀY */}
        <div className="space-y-3 pt-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center sm:text-left">
            HOẶC CHỌN KHOẢNG NGÀY
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <label className="text-[10px] font-medium text-slate-400 block mb-1">
                Ngày bắt đầu
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={localFromDate}
                  onChange={(e) => handleFromInputChange(e.target.value)}
                  className="w-full pl-2.5 pr-8 py-1.5 rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-800 outline-none focus:border-emerald-500:border-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <IconCalendar size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-400 block mb-1">
                Ngày kết thúc
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={localToDate}
                  onChange={(e) => handleToInputChange(e.target.value)}
                  className="w-full pl-2.5 pr-8 py-1.5 rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-800 outline-none focus:border-emerald-500:border-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <IconCalendar size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* VALIDATION ERROR */}
          {validationError && (
            <div className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-medium flex items-center gap-1">
              <IconAlertCircle size={12} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* QUICK SHORTCUTS */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-medium text-slate-400">
              Lối tắt nhanh:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleShortcut7Days}
                className="px-1.5 py-1 rounded bg-slate-50 hover:bg-slate-100:bg-slate-700 border border-slate-100 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
              >
                7 ngày qua
              </button>
              <button
                type="button"
                onClick={handleShortcut30Days}
                className="px-1.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
              >
                30 ngày qua
              </button>
              <button
                type="button"
                onClick={handleShortcutThisMonth}
                className="px-1.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={handleShortcutLastMonth}
                className="px-1.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
              >
                Tháng trước
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BUTTONS */}
      <div className="sticky bottom-0 z-20 bg-white pt-2 shrink-0 flex items-center justify-between gap-2 mt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={handleClearAll}
          className="px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
        >
          <IconTrash size={13} />
          <span>Xóa lọc</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleApplyRangeClick}
            disabled={Boolean(validationError)}
            className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              validationError
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            }`}
          >
            <IconCheck size={14} />
            <span>Áp dụng</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1.5 rounded-full border text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer outline-none ${
            hasActiveFilter
              ? "bg-[#006838] text-white border-[#006838] shadow-sm"
              : isOpen
              ? "bg-white border-[#006838] text-[#006838]"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
          title="Bấm để lọc theo 1 Ngày hoặc Khoảng Ngày"
        >
          <IconCalendar size={15} className={hasActiveFilter ? "text-white" : isOpen ? "text-[#006838]" : "text-slate-500"} />
          <span className="truncate max-w-[130px]">{buttonLabel}</span>
        </button>
      </div>

      {/* POPOVER DIALOG / BOTTOM SHEET */}
      {isOpen && (
        <>
          {/* MOBILE BACKDROP & BOTTOM SHEET */}
          <div className="sm:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end">
            <div className="bg-white rounded-t-2xl max-h-[85dvh] w-full p-3 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200 overflow-y-auto custom-scrollbar">
              {renderPopupInner()}
            </div>
          </div>

          {/* DESKTOP POPOVER */}
          <div className="hidden sm:block absolute left-0 sm:right-0 sm:left-auto top-full mt-2 z-50 w-[295px] p-3 rounded-2xl bg-white text-slate-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/60 animate-in fade-in zoom-in-95 duration-150 max-h-[360px] flex flex-col overflow-y-auto custom-scrollbar">
            {renderPopupInner()}
          </div>
        </>
      )}
    </div>
  );
}
