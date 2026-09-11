"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { confirmPayment } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";

interface PaymentSuccessViewProps {
  rentalId: string;
  paymentKey: string | null;
  orderId: string | null;
  amount: string | null;
}

export function PaymentSuccessView({ rentalId, paymentKey, orderId, amount }: PaymentSuccessViewProps) {
  const router = useRouter();
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const requested = useRef(false);
  const missingParams = !paymentKey || !orderId || !amount;

  useEffect(() => {
    if (requested.current || missingParams) return;
    requested.current = true;

    confirmPayment(rentalId, { paymentKey, orderId, amount: Number(amount) })
      .then(() => router.replace(`/rentals/${rentalId}`))
      .catch((err) => setConfirmError(err instanceof ApiError ? err.message : "결제 확인에 실패했습니다."));
  }, [rentalId, paymentKey, orderId, amount, missingParams, router]);

  const error = missingParams ? "결제 정보가 올바르지 않습니다." : confirmError;

  return (
    <div className="mx-auto max-w-[480px] px-6 py-24 text-center">
      {error ? (
        <>
          <p className="text-[13.5px] text-badge-danger-fg">{error}</p>
          <Link href={`/rentals/${rentalId}`} className="mt-4 inline-block text-[13px] font-semibold text-ink-strong">
            대여 상세로 이동
          </Link>
        </>
      ) : (
        <p className="text-[13.5px] text-text-secondary">결제 확인 처리 중...</p>
      )}
    </div>
  );
}
