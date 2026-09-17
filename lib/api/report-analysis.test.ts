import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
import { createReportAnalysis, fetchReportAnalysis, retryReportAnalysis, shouldPollReportAnalysis, type ReportAnalysisJob } from "./report-analysis";

vi.mock("@/lib/api/client", () => ({ apiFetch: vi.fn() }));
const request = vi.mocked(apiFetch);
const pending: ReportAnalysisJob = {
  jobId: "job-1", status: "PENDING", analysis: null, message: null, requestedAt: null,
};
afterEach(() => vi.clearAllMocks());

describe("관리자 신고 AI", () => {
  it("조회는 GET이며 접수에는 확인한 텍스트와 동의만 보낸다", async () => {
    request.mockResolvedValue(pending);
    const signal = new AbortController().signal;
    await fetchReportAnalysis("123", signal);
    await createReportAnalysis("123", "검토 내용", signal);
    expect(request.mock.calls[0][0]).toBe("/api/v1/admin/reports/123/ai-analysis");
    expect(request.mock.calls[0][1]?.method).toBeUndefined();
    expect(request.mock.calls[1][1]).toMatchObject({ method: "POST", body: { description: "검토 내용", externalAiConsent: true } });
    expect(request.mock.calls[1][1]?.signal).toBeInstanceOf(AbortSignal);
  });
  it("다시 접수해도 동일한 신고 경로를 사용한다", async () => {
    request.mockResolvedValue(pending);
    const signal = new AbortController().signal;
    await createReportAnalysis("123", "검토 내용", signal);
    await retryReportAnalysis("123", signal);
    expect(request.mock.calls[1][0]).toBe(`${request.mock.calls[0][0]}/retry`);
    expect(request.mock.calls[1][1]?.body).toBeUndefined();
  });
  it.each(["NOT_REQUESTED", "SUCCEEDED", "FAILED", "SUBMISSION_UNKNOWN"] as const)("%s는 자동 조회하지 않는다", (status) => {
    expect(shouldPollReportAnalysis({ ...pending, status }, 1)).toBe(false);
  });
  it("진행 중에만 조회하며 최대 30회를 지킨다", () => {
    expect(shouldPollReportAnalysis(pending, 29)).toBe(true);
    expect(shouldPollReportAnalysis({ ...pending, status: "PROCESSING" }, 29)).toBe(true);
    expect(shouldPollReportAnalysis(pending, 30)).toBe(false);
    expect(shouldPollReportAnalysis(undefined, 0)).toBe(false);
  });
  it("API 실패 시 자동 재접수하지 않는다", async () => {
    request.mockRejectedValue(new Error("offline"));
    await expect(createReportAnalysis("123", "검토 내용", new AbortController().signal)).rejects.toThrow("offline");
    expect(request).toHaveBeenCalledTimes(1);
  });
});
