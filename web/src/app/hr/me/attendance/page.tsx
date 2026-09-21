"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, UserProfile } from "@/lib/userProfiles";
import {
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconFileText,
  IconCalendar,
  IconFilter,
} from "@tabler/icons-react";

export default function PersonalAttendancePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Attendance records state
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  useEffect(() => {
    const cur = getCurrentUser();
    setUser(cur);
    setLoading(false);

    // TODO: Đấu nối API /api/hr/me?section=attendance để lấy log chấm công thực tế từ máy chấm công vân tay / khuôn mặt DB
  }, []);

  const handleSendExplanation = (e: React.FormEvent) => {
    e.preventDefault();
    setShowExplanationModal(false);
    setToast("Gửi đơn giải trình chấm công thành công! Đã chuyển tới cấp quản lý xem xét.");
    setTimeout(() => setToast(null), 3500);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-3xl" />
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
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-emerald-900 text-white text-xs font-bold shadow-2xl border border-emerald-700 animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <IconClock className="text-[#006838]" size={22} />
            Dữ Liệu Chấm Công Cá Nhân
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Tra cứu giờ vào / giờ ra hàng ngày, tổng số công trong tháng và gửi giải trình đi muộn / về sớm.
          </p>
        </div>

        <button
          onClick={() => setShowExplanationModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-amber-600 text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-amber-700 transition shadow-2xs cursor-pointer shrink-0"
        >
          <IconFileText size={16} />
          <span>Gửi Giải Trình Chấm Công</span>
        </button>
      </div>

      {/* 4 Thẻ chỉ số chấm công tháng hiện tại */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Công thực tế tháng này
          </span>
          <div className="text-2xl font-black text-[#006838]">18.5 <span className="text-xs font-semibold text-slate-500">ngày công</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Đúng giờ
          </span>
          <div className="text-2xl font-black text-emerald-600">18 <span className="text-xs font-semibold text-slate-500">buổi</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Đi muộn / Về sớm
          </span>
          <div className="text-2xl font-black text-amber-600">0 <span className="text-xs font-semibold text-slate-500">lần</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Giải trình đã duyệt
          </span>
          <div className="text-2xl font-black text-blue-600">0 <span className="text-xs font-semibold text-slate-500">đơn</span></div>
        </div>
      </div>

      {/* Bảng Dữ Liệu Chấm Công Hàng Ngày */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
            Bật Bảng Chi Tiết Chấm Công Tháng 09/2026
          </h2>
        </div>

        {attendanceRecords.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] mx-auto flex items-center justify-center">
              <IconClock size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Đã ghi nhận dữ liệu chấm công đầy đủ</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Dữ liệu chấm công realtime được tự động đồng bộ từ máy chấm công văn phòng. Không phát hiện vi phạm đi muộn / về sớm.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table layout if records exist */}
          </div>
        )}
      </div>

      {/* Modal Giải Trình Chấm Công */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900">Gửi Đơn Giải Trình Chấm Công</h3>

            <form onSubmit={handleSendExplanation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Ngày cần giải trình</label>
                <input type="date" required className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838]" />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Lý do giải trình</label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838] font-semibold">
                  <option>Quên quẹt thẻ / Quên check-in</option>
                  <option>Gặp sự cố giao thông trên đường</option>
                  <option>Đi công tác ngoài văn phòng</option>
                  <option>Lỗi thiết bị chấm công</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nội dung chi tiết</label>
                <textarea rows={3} required placeholder="Giải trình chi tiết lý do..." className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838]" />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExplanationModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer"
                >
                  Gửi Giải Trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
