import { ChatRoomListView } from "@/components/chat/ChatRoomListView";

export default function ChatLayout({ children }: LayoutProps<"/chat">) {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <aside className="w-[320px] shrink-0 border-r border-border bg-bg">
        <ChatRoomListView />
      </aside>
      <section className="min-w-0 flex-1 bg-surface-alt">{children}</section>
    </div>
  );
}
