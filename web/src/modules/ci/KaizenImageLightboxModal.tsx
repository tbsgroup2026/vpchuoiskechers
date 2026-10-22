"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  IconX,
  IconZoomIn,
  IconZoomOut,
  IconRotate,
  IconDownload,
  IconExternalLink,
  IconChevronLeft,
  IconChevronRight,
  IconArrowsMaximize,
  IconPhoto,
} from "@tabler/icons-react";

export interface LightboxImageItem {
  url: string;
  tag?: "BEFORE" | "AFTER" | string;
  title?: string;
  description?: string;
}

export interface KaizenImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: LightboxImageItem[];
  initialIndex?: number;
  proposalTitle?: string;
  proposalCode?: string | number;
}

export default function KaizenImageLightboxModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  proposalTitle,
  proposalCode,
}: KaizenImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync initialIndex when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      const validIdx = Math.max(0, Math.min(initialIndex, (images?.length || 1) - 1));
      setCurrentIndex(validIdx);
      resetTransform();
    }
  }, [isOpen, initialIndex, images?.length]);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setImageError(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(4, Math.round((prev + 0.3) * 10) / 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(0.5, Math.round((prev - 0.3) * 10) / 10);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handlePrev = useCallback(() => {
    if (!images || images.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetTransform();
  }, [images, resetTransform]);

  const handleNext = useCallback(() => {
    if (!images || images.length <= 1) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetTransform();
  }, [images, resetTransform]);

  // Keyboard navigation & controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetTransform();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRotate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, handleZoomIn, handleZoomOut, resetTransform, handleRotate]);

  // Prevent background scrolling while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const swipeStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    } else if (e.touches.length === 1) {
      // Chưa phóng to: ghi nhận điểm bắt đầu để vuốt chuyển ảnh
      swipeStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoom <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    if (swipeStartX.current !== null && zoom <= 1) {
      const dx = (e.changedTouches[0]?.clientX ?? swipeStartX.current) - swipeStartX.current;
      if (dx > 50) handlePrev();
      else if (dx < -50) handleNext();
    }
    swipeStartX.current = null;
  };

  // Double click toggles between 1x and 2x
  const handleDoubleClick = () => {
    if (zoom > 1) {
      resetTransform();
    } else {
      setZoom(2);
    }
  };

  const currentItem = images?.[currentIndex];
  const hasMultipleImages = images && images.length > 1;

  // Find Before / After image indices for quick-switch pills
  const beforeIdx = images?.findIndex((img) => String(img.tag).toUpperCase() === "BEFORE");
  const afterIdx = images?.findIndex((img) => String(img.tag).toUpperCase() === "AFTER");

  const handleDownload = async () => {
    if (!currentItem?.url) return;
    try {
      const response = await fetch(currentItem.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const ext = currentItem.url.split(".").pop()?.split(/[?#]/)[0] || "jpg";
      const tagStr = currentItem.tag ? `-${currentItem.tag.toLowerCase()}` : "";
      const codeStr = proposalCode ? `-${proposalCode}` : "";
      a.download = `kaizen${codeStr}${tagStr}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentItem.url, "_blank");
    }
  };

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md text-white select-none animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 1. TOP HEADER TOOLBAR */}
      <div className="shrink-0 h-16 px-3 sm:px-6 bg-slate-900/80 border-b border-white/10 flex items-center justify-between gap-3 z-20 backdrop-blur-md">
        {/* Left: Proposal info & tags */}
        <div className="flex items-center gap-2.5 min-w-0 max-w-[45vw] sm:max-w-[40vw]">
          {proposalCode && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-black shrink-0">
              #{proposalCode}
            </span>
          )}

          {currentItem?.tag && (
            <span
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider shrink-0 border ${
                currentItem.tag.toUpperCase() === "BEFORE"
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : currentItem.tag.toUpperCase() === "AFTER"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-blue-500/20 text-blue-300 border-blue-500/40"
              }`}
            >
              {currentItem.tag.toUpperCase() === "BEFORE"
                ? "ẢNH TRƯỚC"
                : currentItem.tag.toUpperCase() === "AFTER"
                ? "ẢNH SAU"
                : currentItem.tag}
            </span>
          )}

          {proposalTitle && (
            <span
              className="text-xs sm:text-sm font-bold text-slate-200 truncate hidden md:inline-block"
              title={proposalTitle}
            >
              {proposalTitle}
            </span>
          )}

          {hasMultipleImages && (
            <span className="text-xs text-slate-400 font-mono shrink-0">
              ({currentIndex + 1}/{images.length})
            </span>
          )}
        </div>

        {/* Center: Quick switcher for "Trước" and "Sau" */}
        {hasMultipleImages && (beforeIdx !== -1 || afterIdx !== -1) && (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-white/10">
            {beforeIdx !== -1 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(beforeIdx);
                  resetTransform();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentIndex === beforeIdx
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-300" />
                <span>Ảnh Trước</span>
              </button>
            )}
            {afterIdx !== -1 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(afterIdx);
                  resetTransform();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentIndex === afterIdx
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <span>Ảnh Sau</span>
              </button>
            )}
          </div>
        )}

        {/* Right: Zoom & action controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-white/10">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Thu nhỏ (-)"
            >
              <IconZoomOut size={16} />
            </button>
            <button
              type="button"
              onClick={resetTransform}
              className="px-2 py-1 text-[11px] font-mono font-bold hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer min-w-[50px] text-center"
              title="Đặt lại tỉ lệ (0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Phóng to (+)"
            >
              <IconZoomIn size={16} />
            </button>
          </div>

          {/* Rotate */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Xoay ảnh 90° (R)"
          >
            <IconRotate size={16} />
          </button>

          {/* Reset View */}
          {(zoom !== 1 || rotation !== 0 || position.x !== 0 || position.y !== 0) && (
            <button
              type="button"
              onClick={resetTransform}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
              title="Vừa màn hình (0)"
            >
              <IconArrowsMaximize size={14} />
              <span>Khôi phục</span>
            </button>
          )}

          {/* Open original in new tab */}
          {currentItem?.url && (
            <a
              href={currentItem.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
              title="Mở tab mới"
            >
              <IconExternalLink size={16} />
            </a>
          )}

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Tải ảnh về máy"
          >
            <IconDownload size={16} />
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 ml-1 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500/40 transition-all cursor-pointer"
            title="Đóng (Esc)"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>

      {/* 2. MAIN VIEWPORT */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        className={`flex-1 relative overflow-hidden flex items-center justify-center p-4 ${
          zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
        }`}
      >
        {/* Navigation Arrow Prev */}
        {hasMultipleImages && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 flex items-center justify-center shadow-xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
            title="Ảnh trước (⬅)"
          >
            <IconChevronLeft size={26} />
          </button>
        )}

        {/* Navigation Arrow Next */}
        {hasMultipleImages && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 flex items-center justify-center shadow-xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
            title="Ảnh kế tiếp (➡)"
          >
            <IconChevronRight size={26} />
          </button>
        )}

        {/* Image Display */}
        {imageError ? (
          <div className="flex flex-col items-center gap-3 text-slate-400 p-8 rounded-2xl bg-slate-900/60 border border-white/10 max-w-sm text-center">
            <IconPhoto size={48} className="opacity-40 text-rose-400" />
            <span className="text-sm font-bold text-slate-300">Không thể tải hình ảnh này</span>
            {currentItem?.url && (
              <a
                href={currentItem.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Mở liên kết gốc</span>
                <IconExternalLink size={13} />
              </a>
            )}
          </div>
        ) : (
          <div
            className="relative flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? "none" : "transform 0.15s ease-out",
              transformOrigin: "center center",
            }}
          >
            <img
              ref={imgRef}
              src={currentItem?.url}
              alt={currentItem?.title || "Kaizen Image"}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              draggable={false}
              className="max-w-[92vw] max-h-[80vh] sm:max-h-[82vh] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
            />
          </div>
        )}
      </div>

      {/* 3. BOTTOM FOOTER HINT & DESCRIPTION */}
      <div className="shrink-0 px-4 py-2.5 bg-slate-900/90 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 truncate max-w-full sm:max-w-[70%]">
          {currentItem?.title && (
            <span className="font-bold text-slate-200 shrink-0">{currentItem.title}:</span>
          )}
          {currentItem?.description && (
            <span className="truncate text-slate-300" title={currentItem.description}>
              {currentItem.description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 whitespace-nowrap">
          <span className="hidden md:inline">💡 Cuộn chuột / Double-click để phóng to • Kéo để di chuyển • R: Xoay</span>
          <span className="hidden sm:inline">⬅ ➡: Chuyển ảnh</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc: Đóng</span>
        </div>
      </div>
    </div>
  );
}
