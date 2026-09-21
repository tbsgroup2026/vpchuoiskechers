/**
 * Utility functions for normalizing, extracting, and rendering Kaizen image URLs
 * Handles Cloudinary URLs, Google Drive links, comma-separated lists, and attachments_json fallbacks.
 */

export function getValidKaizenImageUrl(rawUrl?: string, attachmentsJson?: string): string {
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
        for (const item of parsed) {
          const u = typeof item === "string" ? item : item?.url;
          if (u && typeof u === "string" && u.trim()) {
            candidate = u.trim().replace(/^["']|["']$/g, '');
            break;
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
