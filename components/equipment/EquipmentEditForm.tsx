"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  PRODUCT_CONDITIONS,
  PRODUCT_CONDITION_LABELS,
  fetchEquipmentDetail,
  updateEquipment,
  type ProductCondition,
} from "@/lib/api/equipment";
import { ApiError } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

interface EquipmentEditFormProps {
  equipmentId: string;
}

export function EquipmentEditForm({ equipmentId }: EquipmentEditFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useRequireAuth();

  const { data: item, isLoading } = useQuery({
    queryKey: ["equipment", "detail", equipmentId],
    queryFn: () => fetchEquipmentDetail(equipmentId),
  });

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<ProductCondition>("NORMAL");
  const [conditionDetail, setConditionDetail] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!appliedRef.current && item) {
      appliedRef.current = true;
      setName(item.name);
      setPrice(String(item.dailyPrice));
      setDescription(item.description);
      setCondition(item.productCondition);
      setConditionDetail(item.conditionDetail ?? "");
      setAvailableFrom(item.availableFrom ?? "");
      setAvailableTo(item.availableTo ?? "");
    }
  }, [item]);

  const mutation = useMutation({
    mutationFn: () =>
      updateEquipment(equipmentId, {
        name,
        description,
        dailyPrice: Number(price),
        availableFrom,
        availableTo,
        productCondition: condition,
        conditionDetail: condition === "NORMAL" ? undefined : conditionDetail,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", "detail", equipmentId] });
      queryClient.invalidateQueries({ queryKey: ["equipment", "mine"] });
      router.push(`/equipment/${equipmentId}`);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "장비 수정에 실패했습니다."),
  });

  if (!currentUser) return null;

  if (isLoading || !item) {
    return (
      <div className="mx-auto max-w-[620px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  if (item.owner.id !== currentUser.id) {
    return (
      <div className="mx-auto max-w-[620px] px-6 py-16 text-center text-[13px] text-text-secondary">
        본인이 등록한 장비만 수정할 수 있습니다.
      </div>
    );
  }

  const canSubmit =
    name.trim().length > 0 &&
    Number(price) > 0 &&
    description.trim().length > 0 &&
    availableFrom <= availableTo &&
    (condition === "NORMAL" || conditionDetail.trim().length > 0);

  return (
    <div className="mx-auto w-full max-w-[620px] px-6 pt-7 pb-24">
      <Link href={`/equipment/${equipmentId}`} className="text-[13px] font-semibold text-text-secondary">
        ← 상세로
      </Link>
      <h1 className="mt-2 mb-5 text-[20px] font-extrabold text-ink">장비 정보 수정</h1>

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
        {condition !== "NORMAL" && (
          <Input
            placeholder="상품 상태 상세 (예: 좌측 상단 스크래치)"
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

      {error && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-7 rounded-md"
        disabled={!canSubmit}
        loading={mutation.isPending}
        onClick={() => {
          setError(null);
          mutation.mutate();
        }}
      >
        수정 완료
      </Button>
    </div>
  );
}
