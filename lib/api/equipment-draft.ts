import { apiFetch } from "@/lib/api/client";
import type { EquipmentCategory, ProductCondition } from "@/lib/api/equipment";

export interface EquipmentSpecification {
  name: string;
  value: string;
}

export interface EquipmentReferenceSource {
  title: string;
  url: string;
}

export interface EquipmentDraft {
  category: EquipmentCategory | null;
  name: string | null;
  // 선택 필드로 두어 개선 전 저장된 AI 작업 결과도 화면에서 계속 열 수 있게 한다.
  manufacturer?: string | null;
  modelName?: string | null;
  identificationStatus?: "MODEL_CONFIRMED" | "MODEL_LIKELY" | "PRODUCT_TYPE_ONLY" | "UNKNOWN";
  identificationEvidence?: string[];
  specifications?: EquipmentSpecification[];
  keyFeatures?: string[];
  referenceSources?: EquipmentReferenceSource[];
  description: string | null;
  suggestedCondition: ProductCondition | null;
  conditionDetail: string | null;
  visibleAccessories: string[];
  uncertainties: string[];
}

export interface EquipmentDraftJob {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "SUBMISSION_UNKNOWN";
  draft: EquipmentDraft | null;
  message: string | null;
}

const DRAFT_PATH = "/api/v1/ai/equipment-drafts";

function requestSignal(signal: AbortSignal): AbortSignal {
  // 호출 화면의 취소 신호와 개별 HTTP 요청의 15초 제한 중 먼저 발생한 것을 사용한다.
  return AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
}

// 임시 이미지 키와 사용자 힌트로 장비 초안 작업을 접수한다.
export function createEquipmentDraft(
  input: { imageKeys: string[]; name?: string; category?: EquipmentCategory },
  signal: AbortSignal,
): Promise<EquipmentDraftJob> {
  return apiFetch(DRAFT_PATH, {
    method: "POST",
    body: input,
    signal: requestSignal(signal),
  });
}

// 작업 ID로 장비 초안의 현재 상태와 결과를 한 번 조회한다.
export function fetchEquipmentDraft(jobId: string, signal: AbortSignal): Promise<EquipmentDraftJob> {
  return apiFetch(`${DRAFT_PATH}/${encodeURIComponent(jobId)}`, {
    signal: requestSignal(signal),
  });
}

// 접수 불명확 작업을 새로 만들지 않고 같은 ID로 다시 접수한다.
export function retryEquipmentDraft(jobId: string, signal: AbortSignal): Promise<EquipmentDraftJob> {
  return apiFetch(`${DRAFT_PATH}/${encodeURIComponent(jobId)}/retry`, {
    method: "POST",
    signal: requestSignal(signal),
  });
}

export function isDraftProcessing(job: EquipmentDraftJob): boolean {
  return job.status === "PENDING" || job.status === "PROCESSING";
}

// 다음 조회까지 기다리되 화면이 닫히면 timer를 정리하고 즉시 중단한다.
function waitForNextPoll(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, 2000);
    function cancel() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", cancel, { once: true });
  });
}

// 최대 30회 조회하고 멈추며 조회 중단이 서버의 AI 작업을 취소하지는 않는다.
export async function pollEquipmentDraft(
  initial: EquipmentDraftJob,
  onUpdate: (job: EquipmentDraftJob) => void,
  signal: AbortSignal,
): Promise<EquipmentDraftJob> {
  let job = initial;
  for (let count = 0; count < 30 && isDraftProcessing(job); count += 1) {
    // 다음 GET 전에 기다려 AI 서비스와 Core DB에 과도한 조회 요청을 보내지 않는다.
    await waitForNextPoll(signal);
    job = await fetchEquipmentDraft(job.jobId, signal);
    signal.throwIfAborted();
    onUpdate(job);
  }
  return job;
}
