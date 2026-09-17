import { apiFetch } from "@/lib/api/client";

export interface ReportAnalysis {
  processingDisposition: "ANALYSIS_READY" | "HUMAN_REVIEW_REQUIRED";
  summary: string;
  suggestedCategory: keyof typeof REPORT_AI_CATEGORY_LABELS;
  priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  priorityReasons: string[];
  facts: Array<{ field: string; value: string; source: "CORE_SNAPSHOT" }>;
  allegations: string[];
  missingInformation: string[];
  adminMemoDraft: string;
  confidenceBand: "HIGH" | "MEDIUM" | "LOW";
}

export interface ReportAnalysisJob {
  jobId: string | null;
  status: "NOT_REQUESTED" | "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "SUBMISSION_UNKNOWN";
  analysis: ReportAnalysis | null;
  message: string | null;
  requestedAt: string | null;
}

export const REPORT_AI_CATEGORY_LABELS = {
  DAMAGE_OR_CONDITION_MISMATCH: "파손·상태 불일치",
  LATE_OR_NON_RETURN: "지연·미반납",
  FALSE_LISTING_OR_MISREPRESENTATION: "허위 등록·정보 불일치",
  HARASSMENT_OR_ABUSE: "괴롭힘·욕설",
  PAYMENT_OR_FRAUD: "결제·사기 의심",
  SAFETY_OR_ILLEGALITY: "안전·불법 행위 의심",
  OTHER: "기타·분류 보류",
};

function path(reportId: string) {
  return `/api/v1/admin/reports/${encodeURIComponent(reportId)}/ai-analysis`;
}

// 관리자 화면에 표시할 신고 AI 작업 상태와 참고 결과를 조회한다.
export function fetchReportAnalysis(reportId: string, signal: AbortSignal): Promise<ReportAnalysisJob> {
  const limitedSignal = AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
  return apiFetch(path(reportId), {
    signal: limitedSignal,
  });
}

// 관리자가 개인정보를 정리한 검토 텍스트와 외부 AI 동의를 전송한다.
export function createReportAnalysis(reportId: string, description: string, signal: AbortSignal): Promise<ReportAnalysisJob> {
  const limitedSignal = AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
  return apiFetch(path(reportId), {
    method: "POST",
    body: {
      description,
      externalAiConsent: true,
    },
    signal: limitedSignal,
  });
}

// 최초 신고 입력을 유지한 채 접수 불명확 작업을 다시 접수한다.
export function retryReportAnalysis(reportId: string, signal: AbortSignal): Promise<ReportAnalysisJob> {
  const limitedSignal = AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
  return apiFetch(`${path(reportId)}/retry`, {
    method: "POST",
    signal: limitedSignal,
  });
}

// 최대 30회 자동 조회하되 실패·접수 불명확 상태에서는 자동 재접수하지 않는다.
export function shouldPollReportAnalysis(job: ReportAnalysisJob | undefined, updates: number): boolean {
  const isProcessing = job?.status === "PENDING" || job?.status === "PROCESSING";
  return updates < 30 && isProcessing;
}
