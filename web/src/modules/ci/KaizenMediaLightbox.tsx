"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  IconX,
  IconZoomIn,
  IconZoomOut,
  IconRotate,
  IconChevronLeft,
  IconChevronRight,
  IconPhoto,
  IconVideo,
  IconArrowsMaximize,
  IconAlertCircle,
} from "@tabler/icons-react";

export interface KaizenImageLightboxProps {
  isOpen: boolean;
  initialType?: "BEFORE" | "AFTER";
  beforeUrl?: string | null;
  afterUrl?: string | null;
  onClose: () => void;
}

export function KaizenImageLightbox({
  isOpen,
  initialType = "BEFORE",
  beforeUrl,
  afterUrl,
  onClose,
}: KaizenImageLightboxProps) {
  const [activeType, setActiveType] = useState<"BEFORE" | "AFTER">(initialType);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgError, setImgError] = useState<boolean>(false);

  // Touch pinch tracking
  const touchStartDistRef = useRef<number | null>(null);
  const initialZoomOnPinchRef = useRef<number>(1);
  const touchSwipeStartRef = useRef<{ x: number; y: number } | null>(null);

  // Sync initial type when opened
  useEffect(() => {
    if (isOpen) {
      if (initialType === "AFTER" && afterUrl) {
        setActiveType("AFTER");
      } else if (beforeUrl) {
        setActiveType("BEFORE");
      } else if (afterUrl) {
        setActiveType("AFTER");
      } else {
        setActiveType("BEFORE");
      }
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImgError(false);
    }
  }, [isOpen, initialType, beforeUrl, afterUrl]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const hasBoth = Boolean(beforeUrl && afterUrl);
  const currentUrl = activeType === "BEFORE" ? beforeUrl : afterUrl;

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(5, Math.round((prev + 0.3) * 10) / 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(0.5, Math.round((prev - 0.3) * 10) / 10);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const toggleType = useCallback(() => {
    if (!hasBoth) return;
    setActiveType((prev) => (prev === "BEFORE" ? "AFTER" : "BEFORE"));
    resetZoom();
    setImgError(false);
  }, [hasBoth, resetZoom]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (hasBoth && activeType === "AFTER") {
          setActiveType("BEFORE");
          resetZoom();
          setImgError(false);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (hasBoth && activeType === "BEFORE") {
          setActiveType("AFTER");
          resetZoom();
          setImgError(false);
        }
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0" || e.key === "r" || e.key === "R") {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, hasBoth, activeType, handleZoomIn, handleZoomOut, resetZoom]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Mouse dragging when zoomed > 1
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile (pinch to zoom & swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      initialZoomOnPinchRef.current = zoom;
    } else if (e.touches.length === 1) {
      touchSwipeStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      // Pinching
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      const newZoom = Math.min(5, Math.max(0.5, initialZoomOnPinchRef.current * ratio));
      setZoom(Math.round(newZoom * 10) / 10);
    } else if (e.touches.length === 1 && zoom > 1 && isDragging) {
      // Panning
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchStartDistRef.current = null;
    setIsDragging(false);

    // Swipe to toggle Before / After when zoom = 1
    if (zoom <= 1 && touchSwipeStartRef.current && e.changedTouches.length === 1 && hasBoth) {
      const deltaX = e.changedTouches[0].clientX - touchSwipeStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchSwipeStartRef.current.y;
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0 && activeType === "BEFORE") {
          setActiveType("AFTER");
          resetZoom();
        } else if (deltaX > 0 && activeType === "AFTER") {
          setActiveType("BEFORE");
          resetZoom();
        }
      }
    }
    touchSwipeStartRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Phóng to hình ảnh so sánh Kaizen"
      className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex flex-col items-center justify-between select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onWheel={handleWheel}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Bar Header */}
      <div className="w-full max-w-6xl px-4 py-3 flex items-center justify-between text-white z-20">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
              activeType === "BEFORE"
                ? "bg-rose-600 text-white border border-rose-400"
                : "bg-emerald-600 text-white border border-emerald-400"
            }`}
          >
            <span>{activeType === "BEFORE" ? "🔴 TRƯỚC CẢI TIẾN" : "🟢 SAU CẢI TIẾN"}</span>
          </span>

          {hasBoth && (
            <div className="hidden sm:flex items-center bg-white/10 rounded-xl p-0.5 border border-white/20">
              <button
                type="button"
                onClick={() => {
                  setActiveType("BEFORE");
                  resetZoom();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeType === "BEFORE"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveType("AFTER");
                  resetZoom();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeType === "AFTER"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Sau
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons: Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng lightbox"
            className="p-2 rounded-xl bg-white/15 hover:bg-rose-600/80 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-white/20 shadow-md"
          >
            <IconX size={18} />
            <span className="hidden sm:inline">Đóng (Esc)</span>
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Left */}
        {hasBoth && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleType();
            }}
            aria-label="Xem ảnh trước/sau (Phím ←)"
            className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-xl backdrop-blur-sm hover:scale-105 active:scale-95"
            title="Chuyển ảnh Trước ⇄ Sau (Phím ←/→)"
          >
            <IconChevronLeft size={26} />
          </button>
        )}

        {/* Image / Error Stage */}
        {imgError || !currentUrl ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/10 border border-white/20 text-white gap-3 max-w-md text-center">
            <IconAlertCircle size={40} className="text-amber-400" />
            <div className="font-bold text-sm">
              {!currentUrl ? "Chưa có hình ảnh" : "Không tải được ảnh"}
            </div>
            <p className="text-xs text-white/70">
              Đường dẫn ảnh có thể đã bị thay đổi hoặc chưa có tệp đính kèm.
            </p>
          </div>
        ) : (
          <div
            className={`transition-transform duration-100 ease-out select-none ${
              isDragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-zoom-in"
            }`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (zoom === 1) {
                handleZoomIn();
              }
            }}
          >
            <img
              src={currentUrl}
              alt={activeType === "BEFORE" ? "Trước cải tiến" : "Sau cải tiến"}
              onError={() => setImgError(true)}
              className="max-h-[78vh] sm:max-h-[82vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-xl shadow-2xl pointer-events-none"
              draggable={false}
            />
          </div>
        )}

        {/* Navigation Arrow Right */}
        {hasBoth && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleType();
            }}
            aria-label="Xem ảnh sau/trước (Phím →)"
            className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-xl backdrop-blur-sm hover:scale-105 active:scale-95"
            title="Chuyển ảnh Trước ⇄ Sau (Phím ←/→)"
          >
            <IconChevronRight size={26} />
          </button>
        )}
      </div>

      {/* Floating Toolbar Bottom */}
      <div className="px-4 py-3 z-20 flex items-center justify-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/70 border border-white/20 backdrop-blur-md shadow-2xl text-white">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            aria-label="Thu nhỏ ảnh"
            className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 transition-all cursor-pointer"
            title="Thu nhỏ (-)"
          >
            <IconZoomOut size={18} />
          </button>

          <span className="text-xs font-mono font-bold px-2 min-w-[50px] text-center text-white/90">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            aria-label="Phóng to ảnh"
            className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 transition-all cursor-pointer"
            title="Phóng to (+)"
          >
            <IconZoomIn size={18} />
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          <button
            type="button"
            onClick={resetZoom}
            aria-label="Đặt lại kích thước ban đầu"
            className="px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-white/20 transition-all cursor-pointer flex items-center gap-1 text-white/90"
            title="Đặt lại (Phím 0 hoặc R)"
          >
            <IconRotate size={14} />
            <span>Đặt lại</span>
          </button>

          {hasBoth && (
            <>
              <div className="w-px h-4 bg-white/20 mx-1" />
              <button
                type="button"
                onClick={toggleType}
                aria-label="Chuyển đổi ảnh Trước/Sau"
                className="px-2.5 py-1 rounded-lg text-xs font-black hover:bg-white/20 transition-all cursor-pointer flex items-center gap-1 text-amber-300"
                title="Chuyển Trước ⇄ Sau (Phím ← / →)"
              >
                <span>Chuyển {activeType === "BEFORE" ? "Sau ➔" : "Trước ➔"}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export interface KaizenVideoLightboxProps {
  isOpen: boolean;
  initialType?: "BEFORE" | "AFTER";
  beforeVideoUrl?: string | null;
  afterVideoUrl?: string | null;
  onClose: () => void;
}

export function KaizenVideoLightbox({
  isOpen,
  initialType = "BEFORE",
  beforeVideoUrl,
  afterVideoUrl,
  onClose,
}: KaizenVideoLightboxProps) {
  const [activeType, setActiveType] = useState<"BEFORE" | "AFTER">(initialType);
  const [videoError, setVideoError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialType === "AFTER" && afterVideoUrl) {
        setActiveType("AFTER");
      } else if (beforeVideoUrl) {
        setActiveType("BEFORE");
      } else if (afterVideoUrl) {
        setActiveType("AFTER");
      } else {
        setActiveType("BEFORE");
      }
      setVideoError(false);
    }
  }, [isOpen, initialType, beforeVideoUrl, afterVideoUrl]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const hasBoth = Boolean(beforeVideoUrl && afterVideoUrl);
  const currentVideoUrl = activeType === "BEFORE" ? beforeVideoUrl : afterVideoUrl;

  const toggleType = useCallback(() => {
    if (!hasBoth) return;
    setActiveType((prev) => (prev === "BEFORE" ? "AFTER" : "BEFORE"));
    setVideoError(false);
  }, [hasBoth]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && hasBoth && activeType === "AFTER") {
        e.preventDefault();
        setActiveType("BEFORE");
      } else if (e.key === "ArrowRight" && hasBoth && activeType === "BEFORE") {
        e.preventDefault();
        setActiveType("AFTER");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, hasBoth, activeType]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Phóng to clip so sánh Kaizen"
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Header */}
      <div className="w-full max-w-6xl px-4 py-3 flex items-center justify-between text-white z-20">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
              activeType === "BEFORE"
                ? "bg-rose-600 text-white border border-rose-400"
                : "bg-emerald-600 text-white border border-emerald-400"
            }`}
          >
            <span>{activeType === "BEFORE" ? "🔴 CLIP TRƯỚC CẢI TIẾN" : "🟢 CLIP SAU CẢI TIẾN"}</span>
          </span>

          {hasBoth && (
            <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/20">
              <button
                type="button"
                onClick={() => setActiveType("BEFORE")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeType === "BEFORE"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setActiveType("AFTER")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeType === "AFTER"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Sau
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng xem video"
          className="p-2 rounded-xl bg-white/15 hover:bg-rose-600/80 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-white/20 shadow-md"
        >
          <IconX size={18} />
          <span className="hidden sm:inline">Đóng (Esc)</span>
        </button>
      </div>

      {/* Main Video Viewport */}
      <div
        className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {hasBoth && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleType();
            }}
            aria-label="Xem clip trước/sau (Phím ←)"
            className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-xl backdrop-blur-sm hover:scale-105 active:scale-95"
            title="Chuyển Clip Trước ⇄ Sau"
          >
            <IconChevronLeft size={26} />
          </button>
        )}

        {videoError || !currentVideoUrl ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/10 border border-white/20 text-white gap-3 max-w-md text-center">
            <IconAlertCircle size={40} className="text-amber-400" />
            <div className="font-bold text-sm">
              {!currentVideoUrl ? "Chưa có clip" : "Không tải được clip"}
            </div>
            <p className="text-xs text-white/70">
              Tệp video có thể chưa được tải lên hoặc định dạng không được trình duyệt hỗ trợ.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-4xl max-h-[80vh] flex items-center justify-center">
            <video
              ref={videoRef}
              key={currentVideoUrl}
              src={currentVideoUrl}
              controls
              playsInline
              autoPlay
              preload="metadata"
              onError={() => setVideoError(true)}
              className="max-h-[78vh] sm:max-h-[82vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl bg-black border border-white/10"
            />
          </div>
        )}

        {hasBoth && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleType();
            }}
            aria-label="Xem clip sau/trước (Phím →)"
            className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-xl backdrop-blur-sm hover:scale-105 active:scale-95"
            title="Chuyển Clip Trước ⇄ Sau"
          >
            <IconChevronRight size={26} />
          </button>
        )}
      </div>

      {/* Bottom Switch Hint */}
      {hasBoth && (
        <div className="px-4 py-3 z-20 flex items-center justify-center gap-2 mb-2">
          <button
            type="button"
            onClick={toggleType}
            className="px-4 py-2 rounded-2xl bg-black/70 border border-white/20 backdrop-blur-md text-xs font-black text-amber-300 hover:bg-black/90 transition shadow-2xl flex items-center gap-1.5 cursor-pointer"
          >
            <span>Chuyển xem: {activeType === "BEFORE" ? "Clip Sau cải tiến ➔" : "Clip Trước cải tiến ➔"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
