"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { formatCurrency, formatDateRange } from "@/lib/format";
import { isOverdue, overdueDays, rentalStatusBadge, type BadgeInfo } from "@/lib/status";
import { useMockData } from "@/lib/store/mock-data-context";
import type { Rental } from "@/lib/types";

interface RentalListItemProps {
  rental: Rental;
  perspective: "borrowed" | "lent";
  badgeOverride?: BadgeInfo;
}

export function RentalListItem({ rental, perspective, badgeOverride }: RentalListItemProps) {
  const { equipment } = useMockData();
  const item = equipment.find((candidate) => candidate.id === rental.equipmentId);
  const badge = badgeOverride ?? rentalStatusBadge(rental.status);
  const overdue = isOverdue(rental);

  return (
    <Link
      href={`/rentals/${rental.id}`}
      className="flex items-center gap-3.5 rounded-lg border border-border p-4"
    >
      <div className="h-14 w-14 shrink-0">
        <ImagePlaceholder rounded="rounded-sm" />
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-bold text-ink">{item?.name ?? "삭제된 장비"}</div>
        <div className="mt-1 text-[12.5px] text-text-secondary">
          {formatDateRange(rental.startDate, rental.endDate)} ·{" "}
          {perspective === "borrowed" ? `등록자 ${rental.ownerName}` : `대여자 ${rental.borrowerName}`}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[13.5px] font-extrabold text-ink">{formatCurrency(rental.totalPrice)}</div>
        <div className="mt-1.5 flex items-center justify-end gap-1.5">
          {overdue && <Badge label={`${overdueDays(rental)}일 연체`} palette="danger" />}
          <Badge label={badge.label} palette={badge.palette} />
        </div>
      </div>
    </Link>
  );
}
