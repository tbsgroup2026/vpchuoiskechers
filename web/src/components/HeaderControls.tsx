"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import UserAvatar from "@/components/UserAvatar";
import {
  notificationService,
  AppNotificationItem,
  formatRelativeTime,
} from "@/lib/notificationService";
import {
  getCurrentUser,
  logoutUserProfile,
  getUserDisplayBadgeTitle,
  setUserAvatar,
  setUserProfileInfo,
  isAdminUser,
  SYSTEM_USERS,
} from "@/lib/userProfiles";
import { useTranslation } from "@/hooks/useTranslation";
import {
  IconBell,
  IconChevronDown,
  IconUser,
  IconKey,
  IconLogout,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconLoader2,
  IconAlertTriangle,
  IconInfoCircle,
  IconBulb,
  IconCircleCheck,
} from "@tabler/icons-react";

interface HeaderControlsProps {
  variant?: "light" | "dark";
  className?: string;
}

export default function HeaderControls({
  variant = "light",
  className = "",
}: HeaderControlsProps) {
  const { lang, t } = useTranslation();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Single dropdown state: only one open at a time
  const [activeDropdown, setActiveDropdown] = useState<"lang" | "notif" | "user" | null>(null);

  // User state
  const [user, setUser] = useState<{
    empCode?: string;
    name: string;
    title: string;
    department: string;
    avatar: string;
    email?: string;
    phone?: string;
    roleCode?: string;
  }>({
    name: "TRƯƠNG BẢO NGỌC",
    title: "Lễ Tân",
    department: "HÀNH CHÍNH-LỄ TÂN",
    avatar: "",
  });

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  // Modals
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Profile Edit Form State
  const [editProfileForm, setEditProfileForm] = useState({
    name: "",
    empCode: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    avatar: "",
  });
  const [profileMsg, setProfileMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Password Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Load User Data
  const loadUser = () => {
    const cur = getCurrentUser();
    if (cur && cur.name) {
      setUser({
        empCode: cur.empCode,
        name: cur.name,
        title: getUserDisplayBadgeTitle(cur),
        department: cur.department || "HÀNH CHÍNH-LỄ TÂN",
        avatar: cur.avatar || "",
        email: cur.email || `${cur.empCode}@tbsgroup.vn`,
        phone: cur.phone || "",
        roleCode: cur.roleCode || "LE_TAN",
      });
    } else {
      // Fallback default: TRƯƠNG BẢO NGỌC - Lễ Tân
      const defaultUser = SYSTEM_USERS["102603069"] || {
        empCode: "102603069",
        name: "TRƯƠNG BẢO NGỌC",
        title: "Lễ Tân",
        department: "HÀNH CHÍNH-LỄ TÂN",
        email: "102603069@tbsgroup.vn",
        phone: "",
        avatar: "",
      };
      setUser({
        empCode: defaultUser.empCode,
        name: defaultUser.name,
        title: defaultUser.title,
        department: defaultUser.department,
        avatar: defaultUser.avatar || "",
        email: defaultUser.email,
        phone: defaultUser.phone || "",
        roleCode: (defaultUser as any).roleCode || "LE_TAN",
      });
    }
  };

  // Load Notifications Data
  const loadNotifications = async () => {
    setIsLoadingNotifs(true);
    try {
      const list = await notificationService.fetchNotificationsFromApiOrStore();
      setNotifications(list);
    } catch {
      setNotifications(notificationService.getNotifications());
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    loadUser();
    loadNotifications();

    const handleProfileUpdate = () => loadUser();
    const handleNotifUpdate = () => setNotifications(notificationService.getNotifications());

    window.addEventListener("tbs_profile_updated", handleProfileUpdate);
    window.addEventListener("tbs_notifications_updated", handleNotifUpdate);

    return () => {
      window.removeEventListener("tbs_profile_updated", handleProfileUpdate);
      window.removeEventListener("tbs_notifications_updated", handleNotifUpdate);
    };
  }, []);

  // Close dropdowns on outside click or Esc key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDropdown]);

  const toggleDropdown = (dropdown: "lang" | "notif" | "user") => {
    setActiveDropdown((prev) => (prev === dropdown ? null : dropdown));
  };

  // Notification Actions
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllAsRead = () => {
    const updated = notificationService.markAllAsRead();
    setNotifications(updated);
  };

  const handleMarkOneAsRead = (id: string, link?: string) => {
    const updated = notificationService.markAsRead(id);
    setNotifications(updated);
    setActiveDropdown(null);
    if (link) {
      router.push(link);
    }
  };

  // Logout Action
  const confirmLogout = () => {
    logoutUserProfile();
    setLogoutConfirmOpen(false);
    setActiveDropdown(null);
    router.push("/login");
  };

  // Profile Edit Handlers
  const openProfileModal = () => {
    setActiveDropdown(null);
    setProfileMsg(null);
    setEditProfileForm({
      name: user.name,
      empCode: user.empCode || "102603069",
      email: user.email || "102603069@tbsgroup.vn",
      phone: user.phone || "",
      title: user.title,
      department: user.department,
      avatar: user.avatar,
    });
    setProfileModalOpen(true);
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setIsUploadingAvatar(true);
      setProfileMsg({
        text: t("common.loading", undefined, "☁️ Đang tải ảnh đại diện..."),
        error: false,
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "vpchuoisk");
      formData.append("folder", "vpchuoiskechers");

      const res = await fetch("https://api.cloudinary.com/v1_1/dwl2xtbqa/image/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.secure_url) {
          if (user.empCode) {
            setUserAvatar(user.empCode, data.secure_url);
          }
          setEditProfileForm((prev) => ({ ...prev, avatar: data.secure_url }));
          setUser((prev) => ({ ...prev, avatar: data.secure_url }));
          setProfileMsg({
            text: t("common.success", undefined, "☁️ Đã lưu avatar mới thành công!"),
            error: false,
          });
        }
      } else {
        throw new Error("Tải ảnh thất bại");
      }
    } catch (e: any) {
      setProfileMsg({
        text: e.message || t("common.error", undefined, "Lỗi tải ảnh"),
        error: true,
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    try {
      if (editProfileForm.empCode) {
        setUserProfileInfo(editProfileForm.empCode, {
          name: editProfileForm.name,
          title: editProfileForm.title,
          department: editProfileForm.department,
          email: editProfileForm.email,
          phone: editProfileForm.phone,
          avatar: editProfileForm.avatar,
        });
      }

      setUser((prev) => ({
        ...prev,
        name: editProfileForm.name,
        title: editProfileForm.title,
        department: editProfileForm.department,
        email: editProfileForm.email,
        phone: editProfileForm.phone,
        avatar: editProfileForm.avatar,
      }));

      setProfileMsg({
        text: lang === "vi" ? "Đã lưu cập nhật thông tin cá nhân thành công!" : "Profile saved successfully!",
        error: false,
      });
      setTimeout(() => {
        setProfileModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setProfileMsg({
        text: lang === "vi" ? "Lỗi khi lưu thông tin: " + err.message : "Save error: " + err.message,
        error: true,
      });
    }
  };

  // Change Password Handler
  const openChangePasswordModal = () => {
    setActiveDropdown(null);
    setPwdMsg(null);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordModalOpen(true);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (!oldPassword) {
      setPwdMsg({ text: lang === "vi" ? "Vui lòng nhập mật khẩu hiện tại" : "Enter current password", error: true });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMsg({ text: lang === "vi" ? "Mật khẩu mới phải từ 6 ký tự" : "Min 6 characters required", error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: lang === "vi" ? "Mật khẩu xác nhận không khớp" : "Passwords do not match", error: true });
      return;
    }

    setPwdMsg({ text: lang === "vi" ? "Đã đổi mật khẩu thành công!" : "Password updated successfully!", error: false });
    setTimeout(() => {
      setChangePasswordModalOpen(false);
    }, 1500);
  };

  const isDark = variant === "dark";

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`} ref={containerRef}>
      {/* 1. LANGUAGE SELECTOR */}
      <LanguageSelector
        variant={isDark ? "header-dark" : "header-light"}
        isOpen={activeDropdown === "lang"}
        onToggle={() => toggleDropdown("lang")}
        onClose={() => setActiveDropdown(null)}
      />

      {/* 2. NOTIFICATION BELL ICON */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown("notif")}
          className={`relative p-2 sm:p-2 rounded-full transition-all duration-200 cursor-pointer select-none flex items-center justify-center ${
            isDark
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
          aria-expanded={activeDropdown === "notif"}
          aria-haspopup="true"
          aria-label={lang === "vi" ? "Thông báo" : "Notifications"}
          title={lang === "vi" ? "Thông báo" : "Notifications"}
        >
          <IconBell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black leading-none animate-bounce ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* NOTIFICATION DROPDOWN MENU */}
        {activeDropdown === "notif" && (
          <div
            className={`absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 border ${
              isDark
                ? "bg-[#062017] border-[#2fd39a]/60 text-white shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/50 dark:border-white/15 mb-2">
              <div className="flex items-center gap-2">
                <IconBell size={16} className={isDark ? "text-[#2fd39a]" : "text-[#006838]"} />
                <span className="text-xs font-black uppercase tracking-wider">
                  {lang === "vi" ? "Thông Báo" : "Notifications"}
                </span>
                {unreadCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isDark ? "bg-[#2fd39a]/20 text-[#2fd39a]" : "bg-emerald-100 text-[#006838]"
                  }`}>
                    {unreadCount} {lang === "vi" ? "mới" : "new"}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className={`text-[11px] font-bold hover:underline transition-colors cursor-pointer ${
                    isDark ? "text-[#2fd39a]" : "text-[#006838]"
                  }`}
                >
                  {lang === "vi" ? "Đánh dấu tất cả đã đọc" : "Mark all as read"}
                </button>
              )}
            </div>

            {/* List Content */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
              {isLoadingNotifs ? (
                <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <IconLoader2 size={16} className="animate-spin" />
                  <span>{lang === "vi" ? "Đang tải thông báo..." : "Loading notifications..."}</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <IconBell size={28} className="mx-auto opacity-40" />
                  <p className="text-xs font-bold">{lang === "vi" ? "Không có thông báo" : "No notifications"}</p>
                  <p className="text-[10px] opacity-75">{lang === "vi" ? "Bạn đã đọc hết các thông báo mới." : "You have no unread updates."}</p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleMarkOneAsRead(item.id, item.link)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      item.is_read
                        ? isDark
                          ? "bg-[#0a2f23]/40 border-white/5 opacity-75 hover:opacity-100"
                          : "bg-slate-50 border-slate-100 opacity-75 hover:opacity-100"
                        : isDark
                        ? "bg-[#0f4133] border-[#2fd39a]/50 shadow-xs"
                        : "bg-emerald-50/70 border-emerald-200/80 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <span className={`text-[10px] font-medium whitespace-nowrap flex-shrink-0 ${
                        isDark ? "text-[#f2dc9a]" : "text-slate-400"
                      }`}>
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed opacity-90 font-medium">
                      {item.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. USER MENU (AVATAR + NAME) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown("user")}
          className={`flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 cursor-pointer select-none border shadow-2xs ${
            isDark
              ? "bg-[#0f4133] hover:bg-[#145341] border-[#2fd39a]/50 text-white"
              : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
          }`}
          aria-expanded={activeDropdown === "user"}
          aria-haspopup="true"
          aria-label={user.name}
          title={user.name}
        >
          <UserAvatar src={user.avatar} name={user.name} size="sm" />
          <div className="hidden md:block text-left max-w-[130px] truncate">
            <div className={`text-xs font-extrabold leading-none truncate ${
              isDark ? "text-[#f2dc9a]" : "text-slate-900"
            }`}>
              {user.name}
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
              {user.title || user.department}
            </div>
          </div>
          <IconChevronDown
            size={13}
            className={`transition-transform duration-200 ${
              isDark ? "text-[#2fd39a]" : "text-slate-500"
            } ${activeDropdown === "user" ? "rotate-180" : ""}`}
          />
        </button>

        {/* USER MENU DROPDOWN */}
        {activeDropdown === "user" && (
          <div
            className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-3xl p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 border text-left ${
              isDark
                ? "bg-[#062017] border-[#2fd39a]/60 text-white shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* User Info Header Banner */}
            <div className={`p-3 rounded-2xl border mb-3 space-y-1.5 ${
              isDark ? "bg-[#0a2f23] border-[#2fd39a]/40" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-3">
                <UserAvatar src={user.avatar} name={user.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black truncate">{user.name}</h4>
                  <p className={`text-xs truncate font-semibold mt-0.5 ${
                    isDark ? "text-[#2fd39a]" : "text-[#006838]"
                  }`}>{user.title || user.department}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isDark
                    ? "bg-[#2fd39a]/20 text-[#2fd39a] border border-[#2fd39a]/30"
                    : "bg-emerald-100 text-[#006838] border border-emerald-200"
                }`}>
                  {user.department}
                </span>
                <span className="text-[10px] font-mono font-bold opacity-75">
                  Mã NV: {user.empCode || "102603069"}
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="space-y-1">
              {/* 1. Thông tin cá nhân */}
              <button
                type="button"
                onClick={openProfileModal}
                className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold transition-all cursor-pointer group ${
                  isDark
                    ? "bg-[#0a2f23] hover:bg-[#0f4634] text-white border border-[#2fd39a]/20"
                    : "bg-slate-50 hover:bg-emerald-50 text-slate-800 border border-slate-200"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDark ? "bg-[#2fd39a]/20 text-[#2fd39a]" : "bg-emerald-100 text-[#006838]"
                }`}>
                  <IconUser size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold">{lang === "vi" ? "Thông tin cá nhân" : "Personal Info"}</div>
                  <div className="text-[10px] opacity-70 truncate">{lang === "vi" ? "Họ tên, email, avatar" : "Name, email & photo"}</div>
                </div>
              </button>

              {/* 2. Đổi mật khẩu */}
              <button
                type="button"
                onClick={openChangePasswordModal}
                className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold transition-all cursor-pointer group ${
                  isDark
                    ? "bg-[#0a2f23] hover:bg-[#0f4634] text-white border border-amber-400/20"
                    : "bg-slate-50 hover:bg-amber-50 text-slate-800 border border-slate-200"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDark ? "bg-amber-400/20 text-[#f2dc9a]" : "bg-amber-100 text-amber-800"
                }`}>
                  <IconKey size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold">{lang === "vi" ? "Đổi mật khẩu" : "Change Password"}</div>
                  <div className="text-[10px] opacity-70 truncate">{lang === "vi" ? "Cập nhật mật khẩu bảo mật" : "Update account password"}</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-200/60 dark:border-white/10" />

              {/* 3. Đăng xuất */}
              <button
                type="button"
                onClick={() => {
                  setActiveDropdown(null);
                  setLogoutConfirmOpen(true);
                }}
                className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 text-xs font-bold transition-all cursor-pointer group ${
                  isDark
                    ? "bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30"
                    : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDark ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-600"
                }`}>
                  <IconLogout size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold">{lang === "vi" ? "Đăng xuất" : "Logout"}</div>
                  <div className="text-[10px] opacity-70 truncate">{lang === "vi" ? "Thoát phiên làm việc" : "Sign out safely"}</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          LOGOUT CONFIRMATION MODAL
         ════════════════════════════════════════════════════════════ */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#041a13] border border-slate-200 dark:border-[#2fd39a]/40 rounded-3xl p-6 text-slate-900 dark:text-white space-y-4 shadow-2xl relative text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto">
              <IconLogout size={24} />
            </div>

            <div>
              <h3 className="text-base font-extrabold">
                {lang === "vi" ? "Xác Nhận Đăng Xuất" : "Confirm Logout"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === "vi"
                  ? `Bạn có chắc chắn muốn đăng xuất khỏi tài khoản ${user.name}?`
                  : `Are you sure you want to log out of account ${user.name}?`}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                {lang === "vi" ? "Hủy Bỏ" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors shadow-lg cursor-pointer"
              >
                {lang === "vi" ? "Đăng Xuất" : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          PROFILE MODAL
         ════════════════════════════════════════════════════════════ */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#041a13] border border-slate-200 dark:border-[#2fd39a]/40 rounded-3xl p-6 text-slate-900 dark:text-white space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left">
            <button
              onClick={() => setProfileModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full"
            >
              <IconX size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="relative group">
                <UserAvatar src={editProfileForm.avatar} name={editProfileForm.name} size="xl" />
                <label className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold text-emerald-400 cursor-pointer">
                  <span>{isUploadingAvatar ? "Tải..." : "Đổi ảnh"}</span>
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
              <div>
                <h3 className="text-base font-extrabold">
                  {lang === "vi" ? "Thông Tin Cá Nhân" : "Personal Information"}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-[#2fd39a] font-mono mt-0.5">
                  Mã NV: {editProfileForm.empCode}
                </p>
              </div>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  profileMsg.error
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold">{lang === "vi" ? "Họ và Tên *" : "Full Name *"}</label>
                  <input
                    type="text"
                    required
                    value={editProfileForm.name}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">{lang === "vi" ? "Mã Nhân Viên *" : "Employee Code *"}</label>
                  <input
                    type="text"
                    required
                    value={editProfileForm.empCode}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, empCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-mono text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">{lang === "vi" ? "Email" : "Email"}</label>
                  <input
                    type="email"
                    value={editProfileForm.email}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">{lang === "vi" ? "Số Điện Thoại" : "Phone"}</label>
                  <input
                    type="text"
                    value={editProfileForm.phone}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold">{lang === "vi" ? "Chức Danh / Vị Trí" : "Position"}</label>
                <input
                  type="text"
                  value={editProfileForm.title}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold">{lang === "vi" ? "Phòng Ban" : "Department"}</label>
                <input
                  type="text"
                  value={editProfileForm.department}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  {lang === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#006838] hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
                >
                  {lang === "vi" ? "Lưu Thay Đổi" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          CHANGE PASSWORD MODAL
         ════════════════════════════════════════════════════════════ */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#041a13] border border-slate-200 dark:border-[#2fd39a]/40 rounded-3xl p-6 text-slate-900 dark:text-white space-y-4 shadow-2xl relative text-left">
            <button
              onClick={() => setChangePasswordModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full"
            >
              <IconX size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006838] dark:bg-emerald-950 dark:text-[#2fd39a] flex items-center justify-center">
                <IconKey size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold">{lang === "vi" ? "Đổi Mật Khẩu" : "Change Password"}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{lang === "vi" ? "Cập nhật mật khẩu tài khoản bảo mật" : "Update your security password"}</p>
              </div>
            </div>

            {pwdMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  pwdMsg.error
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {pwdMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold">{lang === "vi" ? "Mật khẩu hiện tại" : "Current password"}</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">{lang === "vi" ? "Mật khẩu mới" : "New password"}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={lang === "vi" ? "Tối thiểu 6 ký tự" : "At least 6 characters"}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">{lang === "vi" ? "Xác nhận mật khẩu mới" : "Confirm new password"}</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  {lang === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#006838] hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
                >
                  {lang === "vi" ? "Lưu Thay Đổi" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
