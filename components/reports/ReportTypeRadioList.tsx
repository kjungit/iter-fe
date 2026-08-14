"use client";

import { cn } from "@/lib/cn";
import type { ReportReason } from "@/lib/types";

const REASONS: ReportReason[] = [
  "장비 파손 / 상태 불일치",
  "반납 지연 / 미반납",
  "허위 매물",
  "부적절한 언행",
  "기타",
];

interface ReportTypeRadioListProps {
  value: ReportReason;
  onChange: (value: ReportReason) => void;
}

export function ReportTypeRadioList({ value, onChange }: ReportTypeRadioListProps) {
  return (
    <div className="flex flex-col gap-2">
      {REASONS.map((reason) => {
        const selected = reason === value;
        return (
          <label
            key={reason}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-sm border px-3.5 py-[13px]",
              selected ? "border-ink-strong bg-surface-alt" : "border-border-input bg-white",
            )}
          >
            <input
              type="radio"
              name="report-reason"
              value={reason}
              checked={selected}
              onChange={() => onChange(reason)}
              className="sr-only"
            />
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                selected ? "border-ink-strong" : "border-[#CCCCCC]",
              )}
            >
              {selected && <span className="h-2 w-2 rounded-full bg-ink-strong" />}
            </span>
            <span className="text-[13.5px] font-semibold text-ink">{reason}</span>
          </label>
        );
      })}
    </div>
  );
}
