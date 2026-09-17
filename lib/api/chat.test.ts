import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/client";
import { chatFetch, createChatRoom, startEquipmentInquiry, toChatMessage } from "./chat";

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
  parseErrorResponse: vi.fn(async (response: Response) => new Error(`http ${response.status}`)),
}));

const apiFetchMock = vi.mocked(apiFetch);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("toChatMessage", () => {
  it("id를 문자열로 바꾸고 SYSTEM 메시지의 null senderId를 유지한다", () => {
    const message = toChatMessage({
      id: 10,
      roomId: 3,
      senderId: null,
      senderNickname: null,
      type: "SYSTEM",
      content: "결제가 완료되어 거래 채팅으로 전환되었습니다.",
      masked: false,
      sentAt: "2026-09-17T10:00:00.000000",
    });
    expect(message).toEqual({
      id: "10",
      roomId: "3",
      senderId: null,
      senderNickname: null,
      type: "SYSTEM",
      content: "결제가 완료되어 거래 채팅으로 전환되었습니다.",
      masked: false,
      sentAt: "2026-09-17T10:00:00.000000",
    });
  });
});

describe("startEquipmentInquiry", () => {
  it("문의 그랜트를 먼저 발급받고 그 토큰으로 방을 생성한다", async () => {
    apiFetchMock.mockImplementation(async (path: string) => {
      if (path === "/api/v1/chat/inquiry-grants") return { grantToken: "grant-1" };
      if (path === "/api/v1/chat/tickets") return { ticket: "ticket-1" };
      throw new Error(`unexpected apiFetch path: ${path}`);
    });
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({ roomId: 42 }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const roomId = await startEquipmentInquiry("7");

    expect(roomId).toBe("42");
    expect(apiFetchMock).toHaveBeenCalledWith("/api/v1/chat/inquiry-grants", {
      method: "POST",
      body: { equipmentId: 7 },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init!.body as string)).toEqual({ grantToken: "grant-1" });
  });
});

describe("createChatRoom", () => {
  it("이미 있는 방이면 새로 만들지 않고 그 방을 그대로 반환한다(같은 grantToken → 같은 roomId)", async () => {
    apiFetchMock.mockResolvedValue({ ticket: "ticket-1" });
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ roomId: 5 }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createChatRoom("grant-2")).resolves.toBe("5");
  });
});

describe("chatFetch", () => {
  it("티켓 만료(401)를 한 번만 재시도하고 그래도 실패하면 그대로 던진다", async () => {
    apiFetchMock.mockResolvedValue({ ticket: "ticket-1" });
    const fetchMock = vi.fn(async () => new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(chatFetch("/api/v1/chat/rooms")).rejects.toThrow("http 401");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("204 응답은 undefined를 반환한다", async () => {
    apiFetchMock.mockResolvedValue({ ticket: "ticket-1" });
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(chatFetch("/api/v1/chat/rooms/1/read", { method: "POST" })).resolves.toBeUndefined();
  });
});
