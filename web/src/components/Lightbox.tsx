"use client";

import { IconX } from "@tabler/icons-react";

export default function Lightbox({ src, alt, onClose }: { src: string | null; alt?: string; onClose: () => void }) {
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        aria-label="Đóng"
      >
        <IconX size={20} />
      </button>
      <img
        src={encodeURI(src)}
        alt={alt || ""}
        className="max-w-full max-h-full rounded-2xl shadow-2xl animate-spring-in"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
