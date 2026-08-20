/**
 * 얇은 fetch 래퍼. 액세스 토큰은 새로고침 시 사라지는 모듈 스코프 변수에만 보관하고
 * (BE가 refresh token을 HttpOnly 쿠키로 관리하므로 FE가 따로 영속화할 필요 없음),
 * 401 응답은 /api/v1/auth/refresh로 1회 자동 재시도한다.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export class ApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** CSRF 쿠키(XSRF-TOKEN)가 없으면 /api/v1/auth/csrf로 한 번 발급받는다. */
async function ensureCsrfToken(): Promise<string | null> {
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

async function parseErrorResponse(response: Response): Promise<ApiError> {
  let code: string | null = null;
  let message = `요청에 실패했습니다. (${response.status})`;
  try {
    const data = (await response.json()) as { code?: string; message?: string };
    code = data.code ?? null;
    message = data.message ?? message;
  } catch {
    // 본문이 없거나 JSON이 아닌 응답 (204 등)
  }
  return new ApiError(response.status, code, message);
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

/** refresh는 apiFetch를 거치면 401 재시도 로직과 순환 참조가 생기므로 별도 구현. */
async function tryRefresh(): Promise<boolean> {
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
  }
}

export { tryRefresh };
