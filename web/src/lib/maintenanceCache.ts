// Cache localStorage cho khu vực /maintenance — lưu lại dữ liệu lần tải gần nhất của từng API để
// hiện NGAY khi quay lại 1 tab (không phải chờ tải lại từ đầu mỗi lần chuyển qua chuyển lại giữa
// các trang), đồng thời vẫn tự fetch dữ liệu mới ở nền và cập nhật cache + màn hình khi xong.
const PREFIX = 'mmtb_cache_v1_';

export function readMaintenanceCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeMaintenanceCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch {
    // localStorage đầy hoặc bị chặn (private mode/Safari ITP...) — bỏ qua, không chặn trang.
  }
}
