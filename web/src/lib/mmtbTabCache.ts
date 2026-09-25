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

// Dọn 1 LẦN DUY NHẤT các key cache CŨ (localStorage prefix "mmtb_cache_v1_", xem lib/maintenanceCache.ts)
// của đúng 4 trang vừa chuyển sang mmtbTabCache — sau khi migrate, dữ liệu (danh sách ~2500 máy, sự
// cố...) bị lưu TRÙNG LẶP ở cả 2 nơi cùng lúc (cache cũ không tự mất, cache mới ghi thêm bên cạnh),
// từng làm đầy quota localStorage và gây QuotaExceededError chặn cả việc chuyển trang ở nơi khác
// (VD 4 nút chọn khu vực ở /work, xem CNCIWrapper.tsx) — dù chỗ đó không hề đọc/ghi cache MMTB.
// Đánh dấu bằng 1 cờ riêng để chỉ quét localStorage đúng 1 lần trên mỗi trình duyệt, không lặp lại
// mỗi lần tải trang.
const LEGACY_PREFIX = 'mmtb_cache_v1_';
const LEGACY_CLEANUP_FLAG = STORAGE_PREFIX + 'legacy-cleanup-done';
const LEGACY_KEY_PREFIXES_TO_REMOVE = [
  'machines_', // gồm cả machines_filters_*, machines_verified_* (cùng tiền tố)
  'schedule_', // schedule_machines_*, schedule_periods_*, schedule_completed_*, schedule_logs_*
  'tickets_', // gồm cả tickets_counts_*, tickets_factories_*, tickets_work_requests_*
  'overview_machines', 'overview_schedule', 'overview_proposals', 'overview_factories',
  'overview_areas', 'overview_incidents', 'overview_logs', 'overview_lines', // "overview_lines" chết
  // hẳn — đã bỏ lọc theo Line, không còn nơi nào ghi/đọc key này nữa dù cũ hay mới.
];

function cleanupLegacyCache() {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(LEGACY_CLEANUP_FLAG)) return;
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(LEGACY_PREFIX)) continue;
      const rest = k.slice(LEGACY_PREFIX.length);
      if (LEGACY_KEY_PREFIXES_TO_REMOVE.some((p) => rest.startsWith(p))) toRemove.push(k);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
    window.localStorage.setItem(LEGACY_CLEANUP_FLAG, '1');
  } catch {
    // Tràn quota/bị chặn ngay cả lúc dọn — bỏ qua, không phải lỗi nghiêm trọng.
  }
}
cleanupLegacyCache();

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
