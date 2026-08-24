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

export const RENTAL_STATUSES: RentalStatus[] = [
  "PENDING",
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "CANCELED",
  "SHIPPING",
  "RENTING",
  "RETURN_REQUESTED",
  "RETURNING",
  "RETURNED",
  "DISPUTED",
  "COMPLETED",
];

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
  useDefaultAddress?: boolean;
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

export interface RentalHistoryListResult {
  content: RentalHistoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface RentalHistorySearchInput {
  status?: RentalStatus;
  equipmentName?: string;
  page?: number;
  size?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return query.toString() ? `?${query.toString()}` : "";
}

async function fetchHistory(
  path: string,
  params: RentalHistorySearchInput | { page?: number; size?: number } = {},
): Promise<RentalHistoryListResult> {
  const dto = await apiFetch<{
    content: RentalHistoryDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }>(`${path}${buildQuery(params as Record<string, string | number | undefined>)}`);
  return { ...dto, content: dto.content.map(toHistoryItem) };
}

export function fetchBorrowedRentals(
  params: RentalHistorySearchInput = {},
): Promise<RentalHistoryListResult> {
  return fetchHistory("/api/v1/rentals/borrowed", params);
}

export function fetchLentRentals(
  params: RentalHistorySearchInput = {},
): Promise<RentalHistoryListResult> {
  return fetchHistory("/api/v1/rentals/lent", params);
}

/** 연체 전용 엔드포인트는 status/equipmentName 필터 없이 page/size만 받는다 (BE PagingRequest). */
export function fetchBorrowedOverdueRentals(
  params: { page?: number; size?: number } = {},
): Promise<RentalHistoryListResult> {
  return fetchHistory("/api/v1/rentals/borrowed/overdue", params);
}

export function fetchLentOverdueRentals(
  params: { page?: number; size?: number } = {},
): Promise<RentalHistoryListResult> {
  return fetchHistory("/api/v1/rentals/lent/overdue", params);
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

export interface ReturnTargetListResult {
  content: ReturnTarget[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** BE가 page/size(default size=20) 기반 PageResponse로 응답한다 — 파라미터 없이 부르면 첫 20건만 온다. */
export async function fetchReturnTargets(
  params: { page?: number; size?: number } = {},
): Promise<ReturnTargetListResult> {
  const dto = await apiFetch<{
    content: ReturnTargetDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }>(`/api/v1/rentals/returns${buildQuery(params)}`);
  return {
    ...dto,
    content: dto.content.map((item) => ({
      ...item,
      rentalId: String(item.rentalId),
      renter: toUserSummary(item.renter),
    })),
  };
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
