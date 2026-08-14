import { describe, expect, it } from "vitest";
import {
  isOverdue,
  overdueDays,
  rentalTimelineStage,
  timelineConnectorState,
  timelineDotState,
} from "@/lib/status";
import type { Rental } from "@/lib/types";

function rental(status: Rental["status"], endDate: string): Pick<Rental, "status" | "endDate"> {
  return { status, endDate };
}

describe("rentalTimelineStage", () => {
  it("maps each status to the correct reached stage", () => {
    expect(rentalTimelineStage("PENDING")).toBe(0);
    expect(rentalTimelineStage("PAID")).toBe(1);
    expect(rentalTimelineStage("SHIPPING")).toBe(2);
    expect(rentalTimelineStage("RENTING")).toBe(3);
    expect(rentalTimelineStage("RETURN_UPLOAD")).toBe(3);
    expect(rentalTimelineStage("RETURN_REQUESTED")).toBe(4);
    expect(rentalTimelineStage("COMPLETED")).toBe(5);
    expect(rentalTimelineStage("REJECTED")).toBe(-1);
  });
});

describe("timelineDotState / timelineConnectorState", () => {
  it("marks steps up to the current stage as reached", () => {
    expect(timelineDotState("SHIPPING", 0)).toBe("reached");
    expect(timelineDotState("SHIPPING", 2)).toBe("reached");
    expect(timelineDotState("SHIPPING", 3)).toBe("unreached");
  });

  it("marks every step unreached for REJECTED", () => {
    for (let i = 0; i < 6; i++) {
      expect(timelineDotState("REJECTED", i)).toBe("unreached");
    }
  });

  it("makes the first connector transparent regardless of status", () => {
    expect(timelineConnectorState("PENDING", 0)).toBe("transparent");
    expect(timelineConnectorState("REJECTED", 0)).toBe("transparent");
  });
});

describe("isOverdue / overdueDays", () => {
  const today = new Date(2026, 7, 14); // 2026-08-14

  it("is never overdue for terminal or pending statuses", () => {
    expect(isOverdue(rental("COMPLETED", "2026-08-01"), today)).toBe(false);
    expect(isOverdue(rental("REJECTED", "2026-08-01"), today)).toBe(false);
    expect(isOverdue(rental("PENDING", "2026-08-01"), today)).toBe(false);
  });

  it("is overdue once the end date has passed for active statuses", () => {
    expect(isOverdue(rental("RENTING", "2026-08-10"), today)).toBe(true);
    expect(overdueDays(rental("RENTING", "2026-08-10"), today)).toBe(4);
  });

  it("is not overdue when the end date is today or in the future", () => {
    expect(isOverdue(rental("RENTING", "2026-08-14"), today)).toBe(false);
    expect(isOverdue(rental("RENTING", "2026-08-20"), today)).toBe(false);
    expect(overdueDays(rental("RENTING", "2026-08-20"), today)).toBe(0);
  });
});
