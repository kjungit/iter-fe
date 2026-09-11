"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface FilterSelectOption<T extends string> {
  value: T;
  label: string;
}

interface FilterSelectProps<T extends string> {
  value: T;
  options: FilterSelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

/**
 * 네이티브 <select>는 OS별로 완전히 다르게 렌더링되어 나머지 커스텀 디자인 시스템과 톤이 안 맞는다
 * — 필터 UI에서는 항상 이 컴포넌트를 쓴다(트리거 버튼 + 직접 그린 목록 패널).
 */
export function FilterSelect<T extends string>({ value, options, onChange, className }: FilterSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-sm border border-border-input bg-white px-3.5 py-3 text-[13.5px] text-ink outline-none focus:border-ink-strong"
      >
        <span className="truncate">{selected?.label ?? "선택"}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={cn("shrink-0 text-text-tertiary transition-transform", open && "rotate-180")}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="shadow-popover absolute top-[calc(100%+4px)] left-0 z-20 max-h-[280px] w-full overflow-y-auto rounded-md border border-border bg-white py-1.5">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3.5 py-2 text-left text-[13px]",
                  isSelected ? "bg-surface-alt font-bold text-ink-strong" : "text-ink",
                )}
              >
                {option.label}
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
