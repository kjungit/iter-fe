import { apiFetch } from "@/lib/api/client";
import type { ProductCondition } from "@/lib/api/equipment";

/** BE reservation/domain/entity/RentalStatus와 동일 (한글 라벨은 lib/status.ts에서만 매핑). */
export type RentalStatus =
  | "PENDING"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELED"
  | "SHIPPING"
  | "RENTING"
  | "RETURN_REQUESTED"
  | "RETURNING"
  | "RETURNED"
  | "DISPUTED"
  | "COMPLETED";

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "CANCELED" | "FAILED";

export interface UserSummary {
  id: string;
  nickname: string;
}

export interface RentalEquipmentSnapshot {
  equipmentId: string;
  equipmentName: string;
  category: string;
  dailyPrice: number;
  thumbnailUrl: string | null;
}

export interface RentalDetail {
  rentalId: string;
  equipment: RentalEquipmentSnapshot;
  owner: UserSummary;
  renter: UserSummary;
  startDate: string;
  endDate: string;
  rentalDays: number;
  totalPrice: number;
  paymentStatus: PaymentStatus | null;
  receiverName: string;
  receiverPhone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
  requestMessage: string | null;
  status: RentalStatus;
  overdueDays: number;
  createdAt: string;
}

export interface RentalHistoryItem {
  rentalId: string;
  equipmentId: string;
  equipmentName: string;
  thumbnailUrl: string | null;
  counterparty: UserSummary;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: RentalStatus;
  overdueDays: number;
}

export interface ReturnTarget {
  rentalId: string;
  equipmentName: string;
  thumbnailUrl: string | null;
  renter: UserSummary;
  endDate: string;
  returnDate: string | null;
}

export interface ConditionEvidence {
  productCondition: ProductCondition;
  conditionDetail: string | null;
  imageUrls: string[];
  recordedAt: string;
}

export interface ReturnComparison {
  rentalId: string;
  equipmentName: string;
  renter: UserSummary;
  startDate: string;
  endDate: string;
  returnDate: string;
  receipt: ConditionEvidence;
  returnReceipt: ConditionEvidence;
}

interface UserSummaryDto {
  userId: number;
  nickName: string;
}

function toUserSummary(dto: UserSummaryDto): UserSummary {
  return { id: String(dto.userId), nickname: dto.nickName };
}

interface RentalDetailDto {
  rentalId: number;
  equipment: {
    equipmentId: number;
    equipmentName: string;
    category: string;
    dailyPrice: number;
    thumbnailUrl: string | null;
  };
  owner: UserSummaryDto;
  renter: UserSummaryDto;
  startDate: string;
  endDate: string;
  rentalDays: number;
  totalPrice: number;
  paymentStatus: PaymentStatus | null;
  receiverName: string;
  receiverPhone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
  requestMessage: string | null;
  status: RentalStatus;
  overdueDays: number;
  createdAt: string;
}

function toRentalDetail(dto: RentalDetailDto): RentalDetail {
  return {
    ...dto,
    rentalId: String(dto.rentalId),
    equipment: { ...dto.equipment, equipmentId: String(dto.equipment.equipmentId) },
    owner: toUserSummary(dto.owner),
    renter: toUserSummary(dto.renter),
  };
}

export async function fetchRentalDetail(rentalId: string): Promise<RentalDetail> {
  const dto = await apiFetch<RentalDetailDto>(`/api/v1/rentals/${rentalId}`);
  return toRentalDetail(dto);
}

export interface RentalCreateInput {
  equipmentId: string;
  startDate: string;
  endDate: string;
  receiverName: string;
  receiverPhone: string;
  zipcode: string;
  address: string;
  detailAddress?: string;
  requestMessage?: string;
}

export async function createRental(input: RentalCreateInput): Promise<{ rentalId: string }> {
  const dto = await apiFetch<{ rentalId: number }>("/api/v1/rentals", {
    method: "POST",
    body: input,
  });
  return { rentalId: String(dto.rentalId) };
}

export async function cancelRental(rentalId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/rentals/${rentalId}/cancel`, { method: "DELETE" });
}

export async function approveRental(rentalId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/rentals/${rentalId}/approve`, { method: "PATCH" });
}

export async function rejectRental(rentalId: string, reason: string): Promise<void> {
  await apiFetch<void>(`/api/v1/rentals/${rentalId}/reject`, {
    method: "PATCH",
    body: { reason },
  });
}

interface RentalHistoryDto {
  rentalId: number;
  equipmentId: number;
  equipmentName: string;
  thumbnailUrl: string | null;
  counterparty: UserSummaryDto;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: RentalStatus;
  overdueDays: number;
}

function toHistoryItem(dto: RentalHistoryDto): RentalHistoryItem {
  return {
    ...dto,
    rentalId: String(dto.rentalId),
    equipmentId: String(dto.equipmentId),
    counterparty: toUserSummary(dto.counterparty),
  };
}

async function fetchHistory(path: string): Promise<RentalHistoryItem[]> {
  const dto = await apiFetch<{ content: RentalHistoryDto[] }>(path);
  return dto.content.map(toHistoryItem);
}

export function fetchBorrowedRentals(overdueOnly = false): Promise<RentalHistoryItem[]> {
  return fetchHistory(`/api/v1/rentals/borrowed${overdueOnly ? "/overdue" : ""}`);
}

export function fetchLentRentals(overdueOnly = false): Promise<RentalHistoryItem[]> {
  return fetchHistory(`/api/v1/rentals/lent${overdueOnly ? "/overdue" : ""}`);
}

export interface ShippingRegisterInput {
  carrier: string;
  trackingNumber: string;
}

export async function registerShipping(rentalId: string, input: ShippingRegisterInput): Promise<void> {
  await apiFetch<void>(`/api/v1/rentals/${rentalId}/shipping`, { method: "POST", body: input });
}

export interface ReceiptCreateInput {
  productCondition: ProductCondition;
  conditionDetail?: string;
  imageUrls: string[];
}

export async function createReceipt(rentalId: string, input: ReceiptCreateInput): Promise<void> {
  await apiFetch<void>(`/api/v1/rentals/${rentalId}/receipt`, { method: "POST", body: input });
}

export async function requestReturn(rentalId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/rentals/${rentalId}/return-request`, { method: "POST" });
}

export interface ReturnEvidenceCreateInput {
  productCondition: ProductCondition;
  conditionDetail?: string;
  imageUrls: string[];
}

export async function createReturnEvidence(
  rentalId: string,
  input: ReturnEvidenceCreateInput,
): Promise<void> {
  await apiFetch<void>(`/api/v1/rentals/${rentalId}/return-evidence`, { method: "POST", body: input });
}

interface ReturnTargetDto {
  rentalId: number;
  equipmentName: string;
  thumbnailUrl: string | null;
  renter: UserSummaryDto;
  endDate: string;
  returnDate: string | null;
}

export async function fetchReturnTargets(): Promise<ReturnTarget[]> {
  const dto = await apiFetch<{ content: ReturnTargetDto[] }>("/api/v1/rentals/returns");
  return dto.content.map((item) => ({
    ...item,
    rentalId: String(item.rentalId),
    renter: toUserSummary(item.renter),
  }));
}

export async function fetchReturnComparison(rentalId: string): Promise<ReturnComparison> {
  const dto = await apiFetch<{
    rentalId: number;
    equipmentName: string;
    renter: UserSummaryDto;
    startDate: string;
    endDate: string;
    returnDate: string;
    receipt: ConditionEvidence;
    returnReceipt: ConditionEvidence;
  }>(`/api/v1/rentals/${rentalId}/return-comparison`);
  return { ...dto, rentalId: String(dto.rentalId), renter: toUserSummary(dto.renter) };
}

export interface ReturnConfirmationInput {
  hasIssue: boolean;
  disputeReason?: string;
  disputeDescription?: string;
}

export async function confirmReturn(
  rentalId: string,
  input: ReturnConfirmationInput,
): Promise<{ status: RentalStatus; disputeId: string | null }> {
  const dto = await apiFetch<{ status: RentalStatus; disputeId: number | null }>(
    `/api/v1/rentals/${rentalId}/return-confirmation`,
    { method: "POST", body: input },
  );
  return { status: dto.status, disputeId: dto.disputeId ? String(dto.disputeId) : null };
}

// ── 수령/반납 증빙 사진 업로드 (presigned URL) ──────────────────────────────
// 장비 이미지와 달리 승격(promote) 단계가 없어 발급 즉시 publicUrl이 최종 URL이다.

export interface EvidencePresignedUpload {
  objectKey: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  publicUrl: string;
  expiresAt: string;
}

export async function requestEvidenceImagePresignedUrls(
  files: { contentType: string }[],
): Promise<EvidencePresignedUpload[]> {
  const dto = await apiFetch<{ uploads: EvidencePresignedUpload[] }>(
    "/api/v1/rentals/images/presigned-urls",
    { method: "POST", body: { files } },
  );
  return dto.uploads;
}
