"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { formatDisplayDate } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { requestReturn } from "@/lib/api/rentals";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import type { RentalDetail } from "@/lib/api/rentals";

export function BorrowerRentingPanel({ rental }: { rental: RentalDetail }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => requestReturn(rental.rentalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental", "detail", rental.rentalId] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "반납 신청에 실패했습니다."),
  });

  const handleRequestReturn = async () => {
    setError(null);
    if (await confirm({ message: "반납 신청을 시작하시겠어요?" })) {
      mutation.mutate();
    }
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">대여 중</h2>
      <p className="mt-2 text-[12.5px] text-text-secondary">
        반납 예정일: {formatDisplayDate(rental.endDate)}. 반납 전 장비 상태를 등록해 주세요.
      </p>
      {error && <p className="mt-2 text-[12.5px] text-badge-danger-fg">{error}</p>}
      <Button variant="primary" fullWidth className="mt-4" onClick={handleRequestReturn} loading={mutation.isPending}>
        반납 신청하기
      </Button>
    </PanelShell>
  );
}
