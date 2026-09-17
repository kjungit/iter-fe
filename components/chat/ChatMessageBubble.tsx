import { cn } from "@/lib/cn";
import { formatChatTime } from "@/lib/format";
import type { ChatMessage } from "@/lib/api/chat";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export function ChatMessageBubble({ message, isOwn }: ChatMessageBubbleProps) {
  if (message.type === "SYSTEM") {
    return (
      <div className="my-2 text-center text-[12px] text-text-tertiary">{message.content}</div>
    );
  }

  return (
    <div className={cn("mt-2 flex flex-col", isOwn ? "items-end" : "items-start")}>
      {!isOwn && (
        <span className="mb-1 text-[11px] text-text-tertiary">{message.senderNickname}</span>
      )}
      <div
        className={cn(
          "max-w-[60%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-[1.5]",
          isOwn ? "rounded-tr-sm bg-ink-strong text-white" : "rounded-tl-sm bg-surface text-ink",
        )}
      >
        {message.content}
      </div>
      <div className="mt-1 flex items-center gap-1 text-[10.5px] text-text-tertiary">
        <span>{formatChatTime(message.sentAt)}</span>
        {message.masked && <span>· 일부 정보가 가려졌어요</span>}
      </div>
    </div>
  );
}
