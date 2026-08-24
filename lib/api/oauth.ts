import {
  API_BASE_URL,
  apiFetch,
  ensureCsrfToken,
  parseErrorResponse,
  setAccessToken,
} from "@/lib/api/client";

export type OAuthAction = "SIGNUP_REQUIRED" | "LINK_REQUIRED";

export type OAuthExchangeResult =
  | { status: "authenticated" }
  | { status: "action_required"; action: OAuthAction; oauthToken: string; email: string; nickname: string };

interface AccessTokenResponseDto {
  accessToken: string;
}

interface OAuthActionRequiredResponseDto {
  action: OAuthAction;
  oauthToken: string;
  email: string;
  nickname: string;
  expiresIn: number;
}

/** 카카오 로그인 시작 — 풀페이지 이동으로 백엔드의 oauth2Login 필터 체인에 진입한다. */
export function startKakaoLogin(): void {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
}

/**
 * `/oauth2/callback`에서 호출. 교환 코드는 카카오 리다이렉트 중 서버 세션에 저장돼 있으므로
 * credentials: 'include'로 세션 쿠키를 함께 보내야 한다. 200이면 로그인 완료, 202면 추가
 * 조치(회원가입/계정연결)가 필요하다 — 응답 상태코드로 분기해야 해서 apiFetch 대신 직접 fetch.
 */
export async function exchangeKakaoLogin(): Promise<OAuthExchangeResult> {
  const token = await ensureCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth2/kakao/exchange`, {
    method: "POST",
    credentials: "include",
    headers: token ? { "X-XSRF-TOKEN": token } : undefined,
  });

  if (response.status === 200) {
    const data = (await response.json()) as AccessTokenResponseDto;
    setAccessToken(data.accessToken);
    return { status: "authenticated" };
  }
  if (response.status === 202) {
    const data = (await response.json()) as OAuthActionRequiredResponseDto;
    return {
      status: "action_required",
      action: data.action,
      oauthToken: data.oauthToken,
      email: data.email,
      nickname: data.nickname,
    };
  }
  throw await parseErrorResponse(response);
}

export interface KakaoSignUpInput {
  oauthToken: string;
  email: string;
  name: string;
  nickname: string;
  phone: string;
}

export async function signUpKakao(input: KakaoSignUpInput): Promise<void> {
  const token = await ensureCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth2/kakao/signup`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-XSRF-TOKEN": token } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseErrorResponse(response);
  const data = (await response.json()) as AccessTokenResponseDto;
  setAccessToken(data.accessToken);
}

/** 이미 로그인된 사용자(기존 이메일 계정)에게 카카오 계정을 연결 — CSRF 대상 아님. */
export async function linkKakao(oauthToken: string): Promise<void> {
  await apiFetch<void>("/api/v1/users/me/oauth2/kakao/link", {
    method: "POST",
    body: { oauthToken },
  });
}
