// Custom Media Loader for Next.js Static Export
// Automatically serves assets from Cloudflare R2 (https://pub-4f6913e79588469588d95eecea9146ea.r2.dev)
// and handles fallback transformations gracefully.

export const R2_PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "/cdn-r2";

export interface CloudinaryLoaderOptions {
  src: string;
  width: number;
  quality?: number;
  profileQuality?: "high" | "medium" | "low";
}

/**
 * Extracts the clean storage key from an existing Cloudinary URL
 */
export function extractR2KeyFromCloudinary(url: string): string {
  const uploadIdx = url.indexOf("/upload/");
  if (uploadIdx === -1) return "";

  let suffix = url.substring(uploadIdx + 8).trim();
  // Strip transformations (e.g. f_auto,q_auto/ or c_limit,w_100/)
  suffix = suffix.replace(/^[a-z0-9_.,:]+\/(v\d+\/)/i, "$1");
  if (suffix.includes("/") && /^[a-z0-9_.,:]+\//i.test(suffix) && !suffix.startsWith("v")) {
    suffix = suffix.replace(/^[a-z0-9_.,:]+\//i, "");
  }
  // Strip version tag (e.g. v1787117525/)
  if (suffix.startsWith("v") && /^v\d+\//.test(suffix)) {
    suffix = suffix.replace(/^v\d+\//, "");
  }

  // Strip query string (e.g. ?v=...)
  if (suffix.includes("?")) {
    suffix = suffix.substring(0, suffix.indexOf("?"));
  }

  return suffix;
}

/**
 * Main Media Loader function called by Next.js <Image /> or <SmartImage />
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

  // Rewrite any external Cloudflare R2 bucket URLs to local /cdn-r2 proxy to eliminate CORS errors
  if (clean.includes("r2.dev/")) {
    const key = clean.substring(clean.indexOf("r2.dev/") + 7).replace(/^\/+/, '');
    return `${R2_PUBLIC_BASE_URL}/${key}`;
  }
  if (clean.includes("r2.cloudflarestorage.com")) {
    const parts = clean.split(".com/");
    const key = parts[1] ? parts[1].replace(/^[^\/]+\//, '') : clean;
    return `${R2_PUBLIC_BASE_URL}/${key.replace(/^\/+/, '')}`;
  }

  // If already an R2 CDN URL or local asset (/images/..., /svg/..., etc.) or data/blob:
  if (
    clean.startsWith("/cdn-r2/") ||
    clean.startsWith("/") ||
    clean.startsWith("data:") ||
    clean.startsWith("blob:")
  ) {
    return clean;
  }

  // If Cloudinary URL, convert to R2 URL
  if (clean.includes("res.cloudinary.com")) {
    const key = extractR2KeyFromCloudinary(clean);
    if (key && key.includes(".") && key !== "f_auto" && key !== "q_auto") {
      return `${R2_PUBLIC_BASE_URL}/${key.replace(/^\/+/, '')}`;
    }
    return "/images/tbs-logo.png";
  }

  // If plain filename or relative key ending in an image/video extension
  if (clean.match(/\.(jpg|jpeg|png|gif|webp|heic|svg|mp4|mov|webm)$/i) && !clean.startsWith("http")) {
    return `${R2_PUBLIC_BASE_URL}/${clean.replace(/^\/+/, "")}`;
  }

  return clean;
}

export function transformCloudinaryUrl(
  url: string,
  opts?: { width?: number; quality?: number; profileQuality?: "high" | "medium" | "low"; lqip?: boolean }
): string {
  return cloudinaryLoader({ src: url, width: opts?.width || 800, quality: opts?.quality, profileQuality: opts?.profileQuality });
}

export function getCloudinaryLqipUrl(src: string): string {
  return cloudinaryLoader({ src, width: 40 });
}
