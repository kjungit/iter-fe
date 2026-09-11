import { apiFetch } from "@/lib/api/client";
import type { RentalStatus } from "@/lib/api/rentals";

export interface PaymentReadyResult {
  rentalId: string;
  orderId: string;
  orderName: string;
  amount: number;
  clientKey: string;
  customerKey: string;
}

export async function readyPayment(rentalId: string): Promise<PaymentReadyResult> {
  const dto = await apiFetch<{
    rentalId: number;
    orderId: string;
    orderName: string;
    amount: number;
    clientKey: string;
    customerKey: string;
  }>(`/api/v1/rentals/${rentalId}/payment/ready`, { method: "POST" });
  return { ...dto, rentalId: String(dto.rentalId) };
}

export interface PaymentConfirmInput {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface PaymentConfirmResult {
  rentalId: string;
  rentalStatus: RentalStatus;
}

export async function confirmPayment(
  rentalId: string,
  input: PaymentConfirmInput,
): Promise<PaymentConfirmResult> {
  const dto = await apiFetch<{ rentalId: number; rentalStatus: RentalStatus }>(
    `/api/v1/rentals/${rentalId}/payment/confirm`,
    { method: "POST", body: input },
  );
  return { rentalId: String(dto.rentalId), rentalStatus: dto.rentalStatus };
}
