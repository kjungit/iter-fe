import { StarRating } from "@/components/ui/StarRating";
import { formatDisplayDate } from "@/lib/format";
import type { RentalReview } from "@/lib/api/reviews";

export function ReviewCard({ review }: { review: RentalReview }) {
  return (
    <div className="rounded-md border border-border p-3.5">
      <div className="flex items-center justify-between">
        <StarRating rating={review.rating} readOnly />
        <span className="text-[11.5px] text-text-tertiary">
          {formatDisplayDate(review.createdAt)}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-[1.6] text-text-body-1">{review.content}</p>
    </div>
  );
}
