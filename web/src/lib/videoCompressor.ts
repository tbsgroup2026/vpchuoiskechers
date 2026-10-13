/**
 * Video Compressor Utility for Browser (Client-side)
 * Optimizes videos to save Cloudflare R2 / Cloudinary storage and bandwidth.
 */

export interface CompressionOptions {
  maxSizeMB?: number; // target file size threshold to trigger compression
  maxWidth?: number; // max resolution width (e.g. 1280 for 720p)
  maxHeight?: number; // max resolution height (e.g. 720 for 720p)
  targetBitrate?: number; // bits per second, default 1.2 Mbps
  onProgress?: (percent: number, statusText: string) => void;
  timeoutMs?: number; // max compression time before fallback to original
}

export interface CompressionResult {
  file: File;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  ratio: number; // e.g. 0.4 means reduced by 60%
}

/**
 * Checks if browser supports MediaRecorder for video compression
 */
export function isVideoCompressionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.MediaRecorder !== "undefined" && typeof HTMLCanvasElement !== "undefined";
}

/**
 * Compresses a video file on the client side using HTML5 Video + Canvas + MediaRecorder
 * If compression is not supported, or file is already small, returns original file.
 */
export async function compressVideoClientSide(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeMB = 8, // if <= 8MB, keep original for instant speed
    maxWidth = 1280,
    maxHeight = 720,
    targetBitrate = 1_200_000, // 1.2 Mbps
    onProgress,
    timeoutMs = 30_000,
  } = options;

  const originalSize = file.size;

  // 1. If file is small enough (<= 8MB), no need to compress
  if (originalSize <= maxSizeMB * 1024 * 1024 || !isVideoCompressionSupported()) {
    return {
      file,
      compressed: false,
      originalSize,
      compressedSize: originalSize,
      ratio: 1,
    };
  }

  // 2. Determine best supported mime type
  let mimeType = "video/webm;codecs=vp8,opus";
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "video/webm";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/mp4";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "";
      }
    }
  }

  if (!mimeType) {
    return {
      file,
      compressed: false,
      originalSize,
      compressedSize: originalSize,
      ratio: 1,
    };
  }

  return new Promise<CompressionResult>((resolve) => {
    let isFinished = false;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    // Set safety timeout
    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        cleanUp();
        resolve({
          file,
          compressed: false,
          originalSize,
          compressedSize: originalSize,
          ratio: 1,
        });
      }
    }, timeoutMs);

    const cleanUp = () => {
      clearTimeout(timer);
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
        URL.revokeObjectURL(url);
      } catch (e) {}
    };

    video.onloadedmetadata = () => {
      const origW = video.videoWidth || 1280;
      const origH = video.videoHeight || 720;
      const duration = video.duration || 0;

      // If duration is too long (> 3 minutes), skip client compression to avoid locking browser
      if (duration > 180 || duration <= 0) {
        if (!isFinished) {
          isFinished = true;
          cleanUp();
          resolve({ file, compressed: false, originalSize, compressedSize: originalSize, ratio: 1 });
        }
        return;
      }

      // Calculate target resolution maintaining aspect ratio
      let targetW = origW;
      let targetH = origH;
      if (origW > maxWidth || origH > maxHeight) {
        const ratio = Math.min(maxWidth / origW, maxHeight / origH);
        targetW = Math.round((origW * ratio) / 2) * 2; // ensure even number
        targetH = Math.round((origH * ratio) / 2) * 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        if (!isFinished) {
          isFinished = true;
          cleanUp();
          resolve({ file, compressed: false, originalSize, compressedSize: originalSize, ratio: 1 });
        }
        return;
      }

      // Capture canvas stream at 24fps
      const stream = canvas.captureStream ? canvas.captureStream(24) : null;
      if (!stream) {
        if (!isFinished) {
          isFinished = true;
          cleanUp();
          resolve({ file, compressed: false, originalSize, compressedSize: originalSize, ratio: 1 });
        }
        return;
      }

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: targetBitrate,
        });
      } catch (err) {
        if (!isFinished) {
          isFinished = true;
          cleanUp();
          resolve({ file, compressed: false, originalSize, compressedSize: originalSize, ratio: 1 });
        }
        return;
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        if (isFinished) return;
        isFinished = true;
        cleanUp();

        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const compressedBlob = new Blob(chunks, { type: mimeType });
        const compressedSize = compressedBlob.size;

        // Only use compressed version if it actually reduced size
        if (compressedSize < originalSize && compressedSize > 1024) {
          const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || "video";
          const compressedFile = new File([compressedBlob], `${baseName}_optimized.${ext}`, {
            type: mimeType,
          });

          if (onProgress) {
            onProgress(100, `Nén thành công (${(compressedSize / 1024 / 1024).toFixed(1)}MB / ${(originalSize / 1024 / 1024).toFixed(1)}MB)`);
          }

          resolve({
            file: compressedFile,
            compressed: true,
            originalSize,
            compressedSize,
            ratio: compressedSize / originalSize,
          });
        } else {
          // Compressed is larger or invalid, keep original
          resolve({
            file,
            compressed: false,
            originalSize,
            compressedSize: originalSize,
            ratio: 1,
          });
        }
      };

      // Speed up video playback (2x or 3x) to compress faster
      video.playbackRate = 2.5;

      recorder.start(100);

      const renderFrame = () => {
        if (video.paused || video.ended || isFinished) return;
        ctx.drawImage(video, 0, 0, targetW, targetH);
        if (duration > 0 && onProgress) {
          const pct = Math.min(95, Math.round((video.currentTime / duration) * 100));
          onProgress(pct, `Đang tối ưu dung lượng clip: ${pct}%`);
        }
        requestAnimationFrame(renderFrame);
      };

      video.onplay = () => {
        renderFrame();
      };

      video.onended = () => {
        try {
          if (recorder.state === "recording") {
            recorder.stop();
          }
        } catch (e) {}
      };

      video.onerror = () => {
        if (!isFinished) {
          isFinished = true;
          cleanUp();
          resolve({ file, compressed: false, originalSize, compressedSize: originalSize, ratio: 1 });
        }
      };

      video.play().catch(() => {
        // Autoplay failed or blocked
        if (!isFinished) {
          isFinished = true;
          cleanUp();
          resolve({ file, compressed: false, originalSize, compressedSize: originalSize, ratio: 1 });
        }
      });
    };

    video.onerror = () => {
      if (!isFinished) {
        isFinished = true;
        cleanUp();
        resolve({ file, compressed: false, originalSize, compressedSize: originalSize, ratio: 1 });
      }
    };
  });
}
