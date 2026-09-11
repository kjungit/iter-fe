import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { UserRatingBadge } from "@/components/reviews/UserRatingBadge";
import { formatCurrency, formatDateRange } from "@/lib/format";
import { rentalStatusBadge, type BadgeInfo } from "@/lib/status";
import type { RentalHistoryItem } from "@/lib/api/rentals";

interface RentalListItemProps {
  item: RentalHistoryItem;
  perspective: "borrowed" | "lent";
  badgeOverride?: BadgeInfo;
}

export function RentalListItem({ item, perspective, badgeOverride }: RentalListItemProps) {
  const badge = badgeOverride ?? rentalStatusBadge(item.status);

  return (
    <Link
      href={`/rentals/${item.rentalId}`}
      className="flex items-center gap-3.5 rounded-lg border border-border p-4"
    >
      <div className="h-14 w-14 shrink-0">
        <ImagePlaceholder rounded="rounded-sm" src={item.thumbnailUrl} alt={item.equipmentName} />
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-bold text-ink">{item.equipmentName}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-text-secondary">
          <span>
            {formatDateRange(item.startDate, item.endDate)} ·{" "}
            {perspective === "borrowed"
              ? `등록자 ${item.counterparty.nickname}`
              : `대여자 ${item.counterparty.nickname}`}
          </span>
          <UserRatingBadge userId={item.counterparty.id} />
        </div>
      </div>
      <div className="text-right">
        <div className="text-[13.5px] font-extrabold text-ink">{formatCurrency(item.totalPrice)}</div>
        <div className="mt-1.5 flex items-center justify-end gap-1.5">
          {item.overdueDays > 0 && <Badge label={`${item.overdueDays}일 연체`} palette="danger" />}
          <Badge label={badge.label} palette={badge.palette} />
        </div>
      </div>
    </Link>
  );
}
