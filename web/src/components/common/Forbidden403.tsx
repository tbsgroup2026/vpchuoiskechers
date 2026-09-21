"use client";

import React from "react";
import Link from "next/link";
import { IconShieldLock, IconArrowLeft, IconHome } from "@tabler/icons-react";

interface Forbidden403Props {
  title?: string;
  description?: string;
  requiredPermission?: string;
}

export default function Forbidden403({
  title = "403 — Rào Cản Bảo Mật Hệ Thống",
  description = "Tài khoản của bạn không có quyền truy cập vào phân hệ này. Vui lòng liên hệ Trưởng phòng hoặc Admin Hệ thống để được cấp quyền.",
  requiredPermission,
}: Forbidden403Props) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
      <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-lg mb-5 relative">
        <IconShieldLock size={44} />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full animate-ping" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight max-w-md">
        {title}
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mt-2 leading-relaxed">
        {description}
      </p>

      {requiredPermission && (
        <div className="mt-3 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[11px] font-bold">
          Required: <span className="text-rose-600">{requiredPermission}</span>
        </div>
      )}

      <div className="flex items-center gap-3 mt-6">
        <Link
          href="/work"
          className="px-4 py-2.5 rounded-xl bg-[#006838] hover:bg-[#004d29] text-white text-xs font-black transition-all flex items-center gap-2 shadow-md"
        >
          <IconHome size={16} />
          <span>Về Trang Chủ Công Việc</span>
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all flex items-center gap-2 border border-slate-300"
        >
          <IconArrowLeft size={16} />
          <span>Quay lại trang trước</span>
        </button>
      </div>
    </div>
  );
}
