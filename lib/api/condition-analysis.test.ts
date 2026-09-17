import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
import { buildConditionReportText, createConditionAnalysis, fetchConditionAnalysis, retryConditionAnalysis, shouldPollConditionAnalysis,
  evidenceIndex, type ConditionAnalysisJob } from "./condition-analysis";

vi.mock("@/lib/api/client", () => ({ apiFetch: vi.fn() }));
const request = vi.mocked(apiFetch);
const pending: ConditionAnalysisJob = { jobId: "id", status: "PENDING", analysis: null, message: null, requestedAt: null, comparedImageIds: null };
afterEach(() => vi.clearAllMocks());

describe("수령·반납 AI 비교", () => {
  it("사진 URL 대신 동의만 보내고 같은 대여로 조회·재접수한다", async () => {
    request.mockResolvedValue(pending);
    const signal = new AbortController().signal;
    await createConditionAnalysis("42", signal);
    await fetchConditionAnalysis("42", signal);
    await retryConditionAnalysis("42", signal);
    expect(request.mock.calls[0][1]?.body).toEqual({ externalAiConsent: true });
    expect(request.mock.calls.map(([path]) => path)).toEqual([
      "/api/v1/rentals/42/condition-analysis", "/api/v1/rentals/42/condition-analysis", "/api/v1/rentals/42/condition-analysis/retry",
    ]);
    expect(request.mock.calls[2][1]?.body).toBeUndefined();
  });
  it.each(["NOT_REQUESTED", "SUCCEEDED", "FAILED", "SUBMISSION_UNKNOWN"] as const)("%s에서 자동 조회를 중단한다", (status) => {
    expect(shouldPollConditionAnalysis({ ...pending, status }, 1)).toBe(false);
  });
  it("진행 중에만 최대 30회 자동 조회한다", () => {
    expect(shouldPollConditionAnalysis(pending, 29)).toBe(true);
    expect(shouldPollConditionAnalysis(pending, 30)).toBe(false);
    expect(shouldPollConditionAnalysis(undefined, 0)).toBe(false);
  });
  it("응답의 최초 사진 순번을 확인하며 잘못된 식별자는 표시하지 않는다", () => {
    expect(evidenceIndex("before-1")).toBe(1);
    expect(evidenceIndex("after-4")).toBe(4);
    expect(evidenceIndex("after-5")).toBeNull();
    expect(evidenceIndex("other-1")).toBeNull();
    expect(evidenceIndex(undefined)).toBeNull();
  });
  it("실패를 새 분석 요청으로 바꾸지 않는다", async () => {
    request.mockRejectedValue(new Error("offline"));
    await expect(createConditionAnalysis("42", new AbortController().signal)).rejects.toThrow("offline");
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("AI 비교 결과를 신고자가 수정할 수 있는 참고 문장으로 변환한다", () => {
    const text = buildConditionReportText({
      assessment: "CHANGE_SUSPECTED",
      suggestedCondition: "DAMAGED",
      reliability: 0.8,
      quality: { status: "ACCEPTED", issues: ["조명 차이 있음"] },
      findings: [{
        type: "SCRATCH", severity: "MEDIUM", captureSlot: "RETURN_1",
        beforeImageId: "before-0", afterImageId: "after-0", description: "렌즈 테두리에 긁힘 후보가 보입니다.",
      }],
      summary: "반납 사진에서 외관 변화가 의심됩니다.",
    });

    expect(text).toContain("[AI 수령·반납 비교 참고 의견]");
    expect(text).toContain("렌즈 테두리에 긁힘 후보가 보입니다.");
    expect(text).toContain("촬영 조건 참고: 조명 차이 있음");
    expect(text).toContain("신고자가 직접 확인한 내용");
  });
});
