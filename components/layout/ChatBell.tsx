"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { fetchChatRooms } from "@/lib/api/chat";

/** 채팅은 알림처럼 전역 unread 푸시(SSE)가 없어 NotificationBell과 동일하게 폴링으로 갱신. */
export function ChatBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: rooms } = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: fetchChatRooms,
    refetchInterval: 60_000,
  });

  const unreadCount = rooms?.reduce((sum, room) => sum + room.unreadCount, 0) ?? 0;
  const recentRooms = rooms?.slice(0, 5) ?? [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (roomId: string) => {
    setOpen(false);
    router.push(`/mypage/messages/${roomId}`);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
        aria-label="채팅"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-badge-danger-fg px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="shadow-popover absolute top-[calc(100%+8px)] right-0 z-30 w-[320px] rounded-lg border border-border bg-white p-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[12.5px] font-bold text-ink">채팅</span>
            <button
              type="button"
              className="text-[11.5px] font-semibold text-text-secondary"
              onClick={() => {
                setOpen(false);
                router.push("/mypage/messages");
              }}
            >
              전체 보기
            </button>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {recentRooms.length === 0 && (
              <p className="py-8 text-center text-[12px] text-text-secondary">채팅이 없습니다.</p>
            )}
            {recentRooms.map((room) => (
              <button
                key={room.roomId}
                type="button"
                onClick={() => handleItemClick(room.roomId)}
                className={cn(
                  "w-full rounded-sm px-2.5 py-2.5 text-left",
                  room.unreadCount > 0 ? "bg-surface-alt" : "bg-white",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12.5px] font-bold text-ink">
                    {room.equipmentName}
                  </span>
                  {room.unreadCount > 0 && (
                    <span className="shrink-0 text-[11px] font-bold text-badge-danger-fg">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[12px] text-text-secondary">
                  {room.lastMessage ?? room.counterpartNickname}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
