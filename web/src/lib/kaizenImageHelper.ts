/**
 * Utility functions for normalizing, extracting, and rendering Kaizen image URLs
 * Handles Cloudinary URLs, Google Drive links, comma-separated lists, and attachments_json fallbacks.
 */

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

  // Inject Cloudinary optimizations if missing to bypass "Strict Delivery" 401s on original images
  if (candidate.includes("res.cloudinary.com")) {
    if (!candidate.startsWith("http")) {
      candidate = "https://" + candidate;
    }
    const uploadIdx = candidate.indexOf("/upload/");
    if (uploadIdx !== -1) {
      const tail = candidate.substring(uploadIdx + 8).replace(/^([a-z0-9_.,:]+\/)+/i, "");
      if (!tail || tail === "f_auto" || tail === "q_auto" || !tail.includes(".")) {
        return "";
      }
    }
    // Prevent double injection if already has f_auto
    if (!candidate.includes("f_auto")) {
      candidate = candidate.replace(/\/upload\/v/g, "/upload/f_auto,q_auto/v");
    }
  } else if (!candidate.startsWith("http") && !candidate.startsWith("data:") && !candidate.startsWith("/") && candidate.match(/\.(jpg|jpeg|png|gif|webp|heic|mp4|mov)$/i)) {
    // Treat as raw Cloudinary filename or relative path
    const isVideo = candidate.match(/\.(mp4|mov)$/i);
    let cleanPath = candidate;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dwl2xtbqa";
    
    // If the path already contains q_auto or f_auto, just prepend the base url
    if (cleanPath.includes("q_auto") || cleanPath.includes("f_auto")) {
       const parts = cleanPath.split("/");
       const filePart = parts[parts.length - 1];
       if (!filePart || filePart === "f_auto" || filePart === "q_auto") return "";
       candidate = `https://res.cloudinary.com/${cloudName}/${isVideo ? 'video' : 'image'}/upload/f_auto,q_auto/${filePart}`;
    } else {
       candidate = `https://res.cloudinary.com/${cloudName}/${isVideo ? 'video' : 'image'}/upload/f_auto,q_auto/vpchuoiskechers/${cleanPath}`;
    }
  }

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

    if (finalUrl.includes("res.cloudinary.com")) {
      if (!finalUrl.startsWith("http")) {
        finalUrl = "https://" + finalUrl;
      }
      const uploadIdx = finalUrl.indexOf("/upload/");
      if (uploadIdx !== -1) {
        const tail = finalUrl.substring(uploadIdx + 8).replace(/^([a-z0-9_.,:]+\/)+/i, "");
        if (!tail || tail === "f_auto" || tail === "q_auto" || !tail.includes(".")) {
          return;
        }
      }
      if (!finalUrl.includes("f_auto")) {
        finalUrl = finalUrl.replace(/\/upload\/v/g, "/upload/f_auto,q_auto/v");
      }
    } else if (!finalUrl.startsWith("http") && !finalUrl.startsWith("data:") && !finalUrl.startsWith("/") && finalUrl.match(/\.(jpg|jpeg|png|gif|webp|heic|mp4|mov)$/i)) {
      const isVideo = finalUrl.match(/\.(mp4|mov)$/i);
      let cleanPath = finalUrl;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dwl2xtbqa";
      
      if (cleanPath.includes("q_auto") || cleanPath.includes("f_auto")) {
         const parts = cleanPath.split("/");
         const filePart = parts[parts.length - 1];
         if (!filePart || filePart === "f_auto" || filePart === "q_auto") return;
         finalUrl = `https://res.cloudinary.com/${cloudName}/${isVideo ? 'video' : 'image'}/upload/f_auto,q_auto/${filePart}`;
      } else {
         finalUrl = `https://res.cloudinary.com/${cloudName}/${isVideo ? 'video' : 'image'}/upload/f_auto,q_auto/vpchuoiskechers/${cleanPath}`;
      }
    }
    if (finalUrl && !urls.includes(finalUrl)) {
      urls.push(finalUrl);
    }
  };

  if (rawUrl && typeof rawUrl === "string" && rawUrl.trim()) {
    // We cannot naively split by comma because Cloudinary URLs use commas (e.g. f_auto,q_auto)
    // If the URL contains cloudinary.com, we assume it's a single URL or JSON array of URLs (attachments)
    // For simplicity, let's check if it's a simple comma-separated list of raw URLs (without cloudinary)
    if (rawUrl.includes('res.cloudinary.com')) {
       // Cloudinary URLs might contain commas in transformations.
       // Let's assume it's a single URL if it starts with http, otherwise we might split by some other delimiter.
       // Actually, the database usually stores a single URL in before_image_url and after_image_url.
       // Only attachments_json has multiple, but we don't pass JSON strings here usually, or if we do, it's handled differently.
       addUrl(rawUrl);
    } else {
       const parts = rawUrl.split(",").map((s) => s.trim()).filter(Boolean);
       parts.forEach((p) => addUrl(p));
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
