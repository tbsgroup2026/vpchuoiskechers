import React, { Suspense } from "react";
import KaizenPermissionsAdmin from "@/modules/ci/KaizenPermissionsAdmin";

export const metadata = {
  title: "Quản Lý Phân Quyền CI / IE & Ban Giám Khảo | TBS Group",
  description: "Trang quản trị cấp quyền kỹ sư đo lường thời gian IE, Ban CI Lead, Giám khảo và Cấp phê duyệt theo MSNV",
};

export default function AdminPermissionsPage() {
  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 py-6">
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs font-bold text-slate-500">
            Đang tải trang quản trị phân quyền CI/IE...
          </div>
        }
      >
        <KaizenPermissionsAdmin />
      </Suspense>
    </main>
  );
}
