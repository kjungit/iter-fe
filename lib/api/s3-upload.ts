/** presigned URL로 S3에 직접 PUT — 우리 백엔드를 거치지 않으므로 인증 헤더/재시도 로직이 필요 없다. */
export async function putToPresignedUrl(
  uploadUrl: string,
  file: File | Blob,
  requiredHeaders: Record<string, string>,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: requiredHeaders,
    body: file,
  });
  if (!response.ok) {
    throw new Error(`이미지 업로드에 실패했습니다. (${response.status})`);
  }
}
