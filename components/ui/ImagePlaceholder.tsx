import { cn } from "@/lib/cn";

interface ImagePlaceholderProps {
  size?: "sm" | "lg";
  rounded?: string;
  className?: string;
}

/** Diagonal stripe placeholder standing in for a real image/thumbnail (handoff has no real assets). */
export function ImagePlaceholder({ size = "lg", rounded = "rounded-md", className }: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "aspect-square w-full",
        size === "sm" ? "placeholder-pattern-sm" : "placeholder-pattern",
        rounded,
        className,
      )}
    />
  );
}
