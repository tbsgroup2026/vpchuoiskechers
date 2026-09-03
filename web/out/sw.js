// PWA Service Worker for Văn Phòng Chuỗi SKECHERS - TBS Group
const CACHE_NAME = "skechers-tbs-v30-force-purge-20260903";
const ASSETS_TO_CACHE = [
  "/favicon.ico",
  "/icon.png",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});


// Handling Mobile Push Notifications (Android & iOS 16.4+ Web Push)
self.addEventListener("push", (event) => {
  let payload = {
    title: "🔔 Văn Phòng Chuỗi SKECHERS",
    message: "Bạn có thông báo vận hành mới từ hệ thống TBS Group.",
    url: "/work",
    priority: "NORMAL",
    tag: `tbs_push_${Date.now()}`
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      payload.message = event.data.text();
    }
  }

  const isUrgent =
    payload.priority === "CRITICAL" ||
    payload.priority === "URGENT" ||
    (payload.title && (payload.title.includes("🚨") || payload.title.includes("KHẨN")));

  const options = {
    body: payload.message,
    icon: "/icon.png",
    badge: "/icon.png",
    vibrate: isUrgent ? [500, 150, 500, 150, 500, 150, 500] : [200, 100, 200],
    tag: payload.tag || `tbs_push_${Date.now()}`,
    data: { url: payload.url || "/work" },
    requireInteraction: isUrgent, // Keeps banner on lock screen until clicked for urgent alerts
    renotify: true,
    actions: [
      { action: "open", title: "Xem ngay" },
      { action: "close", title: "Đóng" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Click action on mobile notification toast / banner
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const targetUrl = event.notification.data?.url || "/work";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          client.focus();
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;
  // Ignore non-GET requests, non-http/https schemes (e.g. chrome-extension), API routes, Next.js RSC data prefetch, and txt assets
  if (
    event.request.method !== "GET" ||
    (!requestUrl.startsWith("http://") && !requestUrl.startsWith("https://")) ||
    requestUrl.includes("/api/") ||
    requestUrl.includes("_rsc=") ||
    requestUrl.includes("__next") ||
    requestUrl.includes(".txt")
  ) {
    return;
  }

  // Network-First strategy: Always fetch fresh HTML & JS from server first
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return new Response("Service Unavailable", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/plain" }),
          });
        });
      })
  );
});

