import { apiFetch } from "@/lib/api/client";
import type { EquipmentCategory, EquipmentStatus, ProductCondition } from "@/lib/api/equipment";
import type { ReportStatus } from "@/lib/api/reports";

/** 전체 건수를 세지 않는 커서 기반 응답 — 관리자 목록 전용(BE 커서 페이지네이션 최적화 이후). */
export interface CursorResult<T> {
  content: T[];
  nextCursor: string | null;
  hasNext: boolean;
  size: number;
}

function cursorQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

// ── 회원 ────────────────────────────────────────────────────────────────

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type UserRole = "USER" | "ADMIN";

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "정상",
  SUSPENDED: "정지",
  DELETED: "탈퇴",
};

interface AdminUserSummaryDto {
  userId: number;
  email: string;
  name: string;
  nickName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface AdminUserSummary {
  userId: string;
  email: string;
  name: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

interface AdminUserDetailDto {
  userId: number;
  email: string;
  name: string;
  nickName: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  rentedCount: number;
  lentCount: number;
  overdueCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail {
  userId: string;
  email: string;
  name: string;
  nickname: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  rentedCount: number;
  lentCount: number;
  overdueCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

function toUserSummary(dto: AdminUserSummaryDto): AdminUserSummary {
  return { ...dto, userId: String(dto.userId), nickname: dto.nickName };
}

export async function fetchAdminUsers(params: {
  keyword?: string;
  status?: UserStatus;
  cursor?: string;
  size?: number;
} = {}): Promise<CursorResult<AdminUserSummary>> {
  const dto = await apiFetch<CursorResult<AdminUserSummaryDto>>(
    `/api/v1/admin/users${cursorQuery(params)}`,
  );
  return { ...dto, content: dto.content.map(toUserSummary) };
}

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  const dto = await apiFetch<AdminUserDetailDto>(`/api/v1/admin/users/${userId}`);
  return { ...dto, userId: String(dto.userId), nickname: dto.nickName };
}

/** 회원 상태는 ACTIVE(정지 해제) 또는 SUSPENDED(정지)로만 변경 가능 (BE 검증과 동일). */
export async function updateAdminUserStatus(
  userId: string,
  input: { status: "ACTIVE" | "SUSPENDED"; reason: string },
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/admin/users/${userId}/status`, { method: "PATCH", body: input });
}

// ── 장비 ────────────────────────────────────────────────────────────────

interface AdminEquipmentSummaryDto {
  equipmentId: number;
  name: string;
  category: EquipmentCategory;
  dailyPrice: number;
  status: EquipmentStatus;
  owner: { userId: number; nickName: string };
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface AdminEquipmentSummary {
  equipmentId: string;
  name: string;
  category: EquipmentCategory;
  dailyPrice: number;
  status: EquipmentStatus;
  ownerNickname: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

interface AdminEquipmentDetailDto {
  equipmentId: number;
  owner: { userId: number; nickName: string };
  category: EquipmentCategory;
  name: string;
  description: string;
  dailyPrice: number;
  availableFrom: string | null;
  availableTo: string | null;
  status: EquipmentStatus;
  productCondition: ProductCondition;
  conditionDetail: string | null;
  images: { imageId: number; imageUrl: string; sortOrder: number; thumbnail: boolean }[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminEquipmentDetail {
  equipmentId: string;
  ownerId: string;
  ownerNickname: string;
  category: EquipmentCategory;
  name: string;
  description: string;
  dailyPrice: number;
  availableFrom: string | null;
  availableTo: string | null;
  status: EquipmentStatus;
  productCondition: ProductCondition;
  conditionDetail: string | null;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

function toEquipmentSummary(dto: AdminEquipmentSummaryDto): AdminEquipmentSummary {
  return { ...dto, equipmentId: String(dto.equipmentId), ownerNickname: dto.owner.nickName };
}

export async function fetchAdminEquipment(params: {
  keyword?: string;
  category?: string;
  status?: EquipmentStatus;
  cursor?: string;
  size?: number;
} = {}): Promise<CursorResult<AdminEquipmentSummary>> {
  const dto = await apiFetch<CursorResult<AdminEquipmentSummaryDto>>(
    `/api/v1/admin/equipment${cursorQuery(params)}`,
  );
  return { ...dto, content: dto.content.map(toEquipmentSummary) };
}

export async function fetchAdminEquipmentDetail(equipmentId: string): Promise<AdminEquipmentDetail> {
  const dto = await apiFetch<AdminEquipmentDetailDto>(`/api/v1/admin/equipment/${equipmentId}`);
  return {
    ...dto,
    equipmentId: String(dto.equipmentId),
    ownerId: String(dto.owner.userId),
    ownerNickname: dto.owner.nickName,
    imageUrls: dto.images.map((image) => image.imageUrl),
  };
}

/** 장비 상태는 INACTIVE(비공개) 또는 SUSPENDED(차단)로만 변경 가능 (BE 검증과 동일). */
export async function updateAdminEquipmentStatus(
  equipmentId: string,
  input: { status: "INACTIVE" | "SUSPENDED"; reason: string },
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/admin/equipment/${equipmentId}/status`, {
    method: "PATCH",
    body: input,
  });
}

// ── 신고 ────────────────────────────────────────────────────────────────

interface AdminReportDetailDto {
  report: {
    reportId: number;
    reporter: { userId: number; nickName: string };
    targetType: "USER" | "EQUIPMENT" | "RENTAL";
    targetId: number;
    reason: string;
    description: string;
    status: ReportStatus;
    createdAt: string;
    resolvedAt: string | null;
  };
  adminMemo: string | null;
  updatedAt: string;
  evidenceGroups: Array<{ phase: "LISTING" | "RECEIPT" | "RETURN"; label: string; images: Array<{
    captureView: "FRONT" | "SIDE" | "REAR" | null; imageUrl: string;
  }> }>;
}

export interface AdminReportDetail {
  reportId: string;
  reporterNickname: string;
  targetType: "USER" | "EQUIPMENT" | "RENTAL";
  targetId: string;
  reason: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  adminMemo: string | null;
  updatedAt: string;
  evidenceGroups: Array<{ phase: "LISTING" | "RECEIPT" | "RETURN"; label: string; images: Array<{
    captureView: "FRONT" | "SIDE" | "REAR" | null; imageUrl: string;
  }> }>;
}

export async function fetchAdminReports(params: {
  targetType?: "USER" | "EQUIPMENT" | "RENTAL";
  status?: ReportStatus;
  cursor?: string;
  size?: number;
} = {}): Promise<
  CursorResult<{
    reportId: string;
    reporterNickname: string;
    targetType: "USER" | "EQUIPMENT" | "RENTAL";
    targetId: string;
    reason: string;
    status: ReportStatus;
    createdAt: string;
  }>
> {
  const dto = await apiFetch<
    CursorResult<{
      reportId: number;
      reporter: { userId: number; nickName: string };
      targetType: "USER" | "EQUIPMENT" | "RENTAL";
      targetId: number;
      reason: string;
      status: ReportStatus;
      createdAt: string;
    }>
  >(`/api/v1/admin/reports${cursorQuery(params)}`);
  return {
    ...dto,
    content: dto.content.map((row) => ({
      ...row,
      reportId: String(row.reportId),
      reporterNickname: row.reporter.nickName,
      targetId: String(row.targetId),
    })),
  };
}

export async function fetchAdminReportDetail(reportId: string): Promise<AdminReportDetail> {
  const dto = await apiFetch<AdminReportDetailDto>(`/api/v1/admin/reports/${reportId}`);
  return {
    reportId: String(dto.report.reportId),
    reporterNickname: dto.report.reporter.nickName,
    targetType: dto.report.targetType,
    targetId: String(dto.report.targetId),
    reason: dto.report.reason,
    description: dto.report.description,
    status: dto.report.status,
    createdAt: dto.report.createdAt,
    resolvedAt: dto.report.resolvedAt,
    adminMemo: dto.adminMemo,
    updatedAt: dto.updatedAt,
    evidenceGroups: dto.evidenceGroups ?? [],
  };
}

export async function updateAdminReportStatus(
  reportId: string,
  input: { status: ReportStatus; adminMemo: string },
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/admin/reports/${reportId}/status`, {
    method: "PATCH",
    body: input,
  });
}

// ── 결제 (조회 전용) ─────────────────────────────────────────────────────

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "CANCELED" | "FAILED";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "결제대기",
  PAID: "결제완료",
  REFUNDED: "환불완료",
  CANCELED: "결제취소",
  FAILED: "결제실패",
};

interface AdminPaymentSummaryDto {
  paymentId: number;
  rentalId: number;
  orderId: string;
  renterId: number;
  renterEmail: string;
  renterName: string;
  renterNickname: string;
  equipmentName: string;
  amount: number;
  paymentStatus: PaymentStatus;
  rentalStatus: string;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface AdminPaymentSummary {
  paymentId: string;
  rentalId: string;
  orderId: string;
  renterName: string;
  renterNickname: string;
  equipmentName: string;
  amount: number;
  paymentStatus: PaymentStatus;
  rentalStatus: string;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

interface AdminPaymentRentalDto {
  equipmentId: number;
  equipmentName: string;
  category: string;
  dailyPrice: number;
  startDate: string;
  endDate: string;
  rentalDays: number;
  totalPrice: number;
  rentalStatus: string;
}

export interface AdminPaymentDetail {
  payment: AdminPaymentSummary;
  rental: AdminPaymentRentalDto;
  updatedAt: string;
}

function toPaymentSummary(dto: AdminPaymentSummaryDto): AdminPaymentSummary {
  return { ...dto, paymentId: String(dto.paymentId), rentalId: String(dto.rentalId) };
}

export async function fetchAdminPayments(params: {
  keyword?: string;
  status?: PaymentStatus;
  fromDate?: string;
  toDate?: string;
  cursor?: string;
  size?: number;
} = {}): Promise<CursorResult<AdminPaymentSummary>> {
  const dto = await apiFetch<CursorResult<AdminPaymentSummaryDto>>(
    `/api/v1/admin/payments${cursorQuery(params)}`,
  );
  return { ...dto, content: dto.content.map(toPaymentSummary) };
}

export async function fetchAdminPaymentDetail(paymentId: string): Promise<AdminPaymentDetail> {
  const dto = await apiFetch<{
    payment: AdminPaymentSummaryDto;
    rental: AdminPaymentRentalDto;
    updatedAt: string;
  }>(`/api/v1/admin/payments/${paymentId}`);
  return { payment: toPaymentSummary(dto.payment), rental: dto.rental, updatedAt: dto.updatedAt };
}

// ── 처리 이력 ───────────────────────────────────────────────────────────

export type AdminActionTargetType = "REPORT" | "USER" | "EQUIPMENT" | "DISPUTE";
export type AdminActionType =
  | "SUSPEND_USER"
  | "RESTORE_USER"
  | "SUSPEND_EQUIPMENT"
  | "RESTORE_EQUIPMENT"
  | "RESOLVE_REPORT"
  | "REJECT_REPORT"
  | "REVIEW_REPORT"
  | "RESOLVE_DISPUTE";

export const ADMIN_ACTION_LABELS: Record<AdminActionType, string> = {
  SUSPEND_USER: "회원 정지",
  RESTORE_USER: "회원 정지 해제",
  SUSPEND_EQUIPMENT: "장비 차단",
  RESTORE_EQUIPMENT: "장비 차단 해제",
  RESOLVE_REPORT: "신고 처리 완료",
  REJECT_REPORT: "신고 기각",
  REVIEW_REPORT: "신고 검토중 처리",
  RESOLVE_DISPUTE: "신고 처리 완료",
};

export const ADMIN_ACTION_TARGET_LABELS: Record<AdminActionTargetType, string> = {
  REPORT: "신고",
  USER: "회원",
  EQUIPMENT: "장비",
  DISPUTE: "신고",
};

interface AdminActionDto {
  actionId: number;
  adminId: number;
  targetType: AdminActionTargetType;
  targetId: number;
  action: AdminActionType;
  reason: string;
  createdAt: string;
}

export interface AdminAction {
  actionId: string;
  adminId: string;
  targetType: AdminActionTargetType;
  targetId: string;
  action: AdminActionType;
  reason: string;
  createdAt: string;
}

export async function fetchAdminActions(params: {
  targetType?: AdminActionTargetType;
  targetId?: string;
  action?: AdminActionType;
  cursor?: string;
  size?: number;
} = {}): Promise<CursorResult<AdminAction>> {
  const dto = await apiFetch<CursorResult<AdminActionDto>>(`/api/v1/admin/actions${cursorQuery(params)}`);
  return {
    ...dto,
    content: dto.content.map((row) => ({
      ...row,
      actionId: String(row.actionId),
      adminId: String(row.adminId),
      targetId: String(row.targetId),
    })),
  };
}

// ── 대시보드 통계 ─────────────────────────────────────────────────────

export interface AdminStats {
  userCount: number;
  equipmentCount: number;
  unresolvedReportCount: number;
  paymentCount: number;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/api/v1/admin/stats");
}
