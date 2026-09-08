// Service Worker for Văn phòng Chuỗi SKECHERS - TBS Group System
// Caching Strategy: Cache-First for Cloudinary Media, Stale-While-Revalidate for Static Assets
// Web Push: Full push handler for multi-device notifications

const CACHE_VERSION = "tbs-sw-v2026.09.08-push";
const MEDIA_CACHE = `tbs-media-${CACHE_VERSION}`;
const STATIC_CACHE = `tbs-static-${CACHE_VERSION}`;

const IMMUTABLE_ASSETS = [
  "/compiled-tailwind.css",
  "/favicon.ico",
  "/manifest.json",
  "/images/tbs-logo.png",
  "/images/skechers-logo.png",
];

// 1. Install Event: Skip waiting immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(IMMUTABLE_ASSETS).catch((err) => {
        console.warn("SW immutable assets pre-cache error:", err);
      });
    })
  );
});

// 2. Activate Event: Claim clients immediately & purge obsolete caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (!key.includes(CACHE_VERSION)) {
              console.log("SW purging stale cache:", key);
              return caches.delete(key);
            }
            return null;
          })
        );
      }),
    ])
  );
});

// 3. Fetch Event: Route request based on path & domain
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass non-HTTP/HTTPS or Chrome Extensions, non-GET requests or API requests completely
  if (!url.protocol.startsWith("http") || req.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // A. Cloudinary Images Cache-First Strategy
  if (url.hostname.includes("res.cloudinary.com") || url.hostname.includes("cloudinary")) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cachedResp = await cache.match(req);
        if (cachedResp) {
          return cachedResp;
        }

        try {
          const networkResp = await fetch(req);
          if (networkResp && networkResp.status === 200) {
            cache.put(req, networkResp.clone());
          }
          return networkResp;
        } catch {
          return new Response("Media unavailable offline", { status: 503 });
        }
      })
    );
    return;
  }

  // B. Next.js Static Chunks Stale-While-Revalidate Strategy
  if (url.pathname.startsWith("/_next/static/") || url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cachedResp = await cache.match(req);
        const fetchPromise = fetch(req).then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            cache.put(req, networkResp.clone());
          }
          return networkResp;
        }).catch(() => null);

        return cachedResp || fetchPromise || fetch(req);
      })
    );
    return;
  }
});

// ============================================================
// 4. WEB PUSH NOTIFICATION HANDLER
// Receives push from Cloudflare Worker and shows native notification
// ============================================================
self.addEventListener("push", (event) => {
  console.log("[SW Push] Push event received");

  let data = {
    title: "🔔 TBS Group",
    message: "Bạn có thông báo mới từ Văn Phòng Chuỗi SKECHERS.",
    url: "/work",
    id: null,
    type: "INFO",
    category: "SYSTEM",
    icon: "/icon.png",
    badge: "/icon.png",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      // If not JSON, use text as message
      data.message = event.data.text();
    }
  }

  const notifOptions = {
    body: data.message,
    icon: data.icon || "/icon.png",
    badge: "/icon.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: data.id ? `tbs_notif_${data.id}` : `tbs_notif_${Date.now()}`,
    renotify: true,
    requireInteraction: data.priority === "URGENT" || data.priority === "HIGH",
    data: {
      url: data.url || "/work",
      id: data.id,
      notificationId: data.id,
    },
    actions: [
      { action: "open", title: "Xem ngay" },
      { action: "dismiss", title: "Bỏ qua" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notifOptions).then(() => {
      console.log("[SW Push] Notification shown:", data.title);
      // Notify all open clients about the new notification (for realtime badge update)
      return self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "PUSH_NOTIFICATION_RECEIVED",
            notification: {
              id: data.id,
              title: data.title,
              message: data.message,
              url: data.url,
              type: data.type,
              category: data.category,
              is_read: 0,
              created_at: new Date().toISOString(),
            },
          });
        });
      });
    }).catch((err) => {
      console.error("[SW Push] Failed to show notification:", err);
    })
  );
});

// ============================================================
// 5. NOTIFICATION CLICK HANDLER
// When user clicks on a push notification
// ============================================================
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;
  const notifData = notification.data || {};
  const targetUrl = notifData.url || "/work";

  console.log("[SW Notif Click] action:", action, "url:", targetUrl);

  notification.close();

  if (action === "dismiss") {
    return;
  }

  // Mark as read on the server (fire and forget)
  if (notifData.id) {
    fetch(`/api/notifications/${notifData.id}/read`, {
      method: "PATCH",
      credentials: "include",
    }).catch(() => {});
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If app is open, focus it and navigate
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrlObj = new URL(targetUrl, self.location.origin);

        // Focus any open window on our domain
        if (clientUrl.hostname === targetUrlObj.hostname) {
          client.focus();
          // Navigate the client to the specific URL
          client.postMessage({
            type: "NAVIGATE_TO",
            url: targetUrl,
          });
          return;
        }
      }
      // No open window — open a new one
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ============================================================
// 6. NOTIFICATION CLOSE HANDLER (optional analytics)
// ============================================================
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification dismissed by user:", event.notification.tag);
});

// ============================================================
// 7. MESSAGE HANDLER — receive messages from main thread
// ============================================================
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
