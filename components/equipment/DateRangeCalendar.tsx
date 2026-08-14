"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  addMonths,
  applyCalendarRangeClick,
  daysInMonth,
  firstWeekdayOfMonth,
  parseISODate,
  startOfMonth,
  toISODate,
  type DateRange,
} from "@/lib/date";
import { formatDateRange, formatMonthLabel } from "@/lib/format";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface DateRangeCalendarProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** ISO dates that cannot be selected (already booked by another rental). */
  disabledDates?: Set<string>;
}

export function DateRangeCalendar({ value, onChange, disabledDates }: DateRangeCalendarProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(value.start ? parseISODate(value.start) : new Date()),
  );
  const [todayIso] = useState(() => toISODate(new Date()));

  const cells: Array<string | null> = [
    ...Array.from({ length: firstWeekdayOfMonth(visibleMonth) }, () => null),
    ...Array.from({ length: daysInMonth(visibleMonth) }, (_, index) =>
      toISODate(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1)),
    ),
  ];

  return (
    <div className="relative mt-5">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-sm border border-border-input px-3.5 py-[13px]"
      >
        <span className="text-[13px] font-semibold text-ink">
          {value.start && value.end ? formatDateRange(value.start, value.end) : "대여 기간을 선택해 주세요"}
        </span>
        <span className="text-[12px] font-semibold text-text-secondary">
          {open ? "닫기" : "날짜 선택"}
        </span>
      </button>

      {open && (
        <div className="shadow-popover absolute top-[calc(100%+8px)] right-0 left-0 z-20 rounded-lg border border-border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="이전 달"
              onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-ink"
            >
              ‹
            </button>
            <span className="text-[13.5px] font-bold text-ink">{formatMonthLabel(visibleMonth)}</span>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-ink"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-[11px] font-bold text-text-tertiary">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {cells.map((iso, index) => {
              if (!iso) return <div key={index} className="aspect-square" />;

              const isEndpoint = iso === value.start || iso === value.end;
              const inRange = !!value.start && !!value.end && iso > value.start && iso < value.end;
              const isDisabled = iso < todayIso || !!disabledDates?.has(iso);

              if (isDisabled) {
                return (
                  <span
                    key={iso}
                    className="flex aspect-square items-center justify-center rounded-xs text-[12.5px] font-semibold text-text-quaternary line-through"
                  >
                    {parseISODate(iso).getDate()}
                  </span>
                );
              }

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onChange(applyCalendarRangeClick(value, iso))}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xs text-[12.5px] font-semibold text-[#222222]",
                    isEndpoint && "bg-ink-strong text-white",
                    inRange && "bg-[#F0F0F0]",
                  )}
                >
                  {parseISODate(iso).getDate()}
                </button>
              );
            })}
          </div>

          <Button
            variant="primary"
            fullWidth
            className="mt-4 rounded-sm py-[11px] text-[13px]"
            onClick={() => setOpen(false)}
          >
            완료
          </Button>
        </div>
      )}
    </div>
  );
}
