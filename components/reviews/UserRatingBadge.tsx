"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { fetchUserReviewStats } from "@/lib/api/reviews";

/** 사용자가 노출되는 모든 곳(등록자/대여자/내 프로필)에서 재사용하는 평균 평점 배지. */
export function UserRatingBadge({ userId }: { userId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", "review-stats", userId],
    queryFn: () => fetchUserReviewStats(userId),
  });

  if (isLoading || isError || !data) return null;

  if (data.reviewCount === 0) {
    return <Badge label="리뷰 없음" palette="neutral" size="sm" />;
  }

  return (
    <Badge
      label={`★ ${data.averageRating.toFixed(1)} (${data.reviewCount})`}
      palette="neutral"
      size="sm"
    />
  );
}
