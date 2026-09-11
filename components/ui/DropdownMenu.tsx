"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}

/** 카드 등 클릭 가능한 컨테이너 안에 놓일 수 있어 트리거/메뉴 클릭 모두 상위로 전파하지 않는다. */
export function DropdownMenu({ trigger, children, align = "right" }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary"
        aria-label="더 보기"
      >
        {trigger}
      </button>
      {open && (
        <div
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className={cn(
            "shadow-popover absolute top-[calc(100%+4px)] z-20 w-[168px] rounded-md border border-border bg-white py-1.5",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full px-3.5 py-2 text-left text-[12.5px] font-semibold",
        danger ? "text-badge-danger-fg" : "text-ink",
      )}
    >
      {children}
    </button>
  );
}
