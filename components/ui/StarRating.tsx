import { cn } from "@/lib/cn";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
}

export function StarRating({ rating, onChange, readOnly = false }: StarRatingProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            "text-[30px] leading-none disabled:cursor-default",
            star <= rating ? "text-ink-strong" : "text-[#E0E0E0]",
          )}
          aria-label={`${star}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
