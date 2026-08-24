export interface ShippingAddress {
  recipientName: string;
  phone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
}

export type UserRole = "USER" | "ADMIN";

/**
 * BE는 User+Role.ADMIN 통합 인증 구조라 관리자도 이 타입을 그대로 쓴다 (별도 AdminAccount 없음).
 * avatarInitials는 서버에 없는 필드라 name에서 파생해서 매핑 레이어(lib/api/auth.ts)에서 채운다.
 * defaultAddress는 별도 /users/me/address 엔드포인트라 로그인 직후엔 없을 수 있어 nullable.
 */
export interface User {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarInitials: string;
  defaultAddress: ShippingAddress | null;
}
