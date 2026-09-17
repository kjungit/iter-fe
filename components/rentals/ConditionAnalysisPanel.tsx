"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ZoomableImage } from "@/components/ui/ZoomableImage";
import { ApiError } from "@/lib/api/client";
import { CAPTURE_VIEWS } from "@/lib/api/equipment";
import type { ReturnComparison } from "@/lib/api/rentals";
import { buildConditionReportText, createConditionAnalysis, fetchConditionAnalysis, retryConditionAnalysis,
  shouldPollConditionAnalysis, evidenceIndex } from "@/lib/api/condition-analysis";

const ASSESSMENT = {
  NO_SIGNIFICANT_CHANGE: "비교한 범위에서 뚜렷한 변화 없음",
  CHANGE_SUSPECTED: "외관 변화 의심",
  INCONCLUSIVE: "비교 근거 부족 (판정 불가)",
};

interface ConditionAnalysisPanelProps {
  rentalId: string;
  comparison: ReturnComparison | undefined;
  onUseForReport?: (text: string) => void;
}

// 여러 요청 오류를 사용자가 다음 행동을 선택할 수 있는 문구로 바꾼다.
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "AI 서버에 연결하지 못했습니다. 네트워크와 서버 실행 상태를 확인한 뒤 ‘상태 다시 조회’를 눌러 주십시오.";
  }

  if (error instanceof Error) {
    const requestStopped = error.name === "TimeoutError" || error.name === "AbortError";
    if (requestStopped) {
      return "AI 요청 확인이 지연되거나 중단되었습니다. ‘상태 다시 조회’로 확인하십시오.";
    }
  }

  return "AI 요청을 확인하지 못했습니다. 상태를 다시 조회하거나 직접 비교하십시오.";
}

// AI 비교 의견과 한계를 보여주되 반납·신고의 최종 선택은 기존 사용자 흐름에 남긴다.
export function ConditionAnalysisPanel({ rentalId, comparison, onUseForReport }: ConditionAnalysisPanelProps) {
  const [consent, setConsent] = useState(false);
  // 화면을 닫거나 새 요청을 시작할 때 진행 중인 요청을 취소하기 위해 보관한다.
  const controller = useRef<AbortController | null>(null);
  // 서버 상태가 계속 처리 중이어도 90초가 지나면 자동 조회를 멈추기 위한 기준 시각이다.
  const startedAt = useRef(0);
  const queryClient = useQueryClient();
  const queryKey = ["rental", "condition-ai", rentalId];
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      if (!startedAt.current) startedAt.current = Date.now();
      return fetchConditionAnalysis(rentalId, signal);
    },
    retry: false, refetchOnWindowFocus: false,
    // 실패·완료 상태에서는 polling하지 않고, 처리 중일 때만 2초 간격으로 조회한다.
    refetchInterval: (state) => !state.state.error && Date.now() - startedAt.current < 90_000
      && shouldPollConditionAnalysis(state.state.data, state.state.dataUpdateCount) ? 2000 : false,
  });
  const mutation = useMutation({
    mutationFn: (retry: boolean) => {
      controller.current = new AbortController();
      startedAt.current = Date.now();
      return retry ? retryConditionAnalysis(rentalId, controller.current.signal)
        : createConditionAnalysis(rentalId, controller.current.signal);
    },
    retry: false,
    onSuccess: async (job) => {
      // POST 응답을 즉시 표시한 뒤 GET으로 서버의 최신 처리 상태를 다시 맞춘다.
      queryClient.setQueryData(queryKey, job);
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  useEffect(() => () => { controller.current?.abort(); }, []);
  const job = query.data;
  const result = job?.analysis;
  const busy = mutation.isPending || query.isFetching;
  const before = comparison?.receipt.images.map((image) => image.imageUrl) ?? [];
  const after = comparison?.returnReceipt.images.map((image) => image.imageUrl) ?? [];
  const hasRequiredViews = CAPTURE_VIEWS.every((view) =>
    comparison?.receipt.images.some((image) => image.captureView === view)
      && comparison?.returnReceipt.images.some((image) => image.captureView === view));
  const error = mutation.error ?? query.error;
  const selectedBefore = evidenceIndex(job?.comparedImageIds?.before);
  const selectedAfter = evidenceIndex(job?.comparedImageIds?.after);

  return <section className="mt-4 rounded border border-border p-4 text-[13px] leading-relaxed">
    <h3 className="font-bold">AI 수령·반납 비교 의견</h3>
    <p className="mt-2 text-text-secondary">수령·반납 때 등록한 정면·측면·후면 사진을 같은 방향끼리 비교합니다.
      장비 등록 사진은 세 방향이 모두 있는 경우 보조 자료로 함께 참고합니다. 대여 건당 한 번만 분석하며,
      최종 반납·신고 여부는 사람이 선택합니다. 보이지 않는 부분·작동 여부·책임은 판단하지 않습니다.</p>
    {job?.status === "NOT_REQUESTED" && <>
      {!hasRequiredViews && <p className="mt-2 text-badge-danger-fg">
        정면·측면·후면 수령·반납 사진이 모두 있어야 V2 분석을 시작할 수 있습니다.</p>}
      <label className="my-3 flex items-start gap-2">
        <input type="checkbox" checked={consent} disabled={mutation.isPending}
          onChange={(event) => setConsent(event.target.checked)} />
        등록·수령·반납 사진에 얼굴·연락처 등 개인정보가 없으며 외부 AI(OpenAI)에 전달하는 데 동의합니다.
      </label>
      <Button size="sm" disabled={busy || !consent || !hasRequiredViews}
        onClick={() => mutation.mutate(false)}>정면·측면·후면 비교</Button>
    </>}
    {selectedBefore !== null && selectedAfter !== null && <div className="mt-3">
      <p>분석에 사용한 사진: 수령 {selectedBefore + 1}번 / 반납 {selectedAfter + 1}번</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <ZoomableImage src={before[selectedBefore]} alt="분석한 수령 사진" className="!object-contain" />
        <ZoomableImage src={after[selectedAfter]} alt="분석한 반납 사진" className="!object-contain" />
      </div>
    </div>}
    {(job?.status === "PENDING" || job?.status === "PROCESSING") && <p className="mt-3">
      분석 대기 또는 처리 중입니다. 자동 조회는 최대 30회·90초 후 중단되며 수동 조회할 수 있습니다.</p>}
    {job?.status === "SUBMISSION_UNKNOWN" && <Button size="sm" className="mt-3" disabled={busy}
      onClick={() => mutation.mutate(true)}>동일 사진·작업으로 재접수</Button>}
    {job?.status === "FAILED" && <p className="mt-3">AI 비교에 실패했습니다. 사진을 직접 확인하십시오. 자동 재분석하지 않습니다.</p>}
    {job?.message && <p className="mt-2">{job.message}</p>}
    <Button size="sm" variant="secondary" className="mt-3 ml-2" disabled={busy}
      onClick={() => { mutation.reset(); startedAt.current = Date.now(); void query.refetch(); }}>상태 다시 조회</Button>
    {error && <p role="alert" className="mt-2 text-badge-danger-fg">
      {getErrorMessage(error)}
    </p>}
    {result && <div className="mt-4 border-t border-border pt-3">
      <p className="font-bold">AI 참고 의견: {ASSESSMENT[result.assessment]}</p>
      <p className="mt-2 whitespace-pre-wrap">{result.summary}</p>
      {result.quality.issues.length > 0 && <div className="mt-2">
        <p className="font-semibold">비교 시 참고할 점</p>
        <ul className="list-disc pl-5">
          {result.quality.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>
      </div>}
      {!result.viewResults && result.findings.map((finding, index) =>
        <p key={index} className="mt-2">변화 후보 {index + 1}: {finding.description}</p>)}
      {result.viewResults && <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {result.viewResults.map((view) => <article key={view.captureView} className="rounded border border-border p-3">
          <p className="font-semibold">{view.captureView === "FRONT" ? "정면" : view.captureView === "SIDE" ? "측면" : "후면"}</p>
          <p className="mt-1 text-xs">{ASSESSMENT[view.assessment]}</p>
          <p className="mt-2 whitespace-pre-wrap text-xs">{view.summary}</p>
          {view.findings.map((finding, index) => <p key={index} className="mt-1 text-xs">
            변화 후보: {finding.description}
          </p>)}
        </article>)}
      </div>}
      {onUseForReport && <Button size="sm" variant="secondary" className="mt-3"
        onClick={() => onUseForReport(buildConditionReportText(result))}>
        AI 의견을 신고 내용에 반영
      </Button>}
      <p className="mt-3 font-semibold">참고 결과입니다. 무하자 보장이나 손상 책임의 근거로 단독 사용하지 마십시오.
        반납 완료·이상 신고는 아래 기존 버튼으로 직접 결정하십시오.</p>
    </div>}
  </section>;
}
