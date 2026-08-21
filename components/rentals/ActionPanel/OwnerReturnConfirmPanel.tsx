"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { PRODUCT_CONDITION_LABELS } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/client";
import { confirmReturn, fetchReturnComparison, type ConditionEvidence } from "@/lib/api/rentals";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import type { RentalDetail } from "@/lib/api/rentals";

function EvidenceColumn({ label, evidence }: { label: string; evidence: ConditionEvidence | undefined }) {
  return (
    <div>
      <div className="text-[12px] font-bold text-text-secondary">{label}</div>
      <div className="mt-2">
        <ImagePlaceholder rounded="rounded-sm" src={evidence?.imageUrls[0]} />
      </div>
      <div className="mt-2 text-[12px] text-text-body-2">
        {evidence
          ? `${PRODUCT_CONDITION_LABELS[evidence.productCondition]}${
              evidence.conditionDetail ? ` — ${evidence.conditionDetail}` : ""
            }`
          : "기록 없음"}
      </div>
    </div>
  );
}

export function OwnerReturnConfirmPanel({ rental }: { rental: RentalDetail }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: comparison } = useQuery({
    queryKey: ["rental", "return-comparison", rental.rentalId],
    queryFn: () => fetchReturnComparison(rental.rentalId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["rental", "detail", rental.rentalId] });
    queryClient.invalidateQueries({ queryKey: ["rentals"] });
  };

  const finalizeMutation = useMutation({
    mutationFn: () => confirmReturn(rental.rentalId, { hasIssue: false }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "최종 확인에 실패했습니다."),
  });

  const disputeMutation = useMutation({
    mutationFn: () =>
      confirmReturn(rental.rentalId, {
        hasIssue: true,
        disputeReason,
        disputeDescription,
      }),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "분쟁 접수에 실패했습니다."),
  });

  const handleFinalize = async () => {
    setError(null);
    if (await confirm({ message: "반납을 최종 확인하시겠어요?" })) {
      finalizeMutation.mutate();
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      setError("분쟁 사유와 상세 내용을 모두 입력해주세요.");
      return;
    }
    setError(null);
    if (await confirm({ message: "이상 반납으로 접수하고 분쟁을 시작하시겠어요?" })) {
      disputeMutation.mutate();
    }
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">수령·반납 상태 비교</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <EvidenceColumn label="수령 시 (대여 시작)" evidence={comparison?.receipt} />
        <EvidenceColumn label="반납 신청 시" evidence={comparison?.returnReceipt} />
      </div>

      {showDisputeForm && (
        <div className="mt-4 flex flex-col gap-2.5">
          <Input
            placeholder="분쟁 사유 (예: 렌즈 파손)"
            value={disputeReason}
            onChange={(event) => setDisputeReason(event.target.value)}
          />
          <Textarea
            minHeight={60}
            placeholder="상세 내용을 입력해주세요."
            value={disputeDescription}
            onChange={(event) => setDisputeDescription(event.target.value)}
          />
        </div>
      )}
      {error && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{error}</p>}

      <div className="mt-4 flex gap-2.5">
        <Button
          variant="danger-outline"
          className="flex-1"
          onClick={() => (showDisputeForm ? handleSubmitDispute() : setShowDisputeForm(true))}
          loading={disputeMutation.isPending}
        >
          이상 있음 · 분쟁 접수
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleFinalize} loading={finalizeMutation.isPending}>
          반납 최종 확인
        </Button>
      </div>
    </PanelShell>
  );
}
