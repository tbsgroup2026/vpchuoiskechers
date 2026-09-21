// Firebase Messaging Service Worker for background push notifications
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase configuration for vpchuoiskechers
firebase.initializeApp({
  apiKey: "AIzaSyBb9BZXvpzHzN-8QM7awNeGqutGhNdwQds",
  authDomain: "vpchuoiskechers.firebaseapp.com",
  projectId: "vpchuoiskechers",
  storageBucket: "vpchuoiskechers.firebasestorage.app",
  messagingSenderId: "178762434389",
  appId: "1:178762434389:web:8bd287f38f0f0cdfa551dc",
  measurementId: "G-WN0FB5M28R"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || '🔔 Văn Phòng Chuỗi SKECHERS';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Bạn có thông báo mới.',
    icon: payload.notification?.icon || '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || '/work'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/work';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
