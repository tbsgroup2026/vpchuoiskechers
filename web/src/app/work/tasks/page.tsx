import React, { Suspense } from "react";
import TaskBoardView from "@/modules/tasks/TaskBoardView";

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-5 h-5 border-2 border-[#006838] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-700">Đang tải Bảng Công Việc & Tiến Độ Phòng Ban...</span>
          </div>
        </div>
      }
    >
      <TaskBoardView />
    </Suspense>
  );
}
