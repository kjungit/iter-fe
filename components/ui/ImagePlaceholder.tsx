import { cn } from "@/lib/cn";

interface ImagePlaceholderProps {
  size?: "sm" | "lg";
  rounded?: string;
  className?: string;
  /** 실제 업로드된 이미지 URL이 있으면 스트라이프 패턴 대신 렌더링한다. */
  src?: string | null;
  alt?: string;
}

/** Diagonal stripe placeholder standing in for a real image/thumbnail — or the real image, once uploaded. */
export function ImagePlaceholder({
  size = "lg",
  rounded = "rounded-md",
  className,
  src,
  alt = "",
}: ImagePlaceholderProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 업로드 서버가 임의 로컬 디스크 경로라 next/image 최적화 대상이 아님
      <img
        src={src}
        alt={alt}
        className={cn("aspect-square w-full object-cover", rounded, className)}
      />
    );
  }

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
