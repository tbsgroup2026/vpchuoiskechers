// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBb9BZXvpzHzN-8QM7awNeGqutGhNdwQds",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "vpchuoiskechers.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vpchuoiskechers",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "vpchuoiskechers.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "178762434389",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:178762434389:web:8bd287f38f0f0cdfa551dc",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-WN0FB5M28R"
};

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BDHxfIzFdCA897VJICAZPks2qs53gruuFwNMNuRXPb0QCdSLYFRKOStnXljE4eq75qeqOaxdYaw5MBoTnRKDopM";

// Initialize Firebase App (supports singleton pattern for Next.js SSR / Hot Reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Safe Analytics Initialization for SSR / Client Environment
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

/**
 * Get Firebase Messaging Instance safely (SSR & SW check)
 */
export const getFirebaseMessaging = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const { getMessaging, isSupported: isMessagingSupported } = await import("firebase/messaging");
    const supported = await isMessagingSupported();
    if (supported) {
      return getMessaging(app);
    }
  } catch (e) {
    console.warn("Firebase Messaging not supported in this browser:", e);
  }
  return null;
};

/**
 * Request FCM Token for current browser client
 */
export const requestFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const { getToken } = await import("firebase/messaging");

    // Ensure Service Worker is ready
    const swRegistration = await navigator.serviceWorker.ready.catch(() => undefined);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log("✓ Firebase FCM Token acquired:", token.substring(0, 15) + "...");
      return token;
    }
  } catch (err) {
    console.warn("Failed to get FCM Token:", err);
  }
  return null;
};

export { app, analytics, firebaseConfig, VAPID_KEY };
export default app;

