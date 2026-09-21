/**
 * Centralized API Client for TBS Group Application
 * Automatically handles:
 * 1. Authorization: Bearer <token> header injection
 * 2. Credentials inclusion for cookie authentication
 * 3. Global 401 Unauthorized interception (circuit breaker for infinite loops & redirect to /login)
 * 4. Polling interval registration & emergency cancellation on 401
 */

export class UnauthorizedError extends Error {
  constructor(message = "Phiên làm việc đã hết hạn hoặc không có quyền truy cập.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

// Global registry for active polling timers
const ACTIVE_POLLING_TIMERS = new Set<ReturnType<typeof setInterval>>();

/**
 * Register a background polling timer. Registered timers are automatically cleared on 401.
 */
export function registerPoller(timer: ReturnType<typeof setInterval>): ReturnType<typeof setInterval> {
  ACTIVE_POLLING_TIMERS.add(timer);
  return timer;
}

/**
 * Unregister a polling timer when component unmounts.
 */
export function unregisterPoller(timer: ReturnType<typeof setInterval>): void {
  clearInterval(timer);
  ACTIVE_POLLING_TIMERS.delete(timer);
}

/**
 * Emergency stop for ALL active polling loops when a 401 Unauthorized is received.
 */
export function stopAllPolling(): void {
  console.warn(`[API CLIENT] 🛑 Stopping ${ACTIVE_POLLING_TIMERS.size} active polling loops due to 401 Unauthorized.`);
  ACTIVE_POLLING_TIMERS.forEach((timer) => clearInterval(timer));
  ACTIVE_POLLING_TIMERS.clear();
}

/**
 * Retrieve the active authentication token from LocalStorage, SessionStorage, or Cookies.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  // 1. LocalStorage
  const localToken = localStorage.getItem("tbs_token") || localStorage.getItem("tbs_jwt_token");
  if (localToken && localToken.trim() !== "") return localToken.trim();

  // 2. SessionStorage
  const sessionToken = sessionStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_jwt_token");
  if (sessionToken && sessionToken.trim() !== "") return sessionToken.trim();

  // 3. Cookie fallback
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )tbs_token=([^;]*)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  }

  return null;
}

let isRedirectingToLogin = false;

/**
 * Handle 401 Unauthorized response centrally:
 * - Stop all pollers
 * - Clear invalid tokens
 * - Dispatch event
 * - Redirect to /login
 */
export function handleUnauthorized(requestUrl?: string): void {
  stopAllPolling();

  if (typeof window === "undefined") return;

  // Clear potentially invalid session tokens
  try {
    sessionStorage.removeItem("tbs_token");
    sessionStorage.removeItem("tbs_jwt_token");
  } catch (e) {}

  // Dispatch custom event for UI feedback
  window.dispatchEvent(new CustomEvent("tbs_auth_unauthorized", { detail: { url: requestUrl } }));

  // Prevent multiple duplicate redirects
  const currentPath = window.location.pathname;
  if (!isRedirectingToLogin && currentPath !== "/login" && !currentPath.startsWith("/login")) {
    isRedirectingToLogin = true;
    console.warn(`[API CLIENT] 🔒 Redirecting to /login due to 401 Unauthorized on ${requestUrl || currentPath}`);
    const loginUrl = new URL("/login", window.location.origin);
    loginUrl.searchParams.set("expired", "1");
    if (currentPath !== "/") {
      loginUrl.searchParams.set("redirect_uri", currentPath);
    }
    window.location.href = loginUrl.toString();
  }
}

export interface ApiFetchOptions extends RequestInit {
  skipAuthHeader?: boolean;
  skipAutoRedirectOn401?: boolean;
  timeoutMs?: number;
}

/**
 * Centralized fetch wrapper `apiFetch`
 */
export async function apiFetch(input: string | URL, options: ApiFetchOptions = {}): Promise<Response> {
  const { skipAuthHeader = false, skipAutoRedirectOn401 = false, timeoutMs = 10000, headers: rawHeaders, ...customInit } = options;

  const headers = new Headers(rawHeaders || {});

  // 1. Inject Authorization header if missing and token exists
  if (!skipAuthHeader && !headers.has("Authorization")) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", token.startsWith("Bearer ") ? token : `Bearer ${token}`);
    }
  }

  // 2. Default JSON Content-Type if body is an object string and not set
  if (customInit.body && typeof customInit.body === "string" && !headers.has("Content-Type")) {
    try {
      JSON.parse(customInit.body);
      headers.set("Content-Type", "application/json");
    } catch (e) {}
  }

  const controller = typeof AbortController !== "undefined" && !customInit.signal ? new AbortController() : null;
  const timeoutTimer = controller && timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const config: RequestInit = {
    credentials: "include",
    signal: controller?.signal || customInit.signal,
    ...customInit,
    headers,
  };

  const urlString = typeof input === "string" ? input : input.toString();

  try {
    const response = await fetch(input, config);

    if (timeoutTimer) clearTimeout(timeoutTimer);

    // 3. Intercept 401 Unauthorized
    if (response.status === 401) {
      console.warn(`[API CLIENT] ⚠️ 401 Unauthorized received from ${urlString}`);
      if (!skipAutoRedirectOn401) {
        handleUnauthorized(urlString);
        throw new UnauthorizedError(`401 Unauthorized received from ${urlString}`);
      }
    }

    return response;
  } catch (error) {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    throw error;
  }
}

/**
 * Helper methods for convenient API calls
 */
apiFetch.get = (url: string, options?: ApiFetchOptions) => apiFetch(url, { ...options, method: "GET" });
apiFetch.post = (url: string, body?: any, options?: ApiFetchOptions) =>
  apiFetch(url, {
    ...options,
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
apiFetch.put = (url: string, body?: any, options?: ApiFetchOptions) =>
  apiFetch(url, {
    ...options,
    method: "PUT",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
apiFetch.delete = (url: string, options?: ApiFetchOptions) => apiFetch(url, { ...options, method: "DELETE" });
