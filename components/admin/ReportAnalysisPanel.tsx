"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError } from "@/lib/api/client";
import {
  createReportAnalysis,
  fetchReportAnalysis,
  retryReportAnalysis,
  shouldPollReportAnalysis,
  REPORT_AI_CATEGORY_LABELS,
} from "@/lib/api/report-analysis";

const PRIORITY_LABELS = {
  CRITICAL: "긴급",
  HIGH: "높음",
  NORMAL: "보통",
  LOW: "낮음",
};

const CONFIDENCE_LABELS = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

const FACT_LABELS: Record<string, string> = {
  targetType: "신고 대상 유형",
  reportStatus: "신고 처리 상태",
  userStatus: "회원 상태",
  userRole: "회원 역할",
  reportsAgainstUser: "해당 회원 신고 누적 건수",
  completedRentalsAsRenter: "대여자 완료 거래 수",
  completedRentalsAsOwner: "등록자 완료 거래 수",
  overdueRentalsAsRenter: "대여자 연체 거래 수",
  equipmentCategory: "장비 카테고리",
  equipmentStatus: "장비 게시 상태",
  listedCondition: "등록된 장비 상태",
  dailyPrice: "등록 일 대여료",
  reportsAgainstEquipment: "해당 장비 신고 누적 건수",
  rentalRelation: "관련 거래 범위",
  rentalStatus: "대여 상태",
  rentalStartDate: "대여 시작일",
  rentalEndDate: "대여 종료일",
  rentalDays: "대여 일수",
  dailyPriceSnapshot: "예약 당시 일 대여료",
  totalPrice: "총 결제 예정 금액",
  paymentStatus: "결제 상태",
  paymentAmount: "결제 금액",
  outboundShippingStatus: "출고 배송 상태",
  outboundDeliveredAt: "출고 배송 완료 시각",
  returnShippingStatus: "반납 배송 상태",
  returnDeliveredAt: "반납 배송 완료 시각",
  receiptCondition: "수령 당시 상태",
  receivedAt: "수령 확인 시각",
  returnCondition: "반납 당시 상태",
  returnDate: "반납일",
  relatedDisputeStatus: "관련 분쟁 상태",
};

const FACT_VALUE_LABELS: Record<string, string> = {
  DIRECT_REPORT_TARGET: "신고 대상 거래",
  LATEST_RENTAL_FOR_REPORTED_EQUIPMENT: "신고자와 장비의 최근 거래",
  LATEST_RENTAL_BETWEEN_RELATED_USERS: "신고자와 대상 회원 사이의 최근 거래",
};

interface ItemsProps {
  title: string;
  items: string[];
}

interface ReportAnalysisPanelProps {
  reportId: string;
  description: string;
  closed: boolean;
}

// 신고 분석의 근거·주장·추가 확인 항목을 같은 목록 형태로 표시한다.
function Items({ title, items }: ItemsProps) {
  return <div className="mt-3">
    <h3 className="font-bold">{title}</h3>
    {items.length ? <ul className="mt-1 list-disc space-y-1 pl-5">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul> : <p className="text-text-secondary">없음</p>}
  </div>;
}

// Core snapshot의 영문 필드명을 관리자 화면에서 읽을 수 있는 문장으로 바꾼다.
function formatFact(field: string, value: string): string {
  const label = FACT_LABELS[field] ?? field;
  const displayValue = FACT_VALUE_LABELS[value] ?? value;
  return `${label}: ${displayValue}`;
}

// 관리자에게 AI 검토 자료를 제공하되 신고 처리와 제재 결정은 자동화하지 않는다.
export function ReportAnalysisPanel({ reportId, description, closed }: ReportAnalysisPanelProps) {
  const [text, setText] = useState(description);
  const [consent, setConsent] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  // 화면 이탈 시 현재 POST/GET 요청을 중단하되 서버에서 시작된 AI 작업은 취소하지 않는다.
  const controller = useRef<AbortController | null>(null);
  // 처리 지연 시 무한 polling하지 않도록 자동 조회 시작 시각을 보관한다.
  const startedAt = useRef(0);
  const queryClient = useQueryClient();
  const queryKey = ["admin", "report-ai", reportId];
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      if (!startedAt.current) startedAt.current = Date.now();
      return fetchReportAnalysis(reportId, signal);
    },
    retry: false,
    refetchOnWindowFocus: false,
    // 처리 중 상태만 2초마다 확인하며 오류 또는 90초 경과 시 자동 조회를 멈춘다.
    refetchInterval: (state) => !state.state.error
      && Date.now() - startedAt.current < 90_000
      && shouldPollReportAnalysis(state.state.data, state.state.dataUpdateCount) ? 2000 : false,
  });
  const mutation = useMutation({
    mutationFn: (retry: boolean) => {
      controller.current = new AbortController();
      startedAt.current = Date.now();

      if (retry) {
        return retryReportAnalysis(reportId, controller.current.signal);
      }
      return createReportAnalysis(reportId, text.trim(), controller.current.signal);
    },
    retry: false,
    onSuccess: async (job) => {
      // 접수 응답을 먼저 보여주고 GET 재조회로 Python 서비스의 최신 상태를 맞춘다.
      queryClient.setQueryData(queryKey, job);
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  useEffect(() => () => { controller.current?.abort(); }, []);

  const job = query.data;
  const analysis = job?.analysis;
  const canCreate = job?.status === "NOT_REQUESTED" && !closed;
  const canResubmit = job?.status === "SUBMISSION_UNKNOWN";
  const error = mutation.error ?? query.error;
  const busy = mutation.isPending || query.isFetching;

  // AI 메모 초안을 복사해 관리자가 검토·수정한 뒤 사용할 수 있게 한다.
  async function copyMemo() {
    try {
      await navigator.clipboard.writeText(analysis?.adminMemoDraft ?? "");
      setCopyMessage("복사했습니다. 검토·수정 후 관리자 메모에 붙여 넣으십시오.");
    } catch {
      setCopyMessage("복사하지 못했습니다. 아래 초안을 직접 선택해 복사하십시오.");
    }
  }

  return <section className="rounded-lg border border-border p-5 text-[13px] leading-relaxed">
    <h2 className="font-bold text-ink">AI 신고 검토 보조</h2>
    <p className="mt-2 text-text-secondary">
      AI는 검토 자료만 제안합니다. 승인·기각·회원 및 장비 제재는 관리자가 직접 판단합니다.
      분석이 실패해도 기존 상태 변경 기능은 이용할 수 있습니다.
    </p>
    {canCreate && <div className="mt-3">
      <label htmlFor={`report-ai-text-${reportId}`} className="font-bold">외부 AI에 전달할 내용</label>
      <p className="my-2 text-text-secondary">
        이름·연락처·주소·이메일·계좌 등 개인정보를 제거하고 핵심 신고 사유와 주장을 남기십시오.
        수정 내용은 원본 신고를 변경하지 않습니다. 신고 유형에 따라 공개 닉네임, 장비 게시 정보,
        거래·결제·배송·수령·반납 상태가 함께 전달됩니다. 기존 상태 비교 AI 결과가 있으면 그 결과를
        재사용하고 동일 거래의 수령·반납 사진은 다시 보내지 않습니다. 기존 결과가 없을 때만 관련 사진
        최대 6장을 전달하며, 장비 자체를 신고한 경우에는 등록 사진이 별도로 전달될 수 있습니다.
      </p>
      <Textarea id={`report-ai-text-${reportId}`} value={text} maxLength={2000} minHeight={150}
        disabled={mutation.isPending} onChange={(event) => { setText(event.target.value); setConsent(false); }} />
      <p className="text-right text-text-secondary">{text.length}/2,000자</p>
      <label className="my-3 flex items-start gap-2">
        <input type="checkbox" checked={consent} disabled={mutation.isPending}
          onChange={(event) => setConsent(event.target.checked)} />
        개인정보 제거를 확인했으며 검토 내용과 위 관련 자료를 외부 AI(OpenAI)에 전달하는 데 동의합니다.
      </label>
    </div>}
    {canResubmit && <div className="mt-3">
      <p>최초 확인한 내용과 동일한 작업 ID로만 다시 접수합니다. 추가 분석은 생성하지 않습니다.</p>
    </div>}
    {job?.status === "NOT_REQUESTED" && closed && <p className="mt-3">처리 완료된 신고는 새로 분석하지 않습니다.</p>}
    {(job?.status === "PENDING" || job?.status === "PROCESSING") && <p className="mt-3">
      분석 대기 또는 처리 중입니다. 자동 조회는 최대 30회·90초 후 중단되며, 필요하면 상태를 다시 조회하십시오.
    </p>}
    {job?.status === "FAILED" && <p className="mt-3">분석에 실패했습니다. 자동 재분석하지 않으며 수동으로 검토하십시오.</p>}
    {job?.message && <p className="mt-2">{job.message}</p>}
    {job?.requestedAt && <p className="mt-2 text-text-secondary">분석 기준 시각: {job.requestedAt.replace("T", " ")} (한국 시간)</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      {canCreate && <Button size="sm" disabled={!consent || !text.trim() || text.length > 2000 || busy}
        onClick={() => mutation.mutate(false)}>AI 분석 요청</Button>}
      {canResubmit && <Button size="sm" disabled={busy}
        onClick={() => mutation.mutate(true)}>동일 작업 재접수</Button>}
      <Button variant="secondary" size="sm" disabled={busy}
        onClick={() => { mutation.reset(); startedAt.current = Date.now(); void query.refetch(); }}>상태 다시 조회</Button>
    </div>
    {error && <p role="alert" className="mt-2 text-badge-danger-fg">
      {error instanceof ApiError ? error.message : "AI 요청을 확인하지 못했습니다. 상태를 다시 조회하십시오."}
    </p>}
    {analysis && <div className="mt-4 border-t border-border pt-3">
      <p className="font-bold">관리자 확인 필요 · {REPORT_AI_CATEGORY_LABELS[analysis.suggestedCategory]}</p>
      <p>검토 우선순위: {PRIORITY_LABELS[analysis.priority]} / 분류 명확성: {CONFIDENCE_LABELS[analysis.confidenceBand]}</p>
      <p className="text-text-secondary">우선순위와 분류 명확성은 신고의 진실성·위반 확률을 의미하지 않습니다.</p>
      <p className="mt-3 whitespace-pre-wrap">{analysis.summary}</p>
      <Items title="우선순위 제안 근거" items={analysis.priorityReasons} />
      <Items
        title="확인된 시스템 기록 (접수 시점)"
        items={analysis.facts.map((fact) => formatFact(fact.field, fact.value))}
      />
      <Items title="신고자 주장 (사실 확인 전)" items={analysis.allegations} />
      <Items title="추가 확인이 필요한 정보" items={analysis.missingInformation} />
      <h3 className="mt-3 font-bold">관리자 메모 초안</h3>
      <p className="mt-1 whitespace-pre-wrap">{analysis.adminMemoDraft}</p>
      <Button size="sm" variant="secondary" className="mt-2" disabled={!analysis.adminMemoDraft}
        onClick={() => void copyMemo()}>초안 복사</Button>
      {copyMessage && <p role="status" className="mt-2">{copyMessage}</p>}
    </div>}
  </section>;
}
