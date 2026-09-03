"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePerformance } from "@/components/PerformanceProvider";
import cloudinaryLoader, { getCloudinaryLqipUrl, transformCloudinaryUrl } from "@/lib/cloudinaryLoader";

export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  aspectRatio?: string;
  fallbackInitials?: string;
  className?: string;
}

export default function SmartImage({
  src,
  alt,
  width,
  height,
  priority = false,
  aspectRatio,
  fallbackInitials,
  className = "",
  style,
  onLoad,
  onError,
  ...restProps
}: SmartImageProps) {
  const perf = usePerformance();
  const [isIntersected, setIsIntersected] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // IntersectionObserver Lazy Loading
  useEffect(() => {
    if (priority || isIntersected) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersected(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px 0px" } // Preload 200px before reaching viewport
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isIntersected]);

  // Compute final optimized Cloudinary URL based on device profile tier
  const finalSrc = cloudinaryLoader({
    src,
    width: width || 800,
    profileQuality: perf.profile,
  });

  const lqipSrc = getCloudinaryLqipUrl(src);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    perf.incrementLazyLoadedCount();
    if (onLoad) onLoad(e);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    if (onError) onError(e);
  };

  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style,
  };

  // Fallback initial badge if image fails to load
  if (hasError) {
    return (
      <div
        ref={imgRef as any}
        className={`flex items-center justify-center bg-emerald-900 text-amber-300 font-black uppercase rounded-xl border border-emerald-700/60 ${className}`}
        style={containerStyle}
      >
        <span>{fallbackInitials || (alt ? alt.slice(0, 2) : "TBS")}</span>
      </div>
    );
  }

  return (
    <div ref={imgRef as any} className={`relative overflow-hidden ${className}`} style={containerStyle}>
      {/* 1. LQIP Blur-Up Background Image */}
      {lqipSrc && lqipSrc !== finalSrc && !isLoaded && (
        <img
          src={lqipSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-105 opacity-80 pointer-events-none transition-opacity duration-300"
        />
      )}

      {/* 2. Main High-Performance Image */}
      {isIntersected && (
        <img
          src={finalSrc}
          alt={alt || "TBS Image"}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full transition-opacity duration-500 ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          {...restProps}
        />
      )}
    </div>
  );
}
