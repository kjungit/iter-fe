"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReportTypeRadioList } from "@/components/reports/ReportTypeRadioList";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { PhotoUploadSlotGrid } from "@/components/ui/PhotoUploadSlot";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateRange } from "@/lib/format";
import { fetchRentalDetail } from "@/lib/api/rentals";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { useAppData } from "@/lib/store/app-data-context";
import type { ReportReason } from "@/lib/types";

export function ReportForm({ rentalId }: { rentalId: string }) {
  const router = useRouter();
  const currentUser = useRequireAuth();
  const { submitReport } = useAppData();
  const confirm = useConfirm();

  const { data: rental, isLoading } = useQuery({
    queryKey: ["rental", "detail", rentalId],
    queryFn: () => fetchRentalDetail(rentalId),
    enabled: !!currentUser,
  });
  const [reason, setReason] = useState<ReportReason>("장비 파손 / 상태 불일치");
  const [detail, setDetail] = useState("");
  const [photoCount, setPhotoCount] = useState(0);

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-16 text-center text-[13px] text-text-secondary">
        대여 건을 찾을 수 없습니다.{" "}
        <Link href="/rentals" className="font-semibold text-ink-strong">
          대여내역으로
        </Link>
      </div>
    );
  }

  const isOwner = rental.owner.id === currentUser.id;
  const reportedUserId = isOwner ? rental.renter.id : rental.owner.id;
  const reportedUserName = isOwner ? rental.renter.nickname : rental.owner.nickname;

  const handleSubmit = async () => {
    if (!detail.trim()) return;
    if (!(await confirm({ message: "신고를 접수하시겠어요?" }))) return;

    submitReport({
      rentalId: rental.rentalId,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reportedUserId,
      reportedUserName,
      equipmentName: rental.equipment.equipmentName,
      reason,
      detail,
      photoUrls: Array.from({ length: photoCount }, (_, i) => `report-${rental.rentalId}-${i}`),
      disputeEligible: false,
    });
    router.push("/reports");
  };

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 pt-7 pb-24">
      <Link href={`/rentals/${rental.rentalId}`} className="text-[13px] font-semibold text-text-secondary">
        ← 돌아가기
      </Link>
      <h1 className="mt-2 text-[20px] font-extrabold text-ink">신고 접수</h1>
      <p className="mt-2 mb-5 text-[12.5px] text-text-secondary">
        문제가 발생한 거래에 대해 알려주세요.
      </p>

      <div className="flex gap-3 rounded-md border border-border p-3.5">
        <div className="h-12 w-12 shrink-0">
          <ImagePlaceholder rounded="rounded-sm" src={rental.equipment.thumbnailUrl} alt={rental.equipment.equipmentName} />
        </div>
        <div>
          <div className="text-[13.5px] font-bold text-ink">{rental.equipment.equipmentName}</div>
          <div className="mt-0.5 text-[12px] text-text-secondary">
            {formatDateRange(rental.startDate, rental.endDate)}
          </div>
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

      <h2 className="mt-6 mb-2.5 text-[14px] font-bold text-ink">증빙 사진</h2>
      <PhotoUploadSlotGrid
        filledCount={photoCount}
        onAdd={() => setPhotoCount((count) => Math.min(4, count + 1))}
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-7 rounded-md"
        disabled={!detail.trim()}
        onClick={handleSubmit}
      >
        신고 접수
      </Button>
    </div>
  );
}
