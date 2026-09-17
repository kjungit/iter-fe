"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { ChatMessageThread } from "@/components/chat/ChatMessageThread";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { chatRoomStageBadge } from "@/lib/status";
import { useChatSocket } from "@/lib/hooks/useChatSocket";
import {
  fetchChatMessages,
  fetchChatRooms,
  markChatRoomRead,
  type ChatMessagePage,
} from "@/lib/api/chat";

const ROOMS_POLL_MS = 20_000;
const MESSAGES_PAGE_SIZE = 30;

interface ChatRoomViewProps {
  roomId: string;
}

export function ChatRoomView({ roomId }: ChatRoomViewProps) {
  const currentUser = useRequireAuth();
  const queryClient = useQueryClient();
  const [muteMessage, setMuteMessage] = useState<string | null>(null);

  const { data: rooms } = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: fetchChatRooms,
    refetchInterval: ROOMS_POLL_MS,
    enabled: !!currentUser,
  });
  const room = rooms?.find((candidate) => candidate.roomId === roomId);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["chat", "messages", roomId],
    queryFn: ({ pageParam }) => fetchChatMessages(roomId, { cursor: pageParam, size: MESSAGES_PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!currentUser,
  });

  const { send } = useChatSocket(currentUser ? roomId : null, {
    onMessage: (message) => {
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(["chat", "messages", roomId], (old) => {
        if (!old) return old;
        const [first, ...rest] = old.pages;
        if (first.messages.some((existing) => existing.id === message.id)) return old;
        return { ...old, pages: [{ ...first, messages: [message, ...first.messages] }, ...rest] };
      });
    },
    onError: (code) => {
      if (code === "MUTED") setMuteMessage("24시간 동안 채팅이 제한되었어요.");
    },
  });

  const messages = useMemo(
    () => (data ? [...data.pages.flatMap((page) => page.messages)].reverse() : []),
    [data],
  );

  const latestMessageId = messages.at(-1)?.id;
  const readMutation = useMutation({
    mutationFn: (lastReadMessageId: string) => markChatRoomRead(roomId, lastReadMessageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] }),
  });

  useEffect(() => {
    if (latestMessageId) readMutation.mutate(latestMessageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestMessageId]);

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16 text-center text-[13px] text-text-secondary">
        채팅방을 불러올 수 없습니다.{" "}
        <Link href="/chat" className="font-semibold text-ink-strong">
          채팅목록으로
        </Link>
      </div>
    );
  }

  const closed = room?.stage === "CLOSED";
  const composerDisabled = closed || !!muteMessage;
  const disabledReason = closed ? "종료된 채팅방이에요." : (muteMessage ?? undefined);

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-[720px] flex-col px-6 py-6">
      <div className="border-b border-border pb-4">
        <Link href="/chat" className="text-[13px] font-semibold text-text-secondary">
          ← 채팅목록
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-[16px] font-bold text-ink">{room?.equipmentName ?? "채팅"}</h1>
          {room && <Badge {...chatRoomStageBadge(room.stage)} />}
        </div>
        {room && (
          <p className="mt-1 text-[12.5px] text-text-secondary">
            {room.counterpartNickname}님과의 대화
          </p>
        )}
      </div>

      <ChatMessageThread
        messages={messages}
        currentUserId={currentUser.id}
        hasMore={!!hasNextPage}
        isLoadingMore={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />

      <ChatComposer disabled={composerDisabled} disabledReason={disabledReason} onSend={send} />
    </div>
  );
}
