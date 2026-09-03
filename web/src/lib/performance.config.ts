// Global Performance Optimization Toolkit Configuration
// System: Văn phòng Chuỗi SKECHERS - TBS Group

export interface PerformanceConfig {
  enableAdaptiveQuality: boolean;
  enableSmartImage: boolean;
  enableServiceWorker: boolean;
  enableReducedMotion: boolean;
  cloudinaryCloudName: string;
  defaultQuality: {
    high: string;    // 'q_auto:best' or 'q_auto'
    medium: string;  // 'q_auto:good'
    low: string;     // 'q_auto:eco'
  };
  breakpoints: number[];
  debugModeKey: string;
}

export const PERF_CONFIG: PerformanceConfig = {
  enableAdaptiveQuality: true,
  enableSmartImage: true,
  enableServiceWorker: true,
  enableReducedMotion: true,
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dwl2xtbqa",
  defaultQuality: {
    high: "q_auto:best,f_auto",
    medium: "q_auto:good,f_auto",
    low: "q_auto:eco,f_auto",
  },
  breakpoints: [320, 480, 640, 768, 1024, 1280, 1536, 1920],
  debugModeKey: "debugPerf",
};

export function isPerfDebugActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("debug") === "perf" || urlParams.get("debugPerf") === "true") {
      return true;
    }
    return localStorage.getItem(PERF_CONFIG.debugModeKey) === "true";
  } catch {
    return false;
  }
}
