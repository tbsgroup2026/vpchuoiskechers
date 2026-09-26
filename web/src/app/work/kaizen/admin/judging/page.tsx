import React, { Suspense } from "react";
import JudgeManagementAdmin from "@/modules/ci/JudgeManagementAdmin";

export const metadata = {
  title: "Quản lý Ban Giám Khảo & Phân công | TBS Group",
  description: "Trang quản trị đợt chấm, cấp tài khoản BGK khách mời và rà soát chênh lệch điểm",
};

export default function AdminJudgingPage() {
  return (
    <main className="min-h-screen bg-slate-100 py-6">
      <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">Đang tải trang quản trị BGK...</div>}>
        <JudgeManagementAdmin />
      </Suspense>
    </main>
  );
}
