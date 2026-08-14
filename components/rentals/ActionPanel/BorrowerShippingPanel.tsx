"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PhotoUploadSlotGrid } from "@/components/ui/PhotoUploadSlot";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { useMockData } from "@/lib/store/mock-data-context";
import type { EquipmentCondition, Rental } from "@/lib/types";

const CONDITIONS: EquipmentCondition[] = ["양호", "사용감 있음", "파손·이상 있음"];

export function BorrowerShippingPanel({ rental }: { rental: Rental }) {
  const { confirmReceipt } = useMockData();
  const [photoCount, setPhotoCount] = useState(0);
  const [condition, setCondition] = useState<EquipmentCondition>("양호");
  const [memo, setMemo] = useState("");

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">수령 상태 확인</h2>
      <p className="mt-2 text-[12.5px] text-text-secondary">
        받은 장비 사진과 상태를 기록해 두면 반납 시 비교 근거가 됩니다.
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
      <Button
        variant="primary"
        fullWidth
        className="mt-4"
        disabled={photoCount === 0}
        onClick={() =>
          confirmReceipt(rental.id, {
            photoUrls: Array.from({ length: photoCount }, (_, i) => `receipt-${rental.id}-${i}`),
            condition,
            memo,
          })
        }
      >
        수령 확인 완료
      </Button>
    </PanelShell>
  );
}
