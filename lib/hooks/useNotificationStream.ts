"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api/client";
import { issueSseTicket } from "@/lib/api/notifications";

/**
 * 알림 SSE 구독. 티켓은 60초 단발성이라 브라우저 기본 EventSource 자동 재연결(같은 URL 재요청)은
 * 반드시 실패한다 — 연결이 끊기면(onerror) 직접 close() 후 티켓을 재발급받아 새 EventSource를 연다.
 */
export function useNotificationStream(enabled: boolean): void {
  const queryClient = useQueryClient();
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    cancelledRef.current = false;
    let currentSource: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    };

    const connect = async () => {
      if (cancelledRef.current) return;
      try {
        const ticket = await issueSseTicket();
        if (cancelledRef.current) return;
        const source = new EventSource(
          `${API_BASE_URL}/api/v1/notifications/subscribe?ticket=${encodeURIComponent(ticket)}`,
        );
        currentSource = source;

        source.addEventListener("notification", () => invalidate());
        source.onerror = () => {
          source.close();
          if (currentSource === source) currentSource = null;
          if (!cancelledRef.current) retryTimer = setTimeout(connect, 3000);
        };
      } catch {
        if (!cancelledRef.current) retryTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      cancelledRef.current = true;
      if (retryTimer) clearTimeout(retryTimer);
      currentSource?.close();
    };
  }, [enabled, queryClient]);
}
