import { useState, useEffect, useCallback } from "react";
import { notificationService, AppNotificationItem } from "@/lib/notificationService";

export function useNotifications(limit: number = 20, pollIntervalMs: number = 15000) {
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      // Fetch latest notifications from API
      const latestNotifs = await notificationService.fetchNotificationsFromApiOrStore();
      setNotifications(latestNotifs.slice(0, limit));
      setUnreadCount(notificationService.getUnreadCount());
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Listen for custom events (triggered from NotificationCenter or other tabs)
    const handleUpdate = () => {
      const localNotifs = notificationService.getNotifications();
      setNotifications(localNotifs.slice(0, limit));
      setUnreadCount(notificationService.getUnreadCount());
    };
    window.addEventListener("tbs_notifications_updated", handleUpdate);

    // Setup short-polling for realtime updates
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, pollIntervalMs);

    return () => {
      window.removeEventListener("tbs_notifications_updated", handleUpdate);
      clearInterval(intervalId);
    };
  }, [fetchNotifications, limit, pollIntervalMs]);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    
    // Call service to update backend & localStorage
    notificationService.markAsRead(id);
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    
    // Call service to update backend
    notificationService.markAllAsRead();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
