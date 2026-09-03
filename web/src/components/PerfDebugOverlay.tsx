"use client";

import React, { useState, useEffect } from "react";
import { usePerformance } from "@/components/PerformanceProvider";
import { isPerfDebugActive } from "@/lib/performance.config";

export default function PerfDebugOverlay() {
  const [active, setActive] = useState(false);
  const perf = usePerformance();

  useEffect(() => {
    setActive(isPerfDebugActive());
  }, []);

  if (!active) return null;

  const profileColors = {
    high: "bg-emerald-600 text-white",
    medium: "bg-amber-600 text-white",
    low: "bg-rose-600 text-white",
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 text-xs font-mono max-w-xs space-y-2 pointer-events-auto">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <span className="font-extrabold text-emerald-400">PERF DEBUG HUD</span>
        <button
          onClick={() => setActive(false)}
          className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span>Profile Tier:</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${profileColors[perf.profile]}`}>
            {perf.profile}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span>Conn Type:</span>
          <span className="font-bold text-white uppercase">{perf.effectiveType}</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span>Downlink:</span>
          <span className="font-bold text-white">{perf.downlink} Mbps</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span>RTT:</span>
          <span className="font-bold text-white">{perf.rtt} ms</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span>RAM / CPU:</span>
          <span className="font-bold text-white">{perf.deviceMemory} GB / {perf.hardwareConcurrency} Cores</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span>SaveData / Motion:</span>
          <span className="font-bold text-white">
            {perf.saveData ? "ON" : "OFF"} / {perf.reducedMotion ? "REDUCED" : "NORMAL"}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
          <span>Lazy Images Loaded:</span>
          <span className="font-bold text-emerald-400">{perf.lazyLoadedCount}</span>
        </div>
      </div>
    </div>
  );
}
