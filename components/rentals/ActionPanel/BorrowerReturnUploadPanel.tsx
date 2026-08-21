"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { PhotoUploadSlot } from "@/components/ui/PhotoUploadSlot";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { PRODUCT_CONDITIONS, PRODUCT_CONDITION_LABELS, type ProductCondition } from "@/lib/api/equipment";
import { uploadFile } from "@/lib/api/files";
import { ApiError } from "@/lib/api/client";
import { createReturnEvidence } from "@/lib/api/rentals";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import type { RentalDetail } from "@/lib/api/rentals";

const PHOTO_SLOT_COUNT = 4;

export function BorrowerReturnUploadPanel({ rental }: { rental: RentalDetail }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [photos, setPhotos] = useState<(string | null)[]>(Array(PHOTO_SLOT_COUNT).fill(null));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [condition, setCondition] = useState<ProductCondition>("NORMAL");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createReturnEvidence(rental.rentalId, {
        productCondition: condition,
        conditionDetail: memo,
        imageUrls: photos.filter((url): url is string => url !== null),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental", "detail", rental.rentalId] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "반납 신청 제출에 실패했습니다."),
  });

  const openFilePicker = (index: number) => {
    setActiveSlot(index);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || activeSlot === null) return;

    setUploadingIndex(activeSlot);
    setError(null);
    try {
      const url = await uploadFile(file);
      setPhotos((prev) => {
        const next = [...prev];
        next[activeSlot] = url;
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "사진 업로드에 실패했습니다.");
    } finally {
      setUploadingIndex(null);
      setActiveSlot(null);
    }
  };

  const photoUrls = photos.filter((url): url is string => url !== null);

  const handleSubmit = async () => {
    setError(null);
    if (await confirm({ message: "반납 신청을 제출하시겠어요? 제출 후에는 되돌릴 수 없습니다." })) {
      mutation.mutate();
    }
  };

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">반납 전 상태 등록</h2>
      <p className="mt-2 text-[12.5px] text-text-secondary">
        반납 직전 사진과 상태를 등록하면 수령 시점 기록과 자동 비교됩니다.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mt-4 grid grid-cols-4 gap-2">
        {photos.map((url, index) => (
          <PhotoUploadSlot
            key={index}
            src={url}
            loading={uploadingIndex === index}
            onClick={() => openFilePicker(index)}
          />
        ))}
      </div>
      <Select
        className="mt-3"
        value={condition}
        onChange={(event) => setCondition(event.target.value as ProductCondition)}
      >
        {PRODUCT_CONDITIONS.map((option) => (
          <option key={option} value={option}>
            {PRODUCT_CONDITION_LABELS[option]}
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
      {error && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{error}</p>}
      <Button
        variant="primary"
        fullWidth
        className="mt-4"
        disabled={photoUrls.length === 0}
        loading={mutation.isPending}
        onClick={handleSubmit}
      >
        반납 신청 제출
      </Button>
    </PanelShell>
  );
}
