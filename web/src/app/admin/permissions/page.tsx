import React from "react";
import Link from "next/link";
import { IconShieldCheck, IconArrowRight } from "@tabler/icons-react";
import UserPermissionInspector from "@/modules/admin/UserPermissionInspector";

export default function AdminPermissionsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* CI/IE Permissions Quick Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-950 text-white shadow-lg border border-indigo-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
            <IconShieldCheck size={13} />
            <span>Phân Hệ CI / IE & Giám Khảo Kaizen</span>
          </div>
          <h2 className="text-base font-black text-white">Quản Lý Phân Quyền CI / IE & Ban Giám Khảo</h2>
          <p className="text-xs text-indigo-200 max-w-xl">
            Thêm nhân sự theo MSNV, phân bổ chức năng đo lường thời gian IE, điều phối CI Lead và cấp quyền BGK chấm điểm theo Bareme.
          </p>
        </div>
        <Link
          href="/work/kaizen/admin/permissions"
          className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-black text-xs flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
        >
          <span>Mở Cổng Phân Quyền CI/IE</span>
          <IconArrowRight size={15} />
        </Link>
      </div>

      <UserPermissionInspector />
    </div>
  );
}
