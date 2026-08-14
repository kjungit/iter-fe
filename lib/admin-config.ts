export type AdminEntityKey = "users" | "equipment" | "reports" | "disputes";
export type AdminTabKey = AdminEntityKey | "history";

export const ADMIN_TABS: Array<{ value: AdminTabKey; label: string }> = [
  { value: "users", label: "회원" },
  { value: "equipment", label: "장비" },
  { value: "reports", label: "신고" },
  { value: "disputes", label: "분쟁" },
  { value: "history", label: "처리 이력" },
];

export const ENTITY_LABEL: Record<AdminEntityKey, string> = {
  users: "회원",
  equipment: "장비",
  reports: "신고",
  disputes: "분쟁",
};

/** Maps the route's entity key to AdminHistoryEntry.targetType, which uses singular member/equipment/report/dispute. */
export const ENTITY_TARGET_TYPE: Record<AdminEntityKey, "member" | "equipment" | "report" | "dispute"> = {
  users: "member",
  equipment: "equipment",
  reports: "report",
  disputes: "dispute",
};

export const STATUS_OPTIONS: Record<AdminEntityKey, string[]> = {
  users: ["정상", "경고", "정지"],
  equipment: ["공개", "숨김", "중지"],
  reports: ["접수", "검토중", "처리완료", "반려"],
  disputes: ["접수", "조정중", "종결"],
};

export const HAS_EVIDENCE: Record<AdminEntityKey, boolean> = {
  users: false,
  equipment: false,
  reports: true,
  disputes: true,
};

export const RELATED_ITEMS_LABEL: Record<AdminEntityKey, string> = {
  users: "최근 거래",
  equipment: "대여 이력",
  reports: "연관 거래·신고",
  disputes: "연관 신고·거래",
};

export interface AdminTableColumn {
  key: string;
  header: string;
}

export const TABLE_SPEC: Record<AdminEntityKey, { gridTemplateColumns: string; columns: AdminTableColumn[] }> = {
  users: {
    gridTemplateColumns: "1fr 1.4fr 1fr 0.8fr",
    columns: [
      { key: "name", header: "이름" },
      { key: "email", header: "이메일" },
      { key: "status", header: "상태" },
      { key: "action", header: "" },
    ],
  },
  equipment: {
    gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr",
    columns: [
      { key: "name", header: "장비명" },
      { key: "owner", header: "등록자" },
      { key: "status", header: "상태" },
      { key: "action", header: "" },
    ],
  },
  reports: {
    gridTemplateColumns: "1.6fr 1fr 1fr 0.8fr",
    columns: [
      { key: "content", header: "신고 내용" },
      { key: "reporter", header: "신고자" },
      { key: "status", header: "상태" },
      { key: "action", header: "" },
    ],
  },
  disputes: {
    gridTemplateColumns: "1.6fr 1fr 1fr 0.8fr",
    columns: [
      { key: "reason", header: "분쟁 사유" },
      { key: "parties", header: "당사자" },
      { key: "status", header: "상태" },
      { key: "action", header: "" },
    ],
  },
};

export const HISTORY_TABLE_SPEC = {
  gridTemplateColumns: "0.9fr 0.7fr 1.6fr 0.9fr",
  columns: [
    { key: "occurredAt", header: "일시" },
    { key: "adminName", header: "관리자" },
    { key: "action", header: "처리 내용" },
    { key: "target", header: "대상" },
  ],
};
