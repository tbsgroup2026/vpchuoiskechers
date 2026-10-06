// Notification Service for TBS Group (Web & Rooms)
export interface AppNotificationItem {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "GEMBA" | "KAIZEN" | "ROOMS";
  created_at: string;
  is_read: boolean;
  link?: string;
  targetUser?: string;
}

const STORAGE_KEY = "tbs_notifications_list";

const INITIAL_MOCK_NOTIFICATIONS: AppNotificationItem[] = [
  {
    id: "notif_1",
    title: "🛎️ Đăng ký phòng họp mới",
    message: "Cán bộ Phạm Nguyễn Anh Huy vừa đăng ký Phòng Họp WORK (08:00 - 09:30). Chờ Lễ Tân duyệt.",
    type: "ROOMS",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    is_read: false,
    link: "/rooms",
    targetUser: "Lễ Tân",
  },
  {
    id: "notif_2",
    title: "⚠️ Sự cố Gemba Walk Xưởng 1",
    message: "Sự cố dừng máy dán đế Line 2 — Xưởng 1 vừa tạo yêu cầu xử lý gấp.",
    type: "WARNING",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    is_read: false,
    link: "/work",
    targetUser: "Lễ Tân",
  },
  {
    id: "notif_3",
    title: "💡 Kaizen CI mới vừa nộp",
    message: "Sáng kiến 'Tối ưu khuôn ép keo E5' đã được đăng ký và chờ đánh giá sơ bộ.",
    type: "KAIZEN",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    is_read: true,
    link: "/work",
    targetUser: "Lễ Tân",
  },
  {
    id: "notif_4",
    title: "✅ Trả phòng họp thành công",
    message: "Phòng Họp OTI/OTG đã được hoàn tất cuộc họp và sẵn sàng đón lượt họp mới.",
    type: "SUCCESS",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    is_read: true,
    link: "/rooms",
    targetUser: "Lễ Tân",
  }
];

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "Vừa xong";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} giờ trước`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} ngày trước`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export const notificationService = {
  getNotifications(): AppNotificationItem[] {
    if (typeof window === "undefined") return INITIAL_MOCK_NOTIFICATIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            id: String(item.id || item.id === 0 ? item.id : Date.now()),
            title: item.title || "Thông báo",
            message: item.message || item.content || "",
            type: item.type || "INFO",
            created_at: item.created_at || item.time || new Date().toISOString(),
            is_read: Boolean(item.is_read || item.isRead),
            link: item.link || item.url || "/rooms",
            targetUser: item.targetUser || item.target_user || "Tất cả",
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to parse notifications from localStorage", e);
    }
    // Save initial mock if empty
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_NOTIFICATIONS));
    } catch {}
    return INITIAL_MOCK_NOTIFICATIONS;
  },

  async fetchNotificationsFromApiOrStore(): Promise<AppNotificationItem[]> {
    if (typeof window === "undefined") return INITIAL_MOCK_NOTIFICATIONS;
    try {
      const res = await fetch("/api/notifications?limit=20", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const apiNotifs: AppNotificationItem[] = json.data.map((item: any) => ({
            id: String(item.id),
            title: item.title,
            message: item.message,
            type: item.type || "INFO",
            created_at: item.created_at || new Date().toISOString(),
            is_read: Boolean(item.is_read),
            link: item.url || item.link || "/rooms",
            targetUser: item.targetUser || "Tất cả",
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(apiNotifs));
          return apiNotifs;
        }
      }
    } catch {
      // Fallback to local storage if API fails
    }
    return this.getNotifications();
  },

  markAllAsRead(): AppNotificationItem[] {
    const list = this.getNotifications().map((item) => ({ ...item, is_read: true }));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event("tbs_notifications_updated"));
      } catch {}
    }
    // Async background API call
    fetch("/api/notifications/read-all", { method: "PATCH" }).catch(() => {});
    return list;
  },

  markAsRead(id: string): AppNotificationItem[] {
    const list = this.getNotifications().map((item) =>
      item.id === id ? { ...item, is_read: true } : item
    );
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event("tbs_notifications_updated"));
      } catch {}
    }
    // Async background API call
    fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
    return list;
  },

  getUnreadCount(): number {
    return this.getNotifications().filter((n) => !n.is_read).length;
  }
};
