'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  IconTools,
  IconClipboardList,
  IconDeviceLaptop,
  IconCategory,
  IconMapPin,
  IconLayoutDashboard,
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconLogout,
  IconBuildingFactory,
  IconBulb,
  IconUsers,
  IconAlertTriangle,
  IconCalendarStats,
  IconCircleCheck,
  IconPackage,
  IconStopwatch,
  IconSpeakerphone,
} from '@tabler/icons-react';
import { MMTB_NAV, MmtbNavEntry } from '@/lib/mmtbNav';
import { getCurrentUser, getUserDisplayBadgeTitle, logoutUserProfile, UserProfile } from '@/lib/userProfiles';
import UserAvatar from '@/components/UserAvatar';
import {
  EquipmentScope,
  EQUIPMENT_SCOPES,
  getEffectiveScope,
  SCOPE_KEYS,
  STORAGE_KEY_SCOPE,
} from '@/lib/equipmentScope';
import { usePermission } from '@/hooks/usePermission';
import { prefetchMaintenanceData } from '@/lib/maintenancePrefetch';

const ICONS: Record<string, any> = {
  IconTools,
  IconClipboardList,
  IconDeviceLaptop,
  IconCategory,
  IconMapPin,
  IconLayoutDashboard,
  IconBulb,
  IconUsers,
  IconAlertTriangle,
  IconCalendarStats,
  IconCircleCheck,
  IconPackage,
  IconStopwatch,
  IconSpeakerphone,
};

function MaintenanceShellInner({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { allowedScopes, canAccessScope } = usePermission();

  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ categories: true });
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Active Scope State
  const rawUrlScope = searchParams?.get('scope');
  const [activeScope, setActiveScope] = useState<EquipmentScope>('ALL');

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);
    setAuthChecked(true);
  }, [router]);

  // Sync Scope State with URL priority over localStorage (Mục 12.1)
  useEffect(() => {
    if (!authChecked) return;
    const effective = getEffectiveScope(rawUrlScope, allowedScopes);
    setActiveScope(effective);

    // Lưu localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SCOPE, effective);
    }

    // Âm thầm tải trước dữ liệu các trang khác — CẢ 3 khu vực (KIEN_GIANG/OFFICE/EAST), không chỉ
    // khu vực đang xem — để lần đầu chuyển sang 1 khu vực khác (VD từ Kiên Giang qua Văn phòng
    // Chuỗi) cũng đã có sẵn cache, không hiện "đang tải" dù là lần đầu ghé khu vực đó trong ngày.
    // Khu vực đang xem tải TRƯỚC (ưu tiên hiện data đúng trang đang mở nhanh nhất), 2 khu vực còn
    // lại tải ngay sau đó ở nền — OFFICE/EAST rất rẻ (trả rỗng ngay, không gọi API ngoài thật).
    prefetchMaintenanceData(effective);
    (['KIEN_GIANG', 'OFFICE', 'EAST'] as EquipmentScope[])
      .filter((s) => s !== effective)
      .forEach((s) => prefetchMaintenanceData(s));
  }, [rawUrlScope, allowedScopes, authChecked]);

  const handleLogout = () => {
    logoutUserProfile();
    router.replace('/login');
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectScope = (scopeKey: EquipmentScope) => {
    if (!canAccessScope(scopeKey)) return;
    setActiveScope(scopeKey);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SCOPE, scopeKey);
    }
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('scope', scopeKey);
    router.push(`${pathname}?${params.toString()}`);
  };

  const getScopedHref = (baseHref: string) => {
    if (activeScope && activeScope !== 'ALL') {
      return `${baseHref}?scope=${activeScope}`;
    }
    return baseHref;
  };

  if (!authChecked || !currentUser) {
    return (
      <div className="min-h-screen bg-[#071612] flex items-center justify-center font-sans text-slate-100 p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#0b201a] border border-emerald-500/20 shadow-2xl text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#006838]/30 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
            <IconBuildingFactory size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Hệ Thống MMTB Production</h2>
            <p className="text-xs text-emerald-400/80 font-medium mt-1">Văn Phòng Chuỗi SKECHERS / TBS Group II</p>
          </div>
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-slate-300">Đang xác thực quyền truy cập hệ thống...</span>
          </div>
        </div>
      </div>
    );
  }

  const currentScopeMeta = EQUIPMENT_SCOPES[activeScope] || EQUIPMENT_SCOPES.ALL;

  // Scope "Tổng Quan" (ALL) là trang so sánh giữa các nhà máy, KHÔNG phải xem chi tiết 1 nhà máy —
  // nên chỉ hiện đúng 1 mục "Tổng Quan" trong sidebar, ẩn Danh Sách MMTB/Bảo Dưỡng MMTB/Nhu Cầu
  // Sửa Chữa/Đề Xuất/Danh Mục (các mục đó chỉ có ý nghĩa khi đang xem 1 nhà máy cụ thể).
  const visibleNav = activeScope === 'ALL' ? MMTB_NAV.filter((entry) => entry.id === 'overview') : MMTB_NAV;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-800 font-sans antialiased">
      {/* SIDEBAR — TBS Industrial Dark Emerald Sidebar */}
      <aside
        className={`hidden lg:flex ${collapsed ? 'w-20' : 'w-64'} bg-[#071612] border-r border-emerald-900/30 flex-col flex-shrink-0 transition-all duration-200 sticky top-0 h-screen z-30`}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10 min-h-[64px]">
          {!collapsed ? (
            <Link href="/work" className="flex items-center gap-2.5 min-w-0 group">
              <img src="/images/tbs-logo.png" alt="TBS Group Logo" className="h-7 w-auto object-contain flex-shrink-0 group-hover:scale-105 transition-transform" />
              <div className="h-4 w-[1px] bg-white/20 mx-0.5" />
              <span className="text-xs font-bold text-white truncate tracking-tight uppercase">MMTB Operations</span>
            </Link>
          ) : (
            <Link href="/work" className="mx-auto">
              <img src="/images/tbs-logo.png" alt="TBS Logo" className="h-6 w-auto object-contain" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white flex-shrink-0 ml-1 transition-colors cursor-pointer"
          >
            {collapsed ? <IconChevronRight size={15} /> : <IconChevronLeft size={15} />}
          </button>
        </div>

        {/* Khu vực đang xem — để dữ liệu trống (Văn phòng Chuỗi/Nhà Máy Miền Đông chưa kết nối hệ
            thống MMTB thật) không bị hiểu nhầm là lỗi tải trang. */}
        {!collapsed && (
          <div className={`mx-3 mt-3 px-3 py-1.5 rounded-lg border ${currentScopeMeta.badgeBg} ${currentScopeMeta.badgeBorder} flex items-center gap-1.5`}>
            <span className="text-sm leading-none">{currentScopeMeta.icon}</span>
            <span className={`text-[11px] font-bold ${currentScopeMeta.badgeText} truncate`}>{currentScopeMeta.label}</span>
          </div>
        )}

        {/* User Mini Profile Header */}
        {!collapsed && (
          <div className="p-3 mx-3 my-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
            <UserAvatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-emerald-400 font-medium truncate">{getUserDisplayBadgeTitle(currentUser)}</div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
          {visibleNav.map((entry: MmtbNavEntry) => {
            const Icon = ICONS[entry.iconName] ?? IconTools;

            if (entry.type === 'group') {
              const isGroupOpen = openGroups[entry.id] ?? true;
              const hasActiveChild = entry.children.some(
                (child) => pathname === child.href || (child.href !== '/maintenance' && pathname.startsWith(child.href))
              );

              return (
                <div key={entry.id} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(entry.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      hasActiveChild ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon size={17} className={hasActiveChild ? 'text-emerald-400' : 'text-slate-400'} />
                      {!collapsed && <span className="truncate">{entry.label}</span>}
                    </div>
                    {!collapsed && (
                      <IconChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>

                  {isGroupOpen && !collapsed && (
                    <div className="pl-5 space-y-0.5">
                      {entry.children.map((child) => {
                        const ChildIcon = ICONS[child.iconName] ?? IconTools;
                        const isChildActive = pathname === child.href || (child.href !== '/maintenance' && pathname.startsWith(child.href));

                        return (
                          <Link
                            key={child.id}
                            href={getScopedHref(child.href)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 border-l-2 ${
                              isChildActive
                                ? 'bg-[#006838]/30 text-emerald-300 font-bold border-emerald-400'
                                : 'border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white'
                            }`}
                          >
                            <ChildIcon size={14} className={isChildActive ? 'text-emerald-400' : 'text-slate-500'} />
                            <span className="truncate">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === entry.href || (entry.href !== '/maintenance' && pathname.startsWith(entry.href));
            return (
              <Link
                key={entry.id}
                href={getScopedHref(entry.href)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border-l-2 ${
                  isActive
                    ? 'bg-[#006838]/30 text-emerald-300 font-bold border-emerald-400'
                    : 'border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                {!collapsed && <span className="truncate">{entry.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            href="/work"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <IconArrowLeft size={16} />
            {!collapsed && <span>Trở về Trang chủ</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <IconLogout size={16} />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-only back link (header bar removed per yêu cầu) */}
        <div className="lg:hidden bg-white border-b border-slate-200/80 px-4 py-3 sticky top-0 z-20">
          <Link href="/work" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#006838]">
            <IconArrowLeft size={16} />
            <span>Tổng quan</span>
          </Link>
        </div>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 w-full">{children}</main>
      </div>
    </div>
  );
}

export default function MaintenanceShell(props: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#071612] flex items-center justify-center p-4">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MaintenanceShellInner {...props} />
    </Suspense>
  );
}
