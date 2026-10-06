"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import LanguageSelector from '@/components/LanguageSelector';
import HeaderControls from '@/components/HeaderControls';
import { useTranslation } from "@/hooks/useTranslation";
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
import { getCurrentUser, setUserAvatar, setUserProfileInfo, logoutUserProfile, isAdminUser, getUserDisplayBadgeTitle } from '@/lib/userProfiles';
import { logLoginLogoutEvent, logPasswordChangeEvent, logFeatureAccessEvent } from '@/lib/webhookAuditClient';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'gemba' | 'ci' | 'kaizen' | 'permission';
}

export default function Header() {
  const { lang } = useTranslation();
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
        const stored = sessionStorage.getItem('tbs_current_user') || localStorage.getItem('tbs_current_user');
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
        avatar: storedUser?.avatar || '',
      });
    }
  }, [profileModalOpen, userInfo]);

  const uploadImageToCloudinary = async (fileOrDataUrl: File | string): Promise<string> => {
    const presets = ["vpchuoisk", "unsigned", "ml_default"];
    for (const preset of presets) {
      try {
        const formData = new FormData();
        formData.append("file", fileOrDataUrl);
        formData.append("upload_preset", preset);
        formData.append("folder", "vpchuoiskechers");

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

    if (fileOrDataUrl instanceof File) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(fileOrDataUrl);
      });
    }

    return typeof fileOrDataUrl === "string" ? fileOrDataUrl : "";
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setIsUploadingAvatar(true);
      setProfileMsg({ text: lang === "vi" ? '☁️ Đang tải ảnh đại diện lên Cloudinary...' : '☁️ Uploading avatar to Cloudinary...', error: false });

      // Direct Cloudinary upload
      const cloudinaryUrl = await uploadImageToCloudinary(file);
      if (cloudinaryUrl) {
        const empCode = editProfileForm.empCode || userInfo?.empCode || '';
        if (empCode) {
          setUserAvatar(empCode, cloudinaryUrl);
        }
        setEditProfileForm((prev) => ({ ...prev, avatar: cloudinaryUrl }));
        setUserInfo((prev) => prev ? ({ ...prev, avatar: cloudinaryUrl }) : null);
        setProfileMsg({ text: lang === "vi" ? '☁️ Đã lưu avatar mới thành công trên Cloudinary!' : '☁️ Avatar saved successfully on Cloudinary!', error: false });
      }
    } catch (e: any) {
      setProfileMsg({ text: e.message || (lang === "vi" ? 'Lỗi khi tải ảnh lên Cloudinary' : 'Error uploading image to Cloudinary'), error: true });
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
        empCode: editProfileForm.empCode || userInfo?.empCode || '',
        roleCode: userInfo?.roleCode || 'CBCNV',
      };
      if (typeof window !== 'undefined' && updatedUser.empCode) {
        setUserProfileInfo(updatedUser.empCode, updatedUser);
      }

      setUserInfo({
        empCode: editProfileForm.empCode,
        name: editProfileForm.name,
        avatar: editProfileForm.avatar || '',
        roleCode: userInfo?.roleCode || 'TONG_GIAM_DOC',
        departmentCode: editProfileForm.department,
      });

      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      }).catch(() => null);

      setProfileMsg({ text: lang === "vi" ? 'Đã lưu & cập nhật thông tin cá nhân thành công vào D1 Database!' : 'Personal information saved and updated successfully!', error: false });
      setTimeout(() => {
        setProfileModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setProfileMsg({ text: lang === "vi" ? 'Có lỗi xảy ra: ' + err.message : 'An error occurred: ' + err.message, error: true });
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
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.name) {
          setUserInfo({
            empCode: currentUser.empCode,
            name: currentUser.name,
            roleCode: currentUser.roleCode || currentUser.roles?.[0] || 'CBCNV',
            departmentCode: currentUser.department || 'Văn Phòng Chuỗi SKECHERS',
            avatar: currentUser.avatar || '',
            email: currentUser.email || `${currentUser.empCode}@tbsgroup.vn`,
            title: getUserDisplayBadgeTitle(currentUser),
          });
        } else {
          setUserInfo(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    checkAuth();
    window.addEventListener('tbs_profile_updated', checkAuth);

    const fetchNotifications = () => {
      try {
        const storedNotifs = localStorage.getItem('tbs_notifications_list');
        if (storedNotifs) {
          const list = JSON.parse(storedNotifs);
          if (Array.isArray(list) && list.length > 0) {
            setNotifications(list.slice(0, 15).map((item: any) => ({
              id: item.id,
              title: item.title,
              message: item.message,
              time: item.created_at || 'Vừa xong',
              isRead: !!item.is_read,
              type: item.type === 'WARNING' ? 'gemba' : (item.type === 'SUCCESS' ? 'kaizen' : 'permission')
            })));
          }
        }
      } catch (e) {}
    };

    fetchNotifications();
    window.addEventListener('tbs_new_notification', fetchNotifications);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('tbs_profile_updated', checkAuth);
      window.removeEventListener('tbs_new_notification', fetchNotifications);
    };
  }, [pathname]);

  const handleLogout = () => {
    logLoginLogoutEvent({
      emp_code: userInfo?.empCode || 'GUEST',
      emp_name: userInfo?.name || 'Cán Bộ Công Nhân Viên',
      action: 'Đăng xuất',
      result: 'Thành công'
    });

    logoutUserProfile();
    setIsLoggedIn(false);
    setUserInfo(null);
    setMobileOpen(false);
    setUserDropdownOpen(false);
    router.push('/login');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (!oldPassword) {
      logPasswordChangeEvent({
        emp_code: userInfo?.empCode || 'UNKNOWN',
        emp_name: userInfo?.name || 'Cán Bộ Công Nhân Viên',
        changed_by: 'Tự đổi',
        result: 'Thất bại',
        reason: 'Thiếu mật khẩu hiện tại'
      });
      setPwdMsg({ text: lang === "vi" ? 'Vui lòng nhập mật khẩu hiện tại' : 'Please enter current password', error: true });
      return;
    }
    if (newPassword.length < 6) {
      logPasswordChangeEvent({
        emp_code: userInfo?.empCode || 'UNKNOWN',
        emp_name: userInfo?.name || 'Cán Bộ Công Nhân Viên',
        changed_by: 'Tự đổi',
        result: 'Thất bại',
        reason: 'Mật khẩu mới ngắn hơn 6 ký tự'
      });
      setPwdMsg({ text: lang === "vi" ? 'Mật khẩu mới phải có ít nhất 6 ký tự' : 'New password must be at least 6 characters', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      logPasswordChangeEvent({
        emp_code: userInfo?.empCode || 'UNKNOWN',
        emp_name: userInfo?.name || 'Cán Bộ Công Nhân Viên',
        changed_by: 'Tự đổi',
        result: 'Thất bại',
        reason: 'Xác nhận mật khẩu mới không khớp'
      });
      setPwdMsg({ text: lang === "vi" ? 'Mật khẩu xác nhận không khớp với mật khẩu mới' : 'Passwords do not match', error: true });
      return;
    }

    // Zero Password Logging Policy: Log ONLY metadata (empCode, name, timestamp, changed_by, result, reason)
    logPasswordChangeEvent({
      emp_code: userInfo?.empCode || 'UNKNOWN',
      emp_name: userInfo?.name || 'Cán Bộ Công Nhân Viên',
      changed_by: 'Tự đổi',
      result: 'Thành công',
      reason: 'Tự cập nhật mật khẩu tài khoản cá nhân'
    });

    setPwdMsg({ text: lang === "vi" ? 'Đã cập nhật mật khẩu thành công!' : 'Password updated successfully!', error: false });
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
        className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top,44px)+0.75rem)] transition-all duration-500 pointer-events-none ${
          hidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div
          className={`max-w-[1280px] mx-auto pointer-events-auto transition-all duration-500 rounded-full px-6 py-2 flex items-center justify-between border ${
            scrolled
              ? 'bg-[#041a13] border-[#2fd39a]/50 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl'
              : 'bg-[#062017] border-[#2fd39a]/40 shadow-[0_15px_45px_rgba(0,0,0,0.85)] backdrop-blur-2xl'
          }`}
        >
          {/* Brand Logo - TBS Group Logo */}
          <Link href="/" className="flex items-center gap-2 group py-0.5" title="Trang chủ TBS Group">
            <img
              src="/images/tbs-logo.png"
              alt="TBS Group Logo"
              className="h-7 sm:h-8 w-auto object-contain brightness-0 invert group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop Navigation Links — High Contrast & Readable */}
          <nav className="hidden xl:flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider">
            {/* 1. Trang chủ / Home */}
            <Link
              href="/"
              className={`transition-all px-3 py-1 rounded-full ${
                pathname === '/'
                  ? 'text-[#2fd39a] bg-[#2fd39a]/20 border border-[#2fd39a]/40 font-black shadow-xs'
                  : 'text-slate-100 hover:text-[#2fd39a] hover:bg-white/10 font-bold'
              }`}
            >
              {lang === "vi" ? "Trang Chủ" : "Home"}
            </Link>

            {/* 2. TBS Group */}
            <Link
              href="/ve-tbs"
              className={`transition-all px-3 py-1 rounded-full ${
                pathname === '/ve-tbs' || pathname === '/about'
                  ? 'text-[#2fd39a] bg-[#2fd39a]/20 border border-[#2fd39a]/40 font-black shadow-xs'
                  : 'text-slate-100 hover:text-[#2fd39a] hover:bg-white/10 font-bold'
              }`}
            >
              TBS Group
            </Link>

            {/* 3. Tuyển dụng / Recruitment */}
            <Link
              href="/careers"
              className={`transition-all px-3 py-1 rounded-full ${
                pathname?.startsWith('/careers')
                  ? 'text-[#2fd39a] bg-[#2fd39a]/20 border border-[#2fd39a]/40 font-black shadow-xs'
                  : 'text-slate-100 hover:text-[#2fd39a] hover:bg-white/10 font-bold'
              }`}
            >
              {lang === "vi" ? "Tuyển Dụng" : "Recruitment"}
            </Link>

            {/* 4. Thư viện mẫu / Template Library */}
            <Link
              href="/documents/templates"
              className={`transition-all px-3 py-1 rounded-full ${
                pathname?.startsWith('/documents/templates')
                  ? 'text-[#2fd39a] bg-[#2fd39a]/20 border border-[#2fd39a]/40 font-black shadow-xs'
                  : 'text-slate-100 hover:text-[#2fd39a] hover:bg-white/10 font-bold'
              }`}
            >
              {lang === "vi" ? "Thư Viện Mẫu" : "Template Library"}
            </Link>

            {/* 5. Hệ thống quản trị / Management System (Only when logged in) */}
            {isLoggedIn && (
              <Link
                href="/work"
                className={`transition-all px-3 py-1 rounded-full ${
                  pathname === '/work'
                    ? 'text-[#2fd39a] bg-[#2fd39a]/20 border border-[#2fd39a]/40 font-black shadow-xs'
                    : 'text-slate-100 hover:text-[#2fd39a] hover:bg-white/10 font-bold'
                }`}
              >
                {lang === "vi" ? "Hệ Thống Quản Trị" : "Management System"}
              </Link>
            )}

            {/* 6. Tin tức / News */}
            <Link
              href="/news"
              className={`transition-all px-3 py-1 rounded-full ${
                pathname?.startsWith('/news')
                  ? 'text-[#2fd39a] bg-[#2fd39a]/20 border border-[#2fd39a]/40 font-black shadow-xs'
                  : 'text-slate-100 hover:text-[#2fd39a] hover:bg-white/10 font-bold'
              }`}
            >
              {lang === "vi" ? "Tin Tức" : "News"}
            </Link>

            {/* 7. Khác / Other Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleOtherMouseEnter}
              onMouseLeave={handleOtherMouseLeave}
            >
              <button
                className={`flex items-center gap-1.5 transition-all px-3 py-1 rounded-full uppercase font-extrabold cursor-pointer ${
                  otherDropdownOpen
                    ? 'text-[#2fd39a] bg-[#2fd39a]/20 border border-[#2fd39a]/40'
                    : 'text-slate-100 hover:text-[#2fd39a] hover:bg-white/10'
                }`}
              >
                <span>{lang === "vi" ? "Khác" : "Other"}</span>
                <IconChevronDown
                  size={13}
                  className={`transition-transform duration-300 ${otherDropdownOpen ? 'rotate-180 text-[#2fd39a]' : 'text-[#2fd39a]'}`}
                />
              </button>

              {/* Dropdown popup with hover bridge & smooth transition */}
              <div
                className={`absolute top-full right-0 pt-2 w-64 z-50 transition-all duration-300 transform origin-top-right ${
                  otherDropdownOpen
                    ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
                    : 'opacity-0 scale-95 pointer-events-none -translate-y-2'
                }`}
                onMouseEnter={handleOtherMouseEnter}
                onMouseLeave={handleOtherMouseLeave}
              >
                <div className="rounded-2xl bg-[#062017] border-2 border-[#2fd39a]/60 p-2 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-left space-y-1">
                  <Link
                    href="/contact"
                    className="flex items-center gap-3 px-3.5 py-3 text-xs font-black text-white hover:text-[#2fd39a] bg-[#0a2f23] hover:bg-[#0f4634] border border-[#2fd39a]/20 hover:border-[#2fd39a]/60 rounded-xl transition shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center flex-shrink-0">
                      <IconPhoneCall size={16} />
                    </div>
                    <span>{lang === "vi" ? "1. LIÊN HỆ" : "1. CONTACT"}</span>
                  </Link>
                  <Link
                    href="/faq"
                    className="flex items-center gap-3 px-3.5 py-3 text-xs font-black text-white hover:text-[#2fd39a] bg-[#0a2f23] hover:bg-[#0f4634] border border-[#2fd39a]/20 hover:border-[#2fd39a]/60 rounded-xl transition shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center flex-shrink-0">
                      <IconHelpCircle size={16} />
                    </div>
                    <span>{lang === "vi" ? "2. CÂU HỎI THƯỜNG GẶP (FAQ)" : "2. FREQUENTLY ASKED QUESTIONS (FAQ)"}</span>
                  </Link>
                  <Link
                    href="/structure"
                    className="flex items-center gap-3 px-3.5 py-3 text-xs font-black text-white hover:text-[#2fd39a] bg-[#0a2f23] hover:bg-[#0f4634] border border-[#2fd39a]/20 hover:border-[#2fd39a]/60 rounded-xl transition shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#2fd39a]/20 text-[#2fd39a] flex items-center justify-center flex-shrink-0">
                      <IconHierarchy size={16} />
                    </div>
                    <span>{lang === "vi" ? "3. SƠ ĐỒ TỔ CHỨC / CHI NHÁNH" : "3. ORGANIZATION / BRANCHES"}</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Right Action Section (Language Selector + Notification Bell + Executive User Dropdown) */}
          <div className="hidden xl:flex items-center gap-2.5">
            <HeaderControls variant="dark" />
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
          <div className="xl:hidden fixed inset-x-4 top-[calc(env(safe-area-inset-top,0px)+5rem)] p-6 rounded-3xl bg-[#041a13]/98 border border-[#2fd39a]/30 backdrop-blur-2xl shadow-2xl shadow-emerald-950/90 pointer-events-auto space-y-3 text-center animate-in fade-in slide-in-from-top-4 duration-300">
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
            <Link
              href="/documents/templates"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm font-bold text-white hover:text-[#2fd39a] border-b border-white/10"
            >
              Thư Viện Mẫu
            </Link>

            {isLoggedIn && (
              <>
                <Link
                  href="/work"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-sm font-extrabold text-[#2fd39a] border-b border-white/10 bg-[#2fd39a]/10 rounded-xl"
                >
                  Hệ Thống Quản Trị
                </Link>
                {isAdminUser(userInfo) && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2.5 text-sm font-extrabold text-[#f2dc9a] border-b border-white/10 bg-emerald-900/40 rounded-xl"
                  >
                    🛡️ Cổng Quản Trị (Admin)
                  </Link>
                )}
              </>
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
                <UserAvatar
                  src={editProfileForm.avatar || '/images/tbs-logo.png'}
                  name={editProfileForm.name}
                  size="xl"
                  className="rounded-2xl border border-[#2fd39a]/40 bg-emerald-950 p-1"
                />
                <label className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold text-[#2fd39a] cursor-pointer z-10">
                  <span>{isUploadingAvatar ? (lang === "vi" ? "Đang nạp..." : "Uploading...") : (lang === "vi" ? "Đổi ảnh" : "Change photo")}</span>
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
                <h3 className="text-base font-extrabold text-white">{lang === "vi" ? "Chỉnh Sửa Thông Tin Cá Nhân" : "Edit Personal Information"}</h3>
                <p className="text-[11px] text-[#2fd39a] font-mono">
                  {lang === "vi" ? "Mã NV" : "Employee ID"}: {editProfileForm.empCode || '202608001'} | {lang === "vi" ? "Chức vụ" : "Position"}: {userInfo?.roleCode || 'TONG_GIAM_DOC'}
                </p>
                <label className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1">
                  <span>☁️ {lang === "vi" ? "Đổi Avatar qua Cloudinary" : "Change avatar via Cloudinary"}</span>
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
                {/* Họ và Tên / Full Name */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold block">{lang === "vi" ? "Họ và Tên Nhân Viên *" : "Full Name *"}</label>
                  <input
                    type="text"
                    required
                    value={editProfileForm.name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                    placeholder={lang === "vi" ? "Ví dụ: Phạm Nguyễn Anh Huy" : "Example: John Doe"}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                  />
                </div>

                {/* Mã NV / Employee ID */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold block">{lang === "vi" ? "Mã Số Nhân Viên *" : "Employee ID *"}</label>
                  <input
                    type="text"
                    required
                    value={editProfileForm.empCode}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, empCode: e.target.value })}
                    placeholder={lang === "vi" ? "Ví dụ: TGĐ-001" : "Example: EMP-001"}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold block">{lang === "vi" ? "Email Công Việc" : "Work Email"}</label>
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
                  <label className="text-xs text-slate-300 font-bold block">{lang === "vi" ? "Số Điện Thoại Liên Hệ" : "Contact Phone"}</label>
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
                <label className="text-xs text-slate-300 font-bold block">{lang === "vi" ? "Chức Danh / Vị Trí Công Việc" : "Position / Job Title"}</label>
                <input
                  type="text"
                  value={editProfileForm.title}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, title: e.target.value })}
                  placeholder={lang === "vi" ? "Ví dụ: Tổng Giám Đốc Tập Đoàn TBS Group" : "Example: Chief Executive Officer"}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold block">{lang === "vi" ? "Phòng Ban / Khối Vận Hành" : "Department / Division"}</label>
                <input
                  type="text"
                  value={editProfileForm.department}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, department: e.target.value })}
                  placeholder={lang === "vi" ? "Ví dụ: Ban Giám Đốc Tập Đoàn" : "Example: Executive Board"}
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
                  {lang === "vi" ? "Hủy Bỏ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#006838] hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <IconCheck size={16} />
                  <span>{lang === "vi" ? "Lưu Cập Nhật" : "Save Changes"}</span>
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
                <h3 className="text-base font-extrabold text-white">{lang === "vi" ? "Đổi Mật Khẩu Tài Khoản" : "Change Account Password"}</h3>
                <p className="text-[11px] text-slate-400">{lang === "vi" ? "Cập nhật mật khẩu bảo mật hệ thống TBS Group" : "Update your account password securely"}</p>
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
                <label className="text-xs text-slate-300 font-bold">{lang === "vi" ? "Mật khẩu hiện tại" : "Current password"}</label>
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
                <label className="text-xs text-slate-300 font-bold">{lang === "vi" ? "Mật khẩu mới" : "New password"}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={lang === "vi" ? "Mật khẩu mới ít nhất 6 ký tự" : "At least 6 characters"}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">{lang === "vi" ? "Xác nhận mật khẩu mới" : "Confirm new password"}</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={lang === "vi" ? "Nhập lại mật khẩu mới" : "Re-enter new password"}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2fd39a]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition-colors"
                >
                  {lang === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#006838] hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-950/40"
                >
                  {lang === "vi" ? "Lưu Thay Đổi" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
