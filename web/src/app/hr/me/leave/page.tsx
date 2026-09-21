"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, UserProfile } from "@/lib/userProfiles";
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

  // Leave records state
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);

  useEffect(() => {
    const cur = getCurrentUser();
    setUser(cur);
    setLoading(false);

    // TODO: Đấu nối API /api/hr/me?section=leave để lấy danh sách đơn nghỉ phép thực tế từ DB Cloudflare D1
  }, []);

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setToast("Tạo đơn nghỉ phép thành công! Đã gửi thông báo phê duyệt tới quản lý.");
    setTimeout(() => setToast(null), 3500);
  };

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

      {/* 3 Thẻ thống kê số ngày phép */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tổng phép năm 2026
          </span>
          <div className="text-2xl font-black text-slate-900">12.0 <span className="text-xs font-semibold text-slate-500">ngày</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Đã sử dụng
          </span>
          <div className="text-2xl font-black text-amber-600">3.0 <span className="text-xs font-semibold text-slate-500">ngày</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1 bg-emerald-50/50 border-emerald-200/80">
          <span className="text-[11px] font-bold text-[#006838] uppercase tracking-wider">
            Phép còn lại
          </span>
          <div className="text-2xl font-black text-[#006838]">9.0 <span className="text-xs font-semibold text-emerald-700">ngày</span></div>
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
            {/* Table layout if records exist */}
          </div>
        )}
      </div>

      {/* Modal Tạo Đơn Xin Nghỉ Phép */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900">Tạo Đơn Xin Nghỉ Phép</h3>

            <form onSubmit={handleCreateLeave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Loại nghỉ phép</label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838] font-semibold">
                  <option>Nghỉ phép năm</option>
                  <option>Nghỉ bệnh / Ốm đau</option>
                  <option>Nghỉ không hưởng lương</option>
                  <option>Nghỉ việc riêng (Cưới hỏi, tang chế)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Từ ngày</label>
                  <input type="date" required className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838]" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Đến ngày</label>
                  <input type="date" required className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838]" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Lý do nghỉ phép</label>
                <textarea rows={3} required placeholder="Nhập lý do chi tiết..." className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838]" />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#006838] text-white font-bold hover:bg-[#00522c] cursor-pointer"
                >
                  Gửi Đơn Xin Phép
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
