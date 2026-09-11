"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { ApiError } from "@/lib/api/client";
import { cancelRental } from "@/lib/api/rentals";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import type { RentalDetail } from "@/lib/api/rentals";

export function BorrowerRequestedPanel({ rental }: { rental: RentalDetail }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);

  const cancelMutation = useMutation({
    mutationFn: () => cancelRental(rental.rentalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental", "detail", rental.rentalId] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "취소에 실패했습니다."),
  });

  const handleCancel = async () => {
    if (await confirm({ message: "결제를 취소하고 대여 요청을 철회하시겠어요?" })) {
      cancelMutation.mutate();
    }
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">등록자 승인 대기 중</h2>
      <p className="mt-2 text-[12.5px] text-text-secondary">
        결제가 완료되었습니다. 등록자가 요청을 검토하고 있어요.
      </p>
      {error && <p className="mt-2 text-[12.5px] text-badge-danger-fg">{error}</p>}
      <Button
        variant="secondary"
        fullWidth
        className="mt-4"
        onClick={handleCancel}
        loading={cancelMutation.isPending}
      >
        요청 취소하기
      </Button>
    </PanelShell>
  );
}
