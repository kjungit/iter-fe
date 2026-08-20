"use client";

import { Button } from "@/components/ui/Button";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { useAppData } from "@/lib/store/app-data-context";
import type { Rental } from "@/lib/types";

export function OwnerPendingPanel({ rental }: { rental: Rental }) {
  const { approveRental, rejectRental } = useAppData();
  const confirm = useConfirm();

  const handleReject = async () => {
    if (await confirm({ message: "이 대여 요청을 거절하시겠어요?" })) {
      rejectRental(rental.id);
    }
  };

  const handleApprove = async () => {
    if (await confirm({ message: "이 대여 요청을 승인하시겠어요?" })) {
      approveRental(rental.id);
    }
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">대여 요청을 승인하시겠어요?</h2>
      {rental.message && (
        <p className="mt-2 text-[12.5px] text-text-secondary">{rental.message}</p>
      )}
      <div className="mt-4 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={handleReject}>
          거절
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleApprove}>
          승인
        </Button>
      </div>
    </PanelShell>
  );
}
