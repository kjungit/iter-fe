import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  size?: "md" | "sm";
}

export function Chip({ selected, size = "md", className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-pill border font-semibold whitespace-nowrap transition-colors",
        size === "md" ? "px-[18px] py-[9px] text-[13px]" : "px-3.5 py-[7px] text-[12.5px]",
        selected
          ? "bg-ink-strong text-white border-ink-strong"
          : "bg-white text-text-body-3 border-border-input",
        className,
      )}
      {...props}
    />
  );
}
