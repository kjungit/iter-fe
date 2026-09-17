"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const activeRoomId = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : undefined;

  const { data: rooms, isLoading, isError } = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: fetchChatRooms,
    refetchInterval: ROOMS_POLL_MS,
    enabled: !!currentUser,
  });

  if (!currentUser) return null;

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <div className="shrink-0 border-b border-border px-5 py-5">
        <h1 className="text-[17px] font-extrabold text-ink">채팅</h1>
      </div>

      <div className="flex flex-1 flex-col px-2 py-2">
        {isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-2 py-2">
              <Skeleton className="h-[60px] w-full" />
            </div>
          ))}

        {!isLoading && isError && (
          <p className="px-4 py-16 text-center text-[13px] text-text-secondary">
            채팅 목록을 불러올 수 없습니다.
          </p>
        )}

        {!isLoading && !isError && rooms?.length === 0 && (
          <p className="px-4 py-16 text-center text-[13px] text-text-secondary">
            아직 문의한 채팅이 없어요.
          </p>
        )}

        {!isLoading &&
          !isError &&
          rooms &&
          sortRooms(rooms).map((room) => (
            <ChatRoomListItem key={room.roomId} room={room} active={room.roomId === activeRoomId} />
          ))}
      </div>
    </div>
  );
}
