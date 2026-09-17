import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";
import type { InfiniteData, QueryFunctionContext } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ChatRoomView } from "./ChatRoomView";
import { fetchChatMessages } from "@/lib/api/chat";
import type { ChatMessage, ChatMessagePage, ChatRoomSummary } from "@/lib/api/chat";

// 정적 렌더링 검증 — DOM 클릭/polling/소켓 재연결은 다루지 않는다(brower 수동 확인 대상).
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useInfiniteQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
}));

vi.mock("@/lib/api/chat", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/chat")>()),
  fetchChatMessages: vi.fn(),
}));

vi.mock("@/lib/auth/use-require-auth", () => ({
  useRequireAuth: () => ({
    id: "user-1",
    name: "테스트",
    nickname: "테스트",
    email: "t@test.com",
    phone: "",
    role: "USER",
    avatarInitials: "TE",
    defaultAddress: null,
  }),
}));

type ChatSocketOptions = { onMessage?: (message: ChatMessage) => void; onError?: (code: string) => void };
let chatSocketOptions: ChatSocketOptions | undefined;
vi.mock("@/lib/hooks/useChatSocket", () => ({
  useChatSocket: vi.fn((_roomId: string | null, options: ChatSocketOptions) => {
    chatSocketOptions = options;
    return { send: vi.fn() };
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(() => {
  vi.clearAllMocks();
  chatSocketOptions = undefined;
});

const room: ChatRoomSummary = {
  roomId: "42",
  equipmentId: "7",
  equipmentName: "카메라",
  stage: "INQUIRY",
  counterpartId: "user-2",
  counterpartNickname: "상대방",
  lastMessage: "안녕하세요",
  lastMessageAt: "2026-09-17T10:00:00",
  unreadCount: 1,
};

function renderRoom(): QueryClient {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(["chat", "rooms"], [room]);
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ChatRoomView roomId="42" />
    </QueryClientProvider>,
  );
  return client;
}

it("useInfiniteQuery에 cursor를 그대로 넘기고 nextCursor로 다음 페이지 여부를 판단한다", async () => {
  vi.mocked(fetchChatMessages).mockResolvedValue({ messages: [], nextCursor: null });
  const client = renderRoom();
  try {
    const options = vi.mocked(useInfiniteQuery).mock.calls[0][0];
    const queryFn = options.queryFn;
    if (typeof queryFn !== "function") throw new Error("queryFn 누락");
    await queryFn({ pageParam: "cursor-5" } as QueryFunctionContext<readonly unknown[], string>);
    expect(fetchChatMessages).toHaveBeenCalledWith("42", { cursor: "cursor-5", size: 30 });
    expect(options.getNextPageParam!({ messages: [], nextCursor: "next-1" } as ChatMessagePage, [], undefined, [])).toBe("next-1");
    expect(
      options.getNextPageParam!({ messages: [], nextCursor: null } as ChatMessagePage, [], undefined, []),
    ).toBeUndefined();
  } finally {
    client.clear();
  }
});

it("소켓으로 들어온 메시지를 최신 페이지 앞에 붙이고 같은 id는 중복 추가하지 않는다", () => {
  const client = renderRoom();
  try {
    const key = ["chat", "messages", "42"];
    const initial: InfiniteData<ChatMessagePage> = {
      pages: [
        {
          messages: [
            {
              id: "2",
              roomId: "42",
              senderId: "user-2",
              senderNickname: "상대방",
              type: "USER",
              content: "안녕",
              masked: false,
              sentAt: "2026-09-17T09:59:00",
            },
          ],
          nextCursor: null,
        },
      ],
      pageParams: [undefined],
    };
    client.setQueryData(key, initial);

    expect(chatSocketOptions?.onMessage).toBeTypeOf("function");
    const incoming: ChatMessage = {
      id: "3",
      roomId: "42",
      senderId: "user-1",
      senderNickname: "테스트",
      type: "USER",
      content: "반갑습니다",
      masked: false,
      sentAt: "2026-09-17T10:00:00",
    };
    chatSocketOptions!.onMessage!(incoming);
    chatSocketOptions!.onMessage!(incoming); // 중복 브로드캐스트

    const updated = client.getQueryData<InfiniteData<ChatMessagePage>>(key);
    expect(updated?.pages[0].messages.map((message) => message.id)).toEqual(["3", "2"]);
  } finally {
    client.clear();
  }
});

it("MUTED 에러 프레임을 받아도 예외 없이 처리한다", () => {
  const client = renderRoom();
  try {
    expect(chatSocketOptions?.onError).toBeTypeOf("function");
    expect(() => chatSocketOptions!.onError!("MUTED")).not.toThrow();
  } finally {
    client.clear();
  }
});
