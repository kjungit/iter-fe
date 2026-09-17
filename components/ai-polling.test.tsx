import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ConditionAnalysisPanel } from "./rentals/ConditionAnalysisPanel";
import { ReportAnalysisPanel } from "./admin/ReportAnalysisPanel";

// DOM 의존성 없이 컴포넌트가 실제 등록한 조회 함수와 자동 조회 조건을 검증한다.
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tanstack/react-query")>(),
  useQuery: vi.fn(() => ({ data: undefined, error: null, isFetching: false })),
}));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiFetch: vi.fn(async () => ({ status: "SUCCEEDED" })),
}));

afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

it.each([
  ["수령·반납 비교", <ConditionAnalysisPanel key="condition" rentalId="test-rental" comparison={undefined} />],
  ["신고 검토", <ReportAnalysisPanel key="report" reportId="test-report" description="테스트 신고" closed={false} />],
])("%s: 90초 경과 후에도 개별 조회에는 15초를 부여하고 자동 조회만 중단한다", async (_, panel) => {
  const now = vi.spyOn(Date, "now").mockReturnValue(1_000);
  const timeout = vi.spyOn(AbortSignal, "timeout");
  const client = new QueryClient();
  try {
    renderToStaticMarkup(<QueryClientProvider client={client}>
      {panel}
    </QueryClientProvider>);
    const options = vi.mocked(useQuery).mock.calls[0][0];
    const queryFn = options.queryFn;
    const interval = options.refetchInterval;
    if (typeof queryFn !== "function" || typeof interval !== "function") throw new Error("조회 설정 누락");
    const context = { client, queryKey: ["rental", "condition-ai", "test-rental"], signal: new AbortController().signal, meta: undefined };
    const state = { state: { error: null, data: { status: "PENDING" }, dataUpdateCount: 1 } };
    await queryFn(context);
    expect(interval(state as Parameters<typeof interval>[0])).toBe(2000);
    for (const stopped of [
      { ...state.state, error: new Error("offline") },
      { ...state.state, data: { status: "SUCCEEDED" } },
      { ...state.state, dataUpdateCount: 30 },
    ]) {
      expect(interval({ state: stopped } as Parameters<typeof interval>[0])).toBe(false);
    }
    now.mockReturnValue(92_000);
    expect(interval(state as Parameters<typeof interval>[0])).toBe(false);
    await queryFn(context);
    expect(timeout.mock.calls.map(([ms]) => ms)).toEqual([15_000, 15_000]);
  } finally {
    client.clear();
  }
});
