import React from "react";
import UserPermissionInspector from "@/modules/admin/UserPermissionInspector";

export default function AdminPermissionsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <UserPermissionInspector />
    </div>
  );
}
