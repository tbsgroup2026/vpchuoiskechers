/**
 * TBS Group - MMTB Data Scope Isolation Module
 * Scope mapping:
 * - ALL: Tổng Quan (Tổng hợp Văn phòng + Miền Đông + Kiên Giang)
 * - OFFICE: Văn Phòng Chuỗi
 * - EAST: Nhà Máy Miền Đông
 * - KIEN_GIANG: Tổ Hợp Kiên Giang
 */

export type EquipmentScope = 'ALL' | 'OFFICE' | 'EAST' | 'KIEN_GIANG';

export interface ScopeOption {
  key: EquipmentScope;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const EQUIPMENT_SCOPES: Record<EquipmentScope, ScopeOption> = {
  ALL: {
    key: 'ALL',
    label: 'Tổng Quan',
    shortLabel: 'Tổng Quan',
    icon: '📊',
    description: 'Tổng hợp dữ liệu toàn hệ thống',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
  },
  OFFICE: {
    key: 'OFFICE',
    label: 'Văn Phòng Chuỗi',
    shortLabel: 'VP Chuỗi',
    icon: '🏢',
    description: 'Dữ liệu thuộc Văn phòng Chuỗi SKECHERS',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
  },
  EAST: {
    key: 'EAST',
    label: 'Nhà Máy Miền Đông',
    shortLabel: 'NM Miền Đông',
    icon: '🏭',
    description: 'Dữ liệu thuộc Nhà máy Miền Đông',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
  },
  KIEN_GIANG: {
    key: 'KIEN_GIANG',
    label: 'Tổ Hợp Kiên Giang',
    shortLabel: 'TH Kiên Giang',
    icon: '📍',
    description: 'Dữ liệu thuộc Tổ hợp Nhà máy Kiên Giang',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/30',
  },
};

export const SCOPE_KEYS: EquipmentScope[] = ['ALL', 'OFFICE', 'EAST', 'KIEN_GIANG'];
export const UNIT_SCOPES: EquipmentScope[] = ['OFFICE', 'EAST', 'KIEN_GIANG'];

export const STORAGE_KEY_SCOPE = 'mmtb_selected_scope';

/**
 * Lấy scope hiện tại theo thứ tự ưu tiên nghiêm ngặt (Mục 12.1):
 * 1. URL Query Parameter (?scope=...) (Ưu tiên cao nhất)
 * 2. localStorage ('mmtb_selected_scope') (Fallback khi không có URL query param)
 * 3. Default fallback: 'ALL' (nếu được phép) hoặc scope đầu tiên trong allowedScopes của user.
 */
export function getEffectiveScope(
  searchParamsScope: string | null | undefined,
  allowedScopes: EquipmentScope[] = ['ALL', 'OFFICE', 'EAST', 'KIEN_GIANG']
): EquipmentScope {
  // 1. Kiểm tra URL param
  if (searchParamsScope) {
    const uppercaseParam = searchParamsScope.trim().toUpperCase() as EquipmentScope;
    if (SCOPE_KEYS.includes(uppercaseParam)) {
      return uppercaseParam;
    }
  }

  // 2. Fallback sang localStorage nếu ở phía Client
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_SCOPE) as EquipmentScope | null;
    if (saved && SCOPE_KEYS.includes(saved)) {
      if (allowedScopes.length === 0 || allowedScopes.includes(saved)) {
        return saved;
      }
    }
  }

  // 3. Fallback mặc định: ALL nếu user có quyền xem ALL, ngược lại lấy scope đầu tiên trong allowedScopes
  if (allowedScopes.includes('ALL')) {
    return 'ALL';
  }
  return allowedScopes[0] || 'OFFICE';
}

/**
 * Kiểm tra xem user có quyền truy cập scope cụ thể hay không (Mục 2.1).
 * Quyền 'ALL' là quyền độc lập (MAINT_VIEW_ALL_SCOPES / ALL scope in allowedScopes).
 */
export function isScopeAllowed(
  targetScope: EquipmentScope,
  allowedScopes: EquipmentScope[] = ['ALL', 'OFFICE', 'EAST', 'KIEN_GIANG']
): boolean {
  if (!targetScope) return false;
  return allowedScopes.includes(targetScope);
}

// Đọc ?scope= thẳng từ window.location.search — dùng ở các trang con /maintenance/* (Danh Sách
// MMTB, Bảo Dưỡng MMTB...) để KHÔNG cần tự import useSearchParams()/bọc Suspense riêng ở từng
// trang (Next.js static export bắt buộc useSearchParams phải nằm trong Suspense). Đọc trực tiếp
// window.location là đủ chính xác vì trong app này, scope chỉ đổi qua 1 lượt điều hướng ĐẦY ĐỦ từ
// trang /work (không có UI đổi scope ngay trong lúc đang đứng ở 1 trang con).
export function getCurrentMmtbScope(): EquipmentScope {
  if (typeof window === 'undefined') return 'ALL';
  try {
    const params = new URLSearchParams(window.location.search);
    return getEffectiveScope(params.get('scope'));
  } catch {
    return 'ALL';
  }
}
