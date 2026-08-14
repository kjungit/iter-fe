import { diffInDays, parseISODate, startOfDay } from "@/lib/date";
import type {
  DisputeStatus,
  EquipmentStatus,
  MemberStatus,
  Rental,
  RentalStatus,
  ReportStatus,
} from "@/lib/types";

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
  PENDING: { label: "요청대기", palette: "neutral" },
  PAID: { label: "결제완료", palette: "progress" },
  SHIPPING: { label: "배송중", palette: "progress" },
  RENTING: { label: "대여중", palette: "success" },
  RETURN_UPLOAD: { label: "반납 준비중", palette: "warning" },
  RETURN_REQUESTED: { label: "반납확인중", palette: "warning" },
  COMPLETED: { label: "완료", palette: "done" },
  REJECTED: { label: "거절됨", palette: "danger" },
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
  "승인·결제",
  "배송",
  "수령확인",
  "대여중~반납",
  "완료",
] as const;

/** Highest reached timeline stage index (0-5), or -1 when nothing is reached (REJECTED). */
export function rentalTimelineStage(status: RentalStatus): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "PAID":
      return 1;
    case "SHIPPING":
      return 2;
    case "RENTING":
    case "RETURN_UPLOAD":
      return 3;
    case "RETURN_REQUESTED":
      return 4;
    case "COMPLETED":
      return 5;
    case "REJECTED":
      return -1;
  }
}

export type TimelineNodeState = "reached" | "unreached";

export function timelineDotState(
  status: RentalStatus,
  stepIndex: number,
): TimelineNodeState {
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

const NON_OVERDUE_STATUSES: RentalStatus[] = ["COMPLETED", "REJECTED", "PENDING"];

export function isOverdue(
  rental: Pick<Rental, "status" | "endDate">,
  today: Date = new Date(),
): boolean {
  if (NON_OVERDUE_STATUSES.includes(rental.status)) return false;
  return startOfDay(parseISODate(rental.endDate)) < startOfDay(today);
}

export type RentalRole = "owner" | "borrower" | null;

export function rentalRole(
  rental: Pick<Rental, "ownerId" | "borrowerId">,
  userId: string,
): RentalRole {
  if (rental.ownerId === userId) return "owner";
  if (rental.borrowerId === userId) return "borrower";
  return null;
}

export function overdueDays(
  rental: Pick<Rental, "status" | "endDate">,
  today: Date = new Date(),
): number {
  if (!isOverdue(rental, today)) return 0;
  return diffInDays(today, parseISODate(rental.endDate));
}
