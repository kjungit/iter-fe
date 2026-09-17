import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ReportAnalysisPanel } from "./ReportAnalysisPanel";
import type { ReportAnalysisJob } from "@/lib/api/report-analysis";

// 15007의 실제 OpenAI 결과. 식별자는 테스트 값으로 대체하며 외부 호출 없이 표시만 검증한다.
const job: ReportAnalysisJob = {
  jobId: "test-job", status: "SUCCEEDED", message: null, requestedAt: "2026-09-04T23:25:08.266234",
  analysis: {
    processingDisposition: "HUMAN_REVIEW_REQUIRED", suggestedCategory: "DAMAGE_OR_CONDITION_MISMATCH",
    priority: "NORMAL", confidenceBand: "LOW",
    summary: "신고자는 수령 직후 렌즈 테두리에서 긁힘을 발견했다고 주장하는 반면, 장비 소개에는 렌즈 외관에 흠집이 없다고 안내되어 있습니다. 대여자는 수령 사진을 보관 중이나 현재 신고에 사진이 첨부되어 있지 않아 비교가 필요합니다.",
    facts: [
      { field: "targetType", value: "EQUIPMENT", source: "CORE_SNAPSHOT" },
      { field: "reportStatus", value: "RECEIVED", source: "CORE_SNAPSHOT" },
    ],
    allegations: ["신고자는 렌즈 테두리에 긁힘이 있다고 주장합니다"],
    priorityReasons: ["렌즈 외관 손상 여부 및 시점 확인 필요", "수령 사진과 등록 사진 비교 필요", "책임 소재 판단을 위한 추가 검토 필요"],
    missingInformation: ["등록 당시 사진 자료", "수령 당시 사진 자료", "장비 손상 시점 및 상황에 대한 구체적 정보"],
    adminMemoDraft: "등록 사진과 수령 사진을 확보하여 비교 검토가 필요합니다. 대여자로부터 관련 사진 제출 요청과 손상 시점에 대한 상세 진술을 추가 확인하십시오.",
  },
};

afterEach(() => vi.unstubAllGlobals());

function render(error?: Error, renderedJob: ReportAnalysisJob = job) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const queryKey = ["admin", "report-ai", "test-report"];
  client.setQueryData(queryKey, renderedJob);
  if (error) client.getQueryCache().find({ queryKey })!.setState({ error, status: "error" });
  try {
    return renderToStaticMarkup(<QueryClientProvider client={client}>
      <ReportAnalysisPanel reportId="test-report" description="원본 신고" closed={false} />
    </QueryClientProvider>);
  } finally { client.clear(); }
}

it("실제 신고 결과의 주장·시스템 기록·추가 증빙·메모 초안을 구분해서 표시한다", () => {
  const fetch = vi.fn(() => { throw new Error("정적 검증에서 외부 호출 금지"); });
  vi.stubGlobal("fetch", fetch);
  const html = render();
  for (const value of [
    "관리자 확인 필요 · 파손·상태 불일치", "보통", "낮음", "확인된 시스템 기록 (접수 시점)",
    "신고자 주장 (사실 확인 전)", "추가 확인이 필요한 정보", "관리자 메모 초안", "초안 복사",
    "승인·기각·회원 및 장비 제재는 관리자가 직접 판단합니다.",
    job.analysis!.summary, job.analysis!.adminMemoDraft, ...job.analysis!.missingInformation,
  ]) expect(html).toContain(value);
  expect(html).not.toContain("AI 분석 요청");
  expect(fetch).not.toHaveBeenCalled();
});

it("다시 조회하다 실패해도 기존 신고 분석과 수동 조회 버튼은 유지한다", () => {
  const html = render(new TypeError("Failed to fetch"));
  expect(html).toContain("AI 요청을 확인하지 못했습니다.");
  expect(html).toContain(job.analysis!.summary);
  expect(html).toContain("상태 다시 조회");
});

it("미분석 신고의 요청 버튼과 상태 조회 버튼을 같은 버튼 그룹에 배치한다", () => {
  const html = render(undefined, {
    jobId: null,
    status: "NOT_REQUESTED",
    message: null,
    requestedAt: null,
    analysis: null,
  });

  expect(html).toContain("AI 분석 요청");
  expect(html).toContain("상태 다시 조회");
  expect(html).toContain("mt-3 flex flex-wrap gap-2");
  expect(html).not.toContain("ml-2");
});
