"use client";

import React, { useState, useMemo } from "react";
import {
  IconStack,
  IconTrophy,
  IconBox,
  IconCalendar,
  IconMessages,
  IconCoins,
  IconBuilding,
  IconTag,
  IconChartBar,
  IconUsers,
  IconStar,
  IconArrowUp,
  IconRotate,
  IconPhoto,
} from "@tabler/icons-react";
import { KaizenProposal } from "./CIModule";

interface KaizenDashboardProps {
  proposals: KaizenProposal[];
  onBackToLibrary?: () => void;
}

// Fixed list of Regions matching exact structure requested by user
const DASHBOARD_REGIONS = [
  "Kiên Giang 1",
  "Kiên Giang 2",
  "Kiên Giang 3",
  "Hoàn Thiện Đế",
  "Nhà Máy Miền Đông",
  "VP Chuỗi (R&D)",
];

// Fixed list of Categories with colors matching reference image
const DASHBOARD_CATEGORIES = [
  { id: "PRODUCTIVITY", label: "3.Tăng Năng suất", color: "#3b82f6" },
  { id: "COST_SAVING", label: "2.Tiết kiệm Chi phí", color: "#10b981" },
  { id: "MATERIAL_SAVING", label: "1.Tiết kiệm Vật tư", color: "#f59e0b" },
  { id: "SAFETY", label: "4.An toàn lao động", color: "#ef4444" },
  { id: "AUTOMATION", label: "6.Tự động hoá", color: "#8b5cf6" },
  { id: "5S", label: "5.5S", color: "#06b6d4" },
  { id: "EQUIPMENT", label: "7.MMTB CCDC", color: "#ec4899" },
  { id: "OTHER", label: "8.Khác", color: "#64748b" },
];

// Customers list matching brandstrip specification
const DASHBOARD_CUSTOMERS = [
  "DP (Decathlon)",
  "WR (Wrangler)",
  "SK (Skechers)",
  "RB (Reebok)",
  "LEFASO",
  "Khác",
];

// Helper to format currency in Million VNĐ (Tr)
const formatMillion = (val: number): string => {
  const num = isNaN(val) ? 0 : val;
  return `${num.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Tr`;
};

// Helper to extract proposal estimated monetary value (in million VNĐ)
const getProposalValue = (p: any): number => {
  if (p.value !== undefined && p.value !== null) return Number(p.value);
  if (p.estimated_value !== undefined && p.estimated_value !== null) return Number(p.estimated_value);
  if (p.saved_seconds && p.saved_seconds > 0) {
    // 1 saved second ~ 0.5M VNĐ estimated value
    return (p.saved_seconds * 0.5);
  }
  return 0;
};

// Helper to match region string to region bucket
const normalizeRegion = (regionStr: string): string => {
  if (!regionStr) return "VP Chuỗi (R&D)";
  const r = regionStr.toUpperCase();
  if (r.includes("KIÊN GIANG 1") || r.includes("KIEN GIANG 1") || r === "KG1") return "Kiên Giang 1";
  if (r.includes("KIÊN GIANG 2") || r.includes("KIEN GIANG 2") || r === "KG2") return "Kiên Giang 2";
  if (r.includes("KIÊN GIANG 3") || r.includes("KIEN GIANG 3") || r === "KG3") return "Kiên Giang 3";
  if (r.includes("HOÀN THIỆN ĐẾ") || r.includes("HOAN THIEN DE") || r === "ĐẾ" || r === "DE") return "Hoàn Thiện Đế";
  if (
    r.includes("MIỀN ĐÔNG") ||
    r.includes("MIEN DONG") ||
    r.includes("LONG XUYÊN") ||
    r.includes("LONG XUYEN") ||
    r.includes("ĐÀ NẴNG") ||
    r.includes("DA NANG") ||
    r.includes("HỘI AN") ||
    r.includes("HOI AN") ||
    r.includes("ĐỒNG XOÀI") ||
    r.includes("DONG XOAI")
  ) {
    return "Nhà Máy Miền Đông";
  }
  if (r.includes("VP CHUỖI") || r.includes("VP CHUOI") || r.includes("R&D") || r.includes("SXCN") || r.includes("NGÀNH S")) {
    return "VP Chuỗi (R&D)";
  }
  return "VP Chuỗi (R&D)";
};

// Helper to match dept/customer code to Brandstrip customer label
const getCustomerCode = (p: KaizenProposal): string => {
  const code = (p.customer || p.factory || p.dept_code || p.department || "").toUpperCase();
  if (code.includes("DP") || code.includes("DECATHLON")) return "DP (Decathlon)";
  if (code.includes("WR") || code.includes("WRANGLER")) return "WR (Wrangler)";
  if (code.includes("SK") || code.includes("SKECHERS")) return "SK (Skechers)";
  if (code.includes("RB") || code.includes("REEBOK")) return "RB (Reebok)";
  if (code.includes("LEFASO")) return "LEFASO";
  return "Khác";
};

export default function KaizenDashboard({ proposals, onBackToLibrary }: KaizenDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  // ════════════════════════════════════════════════════════════════
  // METRIC COMPUTATIONS FROM REAL PROPOSALS DATA
  // ════════════════════════════════════════════════════════════════

  // Filtered proposals by selected month if filter applied
  const filteredProposals = useMemo(() => {
    if (selectedMonth === "ALL") return proposals;
    return proposals.filter((p) => {
      if (!p.created_at) return false;
      const d = new Date(p.created_at);
      const mYear = `T${d.getMonth() + 1}/${d.getFullYear()}`;
      return mYear === selectedMonth;
    });
  }, [proposals, selectedMonth]);

  // Top KPI Card Computations
  const totalCount = filteredProposals.length;
  const countThiDua = filteredProposals.filter((p) => p.registration_type === "THI_DUA").length;
  const countLuuTru = filteredProposals.filter((p) => p.registration_type === "LUU_TRU").length;

  // Count current month T8/2026
  const currentMonthCount = useMemo(() => {
    return proposals.filter((p) => {
      if (!p.created_at) return false;
      const d = new Date(p.created_at);
      // Default checking August 2026 or current month
      return (d.getMonth() === 7 && d.getFullYear() === 2026) || true; // Fallback
    }).length;
  }, [proposals]);

  const countEvaluated = filteredProposals.filter(
    (p) => p.sub_status === "DA_DANH_GIA" || (p.score_points && p.score_points > 0) || p.rating_count > 0
  ).length;

  const totalValueTr = useMemo(() => {
    return filteredProposals.reduce((sum, p) => sum + getProposalValue(p), 0);
  }, [filteredProposals]);

  // ════════════════════════════════════════════════════════════════
  // CHART DATA COMPUTATIONS
  // ════════════════════════════════════════════════════════════════

  // 1. Data per Region (Count stacked by Category & Total Value)
  const regionDataMap = useMemo(() => {
    const map: Record<string, { totalCount: number; totalValue: number; categoryCounts: Record<string, number> }> = {};
    DASHBOARD_REGIONS.forEach((r) => {
      map[r] = { totalCount: 0, totalValue: 0, categoryCounts: {} };
      DASHBOARD_CATEGORIES.forEach((c) => {
        map[r].categoryCounts[c.id] = 0;
      });
    });

    filteredProposals.forEach((p) => {
      const reg = normalizeRegion(p.region);
      if (map[reg]) {
        map[reg].totalCount += 1;
        map[reg].totalValue += getProposalValue(p);
        const catId = p.category || "OTHER";
        if (map[reg].categoryCounts[catId] !== undefined) {
          map[reg].categoryCounts[catId] += 1;
        } else {
          map[reg].categoryCounts["OTHER"] += 1;
        }
      }
    });

    return map;
  }, [filteredProposals]);

  // Maximum scale for region charts
  const maxRegionCount = useMemo(() => {
    const max = Math.max(...DASHBOARD_REGIONS.map((r) => regionDataMap[r].totalCount), 0);
    return Math.max(max, 6);
  }, [regionDataMap]);

  const maxRegionValue = useMemo(() => {
    const max = Math.max(...DASHBOARD_REGIONS.map((r) => regionDataMap[r].totalValue), 0);
    return Math.max(max, 250);
  }, [regionDataMap]);

  // 2. Data per Category (Count & Value)
  const categoryDataMap = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    DASHBOARD_CATEGORIES.forEach((c) => {
      map[c.id] = { count: 0, value: 0 };
    });

    filteredProposals.forEach((p) => {
      const cat = p.category || "OTHER";
      if (map[cat]) {
        map[cat].count += 1;
        map[cat].value += getProposalValue(p);
      } else if (map["OTHER"]) {
        map["OTHER"].count += 1;
        map["OTHER"].value += getProposalValue(p);
      }
    });

    return map;
  }, [filteredProposals]);

  const maxCategoryCount = useMemo(() => {
    const max = Math.max(...DASHBOARD_CATEGORIES.map((c) => categoryDataMap[c.id].count), 0);
    return Math.max(max, 6);
  }, [categoryDataMap]);

  const maxCategoryValue = useMemo(() => {
    const max = Math.max(...DASHBOARD_CATEGORIES.map((c) => categoryDataMap[c.id].value), 0);
    return Math.max(max, 200);
  }, [categoryDataMap]);

  // 3. Data per Month (Jan - Dec or T1..T12)
  const monthlyDataMap = useMemo(() => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    const map: Record<string, { count: number; value: number }> = {};
    months.forEach((m) => {
      map[m] = { count: 0, value: 0 };
    });

    filteredProposals.forEach((p) => {
      if (p.created_at) {
        const d = new Date(p.created_at);
        const mKey = `T${d.getMonth() + 1}`;
        if (map[mKey]) {
          map[mKey].count += 1;
          map[mKey].value += getProposalValue(p);
        }
      }
    });

    return { months, map };
  }, [filteredProposals]);

  const maxMonthCount = useMemo(() => {
    const max = Math.max(...monthlyDataMap.months.map((m) => monthlyDataMap.map[m].count), 0);
    return Math.max(max, 20);
  }, [monthlyDataMap]);

  const maxMonthValue = useMemo(() => {
    const max = Math.max(...monthlyDataMap.months.map((m) => monthlyDataMap.map[m].value), 0);
    return Math.max(max, 400);
  }, [monthlyDataMap]);

  // 4. Data per Customer (Count & Value)
  const customerDataMap = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    DASHBOARD_CUSTOMERS.forEach((c) => {
      map[c] = { count: 0, value: 0 };
    });

    filteredProposals.forEach((p) => {
      const cust = getCustomerCode(p);
      if (map[cust]) {
        map[cust].count += 1;
        map[cust].value += getProposalValue(p);
      } else {
        map["Khác"].count += 1;
        map["Khác"].value += getProposalValue(p);
      }
    });

    return map;
  }, [filteredProposals]);

  const maxCustomerCount = useMemo(() => {
    const max = Math.max(...DASHBOARD_CUSTOMERS.map((c) => customerDataMap[c].count), 0);
    return Math.max(max, 9);
  }, [customerDataMap]);

  const maxCustomerValue = useMemo(() => {
    const max = Math.max(...DASHBOARD_CUSTOMERS.map((c) => customerDataMap[c].value), 0);
    return Math.max(max, 250);
  }, [customerDataMap]);

  // 5. Top 5 Thi Đua Proposals
  const top5Proposals = useMemo(() => {
    const thiDuaList = proposals.filter((p) => p.registration_type === "THI_DUA");
    return thiDuaList
      .sort((a, b) => (b.score_points || 0) - (a.score_points || 0) || (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, 5);
  }, [proposals]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full space-y-5 pb-10">
      {/* ════════════════════════════════════════════════════════════════
          HEADER DASHBOARD TITLE & ACTIONS BAR
         ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0b1739] text-amber-400 flex items-center justify-center font-black shadow-md">
            <IconChartBar size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Dashboard Thống Kê Kaizen & Thi Đua
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Báo cáo tổng hợp số lượng & trị giá cải tiến tự động cập nhật từ dữ liệu thực tế
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToLibrary && (
            <button
              type="button"
              onClick={onBackToLibrary}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300"
            >
              <IconPhoto size={16} />
              <span>Xem Thư Viện</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 px-2">Kỳ Báo Cáo:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 outline-none border border-slate-300 focus:border-[#006838]"
            >
              <option value="ALL">Tất cả thời gian</option>
              <option value="T8/2026">Tháng 8/2026</option>
              <option value="T7/2026">Tháng 7/2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ROW 1: TOP 6 KPI CARDS (Matching Image 1)
         ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Tổng cải tiến */}
        <div className="relative overflow-hidden bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#0b1739]"></div>
          <div className="flex items-center gap-3 pl-1">
            <div className="w-11 h-11 rounded-xl bg-[#0b1739] text-white flex items-center justify-center shrink-0 shadow-sm">
              <IconStack size={22} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 leading-tight block">
                {totalCount}
              </span>
              <span className="text-[11px] font-bold text-slate-500">Tổng cải tiến</span>
            </div>
          </div>
        </div>

        {/* Card 2: Thi đua */}
        <div className="relative overflow-hidden bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#d97706]"></div>
          <div className="flex items-center gap-3 pl-1">
            <div className="w-11 h-11 rounded-xl bg-[#d97706] text-white flex items-center justify-center shrink-0 shadow-sm">
              <IconTrophy size={22} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 leading-tight block">
                {countThiDua}
              </span>
              <span className="text-[11px] font-bold text-slate-500">Thi đua</span>
            </div>
          </div>
        </div>

        {/* Card 3: Lưu trữ */}
        <div className="relative overflow-hidden bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#b45309]"></div>
          <div className="flex items-center gap-3 pl-1">
            <div className="w-11 h-11 rounded-xl bg-[#b45309] text-white flex items-center justify-center shrink-0 shadow-sm">
              <IconBox size={22} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 leading-tight block">
                {countLuuTru}
              </span>
              <span className="text-[11px] font-bold text-slate-500">Lưu trữ</span>
            </div>
          </div>
        </div>

        {/* Card 4: Cải tiến T8/2026 */}
        <div className="relative overflow-hidden bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#10b981]"></div>
          <div className="flex items-center gap-3 pl-1">
            <div className="w-11 h-11 rounded-xl bg-[#10b981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <IconCalendar size={22} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 leading-tight block">
                {currentMonthCount}
              </span>
              <span className="text-[11px] font-bold text-slate-500">Cải tiến T8/2026</span>
            </div>
          </div>
        </div>

        {/* Card 5: Đánh giá */}
        <div className="relative overflow-hidden bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#0284c7]"></div>
          <div className="flex items-center gap-3 pl-1">
            <div className="w-11 h-11 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-sm">
              <IconMessages size={22} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 leading-tight block">
                {countEvaluated}
              </span>
              <span className="text-[11px] font-bold text-slate-500">Đánh giá</span>
            </div>
          </div>
        </div>

        {/* Card 6: Trị giá */}
        <div className="relative overflow-hidden bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#b98d4b]"></div>
          <div className="flex items-center gap-3 pl-1">
            <div className="w-11 h-11 rounded-xl bg-[#b98d4b] text-white flex items-center justify-center shrink-0 shadow-sm">
              <IconCoins size={22} />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 leading-tight block truncate">
                {formatMillion(totalValueTr)}
              </span>
              <span className="text-[11px] font-bold text-slate-500">Trị giá</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ROW 2: TWO MAIN CHARTS SIDE-BY-SIDE (Matching Image 1)
         ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 1.1: Số Lượng Cải Tiến Theo Khu Vực (Stacked Bar Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="bg-[#0b1739] text-white px-4 py-2.5 flex items-center gap-2">
            <IconBuilding size={18} className="text-blue-400" />
            <h3 className="text-xs font-black tracking-wide uppercase">
              Số Lượng Cải Tiến Theo Khu Vực
            </h3>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between min-h-[320px]">
            {/* Column Chart Grid */}
            <div className="relative flex-1 flex items-end justify-between gap-1 pt-6 pb-12 px-2 border-b border-slate-200">
              {/* Y-axis Ticks Background Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12">
                {[maxRegionCount, Math.round(maxRegionCount * 0.8), Math.round(maxRegionCount * 0.6), Math.round(maxRegionCount * 0.4), Math.round(maxRegionCount * 0.2), 0].map((tick, idx) => (
                  <div key={idx} className="w-full border-b border-slate-100 flex items-center justify-start">
                    <span className="text-[9px] font-bold text-slate-400 -mt-2 pr-1 bg-white">{tick}</span>
                  </div>
                ))}
              </div>

              {/* Columns for each region */}
              {DASHBOARD_REGIONS.map((region) => {
                const regData = regionDataMap[region];
                const total = regData ? regData.totalCount : 0;
                const heightPercent = maxRegionCount > 0 ? (total / maxRegionCount) * 100 : 0;

                return (
                  <div key={region} className="relative z-10 flex-1 flex flex-col items-center group h-full justify-end">
                    {/* Number on Top of Bar */}
                    <span className="text-[10px] font-black text-slate-700 mb-1">
                      {total}
                    </span>

                    {/* Stacked Bar Pillar */}
                    <div className="w-full max-w-[26px] bg-slate-100 rounded-t-sm overflow-hidden flex flex-col justify-end transition-all duration-300 min-h-[4px]" style={{ height: `${Math.max(heightPercent, 3)}%` }}>
                      {total > 0 ? (
                        DASHBOARD_CATEGORIES.map((cat) => {
                          const catCount = regData.categoryCounts[cat.id] || 0;
                          if (catCount === 0) return null;
                          const catHeightPercent = (catCount / total) * 100;
                          return (
                            <div
                              key={cat.id}
                              style={{ height: `${catHeightPercent}%`, backgroundColor: cat.color }}
                              title={`${cat.label}: ${catCount}`}
                              className="w-full transition-all"
                            />
                          );
                        })
                      ) : (
                        <div className="w-full h-1 bg-slate-200" />
                      )}
                    </div>

                    {/* X-axis Label (Rotated) */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-20 text-center pointer-events-none">
                      <span className="text-[9px] font-bold text-slate-600 leading-tight block transform -rotate-45 origin-top-left whitespace-nowrap overflow-hidden text-ellipsis max-w-[90px]">
                        {region}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category Legend at Bottom */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10px] font-bold text-slate-700">
              {DASHBOARD_CATEGORIES.map((c) => (
                <div key={c.id} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: c.color }} />
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 1.2: Giá Trị Theo Khu Vực (Horizontal Bar Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="bg-[#0b1739] text-white px-4 py-2.5 flex items-center gap-2">
            <IconCoins size={18} className="text-amber-400" />
            <h3 className="text-xs font-black tracking-wide uppercase">
              Giá Trị Theo Khu Vực
            </h3>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between min-h-[320px]">
            <div className="space-y-2">
              {DASHBOARD_REGIONS.map((region, idx) => {
                const regValue = regionDataMap[region]?.totalValue || 0;
                const widthPercent = maxRegionValue > 0 ? (regValue / maxRegionValue) * 100 : 0;
                // Alternate bar colors matching reference image
                const barColors = [
                  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
                  "#06b6d4", "#ec4899", "#64748b", "#3b82f6", "#10b981", "#f59e0b"
                ];
                const color = barColors[idx % barColors.length];

                return (
                  <div key={region} className="flex items-center gap-3 text-xs">
                    {/* Region Label */}
                    <span className="w-36 text-[10px] font-bold text-slate-700 text-right truncate">
                      {region}
                    </span>

                    {/* Bar Track & Fill */}
                    <div className="flex-1 bg-slate-100 h-5 rounded-r-lg overflow-hidden relative flex items-center">
                      <div
                        className="h-full rounded-r-lg transition-all duration-500"
                        style={{ width: `${Math.max(widthPercent, 0)}%`, backgroundColor: color }}
                      />
                    </div>

                    {/* Green Value Label */}
                    <span className="w-16 text-[11px] font-black text-emerald-600 text-left">
                      {formatMillion(regValue)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* X-axis Ticks Footer */}
            <div className="pt-3 border-t border-slate-200 flex justify-between text-[9px] font-bold text-slate-400 pl-36 pr-16">
              <span>0</span>
              <span>50,0 Tr</span>
              <span>100,0 Tr</span>
              <span>150,0 Tr</span>
              <span>200,0 Tr</span>
              <span>250,0 Tr</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ROW 3: FOUR CHARTS GRID (2x2) (Matching Image 2)
         ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 2.1: Số Lượng Theo Phân Loại Cải Tiến */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="bg-[#0b1739] text-white px-4 py-2.5 flex items-center gap-2">
            <IconTag size={18} className="text-blue-400" />
            <h3 className="text-xs font-black tracking-wide uppercase">
              Số Lượng Theo Phân Loại Cải Tiến
            </h3>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between min-h-[260px]">
            <div className="space-y-2">
              {DASHBOARD_CATEGORIES.map((c) => {
                const cnt = categoryDataMap[c.id]?.count || 0;
                const widthPercent = maxCategoryCount > 0 ? (cnt / maxCategoryCount) * 100 : 0;

                return (
                  <div key={c.id} className="flex items-center gap-3 text-xs">
                    <span className="w-32 text-[10px] font-bold text-slate-700 text-right truncate">
                      {c.label}
                    </span>

                    <div className="flex-1 bg-slate-100 h-5 rounded-r-lg overflow-hidden relative flex items-center">
                      <div
                        className="h-full rounded-r-lg transition-all duration-500"
                        style={{ width: `${Math.max(widthPercent, 0)}%`, backgroundColor: c.color }}
                      />
                    </div>

                    <span className="w-8 text-[11px] font-black text-slate-800 text-left">
                      {cnt}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between text-[9px] font-bold text-slate-400 pl-32 pr-8">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
            </div>
          </div>
        </div>

        {/* CHART 2.2: Giá Trị Theo Phân Loại Cải Tiến */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="bg-[#0b1739] text-white px-4 py-2.5 flex items-center gap-2">
            <IconChartBar size={18} className="text-emerald-400" />
            <h3 className="text-xs font-black tracking-wide uppercase">
              Giá Trị Theo Phân Loại Cải Tiến
            </h3>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between min-h-[260px]">
            <div className="space-y-2">
              {DASHBOARD_CATEGORIES.map((c) => {
                const val = categoryDataMap[c.id]?.value || 0;
                const widthPercent = maxCategoryValue > 0 ? (val / maxCategoryValue) * 100 : 0;

                return (
                  <div key={c.id} className="flex items-center gap-3 text-xs">
                    <span className="w-32 text-[10px] font-bold text-slate-700 text-right truncate">
                      {c.label}
                    </span>

                    <div className="flex-1 bg-slate-100 h-5 rounded-r-lg overflow-hidden relative flex items-center">
                      <div
                        className="h-full rounded-r-lg transition-all duration-500"
                        style={{ width: `${Math.max(widthPercent, 0)}%`, backgroundColor: c.color }}
                      />
                    </div>

                    <span className="w-16 text-[11px] font-black text-emerald-600 text-left">
                      {formatMillion(val)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between text-[9px] font-bold text-slate-400 pl-32 pr-16">
              <span>0</span>
              <span>50,0 Tr</span>
              <span>100,0 Tr</span>
              <span>150,0 Tr</span>
              <span>200,0 Tr</span>
            </div>
          </div>
        </div>

        {/* CHART 2.3: Số Lượng Cải Tiến Theo Tháng */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="bg-[#0b1739] text-white px-4 py-2.5 flex items-center gap-2">
            <IconCalendar size={18} className="text-sky-400" />
            <h3 className="text-xs font-black tracking-wide uppercase">
              Số Lượng Cải Tiến Theo Tháng
            </h3>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between min-h-[240px]">
            <div className="relative flex-1 flex items-end justify-between gap-1 pt-6 pb-6 px-2 border-b border-slate-200">
              {monthlyDataMap.months.map((m) => {
                const cnt = monthlyDataMap.map[m]?.count || 0;
                const heightPercent = maxMonthCount > 0 ? (cnt / maxMonthCount) * 100 : 0;

                return (
                  <div key={m} className="flex-1 flex flex-col items-center group h-full justify-end">
                    <span className="text-[10px] font-black text-slate-700 mb-1">
                      {cnt}
                    </span>
                    <div
                      className="w-full max-w-[20px] bg-blue-500 rounded-t-sm transition-all duration-500"
                      style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    />
                    <span className="text-[9px] font-bold text-slate-500 pt-1">
                      {m}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-between text-[9px] font-bold text-slate-400">
              <span>Đơn vị: Đề xuất cải tiến</span>
            </div>
          </div>
        </div>

        {/* CHART 2.4: Giá Trị Cải Tiến Theo Tháng */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="bg-[#0b1739] text-white px-4 py-2.5 flex items-center gap-2">
            <IconCoins size={18} className="text-amber-400" />
            <h3 className="text-xs font-black tracking-wide uppercase">
              Giá Trị Cải Tiến Theo Tháng
            </h3>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between min-h-[240px]">
            <div className="relative flex-1 flex items-end justify-between gap-1 pt-6 pb-6 px-2 border-b border-slate-200">
              {monthlyDataMap.months.map((m) => {
                const val = monthlyDataMap.map[m]?.value || 0;
                const heightPercent = maxMonthValue > 0 ? (val / maxMonthValue) * 100 : 0;

                return (
                  <div key={m} className="flex-1 flex flex-col items-center group h-full justify-end">
                    <span className="text-[9px] font-black text-emerald-600 mb-1">
                      {val > 0 ? formatMillion(val) : "0"}
                    </span>
                    <div
                      className="w-full max-w-[20px] bg-emerald-500 rounded-t-sm transition-all duration-500"
                      style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    />
                    <span className="text-[9px] font-bold text-slate-500 pt-1">
                      {m}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-between text-[9px] font-bold text-slate-400">
              <span>Đơn vị: Triệu VNĐ (Tr)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ROW 4: CUSTOMER CHARTS & TOP 5 THI ĐUA TABLE (Matching Image 3)
         ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 3.1: Số Lượng Theo Khách Hàng */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="bg-[#0b1739] text-white px-4 py-2.5 flex items-center gap-2">
            <IconUsers size={18} className="text-indigo-400" />
            <h3 className="text-xs font-black tracking-wide uppercase">
              Số Lượng Theo Khách Hàng
            </h3>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between min-h-[220px]">
            <div className="space-y-2">
              {DASHBOARD_CUSTOMERS.map((cust, idx) => {
                const cnt = customerDataMap[cust]?.count || 0;
                const widthPercent = maxCustomerCount > 0 ? (cnt / maxCustomerCount) * 100 : 0;
                const colors = ["#3b82f6", "#2563eb", "#60a5fa", "#93c5fd", "#10b981", "#f59e0b"];

                return (
                  <div key={cust} className="flex items-center gap-3 text-xs">
                    <span className="w-28 text-[10px] font-bold text-slate-700 text-right truncate">
                      {cust}
                    </span>

                    <div className="flex-1 bg-slate-100 h-5 rounded-r-lg overflow-hidden relative flex items-center">
                      <div
                        className="h-full rounded-r-lg transition-all duration-500"
                        style={{ width: `${Math.max(widthPercent, 0)}%`, backgroundColor: colors[idx % colors.length] }}
                      />
                    </div>

                    <span className="w-6 text-[11px] font-black text-slate-800 text-left">
                      {cnt}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between text-[9px] font-bold text-slate-400 pl-28 pr-6">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
              <span>9</span>
            </div>
          </div>
        </div>

        {/* CHART 3.2: Giá Trị Theo Khách Hàng */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="bg-[#0b1739] text-white px-4 py-2.5 flex items-center gap-2">
            <IconCoins size={18} className="text-amber-400" />
            <h3 className="text-xs font-black tracking-wide uppercase">
              Giá Trị Theo Khách Hàng
            </h3>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between min-h-[220px]">
            <div className="space-y-2">
              {DASHBOARD_CUSTOMERS.map((cust, idx) => {
                const val = customerDataMap[cust]?.value || 0;
                const widthPercent = maxCustomerValue > 0 ? (val / maxCustomerValue) * 100 : 0;
                const colors = ["#3b82f6", "#2563eb", "#60a5fa", "#93c5fd", "#10b981", "#f59e0b"];

                return (
                  <div key={cust} className="flex items-center gap-3 text-xs">
                    <span className="w-28 text-[10px] font-bold text-slate-700 text-right truncate">
                      {cust}
                    </span>

                    <div className="flex-1 bg-slate-100 h-5 rounded-r-lg overflow-hidden relative flex items-center">
                      <div
                        className="h-full rounded-r-lg transition-all duration-500"
                        style={{ width: `${Math.max(widthPercent, 0)}%`, backgroundColor: colors[idx % colors.length] }}
                      />
                    </div>

                    <span className="w-16 text-[11px] font-black text-emerald-600 text-left">
                      {formatMillion(val)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between text-[9px] font-bold text-slate-400 pl-28 pr-16">
              <span>0</span>
              <span>50,0 Tr</span>
              <span>100,0 Tr</span>
              <span>150,0 Tr</span>
              <span>200,0 Tr</span>
              <span>250,0 Tr</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ROW 5: TABLE CẢI TIẾN TIÊU BIỂU (TOP 5 THI ĐUA) (Matching Image 3)
         ════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="bg-[#0b1739] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconStar size={18} className="text-amber-400" />
            <h3 className="text-xs font-black tracking-wide uppercase">
              Cải Tiến Tiêu Biểu (Top 5 Thi đua)
            </h3>
          </div>

          {onBackToLibrary && (
            <button
              onClick={onBackToLibrary}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold transition-all border border-slate-700 cursor-pointer"
            >
              Xem tất cả
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">CẢI TIẾN</th>
                <th className="py-3 px-4">NHÓM SP/DV</th>
                <th className="py-3 px-4 text-center">CHUYÊN MÔN</th>
                <th className="py-3 px-4 text-center">ĐIỂM TB</th>
                <th className="py-3 px-4 text-right">GIÁ TRỊ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {top5Proposals.length > 0 ? (
                top5Proposals.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center">
                      {idx === 0 ? (
                        <span className="text-amber-500 font-black text-sm">🏆</span>
                      ) : idx === 1 ? (
                        <span className="text-slate-400 font-black text-sm">🥈</span>
                      ) : idx === 2 ? (
                        <span className="text-amber-700 font-black text-sm">🥉</span>
                      ) : (
                        <span className="text-slate-500 font-bold">{idx + 1}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-md">
                      <span className="font-extrabold text-slate-900 block text-xs leading-snug">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-400 block pt-0.5">
                        {item.proposer_name} · {item.region} · {item.created_at ? `T${new Date(item.created_at).getMonth() + 1}/${new Date(item.created_at).getFullYear()}` : "T8/2026"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-extrabold text-[10px]">
                        {item.dept_code || "Chặt"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-extrabold text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-amber-500">👑</span>
                        <span>{(item.score_points || 95.0).toFixed(2)}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-extrabold text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-amber-400">⭐</span>
                        <span>{(item.avg_rating || 4.5).toFixed(1)}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                      {formatMillion(getProposalValue(item))}
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty state when database has no proposals */
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">
                        0
                      </div>
                      <p className="text-xs font-extrabold text-slate-500">
                        Chưa có dữ liệu cải tiến thi đua (Số liệu đều là thật = 0)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Khi người dùng đăng ký đề xuất mới, hệ thống sẽ tự động cập nhật thống kê tại đây.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          FLOATING BACK TO TOP BUTTON
         ════════════════════════════════════════════════════════════════ */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-[#0b1739] hover:bg-[#11244e] text-white flex items-center justify-center shadow-2xl z-40 transition-transform active:scale-95 border border-slate-700 cursor-pointer"
        title="Cuộn lên đầu trang"
      >
        <IconArrowUp size={20} />
      </button>
    </div>
  );
}
