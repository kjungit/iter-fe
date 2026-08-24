import { apiFetch } from "@/lib/api/client";

export type ReportTargetType = "USER" | "EQUIPMENT" | "RENTAL";

export type ReportStatus = "RECEIVED" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  RECEIVED: "접수",
  UNDER_REVIEW: "검토중",
  RESOLVED: "처리완료",
  REJECTED: "반려",
};

/** 신고 사유 선택지 — BE는 자유 문자열(최대 50자)이라 라디오 라벨을 그대로 전송한다. */
export type ReportReason =
  | "장비 파손 / 상태 불일치"
  | "반납 지연 / 미반납"
  | "허위 매물"
  | "부적절한 언행"
  | "기타";

export const REPORT_REASONS: ReportReason[] = [
  "장비 파손 / 상태 불일치",
  "반납 지연 / 미반납",
  "허위 매물",
  "부적절한 언행",
  "기타",
];

interface UserSummaryDto {
  userId: number;
  nickName: string;
}

interface ReportSummaryDto {
  reportId: number;
  reporter: UserSummaryDto;
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

interface ReportDetailDto extends ReportSummaryDto {
  description: string;
  resolvedAt: string | null;
}

export interface ReportSummary {
  reportId: string;
  reporterNickname: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface ReportDetail extends ReportSummary {
  description: string;
  resolvedAt: string | null;
}

function toSummary(dto: ReportSummaryDto): ReportSummary {
  return {
    reportId: String(dto.reportId),
    reporterNickname: dto.reporter.nickName,
    targetType: dto.targetType,
    targetId: String(dto.targetId),
    reason: dto.reason,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

function toDetail(dto: ReportDetailDto): ReportDetail {
  return { ...toSummary(dto), description: dto.description, resolvedAt: dto.resolvedAt };
}

export interface ReportCreateInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string;
}

export async function createReport(input: ReportCreateInput): Promise<void> {
  await apiFetch<ReportDetailDto>("/api/v1/reports", {
    method: "POST",
    body: { ...input, targetId: Number(input.targetId) },
  });
}

export interface ReportListResult {
  content: ReportSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** BE가 page/size(default size=20) 기반 PageResponse로 응답한다 — 파라미터 없이 부르면 첫 20건만 온다. */
export async function fetchMyReports(
  params: { targetType?: ReportTargetType; status?: ReportStatus; page?: number; size?: number } = {},
): Promise<ReportListResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const dto = await apiFetch<{
    content: ReportSummaryDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }>(`/api/v1/reports/me${suffix}`);
  return { ...dto, content: dto.content.map(toSummary) };
}

export async function fetchReportDetail(reportId: string): Promise<ReportDetail> {
  const dto = await apiFetch<ReportDetailDto>(`/api/v1/reports/${reportId}`);
  return toDetail(dto);
}
