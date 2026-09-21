"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function MyTasksRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("dept", "my-tasks");
    router.replace(`/work?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-8">
      <div className="flex items-center gap-3 text-slate-500">
        <div className="w-5 h-5 border-2 border-[#006838] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-slate-700">Đang chuyển hướng sang Công việc cá nhân...</span>
      </div>
    </div>
  );
}

export default function MyTasksRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-5 h-5 border-2 border-[#006838] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-700">Đang tải...</span>
          </div>
        </div>
      }
    >
      <MyTasksRedirectContent />
    </Suspense>
  );
}
