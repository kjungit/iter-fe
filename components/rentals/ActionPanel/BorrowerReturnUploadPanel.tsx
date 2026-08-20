"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PhotoUploadSlotGrid } from "@/components/ui/PhotoUploadSlot";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { useAppData } from "@/lib/store/app-data-context";
import type { EquipmentCondition, Rental } from "@/lib/types";

const CONDITIONS: EquipmentCondition[] = ["양호", "사용감 있음", "파손·이상 있음"];

export function BorrowerReturnUploadPanel({ rental }: { rental: Rental }) {
  const { submitReturnEvidence } = useAppData();
  const confirm = useConfirm();
  const [photoCount, setPhotoCount] = useState(0);
  const [condition, setCondition] = useState<EquipmentCondition>("양호");
  const [memo, setMemo] = useState("");

  const handleSubmit = async () => {
    if (await confirm({ message: "반납 신청을 제출하시겠어요? 제출 후에는 되돌릴 수 없습니다." })) {
      submitReturnEvidence(rental.id, {
        photoUrls: Array.from({ length: photoCount }, (_, i) => `return-${rental.id}-${i}`),
        condition,
        memo,
      });
    }
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">반납 전 상태 등록</h2>
      <p className="mt-2 text-[12.5px] text-text-secondary">
        반납 직전 사진과 상태를 등록하면 수령 시점 기록과 자동 비교됩니다.
      </p>
      <div className="mt-4">
        <PhotoUploadSlotGrid
          filledCount={photoCount}
          onAdd={() => setPhotoCount((count) => Math.min(4, count + 1))}
        />
      </div>
      <Select
        className="mt-3"
        value={condition}
        onChange={(event) => setCondition(event.target.value as EquipmentCondition)}
      >
        {CONDITIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      <Textarea
        className="mt-2.5"
        minHeight={60}
        placeholder="메모 (선택)"
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
      />
      <Button variant="primary" fullWidth className="mt-4" disabled={photoCount === 0} onClick={handleSubmit}>
        반납 신청 제출
      </Button>
    </PanelShell>
  );
}
