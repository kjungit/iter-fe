/**
 * 업로드 전 브라우저에서 이미지를 리사이즈+재인코딩해 용량을 줄인다. presigned URL로 올리는
 * S3 PUT은 서버 사이즈 체크가 없어서, 압축을 안 하면 폰 카메라 원본(수~십수 MB)이 그대로
 * 올라가 느리고 비용도 커진다.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
/** 이미 이 정도로 작으면 재인코딩으로 화질만 잃을 수 있어 건너뛴다. */
const SKIP_COMPRESSION_UNDER_BYTES = 300 * 1024;

export async function compressImage(file: File): Promise<File> {
  if (file.size <= SKIP_COMPRESSION_UNDER_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
