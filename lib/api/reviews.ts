import { apiFetch } from "@/lib/api/client";

/**
 * BE reservation/domain/entity/RentalReview — 거래(rental) 완료 후 당사자(대여자/등록자)가
 * 서로에게 남기는 사용자↔사용자 리뷰. 장비(Equipment)의 averageRating/reviewCount와는 무관한
 * 별개 도메인(그쪽은 review 기능 비활성화 시절 잔재로 항상 0 고정) — 섞지 말 것.
 */
export interface RentalReview {
  id: string;
  rentalId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface ReviewCreateInput {
  rating: number;
  content: string;
}

export interface UserReviewStats {
  averageRating: number;
  reviewCount: number;
}

/** 전체 건수를 세지 않는 커서 기반 응답 — admin.ts의 CursorResult<T>와 동일한 모양(BE 공용 CursorPageResponse). */
export interface CursorResult<T> {
  content: T[];
  nextCursor: string | null;
  hasNext: boolean;
  size: number;
}

interface RentalReviewDto {
  id: number;
  rentalId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  content: string;
  createdAt: string;
}

function toRentalReview(dto: RentalReviewDto): RentalReview {
  return {
    ...dto,
    id: String(dto.id),
    rentalId: String(dto.rentalId),
    reviewerId: String(dto.reviewerId),
    revieweeId: String(dto.revieweeId),
  };
}

function cursorQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

/** COMPLETED 상태 거래에서만 가능, 거래당 (rentalId, reviewerId) 유일 — 위반 시 BE가 409로 거절. */
export async function createReview(
  rentalId: string,
  input: ReviewCreateInput,
): Promise<RentalReview> {
  const dto = await apiFetch<RentalReviewDto>(`/api/v1/rentals/${rentalId}/reviews`, {
    method: "POST",
    body: input,
  });
  return toRentalReview(dto);
}

/** 해당 거래의 당사자만 조회 가능 — 최대 2건(대여자/등록자 각 1건). */
export async function fetchReviewsForRental(rentalId: string): Promise<RentalReview[]> {
  const dto = await apiFetch<RentalReviewDto[]>(`/api/v1/rentals/${rentalId}/reviews`);
  return dto.map(toRentalReview);
}

/** userId가 작성한 리뷰 목록(reviewerId 기준), cursor(keyset) 페이지네이션. */
export async function fetchReviewsWrittenByUser(
  userId: string,
  params: { cursor?: string; size?: number } = {},
): Promise<CursorResult<RentalReview>> {
  const dto = await apiFetch<CursorResult<RentalReviewDto>>(
    `/api/v1/users/${userId}/reviews/written${cursorQuery(params)}`,
  );
  return { ...dto, content: dto.content.map(toRentalReview) };
}

/** userId가 받은 리뷰의 평균 평점/건수 — 리뷰가 없으면 { averageRating: 0, reviewCount: 0 }. */
export async function fetchUserReviewStats(userId: string): Promise<UserReviewStats> {
  return apiFetch<UserReviewStats>(`/api/v1/users/${userId}/reviews/stats`);
}
