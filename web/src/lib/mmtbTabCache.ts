'use client';

// Cache cho dữ liệu các trang MMTB (Tổng Quan/Danh Sách MMTB/Bảo Dưỡng MMTB/Nhu Cầu Sửa Chữa) trong
// khu vực /maintenance/*. Có 2 lớp: bộ nhớ (Map, đọc/ghi tức thời trong phiên) + localStorage (BỀN,
// sống sót qua lần tải lại trang/đóng mở lại trình duyệt) — lớp bộ nhớ chỉ để khỏi phải JSON.parse
// lại từ localStorage mỗi lần gọi get() trong cùng 1 phiên, dữ liệu thật nằm ở localStorage.
//
// Vì sao cần: mỗi trang này là 1 ROUTE RIÊNG của Next.js App Router — MaintenanceShell chỉ là 1
// component thường được import lại vào TỪNG page.tsx, không phải layout.tsx thật của route, nên
// Next.js HUỶ HẲN toàn bộ component mỗi khi chuyển sang route MMTB khác rồi dựng lại từ đầu. Không
// có cache thì MỌI lần quay lại 1 trang đã xem đều: state rỗng → "Đang tải..." → gọi lại 7-8 API
// song song (máy móc ~2500 dòng khá nặng) dù dữ liệu vừa xem giây trước gần như không đổi.
//
// Cách dùng — đổi state khởi tạo để ĐỌC cache trước, rồi sau khi tải xong GHI lại cache:
//   const [data, setData] = useState<T[]>(() => mmtbTabCache.get<T[]>(KEY) ?? []);
//   const [loading, setLoading] = useState(() => !mmtbTabCache.has(KEY));
//   ...trong load() lúc thành công: setData(result); mmtbTabCache.set(KEY, result);
// Lần đầu vào 1 trang vẫn tải bình thường (cache rỗng); lần SAU quay lại hiện NGAY dữ liệu cũ (không
// màn trắng) trong lúc load() vẫn âm thầm chạy lại ở nền để lấy bản mới nhất — kiểu
// "stale-while-revalidate" nhẹ, không cần thêm thư viện ngoài.
//
// isFresh() — BỎ HẲN lượt gọi load() nền khi cache còn mới (mặc định 2 phút): tránh gọi lại 7-8 API
// liên tục khi bấm qua lại các tab MMTB nhanh trong thời gian ngắn, đỡ tải cho backend Kiên Giang
// thật (vốn đã có tiền lệ quá tải/trả lỗi 500 khi bị dội quá nhiều request cùng lúc).
//
// PHẢI gọi mmtbTabCache.clear() lúc đăng xuất (xem MaintenanceShell.tsx handleLogout) — nếu không,
// máy dùng chung (nhiều người đăng nhập trang chính khác nhau) sẽ hiện tạm dữ liệu của người trước
// trong lúc chờ API mới trả về, dù chỉ trong chốc lát.
const TTL_DEFAULT_MS = 2 * 60 * 1000;
const STORAGE_PREFIX = 'mmtb-tabcache:';

type Entry = { value: unknown; savedAt: number };

const cache = new Map<string, Entry>();

function readStorage(key: string): Entry | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw == null) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'value' in parsed && 'savedAt' in parsed) return parsed as Entry;
    return undefined;
  } catch {
    return undefined;
  }
}

function writeStorage(key: string, entry: Entry) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage đầy/bị chặn (chế độ ẩn danh...) — bỏ qua, cache bộ nhớ trong phiên vẫn hoạt động.
  }
}

function getEntry(key: string): Entry | undefined {
  let entry = cache.get(key);
  if (!entry) {
    entry = readStorage(key);
    if (entry) cache.set(key, entry);
  }
  return entry;
}

export const mmtbTabCache = {
  get<T>(key: string): T | undefined {
    return getEntry(key)?.value as T | undefined;
  },
  set<T>(key: string, value: T) {
    const entry: Entry = { value, savedAt: Date.now() };
    cache.set(key, entry);
    writeStorage(key, entry);
  },
  has(key: string): boolean {
    return !!getEntry(key);
  },
  isFresh(key: string, ttlMs: number = TTL_DEFAULT_MS): boolean {
    const entry = getEntry(key);
    return !!entry && Date.now() - entry.savedAt < ttlMs;
  },
  // Xoá SẠCH cache (bộ nhớ + localStorage) — gọi lúc đăng xuất, tránh lộ dữ liệu người dùng trước
  // trên thiết bị dùng chung.
  clear() {
    cache.clear();
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Bỏ qua.
    }
  },
};
