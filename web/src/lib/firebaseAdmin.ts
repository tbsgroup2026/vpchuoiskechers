import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface FCMPushPayload {
  token: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, string>;
}

interface ServiceAccount {
  project_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function loadServiceAccount(): ServiceAccount | null {
  try {
    // 1. Try environment variable first
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    // 2. Try file in project root
    const filePath = path.join(process.cwd(), "firebase-service-account.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(fileData);
    }
  } catch (err) {
    console.warn("[FirebaseAdmin] Failed to load service account credentials:", err);
  }
  return null;
}

/**
 * Generate Google OAuth2 Access Token for FCM HTTP v1 API using Private Key JWT (RSA-SHA256)
 */
async function getFCMAccessToken(sa: ServiceAccount): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if valid for at least 5 more minutes
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 300) {
    return cachedAccessToken.token;
  }

  try {
    const header = { alg: "RS256", typ: "JWT" };
    const claimSet = {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: sa.token_uri || "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const base64UrlEncode = (str: string) =>
      Buffer.from(str)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claimSet))}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(unsignedToken);
    const signature = signer.sign(sa.private_key, "base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const jwt = `${unsignedToken}.${signature}`;

    const resp = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[FirebaseAdmin] Token exchange failed:", errText);
      return null;
    }

    const data = await resp.json();
    cachedAccessToken = {
      token: data.access_token,
      expiresAt: now + (data.expires_in || 3600),
    };

    return cachedAccessToken.token;
  } catch (err) {
    console.error("[FirebaseAdmin] Failed to generate access token:", err);
    return null;
  }
}

/**
 * Send Push Notification via Firebase Cloud Messaging HTTP v1 API
 */
export async function sendFCMPushNotification(payload: FCMPushPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const sa = loadServiceAccount();
  if (!sa) {
    return { success: false, error: "Firebase Service Account key not found or invalid." };
  }

  const accessToken = await getFCMAccessToken(sa);
  if (!accessToken) {
    return { success: false, error: "Failed to obtain Firebase OAuth access token." };
  }

  const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  const requestBody = {
    message: {
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
        image: payload.icon || "/icon.png",
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/icon.png",
          badge: "/icon.png",
          vibrate: [200, 100, 200],
        },
        fcm_options: {
          link: payload.url || "/work",
        },
      },
      data: payload.data || { url: payload.url || "/work" },
    },
  };

  try {
    const resp = await fetch(fcmEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await resp.json();

    if (resp.ok) {
      console.log("[FirebaseAdmin] FCM notification sent successfully:", responseData.name);
      return { success: true, messageId: responseData.name };
    } else {
      console.warn("[FirebaseAdmin] FCM Push failed:", responseData);
      return { success: false, error: responseData.error?.message || "FCM Send Error" };
    }
  } catch (err: any) {
    console.error("[FirebaseAdmin] Error sending FCM message:", err);
    return { success: false, error: err.message || "Network Error" };
  }
}
