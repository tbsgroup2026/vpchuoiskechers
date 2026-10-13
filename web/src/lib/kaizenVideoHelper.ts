/**
 * Tiện ích chuẩn hoá, nhận diện, phân loại và bóc tách Video / Hình ảnh Kaizen
 * Hỗ trợ nhận diện MIME type (video/*), các đuôi file (.mp4, .mov, .webm, .m4v, .3gp, .avi, .mkv,...),
 * xử lý URL có query string/hash, convert qua Cloudflare R2 proxy (/cdn-r2) để tránh lỗi CORS,
 * và phân loại chính xác các giai đoạn TRƯỚC (BEFORE) / SAU (AFTER) cải tiến.
 */

import { convertToR2Url } from "./kaizenImageHelper";

// Danh sách các định dạng video phổ biến từ thiết bị di động (iPhone/Android/Web)
const VIDEO_EXTENSIONS_REGEX = /\.(mp4|mov|webm|m4v|3gp|avi|mkv|flv|wmv|ts|ogv)$/i;
const IMAGE_EXTENSIONS_REGEX = /\.(jpg|jpeg|png|gif|webp|heic|svg|bmp)$/i;

/**
 * Kiểm tra xem một chuỗi URL, đường dẫn hoặc MIME type có phải là video hay không
 * Nhận diện cả MIME type, data URI và đuôi mở rộng file (không phân biệt hoa/thường, hỗ trợ query string)
 */
export function isKaizenVideoUrl(urlOrMime?: string | null): boolean {
  if (!urlOrMime || typeof urlOrMime !== "string") return false;
  const clean = urlOrMime.trim().toLowerCase();
  if (!clean || clean === "undefined" || clean === "null") return false;

  // Kiểm tra MIME type hoặc data URI
  if (
    clean.startsWith("video/") ||
    clean.startsWith("data:video/") ||
    clean.includes("video/mp4") ||
    clean.includes("video/quicktime") ||
    clean.includes("video/webm")
  ) {
    return true;
  }

  // Tách query string (?) và hash (#) trước khi kiểm tra đuôi file
  const pathWithoutQuery = clean.split("?")[0].split("#")[0];
  if (VIDEO_EXTENSIONS_REGEX.test(pathWithoutQuery)) {
    return true;
  }

  return false;
}

/**
 * Kiểm tra xem một chuỗi URL có phải là hình ảnh hay không
 */
export function isKaizenImageUrl(urlOrMime?: string | null): boolean {
  if (!urlOrMime || typeof urlOrMime !== "string") return false;
  const clean = urlOrMime.trim().toLowerCase();
  if (!clean || clean === "undefined" || clean === "null") return false;

  if (
    clean.startsWith("image/") ||
    clean.startsWith("data:image/")
  ) {
    return true;
  }

  const pathWithoutQuery = clean.split("?")[0].split("#")[0];
  if (IMAGE_EXTENSIONS_REGEX.test(pathWithoutQuery)) {
    return true;
  }

  // Nếu không phải video và có định dạng link ảnh thông thường hoặc data URI
  if (!isKaizenVideoUrl(clean) && (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("/cdn-r2/") || clean.startsWith("/"))) {
    return true;
  }

  return false;
}

/**
 * Chuẩn hoá URL video: dọn dẹp ký tự thừa, convert qua R2 proxy nếu cần
 */
export function normalizeKaizenVideoUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim().replace(/^["']|["']$/g, "");
  if (!clean || clean === "undefined" || clean === "null") return "";

  // Hỗ trợ link Google Drive dạng video
  if (clean.includes("drive.google.com")) {
    const matchD = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
      return `https://drive.google.com/uc?export=download&id=${matchD[1]}`;
    }
  }

  return convertToR2Url(clean);
}

export interface KaizenMediaItem {
  id?: string;
  url: string;
  type: "video" | "image";
  phase: "BEFORE" | "AFTER";
  title?: string;
}

export interface KaizenMediaSplit {
  beforeImages: string[];
  afterImages: string[];
  beforeVideos: string[];
  afterVideos: string[];
  primaryBeforeImage: string;
  primaryAfterImage: string;
  primaryBeforeVideo: string;
  primaryAfterVideo: string;
}

/**
 * Bóc tách toàn bộ media của một đề xuất Kaizen thành hình ảnh và video cho cả 2 giai đoạn TRƯỚC và SAU.
 * Hàm dùng chung cho: KaizenDetailModal, FeasibilityApprovalModal, form đăng ký/sửa, và danh sách thẻ.
 */
export function splitKaizenMedia(proposal: any): KaizenMediaSplit {
  const beforeImages: string[] = [];
  const afterImages: string[] = [];
  const beforeVideos: string[] = [];
  const afterVideos: string[] = [];

  const addUnique = (targetList: string[], rawUrl?: string | null) => {
    if (!rawUrl) return;
    const clean = normalizeKaizenVideoUrl(rawUrl);
    if (clean && !targetList.includes(clean)) {
      targetList.push(clean);
    }
  };

  // 1. Đọc từ các field chuyên dụng trực tiếp trên proposal (direct fields)
  const rawBeforeImg = proposal?.before_image_url || proposal?.beforeImageUrl;
  const rawAfterImg = proposal?.after_image_url || proposal?.afterImageUrl;
  const rawBeforeVid = proposal?.before_video_url || proposal?.beforeVideoUrl;
  const rawAfterVid = proposal?.after_video_url || proposal?.afterVideoUrl;

  if (rawBeforeVid && typeof rawBeforeVid === "string") {
    rawBeforeVid.split(",").forEach((u) => {
      if (isKaizenVideoUrl(u)) addUnique(beforeVideos, u);
    });
  }

  if (rawAfterVid && typeof rawAfterVid === "string") {
    rawAfterVid.split(",").forEach((u) => {
      if (isKaizenVideoUrl(u)) addUnique(afterVideos, u);
    });
  }

  // Kiểm tra nếu người dùng vô tình dán video vào field image
  if (rawBeforeImg && typeof rawBeforeImg === "string") {
    rawBeforeImg.split(",").forEach((u) => {
      if (isKaizenVideoUrl(u)) {
        addUnique(beforeVideos, u);
      } else {
        addUnique(beforeImages, u);
      }
    });
  }

  if (rawAfterImg && typeof rawAfterImg === "string") {
    rawAfterImg.split(",").forEach((u) => {
      if (isKaizenVideoUrl(u)) {
        addUnique(afterVideos, u);
      } else {
        addUnique(afterImages, u);
      }
    });
  }

  // 2. Quét qua attachments_json hoặc attachments mảng đối tượng
  let rawAttachments: any[] = [];
  const attSource = proposal?.attachments_json || proposal?.attachmentsJson || proposal?.attachments;
  if (attSource) {
    if (typeof attSource === "string") {
      try {
        const parsed = JSON.parse(attSource);
        if (Array.isArray(parsed)) rawAttachments = parsed;
      } catch (e) {}
    } else if (Array.isArray(attSource)) {
      rawAttachments = attSource;
    }
  }

  // Phân tích từng item trong attachments
  rawAttachments.forEach((item: any, idx: number) => {
    const u = typeof item === "string" ? item : item?.url;
    if (!u || typeof u !== "string") return;

    const isVid =
      item?.type === "video" ||
      item?.type === "video_before" ||
      item?.type === "video_after" ||
      isKaizenVideoUrl(u);

    // Xác định giai đoạn (Phase)
    let isBefore = false;
    let isAfter = false;

    if (typeof item === "object" && item !== null) {
      const typeStr = String(item.type || "").toLowerCase();
      const tagStr = String(item.tag || "").toLowerCase();
      const catStr = String(item.category || "").toLowerCase();
      const titleStr = String(item.title || "").toLowerCase();
      const phaseStr = String(item.phase || "").toLowerCase();

      if (
        typeStr === "video_before" ||
        typeStr === "image_before" ||
        tagStr === "before" ||
        catStr === "before" ||
        phaseStr === "before" ||
        titleStr.includes("trước") ||
        titleStr.includes("truoc") ||
        titleStr.includes("before")
      ) {
        isBefore = true;
      } else if (
        typeStr === "video_after" ||
        typeStr === "image_after" ||
        tagStr === "after" ||
        catStr === "after" ||
        phaseStr === "after" ||
        titleStr.includes("sau") ||
        titleStr.includes("after")
      ) {
        isAfter = true;
      }
    }

    // Nếu chưa rõ phase từ tag/type, kiểm tra trùng với URL trước/sau đã có
    if (!isBefore && !isAfter) {
      const normU = normalizeKaizenVideoUrl(u);
      if (beforeVideos.includes(normU) || beforeImages.includes(normU)) {
        isBefore = true;
      } else if (afterVideos.includes(normU) || afterImages.includes(normU)) {
        isAfter = true;
      } else {
        // Dự phòng heuristic: nếu mảng có 2 video chưa gắn nhãn, video đầu tiên là TRƯỚC, video thứ hai là SAU
        if (isVid && rawAttachments.length === 2 && idx === 0) {
          isBefore = true;
        } else if (isVid && rawAttachments.length === 2 && idx === 1) {
          isAfter = true;
        } else {
          // Mặc định video chưa phân loại nếu chưa có before thì gán before, còn lại gán after
          if (isVid) {
            if (beforeVideos.length === 0) isBefore = true;
            else isAfter = true;
          } else {
            if (beforeImages.length === 0) isBefore = true;
            else isAfter = true;
          }
        }
      }
    }

    if (isVid) {
      if (isBefore) addUnique(beforeVideos, u);
      else if (isAfter) addUnique(afterVideos, u);
      else addUnique(beforeVideos, u);
    } else {
      if (isBefore) addUnique(beforeImages, u);
      else if (isAfter) addUnique(afterImages, u);
      else addUnique(beforeImages, u);
    }
  });

  return {
    beforeImages,
    afterImages,
    beforeVideos,
    afterVideos,
    primaryBeforeImage: beforeImages[0] || "",
    primaryAfterImage: afterImages[0] || "",
    primaryBeforeVideo: beforeVideos[0] || "",
    primaryAfterVideo: afterVideos[0] || "",
  };
}

/**
 * Lấy URL video đơn lẻ hợp lệ theo giai đoạn TRƯỚC hoặc SAU (có fallback qua attachments_json)
 */
export function getValidKaizenVideoUrl(
  rawUrl?: string | null,
  attachmentsJson?: string | null,
  phase?: "BEFORE" | "AFTER",
  otherPhaseFallback?: string | null
): string {
  if (rawUrl && typeof rawUrl === "string" && rawUrl.trim()) {
    const clean = normalizeKaizenVideoUrl(rawUrl);
    if (isKaizenVideoUrl(clean)) {
      return clean;
    }
  }

  // Fallback qua splitKaizenMedia
  const dummyProp = {
    before_video_url: phase === "BEFORE" ? rawUrl : otherPhaseFallback,
    after_video_url: phase === "AFTER" ? rawUrl : otherPhaseFallback,
    attachments_json: attachmentsJson,
  };

  const split = splitKaizenMedia(dummyProp);
  if (phase === "BEFORE") {
    return split.primaryBeforeVideo;
  } else if (phase === "AFTER") {
    return split.primaryAfterVideo;
  }

  return split.primaryBeforeVideo || split.primaryAfterVideo || "";
}

/**
 * Lấy danh sách toàn bộ các video theo giai đoạn
 */
export function getAllKaizenVideoUrls(
  rawUrl?: string | null,
  attachmentsJson?: string | null,
  phase?: "BEFORE" | "AFTER"
): string[] {
  const dummyProp = {
    before_video_url: phase === "BEFORE" ? rawUrl : undefined,
    after_video_url: phase === "AFTER" ? rawUrl : undefined,
    attachments_json: attachmentsJson,
  };

  const split = splitKaizenMedia(dummyProp);
  if (phase === "BEFORE") return split.beforeVideos;
  if (phase === "AFTER") return split.afterVideos;
  return Array.from(new Set([...split.beforeVideos, ...split.afterVideos]));
}
