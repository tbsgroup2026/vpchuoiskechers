"use client";

import React, { useState, useEffect } from "react";
import NavLink from "@/components/NavLink";
import { IconCheck, IconX, IconClock, IconSparkles, IconRefresh, IconArrowLeft, IconSearch } from "@tabler/icons-react";

export default function KaizenIEQueueView() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Form State
  const [timeBefore, setTimeBefore] = useState<number>(0);
  const [timeAfter, setTimeAfter] = useState<number>(0);
  const [confirmNote, setConfirmNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchIEQueue = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch("/api/ci-kaizen/ie-queue", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProposals(json.data);
      } else {
        showToast(`⚠️ ${json.message || "Không thể tải hàng chờ IE"}`);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIEQueue();
  }, []);

  const openConfirmModal = (p: any) => {
    setSelectedProposal(p);
    setTimeBefore(Number(p.saved_seconds || p.so_giay_tiet_kiem || p.ie_time_before_original || 60));
    setTimeAfter(Number(p.ie_time_after_original || 30));
    setConfirmNote("");
    setIsConfirmModalOpen(true);
  };

  const openRejectModal = (p: any) => {
    setSelectedProposal(p);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedProposal) return;
    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch(`/api/ci-kaizen/${selectedProposal.id}/ie-confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          time_before: Number(timeBefore),
          time_after: Number(timeAfter),
          note: confirmNote,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✅ Đã xác nhận thời gian IE & chuyển phê duyệt thành công!");
        setIsConfirmModalOpen(false);
        fetchIEQueue();
      } else {
        showToast(`❌ ${json.message || "Lỗi khi xác nhận"}`);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedProposal || !rejectReason.trim()) {
      showToast("⚠️ Vui lòng nhập lý do trả lại thẻ");
      return;
    }
    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
      const res = await fetch(`/api/ci-kaizen/${selectedProposal.id}/ie-reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rejection_reason: rejectReason }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("↩️ Đã trả lại thẻ Kaizen cho tác giả chỉnh sửa!");
        setIsRejectModalOpen(false);
        fetchIEQueue();
      } else {
        showToast(`❌ ${json.message || "Lỗi khi trả lại thẻ"}`);
      }
    } catch (e) {
      showToast("❌ Lỗi kết nối máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProposals = proposals.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.code?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.proposer_name?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl text-sm font-semibold border border-slate-700 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <NavLink href="/work/kaizen" className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            <IconArrowLeft size={20} />
          </NavLink>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                ROLE IE ENGINE
              </span>
              <h1 className="text-xl font-black text-slate-900">Hàng Chờ Xác Nhận Thời Gian IE</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Xác nhận hoặc điều chỉnh chỉ số thời gian trước/sau của đề xuất Kaizen trước khi phê duyệt triển khai</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo MSNV, tên, tiêu đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
          <button
            onClick={fetchIEQueue}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
          >
            <IconRefresh size={16} /> Làm mới
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">⏳ Đang tải danh sách hàng chờ IE...</div>
        ) : filteredProposals.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm font-medium">
            🎉 Hiện tại không có đề xuất Kaizen nào chờ IE xác nhận!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Mã & Tiêu Đề</th>
                  <th className="px-4 py-3">Người Đăng Ký</th>
                  <th className="px-4 py-3">Nhà Máy / Bộ Phận</th>
                  <th className="px-4 py-3">TG Gốc Khai</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3 text-right">Thao Tác IE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProposals.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-blue-600">{p.code}</div>
                      <div className="font-bold text-slate-800 text-sm line-clamp-1">{p.title}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{p.proposer_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.proposer_emp_code}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-700">{p.factory || p.source_region || "VP CHUỖI"}</div>
                      <div className="text-[11px] text-slate-400">{p.department}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 inline-block">
                        ⏱️ {p.saved_seconds || p.so_giay_tiet_kiem || 0} giây
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
                        ⏳ Chờ IE xác nhận
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openConfirmModal(p)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1 shadow-2xs"
                      >
                        <IconCheck size={14} /> Xác Nhận
                      </button>
                      <button
                        onClick={() => openRejectModal(p)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-lg text-xs transition inline-flex items-center gap-1"
                      >
                        <IconX size={14} /> Trả Lại
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {isConfirmModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-scale-in">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              IE Xác Nhận Thời Gian Tiết Kiệm: <span className="text-blue-600 font-mono">{selectedProposal.code}</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Thời gian trước cải tiến (giây):</label>
                <input
                  type="number"
                  value={timeBefore}
                  onChange={(e) => setTimeBefore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Thời gian sau cải tiến (giây):</label>
                <input
                  type="number"
                  value={timeAfter}
                  onChange={(e) => setTimeAfter(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-semibold flex items-center justify-between">
                <span>Tổng thời gian tiết kiệm IE xác nhận:</span>
                <span className="text-sm font-black font-mono text-blue-700">{Math.max(0, timeBefore - timeAfter)} giây</span>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú xác nhận của Kỹ Sư IE:</label>
                <textarea
                  rows={3}
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  placeholder="Ghi chú thẩm định phương pháp bấm giờ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                {submitting ? "Đang xử lý..." : "Xác Nhận & Chuyển Phê Duyệt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-scale-in">
            <h2 className="text-lg font-black text-rose-700 border-b border-slate-100 pb-3">
              Trả Thẻ Kaizen Về Tác Giả: <span className="font-mono">{selectedProposal.code}</span>
            </h2>
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Lý do IE trả lại thẻ (Bắt buộc):</label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập chi tiết lý do sai lệch số liệu hoặc yêu cầu đo đạc lại..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                disabled={submitting || !rejectReason.trim()}
                onClick={handleRejectSubmit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                {submitting ? "Đang xử lý..." : "Trả Thẻ Về Tác Giả"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
