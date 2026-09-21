"use client";

import React, { useState, useRef, useEffect } from "react";
import { IconCalendar, IconChevronDown, IconCheck } from "@tabler/icons-react";

export interface SelectedPeriod {
  type: "month" | "quarter" | "year" | "all";
  month: number;
  quarter: number;
  year: number;
  label: string;
}

export type PeriodSelection = SelectedPeriod;

interface PeriodPickerProps {
  value: SelectedPeriod;
  onChange: (period: SelectedPeriod) => void;
}

export default function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tempYear, setTempYear] = useState<number>(value.year || 2026);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMonth = (m: number) => {
    const newPeriod: SelectedPeriod = {
      type: "month",
      month: m,
      quarter: Math.ceil(m / 3),
      year: tempYear,
      label: `Tháng ${m}, ${tempYear}`,
    };
    onChange(newPeriod);
    setIsOpen(false);
  };

  const handleSelectQuarter = (q: number) => {
    const newPeriod: SelectedPeriod = {
      type: "quarter",
      month: 0,
      quarter: q,
      year: tempYear,
      label: `Quý ${q}, ${tempYear}`,
    };
    onChange(newPeriod);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    const newPeriod: SelectedPeriod = {
      type: "all",
      month: 0,
      quarter: 0,
      year: tempYear,
      label: `Tất cả các quý (${tempYear})`,
    };
    onChange(newPeriod);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left font-sans" ref={containerRef}>
      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-emerald-300 font-extrabold text-xs flex items-center gap-2 border border-emerald-700/60 shadow-xs transition-all cursor-pointer group"
      >
        <IconCalendar size={15} className="text-emerald-400 group-hover:scale-110 transition-transform" />
        <span>{value.label || "Tháng 9, 2026"}</span>
        <IconChevronDown size={14} className={`text-emerald-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-white space-y-3">
          {/* Year Selector Row */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Chọn Năm</span>
            <div className="flex gap-1">
              {[2025, 2026, 2027].map((y) => (
                <button
                  key={y}
                  onClick={() => setTempYear(y)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    tempYear === y
                      ? "bg-[#006838] text-white shadow-2xs"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Quarter Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Theo Quý</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2, 3, 4].map((q) => {
                const isSelected = value.type === "quarter" && value.quarter === q && value.year === tempYear;
                return (
                  <button
                    key={q}
                    onClick={() => handleSelectQuarter(q)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#006838] text-white border border-emerald-500"
                        : "bg-slate-800/80 text-slate-200 hover:bg-slate-700 border border-slate-700/60"
                    }`}
                  >
                    <span>Cả Quý {q}</span>
                    {isSelected && <IconCheck size={14} className="text-emerald-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Months Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Theo Tháng</span>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const isSelected = value.type === "month" && value.month === m && value.year === tempYear;
                return (
                  <button
                    key={m}
                    onClick={() => handleSelectMonth(m)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#006838] text-white border border-emerald-500 shadow-2xs"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
                    }`}
                  >
                    Tháng {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select All Option */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <button
              onClick={handleSelectAll}
              className={`w-full py-1.5 rounded-lg text-xs font-extrabold text-center transition-all cursor-pointer ${
                value.type === "all" && value.year === tempYear
                  ? "bg-[#006838] text-white"
                  : "bg-slate-800 text-emerald-400 hover:bg-slate-700"
              }`}
            >
              🗓️ Tất cả các quý năm {tempYear}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
