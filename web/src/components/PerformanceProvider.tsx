"use client";

import React, { createContext, useContext, useState } from "react";
import { useNetworkQuality, NetworkQualityState } from "@/hooks/useNetworkQuality";

interface PerformanceContextValue extends NetworkQualityState {
  lazyLoadedCount: number;
  incrementLazyLoadedCount: () => void;
}

const PerformanceContext = createContext<PerformanceContextValue>({
  profile: "high",
  effectiveType: "4g",
  saveData: false,
  rtt: 50,
  downlink: 10,
  deviceMemory: 8,
  hardwareConcurrency: 8,
  isLowEnd: false,
  reducedMotion: false,
  lazyLoadedCount: 0,
  incrementLazyLoadedCount: () => {},
});

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const quality = useNetworkQuality();
  const [lazyLoadedCount, setLazyLoadedCount] = useState(0);

  const incrementLazyLoadedCount = () => {
    setLazyLoadedCount((prev) => prev + 1);
  };

  return (
    <PerformanceContext.Provider
      value={{
        ...quality,
        lazyLoadedCount,
        incrementLazyLoadedCount,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  return useContext(PerformanceContext);
}
