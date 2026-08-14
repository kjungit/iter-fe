"use client";

import { Button, LinkButton } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { useMockData } from "@/lib/store/mock-data-context";
import type { Rental } from "@/lib/types";

function EvidenceColumn({
  label,
  evidence,
}: {
  label: string;
  evidence: Rental["receiptEvidence"];
}) {
  return (
    <div>
      <div className="text-[12px] font-bold text-text-secondary">{label}</div>
      <div className="mt-2">
        <ImagePlaceholder rounded="rounded-sm" />
      </div>
      <div className="mt-2 text-[12px] text-text-body-2">
        {evidence ? `${evidence.condition} — ${evidence.memo}` : "기록 없음"}
      </div>
    </div>
  );
}

export function OwnerReturnRequestedPanel({ rental }: { rental: Rental }) {
  const { finalizeReturn } = useMockData();
  const confirm = useConfirm();

  const handleFinalize = async () => {
    if (await confirm({ message: "반납을 최종 확인하시겠어요?" })) {
      finalizeReturn(rental.id);
    }
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">수령·반납 상태 비교</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <EvidenceColumn label="수령 시 (대여 시작)" evidence={rental.receiptEvidence} />
        <EvidenceColumn label="반납 신청 시" evidence={rental.returnEvidence} />
      </div>
      <div className="mt-4 flex gap-2.5">
        <LinkButton
          href={`/rentals/${rental.id}/report`}
          variant="danger-outline"
          className="flex-1"
        >
          이상 있음 · 신고
        </LinkButton>
        <Button variant="primary" className="flex-1" onClick={handleFinalize}>
          반납 최종 확인
        </Button>
      </div>
    </PanelShell>
  );
}
