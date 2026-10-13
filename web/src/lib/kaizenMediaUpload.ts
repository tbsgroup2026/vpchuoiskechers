/**
 * Kaizen Media Upload Helper
 * Features:
 * 1. Client-side video compression (reduces size 50-70% to save Cloudflare storage & bandwidth)
 * 2. Uploads directly to Cloudflare R2 (/api/ci-kaizen/upload-media) with real % progress
 * 3. Automatic fallback to Cloudinary if R2 is temporarily unreachable
 */

import { compressVideoClientSide } from "./videoCompressor";

export interface MediaUploadOptions {
  category?: string;
  maxSizeBytes?: number;
  onProgress?: (percent: number) => void;
  onStatusChange?: (status: string) => void;
  skipCompression?: boolean;
}

/**
 * Upload a media file directly to Cloudflare R2 (/api/ci-kaizen/upload-media)
 */
async function uploadToCloudflareR2(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.url) {
            resolve(res.url);
          } else {
            reject(new Error(res.error || "Không nhận được URL từ Cloudflare R2."));
          }
        } catch (e: any) {
          reject(new Error("Lỗi phân tích phản hồi Cloudflare R2: " + e.message));
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error || `HTTP ${xhr.status} từ Cloudflare R2`));
        } catch {
          reject(new Error(`Tải lên Cloudflare R2 thất bại (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Lỗi mạng khi tải lên Cloudflare"));
    };

    xhr.open("POST", "/api/ci-kaizen/upload-media", true);
    xhr.send(formData);
  });
}

/**
 * Fallback upload to Cloudinary
 */
async function uploadToCloudinaryFallback(
  file: File,
  fileType: "image" | "video",
  category?: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const cloudName = "dwl2xtbqa";
  const uploadPreset = "vpchuoisk";
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${fileType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "vpchuoiskechers");
    if (category) {
      formData.append("context", `category=${category}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url) {
            resolve(data.secure_url);
          } else {
            reject(new Error("Không nhận được URL từ dịch vụ lưu trữ."));
          }
        } catch (e: any) {
          reject(new Error("Lỗi đọc phản hồi Cloudinary: " + e.message));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error?.message || `Lỗi tải tệp Cloudinary (${xhr.status})`));
        } catch {
          reject(new Error(`Tải tệp Cloudinary thất bại (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Lỗi kết nối khi tải tệp. Vui lòng kiểm tra lại mạng!"));
    };

    xhr.open("POST", uploadUrl, true);
    xhr.send(formData);
  });
}

/**
 * Primary entry point for uploading Kaizen media
 */
export async function uploadKaizenMediaWithProgress(
  file: File,
  fileType: "image" | "video",
  options: MediaUploadOptions = {}
): Promise<string> {
  const {
    category = fileType === "video" ? "kaizen_video" : "kaizen_image",
    maxSizeBytes = fileType === "video" ? 45 * 1024 * 1024 : 15 * 1024 * 1024,
    onProgress,
    onStatusChange,
    skipCompression = false,
  } = options;

  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    throw new Error(`Dung lượng tệp (${(file.size / 1024 / 1024).toFixed(1)}MB) vượt quá mức cho phép (${maxMb}MB). Vui lòng chọn clip ngắn hơn hoặc dưới ${maxMb}MB!`);
  }

  let fileToUpload = file;

  // 1. If it's a video, attempt client-side compression to save Cloudflare storage
  if (fileType === "video" && !skipCompression && file.size > 5 * 1024 * 1024) {
    if (onStatusChange) onStatusChange("Đang tối ưu & nén clip...");
    try {
      const result = await compressVideoClientSide(file, {
        maxSizeMB: 5,
        maxWidth: 1280,
        maxHeight: 720,
        targetBitrate: 1_200_000,
        onProgress: (pct, msg) => {
          if (onStatusChange) onStatusChange(msg);
          // Scale compression progress to 0-40% of total upload
          if (onProgress) onProgress(Math.round(pct * 0.4));
        },
      });

      if (result.compressed) {
        fileToUpload = result.file;
        console.log(`[Video Compress] Reduced ${(result.originalSize / 1024 / 1024).toFixed(1)}MB -> ${(result.compressedSize / 1024 / 1024).toFixed(1)}MB`);
      }
    } catch (e) {
      console.warn("[Video Compress Warning] Skipping compression:", e);
    }
  }

  // 2. Upload to Cloudflare R2 first
  if (onStatusChange) onStatusChange("Đang lưu vào Cloudflare...");

  try {
    const url = await uploadToCloudflareR2(fileToUpload, (pct) => {
      // Scale upload progress from 40-100% (or 0-100% if no compression)
      const basePct = fileType === "video" && !skipCompression && file.size > 5 * 1024 * 1024 ? 40 : 0;
      const totalPct = basePct + Math.round(pct * ((100 - basePct) / 100));
      if (onProgress) onProgress(totalPct);
    });

    if (onStatusChange) onStatusChange("Tải lên hoàn tất!");
    return url;
  } catch (r2Error: any) {
    console.warn("[R2 Upload Warning] Cloudflare upload failed, attempting Cloudinary fallback:", r2Error);

    // 3. Fallback to Cloudinary if R2 fails
    if (onStatusChange) onStatusChange("Đang kết nối kho lưu trữ dự phòng...");
    const url = await uploadToCloudinaryFallback(fileToUpload, fileType, category, (pct) => {
      if (onProgress) onProgress(pct);
    });

    if (onStatusChange) onStatusChange("Tải lên hoàn tất!");
    return url;
  }
}
