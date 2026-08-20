import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { cn } from "@/lib/cn";

interface PhotoUploadSlotProps {
  filled?: boolean;
  /** 실제 업로드된 이미지가 있으면 스트라이프 패턴 대신 렌더링한다. */
  src?: string | null;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function PhotoUploadSlot({
  filled = false,
  src,
  loading = false,
  onClick,
  className,
}: PhotoUploadSlotProps) {
  if (src) {
    return <ImagePlaceholder rounded="rounded-sm" src={src} className={className} />;
  }
  if (filled || loading) {
    return (
      <div
        className={cn(
          "placeholder-pattern-sm aspect-square w-full rounded-sm",
          loading && "flex items-center justify-center text-[11px] font-semibold text-white",
          className,
        )}
      >
        {loading && "업로드 중..."}
      </div>
    );
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
