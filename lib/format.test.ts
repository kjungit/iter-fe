import { afterEach, describe, expect, it, vi } from "vitest";
import { formatChatTime, formatRelativeTime } from "@/lib/format";

afterEach(() => vi.useRealTimers());

describe("formatChatTime", () => {
  it("formats as zero-padded HH:mm", () => {
    expect(formatChatTime("2026-09-17T09:05:00")).toBe("09:05");
    expect(formatChatTime("2026-09-17T23:45:00.123456")).toBe("23:45");
  });
});

// BE의 LocalDateTime 문자열(타임존 오프셋 없음)을 흉내낸 헬퍼 — Date#toISOString()은 UTC로
// 변환해버려 로컬 타임존에 따라 테스트가 흔들리므로 쓰지 않는다.
function localIso(y: number, m: number, d: number, h: number, mi: number, s = 0): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}`;
}

describe("formatRelativeTime", () => {
  it("반올림/경계값을 방금·N분 전·N시간 전·날짜로 구분한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 17, 12, 0, 0));

    expect(formatRelativeTime(localIso(2026, 9, 17, 12, 0))).toBe("방금");
    expect(formatRelativeTime(localIso(2026, 9, 17, 11, 59))).toBe("1분 전");
    expect(formatRelativeTime(localIso(2026, 9, 17, 11, 1))).toBe("59분 전");
    expect(formatRelativeTime(localIso(2026, 9, 17, 11, 0))).toBe("1시간 전");
    expect(formatRelativeTime(localIso(2026, 9, 16, 13, 0))).toBe("23시간 전");
    expect(formatRelativeTime(localIso(2026, 9, 16, 11, 0))).toBe("2026.09.16");
  });
});
