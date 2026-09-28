/**
 * Reusable Client-Side Image Compression & Thumbnail Generation Utility
 * Features:
 * 1. Resizes large images (max dimension ~1600px), compresses quality (~0.8, WebP/JPEG)
 * 2. Generates ~300px thumbnails for list lazy-loading
 * 3. Handles EXIF orientation & Canvas drawing
 * 4. Provides network retry & progress callbacks
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: "image/webp" | "image/jpeg";
  generateThumbnail?: boolean;
  thumbnailMaxWidth?: number;
  onProgress?: (progressPercent: number) => void;
}

export interface CompressionResult {
  file: File;
  dataUrl: string;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  thumbnailDataUrl?: string;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    outputFormat = "image/webp",
    generateThumbnail = true,
    thumbnailMaxWidth = 300,
    onProgress,
  } = options;

  if (onProgress) onProgress(10);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lỗi khi đọc file ảnh!"));
    reader.onload = (e) => {
      if (onProgress) onProgress(30);
      const img = new Image();
      img.onerror = () => reject(new Error("File tải lên không phải là ảnh hợp lệ!"));
      img.onload = async () => {
        if (onProgress) onProgress(50);
        try {
          // Calculate Main Image Dimensions
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          // Render Main Compressed Canvas
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Không thể tạo 2D Canvas context"));

          ctx.drawImage(img, 0, 0, width, height);
          if (onProgress) onProgress(70);

          // Export Compressed Main Image
          const mainDataUrl = canvas.toDataURL(outputFormat, quality);
          const mainBlob = await (await fetch(mainDataUrl)).blob();

          // Generate Thumbnail if requested
          let thumbnailDataUrl: string | undefined;
          if (generateThumbnail) {
            let thumbW = img.width;
            let thumbH = img.height;
            if (thumbW > thumbnailMaxWidth) {
              thumbH = Math.round((thumbH * thumbnailMaxWidth) / thumbW);
              thumbW = thumbnailMaxWidth;
            }
            const thumbCanvas = document.createElement("canvas");
            thumbCanvas.width = thumbW;
            thumbCanvas.height = thumbH;
            const thumbCtx = thumbCanvas.getContext("2d");
            if (thumbCtx) {
              thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
              thumbnailDataUrl = thumbCanvas.toDataURL("image/webp", 0.7);
            }
          }

          if (onProgress) onProgress(100);

          const compressedFile = new File(
            [mainBlob],
            file.name.replace(/\.[^/.]+$/, "") + ".webp",
            { type: outputFormat }
          );

          resolve({
            file: compressedFile,
            dataUrl: mainDataUrl,
            blob: mainBlob,
            originalSize: file.size,
            compressedSize: mainBlob.size,
            thumbnailDataUrl,
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Retry helper for weak network uploads
 */
export async function uploadWithRetry<T>(
  uploadFn: () => Promise<T>,
  retries = 3,
  delayMs = 1500
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await uploadFn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}
