"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IconTrophy,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconFilter,
  IconCalendar,
} from "@tabler/icons-react";
import { KaizenProposal } from "./CIModule";
import { formatMax2Decimals } from "@/lib/formatNumber";
import {
  checkPrerequisites,
  checkJudgeDiscrepancy,
  calculateCriteriaScores,
  rankIndividualProposals,
  rankCollectiveUnits,
  UnitRawInputData,
  UnitScoringResult,
} from "@/lib/kaizenScoring";

interface KaizenLeaderboardProps {
  proposals?: KaizenProposal[];
  onSelectProposal?: (p: KaizenProposal) => void;
  selectedRegion?: string;
}

/**
 * REWARD_CONFIG
 * Cấu hình mức tiền thưởng theo thứ hạng / mốc điểm.
 * Hiện để null theo đúng yêu cầu -> hiển thị "—".
 * TODO: Điền số tiền thực tế khi Ban 2.2 / Ban Quản trị cung cấp bảng mức thưởng chính thức.
 */
export const REWARD_CONFIG: Record<number, number | null> = {
  1: null, // Giải Nhất: TODO - Chờ cấp mức thưởng
  2: null, // Giải Nhì: TODO - Chờ cấp mức thưởng
  3: null, // Giải Ba: TODO - Chờ cấp mức thưởng
};

function formatRewardVnd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount) || amount <= 0) {
    return "—";
  }
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

// Unit employee count configuration for collective movement tab
const UNIT_EMPLOYEE_COUNTS: Record<string, number> = {
  "NHÀ MÁY MIỀN ĐÔNG": 2000,
  "KIÊN GIANG 1": 1200,
  "KIÊN GIANG 2": 1500,
  "KIÊN GIANG 3": 1000,
  "HOÀN THIỆN ĐẾ": 800,
  "VĂN PHÒNG CHUỖI SKECHERS": 300,
  "VĂN PHÒNG CHUỖI": 300,
  "VP CHUỖI SKECHERS": 300,
};

export default function KaizenLeaderboard({
  proposals = [],
  onSelectProposal,
  selectedRegion = "ALL",
}: KaizenLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<"PROPOSALS" | "UNITS">("PROPOSALS");
  const [proposalSubFilter, setProposalSubFilter] = useState<"ALL_VALID" | "FLAGGED" | "DISQUALIFIED">("ALL_VALID");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("ALL");
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProposalDetail, setSelectedProposalDetail] = useState<any | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const url = selectedRegion && selectedRegion !== "ALL"
        ? `/api/ci-kaizen/ranking?region=${encodeURIComponent(selectedRegion)}`
        : "/api/ci-kaizen/ranking";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.leaderboard)) {
        setLeaderboardData(json.leaderboard);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedRegion]);

  // Available month options
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(proposals)) {
      proposals.forEach((p) => {
        if (p && p.created_at) {
          try {
            const d = new Date(p.created_at);
            if (!isNaN(d.getTime())) {
              set.add(`T${d.getMonth() + 1}/${d.getFullYear()}`);
            }
          } catch {}
        }
      });
    }
    set.add("T8/2026");
    set.add("T7/2026");
    return Array.from(set).sort().reverse();
  }, [proposals]);

  const rawList = useMemo(() => {
    return leaderboardData.length > 0 ? leaderboardData : proposals;
  }, [leaderboardData, proposals]);

  const monthFilteredProposals = useMemo(() => {
    if (selectedMonthFilter === "ALL") return rawList;
    return rawList.filter((p) => {
      if (!p || !p.created_at) return false;
      try {
        const d = new Date(p.created_at);
        if (isNaN(d.getTime())) return false;
        const mYear = `T${d.getMonth() + 1}/${d.getFullYear()}`;
        return mYear === selectedMonthFilter;
      } catch {
        return false;
      }
    });
  }, [rawList, selectedMonthFilter]);

  // Process scored items using kaizenScoring engine
  const scoredProposalsInput = useMemo(() => {
    return monthFilteredProposals.map((p) => {
      const p1 = p.p1_pass !== false && (p as any).is_implemented !== false;
      const p2 = p.p2_pass !== false && (p as any).has_proof_before_after !== false;
      const p3 = p.p3_pass !== false && (p as any).no_safety_violation !== false;
      const p4 = p.p4_pass !== false && (p as any).no_duplicate !== false;

      const c1Score = Number(p.c1_score_final || p.c1_score || 0);
      const c2Score = Number(p.c2_score_final || p.c2_score || 0);
      const c3Score = Number(p.c3_score_final || p.c3_score || 0);
      const c4Score = Number(p.c4_score_final || p.c4_score || 0);
      const c5Score = Number(p.c5_score_final || p.c5_score || 0);

      const judgeScore = Number(p.judge_final_score || p.score_points || 0);
      const calculatedScores = calculateCriteriaScores(
        { c1: c1Score, c2: c2Score, c3: c3Score, c4: c4Score, c5: c5Score },
        {
          c1Verified: (p as any).is_c1_verified !== false,
          c2Verified: (p as any).is_c2_verified !== false,
          c3Verified: (p as any).is_c3_verified !== false,
          c4Verified: (p as any).is_c4_verified !== false,
          c5Verified: (p as any).is_c5_verified !== false,
        }
      );

      const totalScore = judgeScore > 0 ? judgeScore : calculatedScores.totalScore;
      const isEvaluated = judgeScore > 0 || (p as any).sub_status === "DA_DANH_GIA" || (p as any).sub_status === "DA_XEP_HANG";

      const gk1 = (p as any).gk1_score !== undefined ? Number((p as any).gk1_score) : undefined;
      const gk2 = (p as any).gk2_score !== undefined ? Number((p as any).gk2_score) : undefined;
      let isFlagged = Boolean((p as any).is_score_flagged || (p as any).is_flagged);
      if (!isFlagged && gk1 !== undefined && gk2 !== undefined) {
        isFlagged = checkJudgeDiscrepancy(gk1, gk2).isFlagged;
      }

      // Check DB prize/reward amount field or fallback to REWARD_CONFIG
      const dbReward = (p as any).reward_vnd || (p as any).prize_vnd || (p as any).reward_amount;
      let rewardAmount: number | null = dbReward !== undefined && dbReward !== null ? Number(dbReward) : null;

      return {
        ...p,
        id: String(p.id || Math.random()),
        title: p.title || "Sáng kiến Kaizen",
        unit: p.factory || p.region || p.department || "Nhà Máy",
        prereqs: { p1_pass: p1, p2_pass: p2, p3_pass: p3, p4_pass: p4 },
        totalScore: isEvaluated ? totalScore : 0,
        isEvaluated,
        c1Score: calculatedScores.c1Final,
        c2Score: calculatedScores.c2Final,
        c3Score: calculatedScores.c3Final,
        c4Score: calculatedScores.c4Final,
        c5Score: calculatedScores.c5Final,
        gk1Score: gk1,
        gk2Score: gk2,
        isFlagged,
        rewardAmount,
        hasAnyCapped: calculatedScores.hasAnyCapped,
      };
    });
  }, [monthFilteredProposals]);

  // Rank proposals
  const rankedProposals = useMemo(() => {
    return rankIndividualProposals(scoredProposalsInput);
  }, [scoredProposalsInput]);

  // Filtered proposal list (All Valid / Flagged / Disqualified)
  const displayProposals = useMemo(() => {
    let list: any[] = [];
    if (proposalSubFilter === "FLAGGED") {
      list = rankedProposals.filter((p) => p.isFlagged && !p.isDisqualified);
    } else if (proposalSubFilter === "DISQUALIFIED") {
      list = rankedProposals.filter((p) => p.isDisqualified);
    } else {
      list = rankedProposals.filter((p) => !p.isDisqualified);
    }

    // Sort evaluated proposals first, unscored proposals at bottom
    return [...list].sort((a, b) => {
      if (a.isDisqualified !== b.isDisqualified) {
        return a.isDisqualified ? 1 : -1;
      }
      if (a.isEvaluated && !b.isEvaluated) return -1;
      if (!a.isEvaluated && b.isEvaluated) return 1;
      if (b.totalScoreRounded !== a.totalScoreRounded) {
        return b.totalScoreRounded - a.totalScoreRounded;
      }
      if ((b.c1Score || 0) !== (a.c1Score || 0)) {
        return (b.c1Score || 0) - (a.c1Score || 0);
      }
      return (b.c3Score || 0) - (a.c3Score || 0);
    });
  }, [rankedProposals, proposalSubFilter]);

  const validCount = rankedProposals.filter((p) => !p.isDisqualified).length;
  const flaggedCount = rankedProposals.filter((p) => p.isFlagged && !p.isDisqualified).length;
  const disqualifiedCount = rankedProposals.filter((p) => p.isDisqualified).length;

  // Process Collective Unit Movement Scores (Part B)
  const rankedUnits: UnitScoringResult[] = useMemo(() => {
    const unitMap: Record<string, UnitRawInputData> = {};

    scoredProposalsInput.forEach((p) => {
      const rawUnit = (p.unit || "Nhà Máy Miền Đông").trim().toUpperCase();
      let normUnit = "NHÀ MÁY MIỀN ĐÔNG";
      if (rawUnit.includes("KIÊN GIANG 1") || rawUnit.includes("KG 1") || rawUnit.includes("KG1")) normUnit = "KIÊN GIANG 1";
      else if (rawUnit.includes("KIÊN GIANG 2") || rawUnit.includes("KG 2") || rawUnit.includes("KG2")) normUnit = "KIÊN GIANG 2";
      else if (rawUnit.includes("KIÊN GIANG 3") || rawUnit.includes("KG 3") || rawUnit.includes("KG3")) normUnit = "KIÊN GIANG 3";
      else if (rawUnit.includes("HOÀN THIỆN ĐẾ") || rawUnit.includes("HTĐ")) normUnit = "HOÀN THIỆN ĐẾ";
      else if (rawUnit.includes("VĂN PHÒNG CHUỖI") || rawUnit.includes("VP CHUỖI")) normUnit = "VĂN PHÒNG CHUỖI SKECHERS";

      if (!unitMap[normUnit]) {
        unitMap[normUnit] = {
          unitName: normUnit,
          totalEmployees: UNIT_EMPLOYEE_COUNTS[normUnit] || 1000,
          proposals: [],
        };
      }

      unitMap[normUnit].proposals.push({
        id: p.id,
        proposerCode: p.proposer_emp_code || p.code || p.created_by || `EMP_${p.id}`,
        prereqs: p.prereqs,
        isFinalist: Number(p.totalScore) >= 70 || p.sub_status === "DA_DANH_GIA" || p.sub_status === "DA_XEP_HANG",
      });
    });

    const unitsList = Object.values(unitMap);
    return rankCollectiveUnits(unitsList);
  }, [scoredProposalsInput]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0b1739] via-[#0b1739] to-[#006838] p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-md">
            <IconTrophy size={24} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              Bảng Xếp Hạng Ý Tưởng Cải Tiến Kaizen
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Xếp hạng theo điểm chấm (thang 100) — Cập nhật tự động
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Header 3 Action Buttons */}
          <a
            href="/work/kaizen/judge"
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-xs"
          >
            ⚖️ Khống Gian BGK Chấm Điểm
          </a>
          <a
            href="/work/kaizen/admin/judging"
            className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/30"
          >
            👑 Admin Quản Lý BGK
          </a>
          <button
            type="button"
            onClick={fetchLeaderboard}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
          >
            <IconRefresh size={15} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Tab Selector: Bài Cải Tiến (A) & Giải Tập Thể (B) */}
      <div className="bg-slate-900 px-5 py-2.5 flex items-center justify-between border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("PROPOSALS")}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "PROPOSALS"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <span>🏅 Xếp Hạng Bài Cải Tiến (Thang 100)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("UNITS")}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "UNITS"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <span>🏢 Xếp Hạng Giải Tập Thể (Phong Trào 100đ)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <IconCalendar size={15} className="text-slate-400" />
          <span className="font-bold text-slate-300">Tháng:</span>
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="px-2.5 py-1 rounded-xl bg-slate-800 text-white border border-slate-700 font-bold text-xs outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả thời gian</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                Tháng {m.replace("T", "")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: XẾP HẠNG BÀI CẢI TIẾN */}
      {activeTab === "PROPOSALS" && (
        <div className="space-y-0">
          {/* Sub-header Controls & Filters */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-700 flex items-center gap-1">
                <IconFilter size={15} className="text-slate-500" />
                <span>Bộ lọc:</span>
              </span>

              <button
                type="button"
                onClick={() => setProposalSubFilter("ALL_VALID")}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  proposalSubFilter === "ALL_VALID"
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                ✅ Bài Hợp Lệ ({validCount})
              </button>

              <button
                type="button"
                onClick={() => setProposalSubFilter("FLAGGED")}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  proposalSubFilter === "FLAGGED"
                    ? "bg-amber-500 text-slate-950 border-amber-600 font-black shadow-2xs"
                    : "bg-white text-amber-900 border-amber-300 hover:bg-amber-50"
                }`}
              >
                <IconAlertTriangle size={14} className="text-amber-700" />
                <span>Bài Bị Gắn Cờ ({flaggedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setProposalSubFilter("DISQUALIFIED")}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  proposalSubFilter === "DISQUALIFIED"
                    ? "bg-rose-600 text-white border-rose-700 shadow-2xs"
                    : "bg-white text-rose-800 border-rose-300 hover:bg-rose-50"
                }`}
              >
                <span>🚫 Bài Bị Loại ({disqualifiedCount})</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Click vào dòng để xem chi tiết điểm 5 tiêu chí (TC1–TC5)
            </span>
          </div>

          {/* Table View (Exact 6 Columns: HẠNG | NGƯỜI ĐỀ XUẤT | ĐƠN VỊ / LINE | TÊN CẢI TIẾN | ĐIỂM | TIỀN THƯỞNG) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-16">HẠNG</th>
                  <th className="py-3.5 px-4 min-w-[170px]">NGƯỜI ĐỀ XUẤT</th>
                  <th className="py-3.5 px-4 min-w-[140px]">ĐƠN VỊ / LINE</th>
                  <th className="py-3.5 px-4 min-w-[220px]">TÊN CẢI TIẾN</th>
                  <th className="py-3.5 px-4 text-center min-w-[110px]" title="Điểm tổng 5 tiêu chí (thang 100)">
                    ĐIỂM
                  </th>
                  <th className="py-3.5 px-4 text-right min-w-[130px]">TIỀN THƯỞNG</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {displayProposals.length > 0 ? (
                  displayProposals.map((item) => {
                    const rank = item.rank;
                    const rewardVal = item.rewardAmount !== undefined && item.rewardAmount !== null
                      ? item.rewardAmount
                      : (REWARD_CONFIG[rank] || null);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          setSelectedProposalDetail(item);
                          if (onSelectProposal) onSelectProposal(item);
                        }}
                        className="hover:bg-amber-50/60 transition-colors cursor-pointer"
                      >
                        {/* 1. HẠNG Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {rank === 1 ? (
                            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-black text-sm flex items-center justify-center mx-auto border border-amber-300 shadow-2xs" title="Giải Nhất (Hạng 1)">
                              🥇 1
                            </span>
                          ) : rank === 2 ? (
                            <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center mx-auto border border-slate-300 shadow-2xs" title="Giải Nhì (Hạng 2)">
                              🥈 2
                            </span>
                          ) : rank === 3 ? (
                            <span className="w-8 h-8 rounded-full bg-amber-900/10 text-amber-800 font-black text-sm flex items-center justify-center mx-auto border border-amber-800/30 shadow-2xs" title="Giải Ba (Hạng 3)">
                              🥉 3
                            </span>
                          ) : rank > 0 ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[11px] border border-emerald-200 shadow-2xs">
                              💡 Ý tưởng
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 font-extrabold text-[10px] border border-rose-200">
                              LOẠI
                            </span>
                          )}
                        </td>

                        {/* 2. NGƯỜI ĐỀ XUẤT */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 block text-xs">
                            {item.proposer_name || (item as any).proposerName || "Nhân viên"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block pt-0.5">
                            MSNV: {item.proposer_emp_code || item.code || "CBCNV"}
                          </span>
                        </td>

                        {/* 3. ĐƠN VỊ / LINE */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 text-[11px] block">
                            {item.unit}
                          </span>
                          {item.line && (
                            <span className="text-[10px] text-slate-500 block pt-0.5">
                              Line: {item.line}
                            </span>
                          )}
                        </td>

                        {/* 4. TÊN CẢI TIẾN */}
                        <td className="py-3.5 px-4 max-w-xs space-y-1">
                          <span className="font-extrabold text-slate-900 text-xs line-clamp-1 block" title={item.title}>
                            {item.title}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-emerald-700">
                              {item.category_label || item.category || "3.Tăng Năng suất"}
                            </span>
                            {item.prereqBadges && item.prereqBadges.map((b: string) => (
                              <span key={b} className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-extrabold">
                                ❌ {b}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 5. ĐIỂM (Thang 100, 1 chữ số thập phân; hoặc "Chưa chấm") */}
                        <td className="py-3.5 px-4 text-center">
                          {item.isEvaluated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 font-black text-emerald-800 text-xs shadow-2xs">
                              <span>{formatMax2Decimals(item.totalScoreRounded)}đ</span>
                              {item.isFlagged && (
                                <span title="Chênh lệch > 15 điểm, chờ Ban 2.2 rà soát">
                                  <IconAlertTriangle size={13} className="text-amber-600 animate-pulse" />
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 font-bold text-[11px] border border-slate-200">
                              Chưa chấm
                            </span>
                          )}
                        </td>

                        {/* 6. TIỀN THƯỞNG (Định dạng VNĐ hoặc "—") */}
                        <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-xs whitespace-nowrap">
                          {item.isEvaluated && !item.isDisqualified ? formatRewardVnd(rewardVal) : "—"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      Chưa có dữ liệu bài cải tiến.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: XẾP HẠNG GIẢI TẬP THỂ (PHONG TRÀO 100Đ) */}
      {activeTab === "UNITS" && (
        <div className="space-y-0">
          <div className="p-4 bg-amber-50/90 border-b border-amber-200 text-xs text-amber-950">
            <span className="font-black block text-amber-950 text-xs">
              CƠ CHẾ ĐÁNH GIÁ PHONG TRÀO ĐƠN VỊ (THANG 100 ĐIỂM)
            </span>
            <span className="text-[11px] text-amber-900 font-medium block mt-0.5">
              1. Tỷ lệ tham gia (50đ, Sàn 15%→30đ, Trần ≥40%→50đ) &bull; 2. Tỷ lệ hồ sơ đạt chuẩn (30đ, Sàn 50%→18đ, Trần 100%→30đ) &bull; 3. Tỷ lệ lọt chung khảo (20đ, Sàn 20%→10đ, Trần ≥50%→20đ).
              Đơn vị cần TỐI THIỂU 3 bài hợp lệ/tháng mới được xét giải.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-16">HẠNG</th>
                  <th className="py-3.5 px-4 min-w-[200px]">ĐƠN VỊ / NHÀ MÁY</th>
                  <th className="py-3.5 px-4 text-center min-w-[160px]">TỶ LỆ THAM GIA (50Đ)</th>
                  <th className="py-3.5 px-4 text-center min-w-[160px]">HỒ SƠ ĐẠT CHUẨN (30Đ)</th>
                  <th className="py-3.5 px-4 text-center min-w-[160px]">LỌT CHUNG KHẢO (20Đ)</th>
                  <th className="py-3.5 px-4 text-right min-w-[130px]">TỔNG ĐIỂM (100)</th>
                  <th className="py-3.5 px-4 text-center min-w-[180px]">TRẠNG THÁI / DANH HIỆU</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {rankedUnits.length > 0 ? (
                  rankedUnits.map((u) => (
                    <tr key={u.unitName} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-4 px-4 text-center">
                        {u.rank === 1 ? (
                          <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-black text-sm flex items-center justify-center mx-auto border border-amber-300">
                            ⭐ 1
                          </span>
                        ) : u.rank === 2 ? (
                          <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center mx-auto border border-slate-300">
                            🔥 2
                          </span>
                        ) : u.rank > 0 ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200">
                            {u.rank}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-sm">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {u.unitName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block pt-0.5">
                          Quy mô: {u.totalEmployees.toLocaleString()} NLĐ &bull; Tổng bài nộp: {u.totalSubmitted}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="font-extrabold text-slate-900 text-xs">
                          {u.participationMetric.actualRateFormatted}
                        </div>
                        <div
                          className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-blue-200 cursor-help"
                          title="Nội suy tuyến tính: 30 + (tỷ lệ - 15) / (40 - 15) * 20. Sàn 15% (30đ), Trần ≥40% (50đ), Dưới 15% (0đ)."
                        >
                          {u.participationMetric.scoreFormatted} / 50đ
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="font-extrabold text-slate-900 text-xs">
                          {u.qualifiedMetric.actualRateFormatted}
                        </div>
                        <div
                          className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-200 cursor-help"
                          title="Nội suy tuyến tính: 18 + (tỷ lệ - 50) / (100 - 50) * 12. Sàn 50% (18đ), Trần 100% (30đ), Dưới 50% (0đ)."
                        >
                          {u.qualifiedMetric.scoreFormatted} / 30đ
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="font-extrabold text-slate-900 text-xs">
                          {u.finalistMetric.actualRateFormatted}
                        </div>
                        <div
                          className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-purple-200 cursor-help"
                          title="Nội suy tuyến tính: 10 + (tỷ lệ - 20) / (50 - 20) * 10. Sàn 20% (10đ), Trần ≥50% (20đ), Dưới 20% (0đ)."
                        >
                          {u.finalistMetric.scoreFormatted} / 20đ
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right font-black text-emerald-600 text-base">
                        <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950">
                          {formatMax2Decimals(u.totalCollectiveScoreRounded)}đ
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {u.awardTitle === "Xuất sắc" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black border border-amber-500">
                            🏆 XUẤT SẮC (HẠNG 1)
                          </span>
                        ) : u.awardTitle === "Tích cực" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-amber-300 text-xs font-black border border-slate-700">
                            🔥 TÍCH CỰC (HẠNG 2)
                          </span>
                        ) : u.isQualifiedForAward ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-extrabold border border-emerald-300">
                            <IconCheck size={13} />
                            <span>Đủ điều kiện xét giải</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[10.5px] font-bold border border-rose-200">
                            <span>⚠️ {u.qualificationNote}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 font-bold">
                      Chưa có dữ liệu phong trào đơn vị.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL WHEN A PROPOSAL ROW IS CLICKED */}
      {selectedProposalDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
                  CHI TIẾT ĐIỂM CHẤM 5 TIÊU CHÍ (THANG 100Đ)
                </span>
                <h3 className="text-base font-black text-white line-clamp-1 mt-0.5">
                  {selectedProposalDetail.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProposalDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tác giả đề xuất</span>
                  <span className="font-extrabold text-slate-900 block text-xs">
                    {selectedProposalDetail.proposer_name || "Nhân viên"} (MSNV: {selectedProposalDetail.proposer_emp_code || "CBCNV"})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Đơn vị công tác</span>
                  <span className="font-extrabold text-slate-900 block text-xs">
                    {selectedProposalDetail.unit}
                  </span>
                </div>
              </div>

              {/* Warnings */}
              {selectedProposalDetail.isFlagged && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 font-bold flex items-center gap-2">
                  <IconAlertTriangle size={18} className="text-amber-700 shrink-0" />
                  <span>CỜ CẢNH BÁO: Chênh lệch tổng điểm giữa 2 giám khảo &gt; 15đ (Chờ Ban 2.2 rà soát).</span>
                </div>
              )}

              {selectedProposalDetail.isDisqualified && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 font-bold flex items-center gap-2">
                  <span>🚫</span>
                  <span>HỒ SƠ BỊ LOẠI: Đã vi phạm điều kiện tiên quyết ({selectedProposalDetail.failedConditions?.join(", ")}).</span>
                </div>
              )}

              {/* Criteria breakdown */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">TIÊU CHÍ CHẤM ĐIỂM</th>
                      <th className="p-3 text-center">TỐI ĐA</th>
                      <th className="p-3 text-right">ĐIỂM ĐẠT ĐƯỢC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="p-3 font-bold text-slate-900">1. Hiệu quả thực tế đạt được</td>
                      <td className="p-3 text-center text-slate-400">35đ</td>
                      <td className="p-3 text-right font-black text-indigo-700">{selectedProposalDetail.c1Score}đ</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">2. Tính khả thi &amp; hiệu quả đầu tư</td>
                      <td className="p-3 text-center text-slate-400">20đ</td>
                      <td className="p-3 text-right font-black text-slate-700">{selectedProposalDetail.c2Score}đ</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">3. Khả năng nhân rộng</td>
                      <td className="p-3 text-center text-slate-400">20đ</td>
                      <td className="p-3 text-right font-black text-purple-700">{selectedProposalDetail.c3Score}đ</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">4. Tính sáng tạo &amp; chủ động</td>
                      <td className="p-3 text-center text-slate-400">15đ</td>
                      <td className="p-3 text-right font-black text-slate-700">{selectedProposalDetail.c4Score}đ</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">5. Lan tỏa &amp; tinh thần đội nhóm</td>
                      <td className="p-3 text-center text-slate-400">10đ</td>
                      <td className="p-3 text-right font-black text-slate-700">{selectedProposalDetail.c5Score}đ</td>
                    </tr>
                    <tr className="bg-emerald-50/80 font-black text-sm">
                      <td className="p-3 text-emerald-950">TỔNG ĐIỂM CHÍNH THỨC BGK</td>
                      <td className="p-3 text-center text-emerald-800">100đ</td>
                      <td className="p-3 text-right text-emerald-900">
                        {selectedProposalDetail.isEvaluated ? `${selectedProposalDetail.totalScoreRounded}đ` : "Chưa chấm"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProposalDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
