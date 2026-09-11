"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ReportTypeRadioList } from "@/components/reports/ReportTypeRadioList";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateRange } from "@/lib/format";
import { fetchEquipmentDetail } from "@/lib/api/equipment";
import { fetchRentalDetail } from "@/lib/api/rentals";
import { createReport, type ReportReason, type ReportTargetType } from "@/lib/api/reports";
import { ApiError } from "@/lib/api/client";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

export type ReportTarget =
  | { type: "RENTAL"; rentalId: string }
  | { type: "EQUIPMENT"; equipmentId: string };

interface ReportContext {
  backHref: string;
  thumbnailUrl: string | null;
  name: string;
  meta: string | null;
}

export function ReportForm({ target }: { target: ReportTarget }) {
  const router = useRouter();
  const currentUser = useRequireAuth();
  const confirm = useConfirm();

  const rentalQuery = useQuery({
    queryKey: ["rental", "detail", target.type === "RENTAL" ? target.rentalId : null],
    queryFn: () => fetchRentalDetail((target as { type: "RENTAL"; rentalId: string }).rentalId),
    enabled: !!currentUser && target.type === "RENTAL",
  });
  const equipmentQuery = useQuery({
    queryKey: ["equipment", "detail", target.type === "EQUIPMENT" ? target.equipmentId : null],
    queryFn: () => fetchEquipmentDetail((target as { type: "EQUIPMENT"; equipmentId: string }).equipmentId),
    enabled: !!currentUser && target.type === "EQUIPMENT",
  });

  const [reason, setReason] = useState<ReportReason>("장비 파손 / 상태 불일치");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isLoading = target.type === "RENTAL" ? rentalQuery.isLoading : equipmentQuery.isLoading;

  const context: ReportContext | null =
    target.type === "RENTAL"
      ? rentalQuery.data
        ? {
            backHref: `/rentals/${rentalQuery.data.rentalId}`,
            thumbnailUrl: rentalQuery.data.equipment.thumbnailUrl,
            name: rentalQuery.data.equipment.equipmentName,
            meta: formatDateRange(rentalQuery.data.startDate, rentalQuery.data.endDate),
          }
        : null
      : equipmentQuery.data
        ? {
            backHref: `/equipment/${equipmentQuery.data.id}`,
            thumbnailUrl: equipmentQuery.data.images[0]?.imageUrl ?? null,
            name: equipmentQuery.data.name,
            meta: null,
          }
        : null;

  const targetType: ReportTargetType = target.type;
  const targetId = target.type === "RENTAL" ? target.rentalId : target.equipmentId;

  const mutation = useMutation({
    mutationFn: () => createReport({ targetType, targetId, reason, description: detail }),
    onSuccess: () => router.push("/reports"),
    onError: (err) => setError(err instanceof ApiError ? err.message : "신고 접수에 실패했습니다."),
  });

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  if (!context) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-16 text-center text-[13px] text-text-secondary">
        신고 대상을 찾을 수 없습니다.{" "}
        <Link href="/" className="font-semibold text-ink-strong">
          홈으로
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!detail.trim()) return;
    setError(null);
    if (!(await confirm({ message: "신고를 접수하시겠어요?" }))) return;
    mutation.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 pt-7 pb-24">
      <Link href={context.backHref} className="text-[13px] font-semibold text-text-secondary">
        ← 돌아가기
      </Link>
      <h1 className="mt-2 text-[20px] font-extrabold text-ink">신고 접수</h1>
      <p className="mt-2 mb-5 text-[12.5px] text-text-secondary">
        {target.type === "RENTAL"
          ? "문제가 발생한 거래에 대해 알려주세요."
          : "이 장비/매물에 대한 문제를 알려주세요."}
      </p>

      <div className="flex gap-3 rounded-md border border-border p-3.5">
        <div className="h-12 w-12 shrink-0">
          <ImagePlaceholder rounded="rounded-sm" src={context.thumbnailUrl} alt={context.name} />
        </div>
        <div>
          <div className="text-[13.5px] font-bold text-ink">{context.name}</div>
          {context.meta && <div className="mt-0.5 text-[12px] text-text-secondary">{context.meta}</div>}
        </div>
      </div>

      <h2 className="mt-6 mb-2.5 text-[14px] font-bold text-ink">신고 유형</h2>
      <ReportTypeRadioList value={reason} onChange={setReason} />

      <h2 className="mt-6 mb-2.5 text-[14px] font-bold text-ink">상세 내용</h2>
      <Textarea
        minHeight={110}
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        placeholder="어떤 문제가 있었는지 구체적으로 적어주세요."
      />

      {error && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-7 rounded-md"
        disabled={!detail.trim()}
        loading={mutation.isPending}
        onClick={handleSubmit}
      >
        신고 접수
      </Button>
    </div>
  );
}
