export type EquipmentCategory =
  | "카메라"
  | "노트북"
  | "VR기기"
  | "프로젝터"
  | "게임기"
  | "렌즈";

export type EquipmentCondition = "양호" | "사용감 있음" | "파손·이상 있음";

export type EquipmentStatus = "공개" | "숨김" | "중지";

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  description: string;
  pricePerDay: number;
  condition: EquipmentCondition;
  ownerId: string;
  ownerName: string;
  status: EquipmentStatus;
  createdAt: string;
  ratingAverage: number;
  reportCount: number;
}

export type RentalStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPING"
  | "RENTING"
  | "RETURN_UPLOAD"
  | "RETURN_REQUESTED"
  | "COMPLETED"
  | "REJECTED";

export interface EvidenceRecord {
  photoUrls: string[];
  condition: EquipmentCondition;
  memo: string;
  recordedAt: string;
}

export interface ShippingInfo {
  carrier: string;
  trackingNumber: string;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
}

export interface Rental {
  id: string;
  equipmentId: string;
  borrowerId: string;
  borrowerName: string;
  ownerId: string;
  ownerName: string;
  status: RentalStatus;
  startDate: string;
  endDate: string;
  totalPrice: number;
  message: string;
  shippingAddress: ShippingAddress;
  shipping: ShippingInfo | null;
  receiptEvidence: EvidenceRecord | null;
  returnEvidence: EvidenceRecord | null;
  createdAt: string;
}

export type ReportReason =
  | "장비 파손 / 상태 불일치"
  | "반납 지연 / 미반납"
  | "허위 매물"
  | "부적절한 언행"
  | "기타";

export type ReportStatus = "접수" | "검토중" | "처리완료" | "반려";

export interface ReportProgressStep {
  label: "접수 완료" | "관리자 검토" | "처리 완료";
  reachedAt: string | null;
}

export interface Report {
  id: string;
  rentalId: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  equipmentName: string;
  reason: ReportReason;
  detail: string;
  photoUrls: string[];
  status: ReportStatus;
  createdAt: string;
  progress: ReportProgressStep[];
  disputeEligible: boolean;
}

export type DisputeStatus = "접수" | "조정중" | "종결";

export interface Dispute {
  id: string;
  reportId: string;
  reason: string;
  partyNames: string[];
  claimAmount: number;
  equipmentName: string;
  createdAt: string;
  adjustmentDueDate: string;
  evidencePhotoUrls: string[];
  status: DisputeStatus;
}

export type MemberStatus = "정상" | "경고" | "정지";

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  phoneMasked: string;
  joinedAt: string;
  lastActiveAt: string;
  reportCount: number;
  borrowedCount: number;
  lentCount: number;
  registeredEquipmentCount: number;
  overdueCount: number;
  status: MemberStatus;
}

export interface AdminHistoryEntry {
  id: string;
  occurredAt: string;
  adminName: string;
  action: string;
  targetLabel: string;
  targetType: "member" | "equipment" | "report" | "dispute";
  targetId: string;
}

export type UserRole = "USER" | "ADMIN";

/**
 * BE는 User+Role.ADMIN 통합 인증 구조라 관리자도 이 타입을 그대로 쓴다 (별도 AdminAccount 없음).
 * avatarInitials는 서버에 없는 필드라 name에서 파생해서 매핑 레이어(lib/api/auth.ts)에서 채운다.
 * defaultAddress는 별도 /users/me/address 엔드포인트라 로그인 직후엔 없을 수 있어 nullable.
 */
export interface User {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarInitials: string;
  defaultAddress: ShippingAddress | null;
}
