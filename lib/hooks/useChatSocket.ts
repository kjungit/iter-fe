"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_API_BASE_URL, getChatTicket, type ChatMessage, type ChatMessageType } from "@/lib/api/chat";

interface IncomingFrame {
  type: "SEND";
  content: string;
}

interface OutgoingFrame {
  type: "MESSAGE" | "SYSTEM" | "ERROR";
  id?: number;
  roomId?: number;
  senderId?: number | null;
  senderNickname?: string | null;
  content?: string;
  masked?: boolean;
  sentAt?: string;
  code?: "INVALID_FRAME" | "MUTED";
}

interface UseChatSocketOptions {
  onMessage?: (message: ChatMessage) => void;
  onError?: (code: string) => void;
}

function toChatMessage(frame: OutgoingFrame): ChatMessage {
  const type: ChatMessageType = frame.type === "SYSTEM" ? "SYSTEM" : "USER";
  return {
    id: String(frame.id),
    roomId: String(frame.roomId),
    senderId: frame.senderId != null ? String(frame.senderId) : null,
    senderNickname: frame.senderNickname ?? null,
    type,
    content: frame.content ?? "",
    masked: !!frame.masked,
    sentAt: frame.sentAt ?? new Date().toISOString(),
  };
}

/**
 * 채팅방 WebSocket 구독. 티켓은 10분 TTL 재사용 가능이라(SSE 티켓과 달리) 재연결마다 새로
 * 발급받을 필요는 없지만(getChatTicket이 만료 임박 시에만 재발급), 순수 WebSocket이라
 * 브라우저 기본 자동 재연결이 없어 onclose/onerror 시 직접 백오프 재연결한다.
 */
export function useChatSocket(
  roomId: string | null,
  options: UseChatSocketOptions,
): { send: (content: string) => boolean; isConnected: boolean } {
  const socketRef = useRef<WebSocket | null>(null);
  const cancelledRef = useRef(false);
  const handlersRef = useRef(options);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    handlersRef.current = options;
  });

  useEffect(() => {
    if (!roomId) return;
    cancelledRef.current = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      if (cancelledRef.current) return;
      try {
        const ticket = await getChatTicket();
        if (cancelledRef.current) return;
        const wsBaseUrl = CHAT_API_BASE_URL.replace(/^http/, "ws");
        const socket = new WebSocket(
          `${wsBaseUrl}/ws/chat?roomId=${roomId}&ticket=${encodeURIComponent(ticket)}`,
        );
        socketRef.current = socket;

        socket.onopen = () => {
          if (socketRef.current === socket) setIsConnected(true);
        };
        socket.onmessage = (event) => {
          const frame = JSON.parse(event.data) as OutgoingFrame;
          if (frame.type === "ERROR") {
            handlersRef.current.onError?.(frame.code ?? "UNKNOWN");
            return;
          }
          handlersRef.current.onMessage?.(toChatMessage(frame));
        };
        socket.onclose = () => {
          if (socketRef.current === socket) {
            socketRef.current = null;
            setIsConnected(false);
          }
          if (!cancelledRef.current) retryTimer = setTimeout(connect, 3000);
        };
        socket.onerror = () => socket.close();
      } catch {
        if (!cancelledRef.current) retryTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      cancelledRef.current = true;
      if (retryTimer) clearTimeout(retryTimer);
      socketRef.current?.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [roomId]);

  /** 소켓이 OPEN이 아니면 프레임을 보내지 않고 false를 반환 — 호출부가 입력값을 지우지 않고 재시도할 수 있게 한다. */
  const send = useCallback((content: string): boolean => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const frame: IncomingFrame = { type: "SEND", content };
      socket.send(JSON.stringify(frame));
      return true;
    }
    return false;
  }, []);

  return { send, isConnected };
}
