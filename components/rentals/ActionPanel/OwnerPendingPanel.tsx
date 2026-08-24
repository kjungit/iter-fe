"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { ApiError } from "@/lib/api/client";
import { approveRental, rejectRental } from "@/lib/api/rentals";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import type { RentalDetail } from "@/lib/api/rentals";

export function OwnerPendingPanel({ rental }: { rental: RentalDetail }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["rental", "detail", rental.rentalId] });
    queryClient.invalidateQueries({ queryKey: ["rentals"] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveRental(rental.rentalId),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "승인에 실패했습니다."),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectRental(rental.rentalId, reason),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "거절에 실패했습니다."),
  });

  const handleApprove = async () => {
    setError(null);
    if (await confirm({ message: "이 대여 요청을 승인하시겠어요?" })) {
      approveMutation.mutate();
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setError("거절 사유를 입력해주세요.");
      return;
    }
    setError(null);
    if (await confirm({ message: "이 대여 요청을 거절하시겠어요?" })) {
      rejectMutation.mutate();
    }
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">대여 요청을 승인하시겠어요?</h2>
      {rental.requestMessage && (
        <p className="mt-2 text-[12.5px] text-text-secondary">{rental.requestMessage}</p>
      )}

      {showRejectForm && (
        <Textarea
          className="mt-3"
          minHeight={60}
          placeholder="거절 사유를 입력해주세요."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      )}
      {error && <p className="mt-2 text-[12.5px] text-badge-danger-fg">{error}</p>}

      <div className="mt-4 flex gap-2.5">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => (showRejectForm ? handleReject() : setShowRejectForm(true))}
          loading={rejectMutation.isPending}
        >
          거절
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleApprove} loading={approveMutation.isPending}>
          승인
        </Button>
      </div>
    </PanelShell>
  );
}
