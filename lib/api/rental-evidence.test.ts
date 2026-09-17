import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
import {
  createReceipt,
  createReturnEvidence,
  requestEvidenceImagePresignedUrls,
} from "@/lib/api/rentals";

vi.mock("@/lib/api/client", () => ({ apiFetch: vi.fn() }));
const request = vi.mocked(apiFetch);

afterEach(() => vi.clearAllMocks());

describe("수령·반납 증빙 업로드", () => {
  it("대여 ID와 실제 파일 크기를 포함해 업로드 권한을 요청한다", async () => {
    request.mockResolvedValue({ uploads: [] });

    await requestEvidenceImagePresignedUrls("42", [
      { captureView: "FRONT", contentType: "image/jpeg", size: 1024 },
    ]);

    expect(request).toHaveBeenCalledWith(
      "/api/v1/rentals/42/images/presigned-urls",
      {
        method: "POST",
        body: { files: [{ captureView: "FRONT", contentType: "image/jpeg", size: 1024 }] },
      },
    );
  });

  it("최종 증빙 제출에는 임시 조회 URL이 아니라 비공개 object key를 보낸다", async () => {
    request.mockResolvedValue(undefined);
    const receiptKey = "equipment/private/rental-evidence/42/2/receipt/photo.jpg";
    const returnKey = "equipment/private/rental-evidence/42/2/return/photo.jpg";

    await createReceipt("42", {
      productCondition: "NORMAL",
      images: [{ captureView: "FRONT", objectKey: receiptKey }],
    });
    await createReturnEvidence("42", {
      productCondition: "NORMAL",
      images: [{ captureView: "FRONT", objectKey: returnKey }],
    });

    expect(request.mock.calls[0][1]?.body).toMatchObject({
      images: [{ captureView: "FRONT", objectKey: receiptKey }],
    });
    expect(request.mock.calls[1][1]?.body).toMatchObject({
      images: [{ captureView: "FRONT", objectKey: returnKey }],
    });
  });
});
