"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { DateRangeCalendar } from "@/components/equipment/DateRangeCalendar";
import { diffInDays, parseISODate, toISODate, type DateRange } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import {
  AVAILABILITY_REASON_LABELS,
  EQUIPMENT_CATEGORY_LABELS,
  PRODUCT_CONDITION_LABELS,
  deleteEquipment,
  fetchEquipmentAvailability,
  fetchEquipmentDetail,
  fetchEquipmentEstimate,
  updateEquipmentStatus,
} from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/client";
import { equipmentStatusBadge } from "@/lib/status";
import { useAppData } from "@/lib/store/app-data-context";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { UserRatingBadge } from "@/components/reviews/UserRatingBadge";

interface EquipmentDetailViewProps {
  equipmentId: string;
}

export function EquipmentDetailView({ equipmentId }: EquipmentDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { currentUser } = useAppData();
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ["equipment", "detail", equipmentId],
    queryFn: () => fetchEquipmentDetail(equipmentId),
  });

  const isSingleDay = !!range.start && range.start === range.end;
  const hasFullRange = !!range.start && !!range.end && !isSingleDay;

  const { data: availability, isFetching: isCheckingAvailability } = useQuery({
    queryKey: ["equipment", "availability", equipmentId, range.start, range.end],
    queryFn: () => fetchEquipmentAvailability(equipmentId, range.start!, range.end!),
    enabled: hasFullRange,
  });

  const { data: estimate, isFetching: isEstimating } = useQuery({
    queryKey: ["equipment", "estimate", equipmentId, range.start, range.end],
    queryFn: () => fetchEquipmentEstimate(equipmentId, range.start!, range.end!),
    enabled: hasFullRange,
  });

  const statusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "INACTIVE") => updateEquipmentStatus(equipmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", "detail", equipmentId] });
      queryClient.invalidateQueries({ queryKey: ["equipment", "mine"] });
    },
    onError: (err) =>
      setOwnerError(err instanceof ApiError ? err.message : "상태 변경에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEquipment(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", "mine"] });
      router.push("/mypage");
    },
    onError: (err) => setOwnerError(err instanceof ApiError ? err.message : "삭제에 실패했습니다."),
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

  const localDays =
    range.start && range.end ? diffInDays(parseISODate(range.end), parseISODate(range.start)) + 1 : 0;
  const days = estimate?.rentalDays ?? localDays;
  const totalPrice = estimate?.totalPrice ?? days * item.dailyPrice;
  const thumbnails = item.images.slice(0, 4);
  // 대표 이미지는 배열의 첫 번째가 아니라 등록 시 지정한 thumbnail=true 이미지를 기본값으로 하되,
  // 사용자가 좌측 썸네일을 클릭하면 그 이미지를 우선 보여준다.
  const defaultMainImage = item.images.find((image) => image.thumbnail) ?? thumbnails[0];
  const mainImage = item.images.find((image) => image.id === selectedImageId) ?? defaultMainImage;
  const unavailable = hasFullRange && availability !== undefined && !availability.available;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = toISODate(tomorrow);
  const minIso =
    item.availableFrom && item.availableFrom > tomorrowIso ? item.availableFrom : tomorrowIso;
  const maxIso = item.availableTo ?? undefined;

  const isOwner = !!currentUser && currentUser.id === item.owner.id;

  const handleRequest = () => {
    if (!range.start || !range.end || isSingleDay || unavailable) return;
    router.push(`/equipment/${item.id}/request?start=${range.start}&end=${range.end}`);
  };

  const handleToggleStatus = () => {
    statusMutation.mutate(item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
  };

  const handleDelete = async () => {
    if (await confirm({ message: "이 장비를 삭제하시겠어요? 삭제 후에는 되돌릴 수 없습니다." })) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 pt-7 pb-24">
      <Link href="/" className="text-[13px] font-semibold text-text-secondary">
        ← 목록으로
      </Link>

      <div className="mt-5 grid grid-cols-[1.1fr_0.9fr] items-start gap-12">
        <div>
          <div className="flex gap-2.5">
            <div className="flex w-16 shrink-0 flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => {
                const thumb = thumbnails[index];
                const isSelected = !!thumb && thumb.id === mainImage?.id;
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={!thumb}
                    onClick={() => thumb && setSelectedImageId(thumb.id)}
                    className={
                      isSelected ? "rounded-sm outline outline-2 outline-offset-1 outline-ink-strong" : undefined
                    }
                  >
                    <ImagePlaceholder size="sm" rounded="rounded-sm" src={thumb?.imageUrl} alt={item.name} />
                  </button>
                );
              })}
            </div>
            <ImagePlaceholder
              rounded="rounded-xl"
              className="min-w-0 flex-1"
              src={mainImage?.imageUrl}
              alt={item.name}
            />
          </div>
          <div className="mt-7 rounded-lg bg-surface px-5 py-[18px]">
            <h2 className="text-[13px] font-bold text-ink">상품 설명</h2>
            <p className="mt-2 text-[13.5px] leading-[1.65] text-text-body-1">{item.description}</p>
          </div>
        </div>

        <div className="sticky top-[84px]">
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
            <UserRatingBadge userId={item.owner.id} />
            {isOwner && (
              <Badge
                label={equipmentStatusBadge(item.status).label}
                palette={equipmentStatusBadge(item.status).palette}
                size="md"
              />
            )}
          </div>

          <div className="mt-[22px] border-t border-border pt-5">
            <span className="text-[26px] font-extrabold text-ink">{formatCurrency(item.dailyPrice)}</span>
            <span className="ml-1 text-[14px] font-semibold text-text-secondary">/ 일</span>
          </div>

          {isOwner ? (
            <div className="mt-5">
              <p className="text-[12.5px] text-text-secondary">
                내가 등록한 장비입니다. 대여 신청은 다른 사용자만 할 수 있어요.
              </p>
              {item.status === "INACTIVE" && (
                <p className="mt-1.5 text-[12.5px] text-text-secondary">
                  현재 비공개 상태라 다른 사용자에게 노출되지 않아요.
                </p>
              )}
              {item.status === "SUSPENDED" && (
                <p className="mt-1.5 text-[12.5px] text-badge-danger-fg">
                  관리자에 의해 차단된 장비입니다. 차단 해제는 관리자만 할 수 있어요.
                </p>
              )}
              {item.status === "MAINTENANCE" && (
                <p className="mt-1.5 text-[12.5px] text-badge-warning-fg">
                  점검 중인 장비입니다. 점검이 끝나면 다시 대여 가능 상태로 전환됩니다.
                </p>
              )}
              {item.status === "DELETED" && (
                <p className="mt-1.5 text-[12.5px] text-text-secondary">
                  삭제된 장비입니다. 더 이상 수정하거나 관리할 수 없어요.
                </p>
              )}

              {ownerError && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{ownerError}</p>}

              {item.status !== "DELETED" && (
                <>
                  <div className="mt-4 flex gap-2.5">
                    <Button
                      variant="secondary"
                      size="lg"
                      fullWidth
                      className="rounded-md"
                      onClick={() => router.push(`/equipment/${item.id}/edit`)}
                    >
                      수정하기
                    </Button>
                    {(item.status === "ACTIVE" || item.status === "INACTIVE") && (
                      <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        className="rounded-md"
                        loading={statusMutation.isPending}
                        onClick={handleToggleStatus}
                      >
                        {item.status === "ACTIVE" ? "숨기기" : "공개로 전환"}
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="danger-outline"
                    size="lg"
                    fullWidth
                    className="mt-2.5 rounded-md"
                    loading={deleteMutation.isPending}
                    onClick={handleDelete}
                  >
                    삭제하기
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <DateRangeCalendar value={range} onChange={setRange} minIso={minIso} maxIso={maxIso} />

              {isSingleDay && (
                <p className="mt-3 text-[12.5px] text-text-secondary">
                  최소 1박 이상 대여할 수 있어요. 반납일을 다시 선택해 주세요.
                </p>
              )}

              {hasFullRange && days > 0 && (
                <div className="mt-3.5 flex justify-between rounded-md bg-surface px-4 py-[14px]">
                  <span className="text-[13.5px] text-text-body-2">예상 대여 금액 ({days}일)</span>
                  <span className="text-[13.5px] font-extrabold text-ink">
                    {isEstimating && !estimate ? "계산 중..." : formatCurrency(totalPrice)}
                  </span>
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
                disabled={!hasFullRange || unavailable || isCheckingAvailability || isEstimating}
                onClick={handleRequest}
              >
                대여 요청하기
              </Button>

              <div className="mt-7">
                <h2 className="text-[13px] font-bold text-ink">안내 사항</h2>
                <p className="mt-2 text-[12.5px] leading-[1.7] text-text-secondary">
                  수령·반납 시점의 사진과 상태는 자동으로 기록되어 신고 발생 시 근거로 사용됩니다.
                  <br />
                  반납 전에는 반드시 장비 상태를 등록해야 반납 신청이 완료됩니다.
                </p>
              </div>

              {currentUser && (
                <div className="mt-5 text-center">
                  <Link
                    href={`/equipment/${item.id}/report`}
                    className="text-[12px] font-semibold text-text-tertiary"
                  >
                    이 매물에 문제가 있나요? 신고하기
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
