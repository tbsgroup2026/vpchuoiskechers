"use client";

import { getCurrentUser } from "@/lib/userProfiles";

import React, { useState, useEffect, useMemo } from "react";
import {
  IconAward,
  IconPlus,
  IconTrash,
  IconCopy,
  IconCheck,
  IconAlertTriangle,
  IconUserCheck,
  IconLink,
  IconRefresh,
  IconClock,
  IconListCheck,
  IconShieldCheck,
  IconSearch,
  IconFilter,
  IconLock,
  IconLockOpen,
  IconFileSpreadsheet,
  IconEye,
  IconHistory,
  IconFileText,
  IconEdit,
} from "@tabler/icons-react";

export default function JudgeManagementAdmin() {
  const [activeTab, setActiveTab] = useState<"rounds" | "guests" | "flags" | "reports">("guests");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [rounds, setRounds] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);

  // Tab 4 (Reports) State
  const [reportScores, setReportScores] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Tab 4 Extended Sub-views, Grouping & Pagination State
  const [reportSubView, setReportSubView] = useState<"matrix" | "summary" | "detailed">("detailed");
  const [reportQuery, setReportQuery] = useState("");
  const [reportRegion, setReportRegion] = useState("ALL");
  const [reportLockFilter, setReportLockFilter] = useState("ALL");
  const [reportSortOrder, setReportSortOrder] = useState<"NEWEST" | "OLDEST" | "SCORE_DESC" | "SCORE_ASC">("NEWEST");
  const [selectedProposalFilter, setSelectedProposalFilter] = useState<string | null>(null);

  // Pagination state
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(50);

  // Selection & Modal States
  const [selectedScoreDetail, setSelectedScoreDetail] = useState<any | null>(null);
  const [auditLogModalScoreId, setAuditLogModalScoreId] = useState<string | null>(null);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [selectedProposalScoresGroup, setSelectedProposalScoresGroup] = useState<any | null>(null);

  // Matrix Sub-view State
  const [matrixFilterMissingOnly, setMatrixFilterMissingOnly] = useState(false);

  // Round Creation Form
  const [newRoundTitle, setNewRoundTitle] = useState("");
  const [newFiscalYear, setNewFiscalYear] = useState(2026);
  const [newNsldUnitPrice, setNewNsldUnitPrice] = useState(50000);

  // Guest Account Creation Form
  const [guestRoundId, setGuestRoundId] = useState("");
  const [isSharedAccount, setIsSharedAccount] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [guestCreationMode, setGuestCreationMode] = useState<"quick" | "manual">("quick");
  const [manualFullName, setManualFullName] = useState("");
  const [manualEmailPhone, setManualEmailPhone] = useState("");
  const [manualUsername, setManualUsername] = useState("");
  const [manualPasscode, setManualPasscode] = useState("");
  const [manualValidDays, setManualValidDays] = useState(7);
  const [guestSearchQuery, setGuestSearchQuery] = useState("");

  // Edit Guest Modal State
  const [editingGuest, setEditingGuest] = useState<any | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPasscode, setEditPasscode] = useState("");
  const [editFullName, setEditFullName] = useState("");

  // Flag Resolution Form
  const [selectedFlag, setSelectedFlag] = useState<any | null>(null);
  const [overrideScoreInput, setOverrideScoreInput] = useState<number | "">(85);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");

  const getClientAuthToken = () => {
    if (typeof window === "undefined") return "";
    let token =
      localStorage.getItem("tbs_token") ||
      localStorage.getItem("tbs_jwt_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("tbs_token") ||
      sessionStorage.getItem("tbs_jwt_token") ||
      "";
    if (!token && typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )tbs_token=([^;]*)/);
      if (match && match[1]) token = match[1];
    }
    const cleanToken = token.startsWith("Bearer ") ? token.replace("Bearer ", "").trim() : token.trim();
    const safeToken = cleanToken.replace(/[^\x00-\xFF]/g, (c) => encodeURIComponent(c));
    return safeToken ? `Bearer ${safeToken}` : "";
  };

  useEffect(() => {
    loadRounds();
    loadGuests();
    loadFlags();
    loadReportScores();
  }, []);

  useEffect(() => {
    if (activeTab === "reports") {
      loadReportScores();
    }
  }, [activeTab]);

  const loadReportScores = async (queryVal = reportQuery, regionVal = reportRegion, lockVal = reportLockFilter) => {
    try {
      setReportLoading(true);
      let token = getClientAuthToken();
      const params = new URLSearchParams();
      if (queryVal.trim()) {
        params.append("q", queryVal.trim());
        params.append("query", queryVal.trim());
      }
      if (regionVal && regionVal !== "ALL") params.append("region", regionVal);
      if (lockVal && lockVal !== "ALL") {
        params.append("locked", lockVal);
        params.append("isLocked", lockVal);
      }

      const res = await fetch(`/api/ci-kaizen/judging/reports?${params.toString()}`, {
        headers: token ? { Authorization: token } : {},
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.scores)) {
        setReportScores(json.scores);
      } else {
        setReportScores([]);
      }
    } catch (e) {
      console.error("Failed to load report scores", e);
    } finally {
      setReportLoading(false);
    }
  };

  const loadAuditLogs = async (scoreId: string) => {
    try {
      setAuditLogModalScoreId(scoreId);
      let token = getClientAuthToken();
      const res = await fetch(`/api/ci-kaizen/judging/reports?score_id=${scoreId}`, {
        headers: token ? { Authorization: token } : {},
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.auditLogs)) {
        setAuditLogsList(json.auditLogs);
      } else {
        setAuditLogsList([]);
      }
    } catch (e) {
      setAuditLogsList([]);
    }
  };

  const matchesSearchQuery = (s: any, query: string) => {
    if (!query || !query.trim()) return true;
    const q = query.trim().toLowerCase();
    const scorerName = String(s.nguoi_cham_thuc_ho_ten || s.judge_name || "").toLowerCase();
    const scorerCode = String(s.real_scorer_emp_code || s.judge_id || "").toLowerCase();
    const scorerOrg = String(s.real_scorer_org || s.judge_role || "").toLowerCase();
    const guestUser = String(s.guest_username || "").toLowerCase();
    const propCode = String(s.proposal_code || "").toLowerCase();
    const propTitle = String(s.proposal_title || "").toLowerCase();
    const proposerName = String(s.proposer_name || "").toLowerCase();
    const proposerEmp = String(s.proposer_emp_code || "").toLowerCase();
    const subId = String(s.submission_id || "").toLowerCase();

    return (
      scorerName.includes(q) ||
      scorerCode.includes(q) ||
      scorerOrg.includes(q) ||
      guestUser.includes(q) ||
      propCode.includes(q) ||
      propTitle.includes(q) ||
      proposerName.includes(q) ||
      proposerEmp.includes(q) ||
      subId.includes(q)
    );
  };

  // Aggregated summary by proposal
  const proposalSummaryData = useMemo(() => {
    const map: Record<string, any> = {};
    let safeScores = Array.isArray(reportScores) ? reportScores : [];
    if (reportQuery.trim()) {
      safeScores = safeScores.filter((s) => matchesSearchQuery(s, reportQuery));
    }
    safeScores.forEach((s) => {
      if (!s) return;
      const key = s.submission_id || s.proposal_code;
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          submission_id: s.submission_id,
          proposal_code: s.proposal_code || s.submission_id,
          proposal_title: s.proposal_title || "---",
          proposal_region: s.proposal_region || "Nhà Máy Miền Đông",
          proposer_name: s.proposer_name || s.nguoi_cham_thuc_ho_ten || "---",
          proposer_emp_code: s.proposer_emp_code || s.real_scorer_emp_code || "---",
          scores: [],
        };
      }
      map[key].scores.push(s);
    });

    return Object.values(map).map((p) => {
      const totalScores = (p.scores || []).map((s: any) => Number(s?.total_score || 0));
      const count = totalScores.length;
      const sum = totalScores.reduce((acc: number, curr: number) => acc + curr, 0);
      const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
      const max = count > 0 ? Math.max(...totalScores) : 0;
      const min = count > 0 ? Math.min(...totalScores) : 0;
      const diff = max - min;

      let statusText = count >= 3 ? `🟢 ${count} BGK đã chấm` : (count > 0 ? `🟡 ${count} BGK đã chấm` : `🔴 0 BGK đã chấm`);
      let statusColor = count >= 3 ? "bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold" : (count > 0 ? "bg-amber-100 text-amber-950 border border-amber-300 font-bold" : "bg-rose-50 text-rose-900 border border-rose-200 font-bold");
      if (count >= 2 && diff > 15) {
        statusText = `⚠️ Chênh lệch >15đ (${count} BGK)`;
        statusColor = "bg-rose-100 text-rose-900 font-bold border border-rose-300";
      }

      return {
        ...p,
        count,
        avgScore: avg,
        maxScore: max,
        minScore: min,
        statusText,
        statusColor,
      };
    });
  }, [reportScores, reportQuery]);

  const uniqueJudgesList = useMemo(() => {
    const map: Record<string, { id: string; name: string; isGuest: boolean }> = {};
    let safeScores = Array.isArray(reportScores) ? reportScores : [];
    if (reportQuery.trim()) {
      safeScores = safeScores.filter((s) => matchesSearchQuery(s, reportQuery));
    }
    safeScores.forEach((s) => {
      if (!s) return;
      const judgeKey = s.guest_username || s.judge_id || s.nguoi_cham_thuc_ho_ten;
      if (!judgeKey) return;
      if (!map[judgeKey]) {
        map[judgeKey] = {
          id: judgeKey,
          name: s.nguoi_cham_thuc_ho_ten || s.judge_name || judgeKey,
          isGuest: Boolean(s.is_guest_shared || s.guest_username),
        };
      }
    });
    return Object.values(map);
  }, [reportScores, reportQuery]);

  const filteredReportScores = useMemo(() => {
    let list = Array.isArray(reportScores) ? [...reportScores] : [];

    if (reportQuery.trim()) {
      list = list.filter((s) => matchesSearchQuery(s, reportQuery));
    }

    if (selectedProposalFilter) {
      list = list.filter(
        (s) => s.submission_id === selectedProposalFilter || s.proposal_code === selectedProposalFilter
      );
    }

    if (reportSortOrder === "SCORE_DESC") {
      list.sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0));
    } else if (reportSortOrder === "SCORE_ASC") {
      list.sort((a, b) => (a.total_score ?? 0) - (b.total_score ?? 0));
    } else if (reportSortOrder === "NEWEST") {
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (reportSortOrder === "OLDEST") {
      list.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return list;
  }, [reportScores, reportQuery, selectedProposalFilter, reportSortOrder]);

  const paginatedReportScores = useMemo(() => {
    const start = (reportPage - 1) * reportPageSize;
    return filteredReportScores.slice(start, start + reportPageSize);
  }, [filteredReportScores, reportPage, reportPageSize]);

  const handleUnlockScore = async (scoreId: string) => {
    if (!window.confirm("🔒 Bạn có chắc chắn muốn MỞ KHÓA lượt chấm này để Giám Khảo có thể chỉnh sửa lại điểm?")) {
      return;
    }

    try {
      setLoading(true);
      let token = getClientAuthToken();
      const res = await fetch("/api/ci-kaizen/judging/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          action: "UNLOCK_SCORE",
          scoreId,
          reason: "Admin mở khóa từ giao diện Báo Cáo Chấm Điểm",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("✅ Đã mở khóa thành công! Giám khảo có thể đăng nhập lại để cập nhật điểm.");
        loadReportScores();
      } else {
        setMsg(`❌ ${json.error || "Không thể mở khóa lượt chấm"}`);
      }
    } catch (e) {
      setMsg("❌ Lỗi kết nối khi mở khóa");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportScores.length === 0) {
      alert("Không có dữ liệu báo cáo nào để xuất!");
      return;
    }

    const headers = [
      "Mã sáng kiến",
      "Tên sáng kiến",
      "Khu vực / Nhà máy",
      "MSNV người đăng ký",
      "Người đăng ký",
      "Tên giám khảo",
      "MSNV giám khảo",
      "Chức vụ giám khảo",
      "Điểm tiêu chí 1 – Hiệu quả thực tế đạt được (/35đ)",
      "Ghi chú tiêu chí 1",
      "Điểm tiêu chí 2 – Tính khả thi & hiệu quả đầu tư (/20đ)",
      "Ghi chú tiêu chí 2",
      "Điểm tiêu chí 3 – Khả năng nhân rộng (/20đ)",
      "Ghi chú tiêu chí 3",
      "Điểm tiêu chí 4 – Tính sáng tạo & chủ động (/15đ)",
      "Ghi chú tiêu chí 4",
      "Điểm tiêu chí 5 – Lan tỏa & tinh thần đội nhóm (/10đ)",
      "Ghi chú tiêu chí 5",
      "Tổng điểm giám khảo này chấm (/100đ)",
      "Trạng thái khóa điểm (Đã khóa / Chưa khóa)",
      "Điểm trung bình tổng hợp của sáng kiến (tất cả GK)",
      "Số giám khảo đã chấm / tổng số giám khảo được phân công",
      "Trạng thái tiến độ (Đủ lượt chấm / Thiếu lượt chấm)",
    ];

    const escapeCsvField = (str: any) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = reportScores.map((s) => {
      const pKey = s.submission_id || s.proposal_code;
      const pStats = proposalSummaryData.find((p: any) => p.submission_id === pKey || p.proposal_code === pKey);
      const avgScore = pStats ? pStats.avgScore : (s.total_score ?? 0);
      const countDone = pStats ? pStats.count : 1;
      const totalAssigned = 3;
      const progressRatio = `${countDone}/${totalAssigned}`;
      const progressStatus = countDone >= totalAssigned ? "Đủ lượt chấm" : "Thiếu lượt chấm";

      return [
        escapeCsvField(s.proposal_code || s.submission_id),
        escapeCsvField(s.proposal_title || "---"),
        escapeCsvField(s.proposal_region || "---"),
        escapeCsvField(s.proposer_emp_code || s.real_scorer_emp_code || "---"),
        escapeCsvField(s.proposer_name || s.nguoi_cham_thuc_ho_ten || "---"),
        escapeCsvField(s.nguoi_cham_thuc_ho_ten || s.judge_name || "---"),
        escapeCsvField(s.real_scorer_emp_code || "---"),
        escapeCsvField(s.real_scorer_org || s.judge_role || "Giám khảo"),
        escapeCsvField(s.c1_score ?? 0),
        escapeCsvField(s.c1_basis || ""),
        escapeCsvField(s.c2_score ?? 0),
        escapeCsvField(s.c2_basis || ""),
        escapeCsvField(s.c3_score ?? 0),
        escapeCsvField(s.c3_basis || ""),
        escapeCsvField(s.c4_score ?? 0),
        escapeCsvField(s.c4_basis || ""),
        escapeCsvField(s.c5_score ?? 0),
        escapeCsvField(s.c5_basis || ""),
        escapeCsvField(s.total_score ?? 0),
        escapeCsvField(Number(s.is_locked) === 1 ? "Đã khóa" : "Chưa khóa"),
        escapeCsvField(avgScore),
        escapeCsvField(progressRatio),
        escapeCsvField(progressStatus),
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Chi_Tiet_Cham_Diem_Kaizen_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadRounds = async () => {
    try {
      let token = getClientAuthToken();
      const res = await fetch("/api/ci-kaizen/judging/rounds", {
        headers: token ? { Authorization: token } : {},
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.rounds) && json.rounds.length > 0) {
        setRounds(json.rounds);
        if (!guestRoundId) {
          setGuestRoundId(json.rounds[0].id);
        }
      } else {
        const defaultR = [{ id: "ROUND_2026", title: "Hội Thi Sáng Kiến Kaizen 2026", fiscal_year: 2026, nsld_unit_price: 50000 }];
        setRounds(defaultR);
        if (!guestRoundId) setGuestRoundId("ROUND_2026");
      }
    } catch (e) {
      const defaultR = [{ id: "ROUND_2026", title: "Hội Thi Sáng Kiến Kaizen 2026", fiscal_year: 2026, nsld_unit_price: 50000 }];
      setRounds(defaultR);
      if (!guestRoundId) setGuestRoundId("ROUND_2026");
    }
  };

  const loadGuests = async () => {
    try {
      let token = getClientAuthToken();
      let empCode = "202608001";
      try {
        const cur = getCurrentUser();
        if (cur && cur.empCode) empCode = cur.empCode;
      } catch (e) {}

      const res = await fetch(`/api/ci-kaizen/judging/guests?action=LIST&t=${Date.now()}`, {
        headers: {
          "X-User-Emp-Code": empCode,
          ...(token ? { Authorization: token } : {}),
        },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.guests)) {
        setGuests((prev) => {
          const serverList = json.guests;
          const mergedMap = new Map();
          // Server items first
          serverList.forEach((g: any) => {
            const key = (g.username || g.id || "").toUpperCase();
            if (key) mergedMap.set(key, g);
          });
          // Preserve local optimistic items if not present in server list yet
          prev.forEach((p: any) => {
            const key = (p.username || p.id || "").toUpperCase();
            if (key && !mergedMap.has(key)) {
              mergedMap.set(key, p);
            }
          });
          return Array.from(mergedMap.values());
        });
      } else if (!json.success && json.error) {
        console.warn("loadGuests notice:", json.error);
      }
    } catch (e) {}
  };

  const loadFlags = async () => {
    try {
      let token = getClientAuthToken();
      const res = await fetch("/api/ci-kaizen/judging/flags", {
        headers: token ? { Authorization: token } : {},
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.flags)) {
        setFlags(json.flags);
      }
    } catch (e) {}
  };

  const handleCreateRound = async () => {
    if (!newRoundTitle.trim()) {
      setMsg("⚠️ Vui lòng nhập tên đợt chấm điểm!");
      return;
    }
    try {
      setLoading(true);
      let token = getClientAuthToken();
      const res = await fetch("/api/ci-kaizen/judging/rounds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          title: newRoundTitle.trim(),
          fiscalYear: newFiscalYear,
          nsldUnitPrice: newNsldUnitPrice,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("✅ Tạo đợt chấm điểm mới thành công!");
        setNewRoundTitle("");
        loadRounds();
      } else {
        setMsg(`❌ ${json.error || "Không thể tạo đợt chấm"}`);
      }
    } catch (e) {
      setMsg("❌ Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuest = async (isManual = false) => {
    const finalRoundId = guestRoundId || (rounds.length > 0 ? rounds[0].id : "ROUND_2026");

    const payload: any = {
      action: "CREATE",
      roundId: finalRoundId,
      validDays: isManual ? manualValidDays : 7,
      dungChung: isSharedAccount ? 1 : 0,
    };

    if (isManual) {
      if (manualFullName.trim()) payload.fullName = manualFullName.trim();
      if (manualEmailPhone.trim()) payload.emailPhone = manualEmailPhone.trim();
      if (manualUsername.trim()) payload.username = manualUsername.trim();
      if (manualPasscode.trim()) payload.passcode = manualPasscode.trim();
    }

    try {
      setLoading(true);
      let token = getClientAuthToken();
      const res = await fetch("/api/ci-kaizen/judging/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        const uName = json.username || json.createdGuests?.[0]?.username || payload.username || "BGK-XXXX";
        const pCode = json.oneTimePasscode || json.createdGuests?.[0]?.oneTimePasscode || payload.passcode || "XXXXXX";
        const gId = json.guestId || json.createdGuests?.[0]?.guestId || `guest_${Date.now()}`;
        const newGuestItem = {
          id: gId,
          username: uName,
          one_time_passcode: pCode,
          full_name: payload.fullName || `BGK Khách Mời (${uName})`,
          email_phone: payload.emailPhone || "",
          round_id: payload.roundId || "ROUND_2026",
          dung_chung: payload.dungChung ?? 1,
          created_at: new Date().toISOString(),
          is_revoked: 0,
        };

        setGuests((prev) => {
          const exists = prev.some((g) => (g.username && g.username.toUpperCase() === uName.toUpperCase()) || g.id === gId);
          if (exists) {
            return prev.map((g) => (g.username && g.username.toUpperCase() === uName.toUpperCase() ? { ...g, ...newGuestItem, one_time_passcode: pCode } : g));
          }
          return [newGuestItem, ...prev];
        });

        setMsg(`✅ Tạo thành công tài khoản BGK Khách Mời! User: ${uName} | Pass 1 lần: ${pCode}`);
        if (isManual) {
          setManualFullName("");
          setManualEmailPhone("");
          setManualUsername("");
          setManualPasscode("");
        }
        setTimeout(() => loadGuests(), 300);
      } else {
        setMsg(`❌ ${json.error || "Không thể tạo tài khoản BGK khách"}`);
      }
    } catch (e) {
      setMsg("❌ Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeGuest = async (guestId: string) => {
    try {
      let token = getClientAuthToken();
      const res = await fetch(`/api/ci-kaizen/judging/guests?id=${guestId}`, {
        method: "DELETE",
        headers: token ? { Authorization: token } : {},
      });
      const json = await res.json();
      if (json.success) {
        setMsg("✅ Đã thu hồi quyền truy cập của BGK khách!");
        loadGuests();
      }
    } catch (e) {}
  };

  const handleDeleteGuest = async (guestId: string, username: string) => {
    if (!window.confirm(`⚠️ Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản BGK '${username}' khỏi hệ thống?`)) {
      return;
    }
    try {
      setLoading(true);
      let token = getClientAuthToken();
      const res = await fetch(`/api/ci-kaizen/judging/guests?id=${guestId}&hard=true`, {
        method: "DELETE",
        headers: token ? { Authorization: token } : {},
      });
      const json = await res.json();
      if (json.success) {
        setMsg(`🗑️ Đã xóa vĩnh viễn tài khoản BGK: ${username}`);
        setGuests((prev) => prev.filter((g) => g.id !== guestId));
        setTimeout(() => loadGuests(), 500);
      } else {
        setMsg(`❌ ${json.error || "Không thể xóa tài khoản"}`);
      }
    } catch (e) {
      setMsg("❌ Lỗi kết nối khi xóa tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditGuestModal = (g: any) => {
    setEditingGuest(g);
    setEditUsername(g.username || "");
    setEditPasscode(g.one_time_passcode || "");
    setEditFullName(g.full_name || "");
  };

  const handleSaveEditGuest = async () => {
    if (!editingGuest) return;
    if (!editUsername.trim() || !editPasscode.trim()) {
      alert("Vui lòng nhập Username và Passcode!");
      return;
    }

    try {
      setLoading(true);
      let token = getClientAuthToken();
      const res = await fetch("/api/ci-kaizen/judging/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          action: "UPDATE",
          guestId: editingGuest.id,
          username: editUsername.trim(),
          passcode: editPasscode.trim(),
          fullName: editFullName.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(`✅ Đã cập nhật thành công tài khoản BGK: ${editUsername.trim()}`);
        setGuests((prev) =>
          prev.map((g) =>
            g.id === editingGuest.id
              ? {
                  ...g,
                  username: editUsername.trim(),
                  one_time_passcode: editPasscode.trim(),
                  full_name: editFullName.trim() || g.full_name,
                  is_revoked: 0,
                }
              : g
          )
        );
        setEditingGuest(null);
        setTimeout(() => loadGuests(), 500);
      } else {
        setMsg(`❌ ${json.error || "Không thể cập nhật tài khoản BGK"}`);
      }
    } catch (e) {
      setMsg("❌ Lỗi kết nối khi cập nhật tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFlagOverride = async () => {
    if (!selectedFlag || overrideScoreInput === "") return;
    try {
      setLoading(true);
      let token = getClientAuthToken();
      const res = await fetch("/api/ci-kaizen/judging/flags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          action: "RESOLVE_OVERRIDE",
          flagId: selectedFlag.id,
          submissionId: selectedFlag.submission_id,
          overrideScore: Number(overrideScoreInput),
          resolutionNote: resolutionNoteInput.trim() || "Chốt điểm thủ công theo biên bản họp Ban 2.2",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(`✅ ${json.message}`);
        setSelectedFlag(null);
        loadFlags();
      }
    } catch (e) {
      setMsg("❌ Lỗi xử lý chốt điểm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
            👑 QUẢN TRỊ VIÊN BAN 2.2 / BAN TỔ CHỨC
          </span>
          <h1 className="text-xl sm:text-2xl font-black mt-2">
            Quản Lý Ban Giám Khảo &amp; Báo Cáo Chấm Điểm
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Thiết lập đợt chấm, cấp tài khoản BGK khách mời (Magic Link), rà soát chênh lệch điểm &amp; xuất báo cáo phẳng 23 cột
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
              activeTab === "reports"
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            <IconFileSpreadsheet size={16} />
            <span>Xem Báo Cáo Chấm Điểm</span>
            {reportScores.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-950 text-white text-[10px]">
                {reportScores.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs flex items-center justify-between animate-in fade-in">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 font-black">✕</button>
        </div>
      )}

      {/* TABS HEADER */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("rounds")}
          className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all cursor-pointer ${
            activeTab === "rounds"
              ? "bg-[#006838] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          🏆 1. Quản Lý Đợt Chấm
        </button>
        <button
          onClick={() => setActiveTab("guests")}
          className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all cursor-pointer ${
            activeTab === "guests"
              ? "bg-[#006838] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          🔑 2. Cấp Tài Khoản BGK Khách Mời
        </button>
        <button
          onClick={() => setActiveTab("flags")}
          className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all cursor-pointer relative ${
            activeTab === "flags"
              ? "bg-[#006838] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          ⚠️ 3. Rà Soát Chênh Lệch Điểm
          {flags.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
              {flags.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "reports"
              ? "bg-[#006838] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <IconFileSpreadsheet size={15} />
          <span>📊 4. Tổng Hợp &amp; Báo Cáo Chấm Điểm ({reportScores.length})</span>
        </button>
      </div>

      {/* TAB 1: ROUNDS */}
      {activeTab === "rounds" && (
        <div className="space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">Tạo đợt thi đua / chấm điểm mới</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Tên đợt chấm (Vd: Hội thi Kaizen Q3/2026)"
                value={newRoundTitle}
                onChange={(e) => setNewRoundTitle(e.target.value)}
                className="p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              />
              <input
                type="number"
                placeholder="Năm tài chính (vd 2026)"
                value={newFiscalYear}
                onChange={(e) => setNewFiscalYear(parseInt(e.target.value) || 2026)}
                className="p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              />
              <input
                type="number"
                placeholder="Đơn giá NSLĐ TB toàn ngành (đ/giờ)"
                value={newNsldUnitPrice}
                onChange={(e) => setNewNsldUnitPrice(parseFloat(e.target.value) || 50000)}
                className="p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              />
            </div>
            <button
              onClick={handleCreateRound}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white font-black text-xs cursor-pointer shadow-md"
            >
              + Tạo Đợt Chấm Mới
            </button>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900">Danh sách các Đợt Chấm điểm hiện tại</h3>
            <div className="space-y-2">
              {rounds.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-bold bg-slate-50">
                  <div>
                    <span className="font-black text-slate-900 block">{r.title}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Năm: {r.fiscal_year} &bull; Đơn giá NSLĐ TB: {r.nsld_unit_price}đ &bull; Tạo ngày: {r.created_at}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    {r.status || "ACTIVE"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GUEST ACCOUNTS */}
      {activeTab === "guests" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-slate-800 text-white shadow-xl space-y-5">
            {/* MODE SWITCHER HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                  🔑 QUẢN LÝ BGK KHÁCH MỜI
                </span>
                <h3 className="text-base font-black text-white mt-1">Cấp Tài Khoản &amp; Mật Khẩu Cho Giám Khảo Khách Mời</h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-0.5">
                  Tạo tài khoản Magic Link cho Giám Khảo ngoài hệ thống. Giám khảo có thể khai báo thông tin khi đăng nhập hoặc Admin có thể điền trước.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setGuestCreationMode("quick")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    guestCreationMode === "quick"
                      ? "bg-emerald-500 text-slate-950 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  ⚡ 1. Sinh Tự Động Ngẫu Nhiên
                </button>
                <button
                  type="button"
                  onClick={() => setGuestCreationMode("manual")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    guestCreationMode === "manual"
                      ? "bg-emerald-500 text-slate-950 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  📝 2. Form Nhập Thủ Công
                </button>
              </div>
            </div>

            {/* MODE 1: QUICK AUTOMATIC GENERATION */}
            {guestCreationMode === "quick" && (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-amber-400">⚡ Chế độ Sinh Nhanh (1-Click)</span>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Hệ thống sẽ tự động sinh mã User (`BGK-XXXX`) &amp; Mật khẩu 6 số. Giám Khảo Khách Mời sẽ tự điền Form Khai Báo Bắt Buộc khi đăng nhập.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
                  <select
                    value={guestRoundId}
                    onChange={(e) => setGuestRoundId(e.target.value)}
                    className="p-3 rounded-xl border border-slate-700 text-xs font-bold bg-slate-800 text-white cursor-pointer"
                  >
                    {rounds.map((r) => (
                      <option key={r.id} value={r.id}>
                        🏆 {r.title}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={isSharedAccount}
                      onChange={(e) => setIsSharedAccount(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>Dùng Chung (Nhiều người)</span>
                  </label>

                  <button
                    onClick={() => handleCreateGuest(false)}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span>⚡ Sinh Ngay User &amp; Pass</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: MANUAL DETAILED FORM */}
            {guestCreationMode === "manual" && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-extrabold text-emerald-400">📝 Chế độ Form Nhập Thông Tin Giám Khảo Chi Tiết</span>
                  <span className="text-[11px] text-slate-400">Có thể để trống User/Pass để hệ thống tự tạo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Họ và Tên Giám Khảo (Khách Mời):</label>
                    <input
                      type="text"
                      placeholder="Vd: GS.TS Nguyễn Văn A"
                      value={manualFullName}
                      onChange={(e) => setManualFullName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Chức Vụ / Đơn Vị Công Tác:</label>
                    <input
                      type="text"
                      placeholder="Vd: Đại học Bách Khoa / Chuyên gia Lean"
                      value={manualEmailPhone}
                      onChange={(e) => setManualEmailPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Đợt Chấm Điểm:</label>
                    <select
                      value={guestRoundId}
                      onChange={(e) => setGuestRoundId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {rounds.map((r) => (
                        <option key={r.id} value={r.id}>
                          🏆 {r.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 block">Tên Đăng Nhập (Username):</label>
                      <button
                        type="button"
                        onClick={() => setManualUsername(`BGK-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="text-[10px] text-emerald-400 hover:underline font-bold"
                      >
                        🎲 Tạo ngẫu nhiên
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Vd: BGK-1001 hoặc nam.nguyen"
                      value={manualUsername}
                      onChange={(e) => setManualUsername(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 block">Mật Khẩu 1 Lần (Passcode):</label>
                      <button
                        type="button"
                        onClick={() => setManualPasscode(`${Math.floor(100000 + Math.random() * 900000)}`)}
                        className="text-[10px] text-amber-400 hover:underline font-bold"
                      >
                        🎲 Tạo ngẫu nhiên
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Vd: 888999"
                      value={manualPasscode}
                      onChange={(e) => setManualPasscode(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Thời Hạn Hiệu Lực:</label>
                    <select
                      value={manualValidDays}
                      onChange={(e) => setManualValidDays(Number(e.target.value) || 7)}
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value={1}>⏱️ 24 giờ (1 ngày)</option>
                      <option value={3}>⏱️ 3 ngày</option>
                      <option value={7}>⏱️ 7 ngày (1 tuần)</option>
                      <option value={30}>⏱️ 30 ngày (1 tháng)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={isSharedAccount}
                      onChange={(e) => setIsSharedAccount(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                    <span>Tài khoản Dùng Chung (Nhiều giám khẩu dùng chung 1 link, tự nhập tên khi chấm)</span>
                  </label>

                  <button
                    onClick={() => handleCreateGuest(true)}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span>+ Tạo &amp; Cấp Tài Khoản BGK Khách Mời</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ACCOUNTS LIST & SEARCH */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Danh Sách Tài Khoản &amp; Pass 1 Lần BGK Khách Mời</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-black">
                    {guests.length} tài khoản
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý quyền truy cập, theo dõi trạng thái khai báo form và thu hồi tài khoản khi hết đợt
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <IconSearch size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo User, Pass, Họ tên..."
                    value={guestSearchQuery}
                    onChange={(e) => setGuestSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={loadGuests}
                  title="Làm mới danh sách"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors shrink-0"
                >
                  <IconRefresh size={16} />
                </button>
              </div>
            </div>

            {/* LIST OR EMPTY STATE */}
            {(() => {
              const filtered = guests.filter((g) => {
                if (!guestSearchQuery.trim()) return true;
                const q = guestSearchQuery.toLowerCase();
                return (
                  String(g.username || "").toLowerCase().includes(q) ||
                  String(g.one_time_passcode || "").toLowerCase().includes(q) ||
                  String(g.full_name || "").toLowerCase().includes(q) ||
                  String(g.email_phone || "").toLowerCase().includes(q) ||
                  String(g.organization || "").toLowerCase().includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-10 rounded-3xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                      <IconUserCheck size={28} />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h4 className="text-sm font-black text-slate-800">
                        {guestSearchQuery.trim() ? "Không tìm thấy tài khoản nào khớp từ khóa" : "Chưa có tài khoản BGK Khách Mời nào"}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {guestSearchQuery.trim()
                          ? "Thử thay đổi từ khóa tìm kiếm hoặc bấm nút làm mới."
                          : "Bấm nút 'Sinh Ngay User & Pass' ở bảng trên hoặc chuyển sang 'Form Nhập Thủ Công' để tạo tài khoản BGK Khách Mời đầu tiên."}
                      </p>
                    </div>

                    {!guestSearchQuery.trim() && (
                      <button
                        onClick={() => handleCreateGuest(false)}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white font-black text-xs cursor-pointer shadow-md inline-flex items-center gap-2"
                      >
                        ⚡ Sinh Nhanh 1 Tài Khoản Ngay
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filtered.map((g) => {
                    const usernameDisplay = g.username || "BGK-XXXX";
                    const passDisplay = g.one_time_passcode || "XXXXXX";
                    const magicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/work/kaizen/van-phong-chuoi?bgkUser=${usernameDisplay}&pass=${passDisplay}`;
                    const isRevoked = Boolean(g.is_revoked);
                    const isDeclSubmitted = Boolean(g.declaration_submitted);

                    return (
                      <div
                        key={g.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                          isRevoked ? "border-rose-200 bg-rose-50/40 opacity-70" : "border-slate-200 bg-slate-50/70 hover:bg-slate-50"
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-900 text-indigo-100 font-mono font-black text-xs">
                              👤 User: {usernameDisplay}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-950 font-mono font-black text-xs">
                              🔑 Pass: {passDisplay}
                            </span>
                            {Boolean(g.dung_chung ?? 1) && (
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-black flex items-center gap-1">
                                👥 DÙNG CHUNG
                              </span>
                            )}
                            {isDeclSubmitted ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                                <IconCheck size={12} /> Đã khai báo: {g.full_name} ({g.organization || "Chuyên gia"})
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black flex items-center gap-1">
                                <IconClock size={12} /> Chờ khai báo Form bắt buộc
                              </span>
                            )}
                            {isRevoked && (
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Đã thu hồi</span>
                            )}
                          </div>

                          <div className="text-[11px] font-mono text-indigo-700 select-all truncate max-w-xl">
                            🔗 {magicUrl}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`User: ${usernameDisplay} | Pass: ${passDisplay}`);
                              setCopiedToken(`up_${g.id}`);
                              setTimeout(() => setCopiedToken(null), 2000);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <IconCopy size={13} />
                            <span>{copiedToken === `up_${g.id}` ? "Đã copy User/Pass!" : "Copy User & Pass"}</span>
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(magicUrl);
                              setCopiedToken(g.id);
                              setTimeout(() => setCopiedToken(null), 2000);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <IconLink size={13} />
                            <span>{copiedToken === g.id ? "Đã copy Link!" : "Copy Link"}</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditGuestModal(g)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/60 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                            title="Chỉnh sửa Username & Mật Khẩu"
                          >
                            <IconEdit size={13} />
                            <span>Sửa User & Pass</span>
                          </button>

                          {!isRevoked && (
                            <button
                              onClick={() => handleRevokeGuest(g.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] cursor-pointer"
                              title="Thu hồi quyền truy cập"
                            >
                              Thu hồi
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteGuest(g.id, usernameDisplay)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                            title="Xóa vĩnh viễn tài khoản khỏi hệ thống"
                          >
                            <IconTrash size={13} />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: DIVERGENCE FLAGS */}
      {activeTab === "flags" && (
        <div className="space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <IconAlertTriangle size={18} className="text-rose-600" />
              <span>Danh Sách Cảnh Báo Chênh Lệch Điểm Giám Khảo &gt; 15 Điểm</span>
            </h3>

            {flags.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold">
                ✓ Hiện không có hồ sơ nào bị cờ chênh lệch điểm.
              </div>
            ) : (
              <div className="space-y-3">
                {flags.map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl border-2 border-rose-200 bg-rose-50/50 space-y-3 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                          Mã: {f.code || f.submission_id}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">{f.title}</h4>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-[10px]">
                        ⚠️ Cần Ban 2.2 Rà Soát
                      </span>
                    </div>

                    <p className="text-xs text-rose-900 font-bold bg-white p-2.5 rounded-xl border border-rose-200">
                      {f.flag_message}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedFlag(f);
                          setOverrideScoreInput(85);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-md"
                      >
                        Chốt Điểm Thủ Công
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OVERRIDE MODAL */}
          {selectedFlag && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                <h3 className="text-base font-black text-slate-900">
                  Chốt Điểm Thủ Công Phê Duyệt (Ban 2.2)
                </h3>
                <p className="text-xs text-slate-600">
                  Hồ sơ: <strong>{selectedFlag.title}</strong>
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Nhập tổng điểm chốt chính thức (0 - 100đ):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={overrideScoreInput}
                    onChange={(e) => setOverrideScoreInput(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-sm bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Ghi chú biên bản họp thống nhất:</label>
                  <textarea
                    rows={3}
                    value={resolutionNoteInput}
                    onChange={(e) => setResolutionNoteInput(e.target.value)}
                    placeholder="Nhập nội dung biên bản họp thống nhất của Ban 2.2..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedFlag(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleResolveFlagOverride}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md cursor-pointer"
                  >
                    Xác nhận &amp; Đưa vào Ranking
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REPORTS & DETAILED SCORES */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  📊 4. SÁNG KIẾN ĐÃ CHẤM &amp; BÁO CÁO BAN 2.2
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Báo Cáo Chi Tiết &amp; Ma Trận "Sáng Kiến × Giám Khảo"
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi tiến độ chấm, phát hiện sáng kiến bị sót, rà soát chênh lệch điểm &amp; xuất báo cáo Excel
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
                >
                  <IconFileSpreadsheet size={16} />
                  <span>Xuất Excel (.xlsx / .csv)</span>
                </button>

                <button
                  onClick={() => loadReportScores()}
                  title="Làm mới dữ liệu báo cáo"
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  <IconRefresh size={16} />
                </button>
              </div>
            </div>

            {/* SUB-VIEW NAVIGATION TABS */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
              <button
                onClick={() => setReportSubView("matrix")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  reportSubView === "matrix"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>🧩 1. Ma Trận (Sáng Kiến × Giám Khảo)</span>
              </button>

              <button
                onClick={() => setReportSubView("summary")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  reportSubView === "summary"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>📋 2. Bảng Tổng Hợp Theo Sáng Kiến ({proposalSummaryData.length})</span>
              </button>

              <button
                onClick={() => setReportSubView("detailed")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  reportSubView === "detailed"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <IconFileText size={16} />
                <span>📄 3. Bảng Điểm Chi Tiết ({reportScores.length} lượt)</span>
              </button>
            </div>

            {/* COMMON SEARCH & FILTERS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="relative">
                <IconSearch size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên giám khảo, MSNV, sáng kiến..."
                  value={reportQuery}
                  onChange={(e) => {
                    setReportQuery(e.target.value);
                    loadReportScores(e.target.value, reportRegion, reportLockFilter);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <IconFilter size={15} className="text-slate-500 shrink-0" />
                <select
                  value={reportRegion}
                  onChange={(e) => {
                    setReportRegion(e.target.value);
                    loadReportScores(reportQuery, e.target.value, reportLockFilter);
                  }}
                  className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                >
                  <option value="ALL">🌐 Tất cả Nhà máy / Khu vực</option>
                  <option value="Văn phòng Chuỗi">🏢 Văn phòng Chuỗi</option>
                  <option value="Nhà Máy Miền Đông">🏭 Nhà Máy Miền Đông</option>
                  <option value="THKG">📍 THKG</option>
                  <option value="Phòng Ban THKG">&nbsp;&nbsp;&nbsp;↳ Phòng Ban THKG</option>
                  <option value="Kiên Giang 1">&nbsp;&nbsp;&nbsp;↳ Kiên Giang 1</option>
                  <option value="Kiên Giang 2">&nbsp;&nbsp;&nbsp;↳ Kiên Giang 2</option>
                  <option value="Kiên Giang 3">&nbsp;&nbsp;&nbsp;↳ Kiên Giang 3</option>
                  <option value="Hoàn Thiện Đế">&nbsp;&nbsp;&nbsp;↳ Hoàn Thiện Đế</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <IconLock size={15} className="text-slate-500 shrink-0" />
                <select
                  value={reportLockFilter}
                  onChange={(e) => {
                    setReportLockFilter(e.target.value);
                    loadReportScores(reportQuery, reportRegion, e.target.value);
                  }}
                  className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                >
                  <option value="ALL">🔒 Tất cả trạng thái khóa</option>
                  <option value="1">🔒 Đã khóa (Chính thức)</option>
                  <option value="0">🔓 Đã mở khóa / Đang chấm</option>
                </select>
              </div>
            </div>

            {/* SUB-VIEW 1: MATRIX */}
            {reportSubView === "matrix" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs">
                  <div>
                    <span className="font-black text-amber-950 block">🧩 Ma Trận Theo Dõi Sáng Kiến × Giám Khảo</span>
                    <span className="text-[11px] text-amber-900 block">
                      Mỗi hàng = 1 Sáng kiến | Mỗi cột = 1 Giám khảo đã chấm | Ô = Trạng thái điểm &amp; Khóa
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer shrink-0 bg-white border border-amber-300 px-3 py-1.5 rounded-xl font-extrabold text-amber-950">
                    <input
                      type="checkbox"
                      checked={matrixFilterMissingOnly}
                      onChange={(e) => setMatrixFilterMissingOnly(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    <span>🔴 Chỉ hiện sáng kiến đang thiếu giám khảo (&lt; 3 lượt)</span>
                  </label>
                </div>

                {reportLoading ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-bold">
                    ⌛ Đang tải dữ liệu ma trận...
                  </div>
                ) : proposalSummaryData.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold">
                    🔴 Chưa có dữ liệu ma trận phù hợp với bộ lọc.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-700 border-collapse">
                      <thead className="bg-slate-900 text-white text-[11px] font-black uppercase sticky top-0 z-20">
                        <tr>
                          <th className="p-3 border-r border-slate-800 min-w-[200px]"># Mã &amp; Tên Sáng Kiến</th>
                          <th className="p-3 border-r border-slate-800">Nhà máy / Khu vực</th>
                          {uniqueJudgesList.map((j) => (
                            <th key={j.id} className="p-3 text-center border-r border-slate-800 min-w-[130px]">
                              <div className="truncate font-black">{j.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono font-normal truncate">
                                {j.id} {j.isGuest ? "(Khách)" : "(Nội bộ)"}
                              </div>
                            </th>
                          ))}
                          <th className="p-3 text-center min-w-[120px]">Tiến độ chấm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white font-medium">
                        {proposalSummaryData
                          .filter((p) => (matrixFilterMissingOnly ? p.count < 3 : true))
                          .map((p, idx) => {
                            return (
                              <tr key={p.submission_id || idx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 border-r border-slate-200 font-bold">
                                  <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] block w-fit">
                                    {p.proposal_code}
                                  </span>
                                  <div className="font-black text-slate-900 line-clamp-2 mt-0.5" title={p.proposal_title}>
                                    {p.proposal_title}
                                  </div>
                                </td>

                                <td className="p-3 border-r border-slate-200 text-[11px] text-slate-600 font-semibold whitespace-nowrap">
                                  {p.proposal_region}
                                </td>

                                {uniqueJudgesList.map((j) => {
                                  const matchingScore = p.scores.find(
                                    (s: any) =>
                                      (s.guest_username || s.judge_id || s.nguoi_cham_thuc_ho_ten) === j.id ||
                                      s.nguoi_cham_thuc_ho_ten === j.name
                                  );

                                  if (!matchingScore) {
                                    return (
                                      <td key={j.id} className="p-3 text-center border-r border-slate-200 text-slate-300 font-mono text-[11px]">
                                        <span className="text-slate-300">—</span>
                                      </td>
                                    );
                                  }

                                  const isLocked = Number(matchingScore.is_locked) === 1;
                                  return (
                                    <td key={j.id} className="p-3 text-center border-r border-slate-200">
                                      {isLocked ? (
                                        <span
                                          onClick={() => setSelectedScoreDetail(matchingScore)}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-black text-xs cursor-pointer hover:bg-emerald-200 inline-block shadow-2xs"
                                          title={`Người chấm: ${matchingScore.nguoi_cham_thuc_ho_ten} (${matchingScore.real_scorer_emp_code || "---"})\nClick xem chi tiết`}
                                        >
                                          🟢 {matchingScore.total_score}đ
                                        </span>
                                      ) : (
                                        <span
                                          onClick={() => setSelectedScoreDetail(matchingScore)}
                                          className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-mono font-black text-xs cursor-pointer hover:bg-amber-200 inline-block shadow-2xs"
                                          title={`Đang chấm dở/Mở khóa. Click xem chi tiết`}
                                        >
                                          🟡 {matchingScore.total_score}đ
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}

                                <td className="p-3 text-center whitespace-nowrap space-y-1">
                                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black block w-fit mx-auto shadow-2xs ${p.statusColor}`}>
                                    {p.statusText}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedProposalScoresGroup(p)}
                                    className="px-2 py-0.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10.5px] font-bold flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer shadow-2xs"
                                  >
                                    <IconEye size={13} />
                                    <span>Chi tiết bảng điểm ({p.count})</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 2: SUMMARY BY PROPOSAL */}
            {reportSubView === "summary" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-black text-indigo-950 block">📋 Bảng Tổng Hợp Theo Sáng Kiến</span>
                    <span className="text-[11px] text-indigo-800 block">
                      Click vào 1 sáng kiến bất kỳ để lọc nhanh bảng điểm chi tiết bên dưới theo sáng kiến đó
                    </span>
                  </div>

                  {selectedProposalFilter && (
                    <button
                      onClick={() => setSelectedProposalFilter(null)}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer"
                    >
                      ✕ Bỏ lọc ({selectedProposalFilter})
                    </button>
                  )}
                </div>

                {reportLoading ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-bold">
                    ⌛ Đang tải dữ liệu tổng hợp sáng kiến...
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-900 text-[11px] font-black uppercase border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Mã &amp; Tên Sáng Kiến</th>
                          <th className="p-3">Nhà máy / Khu vực</th>
                          <th className="p-3 text-center">Số lượt đã chấm</th>
                          <th className="p-3 text-center">Điểm TB</th>
                          <th className="p-3 text-center">Điểm cao nhất</th>
                          <th className="p-3 text-center">Điểm thấp nhất</th>
                          <th className="p-3 text-center">Trạng thái tổng hợp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white font-medium">
                        {proposalSummaryData.map((p, idx) => {
                          const isSelected = selectedProposalFilter === p.submission_id || selectedProposalFilter === p.proposal_code;
                          return (
                            <tr
                              key={p.submission_id || idx}
                              onClick={() => {
                                setSelectedProposalFilter(isSelected ? null : p.submission_id);
                                setReportSubView("detailed");
                              }}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? "bg-indigo-50 border-l-4 border-indigo-600 font-bold" : "hover:bg-slate-50"
                              }`}
                            >
                              <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-3">
                                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                                  {p.proposal_code}
                                </span>
                                <div className="font-black text-slate-900 mt-0.5 line-clamp-1">{p.proposal_title}</div>
                              </td>
                              <td className="p-3 text-[11px] text-slate-600 font-semibold">{p.proposal_region}</td>
                              <td className="p-3 text-center font-bold font-mono text-sm">{p.count} lượt</td>
                              <td className="p-3 text-center font-black font-mono text-emerald-700 text-sm">
                                {p.avgScore}đ
                              </td>
                              <td className="p-3 text-center font-bold font-mono text-slate-800">{p.maxScore}đ</td>
                              <td className="p-3 text-center font-bold font-mono text-slate-800">{p.minScore}đ</td>
                              <td className="p-3 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-black ${p.statusColor}`}>
                                  {p.statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 3: FLAT DETAILED SCORE TABLE (23 EXACT COLUMNS) */}
            {reportSubView === "detailed" && (
              <div className="space-y-4">
                {/* Grouping & Sorting Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-3 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <span>🔃 Sắp xếp:</span>
                      <select
                        value={reportSortOrder}
                        onChange={(e) => setReportSortOrder(e.target.value as any)}
                        className="p-1.5 rounded-xl bg-white border border-slate-300 font-black text-xs cursor-pointer"
                      >
                        <option value="NEWEST">🕒 Mới nhất trước</option>
                        <option value="OLDEST">⏳ Cũ nhất trước</option>
                        <option value="SCORE_DESC">⭐ Điểm tổng: Cao ➔ Thấp</option>
                        <option value="SCORE_ASC">⭐ Điểm tổng: Thấp ➔ Cao</option>
                      </select>
                    </div>

                    {selectedProposalFilter && (
                      <button
                        onClick={() => setSelectedProposalFilter(null)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer"
                      >
                        ✕ Bỏ lọc sáng kiến ({selectedProposalFilter})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 font-bold">
                    <span>Trang {reportPage} / {Math.max(1, Math.ceil(filteredReportScores.length / reportPageSize))}</span>
                    <select
                      value={reportPageSize}
                      onChange={(e) => {
                        setReportPageSize(Number(e.target.value));
                        setReportPage(1);
                      }}
                      className="p-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                    >
                      <option value={20}>20 dòng/trang</option>
                      <option value={50}>50 dòng/trang</option>
                      <option value={100}>100 dòng/trang</option>
                    </select>
                  </div>
                </div>

                {/* Flat Table Area */}
                {reportLoading ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-bold">
                    ⌛ Đang tải danh sách lượt chấm chi tiết...
                  </div>
                ) : filteredReportScores.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold">
                    🔴 Chưa có lượt chấm điểm nào khớp với bộ lọc.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap border-collapse">
                      <thead className="bg-slate-900 text-white text-[11px] font-black uppercase sticky top-0 z-20">
                        <tr>
                          <th className="p-3 border-r border-slate-800">#</th>
                          <th className="p-3 border-r border-slate-800 min-w-[120px]">Mã sáng kiến</th>
                          <th className="p-3 border-r border-slate-800 min-w-[220px]">Tên sáng kiến</th>
                          <th className="p-3 border-r border-slate-800">Khu vực / Nhà máy</th>
                          <th className="p-3 border-r border-slate-800">MSNV người đăng ký</th>
                          <th className="p-3 border-r border-slate-800">Người đăng ký</th>
                          <th className="p-3 border-r border-slate-800">Tên giám khảo</th>
                          <th className="p-3 border-r border-slate-800">MSNV giám khảo</th>
                          <th className="p-3 border-r border-slate-800">Chức vụ giám khảo</th>
                          <th className="p-3 border-r border-slate-800 text-center">TC 1 - Hiệu quả (/35đ)</th>
                          <th className="p-3 border-r border-slate-800 min-w-[150px]">Ghi chú TC1</th>
                          <th className="p-3 border-r border-slate-800 text-center">TC 2 - Khả thi (/20đ)</th>
                          <th className="p-3 border-r border-slate-800 min-w-[150px]">Ghi chú TC2</th>
                          <th className="p-3 border-r border-slate-800 text-center">TC 3 - Nhân rộng (/20đ)</th>
                          <th className="p-3 border-r border-slate-800 min-w-[150px]">Ghi chú TC3</th>
                          <th className="p-3 border-r border-slate-800 text-center">TC 4 - Sáng tạo (/15đ)</th>
                          <th className="p-3 border-r border-slate-800 min-w-[150px]">Ghi chú TC4</th>
                          <th className="p-3 border-r border-slate-800 text-center">TC 5 - Lan tỏa (/10đ)</th>
                          <th className="p-3 border-r border-slate-800 min-w-[150px]">Ghi chú TC5</th>
                          <th className="p-3 border-r border-slate-800 text-center">Tổng điểm GK (/100đ)</th>
                          <th className="p-3 border-r border-slate-800">Trạng thái khóa điểm</th>
                          <th className="p-3 border-r border-slate-800 text-center">Điểm TB tổng hợp</th>
                          <th className="p-3 border-r border-slate-800 text-center">Số GK đã chấm / Phân công</th>
                          <th className="p-3 border-r border-slate-800 text-center">Trạng thái tiến độ</th>
                          <th className="p-3 text-right sticky right-0 bg-slate-900 z-20">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white font-medium">
                        {paginatedReportScores.map((s, idx) => {
                          const isLocked = Number(s.is_locked) === 1;
                          const globalIdx = (reportPage - 1) * reportPageSize + idx + 1;
                          const pKey = s.submission_id || s.proposal_code;
                          const pStats = proposalSummaryData.find((p: any) => p.submission_id === pKey || p.proposal_code === pKey);
                          const avgScore = pStats ? pStats.avgScore : (s.total_score ?? 0);
                          const countDone = pStats ? pStats.count : 1;
                          const totalAssigned = 3;
                          const progressRatio = `${countDone}/${totalAssigned}`;
                          const isEnough = countDone >= totalAssigned;
                          const progressStatus = isEnough ? "Đủ lượt chấm" : "Thiếu lượt chấm";

                          return (
                            <tr
                              key={s.score_id || idx}
                              onClick={() => setSelectedScoreDetail(s)}
                              className="hover:bg-indigo-50/50 transition-colors cursor-pointer"
                            >
                              <td className="p-3 font-mono font-bold text-slate-400 text-[11px] border-r border-slate-200">{globalIdx}</td>
                              <td className="p-3 border-r border-slate-200 font-mono font-bold">
                                <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                                  {s.proposal_code || s.submission_id}
                                </span>
                              </td>
                              <td className="p-3 border-r border-slate-200 font-black text-slate-900 min-w-[220px]" title={s.proposal_title}>
                                <div className="line-clamp-2 whitespace-normal">{s.proposal_title || "---"}</div>
                              </td>
                              <td className="p-3 border-r border-slate-200 text-[11px] text-slate-600 font-semibold">{s.proposal_region || "---"}</td>
                              <td className="p-3 border-r border-slate-200 font-mono font-bold text-slate-700">{s.proposer_emp_code || s.real_scorer_emp_code || "---"}</td>
                              <td className="p-3 border-r border-slate-200 font-bold text-slate-900">{s.proposer_name || s.nguoi_cham_thuc_ho_ten || "---"}</td>
                              <td className="p-3 border-r border-slate-200 font-black text-indigo-950">{s.nguoi_cham_thuc_ho_ten || s.judge_name || "---"}</td>
                              <td className="p-3 border-r border-slate-200 font-mono text-slate-600">{s.real_scorer_emp_code || "---"}</td>
                              <td className="p-3 border-r border-slate-200 text-slate-600 text-[11px]">{s.real_scorer_org || s.judge_role || "Giám khảo"}</td>
                              <td className="p-3 border-r border-slate-200 text-center font-bold font-mono">{s.c1_score ?? 0}đ</td>
                              <td className="p-3 border-r border-slate-200 text-[11px] text-slate-500 max-w-[180px] truncate" title={s.c1_basis}>{s.c1_basis || "---"}</td>
                              <td className="p-3 border-r border-slate-200 text-center font-bold font-mono">{s.c2_score ?? 0}đ</td>
                              <td className="p-3 border-r border-slate-200 text-[11px] text-slate-500 max-w-[180px] truncate" title={s.c2_basis}>{s.c2_basis || "---"}</td>
                              <td className="p-3 border-r border-slate-200 text-center font-bold font-mono">{s.c3_score ?? 0}đ</td>
                              <td className="p-3 border-r border-slate-200 text-[11px] text-slate-500 max-w-[180px] truncate" title={s.c3_basis}>{s.c3_basis || "---"}</td>
                              <td className="p-3 border-r border-slate-200 text-center font-bold font-mono">{s.c4_score ?? 0}đ</td>
                              <td className="p-3 border-r border-slate-200 text-[11px] text-slate-500 max-w-[180px] truncate" title={s.c4_basis}>{s.c4_basis || "---"}</td>
                              <td className="p-3 border-r border-slate-200 text-center font-bold font-mono">{s.c5_score ?? 0}đ</td>
                              <td className="p-3 border-r border-slate-200 text-[11px] text-slate-500 max-w-[180px] truncate" title={s.c5_basis}>{s.c5_basis || "---"}</td>
                              <td className="p-3 border-r border-slate-200 text-center">
                                <span className="font-black font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900">
                                  {s.total_score ?? 0} / 100đ
                                </span>
                              </td>
                              <td className="p-3 border-r border-slate-200">
                                {isLocked ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black inline-flex items-center gap-1">
                                    <IconLock size={10} /> Đã khóa
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black inline-flex items-center gap-1">
                                    <IconLockOpen size={10} /> Chưa khóa
                                  </span>
                                )}
                              </td>
                              <td className="p-3 border-r border-slate-200 text-center font-black font-mono text-emerald-700">{avgScore}đ</td>
                              <td className="p-3 border-r border-slate-200 text-center font-mono font-bold text-slate-800">{progressRatio}</td>
                              <td className="p-3 border-r border-slate-200 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isEnough ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-amber-100 text-amber-950 border border-amber-300"}`}>
                                  {progressStatus}
                                </span>
                              </td>
                              <td className="p-3 text-right bg-white sticky right-0 z-10" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedScoreDetail(s)}
                                    title="Xem chi tiết điểm & minh chứng"
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                                  >
                                    <IconEye size={14} />
                                  </button>
                                  <button
                                    onClick={() => loadAuditLogs(s.score_id)}
                                    title="Xem lịch sử thay đổi / mở khóa"
                                    className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold cursor-pointer"
                                  >
                                    <IconHistory size={14} />
                                  </button>
                                  {isLocked && (
                                    <button
                                      onClick={() => handleUnlockScore(s.score_id)}
                                      title="Mở khóa cho phép người chấm chỉnh sửa lại điểm"
                                      className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold cursor-pointer text-[11px] flex items-center gap-1"
                                    >
                                      <IconLockOpen size={13} />
                                      <span>Mở khóa</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 font-bold">
                    Hiển thị {paginatedReportScores.length} / {filteredReportScores.length} lượt chấm
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={reportPage <= 1}
                      onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      ◀ Trang trước
                    </button>
                    <span className="text-xs font-black text-slate-900">
                      Trang {reportPage} / {Math.max(1, Math.ceil(filteredReportScores.length / reportPageSize))}
                    </span>
                    <button
                      disabled={reportPage >= Math.ceil(filteredReportScores.length / reportPageSize)}
                      onClick={() => setReportPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Trang sau ▶
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUDIT LOG HISTORY MODAL */}
      {auditLogModalScoreId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <IconHistory size={18} className="text-indigo-600" />
                <span>Lịch Sử Thay Đổi &amp; Mở Khóa Điểm (Audit Logs)</span>
              </h3>
              <button
                onClick={() => setAuditLogModalScoreId(null)}
                className="text-slate-400 hover:text-slate-600 font-black"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {auditLogsList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-bold">
                  ✓ Chưa có ghi nhận thay đổi / mở khóa nào cho lượt chấm này.
                </div>
              ) : (
                auditLogsList.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 text-[10px] font-black">
                        {log.action}
                      </span>
                      <span className="font-mono text-[10.5px] text-slate-400">
                        {log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "---"}
                      </span>
                    </div>
                    <div className="text-slate-800 font-bold mt-1">
                      Thực hiện bởi: <span className="text-indigo-950">{log.performed_by}</span>
                    </div>
                    {log.reason && (
                      <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-100">
                        &ldquo;{log.reason}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setAuditLogModalScoreId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCORE DETAIL POPUP MODAL FOR ADMIN */}
      {selectedScoreDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase">
                  📄 CHI TIẾT LƯỢT CHẤM ĐIỂM BẢNG ĐIỂM BGK
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedScoreDetail.proposal_title}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Mã sáng kiến: <strong>{selectedScoreDetail.proposal_code || selectedScoreDetail.submission_id}</strong> &bull; Khu vực: {selectedScoreDetail.proposal_region}
                </p>
              </div>

              <button
                onClick={() => setSelectedScoreDetail(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 font-black"
              >
                ✕
              </button>
            </div>

            {/* JUDGE INFO & STATUS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">NGƯỜI CHẤM THỰC:</span>
                <span className="font-black text-slate-900 text-sm">{selectedScoreDetail.nguoi_cham_thuc_ho_ten || selectedScoreDetail.judge_name}</span>
                {selectedScoreDetail.real_scorer_emp_code && (
                  <div className="font-mono text-slate-600 font-bold">MSNV: {selectedScoreDetail.real_scorer_emp_code}</div>
                )}
                {selectedScoreDetail.real_scorer_org && (
                  <div className="text-slate-500 font-medium">Đơn vị: {selectedScoreDetail.real_scorer_org}</div>
                )}
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">TÀI KHOẢN BGK:</span>
                <span className="font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedScoreDetail.guest_username || selectedScoreDetail.judge_id}
                  {selectedScoreDetail.is_guest_shared ? " (Dùng chung)" : " (Cá nhân)"}
                </span>
                <div className="text-[10.5px] text-slate-500 font-mono">
                  Thời điểm gửi: {selectedScoreDetail.created_at ? new Date(selectedScoreDetail.created_at).toLocaleString("vi-VN") : "---"}
                </div>
                <div>
                  {Number(selectedScoreDetail.is_locked) === 1 ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black inline-flex items-center gap-1">
                      <IconLock size={10} /> Đã khóa điểm
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black inline-flex items-center gap-1">
                      <IconLockOpen size={10} /> Đã mở khóa
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CRITERIA BREAKDOWN */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase">Chi tiết 5 Tiêu chí chấm điểm:</h4>

              <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-1">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Tiêu chí 1: Hiệu quả thực tế đạt được (Tối đa 35đ)</span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{selectedScoreDetail.c1_score ?? 0} / 35đ</span>
                </div>
                {selectedScoreDetail.c1_basis && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    &ldquo;{selectedScoreDetail.c1_basis}&rdquo;
                  </p>
                )}
              </div>

              <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-1">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Tiêu chí 2: Tính khả thi &amp; hiệu quả đầu tư (Tối đa 20đ)</span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{selectedScoreDetail.c2_score ?? 0} / 20đ</span>
                </div>
                {selectedScoreDetail.c2_basis && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    &ldquo;{selectedScoreDetail.c2_basis}&rdquo;
                  </p>
                )}
              </div>

              <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-1">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Tiêu chí 3: Khả năng nhân rộng (Tối đa 20đ)</span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{selectedScoreDetail.c3_score ?? 0} / 20đ</span>
                </div>
                {selectedScoreDetail.c3_basis && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    &ldquo;{selectedScoreDetail.c3_basis}&rdquo;
                  </p>
                )}
              </div>

              <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-1">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Tiêu chí 4: Tính sáng tạo &amp; chủ động (Tối đa 15đ)</span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{selectedScoreDetail.c4_score ?? 0} / 15đ</span>
                </div>
                {selectedScoreDetail.c4_basis && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    &ldquo;{selectedScoreDetail.c4_basis}&rdquo;
                  </p>
                )}
              </div>

              <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-1">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Tiêu chí 5: Lan tỏa &amp; tinh thần đội nhóm (Tối đa 10đ)</span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{selectedScoreDetail.c5_score ?? 0} / 10đ</span>
                </div>
                {selectedScoreDetail.c5_basis && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    &ldquo;{selectedScoreDetail.c5_basis}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* TOTAL SCORE SUMMARY */}
            <div className="p-4 rounded-2xl bg-emerald-900 text-white flex items-center justify-between">
              <span className="text-xs font-black uppercase">TỔNG ĐIỂM ĐÁNH GIÁ CHUYÊN MÔN:</span>
              <span className="text-xl font-black font-mono">{selectedScoreDetail.total_score ?? 0} / 100đ</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {Number(selectedScoreDetail.is_locked) === 1 ? (
                <button
                  onClick={() => {
                    handleUnlockScore(selectedScoreDetail.score_id);
                    setSelectedScoreDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <IconLockOpen size={14} />
                  <span>Mở khóa lượt chấm này</span>
                </button>
              ) : (
                <span />
              )}

              <button
                onClick={() => setSelectedScoreDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT BẢNG ĐIỂM CỦA TỪNG BGK ĐÃ CHẤM CHO 1 SÁNG KIẾN */}
      {selectedProposalScoresGroup && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-black uppercase">
                  📊 BẢNG ĐIỂM CHI TIẾT CÁC GIÁM KHẢO ĐÃ CHẤM HỒ SƠ
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedProposalScoresGroup.proposal_title}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Mã: <strong>{selectedProposalScoresGroup.proposal_code}</strong> &bull; Khu vực: {selectedProposalScoresGroup.proposal_region} &bull; Người ĐK: {selectedProposalScoresGroup.proposer_name} ({selectedProposalScoresGroup.proposer_emp_code})
                </p>
              </div>

              <button
                onClick={() => setSelectedProposalScoresGroup(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 font-black"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedProposalScoresGroup.scores.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold">
                  🔴 Chưa có giám khảo nào hoàn tất chấm điểm cho sáng kiến này.
                </div>
              ) : (
                selectedProposalScoresGroup.scores.map((s: any, idx: number) => {
                  const isLocked = Number(s.is_locked) === 1;
                  return (
                    <div key={s.score_id || s.id || idx} className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">
                              👤 {s.nguoi_cham_thuc_ho_ten || s.judge_name || "---"}
                            </span>
                            {s.real_scorer_emp_code && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-mono font-bold">
                                MSNV: {s.real_scorer_emp_code}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isLocked ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                              {isLocked ? "🟢 Đã khóa điểm" : "🟡 Đã mở khóa / Đang chấm"}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 font-medium">
                            <span>Đơn vị / Chức vụ: <strong>{s.real_scorer_org || s.judge_id || "---"}</strong></span>
                            {(s.real_scorer_phone || s.real_scorer_email) && (
                              <span className="text-slate-500 ml-2">
                                ({[s.real_scorer_phone, s.real_scorer_email].filter(Boolean).join(" • ")})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">TỔNG ĐIỂM BGK NÀY</span>
                            <span className="text-xl font-black text-emerald-700 font-mono">
                              {s.total_score ?? 0} / 100đ
                            </span>
                          </div>

                          {isLocked && (
                            <button
                              type="button"
                              onClick={() => {
                                handleUnlockScore(s.score_id || s.id);
                                setSelectedProposalScoresGroup(null);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shadow-xs cursor-pointer flex items-center gap-1"
                              title="Mở khóa cho phép GK này sửa lại điểm"
                            >
                              <IconLockOpen size={13} />
                              <span>Mở khóa</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                            <tr>
                              <th className="p-2 text-center w-10 border-r border-slate-200">STT</th>
                              <th className="p-2 border-r border-slate-200">Tiêu chí</th>
                              <th className="p-2 text-center w-28 border-r border-slate-200">Điểm đã chấm</th>
                              <th className="p-2">Căn cứ &amp; Ghi chú chấm điểm</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                            <tr>
                              <td className="p-2 text-center font-bold text-slate-400 border-r border-slate-100">1</td>
                              <td className="p-2 font-bold border-r border-slate-100">1. Hiệu quả thực tế đạt được</td>
                              <td className="p-2 text-center font-black text-emerald-800 border-r border-slate-100 bg-emerald-50/50">{s.c1_score ?? 0} / 35đ</td>
                              <td className="p-2 text-slate-600 italic">{s.c1_basis || "---"}</td>
                            </tr>
                            <tr>
                              <td className="p-2 text-center font-bold text-slate-400 border-r border-slate-100">2</td>
                              <td className="p-2 font-bold border-r border-slate-100">2. Tính khả thi &amp; hiệu quả đầu tư</td>
                              <td className="p-2 text-center font-black text-emerald-800 border-r border-slate-100 bg-emerald-50/50">{s.c2_score ?? 0} / 20đ</td>
                              <td className="p-2 text-slate-600 italic">{s.c2_basis || "---"}</td>
                            </tr>
                            <tr>
                              <td className="p-2 text-center font-bold text-slate-400 border-r border-slate-100">3</td>
                              <td className="p-2 font-bold border-r border-slate-100">3. Khả năng nhân rộng</td>
                              <td className="p-2 text-center font-black text-emerald-800 border-r border-slate-100 bg-emerald-50/50">{s.c3_score ?? 0} / 20đ</td>
                              <td className="p-2 text-slate-600 italic">{s.c3_basis || "---"}</td>
                            </tr>
                            <tr>
                              <td className="p-2 text-center font-bold text-slate-400 border-r border-slate-100">4</td>
                              <td className="p-2 font-bold border-r border-slate-100">4. Tính sáng tạo &amp; chủ động</td>
                              <td className="p-2 text-center font-black text-emerald-800 border-r border-slate-100 bg-emerald-50/50">{s.c4_score ?? 0} / 15đ</td>
                              <td className="p-2 text-slate-600 italic">{s.c4_basis || "---"}</td>
                            </tr>
                            <tr>
                              <td className="p-2 text-center font-bold text-slate-400 border-r border-slate-100">5</td>
                              <td className="p-2 font-bold border-r border-slate-100">5. Lan tỏa &amp; tinh thần đội nhóm</td>
                              <td className="p-2 text-center font-black text-emerald-800 border-r border-slate-100 bg-emerald-50/50">{s.c5_score ?? 0} / 10đ</td>
                              <td className="p-2 text-slate-600 italic">{s.c5_basis || "---"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setSelectedProposalScoresGroup(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT GUEST ACCOUNT MODAL */}
      {editingGuest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <IconEdit size={18} className="text-amber-500" />
                <span>Chỉnh Sửa Tài Khoản BGK Khách Mời</span>
              </h3>
              <button
                onClick={() => setEditingGuest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Đăng Nhập (Username):</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  placeholder="Vd: BGK001"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mật Khẩu 1 Lần (Passcode):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editPasscode}
                    onChange={(e) => setEditPasscode(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    placeholder="Vd: 118292"
                  />
                  <button
                    type="button"
                    onClick={() => setEditPasscode(`${Math.floor(100000 + Math.random() * 900000)}`)}
                    className="px-3 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs shrink-0 cursor-pointer"
                  >
                    🎲 Đổi ngẫu nhiên
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và Tên Giám Khảo / Tên Hiển Thị:</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  placeholder="Vd: Giám Khảo Khách Mời 01"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingGuest(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditGuest}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <IconCheck size={14} />
                <span>Lưu Cập Nhật</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
