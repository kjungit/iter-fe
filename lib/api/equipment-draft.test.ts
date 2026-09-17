import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
import {
  createEquipmentDraft, fetchEquipmentDraft, retryEquipmentDraft, pollEquipmentDraft,
  type EquipmentDraftJob,
} from "@/lib/api/equipment-draft";

vi.mock("@/lib/api/client", () => ({ apiFetch: vi.fn() }));
const request = vi.mocked(apiFetch);
const pending: EquipmentDraftJob = { jobId: "test-job", status: "PENDING", draft: null, message: null };

afterEach(() => { vi.clearAllMocks(); vi.useRealTimers(); });

describe("Copilot API", () => {
  it("기존 Core API에 사진 키로 요청하고 같은 ID로 조회·재접수한다", async () => {
    request.mockResolvedValue(pending);
    const signal = new AbortController().signal;
    await createEquipmentDraft({ imageKeys: ["equipment/temp/1/photo.jpg"] }, signal);
    await fetchEquipmentDraft(pending.jobId, signal);
    await retryEquipmentDraft(pending.jobId, signal);
    expect(request.mock.calls.map(([path]) => path)).toEqual([
      "/api/v1/ai/equipment-drafts", "/api/v1/ai/equipment-drafts/test-job", "/api/v1/ai/equipment-drafts/test-job/retry",
    ]);
    expect(request.mock.calls[0][1]).toMatchObject({ method: "POST", body: { imageKeys: ["equipment/temp/1/photo.jpg"] } });
    expect(request.mock.calls[2][1]).toMatchObject({ method: "POST" });
  });

  it.each(["SUCCEEDED", "FAILED", "SUBMISSION_UNKNOWN"] as const)("%s 상태에서는 자동 조회하지 않는다", async (status) => {
    const initial = { ...pending, status };
    expect(await pollEquipmentDraft(initial, vi.fn(), new AbortController().signal)).toEqual(initial);
    expect(request).not.toHaveBeenCalled();
  });

  it("진행 중인 작업은 2초 간격으로 조회하고 완료되면 멈춘다", async () => {
    vi.useFakeTimers();
    request.mockResolvedValueOnce({ ...pending, status: "PROCESSING" }).mockResolvedValueOnce({ ...pending, status: "SUCCEEDED" });
    const update = vi.fn();
    const polling = pollEquipmentDraft(pending, update, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(4000);
    expect((await polling).status).toBe("SUCCEEDED");
    expect(request).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("계속 처리 중이어도 30회 조회 후 중단한다", async () => {
    vi.useFakeTimers();
    request.mockResolvedValue(pending);
    const polling = pollEquipmentDraft(pending, vi.fn(), new AbortController().signal);
    await vi.advanceTimersByTimeAsync(60_000);
    expect((await polling).jobId).toBe(pending.jobId);
    expect(request).toHaveBeenCalledTimes(30);
    expect(request.mock.calls.every(([, options]) => !options?.method)).toBe(true);
  });

  it("화면이 닫히면 대기 타이머와 후속 조회를 중단한다", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const polling = pollEquipmentDraft(pending, vi.fn(), controller.signal);
    const assertion = expect(polling).rejects.toThrow();
    controller.abort();
    await assertion;
    await vi.advanceTimersByTimeAsync(4000);
    expect(request).not.toHaveBeenCalled();
  });

  it("조회 실패를 새 작업 생성으로 바꾸지 않는다", async () => {
    vi.useFakeTimers();
    request.mockRejectedValue(new Error("offline"));
    const polling = pollEquipmentDraft(pending, vi.fn(), new AbortController().signal);
    const assertion = expect(polling).rejects.toThrow("offline");
    await vi.advanceTimersByTimeAsync(2000);
    await assertion;
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][1]?.method).toBeUndefined();
  });
});
