"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { PhotoUploadSlotGrid } from "@/components/ui/PhotoUploadSlot";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { EQUIPMENT_CATEGORIES } from "@/lib/mock-data";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { useAppData } from "@/lib/store/app-data-context";
import type { EquipmentCategory, EquipmentCondition } from "@/lib/types";

const CONDITIONS: EquipmentCondition[] = ["양호", "사용감 있음", "파손·이상 있음"];

export function EquipmentRegisterForm() {
  const router = useRouter();
  const currentUser = useRequireAuth();
  const { registerEquipment } = useAppData();

  const [category, setCategory] = useState<EquipmentCategory>(EQUIPMENT_CATEGORIES[0]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<EquipmentCondition>("양호");
  const [photoCount, setPhotoCount] = useState(0);

  if (!currentUser) return null;

  const canSubmit = name.trim().length > 0 && Number(price) > 0 && description.trim().length > 0;

  const handleSubmit = () => {
    registerEquipment({
      name,
      category,
      description,
      pricePerDay: Number(price),
      condition,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
    });
    router.push("/mypage");
  };

  return (
    <div className="mx-auto w-full max-w-[620px] px-6 pt-7 pb-24">
      <h1 className="mb-5 text-[20px] font-extrabold text-ink">장비 등록</h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {EQUIPMENT_CATEGORIES.map((item) => (
          <Chip key={item} size="sm" selected={item === category} onClick={() => setCategory(item)}>
            {item}
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
        <Select
          value={condition}
          onChange={(event) => setCondition(event.target.value as EquipmentCondition)}
        >
          {CONDITIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      <h2 className="mt-6 mb-2.5 text-[14px] font-bold text-ink">장비 사진</h2>
      <PhotoUploadSlotGrid
        filledCount={photoCount}
        onAdd={() => setPhotoCount((count) => Math.min(4, count + 1))}
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-7 rounded-md"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        등록하기
      </Button>
    </div>
  );
}
