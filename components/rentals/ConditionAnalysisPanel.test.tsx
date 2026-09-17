import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ConditionAnalysisPanel } from "./ConditionAnalysisPanel";
import type { ConditionAnalysisJob } from "@/lib/api/condition-analysis";
import type { ReturnComparison } from "@/lib/api/rentals";

// 2026-09-04 실제 분석의 표시용 결과. 사진/식별자는 테스트용으로 대체한다.
// 정적 렌더링 검증이며 브라우저 클릭·polling·레이아웃 검증은 아니다.
const summary = "선택한 사진만으로 외관 변화를 판단하기 어렵습니다. 촬영 각도·조명·선명도와 추가 증빙을 직접 확인하십시오.";
const issue = "장비의 앞면과 뒷면 사진으로 보이지만, 같은 장비의 같은 부분을 충분히 비교하기 어렵습니다. 전면과 후면은 외관이 달라 변화 여부 확인에 부적합함";
const job: ConditionAnalysisJob = {
  jobId: "test-job", status: "SUCCEEDED", message: null, requestedAt: null,
  comparedImageIds: { before: "before-0", after: "after-0" },
  analysis: {
    assessment: "INCONCLUSIVE", suggestedCondition: "OTHER", reliability: 0,
    quality: { status: "RETAKE_REQUIRED", issues: [issue] }, findings: [], summary,
  },
};
const comparison: ReturnComparison = {
  rentalId: "test-rental", equipmentName: "테스트 장비", renter: { id: "test-user", nickname: "테스트" },
  startDate: "2026-09-01", endDate: "2026-09-04", returnDate: "2026-09-04",
  listingImages: [],
  receipt: { productCondition: "NORMAL", conditionDetail: null,
    images: [{ captureView: null, imageUrl: "/before.png" }], recordedAt: "2026-09-01" },
  returnReceipt: { productCondition: "NORMAL", conditionDetail: null,
    images: [{ captureView: null, imageUrl: "/after.png" }], recordedAt: "2026-09-04" },
};

afterEach(() => vi.unstubAllGlobals());

function render(data: ConditionAnalysisJob, error?: Error) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(["rental", "condition-ai", "test-rental"], data);
  if (error) client.getQueryCache().find({ queryKey: ["rental", "condition-ai", "test-rental"] })!
    .setState({ error, status: "error" });
  try {
    return renderToStaticMarkup(<QueryClientProvider client={client}>
      <ConditionAnalysisPanel rentalId="test-rental" comparison={comparison} />
    </QueryClientProvider>);
  } finally {
    client.clear();
  }
}

it("실제 판정 불가 결과의 요약·품질 문제·선택 사진과 수동 판단 안내를 렌더링한다", () => {
  const fetch = vi.fn(() => { throw new Error("정적 검증에서 외부 호출 금지"); });
  vi.stubGlobal("fetch", fetch);
  const html = render(job);
  for (const text of ["판정 불가", summary, issue, "수령 1번 / 반납 1번", "분석한 수령 사진", "분석한 반납 사진", "반납 완료·이상 신고는 아래 기존 버튼으로 직접 결정하십시오."]) {
    expect(html).toContain(text);
  }
  expect(html).not.toContain("선택한 사진 비교");
  expect(html).not.toContain("변화 후보 1");
  expect(html).not.toContain("0%");
  expect(fetch).not.toHaveBeenCalled();
});

it("접수 불명확 상태에서는 같은 작업 재접수와 조회 버튼을 표시한다", () => {
  const html = render({ ...job, status: "SUBMISSION_UNKNOWN", analysis: null });
  expect(html).toContain("동일 사진·작업으로 재접수");
  expect(html).toContain("상태 다시 조회");
  expect(html).not.toContain("선택한 사진 비교");
});

it("각도 차이 안내가 있어도 비교 가능한 범위의 의견을 표시한다", () => {
  const limitedSummary = "공통으로 보이는 외장에서는 뚜렷한 변화가 보이지 않습니다. 뒷면은 직접 확인하십시오.";
  const html = render({ ...job, analysis: {
    assessment: "NO_SIGNIFICANT_CHANGE", suggestedCondition: "NORMAL", reliability: 0.3,
    quality: { status: "ACCEPTED", issues: ["촬영 각도가 달라 뒷면은 비교하지 못했습니다."] },
    findings: [], summary: limitedSummary,
  } });
  expect(html).toContain("AI 참고 의견: 비교한 범위에서 뚜렷한 변화 없음");
  expect(html).toContain(limitedSummary);
  expect(html).toContain("비교 시 참고할 점");
  expect(html).toContain("촬영 각도가 달라 뒷면은 비교하지 못했습니다.");
  expect(html).toContain("최종 반납·신고 여부는 사람이 선택합니다.");
  expect(html).not.toContain("판정 불가");
  expect(html).not.toContain("30%");
});

it.each([
  [new DOMException("timeout", "TimeoutError"), "AI 요청 확인이 지연되거나 중단되었습니다."],
  [new TypeError("Failed to fetch"), "AI 서버에 연결하지 못했습니다."],
])("조회 오류를 구분하고 기존 결과와 수동 조회 버튼을 유지한다", (error, message) => {
  const html = render(job, error);
  expect(html).toContain(message);
  expect(html).toContain(summary);
  expect(html).toContain("상태 다시 조회");
});

it("최신 지침의 실제 결과에서 부분 비교 의견과 한계를 함께 표시한다", () => {
  const actualSummary = "두 사진 모두 VR 헤드셋과 양쪽 컨트롤러가 정면에서 촬영되었으나, 헤드셋 방향이 다릅니다. 공통으로 보이는 컨트롤러와 헤드셋 외관에 눈에 띄는 손상이나 오염은 관찰되지 않아 해당 범위에서는 변화가 없습니다. 각도와 조명 차이로 인해 헤드셋의 뒷면과 앞면이 상호 다르게 보여 직접적인 비교가 어려운 점은 확인 한계입니다.";
  const html = render({ ...job, analysis: {
    assessment: "NO_SIGNIFICANT_CHANGE", suggestedCondition: "NORMAL", reliability: 0.9,
    quality: { status: "ACCEPTED", issues: ["촬영 각도 차이 있음"] }, findings: [], summary: actualSummary,
  } });
  expect(html).toContain("비교한 범위에서 뚜렷한 변화 없음");
  expect(html).toContain(actualSummary);
  expect(html).toContain("촬영 각도 차이 있음");
  expect(html).not.toContain("90%");
  expect(html).not.toContain("판정 불가");
});
