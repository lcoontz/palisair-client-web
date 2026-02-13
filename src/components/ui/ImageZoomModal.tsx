"use client";

import { useEffect } from "react";

interface ImageZoomModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageZoomModal({ src, alt, onClose }: ImageZoomModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-white shadow-lg hover:bg-slate-600"
        >
          &times;
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
        />
      </div>
    </div>
  );
}
