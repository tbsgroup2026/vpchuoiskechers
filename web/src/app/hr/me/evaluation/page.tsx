"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, UserProfile } from "@/lib/userProfiles";
import {
  IconTrendingUp,
  IconAward,
  IconCheck,
  IconLock,
  IconShieldCheck,
  IconChartBar,
} from "@tabler/icons-react";

export default function PersonalEvaluationPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Evaluation list state
  const [evaluations, setEvaluations] = useState<any[]>([]);

  useEffect(() => {
    // 1. Kiểm tra xác thực & chỉ trả về kết quả cho CHÍNH chủ sở hữu tài khoản
    const cur = getCurrentUser();
    setUser(cur);
    setLoading(false);

    // TODO: Đấu nối API /api/hr/me?section=evaluation bảo mật Server-side để lấy phiếu đánh giá KPI định kỳ từ DB
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
        <IconLock size={40} className="mx-auto text-amber-500" />
        <h3 className="text-base font-bold text-slate-800">Quyền truy cập bị từ chối</h3>
        <p className="text-xs text-slate-500">Kết quả đánh giá chỉ hiển thị cho đúng người dùng sở hữu tài khoản.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Banner Đánh Giá */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
              <IconLock size={12} /> BẢO MẬT CHÍNH CHỦ
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mt-1">
            <IconTrendingUp className="text-[#006838]" size={22} />
            Kết Quả Đánh Giá Hiệu Suất &amp; Năng Lực
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Tra cứu xếp loại KPI định kỳ, nhận xét từ cấp quản lý và lộ trình cải tiến năng lực.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#006838] text-xs font-bold flex items-center gap-2 shrink-0">
          <IconAward size={18} />
          <span>Xếp loại gần nhất: <strong>Loại A (Xuất sắc)</strong></span>
        </div>
      </div>

      {/* 3 Thẻ tóm tắt kết quả đánh giá */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Điểm KPI Quý 2/2026
          </span>
          <div className="text-2xl font-black text-[#006838]">94.5 <span className="text-xs font-semibold text-slate-500">/ 100</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Xếp loại hiệu suất
          </span>
          <div className="text-2xl font-black text-emerald-600">HOÀN THÀNH XUẤT SẮC</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tỷ lệ mục tiêu đạt được
          </span>
          <div className="text-2xl font-black text-blue-600">100%</div>
        </div>
      </div>

      {/* Danh sách các kỳ đánh giá */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
          Lịch Sử Đánh Giá Theo Kỳ
        </h2>

        {evaluations.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] mx-auto flex items-center justify-center">
              <IconAward size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Dữ liệu đánh giá kỳ mới đang được tổng hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Kết quả đánh giá chính thức của Quý 3/2026 sẽ được công bố sau khi Hội đồng HR hoàn tất phê duyệt.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table layout if evaluations exist */}
          </div>
        )}
      </div>
    </div>
  );
}
