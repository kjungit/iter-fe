"use client";

import { Button } from "@/components/ui/Button";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { formatDisplayDate } from "@/lib/format";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { useMockData } from "@/lib/store/mock-data-context";
import type { Rental } from "@/lib/types";

export function BorrowerRentingPanel({ rental }: { rental: Rental }) {
  const { requestReturn } = useMockData();
  const confirm = useConfirm();

  const handleRequestReturn = async () => {
    if (await confirm({ message: "반납 신청을 시작하시겠어요?" })) {
      requestReturn(rental.id);
    }
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">대여 중</h2>
      <p className="mt-2 text-[12.5px] text-text-secondary">
        반납 예정일: {formatDisplayDate(rental.endDate)}. 반납 전 장비 상태를 등록해 주세요.
      </p>
      <Button variant="primary" fullWidth className="mt-4" onClick={handleRequestReturn}>
        반납 신청하기
      </Button>
    </PanelShell>
  );
}
