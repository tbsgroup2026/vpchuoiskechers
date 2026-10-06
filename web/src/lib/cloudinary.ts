/**
 * Cloudinary Utility Module - VP Chuỗi Skechers - TBS Group
 * Handles site-isolated folders, unique public_id generation, and cache-busting versioning.
 */

export const CLOUDINARY_CLOUD_NAME = "dwl2xtbqa";
export const CLOUDINARY_PRESET = "vpchuoisk";

export interface CloudinaryUploadOptions {
  category?: string;
  fileType?: "image" | "video" | "auto";
  folder?: string;
}

/**
 * Automatically determine the isolated Cloudinary folder & prefix for vpchuoiskechers
 */
export function getSiteFolder(): { folder: string; prefix: string } {
  return { folder: "vpchuoiskechers", prefix: "sk" };
}

/**
 * Generate a 100% unique public_id with site prefix to prevent Cloudinary CDN & browser overwrite caching
 */
export function generateUniquePublicId(category: string = "img", fileName: string = "file", sitePrefix?: string): string {
  const { prefix } = sitePrefix ? { prefix: sitePrefix } : getSiteFolder();
  const timeTag = Date.now();
  const randTag = Math.random().toString(36).substring(2, 7);
  const cleanName = fileName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase()
    .slice(0, 20);
  return `${prefix}_${category}_${timeTag}_${randTag}_${cleanName}`;
}

/**
 * Helper to append cache-busting version query string (?v=<timestamp>) to image URLs
 */
export function formatCloudinaryUrl(url: string | undefined | null, versionTag?: string | number): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.startsWith("/")) {
    return trimmed;
  }

  const tag = versionTag ? String(versionTag) : String(Date.now());
  if (trimmed.includes("?v=") || trimmed.includes("&v=") || trimmed.includes("?t=") || trimmed.includes("&t=")) {
    return trimmed;
  }

  const separator = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${separator}v=${tag}`;
}

/**
 * Generate a Cloudinary URL resized for thumbnails (width: 480, height: 320, crop: fill, auto format & quality)
 */
export function getCloudinaryThumbnail(url: string | undefined | null, width: number = 480): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed.includes("res.cloudinary.com")) return trimmed;
  // Insert transformation parameters before the version or folder name
  // Example original: https://res.cloudinary.com/dwl2xtbqa/image/upload/v12345/sk_img...
  // Example result:   https://res.cloudinary.com/dwl2xtbqa/image/upload/c_fill,w_480,h_320,f_auto,q_auto/v12345/sk_img...
  return trimmed.replace("/upload/", `/upload/c_fill,w_${width},h_${Math.round(width * 2/3)},f_auto,q_auto/`);
}

import { compressImage } from "./imageCompressor";

/**
 * Upload a file directly to Cloudinary with unique public_id and folder isolation for SKECHERS
 */
export async function uploadCloudinaryFile(
  file: File | string,
  options: CloudinaryUploadOptions = {}
): Promise<{ secure_url: string; public_id: string; folder: string }> {
  const { category = "general", fileType = "image" } = options;

  let uploadPayload: File | string = file;

  // Auto-compress large image files on client before upload
  if (typeof file !== "string" && file.type && file.type.startsWith("image/")) {
    try {
      const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
      uploadPayload = compressed.file;
    } catch (err) {
      console.warn("Client compression fallback, uploading original:", err);
    }
  }

  const siteInfo = getSiteFolder();
  const targetFolder = options.folder || siteInfo.folder;

  const fileName = typeof uploadPayload === "string" ? "dataurl" : uploadPayload.name;
  const uniquePublicId = generateUniquePublicId(category, fileName, siteInfo.prefix);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${fileType === "video" ? "video" : "image"}/upload`;

  // Attempt 1: With folder & custom public_id
  const formData = new FormData();
  formData.append("file", uploadPayload);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", targetFolder);
  formData.append("public_id", uniquePublicId);

  let res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  let data = await res.json();

  // Attempt 2: If failed due to public_id restriction in unsigned preset, retry without public_id
  if (!res.ok && (data.error?.message?.includes("public_id") || data.error?.message?.includes("preset"))) {
    const fallbackFormData = new FormData();
    fallbackFormData.append("file", file);
    fallbackFormData.append("upload_preset", CLOUDINARY_PRESET);

    res = await fetch(endpoint, {
      method: "POST",
      body: fallbackFormData,
    });
    data = await res.json();
  }

  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Không thể tải tệp lên Cloudinary!");
  }

  const versionedUrl = formatCloudinaryUrl(data.secure_url, data.version || Date.now());

  return {
    secure_url: versionedUrl,
    public_id: data.public_id || uniquePublicId,
    folder: targetFolder,
  };
}
