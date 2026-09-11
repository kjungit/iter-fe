"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { StarRating } from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateRange } from "@/lib/format";
import { rentalRole } from "@/lib/status";
import { fetchRentalDetail } from "@/lib/api/rentals";
import { createReview, fetchReviewsForRental } from "@/lib/api/reviews";
import { ApiError } from "@/lib/api/client";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

const CONTENT_MAX_LENGTH = 1000;

export function ReviewForm({ rentalId }: { rentalId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useRequireAuth();
  const confirm = useConfirm();

  const rentalQuery = useQuery({
    queryKey: ["rental", "detail", rentalId],
    queryFn: () => fetchRentalDetail(rentalId),
    enabled: !!currentUser,
  });
  const reviewsQuery = useQuery({
    queryKey: ["rental", "reviews", rentalId],
    queryFn: () => fetchReviewsForRental(rentalId),
    enabled: !!currentUser,
  });

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createReview(rentalId, { rating, content: content.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental", "reviews", rentalId] });
      router.push(`/rentals/${rentalId}`);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "리뷰 등록에 실패했습니다."),
  });

  if (!currentUser) return null;

  if (rentalQuery.isLoading || reviewsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[520px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  const rental = rentalQuery.data;
  if (!rental) {
    return (
      <div className="mx-auto max-w-[520px] px-6 py-16 text-center text-[13px] text-text-secondary">
        대여 건을 찾을 수 없습니다.{" "}
        <Link href="/rentals" className="font-semibold text-ink-strong">
          대여내역으로
        </Link>
      </div>
    );
  }

  if (reviewsQuery.isError) {
    return (
      <div className="mx-auto max-w-[520px] px-6 py-16 text-center text-[13px] text-text-secondary">
        이 거래의 당사자만 리뷰를 남길 수 있어요.{" "}
        <Link href={`/rentals/${rentalId}`} className="font-semibold text-ink-strong">
          대여 상세로
        </Link>
      </div>
    );
  }

  if (rental.status !== "COMPLETED") {
    return (
      <div className="mx-auto max-w-[520px] px-6 py-16 text-center text-[13px] text-text-secondary">
        완료된 거래만 리뷰를 남길 수 있어요.{" "}
        <Link href={`/rentals/${rentalId}`} className="font-semibold text-ink-strong">
          대여 상세로
        </Link>
      </div>
    );
  }

  const role = rentalRole(rental, currentUser.id);
  const counterpart = role === "owner" ? rental.renter : rental.owner;
  const myReview = reviewsQuery.data?.find((review) => review.reviewerId === currentUser.id);

  if (myReview) {
    return (
      <div className="mx-auto w-full max-w-[520px] px-6 pt-7 pb-24">
        <Link href={`/rentals/${rentalId}`} className="text-[13px] font-semibold text-text-secondary">
          ← 돌아가기
        </Link>
        <h1 className="mt-2 text-[20px] font-extrabold text-ink">리뷰 작성</h1>
        <p className="mt-2 mb-5 text-[12.5px] text-text-secondary">
          이미 이 거래에 대한 리뷰를 작성했어요.
        </p>
        <ReviewCard review={myReview} />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setError(null);
    if (!(await confirm({ message: "리뷰를 등록하시겠어요? 등록 후에는 수정할 수 없어요." }))) return;
    mutation.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-[520px] px-6 pt-7 pb-24">
      <Link href={`/rentals/${rentalId}`} className="text-[13px] font-semibold text-text-secondary">
        ← 돌아가기
      </Link>
      <h1 className="mt-2 text-[20px] font-extrabold text-ink">리뷰 작성</h1>
      <p className="mt-2 mb-5 text-[12.5px] text-text-secondary">
        {counterpart.nickname}님과의 거래는 어땠나요?
      </p>

      <div className="flex gap-3 rounded-md border border-border p-3.5">
        <div className="h-12 w-12 shrink-0">
          <ImagePlaceholder
            rounded="rounded-sm"
            src={rental.equipment.thumbnailUrl}
            alt={rental.equipment.equipmentName}
          />
        </div>
        <div>
          <div className="text-[13.5px] font-bold text-ink">{rental.equipment.equipmentName}</div>
          <div className="mt-0.5 text-[12px] text-text-secondary">
            {formatDateRange(rental.startDate, rental.endDate)}
          </div>
        </div>
      </div>

      <h2 className="mt-6 mb-2.5 text-center text-[14px] font-bold text-ink">평점</h2>
      <StarRating rating={rating} onChange={setRating} />

      <h2 className="mt-6 mb-2.5 text-[14px] font-bold text-ink">후기</h2>
      <Textarea
        minHeight={110}
        maxLength={CONTENT_MAX_LENGTH}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="거래 경험을 남겨주세요."
      />
      <p className="mt-1 text-right text-[11.5px] text-text-tertiary">
        {content.length}/{CONTENT_MAX_LENGTH}
      </p>

      {error && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-3 rounded-md"
        disabled={!content.trim()}
        loading={mutation.isPending}
        onClick={handleSubmit}
      >
        리뷰 등록
      </Button>
    </div>
  );
}
