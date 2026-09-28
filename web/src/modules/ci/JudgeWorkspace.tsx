"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconAward,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconShieldCheck,
  IconPhoto,
  IconClock,
  IconBuildingWarehouse,
  IconUser,
  IconSend,
  IconAlertTriangle,
  IconLock,
  IconChevronRight,
  IconFilter,
  IconRefresh,
} from "@tabler/icons-react";
import { getValidKaizenImageUrl } from "@/lib/kaizenImageHelper";
import { formatVND } from "@/lib/formatNumber";
import { getAutoBaremGroupForCategory } from "@/lib/kaizenTitleHelper";

interface JudgeWorkspaceProps {
  magicToken?: string;
}

export default function JudgeWorkspace({ magicToken: propMagicToken }: JudgeWorkspaceProps) {
  const searchParams = useSearchParams();
  const magicToken = propMagicToken || searchParams.get("token") || searchParams.get("magicToken") || "";
  const bgkUserParam = searchParams.get("bgkUser") || searchParams.get("user") || searchParams.get("username") || "";
  const bgkPassParam = searchParams.get("pass") || searchParams.get("password") || searchParams.get("passcode") || "";

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictReason, setConflictReason] = useState("");
  const [submittingConflict, setSubmittingConflict] = useState(false);

  // Guest Account & Login State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestUserObj, setGuestUserObj] = useState<any>(null);
  const [declarationSubmitted, setDeclarationSubmitted] = useState<boolean>(true);

  // Mandatory Guest Declaration Form State
  const [declMsnv, setDeclMsnv] = useState("");
  const [declFullName, setDeclFullName] = useState("");
  const [declOrg, setDeclOrg] = useState("");
  const [declPhone, setDeclPhone] = useState("");
  const [declEmail, setDeclEmail] = useState("");
  const [declContact, setDeclContact] = useState("");
  const [declNoConflict, setDeclNoConflict] = useState(false);
  const [submittingDecl, setSubmittingDecl] = useState(false);

  // Real Scorer Identity State for Shared Guest Accounts
  const [realScorerName, setRealScorerName] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("tbs_real_scorer_name") || "";
    return "";
  });
  const [realScorerPhone, setRealScorerPhone] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("tbs_real_scorer_phone") || "";
    return "";
  });
  const [realScorerEmail, setRealScorerEmail] = useState("");
  const [activeConfirmedProposalId, setActiveConfirmedProposalId] = useState<string | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  // Form Chấm Điểm State
  const [p1Pass, setP1Pass] = useState(true);
  const [p2Pass, setP2Pass] = useState(true);
  const [p3Pass, setP3Pass] = useState(true);
  const [p4Pass, setP4Pass] = useState(true);
  const [prereqNote, setPrereqNote] = useState("");

  const [c1Group, setC1Group] = useState<"GROUP1" | "GROUP2" | "GROUP3">("GROUP1");
  const [quantPct, setQuantPct] = useState<number | "">(15);

  const [c1Score, setC1Score] = useState<number>(30);
  const [c2Score, setC2Score] = useState<number>(15);
  const [c3Score, setC3Score] = useState<number>(15);
  const [c4Score, setC4Score] = useState<number>(11);
  const [c5Score, setC5Score] = useState<number>(7);

  const [c1Basis, setC1Basis] = useState("");
  const [c2Basis, setC2Basis] = useState("");
  const [c3Basis, setC3Basis] = useState("");
  const [c4Basis, setC4Basis] = useState("");
  const [c5Basis, setC5Basis] = useState("");

  const [isVerifiedData, setIsVerifiedData] = useState(true);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [magicToken, bgkUserParam, bgkPassParam]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Authenticate via URL Params if present
      if (magicToken || (bgkUserParam && bgkPassParam)) {
        let authUrl = "/api/ci-kaizen/judging/guests?";
        if (magicToken) authUrl += `token=${encodeURIComponent(magicToken)}`;
        else authUrl += `bgkUser=${encodeURIComponent(bgkUserParam)}&pass=${encodeURIComponent(bgkPassParam)}`;

        const guestRes = await fetch(authUrl);
        const guestJson = await guestRes.json();
        if (guestJson.success && guestJson.authToken) {
          localStorage.setItem("tbs_jwt_token", guestJson.authToken);
          setIsGuest(true);
          setGuestUserObj(guestJson.guestUser);
          setDeclarationSubmitted(Boolean(guestJson.declarationSubmitted));
        } else if (!guestJson.success) {
          setErrorMsg(`❌ ${guestJson.error || "Tài khoản BGK khách mời không hợp lệ hoặc đã bị thu hồi"}`);
          setShowLoginModal(true);
        }
      }

      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";

      if (!token) {
        setShowLoginModal(true);
        setLoading(false);
        return;
      }

      const roundsRes = await fetch("/api/ci-kaizen/judging/rounds", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const roundsJson = await roundsRes.json();
      if (roundsJson.success && Array.isArray(roundsJson.rounds)) {
        setRounds(roundsJson.rounds);
        if (roundsJson.rounds.length > 0) {
          setSelectedRoundId(roundsJson.rounds[0].id);
        }
      }

      const asgnRes = await fetch("/api/ci-kaizen/judging/assignments", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const asgnJson = await asgnRes.json();
      if (asgnJson.success && Array.isArray(asgnJson.assignments)) {
        setAssignments(asgnJson.assignments);
        if (asgnJson.assignments.length > 0) {
          selectAssignmentForEval(asgnJson.assignments[0]);
        }
      } else if (asgnRes.status === 401) {
        setShowLoginModal(true);
      }
    } catch (e: any) {
      setErrorMsg("❌ Lỗi kết nối máy chủ chấm điểm");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      setErrorMsg("⚠️ Vui lòng nhập Tên đăng nhập (User) và Mật khẩu 1 lần (Pass)!");
      return;
    }

    try {
      setLoggingIn(true);
      setErrorMsg(null);

      const res = await fetch("/api/ci-kaizen/judging/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOGIN",
          username: loginUser.trim(),
          passcode: loginPass.trim(),
        }),
      });

      const json = await res.json();
      if (json.success && json.authToken) {
        localStorage.setItem("tbs_jwt_token", json.authToken);
        setIsGuest(true);
        setGuestUserObj(json.guestUser);
        setDeclarationSubmitted(Boolean(json.declarationSubmitted));
        setShowLoginModal(false);
        setSubmitSuccessMsg("✅ Đăng nhập BGK thành công!");
        loadData();
      } else {
        setErrorMsg(`❌ ${json.error || "Tên đăng nhập hoặc mật khẩu 1 lần không hợp lệ!"}`);
      }
    } catch (err) {
      setErrorMsg("❌ Lỗi kết nối máy chủ đăng nhập");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSubmitDeclaration = async () => {
    if (!declFullName.trim()) {
      setErrorMsg("⚠️ Vui lòng nhập Họ và tên đầy đủ của Giám Khảo!");
      return;
    }
    if (!declOrg.trim()) {
      setErrorMsg("⚠️ Vui lòng nhập Chức vụ / Đơn vị công tác!");
      return;
    }
    if (!declNoConflict) {
      setErrorMsg("⚠️ Bạn phải tích chọn cam kết không có xung đột lợi ích cá nhân trước khi nộp!");
      return;
    }

    try {
      setSubmittingDecl(true);
      setErrorMsg(null);
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";

      const res = await fetch("/api/ci-kaizen/expert-evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "SUBMIT_DECLARATION",
          msnv: declMsnv.trim(),
          fullName: declFullName.trim(),
          organization: declOrg.trim(),
          phone: declPhone.trim(),
          email: declEmail.trim(),
          contactInfo: declPhone.trim() && declEmail.trim() ? `${declPhone.trim()} | ${declEmail.trim()}` : (declPhone.trim() || declEmail.trim() || declContact.trim()),
          noConflictDeclared: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setDeclarationSubmitted(true);
        setSubmitSuccessMsg("✅ Đã hoàn thành khai báo thông tin BGK! Dữ liệu đã lưu D1 & Backup Google Drive.");
      } else {
        setErrorMsg(`❌ ${json.error || "Không thể lưu thông tin khai báo"}`);
      }
    } catch (e) {
      setErrorMsg("❌ Lỗi nộp thông tin khai báo");
    } finally {
      setSubmittingDecl(false);
    }
  };

  const selectAssignmentForEval = async (asgn: any) => {
    setSelectedAssignment(asgn);
    setErrorMsg(null);
    setSubmitSuccessMsg(null);

    const isShared = isGuest || Boolean(guestUserObj?.dungChung ?? true);
    if (isShared && activeConfirmedProposalId !== asgn.submission_id) {
      setShowIdentityModal(true);
    }

    const catStr = asgn?.category || asgn?.category_label || asgn?.product_group || asgn?.phan_loai || "";
    const autoGroup = getAutoBaremGroupForCategory(catStr);

    // Fetch existing score if already scored
    try {
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";
      const res = await fetch(`/api/ci-kaizen/judging/score?submissionId=${asgn.submission_id}&roundId=${asgn.round_id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();

      if (json.success) {
        if (json.prerequisiteCheck) {
          setP1Pass(Boolean(json.prerequisiteCheck.p1_pass));
          setP2Pass(Boolean(json.prerequisiteCheck.p2_pass));
          setP3Pass(Boolean(json.prerequisiteCheck.p3_pass));
          setP4Pass(Boolean(json.prerequisiteCheck.p4_pass));
          setPrereqNote(json.prerequisiteCheck.note || "");
        }
        if (json.myScore) {
          setC1Group(json.myScore.c1_group || autoGroup);
          setC1Score(json.myScore.c1_score || 30);
          setC2Score(json.myScore.c2_score || 15);
          setC3Score(json.myScore.c3_score || 15);
          setC4Score(json.myScore.c4_score || 11);
          setC5Score(json.myScore.c5_score || 7);
          setC1Basis(json.myScore.c1_basis || "");
          setC2Basis(json.myScore.c2_basis || "");
          setC3Basis(json.myScore.c3_basis || "");
          setC4Basis(json.myScore.c4_basis || "");
          setC5Basis(json.myScore.c5_basis || "");
          setIsVerifiedData(Boolean(json.myScore.is_verified_data));
        } else {
          // Reset defaults & auto-select barem group based on Phân Loại
          setC1Group(autoGroup);
          setC1Basis("Hồ sơ thể hiện rõ cải tiến hiệu quả thực tế.");
          setC2Basis("Chi phí đầu tư hợp lý, thời gian hoàn vốn nhanh.");
          setC3Basis("Có thể áp dụng ngay cho các chuyền sản xuất cùng ngành.");
          setC4Basis("Có cách tiếp cận mới giải quyết tận gốc vấn đề.");
          setC5Basis("Đã chủ động chia sẻ hướng dẫn lại cho tổ đồng nghiệp.");
        }
      }
    } catch (e) {}
  };

  // Auto-suggest score for C1 based on quantitative input
  const handleAutoSuggestC1 = (pctVal: number) => {
    setQuantPct(pctVal);
    if (c1Group === "GROUP1") {
      if (pctVal >= 25) setC1Score(35);
      else if (pctVal >= 18) setC1Score(33);
      else if (pctVal >= 15) setC1Score(30);
      else if (pctVal >= 12) setC1Score(29);
      else if (pctVal >= 9) setC1Score(24);
      else if (pctVal >= 8) setC1Score(20);
      else if (pctVal >= 5) setC1Score(19);
      else setC1Score(14);
    } else if (c1Group === "GROUP2") {
      if (pctVal >= 45) setC1Score(35);
      else if (pctVal >= 35) setC1Score(33);
      else if (pctVal >= 30) setC1Score(30);
      else if (pctVal >= 25) setC1Score(29);
      else if (pctVal >= 19) setC1Score(24);
      else if (pctVal >= 15) setC1Score(20);
      else setC1Score(14);
    }
  };

  const handleReportConflict = async () => {
    if (!conflictReason.trim()) {
      setErrorMsg("⚠️ Vui lòng chọn/nhập lý do xin rút do xung đột lợi ích!");
      return;
    }
    try {
      setSubmittingConflict(true);
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";
      const res = await fetch("/api/ci-kaizen/judging/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "REPORT_CONFLICT",
          submissionId: selectedAssignment?.submission_id,
          conflictReason: conflictReason.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setConflictModalOpen(false);
        setConflictReason("");
        loadData();
      } else {
        setErrorMsg(`❌ ${json.error || "Không thể báo cáo xung đột lợi ích"}`);
      }
    } catch (e) {
      setErrorMsg("❌ Lỗi kết nối máy chủ");
    } finally {
      setSubmittingConflict(false);
    }
  };

  const handleScoreSubmit = async () => {
    const lowerScorer = realScorerName.trim().toLowerCase();
    if (isGuest && (!realScorerName.trim() || lowerScorer.includes("khách mời") || lowerScorer.includes("khach moi") || lowerScorer.includes("bgk"))) {
      setErrorMsg("⚠️ Tài khoản ảo / Khách mời: Bắt buộc phải nhập Họ và tên người chấm thực (không dùng tên mặc định) trước khi nộp điểm!");
      setShowIdentityModal(true);
      return;
    }

    try {
      setSubmittingScore(true);
      setErrorMsg(null);
      setSubmitSuccessMsg(null);
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";

      if (typeof window !== "undefined" && realScorerName.trim()) {
        localStorage.setItem("tbs_real_scorer_name", realScorerName.trim());
      }

      const res = await fetch("/api/ci-kaizen/judging/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          roundId: selectedAssignment?.round_id || selectedRoundId,
          submissionId: selectedAssignment?.submission_id,
          p1Pass,
          p2Pass,
          p3Pass,
          p4Pass,
          prereqNote,
          c1Group,
          c1Score,
          c2Score,
          c3Score,
          c4Score,
          c5Score,
          c1Basis,
          c2Basis,
          c3Basis,
          c4Basis,
          c5Basis,
          isVerifiedData,
          realScorerName: realScorerName.trim(),
          realScorerPhone: realScorerPhone.trim(),
          realScorerEmail: realScorerEmail.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        if (json.isDisqualified) {
          setSubmitSuccessMsg("❌ Hồ sơ không đạt điều kiện tiên quyết (Bước 0) và đã bị chuyển trạng thái Loại.");
        } else {
          setSubmitSuccessMsg(`✅ Đã nộp bảng chấm điểm thành công! Tổng điểm của bạn: ${json.judgeTotalScore} điểm${json.avgFinalTotalScore ? ` (Điểm TB tổng hợp: ${json.avgFinalTotalScore}đ)` : ''}.`);
        }
        setActiveConfirmedProposalId(null);
        loadData();
      } else {
        setErrorMsg(`❌ ${json.error || "Không thể nộp bảng chấm điểm"}`);
      }
    } catch (e: any) {
      setErrorMsg("❌ Lỗi kết nối khi nộp điểm");
    } finally {
      setSubmittingScore(false);
    }
  };

  const currentCapFactor = isVerifiedData ? 1.0 : 0.6;
  const effectiveC1 = Math.min(c1Score, 35 * currentCapFactor);
  const effectiveC2 = Math.min(c2Score, 20 * currentCapFactor);
  const effectiveC3 = Math.min(c3Score, 20 * currentCapFactor);
  const effectiveC4 = Math.min(c4Score, 15 * currentCapFactor);
  const effectiveC5 = Math.min(c5Score, 10 * currentCapFactor);
  const totalScorePreview = Math.round((effectiveC1 + effectiveC2 + effectiveC3 + effectiveC4 + effectiveC5) * 10) / 10;

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-extrabold text-sm">Đang tải Không gian Chấm điểm BGK...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
              ⚖️ BAN GIÁM KHẢO
            </span>
            {magicToken && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                🔑 Tài khoản Khách mời (Magic Link)
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-2">
            Không Gian Chấm Điểm Thi Đua Kaizen
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Đánh giá khách quan - minh bạch theo Bộ 5 tiêu chí chuẩn hóa V QĐ-TBKG/2026
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-white/20"
        >
          <IconRefresh size={16} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <IconAlertTriangle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {submitSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <IconCheck size={18} className="text-emerald-600 shrink-0" />
          <span>{submitSuccessMsg}</span>
        </div>
      )}

      {/* WORKSPACE LAYOUT (LEFT LIST + RIGHT EVALUATION FORM) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: ASSIGNED PROPOSALS LIST */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>📋 Hồ sơ được giao</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                {assignments.length}
              </span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
            {assignments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 text-slate-400">
                <IconAward size={32} className="mx-auto opacity-40" />
                <p className="text-xs font-bold">Chưa có hồ sơ nào được phân công chấm.</p>
              </div>
            ) : (
              assignments.map((asgn) => {
                const isSelected = selectedAssignment?.id === asgn.id;
                const isScored = asgn.status === "SCORED";

                return (
                  <div
                    key={asgn.id}
                    onClick={() => selectAssignmentForEval(asgn)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? "border-[#006838] bg-emerald-50/40 shadow-md ring-2 ring-[#006838]/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {asgn.code || asgn.submission_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isScored
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {isScored ? "✓ Đã chấm" : "⏳ Chờ chấm"}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 line-clamp-2">
                      {asgn.title || "Sáng kiến Kaizen"}
                    </h4>

                    <div className="text-[10.5px] text-slate-500 font-bold flex items-center justify-between border-t border-slate-100 pt-2">
                      <span>👤 {asgn.proposer_name || "Công nhân"}</span>
                      <span>🏢 {asgn.factory || asgn.region || "Nhà Máy"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: 5 CRITERIA EVALUATION FORM */}
        <div className="lg:col-span-8">
          {selectedAssignment ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-5 sm:p-6 space-y-6">
              {/* PROPOSAL INFORMATION CARD */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                      Mã: {selectedAssignment.code || selectedAssignment.submission_id}
                    </span>
                    <h2 className="text-base font-black text-slate-900 mt-1">
                      {selectedAssignment.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConflictModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <IconAlertTriangle size={15} />
                    <span>Báo cáo xung đột lợi ích</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">NGƯỜI ĐĂNG KÝ</span>
                    <span className="font-bold text-slate-800 truncate block">{selectedAssignment.proposer_name || "---"}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">ĐƠN VỊ</span>
                    <span className="font-bold text-slate-800 truncate block">{selectedAssignment.department || selectedAssignment.factory || "---"}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">KHU VỰC</span>
                    <span className="font-bold text-slate-800 truncate block">{selectedAssignment.region || selectedAssignment.factory || "Nhà Máy Miền Đông"}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">TRẠNG THÁI</span>
                    <span className="font-bold text-emerald-700 truncate block">{selectedAssignment.approval_status || "ĐÃ PHÊ DUYỆT"}</span>
                  </div>
                </div>

                {/* IMAGES BEFORE/AFTER */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Ảnh Trước cải tiến</span>
                    {getValidKaizenImageUrl(selectedAssignment.before_image_url, selectedAssignment.attachments_json, "BEFORE") ? (
                      <img
                        src={getValidKaizenImageUrl(selectedAssignment.before_image_url, selectedAssignment.attachments_json, "BEFORE")}
                        alt="Before"
                        className="w-full h-32 object-cover rounded-xl border border-rose-200 bg-white"
                      />
                    ) : (
                      <div className="w-full h-32 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">Chưa có ảnh trước</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Ảnh Sau cải tiến</span>
                    {getValidKaizenImageUrl(selectedAssignment.after_image_url, selectedAssignment.attachments_json, "AFTER", selectedAssignment.before_image_url) ? (
                      <img
                        src={getValidKaizenImageUrl(selectedAssignment.after_image_url, selectedAssignment.attachments_json, "AFTER", selectedAssignment.before_image_url)}
                        alt="After"
                        className="w-full h-32 object-cover rounded-xl border border-emerald-200 bg-white"
                      />
                    ) : (
                      <div className="w-full h-32 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">Chưa có ảnh sau</div>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 0: PREREQUISITE CHECKLIST (BƯỚC 0 - ĐIỀU KIỆN TIÊN QUYẾT) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                  <span>📌</span>
                  <span>BƯỚC 0: ĐIỀU KIỆN TIÊN QUYẾT (PASS/FAIL)</span>
                </h4>
                <p className="text-[11px] text-amber-900">
                  Hồ sơ phải đạt cả 4 điều kiện dưới đây. Nếu không đạt bất kỳ điều kiện nào, hồ sơ bị loại và không vào vòng chấm điểm.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${p1Pass ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                    <input type="checkbox" checked={p1Pass} onChange={(e) => setP1Pass(e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
                    <span>1. Đã triển khai thực tế tại hiện trường</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${p2Pass ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                    <input type="checkbox" checked={p2Pass} onChange={(e) => setP2Pass(e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
                    <span>2. Có minh chứng trước-sau đầy đủ</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${p3Pass ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                    <input type="checkbox" checked={p3Pass} onChange={(e) => setP3Pass(e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
                    <span>3. Không vi phạm An toàn lao động</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${p4Pass ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                    <input type="checkbox" checked={p4Pass} onChange={(e) => setP4Pass(e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
                    <span>4. Không trùng lặp đề tài đạt giải trước</span>
                  </label>
                </div>
              </div>

              {/* INDEPENDENT DATA VERIFICATION CHECKBOX (CẮT CẦU 60% ĐIỂM NẾU CHƯA XÁC NHẬN ĐỘC LẬP) */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-black text-indigo-950 block">🔍 Xác minh minh chứng độc lập</span>
                  <span className="text-[11px] text-indigo-800 block">
                    Số liệu chưa có xác nhận độc lập chỉ được chấm tối đa 60% thang điểm của tiêu chí.
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0 bg-white border border-indigo-300 px-3 py-1.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={isVerifiedData}
                    onChange={(e) => setIsVerifiedData(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span className="font-bold text-indigo-950">Đã xác nhận độc lập</span>
                </label>
              </div>

              {/* 5 CRITERIA FORM - TABLE LAYOUT MATCHING SPEC IMAGE 2 */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="p-3 text-center w-12 border-r border-slate-200">STT</th>
                      <th className="p-3 w-40 border-r border-slate-200">TIÊU CHÍ</th>
                      <th className="p-3 w-44 border-r border-slate-200">MÔ TẢ NGẮN</th>
                      <th className="p-3 text-center w-24 border-r border-slate-200">ĐIỂM TỐI ĐA</th>
                      <th className="p-3">BGK CHỌN ĐIỂM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {/* ROW 1: TIÊU CHÍ 1 */}
                    <tr className="border-l-4 border-l-blue-600 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">1</td>
                      <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                        Hiệu quả thực tế đạt được
                      </td>
                      <td className="p-3 text-slate-600 border-r border-slate-200">
                        Mức độ hiệu quả mang lại (tùy danh mục)
                      </td>
                      <td className="p-3 text-center font-black text-slate-900 text-sm border-r border-slate-200">
                        35
                      </td>
                      <td className="p-3 space-y-3">
                        {/* DẢI THÔNG TIN BAREM ĐỘNG THEO PHÂN LOẠI */}
                        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-[#006838] text-white font-mono font-black text-[10px] uppercase">
                              BAREM ĐỘNG
                            </span>
                            <span className="font-bold text-emerald-950">
                              Đang áp dụng: <strong className="text-[#006838]">{c1Group === "GROUP1" ? "Nhóm 1 – Tăng Năng Suất / Thời Gian" : c1Group === "GROUP2" ? "Nhóm 2 – Tiết Kiệm Chi Phí / Vật Tư" : "Nhóm 3 – An Toàn Lao Động / 5S"}</strong>
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-800">
                            (Hệ thống tự động ánh xạ từ Phân Loại: <strong className="text-slate-900">{selectedAssignment.category || (selectedAssignment as any).category_label || "Tăng Năng Suất"}</strong>)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setC1Group("GROUP1")}
                            className={`p-2 rounded-xl font-bold border cursor-pointer ${c1Group === "GROUP1" ? "bg-[#006838] text-white border-[#006838]" : "bg-white text-slate-700 border-slate-300"}`}
                          >
                            Nhóm 1: Năng suất / Thời gian
                          </button>
                          <button
                            type="button"
                            onClick={() => setC1Group("GROUP2")}
                            className={`p-2 rounded-xl font-bold border cursor-pointer ${c1Group === "GROUP2" ? "bg-[#006838] text-white border-[#006838]" : "bg-white text-slate-700 border-slate-300"}`}
                          >
                            Nhóm 2: Tiết kiệm Chi phí / Vật tư
                          </button>
                          <button
                            type="button"
                            onClick={() => setC1Group("GROUP3")}
                            className={`p-2 rounded-xl font-bold border cursor-pointer ${c1Group === "GROUP3" ? "bg-[#006838] text-white border-[#006838]" : "bg-white text-slate-700 border-slate-300"}`}
                          >
                            Nhóm 3: An toàn lao động / 5S
                          </button>
                        </div>

                        {/* BAREM DẠNG RADIO NODES THEO NHÓM */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-700 block">Chọn mốc điểm phù hợp nhất (Bắt buộc chọn mốc, không nhập điểm tự do):</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs items-stretch">
                            {(c1Group === "GROUP1"
                              ? [
                                  { score: 35, desc: "35đ — Đạt ≥25% (Tối đa/SOP)" },
                                  { score: 33, desc: "33đ — Đạt 18–24%" },
                                  { score: 30, desc: "30đ — Đạt ≥15%" },
                                  { score: 29, desc: "29đ — Đạt sát 14%" },
                                  { score: 24, desc: "24đ — Đạt 9–11%" },
                                  { score: 20, desc: "20đ — Đạt 8%" },
                                  { score: 19, desc: "19đ — Số liệu <8%, đã xác nhận độc lập" },
                                  { score: 14, desc: "14đ — Số liệu sơ bộ <8% (chưa xác nhận độc lập)" },
                                  { score: 10, desc: "10đ — Chỉ mô tả định tính, không số đo" },
                                  { score: 9, desc: "9đ — Đề cập rõ hơn, chưa đủ tin cậy" },
                                  { score: 4, desc: "4đ — Đề cập sơ lược, thiếu minh chứng" },
                                  { score: 0, desc: "0đ — Hiệu quả không rõ ràng" },
                                ]
                              : c1Group === "GROUP2"
                              ? [
                                  { score: 35, desc: "35đ — Giảm ≥45% lãng phí, kiểm chứng ổn định" },
                                  { score: 33, desc: "33đ — Giảm 35–44%, xác nhận rõ" },
                                  { score: 30, desc: "30đ — Giảm ≥30% lãng phí, có đối chứng" },
                                  { score: 29, desc: "29đ — Giảm sát 29% lãng phí" },
                                  { score: 24, desc: "24đ — Giảm 19–22% lãng phí" },
                                  { score: 20, desc: "20đ — Giảm 15% lãng phí, có số liệu" },
                                  { score: 19, desc: "19đ — Số liệu <15%, đã xác nhận độc lập" },
                                  { score: 14, desc: "14đ — Số liệu sơ bộ <15% (chưa xác nhận độc lập)" },
                                  { score: 10, desc: "10đ — Chỉ mô tả định tính" },
                                  { score: 9, desc: "9đ — Đề cập rõ hơn, chưa đủ tin cậy" },
                                  { score: 4, desc: "4đ — Đề cập sơ lược, thiếu minh chứng" },
                                  { score: 0, desc: "0đ — Không có căn cứ" },
                                ]
                              : [
                                  { score: 35, desc: "35đ — Triệt tiêu mối nguy nghiêm trọng + SOP mới" },
                                  { score: 33, desc: "33đ — Áp dụng thử vị trí tương tự khác" },
                                  { score: 30, desc: "30đ — Loại bỏ hoàn toàn nguy cơ Cao/Nghiêm trọng" },
                                  { score: 29, desc: "29đ — Giảm rủi ro + Ổn định ≥1 tháng" },
                                  { score: 24, desc: "24đ — Giảm rủi ro + Có giải pháp kỹ thuật rõ" },
                                  { score: 20, desc: "20đ — Giảm rủi ro Cao→Trung bình (Risk Assessment)" },
                                  { score: 19, desc: "19đ — Giải pháp kỹ thuật rõ, chưa đo mức giảm" },
                                  { score: 14, desc: "14đ — Đánh giá lại nhưng mức giảm chưa rõ" },
                                  { score: 10, desc: "10đ — Cải thiện nhỏ, chưa đánh giá lại rủi ro" },
                                  { score: 9, desc: "9đ — Đề cập nhưng chưa đủ căn cứ" },
                                  { score: 4, desc: "4đ — Chỉ ở mức nhắc nhở / biển báo" },
                                  { score: 0, desc: "0đ — Không chứng minh được mức giảm rủi ro" },
                                ]
                            ).map((opt) => (
                              <label
                                key={opt.score}
                                className={`p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                                  c1Score === opt.score
                                    ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                    {opt.score}đ
                                  </span>
                                  <input
                                    type="radio"
                                    name="judge_c1_score_radio"
                                    checked={c1Score === opt.score}
                                    onChange={() => setC1Score(opt.score)}
                                    className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                                  />
                                </div>
                                <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* ROW 2: TIÊU CHÍ 2 */}
                    <tr className="border-l-4 border-l-emerald-600 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">2</td>
                      <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                        Tính khả thi &amp; hiệu quả đầu tư
                      </td>
                      <td className="p-3 text-slate-600 border-r border-slate-200">
                        Chi phí đầu tư so với lợi ích.
                      </td>
                      <td className="p-3 text-center font-black text-slate-900 text-sm border-r border-slate-200">
                        20
                      </td>
                      <td className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-bold items-stretch">
                          {[
                            { score: 20, desc: "20đ — Rất khả thi / không tốn chi phí" },
                            { score: 15, desc: "15đ — Khả thi cao / thu hồi <6 tháng" },
                            { score: 10, desc: "10đ — Khả thi TB / thu hồi 6–12 tháng" },
                            { score: 5, desc: "5đ — Ít khả thi / thu hồi 1–2 năm" },
                            { score: 0, desc: "0đ — Không khả thi / thu hồi >2 năm" },
                          ].map((opt) => (
                            <label
                              key={opt.score}
                              className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                                c2Score === opt.score
                                  ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{opt.score}đ</span>
                                <input type="radio" name="judge_c2_score_radio" checked={c2Score === opt.score} onChange={() => setC2Score(opt.score)} className="w-3.5 h-3.5 accent-emerald-600" />
                              </div>
                              <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {/* ROW 3: TIÊU CHÍ 3 */}
                    <tr className="border-l-4 border-l-purple-600 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">3</td>
                      <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                        Khả năng nhân rộng
                      </td>
                      <td className="p-3 text-slate-600 border-r border-slate-200">
                        Mức độ áp dụng cho nhiều vị trí / đơn vị.
                      </td>
                      <td className="p-3 text-center font-black text-slate-900 text-sm border-r border-slate-200">
                        20
                      </td>
                      <td className="p-3 space-y-1.5">
                        <p className="text-[11px] text-slate-500 italic">
                          💡 Tooltip BGK: "Nếu đơn vị mình có vấn đề tương tự, có áp dụng ngay được cải tiến này không?"
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-bold items-stretch">
                          {[
                            { score: 20, desc: "20đ — Nhân rộng toàn Tập đoàn TBS" },
                            { score: 15, desc: "15đ — Nhân rộng toàn nhà máy / xưởng" },
                            { score: 10, desc: "10đ — Nhân rộng toàn bộ dây chuyền" },
                            { score: 5, desc: "5đ — Nhân rộng 1 chuyền / công đoạn nhỏ" },
                            { score: 0, desc: "0đ — Chỉ áp dụng đơn lẻ 1 vị trí" },
                          ].map((opt) => (
                            <label
                              key={opt.score}
                              className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                                c3Score === opt.score
                                  ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{opt.score}đ</span>
                                <input type="radio" name="judge_c3_score_radio" checked={c3Score === opt.score} onChange={() => setC3Score(opt.score)} className="w-3.5 h-3.5 accent-emerald-600" />
                              </div>
                              <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {/* ROW 4: TIÊU CHÍ 4 */}
                    <tr className="border-l-4 border-l-amber-500 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">4</td>
                      <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                        Tính sáng tạo &amp; chủ động
                      </td>
                      <td className="p-3 text-slate-600 border-r border-slate-200">
                        Mức độ sáng tạo và chủ động đề xuất.
                      </td>
                      <td className="p-3 text-center font-black text-slate-900 text-sm border-r border-slate-200">
                        15
                      </td>
                      <td className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-bold items-stretch">
                          {[
                            { score: 15, desc: "15đ — Sáng kiến xuất sắc, đột phá" },
                            { score: 11, desc: "11đ — Giải pháp độc đáo / tự chế dụng cụ" },
                            { score: 7, desc: "7đ — Ý tưởng sáng tạo độc lập" },
                            { score: 3, desc: "3đ — Cải tiến nhỏ trên quy trình cũ" },
                            { score: 0, desc: "0đ — Sao chép nguyên mẫu bên ngoài" },
                          ].map((opt) => (
                            <label
                              key={opt.score}
                              className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                                c4Score === opt.score
                                  ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{opt.score}đ</span>
                                <input type="radio" name="judge_c4_score_radio" checked={c4Score === opt.score} onChange={() => setC4Score(opt.score)} className="w-3.5 h-3.5 accent-emerald-600" />
                              </div>
                              <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {/* ROW 5: TIÊU CHÍ 5 */}
                    <tr className="border-l-4 border-l-cyan-600 hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200">5</td>
                      <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                        Lan tỏa &amp; tinh thần đội nhóm
                      </td>
                      <td className="p-3 text-slate-600 border-r border-slate-200">
                        Mức độ lan tỏa, hỗ trợ phối hợp.
                      </td>
                      <td className="p-3 text-center font-black text-slate-900 text-sm border-r border-slate-200">
                        10
                      </td>
                      <td className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-bold items-stretch">
                          {[
                            { score: 10, desc: "10đ — Truyền cảm hứng phong trào Gemba" },
                            { score: 8, desc: "8đ — Phối hợp liên phòng ban xuất sắc" },
                            { score: 5, desc: "5đ — Phối hợp nhóm trong bộ phận" },
                            { score: 2, desc: "2đ — Phối hợp nhỏ 2 người" },
                            { score: 0, desc: "0đ — Cá nhân làm độc lập" },
                          ].map((opt) => (
                            <label
                              key={opt.score}
                              className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                                c5Score === opt.score
                                  ? "border-[#006838] bg-emerald-50 shadow-xs font-black text-emerald-950"
                                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{opt.score}đ</span>
                                <input type="radio" name="judge_c5_score_radio" checked={c5Score === opt.score} onChange={() => setC5Score(opt.score)} className="w-3.5 h-3.5 accent-emerald-600" />
                              </div>
                              <span className="text-[10.5px] leading-tight block text-slate-800">{opt.desc}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* BOTTOM FOOTER BAR MATCHING SPEC IMAGE 2 */}
                <div className="p-4 bg-[#0b1739] text-white flex flex-col sm:flex-row items-center justify-between gap-3 font-black uppercase text-xs rounded-b-2xl border-t border-slate-700 shadow-xl">
                  <div className="flex items-center gap-3">
                    <span className="tracking-wider text-slate-200">TỔNG ĐIỂM TỐI ĐA: 100</span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    {errorMsg && (
                      <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 max-w-md animate-in fade-in">
                        <IconAlertTriangle size={15} className="shrink-0 text-rose-400" />
                        <span className="truncate">{errorMsg}</span>
                      </div>
                    )}

                    {submitSuccessMsg && (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 max-w-md animate-in fade-in">
                        <IconCheck size={15} className="shrink-0 text-emerald-400" />
                        <span className="truncate">{submitSuccessMsg}</span>
                      </div>
                    )}

                    <span className="tracking-wider text-slate-200">
                      TỔNG ĐIỂM BGK: <strong className="text-emerald-400 text-base font-black ml-1">{totalScorePreview}/100</strong>
                    </span>

                    <button
                      type="button"
                      disabled={submittingScore}
                      onClick={handleScoreSubmit}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <IconSend size={15} />
                      <span>{submittingScore ? "Đang nộp..." : "Gửi Bảng Điểm"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <IconAward size={40} className="mx-auto opacity-30" />
              <p className="font-extrabold text-sm text-slate-600">Chọn 1 hồ sơ từ danh sách bên trái để chấm điểm</p>
            </div>
          )}
        </div>
      </div>

      {/* CONFLICT OF INTEREST MODAL */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-rose-900 flex items-center gap-2">
              <IconAlertTriangle size={20} className="text-rose-600" />
              <span>Báo cáo Xung Đột Lợi Ích</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nếu bạn là người phụ trách/đồng tác giả hoặc có xung đột lợi ích với hồ sơ này, hãy chọn lý do để rút khỏi danh sách chấm.
            </p>

            <select
              value={conflictReason}
              onChange={(e) => setConflictReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
            >
              <option value="">-- Chọn lý do xin rút --</option>
              <option value="Hồ sơ thuộc đơn vị/chuyền do tôi trực tiếp quản lý">Hồ sơ thuộc đơn vị/chuyền do tôi quản lý</option>
              <option value="Tôi là thành viên tham gia thực hiện cải tiến này">Tôi là thành viên thực hiện cải tiến này</option>
              <option value="Có quan hệ thân nhân/đồng nghiệp trực tiếp với người nộp">Có quan hệ trực tiếp với người nộp</option>
              <option value="Lý do khách quan khác">Lý do khách quan khác</option>
            </select>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConflictModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submittingConflict}
                onClick={handleReportConflict}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md cursor-pointer"
              >
                {submittingConflict ? "Đang xử lý..." : "Xác nhận xin rút"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔑 GUEST LOGIN MODAL OVERLAY */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                🔑 BAN GIÁM KHẢO KHÁCH MỜI
              </span>
              <h3 className="text-base font-black">Đăng Nhập Không Gian Chấm Điểm</h3>
              <p className="text-xs text-slate-300">
                Nhập Tên đăng nhập (User) và Mật khẩu 1 lần (Pass) do Ban 2.2 / Ban Tổ Chức cấp.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleGuestLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">Tên đăng nhập (User)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: BGK-4819"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-bold font-mono bg-slate-50 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">Mật khẩu 1 lần (Pass)</label>
                <input
                  type="password"
                  placeholder="Ví dụ: 839102"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-bold font-mono bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white font-black text-xs cursor-pointer shadow-lg transition-all"
              >
                {loggingIn ? "Đang xác thực..." : "🔑 Đăng Nhập Chấm Điểm"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📋 MANDATORY GUEST DECLARATION FORM MODAL OVERLAY */}
      {isGuest && !declarationSubmitted && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-5 rounded-2xl text-white space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                📋 FORM KHAI BÁO BẮT BUỘC
              </span>
              <h3 className="text-lg font-black mt-1">Khai Báo Thông Tin Giám Khảo Khách Mời</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vui lòng hoàn thành khai báo đầy đủ họ tên, đơn vị công tác và xác nhận cam kết trước khi tiến hành chấm điểm. Thông tin sẽ được lưu tự động vào D1 &amp; Backup Google Drive.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">1. Mã số nhân viên (MSNV)</label>
                  <input
                    type="text"
                    placeholder="Nhập MSNV (vd: 212184843)..."
                    value={declMsnv}
                    onChange={(e) => setDeclMsnv(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">
                    2. Họ và tên đầy đủ Giám Khảo <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập họ và tên của bạn..."
                    value={declFullName}
                    onChange={(e) => setDeclFullName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">
                  3. Chức vụ / Đơn vị công tác <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giám đốc Chất lượng / Chuyên gia IE Tập đoàn..."
                  value={declOrg}
                  onChange={(e) => setDeclOrg(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">4. SĐT liên hệ</label>
                  <input
                    type="text"
                    placeholder="Nhập SĐT..."
                    value={declPhone}
                    onChange={(e) => setDeclPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">5. Email liên hệ</label>
                  <input
                    type="text"
                    placeholder="Nhập Email..."
                    value={declEmail}
                    onChange={(e) => setDeclEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  />
                </div>
              </div>

              <label className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 cursor-pointer text-xs font-bold text-amber-950">
                <input
                  type="checkbox"
                  checked={declNoConflict}
                  onChange={(e) => setDeclNoConflict(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded shrink-0 mt-0.5"
                />
                <span>
                  Tôi cam kết không có xung đột lợi ích cá nhân (không phải tác giả / người quản lý trực tiếp) đối với các sáng kiến được phân công chấm điểm.
                </span>
              </label>

              <button
                type="button"
                disabled={submittingDecl}
                onClick={handleSubmitDeclaration}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-lg transition-all"
              >
                {submittingDecl ? "Đang lưu thông tin & Backup Google Drive..." : "🚀 Gửi Khai Báo & Mở Không Gian Chấm Điểm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL XÁC NHẬN DANH TÍNH NGUỜI CHẤM THỰC CHO TÀI KHOẢN DÙNG CHUNG */}
      {showIdentityModal && selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-indigo-200">
            <div className="flex items-center gap-3 text-indigo-950">
              <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700">
                <IconUser size={24} />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-100 font-mono font-black text-[10px] uppercase">
                  👥 TÀI KHOẢN DÙNG CHUNG ({guestUserObj?.username || guestUserObj?.empCode?.replace('GUEST_', '') || 'BGK'})
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">Xác nhận Danh tính Người Chấm Thực</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tài khoản này được dùng chung bởi nhiều Giám Khảo. Trước khi bắt đầu chấm điểm cho sáng kiến{" "}
              <strong className="text-indigo-950 font-black">{selectedAssignment.submission_id}</strong>,
              vui lòng xác nhận Họ và tên của bạn để hệ thống ghi nhận chính xác lượt chấm này.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">1. Họ và tên người chấm (*)</label>
                <input
                  type="text"
                  value={realScorerName}
                  onChange={(e) => {
                    setRealScorerName(e.target.value);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("tbs_real_scorer_name", e.target.value);
                    }
                  }}
                  placeholder="Nhập họ và tên đầy đủ của bạn..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">2. SĐT hoặc Email liên hệ (Tuỳ chọn)</label>
                <input
                  type="text"
                  value={realScorerPhone}
                  onChange={(e) => {
                    setRealScorerPhone(e.target.value);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("tbs_real_scorer_phone", e.target.value);
                    }
                  }}
                  placeholder="Nhập SĐT hoặc Email liên hệ..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const lowerScorer = realScorerName.trim().toLowerCase();
                if (!realScorerName.trim() || lowerScorer.includes("khách mời") || lowerScorer.includes("khach moi") || lowerScorer.includes("bgk")) {
                  setErrorMsg("⚠️ Vui lòng nhập Họ và tên thực của bạn (không dùng tên tài khoản ảo/khách mời mặc định)!");
                  return;
                }
                if (typeof window !== "undefined") {
                  localStorage.setItem("tbs_real_scorer_name", realScorerName.trim());
                  if (realScorerPhone.trim()) localStorage.setItem("tbs_real_scorer_phone", realScorerPhone.trim());
                }
                setActiveConfirmedProposalId(selectedAssignment.submission_id);
                setShowIdentityModal(false);
              }}
              className="w-full py-3 rounded-2xl bg-[#006838] hover:bg-[#00522c] text-white font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🚀 Bắt đầu chấm điểm sáng kiến này ➔</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
