"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { diffInDays, parseISODate } from "@/lib/date";
import { formatCurrency, formatDateRange } from "@/lib/format";
import { fetchEquipmentDetail } from "@/lib/api/equipment";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { useAppData } from "@/lib/store/app-data-context";
import type { ShippingAddress } from "@/lib/types";

const EMPTY_ADDRESS: ShippingAddress = {
  recipientName: "",
  phone: "",
  zipcode: "",
  address: "",
  detailAddress: "",
};

interface RequestFormProps {
  equipmentId: string;
  start: string | null;
  end: string | null;
}

export function RequestForm({ equipmentId, start, end }: RequestFormProps) {
  const router = useRouter();
  const currentUser = useRequireAuth();
  const { createRentalRequest } = useAppData();
  const { data: item, isLoading } = useQuery({
    queryKey: ["equipment", "detail", equipmentId],
    queryFn: () => fetchEquipmentDetail(equipmentId),
  });

  const [address, setAddress] = useState<ShippingAddress>(
    currentUser?.defaultAddress ?? EMPTY_ADDRESS,
  );
  const [message, setMessage] = useState("");

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[620px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  if (!item || !start || !end) {
    return (
      <div className="mx-auto max-w-[620px] px-6 py-16 text-center text-[13px] text-text-secondary">
        대여 기간을 먼저 선택해 주세요.{" "}
        <Link href={item ? `/equipment/${item.id}` : "/"} className="font-semibold text-ink-strong">
          상세로 돌아가기
        </Link>
      </div>
    );
  }

  const days = diffInDays(parseISODate(end), parseISODate(start)) + 1;
  const totalPrice = days * item.dailyPrice;

  const updateAddress = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit =
    address.recipientName.trim().length > 0 &&
    address.phone.trim().length > 0 &&
    address.zipcode.trim().length > 0 &&
    address.address.trim().length > 0 &&
    address.detailAddress.trim().length > 0;

  const handleSubmit = () => {
    createRentalRequest({
      equipmentId: item.id,
      ownerId: item.owner.id,
      ownerName: item.owner.nickname,
      borrowerId: currentUser.id,
      borrowerName: currentUser.name,
      startDate: start,
      endDate: end,
      totalPrice,
      message,
      shippingAddress: address,
      shipping: null,
      receiptEvidence: null,
      returnEvidence: null,
    });
    router.push("/rentals?tab=borrowed");
  };

  return (
    <div className="mx-auto w-full max-w-[620px] px-6 pt-7 pb-24">
      <Link href={`/equipment/${item.id}`} className="text-[13px] font-semibold text-text-secondary">
        ← 상세로
      </Link>
      <h1 className="mt-2 mb-[22px] text-[20px] font-extrabold text-ink">대여 요청</h1>

      <div className="flex gap-3.5 rounded-lg border border-border p-4">
        <div className="h-16 w-16 shrink-0">
          <ImagePlaceholder rounded="rounded-sm" src={item.images[0]?.imageUrl} alt={item.name} />
        </div>
        <div>
          <div className="text-[14px] font-bold text-ink">{item.name}</div>
          <div className="mt-1 text-[12.5px] text-text-secondary">
            {formatDateRange(start, end)} · {days}일
          </div>
          <div className="mt-1 text-[14px] font-extrabold text-ink">{formatCurrency(totalPrice)}</div>
        </div>
      </div>

      <h2 className="mt-7 text-[14px] font-bold text-ink">배송지 정보</h2>
      <div className="mt-2.5 flex flex-col gap-2.5">
        <Input
          placeholder="수령인 이름"
          value={address.recipientName}
          onChange={(event) => updateAddress("recipientName", event.target.value)}
        />
        <Input
          placeholder="연락처"
          value={address.phone}
          onChange={(event) => updateAddress("phone", event.target.value)}
        />
        <div className="flex gap-2.5">
          <Input
            className="flex-1"
            placeholder="우편번호"
            value={address.zipcode}
            onChange={(event) => updateAddress("zipcode", event.target.value)}
          />
          <Input
            className="flex-[2]"
            placeholder="주소"
            value={address.address}
            onChange={(event) => updateAddress("address", event.target.value)}
          />
        </div>
        <Input
          placeholder="상세 주소"
          value={address.detailAddress}
          onChange={(event) => updateAddress("detailAddress", event.target.value)}
        />
      </div>

      <h2 className="mt-7 text-[14px] font-bold text-ink">요청 메시지 (선택)</h2>
      <Textarea
        className="mt-2.5"
        minHeight={80}
        placeholder="등록자에게 남길 메시지가 있다면 적어주세요."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />

      <div className="mt-7 rounded-md bg-surface p-4">
        <div className="flex justify-between text-[13px] text-text-body-2">
          <span>
            일 대여료 × {days}일
          </span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-[#E5E5E5] pt-3 text-[15px] font-extrabold text-ink">
          <span>총 결제 금액</span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-7 rounded-md"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        결제하기 (mock)
      </Button>
    </div>
  );
}
