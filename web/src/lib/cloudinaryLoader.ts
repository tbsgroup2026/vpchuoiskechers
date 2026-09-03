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

  // If already a full Cloudinary URL:
  if (src.includes("res.cloudinary.com")) {
    return transformCloudinaryUrl(src, { width, quality, profileQuality });
  }

  // If relative path or local asset, return as-is
  return src;
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

    // Strip existing transformation params if any
    const cleanSuffix = suffix.replace(/^[a-z0-9_.,:]+\/(v\d+\/)/i, "$1");

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
  if (!src || !src.includes("res.cloudinary.com")) return src;
  return transformCloudinaryUrl(src, { lqip: true });
}
