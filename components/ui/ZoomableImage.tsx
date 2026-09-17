"use client";

import { useEffect, useState } from "react";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

interface ZoomableImageProps {
  src?: string | null;
  alt: string;
  rounded?: string;
  className?: string;
}

/** 작은 썸네일을 유지하면서 클릭한 사진 한 장만 큰 화면으로 확인하게 한다. */
export function ZoomableImage({ src, alt, rounded = "rounded-sm", className }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  // 확대 창이 열려 있을 때 Esc 키로도 닫을 수 있게 한다.
  useEffect(() => {
    if (!open) return;

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [open]);

  if (!src) {
    return <ImagePlaceholder rounded={rounded} className={className} alt={alt} />;
  }

  return <>
    <button
      type="button"
      className="group relative block w-full cursor-zoom-in"
      aria-label={`${alt} 확대`}
      onClick={() => setOpen(true)}
    >
      <ImagePlaceholder rounded={rounded} src={src} alt={alt} className={className} />
      <span className="absolute right-1.5 bottom-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-80 group-hover:opacity-100">
        확대
      </span>
    </button>

    {open && <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} 확대 보기`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div className="relative flex max-h-full max-w-full flex-col items-center gap-2">
        <button
          type="button"
          className="absolute -top-3 -right-3 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ink shadow"
          aria-label="확대 사진 닫기"
          onClick={() => setOpen(false)}
        >
          닫기
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element -- 인증 URL과 로컬 업로드 미리보기를 원본 비율로 표시한다. */}
        <img src={src} alt={alt} className="max-h-[85vh] max-w-[92vw] rounded object-contain" />
        <p className="max-w-[92vw] truncate text-xs text-white">{alt}</p>
      </div>
    </div>}
  </>;
}
