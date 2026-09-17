import { afterEach, describe, expect, it, vi } from "vitest";
import { requestEquipmentImagePresignedUrls } from "@/lib/api/equipment";
import { putToPresignedUrl } from "@/lib/api/s3-upload";
import { draftFormPatch, refreshEquipmentPhoto } from "@/lib/equipment-registration";
import type { EquipmentDraft } from "@/lib/api/equipment-draft";

vi.mock("@/lib/api/equipment", () => ({ requestEquipmentImagePresignedUrls: vi.fn() }));
vi.mock("@/lib/api/s3-upload", () => ({ putToPresignedUrl: vi.fn() }));
afterEach(() => vi.clearAllMocks());

const draft: EquipmentDraft = {
  name: null, category: "CAMERA", description: "검은 카메라", suggestedCondition: "NORMAL",
  conditionDetail: null, visibleAccessories: ["렌즈"], uncertainties: ["작동 확인 필요"],
};

describe("초안 적용", () => {
  it("알 수 없는 이름과 가격·기간·사진은 기존 값을 유지한다", () => {
    const current = { name: "직접 쓴 이름", category: "LAPTOP", dailyPrice: 1000, availableFrom: "2026-09-04", imageKeys: ["old-photo"], thumbnailIndex: 0 };
    const result = { ...current, ...draftFormPatch(draft) };
    expect(result).toMatchObject({ ...current, category: "CAMERA", description: "검은 카메라", condition: "NORMAL", conditionDetail: "" });
    expect(result).not.toHaveProperty("visibleAccessories");
  });
  it("빈 문자열과 판단 불가능한 상태는 기존 입력을 덮어쓰지 않는다", () => {
    expect(draftFormPatch({ ...draft, name: "  ", description: "", category: null, suggestedCondition: null })).toEqual({});
  });
});

describe("임시 사진 재사용", () => {
  const file = new File(["test"], "camera.jpg", { type: "image/jpeg" });
  it("유효한 사진은 다시 업로드하지 않는다", async () => {
    const photo = { file, objectKey: "old-key", expiresAt: new Date(Date.now() + 120_000).toISOString() };
    expect(await refreshEquipmentPhoto("FRONT", photo)).toBe(photo);
    expect(requestEquipmentImagePresignedUrls).not.toHaveBeenCalled();
  });
  it.each(["expired", "near-expiry", "invalid"])("%s 사진만 다시 업로드하고 미리보기는 유지한다", async (kind) => {
    const expiresAt = kind === "invalid" ? "invalid" : new Date(Date.now() + (kind === "expired" ? -1 : 10_000)).toISOString();
    vi.mocked(requestEquipmentImagePresignedUrls).mockResolvedValue([{
      captureView: "FRONT", objectKey: "new-key", uploadUrl: "https://example.test/upload", requiredHeaders: { "Content-Type": "image/jpeg" }, expiresAt: "2099-01-01T00:00:00Z",
    }]);
    const photo = await refreshEquipmentPhoto("FRONT", { file, objectKey: "old-key", expiresAt, previewUrl: "blob:preview" });
    expect(photo).toMatchObject({ objectKey: "new-key", previewUrl: "blob:preview", file });
    expect(putToPresignedUrl).toHaveBeenCalledWith("https://example.test/upload", file, { "Content-Type": "image/jpeg" }, undefined);
  });
  it("업로드 실패 시 잘못된 새 키를 반환하지 않는다", async () => {
    vi.mocked(requestEquipmentImagePresignedUrls).mockRejectedValueOnce(new Error("upload failed"));
    await expect(refreshEquipmentPhoto("FRONT", { file, objectKey: "old-key", expiresAt: "2000-01-01" })).rejects.toThrow("upload failed");
  });
});
