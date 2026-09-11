"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { ApiError } from "@/lib/api/client";
import { registerShipping } from "@/lib/api/rentals";
import type { RentalDetail } from "@/lib/api/rentals";

const CARRIERS = ["CJ대한통운", "한진택배", "롯데택배", "우체국택배"];

export function OwnerApprovedPanel({ rental }: { rental: RentalDetail }) {
  const queryClient = useQueryClient();
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => registerShipping(rental.rentalId, { carrier, trackingNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental", "detail", rental.rentalId] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "배송 등록에 실패했습니다."),
  });

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
      {error && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{error}</p>}
      <Button
        variant="primary"
        fullWidth
        className="mt-4"
        disabled={!canSubmit}
        loading={mutation.isPending}
        onClick={() => {
          setError(null);
          mutation.mutate();
        }}
      >
        배송 등록 완료
      </Button>
    </PanelShell>
  );
}
