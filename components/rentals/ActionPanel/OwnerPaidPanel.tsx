"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { useMockData } from "@/lib/store/mock-data-context";
import type { Rental } from "@/lib/types";

const CARRIERS = ["CJ대한통운", "한진택배", "롯데택배", "우체국택배"];

export function OwnerPaidPanel({ rental }: { rental: Rental }) {
  const { registerShipping } = useMockData();
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [trackingNumber, setTrackingNumber] = useState("");

  const canSubmit = trackingNumber.trim().length > 0;

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">배송 정보 등록</h2>
      <div className="mt-4 flex gap-2.5">
        <Select className="flex-1" value={carrier} onChange={(event) => setCarrier(event.target.value)}>
          {CARRIERS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Input
          className="flex-1"
          placeholder="운송장 번호"
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
        />
      </div>
      <Button
        variant="primary"
        fullWidth
        className="mt-4"
        disabled={!canSubmit}
        onClick={() => registerShipping(rental.id, { carrier, trackingNumber })}
      >
        배송 등록 완료
      </Button>
    </PanelShell>
  );
}
