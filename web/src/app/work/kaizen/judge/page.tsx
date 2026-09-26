import React, { Suspense } from "react";
import JudgeWorkspace from "@/modules/ci/JudgeWorkspace";

export const metadata = {
  title: "Không gian Chấm điểm BGK | Kaizen TBS Group",
  description: "Trang chấm điểm thi đua sáng kiến Kaizen dành cho Ban Giám Khảo",
};

export default function JudgePage() {
  return (
    <main className="min-h-screen bg-slate-100 py-6">
      <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">Đang tải không gian BGK...</div>}>
        <JudgeWorkspace />
      </Suspense>
    </main>
  );
}
