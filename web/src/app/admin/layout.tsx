"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconUsers,
  IconShield,
  IconBuilding,
  IconFileText,
  IconChartBar,
  IconAlertTriangle,
  IconArrowLeft,
} from "@tabler/icons-react";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/permissions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { canAny, roles } = usePermission();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tbs_current_user");
      if (!stored) {
        router.push("/login");
        return;
      }
      try {
        const user = JSON.parse(stored);
        const userRoles: string[] = user?.roles || [];
        const hasAdminPermission =
          userRoles.includes("admin") ||
          canAny([
            PERMISSIONS.ADMIN_MANAGE_USERS,
            PERMISSIONS.ADMIN_MANAGE_ROLES,
            PERMISSIONS.ADMIN_MANAGE_DEPARTMENTS,
          ]);

        if (!hasAdminPermission) {
          setIsAuthorized(false);
          setTimeout(() => {
            router.push("/work");
          }, 2500);
        } else {
          setIsAuthorized(true);
        }
      } catch (e) {
        setIsAuthorized(false);
      }
    }
  }, [canAny, roles, router]);

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/40">
          <IconAlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-black mb-2">Không Có Quyền Truy Cập (403 Forbidden)</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          Tài khoản của bạn không được cấp quyền Quản trị hệ thống (`admin`). Đang tự động chuyển hướng về trang làm việc...
        </p>
        <Link
          href="/work"
          className="px-6 py-2.5 rounded-xl bg-[#006838] hover:bg-[#00522c] text-white font-bold text-xs flex items-center gap-2"
        >
          <IconArrowLeft size={16} />
          <span>Về trang Dashboard ngay</span>
        </Link>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <span className="text-xs font-bold text-slate-400">⏳ Đang xác thực quyền truy cập Admin...</span>
      </div>
    );
  }

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
                Quản trị RBAC &amp; Hệ thống
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
