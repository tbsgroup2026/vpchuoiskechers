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
  IconUserCircle,
  IconUser,
  IconKey,
  IconLock,
  IconShieldCheck,
  IconBuildingStore,
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
  const [userInfo, setUserInfo] = useState<{ empCode?: string; name?: string; roleCode?: string; departmentCode?: string } | null>(null);

  // Dropdown states
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [otherDropdownOpen, setOtherDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; error: boolean } | null>(null);

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
        setUserDropdownOpen(false);
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
            setUserInfo({
              empCode: decoded.empCode || '202608001',
              name: decoded.name || 'Phạm Nguyễn Anh Huy',
              roleCode: decoded.roleCode || 'SUPER_ADMIN',
              departmentCode: decoded.departmentCode || 'KE_HOACH_CBVT',
            });
          }
        } catch {
          setUserInfo({
            empCode: '202608001',
            name: 'Phạm Nguyễn Anh Huy',
            roleCode: 'SUPER_ADMIN',
            departmentCode: 'KE_HOACH_CBVT',
          });
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
    setUserDropdownOpen(false);
    router.push('/');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (!oldPassword) {
      setPwdMsg({ text: 'Vui lòng nhập mật khẩu hiện tại', error: true });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'Mật khẩu xác nhận không khớp với mật khẩu mới', error: true });
      return;
    }

    setPwdMsg({ text: 'Đã cập nhật mật khẩu thành công!', error: false });
    setTimeout(() => {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwdMsg(null);
      setChangePasswordModalOpen(false);
    }, 1500);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-3 transition-all duration-500 pointer-events-none ${
          hidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div
          className={`max-w-[1280px] mx-auto pointer-events-auto transition-all duration-500 rounded-full px-6 py-2.5 flex items-center justify-between border ${
            scrolled
              ? 'bg-[#041a13]/98 border-[#2fd39a]/40 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl'
              : 'bg-[#041a13]/90 border-[#2fd39a]/30 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Brand Logo - Standalone TBS Group Logo matching Image 1 */}
          <Link href="/" className="flex items-center group py-0.5">
            <img
              src="/images/tbs-logo.png"
              alt="TBS Group Logo"
              className="h-7 sm:h-8 w-auto object-contain brightness-0 invert group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Desktop Navigation Links — Exact Image 1 Layout & Navigation Items */}
          <nav className="hidden xl:flex items-center gap-6 text-[11px] font-extrabold text-white uppercase tracking-wider">
            {/* 1. Trang chủ */}
            <Link
              href="/"
              className={`transition-colors py-1 ${
                pathname === '/' ? 'text-[#2fd39a]' : 'hover:text-[#2fd39a]'
              }`}
            >
              Trang Chủ
            </Link>

            {/* 2. TBS Group (Gôm Ngành Trụ Cột & Về TBS) */}
            <Link
              href="/ve-tbs"
              className={`transition-colors py-1 ${
                pathname === '/ve-tbs' || pathname === '/about' ? 'text-[#2fd39a]' : 'hover:text-[#2fd39a]'
              }`}
            >
              TBS Group
            </Link>

            {/* 4. Tuyển dụng */}
            <Link
              href="/careers"
              className={`transition-colors py-1 ${
                pathname?.startsWith('/careers') ? 'text-[#2fd39a]' : 'hover:text-[#2fd39a]'
              }`}
            >
              Tuyển Dụng
            </Link>

            {/* 5. Hệ thống quản trị */}
            <Link
              href="/work"
              className={`transition-colors py-1 ${
                pathname === '/work' ? 'text-[#2fd39a]' : 'hover:text-[#2fd39a]'
              }`}
            >
              Hệ Thống Quản Trị
            </Link>

            {/* 6. Tin tức */}
            <Link
              href="/news"
              className={`transition-colors py-1 ${
                pathname?.startsWith('/news') ? 'text-[#2fd39a]' : 'hover:text-[#2fd39a]'
              }`}
            >
              Tin Tức
            </Link>

            {/* 7. Khác Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOtherDropdownOpen(true)}
              onMouseLeave={() => setOtherDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 hover:text-[#2fd39a] transition-colors py-1 uppercase font-extrabold">
                <span>Khác</span>
                <IconChevronDown
                  size={13}
                  className={`transition-transform ${otherDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {otherDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl bg-[#041a13]/95 border border-[#2fd39a]/30 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                  <Link
                    href="/contact"
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-[#2fd39a] hover:bg-white/5 rounded-xl transition"
                  >
                    <IconPhoneCall size={15} className="text-[#2fd39a]" />
                    <span>1. Liên hệ</span>
                  </Link>
                  <Link
                    href="/faq"
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-[#2fd39a] hover:bg-white/5 rounded-xl transition"
                  >
                    <IconHelpCircle size={15} className="text-[#2fd39a]" />
                    <span>2. Câu hỏi thường gặp (FAQ)</span>
                  </Link>
                  <Link
                    href="/structure"
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-[#2fd39a] hover:bg-white/5 rounded-xl transition"
                  >
                    <IconHierarchy size={15} className="text-[#2fd39a]" />
                    <span>3. Sơ đồ tổ chức / Chi nhánh</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Section (Notification Bell + Executive User Dropdown / Gold CTA) */}
          <div className="hidden xl:flex items-center gap-3">
            {/* Notification Bell — ONLY VISIBLE WHEN LOGGED IN */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                  aria-label="Thông báo"
                >
                  <IconBell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div className="absolute top-full right-0 mt-3 w-80 rounded-3xl bg-[#041a13]/98 border border-[#2fd39a]/30 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
                      <div className="flex items-center gap-2">
                        <IconBell size={16} className="text-[#2fd39a]" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Thông Báo Vận Hành</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-[#2fd39a] hover:underline"
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
                              ? 'bg-white/[0.02] border-white/5 opacity-70'
                              : 'bg-[#0f4133]/50 border-[#2fd39a]/30'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-[#f2dc9a] font-normal">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-300 mt-1 leading-snug">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Executive User Profile Dropdown (Replaces static pill button) */}
            {isLoggedIn ? (
              <div
                className="relative"
                onMouseEnter={() => setUserDropdownOpen(true)}
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-[#0f4133]/90 hover:bg-[#0f4133] px-3.5 py-1.5 rounded-full border border-[#2fd39a]/40 shadow-md text-white transition-all cursor-pointer group"
                >
                  {/* Clean User Avatar Silhouette Icon */}
                  <div className="w-6 h-6 rounded-full bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center font-bold">
                    <IconUserCircle size={18} />
                  </div>
                  <span className="text-xs font-extrabold text-[#f2dc9a] max-w-[140px] truncate">
                    {userInfo?.name || userInfo?.empCode || 'CBCNV SKECHERS'}
                  </span>
                  <IconChevronDown
                    size={13}
                    className={`text-[#2fd39a] transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* User Executive Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl bg-[#041a13]/98 border border-[#2fd39a]/40 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200 text-left z-50">
                    {/* Header info inside dropdown */}
                    <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                      <div className="text-xs font-extrabold text-white truncate">
                        {userInfo?.name || 'Phạm Nguyễn Anh Huy'}
                      </div>
                      <div className="text-[10px] text-[#2fd39a] font-mono mt-0.5">
                        Mã NV: {userInfo?.empCode || '202608001'} ({userInfo?.roleCode || 'SUPER_ADMIN'})
                      </div>
                    </div>

                    {/* Item 1: Thông tin cá nhân */}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-[#2fd39a] hover:bg-white/5 rounded-xl transition text-left cursor-pointer"
                    >
                      <IconUser size={15} className="text-[#2fd39a]" />
                      <span>Thông tin cá nhân</span>
                    </button>

                    {/* Item 2: Đổi mật khẩu */}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setChangePasswordModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-[#2fd39a] hover:bg-white/5 rounded-xl transition text-left cursor-pointer"
                    >
                      <IconKey size={15} className="text-[#2fd39a]" />
                      <span>Đổi mật khẩu</span>
                    </button>

                    <div className="my-1 border-t border-white/10" />

                    {/* Item 3: Đăng xuất */}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition text-left cursor-pointer"
                    >
                      <IconLogout size={15} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#f2dc9a] via-[#e2c77d] to-[#f2dc9a] text-[#08221a] font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all duration-200 border border-[#f2dc9a]/50"
              >
                <span>Đăng Nhập</span>
                <div className="w-5 h-5 rounded-full bg-[#08221a]/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200">
                  <IconArrowRight size={12} className="text-[#08221a]" />
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
          <div className="xl:hidden fixed inset-x-4 top-20 p-6 rounded-3xl bg-[#041a13]/98 border border-[#2fd39a]/30 backdrop-blur-2xl shadow-2xl shadow-emerald-950/90 pointer-events-auto space-y-3 text-center animate-in fade-in slide-in-from-top-4 duration-300">
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
              TBS Group
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
                href="/work"
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
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-900/60 text-[#2fd39a] font-bold text-xs border border-[#2fd39a]/30 flex items-center justify-center gap-2"
                  >
                    <IconUser size={15} />
                    <span>Thông Tin Cá Nhân</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setChangePasswordModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <IconKey size={15} />
                    <span>Đổi Mật Khẩu</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-xs"
                  >
                    <IconLogout size={16} />
                    Đăng Xuất ({userInfo?.empCode || 'CBCNV'})
                  </button>
                </div>
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

      {/* Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#041a13] border border-[#2fd39a]/40 rounded-3xl p-6 text-white space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setProfileModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <IconX size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-[#2fd39a] border border-[#2fd39a]/30 flex items-center justify-center">
                <IconUserCircle size={36} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {userInfo?.name || 'Phạm Nguyễn Anh Huy'}
                </h3>
                <span className="text-xs text-[#2fd39a] font-mono font-bold">
                  Mã NV: {userInfo?.empCode || '202608001'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Chức vụ / Vai trò:</span>
                <span className="font-mono font-bold text-amber-300">{userInfo?.roleCode || 'SUPER_ADMIN'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Phòng ban vận hành:</span>
                <span className="font-semibold text-white">{userInfo?.departmentCode || 'KE_HOACH_CBVT'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Đơn vị quản lý:</span>
                <span className="font-semibold text-emerald-300">Văn Phòng Chuỗi SKECHERS - TBS Group</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Trạng thái tài khoản:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Đang hoạt động (Security Level 4)
                </span>
              </div>
            </div>

            <button
              onClick={() => setProfileModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#041a13] border border-[#2fd39a]/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setPwdMsg(null);
                setChangePasswordModalOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <IconX size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 text-[#2fd39a] border border-[#2fd39a]/30 flex items-center justify-center">
                <IconKey size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Đổi Mật Khẩu Tài Khoản</h3>
                <p className="text-[11px] text-slate-400">Cập nhật mật khẩu bảo mật hệ thống TBS Group</p>
              </div>
            </div>

            {pwdMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  pwdMsg.error ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <span>{pwdMsg.error ? '⚠️' : '✅'} {pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới ít nhất 6 ký tự"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#006838] hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-950/40"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
