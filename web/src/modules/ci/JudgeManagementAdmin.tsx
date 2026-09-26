"use client";

import React, { useState, useEffect } from "react";
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
} from "@tabler/icons-react";

export default function JudgeManagementAdmin() {
  const [activeTab, setActiveTab] = useState<"rounds" | "guests" | "assignments" | "flags">("rounds");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [rounds, setRounds] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);

  // Round Creation Form
  const [newRoundTitle, setNewRoundTitle] = useState("");
  const [newFiscalYear, setNewFiscalYear] = useState(2026);
  const [newNsldUnitPrice, setNewNsldUnitPrice] = useState(50000);

  // Guest Account Creation Form
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [guestRoundId, setGuestRoundId] = useState("");
  const [isSharedAccount, setIsSharedAccount] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Flag Resolution Form
  const [selectedFlag, setSelectedFlag] = useState<any | null>(null);
  const [overrideScoreInput, setOverrideScoreInput] = useState<number | "">(85);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");

  useEffect(() => {
    loadRounds();
    loadGuests();
    loadFlags();
  }, []);

  const loadRounds = async () => {
    try {
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";
      const res = await fetch("/api/ci-kaizen/judging/rounds", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.rounds)) {
        setRounds(json.rounds);
        if (json.rounds.length > 0 && !guestRoundId) {
          setGuestRoundId(json.rounds[0].id);
        }
      }
    } catch (e) {}
  };

  const loadGuests = async () => {
    try {
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";
      const res = await fetch("/api/ci-kaizen/judging/guests", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.guests)) {
        setGuests(json.guests);
      }
    } catch (e) {}
  };

  const loadFlags = async () => {
    try {
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";
      const res = await fetch("/api/ci-kaizen/judging/flags", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";
      const res = await fetch("/api/ci-kaizen/judging/rounds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  const handleCreateGuest = async () => {
    const finalRoundId = guestRoundId || (rounds.length > 0 ? rounds[0].id : "ROUND_2026");

    try {
      setLoading(true);
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";
      const res = await fetch("/api/ci-kaizen/judging/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          roundId: finalRoundId,
          validDays: 7,
          dungChung: isSharedAccount ? 1 : 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(`✅ Đã sinh thành công User: ${json.username} | Pass 1 lần: ${json.oneTimePasscode}!`);
        loadGuests();
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
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";
      const res = await fetch(`/api/ci-kaizen/judging/guests?id=${guestId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setMsg("✅ Đã thu hồi quyền truy cập của BGK khách!");
        loadGuests();
      }
    } catch (e) {}
  };

  const handleResolveFlagOverride = async () => {
    if (!selectedFlag || overrideScoreInput === "") return;
    try {
      setLoading(true);
      let token = typeof window !== "undefined" ? (localStorage.getItem("tbs_jwt_token") || "") : "";
      const res = await fetch("/api/ci-kaizen/judging/flags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
            Quản Lý Ban Giám Khảo &amp; Phân Công Chấm Điểm
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Thiết lập đợt chấm, cấp tài khoản BGK khách mời (Magic Link), rà soát chênh lệch điểm &gt; 15đ
          </p>
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

      {/* TAB 2: GUEST ACCOUNTS & MAGIC LINKS */}
      {activeTab === "guests" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 text-white shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                  ⚡ CẤP USER &amp; PASS 1 LẦN (KHÔNG CẦN NHẬP THÔNG TIN)
                </span>
                <h3 className="text-base font-black text-white mt-1">Cấp Tài Khoản &amp; Mật Khẩu 1 Lần Cho BGK Khách Mời</h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  💡 Admin <strong>không cần nhập trước thông tin</strong>. Hệ thống sẽ tự động sinh ngẫu nhiên cặp <strong>User (`BGK-XXXX`) &amp; Pass 1 lần (`XXXXXX`)</strong>. Giám Khảo Khách Mời sẽ tự điền Form Khai Báo Bắt Buộc khi đăng nhập.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
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
                  <span>Tài khoản Dùng Chung (Nhiều người dùng chung 1 link)</span>
                </label>

                <button
                  onClick={() => handleCreateGuest()}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <span>⚡ Sinh Ngay User &amp; Pass BGK Khách Mời</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900">Danh sách Tài Khoản &amp; Pass 1 Lần BGK Khách Mời</h3>
            <div className="space-y-3">
              {guests.map((g) => {
                const usernameDisplay = g.username || "BGK-XXXX";
                const passDisplay = g.one_time_passcode || "XXXXXX";
                const magicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/work/kaizen/judge?bgkUser=${usernameDisplay}&pass=${passDisplay}`;
                const isRevoked = Boolean(g.is_revoked);
                const isDeclSubmitted = Boolean(g.declaration_submitted);

                return (
                  <div key={g.id} className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-50">
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
                            👥 DÙNG CHUNG (Xác nhận tên từng sáng kiến)
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

                      {!isRevoked && (
                        <button
                          onClick={() => handleRevokeGuest(g.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] cursor-pointer"
                        >
                          Thu hồi
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIVERGENCE FLAGS DASHBOARD (> 15 PTS DIFF) */}
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
    </div>
  );
}
