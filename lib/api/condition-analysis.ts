import { apiFetch } from "@/lib/api/client";

export interface ConditionAnalysis {
  assessment: "NO_SIGNIFICANT_CHANGE" | "CHANGE_SUSPECTED" | "INCONCLUSIVE";
  suggestedCondition: "NORMAL" | "DAMAGED" | "DIRTY" | "MISSING_PART" | "OTHER";
  reliability: number;
  quality: { status: "ACCEPTED" | "RETAKE_REQUIRED" | "INCONCLUSIVE"; issues: string[] };
  findings: Array<{ type: string; severity: string; captureSlot: string; beforeImageId: string; afterImageId: string; description: string }>;
  viewResults?: Array<{
    captureView: "FRONT" | "SIDE" | "REAR";
    assessment: "NO_SIGNIFICANT_CHANGE" | "CHANGE_SUSPECTED" | "INCONCLUSIVE";
    reliability: number;
    quality: { status: "ACCEPTED" | "RETAKE_REQUIRED" | "INCONCLUSIVE"; issues: string[] };
    findings: Array<{ type: string; severity: string; captureSlot: string; beforeImageId: string; afterImageId: string; description: string }>;
    summary: string;
  }>;
  summary: string;
}

export interface ConditionAnalysisJob {
  jobId: string | null;
  status: "NOT_REQUESTED" | "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "SUBMISSION_UNKNOWN";
  analysis: ConditionAnalysis | null;
  message: string | null;
  requestedAt: string | null;
  comparedImageIds: Record<string, string> | null;
}

// AI 비교 결과를 신고 내용에 붙여 넣기 좋은 짧은 참고 문장으로 바꾼다.
export function buildConditionReportText(result: ConditionAnalysis): string {
  const findings = result.findings
    .map((finding, index) => `- 변화 후보 ${index + 1}: ${finding.description}`)
    .join("\n");
  const qualityIssues = result.quality.issues
    .map((issue) => `- 촬영 조건 참고: ${issue}`)
    .join("\n");
  const details = [findings, qualityIssues].filter(Boolean).join("\n");

  return [
    "[AI 수령·반납 비교 참고 의견]",
    result.summary,
    details,
    "※ AI 의견은 관리자 검토를 돕는 참고 자료이며, 신고자가 직접 확인한 내용을 함께 작성해야 합니다.",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1_800);
}

const path = (rentalId: string) =>
  `/api/v1/rentals/${encodeURIComponent(rentalId)}/condition-analysis`;

const limited = (signal: AbortSignal) =>
  // 화면 취소와 15초 HTTP 제한 중 하나라도 발생하면 해당 요청만 중단한다.
  AbortSignal.any([signal, AbortSignal.timeout(15_000)]);

// 대여별 수령·반납 비교 작업의 현재 상태와 결과를 조회한다.
export function fetchConditionAnalysis(rentalId: string, signal: AbortSignal): Promise<ConditionAnalysisJob> {
  return apiFetch(path(rentalId), {
    signal: limited(signal),
  });
}

// 사용자가 선택한 수령·반납 사진 번호와 외부 AI 동의를 함께 전송한다.
export function createConditionAnalysis(rentalId: string, signal: AbortSignal): Promise<ConditionAnalysisJob> {
  return apiFetch(path(rentalId), {
    method: "POST",
    body: {
      externalAiConsent: true,
    },
    signal: limited(signal),
  });
}

// 저장된 사진과 작업 ID를 유지한 채 접수 불명확 작업을 다시 접수한다.
export function retryConditionAnalysis(rentalId: string, signal: AbortSignal): Promise<ConditionAnalysisJob> {
  return apiFetch(`${path(rentalId)}/retry`, {
    method: "POST",
    signal: limited(signal),
  });
}

// 처리 중 작업만 최대 30회까지 자동 조회하도록 판단한다.
export function shouldPollConditionAnalysis(job: ConditionAnalysisJob | undefined, updates: number) {
  const isProcessing = job?.status === "PENDING" || job?.status === "PROCESSING";
  return updates < 30 && isProcessing;
}

// Core가 저장한 before-0 형식의 이미지 ID에서 화면 사진 번호만 안전하게 복원한다.
export function evidenceIndex(id: string | undefined): number | null {
  if (!id || !/^(before|after)-[0-4]$/.test(id)) return null;
  return Number(id.split("-")[1]);
}
