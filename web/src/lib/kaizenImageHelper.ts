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
      return `https://lh3.googleusercontent.com/d/${matchD[1]}`;
    }
    const matchId = candidate.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
      return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
    }
  }

  return candidate;
}

export function getAllKaizenImageUrls(rawUrl?: string, attachmentsJson?: string): string[] {
  const urls: string[] = [];

  const addUrl = (u?: string) => {
    if (!u || typeof u !== "string") return;
    const clean = u.trim().replace(/^["']|["']$/g, '');
    if (!clean) return;

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

    if (!urls.includes(finalUrl)) {
      urls.push(finalUrl);
    }
  };

  if (rawUrl && typeof rawUrl === "string" && rawUrl.trim()) {
    const parts = rawUrl.split(",").map((s) => s.trim()).filter(Boolean);
    parts.forEach((p) => addUrl(p));
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
