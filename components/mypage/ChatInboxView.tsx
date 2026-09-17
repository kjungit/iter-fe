"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { fetchChatRooms } from "@/lib/api/chat";
import { chatRoomStageBadge } from "@/lib/status";
import { formatDisplayDate } from "@/lib/format";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

export function ChatInboxView() {
  const currentUser = useRequireAuth();

  const { data: rooms, isLoading, isError } = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: fetchChatRooms,
    enabled: !!currentUser,
  });

  if (!currentUser) return null;

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 pt-7 pb-24">
      <Link href="/mypage" className="text-[13px] font-semibold text-text-secondary">
        ← 마이페이지
      </Link>
      <h1 className="mt-2 mb-5 text-[20px] font-extrabold text-ink">내 채팅</h1>

      <div className="flex flex-col gap-2.5">
        {isLoading && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">불러오는 중...</p>
        )}
        {isError && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">
            채팅 목록을 불러오지 못했습니다.
          </p>
        )}
        {!isLoading && !isError && rooms?.length === 0 && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">
            아직 채팅이 없습니다. 장비 상세에서 판매자에게 문의해보세요.
          </p>
        )}
        {rooms?.map((room) => {
          const badge = chatRoomStageBadge(room.stage);
          return (
            <Link
              key={room.roomId}
              href={`/mypage/messages/${room.roomId}`}
              className="rounded-md border border-border p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[13.5px] font-bold text-ink">
                    {room.equipmentName}
                  </span>
                  <Badge label={badge.label} palette={badge.palette} />
                </div>
                {room.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-badge-danger-fg px-1.5 text-[11px] font-bold text-white">
                    {room.unreadCount > 99 ? "99+" : room.unreadCount}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[12.5px] text-text-secondary">
                {room.counterpartNickname}
              </div>
              {room.lastMessage && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-[12.5px] text-text-body-2">
                    {room.lastMessage}
                  </span>
                  {room.lastMessageAt && (
                    <span className="shrink-0 text-[11px] text-text-tertiary">
                      {formatDisplayDate(room.lastMessageAt)}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
