"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  IconArrowRight,
  IconMenu2,
  IconX,
  IconLogout,
  IconUserCheck,
  IconChevronDown,
  IconBell,
  IconBuildingFactory,
  IconHelpCircle,
  IconPhoneCall,
  IconHierarchy,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'gemba' | 'ci' | 'kaizen' | 'permission';
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<{ empCode?: string; name?: string } | null>(null);

  // Dropdown states
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [otherDropdownOpen, setOtherDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Sample real-time notifications from D1
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: "Gemba Walk mới",
      message: "Có sự cố dừng máy Line 2 — Xưởng 1 vừa tạo",
      time: "5 phút trước",
      isRead: false,
      type: "gemba",
    },
    {
      id: 2,
      title: "Cải tiến CI cần duyệt",
      message: "Ý tưởng tối ưu khuôn ép keo E5 vừa đăng ký",
      time: "15 phút trước",
      isRead: false,
      type: "ci",
    },
    {
      id: 3,
      title: "Kaizen AI phát hiện",
      message: "Đã kiểm tra trùng lặp AI cho Kaizen KZ-2026-08",
      time: "1 giờ trước",
      isRead: true,
      type: "kaizen",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);

      if (currentY > lastScrollY.current && currentY > 80) {
        setHidden(true);
        setMobileOpen(false);
        setAboutDropdownOpen(false);
        setOtherDropdownOpen(false);
        setNotifOpen(false);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll);

    const checkAuth = () => {
      const cookies = document.cookie.split('; ');
      const tokenCookie = cookies.find((row) => row.startsWith('tbs_token='));
      const token = tokenCookie ? tokenCookie.split('=')[1] : null;

      if (token) {
        setIsLoggedIn(true);
        try {
          const payloadBase64 = token.split('.')[1];
          if (payloadBase64) {
            const decoded = JSON.parse(atob(payloadBase64));
            setUserInfo({ empCode: decoded.empCode, name: decoded.name });
          }
        } catch {
          setUserInfo({ name: 'CBCNV SKECHERS - TBS Group' });
        }
      } else {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    checkAuth();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = 'tbs_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsLoggedIn(false);
    setUserInfo(null);
    setMobileOpen(false);
    router.push('/');
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-3 transition-all duration-500 pointer-events-none ${
        hidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div
        className={`max-w-[1400px] mx-auto pointer-events-auto transition-all duration-500 rounded-full px-6 py-3 flex items-center justify-between border ${
          scrolled
            ? 'bg-white/95 border-slate-200 shadow-xl shadow-slate-900/5 backdrop-blur-2xl py-2.5'
            : 'bg-white/90 border-slate-200/80 backdrop-blur-xl shadow-md'
        }`}
      >
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#006838] to-[#004d28] p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <span className="text-[#006838] font-extrabold text-sm font-mono tracking-tighter">SKS</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase group-hover:text-[#006838] transition-colors">
              SKECHERS
            </span>
            <span className="text-[10px] text-[#006838] font-extrabold tracking-wider uppercase">
              Văn Phòng Chuỗi - TBS Group
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links — Exact 7 Items */}
        <nav className="hidden xl:flex items-center gap-6 text-xs font-bold text-slate-700 uppercase tracking-widest">
          {/* 1. Trang chủ */}
          <Link href="/" className="hover:text-[#006838] transition-colors py-1">
            Trang Chủ
          </Link>

          {/* 2. Về TBS Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setAboutDropdownOpen(true)}
            onMouseLeave={() => setAboutDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-[#006838] transition-colors py-1 uppercase font-bold">
              <span>Về TBS</span>
              <IconChevronDown size={14} className={`transition-transform ${aboutDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {aboutDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                <Link
                  href="/ve-tbs"
                  className="block px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#006838] hover:bg-emerald-50 rounded-xl transition"
                >
                  Giới thiệu chung SKECHERS
                </Link>
                <Link
                  href="/ve-tbs#mission"
                  className="block px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#006838] hover:bg-emerald-50 rounded-xl transition"
                >
                  Sứ mệnh & Tầm nhìn
                </Link>
                <Link
                  href="/ve-tbs#history"
                  className="block px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#006838] hover:bg-emerald-50 rounded-xl transition"
                >
                  Lịch sử phát triển TBS Group
                </Link>
              </div>
            )}
          </div>

          {/* 3. Tuyển dụng */}
          <Link href="/careers" className="hover:text-[#006838] transition-colors py-1">
            Tuyển Dụng
          </Link>

          {/* 4. Hệ thống quản trị — ONLY VISIBLE WHEN LOGGED IN */}
          {isLoggedIn && (
            <Link
              href="/dashboard"
              className="text-[#006838] hover:text-[#004d28] font-extrabold transition-colors py-1 flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#006838] animate-ping" />
              Hệ Thống Quản Trị
            </Link>
          )}

          {/* 5. Tin tức */}
          <Link href="/news" className="hover:text-[#006838] transition-colors py-1">
            Tin Tức
          </Link>

          {/* 6. Khác Dropdown — Exactly 3 Sub-items */}
          <div
            className="relative"
            onMouseEnter={() => setOtherDropdownOpen(true)}
            onMouseLeave={() => setOtherDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-[#006838] transition-colors py-1 uppercase font-bold">
              <span>Khác</span>
              <IconChevronDown size={14} className={`transition-transform ${otherDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {otherDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                <Link
                  href="/contact"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#006838] hover:bg-emerald-50 rounded-xl transition"
                >
                  <IconPhoneCall size={16} className="text-[#006838]" />
                  <span>1. Liên hệ</span>
                </Link>
                <Link
                  href="/faq"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#006838] hover:bg-emerald-50 rounded-xl transition"
                >
                  <IconHelpCircle size={16} className="text-[#006838]" />
                  <span>2. Câu hỏi thường gặp (FAQ)</span>
                </Link>
                <Link
                  href="/structure"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#006838] hover:bg-emerald-50 rounded-xl transition"
                >
                  <IconHierarchy size={16} className="text-[#006838]" />
                  <span>3. Sơ đồ tổ chức / Chi nhánh</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Section (Notification Bell + Login/Profile CTA) */}
        <div className="hidden xl:flex items-center gap-3">
          {/* Notification Bell — ONLY VISIBLE WHEN LOGGED IN */}
          {isLoggedIn && (
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-200"
                aria-label="Thông báo"
              >
                <IconBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 rounded-3xl bg-white border border-slate-200 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                    <div className="flex items-center gap-2">
                      <IconBell size={16} className="text-[#006838]" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Thông Báo Vận Hành</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-[#006838] hover:underline"
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          n.isRead
                            ? 'bg-slate-50 border-slate-100 opacity-70'
                            : 'bg-emerald-50/70 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-emerald-800 font-medium">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. Đăng Nhập CTA / Profile Logout */}
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#006838] flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                <IconUserCheck size={15} className="text-[#006838]" />
                {userInfo?.empCode || userInfo?.name || 'CBCNV SKECHERS'}
              </span>
              <button
                onClick={handleLogout}
                className="group relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-bold text-xs hover:bg-red-100 active:scale-95 transition-all duration-200"
              >
                <IconLogout size={14} />
                <span>Đăng Xuất</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#006838] hover:bg-[#00542d] text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all duration-200"
            >
              <span>Đăng Nhập</span>
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200">
                <IconArrowRight size={12} className="text-white" />
              </div>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="xl:hidden w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition active:scale-95"
          aria-label="Toggle Mobile Navigation"
        >
          {mobileOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="xl:hidden fixed inset-x-4 top-20 p-6 rounded-3xl bg-[#08221a]/98 border border-[#2fd39a]/30 backdrop-blur-2xl shadow-2xl shadow-emerald-950/90 pointer-events-auto space-y-3 text-center animate-in fade-in slide-in-from-top-4 duration-300">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 text-sm font-bold text-white hover:text-[#2fd39a] border-b border-white/10"
          >
            Trang Chủ
          </Link>
          <Link
            href="/ve-tbs"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 text-sm font-bold text-white hover:text-[#2fd39a] border-b border-white/10"
          >
            Về TBS Group
          </Link>
          <Link
            href="/careers"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 text-sm font-bold text-white hover:text-[#2fd39a] border-b border-white/10"
          >
            Tuyển Dụng
          </Link>

          {isLoggedIn && (
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm font-extrabold text-[#2fd39a] border-b border-white/10 bg-[#2fd39a]/10 rounded-xl"
            >
              Hệ Thống Quản Trị
            </Link>
          )}

          <Link
            href="/news"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 text-sm font-bold text-white hover:text-[#2fd39a] border-b border-white/10"
          >
            Tin Tức
          </Link>

          <div className="space-y-1.5 py-2 text-left bg-white/[0.03] p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-[#f2dc9a] uppercase tracking-widest block mb-1">Mục Khác</span>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="block text-xs font-semibold text-gray-200 py-1 hover:text-[#2fd39a]">
              1. Liên hệ
            </Link>
            <Link href="/faq" onClick={() => setMobileOpen(false)} className="block text-xs font-semibold text-gray-200 py-1 hover:text-[#2fd39a]">
              2. Câu hỏi thường gặp (FAQ)
            </Link>
            <Link href="/structure" onClick={() => setMobileOpen(false)} className="block text-xs font-semibold text-gray-200 py-1 hover:text-[#2fd39a]">
              3. Sơ đồ tổ chức / Chi nhánh
            </Link>
          </div>

          <div className="pt-2">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-sm"
              >
                <IconLogout size={16} />
                Đăng Xuất ({userInfo?.empCode || 'CBCNV'})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-gradient-to-r from-[#2fd39a] to-[#f2dc9a] text-[#08221a] font-extrabold text-sm uppercase shadow-xl"
              >
                Đăng Nhập Hệ Thống
                <IconArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
