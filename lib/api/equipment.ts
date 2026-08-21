import { apiFetch } from "@/lib/api/client";

/** BE device/domain/entity/EquipmentCategory와 동일 (한글 라벨은 EQUIPMENT_CATEGORY_LABELS에서만 매핑). */
export type EquipmentCategory =
  | "LAPTOP"
  | "TABLET"
  | "CAMERA"
  | "LENS"
  | "MONITOR"
  | "VR"
  | "GAME_CONSOLE"
  | "PROJECTOR"
  | "OTHER";

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  "LAPTOP",
  "TABLET",
  "CAMERA",
  "LENS",
  "MONITOR",
  "VR",
  "GAME_CONSOLE",
  "PROJECTOR",
  "OTHER",
];

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  LAPTOP: "노트북",
  TABLET: "태블릿",
  CAMERA: "카메라",
  LENS: "렌즈",
  MONITOR: "모니터",
  VR: "VR기기",
  GAME_CONSOLE: "게임기",
  PROJECTOR: "프로젝터",
  OTHER: "기타",
};

export type ProductCondition = "NORMAL" | "DAMAGED" | "DIRTY" | "MISSING_PART" | "OTHER";

export const PRODUCT_CONDITIONS: ProductCondition[] = [
  "NORMAL",
  "DAMAGED",
  "DIRTY",
  "MISSING_PART",
  "OTHER",
];

export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  NORMAL: "양호",
  DAMAGED: "파손",
  DIRTY: "오염",
  MISSING_PART: "부속품 누락",
  OTHER: "기타",
};

export type EquipmentStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "SUSPENDED" | "DELETED";

export interface EquipmentSummary {
  id: string;
  name: string;
  category: EquipmentCategory;
  dailyPrice: number;
  availableFrom: string | null;
  availableTo: string | null;
  productCondition: ProductCondition;
  thumbnailUrl: string | null;
  averageRating: number;
  reviewCount: number;
}

export interface EquipmentImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
  thumbnail: boolean;
}

/** 장비 상세의 소유자 필드 — {id, nickname}. 대여 쪽 UserSummary({userId,nickName})와 모양이 다르니 섞지 말 것. */
export interface EquipmentOwner {
  id: string;
  nickname: string;
}

export interface EquipmentDetail {
  id: string;
  name: string;
  category: EquipmentCategory;
  description: string;
  dailyPrice: number;
  availableFrom: string | null;
  availableTo: string | null;
  status: EquipmentStatus;
  productCondition: ProductCondition;
  conditionDetail: string | null;
  images: EquipmentImage[];
  owner: EquipmentOwner;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface EquipmentListResult {
  content: EquipmentSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface EquipmentSearchParams {
  keyword?: string;
  category?: EquipmentCategory;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  sort?: "LATEST" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  size?: number;
}

interface EquipmentSummaryDto {
  id: number;
  name: string;
  category: EquipmentCategory;
  dailyPrice: number;
  availableFrom: string | null;
  availableTo: string | null;
  productCondition: ProductCondition;
  thumbnailUrl: string | null;
  averageRating: number;
  reviewCount: number;
}

interface EquipmentDetailDto extends Omit<EquipmentSummaryDto, "thumbnailUrl"> {
  description: string;
  status: EquipmentStatus;
  conditionDetail: string | null;
  images: { id: number; imageUrl: string; sortOrder: number; thumbnail: boolean }[];
  owner: { id: number; nickname: string };
  createdAt: string;
}

function toSummary(dto: EquipmentSummaryDto): EquipmentSummary {
  return { ...dto, id: String(dto.id) };
}

function toDetail(dto: EquipmentDetailDto): EquipmentDetail {
  return {
    ...dto,
    id: String(dto.id),
    images: dto.images.map((image) => ({ ...image, id: String(image.id) })),
    owner: { id: String(dto.owner.id), nickname: dto.owner.nickname },
  };
}

export async function fetchEquipmentList(params: EquipmentSearchParams = {}): Promise<EquipmentListResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await apiFetch<{
    content: EquipmentSummaryDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  }>(`/api/v1/devices${suffix}`);
  return { ...result, content: result.content.map(toSummary) };
}

export async function fetchEquipmentDetail(equipmentId: string): Promise<EquipmentDetail> {
  const dto = await apiFetch<EquipmentDetailDto>(`/api/v1/devices/${equipmentId}`);
  return toDetail(dto);
}

export type AvailabilityReason = "OUT_OF_AVAILABLE_PERIOD" | "RESERVATION_CONFLICT";

export const AVAILABILITY_REASON_LABELS: Record<AvailabilityReason, string> = {
  OUT_OF_AVAILABLE_PERIOD: "장비 등록자가 설정한 대여 가능 기간을 벗어났습니다.",
  RESERVATION_CONFLICT: "선택한 기간에 이미 다른 예약이 있습니다.",
};

export interface EquipmentAvailability {
  available: boolean;
  reason: AvailabilityReason | null;
}

export async function fetchEquipmentAvailability(
  equipmentId: string,
  startDate: string,
  endDate: string,
): Promise<EquipmentAvailability> {
  return apiFetch<EquipmentAvailability>(
    `/api/v1/devices/${equipmentId}/availability?startDate=${startDate}&endDate=${endDate}`,
  );
}

// ── 이미지 업로드 (presigned URL) ──────────────────────────────────────────
// 순서: 1) presigned URL 발급  2) 반환받은 uploadUrl로 S3에 직접 PUT
// 3) objectKey들을 장비 등록 요청에 imageKeys로 전달 (imageUrl 문자열이 아니라 objectKey!)

export interface PresignedImageUpload {
  objectKey: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresAt: string;
}

export async function requestEquipmentImagePresignedUrls(
  files: { fileName: string; contentType: string; size: number }[],
): Promise<PresignedImageUpload[]> {
  const dto = await apiFetch<{ uploads: PresignedImageUpload[] }>(
    "/api/v1/devices/images/presigned-urls",
    { method: "POST", body: { files } },
  );
  return dto.uploads;
}

export interface EquipmentCreateInput {
  category: EquipmentCategory;
  name: string;
  description: string;
  dailyPrice: number;
  availableFrom: string;
  availableTo: string;
  productCondition: ProductCondition;
  conditionDetail?: string;
  /** presigned URL 업로드로 받은 objectKey 목록 (imageUrl이 아님) */
  imageKeys: string[];
  thumbnailIndex: number;
}

export async function createEquipment(input: EquipmentCreateInput): Promise<EquipmentDetail> {
  const dto = await apiFetch<EquipmentDetailDto>("/api/v1/devices", {
    method: "POST",
    body: input,
  });
  return toDetail(dto);
}

export interface EquipmentUpdateInput {
  name?: string;
  description?: string;
  dailyPrice?: number;
  availableFrom?: string;
  availableTo?: string;
  productCondition?: ProductCondition;
  conditionDetail?: string;
}

export async function updateEquipment(
  equipmentId: string,
  input: EquipmentUpdateInput,
): Promise<EquipmentDetail> {
  const dto = await apiFetch<EquipmentDetailDto>(`/api/v1/devices/${equipmentId}`, {
    method: "PATCH",
    body: input,
  });
  return toDetail(dto);
}

export async function deleteEquipment(equipmentId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/devices/${equipmentId}`, { method: "DELETE" });
}

/** 등록자 본인은 ACTIVE/INACTIVE만 지정 가능 (SUSPENDED/DELETED/MAINTENANCE는 관리자·시스템 전용). */
export async function updateEquipmentStatus(
  equipmentId: string,
  status: "ACTIVE" | "INACTIVE",
): Promise<void> {
  await apiFetch<void>(`/api/v1/devices/${equipmentId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

// ── 내 장비 (마이페이지) ────────────────────────────────────────────────

export interface MyEquipmentSummary {
  id: string;
  name: string;
  category: EquipmentCategory;
  dailyPrice: number;
  status: EquipmentStatus;
  productCondition: ProductCondition;
  thumbnailUrl: string | null;
  availableFrom: string | null;
  availableTo: string | null;
}

interface MyEquipmentSummaryDto extends Omit<MyEquipmentSummary, "id"> {
  id: number;
}

export async function fetchMyEquipment(): Promise<MyEquipmentSummary[]> {
  const dto = await apiFetch<{ content: MyEquipmentSummaryDto[] }>("/api/v1/users/me/devices");
  return dto.content.map((item) => ({ ...item, id: String(item.id) }));
}
