import { cn } from "@/lib/cn";
import type { BadgePalette } from "@/lib/status";

const PALETTE_CLASSES: Record<BadgePalette, string> = {
  neutral: "bg-badge-neutral-bg text-badge-neutral-fg",
  progress: "bg-badge-progress-bg text-badge-progress-fg",
  success: "bg-badge-success-bg text-badge-success-fg",
  warning: "bg-badge-warning-bg text-badge-warning-fg",
  danger: "bg-badge-danger-bg text-badge-danger-fg",
  done: "bg-badge-done-bg text-badge-done-fg",
};

interface BadgeProps {
  label: string;
  palette: BadgePalette;
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ label, palette, size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs font-bold whitespace-nowrap",
        size === "sm" ? "px-[9px] py-1 text-[11.5px]" : "px-3 py-1.5 text-[12px]",
        PALETTE_CLASSES[palette],
        className,
      )}
    >
      {label}
    </span>
  );
}
