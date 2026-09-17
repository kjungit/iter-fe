"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChatRoomListItem } from "@/components/chat/ChatRoomListItem";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { fetchChatRooms } from "@/lib/api/chat";

const ROOMS_POLL_MS = 20_000;

function sortRooms<T extends { lastMessageAt: string | null }>(rooms: T[]): T[] {
  return [...rooms].sort((a, b) => {
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return b.lastMessageAt.localeCompare(a.lastMessageAt);
  });
}

export function ChatRoomListView() {
  const currentUser = useRequireAuth();

  const { data: rooms, isLoading, isError } = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: fetchChatRooms,
    refetchInterval: ROOMS_POLL_MS,
    enabled: !!currentUser,
  });

  if (!currentUser) return null;

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-8">
      <h1 className="text-[20px] font-extrabold text-ink">채팅</h1>

      <div className="mt-5 flex flex-col gap-2">
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[72px] w-full" />
          ))}

        {!isLoading && isError && (
          <p className="py-16 text-center text-[13px] text-text-secondary">
            채팅 목록을 불러올 수 없습니다.
          </p>
        )}

        {!isLoading && !isError && rooms?.length === 0 && (
          <p className="py-16 text-center text-[13px] text-text-secondary">
            아직 문의한 채팅이 없어요.
          </p>
        )}

        {!isLoading &&
          !isError &&
          rooms &&
          sortRooms(rooms).map((room) => <ChatRoomListItem key={room.roomId} room={room} />)}
      </div>
    </div>
  );
}
