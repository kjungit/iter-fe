"use client";

import { useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { formatDisplayDate } from "@/lib/format";
import type { ChatMessage } from "@/lib/api/chat";

interface ChatMessageThreadProps {
  messages: ChatMessage[];
  currentUserId: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export function ChatMessageThread({
  messages,
  currentUserId,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: ChatMessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef(0);

  // 과거 메시지를 위에 붙이면 스크롤이 맨 위로 튀므로, 늘어난 높이만큼 scrollTop을 보정한다.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const diff = el.scrollHeight - prevHeightRef.current;
    if (prevHeightRef.current && diff > 0) el.scrollTop += diff;
    prevHeightRef.current = el.scrollHeight;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-text-secondary">
        첫 메시지를 보내 대화를 시작해보세요.
      </div>
    );
  }

  // 렌더 중 바깥 변수를 재할당하지 않도록 날짜 구분선 표시 여부를 reduce로 미리 계산해둔다.
  const rows = messages.reduce<{ rows: { message: ChatMessage; dateLabel: string | null }[]; lastLabel: string }>(
    (acc, message) => {
      const dateLabel = formatDisplayDate(message.sentAt);
      acc.rows.push({ message, dateLabel: dateLabel !== acc.lastLabel ? dateLabel : null });
      acc.lastLabel = dateLabel;
      return acc;
    },
    { rows: [], lastLabel: "" },
  ).rows;

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
      {hasMore && (
        <div className="text-center">
          <Button variant="secondary" size="sm" loading={isLoadingMore} onClick={onLoadMore}>
            이전 메시지 더보기
          </Button>
        </div>
      )}
      {rows.map(({ message, dateLabel }) => (
        <div key={message.id}>
          {dateLabel && (
            <div className="my-3 text-center text-[11px] text-text-tertiary">{dateLabel}</div>
          )}
          <ChatMessageBubble message={message} isOwn={message.senderId === currentUserId} />
        </div>
      ))}
    </div>
  );
}
