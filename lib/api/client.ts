/**
 * 얇은 fetch 래퍼. 액세스 토큰은 새로고침 시 사라지는 모듈 스코프 변수에만 보관하고
 * (BE가 refresh token을 HttpOnly 쿠키로 관리하므로 FE가 따로 영속화할 필요 없음),
 * 401 응답은 /api/v1/auth/refresh로 1회 자동 재시도한다.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** @Valid 검증 실패(400) 시 함께 내려오는 필드별 상세 — docs/i18n-frontend-handoff.md §2 */
export interface ApiFieldError {
  field: string;
  constraint: string;
  params: Record<string, unknown>;
}

export class ApiError extends Error {
  status: number;
  code: string | null;
  /** VALIDATION_ERROR가 아니면 항상 빈 배열(never null) — BE 계약. */
  errors: ApiFieldError[];

  constructor(status: number, code: string | null, message: string, errors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** CSRF 쿠키(XSRF-TOKEN)가 없으면 /api/v1/auth/csrf로 한 번 발급받는다. */
export async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCookie("XSRF-TOKEN");
  if (existing) return existing;
  await fetch(`${API_BASE_URL}/api/v1/auth/csrf`, { credentials: "include" });
  return readCookie("XSRF-TOKEN");
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** CSRF 토큰이 필요한 요청(refresh/logout 등)에서 true */
  csrf?: boolean;
  /** 401 재시도 루프 방지용 내부 플래그 */
  skipAuthRetry?: boolean;
}

export async function parseErrorResponse(response: Response): Promise<ApiError> {
  let code: string | null = null;
  let message = `요청에 실패했습니다. (${response.status})`;
  let errors: ApiFieldError[] = [];
  try {
    const data = (await response.json()) as {
      code?: string;
      message?: string;
      errors?: ApiFieldError[];
    };
    code = data.code ?? null;
    message = data.message ?? message;
    errors = data.errors ?? [];
  } catch {
    // 본문이 없거나 JSON이 아닌 응답 (204 등)
  }
  return new ApiError(response.status, code, message, errors);
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, csrf = false, skipAuthRetry = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (csrf) {
    const token = await ensureCsrfToken();
    if (token) headers["X-XSRF-TOKEN"] = token;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipAuthRetry && path !== "/api/v1/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, skipAuthRetry: true });
    }
    setAccessToken(null);
    throw await parseErrorResponse(response);
  }

  if (!response.ok) throw await parseErrorResponse(response);
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** multipart 업로드 전용 — Content-Type을 직접 안 붙여야 브라우저가 boundary를 채운 값을 넣는다. */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  skipAuthRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  if (response.status === 401 && !skipAuthRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiUpload<T>(path, formData, true);
    setAccessToken(null);
    throw await parseErrorResponse(response);
  }

  if (!response.ok) throw await parseErrorResponse(response);
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * refresh는 apiFetch를 거치면 401 재시도 로직과 순환 참조가 생기므로 별도 구현.
 *
 * refresh token은 1회용 로테이션 방식(BE `RefreshTokenService.rotate`)이라, 같은 쿠키로 두 요청이
 * 동시에 들어오면 먼저 도착한 쪽만 성공하고 늦게 도착한 쪽은 "이미 회전된 토큰 재사용"으로 감지돼
 * 토큰 패밀리 전체가 폐기(강제 로그아웃)된다 — 토스 결제 리다이렉트처럼 풀 페이지 리로드 직후
 * 여러 컴포넌트(루트의 세션 부트스트랩 + 개별 화면의 401 재시도)가 동시에 refresh를 트리거하는
 * 상황에서 실제로 발생했다. 진행 중인 refresh 호출을 모듈 스코프에 공유해 항상 하나만 나가도록
 * 막는다.
 */
let refreshPromise: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const token = await ensureCsrfToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: token ? { "X-XSRF-TOKEN": token } : undefined,
      });
      if (!response.ok) return false;
      const data = (await response.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export { tryRefresh };
