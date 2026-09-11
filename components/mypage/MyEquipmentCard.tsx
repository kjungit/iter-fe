"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { formatDailyPrice } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { deleteEquipment, updateEquipmentStatus, type MyEquipmentSummary } from "@/lib/api/equipment";
import { equipmentStatusBadge } from "@/lib/status";
import { useConfirm } from "@/lib/store/confirm-modal-context";

/** 등록자 본인이 스스로 전환 가능한 상태만 — 차단/점검/삭제는 관리자·시스템 전용. */
const SELF_SERVICE_STATUSES = new Set(["ACTIVE", "INACTIVE"]);

export function MyEquipmentCard({ item }: { item: MyEquipmentSummary }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["equipment", "mine"] });

  const statusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "INACTIVE") => updateEquipmentStatus(item.id, status),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "상태 변경에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEquipment(item.id),
    onSuccess: invalidate,
    onError: (err) => setError(err instanceof ApiError ? err.message : "삭제에 실패했습니다."),
  });

  const handleToggleVisibility = () => {
    setError(null);
    statusMutation.mutate(item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
  };

  const handleDelete = async () => {
    setError(null);
    if (await confirm({ message: "이 장비를 삭제하시겠어요? 삭제 후에는 되돌릴 수 없습니다." })) {
      deleteMutation.mutate();
    }
  };

  const badge = equipmentStatusBadge(item.status);
  const canSelfService = SELF_SERVICE_STATUSES.has(item.status);

  return (
    <div className="flex flex-col gap-1">
      <Link
        href={`/equipment/${item.id}`}
        className="flex items-center gap-2.5 rounded-md border border-border p-3"
      >
        <div className="h-11 w-11 shrink-0">
          <ImagePlaceholder rounded="rounded-sm" src={item.thumbnailUrl} alt={item.name} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-bold text-ink">{item.name}</div>
          <div className="mt-0.5 text-[12px] text-text-secondary">{formatDailyPrice(item.dailyPrice)}</div>
        </div>
        <Badge label={badge.label} palette={badge.palette} />
        {item.status !== "DELETED" && (
          <DropdownMenu
            trigger={<span className="text-[16px] leading-none">⋯</span>}
          >
            <DropdownMenuItem
              onClick={() => {
                router.push(`/equipment/${item.id}/edit`);
              }}
            >
              수정
            </DropdownMenuItem>
            {canSelfService && (
              <DropdownMenuItem onClick={handleToggleVisibility}>
                {item.status === "ACTIVE" ? "숨기기" : "공개로 전환"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem danger onClick={handleDelete}>
              삭제
            </DropdownMenuItem>
          </DropdownMenu>
        )}
      </Link>
      {error && <p className="px-1 text-[11.5px] text-badge-danger-fg">{error}</p>}
    </div>
  );
}
