"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Button } from "@/components/ui/Button";
import { fetchReviewsForRental } from "@/lib/api/reviews";
import { rentalRole } from "@/lib/status";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import type { RentalDetail } from "@/lib/api/rentals";

export function CompletedPanel({ rental }: { rental: RentalDetail }) {
  const currentUser = useRequireAuth();
  const { data: reviews } = useQuery({
    queryKey: ["rental", "reviews", rental.rentalId],
    queryFn: () => fetchReviewsForRental(rental.rentalId),
    enabled: !!currentUser,
  });

  if (!currentUser) return null;

  const role = rentalRole(rental, currentUser.id);
  const counterpartName = role === "owner" ? rental.renter.nickname : rental.owner.nickname;
  const myReview = reviews?.find((review) => review.reviewerId === currentUser.id);
  const counterpartReview = reviews?.find((review) => review.reviewerId !== currentUser.id);

  return (
    <PanelShell>
      <div className="text-center">
        <h2 className="text-[14px] font-bold text-ink">거래가 완료되었습니다</h2>
        <p className="mt-2 text-[12.5px] text-text-secondary">
          수령·반납 시점 기록은 언제든 이 화면에서 다시 확인할 수 있어요.
        </p>
      </div>

      {!myReview && (
        <Link href={`/rentals/${rental.rentalId}/review`} className="mt-4 block">
          <Button variant="primary" size="md" fullWidth>
            리뷰 작성하기
          </Button>
        </Link>
      )}

      {myReview && (
        <div className="mt-4">
          <h3 className="mb-1.5 text-[12.5px] font-bold text-ink">내가 남긴 리뷰</h3>
          <ReviewCard review={myReview} />
        </div>
      )}

      <div className="mt-4">
        <h3 className="mb-1.5 text-[12.5px] font-bold text-ink">{counterpartName}님이 남긴 리뷰</h3>
        {counterpartReview ? (
          <ReviewCard review={counterpartReview} />
        ) : (
          <p className="text-[12.5px] text-text-secondary">상대방은 아직 리뷰를 작성하지 않았어요.</p>
        )}
      </div>
    </PanelShell>
  );
}
