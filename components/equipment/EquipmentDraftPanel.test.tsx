import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { EquipmentDraftPanel } from "./EquipmentDraftPanel";
import { refreshEquipmentPhoto } from "@/lib/equipment-registration";

let start: (() => void) | undefined;
vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
    if (children === "AI 초안 생성") start = onClick;
    return <button>{children}</button>;
  },
}));

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); start = undefined; });

// 실제 패널의 클릭 처리 → 만료 사진 준비 → presign/PUT → finally 연결을 검증한다.
// DOM 클릭·레이아웃 검증과는 구분한다.
it.each(["presign", "put"])("%s가 멈춰도 전체 시간 제한 후 수동 등록 잠금을 해제한다", async (stage) => {
  const controller = new AbortController();
  const originalTimeout = AbortSignal.timeout;
  vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => ms === 90_000 ? controller.signal : originalTimeout(ms));
  const fetch = vi.fn((url: string, options: RequestInit) => {
    if (stage === "put" && url.includes("presigned-urls")) {
      return Promise.resolve(Response.json({ uploads: [{
        captureView: "FRONT", objectKey: "new-key", uploadUrl: "https://example.test/upload", requiredHeaders: {}, expiresAt: "2099-01-01",
      }] }));
    }
    return new Promise<Response>((_, reject) => {
      if (options.signal!.aborted) reject(options.signal!.reason);
      else options.signal!.addEventListener("abort", () => reject(options.signal!.reason), { once: true });
    });
  });
  vi.stubGlobal("fetch", fetch);
  const onBusyChange = vi.fn();
  const photo = { file: new File(["test"], "camera.jpg", { type: "image/jpeg" }), objectKey: "old-key", expiresAt: "2000-01-01" };
  renderToStaticMarkup(<EquipmentDraftPanel disabled={false} name="test"
    prepareImages={async (signal) => [(await refreshEquipmentPhoto("FRONT", photo, signal)).objectKey]}
    onApply={vi.fn()} onBusyChange={onBusyChange} />);
  expect(start).toBeTypeOf("function");
  start!();
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(stage === "put" ? 2 : 1));
  expect(onBusyChange).toHaveBeenLastCalledWith(true);
  controller.abort(new DOMException("timeout", "TimeoutError"));
  await vi.waitFor(() => expect(onBusyChange.mock.calls).toEqual([[true], [false]]));
  expect(fetch.mock.calls.some(([url]) => url.includes("/ai/equipment-drafts"))).toBe(false);
});
