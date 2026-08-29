"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconBuildingFactory,
  IconBuildingWarehouse,
  IconBriefcase,
  IconUser,
  IconKey,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const hasCookie = document.cookie.includes("tbs_token=");
      setIsLoggedIn(hasCookie);
    };
    checkToken();
  }, [pathname]);

  const navItems = [
    { label: "Trang Chủ", href: "/", icon: IconHome, active: pathname === "/" },
    { label: "Về TBS", href: "/ve-tbs", icon: IconBuildingFactory, active: pathname === "/ve-tbs" },
    { label: "Không Gian", href: "/#workspace", icon: IconBuildingWarehouse, active: false },
    { label: "Làm Việc", href: "/work", icon: IconBriefcase, active: pathname === "/work" },
    {
      label: isLoggedIn ? "Tài Khoản" : "Đăng Nhập",
      href: isLoggedIn ? "/admin" : "/login",
      icon: isLoggedIn ? IconUser : IconKey,
      active: pathname === "/login" || pathname.startsWith("/admin"),
    },
  ];

  return (
    <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#041a13]/98 backdrop-blur-2xl border-t border-[#2fd39a]/30 px-1.5 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] pb-[env(safe-area-inset-bottom,8px)]">
      <div className="flex items-center justify-around gap-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.href}
              className={`min-h-[44px] flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                item.active
                  ? "bg-[#2fd39a]/20 text-[#2fd39a] font-black border border-[#2fd39a]/40 shadow-xs"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={20} strokeWidth={item.active ? 2.3 : 1.8} />
                {item.active && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#2fd39a] animate-pulse ring-2 ring-[#041a13]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap font-bold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
