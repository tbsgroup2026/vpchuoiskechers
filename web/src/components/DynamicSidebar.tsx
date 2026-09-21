"use client";

import React, { useState, useEffect } from "react";
import NavLink from "@/components/NavLink";
import { usePathname } from "next/navigation";
import {
  IconLayoutGrid,
  IconList,
  IconSparkles,
  IconShieldCheck,
  IconBuildingFactory,
  IconChartBar,
  IconCalendar,
  IconBriefcase,
  IconSettings,
  IconHistory,
  IconCloudUpload,
  IconLock,
  IconBell,
  IconReceipt,
  IconCar,
  IconCheck,
  IconChevronRight,
} from "@tabler/icons-react";

const ICON_MAP: Record<string, any> = {
  IconLayoutGrid,
  IconList,
  IconSparkles,
  IconShieldCheck,
  IconBuildingFactory,
  IconChartBar,
  IconCalendar,
  IconBriefcase,
  IconSettings,
  IconHistory,
  IconCloudUpload,
  IconLock,
  IconBell,
  IconReceipt,
  IconCar,
  IconCheck,
  IconChevronRight,
};

export default function DynamicSidebar() {
  const pathname = usePathname();
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("tbs_token") || sessionStorage.getItem("tbs_token") : "";
        const res = await fetch("/api/workspace/menu", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const json = await res.json();
            if (json.success && Array.isArray(json.menu)) {
              setMenu(json.menu);
            }
          }
        }
      } catch (e) {
        console.warn("[DynamicSidebar] Error loading menu:", e);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  if (loading) {
    return (
      <div className="w-64 bg-slate-900 text-slate-300 p-4 min-h-screen animate-pulse space-y-3">
        <div className="h-8 bg-slate-800 rounded-xl w-3/4 mb-6"></div>
        <div className="h-6 bg-slate-800 rounded-lg"></div>
        <div className="h-6 bg-slate-800 rounded-lg"></div>
        <div className="h-6 bg-slate-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between border-r border-slate-800 shadow-xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-md">
            TBS
          </div>
          <div>
            <div className="font-black text-sm text-white tracking-wide">TBS GROUP II</div>
            <div className="text-[10px] text-slate-400 font-semibold">Workspace Management</div>
          </div>
        </div>

        <nav className="space-y-1">
          <div className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Workspace Navigation</div>
          {menu.map((item) => {
            const IconComp = ICON_MAP[item.icon] || IconChevronRight;
            const isActive = pathname === item.route;

            return (
              <NavLink
                key={item.route}
                href={item.route}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <IconComp size={18} className={isActive ? "text-white" : "text-slate-400"} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.isMandatory && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Route bắt buộc"></span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="px-3 py-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>© 2026 TBS Group</span>
        <span className="font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">v2.6</span>
      </div>
    </aside>
  );
}
