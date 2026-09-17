import { describe, expect, it } from "vitest";
import { canSendChatMessage, isSendKeyPress } from "./ChatComposer";

describe("isSendKeyPress", () => {
  it("Enter만 누르면 전송, Shift+Enter는 줄바꿈으로 취급해 전송하지 않는다", () => {
    expect(isSendKeyPress({ key: "Enter", shiftKey: false })).toBe(true);
    expect(isSendKeyPress({ key: "Enter", shiftKey: true })).toBe(false);
    expect(isSendKeyPress({ key: "a", shiftKey: false })).toBe(false);
  });
});

describe("canSendChatMessage", () => {
  it("공백만 있거나 비활성 상태면 전송할 수 없다", () => {
    expect(canSendChatMessage("안녕하세요", false)).toBe(true);
    expect(canSendChatMessage("   ", false)).toBe(false);
    expect(canSendChatMessage("", false)).toBe(false);
    expect(canSendChatMessage("안녕하세요", true)).toBe(false);
  });
});
