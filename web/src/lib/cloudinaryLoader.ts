// Custom Cloudinary Image Loader for Next.js Static Export
// Target Cloudinary Account: dwl2xtbqa

export interface CloudinaryLoaderOptions {
  src: string;
  width: number;
  quality?: number;
  profileQuality?: "high" | "medium" | "low";
}

/**
 * Main Cloudinary Loader function called by Next.js <Image /> or <SmartImage />
 */
export default function cloudinaryLoader({ src, width, quality, profileQuality = "high" }: CloudinaryLoaderOptions): string {
  if (!src) return "/images/tbs-logo.png";
  const clean = String(src).trim();
  if (
    !clean ||
    clean === "undefined" ||
    clean === "null" ||
    clean === "f_auto" ||
    clean === "q_auto" ||
    clean.endsWith("/upload/f_auto") ||
    clean.endsWith("/upload/")
  ) {
    return "/images/tbs-logo.png";
  }

  // If already a full Cloudinary URL:
  if (clean.includes("res.cloudinary.com")) {
    const uploadIdx = clean.indexOf("/upload/");
    if (uploadIdx !== -1) {
      const tail = clean.substring(uploadIdx + 8).replace(/^([a-z0-9_.,:]+\/)+/i, "");
      if (!tail || tail === "f_auto" || tail === "q_auto" || !tail.includes(".")) {
        return "/images/tbs-logo.png";
      }
    }
    return transformCloudinaryUrl(clean, { width, quality, profileQuality });
  }

  // If relative path or local asset, return as-is
  return clean;
}

/**
 * Transforms an existing Cloudinary URL with responsive width & quality parameters
 */
export function transformCloudinaryUrl(
  url: string,
  opts: { width?: number; quality?: number; profileQuality?: "high" | "medium" | "low"; lqip?: boolean }
): string {
  try {
    const uploadIdx = url.indexOf("/upload/");
    if (uploadIdx === -1) return url;

    const prefix = url.substring(0, uploadIdx + 8); // e.g. "https://res.cloudinary.com/dwl2xtbqa/image/upload/"
    const suffix = url.substring(uploadIdx + 8);    // e.g. "v1787117525/nzcft200bebofw7b4uzg.jpg" or "f_auto,q_auto/v1787117525/..."

    if (!suffix || suffix.trim() === "" || suffix.trim() === "f_auto" || suffix.trim() === "q_auto") {
      return "/images/tbs-logo.png";
    }

    // Strip existing transformation params if any
    let cleanSuffix = suffix.replace(/^[a-z0-9_.,:]+\/(v\d+\/)/i, "$1");
    if (cleanSuffix.includes("/") && /^[a-z0-9_.,:]+\//i.test(cleanSuffix) && !cleanSuffix.startsWith("v")) {
      cleanSuffix = cleanSuffix.replace(/^[a-z0-9_.,:]+\//i, "");
    }

    if (!cleanSuffix || cleanSuffix === "f_auto" || cleanSuffix === "q_auto" || !cleanSuffix.includes(".")) {
      return "/images/tbs-logo.png";
    }

    // Build quality parameter
    let qualityParam = "q_auto:good";
    if (opts.lqip) {
      qualityParam = "q_1,e_blur:1000";
    } else if (opts.profileQuality === "low") {
      qualityParam = "q_auto:eco";
    } else if (opts.profileQuality === "medium") {
      qualityParam = "q_auto:good";
    } else if (opts.profileQuality === "high") {
      qualityParam = opts.quality ? `q_${opts.quality}` : "q_auto:best";
    }

    const widthParam = opts.lqip ? "w_40" : opts.width ? `w_${opts.width}` : "w_auto";
    const dprParam = opts.lqip ? "" : ",dpr_auto";
    const cropParam = "c_limit";

    const transformStr = `f_auto,${qualityParam},${cropParam},${widthParam}${dprParam}`;

    return `${prefix}${transformStr}/${cleanSuffix}`;
  } catch {
    return url;
  }
}

/**
 * Generates a Low Quality Image Placeholder (LQIP) URL for Cloudinary images
 */
export function getCloudinaryLqipUrl(src: string): string {
  if (!src || !src.includes("res.cloudinary.com")) return "";
  const uploadIdx = src.indexOf("/upload/");
  if (uploadIdx !== -1) {
    const tail = src.substring(uploadIdx + 8).replace(/^([a-z0-9_.,:]+\/)+/i, "");
    if (!tail || tail === "f_auto" || tail === "q_auto" || !tail.includes(".")) {
      return "";
    }
  }
  return transformCloudinaryUrl(src, { lqip: true });
}

