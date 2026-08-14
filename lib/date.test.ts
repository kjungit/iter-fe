import { describe, expect, it } from "vitest";
import { applyCalendarRangeClick } from "@/lib/date";

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
