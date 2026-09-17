"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { PhotoUploadSlot } from "@/components/ui/PhotoUploadSlot";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_LABELS,
  PRODUCT_CONDITIONS,
  PRODUCT_CONDITION_LABELS,
  CAPTURE_VIEWS,
  createEquipment,
  type EquipmentCategory,
  type ProductCondition,
} from "@/lib/api/equipment";
import { EquipmentDraftPanel } from "@/components/equipment/EquipmentDraftPanel";
import type { EquipmentDraft } from "@/lib/api/equipment-draft";
import {
  uploadEquipmentPhoto,
  refreshEquipmentPhoto,
  draftFormPatch,
  type UploadedEquipmentPhoto,
} from "@/lib/equipment-registration";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { compressImage } from "@/lib/image-compress";
import { ApiError } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { toISODate } from "@/lib/date";

const CAPTURE_VIEW_LABELS = {
  FRONT: "정면",
  SIDE: "측면",
  REAR: "후면",
} as const;

interface PhotoSlot extends UploadedEquipmentPhoto {
  previewUrl: string;
}

// 새 장비의 기본 대여 가능 종료일을 오늘로부터 1년 뒤로 계산한다.
function defaultAvailableTo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return toISODate(date);
}

// 사진 업로드, AI 초안 적용, 최종 장비 등록을 한 화면에서 관리한다.
export function EquipmentRegisterForm() {
  const router = useRouter();
  const currentUser = useRequireAuth();
  const confirm = useConfirm();

  const [category, setCategory] = useState<EquipmentCategory>(EQUIPMENT_CATEGORIES[0]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<ProductCondition>("NORMAL");
  const [conditionDetail, setConditionDetail] = useState("");
  const [availableFrom, setAvailableFrom] = useState(() => toISODate(new Date()));
  const [availableTo, setAvailableTo] = useState(defaultAvailableTo);
  const [photos, setPhotos] = useState<(PhotoSlot | null)[]>(Array(CAPTURE_VIEWS.length).fill(null));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);
  const photoVersionRef = useRef(0);
  const previewUrls = useRef(new Set<string>());
  const mounted = useRef(true);
  const photoOperation = useRef(false);
  const photoRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;
    const urls = previewUrls.current;
    return () => {
      // 컴포넌트가 사라진 뒤 state를 바꾸지 않고, 브라우저 메모리의 미리보기 URL도 해제한다.
      mounted.current = false;
      photoRequest.current?.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => router.push("/mypage"),
    onError: (err) => setError(err instanceof ApiError ? err.message : "장비 등록에 실패했습니다."),
  });

  if (!currentUser) {
    return null;
  }

  const filledPhotos = photos.filter((slot): slot is PhotoSlot => slot !== null);
  const hasName = name.trim().length > 0;
  const hasValidPrice = Number(price) > 0;
  const hasDescription = description.trim().length > 0;
  const hasPhoto = filledPhotos.length === CAPTURE_VIEWS.length;
  const hasValidRentalPeriod = availableFrom <= availableTo;
  const hasConditionDetail = condition === "NORMAL" || conditionDetail.trim().length > 0;
  const canSubmit = hasName
    && hasValidPrice
    && hasDescription
    && hasPhoto
    && hasValidRentalPeriod
    && hasConditionDetail;

  const openFilePicker = (index: number) => {
    // 업로드·AI 분석·최종 등록이 동시에 사진 목록을 변경하지 못하게 한다.
    if (photoOperation.current || aiBusy || createMutation.isPending) {
      return;
    }

    setActiveSlot(index);
    fileInputRef.current?.click();
  };

  // 선택한 사진을 압축·임시 업로드하고 기존 AI 초안은 초기화한다.
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const cannotUpload = !file
      || activeSlot === null
      || photoOperation.current
      || aiBusy
      || createMutation.isPending;
    if (cannotUpload) {
      return;
    }

    const slotIndex = activeSlot;
    photoOperation.current = true;
    setUploadingIndex(slotIndex);
    setError(null);
    const controller = new AbortController();
    photoRequest.current = controller;
    try {
      const compressed = await compressImage(file);
      const upload = await uploadEquipmentPhoto(CAPTURE_VIEWS[slotIndex], compressed, controller.signal);
      if (!mounted.current) {
        return;
      }

      const previewUrl = URL.createObjectURL(compressed);
      previewUrls.current.add(previewUrl);

      // 비동기 업로드를 시작할 때 선택했던 칸에 결과를 저장한다.
      setPhotos((prev) => {
        const next = [...prev];
        next[slotIndex] = { previewUrl, ...upload };
        return next;
      });
      resetDraft();
    } catch (err) {
      if (mounted.current) {
        const message = err instanceof ApiError ? err.message : "사진 업로드에 실패했습니다.";
        setError(message);
      }
    } finally {
      photoRequest.current = null;
      photoOperation.current = false;
      if (mounted.current) {
        setUploadingIndex(null);
        setActiveSlot(null);
      }
    }
  };

  function resetDraft() {
    // key가 바뀌면 EquipmentDraftPanel이 새로 생성되어 이전 사진의 AI 결과가 사라진다.
    photoVersionRef.current += 1;
    setPhotoVersion(photoVersionRef.current);
  }

  function removePhoto(index: number) {
    if (photoOperation.current || aiBusy || createMutation.isPending) {
      return;
    }

    const slot = photos[index];
    if (slot) {
      URL.revokeObjectURL(slot.previewUrl);
      previewUrls.current.delete(slot.previewUrl);
    }
    setPhotos((prev) => prev.map((photo, i) => i === index ? null : photo));
    resetDraft();
  }

  // 만료될 수 있는 임시 업로드를 순서대로 갱신해 AI와 최종 등록에 사용할 키를 만든다.
  async function prepareImages(parentSignal?: AbortSignal): Promise<string[]> {
    if (photoOperation.current) {
      throw new Error("사진 업로드가 진행 중입니다.");
    }

    photoOperation.current = true;
    setPreparing(true);
    const controller = new AbortController();
    photoRequest.current = controller;
    const signal = AbortSignal.any([controller.signal, parentSignal ?? AbortSignal.timeout(90_000)]);
    try {
      const refreshed = [...photos];
      for (let index = 0; index < refreshed.length; index += 1) {
        const photo = refreshed[index];
        signal.throwIfAborted();

        if (photo) {
          // 만료가 가까운 임시 업로드는 같은 사진으로 새 key를 발급받는다.
          refreshed[index] = await refreshEquipmentPhoto(CAPTURE_VIEWS[index], photo, signal);
        }
        if (!mounted.current) {
          throw new Error("화면이 닫혔습니다.");
        }

        setPhotos([...refreshed]);
      }

      const availablePhotos = refreshed.filter(
        (photo): photo is PhotoSlot => photo !== null,
      );
      return availablePhotos.map((photo) => photo.objectKey);
    } finally {
      photoRequest.current = null;
      photoOperation.current = false;
      if (mounted.current) {
        setPreparing(false);
      }
    }
  }

  // 사용자가 확인한 경우에만 AI 제안 값을 현재 등록 폼에 반영한다.
  async function applyDraft(draft: EquipmentDraft) {
    // 확인창이 열린 사이 사진이 바뀌면 오래된 사진의 AI 초안을 적용하지 않는다.
    const version = photoVersionRef.current;
    const accepted = await confirm({
      message: "AI가 제안한 이름·분류·설명·상태를 현재 입력값에 적용할까요? 가격·기간·사진은 유지됩니다.",
      confirmLabel: "초안 적용",
    });
    if (!accepted || !mounted.current || version !== photoVersionRef.current) {
      return;
    }

    const patch = draftFormPatch(draft);
    if (patch.name !== undefined) {
      setName(patch.name);
    }
    if (patch.category !== undefined) {
      setCategory(patch.category);
    }
    if (patch.description !== undefined) {
      setDescription(patch.description);
    }
    if (patch.condition !== undefined) {
      setCondition(patch.condition);
    }
    if (patch.conditionDetail !== undefined) {
      setConditionDetail(patch.conditionDetail);
    }
  }

  // 사진 키를 최종 갱신한 뒤 사용자가 확인한 폼 값으로 장비를 등록한다.
  const handleSubmit = async () => {
    if (!canSubmit || photoOperation.current || aiBusy || createMutation.isPending) {
      return;
    }

    setError(null);
    try {
      const imageKeys = await prepareImages();
      if (!mounted.current) {
        return;
      }

      createMutation.mutate({
        category,
        name,
        description,
        dailyPrice: Number(price),
        availableFrom,
        availableTo,
        productCondition: condition,
        conditionDetail: condition === "NORMAL" ? undefined : conditionDetail,
        images: imageKeys.map((objectKey, index) => ({
          captureView: CAPTURE_VIEWS[index],
          objectKey,
        })),
      });
    } catch (err) {
      if (mounted.current) {
        const message = err instanceof ApiError
          ? err.message
          : "사진을 준비하지 못했습니다. 다시 시도해주세요.";
        setError(message);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-[620px] px-6 pt-7 pb-24">
      <h1 className="mb-5 text-[20px] font-extrabold text-ink">장비 등록</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {EQUIPMENT_CATEGORIES.map((item) => (
          <Chip key={item} size="sm" selected={item === category} onClick={() => setCategory(item)}>
            {EQUIPMENT_CATEGORY_LABELS[item]}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <Input placeholder="장비 이름" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
        <Input
          type="number"
          placeholder="일 대여료 (원)"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
        <Textarea
          minHeight={90}
          placeholder="상품 설명"
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Select value={condition} onChange={(event) => setCondition(event.target.value as ProductCondition)}>
          {PRODUCT_CONDITIONS.map((option) => (
            <option key={option} value={option}>
              {PRODUCT_CONDITION_LABELS[option]}
            </option>
          ))}
        </Select>
        {condition !== "NORMAL" && (
          <Input
            placeholder="상품 상태 상세 (예: 좌측 상단 스크래치)"
            maxLength={500}
            value={conditionDetail}
            onChange={(event) => setConditionDetail(event.target.value)}
          />
        )}
        <div className="flex gap-2.5">
          <Input
            type="date"
            className="flex-1"
            value={availableFrom}
            onChange={(event) => setAvailableFrom(event.target.value)}
          />
          <Input
            type="date"
            className="flex-1"
            value={availableTo}
            onChange={(event) => setAvailableTo(event.target.value)}
          />
        </div>
      </div>

      <h2 className="mt-6 mb-2.5 text-[14px] font-bold text-ink">
        장비 사진 <span className="font-normal text-text-tertiary">(정면·측면·후면 필수, 정면이 대표 이미지)</span>
      </h2>
      <p className="mb-2 text-[12px] text-text-secondary">
        측면은 제품 정면을 바라본 기준 오른쪽 면을 촬영해 주세요.
      </p>
      <fieldset disabled={uploadingIndex !== null || preparing || aiBusy || createMutation.isPending} className="grid grid-cols-3 gap-2">
        {photos.map((slot, index) => (
          <div key={index}>
            <p className="mb-1 text-center text-xs font-semibold">{CAPTURE_VIEW_LABELS[CAPTURE_VIEWS[index]]} (필수)</p>
            <PhotoUploadSlot
              src={slot?.previewUrl}
              loading={uploadingIndex === index}
              onClick={() => openFilePicker(index)}
            />
            {slot && <button type="button" className="mt-1 text-xs text-text-secondary disabled:opacity-50" onClick={() => removePhoto(index)} aria-label={`${index + 1}번 사진 삭제`}>삭제</button>}
          </div>
        ))}
      </fieldset>

      <EquipmentDraftPanel
        key={`${currentUser.id}:${photoVersion}`}
        disabled={filledPhotos.length === 0 || uploadingIndex !== null || preparing || createMutation.isPending}
        name={name}
        prepareImages={prepareImages}
        onApply={(draft) => void applyDraft(draft)}
        onBusyChange={setAiBusy}
      />

      {error && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-7 rounded-md"
        disabled={!canSubmit || uploadingIndex !== null || aiBusy}
        loading={createMutation.isPending || preparing}
        onClick={() => void handleSubmit()}
      >
        등록하기
      </Button>
    </div>
  );
}
