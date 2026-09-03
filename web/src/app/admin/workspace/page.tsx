"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkspaceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=workspace_gallery");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
      <div className="text-center space-y-3 animate-pulse">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-bold tracking-wide">Đang chuyển hướng sang Quản lý Không Gian Làm Việc...</p>
      </div>
    </div>
  );
}
