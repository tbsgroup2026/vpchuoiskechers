"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, UserProfile, getUserDisplayBadgeTitle } from "@/lib/userProfiles";
import {
  IconAddressBook,
  IconUser,
  IconMail,
  IconPhone,
  IconBuilding,
  IconBriefcase,
  IconId,
  IconCalendar,
  IconShieldCheck,
  IconInfoCircle,
} from "@tabler/icons-react";

export default function PersonalProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tải dữ liệu cá nhân của CHÍNH user hiện tại
    const cur = getCurrentUser();
    setUser(cur);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
        <IconInfoCircle size={40} className="mx-auto text-slate-400" />
        <h3 className="text-base font-bold text-slate-800">Chưa đăng nhập hệ thống</h3>
        <p className="text-xs text-slate-500">Vui lòng đăng nhập để tra cứu hồ sơ cá nhân của bạn.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Banner Thẻ Thông Tin Cá Nhân */}
      <div className="relative bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#006838] text-white flex items-center justify-center font-black text-3xl shadow-md border-4 border-white overflow-hidden shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* User Brief Info */}
          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006838] font-mono text-xs font-bold border border-emerald-200">
                {user.empCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold border border-slate-200">
                CHÍNH THỨC
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {user.name}
            </h1>

            <p className="text-sm font-semibold text-slate-600">
              {getUserDisplayBadgeTitle(user)} • {user.department}
            </p>
          </div>
        </div>
      </div>

      {/* Thông Tin Chi Tiết */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Khối 1: Thông tin công tác */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center">
              <IconBriefcase size={18} />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Thông tin công tác
            </h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Mã nhân viên:</span>
              <span className="font-mono font-bold text-slate-900">{user.empCode}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Chức danh nghiệp vụ:</span>
              <span className="font-extrabold text-slate-900">{user.title}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Phòng ban công tác:</span>
              <span className="font-extrabold text-[#006838]">{user.department}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Vai trò hệ thống:</span>
              <span className="font-bold text-slate-800">{user.roleCode || "CBCNV"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 font-medium">Ngày gia nhập:</span>
              <span className="font-semibold text-slate-700">01/03/2024</span>
            </div>
          </div>
        </div>

        {/* Khối 2: Thông tin liên hệ */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006838] flex items-center justify-center">
              <IconMail size={18} />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Thông tin liên hệ &amp; Tài khoản
            </h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Email doanh nghiệp:</span>
              <span className="font-bold text-slate-900 truncate max-w-[200px]">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Số điện thoại:</span>
              <span className="font-semibold text-slate-800">{user.phone || "Chưa cập nhật"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Địa điểm làm việc:</span>
              <span className="font-semibold text-slate-800">Văn Phòng Chuỗi SKECHERS – HQ</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 font-medium">Trạng thái bảo mật:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <IconShieldCheck size={14} /> Xác thực Session thành công
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
