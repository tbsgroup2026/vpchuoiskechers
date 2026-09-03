"use client";

import { useState, useEffect } from "react";

export type DeviceProfileTier = "low" | "medium" | "high";

export interface NetworkQualityState {
  profile: DeviceProfileTier;
  effectiveType: string; // '2g' | '3g' | '4g' | 'unknown'
  saveData: boolean;
  rtt: number; // in ms
  downlink: number; // in Mbps
  deviceMemory: number; // in GB
  hardwareConcurrency: number; // CPU cores
  isLowEnd: boolean;
  reducedMotion: boolean;
}

export function useNetworkQuality(): NetworkQualityState {
  const [quality, setQuality] = useState<NetworkQualityState>(() => {
    return getInitialProfile();
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateProfile = () => {
      const current = calculateProfile();
      setQuality(current);
    };

    updateProfile();

    // Listen to Network Information API changes if available
    const navConn = (navigator as any).connection;
    if (navConn && typeof navConn.addEventListener === "function") {
      navConn.addEventListener("change", updateProfile);
    }

    // Listen to media query prefers-reduced-motion changes
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", updateProfile);
    }

    // Zero-overhead Safari passive timing measurement via Resource Timing API
    if (!navConn && window.performance && typeof window.performance.getEntriesByType === "function") {
      try {
        const resources = window.performance.getEntriesByType("resource");
        if (resources.length > 0) {
          // Average duration of static assets already loaded by the browser
          const totalDuration = resources.reduce((acc: number, r: any) => acc + (r.duration || 0), 0);
          const avgDuration = totalDuration / resources.length;
          if (avgDuration > 800) {
            setQuality((prev) => ({ ...prev, profile: "low", isLowEnd: true }));
          }
        }
      } catch {
        // Ignore performance measurement errors
      }
    }

    return () => {
      if (navConn && typeof navConn.removeEventListener === "function") {
        navConn.removeEventListener("change", updateProfile);
      }
    };
  }, []);

  return quality;
}

function getInitialProfile(): NetworkQualityState {
  if (typeof window === "undefined") {
    return {
      profile: "high",
      effectiveType: "4g",
      saveData: false,
      rtt: 50,
      downlink: 10,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      isLowEnd: false,
      reducedMotion: false,
    };
  }

  return calculateProfile();
}

function calculateProfile(): NetworkQualityState {
  const navConn = (navigator as any).connection || {};
  const effectiveType = navConn.effectiveType || "unknown";
  const saveData = Boolean(navConn.saveData);
  const rtt = navConn.rtt || 100;
  const downlink = navConn.downlink || 5;

  const deviceMemory = (navigator as any).deviceMemory || 8;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const reducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  let profile: DeviceProfileTier = "high";

  // Low Tier Criteria:
  // 1. Data Saver mode enabled
  // 2. 2G or 3G slow connection
  // 3. RTT > 600ms or Downlink < 1.5 Mbps
  // 4. Low RAM (< 4GB) or Low CPU cores (< 4)
  if (
    saveData ||
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    effectiveType === "3g" ||
    rtt > 500 ||
    downlink < 1.5 ||
    deviceMemory < 4 ||
    hardwareConcurrency < 4
  ) {
    profile = "low";
  } else if (deviceMemory === 4 || downlink < 4) {
    profile = "medium";
  } else {
    profile = "high";
  }

  return {
    profile,
    effectiveType,
    saveData,
    rtt,
    downlink,
    deviceMemory,
    hardwareConcurrency,
    isLowEnd: profile === "low",
    reducedMotion,
  };
}
