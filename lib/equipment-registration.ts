import { requestEquipmentImagePresignedUrls } from "@/lib/api/equipment";
import { putToPresignedUrl } from "@/lib/api/s3-upload";
import type { EquipmentDraft } from "@/lib/api/equipment-draft";
import type { CaptureView } from "@/lib/api/equipment";

export interface UploadedEquipmentPhoto {
  file: File;
  objectKey: string;
  expiresAt: string;
}

// presigned URL을 발급받아 장비 사진을 S3 임시 경로에 직접 업로드한다.
export async function uploadEquipmentPhoto(
  captureView: CaptureView,
  file: File,
  signal?: AbortSignal,
): Promise<UploadedEquipmentPhoto> {
  signal?.throwIfAborted();
  const [upload] = await requestEquipmentImagePresignedUrls([
    { captureView, fileName: file.name, contentType: file.type, size: file.size },
  ], signal);
  signal?.throwIfAborted();
  await putToPresignedUrl(upload.uploadUrl, file, upload.requiredHeaders, signal);
  return { file, objectKey: upload.objectKey, expiresAt: upload.expiresAt };
}

// 최종 등록이나 AI 요청 직전에 만료가 임박한 사진만 다시 업로드한다.
export async function refreshEquipmentPhoto<T extends UploadedEquipmentPhoto>(
  captureView: CaptureView,
  photo: T,
  signal?: AbortSignal,
): Promise<T> {
  signal?.throwIfAborted();
  if (Date.parse(photo.expiresAt) > Date.now() + 30_000) return photo;
  return { ...photo, ...await uploadEquipmentPhoto(captureView, photo.file, signal) };
}

// AI가 제안한 값만 반영하고 가격·기간·사진과 모르는 항목은 기존 값을 유지한다.
export function draftFormPatch(draft: EquipmentDraft) {
  return {
    ...(draft.name?.trim() ? { name: draft.name } : {}),
    ...(draft.category ? { category: draft.category } : {}),
    ...(draft.description?.trim() ? { description: draft.description } : {}),
    ...(draft.suggestedCondition ? {
      condition: draft.suggestedCondition,
      conditionDetail: draft.conditionDetail ?? "",
    } : {}),
  };
}
