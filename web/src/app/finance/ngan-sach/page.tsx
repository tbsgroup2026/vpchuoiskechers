"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft, IconPlus, IconChartBar, IconAlertTriangle,
  IconCircleCheck, IconChevronRight, IconArrowUp, IconArrowDown,
  IconTarget, IconAdjustments, IconHistory, IconBuilding,
  IconX, IconCheck, IconFilter, IconDownload,
} from "@tabler/icons-react";

const DEPTS = [
  { id: "hr", name: "Nhân sự & Hành chánh", budget: 180_000_000, spent: 142_500_000, pct: 79.2, status: "ok" },
  { id: "kt", name: "Kế toán & Quản trị", budget: 95_000_000, spent: 88_200_000, pct: 92.8, status: "warning" },
  { id: "rd", name: "R&D - Phát triển sản phẩm", budget: 250_000_000, spent: 189_000_000, pct: 75.6, status: "ok" },
  { id: "ci", name: "CN-CI Cải tiến liên tục", budget: 120_000_000, spent: 98_400_000, pct: 82.0, status: "ok" },
  { id: "qc", name: "Quản lý chất lượng (QC)", budget: 85_000_000, spent: 91_500_000, pct: 107.6, status: "over" },
  { id: "lg", name: "Logistics & TTPP", budget: 340_000_000, spent: 278_000_000, pct: 81.8, status: "ok" },
  { id: "sx", name: "Tổ hợp Nhà máy", budget: 920_000_000, spent: 884_000_000, pct: 96.1, status: "warning" },
];

const CATEGORIES = [
  { name: "Chi phí nhân sự", budget: 850_000_000, actual: 812_000_000, pct: 95.5, color: "bg-blue-500" },
  { name: "Chi phí vật tư SX", budget: 620_000_000, actual: 584_000_000, pct: 94.2, color: "bg-emerald-500" },
  { name: "Chi phí vận hành", budget: 280_000_000, actual: 261_000_000, pct: 93.2, color: "bg-violet-500" },
  { name: "Chi phí R&D", budget: 250_000_000, actual: 189_000_000, pct: 75.6, color: "bg-cyan-500" },
  { name: "Chi phí hành chính", budget: 120_000_000, actual: 131_000_000, pct: 109.2, color: "bg-rose-500" },
  { name: "Chi phí marketing", budget: 80_000_000, actual: 52_000_000, pct: 65.0, color: "bg-amber-500" },
];

export default function NganSachPage() {
  const [view, setView] = useState<"dept" | "category">("dept");
  const [period, setPeriod] = useState("Tháng 8/2026");

  const totalBudget = DEPTS.reduce((s, d) => s + d.budget, 0);
  const totalSpent = DEPTS.reduce((s, d) => s + d.spent, 0);
  const overDepts = DEPTS.filter(d => d.status === "over").length;
  const warningDepts = DEPTS.filter(d => d.status === "warning").length;

  return (
    <div className="min-h-screen bg-[#f7f8fc]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/work?dept=finance" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <IconArrowLeft size={20} className="text-gray-500" />
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
                <IconChartBar size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-700 text-gray-900">Ngân sách</h1>
                <p className="text-xs text-gray-400">Kế toán & Quản trị</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20">
              {["Tháng 8/2026", "Tháng 7/2026", "Q3/2026", "Năm 2026"].map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-600 text-gray-600 hover:bg-gray-50">
              <IconDownload size={14} /> Xuất báo cáo
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-600 hover:bg-cyan-700 shadow-sm">
              <IconPlus size={14} /> Lập ngân sách
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Alert */}
        {(overDepts > 0 || warningDepts > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <IconAlertTriangle size={18} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-700">{overDepts} phòng ban vượt ngân sách</span> và{" "}
              <span className="font-700">{warningDepts} phòng ban sắp vượt</span> trong tháng 8/2026
            </p>
          </div>
        )}

        {/* Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Tổng ngân sách {period}</p>
                <p className="text-3xl font-800 text-gray-900">{(totalBudget / 1_000_000_000).toFixed(2)} tỷ đ</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Đã sử dụng</p>
                <p className="text-2xl font-800 text-gray-700">{(totalSpent / 1_000_000_000).toFixed(2)} tỷ đ</p>
                <p className="text-xs font-600 text-amber-600">{((totalSpent / totalBudget) * 100).toFixed(1)}% ngân sách</p>
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${(totalSpent / totalBudget) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">0</span>
              <span className="text-xs text-gray-400">{(totalBudget / 1_000_000).toFixed(0)}M</span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Vượt ngân sách", value: overDepts, suffix: "phòng ban", color: "text-red-600 bg-red-50" },
              { label: "Cảnh báo (>90%)", value: warningDepts, suffix: "phòng ban", color: "text-amber-600 bg-amber-50" },
              { label: "Bình thường", value: DEPTS.length - overDepts - warningDepts, suffix: "phòng ban", color: "text-emerald-600 bg-emerald-50" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-800 text-gray-900 mt-0.5">{s.value} <span className="text-sm font-500 text-gray-400">{s.suffix}</span></p>
                </div>
                <span className={`text-xs font-600 px-2 py-1 rounded-lg ${s.color}`}>{s.value > 0 ? "!" : "✓"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle view */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 pt-5 flex items-center justify-between">
            <h2 className="text-sm font-700 text-gray-800">Theo dõi Budget / Actual</h2>
            <div className="flex gap-1 p-1 bg-gray-50 rounded-xl">
              {(["dept", "category"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-600 transition-all ${view === v ? "bg-white text-cyan-700 shadow-sm" : "text-gray-500"}`}>
                  {v === "dept" ? "Theo phòng ban" : "Theo khoản mục"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {(view === "dept" ? DEPTS : CATEGORIES).map((item: any) => {
              const pct = item.pct;
              const isOver = pct > 100;
              const isWarn = pct > 90 && pct <= 100;
              const barColor = isOver ? "bg-red-500" : isWarn ? "bg-amber-400" : "bg-cyan-500";
              return (
                <div key={item.id || item.name} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {isOver && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                      {isWarn && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      {!isOver && !isWarn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      <span className="text-xs font-600 text-gray-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Ngân sách: <strong className="text-gray-700">{(item.budget / 1_000_000).toFixed(0)}M</strong></span>
                      <span>Thực tế: <strong className={isOver ? "text-red-600" : "text-gray-700"}>{((item.actual || item.spent) / 1_000_000).toFixed(0)}M</strong></span>
                      <span className={`font-800 ${isOver ? "text-red-600" : isWarn ? "text-amber-600" : "text-emerald-600"}`}>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
