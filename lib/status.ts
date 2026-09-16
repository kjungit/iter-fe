import type { RentalStatus } from "@/lib/api/rentals";
import type { EquipmentStatus } from "@/lib/api/equipment";
import type { ReportStatus } from "@/lib/api/reports";
import type { PaymentStatus, UserStatus } from "@/lib/api/admin";
import type { ChatRoomStage } from "@/lib/api/chat";

export type BadgePalette =
  | "neutral"
  | "progress"
  | "success"
  | "warning"
  | "danger"
  | "done";

export interface BadgeInfo {
  label: string;
  palette: BadgePalette;
}

const RENTAL_STATUS_BADGE: Record<RentalStatus, BadgeInfo> = {
  PENDING: { label: "결제대기", palette: "neutral" },
  REQUESTED: { label: "승인대기", palette: "progress" },
  APPROVED: { label: "배송대기", palette: "progress" },
  REJECTED: { label: "거절됨", palette: "danger" },
  CANCELED: { label: "취소됨", palette: "danger" },
  SHIPPING: { label: "배송중", palette: "progress" },
  RENTING: { label: "대여중", palette: "success" },
  RETURN_REQUESTED: { label: "반납대기", palette: "warning" },
  RETURNING: { label: "반납중", palette: "warning" },
  RETURNED: { label: "반납확인중", palette: "warning" },
  DISPUTED: { label: "신고중", palette: "danger" },
  COMPLETED: { label: "완료", palette: "done" },
};

const REPORT_STATUS_BADGE: Record<ReportStatus, BadgeInfo> = {
  RECEIVED: { label: "접수", palette: "neutral" },
  UNDER_REVIEW: { label: "검토중", palette: "warning" },
  RESOLVED: { label: "처리완료", palette: "success" },
  REJECTED: { label: "반려", palette: "danger" },
};

const USER_STATUS_BADGE: Record<UserStatus, BadgeInfo> = {
  ACTIVE: { label: "정상", palette: "success" },
  SUSPENDED: { label: "정지", palette: "danger" },
  DELETED: { label: "탈퇴", palette: "neutral" },
};

const EQUIPMENT_STATUS_BADGE: Record<EquipmentStatus, BadgeInfo> = {
  ACTIVE: { label: "공개중", palette: "success" },
  INACTIVE: { label: "숨김", palette: "neutral" },
  MAINTENANCE: { label: "점검중", palette: "warning" },
  SUSPENDED: { label: "차단됨", palette: "danger" },
  DELETED: { label: "삭제됨", palette: "neutral" },
};

const CHAT_ROOM_STAGE_BADGE: Record<ChatRoomStage, BadgeInfo> = {
  INQUIRY: { label: "문의중", palette: "neutral" },
  TRADE: { label: "거래중", palette: "success" },
  CLOSED: { label: "종료", palette: "neutral" },
};

const PAYMENT_STATUS_BADGE: Record<PaymentStatus, BadgeInfo> = {
  PENDING: { label: "결제대기", palette: "neutral" },
  PAID: { label: "결제완료", palette: "success" },
  REFUNDED: { label: "환불완료", palette: "warning" },
  CANCELED: { label: "결제취소", palette: "danger" },
  FAILED: { label: "결제실패", palette: "danger" },
};

export function rentalStatusBadge(status: RentalStatus): BadgeInfo {
  return RENTAL_STATUS_BADGE[status];
}

export function reportStatusBadge(status: ReportStatus): BadgeInfo {
  return REPORT_STATUS_BADGE[status];
}

export function adminUserStatusBadge(status: UserStatus): BadgeInfo {
  return USER_STATUS_BADGE[status];
}

export function equipmentStatusBadge(status: EquipmentStatus): BadgeInfo {
  return EQUIPMENT_STATUS_BADGE[status];
}

export function paymentStatusBadge(status: PaymentStatus): BadgeInfo {
  return PAYMENT_STATUS_BADGE[status];
}

export function chatRoomStageBadge(stage: ChatRoomStage): BadgeInfo {
  return CHAT_ROOM_STAGE_BADGE[stage];
}

export const RENTAL_TIMELINE_LABELS = [
  "요청",
  "결제완료",
  "승인",
  "배송",
  "대여중",
  "반납신청",
  "반납확인",
  "완료",
] as const;

/**
 * Highest reached timeline stage index (0-7), or -1 when nothing is reached (분기 상태).
 * RETURNING은 RETURN_REQUESTED와 같은 단계로 취급 — 반납 증빙 제출 한 번에 곧바로 RETURNED로
 * 넘어가서(RentalFulfillmentService 참고) 화면에 별도 단계로 노출하지 않는다.
 */
export function rentalTimelineStage(status: RentalStatus): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "REQUESTED":
      return 1;
    case "APPROVED":
      return 2;
    case "SHIPPING":
      return 3;
    case "RENTING":
      return 4;
    case "RETURN_REQUESTED":
    case "RETURNING":
      return 5;
    case "RETURNED":
      return 6;
    case "COMPLETED":
      return 7;
    case "REJECTED":
    case "CANCELED":
    case "DISPUTED":
      return -1;
  }
}

export type TimelineNodeState = "reached" | "unreached";

export function timelineDotState(status: RentalStatus, stepIndex: number): TimelineNodeState {
  const stage = rentalTimelineStage(status);
  if (stage === -1) return "unreached";
  return stepIndex <= stage ? "reached" : "unreached";
}

export type TimelineConnectorState = "transparent" | TimelineNodeState;

export function timelineConnectorState(
  status: RentalStatus,
  stepIndex: number,
): TimelineConnectorState {
  if (stepIndex === 0) return "transparent";
  return timelineDotState(status, stepIndex);
}

export type RentalRole = "owner" | "borrower" | null;

/** overdueDays는 BE(RentalDetailResponse/RentalHistoryResponse)가 이미 계산해서 내려주므로 재계산하지 않는다. */
export function rentalRole(
  rental: { owner: { id: string }; renter: { id: string } },
  userId: string,
): RentalRole {
  if (rental.owner.id === userId) return "owner";
  if (rental.renter.id === userId) return "borrower";
  return null;
}
