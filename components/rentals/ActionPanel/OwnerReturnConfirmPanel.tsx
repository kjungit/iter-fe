"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ZoomableImage } from "@/components/ui/ZoomableImage";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { CAPTURE_VIEWS, PRODUCT_CONDITION_LABELS, type CaptureView } from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/client";
import { confirmReturn, fetchReturnComparison, type ConditionEvidence } from "@/lib/api/rentals";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import type { RentalDetail } from "@/lib/api/rentals";
import { ConditionAnalysisPanel } from "@/components/rentals/ConditionAnalysisPanel";

const CAPTURE_VIEW_LABELS = { FRONT: "정면", SIDE: "측면", REAR: "후면" } as const;

function ComparisonPhotoRow({
  label,
  images,
  evidence,
}: {
  label: string;
  images: Array<{ captureView: CaptureView | null; imageUrl: string }>;
  evidence?: ConditionEvidence;
}) {
  return (
    <div className="contents">
      <div className="self-center text-[12px] font-bold text-text-secondary">
        <p>{label}</p>
        {evidence && <p className="mt-1 font-normal">
          {PRODUCT_CONDITION_LABELS[evidence.productCondition]}
          {evidence.conditionDetail ? ` — ${evidence.conditionDetail}` : ""}
        </p>}
      </div>
      {CAPTURE_VIEWS.map((view) => {
        const image = images.find((item) => item.captureView === view);
        return <div key={view}>
          <ZoomableImage src={image?.imageUrl} alt={`${label} ${CAPTURE_VIEW_LABELS[view]}`} />
          {!image && <p className="mt-1 text-center text-[11px] text-text-tertiary">기록 없음</p>}
        </div>;
      })}
    </div>
  );
}

// AI 의견은 참고로만 보여주고 반납 완료 또는 신고 접수는 소유자가 직접 선택하게 한다.
export function OwnerReturnConfirmPanel({ rental }: { rental: RentalDetail }) {
  const router = useRouter();
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
    onSuccess: (result) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      if (result.reportId) {
        router.push(`/reports/${result.reportId}`);
      }
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "신고 접수에 실패했습니다."),
  });

  const handleFinalize = async () => {
    setError(null);
    if (await confirm({ message: "반납을 최종 확인하시겠어요?" })) {
      finalizeMutation.mutate();
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      setError("신고 사유와 상세 내용을 모두 입력해주세요.");
      return;
    }
    setError(null);
    if (await confirm({ message: "이상 반납으로 접수하고 신고를 시작하시겠어요?" })) {
      disputeMutation.mutate();
    }
  };

  // AI 의견은 자동 판정이 아니라 신고자가 수정할 수 있는 참고 문장으로만 채웁니다.
  const useAiOpinionForReport = (text: string) => {
    setShowDisputeForm(true);
    setDisputeReason((current) => current || "장비 파손 또는 상태 불일치");
    setDisputeDescription((current) => {
      if (current.includes("[AI 수령·반납 비교 참고 의견]")) {
        return current;
      }
      const combined = current.trim() ? `${current.trim()}\n\n${text}` : text;
      return combined.slice(0, 2_000);
    });
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">수령·반납 상태 비교</h2>
      <div className="mt-4 grid grid-cols-[90px_repeat(3,minmax(0,1fr))] gap-2">
        <div />
        {CAPTURE_VIEWS.map((view) => <div key={view} className="text-center text-xs font-bold">
          {CAPTURE_VIEW_LABELS[view]}
        </div>)}
        <ComparisonPhotoRow label="장비 등록" images={comparison?.listingImages ?? []} />
        <ComparisonPhotoRow label="수령 시" images={comparison?.receipt.images ?? []} evidence={comparison?.receipt} />
        <ComparisonPhotoRow label="반납 시" images={comparison?.returnReceipt?.images ?? []}
          evidence={comparison?.returnReceipt} />
      </div>

      <ConditionAnalysisPanel key={rental.rentalId} rentalId={rental.rentalId} comparison={comparison}
        onUseForReport={useAiOpinionForReport} />

      {showDisputeForm && (
        <div className="mt-4 flex flex-col gap-2.5">
          <p className="text-[12px] text-text-secondary">
            기존 AI 비교 기록은 관리자 검토 AI에 자동 연결됩니다. 아래에는 직접 확인한 내용을 보완해 주십시오.
          </p>
          <Input
            placeholder="신고 사유 (예: 렌즈 파손)"
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
          이상 있음 · 신고 접수
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleFinalize} loading={finalizeMutation.isPending}>
          반납 최종 확인
        </Button>
      </div>
    </PanelShell>
  );
}
