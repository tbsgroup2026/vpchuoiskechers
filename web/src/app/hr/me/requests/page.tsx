"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, UserProfile } from "@/lib/userProfiles";
import {
  IconSend,
  IconPlus,
  IconClipboardCheck,
  IconClock,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

export default function PersonalRequestsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Requests history state
  const [requestsList, setRequestsList] = useState<any[]>([]);

  useEffect(() => {
    const cur = getCurrentUser();
    setUser(cur);
    setLoading(false);

    // TODO: Đấu nối API /api/hr/me?section=requests để lấy danh sách đơn từ và yêu cầu thực tế từ DB hr_user_requests
  }, []);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setToast("Tạo yêu cầu hành chính thành công! Đã gửi thông báo tới bộ phận tiếp nhận.");
    setTimeout(() => setToast(null), 3500);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl" />
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

      {/* Header & New Request Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <IconSend className="text-[#006838]" size={22} />
            Đơn Từ &amp; Yêu Cầu Hành Chính Cá Nhân
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Gửi đơn đăng ký xác nhận công tác, cấp đổi thẻ nhân viên, xin cấp văn phòng phẩm hoặc hỗ trợ hành chính.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#006838] text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-[#00522c] transition shadow-2xs cursor-pointer shrink-0"
        >
          <IconPlus size={16} />
          <span>Tạo Yêu Cầu Mới</span>
        </button>
      </div>

      {/* 3 Thẻ trạng thái đơn từ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tổng đơn đã gửi
          </span>
          <div className="text-2xl font-black text-slate-900">2 <span className="text-xs font-semibold text-slate-500">đơn</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Đã hoàn thành
          </span>
          <div className="text-2xl font-black text-[#006838]">2 <span className="text-xs font-semibold text-slate-500">đơn</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Đang xử lý
          </span>
          <div className="text-2xl font-black text-amber-600">0 <span className="text-xs font-semibold text-slate-500">đơn</span></div>
        </div>
      </div>

      {/* Danh sách Đơn Từ */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
          Lịch Sử Đơn Từ &amp; Yêu Cầu Hành Chính
        </h2>

        {requestsList.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] mx-auto flex items-center justify-center">
              <IconClipboardCheck size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Tất cả yêu cầu hành chính đã được xử lý xong</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Bạn hiện không có yêu cầu hành chính nào đang chờ. Nhấp vào "Tạo Yêu Cầu Mới" khi cần gửi đề nghị.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table layout if requests exist */}
          </div>
        )}
      </div>

      {/* Modal Tạo Yêu Cầu Hành Chính */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900">Tạo Yêu Cầu Hành Chính Mới</h3>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Loại yêu cầu</label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838] font-semibold">
                  <option>Giấy xác nhận công tác &amp; Thu nhập</option>
                  <option>Cấp mới / Đổi thẻ nhân viên</option>
                  <option>Hỗ trợ văn phòng phẩm &amp; Thiết bị</option>
                  <option>Yêu cầu hỗ trợ IT / Kỹ thuật</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tiêu đề yêu cầu</label>
                <input type="text" required placeholder="Ví dụ: Xin giấy xác nhận công tác vay ngân hàng..." className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838]" />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mục đích / Chi tiết</label>
                <textarea rows={3} required placeholder="Mô tả mục đích và thời gian cần nhận kết quả..." className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#006838]" />
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
                  Gửi Yêu Cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
