"use client";

import { useEffect } from "react";
import { registerServiceWorker, syncPushSubscriptionToServer } from "@/lib/browserNotifications";

/**
 * Initialize Service Worker silently on app load.
 * 
 * IMPORTANT: Does NOT auto-request notification permission.
 * Permission is only requested when user explicitly clicks "Bật thông báo" in NotificationCenter.
 * 
 * Only syncs push subscription if permission was already granted previously.
 */
export default function NotificationInitializer() {
  useEffect(() => {
    const initSW = async () => {
      try {
        // 1. Always register Service Worker — no permission needed
        const swReg = await registerServiceWorker();
        if (!swReg) return;

        // 2. Wait for SW to be ready
        await navigator.serviceWorker.ready;

        // 3. If permission was already granted (user did it before), sync subscription
        // This keeps push working after browser restart / re-subscription
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          await syncPushSubscriptionToServer().catch(() => {});
        }

        // 4. DO NOT auto-request permission here.
        // The user must click "Bật thông báo" in NotificationCenter explicitly.
      } catch (err) {
        // Non-critical — never break the app
        console.warn("[SW Init] Non-critical warning:", err);
      }
    };

    // Small delay to ensure DOM is ready, then initialize
    const timer = setTimeout(initSW, 1500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
