"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getCurrentUser, UserProfile } from "@/lib/userProfiles";
import { hrFetch } from "@/lib/hrClient";
import {
  IconCalendarOff,
  IconPlus,
  IconClock,
  IconCheck,
  IconX,
  IconInfoCircle,
} from "@tabler/icons-react";

export default function PersonalLeavePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Dữ liệu thật từ /api/hr/*
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ leaveType: "FULL", halfSession: "AM", startDate: "", endDate: "", reason: "" });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    const [me, list] = await Promise.all([hrFetch<any>("/me"), hrFetch<any[]>("/leave")]);
    if (!me.ok || !list.ok) {
      setLoadError(me.error || list.error || "Không tải được dữ liệu nghỉ phép.");
    } else {
      setLoadError(null);
      setBalance(me.data.leaveBalance);
      setLeaveHistory(list.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setUser(getCurrentUser());
    loadData();
  }, [loadData]);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    const end = form.leaveType === "HALF" ? form.startDate : form.endDate;
    if (!form.startDate || !end) return setFormError("Vui lòng chọn ngày nghỉ.");
    if (end < form.startDate) return setFormError("Ngày kết thúc không được trước ngày bắt đầu.");
    setSubmitting(true);
    const r = await hrFetch("/leave", {
      method: "POST",
      body: JSON.stringify({
        startDate: form.startDate,
        endDate: end,
        leaveType: form.leaveType,
        ...(form.leaveType === "HALF" ? { halfSession: form.halfSession } : {}),
        reason: form.reason.trim(),
      }),
    });
    setSubmitting(false);
    if (!r.ok) return setFormError(r.error || "Không gửi được đơn.");
    setShowModal(false);
    setForm({ leaveType: "FULL", halfSession: "AM", startDate: "", endDate: "", reason: "" });
    showToast("Đã gửi đơn nghỉ phép. Đơn đang chờ quản lý duyệt.");
    loadData();
  };

  const sumDays = (status: string) =>
    leaveHistory.filter((x) => x.status === status).reduce((s, x) => s + Number(x.days || 0), 0);
  const statusLabel: Record<string, string> = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-28 bg-slate-200 rounded-3xl" />
          <div className="h-28 bg-slate-200 rounded-3xl" />
        </div>
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-emerald-900 text-white text-xs font-bold shadow-2xl border border-emerald-700 animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <IconCalendarOff className="text-[#006838]" size={22} />
            Quản Lý Nghỉ Phép Cá Nhân
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Theo dõi quỹ ngày phép năm, số ngày đã sử dụng và trạng thái phê duyệt đơn.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#006838] text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-[#00522c] transition shadow-2xs cursor-pointer shrink-0"
        >
          <IconPlus size={16} />
          <span>Tạo Đơn Xin Nghỉ Phép</span>
        </button>
      </div>

      {loadError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold px-4 py-3">
          {loadError}
        </div>
      )}

      {/* 3 Thẻ thống kê số ngày phép (dữ liệu thật) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Chờ duyệt
          </span>
          <div className="text-2xl font-black text-slate-900">{sumDays("PENDING").toFixed(1)} <span className="text-xs font-semibold text-slate-500">ngày</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Đã được duyệt
          </span>
          <div className="text-2xl font-black text-amber-600">{sumDays("APPROVED").toFixed(1)} <span className="text-xs font-semibold text-slate-500">ngày</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1 bg-emerald-50/50 border-emerald-200/80">
          <span className="text-[11px] font-bold text-[#006838] uppercase tracking-wider">
            Phép còn lại
          </span>
          <div className="text-2xl font-black text-[#006838]">{balance === null ? "—" : balance.toFixed(1)} <span className="text-xs font-semibold text-emerald-700">ngày</span></div>
        </div>
      </div>

      {/* Danh sách Đơn Nghỉ Phép */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
          Lịch Sử Đơn Xin Nghỉ Phép
        </h2>

        {leaveHistory.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] mx-auto flex items-center justify-center">
              <IconCalendarOff size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Chưa có đơn xin nghỉ phép nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Bạn chưa gửi đơn nghỉ phép nào trong năm nay. Nhấp vào nút "Tạo Đơn Xin Nghỉ Phép" để khởi tạo đơn mới.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider">
                  <th className="py-2 pr-4 font-bold">Từ ngày</th>
                  <th className="py-2 pr-4 font-bold">Đến ngày</th>
                  <th className="py-2 pr-4 font-bold">Loại</th>
                  <th className="py-2 pr-4 font-bold">Số ngày</th>
                  <th className="py-2 font-bold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {leaveHistory.map((x) => (
                  <tr key={x.id} className="border-t border-slate-100 text-slate-700 font-medium">
                    <td className="py-2 pr-4">{String(x.start_date).split("-").reverse().join("/")}</td>
                    <td className="py-2 pr-4">{String(x.end_date).split("-").reverse().join("/")}</td>
                    <td className="py-2 pr-4">{x.leave_type === "HALF" ? `Nửa ngày (${x.half_session === "PM" ? "chiều" : "sáng"})` : "Cả ngày"}</td>
                    <td className="py-2 pr-4">{Number(x.days).toFixed(1)}</td>
                    <td className="py-2">{statusLabel[x.status] || x.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tạo Đơn Xin Nghỉ Phép */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900">Tạo Đơn Xin Nghỉ Phép</h3>

            <form onSubmit={handleCreateLeave} className="space-y-3 text-xs">
              {formError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold px-3 py-2">
                  {formError}
                </div>
              )}
              <div>
                <label htmlFor="leave-type" className="block text-slate-700 font-bold mb-1">Loại nghỉ phép</label>
                <select id="leave-type" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838] font-semibold">
                  <option value="FULL">Nghỉ cả ngày</option>
                  <option value="HALF">Nghỉ nửa ngày</option>
                </select>
              </div>

              {form.leaveType === "HALF" && (
                <div>
                  <label htmlFor="leave-session" className="block text-slate-700 font-bold mb-1">Buổi nghỉ</label>
                  <select id="leave-session" value={form.halfSession} onChange={(e) => setForm({ ...form, halfSession: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838] font-semibold">
                    <option value="AM">Buổi sáng</option>
                    <option value="PM">Buổi chiều</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="leave-start" className="block text-slate-700 font-bold mb-1">Từ ngày</label>
                  <input id="leave-start" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838]" />
                </div>
                {form.leaveType === "FULL" && (
                  <div>
                    <label htmlFor="leave-end" className="block text-slate-700 font-bold mb-1">Đến ngày</label>
                    <input id="leave-end" type="date" required min={form.startDate || undefined} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838]" />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="leave-reason" className="block text-slate-700 font-bold mb-1">Lý do nghỉ phép</label>
                <textarea id="leave-reason" rows={3} required maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Nhập lý do chi tiết..." className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838]" />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#006838] text-white font-bold hover:bg-[#00522c] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Đang gửi..." : "Gửi Đơn Xin Phép"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
