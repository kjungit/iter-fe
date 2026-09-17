import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { chatRoomStageBadge } from "@/lib/status";
import { formatRelativeTime } from "@/lib/format";
import type { ChatRoomSummary } from "@/lib/api/chat";

interface ChatRoomListItemProps {
  room: ChatRoomSummary;
}

export function ChatRoomListItem({ room }: ChatRoomListItemProps) {
  const badge = chatRoomStageBadge(room.stage);

  return (
    <Link
      href={`/chat/${room.roomId}`}
      className="flex items-center gap-3.5 rounded-lg border border-border p-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-bold text-ink">{room.equipmentName}</span>
          <Badge label={badge.label} palette={badge.palette} />
        </div>
        <div className="mt-1 truncate text-[12.5px] text-text-secondary">
          {room.counterpartNickname} · {room.lastMessage ?? "메시지가 없습니다"}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {room.lastMessageAt && (
          <div className="text-[11px] text-text-tertiary">
            {formatRelativeTime(room.lastMessageAt)}
          </div>
        )}
        {room.unreadCount > 0 && (
          <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-badge-danger-fg px-1 text-[10px] font-bold text-white">
            {room.unreadCount > 99 ? "99+" : room.unreadCount}
          </span>
        )}
      </div>
    </Link>
  );
}
