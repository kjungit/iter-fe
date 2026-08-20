"use client";

import Link from "next/link";
import { ActionPanel } from "@/components/rentals/ActionPanel/ActionPanel";
import { RentalTimeline } from "@/components/rentals/RentalTimeline";
import { TransactionDetailBlock } from "@/components/rentals/TransactionDetailBlock";
import { Badge } from "@/components/ui/Badge";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { formatDateRange } from "@/lib/format";
import { rentalRole, rentalStatusBadge } from "@/lib/status";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { useAppData } from "@/lib/store/app-data-context";

export function RentalDetailView({ rentalId }: { rentalId: string }) {
  const currentUser = useRequireAuth();
  const { rentals, equipment } = useAppData();
  const rental = rentals.find((candidate) => candidate.id === rentalId);

  if (!currentUser) return null;

  if (!rental) {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-16 text-center text-[13px] text-text-secondary">
        대여 건을 찾을 수 없습니다.{" "}
        <Link href="/rentals" className="font-semibold text-ink-strong">
          대여내역으로
        </Link>
      </div>
    );
  }

  const item = equipment.find((candidate) => candidate.id === rental.equipmentId);
  const role = rentalRole(rental, currentUser.id);
  const counterpartName = role === "owner" ? rental.borrowerName : rental.ownerName;
  const badge = rentalStatusBadge(rental.status);

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pt-7 pb-24">
      <Link href="/rentals" className="text-[13px] font-semibold text-text-secondary">
        ← 대여내역으로
      </Link>

      <div className="mt-4 mb-6 flex items-center gap-3.5 rounded-lg border border-border p-[18px]">
        <div className="h-16 w-16 shrink-0">
          <ImagePlaceholder rounded="rounded-sm" />
        </div>
        <div className="flex-1">
          <div className="text-[15px] font-extrabold text-ink">{item?.name ?? "삭제된 장비"}</div>
          <div className="mt-1 text-[12.5px] text-text-secondary">
            {formatDateRange(rental.startDate, rental.endDate)} · {counterpartName}
          </div>
        </div>
        <Badge label={badge.label} palette={badge.palette} size="md" />
      </div>

      <div className="mb-8">
        <RentalTimeline status={rental.status} />
      </div>

      <ActionPanel rental={rental} />

      <div className="mt-7 rounded-lg bg-surface px-5 py-[18px]">
        <h2 className="mb-3 text-[13px] font-bold text-ink">거래 상세</h2>
        <TransactionDetailBlock rental={rental} counterpartName={counterpartName} />
      </div>

      <div className="mt-5 text-center">
        <Link
          href={`/rentals/${rental.id}/report`}
          className="text-[12px] font-semibold text-text-tertiary"
        >
          문제가 있나요? 신고하기
        </Link>
      </div>
    </div>
  );
}
