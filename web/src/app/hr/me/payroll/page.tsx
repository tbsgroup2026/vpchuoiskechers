"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, UserProfile } from "@/lib/userProfiles";
import {
  IconWallet,
  IconEye,
  IconEyeOff,
  IconLock,
  IconFileSpreadsheet,
  IconShieldCheck,
  IconReceipt,
} from "@tabler/icons-react";

export default function PersonalPayrollPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSalary, setShowSalary] = useState(false);

  // Payslip history state
  const [payslips, setPayslips] = useState<any[]>([]);

  useEffect(() => {
    // 1. Kiểm tra xác thực & chỉ trả dữ liệu lương cho CHÍNH chủ sở hữu
    const cur = getCurrentUser();
    setUser(cur);
    setLoading(false);

    // TODO: Đấu nối API /api/hr/me?section=payroll bảo mật Server-side để lấy phiếu lương cá nhân từ DB hr_payroll
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
        <h3 className="text-base font-bold text-slate-800">Thông tin lương bảo mật</h3>
        <p className="text-xs text-slate-500">Thông tin thu nhập và phiếu lương chỉ hiển thị cho đúng người dùng sở hữu tài khoản.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Toggle Hidden Salary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#006838] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <IconShieldCheck size={12} /> BẢO MẬT THU NHẬP CÁ NHÂN
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mt-1">
            <IconWallet className="text-[#006838]" size={22} />
            Phiếu Lương &amp; Chế Độ Phúc Lợi
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Tra cứu phiếu lương hàng tháng, chi tiết bảo hiểm, phụ cấp và tiền thưởng cá nhân.
          </p>
        </div>

        <button
          onClick={() => setShowSalary(!showSalary)}
          className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 shrink-0"
        >
          {showSalary ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          <span>{showSalary ? "Ẩn Số Tiền" : "Hiển Thị Số Tiền"}</span>
        </button>
      </div>

      {/* 3 Thẻ chỉ số thu nhập */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Kỳ lương gần nhất (08/2026)
          </span>
          <div className="text-2xl font-black text-[#006838] font-mono">
            {showSalary ? "•••••••• VNĐ" : "•••••••• VNĐ"}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">Đã thanh toán qua tài khoản ngân hàng</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Chế độ Bảo Hiểm (BHXH, BHYT)
          </span>
          <div className="text-2xl font-black text-emerald-600">ĐÃ ĐÓNG ĐẦY ĐỦ</div>
          <span className="text-[10px] text-slate-400 font-semibold block">Trích nộp theo đúng quy định pháp luật</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Phúc lợi tập đoàn TBS
          </span>
          <div className="text-2xl font-black text-blue-600">CHUẨN SKECHERS</div>
          <span className="text-[10px] text-slate-400 font-semibold block">Phụ cấp cơm trưa, xăng xe &amp; thưởng</span>
        </div>
      </div>

      {/* Lịch Sử Phiếu Lương */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
          Danh Sách Phiếu Lương Hàng Tháng
        </h2>

        {payslips.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] mx-auto flex items-center justify-center">
              <IconReceipt size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Phiếu lương kỳ mới đang được bảo mật xử lý</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Phiếu lương tháng 09/2026 sẽ được cập nhật tự động sau khi phòng Kế toán — Nhân sự hoàn tất chốt công.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table layout if payslips exist */}
          </div>
        )}
      </div>
    </div>
  );
}
