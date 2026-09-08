"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  IconBell,
  IconCheck,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconBulb,
  IconX,
  IconDeviceLaptop,
  IconRefresh,
  IconDeviceMobile,
  IconLoader2,
} from "@tabler/icons-react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendDesktopNotification,
  syncPushSubscriptionToServer,
  NotificationPermissionState,
} from "@/lib/browserNotifications";
import PWAInstallGuide from "@/components/PWAInstallGuide";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "GEMBA" | "KAIZEN" | "APPROVAL" | "REMINDER" | "SYSTEM";
  category?: string;
  is_read: number;
  created_at: string;
  url?: string;
  link?: string;
  targetUser?: string;
  priority?: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    setIsMounted(true);
    setPermissionState(getNotificationPermission());
  }, []);

  // ── Fetch unread count from backend (lightweight, runs always) ──────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", { credentials: "include", cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setUnreadCount(json.count || 0);
      }
    } catch { /* silent */ }
  }, []);

  // ── Fetch full notification list from backend ─────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) return; // debounce 5s
    lastFetchRef.current = now;

    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch("/api/notifications?limit=50", { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        setHasError(true);
        return;
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
        setUnreadCount(json.unread || 0);
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load unread badge on mount (always-on, lightweight) ────────────────────
  useEffect(() => {
    fetchUnreadCount();
    // Refresh badge count every 60 seconds in background
    const bgInterval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(bgInterval);
  }, [fetchUnreadCount]);

  // ── When popup opens: load notifications + start 30s polling ────────────────
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      pollingRef.current = setInterval(fetchNotifications, 30_000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, fetchNotifications]);

  // ── Listen to Service Worker push messages (realtime badge update) ───────────
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_NOTIFICATION_RECEIVED") {
        const newNotif = event.data.notification;
        if (newNotif) {
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotif.id);
            return exists ? prev : [newNotif, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
        }
      }
      // Handle navigation messages from notification click
      if (event.data?.type === "NAVIGATE_TO" && event.data.url) {
        window.location.href = event.data.url;
      }
    };

    navigator.serviceWorker.addEventListener("message", handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleSwMessage);
  }, []);

  // ── Check if this device is already subscribed to push ───────────────────────
  useEffect(() => {
    if (!isMounted || typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const checkSub = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub && getNotificationPermission() === "granted");
      } catch { /* ignore */ }
    };
    checkSub();
  }, [isMounted]);

  // ── Close dropdown on outside click ──────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Lock body scroll on mobile when Bottom Sheet is open ─────────────────────
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleToggleDesktopNotif = async () => {
    if (isEnabling) return;
    setIsEnabling(true);
    try {
      const res = await requestNotificationPermission();
      setPermissionState(res);
      if (res === "granted") {
        const synced = await syncPushSubscriptionToServer();
        setIsSubscribed(synced);
      }
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSendTestPush = async () => {
    try {
      await fetch("/api/push/test", { method: "POST", credentials: "include" });
      // Notification will arrive via push channel
    } catch { /* ignore */ }
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
    // Persist to backend
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH", credentials: "include" });
    } catch { /* silent fail — optimistic already applied */ }
  };

  const markOneAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
    } catch { /* silent */ }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "GEMBA":
      case "WARNING":
        return <IconAlertTriangle size={18} className="text-amber-500 flex-shrink-0" />;
      case "KAIZEN":
        return <IconBulb size={18} className="text-[#006838] flex-shrink-0" />;
      case "SUCCESS":
      case "APPROVAL":
        return <IconCircleCheck size={18} className="text-emerald-500 flex-shrink-0" />;
      default:
        return <IconInfoCircle size={18} className="text-blue-500 flex-shrink-0" />;
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "Vừa xong";
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `${diffH} giờ trước`;
      return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    } catch { return ts; }
  };

  // ── Notification card (shared between mobile/desktop) ────────────────────────
  const NotifCard = ({ item, compact = false }: { item: NotificationItem; compact?: boolean }) => (
    <div
      key={item.id}
      onClick={() => {
        markOneAsRead(item.id);
        setIsOpen(false);
        const href = item.url || item.link;
        if (href) window.location.href = href;
      }}
      className={`${compact ? "p-3.5" : "p-4"} ${compact ? "flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer" : "rounded-2xl border flex items-start gap-3 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"} ${
        item.is_read === 0
          ? compact ? "bg-emerald-50/40" : "bg-emerald-50/70 border-emerald-200"
          : compact ? "bg-white" : "bg-slate-50/80 border-slate-200/80"
      }`}
    >
      <div className={`${compact ? "w-8 h-8 rounded-xl" : "w-10 h-10 rounded-2xl"} bg-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5 border border-slate-100`}>
        {getIcon(item.type)}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <h5 className={`${compact ? "text-xs" : "text-sm"} font-extrabold text-slate-900 leading-snug`}>
            {item.title}
          </h5>
          <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap flex-shrink-0">
            {formatTime(item.created_at)}
          </span>
        </div>
        <p className={`${compact ? "text-xs line-clamp-2" : "text-xs sm:text-sm"} text-slate-600 leading-relaxed break-words font-medium`}>
          {item.message}
        </p>
        {item.targetUser && item.targetUser !== "all" && (
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 ${compact ? "text-[9px]" : "text-xs"} font-bold`}>
            👤 Gửi đến: {item.targetUser}
          </span>
        )}
      </div>
      {item.is_read === 0 && (
        <span className={`${compact ? "w-2 h-2" : "w-2.5 h-2.5"} rounded-full bg-[#006838] flex-shrink-0 mt-1.5`} />
      )}
    </div>
  );

  // ── Push/PWA control panel (shared) ──────────────────────────────────────────
  const PushControlPanel = ({ compact = false }: { compact?: boolean }) => (
    <div className={`${compact ? "px-3.5 py-2" : "px-4 py-3"} bg-emerald-50/70 border-b border-slate-100 flex flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 ${compact ? "text-xs" : "text-xs"} font-extrabold text-[#006838]`}>
          <IconDeviceLaptop size={compact ? 15 : 16} />
          <span>Thông báo ĐT & PC:</span>
        </div>

        {permissionState === "denied" ? (
          <span className={`${compact ? "text-[10px]" : "text-xs"} font-black text-rose-600`}>🔕 Đã bị chặn</span>
        ) : isSubscribed ? (
          <div className="flex items-center gap-1">
            <span className={`${compact ? "text-[10px]" : "text-xs"} font-black text-emerald-700`}>✅ Đã bật</span>
            <button
              onClick={handleSendTestPush}
              className={`px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 ${compact ? "text-[10px]" : "text-[11px]"} font-bold hover:bg-emerald-200 transition cursor-pointer`}
            >
              Gửi thử
            </button>
          </div>
        ) : (
          <button
            onClick={handleToggleDesktopNotif}
            disabled={isEnabling}
            className={`px-2 ${compact ? "py-0.5" : "py-1.5"} rounded-lg bg-[#006838] text-white ${compact ? "text-[10px]" : "text-xs"} font-black hover:bg-[#004d29] transition cursor-pointer shadow-2xs flex items-center gap-1 disabled:opacity-70`}
          >
            {isEnabling ? <IconLoader2 size={12} className="animate-spin" /> : null}
            🔔 Bật thông báo
          </button>
        )}
      </div>

      <div className={`flex items-center justify-between border-t border-emerald-200/50 ${compact ? "pt-1.5" : "pt-2"}`}>
        <span className={`${compact ? "text-[10px]" : "text-xs"} font-bold text-slate-600`}>Màn hình chính ĐT:</span>
        <PWAInstallGuide />
      </div>
    </div>
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  const LoadingSkeleton = ({ compact = false }: { compact?: boolean }) => (
    <div className={`${compact ? "divide-y divide-slate-100" : "p-4 space-y-3"}`}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={`${compact ? "p-3.5" : "p-4 rounded-2xl border border-slate-100"} flex items-start gap-3 animate-pulse`}>
          <div className={`${compact ? "w-8 h-8 rounded-xl" : "w-10 h-10 rounded-2xl"} bg-slate-200 flex-shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-3/4" />
            <div className="h-2.5 bg-slate-100 rounded w-full" />
            <div className="h-2.5 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────────────────────
  const EmptyState = ({ compact = false }: { compact?: boolean }) => (
    <div className={`${compact ? "p-8" : "p-10"} text-center`}>
      <div className="text-3xl mb-2">🔔</div>
      <p className={`${compact ? "text-xs" : "text-sm"} font-bold text-slate-700`}>Chưa có thông báo mới</p>
      <p className={`${compact ? "text-[10px]" : "text-xs"} text-slate-400 mt-1`}>Các cập nhật liên quan đến công việc sẽ xuất hiện tại đây.</p>
    </div>
  );

  // ── Error state ───────────────────────────────────────────────────────────────
  const ErrorState = ({ compact = false }: { compact?: boolean }) => (
    <div className={`${compact ? "p-8" : "p-10"} text-center`}>
      <p className={`${compact ? "text-xs" : "text-sm"} font-bold text-slate-600 mb-2`}>Không thể tải thông báo.</p>
      <button
        onClick={() => { lastFetchRef.current = 0; fetchNotifications(); }}
        className="flex items-center gap-1 mx-auto text-xs text-[#006838] font-bold hover:underline cursor-pointer"
      >
        <IconRefresh size={13} />
        <span>Thử lại</span>
      </button>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button (Min 44x44px Touch Target) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#006838] flex items-center justify-center transition-colors cursor-pointer border border-slate-200 shadow-2xs"
        title="Thông báo hệ thống"
        aria-label="Thông báo hệ thống"
      >
        <IconBell size={21} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* ════════════════════════════════════════════════════════════
              MOBILE BOTTOM SHEET PORTAL (Responsive < 768px)
             ════════════════════════════════════════════════════════════ */}
          {isMounted &&
            createPortal(
              <div
                className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in duration-200"
                onClick={() => setIsOpen(false)}
              >
                <div
                  className="bg-white rounded-t-3xl max-h-[85vh] w-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250 border-t border-slate-200/90 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drag Handle Top Bar */}
                  <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 flex-shrink-0" />

                  {/* Header Bar */}
                  <div className="px-3.5 py-3 bg-gradient-to-r from-[#006838] to-[#004d29] text-white flex items-center justify-between gap-2 flex-shrink-0 border-b border-emerald-800">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <IconBell size={20} className="text-emerald-300 flex-shrink-0" />
                      <h4 className="text-sm sm:text-base font-black tracking-tight truncate">Thông Báo Hệ Thống</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-black flex-shrink-0">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 min-h-[36px] active:scale-95 whitespace-nowrap"
                        >
                          <IconCheck size={14} />
                          <span>Đọc tất cả</span>
                        </button>
                      )}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer min-h-[36px] min-w-[36px] active:scale-95 flex-shrink-0"
                        aria-label="Đóng"
                      >
                        <IconX size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Push + PWA Panel */}
                  <PushControlPanel compact={false} />

                  {/* Notification List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                    {isLoading ? (
                      <LoadingSkeleton compact={false} />
                    ) : hasError ? (
                      <ErrorState compact={false} />
                    ) : notifications.length === 0 ? (
                      <EmptyState compact={false} />
                    ) : (
                      notifications.map((item) => <NotifCard key={item.id} item={item} compact={false} />)
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 text-center bg-slate-50 border-t border-slate-200 flex-shrink-0">
                    <span className="text-xs text-slate-500 font-bold">
                      Văn Phòng Chuỗi SKECHERS – TBS Group 24/7
                    </span>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* ════════════════════════════════════════════════════════════
              DESKTOP DROPDOWN PANEL (Responsive >= 768px md:block)
             ════════════════════════════════════════════════════════════ */}
          <div className="hidden md:block absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in zoom-in-95 duration-150 text-left">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#006838] to-[#004d29] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconBell size={18} />
                <h4 className="text-sm font-extrabold tracking-tight">Thông Báo Hệ Thống</h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-emerald-100 hover:text-white transition-colors cursor-pointer flex items-center gap-1 mr-2"
                  >
                    <IconCheck size={14} />
                    <span>Đọc tất cả</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                  aria-label="Đóng"
                >
                  <IconX size={14} />
                </button>
              </div>
            </div>

            {/* Push + PWA Panel */}
            <PushControlPanel compact={true} />

            {/* Desktop List Body */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {isLoading ? (
                <LoadingSkeleton compact={true} />
              ) : hasError ? (
                <ErrorState compact={true} />
              ) : notifications.length === 0 ? (
                <EmptyState compact={true} />
              ) : (
                notifications.map((item) => <NotifCard key={item.id} item={item} compact={true} />)
              )}
            </div>

            {/* Desktop Footer */}
            <div className="p-2.5 text-center bg-slate-50 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">
                Văn Phòng Chuỗi SKECHERS - Notification System 24/7
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
