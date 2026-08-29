"use client";

import { useEffect, useState } from "react";
import { PERMISSIONS, ROLES, Permission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/userProfiles";

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
        const cur = getCurrentUser();
        setUser(cur as unknown as UserSession | null);
      }
    }

    loadUser();

    if (typeof window !== "undefined") {
      window.addEventListener("tbs_profile_updated", loadUser);
      return () => window.removeEventListener("tbs_profile_updated", loadUser);
    }
  }, []);

  const roles = user?.roles || (user ? ["employee"] : []);
  const empCode = user?.empCode || "";
  const roleCode = (user as any)?.roleCode || "";

  // Danh sách các mã tài khoản / role thuộc cấp Ban Giám Đốc hoặc Admin
  const EXECS = [
    "TONG_GIAM_DOC", "PHO_TONG_GIAM_DOC", "GIAM_DOC", "PHO_GIAM_DOC",
    "SUPER_ADMIN", "SYSTEM_ADMIN", "ADMIN-2026", "admin", "ceo",
    "deputy_ceo", "director", "deputy_director", "202608001"
  ];

  const isExecutiveOrAdmin = EXECS.includes(roleCode) || EXECS.includes(empCode) || roles.some(r => EXECS.includes(r.toLowerCase()));

  // Tính toán tập quyền (permissions) dựa trên vai trò thực tế của người dùng
  const userPermissions = new Set<Permission>();

  if (isExecutiveOrAdmin) {
    Object.values(PERMISSIONS).forEach((p) => userPermissions.add(p as Permission));
  } else {
    // Map role alias / role code từ DB về key định nghĩa trong ROLES
    const activeRoles = new Set<string>(roles.map(r => r.toLowerCase()));
    if (roleCode === "TRUONG_PHONG") activeRoles.add("department_head");
    if (roleCode === "LE_TAN") activeRoles.add("receptionist");
    if (roleCode === "KE_TOAN") activeRoles.add("accountant");
    if (roleCode === "NHAN_SU") activeRoles.add("hr");
    if (roleCode === "KY_THUAT_VIEN" || roleCode === "KY_THUAT") activeRoles.add("maintenance");
    if (roleCode === "QC_MANAGER" || roleCode === "QC") activeRoles.add("qc");

    activeRoles.forEach((r) => {
      const perms = ROLES[r];
      if (perms) {
        perms.forEach((p) => userPermissions.add(p));
      }
    });

    // Mặc định luôn có quyền CBCNV cơ bản nếu có session người dùng
    if (userPermissions.size === 0 && user) {
      ROLES.employee.forEach((p) => userPermissions.add(p));
    }
  }

  const can = (permission: Permission): boolean => userPermissions.has(permission);
  const canAny = (permissions: Permission[]): boolean => permissions.some((p) => userPermissions.has(p));
  const canAll = (permissions: Permission[]): boolean => permissions.every((p) => userPermissions.has(p));

  const canEditModule = (
    moduleKey: "rooms" | "finance" | "hr" | "maintenance" | "qc" | "ci" | "logistics" | "rd" | "documents" | "trips"
  ): boolean => {
    if (isExecutiveOrAdmin) return true;
    if (moduleKey === "rooms") return can(PERMISSIONS.ROOMS_APPROVE);
    if (moduleKey === "trips") return can(PERMISSIONS.TRIP_APPROVE_LEVEL1);
    if (moduleKey === "maintenance") return can(PERMISSIONS.MAINT_MANAGE);
    if (moduleKey === "documents") return can(PERMISSIONS.DOC_APPROVE);
    if (moduleKey === "qc") return can(PERMISSIONS.QC_MANAGE);
    if (moduleKey === "ci") return can(PERMISSIONS.CI_MANAGE);
    return true;
  };

  const isReadOnlyModule = (
    moduleKey: "rooms" | "finance" | "hr" | "maintenance" | "qc" | "ci" | "logistics" | "rd" | "documents" | "trips"
  ): boolean => {
    return !canEditModule(moduleKey);
  };

  return {
    user,
    roles,
    managedDepartmentId: user?.managedDepartmentId,
    isExecutiveOrAdmin,
    canEditModule,
    isReadOnlyModule,
    can,
    canAny,
    canAll,
    permissions: Array.from(userPermissions),
  };
}

