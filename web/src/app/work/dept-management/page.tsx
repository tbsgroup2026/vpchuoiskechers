"use client";

import React, { useState, useEffect } from "react";
import DepartmentDashboardView from "@/modules/dashboard/DepartmentDashboardView";
import Forbidden403 from "@/components/common/Forbidden403";

export default function DepartmentManagementPage() {
  const [userPayload, setUserPayload] = useState<{
    roleCode?: string;
    roles?: string[];
    departmentName?: string;
    departmentCode?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUserPayload(data.user);
        }
      } catch {
        console.error("Auth check failed");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-slate-500 font-bold text-xs">
        Đang xác thực quyền Trưởng Phòng / Quản Lý...
      </div>
    );
  }

  const isDeptHead = userPayload?.roleCode === "TRUONG_PHONG" || userPayload?.roles?.includes("department_head") || userPayload?.roles?.includes("admin");

  if (!isDeptHead) {
    return (
      <Forbidden403
        title="403 — Chức Năng Dành Riêng Cho Trưởng Phòng / Quản Lý"
        description="Màn hình Dashboard Quản lý Phòng ban chỉ dành riêng cho Trưởng phòng/Quản lý trực thuộc. Tài khoản nhân viên thông thường không có quyền truy cập."
        requiredPermission="DEPT_MANAGEMENT_MANAGE (TRUONG_PHONG)"
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <DepartmentDashboardView
        departmentName={userPayload?.departmentName || "IT - Team Chuyển Đổi Số"}
        departmentCode={userPayload?.departmentCode || "IT_CDS"}
      />
    </div>
  );
}
