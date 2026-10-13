/** Gọi /api/hr/* kèm token HR (lưu ở sessionStorage khi đăng nhập). */
export interface HrResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export function getHrToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("tbs_hr_token");
}

export async function hrFetch<T = any>(path: string, init: RequestInit = {}): Promise<HrResult<T>> {
  const token = getHrToken();
  if (!token) {
    return { ok: false, status: 401, error: "Phiên đăng nhập HR không còn hiệu lực. Vui lòng đăng nhập lại." };
  }
  try {
    const res = await fetch(`/api/hr${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success !== false) return { ok: true, status: res.status, data: json.data as T };
    return { ok: false, status: res.status, error: json.error || "Có lỗi xảy ra, vui lòng thử lại." };
  } catch {
    return { ok: false, status: 0, error: "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại." };
  }
}
