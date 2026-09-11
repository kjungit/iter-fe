"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { ApiError } from "@/lib/api/client";
import { readyPayment } from "@/lib/api/payments";
import { cancelRental } from "@/lib/api/rentals";
import { openTossCheckout } from "@/lib/toss";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { useAppData } from "@/lib/store/app-data-context";
import type { RentalDetail } from "@/lib/api/rentals";

export function BorrowerPendingPanel({ rental }: { rental: RentalDetail }) {
  const { currentUser } = useAppData();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);

  const retryMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) return;
      const ready = await readyPayment(rental.rentalId);
      const origin = window.location.origin;
      await openTossCheckout({
        clientKey: ready.clientKey,
        amount: ready.amount,
        orderId: ready.orderId,
        orderName: ready.orderName,
        customerName: currentUser.name,
        successUrl: `${origin}/rentals/${rental.rentalId}/payment/success`,
        failUrl: `${origin}/rentals/${rental.rentalId}/payment/fail`,
      });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "결제를 시작하지 못했습니다."),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelRental(rental.rentalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental", "detail", rental.rentalId] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "취소에 실패했습니다."),
  });

  const handleCancel = async () => {
    if (await confirm({ message: "대여 요청을 취소하시겠어요?" })) {
      cancelMutation.mutate();
    }
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">결제 대기 중</h2>
      <p className="mt-2 text-[12.5px] text-text-secondary">
        결제가 완료되지 않았습니다. 30분 내 결제하지 않으면 요청이 자동 취소됩니다.
      </p>
      {error && <p className="mt-2 text-[12.5px] text-badge-danger-fg">{error}</p>}
      <div className="mt-4 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={handleCancel} loading={cancelMutation.isPending}>
          취소하기
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => {
            setError(null);
            retryMutation.mutate();
          }}
          loading={retryMutation.isPending}
        >
          다시 결제하기
        </Button>
      </div>
    </PanelShell>
  );
}
