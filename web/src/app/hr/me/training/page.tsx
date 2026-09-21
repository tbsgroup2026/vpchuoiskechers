"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, UserProfile } from "@/lib/userProfiles";
import {
  IconSchool,
  IconCertificate,
  IconBook,
  IconCheck,
  IconSparkles,
} from "@tabler/icons-react";

export default function PersonalTrainingPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Training list state
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const cur = getCurrentUser();
    setUser(cur);
    setLoading(false);

    // TODO: Đấu nối API /api/hr/me?section=training để lấy danh sách khóa học và chứng chỉ cá nhân từ DB hr_training
  }, []);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <IconSchool className="text-[#006838]" size={22} />
            Đào Tạo &amp; Phát Triển Kỹ Năng Cá Nhân
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Theo dõi các khóa đào tạo nội bộ đã hoàn thành, chứng chỉ chuyên môn và lộ trình phát triển bản thân (IDP).
          </p>
        </div>
      </div>

      {/* 3 Thẻ chỉ số đào tạo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Khóa học đã hoàn thành
          </span>
          <div className="text-2xl font-black text-[#006838]">4 <span className="text-xs font-semibold text-slate-500">khóa</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Chứng chỉ đã cấp
          </span>
          <div className="text-2xl font-black text-amber-600">2 <span className="text-xs font-semibold text-slate-500">chứng chỉ</span></div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Giờ đào tạo tích lũy
          </span>
          <div className="text-2xl font-black text-blue-600">36.0 <span className="text-xs font-semibold text-slate-500">giờ</span></div>
        </div>
      </div>

      {/* Danh sách Khóa Học & Chứng Chỉ */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
          Danh Sách Khóa Học Cá Nhân
        </h2>

        {courses.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006838] mx-auto flex items-center justify-center">
              <IconCertificate size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Chưa ghi nhận khóa học bắt buộc mới</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Bạn đã hoàn thành đầy đủ các khóa đào tạo định hướng. Các chương trình nâng cao kỹ năng mới sẽ sớm được cập nhật.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table layout if courses exist */}
          </div>
        )}
      </div>
    </div>
  );
}
