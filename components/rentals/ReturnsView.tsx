"use client";

import Link from "next/link";
import { RentalListItem } from "@/components/rentals/RentalListItem";
import { useMockData } from "@/lib/store/mock-data-context";

export function ReturnsView() {
  const { rentals, currentUser } = useMockData();
  const targets = rentals.filter(
    (rental) => rental.ownerId === currentUser.id && rental.status === "RETURN_REQUESTED",
  );

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pt-7 pb-24">
      <Link href="/rentals?tab=lent" className="text-[13px] font-semibold text-text-secondary">
        ← 대여내역으로
      </Link>
      <h1 className="mt-2 text-[20px] font-extrabold text-ink">반납 확인 대상</h1>
      <p className="mt-2 mb-5 text-[12.5px] text-text-secondary">
        반납 신청이 접수된 건입니다. 수령·반납 증빙을 비교한 뒤 최종 확인해 주세요.
      </p>
      <div className="flex flex-col gap-2.5">
        {targets.length === 0 && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">확인 대상이 없습니다.</p>
        )}
        {targets.map((rental) => (
          <RentalListItem
            key={rental.id}
            rental={rental}
            perspective="lent"
            badgeOverride={{ label: "증빙 비교 필요", palette: "warning" }}
          />
        ))}
      </div>
    </div>
  );
}
