"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import {
  IconHome,
  IconWallet,
  IconFileInvoice,
  IconUsers,
  IconCalendarEvent,
  IconChartPie,
  IconDeviceDesktop,
  IconPackage,
  IconArrowsRightLeft,
  IconChartBar,
  IconShieldCheck,
  IconList,
  IconSettings,
  IconBell,
  IconMaximize,
  IconChevronDown,
  IconChevronRight,
  IconChevronLeft,
  IconCheck,
  IconArrowLeft,
} from "@tabler/icons-react";

interface FinanceShellProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  title?: string;
  badge?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  activeSubmenu?: string;
}

export default function FinanceShell({
  children,
  breadcrumbs = [
    { label: "Kế toán & Quản trị", href: "/finance" },
    { label: "Thu – Chi", href: "/finance/thu-chi" },
  ],
  title,
  actions,
  activeSubmenu,
}: FinanceShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    title: string;
    avatar: string;
  }>({
    name: "Phạm Nguyễn Anh Huy",
    title: "Kế toán tổng hợp",
    avatar: "/images/tbs-logo.png",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tbs_current_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.name) {
            setUserInfo({
              name: parsed.name,
              title: parsed.title || "Kế toán tổng hợp",
              avatar: parsed.avatar || "/images/tbs-logo.png",
            });
          }
        } catch (e) {}
      }
    }
  }, []);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "thu-chi": true,
    "hoa-don": false,
    "cong-no": false,
    "ngan-sach": false,
    "chi-phi": false,
    "tai-san": false,
    "vat-tu-kho": false,
    "doi-soat": false,
    "bao-cao": false,
  });

  const toggleSubmenu = (key: string) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = [
    {
      key: "tong-quan",
      label: "Tổng quan",
      icon: IconHome,
      href: "/finance",
      isExact: true,
    },
    {
      key: "thu-chi",
      label: "Thu – Chi",
      icon: IconWallet,
      href: "/finance/thu-chi",
      subItems: [
        { label: "Phiếu chi", href: "/finance/thu-chi?tab=chi" },
        { label: "Phiếu thu", href: "/finance/thu-chi?tab=thu" },
        { label: "Tạm ứng", href: "/finance/thu-chi?tab=tam_ung" },
        { label: "Hoàn ứng", href: "/finance/thu-chi?tab=hoan_ung" },
        { label: "Quỹ tiền mặt", href: "/finance/thu-chi?tab=quy" },
        { label: "Ngân hàng", href: "/finance/thu-chi?tab=ngan_hang" },
      ],
    },
    {
      key: "hoa-don",
      label: "Hóa đơn",
      icon: IconFileInvoice,
      href: "/finance/hoa-don",
      subItems: [
        { label: "Hóa đơn đầu vào", href: "/finance/hoa-don?tab=in" },
        { label: "Hóa đơn đầu ra", href: "/finance/hoa-don?tab=out" },
        { label: "Tra cứu hóa đơn", href: "/finance/hoa-don?tab=search" },
      ],
    },
    {
      key: "cong-no",
      label: "Công nợ",
      icon: IconUsers,
      href: "/finance/cong-no",
      subItems: [
        { label: "Công nợ phải trả", href: "/finance/cong-no?tab=tra" },
        { label: "Công nợ phải thu", href: "/finance/cong-no?tab=thu" },
        { label: "Đối tác & NCC", href: "/finance/cong-no?tab=ncc" },
      ],
    },
    {
      key: "ngan-sach",
      label: "Ngân sách",
      icon: IconCalendarEvent,
      href: "/finance/ngan-sach",
      subItems: [
        { label: "Lập ngân sách", href: "/finance/ngan-sach?tab=lap" },
        { label: "Phân bổ phòng ban", href: "/finance/ngan-sach?tab=pb" },
        { label: "Budget vs Actual", href: "/finance/ngan-sach?tab=actual" },
      ],
    },
    {
      key: "chi-phi",
      label: "Chi phí",
      icon: IconChartPie,
      href: "/finance/chi-phi",
      subItems: [
        { label: "Chi phí văn phòng", href: "/finance/chi-phi?tab=vp" },
        { label: "Chi phí công tác", href: "/finance/chi-phi?tab=ct" },
        { label: "Chi phí R&D", href: "/finance/chi-phi?tab=rd" },
      ],
    },
    {
      key: "tai-san",
      label: "Tài sản",
      icon: IconDeviceDesktop,
      href: "/finance/tai-san",
      subItems: [
        { label: "Danh mục tài sản", href: "/finance/tai-san?tab=list" },
        { label: "Khấu hao tài sản", href: "/finance/tai-san?tab=khau_hao" },
      ],
    },
    {
      key: "vat-tu-kho",
      label: "Kho / Vật tư",
      icon: IconPackage,
      href: "/finance/vat-tu-kho",
      subItems: [
        { label: "Nhập kho", href: "/finance/vat-tu-kho?tab=nhap" },
        { label: "Xuất kho", href: "/finance/vat-tu-kho?tab=xuat" },
        { label: "Tồn kho an toàn", href: "/finance/vat-tu-kho?tab=ton" },
      ],
    },
    {
      key: "doi-soat",
      label: "Đối soát",
      icon: IconArrowsRightLeft,
      href: "/finance/doi-soat",
      subItems: [
        { label: "Đối soát ngân hàng", href: "/finance/doi-soat?tab=bank" },
        { label: "Đối chiếu công nợ", href: "/finance/doi-soat?tab=debt" },
      ],
    },
    {
      key: "bao-cao",
      label: "Báo cáo",
      icon: IconChartBar,
      href: "/finance/bao-cao",
      subItems: [
        { label: "Báo cáo tài chính", href: "/finance/bao-cao?tab=tc" },
        { label: "Báo cáo dòng tiền", href: "/finance/bao-cao?tab=cf" },
      ],
    },
    {
      key: "phe-duyet",
      label: "Phê duyệt",
      icon: IconShieldCheck,
      href: "/finance/phe-duyet",
    },
    {
      key: "danh-muc",
      label: "Danh mục",
      icon: IconList,
      href: "/finance",
      subItems: [
        { label: "Hệ thống tài khoản", href: "/finance" },
        { label: "Danh mục đối tác", href: "/finance/cong-no" },
      ],
    },
    {
      key: "cai-dat",
      label: "Cài đặt",
      icon: IconSettings,
      href: "/finance",
      subItems: [
        { label: "Mẫu số chứng từ", href: "/finance" },
        { label: "Quy trình phê duyệt", href: "/finance/phe-duyet" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex text-slate-800 font-sans" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* ════════════════════════════════════════════════════════════════
          SIDEBAR NAVIGATION (EXACT SCREENSHOT STYLE)
         ════════════════════════════════════════════════════════════════ */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-20" : "w-64"
        } bg-white border-r border-slate-200/90 flex flex-col flex-shrink-0 transition-all duration-300 select-none z-30 sticky top-0 h-screen`}
      >
        {/* Sidebar Header Brand Logo */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
          <Link href="/work" className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-[#006838] tracking-tight">TBS</span>
              <div className="w-2 h-2 rounded-full bg-lime-500" />
            </div>
            {!isSidebarCollapsed && (
              <div className="leading-tight border-l border-slate-200 pl-2">
                <span className="text-[11px] font-black text-slate-900 tracking-wider block uppercase">SKECHERS</span>
                <span className="text-[9px] font-bold text-slate-500 block uppercase">R&D CENTER</span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {isSidebarCollapsed ? <IconChevronRight size={15} /> : <IconChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation List Accordions */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isExact
              ? pathname === item.href
              : pathname.startsWith(item.href) && item.href !== "/finance";
            const isExpanded = expandedMenus[item.key] ?? false;

            return (
              <div key={item.key} className="space-y-0.5">
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "text-[#006838] bg-emerald-50/70 font-extrabold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon size={17} className={isActive ? "text-[#006838]" : "text-slate-500"} />
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="text-slate-400">
                          {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                        </span>
                      )}
                    </button>

                    {/* Submenu links */}
                    {!isSidebarCollapsed && isExpanded && (
                      <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-slate-200 ml-5 my-0.5">
                        {item.subItems.map((sub, sIdx) => {
                          const isSubActive =
                            activeSubmenu === sub.label ||
                            (isActive && sIdx === 0 && !activeSubmenu);
                          return (
                            <Link
                              key={sIdx}
                              href={sub.href}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                                isSubActive
                                  ? "bg-emerald-100/70 text-[#006838] font-black"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
                              }`}
                            >
                              {isSubActive && <span className="w-1.5 h-1.5 rounded-full bg-[#006838] flex-shrink-0" />}
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#e6f4ed] text-[#006838] font-extrabold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={17} className={isActive ? "text-[#006838]" : "text-slate-500"} />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 flex-shrink-0">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#006838]">TBS</span>
              <span>TBS Group System</span>
            </div>
          )}
          <span className="font-mono">v2.4.0</span>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA (HEADER TOP + BODY)
         ════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top App Header */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3 sticky top-0 z-20 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">
              Xin chào, <span className="text-[#006838]">Phạm Nguyễn Anh Huy!</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Văn phòng Chuỗi SKECHERS - R&amp;D Center | Kế toán &amp; Quản trị
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Link back to Work Dashboard */}
            <Link
              href="/work?dept=finance"
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-[#006838] border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <IconArrowLeft size={14} />
              <span>Về Dashboard</span>
            </Link>

            {/* Notification Icon */}
            <button className="relative w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <IconBell size={16} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                2
              </span>
            </button>

            {/* Fullscreen Icon */}
            <button className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <IconMaximize size={15} />
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <UserAvatar
                src={userInfo.avatar}
                name={userInfo.name}
                size="sm"
                showOnlineBadge={true}
              />
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-xs font-black text-slate-900 block truncate">{userInfo.name}</span>
                <span className="text-[10px] text-slate-500 block font-medium">{userInfo.title}</span>
              </div>
              <IconChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-5 sm:p-6 space-y-4 max-w-7xl w-full mx-auto">
          {/* Breadcrumb Bar */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300">›</span>}
                {bc.href ? (
                  <Link href={bc.href} className="hover:text-[#006838] transition-colors">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 font-bold">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Action Header Title Bar (If provided) */}
          {title && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#006838] to-[#004d29] text-white flex items-center justify-center shadow-xs">
                  <IconFileInvoice size={20} />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {title}
                </h2>
              </div>

              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}

          {/* Main Slot */}
          {children}
        </main>
      </div>
    </div>
  );
}
