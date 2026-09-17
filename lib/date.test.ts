import { describe, expect, it } from "vitest";
import { applyCalendarRangeClick, parseISODateTime } from "@/lib/date";

describe("applyCalendarRangeClick", () => {
  it("starts a fresh range when nothing is selected yet", () => {
    expect(applyCalendarRangeClick({ start: null, end: null }, "2026-08-10")).toEqual({
      start: "2026-08-10",
      end: "2026-08-10",
    });
  });

  it("resets the range when start and end are already the same day", () => {
    expect(
      applyCalendarRangeClick({ start: "2026-08-10", end: "2026-08-10" }, "2026-08-15"),
    ).toEqual({ start: "2026-08-15", end: "2026-08-15" });
  });

  it("resets the range when the clicked date is before the current start", () => {
    expect(
      applyCalendarRangeClick({ start: "2026-08-10", end: "2026-08-15" }, "2026-08-05"),
    ).toEqual({ start: "2026-08-05", end: "2026-08-05" });
  });

  it("only extends the end date otherwise", () => {
    expect(
      applyCalendarRangeClick({ start: "2026-08-10", end: "2026-08-15" }, "2026-08-20"),
    ).toEqual({ start: "2026-08-10", end: "2026-08-20" });
  });
});

describe("parseISODateTime", () => {
  it("parses the time along with the date, unlike parseISODate", () => {
    const date = parseISODateTime("2026-09-17T13:05:42");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(17);
    expect(date.getHours()).toBe(13);
    expect(date.getMinutes()).toBe(5);
    expect(date.getSeconds()).toBe(42);
  });

  it("safely drops a microsecond fraction on seconds", () => {
    const date = parseISODateTime("2026-09-17T13:05:42.955093");
    expect(date.getSeconds()).toBe(42);
    expect(Number.isNaN(date.getTime())).toBe(false);
  });

  it("defaults to midnight when no time component is present", () => {
    const date = parseISODateTime("2026-09-17");
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });
});
