"use client";

import Link from "next/link";
import {
  IconUsers,
  IconShield,
  IconBuilding,
  IconFileText,
  IconChartBar,
} from "@tabler/icons-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Admin sidebar */}
      <aside className="w-64 bg-accent-deep text-white p-6 border-r border-accent/15 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center font-bold text-white">
              TBS
            </div>
            <div>
              <div className="font-bold text-sm text-gold-light">
                ADMIN PANEL
              </div>
              <div className="text-[11px] text-white/30">
                Quản trị RBAC & Hệ thống
              </div>
            </div>
          </div>

          <nav className="space-y-1 text-sm font-medium">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent-mid transition text-white/65 hover:text-white"
            >
              <IconUsers size={18} />
              Quản lý nhân viên
            </Link>
            <Link
              href="/admin/roles"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent-mid transition text-white/65 hover:text-white"
            >
              <IconShield size={18} />
              Vai trò (Roles)
            </Link>
            <Link
              href="/admin/departments"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent-mid transition text-white/65 hover:text-white"
            >
              <IconBuilding size={18} />
              Phòng ban
            </Link>

            <div className="pt-4 mt-4 border-t border-white/8 text-xs text-white/25 font-semibold uppercase tracking-wider px-4">
              Phân hệ khác
            </div>
            <Link
              href="/documents/templates"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent-mid transition text-white/65 hover:text-white"
            >
              <IconFileText size={18} />
              Số hóa giấy tờ
            </Link>
            <Link
              href="/work"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent-mid transition text-white/65 hover:text-white"
            >
              <IconChartBar size={18} />
              BI Dashboard
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/8 flex items-center justify-between text-xs text-white/25">
          <span>TBS Group v1.0</span>
          <Link href="/login" className="text-red-400 hover:underline">
            Đăng xuất
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10 overflow-y-auto">{children}</main>
    </div>
  );
}
