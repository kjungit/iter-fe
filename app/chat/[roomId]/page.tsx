import { ChatRoomView } from "@/components/chat/ChatRoomView";

export default async function ChatRoomPage(props: PageProps<"/chat/[roomId]">) {
  const { roomId } = await props.params;
  return <ChatRoomView roomId={roomId} />;
}
