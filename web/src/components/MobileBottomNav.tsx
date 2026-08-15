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
    <div className="block sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#08221a]/95 backdrop-blur-xl border-t border-[#2fd39a]/25 px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] pb-[env(safe-area-inset-bottom,10px)]">
      <div className="flex items-center justify-around">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
                item.active
                  ? "text-[#2fd39a] font-bold scale-105"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <div
                className={`relative flex items-center justify-center p-1 rounded-lg ${
                  item.active ? "bg-[#2fd39a]/15 text-[#2fd39a]" : ""
                }`}
              >
                <Icon size={20} strokeWidth={item.active ? 2.2 : 1.7} />
                {item.active && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#2fd39a] animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
