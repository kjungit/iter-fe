"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { DateRangeCalendar } from "@/components/equipment/DateRangeCalendar";
import { diffInDays, parseISODate, type DateRange } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import {
  AVAILABILITY_REASON_LABELS,
  EQUIPMENT_CATEGORY_LABELS,
  PRODUCT_CONDITION_LABELS,
  fetchEquipmentAvailability,
  fetchEquipmentDetail,
} from "@/lib/api/equipment";

interface EquipmentDetailViewProps {
  equipmentId: string;
}

export function EquipmentDetailView({ equipmentId }: EquipmentDetailViewProps) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange>({ start: null, end: null });

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ["equipment", "detail", equipmentId],
    queryFn: () => fetchEquipmentDetail(equipmentId),
  });

  const { data: availability, isFetching: isCheckingAvailability } = useQuery({
    queryKey: ["equipment", "availability", equipmentId, range.start, range.end],
    queryFn: () => fetchEquipmentAvailability(equipmentId, range.start!, range.end!),
    enabled: !!range.start && !!range.end,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1180px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="mx-auto max-w-[1180px] px-6 py-16 text-center text-[13px] text-text-secondary">
        장비를 찾을 수 없습니다.{" "}
        <Link href="/" className="font-semibold text-ink-strong">
          목록으로
        </Link>
      </div>
    );
  }

  const days =
    range.start && range.end ? diffInDays(parseISODate(range.end), parseISODate(range.start)) + 1 : 0;
  const totalPrice = days * item.dailyPrice;
  const thumbnails = item.images.slice(0, 4);
  const unavailable = !!range.start && !!range.end && availability !== undefined && !availability.available;

  const handleRequest = () => {
    if (!range.start || !range.end || unavailable) return;
    router.push(`/equipment/${item.id}/request?start=${range.start}&end=${range.end}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 pt-7 pb-24">
      <Link href="/" className="text-[13px] font-semibold text-text-secondary">
        ← 목록으로
      </Link>

      <div className="mt-5 grid grid-cols-[1.1fr_0.9fr] items-start gap-12">
        <div>
          <ImagePlaceholder rounded="rounded-xl" className="mb-3" src={thumbnails[0]?.imageUrl} alt={item.name} />
          <div className="flex gap-2.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <ImagePlaceholder
                key={index}
                size="sm"
                rounded="rounded-sm"
                className="flex-1"
                src={thumbnails[index]?.imageUrl}
                alt={item.name}
              />
            ))}
          </div>
          <div className="mt-7 rounded-lg bg-surface px-5 py-[18px]">
            <h2 className="text-[13px] font-bold text-ink">상품 설명</h2>
            <p className="mt-2 text-[13.5px] leading-[1.65] text-text-body-1">{item.description}</p>
          </div>
        </div>

        <div>
          <div className="text-[13px] font-semibold text-text-secondary">
            {EQUIPMENT_CATEGORY_LABELS[item.category]}
          </div>
          <h1 className="mt-1 text-[24px] font-extrabold text-ink">{item.name}</h1>

          <div className="mt-3 flex gap-2">
            <Badge
              label={`상태: ${PRODUCT_CONDITION_LABELS[item.productCondition]}`}
              palette="progress"
              size="md"
            />
            <Badge label={`등록자: ${item.owner.nickname}`} palette="neutral" size="md" />
          </div>

          <div className="mt-[22px] border-t border-border pt-5">
            <span className="text-[26px] font-extrabold text-ink">{formatCurrency(item.dailyPrice)}</span>
            <span className="ml-1 text-[14px] font-semibold text-text-secondary">/ 일</span>
          </div>

          <DateRangeCalendar value={range} onChange={setRange} />

          {days > 0 && (
            <div className="mt-3.5 flex justify-between rounded-md bg-surface px-4 py-[14px]">
              <span className="text-[13.5px] text-text-body-2">예상 대여 금액 ({days}일)</span>
              <span className="text-[13.5px] font-extrabold text-ink">{formatCurrency(totalPrice)}</span>
            </div>
          )}

          {unavailable && availability?.reason && (
            <p className="mt-3 text-[12.5px] text-badge-danger-fg">
              {AVAILABILITY_REASON_LABELS[availability.reason]}
            </p>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="mt-4 rounded-md"
            disabled={days === 0 || unavailable || isCheckingAvailability}
            onClick={handleRequest}
          >
            대여 요청하기
          </Button>

          <div className="mt-7">
            <h2 className="text-[13px] font-bold text-ink">안내 사항</h2>
            <p className="mt-2 text-[12.5px] leading-[1.7] text-text-secondary">
              수령·반납 시점의 사진과 상태는 자동으로 기록되어 분쟁 발생 시 근거로 사용됩니다.
              <br />
              반납 전에는 반드시 장비 상태를 등록해야 반납 신청이 완료됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
