import { cn } from "@/lib/cn";

interface PhotoUploadSlotProps {
  filled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PhotoUploadSlot({ filled = false, onClick, className }: PhotoUploadSlotProps) {
  if (filled) {
    return <div className={cn("placeholder-pattern-sm aspect-square w-full rounded-sm", className)} />;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex aspect-square w-full items-center justify-center rounded-sm border border-dashed border-border-dashed bg-surface-alt text-[11px] font-semibold text-text-tertiary",
        className,
      )}
    >
      +
    </button>
  );
}

export function PhotoUploadSlotGrid({
  count = 4,
  filledCount = 0,
  onAdd,
}: {
  count?: number;
  filledCount?: number;
  onAdd?: () => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <PhotoUploadSlot key={index} filled={index < filledCount} onClick={onAdd} />
      ))}
    </div>
  );
}
