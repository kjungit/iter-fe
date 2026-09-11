"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Pager } from "@/components/ui/Pager";
import { UserRatingBadge } from "@/components/reviews/UserRatingBadge";
import { formatDateRange } from "@/lib/format";
import { fetchReturnTargets } from "@/lib/api/rentals";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

const PAGE_SIZE = 20;

export function ReturnsView() {
  const currentUser = useRequireAuth();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["rentals", "returns", page],
    queryFn: () => fetchReturnTargets({ page, size: PAGE_SIZE }),
    enabled: !!currentUser,
  });
  const targets = data?.content;

  if (!currentUser) return null;

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pt-7 pb-24">
      <Link href="/rentals?tab=lent" className="text-[13px] font-semibold text-text-secondary">
        ← 대여내역으로
      </Link>
      <h1 className="mt-2 text-[20px] font-extrabold text-ink">반납 확인 대상</h1>
      <p className="mt-2 mb-5 text-[12.5px] text-text-secondary">
        반납이 도착 확인된 건입니다. 수령·반납 증빙을 비교한 뒤 최종 확인해 주세요.
      </p>
      <div className="flex flex-col gap-2.5">
        {isLoading && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">불러오는 중...</p>
        )}
        {!isLoading && targets?.length === 0 && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">확인 대상이 없습니다.</p>
        )}
        {targets?.map((target) => (
          <Link
            key={target.rentalId}
            href={`/rentals/${target.rentalId}`}
            className="flex items-center gap-3.5 rounded-lg border border-border p-4"
          >
            <div className="h-14 w-14 shrink-0">
              <ImagePlaceholder rounded="rounded-sm" src={target.thumbnailUrl} alt={target.equipmentName} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold text-ink">{target.equipmentName}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-text-secondary">
                <span>
                  {formatDateRange(target.endDate, target.returnDate ?? target.endDate)} · 대여자{" "}
                  {target.renter.nickname}
                </span>
                <UserRatingBadge userId={target.renter.id} />
              </div>
            </div>
          </Link>
        ))}
      </div>
      {data && <Pager page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
