/**
 * Utility functions for normalizing, extracting, and rendering Kaizen image URLs
 * Handles Cloudflare R2 URLs, Cloudinary URLs, Google Drive links, comma-separated lists, and attachments_json fallbacks.
 */

export const R2_PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "https://pub-4f6913e79588469588d95eecea9146ea.r2.dev";

export function convertToR2Url(urlOrKey: string): string {
  if (!urlOrKey) return "";
  let clean = urlOrKey.trim().replace(/^["']|["']$/g, '');
  if (
    !clean ||
    clean === "undefined" ||
    clean === "null" ||
    clean === "f_auto" ||
    clean === "q_auto" ||
    clean.endsWith("/upload/f_auto") ||
    clean.endsWith("/upload/")
  ) {
    return "";
  }
  if (
    clean.includes("r2.dev") ||
    clean.includes("r2.cloudflarestorage.com") ||
    clean.startsWith("/") ||
    clean.startsWith("data:") ||
    clean.startsWith("blob:")
  ) {
    return clean;
  }
  if (clean.includes("res.cloudinary.com")) {
    const uploadIdx = clean.indexOf("/upload/");
    if (uploadIdx !== -1) {
      let tail = clean.substring(uploadIdx + 8).trim();
      tail = tail.replace(/^[a-z0-9_.,:]+\/(v\d+\/)/i, "$1");
      if (tail.includes("/") && /^[a-z0-9_.,:]+\//i.test(tail) && !tail.startsWith("v")) {
        tail = tail.replace(/^[a-z0-9_.,:]+\//i, "");
      }
      if (tail.startsWith("v") && /^v\d+\//.test(tail)) {
        tail = tail.replace(/^v\d+\//, "");
      }
      if (tail.includes("?")) {
        tail = tail.substring(0, tail.indexOf("?"));
      }
      if (tail && tail.includes(".") && tail !== "f_auto" && tail !== "q_auto") {
        return `${R2_PUBLIC_BASE_URL}/${tail}`;
      }
      return "";
    }
  } else if (!clean.startsWith("http") && clean.match(/\.(jpg|jpeg|png|gif|webp|heic|svg|mp4|mov|webm)$/i)) {
    return `${R2_PUBLIC_BASE_URL}/${clean.replace(/^\/+/, "")}`;
  }
  return clean;
}

export function getValidKaizenImageUrl(
  rawUrl?: string,
  attachmentsJson?: string,
  tagFilter?: "BEFORE" | "AFTER",
  beforeUrlFallback?: string
): string {
  let candidate = "";

  if (rawUrl && typeof rawUrl === "string" && rawUrl.trim()) {
    let clean = rawUrl.trim().replace(/^["']|["']$/g, '');
    if (clean.includes(",")) {
      const parts = clean.split(",").map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      candidate = parts[0] || "";
    } else {
      candidate = clean;
    }
  }

  // Fallback to attachments_json if rawUrl was empty or invalid
  if (!candidate && attachmentsJson) {
    try {
      const parsed = typeof attachmentsJson === "string" ? JSON.parse(attachmentsJson) : attachmentsJson;
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (tagFilter) {
          const targetTag = tagFilter.toUpperCase();
          const taggedItem = parsed.find((item: any) => {
            if (typeof item === "object" && item !== null) {
              const tag = item?.tag || item?.type || item?.category || "";
              return String(tag).toUpperCase() === targetTag;
            }
            return false;
          });
          if (taggedItem) {
            const u = typeof taggedItem === "string" ? taggedItem : taggedItem?.url;
            if (u && typeof u === "string" && u.trim()) {
              candidate = u.trim().replace(/^["']|["']$/g, '');
            }
          }
          if (!candidate && targetTag === "AFTER") {
            const cleanBeforeFallback = beforeUrlFallback ? beforeUrlFallback.trim().replace(/^["']|["']$/g, '') : "";
            const fallbackAfter = parsed.find((item: any, idx: number) => {
              const u = typeof item === "string" ? item : item?.url;
              const cleanU = u && typeof u === "string" ? u.trim().replace(/^["']|["']$/g, '') : "";
              const tag = typeof item === "object" && item !== null ? String(item?.tag || item?.type || item?.category || "").toUpperCase() : "";
              
              if (!cleanU) return false;
              if (tag === "BEFORE") return false;
              if (cleanBeforeFallback && cleanU === cleanBeforeFallback) return false;
              if (parsed.length > 1 && idx === 0 && tag !== "AFTER") return false;
              return true;
            });
            if (fallbackAfter) {
              const u = typeof fallbackAfter === "string" ? fallbackAfter : fallbackAfter?.url;
              if (u && typeof u === "string" && u.trim()) {
                candidate = u.trim().replace(/^["']|["']$/g, '');
              }
            }
          }
          if (!candidate && targetTag === "BEFORE") {
            const fallbackBefore = parsed.find((item: any) => {
              const u = typeof item === "string" ? item : item?.url;
              const cleanU = u && typeof u === "string" ? u.trim().replace(/^["']|["']$/g, '') : "";
              const tag = typeof item === "object" && item !== null ? String(item?.tag || item?.type || item?.category || "").toUpperCase() : "";
              
              if (!cleanU) return false;
              if (tag === "AFTER") return false;
              return true;
            });
            if (fallbackBefore) {
              const u = typeof fallbackBefore === "string" ? fallbackBefore : fallbackBefore?.url;
              if (u && typeof u === "string" && u.trim()) {
                candidate = u.trim().replace(/^["']|["']$/g, '');
              }
            }
          }
        } else {
          for (const item of parsed) {
            const u = typeof item === "string" ? item : item?.url;
            if (u && typeof u === "string" && u.trim()) {
              candidate = u.trim().replace(/^["']|["']$/g, '');
              break;
            }
          }
        }
      }
    } catch (e) {}
  }

  if (!candidate) return "";

  // Reject garbage/malformed candidates like "f_auto", "undefined", "null", or endings like "/upload/f_auto"
  if (
    candidate === "undefined" ||
    candidate === "null" ||
    candidate === "f_auto" ||
    candidate === "q_auto" ||
    candidate.endsWith("/upload/f_auto") ||
    candidate.endsWith("/upload/")
  ) {
    return "";
  }

  // Filter out broken base64 data URIs (e.g. "data:image/jpeg;base64" with no payload)
  if (candidate.startsWith("data:")) {
    const commaIdx = candidate.indexOf(",");
    if (commaIdx === -1 || candidate.substring(commaIdx + 1).trim() === "") {
      return "";
    }
  }

  // Transform Google Drive links to direct viewable image URLs
  if (candidate.includes("drive.google.com")) {
    const matchD = candidate.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
      candidate = `https://lh3.googleusercontent.com/d/${matchD[1]}`;
    } else {
      const matchId = candidate.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        candidate = `https://lh3.googleusercontent.com/d/${matchId[1]}`;
      }
    }
  }

  // Convert Cloudinary or relative media to Cloudflare R2
  candidate = convertToR2Url(candidate);

  return candidate;
}

export function getAllKaizenImageUrls(rawUrl?: string, attachmentsJson?: string): string[] {
  const urls: string[] = [];

  const addUrl = (u?: string) => {
    if (!u || typeof u !== "string") return;
    const clean = u.trim().replace(/^["']|["']$/g, '');
    if (!clean || clean === "undefined" || clean === "null" || clean === "f_auto" || clean === "q_auto" || clean.endsWith("/upload/f_auto") || clean.endsWith("/upload/")) return;

    if (clean.startsWith("data:")) {
      const commaIdx = clean.indexOf(",");
      if (commaIdx === -1 || clean.substring(commaIdx + 1).trim() === "") {
        return;
      }
    }

    let finalUrl = clean;
    if (clean.includes("drive.google.com")) {
      const matchD = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (matchD && matchD[1]) {
        finalUrl = `https://lh3.googleusercontent.com/d/${matchD[1]}`;
      } else {
        const matchId = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (matchId && matchId[1]) {
          finalUrl = `https://lh3.googleusercontent.com/d/${matchId[1]}`;
        }
      }
    }

    finalUrl = convertToR2Url(finalUrl);
    if (finalUrl && !urls.includes(finalUrl)) {
      urls.push(finalUrl);
    }
  };

  if (rawUrl && typeof rawUrl === "string" && rawUrl.trim()) {
    if (rawUrl.includes(",")) {
      const parts = rawUrl.split(/,\s*(?=https?:\/\/)/i);
      if (parts.length > 1) {
        parts.forEach((p) => addUrl(p.trim()));
      } else {
        rawUrl.split(",").map((s) => s.trim()).filter(Boolean).forEach((p) => addUrl(p));
      }
    } else {
      addUrl(rawUrl.trim());
    }
  }

  if (attachmentsJson) {
    try {
      const parsed = typeof attachmentsJson === "string" ? JSON.parse(attachmentsJson) : attachmentsJson;
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          const u = typeof item === "string" ? item : item?.url;
          addUrl(u);
        });
      }
    } catch (e) {}
  }

  return urls;
}
