import { diffInDays, parseISODate } from "@/lib/date";
import { formatCurrency, formatDateRange } from "@/lib/format";
import { isOverdue, overdueDays, rentalStatusBadge } from "@/lib/status";
import type { Rental } from "@/lib/types";

interface TransactionDetailBlockProps {
  rental: Rental;
  counterpartName: string;
}

export function TransactionDetailBlock({ rental, counterpartName }: TransactionDetailBlockProps) {
  const days = diffInDays(parseISODate(rental.endDate), parseISODate(rental.startDate)) + 1;
  const overdue = isOverdue(rental);

  const rows: Array<[string, string]> = [
    ["거래번호", rental.id],
    ["상태", rentalStatusBadge(rental.status).label],
    ["대여 기간", formatDateRange(rental.startDate, rental.endDate)],
    ["대여 일수", `${days}일`],
    ["일 대여료", formatCurrency(Math.round(rental.totalPrice / days))],
    ["총 결제 금액", formatCurrency(rental.totalPrice)],
    ["연체", overdue ? `${overdueDays(rental)}일 연체` : "없음"],
    ["상대방", counterpartName],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between border-b border-[#F4F4F4] pb-2.5 text-[12.5px]">
          <span className="text-text-secondary">{label}</span>
          <span className="font-semibold text-[#333333]">{value}</span>
        </div>
      ))}
    </div>
  );
}
