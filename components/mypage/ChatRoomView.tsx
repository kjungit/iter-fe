"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  fetchChatMessages,
  fetchChatRooms,
  markChatRoomRead,
  type ChatMessage,
  type ChatMessagePage,
} from "@/lib/api/chat";
import { useChatSocket } from "@/lib/hooks/useChatSocket";
import { chatRoomStageBadge } from "@/lib/status";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

const PAGE_SIZE = 30;

const WS_ERROR_MESSAGES: Record<string, string> = {
  MUTED: "부적절한 정보 공유가 반복 감지되어 일정 시간 채팅이 제한되었습니다.",
  INVALID_FRAME: "메시지를 보내지 못했습니다. 다시 시도해주세요.",
};

interface ChatRoomViewProps {
  roomId: string;
}

export function ChatRoomView({ roomId }: ChatRoomViewProps) {
  const currentUser = useRequireAuth();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);
  const [seededPage, setSeededPage] = useState<ChatMessagePage | undefined>(undefined);
  const [wsError, setWsError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [draft, setDraft] = useState("");
  const lastMarkedIdRef = useRef<string | null>(null);

  const { data: rooms } = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: fetchChatRooms,
    enabled: !!currentUser,
  });
  const room = rooms?.find((r) => r.roomId === roomId);

  const { data: initialPage } = useQuery({
    queryKey: ["chat", "messages", roomId, "initial"],
    queryFn: () => fetchChatMessages(roomId, { size: PAGE_SIZE }),
    enabled: !!currentUser,
  });

  if (initialPage && initialPage !== seededPage) {
    setSeededPage(initialPage);
    setMessages([...initialPage.messages].reverse());
    setOldestCursor(initialPage.nextCursor);
  }

  const loadOlderMutation = useMutation({
    mutationFn: () => fetchChatMessages(roomId, { cursor: oldestCursor!, size: PAGE_SIZE }),
    onSuccess: (page) => {
      setMessages((prev) => [...[...page.messages].reverse(), ...prev]);
      setOldestCursor(page.nextCursor);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (lastReadMessageId: string) => markChatRoomRead(roomId, lastReadMessageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] }),
  });

  const handleMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleWsError = useCallback((code: string) => {
    if (code === "MUTED") setMuted(true);
    setWsError(WS_ERROR_MESSAGES[code] ?? "오류가 발생했습니다.");
  }, []);

  const { send } = useChatSocket(currentUser ? roomId : null, {
    onMessage: handleMessage,
    onError: handleWsError,
  });

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.id === lastMarkedIdRef.current) return;
    lastMarkedIdRef.current = last.id;
    markReadMutation.mutate(last.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  if (!currentUser) return null;

  const handleSend = () => {
    const content = draft.trim();
    if (!content || muted) return;
    const sent = send(content);
    if (!sent) {
      setWsError("연결이 끊겼습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setDraft("");
    setWsError(null);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full max-w-[640px] flex-col px-6 pt-5 pb-5">
      <Link href="/mypage/messages" className="text-[13px] font-semibold text-text-secondary">
        ← 채팅 목록
      </Link>

      {room && (
        <div className="mt-2 flex items-center gap-2 border-b border-border pb-3">
          <Link
            href={`/equipment/${room.equipmentId}`}
            className="truncate text-[15px] font-extrabold text-ink"
          >
            {room.equipmentName}
          </Link>
          <Badge
            label={chatRoomStageBadge(room.stage).label}
            palette={chatRoomStageBadge(room.stage).palette}
          />
          <span className="text-[12.5px] text-text-secondary">{room.counterpartNickname}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-3">
        {oldestCursor && (
          <div className="mb-3 text-center">
            <Button
              variant="secondary"
              size="sm"
              loading={loadOlderMutation.isPending}
              onClick={() => loadOlderMutation.mutate()}
            >
              이전 대화 더보기
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {messages.map((message) => {
            if (message.type === "SYSTEM") {
              return (
                <p key={message.id} className="py-1 text-center text-[11.5px] text-text-tertiary">
                  {message.content}
                </p>
              );
            }
            const isMine = message.senderId === currentUser.id;
            return (
              <div key={message.id} className={isMine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    isMine
                      ? "max-w-[75%] rounded-lg bg-ink-strong px-3.5 py-2.5 text-[13px] text-white"
                      : "max-w-[75%] rounded-lg bg-surface px-3.5 py-2.5 text-[13px] text-ink"
                  }
                >
                  {!isMine && (
                    <div className="mb-0.5 text-[11px] font-bold text-text-secondary">
                      {message.senderNickname}
                    </div>
                  )}
                  <div>{message.content}</div>
                  {message.masked && (
                    <div
                      className={
                        isMine
                          ? "mt-1 text-[10.5px] text-white/70"
                          : "mt-1 text-[10.5px] text-text-tertiary"
                      }
                    >
                      일부 정보가 안전을 위해 가려졌어요.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {wsError && <p className="mb-2 text-[12px] text-badge-danger-fg">{wsError}</p>}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={muted ? "채팅이 제한되었습니다" : "메시지를 입력하세요"}
          disabled={muted}
        />
        <Button type="submit" disabled={muted || !draft.trim()}>
          전송
        </Button>
      </form>
    </div>
  );
}
