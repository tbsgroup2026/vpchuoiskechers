/**
 * Client-side Image Compression & R2 Upload Utility
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

/**
 * Compress an image file using HTML Canvas before upload
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<File> {
  // If not an image, return original file
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
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

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
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
    options?.maxWidth,
    options?.maxHeight,
    options?.quality
  );
  return { file: compressed };
}

/**
 * Upload a file (compressed if image) to R2 via /api/files/upload
 */
export async function uploadFileToR2(
  file: File,
  fileType: 'ATTACHMENT' | 'INVOICE' | 'SIGNED_TRAVEL_PAPER',
  tripId?: string
): Promise<UploadedFileResult> {
  const processedFile = await compressImageFile(file);

  const formData = new FormData();
  formData.append('file', processedFile);
  formData.append('fileType', fileType);
  if (tripId) {
    formData.append('tripId', tripId);
  }

  const res = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Upload file thất bại');
  }

  return data.data;
}
