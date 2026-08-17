"use client";

import { useEffect, useState } from "react";
import { ROLES, Permission } from "@/lib/permissions";

/**
 * SECURITY NOTE / BẢO MẬT:
 * Việc kiểm tra permission ở phía client (usePermission / <Can>) chủ yếu phục vụ trải nghiệm UI (ẩn/hiện nút & tab).
 * TODO: Khi kết nối backend sản xuất thực tế, TOÀN BỘ các API endpoint (duyệt công tác, duyệt phòng họp, xóa dữ liệu...)
 * bắt buộc phải validate & authorize lại phía Server/API để đảm bảo an toàn bảo mật tuyệt đối.
 */

export interface UserSession {
  empCode: string;
  name: string;
  email?: string;
  title?: string;
  department?: string;
  managedDepartmentId?: string; // Ví dụ: "hr", "ci", "qc", "rd" cho Trưởng phòng
  roles?: string[]; // Mảng các role mà user có (Multi-role support: union permissions)
  avatar?: string;
}

export function usePermission() {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    function loadUser() {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("tbs_current_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUser(parsed);
          } catch (e) {
            setUser(null);
          }
        }
      }
    }

    loadUser();

    if (typeof window !== "undefined") {
      window.addEventListener("tbs_profile_updated", loadUser);
      return () => window.removeEventListener("tbs_profile_updated", loadUser);
    }
  }, []);

  const roles = user?.roles || (user ? ["employee"] : []);

  // Permission của user = hợp (union) tất cả permission của các role họ có
  const userPermissions = new Set<Permission>(
    roles.flatMap((role) => ROLES[role] || [])
  );

  const can = (permission: Permission): boolean => {
    // Nếu user có role admin, luôn cho phép
    if (roles.includes("admin")) return true;
    return userPermissions.has(permission);
  };

  const canAny = (permissions: Permission[]): boolean => {
    if (roles.includes("admin")) return true;
    return permissions.some((p) => userPermissions.has(p));
  };

  const canAll = (permissions: Permission[]): boolean => {
    if (roles.includes("admin")) return true;
    return permissions.every((p) => userPermissions.has(p));
  };

  return {
    user,
    roles,
    managedDepartmentId: user?.managedDepartmentId,
    can,
    canAny,
    canAll,
    permissions: Array.from(userPermissions),
  };
}
