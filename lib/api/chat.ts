import { apiFetch, parseErrorResponse } from "@/lib/api/client";

/**
 * apps:chat(별도 프로세스, 포트 8081)은 JWT가 아니라 티켓으로 인증한다 — 티켓 발급 자체는
 * monolith(JWT, apiFetch)가 맡고, 이후 rooms/messages 호출은 발급받은 티켓을 Bearer로 실어
 * chat 서비스에 직접 보낸다. 티켓은 10분 TTL 재사용 가능(SSE 티켓과 달리 1회용이 아님).
 */
export const CHAT_API_BASE_URL =
  process.env.NEXT_PUBLIC_CHAT_API_BASE_URL ?? "http://localhost:8081";

export type ChatRoomStage = "INQUIRY" | "TRADE" | "CLOSED";
export type ChatMessageType = "USER" | "SYSTEM";

interface RoomSummaryDto {
  roomId: number;
  equipmentId: number;
  equipmentName: string;
  stage: ChatRoomStage;
  counterpartId: number;
  counterpartNickname: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatRoomSummary {
  roomId: string;
  equipmentId: string;
  equipmentName: string;
  stage: ChatRoomStage;
  counterpartId: string;
  counterpartNickname: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

function toChatRoomSummary(dto: RoomSummaryDto): ChatRoomSummary {
  return {
    ...dto,
    roomId: String(dto.roomId),
    equipmentId: String(dto.equipmentId),
    counterpartId: String(dto.counterpartId),
  };
}

interface MessageDto {
  id: number;
  roomId: number;
  senderId: number | null;
  senderNickname: string | null;
  type: ChatMessageType;
  content: string;
  masked: boolean;
  sentAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string | null;
  senderNickname: string | null;
  type: ChatMessageType;
  content: string;
  masked: boolean;
  sentAt: string;
}

export function toChatMessage(dto: MessageDto): ChatMessage {
  return {
    ...dto,
    id: String(dto.id),
    roomId: String(dto.roomId),
    senderId: dto.senderId !== null ? String(dto.senderId) : null,
  };
}

export interface ChatMessagePage {
  messages: ChatMessage[];
  nextCursor: string | null;
}

let chatTicket: string | null = null;
let chatTicketExpiresAt = 0;
const TICKET_TTL_MS = 10 * 60 * 1000;
const TICKET_REFRESH_MARGIN_MS = 30 * 1000;

async function issueChatTicket(): Promise<string> {
  const dto = await apiFetch<{ ticket: string }>("/api/v1/chat/tickets", { method: "POST" });
  chatTicket = dto.ticket;
  chatTicketExpiresAt = Date.now() + TICKET_TTL_MS;
  return dto.ticket;
}

/** 캐시된 티켓이 있으면 재사용, 만료 임박/강제 갱신 시에만 새로 발급받는다. */
export async function getChatTicket(forceRefresh = false): Promise<string> {
  if (!forceRefresh && chatTicket && Date.now() < chatTicketExpiresAt - TICKET_REFRESH_MARGIN_MS) {
    return chatTicket;
  }
  return issueChatTicket();
}

/** 장비 상세 "문의하기" 시작점 — 60초 1회용 그랜트, 자기 장비/비활성 장비면 BE가 400/404로 거절. */
export async function issueChatInquiryGrant(equipmentId: string): Promise<string> {
  const dto = await apiFetch<{ grantToken: string }>("/api/v1/chat/inquiry-grants", {
    method: "POST",
    body: { equipmentId: Number(equipmentId) },
  });
  return dto.grantToken;
}

interface ChatRequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** 티켓 만료(401) 재시도 루프 방지용 내부 플래그 */
  skipTicketRetry?: boolean;
}

/**
 * chat 서비스 전용 fetch — base URL과 인증 헤더(티켓)가 apiFetch와 다르고 refresh/CSRF가
 * 없다. 에러 바디 파싱은 apiFetch와 같은 ApiError 계약을 그대로 재사용.
 */
export async function chatFetch<T>(path: string, options: ChatRequestOptions = {}): Promise<T> {
  const { method = "GET", body, skipTicketRetry = false } = options;
  const ticket = await getChatTicket();

  const headers: Record<string, string> = { Authorization: `Bearer ${ticket}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${CHAT_API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipTicketRetry) {
    await getChatTicket(true);
    return chatFetch<T>(path, { ...options, skipTicketRetry: true });
  }

  if (!response.ok) throw await parseErrorResponse(response);
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** 같은 (equipmentId, requesterId) 문의방이 이미 있으면 새로 만들지 않고 그 방을 재사용. */
export async function createChatRoom(grantToken: string): Promise<string> {
  const dto = await chatFetch<{ roomId: number }>("/api/v1/chat/rooms", {
    method: "POST",
    body: { grantToken },
  });
  return String(dto.roomId);
}

export async function fetchChatRooms(): Promise<ChatRoomSummary[]> {
  const dto = await chatFetch<RoomSummaryDto[]>("/api/v1/chat/rooms");
  return dto.map(toChatRoomSummary);
}

/** cursor 없이 호출하면 최신 메시지부터. nextCursor는 더 오래된 메시지를 불러올 때 그대로 전달. */
export async function fetchChatMessages(
  roomId: string,
  params: { cursor?: string; size?: number } = {},
): Promise<ChatMessagePage> {
  const query = new URLSearchParams();
  if (params.cursor !== undefined) query.set("cursor", params.cursor);
  if (params.size !== undefined) query.set("size", String(params.size));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const dto = await chatFetch<{ messages: MessageDto[]; nextCursor: number | null }>(
    `/api/v1/chat/rooms/${roomId}/messages${suffix}`,
  );
  return {
    messages: dto.messages.map(toChatMessage),
    nextCursor: dto.nextCursor !== null ? String(dto.nextCursor) : null,
  };
}

export async function markChatRoomRead(roomId: string, lastReadMessageId: string): Promise<void> {
  await chatFetch<void>(`/api/v1/chat/rooms/${roomId}/read`, {
    method: "POST",
    body: { lastReadMessageId: Number(lastReadMessageId) },
  });
}

/** 그랜트 발급 → 방 생성까지 한 번에 처리하는 조합 함수. */
export async function startEquipmentInquiry(equipmentId: string): Promise<string> {
  const grantToken = await issueChatInquiryGrant(equipmentId);
  return createChatRoom(grantToken);
}
