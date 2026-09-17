import { ChatRoomView } from "@/components/mypage/ChatRoomView";

export default async function ChatRoomPage(props: PageProps<"/mypage/messages/[roomId]">) {
  const { roomId } = await props.params;
  return <ChatRoomView roomId={roomId} />;
}
