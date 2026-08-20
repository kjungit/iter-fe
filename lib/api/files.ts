import { apiUpload } from "@/lib/api/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

interface FileUploadResponseDto {
  url: string;
}

/** 업로드 성공 시 화면에 바로 렌더링 가능한 절대 URL을 반환한다 (BE는 "/uploads/..." 상대경로만 줌). */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { url } = await apiUpload<FileUploadResponseDto>("/api/v1/files", formData);
  return `${API_BASE_URL}${url}`;
}
