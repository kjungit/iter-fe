import type { RentalStatus } from "@/lib/api/rentals";
import type { DisputeStatus, EquipmentStatus, MemberStatus, ReportStatus } from "@/lib/types";

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
  DISPUTED: { label: "분쟁중", palette: "danger" },
  COMPLETED: { label: "완료", palette: "done" },
};

const REPORT_STATUS_BADGE: Record<ReportStatus, BadgeInfo> = {
  접수: { label: "접수", palette: "neutral" },
  검토중: { label: "검토중", palette: "warning" },
  처리완료: { label: "처리완료", palette: "success" },
  반려: { label: "반려", palette: "danger" },
};

const DISPUTE_STATUS_BADGE: Record<DisputeStatus, BadgeInfo> = {
  접수: { label: "접수", palette: "neutral" },
  조정중: { label: "조정중", palette: "warning" },
  종결: { label: "종결", palette: "done" },
};

const MEMBER_STATUS_BADGE: Record<MemberStatus, BadgeInfo> = {
  정상: { label: "정상", palette: "success" },
  경고: { label: "경고", palette: "warning" },
  정지: { label: "정지", palette: "danger" },
};

const EQUIPMENT_STATUS_BADGE: Record<EquipmentStatus, BadgeInfo> = {
  공개: { label: "공개", palette: "success" },
  숨김: { label: "숨김", palette: "neutral" },
  중지: { label: "중지", palette: "danger" },
};

export function rentalStatusBadge(status: RentalStatus): BadgeInfo {
  return RENTAL_STATUS_BADGE[status];
}

export function reportStatusBadge(status: ReportStatus): BadgeInfo {
  return REPORT_STATUS_BADGE[status];
}

export function disputeStatusBadge(status: DisputeStatus): BadgeInfo {
  return DISPUTE_STATUS_BADGE[status];
}

export function memberStatusBadge(status: MemberStatus): BadgeInfo {
  return MEMBER_STATUS_BADGE[status];
}

export function equipmentStatusBadge(status: EquipmentStatus): BadgeInfo {
  return EQUIPMENT_STATUS_BADGE[status];
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
