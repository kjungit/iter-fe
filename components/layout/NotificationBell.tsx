"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { formatDisplayDate } from "@/lib/format";
import {
  NOTIFICATION_TEMPLATES,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { useNotificationStream } from "@/lib/hooks/useNotificationStream";

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useNotificationStream(true);

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => fetchNotifications({ size: 10 }),
    enabled: open,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (id: string, rentalId: string | null) => {
    readMutation.mutate(id);
    setOpen(false);
    if (rentalId) router.push(`/rentals/${rentalId}`);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
        aria-label="알림"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {!!unreadCount && unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-badge-danger-fg px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="shadow-popover absolute top-[calc(100%+8px)] right-0 z-30 w-[320px] rounded-lg border border-border bg-white p-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[12.5px] font-bold text-ink">알림</span>
            <button
              type="button"
              className="text-[11.5px] font-semibold text-text-secondary"
              onClick={() => readAllMutation.mutate()}
            >
              모두 읽음
            </button>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications?.content.length === 0 && (
              <p className="py-8 text-center text-[12px] text-text-secondary">알림이 없습니다.</p>
            )}
            {notifications?.content.map((notification) => {
              const { title, message } = NOTIFICATION_TEMPLATES[notification.type](notification.params);
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleItemClick(notification.id, notification.rentalId)}
                  className={cn(
                    "w-full rounded-sm px-2.5 py-2.5 text-left",
                    notification.read ? "bg-white" : "bg-surface-alt",
                  )}
                >
                  <div className="text-[12.5px] font-bold text-ink">{title}</div>
                  <div className="mt-0.5 text-[12px] text-text-secondary">{message}</div>
                  <div className="mt-1 text-[11px] text-text-tertiary">
                    {formatDisplayDate(notification.createdAt)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
