"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { CursorPager } from "@/components/ui/CursorPager";
import { useCursorPager } from "@/lib/hooks/useCursorPager";
import { fetchReviewsWrittenByUser } from "@/lib/api/reviews";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

export function MyReviewsView() {
  const currentUser = useRequireAuth();
  const { cursor, hasPrev, goNext, goPrev } = useCursorPager();

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", "written", currentUser?.id, cursor],
    queryFn: () => fetchReviewsWrittenByUser(currentUser!.id, { cursor, size: 20 }),
    enabled: !!currentUser,
  });

  if (!currentUser) return null;

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 pt-7 pb-24">
      <Link href="/mypage" className="text-[13px] font-semibold text-text-secondary">
        ← 마이페이지
      </Link>
      <h1 className="mt-2 mb-5 text-[20px] font-extrabold text-ink">내가 쓴 리뷰</h1>

      <div className="flex flex-col gap-2.5">
        {isLoading && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">불러오는 중...</p>
        )}
        {!isLoading && data?.content.length === 0 && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">
            작성한 리뷰가 없습니다.
          </p>
        )}
        {data?.content.map((review) => <ReviewCard key={review.id} review={review} />)}
      </div>

      <CursorPager hasPrev={hasPrev} hasNext={!!data?.hasNext} onPrev={goPrev} onNext={() => goNext(data)} />
    </div>
  );
}
