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

/** D1 lưu giờ UTC dạng "YYYY-MM-DD HH:MM:SS" (không có múi giờ): đổi sang ISO UTC để không lệch 7 giờ */
function toUtcIso(v: unknown): string {
  const t = String(v || "").trim();
  if (!t) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(t)) return `${t.replace(" ", "T")}Z`;
  return t;
}

export const notificationService = {
  getNotifications(): AppNotificationItem[] {
    if (typeof window === "undefined") return [];
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
            created_at: toUtcIso(item.created_at || item.time),
            is_read: Boolean(item.is_read || item.isRead),
            link: item.link || item.url || "/rooms",
            targetUser: item.targetUser || item.target_user || "Tất cả",
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to parse notifications from localStorage", e);
    }
    // Không có dữ liệu thì trả danh sách rỗng (không tạo thông báo mẫu)
    return [];
  },

  async fetchNotificationsFromApiOrStore(): Promise<AppNotificationItem[]> {
    if (typeof window === "undefined") return [];
    try {
      const res = await fetch("/api/notifications?limit=20", { cache: "no-store" });
      // Chưa đăng nhập: không hiện thông báo cũ trên máy
      if (res.status === 401) return [];
      if (res.ok) {
        const json = await res.json();
        // Luôn dùng dữ liệu từ máy chủ, kể cả khi người dùng chưa có thông báo nào
        if (json.success && Array.isArray(json.data)) {
          const apiNotifs: AppNotificationItem[] = json.data.map((item: any) => ({
            id: String(item.id),
            title: item.title,
            message: item.message,
            type: item.type || "INFO",
            created_at: toUtcIso(item.created_at),
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
