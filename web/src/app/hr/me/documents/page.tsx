"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, UserProfile } from "@/lib/userProfiles";
import {
  IconFileText,
  IconDownload,
  IconEye,
  IconCheck,
  IconFileDescription,
} from "@tabler/icons-react";

export default function PersonalDocumentsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Documents list state
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const cur = getCurrentUser();
    setUser(cur);
    setLoading(false);

    // TODO: Đấu nối API /api/hr/me?section=documents để lấy danh sách hợp đồng và văn bản cá nhân từ DB hr_documents
  }, []);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <IconFileText className="text-[#006838]" size={22} />
            Hợp Đồng Lao Động &amp; Giấy Tờ Cá Nhân
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Tra cứu thông tin Hợp đồng lao động chính thức, các quyết định bổ nhiệm, khen thưởng và văn bản đã ký.
          </p>
        </div>
      </div>

      {/* Thông tin Hợp Đồng Hiện Tại */}
      {user && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <IconFileDescription className="text-[#006838]" size={18} />
              Hợp Đồng Lao Động Đang Có Hiệu Lực
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006838] text-xs font-bold">
              ĐANG HIỆU LỰC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Loại hợp đồng</span>
              <span className="text-slate-900 font-extrabold block">Hợp đồng Lao động Không xác định thời hạn</span>
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Số hợp đồng</span>
              <span className="text-slate-900 font-extrabold font-mono block">HDLD-TBS-{user.empCode}</span>
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Ngày hiệu lực</span>
              <span className="text-slate-900 font-extrabold block">01/03/2024</span>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách Văn bản / Quyết định */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
          Giấy Tờ &amp; Quyết Định Cá Nhân
        </h2>

        {documents.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] mx-auto flex items-center justify-center">
              <IconFileText size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Tài liệu cá nhân đã được lưu trữ an toàn</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Toàn bộ hồ sơ bản cứng và file scan hợp đồng đã được phòng Nhân sự số hóa và lưu trữ trên hệ thống.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table layout if documents exist */}
          </div>
        )}
      </div>
    </div>
  );
}
