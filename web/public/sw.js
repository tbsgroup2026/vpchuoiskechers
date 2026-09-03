// Service Worker for Văn phòng Chuỗi SKECHERS - TBS Group System
// Caching Strategy: Cache-First for Cloudinary Media, Stale-While-Revalidate for Static Assets

const CACHE_VERSION = "tbs-sw-v2026.09.03-01";
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

  // Bypass non-GET requests or API requests completely
  if (req.method !== "GET" || url.pathname.startsWith("/api/")) {
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
