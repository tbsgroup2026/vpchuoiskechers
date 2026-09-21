"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, UserProfile, getUserDisplayBadgeTitle } from "@/lib/userProfiles";
import {
  IconArrowLeft,
  IconAddressBook,
  IconCalendarOff,
  IconClock,
  IconTrendingUp,
  IconSchool,
  IconWallet,
  IconFileText,
  IconSend,
  IconUserCheck,
  IconShieldCheck,
  IconLock,
} from "@tabler/icons-react";

export default function PersonalHRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const u = getCurrentUser();
    setCurrentUser(u);

    const handleProfileUpdate = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener("tbs_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("tbs_profile_updated", handleProfileUpdate);
    };
  }, []);

  const navTabs = [
    { href: "/hr/me/profile", label: "Hồ sơ cá nhân", icon: IconAddressBook },
    { href: "/hr/me/leave", label: "Nghỉ phép", icon: IconCalendarOff },
    { href: "/hr/me/attendance", label: "Chấm công", icon: IconClock },
    { href: "/hr/me/evaluation", label: "Đánh giá", icon: IconTrendingUp },
    { href: "/hr/me/training", label: "Đào tạo & phát triển", icon: IconSchool },
    { href: "/hr/me/payroll", label: "Lương & phúc lợi", icon: IconWallet },
    { href: "/hr/me/documents", label: "Hợp đồng & giấy tờ", icon: IconFileText },
    { href: "/hr/me/requests", label: "Đơn từ & yêu cầu", icon: IconSend },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 font-sans flex flex-col antialiased selection:bg-[#006838] selection:text-white">
      {/* ════════════════════════════════════════════════════════════════
          1. HEADER BẢO MẬT DỮ LIỆU CÁ NHÂN
         ════════════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Nút quay lại & Tiêu đề */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/work?dept=hr")}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#006838] text-slate-600 hover:text-white border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 group"
              title="Quay lại Hub Nhân Sự – Hành Chánh"
            >
              <IconArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#006838] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <IconShieldCheck size={12} className="text-[#006838]" />
                  NHÂN SỰ CÁ NHÂN
                </span>
                <span className="text-slate-300 text-xs hidden sm:inline">•</span>
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Tra cứu thông tin cá nhân</span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                Cổng Thông Tin Nhân Sự Cá Nhân
              </h1>
            </div>
          </div>

          {/* User Badge Info */}
          {isMounted && currentUser && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-1.5 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#006838] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-emerald-200">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left min-w-0">
                <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded font-mono font-bold">
                    {currentUser.empCode}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate">
                  {getUserDisplayBadgeTitle(currentUser)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            2. HORIZONTAL NAVIGATION TABS (8 MỤC CÁ NHÂN)
           ════════════════════════════════════════════════════════════════ */}
        <div className="bg-slate-50/80 border-t border-slate-200/60 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 min-w-max py-1.5">
            {navTabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 ${
                    isActive
                      ? "bg-[#006838] text-white shadow-2xs"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <IconComp size={16} className="shrink-0" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          3. MAIN CONTENT CONTAINER
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Văn Phòng Chuỗi SKECHERS – Hệ Thống Nhân Sự Cá Nhân 2026</span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
            <IconLock size={12} /> Dữ liệu được mã hóa &amp; lọc Server-Side
          </span>
        </div>
      </footer>
    </div>
  );
}
