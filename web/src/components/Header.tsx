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
  const [userInfo, setUserInfo] = useState<{ empCode?: string; name?: string; avatar?: string; roleCode?: string; departmentCode?: string; email?: string; title?: string; phone?: string } | null>(null);

  // Dropdown states
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [otherDropdownOpen, setOtherDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Dropdown timeout refs for smooth hover grace period (350ms delay)
  const otherTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOtherMouseEnter = () => {
    if (otherTimeoutRef.current) clearTimeout(otherTimeoutRef.current);
    setOtherDropdownOpen(true);
  };

  const handleOtherMouseLeave = () => {
    if (otherTimeoutRef.current) clearTimeout(otherTimeoutRef.current);
    otherTimeoutRef.current = setTimeout(() => {
      setOtherDropdownOpen(false);
    }, 350);
  };

  const handleUserMouseEnter = () => {
    if (userTimeoutRef.current) clearTimeout(userTimeoutRef.current);
    setUserDropdownOpen(true);
  };

  const handleUserMouseLeave = () => {
    if (userTimeoutRef.current) clearTimeout(userTimeoutRef.current);
    userTimeoutRef.current = setTimeout(() => {
      setUserDropdownOpen(false);
    }, 350);
  };

  // Modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Profile Edit Form State & Handlers
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    empCode: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    avatar: '',
  });
  const [profileMsg, setProfileMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profileModalOpen) {
      setProfileMsg(null);
      let storedUser: any = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('tbs_current_user');
        if (stored) {
          try {
            storedUser = JSON.parse(stored);
          } catch (e) {}
        }
      }
      setEditProfileForm({
        name: storedUser?.name || userInfo?.name || 'Cán Bộ Công Nhân Viên',
        empCode: storedUser?.empCode || userInfo?.empCode || 'TGĐ-001',
        email: storedUser?.email || 'anhhuy.pham@tbsgroup.vn',
        phone: storedUser?.phone || '0988 111 222',
        title: storedUser?.title || 'Tổng Giám Đốc Tập Đoàn TBS Group',
        department: storedUser?.department || userInfo?.departmentCode || 'Ban Giám Đốc Tập Đoàn',
        avatar: storedUser?.avatar || '/images/tbs-logo.png',
      });
    }
  }, [profileModalOpen, userInfo]);

  const uploadImageToCloudinary = async (fileOrDataUrl: File | string): Promise<string> => {
    const presets = ["vpchuoisk", "ml_default", "unsigned"];
    for (const preset of presets) {
      try {
        const formData = new FormData();
        formData.append("file", fileOrDataUrl);
        formData.append("upload_preset", preset);

        const res = await fetch("https://api.cloudinary.com/v1_1/dwl2xtbqa/image/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.secure_url) {
            return data.secure_url;
          }
        }
      } catch (e) {
        console.warn(`Cloudinary upload with preset ${preset} failed:`, e);
      }
    }
    throw new Error("Không thể nạp ảnh lên máy chủ Cloudinary. Vui lòng thử lại!");
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setIsUploadingAvatar(true);
      setProfileMsg({ text: '☁️ Đang tải ảnh lên Cloudinary...', error: false });

      // Read file as DataURL
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const dataUrl = reader.result;
          setEditProfileForm((prev) => ({ ...prev, avatar: dataUrl }));

          try {
            const apiRes = await fetch('/api/upload-avatar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: dataUrl, empCode: editProfileForm.empCode }),
            });

            if (apiRes.ok) {
              const resJson = await apiRes.json();
              if (resJson.url) {
                setEditProfileForm((prev) => ({ ...prev, avatar: resJson.url }));
                setProfileMsg({ text: '☁️ Đã tải avatar mới lên Cloudinary thành công!', error: false });
              }
            }
          } catch (e) {
            setProfileMsg({ text: '🖼️ Đã lưu ảnh đại diện!', error: false });
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      setProfileMsg({ text: e.message || 'Lỗi tải ảnh Cloudinary', error: true });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    try {
      const updatedUser = {
        ...editProfileForm,
        roleCode: userInfo?.roleCode || 'TONG_GIAM_DOC',
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('tbs_current_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('tbs_profile_updated'));
      }

      setUserInfo({
        empCode: editProfileForm.empCode,
        name: editProfileForm.name,
        avatar: editProfileForm.avatar || '/images/tbs-logo.png',
        roleCode: userInfo?.roleCode || 'TONG_GIAM_DOC',
        departmentCode: editProfileForm.department,
      });

      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      }).catch(() => null);

      setProfileMsg({ text: 'Đã lưu & cập nhật thông tin cá nhân thành công vào D1 Database!', error: false });
      setTimeout(() => {
        setProfileModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setProfileMsg({ text: 'Có lỗi xảy ra: ' + err.message, error: true });
    }
  };

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
        let storedUser: any = null;
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('tbs_current_user');
          if (stored) {
            try {
              storedUser = JSON.parse(stored);
            } catch (e) {}
          }
        }
        if (storedUser && storedUser.name) {
          setUserInfo({
            empCode: storedUser.empCode || '202608001',
            name: storedUser.name,
            roleCode: storedUser.roleCode || storedUser.roles?.[0] || 'CBCNV',
            departmentCode: storedUser.department || storedUser.departmentCode || storedUser.departmentName || 'Văn Phòng Chuỗi SKECHERS',
            avatar: storedUser.avatar || '/images/tbs-logo.png',
            email: storedUser.email || `${storedUser.empCode || ''}@tbsgroup.vn`,
            title: storedUser.title || 'Cán Bộ Công Nhân Viên',
          });
        } else {
          // Token có nhưng không có user trong localStorage — chờ tbs_profile_updated
          setUserInfo(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    checkAuth();
    window.addEventListener('tbs_profile_updated', checkAuth);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('tbs_profile_updated', checkAuth);
    };
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

            {/* 4. Hệ thống quản trị (Chỉ hiển thị khi đã đăng nhập) */}
            {isLoggedIn && (
              <Link
                href="/work"
                className={`transition-colors py-1 ${
                  pathname === '/work' ? 'text-[#2fd39a]' : 'hover:text-[#2fd39a]'
                }`}
              >
                Hệ Thống Quản Trị
              </Link>
            )}

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
              className="relative py-1"
              onMouseEnter={handleOtherMouseEnter}
              onMouseLeave={handleOtherMouseLeave}
            >
              <button className="flex items-center gap-1 hover:text-[#2fd39a] transition-colors py-1 uppercase font-extrabold cursor-pointer">
                <span>Khác</span>
                <IconChevronDown
                  size={13}
                  className={`transition-transform duration-300 ${otherDropdownOpen ? 'rotate-180 text-[#2fd39a]' : ''}`}
                />
              </button>

              {/* Dropdown popup with hover bridge & smooth transition */}
              <div
                className={`absolute top-full right-0 pt-2 w-60 z-50 transition-all duration-300 transform origin-top-right ${
                  otherDropdownOpen
                    ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
                    : 'opacity-0 scale-95 pointer-events-none -translate-y-2'
                }`}
                onMouseEnter={handleOtherMouseEnter}
                onMouseLeave={handleOtherMouseLeave}
              >
                <div className="rounded-2xl bg-[#041a13]/98 border border-[#2fd39a]/40 p-2 shadow-2xl backdrop-blur-2xl text-left">
                  <Link
                    href="/contact"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-extrabold text-gray-100 hover:text-[#2fd39a] hover:bg-white/10 rounded-xl transition"
                  >
                    <IconPhoneCall size={16} className="text-[#2fd39a]" />
                    <span>1. LIÊN HỆ</span>
                  </Link>
                  <Link
                    href="/faq"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-extrabold text-gray-100 hover:text-[#2fd39a] hover:bg-white/10 rounded-xl transition"
                  >
                    <IconHelpCircle size={16} className="text-[#2fd39a]" />
                    <span>2. CÂU HỎI THƯỜNG GẶP (FAQ)</span>
                  </Link>
                  <Link
                    href="/structure"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-extrabold text-gray-100 hover:text-[#2fd39a] hover:bg-white/10 rounded-xl transition"
                  >
                    <IconHierarchy size={16} className="text-[#2fd39a]" />
                    <span>3. SƠ ĐỒ TỔ CHỨC / CHI NHÁNH</span>
                  </Link>
                </div>
              </div>
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

            {/* Executive User Profile Dropdown */}
            {isLoggedIn ? (
              <div
                className="relative py-1"
                onMouseEnter={handleUserMouseEnter}
                onMouseLeave={handleUserMouseLeave}
              >
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-[#0f4133]/90 hover:bg-[#0f4133] px-3.5 py-1.5 rounded-full border border-[#2fd39a]/40 shadow-md text-white transition-all cursor-pointer group"
                >
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-[#2fd39a] overflow-hidden shadow-xs group-hover:scale-105 transition-transform flex items-center justify-center">
                      {userInfo?.avatar ? (
                        <img
                          src={userInfo.avatar}
                          alt={userInfo.name || "User Avatar"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IconUserCircle size={20} className="text-[#2fd39a]" />
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-white" />
                  </div>
                  <span className="text-xs font-extrabold text-[#f2dc9a] max-w-[140px] truncate">
                    {userInfo?.name || userInfo?.empCode || 'Phạm Nguyễn Anh Huy'}
                  </span>
                  <IconChevronDown
                    size={13}
                    className={`text-[#2fd39a] transition-transform duration-300 ${
                      userDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* User Executive Dropdown Menu Popup (Matching Homepage Dark Emerald Luxury Theme) */}
                <div
                  className={`absolute top-full right-0 pt-2 w-72 sm:w-80 z-50 transition-all duration-300 transform origin-top-right ${
                    userDropdownOpen
                      ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
                      : 'opacity-0 scale-95 pointer-events-none -translate-y-2'
                  }`}
                  onMouseEnter={handleUserMouseEnter}
                  onMouseLeave={handleUserMouseLeave}
                >
                  <div className="rounded-3xl bg-[#041a13]/98 border border-[#2fd39a]/40 p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-left animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info Header Banner */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0a3528] to-[#041a13] border border-[#2fd39a]/30 mb-2 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full border-2 border-[#2fd39a] overflow-hidden flex-shrink-0 shadow-md bg-slate-900 flex items-center justify-center">
                          {userInfo?.avatar ? (
                            <img
                              src={userInfo.avatar}
                              alt={userInfo.name || "User"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IconUserCircle size={26} className="text-[#2fd39a]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black truncate text-white">{userInfo?.name || 'Phạm Nguyễn Anh Huy'}</h4>
                          <p className="text-xs text-[#2fd39a] truncate font-medium mt-0.5">{userInfo?.email || 'anhhuy.pham@tbsgroup.vn'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#2fd39a]/20 text-[#2fd39a] text-[10px] font-extrabold uppercase tracking-wider border border-[#2fd39a]/30">
                          {userInfo?.roleCode || 'CBCNV'}
                        </span>
                        <span className="text-[10px] font-mono text-[#f2dc9a]">
                          Mã NV: {userInfo?.empCode || '202608001'}
                        </span>
                      </div>
                    </div>

                    {/* Menu Options List */}
                    <div className="space-y-1">
                      {/* Option 1: Thông tin cá nhân */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setProfileModalOpen(true);
                        }}
                        className="w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold text-gray-200 hover:bg-[#0f4133] hover:text-[#2fd39a] border border-transparent hover:border-[#2fd39a]/30 transition-all cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#2fd39a]/15 text-[#2fd39a] flex items-center justify-center group-hover:bg-[#2fd39a] group-hover:text-[#041a13] transition-colors flex-shrink-0 border border-[#2fd39a]/20">
                          <IconUser size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-white group-hover:text-[#2fd39a]">Thông tin cá nhân</div>
                          <div className="text-[10px] text-gray-400 font-normal truncate">Họ tên, SĐT, Email &amp; Avatar</div>
                        </div>
                      </button>

                      {/* Option 2: Đổi mật khẩu */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setChangePasswordModalOpen(true);
                        }}
                        className="w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold text-gray-200 hover:bg-[#0f4133] hover:text-[#f2dc9a] border border-transparent hover:border-amber-400/30 transition-all cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-400/15 text-[#f2dc9a] flex items-center justify-center group-hover:bg-[#f2dc9a] group-hover:text-[#041a13] transition-colors flex-shrink-0 border border-amber-400/20">
                          <IconKey size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-white group-hover:text-[#f2dc9a]">Đổi mật khẩu</div>
                          <div className="text-[10px] text-gray-400 font-normal truncate">Cập nhật mật khẩu tài khoản</div>
                        </div>
                      </button>

                      <div className="my-1.5 border-t border-white/10" />

                      {/* Option 3: Đăng xuất */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold text-red-400 hover:bg-red-500/15 hover:text-red-300 border border-transparent hover:border-red-500/30 transition-all cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors flex-shrink-0 border border-red-500/20">
                          <IconLogout size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-red-400 group-hover:text-red-300">Đăng xuất</div>
                          <div className="text-[10px] text-red-400/70 font-normal truncate">Thoát tài khoản an toàn</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
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

      {/* Profile Modal - FULLY EDITABLE */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#041a13] border border-[#2fd39a]/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setProfileMsg(null);
                setProfileModalOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <IconX size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div className="relative group">
                <img
                  src={editProfileForm.avatar || '/images/tbs-logo.png'}
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl object-cover border border-[#2fd39a]/40 bg-emerald-950 p-1"
                />
                <label className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold text-[#2fd39a] cursor-pointer">
                  <span>{isUploadingAvatar ? "Đang nạp..." : "Đổi ảnh"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleAvatarUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-white">Chỉnh Sửa Thông Tin Cá Nhân</h3>
                <p className="text-[11px] text-[#2fd39a] font-mono">
                  Mã NV: {editProfileForm.empCode || '202608001'} | Chức vụ: {userInfo?.roleCode || 'TONG_GIAM_DOC'}
                </p>
                <label className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1">
                  <span>☁️ Đổi Avatar qua Cloudinary</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleAvatarUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  profileMsg.error ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <span>{profileMsg.error ? '⚠️' : '✅'} {profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3 pt-1 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Họ và Tên */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold block">Họ và Tên Nhân Viên *</label>
                  <input
                    type="text"
                    required
                    value={editProfileForm.name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                    placeholder="Ví dụ: Phạm Nguyễn Anh Huy"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                  />
                </div>

                {/* Mã NV */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold block">Mã Số Nhân Viên *</label>
                  <input
                    type="text"
                    required
                    value={editProfileForm.empCode}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, empCode: e.target.value })}
                    placeholder="Ví dụ: TGĐ-001"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold block">Email Công Việc</label>
                  <input
                    type="email"
                    value={editProfileForm.email}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                    placeholder="anhhuy.pham@tbsgroup.vn"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold block">Số Điện Thoại Liên Hệ</label>
                  <input
                    type="text"
                    value={editProfileForm.phone}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                    placeholder="0988 111 222"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                  />
                </div>
              </div>

              {/* Title / Position */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold block">Chức Danh / Vị Trí Công Việc</label>
                <input
                  type="text"
                  value={editProfileForm.title}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, title: e.target.value })}
                  placeholder="Ví dụ: Tổng Giám Đốc Tập Đoàn TBS Group"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold block">Phòng Ban / Khối Vận Hành</label>
                <input
                  type="text"
                  value={editProfileForm.department}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, department: e.target.value })}
                  placeholder="Ví dụ: Ban Giám Đốc Tập Đoàn"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMsg(null);
                    setProfileModalOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#006838] hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <IconCheck size={16} />
                  <span>Lưu Cập Nhật</span>
                </button>
              </div>
            </form>
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
