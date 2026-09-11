import { apiFetch } from "@/lib/api/client";

export type NotificationType =
  | "PAYMENT_COMPLETED_OWNER"
  | "PAYMENT_COMPLETED_RENTER"
  | "RENTAL_REQUESTED"
  | "RENTAL_APPROVED"
  | "RENTAL_REJECTED"
  | "RENTAL_CANCELED"
  | "RENTAL_RECEIVED";

type NotificationParams = Record<string, unknown>;

interface NotificationDto {
  id: number;
  type: NotificationType;
  params: NotificationParams;
  rentalId: number | null;
  read: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  params: NotificationParams;
  rentalId: string | null;
  read: boolean;
  createdAt: string;
}

function toNotification(dto: NotificationDto): Notification {
  return {
    ...dto,
    id: String(dto.id),
    params: dto.params ?? {},
    rentalId: dto.rentalId !== null ? String(dto.rentalId) : null,
  };
}

function str(params: NotificationParams, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

/**
 * BE는 title/message 완성 문장이 아니라 type + params만 내려준다(docs/i18n-frontend-handoff.md §3,
 * NotificationMessages.java) — 화면 표시 문구 조립은 프론트 책임. params 키는 BE 문서 표와 일치시킬 것.
 */
export const NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  (params: NotificationParams) => { title: string; message: string }
> = {
  PAYMENT_COMPLETED_OWNER: (p) => ({
    title: "결제 완료",
    message: `${str(p, "renterName")}님이 [${str(p, "productName")}] 대여 건의 결제를 완료했습니다.`,
  }),
  PAYMENT_COMPLETED_RENTER: (p) => ({
    title: "결제 완료",
    message: `[${str(p, "productName")}] 대여 결제가 완료되었습니다. 등록자의 승인을 기다려주세요.`,
  }),
  RENTAL_REQUESTED: (p) => ({
    title: "대여 신청 도착",
    message: `[${str(p, "productName")}] 대여 신청이 도착했습니다. 승인 대기 목록을 확인해주세요.`,
  }),
  RENTAL_APPROVED: (p) => ({
    title: "대여 승인",
    message: `[${str(p, "productName")}] 대여 요청이 승인되었습니다.`,
  }),
  RENTAL_REJECTED: (p) => ({
    title: "대여 거절",
    message: `[${str(p, "productName")}] 대여 요청이 거절되었습니다. 사유: ${str(p, "rejectReason")}.${
      p.refunded ? " 결제 금액은 환불되었습니다." : ""
    }`,
  }),
  RENTAL_CANCELED: (p) => ({
    title: "예약 취소",
    message: `${str(p, "renterName")}님이 [${str(p, "productName")}] 대여 요청을 취소했습니다.`,
  }),
  RENTAL_RECEIVED: (p) => ({
    title: "수령 확인",
    message: `${str(p, "renterName")}님이 [${str(p, "productName")}] 물품 수령을 확인했습니다. 대여가 시작됩니다.`,
  }),
};

export async function issueSseTicket(): Promise<string> {
  const dto = await apiFetch<{ ticket: string }>("/api/v1/notifications/sse-ticket", {
    method: "POST",
  });
  return dto.ticket;
}

export interface NotificationListResult {
  content: Notification[];
  nextCursor: string | null;
  hasNext: boolean;
  size: number;
}

export async function fetchNotifications(
  params: { unreadOnly?: boolean; cursor?: string; size?: number } = {},
): Promise<NotificationListResult> {
  const query = new URLSearchParams();
  if (params.unreadOnly) query.set("unreadOnly", "true");
  if (params.cursor !== undefined) query.set("cursor", params.cursor);
  if (params.size !== undefined) query.set("size", String(params.size));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const dto = await apiFetch<{
    content: NotificationDto[];
    nextCursor: string | null;
    hasNext: boolean;
    size: number;
  }>(`/api/v1/notifications${suffix}`);
  return { ...dto, content: dto.content.map(toNotification) };
}

export async function fetchUnreadCount(): Promise<number> {
  const dto = await apiFetch<{ unreadCount: number }>("/api/v1/notifications/unread-count");
  return dto.unreadCount;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiFetch<NotificationDto>(`/api/v1/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<{ updatedCount: number }>("/api/v1/notifications/read-all", { method: "PATCH" });
}
