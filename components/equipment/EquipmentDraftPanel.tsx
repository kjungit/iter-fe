"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import {
  createEquipmentDraft,
  fetchEquipmentDraft,
  retryEquipmentDraft,
  pollEquipmentDraft,
  isDraftProcessing,
  type EquipmentDraft,
  type EquipmentDraftJob,
} from "@/lib/api/equipment-draft";
import { EQUIPMENT_CATEGORY_LABELS, PRODUCT_CONDITION_LABELS } from "@/lib/api/equipment";

interface Props {
  disabled: boolean;
  name: string;
  prepareImages: (signal: AbortSignal) => Promise<string[]>;
  onApply: (draft: EquipmentDraft) => void;
  onBusyChange: (busy: boolean) => void;
}

const IDENTIFICATION_STATUS_LABELS = {
  MODEL_CONFIRMED: "사진의 모델 표기로 확인",
  MODEL_LIKELY: "사진 특징상 유력한 모델",
  PRODUCT_TYPE_ONLY: "장비 종류만 확인",
  UNKNOWN: "식별 정보 부족",
} as const;

// 사진 준비부터 AI 초안 조회·적용까지 관리하되 최종 입력과 등록은 사용자에게 맡긴다.
export function EquipmentDraftPanel({ disabled, name, prepareImages, onApply, onBusyChange }: Props) {
  const [job, setJob] = useState<EquipmentDraftJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [consent, setConsent] = useState(false);
  const [submissionLost, setSubmissionLost] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  // 생성·상태 확인·동일 작업 재접수를 하나의 중복 방지 흐름으로 처리한다.
  async function run(action: "create" | "check" | "retry") {
    if (requestRef.current || disabled) {
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    onBusyChange(true);
    setNotice("");
    let creating = false;
    try {
      let next: EquipmentDraftJob;
      // 사용자가 화면을 닫는 경우와 전체 AI 흐름의 90초 제한을 하나의 signal로 묶는다.
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(90_000)]);
      if (action === "create") {
        const imageKeys = await prepareImages(signal);
        signal.throwIfAborted();
        // POST 전송을 시작한 뒤 응답을 잃으면 서버 접수 여부를 알 수 없음을 구분한다.
        creating = true;
        next = await createEquipmentDraft(
          {
            imageKeys,
            name: name.trim() || undefined,
          },
          signal,
        );
      } else {
        if (!job) {
          return;
        }

        if (action === "retry") {
          next = await retryEquipmentDraft(job.jobId, signal);
        } else {
          next = await fetchEquipmentDraft(job.jobId, signal);
        }
      }

      creating = false;
      if (controller.signal.aborted) {
        return;
      }

      setJob(next);
      signal.throwIfAborted();

      const final = await pollEquipmentDraft(next, setJob, signal);
      if (isDraftProcessing(final)) {
        setNotice("자동 조회를 멈췄습니다. 잠시 후 ‘결과 다시 확인’을 눌러주세요.");
      }
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }

      const serverResponseWasLost = !(err instanceof ApiError) || err.status >= 500;
      if (creating && serverResponseWasLost) {
        // 이 상태에서 새 UUID를 만들면 같은 사진 분석이 중복될 수 있어 자동 재생성을 막는다.
        setSubmissionLost(true);
        setNotice("접수 응답을 받지 못했습니다. 중복 분석 방지를 위해 재생성을 중단합니다. 수동 등록은 가능합니다.");
      } else {
        const message = err instanceof ApiError
          ? err.message
          : "AI 요청을 완료하지 못했습니다. 기존 입력은 유지되며 수동 등록할 수 있습니다.";
        setNotice(message);
      }
    } finally {
      if (!controller.signal.aborted) {
        requestRef.current = null;
        setBusy(false);
        onBusyChange(false);
      }
    }
  }

  const draft = job?.status === "SUCCEEDED" ? job.draft : null;
  return (
    <section className="mt-5 rounded-md border border-border-input bg-surface-alt p-4" aria-label="AI 장비 등록 도우미">
      <h2 className="text-sm font-bold text-ink">사진으로 AI 초안 만들기</h2>
      <p className="mt-2 text-xs text-text-secondary">
        사진에서 모델 후보를 찾고 공식 자료로 주요 사양·특징을 확인해 초안을 제안합니다.
        모델 표기가 보이지 않으면 장비 종류까지만 안내할 수 있습니다. 가격과 대여 기간은 직접 입력해주세요.
        사진을 바꾸면 이전 초안은 초기화됩니다.
      </p>
      <p className="mt-1 text-xs text-text-tertiary">
        정면 로고와 후면·밑면의 모델 라벨이 선명한 사진을 함께 올리면 식별 정확도가 높아집니다.
      </p>
      {!job && !submissionLost && (
        <>
          <label className="mt-3 flex items-start gap-2 text-xs text-text-secondary">
            <input type="checkbox" checked={consent} disabled={busy || disabled} onChange={(e) => setConsent(e.target.checked)} />
            사진과 입력한 장비 이름의 외부 AI(OpenAI) 분석 및 모델 후보의 웹 검색에 동의합니다.
            개인정보가 포함된 사진은 제외해주세요.
          </label>
          <Button className="mt-3" variant="secondary" size="sm" loading={busy} disabled={disabled || !consent} onClick={() => void run("create")}>
            AI 초안 생성
          </Button>
          <p className="mt-2 text-xs text-text-tertiary">사진 업로드 후 이용 가능 · 기본 하루 5회 · 개발용 Fake 모드에서는 예시 결과가 표시됩니다.</p>
        </>
      )}
      <div role="status" aria-live="polite" className="mt-3 text-sm text-text-secondary">
        {busy && "AI 요청을 처리하고 있습니다…"}
        {!busy && job?.status === "FAILED" && (job.message || "분석에 실패했습니다. 수동으로 입력해주세요.")}
        {!busy && job?.status === "SUBMISSION_UNKNOWN" && "접수 여부를 확인할 수 없습니다. 먼저 결과를 확인하고, 계속 미접수 상태이면 같은 작업을 재접수해주세요."}
        {notice && <p>{notice}</p>}
      </div>
      {job && (isDraftProcessing(job) || job.status === "SUBMISSION_UNKNOWN") && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={busy || disabled} onClick={() => void run("check")}>결과 다시 확인</Button>
          {job.status === "SUBMISSION_UNKNOWN" && (
            <Button variant="secondary" size="sm" disabled={busy || disabled} onClick={() => void run("retry")}>같은 작업 재접수</Button>
          )}
        </div>
      )}
      {draft && (
        <div className="mt-3 space-y-2 text-sm text-text-body-3">
          <h3 className="font-bold">AI 초안 미리보기</h3>
          <p>이름: {draft.name || "확인 필요"}</p>
          <p>분류: {draft.category ? EQUIPMENT_CATEGORY_LABELS[draft.category] : "확인 필요"}</p>
          {draft.identificationStatus && (
            <div className="rounded-sm bg-white p-3">
              <p className="font-bold">모델 식별</p>
              <p className="mt-1">판별 수준: {IDENTIFICATION_STATUS_LABELS[draft.identificationStatus]}</p>
              {draft.manufacturer && <p>제조사: {draft.manufacturer}</p>}
              {draft.modelName && <p>모델명: {draft.modelName}</p>}
              {(draft.identificationEvidence?.length ?? 0) > 0 && (
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {draft.identificationEvidence?.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              )}
            </div>
          )}
          {(draft.specifications?.length ?? 0) > 0 && (
            <div>
              <p className="font-bold">주요 사양</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {draft.specifications?.map((specification, index) => (
                  <li key={index}>{specification.name}: {specification.value}</li>
                ))}
              </ul>
            </div>
          )}
          {(draft.keyFeatures?.length ?? 0) > 0 && (
            <div>
              <p className="font-bold">주요 특징</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {draft.keyFeatures?.map((feature, index) => <li key={index}>{feature}</li>)}
              </ul>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words">설명: {draft.description || "확인 필요"}</p>
          <p>외관 상태: {draft.suggestedCondition ? PRODUCT_CONDITION_LABELS[draft.suggestedCondition] : "확인 필요"}</p>
          {draft.conditionDetail && <p className="break-words">상태 상세: {draft.conditionDetail}</p>}
          {draft.visibleAccessories.length > 0 && <p>보이는 구성품: {draft.visibleAccessories.join(", ")}</p>}
          {draft.uncertainties.length > 0 && (
            <div className="rounded-sm bg-white p-3">
              <p className="font-bold">직접 확인할 내용</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {draft.uncertainties.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          )}
          {(draft.referenceSources?.length ?? 0) > 0 && (
            <div>
              <p className="font-bold">사양 참고 자료</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {draft.referenceSources
                  ?.filter((source) => source.url.startsWith("https://"))
                  .map((source, index) => (
                    <li key={index}>
                      <a className="underline" href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-text-secondary">AI는 실제 작동 여부를 확인할 수 없습니다. 적용하면 제안된 항목의 현재 입력값이 바뀝니다. 확인 후 수정해주세요.</p>
          <Button variant="secondary" size="sm" disabled={disabled || busy} onClick={() => onApply(draft)}>초안 적용</Button>
        </div>
      )}
    </section>
  );
}
