/**
 * Client-side Image Compression & R2 Upload Utility
 * Optimized for Mobile Pilot (Max 1600px, quality 0.8, < 1.5MB, progress tracking & retries)
 */

export interface UploadedFileResult {
  id: string;
  originalName: string;
  name: string;
  mimeType: string;
  type: string;
  size: number;
  r2Key: string;
  fileType: string;
  url: string;
  fileUrl: string;
  dataUrl: string;
}

export interface UploadProgressOptions {
  onProgress?: (percent: number) => void;
  retries?: number;
  retryDelayMs?: number;
  tripId?: string;
}

/**
 * Compress an image file using HTML Canvas before upload.
 * Respects EXIF orientation, caps resolution to 1600x1600, quality 0.8, target size < 1.5MB.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8
): Promise<File> {
  // If not an image or SVG/GIF, return original file
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
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

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw with smoothing for high fidelity
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const tryCompress = (q: number): Promise<Blob | null> =>
          new Promise((res) => canvas.toBlob((b) => res(b), 'image/jpeg', q));

        let currentQuality = quality;
        let blob = await tryCompress(currentQuality);

        // Target: size < 1.5MB (1,572,864 bytes)
        const MAX_BYTES = 1.5 * 1024 * 1024;
        while (blob && blob.size > MAX_BYTES && currentQuality > 0.5) {
          currentQuality -= 0.1;
          blob = await tryCompress(currentQuality);
        }

        if (!blob) {
          resolve(file);
          return;
        }

        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Compatibility wrapper for Cloudinary & legacy callers
 */
export async function compressImage(
  file: File,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<{ file: File }> {
  const compressed = await compressImageFile(
    file,
    options?.maxWidth || 1600,
    options?.maxHeight || 1600,
    options?.quality || 0.8
  );
  return { file: compressed };
}

/**
 * Upload a file (compressed client-side) to R2 via /api/files/upload
 * Includes real progress tracking and retry capability for spotty mobile networks.
 */
export async function uploadFileToR2(
  file: File,
  fileType: 'ATTACHMENT' | 'INVOICE' | 'SIGNED_TRAVEL_PAPER' | 'TASK_DOC' | 'KAIZEN_IMG' = 'ATTACHMENT',
  optionsOrTripId?: string | UploadProgressOptions
): Promise<UploadedFileResult> {
  const options: UploadProgressOptions =
    typeof optionsOrTripId === 'string'
      ? { tripId: optionsOrTripId }
      : optionsOrTripId || {};
  const { onProgress, retries = 3, retryDelayMs = 1500, tripId } = options;

  if (onProgress) onProgress(10);
  const processedFile = await compressImageFile(file, 1600, 1600, 0.8);
  if (onProgress) onProgress(25);

  let attempt = 0;
  let lastError: any = null;

  while (attempt < retries) {
    attempt++;
    try {
      return await new Promise<UploadedFileResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/files/upload', true);

        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('tbs_token') || sessionStorage.getItem('tbs_token') || ''
            : '';
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            // Scale progress from 25% to 95%
            const pct = Math.round(25 + (e.loaded / e.total) * 70);
            onProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.success && res.data) {
                if (onProgress) onProgress(100);
                resolve(res.data);
              } else {
                reject(new Error(res.error || 'Upload không thành công'));
              }
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Server phản hồi lỗi HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Mạng chập chờn hoặc mất kết nối'));
        xhr.ontimeout = () => reject(new Error('Hết thời gian chờ (Timeout)'));
        xhr.timeout = 45000; // 45 seconds

        const formData = new FormData();
        formData.append('file', processedFile);
        formData.append('fileType', fileType);
        if (tripId) {
          formData.append('tripId', tripId);
        }

        xhr.send(formData);
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`Lần upload ${attempt}/${retries} thất bại:`, err.message);
      if (attempt < retries) {
        if (onProgress) onProgress(Math.max(10, Math.round(20 * (attempt / retries))));
        await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Upload file thất bại sau nhiều lần thử lại');
}
