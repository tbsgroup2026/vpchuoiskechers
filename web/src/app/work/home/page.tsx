"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkHomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/work?dept=home");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-8">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold">Đang chuyển hướng sang Trang chủ...</span>
      </div>
    </div>
  );
}
