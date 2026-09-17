"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { PhotoUploadSlot } from "@/components/ui/PhotoUploadSlot";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import { CAPTURE_VIEWS, PRODUCT_CONDITIONS, PRODUCT_CONDITION_LABELS, type ProductCondition } from "@/lib/api/equipment";
import { putToPresignedUrl } from "@/lib/api/s3-upload";
import { compressImage } from "@/lib/image-compress";
import { ApiError } from "@/lib/api/client";
import { createReceipt, requestEvidenceImagePresignedUrls } from "@/lib/api/rentals";
import type { RentalDetail } from "@/lib/api/rentals";

const CAPTURE_VIEW_LABELS = { FRONT: "정면", SIDE: "측면", REAR: "후면" } as const;
type EvidencePhoto = { objectKey: string; viewUrl: string };

export function BorrowerShippingPanel({ rental }: { rental: RentalDetail }) {
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<(EvidencePhoto | null)[]>(Array(CAPTURE_VIEWS.length).fill(null));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [condition, setCondition] = useState<ProductCondition>("NORMAL");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createReceipt(rental.rentalId, {
        productCondition: condition,
        conditionDetail: memo,
        images: photos.flatMap((photo, index) => photo ? [{
          captureView: CAPTURE_VIEWS[index], objectKey: photo.objectKey,
        }] : []),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental", "detail", rental.rentalId] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "수령 확인에 실패했습니다."),
  });

  const openFilePicker = (index: number) => {
    if (uploadingIndex !== null) return;

    setActiveSlot(index);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || activeSlot === null) return;

    const slotIndex = activeSlot;
    setUploadingIndex(slotIndex);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const [upload] = await requestEvidenceImagePresignedUrls(rental.rentalId, [
        { captureView: CAPTURE_VIEWS[slotIndex], contentType: compressed.type, size: compressed.size },
      ]);
      await putToPresignedUrl(upload.uploadUrl, compressed, upload.requiredHeaders);
      setPhotos((prev) => {
        const next = [...prev];
        next[slotIndex] = { objectKey: upload.objectKey, viewUrl: upload.viewUrl };
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "사진 업로드에 실패했습니다.");
    } finally {
      setUploadingIndex(null);
      setActiveSlot(null);
    }
  };

  const uploadedPhotos = photos.filter((photo): photo is EvidencePhoto => photo !== null);

  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">수령 상태 확인</h2>
      <p className="mt-2 text-[12.5px] text-text-secondary">
        받은 장비의 정면·측면·후면을 등록하면 반납 시 같은 방향끼리 비교합니다.
      </p>
      <p className="mt-1 text-[12px] text-text-tertiary">측면은 제품 정면을 바라본 기준 오른쪽 면을 촬영해 주세요.</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mt-4 grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={CAPTURE_VIEWS[index]}>
            <p className="mb-1 text-center text-xs font-semibold">{CAPTURE_VIEW_LABELS[CAPTURE_VIEWS[index]]} (필수)</p>
            <PhotoUploadSlot src={photo?.viewUrl ?? null} loading={uploadingIndex === index}
              onClick={() => openFilePicker(index)} />
          </div>
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
        disabled={uploadedPhotos.length !== CAPTURE_VIEWS.length || uploadingIndex !== null}
        loading={mutation.isPending}
        onClick={() => {
          if (uploadingIndex !== null) return;

          setError(null);
          mutation.mutate();
        }}
      >
        수령 확인 완료
      </Button>
    </PanelShell>
  );
}
