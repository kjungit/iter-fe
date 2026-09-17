"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchChatRooms } from "@/lib/api/chat";

const ROOMS_POLL_MS = 20_000;

export function ChatNavBadge() {
  const { data } = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: fetchChatRooms,
    refetchInterval: ROOMS_POLL_MS,
  });

  const unread = data?.reduce((sum, room) => sum + room.unreadCount, 0) ?? 0;
  if (unread === 0) return null;

  return (
    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-badge-danger-fg px-1 text-[9px] font-bold text-white">
      {unread > 9 ? "9+" : unread}
    </span>
  );
}
