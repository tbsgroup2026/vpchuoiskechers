"use client";

import { useEffect, useState } from "react";

export default function VersionChecker() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [version, setVersion] = useState("checking...");

  useEffect(() => {
    // Initial fetch to get the current loaded version
    fetch("/api/version")
      .then((r) => r.json())
      .then((data) => {
        setVersion(data.version || "dev");
        sessionStorage.setItem("tbs_app_version", data.version || "dev");
      })
      .catch(() => {});

    // Periodic check every 2 minutes
    const interval = setInterval(() => {
      fetch("/api/version")
        .then((r) => r.json())
        .then((data) => {
          const currentVersion = sessionStorage.getItem("tbs_app_version");
          if (currentVersion && currentVersion !== "dev" && data.version && data.version !== "dev" && data.version !== currentVersion) {
            setShowUpdate(true);
          }
        })
        .catch(() => {});
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  if (!showUpdate) {
    return (
      <div className="fixed bottom-1 left-1 opacity-20 text-[9px] text-slate-500 pointer-events-none z-50">
        v:{version}
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5">
      <div className="bg-[#006838] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400/30">
        <div className="flex-1">
          <p className="text-sm font-bold">Có phiên bản mới!</p>
          <p className="text-xs text-emerald-100/90">Vui lòng tải lại trang để cập nhật.</p>
        </div>
        <button 
          onClick={() => {
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(regs) {
                for (var i = 0; i < regs.length; i++) { regs[i].unregister(); }
                window.location.reload();
              });
            } else {
              window.location.reload();
            }
          }}
          className="px-3 py-1.5 bg-white text-[#006838] rounded-xl text-xs font-bold whitespace-nowrap hover:bg-emerald-50 active:scale-95 transition-all"
        >
          Tải lại ngay
        </button>
      </div>
    </div>
  );
}
