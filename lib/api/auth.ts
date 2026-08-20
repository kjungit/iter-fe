import { apiFetch, getAccessToken, setAccessToken, tryRefresh } from "@/lib/api/client";
import type { ShippingAddress, User, UserRole } from "@/lib/types";

interface UserResponseDto {
  id: number;
  email: string;
  name: string;
  nickname: string;
  phone: string;
  role: UserRole;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
}

interface AddressResponseDto {
  id: number;
  recipientName: string;
  recipientPhone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
}

function toUser(dto: UserResponseDto, address: ShippingAddress | null): User {
  return {
    id: String(dto.id),
    name: dto.name,
    nickname: dto.nickname,
    email: dto.email,
    phone: dto.phone,
    role: dto.role,
    avatarInitials: dto.name.slice(0, 2) || "IT",
    defaultAddress: address,
  };
}

function toShippingAddress(dto: AddressResponseDto): ShippingAddress {
  return {
    recipientName: dto.recipientName,
    phone: dto.recipientPhone,
    zipcode: dto.zipcode,
    address: dto.address,
    detailAddress: dto.detailAddress,
  };
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  nickname: string;
  phone: string;
}

export async function signUp(input: SignUpInput): Promise<void> {
  await apiFetch<UserResponseDto>("/api/v1/auth/signup", { method: "POST", body: input });
}

export async function login(email: string, password: string): Promise<void> {
  const data = await apiFetch<{ accessToken: string }>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setAccessToken(data.accessToken);
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/api/v1/auth/logout", { method: "POST", csrf: true });
  } finally {
    setAccessToken(null);
  }
}

async function fetchAddress(): Promise<ShippingAddress | null> {
  try {
    const dto = await apiFetch<AddressResponseDto>("/api/v1/users/me/address");
    return toShippingAddress(dto);
  } catch {
    // 아직 배송지를 등록하지 않은 회원 — 404 등은 "주소 없음"으로 처리
    return null;
  }
}

/**
 * 로그인 세션 부트스트랩: 메모리에 액세스 토큰이 없으면(새로고침 직후) refresh 쿠키로
 * 재발급을 먼저 시도한 뒤 /users/me를 조회한다. 둘 다 실패하면 비로그인 상태(null)로 취급.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  if (!getAccessToken()) {
    const refreshed = await tryRefresh();
    if (!refreshed) return null;
  }
  try {
    const dto = await apiFetch<UserResponseDto>("/api/v1/users/me");
    const address = await fetchAddress();
    return toUser(dto, address);
  } catch {
    return null;
  }
}
