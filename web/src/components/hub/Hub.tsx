"use client";

// Khối giao diện dùng chung cho các trang "hub" theo style trang Nhân sự – Hành chính
// (section header icon vuông, thẻ lớn xanh/cam có checklist, thẻ thao tác nhanh, viên chọn site).
// Giữ nguyên class màu, bo góc của HRHanhChanhHubView; thẻ là <button> để dùng được bằng bàn phím.

import React from "react";
import { IconArrowRight, IconCheck, type TablerIcon } from "@tabler/icons-react";

export function HubSectionHeader({ icon: Icon, title, desc, id }: { icon: TablerIcon; title: string; desc: string; id?: string }) {
  return (
    <div className="flex items-center gap-2.5" id={id}>
      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006838] flex items-center justify-center border border-emerald-200/80 shadow-2xs shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">{title}</h2>
        <p className="text-xs text-slate-500 font-semibold">{desc}</p>
      </div>
    </div>
  );
}

const TONE = {
  green: {
    hoverBorder: "hover:border-[#006838]/60",
    iconBox: "bg-[#e6f4ed] text-[#006838] border-emerald-100/90",
    titleHover: "group-hover:text-[#006838]",
    check: "text-[#006838]",
    arrow: "bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white",
    ring: "focus-visible:ring-[#006838]/40",
  },
  orange: {
    hoverBorder: "hover:border-amber-500/60",
    iconBox: "bg-amber-50 text-amber-600 border-amber-200/80",
    titleHover: "group-hover:text-amber-800",
    check: "text-amber-600",
    arrow: "bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white",
    ring: "focus-visible:ring-amber-500/40",
  },
} as const;

export function HubFeatureCard({
  tone,
  icon: Icon,
  title,
  badge,
  desc,
  items,
  onOpen,
}: {
  tone: keyof typeof TONE;
  icon: TablerIcon;
  title: string;
  badge: string;
  desc: string;
  items: string[];
  onOpen: () => void;
}) {
  const t = TONE[tone];
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Mở ${title}`}
      className={`group relative text-left bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md ${t.hoverBorder} transition-all duration-200 cursor-pointer flex flex-col justify-between focus:outline-none focus-visible:ring-4 ${t.ring}`}
    >
      <div className="space-y-4 w-full">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl ${t.iconBox} flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs`}>
            <Icon size={24} />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-base font-extrabold text-slate-900 ${t.titleHover} transition-colors`}>{title}</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600 whitespace-nowrap">{badge}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{desc}</p>
          </div>
        </div>
        <ul className="space-y-1.5 pt-3 border-t border-slate-100">
          {items.map((it) => (
            <li key={it} className="text-xs text-slate-700 font-semibold flex items-center gap-2">
              <IconCheck size={14} className={`${t.check} shrink-0 stroke-[3]`} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="pt-4 flex justify-end w-full">
        <div className={`w-9 h-9 rounded-full ${t.arrow} flex items-center justify-center transition-all duration-200 shadow-2xs`}>
          <IconArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
}

export function HubQuickCard({ icon: Icon, title, desc, onOpen }: { icon: TablerIcon; title: string; desc: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={title}
      className="group relative text-left bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-[#006838]/60 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full min-h-[150px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#006838]/40"
    >
      <div className="space-y-3">
        <div className="w-10 h-10 rounded-xl bg-[#e6f4ed] text-[#006838] flex items-center justify-center border border-emerald-100/90 shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
          <Icon size={20} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006838] transition-colors leading-tight">{title}</h3>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-3">{desc}</p>
        </div>
      </div>
      <div className="pt-3 flex justify-end">
        <div className="w-8 h-8 rounded-full bg-[#e6f4ed] text-[#006838] group-hover:bg-[#006838] group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs">
          <IconArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
}

/** Viên chọn site trên banner xanh (viền trắng, bo tròn). value "ALL" = tất cả site */
export function SitePills({ sites, value, onChange }: { sites: readonly { key: string; name: string }[]; value: string; onChange: (key: string) => void }) {
  const all = [{ key: "ALL", name: "Tất cả site" }, ...sites];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn site">
      {all.map((s) => {
        const active = s.key === value;
        return (
          <button
            key={s.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(s.key)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 ${
              active ? "bg-white text-[#006838] border-white" : "bg-white/10 text-white border-white/70 hover:bg-white/20"
            }`}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
