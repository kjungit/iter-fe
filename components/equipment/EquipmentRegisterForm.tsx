"use client";

import { useRef, useState } from "react";
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
  createEquipment,
  type EquipmentCategory,
  type ProductCondition,
} from "@/lib/api/equipment";
import { uploadFile } from "@/lib/api/files";
import { ApiError } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { toISODate } from "@/lib/date";

const PHOTO_SLOT_COUNT = 4;

function defaultAvailableTo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return toISODate(date);
}

export function EquipmentRegisterForm() {
  const router = useRouter();
  const currentUser = useRequireAuth();

  const [category, setCategory] = useState<EquipmentCategory>(EQUIPMENT_CATEGORIES[0]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<ProductCondition>("NORMAL");
  const [availableFrom, setAvailableFrom] = useState(() => toISODate(new Date()));
  const [availableTo, setAvailableTo] = useState(defaultAvailableTo);
  const [photos, setPhotos] = useState<(string | null)[]>(Array(PHOTO_SLOT_COUNT).fill(null));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => router.push("/mypage"),
    onError: (err) => setError(err instanceof ApiError ? err.message : "장비 등록에 실패했습니다."),
  });

  if (!currentUser) return null;

  const photoUrls = photos.filter((url): url is string => url !== null);
  const canSubmit =
    name.trim().length > 0 &&
    Number(price) > 0 &&
    description.trim().length > 0 &&
    photoUrls.length > 0 &&
    availableFrom <= availableTo;

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

  const handleSubmit = () => {
    if (!canSubmit) return;
    createMutation.mutate({
      category,
      name,
      description,
      dailyPrice: Number(price),
      availableFrom,
      availableTo,
      productCondition: condition,
      imageUrls: photoUrls,
    });
  };

  return (
    <div className="mx-auto w-full max-w-[620px] px-6 pt-7 pb-24">
      <h1 className="mb-5 text-[20px] font-extrabold text-ink">장비 등록</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
        <Input placeholder="장비 이름" value={name} onChange={(event) => setName(event.target.value)} />
        <Input
          type="number"
          placeholder="일 대여료 (원)"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
        <Textarea
          minHeight={90}
          placeholder="상품 설명"
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

      <h2 className="mt-6 mb-2.5 text-[14px] font-bold text-ink">장비 사진</h2>
      <div className="grid grid-cols-4 gap-2">
        {photos.map((url, index) => (
          <PhotoUploadSlot
            key={index}
            src={url}
            loading={uploadingIndex === index}
            onClick={() => openFilePicker(index)}
          />
        ))}
      </div>

      {error && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-7 rounded-md"
        disabled={!canSubmit}
        loading={createMutation.isPending}
        onClick={handleSubmit}
      >
        등록하기
      </Button>
    </div>
  );
}
